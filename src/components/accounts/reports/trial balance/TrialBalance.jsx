'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div, Span } from '@jumbo/shared';
import { HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import CostCenterSelector from '../../../masters/costCenters/CostCenterSelector';
import pdfStyles from '../../../pdf/pdf-styles';
import PDFContent from '../../../pdf/PDFContent';
import PdfLogo from '../../../pdf/PdfLogo';
import financialReportsServices from '../financial-reports-services';
import TrialBalanceGroupedOnScreen from './TrialBalanceGroupedOnScreen';
import TrialBalanceOnScreen from './TrialBalanceOnScreen';

const ReportDocumet = ({ reportData, authOrganization, user }) => {
  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const lightColor =
    authOrganization.organization.settings?.light_color || '#bec5da';
  const contrastText =
    authOrganization.organization.settings?.contrast_text || '#FFFFFF';
  const reportPeriod = `As at: ${readableDate(reportData.filters.as_at, true)}`;
  const costCenters = reportData.filters.cost_centers;

  return reportData ? (
    <Document
      creator={` ${user.name} | Powered By ProsERP`}
      producer='ProsERP'
      title={`Trial Balance ${reportPeriod}`}
    >
      <Page size='A4' style={pdfStyles.page}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text
                style={{ ...pdfStyles.majorInfo, color: mainColor }}
              >{`Trial Balance`}</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{reportPeriod}</Text>
            </View>
          </View>
        </View>
        <View
          style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}
        >
          {Array.isArray(costCenters) && costCenters.length > 0 && (
            <View style={{ flex: 2, padding: 2 }}>
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
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 0.3,
              }}
            >
              S/N
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 3,
              }}
            >
              Ledger Name
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Debit
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Credit
            </Text>
          </View>

          {reportData.ledgers
            .filter((ledger) => ledger.balance.amount !== 0)
            .map((ledger, index) => (
              <View key={index} style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 0.3,
                  }}
                >
                  {index + 1}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 3,
                  }}
                >
                  {ledger.name}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                    textAlign: 'right',
                  }}
                >
                  {ledger.balance.side === 'DR' &&
                    ledger.balance.amount?.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                    textAlign: 'right',
                  }}
                >
                  {ledger.balance.side === 'CR' &&
                    ledger.balance.amount?.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
                </Text>
              </View>
            ))}
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 3.5,
              }}
            >
              TOTAL
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                textAlign: 'right',
                flex: 1,
              }}
            >
              {reportData.ledgers
                .filter((ledger) => ledger.balance.side === 'DR')
                .reduce(
                  (totalDebits, ledger) => totalDebits + ledger.balance.amount,
                  0
                )
                .toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                textAlign: 'right',
                flex: 1,
              }}
            >
              {reportData.ledgers
                .filter((ledger) => ledger.balance.side === 'CR')
                .reduce(
                  (totalCredits, ledger) =>
                    totalCredits + ledger.balance.amount,
                  0
                )
                .toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  ) : (
    ''
  );
};

