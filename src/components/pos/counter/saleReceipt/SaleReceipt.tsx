import { 
  Button, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Grid, 
  LinearProgress, 
  Skeleton, 
  TextField, 
  Typography 
} from '@mui/material';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import posServices from '../../pos-services';
import SaleReceiptPDF from './SaleReceiptPDF';
import SaleReceiptOnScreen from './SaleReceiptOnScreen';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PDFContent from '@/components/pdf/PDFContent';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { Organization, User } from '@/types/auth-types';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';

interface Product {
  name: string;
}

export interface SaleItem {
  product: Product;
  quantity: number;
  rate: number;
  vat_exempted?: number;
  measurement_unit: MeasurementUnit;
}

export interface VFDReceipt {
  verification_url: string;
  verification_code: string;
  created_at: string;
  receipt_time: string;
  customer_name?: string;
  customer_tin?: string;
  customer_vrn?: string;
}

export interface Sale {
  id?: number;
  saleNo: string;
  transaction_date: string;
  reference?: string;
  amount: number;
  vat_percentage: number;
  sales_outlet: {
    name: string;
  };
  stakeholder: Stakeholder;
  sale_items: SaleItem[];
  creator: User;
  currency: Currency;
  vfd_receipt?: VFDReceipt;
}

interface SaleReceiptProps {
  organization: Organization;
  sale: Sale;
  user: User;
  setOpenReceiptDialog: (open: boolean) => void;
}

interface FormValues {
  customer_tin: string;
  id: string;
  vat_percentage: number;
  items: SaleItem[];
  customer_vrn?: string;
  customer_name?: string;
}

const SaleReceipt: React.FC<SaleReceiptProps> = ({ 
  organization, 
  sale, 
  user, 
  setOpenReceiptDialog 
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset 
  } = useForm<FormValues>({
    defaultValues: {
      customer_tin: '',
      id: '',
      vat_percentage: 0,
      items: []
    }
  });

  useEffect(() => {
    if (sale) {
      reset({
        customer_tin: sale?.stakeholder?.tin || '',
        customer_vrn: sale?.stakeholder?.vrn || '',
        customer_name: sale?.stakeholder?.name || '',
        id: sale?.id?.toString() || '', // Convert number to string if needed
        vat_percentage: sale?.vat_percentage || 0,
        items: sale?.sale_items || []
      });
    }
  }, [sale, reset]);

  const postSalesReceiptToVFD = useMutation({
    mutationFn: posServices.postSaleToVFD,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sale', { id: sale?.id }] });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message && 
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    }
  });

  return (
    <>
      {(organization.is_tra_connected && !sale.vfd_receipt) && (
        <DialogTitle>
          <Grid container columnSpacing={1} rowSpacing={1}>
            <Grid size={12} marginBottom={2} textAlign={'center'}>
              <Typography variant='subtitle1'>{`Receipt ${sale.saleNo}`}</Typography>
            </Grid>
            <Grid size={{xs: 12, md: 6}}>
              <TextField
                label={'Customer TIN'}
                fullWidth
                size='small'
                {...register('customer_tin', {
                  validate: (value) => {
                    if (!value) {
                      return true;
                    }

                    const sanitizedValue = value.replace(/\D/g, ''); 
                    if (sanitizedValue.length !== 9 || !/^\d{9}$/.test(sanitizedValue)) {
                      return 'Customer TIN must be exactly 9 digits';
                    }
                    return true;
                  }
                })}
                error={!!errors.customer_tin}
                helperText={errors.customer_tin?.message}
              />
            </Grid>
            <Grid size={{xs: 12, md: 6}}>
              <TextField
                label={'Customer VRN'}
                fullWidth
                size='small'
                {...register('customer_vrn')}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label={'Customer Name'}
                fullWidth
                size='small'
                {...register('customer_name')}
              />
            </Grid>
          </Grid>
        </DialogTitle>
      )}
      
      <DialogContent>
        {!organization.is_tra_connected ? (
          <PDFContent
            fileName={`Receipt ${sale.saleNo}`}
            document={<SaleReceiptPDF organization={organization} sale={sale} user={user} />}
          />
        ) : !sale.vfd_receipt ? (
          <SaleReceiptOnScreen organization={organization} sale={sale} />
        ) : postSalesReceiptToVFD.isPending ? (
          <div style={{ width: '100%', padding: '16px' }}>
            <Skeleton variant="text" width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
            <Skeleton variant="rectangular" width="100%" height={48} style={{ borderRadius: 4 }} />
            <Skeleton variant="rectangular" width="100%" height={32} style={{ borderRadius: 4 }} />
          </div>
        ) : (
          <PDFContent
            fileName={`Receipt ${sale.vfd_receipt.verification_code}`}
            document={<SaleReceiptPDF organization={organization} sale={sale} user={user} />}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          size="small" 
          variant='outlined' 
          onClick={() => setOpenReceiptDialog(false)}
        >
          Close
        </Button>
        {organization.is_tra_connected && !sale.vfd_receipt && (
          <LoadingButton 
            size='small' 
            loading={postSalesReceiptToVFD.isPending} 
            variant='contained' 
            onClick={handleSubmit((data) => postSalesReceiptToVFD.mutate(data))}
          >
            Post VFD
          </LoadingButton>
        )}
      </DialogActions>
    </>
  );
};

export default SaleReceipt;