'use client';

import { Alert, Button, CircularProgress, Grid, TextField, Typography } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import AssetDetailSelector from './AssetDetailSelector';
import assetBookingsServices from './asset-bookings-services';

interface AssetBookingQuickAddFormProps {
  stakeholderId: number;
  currencyId?: number | null;
  /** Restrict the asset picker to this cost center — typically the current
   * sales outlet's, so only assets deployed there can be booked from it. */
  costCenterId?: number | null;
  onAttach: (payload: any, asset: any) => void;
  onCancel: () => void;
}

/**
 * Compact "attach a booking without leaving the Sale form" control. Doesn't
 * create anything itself — it just hands the caller a booking payload to
 * hold onto. The actual AssetBooking is only created (and confirmed and
 * linked) once the sale itself saves successfully, so an abandoned sale
 * never leaves an orphaned draft booking behind.
 *
 * Since creation is deferred, a slot conflict would otherwise only surface
 * at checkout — this does a live availability check as soon as an asset and
 * a full date range are picked, so the cashier finds out immediately.
 */
const AssetBookingQuickAddForm: React.FC<AssetBookingQuickAddFormProps> = ({
  stakeholderId,
  currencyId,
  costCenterId = null,
  onAttach,
  onCancel,
}) => {
  const [asset, setAsset] = useState<any>(null);
  const [startAt, setStartAt] = useState<any>(null);
  const [endAt, setEndAt] = useState<any>(null);
  const [rate, setRate] = useState<any>('');

  const hasValidRange = asset && startAt && endAt && dayjs(endAt).isAfter(dayjs(startAt));

  // Debounce the range that drives the availability check — DateTimePicker's
  // text portion can fire onChange per keystroke, and we don't want a
  // request per digit typed.
  const [debounced, setDebounced] = useState<{ assetId: any; startAt: any; endAt: any } | null>(null);
  useEffect(() => {
    if (!hasValidRange) {
      setDebounced(null);
      return;
    }
    const timer = setTimeout(() => {
      setDebounced({ assetId: asset.id, startAt: dayjs(startAt).format('YYYY-MM-DDTHH:mm:ss'), endAt: dayjs(endAt).format('YYYY-MM-DDTHH:mm:ss') });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id, startAt, endAt, hasValidRange]);

  const { data: availability, isFetching: checkingAvailability } = useQuery({
    queryKey: ['assetBookingAvailability', debounced?.assetId, debounced?.startAt, debounced?.endAt],
    queryFn: () => assetBookingsServices.checkAvailability({
      asset_detail_id: debounced!.assetId,
      start_at: debounced!.startAt,
      end_at: debounced!.endAt,
    }),
    enabled: Boolean(debounced),
  });

  const isUnavailable = Boolean(debounced) && availability && !availability.available;
  const canSubmit = hasValidRange && !checkingAvailability && !isUnavailable;

  return (
    <Grid container spacing={1} p={1} sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
      <Grid size={12}>
        <Typography variant="subtitle2">Attach an Asset Booking</Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <AssetDetailSelector label="Asset" costCenterId={costCenterId} onChange={setAsset} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <DateTimePicker
          label="Start"
          slotProps={{ textField: { fullWidth: true, size: 'small' } }}
          onChange={(value: any) => setStartAt(value)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <DateTimePicker
          label="End"
          slotProps={{ textField: { fullWidth: true, size: 'small' } }}
          onChange={(value: any) => setEndAt(value)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Rate"
          value={rate}
          InputProps={{ inputComponent: CommaSeparatedField as any }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRate(sanitizedNumber(e.target.value))}
        />
      </Grid>

      {asset && !asset.billing_product_id && (
        <Grid size={12}>
          <Alert severity="info">
            {asset.code} has no billing product mapped — you'll need to add the appropriate item to this sale manually.
          </Alert>
        </Grid>
      )}
      {checkingAvailability && (
        <Grid size={12} display="flex" alignItems="center" gap={1}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">Checking availability…</Typography>
        </Grid>
      )}
      {isUnavailable && (
        <Grid size={12}>
          <Alert severity="error">
            {asset?.code} is already booked for part of this period
            {availability?.conflicting_booking?.code ? ` (${availability.conflicting_booking.code})` : ''}.
            Pick a different time or asset.
          </Alert>
        </Grid>
      )}

      <Grid size={12} display="flex" gap={1} justifyContent="flex-end">
        <Button size="small" onClick={onCancel}>Cancel</Button>
        <Button
          size="small"
          variant="contained"
          disabled={!canSubmit}
          onClick={() => onAttach({
            asset_detail_id: asset.id,
            booking_type: 'external',
            stakeholder_id: stakeholderId,
            start_at: dayjs(startAt).format('YYYY-MM-DDTHH:mm:ss'),
            end_at: dayjs(endAt).format('YYYY-MM-DDTHH:mm:ss'),
            rate: rate || null,
            currency_id: rate ? (currencyId ?? 1) : null,
          }, asset)}
        >
          Add
        </Button>
      </Grid>
    </Grid>
  );
};

export default AssetBookingQuickAddForm;
