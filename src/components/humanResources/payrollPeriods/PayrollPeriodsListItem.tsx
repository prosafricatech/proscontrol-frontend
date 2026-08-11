'use client';

import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { ReceiptLongOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Chip,
  Dialog,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import PayrollRunForm from '../payrollRuns/PayrollRunForm';
import { PayrollRunType } from '../payrollRuns/PayrollRunType';
import { PayrollPeriodType } from './PayrollPeriodType';
import PayrollPeriodDetails from './PayrollPeriodDetails';

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const statusColor = (
  status: string
): 'success' | 'warning' | 'error' | 'default' => {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'finalized':
    case 'approved':
      return 'success';
    case 'submitted':
    case 'processing':
      return 'warning';
    case 'rejected':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

interface PayrollPeriodsListItemProps {
  payrollPeriod: PayrollPeriodType;
}

const PayrollPeriodsListItem = ({
  payrollPeriod,
}: PayrollPeriodsListItemProps) => {
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [expanded, setExpanded] = useState(false);
  const [openCreateRunDialog, setOpenCreateRunDialog] = useState(false);

  const {
    data: runsData,
    refetch: refetchRuns,
  } = useQuery({
    queryKey: ['payrollRunsForPeriod', String(payrollPeriod.id)],
    queryFn: () =>
      humanResourcesServices.getPayrollRunsList({
        payroll_period_id: payrollPeriod.id,
      }),
    enabled: expanded,
  });

  const runs: PayrollRunType[] = runsData?.data || [];
  const runCount = payrollPeriod.runs_count ?? runs.length ?? 0;
  const monthName = MONTH_NAMES[payrollPeriod.month] || payrollPeriod.month;

  const handleRunCreated = () => {
    setOpenCreateRunDialog(false);
    refetchRuns();
    queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
  };

  return (
    <>
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded(!expanded)}
        square
        sx={{
          borderRadius: 2,
          borderTop: 2,
          borderColor: 'divider',
          '&:hover': { bgcolor: 'action.hover' },
          '&.Mui-expanded': { margin: '0 0 16px 0' },
        }}
      >
        <AccordionSummary
          expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
          sx={{
            px: { xs: 1.5, sm: 3 },
            flexDirection: 'row-reverse',
            '.MuiAccordionSummary-content': {
              alignItems: 'center',
              minWidth: 0,
              '&.Mui-expanded': { margin: '12px 0' },
            },
            '.MuiAccordionSummary-expandIconWrapper': {
              borderRadius: 1,
              border: 1,
              color: 'text.secondary',
              transform: 'none',
              mr: 1,
              flexShrink: 0,
              '&.Mui-expanded': {
                transform: 'none',
                color: 'primary.main',
                borderColor: 'primary.main',
              },
              '& svg': { fontSize: '1.25rem' },
            },
          }}
        >
          <Stack
            direction='row'
            spacing={1.5}
            alignItems='center'
            flexWrap='wrap'
            useFlexGap
            width='100%'
            sx={{ px: 1 }}
          >
            <Typography variant='body1' fontWeight={600} sx={{ mr: 'auto' }}>
              {monthName} {payrollPeriod.year}
            </Typography>
            <Chip
              label={payrollPeriod.status || 'active'}
              color={statusColor(payrollPeriod.status || '')}
              size='small'
              sx={{ textTransform: 'capitalize' }}
            />
            <Badge badgeContent={runCount} color='info' showZero>
              <ReceiptLongOutlined fontSize='small' color='action' />
            </Badge>
          </Stack>
        </AccordionSummary>

        <AccordionDetails sx={{ bgcolor: 'background.paper', mb: 3 }}>
          <PayrollPeriodDetails
            payrollPeriodId={payrollPeriod.id}
            payrollPeriod={payrollPeriod}
            year={payrollPeriod.year}
            month={payrollPeriod.month}
          />
        </AccordionDetails>
      </Accordion>

      <Dialog
        open={openCreateRunDialog}
        onClose={() => setOpenCreateRunDialog(false)}
        maxWidth='sm'
        fullWidth
        fullScreen={belowLargeScreen}
      >
        <PayrollRunForm
          setOpenDialog={setOpenCreateRunDialog}
          payrollPeriod={payrollPeriod}
          onSuccess={handleRunCreated}
          runs={runs}
        />
      </Dialog>
    </>
  );
};

export default PayrollPeriodsListItem;
