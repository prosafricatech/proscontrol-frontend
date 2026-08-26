import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { AttachFileOutlined } from '@mui/icons-material';
import { Badge, Box, Divider, Grid, IconButton, Link, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { useRef } from 'react';

const money = (value: number = 0) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function PurchaseBillOnScreenPreview({ bill, organization }: { bill: any; organization: any }) {
  const theme = useTheme();
  // Theme-native primary color instead of the org's raw brand hex — the
  // brand color isn't guaranteed to contrast against a dark background,
  // while MUI's primary.main is already contrast-checked for both modes.
  const headerColor = theme.palette.primary.main;
  const attachmentsRef = useRef<HTMLDivElement>(null);

  if (!bill) return null;

  const sourceNo = bill.source?.orderNo || bill.source?.grnNo || '';
  const attachmentsCount = bill.attachments?.length || 0;

  return (
    <Box sx={{ padding: 2 }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12}>
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%',
            }}
          >
            {attachmentsCount > 0 && (
              <Tooltip title={`${attachmentsCount} attachment(s) from the Purchase Order / Requisition — scroll down to view`}>
                <IconButton
                  size='small'
                  onClick={() =>
                    attachmentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  sx={{ position: 'absolute', top: 0, right: 0 }}
                >
                  <Badge badgeContent={attachmentsCount} color='info'>
                    <AttachFileOutlined fontSize='small' />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}
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

      {!!bill.items?.length && (
        <Box sx={{ mb: 3 }}>
          <Typography variant='h6' sx={{ color: headerColor, textAlign: 'center', mb: 2 }}>
            ITEMS
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
                    Item
                  </th>
                  {bill.items.some((item: any) => item.quantity != null) && (
                    <>
                      <th style={{ padding: 8, border: `1px solid ${theme.palette.divider}` }}>Qty</th>
                      <th style={{ padding: 8, border: `1px solid ${theme.palette.divider}` }}>Rate</th>
                    </>
                  )}
                  <th style={{ padding: 8, border: `1px solid ${theme.palette.divider}` }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td style={{ padding: 8, border: `1px solid ${theme.palette.divider}` }}>
                      {item.product?.name || item.product?.item_name}
                    </td>
                    {bill.items.some((i: any) => i.quantity != null) && (
                      <>
                        <td style={{ padding: 8, border: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
                          {item.quantity ?? ''}
                        </td>
                        <td style={{ padding: 8, border: `1px solid ${theme.palette.divider}`, textAlign: 'right' }}>
                          {item.rate != null ? money(item.rate) : ''}
                        </td>
                      </>
                    )}
                    <td style={{ padding: 8, border: `1px solid ${theme.palette.divider}`, textAlign: 'right' }}>
                      {money(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      )}

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
      {!!bill.attachments?.length && (
        <Box sx={{ mt: 3 }} ref={attachmentsRef}>
          <Typography variant='h6' sx={{ color: headerColor, textAlign: 'center', mb: 2 }}>
            ATTACHMENTS
          </Typography>
          <Box
            sx={{
              p: 2,
              backgroundColor: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
            }}
          >
            <Stack spacing={1}>
              {bill.attachments.map((entry: any, index: number) => (
                <Stack key={index} direction='row' spacing={1} alignItems='center'>
                  <AttachFileOutlined fontSize='small' color='action' />
                  <Link href={entry.attachment?.full_path} target='_blank' rel='noopener noreferrer' underline='hover'>
                    {entry.attachment?.name}
                  </Link>
                  <Typography variant='caption' color='text.secondary'>
                    ({entry.source})
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default PurchaseBillOnScreenPreview;
