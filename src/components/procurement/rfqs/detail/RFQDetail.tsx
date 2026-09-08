'use client';

import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Tooltip,
  Typography,
  useMediaQuery,
  LinearProgress,
} from '@mui/material';
import { 
  DeleteOutlined, 
  EditOutlined, 
  ReplyOutlined, 
  ArrowBackOutlined,
  CheckCircleOutline,
  PendingOutlined,
  CancelOutlined,
  PeopleOutlined,
  InventoryOutlined,
  CalendarTodayOutlined,
  AssessmentOutlined,
  ReceiptOutlined,
  SendOutlined,
  AddOutlined,
  VisibilityOutlined,
  PrintOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import CurrencySelectProvider from '@/components/masters/Currencies/CurrencySelectProvider';
import rfqServices from '../rfq-services';
import { RFQ, RFQComparison } from '../rfq-types';
import RFQDialogForm from '../form/RFQDialogForm';
import RFQResponsesForm from '../listItem/form/RFQResponsesForm';
import RFQPurchaseOrderForm from './purchases/RFQPurchaseOrderForm';
import RFQComparisonUI from './RFQComparisonUI';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import RFQPDF from '../RFQPDF';
import PDFContent from '@/components/pdf/PDFContent';

interface RFQDetailProps {
  rfqId?: string;
}

function RFQDetail({ rfqId: rfqIdProp }: RFQDetailProps) {
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const { checkOrganizationPermission, organizationHasSubscribed, authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  
  const rfqId = rfqIdProp || (params?.id as string);
  const lang = (params?.lang as string) || 'en-US';
  
  const [activeTab, setActiveTab] = useState(0);
  const [openEdit, setOpenEdit] = useState(false);
  const [openResponseForm, setOpenResponseForm] = useState(false);
  const [selectedStakeholder, setSelectedStakeholder] = useState<any | null>(null);
  const [openPurchaseOrderDialog, setOpenPurchaseOrderDialog] = useState(false);
  const [openPrintDialog, setOpenPrintDialog] = useState(false);
  const [printSupplier, setPrintSupplier] = useState<any | null>(null);
  const [selectedSupplierForPO, setSelectedSupplierForPO] = useState<any | null>(null);
  const [poItems, setPoItems] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  
  // State declarations
  const [viewResponseId, setViewResponseId] = useState<number | null>(null);
  const [editResponseId, setEditResponseId] = useState<number | null>(null);
  
  // Confirmation Dialog States
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: 'delete',
    id: null as number | null,
    type: '' as 'rfq' | 'response',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: rfq, isLoading } = useQuery<RFQ>({
    queryKey: ['rfq', rfqId],
    queryFn: () => rfqServices.getOne(rfqId),
    enabled: !!rfqId,
  });

  const { data: comparison } = useQuery<RFQComparison>({
    queryKey: ['rfqComparison', rfqId],
    queryFn: () => rfqServices.getComparison(rfqId),
    enabled: !!rfqId,
  });

  const { data: editResponseData, isLoading: isLoadingEdit } = useQuery({
    queryKey: ['rfqResponseDetail', editResponseId],
    queryFn: () => rfqServices.getResponse(editResponseId as number),
    enabled: !!editResponseId,
  });

  const { data: viewResponseData, isLoading: isLoadingView } = useQuery({
    queryKey: ['rfqResponseDetail', viewResponseId],
    queryFn: () => rfqServices.getResponse(viewResponseId as number),
    enabled: !!viewResponseId,
  });

  const deleteMutation = useMutation({
    mutationFn: rfqServices.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      router.push(`/${lang}/procurement/rfqs`);
      setConfirmDialog({ ...confirmDialog, open: false });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Unable to delete RFQ', { variant: 'error' });
      setConfirmDialog({ ...confirmDialog, open: false });
    },
  });

  const deleteResponseMutation = useMutation({
    mutationFn: rfqServices.deleteResponse,
    onSuccess: () => {
      enqueueSnackbar('Response deleted successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['rfqComparison', rfqId] });
      setConfirmDialog({ ...confirmDialog, open: false });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Unable to delete response', { variant: 'error' });
      setConfirmDialog({ ...confirmDialog, open: false });
    },
  });

  // Handle award from comparison UI
  const handleAward = (selectedQuotes: Record<number, any>) => {
    // Group selected quotes by supplier
    const groupedBySupplier = Object.entries(selectedQuotes).reduce((acc: any[], [itemId, quote]: any) => {
      const comparisonItem = comparison?.items?.find((item) => String(item.id) === String(itemId));
      if (!comparisonItem) return acc;

      const key = quote.stakeholder.id;
      const existing = acc.find((group) => group.stakeholder_id === key);
      const poItem = {
        rfq_response_item_id: quote.id,
        product: comparisonItem.product,
        product_id: comparisonItem.product?.id,
        measurement_unit_id: comparisonItem.measurement_unit?.id,
        quantity: quote.quantity || comparisonItem.quantity || 0,
        rate: quote.rate || 0,
        vat_percentage: quote.vat_percentage || 0,
      };
      if (existing) {
        existing.items.push(poItem);
      } else {
        acc.push({
          stakeholder_id: key,
          stakeholder: quote.stakeholder,
          items: [poItem],
          rfq_id: Number(rfqId),
        });
      }
      return acc;
    }, []);

    if (groupedBySupplier.length === 0) {
      enqueueSnackbar('No items selected for award', { variant: 'warning' });
      return;
    }

    // Store all pending orders
    setPendingOrders(groupedBySupplier);
    setCurrentOrderIndex(0);
    
    // Open first PO dialog
    openPurchaseOrderForGroup(groupedBySupplier[0]);
  };

  const openPurchaseOrderForGroup = (group: any) => {
    setSelectedSupplierForPO(group);
    setPoItems(group.items);
    setOpenPurchaseOrderDialog(true);
  };

  const handlePurchaseOrderClose = (open: boolean) => {
    setOpenPurchaseOrderDialog(open);
    
    // If dialog is closed and there are more orders pending
    if (!open && pendingOrders.length > 0) {
      const nextIndex = currentOrderIndex + 1;
      if (nextIndex < pendingOrders.length) {
        setCurrentOrderIndex(nextIndex);
        openPurchaseOrderForGroup(pendingOrders[nextIndex]);
      } else {
        // All orders processed
        setPendingOrders([]);
        setCurrentOrderIndex(0);
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
        queryClient.invalidateQueries({ queryKey: ['rfqComparison', rfqId] });
      }
    }
  };

  const responseSuccess = () => {
    setOpenResponseForm(false);
    setSelectedStakeholder(null);
    queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
    queryClient.invalidateQueries({ queryKey: ['rfqComparison', rfqId] });
  };

  const handleOpenResponseForm = (stakeholder: any) => {
    setSelectedStakeholder(stakeholder);
    setOpenResponseForm(true);
  };

  // Open confirmation dialog for delete
  const openDeleteConfirmation = (type: 'rfq' | 'response', id: number, name?: string) => {
    const config = {
      rfq: {
        title: 'Delete RFQ',
        message: `Are you sure you want to delete RFQ "${rfq?.rfqNo}"? This action cannot be undone.`,
      },
      response: {
        title: 'Delete Response',
        message: `Are you sure you want to delete the response from "${name || 'this supplier'}"? This action cannot be undone.`,
      },
    };

    setConfirmDialog({
      open: true,
      title: config[type].title,
      message: config[type].message,
      action: 'delete',
      id: id,
      type: type,
    });
  };

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (confirmDialog.type === 'rfq') {
      deleteMutation.mutate({ id: confirmDialog.id });
    } else if (confirmDialog.type === 'response') {
      deleteResponseMutation.mutate({ id: confirmDialog.id });
    }
  };

  // Handle edit response close
  const handleEditResponseClose = (open: boolean) => {
    if (!open) {
      setEditResponseId(null);
    }
  };

  // Handle view response close
  const handleViewResponseClose = () => {
    setViewResponseId(null);
  };

  if (!mounted) return null;

  if (!organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY)) {
    return <UnsubscribedAccess modules={'Procurement & Supply'} />;
  }

  if (!checkOrganizationPermission([PERMISSIONS.RFQS_READ, PERMISSIONS.RFQS_EDIT])) {
    return <UnauthorizedAccess />;
  }

  // Get status color
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, any> = {
      'draft': { color: 'default', icon: null },
      'pending': { color: 'warning', icon: <PendingOutlined /> },
      'sent': { color: 'info', icon: <SendOutlined /> },
      'responded': { color: 'info', icon: <ReplyOutlined /> },
      'awarded': { color: 'success', icon: <CheckCircleOutline /> },
      'cancelled': { color: 'error', icon: <CancelOutlined /> },
    };
    return statusMap[status?.toLowerCase()] || { color: 'default', icon: null };
  };

  // Check if delete mutations are loading
  const isDeleting = deleteMutation.isPending || deleteResponseMutation.isPending;

  return (
    <CurrencySelectProvider>
      <LedgerSelectProvider>
        <Box sx={{ p: { xs: 1, md: 2 } }}>
          {/* Header */}
          <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title="Back to RFQs">
                    <IconButton onClick={() => router.push(`/${lang}/procurement/rfqs`)}>
                      <ArrowBackOutlined />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="h4" fontWeight="bold">
                    {rfq?.rfqNo || 'RFQ Details'}
                  </Typography>
                  {rfq && (
                    <Chip 
                      label={rfq.status || 'Draft'} 
                      color={getStatusColor(rfq?.status as string).color}
                      icon={getStatusColor(rfq?.status as string).icon}
                      size="medium"
                    />
                  )}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                  {!!rfq?.stakeholders?.length && (
                    <Button
                      variant="outlined"
                      startIcon={<PrintOutlined />}
                      onClick={() => {
                        setPrintSupplier(null);
                        setOpenPrintDialog(true);
                      }}
                      size="small"
                    >
                      Print
                    </Button>
                  )}
                  {checkOrganizationPermission(PERMISSIONS.RFQS_EDIT) && (
                    <Button
                      variant="outlined"
                      startIcon={<EditOutlined />}
                      onClick={() => setOpenEdit(true)}
                      size="small"
                    >
                      Edit
                    </Button>
                  )}
                  {checkOrganizationPermission(PERMISSIONS.RFQS_DELETE) && (
                    <Button 
                      color="error" 
                      variant="outlined" 
                      startIcon={<DeleteOutlined />} 
                      onClick={() => rfq && openDeleteConfirmation('rfq', rfq.id as number)}
                      size="small"
                      disabled={isDeleting}
                    >
                      Delete
                    </Button>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Summary Cards */}
          {rfq && !isLoading && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <InventoryOutlined color="primary" />
                      <Typography variant="body2" color="text.secondary">Items</Typography>
                    </Stack>
                    <Typography variant="h4" paddingLeft={5}>{rfq.items?.length || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PeopleOutlined color="primary" />
                      <Typography variant="body2" color="text.secondary">Suppliers</Typography>
                    </Stack>
                    <Typography variant="h4" paddingLeft={5}>{rfq.stakeholders?.length || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ReplyOutlined color="primary" />
                      <Typography variant="body2" color="text.secondary">Responses</Typography>
                    </Stack>
                    <Typography variant="h4" paddingLeft={5}>{rfq.responses?.length || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CalendarTodayOutlined color="primary" />
                      <Typography variant="body2" color="text.secondary">Deadline</Typography>
                    </Stack>
                    <Typography variant="body1" fontWeight="bold">
                      {rfq.response_deadline ? readableDate(rfq.response_deadline) : 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {isLoading && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {[1, 2, 3, 4].map((i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Loading...</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Tabs */}
          <Paper sx={{ mb: 2 }}>
            <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
              <Tab label="Overview" />
              <Tab label="Comparison" />
            </Tabs>
          </Paper>

          {/* Overview Tab */}
          {activeTab === 0 && rfq && (
            <Grid container spacing={2}>
              {/* RFQ Date Card */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <CalendarTodayOutlined color="primary" fontSize="small" />
                      <Typography variant="subtitle2" color="text.secondary">RFQ Date</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {rfq.rfq_date ? readableDate(rfq.rfq_date) : 'N/A'}
                    </Typography>
                    {rfq.reference &&
                      <Typography variant="caption" color="text.secondary">
                        Reference: {rfq.reference}
                      </Typography>
                    }
                  </CardContent>
                </Card>
              </Grid>

              {/* Response Deadline Card */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <CalendarTodayOutlined color="error" fontSize="small" />
                      <Typography variant="subtitle2" color="text.secondary">Response Deadline</Typography>
                    </Stack>
                    <Typography variant="body1" fontWeight="bold" color={dayjs(rfq.response_deadline).isBefore(dayjs()) ? 'error' : 'inherit'}>
                      {rfq.response_deadline ? readableDate(rfq.response_deadline) : 'N/A'}
                    </Typography>
                    {rfq.response_deadline && (
                      <Typography variant="caption" color={dayjs(rfq.response_deadline).isBefore(dayjs()) ? 'error' : 'text.secondary'}>
                        {dayjs(rfq.response_deadline).isBefore(dayjs()) 
                          ? '⚠️ Deadline has passed' 
                          : `📅 ${Math.ceil(dayjs(rfq.response_deadline).diff(dayjs(), 'days'))} days remaining`}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Invited Suppliers */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom>
                    <PeopleOutlined fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Invited Suppliers ({rfq.stakeholders?.length || 0})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    {(rfq.stakeholders || []).map((stakeholder) => {
                      const hasResponded = rfq.responses?.some(
                        (r: any) => Number(r?.stakeholder?.id) === Number(stakeholder.id)
                      );
                      return (
                        <Paper 
                          key={stakeholder.id} 
                          variant="outlined" 
                          sx={{ 
                            p: 1.5, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            cursor: hasResponded ? 'default' : 'pointer',
                            '&:hover': hasResponded ? {} : { bgcolor: 'action.hover' }
                          }}
                          onClick={!hasResponded ? () => handleOpenResponseForm(stakeholder) : undefined}
                        >
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2">{stakeholder.name}</Typography>
                            {hasResponded ? (
                              <Chip label="Responded" color="success" size="small" icon={<CheckCircleOutline />} />
                            ) : (
                              <Chip label="Pending" color="warning" size="small" icon={<PendingOutlined />} />
                            )}
                          </Stack>
                          {!hasResponded && (
                            <Button size="small" startIcon={<ReplyOutlined />}>
                              Response
                            </Button>
                          )}
                        </Paper>
                      );
                    })}
                    {!rfq.stakeholders?.length && (
                      <Typography color="text.secondary" textAlign="center" py={2}>
                        No suppliers invited yet
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              </Grid>

              {/* Items Card */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom>
                    <InventoryOutlined fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Items ({rfq.items?.length || 0})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer sx={{ flex: 1 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: '15%' }}>S/N</TableCell>
                          <TableCell sx={{ width: '45%' }}>Item</TableCell>
                          <TableCell sx={{ width: '25%' }} align="right">Quantity</TableCell>
                          <TableCell sx={{ width: '15%' }}>Unit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rfq.items?.map((item: any, index: number) => (
                          <TableRow key={`${item.id || index}`}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {item.product?.item_name || item.product?.name || 'Item'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell>{item.unit_symbol || item.measurement_unit?.symbol || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {!rfq.items?.length && (
                    <Typography color="text.secondary" textAlign="center" py={2}>
                      No items added yet
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Responses */}
              <Grid size={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    <ReplyOutlined fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Responses ({rfq.responses?.length || 0})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {rfq.responses?.map((response: any) => (
                    <Paper key={response.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                      <Grid container alignItems="center" spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="body1">
                            {response.stakeholder?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {response.currency?.code}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Typography variant="body2">
                            <CalendarTodayOutlined fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Response: {readableDate(response.response_date)}
                          </Typography>
                          <Typography variant="body2">
                            <CalendarTodayOutlined fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Validity: {readableDate(response.validity_date)}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }} textAlign="right">
                          <Tooltip title="View Response">
                            <IconButton size="small" onClick={() => setViewResponseId(response.id)}>
                              <VisibilityOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {!response.has_purchase_orders && (
                            <Tooltip title="Edit Response">
                              <IconButton size="small" onClick={() => setEditResponseId(response.id)}>
                                <EditOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {!response.has_purchase_orders && (
                            <Tooltip title="Delete Response">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDeleteConfirmation('response', response.id, response.stakeholder?.name)}
                                disabled={isDeleting}
                              >
                                <DeleteOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {response.has_purchase_orders && (
                            <Tooltip title="This response has already been used to create a Purchase Order">
                              <Chip label="Ordered" size="small" color="success" variant="outlined" />
                            </Tooltip>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  {!rfq.responses?.length && (
                    <Typography color="text.secondary" textAlign="center" py={2}>
                      No responses yet
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Comparison Tab */}
          {activeTab === 1 && comparison && (
            <RFQComparisonUI
              comparison={comparison as any}
              isAwarding={false}
              rfqDetails={rfq}
              onAward={handleAward}
              canAward={checkOrganizationPermission(PERMISSIONS.PURCHASES_CREATE)}
            />
          )}
        </Box>

        {/* Edit Dialog */}
        {rfq && (
          <Dialog
            fullWidth
            maxWidth="lg"
            fullScreen={belowLargeScreen}
            scroll={belowLargeScreen ? 'body' : 'paper'}
            open={openEdit}
            onClose={() => setOpenEdit(false)}
          >
            <RFQDialogForm toggleOpen={setOpenEdit} rfq={rfq} />
          </Dialog>
        )}

        {/* View Response Dialog */}
        <Dialog
          fullWidth
          maxWidth="lg"
          fullScreen={belowLargeScreen}
          scroll={belowLargeScreen ? 'body' : 'paper'}
          open={!!viewResponseId} 
          onClose={handleViewResponseClose}
        >
          <DialogTitle>
            Response Details{viewResponseData?.stakeholder?.name ? ` — ${viewResponseData.stakeholder.name}` : ''}
          </DialogTitle>
          <DialogContent dividers>
            {isLoadingView || !viewResponseData ? (
              <LinearProgress />
            ) : (
              <>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Response Date</Typography>
                    <Typography variant="body2">{readableDate(viewResponseData.response_date, false)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Validity Date</Typography>
                    <Typography variant="body2">
                      {viewResponseData.validity_date ? readableDate(viewResponseData.validity_date, false) : '-'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Currency</Typography>
                    <Typography variant="body2">
                      {viewResponseData.currency?.name} ({viewResponseData.currency?.code})
                    </Typography>
                  </Grid>
                  {viewResponseData.remarks && (
                    <Grid size={12}>
                      <Typography variant="caption" color="text.secondary" display="block">Remarks</Typography>
                      <Typography variant="body2">{viewResponseData.remarks}</Typography>
                    </Grid>
                  )}
                </Grid>
                <Divider sx={{ mb: 2 }} />
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Requested</TableCell>
                        <TableCell align="right">Quoted Qty</TableCell>
                        <TableCell align="right">Rate</TableCell>
                        <TableCell align="right">VAT %</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Delivery Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(viewResponseData.items || []).map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.product?.item_name || item.product?.name || 'Item'}
                            {item.remarks && (
                              <Typography variant="caption" color="text.secondary" display="block">{item.remarks}</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{item.requested_quantity} {item.measurement_unit?.symbol}</TableCell>
                          <TableCell align="right">{item.quantity} {item.measurement_unit?.symbol}</TableCell>
                          <TableCell align="right">{item.rate?.toLocaleString()}</TableCell>
                          <TableCell align="right">{item.vat_percentage || 0}%</TableCell>
                          <TableCell align="right">{item.amount?.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {item.delivery_date ? readableDate(item.delivery_date, false) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleViewResponseClose}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Response Dialog */}
        <Dialog 
          fullWidth 
          maxWidth="lg" 
          fullScreen={belowLargeScreen} 
          scroll={belowLargeScreen ? 'body' : 'paper'}
          open={!!editResponseId} 
          onClose={() => handleEditResponseClose(false)}
        >
          {isLoadingEdit || !editResponseData ? (
            <DialogContent><LinearProgress /></DialogContent>
          ) : (
            <RFQResponsesForm
              toggleOpen={handleEditResponseClose}
              rfqDetails={rfq}
              rfqId={Number(rfqId)}
              response={editResponseData}
              onSuccess={() => setEditResponseId(null)}
            />
          )}
        </Dialog>

        {/* RFQ Response Form Dialog */}
        <Dialog
          fullWidth
          maxWidth="lg"
          fullScreen={belowLargeScreen}
          scroll={belowLargeScreen ? 'body' : 'paper'}
          open={openResponseForm}
          onClose={() => setOpenResponseForm(false)}
        >
          <RFQResponsesForm
            toggleOpen={setOpenResponseForm}
            rfqDetails={rfq}
            rfqId={rfqId as unknown as number}
            preselectedStakeholder={selectedStakeholder}
            onSuccess={responseSuccess}
          />
        </Dialog>

        {/* Purchase Order Dialog */}
        <Dialog
          fullWidth
          maxWidth="lg"
          fullScreen={belowLargeScreen}
          scroll={belowLargeScreen ? 'body' : 'paper'}
          open={openPurchaseOrderDialog}
          onClose={() => handlePurchaseOrderClose(false)}
        >
          <RFQPurchaseOrderForm
            toggleOpen={handlePurchaseOrderClose}
            order={{
              stakeholder_id: selectedSupplierForPO?.stakeholder_id,
              stakeholder: selectedSupplierForPO?.stakeholder,
              items: poItems,
              rfq_id: Number(rfqId),
              order_date: dayjs().toISOString(),
              currency_id: rfq?.responses?.find(
                (r: any) => Number(r.stakeholder?.id) === Number(selectedSupplierForPO?.stakeholder_id)
              )?.currency?.id || 1,
              exchange_rate: rfq?.responses?.find(
                (r: any) => Number(r.stakeholder?.id) === Number(selectedSupplierForPO?.stakeholder_id)
              )?.exchange_rate || 1,
            }}
            rfqDetails={rfq}
            rfqId={Number(rfqId)}
          />
        </Dialog>

        {/* Print RFQ Dialog */}
        <Dialog
          fullWidth
          maxWidth="lg"
          fullScreen={belowLargeScreen}
          scroll={belowLargeScreen ? 'body' : 'paper'}
          open={openPrintDialog}
          onClose={() => setOpenPrintDialog(false)}
        >
          <DialogTitle>
            {printSupplier ? `RFQ for ${printSupplier.name}` : 'Select a Supplier'}
          </DialogTitle>
          <DialogContent dividers={!!printSupplier}>
            {!printSupplier ? (
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Each supplier receives their own copy, addressed to them.
                </Typography>
                {(rfq?.stakeholders || []).map((stakeholder: any) => (
                  <Paper
                    key={stakeholder.id}
                    variant="outlined"
                    sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2">{stakeholder.name}</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PrintOutlined />}
                      onClick={() => setPrintSupplier(stakeholder)}
                    >
                      View / Download
                    </Button>
                  </Paper>
                ))}
              </Stack>
            ) : (
              rfq && organization && (
                <PDFContent
                  fileName={`${rfq.rfqNo} - ${printSupplier.name}`}
                  document={<RFQPDF rfq={rfq} supplier={printSupplier} organization={organization} />}
                />
              )
            )}
          </DialogContent>
          <DialogActions>
            {printSupplier && (
              <Button size="small" onClick={() => setPrintSupplier(null)}>
                Back to Suppliers
              </Button>
            )}
            <Button size="small" onClick={() => setOpenPrintDialog(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
          aria-labelledby="confirmation-dialog-title"
          aria-describedby="confirmation-dialog-description"
        >
          <DialogTitle id="confirmation-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteOutlined color="error" />
            {confirmDialog.title}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="confirmation-dialog-description">
              {confirmDialog.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button 
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              variant="outlined"
              size="small"
            >
              Cancel
            </Button>
            <LoadingButton 
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              size="small"
              loading={isDeleting}
              startIcon={<DeleteOutlined />}
            >
              Delete
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </LedgerSelectProvider>
    </CurrencySelectProvider>
  );
}

export default RFQDetail;