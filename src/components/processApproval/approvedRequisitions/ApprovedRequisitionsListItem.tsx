'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Chip,
  Grid,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import ApprovedPurchaseActionTail from './approvedPurchase/ApprovedPurchaseActionTail';
import ApprovedPurchaseListItem from './approvedPurchase/ApprovedPurchaseListItem';
import ApprovedPaymentActionTail from './approvedPayment/ApprovedPaymentActionTail';
import ApprovedPaymentListItem from './approvedPayment/ApprovedPaymentListItem';
import ImprestRequisitionTabs from './imprestRetirement/ImprestRequisitionTabs';
import ApprovalItemAction from '../requisitions/listItem/tabs/ApprovalItemAction';
import { CreditScoreOutlined, Inventory2Outlined, ShoppingCartOutlined, VerifiedRounded } from '@mui/icons-material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import {
  ApprovalRequisition,
  MaterialApprovalRequisition,
  PaymentApprovalRequisition,
  PurchaseApprovalRequisition,
} from './ApprovalRequisitionType';
import { processTypeConfig } from '../utils/requisition';
import MaterialRequisitionTabs, { MATERIAL_TAB } from './material/MaterialRequisitionTabs';

interface ApprovedRequisitionsListItemProps {
  approvedRequisition: ApprovalRequisition;
}

