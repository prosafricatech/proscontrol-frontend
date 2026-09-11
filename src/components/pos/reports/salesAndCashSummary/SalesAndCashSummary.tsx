'use client'
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
  Divider,
  Skeleton
} from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import dayjs, { Dayjs } from 'dayjs';
import { LoadingButton } from '@mui/lab';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import pdfStyles from '../../../pdf/pdf-styles';
import PdfLogo from '../../../pdf/PdfLogo';
import PDFContent from '../../../pdf/PDFContent';
import financialReportsServices from '../../../accounts/reports/financial-reports-services';
import SalesAndCashSummaryOnScreen from './SalesAndCashSummaryOnScreen';
import { HighlightOff } from '@mui/icons-material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { Organization, User } from '@/types/auth-types';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';

interface ReportData {
  revenue: number;
  collection_distribution: {
    name: string;
    amount: number;
  }[];
  credit_sales: {
    name: string;
    amount: number;
  }[];
  payments_received: {
    name: string;
    amount: number;
  }[];
  credit_sales_summary: {
    name: string;
    debit_amount: number;
    credit_amount: number;
    balance: number;
  }[];
  payments: {
    paid: string;
    from: string;
    amount: number;
  }[];
  non_collectible_fuel_vouchers: {
    name: string;
    amount: number;
  }[];
}

interface AuthOrganization {
  organization: Organization;
  costCenters: CostCenter[];
}

interface ReportDocumentProps {
  reportData: ReportData;
  authOrganization: AuthOrganization;
  user: User;
  from: string;
  to: string;
  costCenters: CostCenter[];
  separateCreditSales?: boolean;
}

