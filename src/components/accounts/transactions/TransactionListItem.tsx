import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import SaleInvoiceAdjustmentItemAction from '@/components/pos/counter/salesListItem/invoice/saleAdjustment/SaleInvoiceAdjustmentItemAction';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import JumboChipsGroup from '@jumbo/components/JumboChipsGroup/JumboChipsGroup';
import { Attachment } from '@mui/icons-material';
import {
  Badge,
  Box,
  Dialog,
  Grid,
  IconButton,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useState } from 'react';
import JournalItemAction from './journals/JournalItemAction';
import PaymentItemAction from './payments/PaymentItemAction';
import ReceiptItemAction from './receipts/ReceiptItemAction';
import TransferItemAction from './tranfers/TransferItemAction';
import { Transaction, TransactionTypes } from './TransactionTypes';

const attachmentableTypeFor = (transaction: Transaction) =>
  transaction.type === 'transfer' ? 'fund_transfer' : transaction.type;

function TransactionListItem({
  transaction,
  type,
}: {
  transaction: Transaction;
  type: TransactionTypes;
}) {
  const [attachDialog, setAttachDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const SecondaryAction = () => {
    if (type === 'payments') {
      return <PaymentItemAction transaction={transaction} />;
    } else if (type === 'receipts') {
      return <ReceiptItemAction transaction={transaction} />;
    } else if (type === 'transfers') {
      return <TransferItemAction transaction={transaction} />;
    } else if (type === 'journal_vouchers') {
      return <JournalItemAction transaction={transaction} />;
    } else if (type === 'debit' || type === 'credit') {
      return (
        <SaleInvoiceAdjustmentItemAction
          transaction={transaction}
          type={type}
        />
      );
    }
  };

  return (
    <Grid
      container
      columnSpacing={2}
      sx={{
        cursor: 'pointer',
        borderTop: 1,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        padding: 1,
      }}
      alignItems={'center'}
    >
      <Grid size={{ xs: 6, md: 3, lg: 2 }}>
        <ListItemText
          primary={
            <Tooltip title={'Date'}>
              <Typography
                variant={'h5'}
                lineHeight={1.25}
                mb={0}
                noWrap
                component='span'
              >
                {readableDate(transaction.transaction_date)}
              </Typography>
            </Tooltip>
          }
        />
      </Grid>

      <Grid size={{ xs: 6, md: 3, lg: 2 }}>
        <ListItemText
          primary={
            <Stack direction='row'>
              <Tooltip title='Voucher Number'>
                <Typography
                  variant='h5'
                  fontSize={14}
                  lineHeight={1.25}
                  mb={0}
                  noWrap
                  component='span'
                >
                  {transaction.voucherNo}
                </Typography>
              </Tooltip>
              {!!transaction?.requisitionNo && (
                <Tooltip title='Requisition No.'>
                  <Typography variant='caption' color='gray' component='span'>
                    &nbsp;{` - ${transaction.requisitionNo}`}
                  </Typography>
                </Tooltip>
              )}
            </Stack>
          }
          secondary={
            <Tooltip title='Reference'>
              <Typography
                variant='h5'
                fontSize={14}
                lineHeight={1.25}
                mb={0}
                component='span'
              >
                {transaction.reference}
              </Typography>
            </Tooltip>
          }
        />
      </Grid>

      <Grid size={{ xs: 6, md: 6, lg: 2.5 }}>
        <ListItemText
          primary={
            <JumboChipsGroup
              chips={transaction.cost_centers}
              mapKeys={{ label: 'name' }}
              spacing={1}
              size={'small'}
              max={3}
              title='Cost Centers'
            />
          }
        />
      </Grid>

      <Grid
        size={{ xs: 6, md: 6, lg: 3 }}
        display={'flex'}
        alignItems={'center'}
      >
        <ListItemText
          secondary={
            <Tooltip title={'Narration'}>
              <Typography component={'span'} lineHeight={1.25} mb={0}>
                {transaction.narration}
              </Typography>
            </Tooltip>
          }
        />
      </Grid>

      <Grid
        size={{ xs: 9, md: 4, lg: 1.5 }}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <Tooltip title={'Amount'}>
          <Box sx={{ marginRight: 1 }}>
            <Typography
              variant={'h5'}
              fontSize={14}
              lineHeight={1.25}
              mb={0}
              noWrap
              component='span'
            >
              {transaction.amount?.toLocaleString('en-US', {
                style: 'currency',
                currency: transaction.currency.code,
              })}
            </Typography>
          </Box>
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 2, md: 1, lg: 0.5 }}>
        {(type === 'payments' ||
          type === 'receipts' ||
          type === 'transfers' ||
          type === 'journal_vouchers') && (
          <Tooltip title='Attachments'>
            <IconButton
              size='small'
              onClick={(event) => {
                event.stopPropagation();
                setAttachDialog(true);
              }}
            >
              <Badge badgeContent={transaction.attachments_count} color='info'>
                <Attachment fontSize='small' />
              </Badge>
            </IconButton>
          </Tooltip>
        )}
      </Grid>
      <Grid size={{ xs: 1, md: 1, lg: 0.5 }}>
        <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'}>
          <SecondaryAction />
        </Box>
      </Grid>

      <Dialog
        open={attachDialog}
        onClose={() => setAttachDialog(false)}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth='md'
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        {attachDialog && (
          <AttachmentForm
            setAttachDialog={setAttachDialog}
            attachment_sourceNo={transaction.voucherNo}
            attachment_name={'Transaction'}
            attachmentable_type={attachmentableTypeFor(transaction)}
            attachmentable_id={transaction.id}
          />
        )}
      </Dialog>
    </Grid>
  );
}

export default TransactionListItem;
