import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  Box,
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  Paper as TablePaper,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import LedgerStatementDialogContent from '../../ledgers/list/ledgerStatement/LedgerStatementDialogContent';

const BUCKET_COLUMNS = [
  { key: 'current', label: 'Current (0-30)' },
  { key: 'days_31_60', label: '31-60' },
  { key: 'days_61_90', label: '61-90' },
  { key: 'days_91_120', label: '91-120' },
  { key: 'over_120', label: '120+' },
];

const formatMoney = (value) =>
  (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const ApArAgingOnScreen = ({ reportData, authOrganization }) => {
  const theme = useTheme();
  const { theme: jumboTheme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(jumboTheme.breakpoints.down('lg'));
  const mainColor =
    authOrganization?.organization.settings?.main_color || '#2113AD';
  const contrastText =
    authOrganization?.organization.settings?.contrast_text || '#FFFFFF';

  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
  const [ledgerFilters, setLedgerFilters] = useState(null);

  const handleViewLedger = (row) => {
    const costCenters = reportData.filters?.cost_centers || [];
    setLedgerFilters({
      from: authOrganization?.organization?.recording_start_date,
      to: reportData.as_at,
      cost_center_ids: costCenters.length ? costCenters.map((cc) => cc.id) : 'all',
      ledger_id: row.ledger_id,
      ledgerName: row.name,
      increasesWith: reportData.filters?.type === 'receivable' ? 'DR' : 'CR',
    });
    setLedgerDialogOpen(true);
  };

  if (!reportData) return null;

  return (
    <Box sx={{ marginTop: 3 }}>
      <Typography variant='caption' color='text.secondary' sx={{ mb: 1, display: 'block' }}>
        Aged from each transaction&apos;s date assuming a flat 30-day term — this
        organization doesn&apos;t track a due date on every document type that can
        post to these ledgers.
      </Typography>
      <TableContainer component={TablePaper}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
                S/N
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
                Name
              </TableCell>
              {BUCKET_COLUMNS.map((col) => (
                <TableCell
                  key={col.key}
                  align='right'
                  sx={{ backgroundColor: mainColor, color: contrastText }}
                >
                  {col.label}
                </TableCell>
              ))}
              <TableCell align='right' sx={{ backgroundColor: mainColor, color: contrastText }}>
                Total
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.rows.map((row, index) => (
              <TableRow
                key={row.ledger_id}
                sx={{
                  backgroundColor:
                    index % 2 === 0
                      ? theme.palette.background.paper
                      : theme.palette.action.hover,
                }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Tooltip title='Click to view statement' placement='top' arrow>
                    <Typography
                      component='span'
                      variant='body2'
                      color='primary.main'
                      sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                      onClick={() => handleViewLedger(row)}
                    >
                      {row.name}
                    </Typography>
                  </Tooltip>
                </TableCell>
                {BUCKET_COLUMNS.map((col) => (
                  <TableCell key={col.key} align='right'>
                    {formatMoney(row.buckets[col.key])}
                  </TableCell>
                ))}
                <TableCell align='right'>
                  <strong>{formatMoney(row.total)}</strong>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell
                colSpan={2}
                sx={{ backgroundColor: mainColor, color: contrastText }}
              >
                Total
              </TableCell>
              {BUCKET_COLUMNS.map((col) => (
                <TableCell
                  key={col.key}
                  align='right'
                  sx={{ backgroundColor: mainColor, color: contrastText }}
                >
                  {formatMoney(reportData.totals[col.key])}
                </TableCell>
              ))}
              <TableCell align='right' sx={{ backgroundColor: mainColor, color: contrastText }}>
                {formatMoney(reportData.grand_total)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {ledgerDialogOpen && (
        <Dialog
          open={ledgerDialogOpen}
          onClose={() => setLedgerDialogOpen(false)}
          maxWidth='md'
          fullWidth
          fullScreen={belowLargeScreen}
        >
          <LedgerStatementDialogContent
            commingFilters={ledgerFilters}
            setOpen={setLedgerDialogOpen}
          />
        </Dialog>
      )}
    </Box>
  );
};

export default ApArAgingOnScreen;
