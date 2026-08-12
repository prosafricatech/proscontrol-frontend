'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Autocomplete,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, CheckOutlined, DisabledByDefaultOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { useProjectProfile } from '@/components/projectManagement/projects/profile/ProjectProfileProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import projectsServices from '@/components/projectManagement/projects/project-services';
import debounce from 'lodash/debounce';

interface Deliverable {
  id: number;
  description: string;
  currency_id: number;
  contract_rate: number;
  unit_symbol?: string;
  group_name?: string;
  top_group_name?: string;
  code: string;
  measurement_unit?: {
    symbol: string;
  };
}

interface ProjectDeliverableGroup {
  id?: number;
  name?: string;
  code?: string;
  deliverables?: Deliverable[];
  children?: ProjectDeliverableGroup[];
}

interface ClaimedDeliverableItem {
  id?: number | string;
  project_deliverable_id?: number;
  project_deliverable?: Deliverable;
  revenue_ledger?: { id: number; name: string };
  revenue_ledger_id?: number;
  rate?: number;
  certified_quantity?: number | string;
  remarks?: string;
  unit_symbol?: string;
  measurement_unit?: {
    symbol: string;
  };
  response_uncertified_quantity?: number;
}

interface ClaimedDeliverablesItemFormProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: (value: boolean) => void;
  setIsDirty: (value: boolean) => void;
  index?: number;
  setShowForm?: (value: boolean) => void;
  deliverableItem?: ClaimedDeliverableItem;
  deliverableItems: ClaimedDeliverableItem[];
  claimDate: string;
  setDeliverablesItems: React.Dispatch<React.SetStateAction<ClaimedDeliverableItem[]>>;
  selectedCurrencyId?: number;
  selectedCurrencySymbol?: string; // Add this prop for currency symbol
}

interface FormValues {
  project_deliverable_id?: number;
  revenue_ledger_id?: number;
  certified_quantity?: number | string;
  rate?: number;
  remarks?: string;
  response_uncertified_quantity?: number;
  amount?: number; // Add amount field
}

const validationSchema = yup.object({
  project_deliverable_id: yup
    .number()
    .required('Deliverable is required')
    .typeError('Deliverable is required'),

  revenue_ledger_id: yup
    .number()
    .required('Revenue Ledger is required')
    .typeError('Revenue Ledger is required'),

  certified_quantity: yup
    .number()
    .required('Quantity is required')
    .positive('Quantity must be positive')
    .typeError('Valid quantity is required'),
});

