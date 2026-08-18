'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Grid, ListItemText, Tooltip, Typography } from '@mui/material';
import PurchaseBillItemAction from './PurchaseBillItemAction';
import { PurchaseBill } from './PurchaseBillType';

function PurchaseBillListItem({ purchaseBill }: { purchaseBill: PurchaseBill }) {
  const sourceNo = purchaseBill.source?.orderNo || purchaseBill.source?.grnNo || '';

  return (
    <Grid
      container
      columnSpacing={2}
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        padding: 1,
      }}
      alignItems='center'
    >
      <Grid size={{ xs: 6, md: 2, lg: 1.5 }}>
        <ListItemText
          primary={
            <Tooltip title='Bill Date'>
              <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap component='span'>
                {readableDate(purchaseBill.transaction_date)}
              </Typography>
            </Tooltip>
          }
        />
      </Grid>

      <Grid size={{ xs: 6, md: 2, lg: 1.5 }}>
        <ListItemText
          primary={
            <Tooltip title='Bill No.'>
              <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap component='span'>
                {purchaseBill.invoiceNo}
              </Typography>
            </Tooltip>
          }
          secondary={
            sourceNo ? (
              <Tooltip title='Source Document'>
                <Typography variant='caption' color='gray' component='span'>
                  {sourceNo}
                </Typography>
              </Tooltip>
            ) : null
          }
        />
      </Grid>

      <Grid size={{ xs: 12, md: 3, lg: 2.5 }}>
        <ListItemText
          primary={
            <Tooltip title='Supplier'>
              <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap component='span'>
                {purchaseBill.stakeholder?.name}
              </Typography>
            </Tooltip>
          }
        />
      </Grid>

      <Grid size={{ xs: 12, md: 3, lg: 3 }}>
        <ListItemText
          secondary={
            <Tooltip title='Internal / Supplier Reference'>
              <Typography component='span' fontSize={14} lineHeight={1.25} mb={0} noWrap>
                {[purchaseBill.internal_reference, purchaseBill.supplier_reference]
                  .filter(Boolean)
                  .join(' / ')}
              </Typography>
            </Tooltip>
          }
        />
      </Grid>

      <Grid size={{ xs: 10, md: 4, lg: 2.5 }} display='flex' justifyContent='flex-end'>
        <ListItemText
          primary={
            <Tooltip title='Net Payable'>
              <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap component='span'>
                {purchaseBill.net_amount?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Typography>
            </Tooltip>
          }
        />
      </Grid>

      <Grid size={{ xs: 2, md: 2, lg: 1 }} display='flex' justifyContent='flex-end'>
        <PurchaseBillItemAction purchaseBill={purchaseBill} />
      </Grid>
    </Grid>
  );
}

export default PurchaseBillListItem;
