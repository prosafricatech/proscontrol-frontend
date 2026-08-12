import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import StakeholderQuickAdd from '@/components/masters/stakeholders/StakeholderQuickAdd';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { MODULE_SETTINGS } from '@/utilities/constants/moduleSettings';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { AddOutlined, HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import CurrencySelector from '../../../masters/Currencies/CurrencySelector';
import StakeholderSelector from '../../../masters/stakeholders/StakeholderSelector';
import { useSalesOutlet } from '../../outlet/OutletProvider';
import proformaServices from '../proforma-services';
import { Proforma, ProformaItem } from '../ProformaType';
import ProformaItemForm from './ProformaItemForm';
import ProformaItemRow from './ProformaItemRow';

interface ProformaFormProps {
  toggleOpen: (open: boolean) => void;
  proforma?: Proforma | null;
}

interface ProformaFormValues {
  id?: number;
  proforma_date: string;
  expiry_date?: string | null;
  currency_id: number;
  exchange_rate: number;
  vat_registered: boolean;
  vat_percentage: number;
  reference?: string;
  stakeholder_id?: number;
  sales_outlet_id?: number;
  items: ProformaItem[];
  remarks?: string;
}

function ProformaForm({ toggleOpen, proforma = null }: ProformaFormProps) {
  const { authOrganization, moduleSetting } = useJumboAuth();
  const organization = authOrganization?.organization;
  const [proforma_date] = useState(
    proforma ? dayjs(proforma.proforma_date) : dayjs()
  );
  const [expiry_date] = useState(
    proforma?.expiry_date ? dayjs(proforma.expiry_date) : null
  );
  const { activeOutlet } = useSalesOutlet();
  const [totalAmount, settotalAmount] = useState(0);
  const [vatableAmount, setVatableAmount] = useState(0);
  const [items, setItems] = useState<ProformaItem[]>(proforma?.items || []);
  const [stakeholderQuickAddDisplay, setStakeholderQuickAddDisplay] =
    useState(false);
  const [addedStakeholder, setAddedStakeholder] = useState<Stakeholder | null>(
    null
  );
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { checkOrganizationPermission } = useJumboAuth();

  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);

  const validationSchema = yup.object({
    proforma_date: yup
      .string()
      .required('Proforma date is required')
      .typeError('Sales date is required'),
    stakeholder_id: yup
      .number()
      .required('Client is required')
      .typeError('Client is required'),
    currency_id: yup
      .number()
      .positive('Currency is required')
      .required('Currency is required')
      .typeError('Currency is required'),
    exchange_rate: yup
      .number()
      .positive('Exchange rate is required')
      .required('Exchange rate is required')
      .typeError('Exchange rate is required'),
    items: yup
      .array()
      .min(1, 'You must add at least one item')
      .typeError('You must add at least one item')
      .of(
        yup.object().shape({
          product_id: yup
            .number()
            .required('Product is required')
            .positive('Product is required')
            .typeError('Product is required'),
          quantity: yup
            .number()
            .required('Quantity is required')
            .positive('Quantity is required')
            .typeError('Quantity is required'),
          rate: yup
            .number()
            .required('Price is required')
            .positive('Price is required')
            .typeError('Price is required'),
        })
      ),
  });

  const {
    setValue,
    setError,
    handleSubmit,
    register,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<ProformaFormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      proforma_date: proforma_date.toISOString(),
      expiry_date: expiry_date?.toISOString() || null,
      currency_id: proforma?.currency_id ?? proforma?.currency?.id ?? 1,
      exchange_rate: proforma?.exchange_rate ?? 1,
      vat_registered: organization?.settings?.vat_registered ?? false,
      vat_percentage:
        proforma?.vat_percentage ??
        (moduleSetting(MODULE_SETTINGS.POS_DEFAULT_VAT_INCLUSIVE as any)
          ? organization?.settings?.vat_registered
            ? organization.settings.vat_percentage
            : 0
          : 0),
      reference: proforma?.reference,
      id: proforma?.id,
      stakeholder_id: proforma?.stakeholder?.id,
      sales_outlet_id: activeOutlet?.id,
      items: proforma?.items ?? [],
      remarks: proforma?.remarks || undefined,
    },
  });

  const orderTotalAmount = () => {
    let total = 0;
    let vatableTotal = 0;

    async function loopItems() {
      await setValue('items', []);
      items.forEach((item, index) => {
        total += item.rate * item.quantity;
        setValue(
          `items.${index}.product_id`,
          item?.product?.id ?? item.product_id
        );
        setValue(
          `items.${index}.description`,
          item?.description ?? item.description
        );
        if (item.product?.type) {
          setValue(`items.${index}.product_type`, item.product.type);
        }
        setValue(`items.${index}.quantity`, item.quantity);
        if (item.measurement_unit_id || item.measurement_unit?.id) {
          setValue(
            `items.${index}.measurement_unit_id`,
            item.measurement_unit_id ?? item.measurement_unit?.id
          );
        }
        setValue(`items.${index}.rate`, item.rate);
        if (item.store_id) {
          setValue(`items.${index}.store_id`, item.store_id);
        }
      });
      settotalAmount(total);
    }

    async function loopItemsForVAT() {
      items
        .filter((item) => item.product?.vat_exempted !== true)
        .forEach((item) => {
          vatableTotal += item.rate * item.quantity;
        });
      setVatableAmount(vatableTotal);
    }

    loopItems();
    loopItemsForVAT();
  };

  const vat_percentage = watch('vat_percentage') || 0;
  const vatAmount = (vatableAmount * Number(vat_percentage)) / 100;

  React.useEffect(() => {
    orderTotalAmount();
  }, [items]);

  useEffect(() => {
    if (addedStakeholder?.id) {
      setValue('stakeholder_id', addedStakeholder.id);
      setStakeholderQuickAddDisplay(false);
    }
  }, [addedStakeholder]);

  const addProformaInvoice = useMutation({
    mutationFn: proformaServices.add,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['proformaInvoices'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const updateProformaInvoice = useMutation({
    mutationFn: proformaServices.update,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['proformaInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['proformaDetails'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const saveMutation = React.useMemo(() => {
    return proforma ? updateProformaInvoice.mutate : addProformaInvoice.mutate;
  }, [proforma, updateProformaInvoice, addProformaInvoice]);

  const { data: proformaRemarks, isPending: isFetchingProformaRemarks } =
    useQuery({
      queryKey: ['proformaRemarks'],
      queryFn: proformaServices.getProformaRemarks,
    });

  if (isFetchingProformaRemarks) {
    return <LinearProgress />;
  }

  const onSubmit = (data: ProformaFormValues) => {
    if (items.length === 0) {
      setError('items', {
        type: 'manual',
        message: 'You must add at least one item',
      });
      return;
    } else if (isDirty) {
      setShowWarning(true);
    } else {
      handleSubmit((data) => saveMutation(data))();
    }
  };

  const handleConfirmSubmitWithoutAdd = () => {
    handleSubmit((data) => saveMutation(data))();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey((prev) => prev + 1);
  };

  return (
    <React.Fragment>
      <DialogTitle>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }} textAlign='center' mb={2}>
            <Div sx={{ mt: 0.3 }}>
              <Typography variant='h4'>
                {!proforma ? 'New Proforma' : `Edit ${proforma.proformaNo}`}
              </Typography>
            </Div>
          </Grid>

          <Grid container size={{ xs: 12 }} spacing={2}>
            <Grid size={{ xs: 12, md: 9 }}>
              <Div>
                <form autoComplete='off'>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Div sx={{ mt: 0.3 }}>
                        <DatePicker
                          label='Proforma Date'
                          defaultValue={proforma_date}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            },
                          }}
                          onChange={(newValue) => {
                            setValue(
                              'proforma_date',
                              newValue ? newValue.toISOString() : '',
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
                      <Div sx={{ mt: 0.3 }}>
                        <DatePicker
                          label='Expiry Date'
                          minDate={dayjs(watch('proforma_date'))}
                          defaultValue={expiry_date}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            },
                          }}
                          onChange={(newValue) => {
                            setValue(
                              'expiry_date',
                              newValue ? newValue.toISOString() : null,
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
                      <Div sx={{ mt: 0.3 }}>
                        <CurrencySelector
                          frontError={errors?.currency_id as any}
                          defaultValue={watch('currency_id')}
                          onChange={(newValue) => {
                            if (newValue) {
                              setValue('currency_id', newValue.id, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              clearErrors('exchange_rate');
                              setValue(
                                'exchange_rate',
                                newValue.exchangeRate ?? 1
                              );
                            }
                          }}
                        />
                      </Div>
                    </Grid>

                    {watch('currency_id') > 1 && (
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Div sx={{ mt: 0.3 }}>
                          <TextField
                            label='Exchange Rate'
                            fullWidth
                            size='small'
                            error={!!errors?.exchange_rate}
                            helperText={errors?.exchange_rate?.message}
                            value={watch('exchange_rate')}
                            onChange={(e) => {
                              setValue(
                                'exchange_rate',
                                e.target.value ? Number(e.target.value) : 1,
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

                    {!stakeholderQuickAddDisplay && (
                      <Grid
                        size={{
                          xs: 12,
                          md: watch(`currency_id`) > 1 ? 4 : 6,
                          lg: watch('currency_id') > 1 ? 8 : 4,
                        }}
                      >
                        <Div sx={{ mt: 0.3 }}>
                          <StakeholderSelector
                            label='Client'
                            frontError={errors?.stakeholder_id as any}
                            defaultValue={watch('stakeholder_id')}
                            addedStakeholder={addedStakeholder}
                            onChange={(newValue: any) => {
                              setValue(
                                'stakeholder_id',
                                newValue?.id ?? undefined,
                                {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                }
                              );
                            }}
                            startAdornment={
                              checkOrganizationPermission(
                                PERMISSIONS.STAKEHOLDERS_CREATE
                              ) && (
                                <Tooltip title='Add Client'>
                                  <AddOutlined
                                    onClick={() =>
                                      setStakeholderQuickAddDisplay(true)
                                    }
                                    sx={{ cursor: 'pointer' }}
                                  />
                                </Tooltip>
                              )
                            }
                          />
                        </Div>
                      </Grid>
                    )}

                    {stakeholderQuickAddDisplay && (
                      <StakeholderQuickAdd
                        setStakeholderQuickAddDisplay={
                          setStakeholderQuickAddDisplay
                        }
                        create_receivable={true}
                        setAddedStakeholder={setAddedStakeholder}
                      />
                    )}

                    <Grid
                      size={{
                        xs: 12,
                        md:
                          watch(`currency_id`) > 1
                            ? 4
                            : stakeholderQuickAddDisplay
                              ? 12
                              : 6,
                        lg:
                          watch(`currency_id`) > 1
                            ? 12
                            : stakeholderQuickAddDisplay
                              ? 12
                              : 8,
                      }}
                    >
                      <Div sx={{ mt: 0.3 }}>
                        {/* <Autocomplete
                          freeSolo
                          options={proformaRemarks || []}
                          getOptionLabel={(option) => option}
                          defaultValue={watch('remarks')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label='Remarks'
                              size='small'
                              fullWidth
                              multiline
                              rows={2}
                              error={!!errors.remarks}
                              helperText={errors.remarks?.message}
                            />
                          )}
                          onChange={(e, newValue) => {
                            setValue('remarks', newValue ?? undefined, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                        /> */}
                        <TextField
                          label='Reference'
                          variant='outlined'
                          fullWidth
                          size='small'
                          defaultValue={watch('reference')}
                          error={!!errors.reference}
                          helperText={errors.reference?.message}
                          {...register('reference')}
                        />
                      </Div>
                    </Grid>

                    <Grid
                      size={{
                        xs: 12,
                        md: 12,
                      }}
                    >
                      <Div sx={{ mt: 0.3 }}>
                        <Autocomplete
                          freeSolo
                          options={proformaRemarks || []}
                          getOptionLabel={(option) => option}
                          defaultValue={watch('remarks')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label='Remarks'
                              size='small'
                              fullWidth
                              multiline
                              rows={2}
                              error={!!errors.remarks}
                              helperText={errors.remarks?.message}
                            />
                          )}
                          onChange={(e, newValue) => {
                            setValue('remarks', newValue ?? undefined, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                          onInputChange={(e, newValue) => {
                            setValue('remarks', newValue || undefined, {
                              shouldDirty: true,
                            });
                          }}
                        />
                      </Div>
                    </Grid>
                  </Grid>
                </form>
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Div sx={{ mt: 0.3 }}>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant='h6' align='center'>
                      Summary
                    </Typography>
                    <Divider />
                  </Grid>

                  <Grid size={{ xs: 5 }}>
                    <Typography variant='body2'>Total:</Typography>
                  </Grid>
                  <Grid size={{ xs: 7 }}>
                    <Typography variant='body1' align='right'>
                      {totalAmount?.toLocaleString()}
                    </Typography>
                  </Grid>

                  {watch('vat_registered') && (
                    <>
                      <Grid size={{ xs: 5 }}>
                        <Typography variant='body2'>
                          VAT:
                          <Checkbox
                            size='small'
                            checked={!!vat_percentage}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setValue(
                                'vat_percentage',
                                checked
                                  ? (organization?.settings?.vat_percentage ??
                                      0)
                                  : 0,
                                {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                }
                              );
                            }}
                          />
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 7 }}>
                        <Typography variant='body1' align='right'>
                          {vatAmount?.toLocaleString()}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 5 }}>
                        <Typography variant='body2'>Grand Total:</Typography>
                      </Grid>
                      <Grid size={{ xs: 7 }}>
                        <Typography variant='body1' align='right'>
                          {(totalAmount + vatAmount).toLocaleString()}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Div>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Div sx={{ mt: 0.3 }}>
              <ProformaItemForm
                setClearFormKey={setClearFormKey}
                submitMainForm={handleSubmit((data) => saveMutation(data))}
                submitItemForm={submitItemForm}
                setSubmitItemForm={setSubmitItemForm}
                key={clearFormKey}
                setIsDirty={setIsDirty}
                setItems={setItems}
                vat_percentage={Number(vat_percentage)}
              />
            </Div>
          </Grid>
        </Grid>
      </DialogTitle>

      <DialogContent>
        <Div sx={{ mt: 0.3 }}>
          {errors?.items?.message && items.length < 1 && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {errors.items.message}
            </Alert>
          )}

          {items.map((item, index) => (
            <ProformaItemRow
              key={index}
              index={index}
              item={item as any}
              items={items as any}
              setItems={setItems as any}
              vat_percentage={Number(vat_percentage)}
              setIsDirty={setIsDirty}
              setClearFormKey={setClearFormKey}
              submitMainForm={handleSubmit((data) => saveMutation(data))}
              submitItemForm={submitItemForm}
              setSubmitItemForm={setSubmitItemForm}
            />
          ))}

          <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
            <Div sx={{ mt: 0.3 }}>
              <DialogTitle>
                <Grid
                  container
                  alignItems='center'
                  justifyContent='space-between'
                >
                  <Grid size={{ xs: 11 }}>Unsaved Changes</Grid>
                  <Grid size={{ xs: 1 }} textAlign='right'>
                    <IconButton
                      size='small'
                      onClick={() => setShowWarning(false)}
                    >
                      <HighlightOff color='primary' />
                    </IconButton>
                  </Grid>
                </Grid>
              </DialogTitle>
              <DialogContent>Last item was not added to the list</DialogContent>
              <DialogActions>
                <Button
                  size='small'
                  onClick={() => {
                    setSubmitItemForm(true);
                    setShowWarning(false);
                  }}
                >
                  Add and Submit
                </Button>
                <Button
                  size='small'
                  onClick={handleConfirmSubmitWithoutAdd}
                  color='secondary'
                >
                  Submit without add
                </Button>
              </DialogActions>
            </Div>
          </Dialog>
        </Div>
      </DialogContent>

      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={
            addProformaInvoice.isPending || updateProformaInvoice.isPending
          }
          variant='contained'
          size='small'
          onClick={handleSubmit(onSubmit)}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </React.Fragment>
  );
}

export default ProformaForm;