const ApprovedRequisitionsListItem: React.FC<ApprovedRequisitionsListItemProps> = ({ approvedRequisition }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [activeImprestTab, setActiveImprestTab] = useState(0);
  const [activeMaterialTab, setActiveMaterialTab] = useState<number>(MATERIAL_TAB.PURCHASE_ORDERS);
  const { checkOrganizationPermission } = useJumboAuth();

  const handleChange = (id: number) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isPayment = ['PAYMENT', 'IMPREST'].includes(approvedRequisition.process_type);
  const isImprest = approvedRequisition.process_type === 'IMPREST';
  const isPurchase = approvedRequisition.process_type === 'PURCHASE';
  const isMaterial = approvedRequisition.process_type === 'MATERIAL';
  const processConfig = processTypeConfig[approvedRequisition.process_type as keyof typeof processTypeConfig] || {
    label: approvedRequisition.process_type,
    color: 'default' as const,
  };
  const paymentsCount =
    isPayment || isMaterial
      ? (approvedRequisition as PaymentApprovalRequisition).payments_count || 0
      : 0;
  const purchasesCount =
    isPurchase || isMaterial
      ? (approvedRequisition as PurchaseApprovalRequisition).purchase_orders_count || 0
      : 0;
  const issuesCount = isMaterial
    ? (approvedRequisition as MaterialApprovalRequisition).issues_count || 0
    : 0;
  const paymentsOrPurchasesCount = isPayment ? paymentsCount : purchasesCount;
  const paymentRequisition = approvedRequisition as PaymentApprovalRequisition & { is_fully_paid?: boolean | number | string };
  const isFullyPaid = paymentRequisition?.is_fully_paid === true;

  const isFullyProcessed = isMaterial
    ? (approvedRequisition as MaterialApprovalRequisition).is_fully_fulfilled
    : isPayment
    ? isFullyPaid
    : (approvedRequisition as PurchaseApprovalRequisition).is_fully_ordered;
  const hasProcessItems = paymentsOrPurchasesCount > 0 || issuesCount > 0;

  const materialRequisition = approvedRequisition as MaterialApprovalRequisition;

  return (
    <Accordion
      key={approvedRequisition.id}
      expanded={!!expanded[approvedRequisition.id]}
      onChange={() => handleChange(approvedRequisition.id)}
      square
      sx={{
        borderRadius: 2,
        borderTop: 2,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <AccordionSummary
        expandIcon={expanded[approvedRequisition.id] ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 2,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            minWidth: 0,
            '&.Mui-expanded': {
              margin: '10px 0',
            },
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',
            transform: 'none',
            mr: 0.5,
            '&.Mui-expanded': {
              transform: 'none',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
            '& svg': {
              fontSize: '0.9rem',
            },
          },
        }}
      >
        <Grid container spacing={1} alignItems="center" width="100%" sx={{ paddingLeft: 1, paddingRight: 1, minWidth: 0 }}>
          <Grid size={{ xs: 12, md: 2 }}>
            <Tooltip title="Requisition No.">
              <Typography>{approvedRequisition.requisition.requisitionNo}</Typography>
            </Tooltip>
            <Tooltip title="Approval Date">
              <Typography variant="caption">{readableDate(approvedRequisition.approval_date)}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 2.5 }} sx={{ minWidth: 0 }}>
            <Tooltip title="Process">
              <Typography variant="body2">{processConfig.label}</Typography>
            </Tooltip>
            {approvedRequisition.requisition.cost_center?.name && (
              <Tooltip title={approvedRequisition.requisition.cost_center.name}>
                <Chip
                  size="small"
                  label={approvedRequisition.requisition.cost_center.name}
                  sx={{
                    mt: 0.5,
                    maxWidth: '100%',
                    minWidth: 0,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              </Tooltip>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 4, lg: 4.8 }}>
            <Tooltip title="Remarks">
              <Typography
                component="span"
                variant="body2"
                fontSize={14}
                mb={0}
                sx={{ flexWrap: 'wrap' }}
              >
                {approvedRequisition.remarks}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 8, md: 2.5, lg: 1.7 }}>
            <Tooltip title="Amount">
              <Typography>
                {(approvedRequisition.amount + approvedRequisition.vat_amount)?.toLocaleString('en-US', {
                  style: 'currency',
                  currency: approvedRequisition.currency?.code,
                })}
              </Typography>
            </Tooltip>
            <Tooltip title="Status">
              <Chip size="small" label={approvedRequisition.status_label} color="success" />
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 4, md: 1 }}>
            <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center" mt={2}>
              {(hasProcessItems && (!isFullyProcessed || paymentsOrPurchasesCount > 1 || issuesCount > 0)) && (
                <Tooltip title={isPayment ? 'Payments Count' : 'Purchase Orders Count'}>
                  <Badge badgeContent={paymentsOrPurchasesCount} color="info">
                    {isPayment ? <CreditScoreOutlined fontSize="small" /> : <ShoppingCartOutlined fontSize="small" />}
                  </Badge>
                </Tooltip>
              )}

              {isMaterial && issuesCount > 0 && (
                <Tooltip title='Store Issues Count'>
                  <Badge badgeContent={issuesCount} color='info'>
                    <Inventory2Outlined fontSize='small' />
                  </Badge>
                </Tooltip>
              )}

              {isFullyProcessed && (
                <Tooltip
                  title={
                    isMaterial
                      ? 'Fully Fulfilled'
                      : isPayment
                        ? 'Fully Paid'
                        : 'Fully Ordered'
                  }
                >
                  <VerifiedRounded fontSize="small" color="success" />
                </Tooltip>
              )}
            </Stack>
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails sx={{ backgroundColor: 'background.paper', marginBottom: 3 }}>
        <Grid container spacing={1}>
          <Grid size={{ xs: 12 }} sx={{ textAlign: 'end' }}>
            <Grid container spacing={1} justifyContent="flex-end">
              <Grid>
                <ApprovalItemAction approval={approvedRequisition as any} hideOtherActions />
              </Grid>
              <Grid>
                {/* Non-material types: unchanged, always shown */}
                {isPurchase &&
                  checkOrganizationPermission([PERMISSIONS.APPROVED_REQUISITIONS_PURCHASE]) &&
                  !(approvedRequisition as PurchaseApprovalRequisition).is_fully_ordered && (
                    <ApprovedPurchaseActionTail
                      approvedRequisition={approvedRequisition as PurchaseApprovalRequisition}
                      isExpanded={expanded[approvedRequisition.id]}
                    />
                  )}
                {(!isImprest && isPayment) &&
                  checkOrganizationPermission([PERMISSIONS.APPROVED_REQUISITIONS_PAY]) &&
                  !isFullyPaid && (
                    <ApprovedPaymentActionTail
                      approvedRequisition={approvedRequisition as PaymentApprovalRequisition}
                      isExpanded={expanded[approvedRequisition.id]}
                    />
                  )}
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            {isImprest ? (
              <ImprestRequisitionTabs
                approvedRequisition={approvedRequisition as PaymentApprovalRequisition}
                activeTab={activeImprestTab}
                setActiveTab={setActiveImprestTab}
                isExpanded={expanded[approvedRequisition.id]}
              />
            ) : isMaterial ? (
              <MaterialRequisitionTabs
                approvedRequisition={approvedRequisition as MaterialApprovalRequisition}
                activeTab={activeMaterialTab}
                setActiveTab={setActiveMaterialTab}
                isExpanded={expanded[approvedRequisition.id]}
              />
            ) : isPayment ? (
              <ApprovedPaymentListItem
                approvedRequisition={approvedRequisition as PaymentApprovalRequisition}
                isExpanded={expanded[approvedRequisition.id]}
              />
            ) : (
              <ApprovedPurchaseListItem
                approvedRequisition={approvedRequisition as PurchaseApprovalRequisition}
                isExpanded={expanded[approvedRequisition.id]}
              />
            )}
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default React.memo(ApprovedRequisitionsListItem);