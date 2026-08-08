'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { HighlightOff } from '@mui/icons-material';
import {
  Box,
  Chip,
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
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import { AdvanceSheetType } from './AdvanceSheetType';
import AdvanceTransferListDialogPDF from './AdvanceTransferListDialogPDF';

interface AdvanceTransferListDialogProps {
  advanceSheet: AdvanceSheetType;
  payrollPeriodId: number;
  open: boolean;
  setOpen: (val: boolean) => void;
}

const MONTH_NAMES = [
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

const AdvanceTransferListDialog = ({
  advanceSheet,
  payrollPeriodId,
  open = false,
  setOpen,
}: AdvanceTransferListDialogProps) => {
  const { enqueueSnackbar } = useSnackbar();
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
  const [isExporting, setIsExporting] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);

  const monthNo = advanceSheet.period.month;
  const year = advanceSheet.period.year;
  const monthName = MONTH_NAMES[monthNo - 1];
  const payrollPeriod = `${year} - ${monthName}`;
  const rows = advanceSheet.rows;

  const handlExcelExport = async () => {
    setIsExporting(true);
    try {
      const response =
        await humanResourcesServices.advanceTransferSheetExcel(
          payrollPeriodId
        );

      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Advance Transfer Sheet-${payrollPeriod}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setIsExporting(false);
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
      setIsExporting(false);
    }
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
              exportExcel
              handlExcelExport={() => handlExcelExport()}
              exportingExcel={isExporting}
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
                  Advance Payment Transfer Sheet
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Grid container rowSpacing={2}>
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
                  Employees without bank accounts
                </Typography>
                <Typography variant='body1'>
                  {advanceSheet.employees_without_bank_account}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box>
                <Typography variant='subtitle2' sx={{ color: headerColor }}>
                  Total Employees
                </Typography>
                <Typography variant='body1'>
                  {advanceSheet.total_employees}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box>
                <Typography variant='subtitle2' sx={{ color: headerColor }}>
                  Total Advance Amount
                </Typography>
                <Typography variant='body1'>
                  {advanceSheet.total_amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box>
            <Box sx={{ p: 2 }}>
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
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              backgroundColor: mainColor,
                              color: contrastText,
                              textWrap: 'nowrap',
                            }}
                          >
                            S/N
                          </TableCell>
                          <TableCell
                            sx={{
                              backgroundColor: mainColor,
                              color: contrastText,
                              textWrap: 'nowrap',
                            }}
                          >
                            Employee No.
                          </TableCell>
                          <TableCell
                            sx={{
                              backgroundColor: mainColor,
                              color: contrastText,
                              textWrap: 'nowrap',
                            }}
                          >
                            Employee Name
                          </TableCell>
                          <TableCell
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
                            sx={{
                              backgroundColor: mainColor,
                              color: contrastText,
                              textWrap: 'nowrap',
                            }}
                            align='right'
                          >
                            Advance Amount
                          </TableCell>
                          <TableCell
                            sx={{
                              backgroundColor: mainColor,
                              color: contrastText,
                              textWrap: 'nowrap',
                            }}
                            align='center'
                          >
                            Status
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows?.map((row, index: number) => (
                          <TableRow
                            key={index}
                            sx={{
                              backgroundColor: theme.palette.background.paper,
                              '&:nth-of-type(even)': {
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{row.employee_number ?? '-'}</TableCell>
                            <TableCell>{row.name ?? '-'}</TableCell>
                            <TableCell align='left'>
                              {row.bank_name ?? '-'}
                            </TableCell>
                            <TableCell align='left'>
                              {row.branch ?? '-'}
                            </TableCell>
                            <TableCell align='left'>
                              {row.bank_code ?? '-'}
                            </TableCell>
                            <TableCell align='left'>
                              {row.account_number ?? '-'}
                            </TableCell>
                            <TableCell align='left'>
                              {row.account_name ?? '-'}
                            </TableCell>
                            <TableCell align='right'>
                              {row.amount.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell align='center'>
                              <Chip
                                label={row.paid ? 'Paid' : 'Unpaid'}
                                size='small'
                                color={row.paid ? 'success' : 'default'}
                                variant='outlined'
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
      ) : (
        <DialogContent>
          <PDFContent
            key={`advance-transfer-sheet-${pdfKey}`}
            fileName={`Advance-Transfer-Sheet`}
            document={
              <AdvanceTransferListDialogPDF
                organization={organization}
                advanceSheet={advanceSheet}
              />
            }
          />
        </DialogContent>
      )}
    </Dialog>
  );
};

export default AdvanceTransferListDialog;
