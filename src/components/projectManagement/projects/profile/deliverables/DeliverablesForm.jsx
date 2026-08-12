import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import measurementUnitServices from '@/components/masters/measurementUnits/measurement-unit-services';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import MeasurementUnitForm from '@/components/masters/measurementUnits/MeasurementUnitForm';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import projectsServices from '../../project-services';
import { useProjectProfile } from '../ProjectProfileProvider';

const DeliverablesForm = ({
  setOpenDialog,
  group = null,
  deliverable = null,
}) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { project, deliverable_groups } = useProjectProfile();
  const hasClient = !!project?.client_id;

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { data: measurementUnits, isLoading } = useQuery({
    queryKey: ['measurementUnitsOptions'],
    queryFn: () => measurementUnitServices.getAllMeasurementUnits(),
  });

  const [measurementUnitFormOpen, setMeasurementUnitFormOpen] = useState(false);

  const [newUnit, setNewUnit] = useState(undefined);
  const [selectedUnit, setSelectedUnit] = useState(() =>
    deliverable?.id
      ? measurementUnits?.find(
          (unit) => unit.id === deliverable?.measurement_unit_id
        )
      : null
  );

  const { mutate: addDeliverables, isPending } = useMutation({
    mutationFn: projectsServices.addDeliverables,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectDeliverableGroups'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
    },
  });

  const { mutate: updateDeliverables, isPending: updateIsLoading } =
    useMutation({
      mutationFn: projectsServices.updateDeliverables,
      onSuccess: async (data) => {
        await setOpenDialog(false);
        enqueueSnackbar(data.message, { variant: 'success' });
        queryClient.invalidateQueries({
          queryKey: ['projectDeliverableGroups'],
        });
      },
      onError: (error) => {
        enqueueSnackbar(getErrorMessage(error), {
          variant: 'error',
        });
      },
    });

  const saveMutation = React.useMemo(() => {
    return deliverable ? updateDeliverables : addDeliverables;
  }, [addDeliverables, updateDeliverables, deliverable]);

  const toOptions = (groups, depth = 0) => {
    if (!Array.isArray(groups)) {
      return [];
    }

    return groups.flatMap((group) => {
      const { children, deliverables } = group;

      const deliverableOptions = (deliverables || []).map((deliverable) => ({
        description: `After: ${deliverable.description}`,
        id: deliverable.id,
        position_index: deliverable.position_index,
        weighted_percentage: deliverable.weighted_percentage,
        project_deliverable_group_id: deliverable.project_deliverable_group_id,
      }));

      const groupChildren = toOptions(children, depth + 1);

      return [...deliverableOptions, ...groupChildren];
    });
  };

  const deliverables = toOptions(deliverable_groups);

  const sameLevelDeliverables = deliverables.filter(
    (delgroup) =>
      delgroup.project_deliverable_group_id ===
      (group
        ? group.id
        : deliverable
          ? deliverable?.project_deliverable_group_id
          : null)
  );

  const positionIndexOptions = [
    { description: 'At the beginning', position_index: null, id: null },
    ...sameLevelDeliverables,
  ];

