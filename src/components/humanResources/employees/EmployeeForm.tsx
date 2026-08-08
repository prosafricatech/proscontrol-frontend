'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import costCenterservices from '@/components/masters/costCenters/cost-center-services';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import organizationServices from '@/components/organizations/organizationServices';
import UsersSelector from '@/components/sharedComponents/UsersSelector';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  LinearProgress,
  Switch,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useFormState } from 'react-hook-form';
import * as yup from 'yup';
import { useDepartments } from '../departments/DepartmentsProvider';
import { Department } from '../departments/DepartmentsType';
import { useDesignations } from '../designations/DesignationsProvider';
import { Designation } from '../designations/DesignationsType';
import humanResourcesServices from '../humanResourcesServices';
import EmployeeSelector from './EmployeeSelector';
import { Employee } from './EmployeesType';

interface User {
  id: number;
  name: string;
  [key: string]: any;
}

interface EmployeeFormProps {
  setOpenDialog: (open: boolean) => void;
  employee?: Employee | null;
}

interface FormData extends Omit<Employee, 'id'> {
  id?: number;
  basic_salary?: number | null;
  contract_start_date?: string | null;
  reason?: string | null;
}

interface ApiResponse {
  message: string;
  validation_errors?: {
    name?: string;
    symbol?: string;
  };
}

interface OptionType {
  label: string;
  value: string;
}

// Constants
const GENDER_OPTIONS: OptionType[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];
const EMPLOYMENT_OPTIONS: OptionType[] = [
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Casual', value: 'casual' },
];

