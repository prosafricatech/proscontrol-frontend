import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React from 'react';
import requisitionsServices from '../../../requisitionsServices';
import { MaterialApprovalRequisition } from '../../ApprovalRequisitionType';

interface ApprovedIssueFormProps {
  toggleOpen: (open: boolean) => void;
  approvedDetails: any;
  approvedRequisition: MaterialApprovalRequisition;
}

function ApprovedIssueForm({
  toggleOpen,
  approvedDetails,
  approvedRequisition,
}: ApprovedIssueFormProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [issueDate, setIssueDate] = React.useState<Dayjs | null>(dayjs());
  const [reference, setReference] = React.useState('');
  const [narration, setNarration] = React.useState('');

  const stockItems = React.useMemo(() => {
    const items = Array.isArray(approvedDetails?.items)
      ? approvedDetails.items
      : Array.isArray(approvedDetails?.data?.items)
        ? approvedDetails.data.items
        : [];

    return items
      .filter(
        (item: any) =>
          String(item?.fulfillment_type || '').toUpperCase() === 'STOCK' &&
          Number(item?.unissued_quantity || 0) > 0
      )
      .map((item: any) => ({
        ...item,
        product: item?.product,
        issue_quantity: Number(item?.unissued_quantity || 0),
        // 'consume' expenses the stock to the requesting cost center (today's
        // only option); 'transfer' sends it to another store instead — for a
        // requester who runs their own store, so it lands there as stock.
        issue_type: 'consume' as 'consume' | 'transfer',
        destination_store: null as { id: number; name: string } | null,
      }));
  }, [approvedDetails]);

  const [items, setItems] = React.useState<any[]>(stockItems);
  console.log(items, 'items')

  React.useEffect(() => {
    setItems(stockItems);
  }, [stockItems]);

  const issueMutation = useMutation({
    mutationFn: (payload: any) =>
      requisitionsServices.issueApprovedItems(approvedRequisition.id, payload),
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Items issued successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({
        queryKey: ['approvedIssues', { id: approvedRequisition.id }],
      });
      queryClient.invalidateQueries({ queryKey: ['approvedRequisitions'] });
      queryClient.invalidateQueries({
        queryKey: ['requisitionDetails', { id: approvedRequisition.id }],
      });
      toggleOpen(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to issue approved items',
        { variant: 'error' }
      );
    },
  });

  const handleSubmit = () => {
    const itemsToIssue = items.filter(
      (item) => Number(item?.issue_quantity || 0) > 0
    );

    if (itemsToIssue.length === 0) {
      enqueueSnackbar('Enter at least one issue quantity greater than 0', {
        variant: 'warning',
      });
      return;
    }

    const invalidItem = items.find(
      (item) =>
        Number(item?.issue_quantity || 0) > Number(item?.unissued_quantity || 0)
    );

    if (invalidItem) {
      enqueueSnackbar(
        `Issue quantity for ${invalidItem?.product?.name || 'selected item'} exceeds unissued quantity`,
        { variant: 'error' }
      );
      return;
    }

    const missingDestination = itemsToIssue.find(
      (item) => item.issue_type === 'transfer' && !item.destination_store?.id
    );

    if (missingDestination) {
      enqueueSnackbar(
        `Select a destination store for ${missingDestination?.product?.name || 'the selected item'}`,
        { variant: 'error' }
      );
      return;
    }

    const payloadItems = itemsToIssue.map((item) => ({
      requisition_approval_product_item_id: Number(item.id),
      quantity: Number(item.issue_quantity || 0),
      issue_type: item.issue_type,
      destination_store_id:
        item.issue_type === 'transfer' ? item.destination_store?.id : undefined,
    }));

    issueMutation.mutate({
      issue_date: issueDate ? issueDate.toISOString() : dayjs().toISOString(),
      narration: narration || undefined,
      reference: reference || undefined,
      items: payloadItems,
    });
  };

  return (
    <>
      <DialogTitle textAlign={'center'}>Issue Stock Items</DialogTitle>
      <DialogContent>
        {items.length === 0 ? (
          <Alert variant='outlined' severity='info'>
            No stock lines with remaining unissued quantity.
          </Alert>
        ) : (
          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <DateTimePicker
                label='Issue Date'
                value={issueDate}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
                onChange={(newValue) => setIssueDate(newValue)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label='Reference'
                size='small'
                fullWidth
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label='Narration'
                size='small'
                fullWidth
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
            </Grid>

            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                <Grid size={12}>
                  <Divider/>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant='body2'>
                    {index + 1}.{' '}
                    {item?.product?.name}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant='caption'>
                    Unissued:{' '}
                    {Number(item?.unissued_quantity || 0).toLocaleString()}{' '}
                    {item?.measurement_unit?.symbol || ''}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label='Issue Quantity'
                    fullWidth
                    size='small'
                    value={Number(item?.issue_quantity || 0).toLocaleString()}
                    InputProps={{
                      inputComponent: CommaSeparatedField,
                    }}
                    onChange={(e) => {
                      const nextValue = sanitizedNumber(e.target.value) || 0;
                      setItems((prev) => {
                        const next = [...prev];
                        next[index] = {
                          ...next[index],
                          issue_quantity: nextValue,
                        };
                        return next;
                      });
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    label='Issue As'
                    fullWidth
                    size='small'
                    value={item.issue_type}
                    onChange={(e) => {
                      const nextType = e.target.value as 'consume' | 'transfer';
                      setItems((prev) => {
                        const next = [...prev];
                        next[index] = {
                          ...next[index],
                          issue_type: nextType,
                          destination_store:
                            nextType === 'consume'
                              ? null
                              : next[index].destination_store,
                        };
                        return next;
                      });
                    }}
                  >
                    <MenuItem value='consume'>
                      Consume (expense to requester)
                    </MenuItem>
                    <MenuItem value='transfer'>
                      Transfer to another store
                    </MenuItem>
                  </TextField>
                </Grid>
                {item.issue_type === 'transfer' && (
                  <Grid size={{ xs: 12, md: 4 }}>
                    <StoreSelector
                      label='Destination Store'
                      multiple={false}
                      defaultValue={item.destination_store}
                      excludeStores={
                        (item?.store?.id ? [item.store.id] : null) as any
                      }
                      onChange={(store: any) => {
                        setItems((prev) => {
                          const next = [...prev];
                          next[index] = {
                            ...next[index],
                            destination_store: store,
                          };
                          return next;
                        });
                      }}
                    />
                  </Grid>
                )}
              </React.Fragment>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={issueMutation.isPending}
          size='small'
          variant='contained'
          color='success'
          onClick={handleSubmit}
          disabled={items.length === 0}
        >
          Issue
        </LoadingButton>
      </DialogActions>
    </>
  );
}

export default ApprovedIssueForm;
