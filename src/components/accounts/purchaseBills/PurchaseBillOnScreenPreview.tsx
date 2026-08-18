import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Box, Divider, Grid, Typography, useTheme } from '@mui/material';

const money = (value: number = 0) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function PurchaseBillOnScreenPreview({ bill, organization }: { bill: any; organization: any }) {
  const theme = useTheme();
  // Theme-native primary color instead of the org's raw brand hex — the
  // brand color isn't guaranteed to contrast against a dark background,
  // while MUI's primary.main is already contrast-checked for both modes.
  const headerColor = theme.palette.primary.main;

  if (!bill) return null;

  const sourceNo = bill.source?.orderNo || bill.source?.grnNo || '';

  return (
    <Box sx={{ padding: 2 }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%',
            }}
          >
            <Typography variant='h4' sx={{ color: headerColor }} gutterBottom>
              PURCHASE BILL
            </Typography>
            <Typography variant='h6' fontWeight='bold' gutterBottom>
              {bill.invoiceNo}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography variant='subtitle2' color='text.secondary' gutterBottom>
            Bill Date
          </Typography>
          <Typography variant='body1'>{readableDate(bill.transaction_date)}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography variant='subtitle2' color='text.secondary' gutterBottom>
            Supplier
          </Typography>
          <Typography variant='body1'>{bill.stakeholder?.name}</Typography>
        </Grid>
        {sourceNo && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant='subtitle2' color='text.secondary' gutterBottom>
              Source Document
            </Typography>
            <Typography variant='body1'>{sourceNo}</Typography>
          </Grid>
        )}
        {bill.internal_reference && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant='subtitle2' color='text.secondary' gutterBottom>
              Internal Reference
            </Typography>
            <Typography variant='body1'>{bill.internal_reference}</Typography>
          </Grid>
        )}
        {bill.supplier_reference && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant='subtitle2' color='text.secondary' gutterBottom>
              Supplier Reference
            </Typography>
            <Typography variant='body1'>{bill.supplier_reference}</Typography>
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography variant='subtitle2' color='text.secondary' gutterBottom>
            Prepared By
          </Typography>
          <Typography variant='body1'>{bill.creator?.name}</Typography>
        </Grid>
      </Grid>

      {!!bill.adjustments?.length && (
        <Box sx={{ mb: 3 }}>
          <Typography variant='h6' sx={{ color: headerColor, textAlign: 'center', mb: 2 }}>
            ADJUSTMENTS
          </Typography>
          <Box
            sx={{
              p: 2,
              backgroundColor: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: theme.palette.action.hover }}>
                  <th style={{ padding: 8, border: `1px solid ${theme.palette.divider}`, textAlign: 'left' }}>
                    Ledger
                  </th>
                  <th style={{ padding: 8, border: `1px solid ${theme.palette.divider}`, textAlign: 'left' }}>
                    Description
                  </th>
                  <th style={{ padding: 8, border: `1px solid ${theme.palette.divider}` }}>Type</th>
                  <th style={{ padding: 8, border: `1px solid ${theme.palette.divider}` }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.adjustments.map((adjustment: any) => (
                  <tr key={adjustment.id}>
                    <td style={{ padding: 8, border: `1px solid ${theme.palette.divider}` }}>
                      {adjustment.complement_ledger?.name}
                    </td>
                    <td style={{ padding: 8, border: `1px solid ${theme.palette.divider}` }}>
                      {adjustment.description}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        border: `1px solid ${theme.palette.divider}`,
                        textAlign: 'center',
                        textTransform: 'capitalize',
                      }}
                    >
                      {adjustment.type}
                    </td>
                    <td style={{ padding: 8, border: `1px solid ${theme.palette.divider}`, textAlign: 'right' }}>
                      {adjustment.type === 'deduction' ? '-' : '+'}
                      {money(adjustment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          p: 2,
          backgroundColor: theme.palette.background.default,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
        }}
      >
        <Grid container rowSpacing={0.5}>
          <Grid size={8}>
            <Typography variant='body1'>Goods/Services Amount</Typography>
          </Grid>
          <Grid size={4} textAlign='right'>
            <Typography variant='body1'>{money(bill.amount)}</Typography>
          </Grid>

          {!!bill.vat_amount && (
            <>
              <Grid size={8}>
                <Typography variant='body1'>VAT</Typography>
              </Grid>
              <Grid size={4} textAlign='right'>
                <Typography variant='body1'>{money(bill.vat_amount)}</Typography>
              </Grid>
            </>
          )}

          <Grid size={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid size={8}>
            <Typography variant='h6' fontWeight='bold' color={headerColor}>
              Net Payable to Supplier
            </Typography>
          </Grid>
          <Grid size={4} textAlign='right'>
            <Typography variant='h6' fontWeight='bold' color={headerColor}>
              {money(bill.net_amount)}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {bill.narration && (
        <Box sx={{ mt: 3 }}>
          <Typography variant='h6' sx={{ color: headerColor, textAlign: 'center', mb: 2 }}>
            NARRATION
          </Typography>
          <Box
            sx={{
              p: 2,
              backgroundColor: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            <Typography variant='body1' sx={{ lineHeight: 1.5 }}>
              {bill.narration}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default PurchaseBillOnScreenPreview;
