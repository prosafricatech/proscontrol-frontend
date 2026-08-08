'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import posServices from '../../../pos-services';
import { SalesOrder } from '../../SalesOrderType';
import SaleInvoiceItems from './SaleInvoiceItems';
import SaleInvoiceTopInformation from './SaleInvoiceTopInformation';

interface SaleInvoiceFormProps {
  toggleOpen: (open: boolean) => void;
  sale?: SalesOrder | null;
}

interface FormValues {
  id?: number;
  is_instant_sale: boolean;
  internal_reference: string;
  vat_percentage?: number;
  customer_reference: string;
  delivery_note_ids: number[];
  narration: string;
  is_tax_invoice: boolean;
  transaction_date: string;
  due_date?: string;
  terms_and_instructions?: string;
}

const SaleInvoiceForm: React.FC<SaleInvoiceFormProps> = ({
  toggleOpen,
  sale = null,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [sale_items, setSale_items] = useState(
    !sale?.is_instant_sale ? [] : sale?.sale_items || []
  );
  const [isTaxInvoice, setIsTaxInvoice] = useState(false);
  const [transactionDate] = useState(dayjs());
  console.log(sale, 'sddd');

  const addInvoiceSale = useMutation({
    mutationFn: posServices.invoiceSale,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['SaleInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
    },
    onError: (error: any) => {
      // error?.response?.data?.message &&
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    transaction_date: yup
      .string()
      .required('Invoice Date is required')
      .typeError('Invoice Date is required'),
  });

  const {
    handleSubmit,
    setValue,
    register,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: sale?.id,
      is_instant_sale: sale?.is_instant_sale || false,
      internal_reference: sale?.saleNo || '',
      vat_percentage: sale?.vat_percentage,
      customer_reference: '',
      delivery_note_ids: [],
      narration: '',
      is_tax_invoice: isTaxInvoice,
      transaction_date: transactionDate.toISOString(),
      due_date: '',
      terms_and_instructions: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    addInvoiceSale.mutate(data);
  };

  return (
    <>
      <DialogTitle>
        <Grid container columnSpacing={2}>
          <Grid size={12} mb={3} textAlign={'center'}>
            New Invoice
          </Grid>
          <SaleInvoiceTopInformation
            sale={sale}
            setValue={setValue}
            register={register}
            watch={watch}
            errors={errors}
            transactionDate={transactionDate}
            isTaxInvoice={isTaxInvoice}
            setIsTaxInvoice={setIsTaxInvoice}
            isRetrieving={isRetrieving}
            setIsRetrieving={setIsRetrieving}
            sale_items={sale_items}
            setSale_items={setSale_items}
          />
        </Grid>
      </DialogTitle>

      <DialogContent>
        <SaleInvoiceItems
          isRetrieving={isRetrieving}
          sale_items={sale_items as any}
        />
      </DialogContent>

      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={addInvoiceSale.isPending}
          size='small'
          type='submit'
          disabled={!sale?.is_instant_sale && !(sale_items.length > 0)}
          variant='contained'
          onClick={handleSubmit(onSubmit)}
        >
          Invoice
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default SaleInvoiceForm;
