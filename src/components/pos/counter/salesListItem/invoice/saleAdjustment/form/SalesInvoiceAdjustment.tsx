import {
  Autocomplete,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import * as yup from 'yup';
import posServices from '../../../../../pos-services';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Div } from '@jumbo/shared';
import { Product } from '@/components/productAndServices/products/ProductType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import SaleAdjustmentItemForm from './SaleAdjustmentItemForm';
import SaleAdjustmentItemRow from './SaleAdjustmentItemRow';

interface InvoiceItem {
  id?: number;
  product: Product | null;
  description: string;
  measurement_unit: MeasurementUnit | null;
  quantity: number;
  rate: number;
  vat_amount?: number;
  vat_percentage: number;
  complement_ledger_id?: number;
  isSelected?: boolean;
}

interface InvoiceData {
  id?: number;
  invoiceNo: string;
  transaction_date: string;
  voucherNo?: string;
  narration: string;
  corresponding_to: string;
  corresponding_id: number;
  currency: Currency;
  stakeholder: Stakeholder;
  cost_centers: CostCenter[];
  items: InvoiceItem[];
  note_type?: string;
}

interface NoteTypeOption {
  name: string;
  value: string;
}

interface FormData {
  id?: number | null;
  narration: string;
  transaction_date: string;
  note_type: string;
  currency_id: number;
  corresponding_to: string;
  corresponding_id: number;
  stakeholder_id: number;
  cost_center_ids: number[];
  items: Array<{
    product_id: number | null;
    measurement_unit_id: number | null;
    quantity: number;
    rate: number;
    vat_percentage: number;
    description: string;
    complement_ledger_id: number;
    isSelected: boolean;
  }>;
}

interface SalesInvoiceAdjustmentProps {
  invoiceData: InvoiceData;
  toggleOpen: (open: boolean) => void;
  isEdit?: boolean;
}