const validationSchema = yup.object({
    description: yup
      .string()
      .required('Description is required')
      .typeError('Description is required'),
    measurement_unit_id: yup
      .number()
      .required('Measurement Unit is required')
      .typeError('Measurement Unit is required'),
    quantity: yup
      .number()
      .required('Quantity is required')
      .typeError('Quantity is required'),
    weighted_percentage: yup
      .number()
      .nullable()
      .notRequired()
      .test("greater-than-zero", "Weight Percentage must be greater than 0", function (value) {
        // If value is null, undefined, or empty string, it's valid (optional field)
        if (value === null || value === undefined || value === '') {
          return true;
        }
        
        // Check if value is a valid number
        if (isNaN(value)) {
          return this.createError({
            message: "Weight Percentage must be a valid number"
          });
        }
        
        // Reject 0 and negative numbers
        if (value <= 0) {
          return this.createError({
            message: "Weight Percentage must be greater than 0"
          });
        }
        
        return true;
      })
      .max(100, 'Weight Percentage must be less than or equal to 100')
      .test('check-total', function (value) {
        const context = this.options.context || {};
        const { sameLevelDeliverables, deliverable } = context;

        if (!sameLevelDeliverables) return true;

        const totalWeightPercentages = sameLevelDeliverables.reduce(
          (total, del) =>
            total +
            (deliverable && del.position_index === deliverable.position_index
              ? 0
              : del.weighted_percentage || 0),
          0
        );

        // If value is null/undefined, skip this check
        if (value === null || value === undefined || value === '') {
          return true;
        }

        // Check if total exceeds 100
        if (totalWeightPercentages + value > 100) {
          return this.createError({
            message: `Total percentage should not exceed 100%. You currently have ${totalWeightPercentages}% allocated.`,
          });
        }
        return true;
      }),
    contract_rate: yup.number().when('client_id', {
      is: (client_id) => !!client_id,
      then: (schema) =>
        schema
          .required('Contract rate is required when client is selected')
          .typeError('Contract rate must be a number'),
      otherwise: (schema) => schema.notRequired().nullable(true),
    }),
  });

  const {
    register,
    setValue,
    watch,
    clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: deliverable?.id,
      name: deliverable?.name,
      description: deliverable?.description,
      measurement_unit_id: deliverable?.measurement_unit_id,
      quantity: deliverable?.quantity,
      contract_rate: deliverable?.contract_rate,
      amount:
        deliverable?.amount ??
        (Number(deliverable?.quantity) || 0) *
          (Number(deliverable?.contract_rate) || 0),
      currency_id: deliverable ? deliverable?.currency_id : 1,
      exchange_rate: deliverable ? deliverable?.exchange_rate : 1,
      weighted_percentage: deliverable?.weighted_percentage,
      project_deliverable_group_id: deliverable
        ? deliverable.project_deliverable_group_id
        : group?.id,
      position_index: deliverable?.position_index,
      client_id: project?.client_id || null,
    },
    context: { sameLevelDeliverables, deliverable },
  });

  const quantityValue = Number(watch('quantity')) || 0;
  const contractRateValue = Number(watch('contract_rate')) || 0;
  const computedAmount = quantityValue * contractRateValue;

  useEffect(() => {
    if (newUnit !== undefined) {
      setValue('measurement_unit_id', newUnit ? newUnit.id : 0, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [newUnit]);

  React.useEffect(() => {
    setValue('amount', computedAmount, {
      shouldDirty: true,
    });
  }, [computedAmount, setValue]);

  return (
    <>
      <DialogTitle textAlign={'center'}>
        {deliverable ? `Edit Deliverable` : `Add ${group?.name} Deliverable`}
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off'>
          <Grid container columnSpacing={1}>
            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  size='small'
                  fullWidth
                  multiline={true}
                  rows={2}
                  label='Description'
                  error={!!errors?.description}
                  helperText={errors?.description?.message}
                  {...register(`description`)}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  size='small'
                  defaultValue={deliverable?.code}
                  label='Code'
                  fullWidth
                  {...register('code')}
                />
              </Div>
            </Grid>
            {hasClient && (
              <>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Div sx={{ mt: 1 }}>
                    <CurrencySelector
                      frontError={errors?.currency_id}
                      defaultValue={deliverable ? deliverable.currency_id : 1}
                      onChange={(newValue) => {
                        setValue('currency_id', newValue ? newValue.id : null, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });

                        clearErrors('exchange_rate');

                        setValue(
                          'exchange_rate',
                          newValue?.exchangeRate ? newValue.exchangeRate : 1
                        );
                      }}
                    />
                  </Div>
                </Grid>
                {watch('currency_id') > 1 && (
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Div sx={{ mt: 1 }}>
                      <TextField
                        label='Exchange Rate'
                        fullWidth
                        size='small'
                        InputProps={{
                          inputComponent: CommaSeparatedField,
                        }}
                        value={watch('exchange_rate')}
                        onChange={(e) => {
                          setValue(
                            `exchange_rate`,
                            e.target.value
                              ? sanitizedNumber(e.target.value)
                              : null,
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                            }
                          );
                        }}
                      />
                    </Div>
                  </Grid>
                )}
              </>
            )}
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <MeasurementSelector
                  label='Measurement Unit'
                  frontError={errors?.measurement_unit_id}
                  value={selectedUnit ? selectedUnit : null}
                  defaultValue={deliverable?.measurement_unit_id}
                  onChange={(newValue) => {
                    newValue
                      ? setValue(`measurement_unit_id`, newValue.id, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      : setValue(`measurement_unit_id`, '', {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                    setSelectedUnit(newValue);
                  }}
                  showQuickAdd
                  onQuickAddClick={() => setMeasurementUnitFormOpen(true)}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  size='small'
                  fullWidth
                  error={!!errors?.quantity}
                  helperText={errors?.quantity?.message}
                  label='Quantity'
                  defaultValue={deliverable?.quantity}
                  onChange={(e) => {
                    setValue(
                      `quantity`,
                      e.target.value ? sanitizedNumber(e.target.value) : 0,
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                  }}
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                  }}
                />
              </Div>
            </Grid>
            {hasClient && (
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Contract Rate'
                    defaultValue={deliverable?.contract_rate}
                    error={!!errors?.contract_rate}
                    helperText={errors?.contract_rate?.message}
                    InputProps={{
                      inputComponent: CommaSeparatedField,
                    }}
                    onChange={(e) => {
                      setValue(
                        `contract_rate`,
                        e.target.value ? sanitizedNumber(e.target.value) : 0,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    }}
                  />
                </Div>
              </Grid>
            )}
            {hasClient && (
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Amount'
                    value={computedAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Div>
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  size='small'
                  fullWidth
                  defaultValue={deliverable?.weighted_percentage}
                  error={!!errors?.weighted_percentage}
                  helperText={errors?.weighted_percentage?.message}
                  label='Weighted Percentage'
                  InputProps={{
                    endAdornment: <span>%</span>,
                  }}
                  onChange={(e) => {
                    setValue(
                      'weighted_percentage',
                      e.target.value ? sanitizedNumber(e.target.value) : 0,
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <Autocomplete
                  options={
                    deliverable
                      ? positionIndexOptions.filter(
                          (group) =>
                            group.position_index !== deliverable?.position_index
                        ) // for edit deliverable
                      : positionIndexOptions
                  }
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  getOptionLabel={(option) => option.description}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Position'
                      size='small'
                      fullWidth
                    />
                  )}
                  onChange={(e, newValue) => {
                    setValue(
                      `position_index`,
                      newValue && newValue?.position_index + 1,
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                  }}
                />
              </Div>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpenDialog(false)}>
          Cancel
        </Button>
        <LoadingButton
          type='submit'
          variant='contained'
          onClick={handleSubmit((data) => saveMutation(data))}
          size='small'
          sx={{ display: 'flex' }}
          loading={isPending || updateIsLoading}
        >
          Submit
        </LoadingButton>
      </DialogActions>

      {measurementUnitFormOpen && (
        <Dialog
          maxWidth='md'
          fullScreen={belowLargeScreen}
          open={measurementUnitFormOpen}
        >
          <MeasurementUnitForm
            setOpenDialog={() => setMeasurementUnitFormOpen((prev) => !prev)}
            addNewUnit={(unit) => {
              setNewUnit(unit?.measurementUnit);
              setSelectedUnit(unit?.measurementUnit);
            }}
          />
        </Dialog>
      )}
    </>
  );
};

export default DeliverablesForm;
