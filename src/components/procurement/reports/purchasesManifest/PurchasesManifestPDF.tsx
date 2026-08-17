'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';
import PageNumber from '@/components/pdf/PageNumber';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization, User } from '@/types/auth-types';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { useMemo } from 'react';

export interface PurchaseManifestItem {
  order_date: string;
  date_required: string | null;
  orderNo: string;
  product: {
    id: number;
    type: string;
    sku: string | null;
    brand: string | null;
    model: string | null;
    specifications: string | null;
    item_name: string;
    name: string;
  };
  measurement_unit: {
    id: number;
    name: string;
    symbol: string;
  };
  quantity_ordered: number;
  quantity_received: number;
  rate: number;
  currency: {
    id: number;
    name: string;
    symbol: string;
    code: string;
    exchangeRate: number;
  };
  vendor: {
    name: string;
  };
  status: string;
}

interface PurchasesManifestPDFProps {
  reportData: {
    filters: {
      cost_centers: Array<{
        id: number;
        name: string;
        code: string | null;
        type: string;
      }> | null;
      from: string;
      to: string;
      suppliers: Array<{
        id: number;
        name: string;
        type?: string | null;
      }> | null;
      status: string;
    };
    items: PurchaseManifestItem[];
  };
  organization?: Organization;
  user?: User;
}

const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontSize: 7,
    fontFamily: 'Helvetica',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleBlock: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 7.5,
    color: '#555555',
  },
  filterBand: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    borderWidth: 0.5,
    borderStyle: 'solid',
    borderColor: '#D0D0D0',
    borderRadius: 2,
    padding: 6,
    gap: 4,
  },
  filterItem: {
    width: '48%',
    marginBottom: 4,
  },
  filterItemFull: {
    width: '100%',
    marginBottom: 4,
  },
  filterLabel: {
    fontSize: 6,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#888888',
    marginBottom: 1.5,
  },
  filterValue: {
    fontSize: 7,
  },
  table: {
    display: 'table' as any,
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
  },
  headerCell: {
    padding: 3,
    fontSize: 6.5,
    fontWeight: 'bold',
    borderWidth: 0.5,
    borderStyle: 'solid',
  },
  cell: {
    padding: 3,
    fontSize: 6.2,
    borderWidth: 0.5,
    borderStyle: 'solid',
    borderColor: '#C5C5C5',
  },
  cellSecondary: {
    fontSize: 5.5,
    color: '#777777',
    marginTop: 1.5,
  },
  totalsSection: {
    marginTop: 10,
    // alignSelf: 'flex-end',
    width: '33%',
  },
  totalsRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomStyle: 'solid',
    borderBottomColor: '#D0D0D0',
  },
  totalsLabel: {
    flex: 1,
    fontSize: 8,
    fontWeight: 'bold',
  },
  totalsAmount: {
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
});

