import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import {
  Approval,
  Requisition,
  RequisitionItem,
} from '@/components/processApproval/RequisitionType';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { Div } from '@jumbo/shared';
import { Restore } from '@mui/icons-material';
import CallSplitOutlinedIcon from '@mui/icons-material/CallSplitOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import { VisibilityOutlined, AccountBalanceWalletOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { Organization } from '@/types/auth-types';
import LedgerBudgetCheckDetails from './LedgerBudgetCheckDetails';
import RelatableOrderDetails from './RelatableOrderDetails';
import CertificateOnScreen from '@/components/projectManagement/projects/profile/subcontracts/tabs/certificatesTab/preview/CertificateOnScreen';
import projectsServices from '@/components/projectManagement/projects/project-services.js';
import purchaseServices from '@/components/procurement/purchases/purchase-services';
import purchaseBillServices from '@/components/procurement/grns/purchaseBill-services';
import PurchaseBillOnScreenPreview from '@/components/accounts/purchaseBills/PurchaseBillOnScreenPreview';
import { useQuery } from '@tanstack/react-query';

interface SplitItem {
  credit_ledger_id: number | null;
  ledger?: { id: number; name: string };
  quantity: number | null;
  rate: number | null;
  amount?: number | null;
  remarks?: string;
}

interface ApprovalRequisitionLedgerItemProps {
  approval?: Approval;
  requisition: Requisition;
  errors: any;
  handleItemChange: any;
  isPaymentType: boolean;
  requisitionLedgerItem: RequisitionItem[];
  setRequisitionLedgerItem: (items: RequisitionItem[]) => void;
}

interface FetchRelatableDetailsProps {
  requisition: Requisition;
  relatable: { id: number; orderNo: string; order_date: string } | null;
  toggleOpen: (open: boolean) => void;
}

const FetchRelatableDetails = ({ relatable, toggleOpen }: FetchRelatableDetailsProps) => {
  const { authOrganization } = useJumboAuth();
  if (!relatable) return null;

  // If relatable has order_date, treat as purchase order
  if ('order_date' in relatable && relatable.order_date) {
    const { data: orderDetails, isFetching } = useQuery({
      queryKey: ['purchaseOrder', { id: relatable?.id }],
      queryFn: async () => purchaseServices.orderDetails(relatable?.id)
    });
    if (isFetching) {
      return <LinearProgress/>;
    }
    return <RelatableOrderDetails order={orderDetails} toggleOpen={toggleOpen}/>;
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
    return <>
      <CertificateOnScreen isFromProcessApproval={true} certificate={certificateDetails} organization={authOrganization?.organization as Organization} />
      <DialogActions sx={{ pb: 2 }}>
        <Button variant="outlined" color="primary" onClick={() => toggleOpen(false)}>
          Close
        </Button>
      </DialogActions>
    </>;
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
          <Button variant="outlined" color="primary" onClick={() => toggleOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </>
    );
  }

  return null;
};