const ReportDocument: React.FC<ReportDocumentProps> = ({ reportData, authOrganization, user, from, to, costCenters, separateCreditSales = false }) => {
  const reportPeriod = `${readableDate(from, true)} to ${readableDate(to, true)}`;
  const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
  const lightColor = authOrganization.organization.settings?.light_color || "#bec5da";
  const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";

  // Calculate total for Payments Collected table
  const totalCollectedAmount = reportData.collection_distribution.reduce((acc, cd) => acc + (cd.amount || 0), 0);

  // Calculate totals for Credit Sales and Payments Received tables
  const totalCreditSalesAmount = reportData.credit_sales.reduce((acc, creditSale) => acc + (creditSale.amount || 0), 0);
  const totalPaymentsReceivedAmount = (reportData.payments_received || []).reduce((acc, paymentReceived) => acc + (paymentReceived.amount || 0), 0);

  // Calculate totals for the combined Credits and Received Payments table
  const creditSalesSummary = reportData.credit_sales_summary || [];
  const totalCreditSalesSummaryDebit = creditSalesSummary.reduce((acc, item) => acc + (item.debit_amount || 0), 0);
  const totalCreditSalesSummaryCredit = creditSalesSummary.reduce((acc, item) => acc + (item.credit_amount || 0), 0);
  const totalCreditSalesSummaryBalance = creditSalesSummary.reduce((acc, item) => acc + (item.balance || 0), 0);

  // Calculate total for Payments table
  const totalPaymentsAmount = reportData.payments.reduce((acc, payment) => acc + (payment.amount || 0), 0);

  // Calculate total for Fuel Vouchers to Internal/Non-Collectible Ledgers table
  const totalNonCollectibleAmount = (reportData.non_collectible_fuel_vouchers || []).reduce((acc, item) => acc + (item.amount || 0), 0);

  return reportData ? (
    <Document
      creator={` ${user.name} | Powered By ProsERP`}
      producer="ProsERP"
      title={`Sales And Cash Summary ${reportPeriod}`}
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>{`Sales And Cash Summary`}</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{reportPeriod}</Text>
            </View>
          </View>
        </View>
        <View style={{ ...pdfStyles.tableRow, marginTop: 10 }}>
          {
            costCenters?.length > 0 &&
            <View style={{ flex: 1, padding: 2}}>
              <Text style={{...pdfStyles.minInfo, color: mainColor }}>Cost Centers</Text>
              <Text style={{...pdfStyles.minInfo }}>{costCenters.map((cc) => cc.name).join(', ')}</Text>
            </View>
          }
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed By</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{user.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed On</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{readableDate(undefined, true)}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginTop: 10, justifyContent: 'flex-end' }}>
          <View style={{ width: '50%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 2 }}>
              <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>Sales:</Text>
              <Text style={{ ...pdfStyles.midInfo }}>{reportData.revenue.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
            </View>

            {/* Payments Collected Table */}
            {reportData.collection_distribution.length > 0 &&
              <View style={{ ...pdfStyles.table, minHeight: 50 }}>
                <View style={{ ...pdfStyles.tableRow }}>
                  <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, flex : 1, color: contrastText, textAlign: 'center' }}>Payments Collected</Text>
                </View>
                {
                  reportData.collection_distribution.map((cd, index) => (
                    <View key={index} style={{ ...pdfStyles.tableRow, flexDirection: 'row' }}>
                      <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.7 }}>{cd.name}</Text>
                      <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.3, textAlign: 'right' }}>{cd.amount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                    </View>
                  ))
                }
                {/* Totals Row for Payments Collected */}
                <View style={{ ...pdfStyles.tableRow, flexDirection: 'row' }}>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex : 0.7 }}>Total</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex : 0.3, textAlign: 'right' }}>{totalCollectedAmount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                </View>
              </View>
            }
          </View>
        </View>

        {separateCreditSales ? (
          <>
            {/* Credit Sales Table */}
            {reportData.credit_sales.length > 0 &&
              <View style={{...pdfStyles.table, minHeight: 50 }}>
                <View style={{ ...pdfStyles.tableRow, marginTop: 10}}>
                  <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'center' }}>Credit Sales</Text>
                </View>
                {
                  reportData.credit_sales.map((creditSale, index) => (
                    <View key={index} style={{ ...pdfStyles.tableRow, flexDirection: 'row' }}>
                      <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.7 }}>{creditSale.name}</Text>
                      <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.3, textAlign: 'right' }}>{creditSale.amount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                    </View>
                  ))
                }
                {/* Totals Row */}
                <View style={{ ...pdfStyles.tableRow, flexDirection: 'row' }}>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.7 }}>Total</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.3, textAlign: 'right' }}>{totalCreditSalesAmount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                </View>
              </View>
            }

            {/* Payments Received Table */}
            {(reportData.payments_received?.length ?? 0) > 0 &&
              <View style={{...pdfStyles.table, minHeight: 50 }}>
                <View style={{ ...pdfStyles.tableRow, marginTop: 10}}>
                  <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'center' }}>Payments Received</Text>
                </View>
                {
                  reportData.payments_received.map((paymentReceived, index) => (
                    <View key={index} style={{ ...pdfStyles.tableRow, flexDirection: 'row' }}>
                      <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.7 }}>{paymentReceived.name}</Text>
                      <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.3, textAlign: 'right' }}>{paymentReceived.amount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                    </View>
                  ))
                }
                {/* Totals Row */}
                <View style={{ ...pdfStyles.tableRow, flexDirection: 'row' }}>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.7 }}>Total</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.3, textAlign: 'right' }}>{totalPaymentsReceivedAmount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                </View>
              </View>
            }
          </>
        ) : (
          /* Credits and Received Payments Table (combined — default) */
          creditSalesSummary.length > 0 &&
            <View style={{...pdfStyles.table, minHeight: 70 }}>
              <View style={{ ...pdfStyles.tableRow, marginTop: 10}}>
                <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'center' }}>Credits and Received Payments</Text>
              </View>
              <View style={pdfStyles.tableRow}>
                <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.1 }}>S/N</Text>
                <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.3 }}>Client</Text>
                <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.2, textAlign: 'right' }}>Purchase</Text>
                <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.2, textAlign: 'right' }}>Payment</Text>
                <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.2, textAlign: 'right' }}>Balance</Text>
              </View>
              {
                creditSalesSummary.map((item, index) => (
                  <View key={index} style={pdfStyles.tableRow}>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.1 }}>{index + 1}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.3 }}>{item.name}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.2, textAlign: 'right' }}>{item.debit_amount ? item.debit_amount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2}) : '-'}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.2, textAlign: 'right' }}>{item.credit_amount ? item.credit_amount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2}) : '-'}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.2, textAlign: 'right' }}>{item.balance.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                  </View>
                ))
              }
              {/* Totals Row */}
              <View style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.41, textAlign: 'center' }}>Total</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.2, textAlign: 'right' }}>{totalCreditSalesSummaryDebit?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.2, textAlign: 'right' }}>{totalCreditSalesSummaryCredit?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.2, textAlign: 'right' }}>{totalCreditSalesSummaryBalance.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
        )}

        {/* Fuel Vouchers to Internal/Non-Collectible Ledgers Table */}
        {(reportData.non_collectible_fuel_vouchers?.length ?? 0) > 0 &&
          <View style={{ ...pdfStyles.table, minHeight: 50 }}>
            <View style={{ ...pdfStyles.tableRow, marginTop: 10 }}>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'center' }}>Fuel Vouchers to Internal/Non-Collectible Ledgers</Text>
            </View>
            {
              reportData.non_collectible_fuel_vouchers.map((item, index) => (
                <View key={index} style={{ ...pdfStyles.tableRow, flexDirection: 'row' }}>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.7 }}>{item.name}</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.3, textAlign: 'right' }}>{item.amount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                </View>
              ))
            }
            {/* Totals Row for Fuel Vouchers to Internal/Non-Collectible Ledgers */}
            <View style={{ ...pdfStyles.tableRow, flexDirection: 'row' }}>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.7 }}>Total</Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.3, textAlign: 'right' }}>{totalNonCollectibleAmount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
            </View>
          </View>
        }

        {/* Totals Row for Credits and Received Payments */}
        { reportData.payments.length > 0 &&
          <View style={{...pdfStyles.table, minHeight: 70 }}>
            <View style={{ ...pdfStyles.tableRow, marginTop: 30}}>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'center' }}>Payments</Text>
            </View>
            <View style={pdfStyles.tableRow}>
              <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText,  flex : 0.1 }}>S/N</Text>
              <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.4 }}>Name</Text>
              <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.25}}>Paid From</Text>
              <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.25, textAlign: 'right' }}>Amount</Text>
            </View>
            {
              reportData.payments.map((payment, index) => (
                <View key={index} style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.1 }}>{index + 1}</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.4 }}>{payment.paid}</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.25 }}>{payment.from}</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.25, textAlign: 'right' }}>{payment.amount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                </View>
              ))
            }
            {/* Totals Row for Payments */}
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.77, textAlign: 'center' }}>Total</Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.25, textAlign: 'right' }}>{totalPaymentsAmount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
            </View>
          </View>
        }
      </Page>
    </Document>
  ) : null;
};

