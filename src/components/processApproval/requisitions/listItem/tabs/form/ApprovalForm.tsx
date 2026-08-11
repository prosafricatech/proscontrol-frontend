import {
  readableDate,
  sanitizedNumber,
} from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import userLedgerServices from '@/components/accounts/ledgers/user-ledger-services';
import approvalChainsServices from '@/components/masters/approvalChains/approvalChainsServices';
import {
  Approval,
  Requisition,
  RequisitionItem,
  Vendor,
} from '@/components/processApproval/RequisitionType';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  ButtonGroup,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import UndoIcon from '@mui/icons-material/Undo';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import * as yup from 'yup';
import requisitionsServices from '../../../../requisitionsServices';
import ApprovalRequisitionLedgerItem from './ApprovalRequisitionLedgerItem';
import ApprovalRequisitionProductItem from './ApprovalRequisitionProductItem';

interface ApprovalFormProps {
  toggleOpen: (value: boolean) => void;
  requisition: Requisition;
  approval?: Approval;
  isEdit?: boolean;
}

interface FormValues {
  id?: number;
  requisition_id: number;
  approval_date: string;
  date_required?: string;
  process_type: string;
  remarks?: string;
  product_items?: any[];
  ledger_items?: any[];
  additional_costs?: any[];
  imprest_ledger_id?: number | null;
  chain_level_id?: number;
  submit_type?: string;
  returned_to_level_id?: number | null;
}

type ImprestLedgerOption = {
  id: number;
  type?: string;
  ledger_id?: number;
  name?: string;
  ledger?: {
    id?: number;
    name?: string;
  };
};

const extractList = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

interface ItemChangeParams {
  index: number;
  key: string;
  value: any;
}

