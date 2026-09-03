'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { Div } from '@jumbo/shared';
import {
  BeachAccessOutlined,
  CakeOutlined,
  DescriptionOutlined,
  GroupsOutlined,
  PendingActionsOutlined,
  RequestQuoteOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { formatMoney } from '../payrollRuns/payrollUtils';
import { HrDashboardData } from './HrDashboardType';

// All four detail cards share this so they line up evenly regardless of how
// many rows each one happens to have — the list scrolls internally past it
// instead of the card growing to fit its content.
const DETAIL_CARD_HEIGHT = 360;

const StatTile = ({
  icon,
  label,
  value,
  sub,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: string;
  onClick?: () => void;
}) => (
  <Card
    variant='outlined'
    onClick={onClick}
    sx={{
      p: 2,
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { boxShadow: 2 } : undefined,
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: '50%',
        bgcolor: color ? `${color}.light` : 'action.hover',
        color: color ? `${color}.dark` : 'text.secondary',
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box minWidth={0}>
      <Typography variant='h4' fontWeight={700} lineHeight={1.2}>
        {value}
      </Typography>
      <Typography variant='body2' color='text.secondary' noWrap>
        {label}
      </Typography>
      {sub && (
        <Typography variant='caption' color='text.secondary'>
          {sub}
        </Typography>
      )}
    </Box>
  </Card>
);

const EmptyRow = ({ colSpan, text }: { colSpan: number; text: string }) => (
  <TableRow>
    <TableCell colSpan={colSpan} align='center' sx={{ py: 3 }}>
      <Typography variant='body2' color='text.secondary'>
        {text}
      </Typography>
    </TableCell>
  </TableRow>
);

const EmptyState = ({ text }: { text: string }) => (
  <Typography variant='body2' color='text.secondary' align='center' sx={{ py: 3 }}>
    {text}
  </Typography>
);

// A table's columns just don't fit a phone-width screen — this is the
// mobile stand-in used by all four detail cards instead, one stacked card
// per row.
const MobileRowCard = ({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) => (
  <Card
    variant='outlined'
    onClick={onClick}
    sx={{
      p: 1.5,
      mb: 1,
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { boxShadow: 2 } : undefined,
      '&:last-of-type': { mb: 0 },
    }}
  >
    {children}
  </Card>
);

const HrDashboard = () => {
  const router = useRouter();
  const lang = useLanguage();
  const { theme } = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { data, isFetching } = useQuery<HrDashboardData>({
    queryKey: ['hrDashboard'],
    queryFn: () => humanResourcesServices.getHrDashboard(),
  });

  const goTo = (path: string) => router.push(`/${lang}/humanResources/${path}`);
  const goToEmployee = (id: number) =>
    router.push(`/${lang}/humanResources/employees/${id}`);

  // Stat tiles for the four in-page detail cards scroll down to that card
  // instead of navigating away — the data is already right there on this
  // page, no need to leave it.
  const leaveRef = useRef<HTMLDivElement>(null);
  const loansRef = useRef<HTMLDivElement>(null);
  const contractsRef = useRef<HTMLDivElement>(null);
  const birthdaysRef = useRef<HTMLDivElement>(null);
  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) =>
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (isFetching && !data) {
    return <LinearProgress />;
  }

  const onLeave = data?.employees_on_leave || [];
  const loans = data?.active_loans || { total_outstanding: 0, count: 0, rows: [] };
  const expiringContracts = data?.expiring_contracts || [];
  const birthdays = data?.upcoming_birthdays || [];
  const headcount = data?.headcount || { total_employees: 0, new_hires_this_month: 0 };
  const pending = data?.pending_approvals || { loan_requests: 0, leave_requests: 0 };
  const payroll = data?.current_payroll;

  const payrollHasApprovedOrLater = (payroll?.runs || []).some((r) =>
    ['approved', 'posted', 'partially_paid', 'paid', 'completed'].includes(r.status)
  );

  return (
    <Div>
      {payroll && !payroll.has_any_run && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          No payroll run has been started yet for <strong>{payroll.period_label}</strong>.
        </Alert>
      )}
      {payroll && payroll.has_any_run && !payrollHasApprovedOrLater && (
        <Alert severity='info' sx={{ mb: 2 }}>
          Payroll for <strong>{payroll.period_label}</strong> is still in draft/awaiting approval.
        </Alert>
      )}

      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatTile
            icon={<GroupsOutlined />}
            label='Active Employees'
            value={headcount.total_employees}
            sub={
              headcount.new_hires_this_month > 0
                ? `${headcount.new_hires_this_month} new this month`
                : undefined
            }
            color='primary'
            onClick={() => goTo('employees')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatTile
            icon={<BeachAccessOutlined />}
            label='On Leave Today'
            value={onLeave.length}
            color='info'
            onClick={() => scrollToRef(leaveRef)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatTile
            icon={<RequestQuoteOutlined />}
            label='Active Loans'
            value={loans.count}
            sub={loans.count > 0 ? formatMoney(loans.total_outstanding) + ' owed' : undefined}
            color='warning'
            onClick={() => scrollToRef(loansRef)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatTile
            icon={<DescriptionOutlined />}
            label='Contracts Expiring (30d)'
            value={expiringContracts.length}
            color={expiringContracts.length > 0 ? 'error' : 'success'}
            onClick={() => scrollToRef(contractsRef)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatTile
            icon={<CakeOutlined />}
            label='Birthdays (30d)'
            value={birthdays.length}
            color='secondary'
            onClick={() => scrollToRef(birthdaysRef)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatTile
            icon={<PendingActionsOutlined />}
            label='Pending Approvals'
            value={pending.loan_requests + pending.leave_requests}
            sub={`${pending.leave_requests} leave, ${pending.loan_requests} loan`}
            color={
              pending.loan_requests + pending.leave_requests > 0
                ? 'error'
                : 'success'
            }
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }} ref={leaveRef}>
          <JumboCardQuick
            title='Employees On Leave Today'
            sx={{ height: DETAIL_CARD_HEIGHT, display: 'flex', flexDirection: 'column' }}
            wrapperSx={{ overflowY: 'auto', flex: 1 }}
          >
            {smallScreen ? (
              onLeave.length === 0 ? (
                <EmptyState text='No one is on leave today' />
              ) : (
                onLeave.map((row) => (
                  <MobileRowCard
                    key={row.employee_id}
                    onClick={() => goToEmployee(row.employee_id)}
                  >
                    <Stack
                      direction='row'
                      justifyContent='space-between'
                      alignItems='flex-start'
                    >
                      <Box minWidth={0}>
                        <Typography variant='body2' fontWeight={600} noWrap>
                          {row.employee_name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {row.employee_number}
                        </Typography>
                      </Box>
                      <Chip
                        size='small'
                        label={
                          row.returns_in_days <= 1
                            ? 'Today'
                            : `In ${row.returns_in_days}d`
                        }
                      />
                    </Stack>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                      mt={0.5}
                    >
                      {row.leave_type}
                    </Typography>
                  </MobileRowCard>
                ))
              )
            ) : (
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Leave Type</TableCell>
                    <TableCell>Returns</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {onLeave.length === 0 ? (
                    <EmptyRow colSpan={3} text='No one is on leave today' />
                  ) : (
                    onLeave.map((row) => (
                      <TableRow
                        key={row.employee_id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => goToEmployee(row.employee_id)}
                      >
                        <TableCell>
                          {row.employee_name}
                          <Typography variant='caption' color='text.secondary' display='block'>
                            {row.employee_number}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.leave_type}</TableCell>
                        <TableCell>
                          {row.returns_in_days <= 1
                            ? 'Today'
                            : `In ${row.returns_in_days} days`}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </JumboCardQuick>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }} ref={loansRef}>
          <JumboCardQuick
            title='Employees With Active Loans'
            sx={{ height: DETAIL_CARD_HEIGHT, display: 'flex', flexDirection: 'column' }}
            wrapperSx={{ overflowY: 'auto', flex: 1 }}
          >
            {smallScreen ? (
              loans.rows.length === 0 ? (
                <EmptyState text='No employees currently repaying a loan' />
              ) : (
                loans.rows.map((row) => (
                  <MobileRowCard
                    key={row.loan_id}
                    onClick={() => goToEmployee(row.employee_id)}
                  >
                    <Typography variant='body2' fontWeight={600} noWrap>
                      {row.employee_name}
                    </Typography>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                      mb={0.5}
                    >
                      {row.employee_number}
                    </Typography>
                    <Stack direction='row' justifyContent='space-between'>
                      <Typography variant='caption' color='text.secondary'>
                        Outstanding: {formatMoney(row.outstanding_balance)}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Installment: {formatMoney(row.installment_amount)}
                      </Typography>
                    </Stack>
                  </MobileRowCard>
                ))
              )
            ) : (
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell align='right'>Outstanding</TableCell>
                    <TableCell align='right'>Installment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loans.rows.length === 0 ? (
                    <EmptyRow colSpan={3} text='No employees currently repaying a loan' />
                  ) : (
                    loans.rows.map((row) => (
                      <TableRow
                        key={row.loan_id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => goToEmployee(row.employee_id)}
                      >
                        <TableCell>
                          {row.employee_name}
                          <Typography variant='caption' color='text.secondary' display='block'>
                            {row.employee_number}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          {formatMoney(row.outstanding_balance)}
                        </TableCell>
                        <TableCell align='right'>
                          {formatMoney(row.installment_amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </JumboCardQuick>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }} ref={contractsRef}>
          <JumboCardQuick
            title='Contracts Expiring Within 30 Days'
            sx={{ height: DETAIL_CARD_HEIGHT, display: 'flex', flexDirection: 'column' }}
            wrapperSx={{ overflowY: 'auto', flex: 1 }}
          >
            {smallScreen ? (
              expiringContracts.length === 0 ? (
                <EmptyState text='No contracts expiring soon' />
              ) : (
                expiringContracts.map((row) => (
                  <MobileRowCard
                    key={row.contract_id}
                    onClick={() => goToEmployee(row.employee_id)}
                  >
                    <Stack
                      direction='row'
                      justifyContent='space-between'
                      alignItems='flex-start'
                    >
                      <Box minWidth={0}>
                        <Typography variant='body2' fontWeight={600} noWrap>
                          {row.employee_name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {row.employee_number}
                        </Typography>
                      </Box>
                      <Chip
                        size='small'
                        label={
                          row.days_remaining <= 1
                            ? 'Tomorrow'
                            : `${row.days_remaining}d`
                        }
                        color={row.days_remaining <= 7 ? 'error' : 'warning'}
                      />
                    </Stack>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                      mt={0.5}
                    >
                      {row.designation || '-'} · Ends {row.end_date}
                    </Typography>
                  </MobileRowCard>
                ))
              )
            ) : (
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Ends</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expiringContracts.length === 0 ? (
                    <EmptyRow colSpan={3} text='No contracts expiring soon' />
                  ) : (
                    expiringContracts.map((row) => (
                      <TableRow
                        key={row.contract_id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => goToEmployee(row.employee_id)}
                      >
                        <TableCell>
                          {row.employee_name}
                          <Typography variant='caption' color='text.secondary' display='block'>
                            {row.employee_number}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.designation || '-'}</TableCell>
                        <TableCell>
                          <Stack direction='row' spacing={1} alignItems='center'>
                            <span>{row.end_date}</span>
                            <Chip
                              size='small'
                              label={
                                row.days_remaining <= 1
                                  ? 'Tomorrow'
                                  : `${row.days_remaining}d`
                              }
                              color={row.days_remaining <= 7 ? 'error' : 'warning'}
                            />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </JumboCardQuick>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }} ref={birthdaysRef}>
          <JumboCardQuick
            title='Upcoming Birthdays (30 Days)'
            sx={{ height: DETAIL_CARD_HEIGHT, display: 'flex', flexDirection: 'column' }}
            wrapperSx={{ overflowY: 'auto', flex: 1 }}
          >
            {smallScreen ? (
              birthdays.length === 0 ? (
                <EmptyState text='No upcoming birthdays' />
              ) : (
                birthdays.map((row) => (
                  <MobileRowCard
                    key={row.employee_id}
                    onClick={() => goToEmployee(row.employee_id)}
                  >
                    <Stack
                      direction='row'
                      justifyContent='space-between'
                      alignItems='center'
                    >
                      <Box minWidth={0}>
                        <Typography variant='body2' fontWeight={600} noWrap>
                          {row.employee_name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {row.employee_number}
                        </Typography>
                      </Box>
                      <Chip
                        size='small'
                        label={row.days_away === 0 ? 'Today' : row.next_birthday}
                      />
                    </Stack>
                  </MobileRowCard>
                ))
              )
            ) : (
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {birthdays.length === 0 ? (
                    <EmptyRow colSpan={2} text='No upcoming birthdays' />
                  ) : (
                    birthdays.map((row) => (
                      <TableRow
                        key={row.employee_id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => goToEmployee(row.employee_id)}
                      >
                        <TableCell>
                          {row.employee_name}
                          <Typography variant='caption' color='text.secondary' display='block'>
                            {row.employee_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {row.days_away === 0 ? 'Today' : row.next_birthday}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </JumboCardQuick>
        </Grid>
      </Grid>
    </Div>
  );
};

export default HrDashboard;
