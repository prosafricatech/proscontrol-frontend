import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import pdfStyles from '@/components/pdf/pdf-styles';
import PDFContent from '@/components/pdf/PDFContent';
import PdfLogo from '@/components/pdf/PdfLogo';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Div, Span } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import StakeholderSelector from '../../masters/stakeholders/StakeholderSelector';
import purchaseServices from '../purchases/purchase-services';

const ReportDocument = ({
  reportData,
  authOrganization,
  user,
  checkOrganizationPermission,
  baseCurrency,
}) => {
  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const lightColor =
    authOrganization.organization.settings?.light_color || '#bec5da';
  const contrastText =
    authOrganization.organization.settings?.contrast_text || '#FFFFFF';
  const costCenters = reportData.filters.cost_centers;
  const suppliers = reportData.filters.suppliers;
  const currency = reportData.filters.currency;

  const totalOrderAmount = reportData.orders.reduce((total, order) => {
    return total + order.amount * order.exchange_rate;
  }, 0);

  const totalReceivedAmount = reportData.orders.reduce((total, order) => {
    return total + order.received_amount * order.exchange_rate;
  }, 0);

  const totalBalance = reportData.orders.reduce((total, order) => {
    return total + (order.amount - order.received_amount) * order.exchange_rate;
  }, 0);

  return reportData ? (
    <Document
      creator={`${user.name} | Powered by ProsERP`}
      producer='ProsERP'
      title={`Purchases Report ${readableDate(reportData?.filters?.from, true)} to ${readableDate(reportData?.filters?.to, true)}`}
    >
      <Page
        size='A4'
        orientation={
          checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS)
            ? 'landscape'
            : 'portrait'
        }
        style={pdfStyles.page}
      >
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
                Purchases Report
              </Text>
              <Text
                style={{ ...pdfStyles.minInfo }}
              >{`${readableDate(reportData.filters.from, true)} - ${readableDate(reportData.filters.to, true)}`}</Text>
            </View>
          </View>
        </View>
        <View
          style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}
        >
          {suppliers?.length > 0 && (
            <View style={{ flex: 2, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Suppliers
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {suppliers.map((supplier) => supplier.name).join(', ')}
              </Text>
            </View>
          )}
          {currency?.name && (
            <View style={{ flex: 2, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Currency
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>{currency.name}</Text>
            </View>
          )}
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
        <View style={{ ...pdfStyles.tableRow, marginTop: 1, marginBottom: 10 }}>
          {costCenters.length > 0 && (
            <View style={{ flex: 2, paddingLeft: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Cost Centers
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {costCenters
                  .map((cost_centers) => cost_centers.name)
                  .join(', ')}
              </Text>
            </View>
          )}
        </View>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 0.35,
              }}
            >
              S/N
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: currency?.is_base !== 1 ? 1.4 : 1,
              }}
            >
              Order Date & No
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 2,
              }}
            >
              Supplier
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 2,
              }}
            >
              Cost Center
            </Text>
            {currency?.is_base !== 1 && (
              <>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1.5,
                  }}
                >
                  Order Amount
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
                  Received Amount
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
                  Balance
                </Text>
              </>
            )}
            <Text
              style={{
                ...pdfStyles.tableCell,
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
              }}
            >
              {' '}
              Order Amount ({baseCurrency.code})
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
              {' '}
              Received Amount ({baseCurrency.code})
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
              {' '}
              Balance ({baseCurrency.code})
            </Text>
          </View>
          {reportData.orders.map((order, index) => {
            return (
              <View key={index} style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 0.35,
                    textAlign: 'right',
                  }}
                >
                  {index + 1}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: currency?.is_base !== 1 ? 1.4 : 1,
                  }}
                >
                  {readableDate(order.order_date)} {order.orderNo}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 2,
                  }}
                >
                  {order.stakeholder.name}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 2,
                  }}
                >
                  {order.cost_centers.map((cc) => cc.name)}
                </Text>
                {currency?.is_base !== 1 && (
                  <>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 1.5,
                        textAlign: 'right',
                      }}
                    >
                      {order.currency.code} {order.amount?.toLocaleString()}
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 1.5,
                        textAlign: 'right',
                      }}
                    >
                      {order.currency.code}{' '}
                      {order.received_amount?.toLocaleString()}
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 1.5,
                        textAlign: 'right',
                      }}
                    >
                      {order.currency.code}{' '}
                      {(order.amount - order.received_amount).toLocaleString()}
                    </Text>
                  </>
                )}
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.5,
                    textAlign: 'right',
                  }}
                >
                  {(order.amount * order.exchange_rate).toLocaleString()}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.5,
                    textAlign: 'right',
                  }}
                >
                  {(
                    order.received_amount * order.exchange_rate
                  ).toLocaleString()}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.5,
                    textAlign: 'right',
                  }}
                >
                  {(
                    order.amount * order.exchange_rate -
                    order.received_amount * order.exchange_rate
                  ).toLocaleString()}
                </Text>
              </View>
            );
          })}
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableCell,
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: currency?.is_base !== 1 ? 11.7 : 5.8,
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
                flex: 1.5,
                textAlign: 'right',
              }}
            >
              {baseCurrency.symbol} {totalOrderAmount?.toLocaleString()}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
                textAlign: 'right',
              }}
            >
              {baseCurrency.symbol} {totalReceivedAmount?.toLocaleString()}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
                textAlign: 'right',
              }}
            >
              {baseCurrency.symbol} {totalBalance.toLocaleString()}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  ) : (
    ''
  );
};

