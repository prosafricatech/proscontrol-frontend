'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import dayjs from 'dayjs';
import assetBookingsServices from './asset-bookings-services';

interface AssetBookingDetailDialogProps {
  booking: any;
  onClose: () => void;
  onEdit: () => void;
}

const STATUS_COLORS: Record<string, any> = {
  draft: 'default',
  confirmed: 'info',
  ongoing: 'primary',
  completed: 'success',
  cancelled: 'error',
};

const AssetBookingDetailDialog: React.FC<AssetBookingDetailDialogProps> = ({ booking, onClose, onEdit }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary();
  const { checkOrganizationPermission } = useJumboAuth();

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [linkingSale, setLinkingSale] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  const { data: linkableSales = [], isLoading: loadingLinkableSales } = useQuery<any[]>({
    queryKey: ['assetBookingLinkableSales', booking.stakeholder?.id, booking.asset_detail?.cost_center_id, booking.asset_detail?.billing_product_id],
    queryFn: () => assetBookingsServices.getLinkableSales(
      booking.stakeholder.id,
      booking.asset_detail?.cost_center_id,
      booking.asset_detail?.billing_product_id
    ),
    enabled: linkingSale && Boolean(booking.stakeholder?.id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['assetBookings'] });
    queryClient.invalidateQueries({ queryKey: ['assetBookingsCalendar'] });
  };

  const confirmBooking = useMutation({
    mutationFn: assetBookingsServices.confirm,
    onSuccess: () => {
      enqueueSnackbar(dictionary.bookings.form.messages.confirmSuccess, { variant: 'success' });
      invalidate();
      onClose();
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const cancelBooking = useMutation({
    mutationFn: assetBookingsServices.cancel,
    onSuccess: () => {
      enqueueSnackbar(dictionary.bookings.form.messages.cancelSuccess, { variant: 'success' });
      invalidate();
      onClose();
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const deleteBooking = useMutation({
    mutationFn: assetBookingsServices.delete,
    onSuccess: () => {
      enqueueSnackbar(dictionary.bookings.form.messages.deleteSuccess, { variant: 'success' });
      invalidate();
      onClose();
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const linkSale = useMutation({
    mutationFn: assetBookingsServices.linkSale,
    onSuccess: () => {
      enqueueSnackbar(dictionary.bookings.form.messages.linkSaleSuccess, { variant: 'success' });
      invalidate();
      onClose();
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const unlinkSale = useMutation({
    mutationFn: assetBookingsServices.unlinkSale,
    onSuccess: () => {
      enqueueSnackbar(dictionary.bookings.form.messages.unlinkSaleSuccess, { variant: 'success' });
      invalidate();
      onClose();
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const assetLabel = `${booking.asset_detail?.code ?? ''}${booking.asset_detail?.product_item?.identification ? ' — ' + booking.asset_detail.product_item.identification : ''}`;
  const stakeholderName = booking.stakeholder?.name ?? null;

  return (
    <>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <span>{booking.code}</span>
          <Chip size="small" color={STATUS_COLORS[booking.status]} label={dictionary.bookings.detail.status[booking.status]} />
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={1.5} p={1}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">{dictionary.bookings.detail.labels.asset}</Typography>
            <Typography variant="body2">{assetLabel}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">{dictionary.bookings.detail.labels.type}</Typography>
            <Typography variant="body2">{dictionary.bookings.calendar.event[booking.booking_type]}</Typography>
          </Grid>
          {booking.booking_type === 'internal' && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" color="text.secondary">{dictionary.bookings.detail.labels.costCenter}</Typography>
              <Typography variant="body2">{booking.cost_center?.name ?? '-'}</Typography>
            </Grid>
          )}
          {booking.booking_type === 'external' && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" color="text.secondary">{dictionary.bookings.detail.labels.stakeholder}</Typography>
              <Typography variant="body2">{stakeholderName ?? '-'}</Typography>
            </Grid>
          )}
          <Grid size={12}>
            <Typography variant="caption" color="text.secondary">{dictionary.bookings.detail.labels.period}</Typography>
            <Typography variant="body2">
              {dayjs(booking.start_at).format('DD MMM YYYY HH:mm')} — {dayjs(booking.end_at).format('DD MMM YYYY HH:mm')}
            </Typography>
          </Grid>
          {booking.rate && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" color="text.secondary">{dictionary.bookings.detail.labels.rate}</Typography>
              <Typography variant="body2">{Number(booking.rate).toLocaleString()} {booking.currency?.code ?? ''}</Typography>
            </Grid>
          )}
          {booking.purpose && (
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">{dictionary.bookings.detail.labels.purpose}</Typography>
              <Typography variant="body2">{booking.purpose}</Typography>
            </Grid>
          )}
          {booking.status === 'cancelled' && booking.cancel_reason && (
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">{dictionary.bookings.cancelDialog.reasonLabel}</Typography>
              <Typography variant="body2">{booking.cancel_reason}</Typography>
            </Grid>
          )}
          {booking.sale_id && (
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">{dictionary.bookings.detail.labels.sale}</Typography>
              <Typography variant="body2">{dictionary.bookings.detail.help.billed} — #{booking.sale_id}</Typography>
            </Grid>
          )}

          {confirmingCancel && (
            <Grid size={12}>
              <Typography variant="body2" fontWeight={600}>{dictionary.bookings.cancelDialog.title}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>{dictionary.bookings.cancelDialog.content}</Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label={dictionary.bookings.cancelDialog.reasonLabel}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </Grid>
          )}

          {linkingSale && (
            <Grid size={12}>
              <Typography variant="body2" fontWeight={600}>{dictionary.bookings.linkSaleDialog.title}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>{dictionary.bookings.linkSaleDialog.help}</Typography>
              <Autocomplete
                size="small"
                loading={loadingLinkableSales}
                options={linkableSales}
                value={selectedSale}
                onChange={(_, newValue) => setSelectedSale(newValue)}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                getOptionLabel={(o: any) => `${o.saleNo} — ${dayjs(o.transaction_date).format('DD MMM YYYY')} — ${Number(o.amount).toLocaleString()}`}
                renderOption={(props, o: any) => {
                  const { key, ...rest } = props as any;
                  return (
                    <li key={key} {...rest}>
                      {o.has_billing_product === false ? '⚠️ ' : ''}
                      {o.saleNo} — {dayjs(o.transaction_date).format('DD MMM YYYY')} — {Number(o.amount).toLocaleString()}
                    </li>
                  );
                }}
                noOptionsText={loadingLinkableSales ? '...' : dictionary.bookings.linkSaleDialog.noSales}
                renderInput={(params) => (
                  <TextField {...params} label={dictionary.bookings.linkSaleDialog.saleIdLabel} />
                )}
              />
              {selectedSale && selectedSale.has_billing_product === false && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {dictionary.bookings.form.help.saleMissingBillingProduct}
                </Alert>
              )}
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap' }}>
        {confirmingCancel ? (
          <>
            <Button size="small" onClick={() => setConfirmingCancel(false)}>{dictionary.bookings.cancelDialog.dismiss}</Button>
            <LoadingButton
              size="small"
              color="error"
              variant="contained"
              loading={cancelBooking.isPending}
              onClick={() => cancelBooking.mutate({ id: booking.id, cancel_reason: cancelReason })}
            >
              {dictionary.bookings.cancelDialog.confirm}
            </LoadingButton>
          </>
        ) : linkingSale ? (
          <>
            <Button size="small" onClick={() => setLinkingSale(false)}>{dictionary.bookings.form.buttons.cancel}</Button>
            <LoadingButton
              size="small"
              variant="contained"
              disabled={!selectedSale}
              loading={linkSale.isPending}
              onClick={() => linkSale.mutate({ id: booking.id, sale_id: selectedSale.id })}
            >
              {dictionary.bookings.linkSaleDialog.confirm}
            </LoadingButton>
          </>
        ) : (
          <>
            <Button size="small" onClick={onClose}>{dictionary.bookings.detail.buttons.close}</Button>
            {booking.status === 'draft' && checkOrganizationPermission([PERMISSIONS.ASSET_BOOKINGS_DELETE]) && (
              <LoadingButton size="small" color="error" loading={deleteBooking.isPending} onClick={() => deleteBooking.mutate(booking)}>
                {dictionary.bookings.detail.buttons.delete}
              </LoadingButton>
            )}
            {booking.status !== 'cancelled' && booking.status !== 'completed' && checkOrganizationPermission([PERMISSIONS.ASSET_BOOKINGS_EDIT]) && (
              <Button size="small" onClick={onEdit}>{dictionary.bookings.detail.buttons.edit}</Button>
            )}
            {booking.status === 'draft' && checkOrganizationPermission([PERMISSIONS.ASSET_BOOKINGS_CONFIRM]) && (
              <LoadingButton size="small" variant="contained" loading={confirmBooking.isPending} onClick={() => confirmBooking.mutate(booking)}>
                {dictionary.bookings.detail.buttons.confirm}
              </LoadingButton>
            )}
            {(booking.status === 'confirmed' || booking.status === 'ongoing') && checkOrganizationPermission([PERMISSIONS.ASSET_BOOKINGS_EDIT]) && !booking.sale_id && (
              <Button size="small" variant="outlined" onClick={() => setLinkingSale(true)}>
                {dictionary.bookings.detail.buttons.linkSale}
              </Button>
            )}
            {booking.status === 'completed' && booking.sale_id && checkOrganizationPermission([PERMISSIONS.ASSET_BOOKINGS_EDIT]) && (
              <LoadingButton size="small" color="error" variant="outlined" loading={unlinkSale.isPending} onClick={() => unlinkSale.mutate(booking)}>
                {dictionary.bookings.detail.buttons.unlinkSale}
              </LoadingButton>
            )}
            {(booking.status === 'confirmed' || booking.status === 'ongoing') && checkOrganizationPermission([PERMISSIONS.ASSET_BOOKINGS_CANCEL]) && (
              <Button size="small" color="error" variant="contained" onClick={() => setConfirmingCancel(true)}>
                {dictionary.bookings.detail.buttons.cancel}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </>
  );
};

export default AssetBookingDetailDialog;
