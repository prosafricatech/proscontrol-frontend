'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import pdfStyles from '@/components/pdf/pdf-styles';
import PDFContent from '@/components/pdf/PDFContent';
import PdfLogo from '@/components/pdf/PdfLogo';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import productServices from '@/components/productAndServices/products/productServices';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div, Span } from '@jumbo/shared';
import { HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Tab,
  Tabs,
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
import StoreSelector from '../../StoreSelector';
import { useStoreProfile } from '../StoreProfileProvider';
import ItemMovementOnScreen from './ItemMovementOnScreen';

const ReportDocument = ({
  movementsData,
  authObject,
  store,
  baseCurrency,
  financePersonnel,
}) => {
  const {
    authOrganization,
    authUser: { user },
  } = authObject;
  const { from, to, cost_centers, product } = movementsData.filters;
  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const lightColor =
    authOrganization.organization.settings?.light_color || '#bec5da';
  const contrastText =
    authOrganization.organization.settings?.contrast_text || '#FFFFFF';
  const reportPeriod = `${readableDate(from, true)} - ${readableDate(to, true)}`;

  const { movements } = movementsData;
  const [openingBalanceTx, ...restTransactions] = movements;

  const openingQty = openingBalanceTx?.quantity_in ?? 0;
  const openingAvgCost = openingBalanceTx?.average_cost ?? 0;
  const openingAmount = openingQty * openingAvgCost;

  let cumulativeQty = openingQty;

  const tableRows = [
    ...(openingBalanceTx
      ? [
          {
            date: openingBalanceTx.movement_date,
            reference: openingBalanceTx.reference,
            description: openingBalanceTx.description,
            inQty: null,
            inRate: null,
            inAmount: null,
            outQty: null,
            outRate: null,
            selling_price: openingBalanceTx.reference || null,
            outAmount: null,
            balanceQty: openingQty,
            avgCost: openingAvgCost || null,
            balanceAmount: openingAmount,
            isOpeningBalance: true,
          },
        ]
      : []),
    ...restTransactions.map((tx) => {
      const inAmt = tx.quantity_in * (tx.average_cost || 0);
      const outAmt =
        tx.quantity_out *
        (tx.selling_price !== null ? tx.selling_price : tx.average_cost || 0);
      cumulativeQty += tx.quantity_in - tx.quantity_out;
      return {
        date: tx.movement_date,
        reference: tx.reference,
        description: tx.description,
        inQty: tx.quantity_in || null,
        inRate: tx.quantity_in ? tx.average_cost : null,
        inAmount: tx.quantity_in ? inAmt : null,
        outQty: tx.quantity_out || null,
        outRate: tx.quantity_out ? tx.average_cost : null,
        selling_price: tx.selling_price || null,
        outAmount: tx.selling_price || tx.quantity_out ? outAmt : null,
        balanceQty: cumulativeQty,
        avgCost: tx.average_cost || null,
        balanceAmount: cumulativeQty * (tx.average_cost || 0),
        isOpeningBalance: false,
      };
    }),
  ];

  const totalInQty = restTransactions.reduce((s, tx) => s + tx.quantity_in, 0);
  const totalInAmount = restTransactions.reduce(
    (s, tx) => s + tx.quantity_in * (tx.average_cost || 0),
    0
  );
  const totalOutQty = restTransactions.reduce(
    (s, tx) => s + tx.quantity_out,
    0
  );
  const totalOutAmount = restTransactions.reduce(
    (s, tx) => s + tx.quantity_out * (tx.average_cost || 0),
    0
  );

  const fmtQty = (v) =>
    v == null
      ? '-'
      : v.toLocaleString('en-US', { maximumFractionDigits: 5 });
  const fmtAmtRow = (v) =>
    v == null
      ? '-'
      : v.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  const fmtAmtTotal = (v) =>
    v == null
      ? '-'
      : v.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  return movementsData ? (
    <Document
      creator={`ProsERP | ${user.name}`}
      title={`${product.name} movement ${reportPeriod}`}
      producer='ProsERP'
    >
      <Page size='A4' style={pdfStyles.page} orientation='landscape'>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text
                style={{ ...pdfStyles.majorInfo, color: mainColor }}
              >{`Inventory Item Movement`}</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{`${product.name}`}</Text>
              <Text style={{ ...pdfStyles.midInfo }}>{`${store.name}`}</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{`${reportPeriod}`}</Text>
            </View>
          </View>
        </View>
        <View
          style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}
        >
          {cost_centers.length > 0 && (
            <View style={{ flex: 2, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Cost Centers
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {cost_centers.map((cost_center) => cost_center.name).join(', ')}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed By
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{user.name}</Text>
          </View>
          {financePersonnel && (
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Currency
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>{baseCurrency.code}</Text>
            </View>
          )}
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
          {/* Header row 1 – group labels */}
          <View style={{ ...pdfStyles.tableRow, gap: 1.5 }}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                marginRight: 0,
                right: 0,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 1.37,
                width: '9.9%',
              }}
            >
              Date
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                marginRight: 0,
                right: 0,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 1.37,
                width: '9.8%',
              }}
            >
              Reference
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                marginRight: 0,
                right: 0,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 2.35,
                width: '14.7%',
              }}
            >
              Details
            </Text>
            {financePersonnel ? (
              <>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    marginRight: 0,
                    right: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    // flex: 3,
                    width: '20.1%',
                    textAlign: 'center',
                  }}
                >
                  INWARD
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    marginRight: 0,
                    right: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    // flex: 3,
                    width: '20%',
                    textAlign: 'center',
                  }}
                >
                  OUTWARD
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    marginRight: 0,
                    right: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    // flex: 3,
                    width: '25%',
                    textAlign: 'center',
                  }}
                >
                  BALANCE
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    marginRight: 0,
                    right: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    // flex: 1,
                    width: '20%',
                    textAlign: 'right',
                  }}
                >
                  Qty In
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    marginRight: 0,
                    right: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    // flex: 1,
                    width: '20%',
                    textAlign: 'right',
                  }}
                >
                  Qty Out
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    marginRight: 0,
                    right: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    // flex: 1.5,
                    width: '25%',
                    textAlign: 'right',
                  }}
                >
                  Balance
                </Text>
              </>
            )}
          </View>
          {/* Header row 2 – sub-labels (finance only) */}
          {financePersonnel && (
            <View style={{ ...pdfStyles.tableRow, gap: 1.5 }}>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: lightColor,
                  // flex: 1.5,
                  width: '10%',
                  fontWeight: 'bold',
                }}
              ></Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: lightColor,
                  // flex: 1.5,
                  width: '10%',
                  fontWeight: 'bold',
                }}
              ></Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: lightColor,
                  // flex: 2.5,
                  width: '15%',
                  fontWeight: 'bold',
                }}
              ></Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: lightColor,
                  // flex: 1,
                  width: '5%',
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                QNTY
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: lightColor,
                  // flex: 1,
                  width: '7%',
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                RATE
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: lightColor,
                  // flex: 1,
                  width: '8%',
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                AMOUNT
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: lightColor,
                  // flex: 1,
                  width: '5%',
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                QNTY
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: lightColor,
                  // flex: 1,
                  width: '7%',
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                RATE
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: lightColor,
                  // flex: 1,
                  width: '8%',
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                AMOUNT
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: lightColor,
                  // flex: 1,
                  width: '5%',
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                QNTY
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: lightColor,
                  // flex: 1,
                  width: '10%',
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                Avg Cost
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: lightColor,
                  // flex: 1,
                  width: '10%',
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                AMOUNT
              </Text>
            </View>
          )}
          {/* Data rows */}
          {tableRows.map((row, index) => (
            <View key={index} style={{ ...pdfStyles.tableRow, gap: 1.5 }}>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  // flex: 1.5,
                  width: '10%',
                }}
              >
                {readableDate(row.date)}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  // flex: 1.5,
                  width: '10%',
                }}
              >
                {row.reference}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginRight: 0,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  // flex: 2.5,
                  width: '15%',
                }}
              >
                {row.description}
              </Text>
              {financePersonnel ? (
                <>
                  {/* ===== INWARDS ===== */}
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      marginRight: 0,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      // flex: 1,
                      width: '5%',
                      textAlign: 'right',
                    }}
                  >
                    {row.isOpeningBalance ? '-' : fmtQty(row.inQty)}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      marginRight: 0,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      // flex: 1,
                      width: '7%',
                      textAlign: 'right',
                    }}
                  >
                    {row.isOpeningBalance ? '-' : fmtAmtRow(row.inRate)}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      marginRight: 0,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      // flex: 1,
                      width: '8%',
                      textAlign: 'right',
                    }}
                  >
                    {row.isOpeningBalance ? '-' : fmtAmtRow(row.inAmount)}
                  </Text>
                  {/* ===== OUTWARDS ===== */}
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      marginRight: 0,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      // flex: 1,
                      width: '5%',
                      textAlign: 'right',
                    }}
                  >
                    {row.isOpeningBalance ? '-' : fmtQty(row.outQty)}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      marginRight: 0,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      // flex: 1,
                      width: '7%',
                      textAlign: 'right',
                    }}
                  >
                    {row.isOpeningBalance
                      ? '-'
                      : row.selling_price !== null
                        ? fmtAmtRow(row.selling_price)
                        : fmtAmtRow(row.outRate)}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      marginRight: 0,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      // flex: 1,
                      width: '8%',
                      textAlign: 'right',
                    }}
                  >
                    {row.isOpeningBalance ? '-' : fmtAmtRow(row.outAmount)}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      marginRight: 0,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      // flex: 1,
                      width: '5%',
                      textAlign: 'right',
                    }}
                  >
                    {fmtQty(row.balanceQty)}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      marginRight: 0,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      // flex: 1,
                      width: '10%',
                      textAlign: 'right',
                    }}
                  >
                    {fmtAmtRow(row.avgCost)}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      marginRight: 0,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      // flex: 1,
                      width: '10%',
                      textAlign: 'right',
                    }}
                  >
                    {fmtAmtRow(row.balanceAmount)}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      marginRight: 0,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      // flex: 1,
                      width: '20%',
                      textAlign: 'right',
                    }}
                  >
                    {row.isOpeningBalance ? '-' : fmtQty(row.inQty)}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      marginRight: 0,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      // flex: 1,
                      width: '20%',
                      textAlign: 'right',
                    }}
                  >
                    {row.isOpeningBalance ? '-' : fmtQty(row.outQty)}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      marginRight: 0,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      // flex: 1.5,
                      width: '25%',
                      textAlign: 'right',
                      fontWeight: 'bold',
                    }}
                  >
                    {fmtQty(row.balanceQty)}
                  </Text>
                </>
              )}
            </View>
          ))}
          {/* TOTAL row */}
          <View style={{ ...pdfStyles.tableRow, gap: 1.5 }}>
            <Text
              style={{
                ...pdfStyles.tableCell,
                marginRight: 0,
                backgroundColor: mainColor,
                color: contrastText,
                fontWeight: 'bold',
                // flex: 5.69,
                width: '35.5%',
              }}
            >
              TOTAL
            </Text>
            {financePersonnel ? (
              <>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginRight: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    fontWeight: 'bold',
                    // flex: 1,
                    width: '5%',
                    textAlign: 'right',
                  }}
                >
                  {fmtQty(totalInQty)}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginRight: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    // flex: 1,
                    width: '7%',
                  }}
                ></Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginRight: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    fontWeight: 'bold',
                    // flex: 1,
                    width: '8%',
                    textAlign: 'right',
                  }}
                >
                  {fmtAmtTotal(totalInAmount)}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginRight: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    fontWeight: 'bold',
                    // flex: 1,
                    width: '5%',
                    textAlign: 'right',
                  }}
                >
                  {fmtQty(totalOutQty)}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginRight: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    // flex: 1,
                    width: '7%',
                  }}
                ></Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginRight: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    fontWeight: 'bold',
                    // flex: 1,
                    width: '8%',
                    textAlign: 'right',
                  }}
                >
                  {fmtAmtTotal(totalOutAmount)}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginRight: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    // flex: 1,
                    width: '5%',
                  }}
                ></Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginRight: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    // flex: 1,
                    width: '10%',
                  }}
                ></Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginRight: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    // flex: 1,
                    width: '10%',
                  }}
                ></Text>
              </>
            ) : (
              <>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginRight: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    fontWeight: 'bold',
                    // flex: 1,
                    width: '20%',
                    textAlign: 'right',
                  }}
                >
                  {fmtQty(totalInQty)}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginRight: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    fontWeight: 'bold',
                    // flex: 1,
                    width: '20%',
                    textAlign: 'right',
                  }}
                >
                  {fmtQty(totalOutQty)}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginRight: 0,
                    backgroundColor: mainColor,
                    color: contrastText,
                    // flex: 1.5,
                    width: '25%',
                  }}
                ></Text>
              </>
            )}
          </View>
        </View>
      </Page>
    </Document>
  ) : (
    ''
  );
};