function PurchasesReport() {
  const classes = useProsERPStyles();
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies?.find((currency) => !!currency?.is_base);
  const {
    authOrganization,
    authUser: { user },
    checkOrganizationPermission,
  } = useJumboAuth();

  const { setValue, handleSubmit } = useForm({
    defaultValues: {
      from: dayjs().startOf('day').toISOString(),
      to: dayjs().toISOString(),
      stakeholder_ids: [],
      cost_center_ids: authOrganization.costCenters.map(
        (cost_center) => cost_center.id
      ),
      currency_id: '',
    },
  });

  useEffect(() => {
    if (currencies.length === 1) {
      setValue('currency_id', currencies[0].id);
    }
  }, [currencies]);

  const [isFetching, setisFetching] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const getPurchasesReport = async (filters) => {
    setisFetching(true);
    const data = await purchaseServices.getPurchasesReport(filters);
    setReportData(data);
    setisFetching(false);
  };

  const downloadFileName = `Purchases Report ${readableDate(reportData?.filters?.from)}-${readableDate(reportData?.filters?.to)}`;

  const exportedData = {
    reportData: reportData,
    baseCurrency: baseCurrency,
    authOrganization: authOrganization,
    user: user,
    checkOrganizationPermission: checkOrganizationPermission(
      PERMISSIONS.ACCOUNTS_REPORTS
    ),
  };

  const handlExcelExport = async (exportedData) => {
    setIsExporting(true);
    try {
      const blob =
        await purchaseServices.exportPurchasesReportToExcel(exportedData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${downloadFileName}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <React.Fragment>
      <DialogTitle textAlign={'center'}>
        <Span className={classes.hiddenOnPrint}>
          <form autoComplete='off' onSubmit={handleSubmit(getPurchasesReport)}>
            <Grid
              container
              columnSpacing={1}
              rowSpacing={1}
              alignItems={'center'}
              justifyContent={'center'}
            >
              <Grid size={12}>
                <Typography variant='h3'>Purchases Report</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <StakeholderSelector
                    label='Suppliers'
                    multiple={true}
                    onChange={(newValue) => {
                      setValue(
                        'stakeholder_ids',
                        newValue ? newValue.map((value) => value.id) : []
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 3.5 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label='From (MM/DD/YYYY)'
                    fullWidth
                    minDate={dayjs(
                      authOrganization?.organization.recording_start_date
                    )}
                    maxDate={dayjs()}
                    defaultValue={dayjs().startOf('day')}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue(
                        'from',
                        newValue ? newValue.toISOString() : null,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 3.5 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label='To (MM/DD/YYYY)'
                    fullWidth
                    minDate={dayjs(
                      authOrganization?.organization.recording_start_date
                    )}
                    maxDate={dayjs()}
                    defaultValue={dayjs().endOf('day')}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue('to', newValue ? newValue.toISOString() : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <CostCenterSelector
                    label='Cost and Profit Centers'
                    multiple={true}
                    allowSameType={true}
                    onChange={(cost_centers) => {
                      setValue(
                        'cost_center_ids',
                        cost_centers.map((cost_center) => cost_center.id)
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 3.5, lg: 3.5 }}>
                <Autocomplete
                  size='small'
                  defaultValue={currencies.length === 1 ? currencies[0] : null}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  options={currencies}
                  getOptionLabel={(currency) =>
                    `${currency.name} (${currency.symbol})`
                  }
                  renderInput={(params) => (
                    <TextField {...params} label='Currency' />
                  )}
                  onChange={(e, newValue) => {
                    setValue('currency_id', newValue ? newValue.id : null);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3.5, lg: 3.5 }} textAlign={'right'}>
                <Stack
                  direction='row'
                  spacing={0.5}
                  justifyContent='flex-end'
                  alignItems='center'
                >
                  <>
                    {reportData?.orders?.length > 0 && (
                      <FileExportGrid
                        exportExcel
                        handlExcelExport={() => handlExcelExport(exportedData)}
                        exportingExcel={isExporting}
                      />
                    )}
                    <LoadingButton
                      loading={isFetching}
                      type='submit'
                      size='small'
                      variant='contained'
                    >
                      Filter
                    </LoadingButton>
                  </>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Span>
      </DialogTitle>

      <DialogContent>
        {isFetching && <LinearProgress />}
        {!isFetching && reportData?.orders?.length > 0 && (
          <PDFContent
            document={
              <ReportDocument
                reportData={reportData}
                baseCurrency={baseCurrency}
                authOrganization={authOrganization}
                user={user}
                checkOrganizationPermission={checkOrganizationPermission}
              />
            }
            fileName={downloadFileName}
          />
        )}
      </DialogContent>
    </React.Fragment>
  );
}

export default PurchasesReport;
