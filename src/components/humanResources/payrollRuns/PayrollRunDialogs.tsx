// components/humanResources/payrollRuns/PayrollRunDialogs.tsx
'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';
import { Organization } from '@/types/auth-types';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { HighlightOff } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Suspense, useState } from 'react';
import { formatMoney, formatPayslipPeriod, getEmployeeName } from './payrollUtils';
import PayslipPDF from './PayslipPDF';

interface SimulationDialogProps {
  open: boolean;
  onClose: () => void;
  data: any;
}

export const SimulationDialog = ({
  open,
  onClose,
  data,
}: SimulationDialogProps) => {
  const { theme } = useJumboTheme();
  const belowMediumScreen = useMediaQuery(theme.breakpoints.down('md'));
  const simulationRow = data?.row || data?.data?.row || data;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={belowMediumScreen}
      maxWidth='md'
    >
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Typography variant='h5' component='div'>
          Employee Simulation
        </Typography>
        <Typography variant='body2' color='text.secondary' component='div'>
          {simulationRow?.employee?.name || 'Employee'} - Simulated Payslip
        </Typography>
      </DialogTitle>
      <DialogContent>
        {simulationRow ? (
          <Grid container spacing={2}>
            <Grid size={12}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Basic Salary
                  </Typography>
                  <Typography variant='h6'>
                    {formatMoney(simulationRow.basic_salary)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Gross Salary
                  </Typography>
                  <Typography variant='h6'>
                    {formatMoney(simulationRow.gross_salary)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography variant='caption' color='text.secondary'>
                    PAYE
                  </Typography>
                  <Typography variant='h6' color='error.main'>
                    {formatMoney(simulationRow.paye || 0)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Total Allowances
                  </Typography>
                  <Typography variant='h6'>
                    {formatMoney(simulationRow.total_allowances || 0)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Total Deductions
                  </Typography>
                  <Typography variant='h6'>
                    {formatMoney(simulationRow.total_deductions || 0)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Total Employer Contributions
                  </Typography>
                  <Typography variant='h6'>
                    {formatMoney(
                      simulationRow.employer_contributions.reduce(
                        (acc: number, curr: any) => acc + curr.amount,
                        0
                      ) || 0
                    )}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Net Pay
                  </Typography>
                  <Typography variant='h6' color='success.main'>
                    {formatMoney(simulationRow.net_salary)}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            {simulationRow.allowances?.length > 0 && (
              <Grid size={12}>
                <Typography
                  variant='subtitle2'
                  gutterBottom
                  textAlign={'center'}
                >
                  Allowances
                </Typography>
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Label</TableCell>
                        <TableCell align='right'>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {simulationRow.allowances.map(
                        (item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.label}</TableCell>
                            <TableCell align='right'>
                              {formatMoney(item.amount)}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
            {simulationRow.deductions?.length > 0 && (
              <Grid size={12}>
                <Typography
                  variant='subtitle2'
                  gutterBottom
                  textAlign={'center'}
                >
                  Deductions
                </Typography>
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Label</TableCell>
                        <TableCell align='right'>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {simulationRow.deductions.map(
                        (item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.label}</TableCell>
                            <TableCell align='right'>
                              {formatMoney(item.amount)}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
            {simulationRow.employer_contributions?.length > 0 && (
              <Grid size={12}>
                <Typography
                  variant='subtitle2'
                  gutterBottom
                  textAlign={'center'}
                >
                  Employer Contributions
                </Typography>
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Label</TableCell>
                        <TableCell align='right'>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {simulationRow.employer_contributions.map(
                        (item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.label}</TableCell>
                            <TableCell align='right'>
                              {formatMoney(item.amount)}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
          </Grid>
        ) : (
          <Alert severity='warning'>No simulation data available</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

interface PayslipViewDialogProps {
  open: boolean;
  onClose: () => void;
  payslip: any;
}

export const PayslipViewDialog = ({
  open,
  onClose,
  payslip,
}: PayslipViewDialogProps) => {
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { theme } = useJumboTheme();
  const belowMediumScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [showOnScreen, setShowOnScreen] = useState(true);
  const [thermalPrinter, setThermalPrinter] = useState(false);
  const [pdfKey, setPdfKey] = useState(0); // Force remount when changing format

  const handleThermalToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThermalPrinter(e.target.checked);
    setPdfKey((prev) => prev + 1); // Force PDF remount when changing format
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={belowMediumScreen}
      maxWidth='md'
    >
      <DialogTitle sx={{ textAlign: 'center' }}>
        <PreviewTopBar
          fileExportGrid={
            <FileExportGrid
              exportPdf
              handlePdf={() => {
                setShowOnScreen((prev) => !prev);
              }}
            />
          }
          closeButton={
            <IconButton size='small' color='primary' onClick={onClose}>
              <HighlightOff color='primary' />
            </IconButton>
          }
        />
      </DialogTitle>
      {showOnScreen ? (
        <>
          <DialogTitle sx={{ textAlign: 'center' }}>
            <Typography variant='h5' component='div'>
              Payslip Details
            </Typography>
            <Typography variant='body2' color='text.secondary' component='div'>
              {payslip
                ? getEmployeeName(payslip.employee || payslip)
                : 'Employee'}
            </Typography>
            {payslip && (
              <Typography variant='caption' color='text.secondary' component='div'>
                {formatPayslipPeriod(payslip)}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            {payslip ? (
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Employee
                      </Typography>
                      <Typography variant='body2'>
                        {getEmployeeName(payslip.employee || payslip)}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Employee Number
                      </Typography>
                      <Typography variant='body2'>
                        {payslip.employee?.employee_number ||
                          payslip.employee_number ||
                          'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Basic Salary
                      </Typography>
                      <Typography variant='h6'>
                        {formatMoney(payslip.basic_salary || 0)}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Gross Salary
                      </Typography>
                      <Typography variant='h6'>
                        {formatMoney(payslip.gross_salary || 0)}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Total Allowances
                      </Typography>
                      <Typography variant='h6'>
                        {formatMoney(payslip.total_allowances || 0)}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Total Deductions
                      </Typography>
                      <Typography variant='h6'>
                        {formatMoney(payslip.total_deductions || 0)}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        PAYE
                      </Typography>
                      <Typography variant='h6' color='error.main'>
                        {formatMoney(payslip.paye || 0)}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Net Pay
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        {formatMoney(payslip.net_salary || 0)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
                {payslip.allowances?.length > 0 && (
                  <Grid size={12}>
                    <Typography
                      variant='subtitle2'
                      gutterBottom
                      textAlign={'center'}
                    >
                      Allowances
                    </Typography>
                    <TableContainer component={Paper} variant='outlined'>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Label</TableCell>
                            <TableCell align='right'>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {payslip.allowances.map((item: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{item.label}</TableCell>
                              <TableCell align='right'>
                                {formatMoney(item.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
                {payslip.deductions?.length > 0 && (
                  <Grid size={12}>
                    <Typography
                      variant='subtitle2'
                      gutterBottom
                      textAlign={'center'}
                    >
                      Deductions
                    </Typography>
                    <TableContainer component={Paper} variant='outlined'>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Label</TableCell>
                            <TableCell align='right'>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {payslip.deductions.map((item: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{item.label}</TableCell>
                              <TableCell align='right'>
                                {formatMoney(item.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
                {payslip.employer_contributions?.length > 0 && (
                  <Grid size={12}>
                    <Typography
                      variant='subtitle2'
                      gutterBottom
                      textAlign={'center'}
                    >
                      Employer Contributions
                    </Typography>
                    <TableContainer component={Paper} variant='outlined'>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Label</TableCell>
                            <TableCell align='right'>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {payslip.employer_contributions.map(
                            (item: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell>{item.label}</TableCell>
                                <TableCell align='right'>
                                  {formatMoney(item.amount)}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Alert severity='warning'>No payslip data available</Alert>
            )}
          </DialogContent>
        </>
      ) : (
        <DialogContent>
          <Box sx={{ minHeight: '300px' }}>
            <Box
              display='flex'
              justifyContent='flex-end'
              alignItems='center'
              mb={2}
            >
              <Typography variant='body2'>A4</Typography>
              <Switch
                checked={thermalPrinter}
                onChange={handleThermalToggle}
                color='primary'
                sx={{ mx: 1 }}
              />
              <Typography variant='body2'>80mm</Typography>
            </Box>

            <Suspense fallback={<BackdropSpinner />}>
              <PDFContent
                key={`pdf-${pdfKey}`}
                fileName={`${'payslip'}_${thermalPrinter ? '80mm' : 'A4'}`}
                document={
                  <PayslipPDF
                    thermalPrinter={thermalPrinter}
                    organization={
                      organization ? (organization as Organization) : null
                    }
                    payslip={payslip}
                  />
                }
              />
            </Suspense>
          </Box>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