const fmt = (value: number) =>
  (value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtCurrency = (amount: number, symbol: string) =>
  `${symbol} ${fmt(amount)}`;

const getUserName = (user?: User) => {
  const u = user as any;
  if (u?.name) return u.name;
  if (u?.full_name) return u.full_name;
  const parts = [u?.first_name, u?.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : u?.email || '-';
};

const PurchasesManifestPDF = ({
  reportData,
  organization,
  user,
}: PurchasesManifestPDFProps) => {
  const mainColor = (organization as any)?.settings?.main_color || '#2113AD';
  const lightColor = (organization as any)?.settings?.light_color || '#d9dfef';
  const contrastText =
    (organization as any)?.settings?.contrast_text || '#FFFFFF';

  const { filters, items } = reportData;

  const currencyTotals: Record<string, { symbol: string; total: number }> =
    items.reduce(
      (acc, item) => {
        const code = item.currency?.code;
        const symbol = code || item.currency?.symbol || 'TZS';
        const amount = (item.quantity_ordered || 0) * (item.rate || 0);
        if (!acc[code]) acc[code] = { symbol, total: 0 };
        acc[code].total += amount;
        return acc;
      },
      {} as Record<string, { symbol: string; total: number }>
    );

  // total recevied
  const totalreceivedAmt = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const code = item.currency?.code;
        const symbol = code || item.currency?.symbol || 'TZS';
        const receivedAmt = (item.quantity_received || 0) * (item.rate || 0);
        if (!acc[code]) acc[code] = { symbol, total: 0 };
        acc[code].total += receivedAmt;
        return acc;
      },
      {} as Record<string, { symbol: string; total: number }>
    );
  }, [items]);

  // total recevied
  const totalPendingAmt = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const code = item.currency?.code;
        const symbol = code || item.currency?.symbol || 'TZS';
        const pendingAmt =
          ((item.quantity_ordered || 0) - (item.quantity_received || 0)) *
          (item.rate || 0);
        if (!acc[code]) acc[code] = { symbol, total: 0 };
        acc[code].total += pendingAmt;
        return acc;
      },
      {} as Record<string, { symbol: string; total: number }>
    );
  }, [items]);

  // Column flex weights
  const snFlex = 0.4;
  const orderNoFlex = 1.2;
  const datesFlex = 1.6;
  const productFlex = 2.5;
  const statusFlex = 1.0;
  const vendorFlex = 1.8;
  const qtyOrderedFlex = 1.0;
  const qtyReceivedFlex = 1.0;
  const rateFlex = 1.2;
  const totalFlex = 1.6;

  return (
    <Document
      title='Purchases Manifest Report'
      author={(organization as any)?.name}
      subject='Purchases Manifest'
    >
      <Page size='A4' orientation='landscape' style={styles.page}>
        {/* ---- Logo + Title header ---- */}
        <View style={styles.headerRow}>
          <View style={{ width: 100 }}>
            {organization && <PdfLogo organization={organization} />}
          </View>
          <View style={styles.titleBlock}>
            <Text style={{ ...styles.title, color: mainColor }}>
              PURCHASES MANIFEST REPORT
            </Text>
            <Text style={styles.subtitle}>
              {readableDate(filters.from)} — {readableDate(filters.to)}
            </Text>
          </View>
        </View>

        {/* ---- Filter info band ---- */}
        <View style={styles.filterBand}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Reporting Period</Text>
            <Text style={styles.filterValue}>
              {readableDate(filters.from)} — {readableDate(filters.to)}
            </Text>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Status Filter</Text>
            <Text style={styles.filterValue}>{filters.status || 'All'}</Text>
          </View>

          {filters.cost_centers && filters.cost_centers.length > 0 && (
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Cost Centers</Text>
              <Text style={styles.filterValue}>
                {filters.cost_centers.map((cc) => cc.name).join(', ')}
              </Text>
            </View>
          )}

          {filters.suppliers && filters.suppliers.length > 0 && (
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Suppliers / Vendors</Text>
              <Text style={styles.filterValue}>
                {filters.suppliers.map((s) => s.name).join(', ')}
              </Text>
            </View>
          )}

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Printed By</Text>
            <Text style={styles.filterValue}>{getUserName(user)}</Text>
          </View>
        </View>

        {/* ---- Table ---- */}
        <View style={styles.table}>
          {/* Column header row */}
          <View style={{ ...styles.tableRow, backgroundColor: mainColor }}>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: snFlex,
              }}
            >
              S/N
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: orderNoFlex,
              }}
            >
              Order No.
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: datesFlex,
              }}
            >
              Dates
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: productFlex,
              }}
            >
              Product Details
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: statusFlex,
              }}
            >
              Status
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: vendorFlex,
              }}
            >
              Supplier / Vendor
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: qtyOrderedFlex,
                textAlign: 'right',
              }}
            >
              Qty Ordered
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: qtyReceivedFlex,
                textAlign: 'right',
              }}
            >
              Qty Received
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: qtyReceivedFlex,
                textAlign: 'right',
              }}
            >
              Qty Pending
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: rateFlex,
                textAlign: 'right',
              }}
            >
              Rate
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: totalFlex,
                textAlign: 'right',
              }}
            >
              Ordered Amount
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: totalFlex,
                textAlign: 'right',
              }}
            >
              Received Amount
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: totalFlex,
                textAlign: 'right',
              }}
            >
              Pending Amount
            </Text>
          </View>

          {/* Data rows */}
          {items.map((item, index) => {
            const isEven = index % 2 === 0;
            const backgroundColor = isEven ? '#FFFFFF' : lightColor;
            const qtyPending =
              (item.quantity_ordered || 0) - (item.quantity_received || 0) >= 0
                ? (item.quantity_ordered || 0) - (item.quantity_received || 0)
                : 0;
            const itemAmount = (item.quantity_ordered || 0) * (item.rate || 0);
            const receivedAmt =
              (item.quantity_received || 0) * (item.rate || 0);
            const pendingAmt =
              ((item.quantity_ordered || 0) - (item.quantity_received || 0)) *
              (item.rate || 0);
            const isFullyReceived =
              item.status?.toLowerCase() === 'fully received';
            const statusColor = isFullyReceived ? '#2e7d32' : '#b45309';

            return (
              <View
                key={`pm-row-${index}`}
                style={{ ...styles.tableRow, backgroundColor }}
                wrap={false}
              >
                <Text style={{ ...styles.cell, flex: snFlex }}>
                  {index + 1}
                </Text>

                <Text
                  style={{
                    ...styles.cell,
                    flex: orderNoFlex,
                    fontWeight: 'bold',
                  }}
                >
                  {item.orderNo}
                </Text>

                <View style={{ ...styles.cell, flex: datesFlex }}>
                  <Text>Ordered: {readableDate(item.order_date)}</Text>
                  {item.date_required && (
                    <Text style={styles.cellSecondary}>
                      Required: {readableDate(item.date_required)}
                    </Text>
                  )}
                </View>

                <View style={{ ...styles.cell, flex: productFlex }}>
                  <Text>{item.product?.name || '-'}</Text>
                </View>

                <Text
                  style={{
                    ...styles.cell,
                    flex: statusFlex,
                    color: statusColor,
                    fontWeight: 'bold',
                  }}
                >
                  {item.status}
                </Text>

                <Text style={{ ...styles.cell, flex: vendorFlex }}>
                  {item.vendor?.name || '-'}
                </Text>

                <Text
                  style={{
                    ...styles.cell,
                    flex: qtyOrderedFlex,
                    textAlign: 'right',
                  }}
                >
                  {`${(item.quantity_ordered || 0).toLocaleString()} ${item.measurement_unit?.symbol || ''}`}
                </Text>

                <Text
                  style={{
                    ...styles.cell,
                    flex: qtyReceivedFlex,
                    textAlign: 'right',
                  }}
                >
                  {`${(item.quantity_received || 0).toLocaleString()} ${item.measurement_unit?.symbol || ''}`}
                </Text>

                <Text
                  style={{
                    ...styles.cell,
                    flex: qtyReceivedFlex,
                    textAlign: 'right',
                  }}
                >
                  {`${(qtyPending || 0).toLocaleString()} ${item.measurement_unit?.symbol || ''}`}
                </Text>

                <Text
                  style={{ ...styles.cell, flex: rateFlex, textAlign: 'right' }}
                >
                  {fmt(item.rate)}
                </Text>

                <Text
                  style={{
                    ...styles.cell,
                    flex: totalFlex,
                    textAlign: 'right',
                  }}
                >
                  {fmtCurrency(
                    itemAmount,
                    item.currency?.code || item.currency?.symbol || ''
                  )}
                </Text>

                <Text
                  style={{
                    ...styles.cell,
                    flex: totalFlex,
                    textAlign: 'right',
                  }}
                >
                  {fmtCurrency(
                    receivedAmt,
                    item.currency?.code || item.currency?.symbol || ''
                  )}
                </Text>

                <Text
                  style={{
                    ...styles.cell,
                    flex: totalFlex,
                    textAlign: 'right',
                  }}
                >
                  {fmtCurrency(
                    pendingAmt,
                    item.currency?.code || item.currency?.symbol || ''
                  )}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
          {/* ---- Currency totals ---- */}
          <View style={styles.totalsSection}>
            <View
              style={{
                ...styles.totalsRow,
                backgroundColor: mainColor,
                borderRadius: 2,
              }}
            >
              <Text style={{ ...styles.totalsLabel, color: contrastText }}>
                Total Ordered Amount
              </Text>
            </View>
            {Object.entries(currencyTotals).map(([code, { symbol, total }]) => (
              <View
                key={`pdf-pm-total-${code}`}
                style={{ ...styles.totalsRow, backgroundColor: lightColor }}
              >
                <Text style={{ ...styles.totalsLabel, color: mainColor }}>
                  {code}
                </Text>
                <Text style={{ ...styles.totalsAmount, color: mainColor }}>
                  {fmtCurrency(total, symbol)}
                </Text>
              </View>
            ))}
          </View>

          {/* ---- Total received amount ---- */}
          <View style={styles.totalsSection}>
            <View
              style={{
                ...styles.totalsRow,
                backgroundColor: mainColor,
                borderRadius: 2,
              }}
            >
              <Text style={{ ...styles.totalsLabel, color: contrastText }}>
                Total Received Amount
              </Text>
            </View>
            {Object.entries(totalreceivedAmt).map(
              ([code, { symbol, total }]) => (
                <View
                  key={`pdf-pm-total-${code}`}
                  style={{ ...styles.totalsRow, backgroundColor: lightColor }}
                >
                  <Text style={{ ...styles.totalsLabel, color: mainColor }}>
                    {code}
                  </Text>
                  <Text style={{ ...styles.totalsAmount, color: mainColor }}>
                    {fmtCurrency(total, symbol)}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* ---- Total pending amount ---- */}
          <View style={styles.totalsSection}>
            <View
              style={{
                ...styles.totalsRow,
                backgroundColor: mainColor,
                borderRadius: 2,
              }}
            >
              <Text style={{ ...styles.totalsLabel, color: contrastText }}>
                Total Pending Amount
              </Text>
            </View>
            {Object.entries(totalPendingAmt).map(
              ([code, { symbol, total }]) => (
                <View
                  key={`pdf-pm-total-${code}`}
                  style={{ ...styles.totalsRow, backgroundColor: lightColor }}
                >
                  <Text style={{ ...styles.totalsLabel, color: mainColor }}>
                    {code}
                  </Text>
                  <Text style={{ ...styles.totalsAmount, color: mainColor }}>
                    {fmtCurrency(total, symbol)}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>
        <PageFooter />
        <PageNumber />
      </Page>
    </Document>
  );
};

export default PurchasesManifestPDF;