function ApprovalRequisitionLedgerItem({
  approval,
  requisition,
  errors,
  isPaymentType,
  handleItemChange,
  requisitionLedgerItem,
  setRequisitionLedgerItem,
}: ApprovalRequisitionLedgerItemProps) {
  const { checkOrganizationPermission } = useJumboAuth();
  const canSeeBudget = checkOrganizationPermission([
    PERMISSIONS.BUDGETS_CREATE,
    PERMISSIONS.BUDGETS_EDIT,
    PERMISSIONS.BUDGETS_READ,
    PERMISSIONS.BUDGETS_DELETE,
  ]);
  
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedRelated, setSelectedRelated] = useState<{ id: number; orderNo: string; order_date: string } | null>(null);
  const [openLedgerBudgetDialog, setOpenLedgerBudgetDialog] = useState(false);
  const [ledgerDialogData, setLedgerDialogData] = useState<{ ledgerId: number, ledgerName: string, costCenterId: number, currency: Currency } | null>(null);
  const [initialItems, setInitialItems] = useState<RequisitionItem[]>([]);

  const sourceItemsCount = (
    approval?.items ||
    ('items' in requisition ? requisition.items : []) ||
    []
  ).length;

  useEffect(() => {
    setInitialItems([...requisitionLedgerItem]);
  }, []);

  const handleDeleteItem = (index: number) => {
    const updatedItems = [...requisitionLedgerItem];
    updatedItems.splice(index, 1);
    setRequisitionLedgerItem(updatedItems);
  };

  const handleResetItems = () => {
    setRequisitionLedgerItem([...initialItems]);
  };

  const handleAddSplit = (index: number) => {
    const item = requisitionLedgerItem[index];
    if (!item) return;

    const newSplit: SplitItem = {
      credit_ledger_id: null,
      ledger: undefined,
      quantity: null,
      rate: null,
      amount: null,
      remarks: '',
    };

    const existingSplits: SplitItem[] = (item as any).splits || [];
    const updatedItems = [...requisitionLedgerItem];
    updatedItems[index] = {
      ...item,
      splits: [...existingSplits, newSplit],
    } as any;
    setRequisitionLedgerItem(updatedItems);
  };

  const handleUpdateSplit = (
    itemIndex: number,
    splitIndex: number,
    patch: Partial<SplitItem>
  ) => {
    const item = requisitionLedgerItem[itemIndex];
    if (!item) return;

    const existingSplits: SplitItem[] = [...((item as any).splits || [])];
    const currentSplit = existingSplits[splitIndex];
    
    // Create updated split
    let updatedSplit = { ...currentSplit, ...patch };
    
    // Recalculate based on changes
    if ('amount' in patch && patch.amount !== undefined) {
      const amount = Number(patch.amount || 0);
      const quantity = Number(currentSplit.quantity || 1);
      const rate = quantity > 0 ? amount / quantity : 0;
      updatedSplit = { 
        ...updatedSplit, 
        rate: Math.round(rate * 100) / 100,
        amount: amount
      };
    } 
    else if ('quantity' in patch && patch.quantity !== undefined) {
      const quantity = Number(patch.quantity || 0);
      const rate = Number(currentSplit.rate || 0);
      const amount = quantity * rate;
      updatedSplit = { 
        ...updatedSplit, 
        quantity: quantity || null,
        amount: quantity > 0 && rate > 0 ? Math.round(amount * 100) / 100 : null
      };
    }
    else if ('rate' in patch && patch.rate !== undefined) {
      const rate = Number(patch.rate || 0);
      const quantity = Number(currentSplit.quantity || 0);
      const amount = quantity * rate;
      updatedSplit = { 
        ...updatedSplit, 
        rate: rate || null,
        amount: quantity > 0 && rate > 0 ? Math.round(amount * 100) / 100 : null
      };
    }

    existingSplits[splitIndex] = updatedSplit;

    const updatedItems = [...requisitionLedgerItem];
    updatedItems[itemIndex] = {
      ...item,
      splits: existingSplits,
    } as any;
    setRequisitionLedgerItem(updatedItems);
  };

  const handleRemoveSplit = (itemIndex: number, splitIndex: number) => {
    const item = requisitionLedgerItem[itemIndex];
    if (!item) return;

    const existingSplits: SplitItem[] = [...((item as any).splits || [])];
    existingSplits.splice(splitIndex, 1);

    const updatedItems = [...requisitionLedgerItem];
    updatedItems[itemIndex] = {
      ...item,
      splits: existingSplits,
    } as any;
    setRequisitionLedgerItem(updatedItems);
  };

  const calculateAmount = (quantity: number, rate: number): number => {
    return quantity * rate;
  };

  return (
    <React.Fragment>
      {requisitionLedgerItem.map((item: RequisitionItem, itemIndex: number) => {
        const rate = item.rate || 0;
        const quantity = item.quantity || 0;
        const mainAmount = quantity * rate;
        const splits: SplitItem[] = (item as any).splits || [];
        
        // Get errors for this specific item
        const itemErrors = errors?.[itemIndex] || {};

        return (
          <Grid
            container
            key={`item-${item.id || itemIndex}-${itemIndex}`}
            spacing={1}
            pb={2}
            pr={0.5}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ borderColor: 'primary.main', pb: 2 }} />
            </Grid>

            <Grid size={{ xs: 1 }}>
              <Div sx={{ mt: 2, mb: 1.7 }}>{itemIndex + 1}.</Div>
            </Grid>

            <Grid size={{ xs: 11, md: 3, lg: 3 }}>
              <Div sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ListItemText
                  primary={
                    <Tooltip title={'Ledger'}>
                      <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                        {item.ledger?.name}
                        {item.ledger && canSeeBudget && (
                          <Tooltip title={`${item.ledger.name} Budget check`}>
                            <IconButton
                              size="small"
                              sx={{ ml: 1 }}
                              onClick={() => {
                                setLedgerDialogData({
                                  ledgerId: item.ledger.id,
                                  ledgerName: item.ledger.name,
                                  costCenterId: requisition.cost_center?.id,
                                  currency: requisition.currency
                                });
                                setOpenLedgerBudgetDialog(true);
                              }}
                            >
                              <AccountBalanceWalletOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Typography>
                    </Tooltip>
                  }
                  secondary={
                    item.relatable && (
                      <>
                        <Tooltip title={'Relatable To'}>
                          <Typography variant="caption" fontSize={14} lineHeight={1.25} mb={0}>
                            {`${item?.relatable?.orderNo || item?.relatable?.certificateNo || (item?.relatable as any)?.invoiceNo || ''} (${readableDate(item.relatable?.order_date || item.relatable?.certificate_date || (item?.relatable as any)?.transaction_date, false)})`}
                          </Typography>
                        </Tooltip>
                        <Tooltip title={
                          item?.relatable_type === 'purchase'
                            ? 'View Order'
                            : item?.relatable_type === 'bill'
                              ? 'View Bill'
                              : 'View Certificate'
                        }>
                          <IconButton onClick={() => {
                            setSelectedRelated(item?.relatable);
                            setOpenViewDialog(true);
                          }}>
                            <VisibilityOutlined />
                          </IconButton>
                        </Tooltip>
                      </>
                    )
                  }
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 6, md: 2, lg: 2 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label="Quantity"
                  fullWidth
                  size="small"
                  value={item.quantity ?? 0}
                  onChange={(e) => {
                    const newQty = sanitizedNumber(e.target.value);
                    const currentRate = item.rate || 0;
                    const newAmount = calculateAmount(newQty, currentRate);
                    
                    handleItemChange({
                      index: itemIndex,
                      key: 'quantity',
                      value: Number.isFinite(newQty) ? newQty : 0,
                    });
                    
                    if ((item as any).amount !== undefined) {
                      handleItemChange({
                        index: itemIndex,
                        key: 'amount',
                        value: newAmount,
                      });
                    }
                  }}
                  error={!!itemErrors?.quantity}
                  helperText={itemErrors?.quantity?.message || ''}
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                    endAdornment: (
                      <InputAdornment position="end">
                        {item.measurement_unit?.symbol}
                      </InputAdornment>
                    ),
                  }}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 6, md: 2.5, lg: 2.5 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label="Rate"
                  fullWidth
                  size="small"
                  value={rate.toLocaleString()}
                  error={!!itemErrors?.rate}
                  helperText={itemErrors?.rate?.message || ''}
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                  }}
                  onChange={(e) => {
                    const newRate = sanitizedNumber(e.target.value);
                    const currentQty = item.quantity || 0;
                    const newAmount = calculateAmount(currentQty, newRate);
                    
                    handleItemChange({
                      index: itemIndex,
                      key: 'rate',
                      value: Number.isFinite(newRate) ? newRate : 0,
                    });
                    
                    if ((item as any).amount !== undefined) {
                      handleItemChange({
                        index: itemIndex,
                        key: 'amount',
                        value: newAmount,
                      });
                    }
                  }}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label="Amount"
                  fullWidth
                  size="small"
                  value={(item as any).amount !== undefined 
                    ? (item as any).amount.toLocaleString() 
                    : mainAmount.toLocaleString()
                  }
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                  }}
                  onChange={(e) => {
                    const newAmount = sanitizedNumber(e.target.value);
                    const currentQty = item.quantity || 1;
                    const calculatedRate = currentQty > 0 ? newAmount / currentQty : 0;
                    
                    handleItemChange({
                      index: itemIndex,
                      key: 'amount',
                      value: Number.isFinite(newAmount) ? newAmount : 0,
                    });
                    
                    handleItemChange({
                      index: itemIndex,
                      key: 'rate',
                      value: Math.round(calculatedRate * 100) / 100,
                    });
                  }}
                />
              </Div>
            </Grid>

            <Grid
              size={{
                xs: 10,
                md: 11,
                lg: 11,
              }}
            >
              <Div sx={{ mt: 1 }}>
                <TextField
                  label="Remarks"
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  defaultValue={item.remarks}
                  onChange={(e) =>
                    handleItemChange({
                      index: itemIndex,
                      key: 'remarks',
                      value: e.target.value,
                    })
                  }
                />
              </Div>
            </Grid>

            {isPaymentType &&
              <Grid
                textAlign="end"
                size={{
                  xs: 2,
                  md: 1,
                  lg: 1,
                }}
              >
                <Div sx={{ mt: 1.5, mb: 0.5 }}>
                  <Tooltip title="Add split allocation under this item">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleAddSplit(itemIndex)}
                    >
                      <CallSplitOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {requisitionLedgerItem.length > 1 && (
                    <Tooltip title="Delete item">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteItem(itemIndex)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Div>
              </Grid>
            }

            {splits.length > 0 && (
              <Grid size={{ xs: 12 }} sx={{ pl: { xs: 1, md: 4 }, mt: 1 }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    display: 'block', 
                    fontWeight: 'bold',
                    borderBottom: '1px dashed',
                    borderColor: 'divider',
                    pb: 0.5,
                    mb: 1
                  }}
                >
                  Split allocations
                </Typography>
                {splits.map((split, splitIndex) => {
                  const splitAmount = Number(split.amount || 0);
                  const splitQty = Number(split.quantity || 0);
                  const splitRate = Number(split.rate || 0);
                  const calculatedAmount = splitQty * splitRate;
                  const displayAmount = splitAmount || calculatedAmount;

                  const splitErrors = itemErrors?.splits?.[splitIndex] || {};

                  return (
                    <Grid
                      container
                      spacing={1}
                      key={`split-${itemIndex}-${splitIndex}`}
                      alignItems="center"
                      sx={{
                        mb: 1.5,
                        py: 1,
                        px: 1,
                        bgcolor: 'action.hover',
                        borderLeft: 3,
                        borderColor: 'secondary.main',
                        borderRadius: 0.5,
                      }}
                    >
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Div sx={{ mt: 1, mb: 1 }}>
                          <LedgerSelect
                            label="Credit Ledger"
                            frontError={splitErrors?.credit_ledger_id}
                            defaultValue={
                              split.credit_ledger_id
                                ? ({ id: split.credit_ledger_id, name: split.ledger?.name || '' } as any)
                                : null
                            }
                            onChange={(newValue: any) => {
                              const singleValue = Array.isArray(newValue) ? newValue[0] : newValue;
                              handleUpdateSplit(itemIndex, splitIndex, {
                                credit_ledger_id: singleValue?.id || null,
                                ledger: singleValue || undefined,
                              });
                            }}
                          />
                        </Div>
                      </Grid>

                      <Grid size={{ xs: 6, md: 1.5 }}>
                        <Div sx={{ mt: 1, mb: 1 }}>
                          <TextField
                            label="Qty"
                            fullWidth
                            size="small"
                            value={split.quantity ?? ''}
                            error={!!splitErrors?.quantity}
                            helperText={splitErrors?.quantity?.message || ''}
                            InputProps={{ inputComponent: CommaSeparatedField as any }}
                            onChange={(e) => {
                              const qty = sanitizedNumber(e.target.value);
                              handleUpdateSplit(itemIndex, splitIndex, {
                                quantity: qty !== undefined && !isNaN(qty) ? qty : null,
                              });
                            }}
                          />
                        </Div>
                      </Grid>

                      <Grid size={{ xs: 6, md: 2 }}>
                        <Div sx={{ mt: 1, mb: 1 }}>
                          <TextField
                            label="Rate"
                            fullWidth
                            size="small"
                            value={split.rate ?? ''}
                            error={!!splitErrors?.rate}
                            helperText={splitErrors?.rate?.message || ''}
                            InputProps={{ inputComponent: CommaSeparatedField as any }}
                            onChange={(e) => {
                              const rateVal = sanitizedNumber(e.target.value);
                              handleUpdateSplit(itemIndex, splitIndex, {
                                rate: rateVal !== undefined && !isNaN(rateVal) ? rateVal : null,
                              });
                            }}
                          />
                        </Div>
                      </Grid>

                      <Grid size={{ xs: 12, md: 2 }}>
                        <Div sx={{ mt: 1, mb: 1 }}>
                          <TextField
                            label="Amount"
                            fullWidth
                            size="small"
                            value={displayAmount > 0 ? displayAmount.toLocaleString() : ''}
                            InputProps={{
                              inputComponent: CommaSeparatedField as any,
                            }}
                            onChange={(e) => {
                              const amount = sanitizedNumber(e.target.value);
                              handleUpdateSplit(itemIndex, splitIndex, {
                                amount: amount !== undefined && !isNaN(amount) ? amount : null,
                              });
                            }}
                          />
                        </Div>
                      </Grid>

                      <Grid size={{ xs: 11, md: 2.5 }}>
                        <Div sx={{ mt: 1, mb: 1 }}>
                          <TextField
                            label="Remarks"
                            fullWidth
                            multiline
                            rows={2}
                            size="small"
                            value={split.remarks || ''}
                            onChange={(e) =>
                              handleUpdateSplit(itemIndex, splitIndex, {
                                remarks: e.target.value,
                              })
                            }
                          />
                        </Div>
                      </Grid>

                      <Grid size={{ xs: 1, md: 0.5 }} textAlign="end">
                        <Div sx={{ mt: 1 }}>
                          <Tooltip title="Remove split">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveSplit(itemIndex, splitIndex)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Div>
                      </Grid>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Grid>
        );
      })}

      {sourceItemsCount > 1 &&
        requisitionLedgerItem.length < initialItems.length && (
          <Box
            sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 2 }}
          >
            <Tooltip title="Restore all deleted items" arrow placement="top">
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<Restore />}
                onClick={handleResetItems}
              >
                Reset
              </Button>
            </Tooltip>
          </Box>
        )}

      <Dialog open={openViewDialog} maxWidth='md' fullWidth onClose={() => setOpenViewDialog(false)}>
        {selectedRelated && (
          <FetchRelatableDetails 
            requisition={requisition} 
            relatable={selectedRelated} 
            toggleOpen={setOpenViewDialog} 
          />
        )}
      </Dialog>

      <LedgerBudgetCheckDetails
        open={openLedgerBudgetDialog}
        onClose={() => setOpenLedgerBudgetDialog(false)}
        ledgerId={ledgerDialogData?.ledgerId || 0}
        costCenterId={ledgerDialogData?.costCenterId || 0}
        currency={ledgerDialogData?.currency as Currency}
        ledgerName={ledgerDialogData?.ledgerName || ''}
      />
    </React.Fragment>
  );
}

export default ApprovalRequisitionLedgerItem;