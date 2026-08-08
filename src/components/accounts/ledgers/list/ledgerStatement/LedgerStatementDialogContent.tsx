import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PDFContent from '@/components/pdf/PDFContent';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { deviceType } from '@/utilities/helpers/user-agent-helpers';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
  Chip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import ledgerServices from '../../ledger-services';
import LedgerStatementOnScreen from './LedgerStatementOnScreen';

// ✅ Updated interfaces with currency support
interface Transaction {
  transactionDate: string;
  voucherNo?: string;
  reference?: string;
  description: string;
  debit: number;
  credit: number;
  debit_foreign?: number;  // ✅ New: foreign currency debit
  credit_foreign?: number; // ✅ New: foreign currency credit
  correspondingLedger?: string | null;
}

interface ReportDocumentProps {
  transactionsData: {
    transactions: Transaction[];
    filters: {
      from: string;
      to: string;
      cost_centers: Array<{ id: number; name: string }>;
      ledgerName?: string;
      ledger?: {
        id: number;
        name: string;
        code: string;
        currency?: {
          id: number;
          name: string;
          code: string;
          symbol: string;
          name_plural: string;
          symbol_native: string;
        } | null;
      };
    };
  };
  authOrganization: {
    organization: Organization;
    costCenters?: Array<{ id: number; name: string }>;
  };
  user: {
    name: string;
  };
  ledger?: {
    id: number;
    name: string;
    increasesWith?: 'DR' | 'CR';
    currency?: {
      id: number;
      code: string;
      symbol: string;
    } | null;
  };
  ledgerName?: string;
  increasesWith?: 'DR' | 'CR';
}

interface LedgerStatementDialogContentProps {
  setOpen: (open: boolean) => void;
  ledger?: {
    id: number;
    name: string;
    increasesWith?: 'DR' | 'CR';
    currency?: {
      id: number;
      code: string;
      symbol: string;
    } | null;
  };
  commingFilters?: {
    from: string;
    to: string;
    ledger_id?: number;
    cost_center_ids: number[] | 'all';
    with_item_description: boolean;
    ledgerName?: string;
    increasesWith?: 'DR' | 'CR';
    currency?: {
      id: number;
      code: string;
      symbol: string;
    } | null;
  };
}

