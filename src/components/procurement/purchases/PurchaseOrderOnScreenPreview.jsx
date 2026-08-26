import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import AttachmentsAccordionGroup from '@/components/filesShelf/attachments/AttachmentsAccordionGroup';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { AttachmentOutlined } from '@mui/icons-material';
import {
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useRef } from 'react';

function PurchaseOrderOnScreenPreview({ order }) {
  const theme = useTheme();
  const attachmentsRef = useRef(null);
  const totalAttachmentsCount =
    (order.attachments_count || 0) + (order.requisition_attachments_count || 0);
  const currencyCode = order.currency?.code || order.currency?.name || 'N/A';
  const {
    checkOrganizationPermission,
    authOrganization: { organization },
  } = useJumboAuth();
  const mainColor = organization.settings?.main_color || '#2113AD';
  const headerColor =
    theme.type === 'dark'
      ? '#29f096'
      : organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';
  const withPrices = [
    PERMISSIONS.ACCOUNTS_REPORTS,
    PERMISSIONS.PURCHASES_CREATE,
    PERMISSIONS.APPROVED_REQUISITIONS_PURCHASE,
  ].some((perm) => checkOrganizationPermission([perm]));

  const vatAmount = order.purchase_order_items.reduce((total, item) => {
    return (total += item.rate * item.quantity * item.vat_percentage * 0.01);
  }, 0);

  const productsTotal = order.purchase_order_items.reduce((total, item) => {
    return total + Number(item.rate || 0) * Number(item.quantity || 0);
  }, 0);

  const additionalCosts = order.additional_costs || [];
  const totalAdditionalCosts = additionalCosts.reduce((total, cost) => {
    return total + Number(cost?.amount || 0);
  }, 0);

  const grandTotal = productsTotal + vatAmount + totalAdditionalCosts;

  const formatCurrency = (amount) => {
    return amount?.toLocaleString('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatNumber = (value) => {
    return value.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  };

  return (
    <>
      {/* Header Section */}
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
              PURCHASE ORDER
            </Typography>
            <Typography variant='h6' fontWeight='bold' gutterBottom>
              {order.orderNo}
            </Typography>
            {totalAttachmentsCount > 0 && (
              <Tooltip title='Jump to attachments'>
                <Chip
                  size='small'
                  variant='outlined'
                  color='info'
                  onClick={() =>
                    attachmentsRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                  }
                  icon={<AttachmentOutlined fontSize='small' />}
                  label={`Attachments (${totalAttachmentsCount})`}
                  sx={{ mt: 1 }}
                />
              </Tooltip>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Order Information */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 6, md: 4 }}>
          <Box>
            <Typography
              variant='subtitle2'
              sx={{ color: headerColor }}
              gutterBottom
            >
              Order Date
            </Typography>
            <Typography variant='body1'>
              {readableDate(order.order_date)}
            </Typography>
          </Box>
        </Grid>
        {order?.date_required && (
          <Grid size={{ xs: 6, sm: 6, md: 4 }}>
            <Box>
              <Typography
                variant='subtitle2'
                sx={{ color: headerColor }}
                gutterBottom
              >
                Date Required
              </Typography>
              <Typography variant='body1'>
                {readableDate(order.date_required)}
              </Typography>
            </Box>
          </Grid>
        )}
        {order?.cost_centers && (
          <Grid size={{ xs: 6, sm: 6, md: 4 }}>
            <Box>
              <Typography
                variant='subtitle2'
                sx={{ color: headerColor }}
                gutterBottom
              >
                Purchase For
              </Typography>
              <Typography variant='body1'>
                {order.cost_centers.map((cc) => cc.name).join(', ')}
              </Typography>
            </Box>
          </Grid>
        )}
        <Grid size={{ xs: 6, sm: 6, md: 4 }}>
          <Box>
            <Typography
              variant='subtitle2'
              sx={{ color: headerColor }}
              gutterBottom
            >
              Created By
            </Typography>
            <Typography variant='body1'>{order?.creator?.name}</Typography>
          </Box>
        </Grid>
        {(order?.reference || order?.requisitionNo) && (
          <Grid size={{ xs: 6, sm: 6, md: 4 }}>
            <Box>
              <Typography
                variant='subtitle2'
                sx={{ color: headerColor }}
                gutterBottom
              >
                Reference
              </Typography>
              <Typography variant='body1'>
                {order.reference || order.requisitionNo}
              </Typography>
            </Box>
          </Grid>
        )}
        <Grid size={{ xs: 6, sm: 6, md: 4 }}>
          <Box>
            <Typography
              variant='subtitle2'
              sx={{ color: headerColor }}
              gutterBottom
            >
              Currency
            </Typography>
            <Typography variant='body1'>{currencyCode}</Typography>
          </Box>
        </Grid>
        {order?.currency_id > 1 && (
          <Grid size={{ xs: 6, sm: 6, md: 4 }}>
            <Box>
              <Typography
                variant='subtitle2'
                sx={{ color: headerColor }}
                gutterBottom
              >
                Exchange Rate
              </Typography>
              <Typography variant='body1'>{order.exchange_rate}</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Supplier Information */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12}>
          <Box
            sx={{
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Typography
              variant='subtitle1'
              sx={{ color: headerColor, textAlign: 'center' }}
              gutterBottom
            >
              SUPPLIER
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant='body1' fontWeight='medium' textAlign='center'>
              {order.stakeholder.name}
            </Typography>
            {order.stakeholder?.address && (
              <Typography
                variant='body2'
                color='text.secondary'
                textAlign='center'
                sx={{ mt: 1 }}
              >
                {order.stakeholder.address}
              </Typography>
            )}
            <Grid
              container
              spacing={1}
              sx={{ mt: 1, justifyContent: 'center' }}
            >
              {order.stakeholder_id === null && (
                <Grid container size='auto' spacing={1}>
                  <Typography variant='body2' fontWeight='medium'>
                    Paid From:
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {order.paid_from.name}
                  </Typography>
                </Grid>
              )}
              {order.stakeholder?.tin && (
                <Grid container size='auto' spacing={1}>
                  <Typography variant='body2' fontWeight='medium'>
                    TIN:
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {order.stakeholder.tin}
                  </Typography>
                </Grid>
              )}
              {order.stakeholder?.vrn && (
                <Grid container size='auto' spacing={1}>
                  <Typography variant='body2' fontWeight='medium'>
                    VRN:
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {order.stakeholder.vrn}
                  </Typography>
                </Grid>
              )}
              {order.stakeholder?.phone && (
                <Grid container size='auto' spacing={1}>
                  <Typography variant='body2' fontWeight='medium'>
                    Phone:
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {order.stakeholder.phone}
                  </Typography>
                </Grid>
              )}
              {order.stakeholder?.email && (
                <Grid container size='auto' spacing={1}>
                  <Typography variant='body2' fontWeight='medium'>
                    Email:
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {order.stakeholder.email}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Grid>
      </Grid>

      {/* Items Section */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant='h6'
          sx={{
            color: headerColor,
            textAlign: 'center',
            mb: 2,
          }}
        >
          ORDER ITEMS
        </Typography>

        <TableContainer
          component={Paper}
          sx={{
            boxShadow: theme.shadows[2],
            '& .MuiTableRow-root:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    backgroundColor: mainColor,
                    color: contrastText,
                    fontSize: '0.875rem',
                  }}
                >
                  S/N
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: mainColor,
                    color: contrastText,
                    fontSize: '0.875rem',
                  }}
                >
                  Product/Service
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: mainColor,
                    color: contrastText,
                    fontSize: '0.875rem',
                  }}
                >
                  Unit
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: mainColor,
                    color: contrastText,
                    fontSize: '0.875rem',
                  }}
                  align='right'
                >
                  Quantity
                </TableCell>
                {withPrices && (
                  <>
                    <TableCell
                      sx={{
                        backgroundColor: mainColor,
                        color: contrastText,
                        fontSize: '0.875rem',
                      }}
                      align='right'
                    >
                      Price {vatAmount > 0 ? '(Excl.)' : ''}
                    </TableCell>
                    {vatAmount > 0 && (
                      <TableCell
                        sx={{
                          backgroundColor: mainColor,
                          color: contrastText,
                          fontSize: '0.875rem',
                        }}
                        align='right'
                      >
                        VAT
                      </TableCell>
                    )}
                    <TableCell
                      sx={{
                        backgroundColor: mainColor,
                        color: contrastText,
                        fontSize: '0.875rem',
                      }}
                      align='right'
                    >
                      Amount {vatAmount > 0 ? '(Incl.)' : ''}
                    </TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {order.purchase_order_items.map((orderItem, index) => (
                <TableRow
                  key={orderItem.id}
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    '&:nth-of-type(even)': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{orderItem.product.name}</TableCell>
                  <TableCell>{orderItem.measurement_unit.symbol}</TableCell>
                  <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                    {orderItem.quantity.toLocaleString()}
                  </TableCell>
                  {withPrices && (
                    <>
                      <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                        {formatNumber(orderItem.rate)}
                      </TableCell>
                      {vatAmount > 0 && (
                        <TableCell
                          align='right'
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {formatNumber(
                            orderItem.rate * orderItem.vat_percentage * 0.01
                          )}
                        </TableCell>
                      )}
                      <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                        {formatNumber(
                          orderItem.rate *
                            orderItem.quantity *
                            (1 + orderItem.vat_percentage * 0.01)
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Totals Section */}
      {withPrices && (
        <Box
          sx={{
            mt: 3,
            mb: 3,
            p: 2,
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
          }}
        >
          <Grid container spacing={1}>
            <Grid size={7}>
              <Typography variant='body1' fontWeight='medium'>
                Product Total
              </Typography>
            </Grid>
            <Grid size={5} sx={{ textAlign: 'right' }}>
              <Typography
                variant='body1'
                fontWeight='medium'
                fontFamily='monospace'
              >
                {formatCurrency(productsTotal)}
              </Typography>
            </Grid>

            {additionalCosts.map((cost, index) => {
              const costLabel =
                cost.credit_ledger_name ||
                cost.ledger?.name ||
                cost.name ||
                `Additional Cost ${index + 1}`;
              const costCurrency =
                cost.currency?.code || cost.currency_name || currencyCode || '';

              return (
                <React.Fragment
                  key={cost.id || cost.requisition_additional_cost_id || index}
                >
                  <Grid size={7}>
                    <Typography
                      variant='body1'
                      fontWeight='medium'
                      sx={{
                        whiteSpace: 'normal',
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word',
                      }}
                    >
                      {costLabel}
                    </Typography>
                  </Grid>
                  <Grid size={5} sx={{ textAlign: 'right' }}>
                    <Typography
                      variant='body1'
                      fontWeight='medium'
                      fontFamily='monospace'
                    >
                      {`${costCurrency} ${Number(cost.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`.trim()}
                    </Typography>
                  </Grid>
                </React.Fragment>
              );
            })}

            {(vatAmount > 0 || totalAdditionalCosts > 0) && (
              <>
                {vatAmount > 0 && (
                  <>
                    <Grid size={7}>
                      <Typography variant='body1' fontWeight='medium'>
                        VAT
                      </Typography>
                    </Grid>
                    <Grid size={5} sx={{ textAlign: 'right' }}>
                      <Typography
                        variant='body1'
                        fontWeight='medium'
                        fontFamily='monospace'
                      >
                        {formatCurrency(vatAmount)}
                      </Typography>
                    </Grid>
                  </>
                )}

                <Grid size={7}>
                  <Typography
                    variant='h6'
                    fontWeight='bold'
                    color={headerColor}
                  >
                    Grand Total
                  </Typography>
                </Grid>
                <Grid size={5} sx={{ textAlign: 'right' }}>
                  <Typography
                    variant='h6'
                    fontWeight='bold'
                    color={headerColor}
                    fontFamily='monospace'
                  >
                    {formatCurrency(grandTotal)}
                  </Typography>
                </Grid>
              </>
            )}

            {!vatAmount && !totalAdditionalCosts && (
              <>
                <Grid size={7}>
                  <Typography
                    variant='h6'
                    fontWeight='bold'
                    color={headerColor}
                  >
                    Total
                  </Typography>
                </Grid>
                <Grid size={5} sx={{ textAlign: 'right' }}>
                  <Typography
                    variant='h6'
                    fontWeight='bold'
                    color={headerColor}
                    fontFamily='monospace'
                  >
                    {formatCurrency(productsTotal)}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      )}

      {/* payment terms and remarks */}
      <Grid container rowSpacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          {order?.terms_of_payment && (
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box>
                <Typography
                  variant='subtitle2'
                  sx={{ color: headerColor }}
                  gutterBottom
                >
                  Payment Terms
                </Typography>
                <Typography variant='body1'>
                  {order?.terms_of_payment}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          {order?.remarks && (
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box>
                <Typography
                  variant='subtitle2'
                  sx={{ color: headerColor }}
                  gutterBottom
                >
                  Remarks
                </Typography>
                <Typography variant='body1'>{order?.remarks}</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* Closures */}
      {order.closures && order.closures.length > 0 && (
        <Box sx={{ mb: 3, mt: 3 }}>
          <Typography
            variant='h6'
            sx={{
              color: headerColor,
              textAlign: 'center',
              mb: 2,
            }}
          >
            Closing Details
          </Typography>

          <TableContainer
            component={Paper}
            sx={{
              boxShadow: theme.shadows[2],
              '& .MuiTableRow-root:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                  >
                    S/N
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                    align='right'
                  >
                    Date
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                  >
                    Done By
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                  >
                    Remarks
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.closures?.map((closure, index) => (
                  <TableRow
                    key={closure.id}
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      '&:nth-of-type(even)': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                      {readableDate(closure.datetime_closed, true)}
                    </TableCell>
                    <TableCell>{closure.creator.name}</TableCell>
                    <TableCell>{closure.closing_remarks ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Attachments */}
      <Box ref={attachmentsRef} sx={{ mb: 3, mt: 3, scrollMarginTop: 16 }}>
        <Typography
          variant='h6'
          sx={{
            color: headerColor,
            textAlign: 'center',
            mb: 2,
          }}
        >
          ATTACHMENTS
        </Typography>

        <AttachmentsAccordionGroup
          tabs={[
            {
              label: 'Purchase Order',
              attachmentable_type: 'purchase_order',
              attachmentable_id: order.id,
            },
            ...(order.requisition_id
              ? [
                  {
                    label: 'Requisition',
                    attachmentable_type: 'requisition',
                    attachmentable_id: order.requisition_id,
                    readOnly: true,
                  },
                ]
              : []),
          ]}
          defaultExpandedIndex={totalAttachmentsCount > 0 ? 0 : -1}
        />
      </Box>
    </>
  );
}

export default PurchaseOrderOnScreenPreview;
