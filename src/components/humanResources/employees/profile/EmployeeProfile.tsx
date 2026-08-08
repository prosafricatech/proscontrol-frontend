'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import LedgerGroupProvider from '@/components/accounts/ledgerGroups/LedgerGroupProvider';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { EditOutlined } from '@mui/icons-material';
import {
  Avatar,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { DepartmentsProvider } from '../../departments/DepartmentsProvider';
import { DesignationsProvider } from '../../designations/DesignationsProvider';
import humanResourcesServices from '../../humanResourcesServices';
import EmployeeForm from '../EmployeeForm';
import { EmployeesProvider } from '../EmployeesProvider';
import { Employee } from '../EmployeesType';
import AuditTrailTab from './auditTrail/AuditTrailTab';
import SalaryHistoryTab from './auditTrail/SalaryHistoryTab';
import EmployeeAllowances from './employeeAllowances/EmployeeAllowances';
import EmployeeBankAccounts from './employeeBankAccounts/EmployeeBankAccounts';
import EmployeeDeductions from './employeeDeductions/EmployeeDeductions';
import EmployeeEmployerContributions from './employeeEmployerContributions/EmployeeEmployerContributions';
import EmployeeLeaveTab from './EmployeeLeaveTab';
import EmployeeProfileProvider, {
  useEmployeeProfile,
} from './EmployeeProfileProvider';
import EmployeesContracts from './employeesContracts/EmployeesContracts';
import NextOfKins from './nextOfKins/NextOfKins';
import PersonalInfoTab from './PersonalInfoTab';

type TabKey =
  | 'personalInfo'
  | 'contracts'
  | 'bankAccounts'
  | 'nextOfKin'
  | 'allowances'
  | 'deductions'
  | 'employerContributions'
  | 'leave'
  | 'movements'
  | 'salaryHistory'
  | 'attachments';

const VALID_TABS: TabKey[] = [
  'personalInfo',
  'contracts',
  'bankAccounts',
  'nextOfKin',
  'allowances',
  'deductions',
  'employerContributions',
  'leave',
  'attachments',
  'movements',
  'salaryHistory',
];

const formatEmploymentType = (employmentType?: string | null) => {
  if (!employmentType) return '';
  return employmentType
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

function ProfileContent() {
  const { employee, reFetchEmployee } = useEmployeeProfile();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const router = useRouter();
  const lang = useLanguage();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(
        'employeeProfileActiveTab'
      ) as TabKey;
      return saved && VALID_TABS.includes(saved) ? saved : 'personalInfo';
    }
    return 'personalInfo';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('employeeProfileActiveTab', activeTab);
    }
  }, [activeTab]);

  const { mutate: deleteEmployee } = useMutation({
    mutationFn: humanResourcesServices.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      enqueueSnackbar('Employee deleted successfully', { variant: 'success' });
      router.push(`/${lang}/humanResources/employees`);
    },
    onError: () => {
      enqueueSnackbar('Error deleting employee', { variant: 'error' });
    },
  });

  const { mutate: fetchEmployeeForEdit, isPending: isLoadingEditEmployee } =
    useMutation({
      mutationFn: (id: number) => humanResourcesServices.showEmployee(id),
      onSuccess: (fullEmployee: Employee) => {
        setEditingEmployee(fullEmployee);
        setOpenEditDialog(true);
      },
      onError: () => {
        enqueueSnackbar('Error loading employee details', { variant: 'error' });
      },
    });

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabKey) => {
    setActiveTab(newValue);
  };

  const handleDelete = () => {
    if (!employee) return;
    showDialog({
      title: 'Delete Employee',
      content: 'Are you sure you want to delete this employee?',
      onYes: () => {
        hideDialog();
        deleteEmployee(employee.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleEdit = () => {
    if (!employee?.id) return;
    fetchEmployeeForEdit(employee.id);
  };

  const employeeId = employee?.id;

  const fullName = employee
    ? `${employee.first_name ?? ''} ${employee.middle_name ?? ''} ${employee.last_name ?? ''}`.trim()
    : '';

  const empTypeBadge = formatEmploymentType(employee?.employment_type);

  const renderTabContent = useMemo(() => {
    if (!employeeId) {
      return (
        <Stack spacing={2} sx={{ width: '100%' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              variant='rectangular'
              width='100%'
              height={48}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Stack>
      );
    }

    switch (activeTab) {
      case 'personalInfo':
        return <PersonalInfoTab />;
      case 'contracts':
        return (
          <DesignationsProvider>
            <EmployeesContracts employeeId={employeeId} />
          </DesignationsProvider>
        );
      case 'bankAccounts':
        return <EmployeeBankAccounts employeeId={employeeId} />;
      case 'nextOfKin':
        return <NextOfKins employeeId={employeeId} />;
      case 'allowances':
        return <EmployeeAllowances employeeId={employeeId} />;
      case 'deductions':
        return <EmployeeDeductions employeeId={employeeId} />;
      case 'employerContributions':
        return <EmployeeEmployerContributions employeeId={employeeId} />;
      case 'movements':
        return <AuditTrailTab employeeId={employeeId} />;
      case 'salaryHistory':
        return <SalaryHistoryTab employeeId={employeeId} />;
      case 'leave':
        return <EmployeeLeaveTab employeeId={employeeId} />;
      case 'attachments':
        return (
          <AttachmentForm
            hideFeatures
            attachment_name='Employee'
            attachment_sourceNo={
              employee?.employee_number || String(employeeId)
            }
            attachmentable_type='employee'
            attachmentable_id={employeeId}
          />
        );
      default:
        return null;
    }
  }, [activeTab, employee?.employee_number, employeeId]);

  return (
    <>
      <Dialog
        open={openEditDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
      >
        <LedgerSelectProvider>
          <LedgerGroupProvider>
            <DepartmentsProvider>
              <DesignationsProvider>
                <EmployeeForm
                  employee={editingEmployee ?? employee ?? undefined}
                  setOpenDialog={(v) => {
                    setOpenEditDialog(v);
                    if (!v) {
                      setEditingEmployee(null);
                      reFetchEmployee();
                    }
                  }}
                />
              </DesignationsProvider>
            </DepartmentsProvider>
          </LedgerGroupProvider>
        </LedgerSelectProvider>
      </Dialog>

      <JumboContentLayout
        header={
          <Stack
            direction='row'
            alignItems='flex-start'
            spacing={2}
            flexWrap='wrap'
          >
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                fontSize: 24,
              }}
            >
              {employee?.first_name?.[0] ?? '?'}
            </Avatar>
            <Stack flex={1} spacing={0.25}>
              <Typography variant='h4'>{fullName}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {employee?.employee_number}
                {employee?.department?.name
                  ? ` · ${employee.department.name}`
                  : ''}
                {employee?.active_contract?.designation?.title
                  ? ` · ${employee.active_contract.designation.title}`
                  : ''}
              </Typography>
              {employee?.manager && (
                <Typography variant='body2' color='text.secondary'>
                  {'Reports to: '}
                  <Typography
                    component='span'
                    variant='body2'
                    color='primary.main'
                    onClick={() =>
                      router.push(
                        `/${lang}/humanResources/employees/${employee.manager!.id}`
                      )
                    }
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {`${employee.manager.first_name} ${employee.manager.last_name}`}
                  </Typography>
                </Typography>
              )}
              <Stack direction='row' spacing={1} alignItems='center' mt={0.5}>
                {empTypeBadge && (
                  <Chip
                    label={empTypeBadge}
                    size='small'
                    color='primary'
                    variant='outlined'
                  />
                )}
                {employee?.join_date && (
                  <Typography variant='body2' color='text.secondary'>
                    Joined {readableDate(employee.join_date, false)}
                  </Typography>
                )}
              </Stack>
            </Stack>
            <Stack direction='row' spacing={1}>
              <Tooltip title='Edit Employee'>
                <Button
                  size='small'
                  variant='outlined'
                  startIcon={
                    isLoadingEditEmployee ? (
                      <CircularProgress size={16} />
                    ) : (
                      <EditOutlined />
                    )
                  }
                  disabled={isLoadingEditEmployee}
                  onClick={handleEdit}
                >
                  Edit
                </Button>
              </Tooltip>
              <Tooltip title='Delete Employee'>
                <Button
                  size='small'
                  variant='outlined'
                  color='error'
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </Tooltip>
            </Stack>
          </Stack>
        }
      >
        <Card sx={{ height: '100%', p: 1 }}>
          <Stack spacing={1}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant='scrollable'
              scrollButtons='auto'
              allowScrollButtonsMobile
            >
              <Tab label='Personal Info' value='personalInfo' />
              <Tab label='Contracts' value='contracts' />
              <Tab label='Bank Accounts' value='bankAccounts' />
              <Tab label='Next of Kin' value='nextOfKin' />
              <Tab label='Allowances' value='allowances' />
              <Tab label='Deductions' value='deductions' />
              <Tab
                label='Employer Contributions'
                value='employerContributions'
              />
              <Tab label='Leave' value='leave' />
              <Tab label='Attachments' value='attachments' />
              <Tab label='Movements' value='movements' />
              <Tab label='Salary History' value='salaryHistory' />
            </Tabs>

            {renderTabContent}
          </Stack>
        </Card>
      </JumboContentLayout>
    </>
  );
}

export default function EmployeeProfile() {
  return (
    <EmployeeProfileProvider>
      <EmployeesProvider>
        <ProfileContent />
      </EmployeesProvider>
    </EmployeeProfileProvider>
  );
}