const ReportDocument: React.FC<ReportDocumentProps> = ({
  transactionsData,
  authOrganization,
  user,
  ledger,
  ledgerName,
  increasesWith,
}) => {
  const [openingBalanceTx, ...restTransactions] = transactionsData.transactions;

  const hasForeignCurrency = !!transactionsData.filters.ledger?.currency;
  const currencySymbol = transactionsData.filters.ledger?.currency?.symbol || '';
  const currencyCode = transactionsData.filters.ledger?.currency?.code || '';

  const openingBalance = openingBalanceTx
    ? increasesWith === 'DR'
      ? openingBalanceTx.debit - openingBalanceTx.credit
      : openingBalanceTx.credit - openingBalanceTx.debit
    : 0;

  const totalCredits = restTransactions.reduce(
    (total: number, transaction) => total + transaction.credit,
    0
  );
  const totalDebits = restTransactions.reduce(
    (total: number, transaction) => total + transaction.debit,
    0
  );

  const totalForeignCredits = hasForeignCurrency ? restTransactions.reduce(
    (total: number, transaction) => total + (transaction.credit_foreign || 0),
    0
  ) : 0;

  const totalForeignDebits = hasForeignCurrency ? restTransactions.reduce(
    (total: number, transaction) => total + (transaction.debit_foreign || 0),
    0
  ) : 0;

  const mainColor = authOrganization.organization.settings?.main_color || '#2113AD';
  const lightColor = authOrganization.organization.settings?.light_color || '#bec5da';
  const contrastText = authOrganization.organization.settings?.contrast_text || '#FFFFFF';
  const costCenters = transactionsData.filters.cost_centers;

  let runningBalance = openingBalance;
  let foreignRunningBalance = hasForeignCurrency ? 
    (openingBalanceTx ? (increasesWith === 'DR'
      ? (openingBalanceTx.debit_foreign || 0) - (openingBalanceTx.credit_foreign || 0)
      : (openingBalanceTx.credit_foreign || 0) - (openingBalanceTx.debit_foreign || 0)) : 0) : 0;

  const tableRows = [
    ...(openingBalanceTx
      ? [{
          transactionDate: openingBalanceTx.transactionDate,
          reference: '',
          description: openingBalanceTx.description,
          correspondingLedger: '',
          debit: null as number | null,
          credit: null as number | null,
          balance: openingBalance,
          debit_foreign: hasForeignCurrency ? (openingBalanceTx.debit_foreign || null) : null,
          credit_foreign: hasForeignCurrency ? (openingBalanceTx.credit_foreign || null) : null,
          balance_foreign: hasForeignCurrency ? (openingBalanceTx.debit_foreign || 0) - (openingBalanceTx.credit_foreign || 0) : null,
        }]
      : []),
    ...restTransactions.map((transaction) => {
      runningBalance +=
        increasesWith === 'DR'
          ? transaction.debit - transaction.credit
          : transaction.credit - transaction.debit;

      if (hasForeignCurrency) {
        foreignRunningBalance +=
          increasesWith === 'DR'
            ? (transaction.debit_foreign || 0) - (transaction.credit_foreign || 0)
            : (transaction.credit_foreign || 0) - (transaction.debit_foreign || 0);
      }

      return {
        transactionDate: transaction.transactionDate,
        reference:
          `${transaction.voucherNo ? transaction.voucherNo : ''} ${transaction.reference ? transaction.reference : ''}`.trim(),
        description: transaction.description,
        correspondingLedger: transaction.correspondingLedger || '',
        debit: transaction.debit,
        credit: transaction.credit,
        balance: runningBalance,
        debit_foreign: hasForeignCurrency ? (transaction.debit_foreign || null) : null,
        credit_foreign: hasForeignCurrency ? (transaction.credit_foreign || null) : null,
        balance_foreign: hasForeignCurrency ? foreignRunningBalance : null,
      };
    }),
  ];

  return transactionsData ? (
    <Document
      creator={`${user.name} | Powered by ProsERP`}
      producer='ProsERP'
      title={`${ledger?.name || ledgerName} Statement ${readableDate(transactionsData.filters.from)} to ${readableDate(transactionsData.filters.to)}`}
    >
      <Page size='A4' orientation={hasForeignCurrency ? 'landscape' : 'portrait'} style={pdfStyles.page}>
        <View style={pdfStyles.table}>
          {/* Header Section */}
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Ledger Statement</Text>
              <Text style={{ ...pdfStyles.midInfo }}>{`${ledger?.name || ledgerName}`}</Text>
              {hasForeignCurrency && (
                <Text style={{ ...pdfStyles.midInfo}}>
                 {currencyCode}
                </Text>
              )}
              <Text style={{ ...pdfStyles.minInfo }}>
                {`${readableDate(transactionsData.filters.from, true)} - ${readableDate(transactionsData.filters.to, true)}`}
              </Text>
            </View>
          </View>

          {/* ── INFO ROW: TOTALS + PRINTED INFO (SAME LINE) ── */}
          <View style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 6 }}>
            {/* Total Credits */}
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Total Credits
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {totalCredits.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>

            {/* Total Debits */}
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Total Debits
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {totalDebits.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>

            {/* Foreign Totals (if exists) */}
            {hasForeignCurrency && (
              <>
                <View style={{ flex: 1, padding: 2 }}>
                  <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                    Total Credits ({currencyCode})
                  </Text>
                  <Text style={{ ...pdfStyles.minInfo }}>
                    {currencySymbol} {totalForeignCredits.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
                <View style={{ flex: 1, padding: 2 }}>
                  <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                    Total Debits ({currencyCode})
                  </Text>
                  <Text style={{ ...pdfStyles.minInfo }}>
                    {currencySymbol} {totalForeignDebits.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </>
            )}

            {/* Printed By */}
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Printed By
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {user.name}
              </Text>
            </View>

            {/* Printed On */}
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Printed On
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {readableDate(undefined, true)}
              </Text>
            </View>
          </View>

          {/* ── COST CENTERS ── */}
          {Array.isArray(costCenters) && costCenters.length > 0 && (
            <View style={{ ...pdfStyles.tableRow, marginBottom: 6 }}>
              <View style={{ flex: 2, padding: 2 }}>
                <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                  Cost Centers
                </Text>
                <Text style={{ ...pdfStyles.minInfo }}>
                  {costCenters.map((cc) => cc.name).join(', ')}
                </Text>
              </View>
            </View>
          )}

          {/* ── TABLE ── */}
          <View style={pdfStyles.tableRow}>
            {/* Table headers */}
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Date</Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Reference</Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>Description</Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Corresponding Ledger</Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Debit</Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Credit</Text>
            {hasForeignCurrency && (
              <>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Debit     ({currencyCode})</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Credit    ({currencyCode})</Text>
              </>
            )}
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Balance</Text>
            {hasForeignCurrency && (
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Balance       ({currencyCode})</Text>
            )}
          </View>

          {/* Data rows */}
          {tableRows.map((row, index) => (
            <View key={`${row.transactionDate}-${index}`} style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1 }}>
                {readableDate(row.transactionDate)}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1 }}>
                {row.reference}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2 }}>
                {row.description}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>
                {row.correspondingLedger}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>
                {row.debit && row.debit !== 0 ? row.debit.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) : '-'}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>
                {row.credit && row.credit !== 0 ? row.credit.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) : '-'}
              </Text>
              {hasForeignCurrency && (
                <>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>
                    {row.debit_foreign && row.debit_foreign !== 0 ? row.debit_foreign.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) : '-'}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>
                    {row.credit_foreign && row.credit_foreign !== 0 ? row.credit_foreign.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) : '-'}
                  </Text>
                </>
              )}
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>
                {row.balance.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) === '-0.00' ? '0.00' : row.balance.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
              </Text>
              {hasForeignCurrency && (
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>
                  {row.balance_foreign?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) === '-0.00' ? '0.00' : row.balance_foreign?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) || '-'}
                </Text>
              )}
            </View>
          ))}

          {/* TOTAL row */}
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', textAlign: 'center', flex: 5.5 }}>TOTAL</Text>
            <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', flex: 1.5, textAlign: 'right' }}>
              {totalDebits.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
            </Text>
            <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', flex: 1.5, textAlign: 'right' }}>
              {totalCredits.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
            </Text>
            {hasForeignCurrency && (
              <>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', flex: 1.5, textAlign: 'right' }}>
                  {totalForeignDebits.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', flex: 1.5, textAlign: 'right' }}>
                  {totalForeignCredits.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                </Text>
              </>
            )}
            <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.5 }} />
            {hasForeignCurrency && (
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.5 }} />
            )}
          </View>
        </View>
        <PageFooter />
      </Page>
    </Document>
  ) : null;
};