function ApprovalForm({
  toggleOpen,
  requisition,
  approval,
  isEdit = false,
}: ApprovalFormProps) {
  const [approvalDate] = useState<Dayjs>(dayjs());
  const [dateRequired] = useState<Dayjs | null>(
    requisition?.date_required ? dayjs(requisition.date_required) : null
  );
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { checkOrganizationPermission } = useJumboAuth();
  const requisitionItems: RequisitionItem[] =
    'items' in requisition ? requisition.items || [] : [];

  const getInitialProductItems = (): RequisitionItem[] => {
    const items = approval?.items || requisitionItems;
    return items.map((item: RequisitionItem) => ({
      ...item,
      id: item.requisition_product?.id || item.id,
      product: item.product || item.requisition_product?.product,
      vendors: item.vendors?.map((vendor: Vendor) => ({
        ...vendor,
        stakeholder_id: vendor.id,
      })),
      quantity: item.quantity || 0,
      rate: item.rate || 0,
      remarks: item.remarks || '',
      fulfillment_type: (item as any).fulfillment_type || 'PURCHASE',
      store_id: (item as any).store_id || null,
      store: (item as any).store || null,
      stock_balances: (item as any).stock_balances || [],
    }));
  };

const getInitialLedgerItems = (): RequisitionItem[] => {
  const items = approval?.items || requisitionItems;
  
  // Check if we have an approval (meaning it's an edit or next approval)
  const hasApproval = !!approval;
  
  // If there's no approval, it's a new approval
  if (!hasApproval) {
    return items.map((item: RequisitionItem) => ({
      ...item,
      id: item.requisition_ledger_item?.id || item.id,
      ledger: item.ledger || item.requisition_ledger_item?.ledger,
      measurement_unit:
        item.measurement_unit || item.requisition_ledger_item?.measurement_unit,
      quantity: item.quantity || 0,
      rate: item.rate || 0,
      remarks: item.remarks || '',
      relatable: (item as any).relatable || null,
      relatable_type: (item as any).relatable_type || null,
      splits: [],
    }));
  }
  
  // For edit mode (when approval exists), group items by requisition_ledger_item_id
  const groupedItems: Record<number, any[]> = {};
  
  items.forEach((item: any) => {
    const parentId = item.requisition_ledger_item?.id || item.requisition_ledger_item_id;
    if (!groupedItems[parentId]) {
      groupedItems[parentId] = [];
    }
    groupedItems[parentId].push(item);
  });

  // Build the structure with main items and their splits
  const result: RequisitionItem[] = [];

  Object.values(groupedItems).forEach((group: any[]) => {
    // Find the main item (credit_ledger_id is null)
    const mainItem = group.find((item: any) => !item.credit_ledger_id);
    // Find all split items (credit_ledger_id is not null)
    const splitItems = group.filter((item: any) => item.credit_ledger_id);

    if (mainItem) {
      // Create the main item with its splits
      const mainLedgerItem = {
        id: mainItem.requisition_ledger_item?.id || mainItem.id,
        ledger: mainItem.requisition_ledger_item?.ledger || mainItem.ledger,
        measurement_unit: mainItem.measurement_unit || mainItem.requisition_ledger_item?.measurement_unit,
        quantity: mainItem.quantity || 0,
        rate: mainItem.rate || 0,
        remarks: mainItem.remarks || '',
        relatable: mainItem.relatable || null,
        relatable_type: mainItem.relatable_type || null,
        splits: splitItems.map((split: any) => ({
          credit_ledger_id: split.credit_ledger_id,
          ledger: split.credit_ledger,
          quantity: split.quantity || 0,
          rate: split.rate || 0,
          amount: (split.quantity || 0) * (split.rate || 0),
          remarks: split.remarks || '',
        })),
      };
      result.push(mainLedgerItem as any);
    } else if (splitItems.length > 0) {
      // If there's no main item, create one from the first split
      const firstSplit = splitItems[0];
      const mainLedgerItem = {
        id: firstSplit.requisition_ledger_item?.id || firstSplit.id,
        ledger: firstSplit.requisition_ledger_item?.ledger || firstSplit.ledger,
        measurement_unit: firstSplit.measurement_unit || firstSplit.requisition_ledger_item?.measurement_unit,
        quantity: firstSplit.quantity || 0,
        rate: firstSplit.rate || 0,
        remarks: firstSplit.remarks || '',
        relatable: firstSplit.relatable || null,
        relatable_type: firstSplit.relatable_type || null,
        splits: splitItems.map((split: any) => ({
          credit_ledger_id: split.credit_ledger_id,
          ledger: split.credit_ledger,
          quantity: split.quantity || 0,
          rate: split.rate || 0,
          amount: (split.quantity || 0) * (split.rate || 0),
          remarks: split.remarks || '',
        })),
      };
      result.push(mainLedgerItem as any);
    }
  });

  return result;
};

  const getInitialAdditionalCosts = () => {
    const source =
      (approval as any)?.additional_costs ||
      (requisition as any)?.additional_costs ||
      [];

    return source.map((cost: any) => ({
      ...cost,
      id:
        cost?.requisition_additional_cost?.id ||
        cost?.requisition_additional_cost_id ||
        cost?.id,
      amount: Number(cost?.amount || 0),
      exchange_rate: Number(cost?.exchange_rate || 1),
      credit_ledger_name:
        cost?.credit_ledger_name || cost?.ledger?.name || cost?.name || '',
      currency_name: cost?.currency_name || cost?.currency?.name || '',
      currency_id: cost?.currency_id || cost?.currency?.id,
    }));
  };

  const [requisitionProductItem, setRequisitionProductItem] = useState<
    RequisitionItem[]
  >(getInitialProductItems());
  const [requisitionLedgerItem, setRequisitionLedgerItem] = useState<
    RequisitionItem[]
  >(getInitialLedgerItems());
  const [requisitionAdditionalCosts, setRequisitionAdditionalCosts] = useState<
    any[]
  >(getInitialAdditionalCosts());
  const [activePurchaseTab, setActivePurchaseTab] = useState(0);

  useEffect(() => {
    setRequisitionProductItem(getInitialProductItems());
    setRequisitionLedgerItem(getInitialLedgerItems());
    setRequisitionAdditionalCosts(getInitialAdditionalCosts());
  }, [requisition, approval]);

  const isPurchaseType =
    requisition?.approval_chain?.process_type?.toLowerCase() === 'purchase';
  const isPaymentType =
    requisition?.approval_chain?.process_type?.toLowerCase() === 'payment';
  const isMaterialType =
    requisition?.approval_chain?.process_type?.toLowerCase() === 'material';
  const isImprestType =
    requisition?.approval_chain?.process_type?.toLowerCase() === 'imprest';
  const isFinal = isEdit
    ? approval?.is_final === 1
    : requisition?.next_approval_level?.is_final;

  // Calculate Grand Total including splits
  const approvalDisplayValue = React.useMemo(() => {
    // For ledger items (payment type), calculate total including splits
    if (!isPurchaseType && !isMaterialType) {
      // Calculate total from main items and their splits
      let total = 0;
      requisitionLedgerItem.forEach((item) => {
        // Main item amount
        const mainAmount = Number(item.quantity || 0) * Number(item.rate || 0);
        total += mainAmount;
        
        // Split amounts
        const splits: any[] = (item as any).splits || [];
        splits.forEach((split) => {
          const splitAmount = Number(split.amount || 0) || (Number(split.quantity || 0) * Number(split.rate || 0));
          total += splitAmount;
        });
      });
      return total;
    }

    // For product items (purchase/material type)
    const lineItemsTotal = requisitionProductItem.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0),
      0
    );

    const vatTotal = requisitionProductItem.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.rate || 0) *
          Number(item.vat_percentage || 0) *
          0.01,
      0
    );
    const additionalTotal = requisitionAdditionalCosts.reduce(
      (sum, cost) => sum + Number(cost.amount || 0),
      0
    );

    return lineItemsTotal + vatTotal + additionalTotal;
  }, [
    isPurchaseType,
    isMaterialType,
    requisitionProductItem,
    requisitionLedgerItem,
    requisitionAdditionalCosts,
  ]);

  const hasImprestFulfillment = React.useMemo(
    () =>
      isMaterialType &&
      requisitionProductItem.some(
        (item: any) => item.fulfillment_type === 'IMPREST'
      ),
    [isMaterialType, requisitionProductItem]
  );

  const { data: creatorLedgers } = useQuery({
    queryKey: ['creator-ledgers', requisition?.creator?.id],
    queryFn: () => userLedgerServices.getUserLedgers(requisition?.creator?.id),
    enabled: isMaterialType,
  });

  const imprestLedgerOptions = React.useMemo(
    () => extractList(creatorLedgers) as ImprestLedgerOption[],
    [creatorLedgers]
  );

  const filteredImprestLedgerOptions = React.useMemo(
    () =>
      imprestLedgerOptions.filter((item) => {
        const typeValue = String(item.type || '').toLowerCase();
        return typeValue === 'imprest' || !typeValue;
      }),
    [imprestLedgerOptions]
  );
  const isLeaveType =
    requisition?.approval_chain?.process_type?.toLowerCase() ===
    'leave_request';

  // Whoever wrote the last remarks (the previous approver's return reason, or
  // the requester's own notes if this is the very first action) — shown as
  // read-only context rather than pre-filled into the new Remarks box below,
  // so each person's comment stays their own instead of silently overwriting
  // (or having to hand-preserve) whatever came before it.
  const previousRemarks = approval?.remarks || requisition?.remarks || '';
  const previousRemarksLabel = approval
    ? approval.status_label || 'Previous remarks'
    : requisition?.creator?.name
      ? `Requester's remarks (${requisition.creator.name})`
      : "Requester's remarks";

  // "Send back" — an approver can return the requisition to an earlier level
  // (or to the requester) instead of only approving/holding/rejecting forward.
  // Not offered for leave requests, which use a separate approval mechanism.
  const canReturn = !isLeaveType;
  const [returnMode, setReturnMode] = useState(false);
  const [returnTargetId, setReturnTargetId] = useState<number | 'requester' | ''>('');

  // Approve stays the one prominent button (it's the common case); Hold,
  // Reject and Return collapse into a menu next to it — keeps the action bar
  // to two elements instead of up to five, which is what actually matters for
  // fitting on a phone screen without wrapping.
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const closeActionMenu = () => setActionMenuAnchor(null);

  const { data: approvalChainLevels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ['approvalChainLevels', { approvalChainId: requisition?.approval_chain?.id }],
    queryFn: () =>
      approvalChainsServices.getApprovalChainLevels(requisition.approval_chain.id),
    enabled: canReturn && !!requisition?.approval_chain?.id,
  });

  const actingLevelId = isEdit
    ? approval?.approval_chain_level_id
    : requisition?.next_approval_level?.id;

  const actingPositionIndex = extractList(approvalChainLevels).find(
    (level: any) => level.id === actingLevelId
  )?.position_index;

  // Levels an approver may send this back to: strictly earlier than their own.
  const earlierLevels = React.useMemo(
    () =>
      actingPositionIndex === undefined
        ? []
        : extractList(approvalChainLevels)
            .filter((level: any) => level.position_index < actingPositionIndex)
            .sort((a: any, b: any) => a.position_index - b.position_index),
    [approvalChainLevels, actingPositionIndex]
  );

  const returnTargetOptions = React.useMemo(
    () => [
      { id: 'requester' as const, label: 'Requester' },
      ...earlierLevels.map((level: any) => ({
        id: level.id as number,
        label: `${level.label}${level.role?.name ? ` — ${level.role.name}` : ''}`,
      })),
    ],
    [earlierLevels]
  );

  const validationSchema = yup.object().shape({
    approval_date: yup
      .string()
      .required('Approval Date is required')
      .typeError('Approval Date is required'),
    date_required: yup.string().nullable(),
    product_items:
      isPurchaseType || isMaterialType
        ? yup.array().of(
            yup.object().shape({
              fulfillment_type: isMaterialType
                ? yup
                    .string()
                    .required('Fulfillment type is required')
                    .oneOf(['STOCK', 'PURCHASE', 'IMPREST'])
                : yup.string().nullable(),
              store_id: isMaterialType
                ? yup
                    .number()
                    .nullable()
                    .when('fulfillment_type', {
                      is: 'STOCK',
                      then: (schema) =>
                        schema
                          .required('Store is required for stock fulfillment')
                          .typeError('Store is required for stock fulfillment'),
                      otherwise: (schema) => schema.nullable(),
                    })
                : yup.number().nullable(),
              rate: isMaterialType
                ? yup
                    .number()
                    .nullable()
                    .when('fulfillment_type', {
                      is: (value: string) =>
                        value === 'PURCHASE' || value === 'IMPREST',
                      then: (schema) =>
                        schema
                          .required('Rate is required')
                          .positive('Rate is required')
                          .typeError('Rate is required'),
                      otherwise: (schema) => schema.nullable(),
                    })
                : isFinal
                  ? yup
                      .number()
                      .required('Rate is required for final approval')
                      .positive('Rate is required for final approval')
                      .typeError('Rate is required for final approval')
                  : yup.number().nullable(),
              quantity:
                isFinal || isMaterialType
                  ? yup
                      .number()
                      .required('Quantity is required')
                      .positive('Quantity is required')
                      .typeError('Quantity is required')
                  : yup.number().nullable(),
            })
          )
        : yup.array().nullable(),
    imprest_ledger_id: yup
      .number()
      .nullable()
      .test(
        'material-imprest-ledger',
        'Imprest Ledger is required when any line is Imprest',
        (value) => !(isMaterialType && hasImprestFulfillment) || !!value
      ),
    additional_costs: isPurchaseType
      ? yup.array().of(
          yup.object().shape({
            amount: yup
              .number()
              .required('Amount is required')
              .positive('Amount is required')
              .typeError('Amount is required'),
          })
        )
      : yup.array().nullable(),
    ledger_items:
      !isPurchaseType && !isMaterialType && !isLeaveType
        ? yup.array().of(
            yup.object().shape({
              rate: yup
                .number()
                .required('Rate is required')
                .positive('Rate is required')
                .typeError('Rate is required'),
              quantity: yup
                .number()
                .required('Quantity is required')
                .positive('Quantity is required')
                .typeError('Quantity is required'),
              splits: yup.array().of(
                yup.object().shape({
                  credit_ledger_id: yup
                    .number()
                    .nullable()
                    .required('Ledger is required'),
                  quantity: yup
                    .number()
                    .required('Quantity is required')
                    .positive('Quantity must be positive')
                    .typeError('Quantity must be a number'),
                  rate: yup
                    .number()
                    .required('Rate is required')
                    .positive('Rate must be positive')
                    .typeError('Rate must be a number'),
                })
              ),
            })
          )
        : yup.array().nullable(),
  });

  const {
    handleSubmit,
    setValue,
    watch,
    getValues,
    register,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: approval?.id,
      requisition_id: requisition.id,
      approval_date: approvalDate.toISOString(),
      date_required: dateRequired?.toISOString() || '',
      process_type: requisition?.approval_chain?.process_type,
      // Only carry the remarks forward when editing your own already-submitted
      // approval (isEdit) — a brand-new action starts with a blank comment,
      // with the previous one shown separately as read-only context.
      remarks: isEdit ? approval?.remarks || '' : '',
      product_items:
        isPurchaseType || isMaterialType
          ? approval?.items || requisitionItems
          : [],
      imprest_ledger_id:
        isMaterialType || isImprestType
          ? (approval as any)?.imprest_ledger?.id || null
          : null,
      additional_costs: isPurchaseType ? getInitialAdditionalCosts() : [],
      ledger_items:
        !isPurchaseType && !isMaterialType && !isLeaveType
          ? approval?.items || requisitionItems
          : [],
      chain_level_id:
        approval && isEdit
          ? approval.approval_chain_level_id
          : requisition?.next_approval_level?.id,
    },
  });

  const approveRequisition = useMutation({
    mutationFn: requisitionsServices.approveRequisition,
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const editApprovalRequisition = useMutation({
    mutationFn: requisitionsServices.editApprovalRequisition,
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const handleItemChange = ({ index, key, value }: ItemChangeParams) => {
    let updatedItems;

    if (
      ['purchase', 'material'].includes(
        requisition?.approval_chain?.process_type?.toLowerCase() || ''
      )
    ) {
      updatedItems = [...requisitionProductItem];
      if (updatedItems[index]) {
        updatedItems[index] = {
          ...updatedItems[index],
          [key]: Number.isNaN(value) ? null : value,
        };
        setRequisitionProductItem(updatedItems);
      }
    } else {
      updatedItems = [...requisitionLedgerItem];
      if (updatedItems[index]) {
        updatedItems[index] = {
          ...updatedItems[index],
          [key]: Number.isNaN(value) ? null : value,
        };
        setRequisitionLedgerItem(updatedItems);
      }
    }
  };

  const handleAdditionalCostAmountChange = (index: number, value: number) => {
    setRequisitionAdditionalCosts((prevCosts) => {
      const updatedCosts = [...prevCosts];
      if (updatedCosts[index]) {
        updatedCosts[index] = {
          ...updatedCosts[index],
          amount: value,
        };
      }
      return updatedCosts;
    });
  };

  // This useEffect sets the form values for validation - keeps splits nested
  useEffect(() => {
    if (isPurchaseType || isMaterialType) {
      const product_items = requisitionProductItem?.map((item) => ({
        requisition_product_item_id: item.id,
        vat_percentage: item.vat_percentage,
        quantity: item.quantity,
        rate: item.rate,
        remarks: item.remarks,
        vendors: isMaterialType ? undefined : item.vendors,
        fulfillment_type: (item as any).fulfillment_type,
        store_id: (item as any).store_id,
      }));

      setValue('product_items', product_items, {
        shouldValidate: true,
        shouldDirty: true,
      });

      if (isPurchaseType) {
        const additional_costs = requisitionAdditionalCosts?.map((cost) => ({
          requisition_additional_cost_id: cost.id,
          ledger_id: cost.ledger_id || cost.ledger?.id,
          credit_ledger_name: cost.credit_ledger_name || cost.name,
          currency_id: cost.currency_id || cost.currency?.id,
          exchange_rate: Number(cost.exchange_rate || 1),
          reference: cost.reference,
          amount: Number(cost.amount || 0),
        }));

        setValue('additional_costs', additional_costs, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    } else if (!isMaterialType) {
      // Keep splits nested for validation
      const ledger_items = requisitionLedgerItem?.map((item) => {
        const splits: any[] = (item as any).splits || [];

        return {
          requisition_ledger_item_id: item.id,
          credit_ledger_id: null,
          quantity: item.quantity,
          rate: item.rate,
          remarks: item.remarks,
          measurement_unit_id: item.measurement_unit?.id,
          splits: splits.map((split: any) => ({
            credit_ledger_id: split.credit_ledger_id,
            quantity: split.quantity,
            rate: split.rate,
            amount: split.amount,
            remarks: split.remarks,
          })),
        };
      });

      setValue('ledger_items', ledger_items, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [
    requisitionProductItem,
    requisitionLedgerItem,
    requisitionAdditionalCosts,
    setValue,
    isPurchaseType,
    isMaterialType,
  ]);

  useEffect(() => {
    if (isMaterialType && !hasImprestFulfillment) {
      setValue('imprest_ledger_id', null, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [isMaterialType, hasImprestFulfillment, setValue]);

  const saveMutation = React.useMemo(() => {
    return isEdit ? editApprovalRequisition.mutate : approveRequisition.mutate;
  }, [isEdit, editApprovalRequisition, approveRequisition]);

  const watchedImprestLedgerId = watch('imprest_ledger_id');
  const watchedApprovalDate = watch('approval_date');

  // Flatten splits for submission
  const flattenLedgerItems = (items: any[]) => {
    if (!items) return [];
    
    const result: any[] = [];
    
    items.forEach((item) => {
      const splits = item.splits || [];
      
      // Main line without splits
      const mainLine = {
        requisition_ledger_item_id: item.requisition_ledger_item_id,
        credit_ledger_id: null,
        quantity: item.quantity,
        rate: item.rate,
        remarks: item.remarks,
        measurement_unit_id: item.measurement_unit_id,
      };
      result.push(mainLine);
      
      // Split lines
      splits.forEach((split: any) => {
        result.push({
          requisition_ledger_item_id: item.requisition_ledger_item_id,
          credit_ledger_id: split.credit_ledger_id,
          quantity: split.quantity,
          rate: split.rate,
          remarks: split.remarks,
          measurement_unit_id: item.measurement_unit_id,
          is_split: true,
        });
      });
    });
    
    return result;
  };

  const onSubmit: SubmitHandler<FormValues> = (formData) => {
    let payload: any = {
      ...formData,
      product_items:
        isPurchaseType || isMaterialType ? formData.product_items : undefined,
      additional_costs: isPurchaseType ? formData.additional_costs : undefined,
      imprest_ledger_id:
        isMaterialType && hasImprestFulfillment
          ? formData.imprest_ledger_id
          : undefined,
    };

    // Flatten ledger_items for submission
    if (!isPurchaseType && !isMaterialType && !isLeaveType) {
      payload.ledger_items = flattenLedgerItems(formData.ledger_items as any);
    }

    saveMutation(payload);
  };

  const canConfirmReturn = returnTargetId !== '' && !!(watch('remarks') || '').trim();

  // A return is an instruction, not a decision — it carries no line items, so it
  // deliberately bypasses the item-level yup schema (rate/quantity requirements
  // etc. don't apply) rather than going through handleSubmit(onSubmit).
  const handleReturnSubmit = () => {
    if (!canConfirmReturn) return;

    const values = getValues();
    saveMutation({
      id: values.id,
      requisition_id: values.requisition_id,
      approval_date: values.approval_date,
      date_required: values.date_required,
      chain_level_id: values.chain_level_id,
      remarks: values.remarks,
      submit_type: 'returned',
      returned_to_level_id:
        returnTargetId === 'requester' ? null : (returnTargetId as number),
    } as FormValues);
  };

  return (
    <React.Fragment>
      <DialogTitle>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }} textAlign={'center'} mb={2}>
            {isEdit
              ? 'Edit Approval'
              : isImprestType
                ? 'Approve Imprest Requisition'
                : 'Approve Requisition'}
          </Grid>
          <Grid size={{ xs: 12, md: 3 }} sx={{ mt: 1, mb: 1 }}>
            <Div
              sx={{
                p: 1.25,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant='caption' color='text.secondary'>
                Requisition Date
              </Typography>
              <Typography variant='body2'>
                {readableDate(requisition.requisition_date)}
              </Typography>
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }} sx={{ mt: 1, mb: 1 }}>
            <Div
              sx={{
                p: 1.25,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant='caption' color='text.secondary'>
                Currency
              </Typography>
              <Typography variant='body2'>
                {requisition.currency?.name}
              </Typography>
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ mt: 1, mb: 1 }}>
            <Div
              sx={{
                p: 1.25,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant='caption' color='text.secondary'>
                Cost Center
              </Typography>
              <Typography variant='body2' sx={{ wordBreak: 'break-word' }}>
                {requisition.cost_center?.name || '-'}
              </Typography>
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }} sx={{ mt: 1, mb: 1 }}>
            <Div
              sx={{
                p: 1.25,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant='caption' color='text.secondary'>
                Grand Total
              </Typography>
              <Typography variant='body2'>
                {Number(approvalDisplayValue || 0).toLocaleString('en-US', {
                  style: 'currency',
                  currency: requisition.currency?.code || 'USD',
                })}
              </Typography>
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Div sx={{ mt: 0.5 }}>
              <DateTimePicker
                label='Approval Date'
                defaultValue={approvalDate}
                minDate={
                  checkOrganizationPermission(PERMISSIONS.APPROVAL_BACKDATE)
                    ? dayjs(requisition.requisition_date)
                    : dayjs().startOf('day')
                }
                maxDate={
                  checkOrganizationPermission(PERMISSIONS.APPROVAL_POSTDATE)
                    ? dayjs().add(10, 'year').endOf('year')
                    : dayjs().endOf('day')
                }
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    error: !!errors?.approval_date,
                    helperText: errors?.approval_date?.message,
                  },
                }}
                onChange={(newValue: Dayjs | null) => {
                  if (newValue) {
                    setValue('approval_date', newValue.toISOString(), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                }}
              />
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Div sx={{ mt: 0.5 }}>
              <DateTimePicker
                label='Date Required'
                defaultValue={dateRequired}
                minDate={
                  watchedApprovalDate
                    ? dayjs(watchedApprovalDate)
                    : dayjs(requisition.requisition_date)
                }
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    error: !!errors?.date_required,
                    helperText: errors?.date_required?.message,
                  },
                }}
                onChange={(newValue: Dayjs | null) => {
                  if (newValue) {
                    setValue('date_required', newValue.toISOString(), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                }}
              />
            </Div>
          </Grid>
          {!isEdit && previousRemarks && (
            <Grid size={{ xs: 12 }}>
              <Alert
                severity='info'
                variant='outlined'
                sx={{ mt: 0.5 }}
                action={
                  <Tooltip title='Copy into my remarks'>
                    <IconButton
                      size='small'
                      onClick={() => {
                        setValue('remarks', previousRemarks, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    >
                      <ContentCopyOutlined fontSize='small' />
                    </IconButton>
                  </Tooltip>
                }
              >
                <Typography variant='caption' sx={{ fontWeight: 'medium' }}>
                  {previousRemarksLabel}
                </Typography>
                <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                  {previousRemarks}
                </Typography>
              </Alert>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 6 }}>
            <Div sx={{ mt: 0.5 }}>
              <TextField
                label='Remarks'
                fullWidth
                defaultValue={isEdit ? approval?.remarks : ''}
                multiline={true}
                minRows={2}
                error={!!errors?.remarks}
                helperText={errors?.remarks?.message}
                {...register('remarks')}
              />
            </Div>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent>
        {isPurchaseType ? (
          <>
            <Tabs
              value={activePurchaseTab}
              onChange={(_, newValue) => setActivePurchaseTab(newValue)}
              variant='scrollable'
              scrollButtons='auto'
              allowScrollButtonsMobile
              sx={{ mb: 1 }}
            >
              <Tab label='Products' />
              <Tab label='Additional Costs' />
            </Tabs>

            {activePurchaseTab === 0 && (
              <ApprovalRequisitionProductItem
                approval={approval}
                requisition={requisition}
                errors={errors.product_items}
                requisitionProductItem={requisitionProductItem}
                setRequisitionProductItem={setRequisitionProductItem}
                handleItemChange={handleItemChange}
              />
            )}

            {activePurchaseTab === 1 &&
              requisitionAdditionalCosts.length > 0 && (
                <Grid container spacing={1} sx={{ mt: 1, mb: 2 }}>
                  {requisitionAdditionalCosts.map((cost, index) => {
                    const additionalCostErrors = (errors as any)
                      ?.additional_costs?.[index];

                    return (
                      <React.Fragment key={cost.id || index}>
                        <Grid size={{ xs: 12, md: 9 }}>
                          <Typography variant='body2' sx={{ mt: 1.5 }}>
                            {`${index + 1}. ${cost.credit_ledger_name || cost.name}`}
                          </Typography>
                          {cost.reference && (
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              Ref: {cost.reference}
                            </Typography>
                          )}
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Div sx={{ mt: 0.5 }}>
                            <TextField
                              label='Amount'
                              fullWidth
                              size='small'
                              value={Number(cost.amount || 0).toLocaleString(
                                'en-US'
                              )}
                              inputProps={{ style: { textAlign: 'right' } }}
                              error={!!additionalCostErrors?.amount}
                              helperText={
                                additionalCostErrors?.amount?.message as string
                              }
                              InputProps={{
                                inputComponent: CommaSeparatedField,
                              }}
                              onChange={(e) =>
                                handleAdditionalCostAmountChange(
                                  index,
                                  sanitizedNumber(e.target.value) || 0
                                )
                              }
                            />
                          </Div>
                        </Grid>
                      </React.Fragment>
                    );
                  })}
                </Grid>
              )}

            {activePurchaseTab === 1 &&
              requisitionAdditionalCosts.length === 0 && (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mt: 0.5 }}
                >
                  No additional costs on this requisition.
                </Typography>
              )}
          </>
        ) : isMaterialType ? (
          <>
            {hasImprestFulfillment && (
              <Grid container spacing={1} sx={{ mb: 2, mt: 0.5 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Autocomplete
                    options={filteredImprestLedgerOptions}
                    isOptionEqualToValue={(option, value) => {
                      const optionId =
                        option.ledger_id || option.ledger?.id || option.id;
                      const valueId =
                        value.ledger_id || value.ledger?.id || value.id;
                      return Number(optionId) === Number(valueId);
                    }}
                    getOptionLabel={(option) =>
                      option.ledger?.name ||
                      option.name ||
                      'Unknown Imprest Ledger'
                    }
                    value={
                      filteredImprestLedgerOptions.find((option) => {
                        const optionId =
                          option.ledger_id || option.ledger?.id || option.id;
                        return (
                          Number(optionId) === Number(watchedImprestLedgerId)
                        );
                      }) || null
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Imprest Ledger'
                        size='small'
                        fullWidth
                        error={!!(errors as any).imprest_ledger_id}
                        helperText={
                          (errors as any).imprest_ledger_id?.message as string
                        }
                      />
                    )}
                    onChange={(_, selected: any) => {
                      const ledgerId =
                        selected?.ledger_id ||
                        selected?.ledger?.id ||
                        selected?.id ||
                        null;
                      setValue('imprest_ledger_id', ledgerId, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Grid>
              </Grid>
            )}
            <ApprovalRequisitionProductItem
              approval={approval}
              requisition={requisition}
              errors={(errors as any).product_items}
              requisitionProductItem={requisitionProductItem}
              setRequisitionProductItem={setRequisitionProductItem}
              handleItemChange={handleItemChange}
              isMaterialMode={true}
            />
          </>
        ) : (
          <ApprovalRequisitionLedgerItem
            approval={approval}
            requisition={requisition}
            errors={errors.ledger_items}
            isPaymentType={isPaymentType}
            requisitionLedgerItem={requisitionLedgerItem}
            setRequisitionLedgerItem={setRequisitionLedgerItem}
            handleItemChange={handleItemChange}
          />
        )}
      </DialogContent>
      <DialogActions
        sx={{
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'flex-end',
        }}
      >
        {returnMode ? (
          <>
            <Div sx={{ minWidth: 260, flexGrow: 1 }}>
              <Autocomplete
                size='small'
                options={returnTargetOptions}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={
                  returnTargetOptions.find(
                    (option) => option.id === returnTargetId
                  ) || null
                }
                onChange={(_, selected) =>
                  setReturnTargetId(selected ? selected.id : '')
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='Send back to'
                    helperText={
                      !(watch('remarks') || '').trim()
                        ? 'Remarks are required when returning a requisition'
                        : ' '
                    }
                  />
                )}
              />
            </Div>
            {/* DialogActions' justifyContent: flex-end keeps this pinned to
                the right even when it wraps onto its own line under the
                Autocomplete on narrow/mobile screens */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size='small' onClick={() => setReturnMode(false)}>
                Cancel
              </Button>
              <LoadingButton
                loading={
                  approveRequisition.isPending ||
                  editApprovalRequisition.isPending
                }
                size='small'
                variant='contained'
                color='warning'
                disabled={!canConfirmReturn}
                onClick={handleReturnSubmit}
              >
                Confirm Return
              </LoadingButton>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size='small' onClick={() => toggleOpen(false)}>
                Cancel
              </Button>
              {isPurchaseType && activePurchaseTab === 0 && (
                <Button
                  size='small'
                  variant='outlined'
                  onClick={() => setActivePurchaseTab(1)}
                >
                  Next &gt;
                </Button>
              )}
              {isPurchaseType && activePurchaseTab === 1 && (
                <Button
                  size='small'
                  variant='outlined'
                  onClick={() => setActivePurchaseTab(0)}
                >
                  &lt; Prev
                </Button>
              )}
            </Box>

            {(!isPurchaseType || activePurchaseTab === 1) && (
              <Box sx={{ display: 'flex' }}>
                <ButtonGroup variant='contained' color='success' size='small'>
                  <LoadingButton
                    loading={
                      approveRequisition.isPending ||
                      editApprovalRequisition.isPending
                    }
                    startIcon={<CheckCircleOutlineIcon />}
                    type='submit'
                    onClick={(e) => {
                      setValue('submit_type', 'approved');
                      handleSubmit(onSubmit)(e);
                    }}
                  >
                    Approve
                  </LoadingButton>
                  <Button
                    size='small'
                    disabled={
                      approveRequisition.isPending ||
                      editApprovalRequisition.isPending
                    }
                    onClick={(e) => setActionMenuAnchor(e.currentTarget)}
                    sx={{ px: 0.5 }}
                  >
                    <ArrowDropDownIcon />
                  </Button>
                </ButtonGroup>

                <Menu
                  anchorEl={actionMenuAnchor}
                  open={!!actionMenuAnchor}
                  onClose={closeActionMenu}
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                  <MenuItem
                    onClick={(e) => {
                      closeActionMenu();
                      setValue('submit_type', 'on hold');
                      handleSubmit(onSubmit)(e as any);
                    }}
                  >
                    <ListItemIcon>
                      <PauseCircleOutlineIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Hold</ListItemText>
                  </MenuItem>
                  <MenuItem
                    onClick={(e) => {
                      closeActionMenu();
                      setValue('submit_type', 'rejected');
                      handleSubmit(onSubmit)(e as any);
                    }}
                  >
                    <ListItemIcon>
                      <HighlightOffIcon fontSize='small' color='error' />
                    </ListItemIcon>
                    <ListItemText sx={{ color: 'error.main' }}>
                      Reject
                    </ListItemText>
                  </MenuItem>
                  {canReturn && (
                    <>
                      <Divider />
                      <MenuItem
                        disabled={levelsLoading}
                        onClick={() => {
                          closeActionMenu();
                          setReturnMode(true);
                        }}
                      >
                        <ListItemIcon>
                          <UndoIcon fontSize='small' color='warning' />
                        </ListItemIcon>
                        <ListItemText sx={{ color: 'warning.main' }}>
                          Return to earlier level…
                        </ListItemText>
                      </MenuItem>
                    </>
                  )}
                </Menu>
              </Box>
            )}
          </>
        )}
      </DialogActions>
    </React.Fragment>
  );
}

export default ApprovalForm;
