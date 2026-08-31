import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
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
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import assetsServices from '../register/assets-services';

const METHODS = ['sold', 'scrapped', 'written_off'];

const fmt = (amount: number) =>
  (amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface AssetDisposalDialogContentProps {
  onClose: () => void;
  asset: any;
}

const AssetDisposalDialogContent: React.FC<AssetDisposalDialogContentProps> = ({ onClose, asset }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary();

  const accumulated = asset.latest_depreciation_entry?.accumulated_depreciation_after ?? asset.accumulated_depreciation_bf ?? 0;
  const netBookValue = (asset.acquisition_cost ?? 0) - accumulated;

  const disposeAsset = useMutation({
    mutationFn: assetsServices.dispose,
    onSuccess: () => {
      onClose();
      enqueueSnackbar(dictionary.disposal.form.messages.success, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const validationSchema = yup.object({
    disposal_date: yup.string().required(dictionary.disposal.form.errors.validation.disposalDate.required),
    disposal_method: yup.string().required(dictionary.disposal.form.errors.validation.disposalMethod.required),
    proceeds: yup.number().nullable()
      .when('disposal_method', {
        is: 'sold',
        then: (schema) => schema.required(dictionary.disposal.form.errors.validation.proceeds.required).min(0),
      }),
    proceeds_ledger_id: yup.number().nullable()
      .when('disposal_method', {
        is: 'sold',
        then: (schema) => schema.required(dictionary.disposal.form.errors.validation.proceedsLedger.required).positive(),
      }),
    remarks: yup.string().nullable(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: yupResolver(validationSchema as any),
    defaultValues: {
      disposal_date: dayjs().format('YYYY-MM-DD'),
      disposal_method: 'sold',
      proceeds: 0,
      proceeds_ledger_id: null,
      remarks: '',
    },
  });

  const method = watch('disposal_method');
  const proceeds = watch('proceeds') || 0;
  const gainLoss = method === 'sold' ? proceeds - netBookValue : -netBookValue;

  const onSubmit: SubmitHandler<any> = (data) => {
    disposeAsset.mutate({ ...data, id: asset.id });
  };

  return (
    <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle>{dictionary.disposal.form.title} — {asset.code}</DialogTitle>
      <DialogContent>
        <Grid container p={1} spacing={1} rowGap={1}>
          <Grid size={12}>
            <Alert severity="info">
              {dictionary.disposal.form.labels.netBookValue}: {fmt(netBookValue)}
            </Alert>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker
              label={dictionary.disposal.form.labels.disposalDate}
              defaultValue={dayjs()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  error: Boolean(errors.disposal_date),
                  helperText: errors.disposal_date?.message as string,
                },
              }}
              onChange={(value: any) => setValue('disposal_date', value ? value.format('YYYY-MM-DD') : null, { shouldValidate: true })}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              size="small"
              label={dictionary.disposal.form.labels.disposalMethod}
              error={Boolean(errors.disposal_method)}
              helperText={errors.disposal_method?.message as string}
              defaultValue="sold"
              {...register('disposal_method')}
            >
              {METHODS.map((m) => (
                <MenuItem key={m} value={m}>{dictionary.disposal.form.methods[m]}</MenuItem>
              ))}
            </TextField>
          </Grid>
          {method === 'sold' && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={dictionary.disposal.form.labels.proceeds}
                  error={Boolean(errors.proceeds)}
                  helperText={errors.proceeds?.message as string}
                  value={proceeds || ''}
                  InputProps={{
                    inputComponent: CommaSeparatedField as any,
                  }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setValue('proceeds', sanitizedNumber(e.target.value), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <LedgerSelect
                  label={dictionary.disposal.form.labels.proceedsLedger}
                  allowedGroups={['Cash and cash equivalents', 'Accounts Receivable']}
                  frontError={errors.proceeds_ledger_id as any}
                  onChange={(newValue: any) => {
                    setValue('proceeds_ledger_id', newValue && !Array.isArray(newValue) ? newValue.id : null, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Grid>
            </>
          )}
          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label={dictionary.disposal.form.labels.remarks}
              {...register('remarks')}
            />
          </Grid>
          <Grid size={12}>
            <Typography variant="subtitle2" color={gainLoss >= 0 ? 'success.main' : 'error.main'}>
              {dictionary.disposal.form.labels.gainLoss}: {fmt(gainLoss)}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose}>{dictionary.disposal.form.buttons.cancel}</Button>
        <LoadingButton
          variant="contained"
          color="error"
          type="submit"
          loading={disposeAsset.isPending}
          size="small"
        >
          {dictionary.disposal.form.buttons.save}
        </LoadingButton>
      </DialogActions>
    </form>
  );
};

export default AssetDisposalDialogContent;
