import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
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
import { DateTimePicker } from '@mui/x-date-pickers';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import AssetDetailSelector from './AssetDetailSelector';
import assetBookingsServices from './asset-bookings-services';

interface AssetBookingFormDialogContentProps {
  onClose: () => void;
  booking?: any;
  defaultAssetDetail?: any;
  defaultStartAt?: string;
  defaultEndAt?: string;
}

const AssetBookingFormDialogContent: React.FC<AssetBookingFormDialogContentProps> = ({
  onClose,
  booking = null,
  defaultAssetDetail = null,
  defaultStartAt,
  defaultEndAt,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary();
  const mode = booking ? 'edit' : 'create';

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['assetBookings'] });
    queryClient.invalidateQueries({ queryKey: ['assetBookingsCalendar'] });
  };

  const addBooking = useMutation({
    mutationFn: assetBookingsServices.add,
    onSuccess: () => {
      onClose();
      enqueueSnackbar(dictionary.bookings.form.messages.createSuccess, { variant: 'success' });
      invalidate();
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const updateBooking = useMutation({
    mutationFn: assetBookingsServices.update,
    onSuccess: () => {
      onClose();
      enqueueSnackbar(dictionary.bookings.form.messages.updateSuccess, { variant: 'success' });
      invalidate();
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const validationSchema = yup.object({
    asset_detail_id: yup.number().required(dictionary.bookings.form.errors.validation.assetDetailId.required).positive(),
    booking_type: yup.string().required(dictionary.bookings.form.errors.validation.bookingType.required),
    cost_center_id: yup.number().nullable().transform((v, o) => (o === '' ? null : v))
      .when('booking_type', {
        is: 'internal',
        then: (schema) => schema.required(dictionary.bookings.form.errors.validation.costCenterId.required).positive(),
      }),
    stakeholder_id: yup.number().nullable().transform((v, o) => (o === '' ? null : v))
      .when('booking_type', {
        is: 'external',
        then: (schema) => schema.required(dictionary.bookings.form.errors.validation.stakeholderId.required).positive(),
      }),
    start_at: yup.string().required(dictionary.bookings.form.errors.validation.startAt.required),
    end_at: yup.string().required(dictionary.bookings.form.errors.validation.endAt.required)
      .test('after-start', dictionary.bookings.form.errors.validation.endAt.afterStart, function (value) {
        const { start_at } = this.parent;
        return !start_at || !value || dayjs(value).isAfter(dayjs(start_at));
      }),
    purpose: yup.string().nullable(),
    rate: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
    currency_id: yup.number().nullable()
      .when('rate', {
        is: (r: any) => !!r,
        then: (schema) => schema.required(),
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
    defaultValues: {
      asset_detail_id: booking?.asset_detail?.id ?? defaultAssetDetail?.id ?? null,
      booking_type: booking?.booking_type ?? 'internal',
      cost_center_id: booking?.cost_center_id ?? null,
      stakeholder_id: booking?.stakeholder_id ?? null,
      start_at: booking?.start_at ? dayjs(booking.start_at).format('YYYY-MM-DDTHH:mm:ss') : (defaultStartAt ?? ''),
      end_at: booking?.end_at ? dayjs(booking.end_at).format('YYYY-MM-DDTHH:mm:ss') : (defaultEndAt ?? ''),
      purpose: booking?.purpose ?? '',
      rate: booking?.rate ?? '',
      currency_id: booking?.currency_id ?? 1,
    },
  });

  const bookingType = watch('booking_type');

  const onSubmit: SubmitHandler<any> = (data) => {
    if (mode === 'edit') {
      updateBooking.mutate({ ...data, id: booking.id });
    } else {
      addBooking.mutate(data);
    }
  };

  return (
    <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle>{mode === 'edit' ? dictionary.bookings.form.editTitle : dictionary.bookings.form.title}</DialogTitle>
      <DialogContent>
        <Grid container p={1} spacing={1} rowGap={1}>
          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary">{dictionary.bookings.form.sections.asset}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <AssetDetailSelector
              label={dictionary.bookings.form.labels.asset}
              defaultValue={booking?.asset_detail ?? defaultAssetDetail}
              frontError={errors.asset_detail_id as any}
              onChange={(newValue) => setValue('asset_detail_id', newValue ? newValue.id : null, { shouldValidate: true, shouldDirty: true })}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              size="small"
              disabled={mode === 'edit'}
              label={dictionary.bookings.form.labels.bookingType}
              value={bookingType}
              onChange={(e) => setValue('booking_type', e.target.value, { shouldValidate: true, shouldDirty: true })}
            >
              {/* External bookings are created from a Sale (see the Sales
                  Counter's "Attach Asset Booking") so a customer is always
                  billed correctly from the start — this form only offers it
                  when editing a booking that's already external. */}
              {bookingType === 'external' && (
                <MenuItem value="external">{dictionary.bookings.form.labels.external}</MenuItem>
              )}
              <MenuItem value="internal">{dictionary.bookings.form.labels.internal}</MenuItem>
            </TextField>
            {mode === 'create' && (
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                {dictionary.bookings.form.help.externalFromSale}
              </Typography>
            )}
          </Grid>

          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary" mt={1}>{dictionary.bookings.form.sections.schedule}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <DateTimePicker
              label={dictionary.bookings.form.labels.startAt}
              defaultValue={watch('start_at') ? dayjs(watch('start_at')) : null}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  error: Boolean(errors.start_at),
                  helperText: errors.start_at?.message as string,
                },
              }}
              onChange={(value: any) => setValue('start_at', value ? value.format('YYYY-MM-DDTHH:mm:ss') : '', { shouldValidate: true })}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <DateTimePicker
              label={dictionary.bookings.form.labels.endAt}
              defaultValue={watch('end_at') ? dayjs(watch('end_at')) : null}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  error: Boolean(errors.end_at),
                  helperText: errors.end_at?.message as string,
                },
              }}
              onChange={(value: any) => setValue('end_at', value ? value.format('YYYY-MM-DDTHH:mm:ss') : '', { shouldValidate: true })}
            />
          </Grid>

          {bookingType === 'internal' && (
            <Grid size={{ xs: 12, md: 6 }}>
              <CostCenterSelector
                label={dictionary.bookings.form.labels.costCenter}
                multiple={false}
                defaultValue={booking?.cost_center ?? null}
                frontError={errors.cost_center_id as any}
                onChange={(newValue: any) => setValue('cost_center_id', newValue && !Array.isArray(newValue) ? newValue.id : null, { shouldValidate: true })}
              />
            </Grid>
          )}
          {bookingType === 'external' && (
            <Grid size={{ xs: 12, md: 6 }}>
              <StakeholderSelector
                label={dictionary.bookings.form.labels.stakeholder}
                defaultValue={booking?.stakeholder_id ?? null}
                frontError={errors.stakeholder_id as any}
                onChange={(newValue: any) => setValue('stakeholder_id', newValue && !Array.isArray(newValue) ? newValue.id : null, { shouldValidate: true })}
              />
            </Grid>
          )}

          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary" mt={1}>{dictionary.bookings.form.sections.billing}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label={dictionary.bookings.form.labels.rate}
              value={watch('rate') || ''}
              InputProps={{ inputComponent: CommaSeparatedField as any }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setValue('rate', sanitizedNumber(e.target.value), { shouldValidate: true, shouldDirty: true });
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CurrencySelector
              label={dictionary.bookings.form.labels.currency}
              required={false}
              defaultValue={booking?.currency_id ?? 1}
              frontError={errors.currency_id as any}
              onChange={(newValue: any) => setValue('currency_id', newValue ? newValue.id : null, { shouldValidate: true })}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label={dictionary.bookings.form.labels.purpose}
              {...register('purpose')}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose}>{dictionary.bookings.form.buttons.cancel}</Button>
        <LoadingButton
          variant="contained"
          type="submit"
          loading={addBooking.isPending || updateBooking.isPending}
          size="small"
        >
          {dictionary.bookings.form.buttons.save}
        </LoadingButton>
      </DialogActions>
    </form>
  );
};

export default AssetBookingFormDialogContent;
