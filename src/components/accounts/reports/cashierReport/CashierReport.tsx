import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { AuthOrganization, User } from '@/types/auth-types';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Span } from '@jumbo/shared';
import { HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import dayjs, { Dayjs } from 'dayjs';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import pdfStyles from '../../../pdf/pdf-styles';
import PDFContent from '../../../pdf/PDFContent';
import PdfLogo from '../../../pdf/PdfLogo';
import LedgerSelect from '../../ledgers/forms/LedgerSelect';
import financialReportsServices from '../financial-reports-services';
import CashierReportOnScreen from './CashierReportOnScreen';

interface Transaction {
  transactionDate: string;
  voucherNo: string;
  reference: string;
  description: string;
  amount: number;
}

interface ReportItem {
  name: string;
  opening_balance: number;
  incoming_total: number;
  outgoing_total: number;
  closing_balance: number;
  incoming_transactions?: Record<string, Transaction>;
  outgoing_transactions?: Record<string, Transaction>;
}
interface ReportDocumentProps {
  reportData: ReportItem[];
  authOrganization: AuthOrganization;
  user: User;
  from: string;
  to: string;
}

const ReportDocument: React.FC<ReportDocumentProps> = ({
  reportData,
  authOrganization,
  user,
  from,
  to,
}) => {
  const reportPeriod = `${readableDate(from, true)} to ${readableDate(to, true)}`;
  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const lightColor =
    authOrganization.organization.settings?.light_color || '#bec5da';
  const contrastText =
    authOrganization.organization.settings?.contrast_text || '#FFFFFF';
  const currencyCode = authOrganization.base_currency?.code;

  // Helper function to format currency safely
  const formatCurrency = (value: number) => {
    try {
      return (
        value?.toLocaleString('en-US', {
          style: 'currency',
          currency: currencyCode,
        }) || 'N/A'
      );
    } catch (e) {
      return value?.toLocaleString() || 'N/A';
    }
  };

  if (!reportData) return null;

  return (
    <Document
      creator={` ${user.name} | Powered By ProsERP`}
      producer='ProsERP'
      title={`Cashier Report ${reportPeriod}`}
    >
      <Page size='A4' style={pdfStyles.page}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
                Cashier Report
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>{reportPeriod}</Text>
            </View>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginTop: 10 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed By
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{user.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed On
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {readableDate(undefined, true)}
            </Text>
          </View>
        </View>

        {reportData.map((item, index) => (
          <View
            key={index}
            style={{ ...pdfStyles.table, marginTop: 30, borderWidth: 0.7 }}
          >
            <View style={{ ...pdfStyles.tableRow }}>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1,
                  textAlign: 'center',
                }}
              >
                {item.name}
              </Text>
            </View>

            <View style={{ ...pdfStyles.tableRow, marginBottom: 5 }}>
              <View style={{ flex: 1, padding: 2 }}>
                <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                  Opening Balance
                </Text>
                <Text style={{ ...pdfStyles.minInfo }}>
                  {formatCurrency(item.opening_balance)}
                </Text>
              </View>
              <View style={{ flex: 1, padding: 2 }}>
                <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                  Incoming Total
                </Text>
                <Text style={{ ...pdfStyles.minInfo, color: 'green' }}>
                  {formatCurrency(item.incoming_total)}
                </Text>
              </View>
              <View style={{ flex: 1, padding: 2 }}>
                <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                  Outgoing Total
                </Text>
                <Text style={{ ...pdfStyles.minInfo, color: 'red' }}>
                  {formatCurrency(item.outgoing_total)}
                </Text>
              </View>
              <View style={{ flex: 1, padding: 2 }}>
                <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                  Closing Balance
                </Text>
                <Text style={{ ...pdfStyles.minInfo, color: 'blue' }}>
                  {formatCurrency(item.closing_balance)}
                </Text>
              </View>
            </View>

            {item?.incoming_transactions &&
              Object.values(item.incoming_transactions).length > 0 && (
                <View
                  style={{ ...pdfStyles.table, minHeight: 80, marginTop: 15 }}
                >
                  <View style={{ ...pdfStyles.tableRow }}>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 1,
                        textAlign: 'center',
                      }}
                    >
                      Incoming Transactions
                    </Text>
                  </View>

                  <View style={{ ...pdfStyles.tableRow }}>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 1,
                      }}
                    >
                      Date
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 1.5,
                      }}
                    >
                      Reference
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 2,
                      }}
                    >
                      Description
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 1,
                      }}
                    >
                      Amount
                    </Text>
                  </View>

                  {Object.values(item.incoming_transactions).map(
                    (incomingItem, index) => (
                      <View key={index} style={pdfStyles.tableRow}>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            backgroundColor:
                              index % 2 === 0 ? '#FFFFFF' : lightColor,
                            flex: 1,
                          }}
                        >
                          {readableDate(incomingItem.transactionDate)}
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            backgroundColor:
                              index % 2 === 0 ? '#FFFFFF' : lightColor,
                            flex: 1.5,
                          }}
                        >
                          {`${incomingItem.voucherNo}${incomingItem.reference?.trim() ? `/${incomingItem.reference}` : ''}`}
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            backgroundColor:
                              index % 2 === 0 ? '#FFFFFF' : lightColor,
                            flex: 2,
                          }}
                        >
                          {incomingItem.description}
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            backgroundColor:
                              index % 2 === 0 ? '#FFFFFF' : lightColor,
                            flex: 1,
                            textAlign: 'right',
                          }}
                        >
                          {formatCurrency(incomingItem.amount)}
                        </Text>
                      </View>
                    )
                  )}

                  <View style={pdfStyles.tableRow}>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 4.755,
                        textAlign: 'center',
                      }}
                    >
                      TOTAL
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 1,
                        textAlign: 'right',
                      }}
                    >
                      {formatCurrency(
                        Object.values(item.incoming_transactions).reduce(
                          (total, incomingItem) => total + incomingItem.amount,
                          0
                        )
                      )}
                    </Text>
                  </View>
                </View>
              )}

            {item?.outgoing_transactions &&
              Object.values(item.outgoing_transactions).length > 0 && (
                <View style={{ ...pdfStyles.table, marginTop: 15 }}>
                  <View style={{ ...pdfStyles.tableRow }}>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 1,
                        textAlign: 'center',
                      }}
                    >
                      Outgoing Transactions
                    </Text>
                  </View>

                  <View style={{ ...pdfStyles.tableRow }}>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 1,
                      }}
                    >
                      Date
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 1.5,
                      }}
                    >
                      Reference
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 2,
                      }}
                    >
                      Description
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 1,
                      }}
                    >
                      Amount
                    </Text>
                  </View>

                  {Object.values(item.outgoing_transactions).map(
                    (outgoingItem, index) => (
                      <View key={index} style={pdfStyles.tableRow}>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            backgroundColor:
                              index % 2 === 0 ? '#FFFFFF' : lightColor,
                            flex: 1,
                          }}
                        >
                          {readableDate(outgoingItem.transactionDate)}
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            backgroundColor:
                              index % 2 === 0 ? '#FFFFFF' : lightColor,
                            flex: 1.5,
                          }}
                        >
                          {`${outgoingItem.voucherNo}${outgoingItem.reference?.trim() ? `/${outgoingItem.reference}` : ''}`}
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            backgroundColor:
                              index % 2 === 0 ? '#FFFFFF' : lightColor,
                            flex: 2,
                          }}
                        >
                          {outgoingItem.description}
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            backgroundColor:
                              index % 2 === 0 ? '#FFFFFF' : lightColor,
                            flex: 1,
                            textAlign: 'right',
                          }}
                        >
                          {formatCurrency(outgoingItem.amount)}
                        </Text>
                      </View>
                    )
                  )}

                  <View style={pdfStyles.tableRow}>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 4.755,
                        textAlign: 'center',
                      }}
                    >
                      TOTAL
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 1,
                        textAlign: 'right',
                      }}
                    >
                      {formatCurrency(
                        Object.values(item.outgoing_transactions).reduce(
                          (total, outgoingItem) => total + outgoingItem.amount,
                          0
                        )
                      )}
                    </Text>
                  </View>
                </View>
              )}
          </View>
        ))}
      </Page>
    </Document>
  );
};

