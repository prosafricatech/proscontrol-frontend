import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import * as yup from 'yup';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import assetGlMappingsServices from './assetGlMappings-services';

interface AssetGlMappingFormDialogContentProps {
  onClose: () => void;
  mapping?: any;
  productCategories: any[];
}

const METHODS = ['straight_line', 'reducing_balance', 'none'];

const AssetGlMappingFormDialogContent: React.FC<AssetGlMappingFormDialogContentProps> = ({
  onClose,
  mapping = null,
  productCategories,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary();

  const addMapping = useMutation({
    mutationFn: assetGlMappingsServices.add,
    onSuccess: () => {
      onClose();
      enqueueSnackbar(dictionary.glMappings.form.messages.createSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['assetGlMappings'] });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const updateMapping = useMutation({
    mutationFn: assetGlMappingsServices.update,
    onSuccess: () => {
      onClose();
      enqueueSnackbar(dictionary.glMappings.form.messages.updateSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['assetGlMappings'] });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const validationSchema = yup.object({
    product_category_id: yup.number().required(dictionary.glMappings.form.errors.validation.productCategoryId.required).positive(),
    asset_ledger_id: yup.number().required(dictionary.glMappings.form.errors.validation.assetLedgerId.required).positive(),
    accumulated_depreciation_ledger_id: yup.number().required(dictionary.glMappings.form.errors.validation.accumulatedDepreciationLedgerId.required).positive(),
    depreciation_expense_ledger_id: yup.number().required(dictionary.glMappings.form.errors.validation.depreciationExpenseLedgerId.required).positive(),
    disposal_gain_loss_ledger_id: yup.number().required(dictionary.glMappings.form.errors.validation.disposalGainLossLedgerId.required).positive(),
    default_useful_life_months: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
    default_depreciation_method: yup.string().nullable(),
    default_depreciation_rate: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: yupResolver(validationSchema as any),
    defaultValues: {
      product_category_id: mapping?.product_category_id ?? null,
      asset_ledger_id: mapping?.asset_ledger_id ?? null,
      accumulated_depreciation_ledger_id: mapping?.accumulated_depreciation_ledger_id ?? null,
      depreciation_expense_ledger_id: mapping?.depreciation_expense_ledger_id ?? null,
      disposal_gain_loss_ledger_id: mapping?.disposal_gain_loss_ledger_id ?? null,
      default_useful_life_months: mapping?.default_useful_life_months ?? '',
      default_depreciation_method: mapping?.default_depreciation_method ?? '',
      default_depreciation_rate: mapping?.default_depreciation_rate ?? '',
    },
  });

  const onSubmit: SubmitHandler<any> = (data) => {
    if (mapping?.id) {
      updateMapping.mutate({ ...data, id: mapping.id });
    } else {
      addMapping.mutate(data);
    }
  };

  return (
    <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle>{mapping ? dictionary.glMappings.form.editTitle : dictionary.glMappings.form.title}</DialogTitle>
      <DialogContent>
        <Grid container p={1} spacing={1} rowGap={1}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              size="small"
              disabled={Boolean(mapping)}
              isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
              options={productCategories}
              getOptionLabel={(option: any) => option.name}
              defaultValue={productCategories.find((c: any) => c.id === mapping?.product_category_id) || null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={dictionary.glMappings.form.labels.category}
                  error={Boolean(errors.product_category_id)}
                  helperText={errors.product_category_id?.message as string}
                />
              )}
              onChange={(_, newValue: any) => {
                setValue('product_category_id', newValue ? newValue.id : null, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <LedgerSelect
              label={dictionary.glMappings.form.labels.assetLedger}
              allowedGroups={['Fixed Assets']}
              frontError={errors.asset_ledger_id as any}
              defaultValue={mapping?.asset_ledger || undefined}
              onChange={(newValue: any) => {
                setValue('asset_ledger_id', newValue && !Array.isArray(newValue) ? newValue.id : null, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <LedgerSelect
              label={dictionary.glMappings.form.labels.accumulatedDepreciationLedger}
              allowedGroups={['Fixed Assets']}
              frontError={errors.accumulated_depreciation_ledger_id as any}
              defaultValue={mapping?.accumulated_depreciation_ledger || undefined}
              onChange={(newValue: any) => {
                setValue('accumulated_depreciation_ledger_id', newValue && !Array.isArray(newValue) ? newValue.id : null, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <LedgerSelect
              label={dictionary.glMappings.form.labels.depreciationExpenseLedger}
              allowedGroups={['Direct Expenses', 'Indirect Expenses']}
              frontError={errors.depreciation_expense_ledger_id as any}
              defaultValue={mapping?.depreciation_expense_ledger || undefined}
              onChange={(newValue: any) => {
                setValue('depreciation_expense_ledger_id', newValue && !Array.isArray(newValue) ? newValue.id : null, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <LedgerSelect
              label={dictionary.glMappings.form.labels.disposalGainLossLedger}
              frontError={errors.disposal_gain_loss_ledger_id as any}
              defaultValue={mapping?.disposal_gain_loss_ledger || undefined}
              onChange={(newValue: any) => {
                setValue('disposal_gain_loss_ledger_id', newValue && !Array.isArray(newValue) ? newValue.id : null, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              size="small"
              label={dictionary.glMappings.form.labels.defaultDepreciationMethod}
              defaultValue={mapping?.default_depreciation_method ?? ''}
              {...register('default_depreciation_method')}
            >
              <MenuItem value="">—</MenuItem>
              {METHODS.map((m) => (
                <MenuItem key={m} value={m}>{dictionary.register.form.methods[m]}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary" mt={1}>
              {dictionary.glMappings.form.sections.defaults}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label={dictionary.glMappings.form.labels.defaultUsefulLifeMonths}
              helperText={dictionary.glMappings.form.help.defaultUsefulLifeMonths}
              {...register('default_useful_life_months')}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label={dictionary.glMappings.form.labels.defaultDepreciationRate}
              helperText={dictionary.glMappings.form.help.defaultDepreciationRate}
              {...register('default_depreciation_rate')}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose}>{dictionary.glMappings.form.buttons.cancel}</Button>
        <LoadingButton
          variant="contained"
          type="submit"
          loading={addMapping.isPending || updateMapping.isPending}
          size="small"
        >
          {dictionary.glMappings.form.buttons.save}
        </LoadingButton>
      </DialogActions>
    </form>
  );
};

export default AssetGlMappingFormDialogContent;