function ItemMovement({ productStock = null, toggleOpen, isFromDashboard }) {
  const classes = useProsERPStyles();
  const [today] = useState(dayjs());
  const authObject = useJumboAuth();
  const { authOrganization, checkOrganizationPermission } = authObject;
  const { activeStore } = useStoreProfile();
  const { productOptions } = useProductsSelect();
  const [selectedTab, setSelectedTab] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [isDownloadingTemplate, setIsDownloadingTemplate] =
    React.useState(false);
  const [uploadFieldsKey, setUploadFieldsKey] = useState(0);

  const financePersonnel = checkOrganizationPermission([
    PERMISSIONS.ACCOUNTS_REPORTS,
    PERMISSIONS.STORE_VALUES,
  ]);

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const validationSchema = yup.object({
    isFromDashboard: yup.boolean(),
    product_id: yup
      .number()
      .required('Product is required')
      .positive('Product is required')
      .typeError('Product is required'),
    store_id: yup
      .number()
      .nullable()
      .when('isFromDashboard', (isFromDashboard, schema) =>
        isFromDashboard
          ? schema.required('Store is required').typeError('Store is required')
          : schema
      ),
  });

  const baseCurrency = authOrganization?.base_currency;

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      isFromDashboard: isFromDashboard || false,
      from: today.startOf('day').toISOString(),
      to: today.endOf('day').toISOString(),
      product_id: productStock?.id || null,
      store_id: isFromDashboard ? null : activeStore?.id,
      cost_center_ids: authOrganization?.costCenters.map((cc) => cc.id),
    },
  });

  const [isFetching, setisFetching] = useState(false);
  const [movements, setMovements] = useState([]);
  const [productName, setProductName] = useState(
    productStock ? productStock?.name : ''
  );
  const [isExporting, setIsExporting] = useState(false);

  const getMovements = async (filters) => {
    setisFetching(true);
    const movements = await productServices.getProductMovements(filters);
    setMovements(movements);
    setisFetching(false);
  };

  const exportedData = {
    movementsData: movements,
    authObject: authObject,
    store: isFromDashboard,
    baseCurrency: baseCurrency,
    financePersonnel: financePersonnel,
  };

  const handlExcelExport = async (exportedData) => {
    setIsExporting(true);
    try {
      const { from, to, product } = exportedData.movementsData.filters;
      const reportPeriod = `${readableDate(from, true)} - ${readableDate(to, true)}`;
      const blob = await productServices.exporItemMovement(exportedData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${product.name}-Movement-${reportPeriod}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  document.title = 'Item Movement Report';
  return (
    <React.Fragment>
      <DialogTitle textAlign={'center'}>
        <Span className={classes.hiddenOnPrint}>
          <form
            autoComplete='off'
            key={uploadFieldsKey}
            onSubmit={handleSubmit(getMovements)}
          >
            <Grid
              container
              columnSpacing={1}
              paddingTop={2}
              rowSpacing={1}
              alignItems={'center'}
              justifyContent={'center'}
            >
              <Grid size={12} container>
                <Grid size={belowLargeScreen ? 11 : 12}>
                  <Typography variant='h3'>{`${productName} Movement`}</Typography>
                </Grid>
                {belowLargeScreen && (
                  <Grid size={1}>
                    <Tooltip title='Close'>
                      <IconButton
                        size='small'
                        sx={{ mb: 1 }}
                        onClick={() => toggleOpen(false)}
                      >
                        <HighlightOff color='primary' />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                )}
              </Grid>
              {isFromDashboard && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <StoreSelector
                      allowSubStores={true}
                      label='Store'
                      proposedOptions={authOrganization?.stores}
                      frontError={errors.store_id}
                      onChange={(newValue) => {
                        setValue(`store`, newValue);
                        setValue(`store_id`, newValue ? newValue.id : '', {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <ProductSelect
                    label='Product'
                    defaultValue={productStock && productStock}
                    frontError={errors?.product_id}
                    excludeIds={productOptions
                      .filter((product) => product.type !== 'Inventory')
                      .map((product) => product.id)}
                    onChange={(newValue) => {
                      if (newValue) {
                        setProductName(newValue.name);
                        setValue('product_id', newValue.id, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      } else {
                        setProductName('');
                        setValue('product_id', null, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: isFromDashboard ? 6 : 3 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label='From (MM/DD/YYYY)'
                    value={dayjs(watch('from'))}
                    minDate={dayjs(
                      authOrganization?.organization.recording_start_date
                    )}
                    maxDate={dayjs(watch('to'))}
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
              <Grid size={{ xs: 12, md: isFromDashboard ? 6 : 3 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label='To (MM/DD/YYYY)'
                    value={dayjs(watch('to'))}
                    minDate={dayjs(watch('from'))}
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
              <Grid size={{ xs: 12, md: 12 }}>
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
              <Grid size={{ xs: 12, md: 12 }} textAlign={'right'}>
                <Stack
                  direction='row'
                  spacing={0.5}
                  justifyContent='flex-end'
                  alignItems='center'
                >
                  <>
                    <LoadingButton
                      size='small'
                      onClick={() => handlExcelExport(exportedData)}
                      loading={isExporting}
                      disabled={
                        (isFromDashboard && !watch('store_id')) ||
                        !watch('product_id') ||
                        isFetching
                      }
                      variant='contained'
                      color='success'
                    >
                      <FontAwesomeIcon icon={faFileExcel} color='green' />
                      Excel
                    </LoadingButton>
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
          {belowLargeScreen &&
            !isFetching &&
            movements?.movements?.length > 0 && (
              <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                indicatorColor='primary'
                textColor='primary'
              >
                <Tab label='On-Screen' />
                <Tab label='PDF' />
              </Tabs>
            )}
        </Span>
      </DialogTitle>
      <DialogContent>
        {isFetching && (
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
        )}
        {!isFetching && movements?.movements?.length > 0 && (
          <React.Fragment>
            {belowLargeScreen && selectedTab === 0 ? (
              <ItemMovementOnScreen
                movementsData={movements}
                authObject={authObject}
                baseCurrency={baseCurrency}
                store={isFromDashboard ? watch('store') : activeStore}
              />
            ) : (
              <PDFContent
                document={
                  <ReportDocument
                    financePersonnel={financePersonnel}
                    baseCurrency={baseCurrency}
                    movementsData={movements}
                    authObject={authObject}
                    store={isFromDashboard ? watch('store') : activeStore}
                  />
                }
                fileName={`${productName} Movement Report ${readableDate(movements?.filters?.from)}-${readableDate(movements?.filters?.to)}`}
              />
            )}
          </React.Fragment>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          sx={{ mt: 1 }}
          size='small'
          variant='outlined'
          onClick={() => toggleOpen(false)}
        >
          Close
        </Button>
      </DialogActions>
    </React.Fragment>
  );
}

export default ItemMovement;
