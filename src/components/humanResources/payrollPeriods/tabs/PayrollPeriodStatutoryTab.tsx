'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import {
  AccountBalanceWalletOutlined,
  DownloadOutlined,
  FolderZipOutlined,
  ReceiptLongOutlined,
  SavingsOutlined,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';

interface PayrollPeriodStatutoryTabProps {
  payrollPeriodId: number;
  year: number;
  month: number;
}

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

const getErrMsg = (error: any) => getErrorMessage(error);

type SummaryColor = 'primary' | 'warning' | 'success';

const SummaryCard = ({
  icon,
  label,
  count,
  total,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
  color: SummaryColor;
}) => {
  const theme = useTheme();
  const isDark = theme.type === 'dark';
  const paletteColor = theme.palette[color].main;

  return (
    <Card
      variant='outlined'
      sx={{
        borderRadius: 2,
        bgcolor: isDark ? alpha(paletteColor, 0.08) : undefined,
      }}
    >
      <CardContent>
        <Stack direction='row' spacing={2} alignItems='center'>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(paletteColor, isDark ? 0.2 : 0.1),
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant='body2' color='text.secondary'>
              {label}
            </Typography>
            <Typography variant='h6' fontWeight={700}>
              {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {count} line{count === 1 ? '' : 's'}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

interface DownloadRow {
  key: string;
  label: string;
  count: number;
  total: number;
  section: 'paye' | 'deductions' | 'contributions';
  typeId?: number;
}

const PayrollPeriodStatutoryTab = ({
  payrollPeriodId,
  year,
  month,
}: PayrollPeriodStatutoryTabProps) => {
  const theme = useTheme();
  const isDark = theme.type === 'dark';
  const { enqueueSnackbar } = useSnackbar();
  const monthName = MONTH_NAMES[month] || month;
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payrollPeriodStatutorySchedule', String(payrollPeriodId)],
    queryFn: () => humanResourcesServices.statutorySchedule(payrollPeriodId),
  });

  const schedule = data?.data || data;

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const { mutate: downloadSection } = useMutation({
    mutationFn: ({ section, typeId }: { section: string; typeId?: number }) =>
      humanResourcesServices.statutoryScheduleExcel(payrollPeriodId, { section, typeId }),
    onSuccess: (blob: Blob, variables) => {
      triggerDownload(blob, `Statutory Schedule - ${variables.section} - ${monthName} ${year}.xlsx`);
      enqueueSnackbar('Downloaded successfully', { variant: 'success' });
    },
    onError: (error: any) => enqueueSnackbar(getErrMsg(error), { variant: 'error' }),
    onSettled: () => setDownloadingKey(null),
  });

  const { mutate: downloadAll, isPending: isDownloadingAll } = useMutation({
    mutationFn: () => humanResourcesServices.statutoryScheduleExcel(payrollPeriodId, { section: 'all' }),
    onSuccess: (blob: Blob) => {
      triggerDownload(blob, `Statutory Schedule - ${monthName} ${year}.xlsx`);
      enqueueSnackbar('Statutory schedule downloaded successfully', { variant: 'success' });
    },
    onError: (error: any) => enqueueSnackbar(getErrMsg(error), { variant: 'error' }),
  });

  const handleDownloadRow = (row: DownloadRow) => {
    setDownloadingKey(row.key);
    downloadSection({ section: row.section, typeId: row.typeId });
  };

  const totalLines =
    (schedule?.paye?.length || 0) +
    (schedule?.deductions?.length || 0) +
    (schedule?.contributions?.length || 0);

  const downloadRows: DownloadRow[] = [];
  if (schedule?.paye?.length) {
    downloadRows.push({
      key: 'paye',
      label: 'PAYE',
      count: schedule.paye.length,
      total: schedule.totals?.paye || 0,
      section: 'paye',
    });
  }
  (schedule?.deduction_schemes || []).forEach((scheme: any) => {
    downloadRows.push({
      key: `deduction-${scheme.id}`,
      label: scheme.name,
      count: scheme.count,
      total: scheme.total,
      section: 'deductions',
      typeId: scheme.id,
    });
  });
  (schedule?.contribution_schemes || []).forEach((scheme: any) => {
    downloadRows.push({
      key: `contribution-${scheme.id}`,
      label: scheme.name,
      count: scheme.count,
      total: scheme.total,
      section: 'contributions',
      typeId: scheme.id,
    });
  });

  return (
    <Box>
      <Stack spacing={3}>
        <Alert
          severity='info'
          sx={{
            borderRadius: 2,
            bgcolor: isDark ? alpha(theme.palette.info.main, 0.1) : undefined,
          }}
        >
          <Typography variant='body2' fontWeight={600} gutterBottom>
            Statutory Schedule — {monthName} {year}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Download exactly what you need — PAYE, or any single deduction/
            contribution scheme (e.g. NSSF only) — one clean sheet per
            download, ready for statutory filing.
          </Typography>
        </Alert>

        {isLoading ? (
          <Box display='flex' justifyContent='center' py={4}>
            <CircularProgress size={30} />
          </Box>
        ) : totalLines === 0 ? (
          <Alert severity='info' sx={{ borderRadius: 2 }}>
            No payslips generated for this period yet — the schedule will
            populate once payroll runs in this period have been processed.
          </Alert>
        ) : (
          <>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <SummaryCard
                  icon={<ReceiptLongOutlined />}
                  label='PAYE'
                  count={schedule?.paye?.length || 0}
                  total={schedule?.totals?.paye || 0}
                  color='primary'
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <SummaryCard
                  icon={<AccountBalanceWalletOutlined />}
                  label='Deductions'
                  count={schedule?.deductions?.length || 0}
                  total={schedule?.totals?.deductions || 0}
                  color='warning'
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <SummaryCard
                  icon={<SavingsOutlined />}
                  label='Employer Contributions'
                  count={schedule?.contributions?.length || 0}
                  total={schedule?.totals?.contributions || 0}
                  color='success'
                />
              </Grid>
            </Grid>

            <Card variant='outlined' sx={{ borderRadius: 2 }}>
              <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                flexWrap='wrap'
                rowGap={1}
                sx={{ px: 2, py: 1.5 }}
              >
                <Typography variant='subtitle1' fontWeight={600}>
                  Download individually
                </Typography>
                <Button
                  variant='outlined'
                  size='small'
                  startIcon={<FolderZipOutlined />}
                  onClick={() => downloadAll()}
                  disabled={isDownloadingAll}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  {isDownloadingAll ? 'Downloading...' : 'Download All (3 sheets)'}
                </Button>
              </Stack>
              <Divider />
              <List disablePadding>
                {downloadRows.map((row, index) => (
                  <Box key={row.key}>
                    <ListItem
                      secondaryAction={
                        <Tooltip title={`Download ${row.label}`}>
                          <span>
                            <IconButton
                              edge='end'
                              onClick={() => handleDownloadRow(row)}
                              disabled={downloadingKey === row.key}
                            >
                              {downloadingKey === row.key ? (
                                <CircularProgress size={20} />
                              ) : (
                                <DownloadOutlined />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      }
                    >
                      <ListItemIcon>
                        {row.section === 'paye' ? (
                          <ReceiptLongOutlined color='primary' />
                        ) : row.section === 'deductions' ? (
                          <AccountBalanceWalletOutlined color='warning' />
                        ) : (
                          <SavingsOutlined color='success' />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={row.label}
                        secondary={`${row.count} line${row.count === 1 ? '' : 's'} — ${row.total.toLocaleString(
                          'en-US',
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}`}
                      />
                    </ListItem>
                    {index < downloadRows.length - 1 && <Divider component='li' />}
                  </Box>
                ))}
              </List>
            </Card>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default PayrollPeriodStatutoryTab;
