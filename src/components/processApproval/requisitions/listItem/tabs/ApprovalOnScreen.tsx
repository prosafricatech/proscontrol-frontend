import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import purchaseServices from '@/components/procurement/purchases/purchase-services';
import CertificateOnScreen from '@/components/projectManagement/projects/profile/subcontracts/tabs/certificatesTab/preview/CertificateOnScreen';
import projectsServices from '@/components/projectManagement/projects/project-services.js';
import { Organization } from '@/types/auth-types';
import purchaseBillServices from '@/components/procurement/grns/purchaseBill-services';
import PurchaseBillOnScreenPreview from '@/components/accounts/purchaseBills/PurchaseBillOnScreenPreview';
import { VisibilityOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  Grid,
  IconButton,
  LinearProgress,
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
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  Approval,
  Requisition,
  RequisitionItem,
} from '../../../RequisitionType';
import RelatableOrderDetails from './form/RelatableOrderDetails';

interface FetchRelatableDetailsProps {
  approval: Approval;
  relatable: {
    id: string;
  } | null;
  toggleOpen: (open: boolean) => void;
}

interface ApprovalOnScreenProps {
  approval: Approval;
  organization: Organization;
  belowLargeScreen: boolean;
  requisition: Requisition;
}

const FetchRelatableDetails = ({
  relatable,
  toggleOpen,
}: FetchRelatableDetailsProps) => {
  const { authOrganization } = useJumboAuth();
  if (!relatable) return null;

  // If relatable has order_date, treat as purchase order
  if ('order_date' in relatable && relatable.order_date) {
    const { data: orderDetails, isFetching } = useQuery({
      queryKey: ['purchaseOrder', { id: relatable?.id }],
      queryFn: async () => purchaseServices.orderDetails(relatable?.id),
    });
    if (isFetching) {
      return <LinearProgress />;
    }
    return (
      <RelatableOrderDetails order={orderDetails} toggleOpen={toggleOpen} />
    );
  }

  // If relatable has certificateNo, treat as certificate
  if ('certificateNo' in relatable && relatable.certificateNo) {
    const { data: certificateDetails, isFetching } = useQuery({
      queryKey: ['subcontractCertificate', relatable?.id],
      queryFn: () => projectsServices.getCertificateDetails(relatable?.id),
    });
    if (isFetching) {
      return <LinearProgress />;
    }
    return (
      <>
        <CertificateOnScreen
          isFromProcessApproval={true}
          certificate={certificateDetails}
          organization={authOrganization?.organization as Organization}
        />
        <DialogActions sx={{ pb: 2 }}>
          <Button
            variant='outlined'
            size='small'
            color='primary'
            onClick={() => toggleOpen(false)}
          >
            Close
          </Button>
        </DialogActions>
      </>
    );
  }

  // If relatable has invoiceNo, treat as a Bill (Supplier Invoice)
  if ('invoiceNo' in relatable && (relatable as any).invoiceNo) {
    const { data: billDetails, isFetching } = useQuery({
      queryKey: ['purchase-bill-details', relatable?.id],
      queryFn: () => purchaseBillServices.details(relatable?.id),
    });
    if (isFetching) {
      return <LinearProgress />;
    }
    return (
      <>
        <PurchaseBillOnScreenPreview
          bill={billDetails}
          organization={authOrganization?.organization}
        />
        <DialogActions sx={{ pb: 2 }}>
          <Button
            variant='outlined'
            size='small'
            color='primary'
            onClick={() => toggleOpen(false)}
          >
            Close
          </Button>
        </DialogActions>
      </>
    );
  }

  return null;
};