function SalesInvoiceAdjustment({ isEdit, invoiceData, toggleOpen }: SalesInvoiceAdjustmentProps) {
  const [transaction_date] = useState<Dayjs>(
    isEdit ? dayjs(invoiceData.transaction_date) : dayjs()
  );
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const [totalAmount, setTotalAmount] = useState(0);
  const [vatableAmount, setVatableAmount] = useState(0);
  const [sale_items, setSale_items] = useState<InvoiceItem[]>(
    invoiceData ? invoiceData.items : []
  );
  const currencyCode = invoiceData.currency.code;

  const noteType: NoteTypeOption[] = [
    { name: 'Debit Note', value: 'debit' },
    { name: 'Credit Note', value: 'credit' },
  ];

  const invoiceAdjustment = useMutation({
    mutationFn: posServices.invoiceAdjustment,
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['SaleInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['SaleAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const updateInvoiceAdjustment = useMutation({
    mutationFn: posServices.updateInvoiceAdjustment,
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['SaleInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['SaleAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const saveMutation = React.useMemo(
    () => (isEdit ? updateInvoiceAdjustment.mutate : invoiceAdjustment.mutate),
    [isEdit, updateInvoiceAdjustment.mutate, invoiceAdjustment.mutate]
  );

  const validationSchema = yup.object({
    transaction_date: yup.string().required('Invoice Date is required').typeError('Invoice Date is required'),
    note_type: yup.string().required('Note Type is required').typeError('Note Type is required'),
    narration: yup.string().required('Narration is required').typeError('Narration is required'),
    items: yup.array().of(
      yup.object({
        complement_ledger_id: yup.number().required('Complement Ledger is required').min(1, 'Select a valid Complement Ledger').typeError('Complement Ledger is required'),
        measurement_unit_id: yup
          .number()
          .nullable()
          .when(['product_id', 'description'], {
            is: (product_id: number | null, description: string) => !product_id && !!description,
            then: (schema) => schema.required('Measurement Unit is required').typeError('Measurement Unit is required'),
            otherwise: (schema) => schema.notRequired().nullable(),
          }),
        product_id: yup.number().nullable().notRequired(),
        quantity: yup
          .number()
          .required('Quantity is required')
          .typeError('Quantity must be a number')
          .positive('Quantity must be positive')
          .typeError('Quantity is required'),
        rate: yup
          .number()
          .required('Rate is required')
          .typeError('Rate must be a number')
          .positive('Rate must be positive')
          .typeError('Rate is required'),
        description: yup.string().nullable().notRequired(),
        isSelected: yup.boolean().required(),
      }).test(
        'product-or-description',
        'Either Product or Description must be provided',
        (value) => !!(value.product_id || value.description)
      )
    ),
  });

  const {
    setValue,
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: isEdit ? invoiceData.id : undefined,
      narration: isEdit ? invoiceData?.narration : '',
      transaction_date: transaction_date.toISOString(),
      note_type: invoiceData?.note_type || '',
      currency_id: invoiceData?.currency?.id || 1,
      corresponding_to: 'CustomerInvoice',
      corresponding_id: isEdit ? invoiceData.corresponding_id : invoiceData?.id,
      stakeholder_id: invoiceData?.stakeholder?.id,
      cost_center_ids: invoiceData?.cost_centers?.map((cc) => cc.id) || [],
      items: sale_items.map((item: any) => ({
        product_id: item.product?.id || null,
        measurement_unit_id: item.measurement_unit?.id || null,
        vat_percentage: item.vat_percentage || 0,
        quantity: item.quantity,
        rate: item.rate,
        description: item.description || '',
        complement_ledger_id: isEdit ? item.complement_ledger_id : item?.product?.category?.income_ledger_id || null,
        isSelected: isEdit || item.isSelected || false,
      })),
    },
  });

  const formValues = watch();

  useEffect(() => {
    let total = 0;
    sale_items.forEach((item, index) => {
      if (formValues.items?.[index]?.isSelected) {
        const quantity = parseFloat(formValues.items?.[index]?.quantity as any) || 0;
        const rate = parseFloat(formValues.items?.[index]?.rate as any) || 0;
        total += quantity * rate;
      }
    });
    setTotalAmount(total);

    const vatable = sale_items
      .filter(
        (item, index) =>
          formValues.items?.[index]?.isSelected &&
          Number(item.product?.vat_exempted) !== 1
      )
      .reduce((sum, item, index) => {
        const quantity = parseFloat(formValues.items?.[index]?.quantity as any) || 0;
        const rate = parseFloat(formValues.items?.[index]?.rate as any) || 0;
        const vatPercentage = item.vat_percentage || 0;
        return sum + (quantity * rate * vatPercentage) / 100;
      }, 0);
    setVatableAmount(vatable);
  }, [formValues, sale_items]);

  const onSubmit = async (data: FormData) => {
    const isValid = await trigger();
    if (!isValid || Object.keys(errors).length > 0) {
      enqueueSnackbar('Please fix the validation errors before submitting.', {
        variant: 'error',
      });
      return;
    }

    const selectedItems = data.items
      .map((item, index) => ({ ...item, index }))
      .filter((item) => item.isSelected);

    const payload = {
      id: data.id,
      narration: data.narration,
      transaction_date: data.transaction_date,
      note_type: data.note_type,
      currency_id: data.currency_id,
      corresponding_to: data.corresponding_to,
      corresponding_id: data.corresponding_id,
      stakeholder_id: data.stakeholder_id,
      cost_center_ids: data.cost_center_ids,
      items: selectedItems.map((item) => ({
        id: sale_items[item.index]?.id,
        complement_ledger_id: item.complement_ledger_id,
        product_id: item.product_id,
        measurement_unit_id: item.product_id
          ? sale_items[item.index]?.measurement_unit?.id
          : item.measurement_unit_id,
        quantity: parseFloat(item.quantity as any),
        rate: parseFloat(item.rate as any),
        vat_percentage: sale_items[item.index]?.vat_percentage,
        description: item.description,
      })),
    };
    saveMutation(payload);
  };

  const selectedNoteType = watch('note_type');
  let headerText: string;
  if (invoiceData.voucherNo) {
    headerText = `Edit ${invoiceData.voucherNo}`;
  } else if (selectedNoteType === 'debit') {
    headerText = `Debit Note to ${invoiceData.invoiceNo}`;
  } else if (selectedNoteType === 'credit') {
    headerText = `Credit Note to ${invoiceData.invoiceNo}`;
  } else {
    headerText = `Note For ${invoiceData.invoiceNo}`;
  }

  const vat_registered = !!organization?.settings?.vat_registered;

  return (
    <>
      <DialogTitle>
        <Grid container columnSpacing={2}>
          <Grid size={12} mb={3} textAlign={'center'}>
            <Typography variant="h3">{headerText}</Typography>
          </Grid>

          <Grid size={{xs: 12, md: 9}} mb={2}>
            <form autoComplete="off">
              <Grid container columnSpacing={1} rowSpacing={2}>
                <Grid size={{xs: 12, md: 4}}>
                  <Div sx={{ mt: 0.3 }}>
                    <DateTimePicker
                      label="Note Date"
                      minDate={dayjs(organization?.recording_start_date)}
                      defaultValue={transaction_date}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          InputProps: { readOnly: true },
                          error: !!errors?.transaction_date,
                          helperText: errors?.transaction_date?.message,
                        },
                      }}
                      onChange={(newValue: Dayjs | null) => {
                        setValue(
                          'transaction_date',
                          newValue ? newValue.toISOString() : '',
                          { shouldValidate: true, shouldDirty: true }
                        );
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{xs: 12, md: 4}}>
                  <Div sx={{ mt: 0.3 }}>
                    <Autocomplete
                      id="checkboxes-noteType"
                      options={noteType}
                      isOptionEqualToValue={(option, value) =>
                        option.value === value.value
                      }
                      getOptionLabel={(option) => option.name}
                      disabled={isEdit}
                      value={
                        noteType.find(
                          (option) => option.value === formValues.note_type
                        ) || null
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Note Type"
                          size="small"
                          fullWidth
                          error={!!errors.note_type}
                          helperText={errors.note_type?.message}
                        />
                      )}
                      onChange={(e, newValue) => {
                        setValue('note_type', newValue ? newValue.value : '', {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{xs: 12, md: 4}}>
                  <Div sx={{ mt: 0.3 }}>
                    <TextField
                      size="small"
                      label="Narration"
                      fullWidth
                      multiline
                      minRows={2}
                      error={!!errors.narration}
                      helperText={errors.narration?.message}
                      {...register('narration')}
                    />
                  </Div>
                </Grid>
              </Grid>
            </form>
          </Grid>

          <Grid size={{xs: 12, md: 3}}>
            <Grid container columnSpacing={1}>
              <Grid size={12}>
                <Typography align="center" variant="h3">
                  Summary
                </Typography>
                <Divider />
              </Grid>
              <Grid size={6}>
                <Typography align="left" variant="body2">
                  Total:
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography align="right" variant="h5">
                  {totalAmount?.toLocaleString('en-US', {
                    style: 'currency',
                    currency: currencyCode,
                  })}
                </Typography>
              </Grid>
              {vat_registered && (
                <>
                  <Grid size={6}>
                    <Typography align="left" variant="body2">
                      VAT Amount:
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography align="right" variant="h5">
                      {vatableAmount?.toLocaleString('en-US', {
                        style: 'currency',
                        currency: currencyCode,
                      })}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography align="left" variant="body2">
                      Grand Total:
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography align="right" variant="h5">
                      {(totalAmount + vatableAmount).toLocaleString('en-US', {
                        style: 'currency',
                        currency: currencyCode,
                      })}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          </Grid>
        </Grid>
      </DialogTitle>

      <DialogContent>
        <SaleAdjustmentItemForm items={sale_items as any} setItems={setSale_items as any} />
        {sale_items.map((item: any, index) => (
          <SaleAdjustmentItemRow
            key={index}
            index={index}
            item={item}
            items={sale_items as any}
            formValues={formValues.items?.[index] || {}}
            setFormValue={(field: any, value: any) =>
              setValue(`items.${index}.${field}` as any, value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            errors={errors.items?.[index] || {}}
            isEdit={isEdit}
          />
        ))}
      </DialogContent>

      <DialogActions>
        <Button size="small" onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={invoiceAdjustment.isPending || updateInvoiceAdjustment.isPending}
          size="small"
          type="submit"
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={formValues.items?.filter((item) => item?.isSelected).length === 0}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  );
}

export default SalesInvoiceAdjustment;