interface SalesAndCashSummaryProps {
  setOpenSalesAndCashSummary: (open: boolean) => void;
}

interface FormValues {
  from: string;
  to: string;
  cost_centers: CostCenter[];
  cost_center_ids: string[];
}

const SalesAndCashSummary: React.FC<SalesAndCashSummaryProps> = ({ setOpenSalesAndCashSummary }) => {
  document.title = 'Sales And Cash Summary';
  const css = useProsERPStyles();
  const { authOrganization, authUser } = useJumboAuth()
  const user = authUser?.user;
  const [isFetching, setIsFetching] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showOnScreen, setShowOnScreen] = useState(true);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  // Most orgs want the debtor's Purchase/Payment/Balance in one table; only some want
  // Credit Sales and Payments Received broken out separately.
  const [separateCreditSales, setSeparateCreditSales] = useState(false);

  // Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const validationSchema = yup.object({
    from: yup.string().required('From date is required').typeError('From date is required'),
    to: yup.string().required('To date is required').typeError('To date is required'),
  });

  const { setValue, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      from: dayjs().startOf('day').toISOString(),
      to: dayjs().endOf('day').toISOString(),
      cost_centers: authOrganization?.costCenters || [],
      cost_center_ids: authOrganization?.costCenters.map((cost_center: CostCenter) => cost_center.id) || [],
    },
  });

  const retrieveReport = async (filters: { from?: string; to?: string; cost_center_ids?: string[] }) => {
    setIsFetching(true);
    try {
      const report = await financialReportsServices.fetchSalesAndCashSummary(filters);
      setReportData(report);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const downloadExcel = async () => {
    setIsDownloadingExcel(true);
    try {
      const filters = {
        from: watch('from'),
        to: watch('to'),
        cost_center_ids: watch('cost_center_ids'),
        separate_credit_sales: separateCreditSales,
      };
      const responseData = await financialReportsServices.downloadExcelSalesAndCashSummary(filters);

      const blob = new Blob([responseData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Sales And Cash Summary From ${readableDate(filters.from, true)} To ${readableDate(filters.to, true)}.xlsx`;
      link.click();
    } catch (error) {
      console.error('Error downloading Excel:', error);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  return (
    <>
      <DialogTitle textAlign={'center'}>
        <Grid container>
          <Grid size={belowLargeScreen ? 11 : 12}>
            <Typography variant="h3">Sales And Cash Summary</Typography>
          </Grid>
          {belowLargeScreen && (
            <Grid size={1}>
              <Tooltip title="Close">
                <IconButton 
                  sx={{ mb: 1 }} 
                  size='small' 
                  onClick={() => setOpenSalesAndCashSummary(false)} 
                >
                  <HighlightOff color="primary" />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
        </Grid>
        <div className={css.hiddenOnPrint}>
          <form autoComplete="off" onSubmit={handleSubmit(retrieveReport)}>
            <Grid container columnSpacing={1} rowSpacing={1} alignItems="center" justifyContent="center">
              <Grid size={{xs: 12, md: 4, lg: 5}}>
                <CostCenterSelector
                  label="Cost Center(s)"
                  multiple={true}
                  allowSameType={true}
                  onChange={(cost_centers: CostCenter | CostCenter[] | null) => {
                    const selectedCostCenters = cost_centers || authOrganization?.costCenters || [];
                    const selectedCostCenterIds = selectedCostCenters.map((cost_center: CostCenter) => cost_center.id);

                    setValue('cost_centers', selectedCostCenters);
                    setValue('cost_center_ids', selectedCostCenterIds);

                    // Retrieve report immediately after updating the cost centers
                    retrieveReport({
                      from: watch('from'),
                      to: watch('to'),
                      cost_center_ids: selectedCostCenterIds,
                    });
                  }}
                />
              </Grid>
              <Grid size={{xs: 12, md: 4, lg: 3.5}}>
                <div style={{ marginTop: 8, marginBottom: 8 }}>
                  <DateTimePicker
                    label="From (MM/DD/YYYY)"
                    defaultValue={dayjs().startOf('day')}
                    minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: !!errors?.from,
                        helperText: errors?.from?.message
                      },
                    }}
                    onChange={(newValue: Dayjs | null) => {
                      const fromValue = newValue ? newValue.toISOString() : '';
                      setValue('from', fromValue, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });

                      retrieveReport({
                        from: fromValue,
                        to: watch('to'),
                        cost_center_ids: watch('cost_center_ids'),
                      });
                    }}
                  />
                </div>
              </Grid>
              <Grid size={{xs: 12, md: 4, lg: 3.5}}>
                <div style={{ marginTop: 8, marginBottom: 8 }}>
                  <DateTimePicker
                    label="To (MM/DD/YYYY)"
                    defaultValue={dayjs().endOf('day')}
                    minDate={dayjs(watch('from'))}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: !!errors?.to,
                        helperText: errors?.to?.message
                      },
                    }}
                    onChange={(newValue: Dayjs | null) => {
                      const toValue = newValue ? newValue.toISOString() : '';
                      setValue('to', toValue, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      
                      retrieveReport({
                        from: watch('from'),
                        to: toValue,
                        cost_center_ids: watch('cost_center_ids'),
                      });
                    }}
                  />
                </div>
              </Grid>
              <Grid size={12}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  justifyContent="flex-end"
                  alignItems="center"
                >
                  {reportData && (
                    <FormControlLabel
                      sx={{ mr: { xs: 0, sm: 1 }, justifyContent: 'center' }}
                      control={
                        <Switch
                          size="small"
                          checked={separateCreditSales}
                          onChange={(e) => setSeparateCreditSales(e.target.checked)}
                        />
                      }
                      label="Separate Credit Sales & Receipts"
                    />
                  )}
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
                    width={{ xs: '100%', sm: 'auto' }}
                  >
                    {reportData && (
                      <FileExportGrid
                        exportExcel
                        handlExcelExport={() => downloadExcel()}
                        exportingExcel={isDownloadingExcel}
                        exportPdf
                        handlePdf={() => setShowOnScreen((prev) => !prev)}
                      />
                    )}
                    <LoadingButton loading={isFetching} type="submit" size="small" variant="contained">
                      Filter
                    </LoadingButton>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </div>
      </DialogTitle>
      <DialogContent>
        {isFetching ? (
          <div style={{ width: '100%', padding: '16px' }}>
            <Skeleton variant="text" width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
            <Skeleton variant="rectangular" width="100%" height={48} style={{ borderRadius: 4 }} />
            <Skeleton variant="rectangular" width="100%" height={32} style={{ borderRadius: 4 }} />
          </div>
        ) : (
          reportData && (
            showOnScreen ? (
              <SalesAndCashSummaryOnScreen
                reportData={reportData}
                authOrganization={authOrganization as AuthOrganization}
                separateCreditSales={separateCreditSales}
              />
            ) : (
              <PDFContent
                document={
                  <ReportDocument
                    reportData={reportData}
                    authOrganization={authOrganization as AuthOrganization}
                    from={watch('from')}
                    to={watch('to')}
                    user={user as User}
                    costCenters={watch('cost_centers')}
                    separateCreditSales={separateCreditSales}
                  />
                }
                fileName={`Sales And Cash Summary From ${readableDate(watch('from'), true)} To ${readableDate(watch('to'), true)}`}
              />
            )
          )
        )}
      </DialogContent>
      <DialogActions className={css.hiddenOnPrint}>
        <Button sx={{ mt:1 }} size='small' variant='outlined' onClick={() => {setOpenSalesAndCashSummary(false)}}>
          Close
        </Button>
      </DialogActions>
    </>
  );
};

export default SalesAndCashSummary;