interface FormValues {
  from: string;
  to: string;
  ledger_ids: string[];
  cost_center_ids: string[];
  detailed: boolean;
}

interface CashierReportProps {
  as_at?: string;
  setOpenCashierReport: (open: boolean) => void;
}

const CashierReport: React.FC<CashierReportProps> = ({
  as_at,
  setOpenCashierReport,
}) => {
  document.title = 'Cashier Report';
  const css = useProsERPStyles();
  const [showOnScreen, setShowOnScreen] = useState(true);
  const { authOrganization, authUser, checkOrganizationPermission } =
    useJumboAuth();
  const user = authUser?.user;
  const [isFetching, setIsFetching] = useState(false);
  const [reportData, setReportData] = useState<ReportItem[] | null>(null);
  const [detailed, setDetailed] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  // Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const validationSchema = yup.object({
    from: yup
      .string()
      .required('From date is required')
      .typeError('From date is required'),
    to: yup
      .string()
      .required('To date is required')
      .typeError('To date is required'),
    ledger_ids: yup
      .array()
      .of(yup.string().required('Ledger is required'))
      .required('At least one ledger is required'),
  });

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      from: dayjs().startOf('day').toISOString(),
      to: dayjs().endOf('day').toISOString(),
      cost_center_ids: checkOrganizationPermission(PERMISSIONS.COST_CENTERS_ALL)
        ? 'all'
        : authOrganization?.costCenters?.map(
            (cost_center: CostCenter) => cost_center.id
          ) || [],
      detailed: false,
    },
  });

  const retrieveReport = async (filters: FormValues) => {
    setIsFetching(true);
    try {
      const report = await financialReportsServices.fetchCashierReport(filters);
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
        ledger_ids: watch('ledger_ids'),
        detailed: watch('detailed'),
      };
      const responseData =
        await financialReportsServices.downloadExcelCashierReport(filters);

      const blob = new Blob([responseData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Cashier Report From ${readableDate(filters.from, true)} To ${readableDate(filters.to, true)}.xlsx`;
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
            <Typography variant='h3'>Cashier Report</Typography>
          </Grid>
          {belowLargeScreen && (
            <Grid size={1}>
              <Tooltip title='Close'>
                <IconButton
                  sx={{ mb: 1 }}
                  size='small'
                  onClick={() => setOpenCashierReport(false)}
                >
                  <HighlightOff color='primary' />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
        </Grid>
        <Span className={css.hiddenOnPrint}>
          <form autoComplete='off' onSubmit={handleSubmit(retrieveReport)}>
            <Grid
              container
              columnSpacing={1}
              rowSpacing={1}
              alignItems='center'
              justifyContent='center'
            >
              <Grid size={{ xs: 12, md: 6 }}>
                <LedgerSelect
                  label='Ledger(s)'
                  multiple={true}
                  frontError={errors?.ledger_ids}
                  allowedGroups={['Cash and cash equivalents']}
                  onChange={(newValue: any) => {
                    setValue(
                      'ledger_ids',
                      newValue?.map((ledger: any) => ledger.id),
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      }
                    );
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CostCenterSelector
                  label='Cost Center(s)'
                  multiple={true}
                  allowSameType={true}
                  onChange={(cost_centers: any) => {
                    const costCenterIds =
                      cost_centers?.map(
                        (cost_center: CostCenter) => cost_center.id
                      ) || [];
                    setValue('cost_center_ids', costCenterIds);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <div style={{ marginTop: 8, marginBottom: 8 }}>
                  <DateTimePicker
                    label='From (MM/DD/YYYY)'
                    value={dayjs(watch('from'))}
                    minDate={dayjs(
                      authOrganization?.organization.recording_start_date
                    )}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: !!errors?.from,
                        helperText: errors?.from?.message,
                      },
                    }}
                    onChange={(newValue: Dayjs | null) => {
                      setValue('from', newValue ? newValue.toISOString() : '', {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </div>
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <div style={{ marginTop: 8, marginBottom: 8 }}>
                  <DateTimePicker
                    label='To (MM/DD/YYYY)'
                    value={dayjs(watch('to'))}
                    minDate={dayjs(watch('from'))}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: !!errors?.to,
                        helperText: errors?.to?.message,
                      },
                    }}
                    onChange={(newValue: Dayjs | null) => {
                      setValue('to', newValue ? newValue.toISOString() : '', {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </div>
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 2 }} textAlign='left'>
                <Checkbox
                  checked={detailed}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setDetailed(isChecked);
                    setValue('detailed', isChecked, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
                Detailed
              </Grid>
              <Grid size={{ xs: 10, md: 4, lg: 3 }} textAlign='right'>
                {reportData && (
                  <FileExportGrid
                    exportExcel
                    handlExcelExport={() => downloadExcel()}
                    exportingExcel={isDownloadingExcel}
                    exportPdf
                    handlePdf={() => {
                      setShowOnScreen((prev) => !prev);
                    }}
                  />
                )}
              </Grid>
              <Grid size={{ xs: 2, md: 2, lg: 1 }} textAlign='right'>
                <LoadingButton
                  loading={isFetching}
                  type='submit'
                  size='small'
                  variant='contained'
                >
                  Filter
                </LoadingButton>
              </Grid>
            </Grid>
          </form>
        </Span>
      </DialogTitle>
      <DialogContent>
        {isFetching ? (
          <LinearProgress />
        ) : (
          reportData &&
          (!showOnScreen ? (
            <PDFContent
              document={
                <ReportDocument
                  reportData={reportData}
                  authOrganization={authOrganization as AuthOrganization}
                  from={watch('from')}
                  to={watch('to')}
                  user={user as User}
                />
              }
              fileName={`Cashier Report from ${readableDate(watch('from'), true)} to ${readableDate(watch('to'), true)}`}
            />
          ) : (
            <CashierReportOnScreen
              reportData={reportData}
              authOrganization={authOrganization as AuthOrganization}
            />
          ))
        )}
      </DialogContent>
      <DialogActions className={css.hiddenOnPrint}>
        <Button
          sx={{ mt: 1 }}
          size='small'
          variant='outlined'
          onClick={() => setOpenCashierReport(false)}
        >
          Close
        </Button>
      </DialogActions>
    </>
  );
};

export default CashierReport;
