'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { HighlightOff } from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import BankFileDownloadMenu from '../../bankFile/BankFileDownloadMenu';
import { SalarySheetType } from '../salarySheetType';
import BankTransferListDialogPDF from './BankTransferListDialogPDF';

interface BankTransferListDialogProps {
  bankTransfer: SalarySheetType;
  open: boolean;
  setOpen: (val: boolean) => void;
}

const BankTransferListDialog = ({
  bankTransfer,
  open = false,
  setOpen,
}: BankTransferListDialogProps) => {
  const theme = useTheme();
  const { theme: jumboTheme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(jumboTheme.breakpoints.down('lg'));
  const authObject = useJumboAuth() as any;
  const organization = authObject?.authOrganization?.organization;

  const mainColor = organization.settings?.main_color || '#2113AD';
  const headerColor =
    theme.type === 'dark'
      ? '#29f096'
      : organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const [showOnScreen, setShowOnScreen] = useState(true);
  const [pdfKey, setPdfKey] = useState(0);

  const payrollRun = bankTransfer.run;
  const monthNames = [
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
  const monthNo = bankTransfer.run.period.month;
  const year = bankTransfer.run.period.year;
  const monthName = monthNames[monthNo - 1];
  const payrollPeriod = `${year} - ${monthName}`;

  const costCenter = bankTransfer.run.cost_center;
  const rows = bankTransfer.rows;

  const handleDownloadBankFile = async (format: string) => {
    const blob = await humanResourcesServices.salaryBankFile(
      bankTransfer.run.id,
      format
    );
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Salary Bank File - ${format}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth={'lg'}
      fullWidth
      fullScreen={belowLargeScreen}
    >
      <DialogTitle>
        <PreviewTopBar
          fileExportGrid={
            <FileExportGrid
              startComponent={
                <BankFileDownloadMenu onDownload={handleDownloadBankFile} />
              }
              exportPdf
              handlePdf={() => {
                setShowOnScreen((prev) => !prev);
              }}
            />
          }
          closeButton={
            <IconButton
              size='small'
              color='primary'
              onClick={() => setOpen(false)}
            >
              <HighlightOff color='primary' />
            </IconButton>
          }
        />
      </DialogTitle>
      {showOnScreen ? (
        <>
          <DialogContent>
            <Grid container>
              <Grid size={12} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  <Typography variant='h4' sx={{ color: headerColor }}>
                    Bank Transfer List
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Grid container rowSpacing={2}>
              {costCenter && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box>
                    <Typography variant='subtitle2' sx={{ color: headerColor }}>
                      Cost Center
                    </Typography>
                    <Typography variant='body1'>
                      {costCenter?.name ?? '-'}
                    </Typography>
                  </Box>
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 4 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ color: headerColor }}>
                    Payroll Period
                  </Typography>
                  <Typography variant='body1'>{payrollPeriod}</Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ color: headerColor }}>
                    Payroll Status
                  </Typography>
                  <Typography variant='body1'>{payrollRun.status}</Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ color: headerColor }}>
                    Employees without bank accounts
                  </Typography>
                  <Typography variant='body1'>
                    {bankTransfer.employees_without_bank_account}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ color: headerColor }}>
                    Total EMployess
                  </Typography>
                  <Typography variant='body1'>
                    {bankTransfer.total_employees}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ color: headerColor }}>
                    Net Salary
                  </Typography>
                  <Typography variant='body1'>
                    {bankTransfer.total_net_salary.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box>
              <Box sx={{ p: 2 }}>
                {/* ===== MAIN TABLE ===== */}
                <Grid container mt={4}>
                  <Grid size={12}>
                    <TableContainer
                      component={Paper}
                      sx={{
                        boxShadow: theme.shadows[2],
                        '& .MuiTableRow-root:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <Table>
                        <>
                          <TableHead>
                            <TableRow>
                              <TableCell
                                colSpan={1}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                              >
                                S/N
                              </TableCell>
                              <TableCell
                                colSpan={3}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                              >
                                Employee No.
                              </TableCell>
                              <TableCell
                                colSpan={3}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                              >
                                Employee Name
                              </TableCell>
                              <TableCell
                                colSpan={1}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                                align='left'
                              >
                                Bank Name
                              </TableCell>
                              <TableCell
                                colSpan={1}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                                align='left'
                              >
                                Branch
                              </TableCell>
                              <TableCell
                                colSpan={1}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                                align='left'
                              >
                                Bank Code
                              </TableCell>
                              <TableCell
                                colSpan={1}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                                align='left'
                              >
                                Account Number
                              </TableCell>
                              <TableCell
                                colSpan={1}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                                align='left'
                              >
                                Account Name
                              </TableCell>
                              <TableCell
                                colSpan={1}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                                align='right'
                              >
                                Net Pay
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rows?.map((row, index: number) => {
                              return (
                                <TableRow
                                  key={index}
                                  sx={{
                                    backgroundColor:
                                      theme.palette.background.paper,
                                    '&:nth-of-type(even)': {
                                      backgroundColor:
                                        theme.palette.action.hover,
                                    },
                                  }}
                                >
                                  <TableCell colSpan={1}>{index + 1}</TableCell>
                                  <TableCell colSpan={3}>
                                    {row.employee_number ?? '-'}
                                  </TableCell>
                                  <TableCell colSpan={3}>
                                    {row.name ?? '-'}
                                  </TableCell>
                                  <TableCell colSpan={1} align='left'>
                                    {row.bank_name ?? '-'}
                                  </TableCell>
                                  <TableCell colSpan={1} align='left'>
                                    {row.branch ?? '-'}
                                  </TableCell>
                                  <TableCell colSpan={1} align='left'>
                                    {row.bank_code ?? '-'}
                                  </TableCell>
                                  <TableCell colSpan={1} align='left'>
                                    {row.account_number ?? '-'}
                                  </TableCell>
                                  <TableCell colSpan={1} align='left'>
                                    {row.account_name ?? '-'}
                                  </TableCell>
                                  <TableCell colSpan={1} align='right'>
                                    {row.net_salary.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }) ?? 0}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </DialogContent>
        </>
      ) : (
        <DialogContent>
          <PDFContent
            key={`salary-sheet-${pdfKey}`}
            fileName={`Salary-sheet`}
            document={
              <BankTransferListDialogPDF
                organization={organization}
                bankTransfer={bankTransfer}
              />
            }
          />
        </DialogContent>
      )}
    </Dialog>
  );
};

export default BankTransferListDialog;
