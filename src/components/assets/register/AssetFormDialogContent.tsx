import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Checkbox,
  ClickAwayListener,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Alert,
} from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import * as yup from 'yup';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import EmployeeSelector from '@/components/humanResources/employees/EmployeeSelector';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import assetsServices from './assets-services';

const METHODS = ['straight_line', 'reducing_balance', 'none'];

// Click-to-show help, matching the info-icon pattern used on Payroll forms —
// better than hover for touch devices, and keeps the help text out of the
// layout until someone actually asks for it.
const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [open, setOpen] = useState(false);
  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Tooltip
        title={text}
        open={open}
        onClose={() => setOpen(false)}
        disableFocusListener
        disableHoverListener
        disableTouchListener
        arrow
      >
        <InfoOutlined
          fontSize="small"
          color="action"
          sx={{ cursor: 'pointer', verticalAlign: 'middle' }}
          onClick={() => setOpen((o) => !o)}
        />
      </Tooltip>
    </ClickAwayListener>
  );
};

interface AssetFormDialogContentProps {
  onClose: () => void;
  asset?: any;
  mode?: 'create' | 'edit' | 'activate';
}

const AssetFormDialogContent: React.FC<AssetFormDialogContentProps> = ({
  onClose,
  asset = null,
  mode = asset ? 'edit' : 'create',
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary();
  const { productOptions } = useProductsSelect();
  const assetProducts = productOptions.filter((p: any) => p.type === 'Asset');
  const { organizationHasSubscribed, authOrganization } = useJumboAuth();
  const hrSubscribed = organizationHasSubscribed(MODULES.HUMAN_RESOURCES);
  const bookingsSubscribed = organizationHasSubscribed(MODULES.ASSET_BOOKINGS);
  const multiCostCenters = authOrganization?.costCenters?.length > 1;

  const hasDepreciationHistory = mode === 'edit' && Boolean(asset?.latest_depreciation_entry || asset?.depreciation_entries?.length);
  const financialsLocked = mode === 'edit' && hasDepreciationHistory;

  const [postJournal, setPostJournal] = useState(false);

  const addAsset = useMutation({
    mutationFn: assetsServices.add,
    onSuccess: () => {
      onClose();
      enqueueSnackbar(dictionary.register.form.messages.createSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const updateAsset = useMutation({
    mutationFn: assetsServices.update,
    onSuccess: () => {
      onClose();
      enqueueSnackbar(dictionary.register.form.messages.updateSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const activateAsset = useMutation({
    mutationFn: assetsServices.activate,
    onSuccess: () => {
      onClose();
      enqueueSnackbar(dictionary.register.form.messages.activateSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const validationSchema = yup.object({
    product_id: mode === 'create'
      ? yup.number().required(dictionary.register.form.errors.validation.product.required).positive()
      : yup.number().nullable(),
    identification: mode !== 'activate'
      ? yup.string().required(dictionary.register.form.errors.validation.identification.required)
      : yup.string().nullable(),
    acquisition_date: mode !== 'activate'
      ? yup.string().required(dictionary.register.form.errors.validation.acquisitionDate.required)
      : yup.string().nullable(),
    acquisition_cost: mode !== 'activate'
      ? yup.number().required(dictionary.register.form.errors.validation.acquisitionCost.required).positive(dictionary.register.form.errors.validation.acquisitionCost.positive)
      : yup.number().nullable(),
    salvage_value: yup.number().nullable().transform((v, o) => (o === '' ? 0 : v)),
    depreciation_method: yup.string().required(dictionary.register.form.errors.validation.depreciationMethod.required),
    useful_life_months: yup.number().nullable().transform((v, o) => (o === '' ? null : v))
      .when('depreciation_method', {
        is: 'straight_line',
        then: (schema) => schema.required(dictionary.register.form.errors.validation.usefulLifeMonths.required).positive(),
      }),
    depreciation_rate: yup.number().nullable().transform((v, o) => (o === '' ? null : v))
      .when('depreciation_method', {
        is: 'reducing_balance',
        then: (schema) => schema.required(dictionary.register.form.errors.validation.depreciationRate.required).positive(),
      }),
    depreciation_start_date: yup.string().nullable()
      .when('depreciation_method', {
        is: (m: string) => m !== 'none',
        then: (schema) => schema.required(dictionary.register.form.errors.validation.depreciationStartDate.required),
      }),
    accumulated_depreciation_bf: yup.number().nullable().transform((v, o) => (o === '' ? 0 : v)),
    current_store_id: yup.number().nullable(),
    current_custodian_id: yup.number().nullable(),
    cost_center_id: yup.number().nullable(),
    is_bookable: yup.boolean().nullable(),
    billing_product_id: yup.number().nullable(),
    remarks: yup.string().nullable(),
    credit_ledger_id: yup.number().nullable()
      .when('$postJournal', {
        is: true,
        then: (schema) => schema.required(dictionary.register.form.errors.validation.creditLedger.required).positive(),
      }),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: yupResolver(validationSchema as any),
    context: { postJournal },
    defaultValues: {
      product_id: asset?.product_item?.product?.id ?? null,
      identification: asset?.product_item?.identification ?? '',
      remarks: asset?.product_item?.remarks ?? '',
      acquisition_date: asset?.acquisition_date ? dayjs(asset.acquisition_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      acquisition_cost: asset?.acquisition_cost ?? '',
      salvage_value: asset?.salvage_value ?? 0,
      depreciation_method: asset?.depreciation_method ?? 'straight_line',
      useful_life_months: asset?.useful_life_months ?? '',
      depreciation_rate: asset?.depreciation_rate ?? '',
      depreciation_start_date: asset?.depreciation_start_date
        ? dayjs(asset.depreciation_start_date).format('YYYY-MM-DD')
        : asset?.acquisition_date
          ? dayjs(asset.acquisition_date).format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD'),
      accumulated_depreciation_bf: asset?.accumulated_depreciation_bf ?? 0,
      current_store_id: asset?.current_store_id ?? null,
      current_custodian_id: asset?.current_custodian_id ?? null,
      cost_center_id: asset?.cost_center_id ?? null,
      is_bookable: asset?.is_bookable ?? false,
      billing_product_id: asset?.billing_product_id ?? null,
      status: asset?.status && asset.status !== 'draft' ? asset.status : 'active',
      credit_ledger_id: null,
    },
  });

  const method = watch('depreciation_method');

  const onSubmit: SubmitHandler<any> = (data) => {
    if (mode === 'activate') {
      activateAsset.mutate({ ...data, id: asset.id });
    } else if (mode === 'edit') {
      updateAsset.mutate({ ...data, id: asset.id });
    } else {
      addAsset.mutate({ ...data, post_journal: postJournal });
    }
  };

  const title = mode === 'activate'
    ? dictionary.register.form.activateTitle
    : mode === 'edit'
      ? dictionary.register.form.editTitle
      : dictionary.register.form.title;

  return (
    <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container p={1} spacing={1} rowGap={1}>
          {mode !== 'activate' && (
            <>
              <Grid size={12}>
                <Typography variant="subtitle2" color="text.secondary">{dictionary.register.form.sections.product}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <ProductSelect
                  label={dictionary.register.form.labels.product}
                  disabled={mode === 'edit'}
                  allowedTypes={['Asset']}
                  defaultValue={assetProducts.find((p: any) => p.id === asset?.product_item?.product?.id) || null}
                  onChange={(newValue: any) => {
                    setValue('product_id', newValue ? newValue.id : null, { shouldValidate: true, shouldDirty: true });
                  }}
                  frontError={errors.product_id as any}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={dictionary.register.form.labels.identification}
                  error={Boolean(errors.identification)}
                  helperText={errors.identification?.message as string}
                  {...register('identification')}
                />
              </Grid>
            </>
          )}

          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary" mt={1}>{dictionary.register.form.sections.cost}</Typography>
          </Grid>
          {mode !== 'activate' && (
            <>
              <Grid size={{ xs: 12, md: 4 }}>
                <DatePicker
                  label={dictionary.register.form.labels.acquisitionDate}
                  defaultValue={dayjs(asset?.acquisition_date ?? undefined)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      error: Boolean(errors.acquisition_date),
                      helperText: errors.acquisition_date?.message as string,
                    },
                  }}
                  onChange={(value: any) => setValue('acquisition_date', value ? value.format('YYYY-MM-DD') : null, { shouldValidate: true })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={dictionary.register.form.labels.acquisitionCost}
                  error={Boolean(errors.acquisition_cost)}
                  helperText={errors.acquisition_cost?.message as string}
                  value={watch('acquisition_cost') || ''}
                  InputProps={{
                    inputComponent: CommaSeparatedField as any,
                  }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setValue('acquisition_cost', sanitizedNumber(e.target.value), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Grid>
            </>
          )}
          <Grid size={{ xs: 12, md: mode === 'activate' ? 4 : 4 }}>
            <TextField
              fullWidth
              size="small"
              disabled={financialsLocked}
              label={dictionary.register.form.labels.salvageValue}
              value={watch('salvage_value') || ''}
              InputProps={{
                inputComponent: CommaSeparatedField as any,
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setValue('salvage_value', sanitizedNumber(e.target.value), {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Grid>
          {mode !== 'activate' && (
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                disabled={financialsLocked}
                label={dictionary.register.form.labels.accumulatedDepreciationBf}
                value={watch('accumulated_depreciation_bf') || ''}
                InputProps={{
                  inputComponent: CommaSeparatedField as any,
                }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setValue('accumulated_depreciation_bf', sanitizedNumber(e.target.value), {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </Grid>
          )}

          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary" mt={1}>{dictionary.register.form.sections.depreciation}</Typography>
          </Grid>
          {financialsLocked && (
            <Grid size={12}>
              <Alert severity="info">{dictionary.register.form.help.financialsLocked}</Alert>
            </Grid>
          )}
          <Grid size={12}>
            <TextField
              select
              fullWidth
              size="small"
              disabled={financialsLocked}
              label={dictionary.register.form.labels.depreciationMethod}
              error={Boolean(errors.depreciation_method)}
              helperText={errors.depreciation_method?.message as string}
              defaultValue={asset?.depreciation_method ?? 'straight_line'}
              {...register('depreciation_method')}
            >
              {METHODS.map((m) => (
                <MenuItem key={m} value={m}>{dictionary.register.form.methods[m]}</MenuItem>
              ))}
            </TextField>
          </Grid>
          {method === 'straight_line' && (
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                disabled={financialsLocked}
                label={dictionary.register.form.labels.usefulLifeMonths}
                error={Boolean(errors.useful_life_months)}
                helperText={errors.useful_life_months?.message as string}
                {...register('useful_life_months')}
              />
            </Grid>
          )}
          {method === 'reducing_balance' && (
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                disabled={financialsLocked}
                label={dictionary.register.form.labels.depreciationRate}
                error={Boolean(errors.depreciation_rate)}
                helperText={errors.depreciation_rate?.message as string}
                {...register('depreciation_rate')}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: method === 'none' ? 12 : 6 }}>
            <DatePicker
              label={dictionary.register.form.labels.depreciationStartDate}
              disabled={financialsLocked || method === 'none'}
              defaultValue={dayjs(asset?.depreciation_start_date ?? asset?.acquisition_date ?? undefined)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  error: Boolean(errors.depreciation_start_date),
                  helperText: errors.depreciation_start_date?.message as string,
                },
              }}
              onChange={(value: any) => setValue('depreciation_start_date', value ? value.format('YYYY-MM-DD') : null, { shouldValidate: true })}
            />
          </Grid>

          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary" mt={1}>{dictionary.register.form.sections.location}</Typography>
          </Grid>
          {mode === 'edit' && (
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label={dictionary.register.form.labels.status}
                defaultValue={asset?.status !== 'draft' ? asset?.status : 'active'}
                {...register('status')}
              >
                <MenuItem value="active">{dictionary.register.list.status.active}</MenuItem>
                <MenuItem value="under_maintenance">{dictionary.register.list.status.under_maintenance}</MenuItem>
              </TextField>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: (hrSubscribed || multiCostCenters) ? 6 : 12 }}>
            <StoreSelector
              label={dictionary.register.form.labels.store}
              defaultValue={asset?.current_store ?? null}
              onChange={(newValue: any) => setValue('current_store_id', newValue ? newValue.id : null)}
            />
          </Grid>
          {hrSubscribed && (
            <Grid size={{ xs: 12, md: 6 }}>
              <EmployeeSelector
                label={dictionary.register.form.labels.custodian}
                defaultValue={asset?.current_custodian ?? null}
                onChange={(newValue: any) => setValue('current_custodian_id', Array.isArray(newValue) ? null : (newValue?.id ?? null))}
              />
            </Grid>
          )}
          {multiCostCenters && (
            <Grid size={{ xs: 12, md: 6 }}>
              <CostCenterSelector
                label={dictionary.register.form.labels.costCenter}
                multiple={false}
                defaultValue={asset?.cost_center ?? null}
                onChange={(newValue: any) => setValue('cost_center_id', newValue && !Array.isArray(newValue) ? newValue.id : null)}
              />
            </Grid>
          )}
          {bookingsSubscribed && (
            <Grid size={12}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(watch('is_bookable'))}
                      onChange={(e) => setValue('is_bookable', e.target.checked, { shouldDirty: true })}
                    />
                  }
                  label={dictionary.register.form.labels.isBookable}
                />
                <InfoTooltip text={dictionary.register.form.help.isBookable} />
              </Stack>
            </Grid>
          )}
          {bookingsSubscribed && Boolean(watch('is_bookable')) && (
            <Grid size={{ xs: 12, md: 6 }}>
              <ProductSelect
                label={dictionary.register.form.labels.billingProduct}
                allowedTypes={['Service', 'Non-Inventory']}
                defaultValue={asset?.billing_product ?? null}
                startAdornment={<InfoTooltip text={dictionary.register.form.help.billingProduct} />}
                onChange={(newValue: any) => setValue('billing_product_id', newValue && !Array.isArray(newValue) ? newValue.id : null)}
              />
            </Grid>
          )}
          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label={dictionary.register.form.labels.remarks}
              {...register('remarks')}
            />
          </Grid>

          {mode === 'create' && (
            <>
              <Grid size={12}>
                <FormControlLabel
                  control={<Checkbox checked={postJournal} onChange={(e) => setPostJournal(e.target.checked)} />}
                  label={dictionary.register.form.labels.postJournal}
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  {dictionary.register.form.help.postJournal}
                </Typography>
              </Grid>
              {postJournal && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <LedgerSelect
                    label={dictionary.register.form.labels.creditLedger}
                    frontError={errors.credit_ledger_id as any}
                    onChange={(newValue: any) => {
                      setValue('credit_ledger_id', newValue && !Array.isArray(newValue) ? newValue.id : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Grid>
              )}
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose}>{dictionary.register.form.buttons.cancel}</Button>
        <LoadingButton
          variant="contained"
          type="submit"
          loading={addAsset.isPending || updateAsset.isPending || activateAsset.isPending}
          size="small"
        >
          {mode === 'activate' ? dictionary.register.form.buttons.activate : dictionary.register.form.buttons.save}
        </LoadingButton>
      </DialogActions>
    </form>
  );
};

export default AssetFormDialogContent;