function TrialBalance({ setOpenTrialBalanceDialog }) {
  document.title = 'Trial Balance';
  const css = useProsERPStyles();
  const { enqueueSnackbar } = useSnackbar();
  const {
    authOrganization,
    authUser: { user },
    checkOrganizationPermission,
  } = useJumboAuth();
  const validationSchema = yup.object({
    as_at: yup
      .string()
      .required('Date is required')
      .typeError('Date is required'),
  });

  const { setValue, watch, handleSubmit } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      as_at: dayjs().toISOString(),
      cost_center_ids: checkOrganizationPermission(PERMISSIONS.COST_CENTERS_ALL)
        ? 'all'
        : authOrganization?.costCenters.map((cost_center) => cost_center.id),
    },
  });

  const [isFetching, setisFetching] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [groupedReportData, setGroupedReportData] = useState(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] =
    React.useState(false);
  const [uploadFieldsKey, setUploadFieldsKey] = useState(0);
  const [showOnScreen, setShowOnScreen] = useState(true);
  const [viewMode, setViewMode] = useState('flat');

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const downloadExcelTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      setUploadFieldsKey((prevKey) => prevKey + 1);

      // Get all current filter parameters
      const filters = {
        as_at: watch('as_at'),
        cost_center_ids: watch('cost_center_ids'),
      };

      // Pass all filters to the service
      const responseData =
        viewMode === 'grouped'
          ? await financialReportsServices.downloadExcelTrialBalanceGrouped(filters)
          : await financialReportsServices.downloadExcelTrialBalance(filters);

      const blob = new Blob([responseData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Trial Balance ${viewMode === 'grouped' ? 'Grouped ' : ''}${readableDate(filters.as_at, true)}.xlsx`;
      link.click();
      setIsDownloadingTemplate(false);
    } catch (error) {
      enqueueSnackbar('Error downloading Excel template', { variant: 'error' });
      setIsDownloadingTemplate(false);
    }
  };

  const retrieveReport = async (filters) => {
    setisFetching(true);
    const [report, groupedReport] = await Promise.all([
      financialReportsServices.trialBalance(filters),
      financialReportsServices.trialBalanceGrouped(filters),
    ]);

    setReportData(report);
    setGroupedReportData(groupedReport);
    setisFetching(false);
  };

  const downloadFileName = `Trial Balance as of ${readableDate(watch('as_at'), true)}`;

  return (
    <>
      <DialogTitle textAlign={'center'}>
        <Grid container>
          <Grid size={{ xs: 12 }} textAlign={'center'}>
            <Typography variant='h3'>Trial Balance</Typography>
          </Grid>
          {belowLargeScreen && (
            <Tooltip title='Close'>
              <IconButton
                size='small'
                sx={{ position: 'absolute', top: 10, right: 10 }}
                onClick={() => setOpenTrialBalanceDialog(false)}
              >
                <HighlightOff color='primary' />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
        <Span className={css.hiddenOnPrint}>
          <form
            autoComplete='off'
            key={uploadFieldsKey}
            onSubmit={handleSubmit(retrieveReport)}
          >
            <Grid
              container
              columnSpacing={1}
              rowSpacing={1}
              alignItems='center'
              justifyContent='center'
            >
              <Grid size={{ xs: 12, md: 8 }}>
                <CostCenterSelector
                  label='Cost Centers'
                  multiple={true}
                  defaultValue={authOrganization?.costCenters}
                  allowSameType={true}
                  onChange={(cost_centers) => {
                    setValue(
                      'cost_center_ids',
                      cost_centers.map((cost_center) => cost_center.id)
                    );
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label='As at (MM/DD/YYYY)'
                    defaultValue={dayjs()}
                    minDate={dayjs(
                      authOrganization?.organization.recording_start_date
                    )}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue(
                        'as_at',
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
              <Grid size={{ xs: 12 }} textAlign='right'>
                <Stack
                  direction='row'
                  spacing={0.5}
                  justifyContent='flex-end'
                  alignItems='center'
                >
                  <>
                    {reportData && (
                      <ToggleButtonGroup
                        size='small'
                        color='primary'
                        exclusive
                        value={viewMode}
                        onChange={(event, newViewMode) => {
                          if (newViewMode) setViewMode(newViewMode);
                        }}
                      >
                        <ToggleButton value='flat'>Flat</ToggleButton>
                        <ToggleButton value='grouped'>Grouped</ToggleButton>
                      </ToggleButtonGroup>
                    )}
                    {reportData && (
                      <FileExportGrid
                        exportExcel
                        handlExcelExport={() => downloadExcelTemplate()}
                        exportingExcel={isDownloadingTemplate}
                        exportPdf
                        handlePdf={() => {
                          setShowOnScreen((prev) => !prev);
                        }}
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
        {isFetching ? (
          <LinearProgress />
        ) : (
          reportData && (
            <>
              {showOnScreen ? (
                viewMode === 'grouped' ? (
                  <TrialBalanceGroupedOnScreen
                    reportData={groupedReportData}
                    authOrganization={authOrganization}
                  />
                ) : (
                  <TrialBalanceOnScreen
                    reportData={reportData}
                    authOrganization={authOrganization}
                  />
                )
              ) : (
                <PDFContent
                  document={
                    <ReportDocumet
                      reportData={reportData}
                      authOrganization={authOrganization}
                      user={user}
                    />
                  }
                  fileName={downloadFileName}
                />
              )}
            </>
          )
        )}
      </DialogContent>
    </>
  );
}

export default TrialBalance;
