import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import purchaseServices from '@/components/procurement/purchases/purchase-services';
import purchaseBillServices from '@/components/procurement/grns/purchaseBill-services';
import PurchaseBillOnScreenPreview from '@/components/accounts/purchaseBills/PurchaseBillOnScreenPreview';
import CertificateOnScreen from '@/components/projectManagement/projects/profile/subcontracts/tabs/certificatesTab/preview/CertificateOnScreen';
import projectsServices from '@/components/projectManagement/projects/project-services.js';
import { Organization } from '@/types/auth-types';
import { Currency } from '@/utilities/constants/countries';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import {
  AccountBalanceWalletOutlined,
  DisabledByDefault,
  EditOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Dialog,
  DialogActions,
  Button,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { RequisitionLedgerItem } from '../../RequisitionType';
import LedgerBudgetCheckDetails from '../listItem/tabs/form/LedgerBudgetCheckDetails';
import RelatableOrderDetails from '../listItem/tabs/form/RelatableOrderDetails';
import RequisitionLedgerItemForm from './RequisitionLedgerItemForm';

interface FetchRelatableDetailsProps {
  relatable: any;
  toggleOpen: (open: boolean) => void;
}

interface RequisitionLedgerItemRowProps {
  currencyDetails?: Currency;
  currencyChanged?: boolean;
  ledger_item: RequisitionLedgerItem;
  index: number;
  requisition_ledger_items?: RequisitionLedgerItem[];
  setRequisition_ledger_items: Dispatch<
    SetStateAction<RequisitionLedgerItem[]>
  >;
  isDuplicate?: boolean;
  costCenterId?: number;
  notAllowedLedgers?: Array<number | { id: number }>;
}

const FetchRelatableDetails = ({
  relatable,
  toggleOpen,
  ledger_item,
}: FetchRelatableDetailsProps & { ledger_item: RequisitionLedgerItem }) => {
  const { authOrganization } = useJumboAuth();
  if (!relatable) return null;

  if (
    relatable.relatable_type === 'purchase' ||
    ledger_item.relatable_type === 'purchase'
  ) {
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

  if (
    relatable.relatable_type === 'subcontract_certificate' ||
    ledger_item.relatable_type === 'subcontract_certificate'
  ) {
    const { data: certificateDetails, isFetching } = useQuery({
      queryKey: ['subcontractCertificate', relatable?.id],
      queryFn: () => projectsServices.getCertificateDetails(relatable?.id),
    });
    if (isFetching) {
      return <LinearProgress />;
    }
    return (
      <CertificateOnScreen
        isFromProcessApproval={true}
        certificate={certificateDetails}
        organization={authOrganization?.organization as Organization}
      />
    );
  }

  if (
    relatable.relatable_type === 'bill' ||
    ledger_item.relatable_type === 'bill'
  ) {
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

function RequisitionLedgerItemRow({
  currencyDetails,
  currencyChanged = false,
  ledger_item,
  index,
  requisition_ledger_items = [],
  setRequisition_ledger_items,
  isDuplicate = false,
  costCenterId,
  notAllowedLedgers = [],
}: RequisitionLedgerItemRowProps) {
  const [showForm, setShowForm] = useState(
    isDuplicate && Boolean(ledger_item?.relatable_id)
  );
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedRelated, setSelectedRelated] = useState<any>(null);
  const { checkOrganizationPermission } = useJumboAuth();
  const canSeeBudget = checkOrganizationPermission([
    PERMISSIONS.BUDGETS_CREATE,
    PERMISSIONS.BUDGETS_EDIT,
    PERMISSIONS.BUDGETS_READ,
    PERMISSIONS.BUDGETS_DELETE,
  ]);
  const [openLedgerBudgetDialog, setOpenLedgerBudgetDialog] = useState(false);
  const [ledgerDialogData, setLedgerDialogData] = useState<{
    ledgerId: number;
    ledgerName: string;
    costCenterId?: number;
    currency?: Currency;
  } | null>(null);

  const handleRemoveItem = () => {
    setRequisition_ledger_items((currentItems) => {
      const newItems = [...currentItems];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  useEffect(() => {
    if (currencyChanged && ledger_item?.relatable_id) {
      setShowForm(true);
    }
  }, [currencyChanged]);

  return (
    <React.Fragment>
      <Divider />
      {!showForm ? (
        <Grid
          container
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Grid size={{ xs: 1, md: 0.5 }}>{index + 1}.</Grid>
          <Grid
            size={{
              xs: 11,
              md: !ledger_item.relatable_id ? 5.5 : 4.5,
              lg: !ledger_item.relatable_id ? 4.5 : 3.5,
            }}
          >
            <ListItemText
              primary={
                <Typography
                  variant={'h5'}
                  fontSize={14}
                  lineHeight={1.25}
                  mb={0}
                  component='div'
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                  }}
                >
                  <Tooltip title={'Relatable To'}>
                    <span>{ledger_item.ledger?.name}</span>
                  </Tooltip>
                  {ledger_item.ledger && canSeeBudget && (
                    <Tooltip title={`${ledger_item.ledger.name} Budget check`}>
                      <IconButton
                        size='small'
                        onClick={() => {
                          const selectedLedger = ledger_item.ledger;
                          if (!selectedLedger) return;
                          setLedgerDialogData({
                            ledgerId: selectedLedger.id,
                            ledgerName: selectedLedger.name,
                            costCenterId: costCenterId,
                            currency: currencyDetails,
                          });
                          setOpenLedgerBudgetDialog(true);
                        }}
                      >
                        <AccountBalanceWalletOutlined fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  )}
                </Typography>
              }
              secondary={
                <Tooltip title={'Remarks'}>
                  <Typography
                    component='span'
                    variant='body2'
                    fontSize={14}
                    lineHeight={1.25}
                    mb={0}
                  >
                    {ledger_item.remarks}
                  </Typography>
                </Tooltip>
              }
            />
          </Grid>
          {ledger_item.relatable_id && (
            <Grid size={{ xs: 7, md: 1 }}>
              <ListItemText
                primary={
                  <Tooltip title={'Relatable To'}>
                    <Typography
                      variant={'caption'}
                      fontSize={14}
                      lineHeight={1.25}
                      mb={0}
                      noWrap
                    >
                      {ledger_item?.relatableNo}
                    </Typography>
                  </Tooltip>
                }
                secondary={
                  <>
                    <Tooltip title={'Order Date - (Amount)'}>
                      <Typography
                        variant={'caption'}
                        fontSize={14}
                        lineHeight={1.25}
                        mb={0}
                      >
                        {`${readableDate(ledger_item.relatable?.order_date || ledger_item.relatable?.certificate_date || ledger_item.relatable?.transaction_date, false)} - ${
                          (
                            ledger_item.relatable?.unapproved_amount ??
                            ledger_item.relatable?.total_amount
                          )?.toLocaleString(
                            'en-US',
                            ledger_item.relatable?.currency?.code
                              ? {
                                  style: 'currency',
                                  currency: ledger_item.relatable.currency.code,
                                }
                              : { minimumFractionDigits: 2 }
                          ) || ''
                        }`}
                      </Typography>
                    </Tooltip>
                    <Tooltip
                      title={`View ${
                        ledger_item.relatable_type === 'purchase'
                          ? 'Order'
                          : ledger_item.relatable_type === 'bill'
                            ? 'Bill'
                            : 'Certificate'
                      } Details`}
                    >
                      <IconButton
                        onClick={() => {
                          setSelectedRelated(ledger_item.relatable);
                          setOpenViewDialog(true);
                        }}
                      >
                        <VisibilityOutlined />
                      </IconButton>
                    </Tooltip>
                  </>
                }
              />
            </Grid>
          )}
          <Grid
            textAlign={!ledger_item.relatable_id ? { md: 'end' } : 'end'}
            size={{ xs: !ledger_item.relatable_id ? 8 : 5, md: 2 }}
          >
            <Tooltip title='Quantity'>
              <Typography>
                {ledger_item.quantity?.toLocaleString()} {''}
                {ledger_item?.unit_symbol ||
                  ledger_item.measurement_unit?.symbol ||
                  ledger_item.product?.unit_symbol}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid
            textAlign={!ledger_item.relatable_id ? 'end' : { md: 'end' }}
            size={{ xs: !ledger_item.relatable_id ? 4 : 6, md: 2 }}
          >
            <Tooltip title='Rate'>
              <Typography>{ledger_item.rate?.toLocaleString()}</Typography>
            </Tooltip>
          </Grid>
          <Grid
            textAlign={!ledger_item.relatable_id ? { md: 'end' } : 'end'}
            size={{ xs: 6, md: 2 }}
          >
            <Tooltip title='Amount'>
              <Typography>
                {(
                  (ledger_item?.rate ?? 0) * (ledger_item?.quantity ?? 0)
                ).toLocaleString('en-US', {
                  style: 'currency',
                  currency: currencyDetails?.code,
                })}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid textAlign={'end'} size={{ xs: 12, lg: 1 }}>
            <Tooltip title='Edit Item'>
              <IconButton
                size='small'
                onClick={() => {
                  setShowForm(true);
                }}
              >
                <EditOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Remove Item'>
              <IconButton size='small' onClick={handleRemoveItem}>
                <DisabledByDefault fontSize='small' color='error' />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <RequisitionLedgerItemForm
          ledger_item={ledger_item}
          setShowForm={setShowForm}
          index={index}
          isDuplicate={isDuplicate}
          currencyChanged={currencyChanged}
          currencyDetails={currencyDetails}
          costCenterId={costCenterId}
          notAllowedLedgers={notAllowedLedgers}
          requisition_ledger_items={requisition_ledger_items}
          setRequisition_ledger_items={setRequisition_ledger_items}
        />
      )}

      <Dialog
        open={openViewDialog}
        maxWidth='md'
        fullWidth
        onClose={() => setOpenViewDialog(false)}
      >
        <FetchRelatableDetails
          relatable={selectedRelated}
          toggleOpen={setOpenViewDialog}
          ledger_item={ledger_item}
        />
      </Dialog>

      <LedgerBudgetCheckDetails
        open={openLedgerBudgetDialog}
        onClose={() => setOpenLedgerBudgetDialog(false)}
        ledgerId={ledgerDialogData?.ledgerId || 0}
        costCenterId={ledgerDialogData?.costCenterId || 0}
        currency={ledgerDialogData?.currency as any}
        ledgerName={ledgerDialogData?.ledgerName || ''}
      />
    </React.Fragment>
  );
}

export default RequisitionLedgerItemRow;