const EmployeeForm = ({
  setOpenDialog,
  employee = null,
}: EmployeeFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { checkOrganizationPermission, authOrganization, hasOrganizationRole } =
    useJumboAuth();
  const organization = authOrganization?.organization;
  const { designations, isFetching: fetchingDesignations } = useDesignations();
  const designationsData = (designations || []) as Designation[];
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const { departments, isFetching } = useDepartments();

  const [departmentsData, setDepartmentsData] = useState<Department[]>([]);
  const [selectedDpt, setSelectedDpt] = useState<Department | null>(null);
  const [employeeDoB, setEmployeeDoB] = useState<string>('');
  const [joinDate, setJoinDate] = useState<string>('');
  const [contractStartDate, setContractStartDate] = useState<string>('');
  const [employeeGender, setEmployeeGender] = useState<OptionType>(
    GENDER_OPTIONS[0]
  );
  const [selectedEmploymentType, setSelectedEmploymentType] =
    useState<OptionType | null>(null);
  const [defaultCostCenter, setDefaultCostCenter] = useState<CostCenter | null>(
    null
  );
  const [customeName, setCustomeName] = useState(false);
  const [defaultUser, setDefaultUser] = useState<User | null>(null);

  const { data: fetchedCostCenters, isLoading } = useQuery<CostCenter[]>({
    queryKey: ['allCostCenters'],
    queryFn: costCenterservices.getCostCenters,
    enabled: !!employee,
  });

  const { data: rawUsers = [], isFetching: usersLoading } = useQuery<User[]>({
    queryKey: ['users', organization?.id],
    queryFn: () =>
      organizationServices.getOrganizationUsers({
        organizationId: organization?.id,
      }),
    enabled: !!employee?.id,
  });

  useEffect(() => {
    if (rawUsers && rawUsers.length > 0) {
      const linkedUser = rawUsers.find((user) => user.id === employee?.user_id);
      linkedUser ? setDefaultUser(linkedUser) : setDefaultUser(null);
    }
  }, [rawUsers]);

  useEffect(() => {
    if (fetchedCostCenters) {
      const costCenter = fetchedCostCenters.find(
        (center) => center.id === employee?.cost_center_id
      );
      if (costCenter) setDefaultCostCenter(costCenter);
    }
  }, [fetchedCostCenters, employee?.cost_center_id]);

  // Date helper
  const formatDateToAPI = (date: string | null | undefined): string | null => {
    if (!date) return null;
    return dayjs(date).format('YYYY-MM-DD[T]HH:mm:ss.SSSSSS[Z]');
  };

  // Normalize dates from employee data
  const getNormalizedDate = (date: string | undefined) =>
    date ? dayjs(date).format('YYYY-MM-DD') : '';

  const normalizedDateOfBirth = getNormalizedDate(employee?.date_of_birth);
  const normalizedJoinDate = getNormalizedDate(employee?.join_date);
  const normalizedContractStartDate = getNormalizedDate(
    (employee as any)?.active_contract?.start_date ||
      employee?.contract_start_date
  );

  useEffect(() => {
    if (departments?.data?.length) {
      setDepartmentsData(departments.data);
      if (employee?.department_id) {
        setSelectedDpt(
          departments.data.find(
            (d: Department) => d.id === employee.department_id
          ) ?? null
        );
      }
    }
  }, [departments, employee?.department_id]);

  useEffect(() => {
    setValue('gender', employeeGender.value);
  }, [employeeGender]);

  // Mutations
  const {
    mutate: addEmployee,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: async (data) => {
      const formattedData = {
        ...data,
        date_of_birth: formatDateToAPI(data.date_of_birth),
        join_date: formatDateToAPI(data.join_date),
        contract_start_date: formatDateToAPI(data.contract_start_date),
        reason: data.reason || null,
      };
      return humanResourcesServices.addEmployee(formattedData);
    },
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Employee added successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
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

  const {
    mutate: updateEmployee,
    isPending: updateIsLoading,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: async (data) => {
      const formattedData = {
        ...data,
        id: employee?.id,
        date_of_birth: formatDateToAPI(data.date_of_birth),
        join_date: formatDateToAPI(data.join_date),
        contract_start_date: formatDateToAPI(data.contract_start_date),
        reason: data.reason || null,
      };
      return humanResourcesServices.updateEmployee(formattedData);
    },
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Employee updated successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
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
    employee_number: yup.string().nullable(),
    first_name: yup.string().required('First name is required').max(100),
    middle_name: yup.string().nullable().max(100),
    last_name: yup.string().required('Last name is required').max(100),
    gender: yup.string().required('Gender is required'),
    email: yup.string().email('Invalid email format').nullable(),
    phone_number: yup.string().nullable(),
    address: yup.string().nullable(),
    date_of_birth: yup.string().nullable(),
    national_id: yup.string().nullable().max(50),
    passport_number: yup.string().nullable().max(50),
    department_id: yup.number().nullable(),
    cost_center_id: yup.number().nullable().optional(),
    manager_id: yup.number().nullable().optional(),
    payable_ledger_id: yup.number().nullable().optional(),
    create_payable: yup.boolean().optional(),
    payable_ledger_name: yup.string().nullable().optional(),
    employment_type: yup.string().required('This field is required'),
    join_date: yup.string().nullable(),
    designation_id: yup.number().nullable().typeError('This field is required'),
    basic_salary: yup
      .number()
      .nullable()
      .transform((_, val) =>
        val === '' || val === undefined || val === null ? null : Number(val)
      )
      .min(0, 'Basic salary must be >= 0')
      .typeError('Basic salary must be a number'),
    contract_start_date: yup.string().nullable(),
    reason: yup.string().nullable().optional(),
    user_id: yup.number().nullable(),
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
      employee_number: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      gender: GENDER_OPTIONS[0].value,
      email: '',
      phone_number: '',
      address: '',
      date_of_birth: '',
      national_id: '',
      passport_number: '',
      department_id: undefined,
      cost_center_id: null,
      manager_id: null,
      payable_ledger_id: null,
      create_payable: false,
      payable_ledger_name: '',
      employment_type: '',
      join_date: '',
      designation_id: undefined,
      basic_salary: null,
      contract_start_date: null,
      reason: '',
      user_id: null,
    },
  });

  const { isDirty, dirtyFields } = useFormState({ control });
  const showReasonField =
    !!employee &&
    (dirtyFields.cost_center_id || dirtyFields.department_id || dirtyFields.manager_id);

  // Populate form when editing
  useEffect(() => {
    if (!employee) return;

    const resolvedGender =
      GENDER_OPTIONS.find((o) => o.value === employee.gender) ??
      GENDER_OPTIONS[0];
    const resolvedEmployment =
      EMPLOYMENT_OPTIONS.find((o) => o.value === employee.employment_type) ??
      null;
    const designation = (employee as any)?.active_contract?.designation;
    const contractBasicSalary = (employee as any)?.active_contract
      ?.basic_salary;
    const contractStart = (employee as any)?.active_contract?.start_date;

    setEmployeeGender(resolvedGender);
    setSelectedEmploymentType(resolvedEmployment);
    setEmployeeDoB(normalizedDateOfBirth);
    setJoinDate(normalizedJoinDate);
    setContractStartDate(normalizedContractStartDate || contractStart || '');

    reset({
      employee_number: employee.employee_number || '',
      first_name: employee.first_name || '',
      middle_name: employee.middle_name || '',
      last_name: employee.last_name || '',
      gender: resolvedGender.value,
      email: employee.email || '',
      phone_number: employee.phone_number || '',
      address: employee.address || '',
      date_of_birth: normalizedDateOfBirth,
      national_id: employee.national_id || '',
      passport_number: employee.passport_number || '',
      department_id: employee.department_id || undefined,
      cost_center_id: employee.cost_center_id ?? null,
      manager_id: employee.manager_id ?? null,
      payable_ledger_id: employee.payable_ledger_id ?? null,
      create_payable: false,
      payable_ledger_name: '',
      employment_type: resolvedEmployment?.value || '',
      join_date: normalizedJoinDate,
      designation_id: designation?.id || undefined,
      basic_salary: contractBasicSalary ?? employee.basic_salary ?? null,
      contract_start_date: normalizedContractStartDate || contractStart || null,
      reason: '',
      user_id: employee.user_id ?? null,
    });
  }, [employee, reset]);

  // Memoize the lookup so it only recalculates when designation list or selected ID changes
  const watchDesignationId = watch('designation_id');

  const selectedDesignation = useMemo(() => {
    if (!watchDesignationId || !designationsData.length) return null;
    return designationsData.find((d) => d.id === watchDesignationId) || null;
  }, [watchDesignationId, designationsData]);

  const onSubmit = (data: FormData) => {
    employee?.id ? updateEmployee(data) : addEmployee(data);
  };

  const formatCurrency = (value: number | null | undefined) =>
    value ? value.toLocaleString() : '';

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign='center'>
          {employee?.id
            ? `Edit ${employee.first_name} ${employee.last_name}`
            : 'Add Employee'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={1}>
            {/* Personal Information */}
            <Grid size={12}>
              <Div sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                Personal Information
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label='First Name *'
                size='small'
                fullWidth
                error={!!errors.first_name}
                helperText={errors.first_name?.message}
                {...register('first_name')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label='Middle Name'
                size='small'
                fullWidth
                error={!!errors.middle_name}
                helperText={errors.middle_name?.message}
                {...register('middle_name')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label='Last Name *'
                size='small'
                fullWidth
                error={!!errors.last_name}
                helperText={errors.last_name?.message}
                {...register('last_name')}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label='Employee Number'
                size='small'
                fullWidth
                error={!!errors.employee_number}
                helperText={errors.employee_number?.message}
                {...register('employee_number')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name='gender'
                control={control}
                render={({ field, fieldState }) => (
                  <Autocomplete
                    size='small'
                    options={GENDER_OPTIONS}
                    getOptionLabel={(o) => o.label}
                    value={employeeGender}
                    onChange={(_, newVal) => {
                      setEmployeeGender(newVal || GENDER_OPTIONS[0]);
                      field.onChange(newVal?.value || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Gender *'
                        error={!!fieldState.error}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name='date_of_birth'
                control={control}
                render={({ field, fieldState }) => (
                  <DatePicker
                    label='Date of Birth'
                    value={employeeDoB ? dayjs(employeeDoB) : null}
                    onChange={(val) => {
                      const formatted = val?.format('YYYY-MM-DD') || '';
                      setEmployeeDoB(formatted);
                      field.onChange(formatted);
                    }}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: !!fieldState.error,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Contact Information */}
            <Grid size={12}>
              <Div sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                Contact Information
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label='Email'
                size='small'
                fullWidth
                type='email'
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label='Phone Number'
                size='small'
                fullWidth
                error={!!errors.phone_number}
                helperText={errors.phone_number?.message}
                {...register('phone_number')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label='Address'
                size='small'
                fullWidth
                error={!!errors.address}
                helperText={errors.address?.message}
                {...register('address')}
              />
            </Grid>

            {/* Identification */}
            <Grid size={12}>
              <Div sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Identification</Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label='National ID'
                size='small'
                fullWidth
                error={!!errors.national_id}
                helperText={errors.national_id?.message}
                {...register('national_id')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label='Passport Number'
                size='small'
                fullWidth
                error={!!errors.passport_number}
                helperText={errors.passport_number?.message}
                {...register('passport_number')}
              />
            </Grid>

            {/* Employment Details */}
            <Grid size={12}>
              <Div sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                Employment Details
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              {isFetching ? (
                <LinearProgress />
              ) : (
                <Controller
                  name='department_id'
                  control={control}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      size='small'
                      options={departmentsData}
                      getOptionLabel={(o) => o.name}
                      value={selectedDpt}
                      onChange={(_, newVal) => {
                        setSelectedDpt(newVal);
                        field.onChange(newVal?.id || null);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Department'
                          error={!!fieldState.error}
                        />
                      )}
                    />
                  )}
                />
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name='employment_type'
                control={control}
                render={({ field, fieldState }) => (
                  <Autocomplete
                    size='small'
                    options={EMPLOYMENT_OPTIONS}
                    getOptionLabel={(o) => o.label}
                    value={selectedEmploymentType}
                    onChange={(_, newVal) => {
                      setSelectedEmploymentType(newVal);
                      field.onChange(newVal?.value || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Employment Type'
                        error={!!fieldState.error}
                        helperText={errors.employment_type?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name='join_date'
                control={control}
                render={({ field, fieldState }) => (
                  <DatePicker
                    label='Join Date'
                    value={joinDate ? dayjs(joinDate) : null}
                    onChange={(val) => {
                      const formatted = val?.format('YYYY-MM-DD') || '';
                      setJoinDate(formatted);
                      field.onChange(formatted);
                    }}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: !!fieldState.error,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Controller
                name='cost_center_id'
                control={control}
                render={({ field }) => (
                  <CostCenterSelector
                    multiple={false}
                    label='Cost Center'
                    defaultValue={
                      (employee as any)?.cost_center ||
                      defaultCostCenter ||
                      null
                    }
                    onChange={(val) => {
                      const selected = Array.isArray(val) ? val[0] : val;
                      field.onChange(selected?.id || null);
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Controller
                name='manager_id'
                control={control}
                render={({ field }) => (
                  <EmployeeSelector
                    multiple={false}
                    label='Line Manager'
                    excludeId={employee?.id}
                    defaultValue={(employee as any)?.manager || null}
                    onChange={(val) => {
                      const selected = Array.isArray(val) ? val[0] : val;
                      field.onChange(selected?.id || null);
                    }}
                  />
                )}
              />
            </Grid>

            {showReasonField && (
              <Grid size={12}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <TextField
                    label='Reason for Change'
                    size='small'
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder='e.g., Site relocation, Team restructuring, Promotion, Department transfer...'
                    error={!!errors.reason}
                    helperText={
                      errors.reason?.message ||
                      'Please provide a reason for this change for audit trail purposes'
                    }
                    {...register('reason')}
                  />
                </Div>
              </Grid>
            )}

            {/* Payroll & Contract Settings */}
            <Grid size={12}>
              <Div sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                Payroll & Contract Settings
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              {fetchingDesignations ? (
                <LinearProgress />
              ) : (
                <Controller
                  name='designation_id'
                  control={control}
                  rules={{ required: 'Designation is required' }}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      size='small'
                      options={designationsData}
                      isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                      }
                      getOptionLabel={(option) => option.title || ' '}
                      value={selectedDesignation}
                      onChange={(event, newValue) => {
                        field.onChange(newValue?.id || null);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Designation'
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  )}
                />
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label='Basic Salary'
                size='small'
                fullWidth
                value={formatCurrency(watch('basic_salary'))}
                onChange={(e) => {
                  const val = e.target.value.replace(/,/g, '');
                  setValue('basic_salary', val ? Number(val) : null);
                }}
                error={!!errors.basic_salary}
                helperText={errors.basic_salary?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name='contract_start_date'
                control={control}
                render={({ field, fieldState }) => (
                  <DatePicker
                    label='Contract Start Date'
                    value={contractStartDate ? dayjs(contractStartDate) : null}
                    onChange={(val) => {
                      const formatted = val?.format('YYYY-MM-DD') || '';
                      setContractStartDate(formatted);
                      field.onChange(formatted || null);
                    }}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: !!fieldState.error,
                        helperText: fieldState.error?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Accounting Settings */}
            {checkOrganizationPermission(
              PERMISSIONS.ACCOUNTS_MASTERS_CREATE
            ) && (
              <>
                <Grid size={12}>
                  <Div sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                    Accounting Settings
                  </Div>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={customeName}
                        disabled={!!employee}
                        onChange={() => {
                          setCustomeName((prev) => !prev);
                          setValue('payable_ledger_id', null);
                          setValue('payable_ledger_name', '');
                        }}
                      />
                    }
                    label='Enter custom account name'
                  />
                </Grid>

                {!customeName ? (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <LedgerSelect
                      frontError={errors.payable_ledger_id}
                      defaultValue={
                        ungroupedLedgerOptions.find(
                          (l) => l.id === employee?.payable_ledger_id
                        ) || null
                      }
                      allowedGroups={['Accounts Payable']}
                      onChange={(val) => {
                        if (!Array.isArray(val)) {
                          setValue('payable_ledger_id', val?.id || 0, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }
                      }}
                      label='Payable Account'
                    />
                  </Grid>
                ) : (
                  !employee && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label='Payable Ledger Name'
                        size='small'
                        fullWidth
                        placeholder='e.g., Payable - Jane Doe'
                        error={!!errors.payable_ledger_name}
                        helperText={errors.payable_ledger_name?.message}
                        {...register('payable_ledger_name')}
                      />
                    </Grid>
                  )
                )}
              </>
            )}

            {/* linked user account */}
            {hasOrganizationRole('Administrator') && (
              <>
                <Grid size={12}>
                  <Div sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                    Linked User Account
                  </Div>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <UsersSelector
                    label='Linked User Account'
                    defaultValue={defaultUser}
                    frontError={errors.user_id}
                    onChange={(v) => {
                      if (v && Array.isArray(v)) {
                        setValue('user_id', v[0].id);
                      }
                      if (v && !Array.isArray(v)) {
                        setValue('user_id', v.id);
                      }
                      if (!v || v === null) {
                        setValue('user_id', null);
                      }
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>

          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              loading={isPending || updateIsLoading}
            >
              {employee?.id ? 'Update' : 'Create'}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default EmployeeForm;
