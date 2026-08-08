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
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';
import * as yup from 'yup';
import EmployeeSelector from '../employees/EmployeeSelector';
import { Employee } from '../employees/EmployeesType';
import humanResourcesServices from '../humanResourcesServices';

interface LoanRequstFormProps {
  setOpenDialog: (open: boolean) => void;
  loan?: any;
}

interface FormData {
  id?: number;
  employee_id?: number | null;
  amount?: number | null;
  installments?: string;
  reason?: string | null;
  requested_at?: string | null;
}

interface ApiResponse {
  message: string;
  validation_errors?: {
    name?: string;
    symbol?: string;
  };
}

const LoanRequestsForm = ({
  setOpenDialog,
  loan = null,
}: LoanRequstFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  //   const { employees } = useEmployees();

  const [selectedEmployees, setSelectedEmployees] = useState<Employee | null>(
    loan?.employee || null
  );

  //   useEffect(() => {
  //     if (employees) {
  //       const foundEmployee = employees.find(
  //         (employee) => employee.id === loan?.employee.id
  //       );
  //       if (foundEmployee) {
  //         setSelectedEmployees(foundEmployee);
  //       }
  //     }
  //   }, [employees]);

  const isEditing = !!loan?.id;

  const {
    mutate: submitLoan,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: async (data) => {
      return isEditing
        ? humanResourcesServices.updateLoanRequest({ id: loan.id, ...data })
        : humanResourcesServices.addLoanRequests(data);
    },
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(
        isEditing
          ? 'Loan request updated successfully'
          : 'Loan request added successfully',
        { variant: 'success' }
      );
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      queryClient.invalidateQueries({ queryKey: ['showLoanRequest', loan?.id] });
    },
    onError: (err: any) => {
      enqueueSnackbar(
        err?.response?.data?.message ||
          getErrorMessage(err) ||
          'Something went wrong',
        {
          variant: 'error',
        }
      );
    },
  });

  // Validation Schema
  const validationSchema = yup.object({
    employee_id: yup
      .number()
      .required('Please select an employee')
      .typeError('Please select an employee'),
    amount: yup
      .number()
      .required('Please enter an amount')
      .transform((_, val) =>
        val === '' || val === undefined || val === null ? null : Number(val)
      )
      .min(0, 'Basic salary must be >= 0')
      .typeError('Basic salary must be a number'),
    installments: yup.string().required('Please enter an installments amount'),
    reason: yup.string().nullable(),
    requested_at: yup.string().nullable(),
  });

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      employee_id: loan?.employee_id ?? null,
      amount: loan?.amount ?? null,
      installments: loan?.installments ? String(loan.installments) : '',
      reason: loan?.reason ?? '',
      requested_at: loan?.requested_at || dayjs().format('YYYY-MM-DD'),
    },
  });

  const formatCurrency = (value: number | null | undefined) =>
    value ? value.toLocaleString() : '';

  const onSubmit = (data: FormData) => {
    submitLoan(data);
  };
  const onError = (error: any) => {
    console.log('error: ', error);
  };
  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign='center'>
          {loan?.id ? `Edit Loan` : 'Create Loan Request'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form
          onSubmit={handleSubmit(onSubmit, (errors: FieldErrors) => {
            console.log('errors: ', errors);
          })}
        >
          <Grid container spacing={1} mt={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <EmployeeSelector
                value={selectedEmployees}
                multiple={false}
                frontError={errors.employee_id}
                onChange={(value) => {
                  if (value) {
                    if (Array.isArray(value)) {
                      setSelectedEmployees(value[0]);
                      setValue('employee_id', value[0].id, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    } else {
                      setValue('employee_id', value.id, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setSelectedEmployees(value);
                    }
                  } else {
                    setValue('employee_id', null, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setSelectedEmployees(null);
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label='Amount'
                size='small'
                fullWidth
                value={formatCurrency(watch('amount'))}
                onChange={(e) => {
                  const val = e.target.value.replace(/,/g, '');
                  setValue('amount', val ? Number(val) : null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                error={!!errors.amount}
                helperText={errors.amount?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label='Installments'
                size='small'
                fullWidth
                value={watch('installments')}
                onChange={(e) => {
                  const val = e.target.value;
                  setValue('installments', val ? val : undefined, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                error={!!errors.installments}
                helperText={errors.installments?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label='Request Date'
                value={
                  watch('requested_at') ? dayjs(watch('requested_at')) : null
                }
                onChange={(val) => {
                  setValue('requested_at', val?.format('YYYY-MM-DD') || null, {
                    shouldDirty: true,
                  });
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    error: !!errors.requested_at,
                    helperText: errors.requested_at?.message,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label='Reason'
                size='small'
                fullWidth
                multiline
                rows={2}
                value={watch('reason')}
                onChange={(e) => {
                  const val = e.target.value;
                  setValue('reason', val ? val : undefined);
                }}
                error={!!errors.reason}
                helperText={errors.reason?.message}
              />
            </Grid>
          </Grid>

          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              loading={isPending}
            >
              {loan?.id ? 'Update' : 'Create'}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default LoanRequestsForm;
