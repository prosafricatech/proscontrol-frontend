import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CertificateOnScreen from '@/components/projectManagement/projects/profile/subcontracts/tabs/certificatesTab/preview/CertificateOnScreen';
import projectsServices from '@/components/projectManagement/projects/project-services.js';
import { Organization } from '@/types/auth-types';
import purchaseBillServices from '../procurement/grns/purchaseBill-services';
import PurchaseBillOnScreenPreview from '../accounts/purchaseBills/PurchaseBillOnScreenPreview';
import { VisibilityOutlined } from '@mui/icons-material';
import {
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
import purchaseServices from '../procurement/purchases/purchase-services';
import RelatableOrderDetails from './requisitions/listItem/tabs/form/RelatableOrderDetails';
import {
  PaymentItem,
  PurchaseItem,
  Requisition,
  RequisitionItem,
  Vendor,
} from './RequisitionType';

interface Props {
  requisition: Requisition;
  organization: Organization;
  belowLargeScreen: boolean;
}

// --- Fetch Relatable Details Component ---
const FetchRelatableDetails: React.FC<{
  relatable: any;
  toggleOpen: (open: boolean) => void;
}> = ({ relatable, toggleOpen }) => {
  const { authOrganization } = useJumboAuth();
  if (!relatable) return null;

  if (relatable.order_date) {
    const { data: orderDetails, isFetching } = useQuery({
      queryKey: ['purchaseOrder', relatable?.id],
      queryFn: () => purchaseServices.orderDetails(relatable?.id),
    });
    if (isFetching) {
      return <LinearProgress />;
    }
    return (
      <RelatableOrderDetails order={orderDetails} toggleOpen={toggleOpen} />
    );
  }

  if (relatable.certificate_date) {
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

  if (relatable.invoiceNo) {
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

// --- Main Component ---
const RequisitionsOnScreen: React.FC<Props> = ({
  requisition,
  organization,
  belowLargeScreen,
}) => {
  const theme = useTheme();
  const [selectedRelated, setSelectedRelated] = useState<{ id: number } | null>(
    null
  );
  const [openViewDialog, setOpenViewDialog] = useState(false);

  const mainColor = organization.settings?.main_color || '#2113AD';
  const headerColor =
    theme.palette.mode === 'dark'
      ? '#29f096'
      : organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const isPurchase = ['purchase', 'material'].includes(
    requisition?.approval_chain.process_type?.toLowerCase() || ''
  );
  const isMaterial =
    requisition?.approval_chain.process_type?.toLowerCase() === 'material';
  const isImprest =
    requisition?.approval_chain.process_type?.toLowerCase() === 'imprest';
  const requisitionItems: RequisitionItem[] =
    'items' in requisition ? requisition.items || [] : [];
  const additionalCosts = isPurchase
    ? (((requisition as any)?.additional_costs || []) as any[])
    : [];
  const totalAdditionalCosts =
    additionalCosts.reduce(
      (total: number, cost: any) => total + Number(cost?.amount || 0),
      0
    ) || 0;

  const totalVAT =
    requisitionItems
      ?.filter((item: RequisitionItem) => (item.vat_percentage || 0) > 0)
      .reduce(
        (total: number, item: RequisitionItem) =>
          total + item.rate * item.quantity * (item.vat_percentage || 0) * 0.01,
        0
      ) || 0;

  const subtotal = requisitionItems.reduce(
    (total: number, item: RequisitionItem) =>
      total + (item.quantity || 0) * (item.rate || 0),
    0
  );

  const grandTotal = subtotal + totalVAT + totalAdditionalCosts;

  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString('en-US', {
      style: 'currency',
      currency: requisition.currency?.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatNumber = (value: number) => {
    return (value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <>
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} width={'100%'}>
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
                  ? 'MATERIAL REQUISITION'
                  : isPurchase
                    ? 'PURCHASE REQUISITION'
                    : isImprest
                      ? 'IMPREST REQUISITION'
                      : 'PAYMENT REQUISITION'}
              </Typography>
              <Typography variant='h6'>{requisition.requisitionNo}</Typography>
            </Box>
          </Grid>

          {/* Meta Information */}
          <Grid container spacing={2} sx={{ mb: 3 }} width={'100%'}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary'>
                  Requisition Date
                </Typography>
                <Typography variant='body1'>
                  {readableDate(requisition.requisition_date)}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary'>
                  Date Required
                </Typography>
                <Typography variant='body1'>
                  {requisition.date_required
                    ? readableDate(requisition.date_required)
                    : '-'}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary'>
                  Cost Center
                </Typography>
                <Typography variant='body1'>
                  {requisition.cost_center.name}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary'>
                  Requested By
                </Typography>
                <Typography variant='body1'>
                  {requisition?.creator?.name}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Items Table */}
          <Grid size={12}>
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
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        colSpan={1}
                        sx={{ backgroundColor: mainColor, color: contrastText }}
                      >
                        S/N
                      </TableCell>
                      <TableCell
                        colSpan={3}
                        sx={{ backgroundColor: mainColor, color: contrastText }}
                      >
                        {isPurchase ? 'Product' : 'Ledger'}
                      </TableCell>
                      <TableCell
                        colSpan={1}
                        sx={{ backgroundColor: mainColor, color: contrastText }}
                        align='right'
                      >
                        Quantity
                      </TableCell>
                      <TableCell
                        colSpan={1}
                        sx={{ backgroundColor: mainColor, color: contrastText }}
                        align='right'
                      >
                        Rate
                      </TableCell>
                      {isPurchase && requisition.vat_amount > 0 && (
                        <TableCell
                          colSpan={1}
                          sx={{
                            backgroundColor: mainColor,
                            color: contrastText,
                          }}
                          align='right'
                        >
                          VAT
                        </TableCell>
                      )}
                      <TableCell
                        colSpan={1}
                        sx={{ backgroundColor: mainColor, color: contrastText }}
                        align='right'
                      >
                        Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requisitionItems.map(
                      (item: RequisitionItem, index: number) => (
                        <React.Fragment key={item.id}>
                          <TableRow
                            sx={{
                              backgroundColor: theme.palette.background.paper,
                              '&:nth-of-type(even)': {
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            <TableCell colSpan={1}>{index + 1}</TableCell>
                            <TableCell colSpan={3}>
                              <Box>
                                <Typography variant='body2'>
                                  {isPurchase
                                    ? (item as PurchaseItem).product?.name
                                    : (item as PaymentItem).ledger?.name}
                                </Typography>
                                {item.remarks && (
                                  <Typography
                                    variant='body2'
                                    color='text.secondary'
                                    sx={{ mt: 0.5 }}
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
                                          setSelectedRelated(
                                            (item as any).relatable || null
                                          );
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
                              colSpan={1}
                              align='right'
                              sx={{ fontFamily: 'monospace' }}
                            >
                              {`${item.quantity?.toLocaleString()} ${item.measurement_unit.symbol}`}
                            </TableCell>
                            <TableCell
                              colSpan={1}
                              align='right'
                              sx={{ fontFamily: 'monospace' }}
                            >
                              {formatNumber(item.rate)}
                            </TableCell>
                            {isPurchase && requisition?.vat_amount > 0 && (
                              <TableCell
                                colSpan={1}
                                align='right'
                                sx={{ fontFamily: 'monospace' }}
                              >
                                {formatNumber(
                                  item.rate * (item.vat_percentage || 0) * 0.01
                                )}
                              </TableCell>
                            )}
                            <TableCell
                              colSpan={1}
                              align='right'
                              sx={{ fontFamily: 'monospace' }}
                            >
                              {formatCurrency(
                                item.quantity *
                                  item.rate *
                                  (1 + (item.vat_percentage || 0) * 0.01)
                              )}
                            </TableCell>
                          </TableRow>

                          {Array.isArray(item?.vendors) &&
                            item.vendors.length > 0 && (
                              <>
                                <TableRow>
                                  <TableCell
                                    colSpan={
                                      isPurchase && requisition.vat_amount > 0
                                        ? 8
                                        : 7
                                    }
                                    sx={{
                                      textAlign: 'center',
                                      backgroundColor:
                                        theme.palette.background.default,
                                      borderBottom: `1px solid ${theme.palette.divider}`,
                                    }}
                                  >
                                    Vendors
                                  </TableCell>
                                </TableRow>
                                {item.vendors.map(
                                  (vendor: Vendor, i: number) => (
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
                                          isPurchase &&
                                          requisition.vat_amount > 0
                                            ? 6
                                            : 5
                                        }
                                      >
                                        {vendor.remarks}
                                      </TableCell>
                                    </TableRow>
                                  )
                                )}
                              </>
                            )}
                        </React.Fragment>
                      )
                    )}
                  </TableBody>
                </>
              </Table>
            </TableContainer>
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
                <Grid size={7}>
                  <Typography variant='body1'>Product Total</Typography>
                </Grid>
                <Grid size={5} sx={{ textAlign: 'right' }}>
                  <Typography variant='body1' fontFamily='monospace'>
                    {formatCurrency(subtotal)}
                  </Typography>
                </Grid>

                {isPurchase && (
                  <>
                    {additionalCosts.map((cost: any, index: number) => {
                      const costLabel =
                        cost.credit_ledger_name ||
                        cost.ledger?.name ||
                        cost.name ||
                        `Additional Cost ${index + 1}`;
                      const costCurrency =
                        cost.currency?.code ||
                        cost.currency_name ||
                        requisition.currency?.code ||
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
                              {`${costCurrency} ${Number(cost.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`.trim()}
                            </Typography>
                          </Grid>
                        </React.Fragment>
                      );
                    })}

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
                        {formatCurrency(grandTotal)}
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
              </Grid>
            </Box>
          </Grid>

          {/* Remarks Section */}
          {requisition.remarks && (
            <Grid size={12} sx={{ mt: 2 }}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary'>
                  Remarks
                </Typography>
                <Typography
                  variant='body1'
                  sx={{
                    p: 2,
                    backgroundColor: theme.palette.background.default,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    lineHeight: 1.5,
                  }}
                >
                  {requisition.remarks}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Relatable Details Dialog */}
      <Dialog
        open={openViewDialog}
        maxWidth='md'
        fullWidth
        fullScreen={belowLargeScreen}
        onClose={() => setOpenViewDialog(false)}
      >
        <FetchRelatableDetails
          relatable={selectedRelated || undefined}
          toggleOpen={setOpenViewDialog}
        />
      </Dialog>
    </>
  );
};

export default RequisitionsOnScreen;