const LedgerStatementDialogContent: React.FC<
  LedgerStatementDialogContentProps
> = ({ setOpen, ledger, commingFilters = null }) => {
  const [transactions, setTransactions] = useState<
    ReportDocumentProps['transactionsData'] | null
  >(null);
  const { authOrganization, authUser, checkOrganizationPermission } =
    useJumboAuth();
  const user = authUser?.user;
  const [withItemDescription, setWithItemDescription] =
    useState(!!commingFilters);
  const [activeTab, setActiveTab] = useState(0);
  const isMobile = deviceType() === 'mobile';
  const { enqueueSnackbar } = useSnackbar();
  const [isExporting, setIsExporting] = useState(false);
  const [uploadFieldsKey, setUploadFieldsKey] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const { setValue, handleSubmit, watch } = useForm({
    defaultValues: {
      from: commingFilters?.from || dayjs().startOf('day').toISOString(),
      to: commingFilters?.to || dayjs().endOf('day').toISOString(),
      ledger_id: commingFilters?.ledger_id ?? ledger?.id,
      cost_center_ids:
        commingFilters?.cost_center_ids ??
        (checkOrganizationPermission(PERMISSIONS.COST_CENTERS_ALL)
          ? 'all'
          : authOrganization?.costCenters?.map(
              (cost_center: any) => cost_center.id
            ) || []),
      with_item_description: commingFilters ? true : withItemDescription,
    },
  });

  const fetchTransactions = useCallback(
    async (filters: {
      from: string;
      to: string;
      ledger_id?: number;
      cost_center_ids: number[] | 'all';
      with_item_description: boolean;
    }) => {
      try {
        setIsFetching(true);
        const data = await ledgerServices.statement(filters);
        setTransactions(data);
      } catch (err) {
        setTransactions(null);
      } finally {
        setIsFetching(false);
      }
    },
    []
  );

  useEffect(() => {
    if (commingFilters) {
      const initialFilters = {
        ...commingFilters,
        with_item_description: true,
      };
      setWithItemDescription(true);
      setValue('with_item_description', true, {
        shouldValidate: false,
        shouldDirty: false,
      });
      setValue('from', commingFilters.from, {
        shouldValidate: false,
        shouldDirty: false,
      });
      setValue('to', commingFilters.to, {
        shouldValidate: false,
        shouldDirty: false,
      });
      setValue('cost_center_ids', commingFilters.cost_center_ids, {
        shouldValidate: false,
        shouldDirty: false,
      });
      fetchTransactions(initialFilters);
    }
  }, [commingFilters, fetchTransactions, setValue]);

  const ledgerName = commingFilters?.ledgerName;
  const effectiveFrom = watch('from') || commingFilters?.from;
  const effectiveTo = watch('to') || commingFilters?.to;
  const downloadFileName = `${ledger?.name || ledgerName} Statement ${readableDate(effectiveFrom)}-${readableDate(effectiveTo)}`;

  const hasForeignCurrency = !!(
    transactions?.filters.ledger?.currency ||
    ledger?.currency ||
    commingFilters?.currency
  );

  const currencyCode = transactions?.filters.ledger?.currency?.code ||
    ledger?.currency?.code ||
    commingFilters?.currency?.code ||
    '';

  const exportedData = {
    transactionsData: transactions,
    authOrganization: authOrganization,
    user: user,
    ledger: {
      ...ledger,
      currency: transactions?.filters.ledger?.currency || ledger?.currency,
    },
    ledgerName: ledgerName,
    increasesWith: ledger?.increasesWith || commingFilters?.increasesWith,
  };

  const handlExcelExport = async (exportedData: any) => {
    setIsExporting(true);
    try {
      const blob = await ledgerServices.exportLedgerStatement(exportedData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${'Ledger_Statement_Report_'} ${readableDate(exportedData.transactionsData?.filters?.from, true)} - ${readableDate(exportedData.transactionsData?.filters?.to, true)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <React.Fragment>
      <DialogTitle textAlign={'center'}>
        <form
          autoComplete='off'
          key={uploadFieldsKey}
          onSubmit={handleSubmit(fetchTransactions)}
        >
          <Grid
            container
            columnSpacing={1}
            rowSpacing={1}
            alignItems={'center'}
            justifyContent={'center'}
          >
            {!commingFilters && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <Typography variant="h6">
                      {ledger && ledger.name + ' statement'}
                    </Typography>
                    {hasForeignCurrency && (
                      <Chip
                        label={currencyCode}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Grid>
                {!ledger && (
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Div sx={{ mt: 1, mb: 1 }}></Div>
                  </Grid>
                )}
                <Grid size={{ xs: 12 }}>
                  <CostCenterSelector
                    label='Cost Centers'
                    multiple={true}
                    allowSameType={true}
                    onChange={(cost_centers) => {
                      if (Array.isArray(cost_centers)) {
                        setValue(
                          'cost_center_ids',
                          cost_centers.map((cost_center) => cost_center.id)
                        );
                      } else {
                        setValue('cost_center_ids', []);
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <DateTimePicker
                      label='From (MM/DD/YYYY)'
                      sx={{ width: '100%' }}
                      minDate={dayjs(
                        authOrganization?.organization.recording_start_date
                      )}
                      value={dayjs(watch('from'))}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                        },
                      }}
                      onChange={(newValue) => {
                        setValue(
                          'from',
                          newValue ? newValue.toISOString() : '',
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <DateTimePicker
                      label='To (MM/DD/YYYY)'
                      sx={{ width: '100%' }}
                      minDate={dayjs(watch('from'))}
                      value={dayjs(watch('to'))}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                        },
                      }}
                      onChange={(newValue) => {
                        setValue('to', newValue ? newValue.toISOString() : '', {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 11 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <Checkbox
                      checked={withItemDescription}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setWithItemDescription(isChecked);
                        setValue('with_item_description', isChecked, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                    With Items Description
                  </Div>
                </Grid>
              </>
            )}
            <Grid size={{ xs: 12 }} textAlign={'right'}>
              <Stack
                direction='row'
                spacing={0.5}
                justifyContent='flex-end'
                alignItems='center'
              >
                <LoadingButton
                  size='small'
                  onClick={() => handlExcelExport(exportedData)}
                  loading={isExporting}
                  disabled={isFetching}
                  variant='contained'
                  color='success'
                >
                  <FontAwesomeIcon icon={faFileExcel} color='green' />
                  Excel
                </LoadingButton>
                {!commingFilters && (
                  <LoadingButton
                    loading={isFetching}
                    type='submit'
                    size='small'
                    variant='contained'
                  >
                    Filter
                  </LoadingButton>
                )}
              </Stack>
            </Grid>
            <Grid size={12}>
              {transactions && isMobile && (
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant='fullWidth'
                >
                  <Tab label='On-Screen' />
                  <Tab label='PDF' />
                </Tabs>
              )}
            </Grid>
          </Grid>
        </form>
      </DialogTitle>
      <DialogContent>
        {isFetching ? (
          <div style={{ width: '100%', padding: '16px' }}>
            <Skeleton
              variant='text'
              width={180}
              height={32}
              style={{ borderRadius: 4, marginLeft: 'auto' }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={48}
              style={{ borderRadius: 4 }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={32}
              style={{ borderRadius: 4 }}
            />
          </div>
        ) : (
          transactions &&
          authOrganization &&
          user && (
            <>
              {isMobile && activeTab === 0 ? (
                <LedgerStatementOnScreen
                  transactionsData={transactions}
                  authOrganization={authOrganization}
                  increasesWith={
                    ledger?.increasesWith || commingFilters?.increasesWith
                  }
                />
              ) : (
                <PDFContent
                  document={
                    <ReportDocument
                      increasesWith={
                        ledger?.increasesWith || commingFilters?.increasesWith
                      }
                      transactionsData={transactions}
                      authOrganization={authOrganization}
                      user={user}
                      ledger={
                        ledger ? {
                          id: ledger.id,
                          name: ledger.name,
                          increasesWith: ledger.increasesWith,
                          currency: transactions.filters.ledger?.currency || ledger.currency,
                        } : undefined
                      }
                      ledgerName={ledgerName}
                    />
                  }
                  fileName={downloadFileName}
                />
              )}
            </>
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button size='small' variant='outlined' onClick={() => setOpen(false)}>
          Close
        </Button>
      </DialogActions>
    </React.Fragment>
  );
};

export default LedgerStatementDialogContent;