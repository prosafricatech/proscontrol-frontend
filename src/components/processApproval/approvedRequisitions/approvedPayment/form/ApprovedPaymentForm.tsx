import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { Ledger } from '@/components/accounts/ledgers/LedgerType';
import paymentServices from '@/components/accounts/transactions/payments/payment-services';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { ApprovalRequisition } from '../../ApprovalRequisitionType';
import ApprovedPaymentItemForm from './ApprovedPaymentItemForm';

interface PaymentItem {
  id?: number;
  debit_ledger_id: number;
  ledger: {
    id: number;
    name: string;
  };
  credit_ledger?: {
    id: number;
    name: string;
  };
  credit_ledger_id?: number;
  amount: number;
  unpaid_amount: number;
  remarks?: string;
  description?: string;
  requisition_approval_ledger_item_id?: number;
  fulfillment_type?: string;
  quantity?: number;
  rate?: number;
}

interface Payment {
  id?: number;
  credit_ledger_id?: number;
  creditLedgerName?: string;
  currency: Currency;
  exchange_rate: number;
  cost_centers: CostCenter[];
  transactionDate: string;
  narration?: string;
  items: PaymentItem[];
}

interface FormValues {
  id?: number;
  requisition_approval_id?: number;
  credit_ledger_id: number;
  currency_id: number;
  exchange_rate: number;
  cost_centers: CostCenter[];
  transactionDate: string;
  items: PaymentItem[];
  narration: string;
  reference?: string;
}

interface ApprovedPaymentFormProps {
  toggleOpen: (open: boolean) => void;
  approvedDetails?: any;
  payment?: Payment | null;
  approvedRequisition?: ApprovalRequisition;
  prevApprovedDetails?: any;
}

