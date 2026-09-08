import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { AddOutlined, FileDownloadOutlined, UploadFileOutlined } from '@mui/icons-material';
import {
  Box,
  ButtonGroup,
  Dialog,
  IconButton,
  Tooltip,
  alpha,
  useMediaQuery,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { DepartmentsProvider } from '../departments/DepartmentsProvider';
import EmployeeForm from './EmployeeForm';
import EmployeeOnboardingDialog from './EmployeeOnboardingDialog';

const getErrorMessage = (error: any) => {
  const validationErrors = error?.response?.data?.validation_errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors)[0] as any;
    return Array.isArray(first) ? first[0] : String(first);
  }
  return (
    error?.response?.data?.message || error?.message || 'Something went wrong'
  );
};

// Simple Excel-styled icon with "XLS" badge
const ExcelUploadIcon = () => (
  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
    <UploadFileOutlined
      sx={{
        color: '#217346',
        fontSize: 24,
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        bottom: -4,
        right: -4,
        fontSize: 7,
        fontWeight: 700,
        bgcolor: '#217346',
        color: 'white',
        px: 0.4,
        borderRadius: 0.5,
        lineHeight: 1.2,
        fontFamily: 'sans-serif',
      }}
    >
      XLS
    </Box>
  </Box>
);

const EmployeeActionTail = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openOnboardingDialog, setOpenOnboardingDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { enqueueSnackbar } = useSnackbar();

  const { mutate: exportExcel, isPending: isExporting } = useMutation({
    mutationFn: humanResourcesServices.exportEmployeesExcel,
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'Employees.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <>
      <Dialog
        open={openDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
        onClose={() => setOpenDialog(false)}
      >
        <DepartmentsProvider>
          <EmployeeForm setOpenDialog={setOpenDialog} />
        </DepartmentsProvider>
      </Dialog>
      <Dialog
        open={openOnboardingDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
        onClose={() => setOpenOnboardingDialog(false)}
      >
        <EmployeeOnboardingDialog setOpenDialog={setOpenOnboardingDialog} />
      </Dialog>
      <ButtonGroup
        variant='outlined'
        size='small'
        disableElevation
        sx={{
          '& .MuiButton-root': { px: 1 },
          '& .MuiButtonGroup-grouped:not(:last-of-type)': {
            borderColor: 'divider',
          },
        }}
      >
        <Tooltip title='Employee Onboarding Import'>
          <IconButton
            onClick={() => setOpenOnboardingDialog(true)}
            sx={{
              color: '#217346',
              '&:hover': {
                bgcolor: alpha('#217346', 0.08),
              },
            }}
          >
            <ExcelUploadIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='Export Employees to Excel'>
          <span>
            <IconButton
              disabled={isExporting}
              onClick={() => exportExcel({})}
            >
              <FileDownloadOutlined />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title='Add Employee'>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </>
  );
};

export default EmployeeActionTail;