const ClaimedDeliverablesItemForm: React.FC<ClaimedDeliverablesItemFormProps> = ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  index = -1,
  setShowForm,
  deliverableItem,
  deliverableItems = [],
  claimDate,
  setDeliverablesItems,
  selectedCurrencyId,
  selectedCurrencySymbol = '', // Default currency symbol
}) => {
  const { deliverable_groups }: { deliverable_groups: ProjectDeliverableGroup[] } = useProjectProfile() as any;
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const [isAdding, setIsAdding] = useState(false);
  const [isRetrievingDetails, setIsRetrievingDetails] = useState(false);
  const [unitToDisplay, setUnitToDisplay] = useState<string | undefined>(
    deliverableItem?.unit_symbol || deliverableItem?.measurement_unit?.symbol
  );
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredDeliverables, setFilteredDeliverables] = useState<Deliverable[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields },
    reset,
    trigger,
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    context: { deliverableItems, index },
    defaultValues: {
      project_deliverable_id: deliverableItem?.project_deliverable_id || deliverableItem?.project_deliverable?.id,
      revenue_ledger_id: deliverableItem?.revenue_ledger_id || deliverableItem?.revenue_ledger?.id,
      certified_quantity: deliverableItem?.certified_quantity || '',
      rate: deliverableItem?.rate ? deliverableItem?.rate : deliverableItem?.project_deliverable?.contract_rate,
      remarks: deliverableItem?.remarks || '',
      response_uncertified_quantity: deliverableItem?.response_uncertified_quantity,
      amount: (deliverableItem?.rate || 0) * (Number(deliverableItem?.certified_quantity) || 0) || 0,
    },
  });

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty]);

  useEffect(() => {
    if (submitItemForm) {
      trigger().then((valid) => {
        if (valid) {
          handleSubmit(updateItems)();
        }
        setSubmitItemForm(false);
      });
    }
  }, [submitItemForm, trigger, handleSubmit, setSubmitItemForm]);

  // Get all deliverables from the nested structure with top-level group name tracking
  const getAllDeliverables = useCallback((
    groups: ProjectDeliverableGroup[] = [],
    topGroupName: string = ''
  ): Deliverable[] => {
    if (!Array.isArray(groups)) return [];

    return groups.flatMap((group) => {
      const currentTopGroupName = topGroupName || group.name || '';

      const deliverableOptions = (group.deliverables || []).map((del) => ({
        id: del.id,
        description: del.description,
        code: del.code,
        group_name: group.name || '',
        top_group_name: currentTopGroupName,
        currency_id: del.currency_id,
        contract_rate: del.contract_rate,
        unit_symbol: del.measurement_unit?.symbol,
        measurement_unit: del.measurement_unit,
      }));

      const childrenOptions = getAllDeliverables(group.children || [], currentTopGroupName);

      return [...deliverableOptions, ...childrenOptions];
    });
  }, []);

  const allDeliverables = useMemo(() => {
    return getAllDeliverables(deliverable_groups);
  }, [deliverable_groups, getAllDeliverables]);

  const deliverablesByCurrency = useMemo(() => {
    return allDeliverables.filter(
      (del) => Number(del.currency_id) === Number(selectedCurrencyId)
    );
  }, [allDeliverables, selectedCurrencyId]);

  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm: string) => {
        setIsSearching(true);
        try {
          const filtered = deliverablesByCurrency.filter((option) =>
            option.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.top_group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.group_name?.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setFilteredDeliverables(filtered);
        } catch (error) {
          setFilteredDeliverables([]);
        } finally {
          setIsSearching(false);
        }
      }, 300),
    [deliverablesByCurrency]
  );

  const handleSearchChange = (event: React.SyntheticEvent, value: string) => {
    setSearchInput(value);
    if (value.length >= 2) {
      debouncedSearch(value);
    } else {
      setFilteredDeliverables([]);
    }
  };

  const handleOpen = () => {
    if (filteredDeliverables.length === 0 && deliverablesByCurrency.length > 0) {
      setIsLoadingOptions(true);
      setTimeout(() => {
        setFilteredDeliverables(deliverablesByCurrency);
        setIsLoadingOptions(false);
      }, 100);
    }
  };

  const updateItems = async (formData: FormValues) => {
    setIsAdding(true);

    const selectedDeliverable = allDeliverables.find((d) => d.id === formData.project_deliverable_id);

    const itemToAdd = {
      ...formData,
      project_deliverable: selectedDeliverable,
    };

    if (index > -1) {
      const updated = [...deliverableItems];
      updated[index] = { ...updated[index], ...itemToAdd };
      setDeliverablesItems(updated);
    } else {
      setDeliverablesItems((prev) => [...prev, itemToAdd]);
      if (submitItemForm) submitMainForm();
    }

    reset();
    setClearFormKey((prev) => prev + 1);
    setIsAdding(false);
    setShowForm?.(false);
  };

  const retrieveTaskDetails = async (delId?: number) => {
    if (!delId) return;
    setIsRetrievingDetails(true);
    try {
      const details = await projectsServices.showDelUncertifiedQTY(delId, claimDate);
      const existingQuantity = deliverableItem?.certified_quantity || 0;
      setValue('response_uncertified_quantity', 
        Number(existingQuantity) + (details?.uncertified_quantity ?? 0)
      );
    } catch (error) {
      console.error('Failed to retrieve uncertified quantity', error);
    } finally {
      setIsRetrievingDetails(false);
    }
  };

  useEffect(() => {
    const delId = deliverableItem?.project_deliverable_id || deliverableItem?.project_deliverable?.id;
    if (delId) {
      retrieveTaskDetails(delId);
    }
  }, [deliverableItem]);

  const watchedDeliverableId = watch('project_deliverable_id');
  const watchedRate = watch('rate') || 0;
  const watchedQuantity = watch('certified_quantity') || 0;
  
  const selectedDeliverable = allDeliverables.find(
    (d) => d.id === watchedDeliverableId
  );

  // Calculate amount: rate * quantity
  const calculatedAmount = useMemo(() => {
    const rate = Number(watchedRate) || 0;
    const quantity = Number(watchedQuantity) || 0;
    return rate * quantity;
  }, [watchedRate, watchedQuantity]);

  // Update amount when rate or quantity changes
  useEffect(() => {
    setValue('amount', calculatedAmount, {
      shouldDirty: true,
    });
  }, [calculatedAmount, setValue]);

  if (isAdding) return <LinearProgress />;

  return (
    <Grid container spacing={1} mt={0.5}>
      {/* Deliverable Selection */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Autocomplete<Deliverable>
          options={filteredDeliverables.length > 0 || searchInput.length >= 2 ? filteredDeliverables : []}
          getOptionLabel={(option) => {
            const topGroupPart = option.top_group_name ? ` [${option.top_group_name}]` : '';
            const codePart = option.code ? `${option.code} - ` : '';
            return `${codePart}${option.description}${topGroupPart}`;
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          value={selectedDeliverable || null}
          loading={isLoadingOptions || isSearching}
          loadingText="Loading..."
          noOptionsText={
            searchInput.length >= 2 
              ? 'No deliverables found' 
              : 'Type at least 2 characters to search'
          }
          onOpen={handleOpen}
          onInputChange={handleSearchChange}
          onChange={(_, newValue) => {
            if (newValue) {
              setUnitToDisplay(newValue.unit_symbol);
              setValue('rate', newValue.contract_rate);
              setValue('project_deliverable_id', newValue.id, {
                shouldDirty: true,
                shouldValidate: true,
              });
              retrieveTaskDetails(newValue.id);
            } else {
              setUnitToDisplay(undefined);
              setValue('rate', undefined);
              setValue('project_deliverable_id', undefined, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
            setSearchInput('');
            setFilteredDeliverables([]);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Deliverable"
              size="small"
              fullWidth
              error={!!errors.project_deliverable_id}
              helperText={errors.project_deliverable_id?.message}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {(isLoadingOptions || isSearching) && <CircularProgress size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          ListboxProps={{
            style: {
              maxHeight: 400,
            },
          }}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <li key={option.id} {...optionProps}>
                <div>
                  <Typography variant="body2">
                    {option.code ? `${option.code} - ` : ''}{option.description}
                  </Typography>
                  {option.top_group_name && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {option.top_group_name}
                      {option.group_name && option.group_name !== option.top_group_name && (
                        <> → {option.group_name}</>
                      )}
                    </Typography>
                  )}
                </div>
              </li>
            );
          }}
        />
      </Grid>

      {/* Revenue Ledger */}
      <Grid size={{ xs: 12, md: 3.5 }}>
        <LedgerSelect
          multiple={false}
          label="Revenue Ledger"
          defaultValue={ungroupedLedgerOptions?.find((l) => l.id === watch('revenue_ledger_id'))}
          allowedGroups={['Revenue', 'Accounts Receivable']}
          frontError={errors.revenue_ledger_id}
          onChange={(newValue: any) => {
            setValue('revenue_ledger_id', newValue?.id || undefined, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        />
      </Grid>

      {/* Certified Quantity with Unit Symbol */}
      <Grid size={{ xs: 12, md: 1.5 }}>
        {isRetrievingDetails ? (
          <LinearProgress />
        ) : (
          <TextField
            label="Certified Quantity"
            fullWidth
            size="small"
            value={watch('certified_quantity') ?? ''}
            InputProps={{
              inputComponent: CommaSeparatedField as any,
              endAdornment: unitToDisplay ? (
                <InputAdornment position="end">
                  <Typography variant="caption" color="text.secondary">
                    {unitToDisplay}
                  </Typography>
                </InputAdornment>
              ) : null,
            }}
            error={!!errors.certified_quantity}
            helperText={errors.certified_quantity?.message}
            onChange={(e) => {
              const num = e.target.value ? sanitizedNumber(e.target.value) : '';
              setValue('certified_quantity', num, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          />
        )}
      </Grid>

      {/* Rate */}
      <Grid size={{ xs: 12, md: 1.5 }}>
        <TextField
          label="Rate"
          fullWidth
          size="small"
          value={watch('rate') ?? ''}
          InputProps={{
            inputComponent: CommaSeparatedField as any,
          }}
          onChange={(e) => {
            const num = e.target.value ? sanitizedNumber(e.target.value) : '';
            setValue('rate', num as any, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        />
      </Grid>

      {/* Amount - Read-only field showing total */}
      <Grid size={{ xs: 12, md: 1.5 }}>
        <TextField
          label="Amount"
          fullWidth
          size="small"
          value={calculatedAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          InputProps={{
            readOnly: true,
            startAdornment: (
              <InputAdornment position="start">
                <Typography variant="caption" color="text.secondary">
                  {selectedCurrencySymbol}
                </Typography>
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      {/* Remarks */}
      <Grid size={{ xs: 12, md: 12 }}>
        <TextField
          size="small"
          fullWidth
          multiline
          rows={2}
          label="Remarks"
          value={watch('remarks') ?? ''}
          onChange={(e) =>
            setValue('remarks', e.target.value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      </Grid>

      {/* Action Buttons */}
      <Grid size={{ xs: 12 }} textAlign="end">
        <Button
          variant="contained"
          size="small"
          disabled={isAdding}
          onClick={handleSubmit(updateItems)}
          startIcon={isAdding ? <CircularProgress size={16} color="inherit" /> : deliverableItem ? <CheckOutlined /> : <AddOutlined />}
          sx={{ mb: 0.5 }}
        >
          {deliverableItem ? 'Done' : 'Add'}
        </Button>

        {deliverableItem && setShowForm && (
          <Tooltip title="Cancel Edit">
            <IconButton size="small" onClick={() => setShowForm(false)}>
              <DisabledByDefaultOutlined fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        )}
      </Grid>
    </Grid>
  );
};

export default ClaimedDeliverablesItemForm;