const ApprovedPaymentForm: React.FC<ApprovedPaymentFormProps> = ({
  toggleOpen,
  approvedDetails,
  payment = null,
  approvedRequisition,
  prevApprovedDetails,
}) => {
  const { authOrganization, checkOrganizationPermission } = useJumboAuth();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<Record<string, string | string[]> | null>(
    null
  );
  const { enqueueSnackbar } = useSnackbar();
  const resolvedApprovedDetails = approvedDetails || prevApprovedDetails || null;
  const isImprestPayment= approvedRequisition?.process_type === 'IMPREST' || resolvedApprovedDetails?.process_type === 'IMPREST' || approvedDetails?.process_type === 'MATERIAL';
  const isMaterialPayment = React.useMemo(() => {
    if (payment) {
      return payment.items.some((item: any) => item.fulfillment_type === 'PURCHASE');
    }
    return approvedRequisition?.process_type === 'MATERIAL' || 
           resolvedApprovedDetails?.process_type === 'MATERIAL';
  }, [payment, approvedRequisition, resolvedApprovedDetails]);

  const imprestLedger =
    approvedRequisition?.requisition?.imprest_ledger ||
    resolvedApprovedDetails?.imprest_ledger ||
    resolvedApprovedDetails?.requisition?.imprest_ledger ||
    null;

  const resolvedImprestCreditLedgerName = imprestLedger?.name || '';
  const isEditMode = !!payment;

  const buildItemDescription = useCallback(
    (rawDescription: string | undefined, debitLedgerName?: string) => {
      const base = String(rawDescription || '').trim();
      const debitLabel = String(debitLedgerName || '').trim();

      if (isEditMode || !isImprestPayment) return base;
      if (!debitLabel) return base;

      const normalizedBase = base.toLowerCase();
      const normalizedDebitLabel = debitLabel.toLowerCase();

      if (normalizedBase.includes(normalizedDebitLabel)) return base;

      return base ? `${base} ${debitLabel}` : `${debitLabel}`;
    },
    [isImprestPayment, isEditMode]
  );

  const [items, setItems] = useState<PaymentItem[]>(() => {
    if (payment) {
      const previousItems: any[] = Array.isArray(prevApprovedDetails?.items)
        ? prevApprovedDetails.items
        : Array.isArray(resolvedApprovedDetails?.items)
          ? resolvedApprovedDetails.items
          : [];

      return payment.items.map((payItem: any, index: number) => {
        let prevItem = null;

        if (payItem?.debit_ledger_id) {
          prevItem = previousItems.find(
            (item: any) => Number(item?.ledger?.id) === Number(payItem?.debit_ledger_id)
          );
        }

        if (!prevItem && payItem?.requisition_approval_ledger_item_id) {
          prevItem = previousItems.find(
            (item: any) => Number(item?.id) === Number(payItem?.requisition_approval_ledger_item_id)
          );
        }

        if (!prevItem && previousItems[index]) {
          prevItem = previousItems[index];
        }

        const unpaidAmount = isMaterialPayment
          ? 0
          : prevItem
            ? Number(payItem?.amount || 0) + Number(prevItem?.unpaid_amount || 0)
            : 0;

        const forcedImprestLedger = imprestLedger
          ? {
              id: Number(imprestLedger.id),
              name: String(imprestLedger.name || ''),
            }
          : null;

        const ledgerName = payItem?.debitLedgerName ||
                          payItem?.ledger?.name ||
                          prevItem?.ledger?.name ||
                          forcedImprestLedger?.name ||
                          '';

        const ledgerId = payItem?.debit_ledger_id ||
                        payItem?.ledger?.id ||
                        prevItem?.ledger?.id ||
                        forcedImprestLedger?.id ||
                        0;

        // Get credit ledger if exists
        const creditLedgerId = payItem?.credit_ledger_id || payItem?.credit_ledger?.id || null;
        const creditLedgerName = payItem?.credit_ledger?.name || '';

        return {
          id: payItem?.id,
          debit_ledger_id: ledgerId,
          ledger: {
            id: ledgerId,
            name: ledgerName,
          },
          credit_ledger_id: creditLedgerId,
          debitLedgerName: payItem.debitLedgerName,
          credit_ledger: creditLedgerId ? {
            id: creditLedgerId,
            name: creditLedgerName,
          } : undefined,
          amount: Number(payItem?.amount || 0),
          unpaid_amount: unpaidAmount,
          description: buildItemDescription(
            payItem?.description || payItem?.remarks || '',
            ledgerName
          ),
          requisition_approval_ledger_item_id:
            payItem?.requisition_approval_ledger_item_id || prevItem?.id || undefined,
          fulfillment_type: prevItem?.fulfillment_type ||
                            (isImprestPayment ? 'IMPREST' : 'PURCHASE'),
          quantity: payItem?.quantity || prevItem?.quantity || 0,
          rate: payItem?.rate || prevItem?.rate || 0,
        };
      });
    }
    else if (approvedDetails) {
      return approvedDetails.items
        .filter((item: any) => {
          if (isMaterialPayment) {
            return item.fulfillment_type === 'IMPREST';
          }
          return item.unpaid_amount > 0;
        })
        .map((item: any) => {
          const ledgerId = item.ledger?.id || item.ledger_id || 0;
          const ledgerName = item.ledger?.name || item.ledger_name || '';
          const vatFactor = (item.vat_percentage || 0) * 0.01;
          const derivedAmount = isMaterialPayment
            ? Number(item.quantity || 0) * Number(item.rate || 0) * (1 + vatFactor)
            : (item.unpaid_amount || 0);

          // Get credit ledger if exists
          const creditLedgerId = item.credit_ledger_id || item.credit_ledger?.id || null;
          const creditLedgerName = item.credit_ledger?.name || '';

          return {
            ...item,
            debit_ledger_id: ledgerId,
            ledger: {
              id: ledgerId,
              name: ledgerName,
            },
            credit_ledger_id: creditLedgerId,
            credit_ledger: creditLedgerId ? {
              id: creditLedgerId,
              name: creditLedgerName,
            } : undefined,
            amount: derivedAmount,
            unpaid_amount: isMaterialPayment ? derivedAmount : item.unpaid_amount,
            description: buildItemDescription(
              item?.description || item?.remarks || '',
              ledgerName
            ),
            requisition_approval_ledger_item_id: item.id,
            fulfillment_type: item.fulfillment_type || 'PURCHASE',
            quantity: item.quantity || 0,
            rate: item.rate || 0,
          };
        });
    }
    return [];
  });

  const addPayment = useMutation({
    mutationFn: paymentServices.add,
    onSuccess: (data) => {
      data?.message && enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['approvedRequisitions'] });
      queryClient.invalidateQueries({ queryKey: ['approvedPayments'] });
      toggleOpen(false);
    },
    onError: (error: any) => {
      if (error.response) {
        if (error.response.status === 400) {
          setServerError(error.response?.data?.validation_errors);
        } else {
          enqueueSnackbar(error.response?.data?.message, { variant: 'error' });
        }
      }
    },
  });

  const updatePayment = useMutation({
    mutationFn: paymentServices.update,
    onSuccess: (data) => {
      data?.message && enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['approvedRequisitions'] });
      queryClient.invalidateQueries({ queryKey: ['approvedPayments'] });
      toggleOpen(false);
    },
    onError: (error: any) => {
      if (error.response) {
        if (error.response.status === 400) {
          setServerError(error.response?.data?.validation_errors);
          enqueueSnackbar(error.response?.data?.message, { variant: 'error' });
        } else {
          enqueueSnackbar(error.response?.data?.message, { variant: 'error' });
        }
      }
    },
  });

  const validationSchema = yup.object({
    narration: yup
      .string()
      .required('Narration is required')
      .typeError('Narration is required'),
    credit_ledger_id: yup
      .number()
      .required('Paying (credit) account is required')
      .positive('Paying (credit) account as Required')
      .typeError('Paying (credit) account as Required'),
    currency_id: yup
      .number()
      .positive('Currency is required')
      .required('Currency is required')
      .typeError('Currency is required'),
    exchange_rate: yup
      .number()
      .positive('Exchange rate is required')
      .required('Exchange rate is required')
      .typeError('Exchange rate is required'),
    transactionDate: yup.mixed().required('Payment Date is required'),
    items: yup
      .array()
      .min(1, 'You must add at least one item')
      .required('You must add at least one item'),
  });

  const {
    handleSubmit,
    setValue,
    register,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: payment?.id,
      requisition_approval_id: approvedDetails?.id,
      credit_ledger_id: payment?.credit_ledger_id || 0,
      currency_id: payment
        ? payment.currency.id
        : resolvedApprovedDetails
          ? resolvedApprovedDetails.currency.id
          : 1,
      exchange_rate: payment
        ? payment.exchange_rate
        : resolvedApprovedDetails
          ? resolvedApprovedDetails.currency.exchangeRate
          : 1,
      cost_centers: approvedRequisition
        ? [approvedRequisition.requisition.cost_center]
        : payment?.cost_centers || [],
      transactionDate: payment
        ? payment.transactionDate
        : dayjs().toISOString(),
      items: items,
      narration: payment?.narration || '',
    },
  });

  const handleItemChange = (index: number, key: string, value: any) => {
    let updatedItems: PaymentItem[];

    if (key === 'delete' && value === true) {
      updatedItems = items.filter((_, itemIndex) => itemIndex !== index);
    } else {
      updatedItems = [...items];
      updatedItems[index] = { ...updatedItems[index], [key]: value };
    }

    setItems(updatedItems);

    if (serverError?.[`items.${index}.${key}`]) {
      setServerError((currentErrors) => {
        if (!currentErrors) {
          return currentErrors;
        }

        const nextErrors = { ...currentErrors };
        delete nextErrors[`items.${index}.${key}`];

        return Object.keys(nextErrors).length > 0 ? nextErrors : null;
      });
    }
  };

  const totalAmount = items.reduce(
    (runningTotal, item) =>
      runningTotal +
      (Number.isFinite(Number(item.amount)) ? Number(item.amount) : 0),
    0
  );

  const savePayment = React.useMemo(() => {
    return payment ? updatePayment.mutate : addPayment.mutate;
  }, [payment, updatePayment, addPayment]);

  const formTitle = payment
    ? isImprestPayment
      ? 'Edit Approved Imprest Payment Form'
      : 'Edit Payment'
    : isImprestPayment
      ? 'New Approved Imprest Payment Form'
      : 'New Approved Payment Form';

  const handleSubmitForm = async (data: FormValues) => {
    const updatedData = {
      ...data,
      items: items
        .filter((item) => isMaterialPayment || item.unpaid_amount > 0)
        .map((item) => {
          const itemIdKey = isMaterialPayment 
            ? 'requisition_approval_product_item_id' 
            : 'requisition_approval_ledger_item_id';
          
          const result: any = {
            debit_ledger_id: imprestLedger ? imprestLedger.id : item.debit_ledger_id,
            [itemIdKey]: item.requisition_approval_ledger_item_id,
            amount: Number.isFinite(Number(item.amount))
              ? Number(item.amount)
              : 0,
            description: String(item.description || item.remarks || '').trim(),
          };

          if (item.credit_ledger_id) {
            result.credit_ledger_id = item.credit_ledger_id;
          }

          return result;
        }),
    };
    await savePayment(updatedData);
  };

  return (
    <>
      <DialogTitle textAlign={'center'}>{formTitle}</DialogTitle>
      <DialogContent>
        <form autoComplete='off'>
          <Grid container columnSpacing={1} marginBottom={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <DateTimePicker
                  label='Payment Date (MM/DD/YYYY)'
                  minDate={
                    checkOrganizationPermission(
                      PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE
                    )
                      ? dayjs(
                          authOrganization?.organization.recording_start_date
                        )
                      : dayjs().startOf('day')
                  }
                  maxDate={
                    checkOrganizationPermission(
                      PERMISSIONS.ACCOUNTS_TRANSACTIONS_POSTDATE
                    )
                      ? dayjs().add(10, 'year').endOf('year')
                      : dayjs().endOf('day')
                  }
                  defaultValue={
                    payment ? dayjs(payment.transactionDate) : dayjs()
                  }
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      InputProps: {
                        readOnly: true,
                      },
                      error: !!errors?.transactionDate,
                      helperText: errors?.transactionDate?.message,
                    },
                  }}
                  onChange={(newValue: Dayjs | null) => {
                    setValue(
                      'transactionDate',
                      newValue ? newValue.toISOString() : '',
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <LedgerSelect
                  frontError={errors.credit_ledger_id}
                  defaultValue={
                    payment
                      ? ({
                          id: payment.credit_ledger_id || 0,
                          name: payment.creditLedgerName || '',
                        } as Ledger)
                      : null
                  }
                  allowedGroups={[
                    'Current Assets',
                    'Current Liabilities',
                    'Cash and Cash Equivalents',
                    'Banks',
                    'Accounts Payable',
                    'Accounts Receivable',
                  ]}
                  onChange={(newValue: Ledger | Ledger[] | null) => {
                    const singleValue = Array.isArray(newValue)
                      ? newValue[0]
                      : newValue;
                    setValue('credit_ledger_id', singleValue?.id || 0, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  label='Pay From (Credit)'
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  size='small'
                  label='Reference'
                  fullWidth
                  {...register('reference')}
                  onChange={() => {
                    setServerError(null);
                  }}
                />
                <span style={{ color: 'red' }}>{serverError?.reference}</span>
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <CurrencySelector
                  defaultValue={
                    resolvedApprovedDetails
                      ? resolvedApprovedDetails.currency.id
                      : 1
                  }
                  disabled={true}
                />
              </Div>
            </Grid>
            {watch('currency_id') > 1 && (
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <TextField
                    label='Exchange Rate'
                    fullWidth
                    defaultValue={watch(`exchange_rate`)}
                    size='small'
                    InputProps={{
                      inputComponent: CommaSeparatedField,
                    }}
                    onChange={(e) => {
                      const sanitizedValue = sanitizedNumber(e.target.value);
                      setValue('exchange_rate', sanitizedValue, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
            )}
            <Grid size={{ xs: 12, lg: watch('currency_id') === 1 ? 8 : 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <CostCenterSelector
                  multiple={true}
                  allowSameType={false}
                  defaultValue={
                    approvedRequisition
                      ? [approvedRequisition.requisition.cost_center]
                      : payment?.cost_centers || []
                  }
                  disabled={true}
                />
              </Div>
            </Grid>
          </Grid>

          {errors?.items?.message && items.length < 1 && (
            <Alert severity='error'>{errors.items.message}</Alert>
          )}

          <ApprovedPaymentItemForm
            approvedDetails={!payment && !!resolvedApprovedDetails}
            items={items}
            handleItemChange={handleItemChange}
            isImprestPayment={isImprestPayment}
            isMaterialPayment={isMaterialPayment}
            serverError={serverError}
            payFromLedgerName={
              isImprestPayment ? resolvedImprestCreditLedgerName : undefined
            }
          />

          <Divider />
          <Grid container columnSpacing={1}>
            <Grid
              size={{ xs: 11 }}
              sx={{
                display: 'flex',
                direction: 'row',
                justifyContent: 'flex-end',
              }}
            >
              <Tooltip title={'Total Amount'}>
                <Typography variant={'h5'}>
                  {totalAmount?.toLocaleString()}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Narration'
                  multiline={true}
                  rows={2}
                  fullWidth
                  error={!!errors?.narration}
                  helperText={errors?.narration?.message}
                  size='small'
                  {...register('narration')}
                />
              </Div>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        {items.length > 0 && (
          <LoadingButton
            type='submit'
            onClick={handleSubmit(handleSubmitForm)}
            loading={addPayment.isPending || updatePayment.isPending}
            size='small'
            variant='contained'
          >
            Submit
          </LoadingButton>
        )}
      </DialogActions>
    </>
  );
};

export default React.memo(ApprovedPaymentForm);