function ApprovalOnScreen({
  approval,
  organization,
  belowLargeScreen,
  requisition,
}: ApprovalOnScreenProps) {
  const theme = useTheme();
  const [selectedRelated, setSelectedRelated] = useState<any>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);

  const mainColor = organization.settings?.main_color || '#2113AD';
  const headerColor =
    theme.palette.mode === 'dark'
      ? '#29f096'
      : organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const isMaterial =
    approval.requisition?.process_type?.toLowerCase() === 'material';
  const isPurchase =
    approval.requisition?.process_type?.toLowerCase() === 'purchase';
  const isImprest =
    approval.requisition?.process_type?.toLowerCase() === 'imprest';
  const additionalCosts = isPurchase
    ? (((approval as any).additional_costs ||
        (approval.requisition as any)?.additional_costs ||
        []) as any[])
    : [];
  const totalAdditionalCosts =
    additionalCosts.reduce(
      (total: number, cost: any) => total + Number(cost?.amount || 0),
      0
    ) || 0;
  const totalVAT =
    approval.items
      ?.filter((item: RequisitionItem) => (item.vat_percentage ?? 0) > 0)
      .reduce(
        (total: number, item: RequisitionItem) =>
          total + item.rate * item.quantity * (item.vat_percentage ?? 0) * 0.01,
        0
      ) || 0;

  const subtotal =
    approval?.items?.reduce(
      (total, item) => total + (item.quantity || 0) * (item.rate || 0),
      0
    ) || 0;

  const grandTotal = subtotal + totalVAT + totalAdditionalCosts;

  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString('en-US', {
      style: 'currency',
      currency: approval.requisition?.currency?.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <>
      <Box sx={{ padding: 2 }}>
        <Grid container spacing={2}>
          {/* Header Section */}
          <Grid size={12} sx={{ mb: 3 }}>
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
              <Typography variant='h4' sx={{ color: headerColor }}>
                {isMaterial
                  ? 'Material Requisition Approval'
                  : isPurchase
                    ? 'Purchase Requisition Approval'
                    : isImprest
                      ? 'Imprest Requisition Approval'
                      : 'Payment Requisition Approval'}
              </Typography>
              <Typography variant='h6'>
                {approval.requisition?.requisitionNo}
              </Typography>
            </Box>
          </Grid>

          {approval.status?.toLowerCase() === 'rejected' && (
            <Grid size={12}>
              <Alert severity='error' variant='filled'>
                {approval.status_label || 'Rejected'}
              </Alert>
            </Grid>
          )}

          {approval.status?.toLowerCase() === 'returned' && (
            <Grid size={12}>
              <Alert severity='warning' variant='filled'>
                {approval.status_label || 'Returned'}
              </Alert>
            </Grid>
          )}

          {/* Approval Information */}
          <Grid container spacing={2} sx={{ mb: 3 }} width={'100%'}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary'>
                  Approval Date
                </Typography>
                <Typography variant='body1'>
                  {readableDate(approval.approval_date)}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary'>
                  Date Required
                </Typography>
                <Typography variant='body1'>
                  {approval.requisition?.date_required
                    ? readableDate(approval.requisition.date_required)
                    : '-'}
                </Typography>
              </Box>
            </Grid>
            {requisition?.cost_center.name && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Cost Center
                  </Typography>
                  <Typography variant='body1'>
                    {requisition?.cost_center.name}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          {/* Items Table */}
          <Grid size={12}>
            <>
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
                        {isPurchase || isMaterial ? 'Product' : 'Ledger'}
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
                      <TableCell
                        sx={{
                          backgroundColor: mainColor,
                          color: contrastText,
                          fontSize: '0.875rem',
                        }}
                        align='right'
                      >
                        Rate
                      </TableCell>
                      {isPurchase && approval.vat_amount > 0 && (
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
                        Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {approval?.items?.map(
                      (item: RequisitionItem, index: number) => {
                        const isCreditItem =
                          item.credit_ledger_id !== null &&
                          item.credit_ledger_id !== undefined;
                        const mainLedgerName =
                          isPurchase || isMaterial
                            ? item.requisition_product?.product?.name
                            : item.requisition_ledger_item?.ledger?.name;
                        const creditLedgerName = item.credit_ledger?.name;

                        return (
                          <React.Fragment key={item.id}>
                            <TableRow
                              sx={{
                                backgroundColor: theme.palette.background.paper,
                                '&:nth-of-type(even)': {
                                  backgroundColor: theme.palette.action.hover,
                                },
                              }}
                            >
                              <TableCell>{index + 1}.</TableCell>
                              <TableCell>
                                <Box>
                                  <Typography variant='body2'>
                                    {mainLedgerName}
                                  </Typography>
                                  {isCreditItem && creditLedgerName && (
                                    <Tooltip
                                      title={`Split to: ${creditLedgerName}`}
                                      placement='top'
                                      arrow
                                    >
                                      <Typography
                                        variant='caption'
                                        color='text.secondary'
                                        sx={{
                                          display: 'block',
                                          mt: 0.5,
                                          cursor: 'help',
                                          '&:hover': {
                                            color: 'primary.main',
                                          },
                                        }}
                                      >
                                        ({creditLedgerName})
                                      </Typography>
                                    </Tooltip>
                                  )}
                                  {item.remarks && (
                                    <Typography
                                      variant='body2'
                                      color='text.secondary'
                                      sx={{ fontSize: '0.875rem', mt: 0.5 }}
                                    >
                                      ({item.remarks})
                                    </Typography>
                                  )}
                                  {!!item.relatable && (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mt: 0.5,
                                      }}
                                    >
                                      <Tooltip title='Related to'>
                                        <Typography
                                          variant='body2'
                                          component='span'
                                          color='primary.main'
                                        >
                                          {item.relatableNo ||
                                            readableDate(
                                              item.relatable?.certificate_date,
                                              false
                                            )}
                                        </Typography>
                                      </Tooltip>
                                      <Tooltip
                                        title={`View ${
                                          item?.relatable_type === 'purchase'
                                            ? 'Purchase Order'
                                            : item?.relatable_type === 'bill'
                                              ? 'Bill'
                                              : 'Certificate'
                                        }`}
                                      >
                                        <IconButton
                                          size='small'
                                          onClick={() => {
                                            setSelectedRelated(item.relatable);
                                            setOpenViewDialog(true);
                                          }}
                                          sx={{
                                            color: 'primary.main',
                                            '&:hover': {
                                              backgroundColor:
                                                'rgba(25, 118, 210, 0.04)',
                                            },
                                          }}
                                        >
                                          <VisibilityOutlined fontSize='small' />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell
                                align='right'
                                sx={{ fontFamily: 'monospace' }}
                              >
                                {`${item.quantity?.toLocaleString()} ${item.measurement_unit?.symbol || item.requisition_ledger_item?.measurement_unit?.symbol}`}
                              </TableCell>
                              <TableCell
                                align='right'
                                sx={{ fontFamily: 'monospace' }}
                              >
                                {formatNumber(item.rate)}
                              </TableCell>
                              {isPurchase && approval.vat_amount > 0 && (
                                <TableCell
                                  align='right'
                                  sx={{ fontFamily: 'monospace' }}
                                >
                                  {formatNumber(
                                    item.rate *
                                      (item.vat_percentage ?? 0) *
                                      0.01
                                  )}
                                </TableCell>
                              )}
                              <TableCell
                                align='right'
                                sx={{ fontFamily: 'monospace' }}
                              >
                                {formatCurrency(
                                  item.quantity *
                                    item.rate *
                                    (1 + (item.vat_percentage ?? 0) * 0.01)
                                )}
                              </TableCell>
                            </TableRow>

                            {/* Vendors Section */}
                            {Array.isArray(item?.vendors) &&
                              item.vendors.length > 0 && (
                                <React.Fragment>
                                  <TableRow>
                                    <TableCell
                                      colSpan={
                                        isPurchase && approval.vat_amount > 0
                                          ? 6
                                          : 5
                                      }
                                      sx={{
                                        textAlign: 'center',
                                        backgroundColor:
                                          theme.palette.background.default,
                                        fontSize: '0.875rem',
                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                      }}
                                    >
                                      Vendors
                                    </TableCell>
                                  </TableRow>
                                  {item.vendors?.map((vendor, i) => (
                                    <TableRow
                                      key={vendor.id}
                                      sx={{
                                        backgroundColor:
                                          theme.palette.background.paper,
                                        '&:nth-of-type(even)': {
                                          backgroundColor:
                                            theme.palette.action.hover,
                                        },
                                      }}
                                    >
                                      <TableCell colSpan={2}>
                                        {vendor.name}
                                      </TableCell>
                                      <TableCell
                                        colSpan={
                                          isPurchase && approval.vat_amount > 0
                                            ? 4
                                            : 3
                                        }
                                      >
                                        {vendor.remarks}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </React.Fragment>
                              )}
                          </React.Fragment>
                        );
                      }
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          </Grid>

          {/* Totals Section */}
          <Grid size={12}>
            <Box
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
              }}
            >
              <Grid container spacing={1}>
                <>
                  <Grid size={7}>
                    <Typography variant='body1'>Total</Typography>
                  </Grid>
                  <Grid size={5} sx={{ textAlign: 'right' }}>
                    <Typography variant='body1' fontFamily='monospace'>
                      {formatCurrency(subtotal)}
                    </Typography>
                  </Grid>

                  {isPurchase &&
                    additionalCosts.map((cost: any, index: number) => {
                      const costLabel =
                        cost.credit_ledger_name ||
                        cost.ledger?.name ||
                        cost.name ||
                        `Additional Cost ${index + 1}`;
                      const currencyCode =
                        cost.currency?.code ||
                        cost.currency_name ||
                        approval.requisition?.currency?.code ||
                        '';
                      return (
                        <React.Fragment
                          key={
                            cost.id ||
                            cost.requisition_additional_cost_id ||
                            index
                          }
                        >
                          <Grid size={7}>
                            <Typography
                              variant='body1'
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
                            <Typography variant='body1' fontFamily='monospace'>
                              {`${currencyCode} ${Number(cost.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`.trim()}
                            </Typography>
                          </Grid>
                        </React.Fragment>
                      );
                    })}

                  {isPurchase && (totalVAT > 0 || totalAdditionalCosts > 0) && (
                    <>
                      {totalVAT > 0 && (
                        <>
                          <Grid size={7}>
                            <Typography variant='body1'>VAT</Typography>
                          </Grid>
                          <Grid size={5} sx={{ textAlign: 'right' }}>
                            <Typography variant='body1' fontFamily='monospace'>
                              {formatCurrency(totalVAT)}
                            </Typography>
                          </Grid>
                        </>
                      )}
                      <Grid size={7}>
                        <Typography variant='h6' color={headerColor}>
                          Grand Total
                        </Typography>
                      </Grid>
                      <Grid size={5} sx={{ textAlign: 'right' }}>
                        <Typography
                          variant='h6'
                          color={headerColor}
                          fontFamily='monospace'
                        >
                          {formatCurrency(grandTotal ?? 0)}
                        </Typography>
                      </Grid>
                    </>
                  )}

                  {!isPurchase && (
                    <>
                      <Grid size={7}>
                        <Typography variant='h6' color={headerColor}>
                          Total
                        </Typography>
                      </Grid>
                      <Grid size={5} sx={{ textAlign: 'right' }}>
                        <Typography
                          variant='h6'
                          color={headerColor}
                          fontFamily='monospace'
                        >
                          {formatCurrency(subtotal)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </>
              </Grid>
            </Box>
          </Grid>

          {/* Remarks Section */}
          {approval.remarks && (
            <Grid size={12} sx={{ mt: 2 }}>
              <Typography variant='subtitle2' color='text.secondary'>
                Approval Remarks
              </Typography>
              <Typography variant='body1'>{approval.remarks}</Typography>
            </Grid>
          )}

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box>
              <Typography variant='subtitle2' color='text.secondary'>
                Requested By
              </Typography>
              <Typography variant='body1'>
                {approval.requisition?.creator?.name}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box>
              <Typography variant='subtitle2' color='text.secondary'>
                Approved By
              </Typography>

              <Typography variant='body1'>{approval?.creator?.name}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Relatable Details Dialog */}
      <Dialog
        open={openViewDialog}
        fullScreen={belowLargeScreen}
        maxWidth='md'
        fullWidth
        onClose={() => setOpenViewDialog(false)}
      >
        <FetchRelatableDetails
          approval={approval}
          relatable={selectedRelated}
          toggleOpen={setOpenViewDialog}
        />
      </Dialog>
    </>
  );
}

export default ApprovalOnScreen;
