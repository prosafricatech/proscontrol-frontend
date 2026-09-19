'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';

interface FuelSoldByProductRow {
  station_id: number;
  station_name: string;
  product_id: number;
  product_name: string;
  unit_symbol: string;
  quantity: number;
  value: number;
  avg_price: number;
}

interface CashCreditSummaryRow {
  station_id: number;
  station_name: string;
  shifts: number;
  total_fuel_value: number;
  credit_sales: number;
  mpesa_bank_collected: number;
  cash_expected: number;
  cash_collected: number;
  short_over: number;
  payments_received: number;
}

interface ShiftDetailRow {
  shift_id: number;
  shiftNo: string;
  team_name: string | null;
  station_id: number;
  station_name: string;
  shift_start: string;
  shift_end: string;
  status: string;
  cashiers: number;
  total_fuel_value: number;
  credit_sales: number;
  mpesa_bank_collected: number;
  cash_expected: number;
  cash_collected: number;
  short_over: number;
  payments_received: number;
  balance_status: 'balanced' | 'over' | 'short';
}

interface ShiftsSummaryReportData {
  fuel_sold_by_product: FuelSoldByProductRow[];
  cash_credit_summary: CashCreditSummaryRow[];
  shift_detail: ShiftDetailRow[];
}

interface ShiftsSummaryReportPDFProps {
  reportData: ShiftsSummaryReportData;
  organization: any;
  user: any;
  from: string;
  to: string;
}

const numberFormat = (value?: number) =>
  (value ?? 0).toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

const ShiftsSummaryReportPDF: React.FC<ShiftsSummaryReportPDFProps> = ({
  reportData,
  organization,
  user,
  from,
  to,
}) => {
  const reportPeriod = `${readableDate(from, true)} to ${readableDate(to, true)}`;
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const fuelSoldByProduct = reportData.fuel_sold_by_product || [];
  const cashCreditSummary = reportData.cash_credit_summary || [];
  const shiftDetail = reportData.shift_detail || [];

  const shortOverColor = (value: number) => {
    if (Math.abs(value) < 0.01) return undefined;
    return value < 0 ? '#c62828' : '#2e7d32';
  };

  const products: { product_id: number; product_name: string; unit_symbol: string }[] = [];
  const seenProducts = new Set<number>();
  fuelSoldByProduct.forEach((row) => {
    if (!seenProducts.has(row.product_id)) {
      seenProducts.add(row.product_id);
      products.push({
        product_id: row.product_id,
        product_name: row.product_name,
        unit_symbol: row.unit_symbol,
      });
    }
  });

  const stations: { station_id: number; station_name: string }[] = [];
  const seenStations = new Set<number>();
  fuelSoldByProduct.forEach((row) => {
    if (!seenStations.has(row.station_id)) {
      seenStations.add(row.station_id);
      stations.push({ station_id: row.station_id, station_name: row.station_name });
    }
  });

  const fuelSoldPivot: Record<number, Record<number, FuelSoldByProductRow>> = {};
  fuelSoldByProduct.forEach((row) => {
    if (!fuelSoldPivot[row.station_id]) fuelSoldPivot[row.station_id] = {};
    fuelSoldPivot[row.station_id][row.product_id] = row;
  });

  const productTotals: Record<number, { quantity: number; value: number }> = {};
  products.forEach((product) => {
    productTotals[product.product_id] = { quantity: 0, value: 0 };
  });
  fuelSoldByProduct.forEach((row) => {
    productTotals[row.product_id].quantity += row.quantity || 0;
    productTotals[row.product_id].value += row.value || 0;
  });

  const fuelSoldTotal = fuelSoldByProduct.reduce((acc, row) => acc + (row.value || 0), 0);

  // react-pdf's `flex: X` sizes a cell to X (as a fraction of the row's container width),
  // not a relative grow-ratio — so a row's flex values MUST sum to exactly 1 or the row
  // (and everything below/above it in that same table) stops short of the page width,
  // leaving a gap. stationFlex + totalAmountFlex + (perProductFlex * products.length)
  // always equals 1 regardless of how many products are present.
  const stationFlex = 0.18;
  const totalAmountFlex = 0.12;
  const productsFlexBudget = 1 - stationFlex - totalAmountFlex;
  const perProductFlex = products.length > 0 ? productsFlexBudget / products.length : 0;
  const tripletFlex = {
    qty: perProductFlex * 0.34,
    price: perProductFlex * 0.28,
    amount: perProductFlex * 0.38,
  };

  const cashCreditTotals = cashCreditSummary.reduce(
    (acc, row) => {
      acc.shifts += row.shifts || 0;
      acc.total_fuel_value += row.total_fuel_value || 0;
      acc.credit_sales += row.credit_sales || 0;
      acc.mpesa_bank_collected += row.mpesa_bank_collected || 0;
      acc.cash_expected += row.cash_expected || 0;
      acc.cash_collected += row.cash_collected || 0;
      acc.short_over += row.short_over || 0;
      acc.payments_received += row.payments_received || 0;
      return acc;
    },
    {
      shifts: 0,
      total_fuel_value: 0,
      credit_sales: 0,
      mpesa_bank_collected: 0,
      cash_expected: 0,
      cash_collected: 0,
      short_over: 0,
      payments_received: 0,
    }
  );

  return (
    <Document
      creator={`${user?.name} | Powered By ProsERP`}
      producer='ProsERP'
      title={`Shifts Summary Report ${reportPeriod}`}
    >
      <Page size='A4' orientation='landscape' style={pdfStyles.page}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Shifts Summary Report</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{reportPeriod}</Text>
            </View>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginTop: 10 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed By</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{user?.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed On</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{readableDate(undefined, true)}</Text>
          </View>
        </View>

        {/* Fuel Sold by Product Table — pivoted: one row per station, Qty/Avg Price/Amount per product */}
        {fuelSoldByProduct.length > 0 && (
          <View style={{ width: '100%', marginTop: 15 }}>
            <View style={{ ...pdfStyles.tableRow }}>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, flex: 1, color: contrastText, textAlign: 'center' }}>Fuel Sold by Product</Text>
            </View>
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: stationFlex, marginRight: 0 }} />
              {products.map((product) => (
                <Text
                  key={product.product_id}
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: tripletFlex.qty + tripletFlex.price + tripletFlex.amount,
                    textAlign: 'center',
                    marginRight: 0,
                  }}
                >
                  {product.product_name}
                </Text>
              ))}
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: totalAmountFlex, marginRight: 0 }} />
            </View>
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: stationFlex, marginRight: 0 }}>Station</Text>
              {products.map((product) => (
                <React.Fragment key={product.product_id}>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: tripletFlex.qty, textAlign: 'right', marginRight: 0 }}>{`Qty (${product.unit_symbol})`}</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: tripletFlex.price, textAlign: 'right', marginRight: 0 }}>Price</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: tripletFlex.amount, textAlign: 'right', marginRight: 0 }}>Amount</Text>
                </React.Fragment>
              ))}
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: totalAmountFlex, textAlign: 'right', marginRight: 0 }}>Total</Text>
            </View>
            {stations.map((station, index) => {
              const stationTotal = products.reduce(
                (sum, product) => sum + (fuelSoldPivot[station.station_id]?.[product.product_id]?.value || 0),
                0
              );
              return (
                <View key={station.station_id} style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: stationFlex, marginRight: 0 }}>{station.station_name}</Text>
                  {products.map((product) => {
                    const cell = fuelSoldPivot[station.station_id]?.[product.product_id];
                    return (
                      <React.Fragment key={product.product_id}>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: tripletFlex.qty, textAlign: 'right', marginRight: 0 }}>{cell ? numberFormat(cell.quantity) : '-'}</Text>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: tripletFlex.price, textAlign: 'right', marginRight: 0 }}>{cell ? numberFormat(cell.avg_price) : '-'}</Text>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: tripletFlex.amount, textAlign: 'right', marginRight: 0 }}>{cell ? numberFormat(cell.value) : '-'}</Text>
                      </React.Fragment>
                    );
                  })}
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: totalAmountFlex, textAlign: 'right', marginRight: 0 }}>{numberFormat(stationTotal)}</Text>
                </View>
              );
            })}
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: stationFlex, marginRight: 0 }}>Total</Text>
              {products.map((product) => (
                <React.Fragment key={product.product_id}>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: tripletFlex.qty, textAlign: 'right', marginRight: 0 }}>{numberFormat(productTotals[product.product_id].quantity)}</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: tripletFlex.price, marginRight: 0 }} />
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: tripletFlex.amount, textAlign: 'right', marginRight: 0 }}>{numberFormat(productTotals[product.product_id].value)}</Text>
                </React.Fragment>
              ))}
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: totalAmountFlex, textAlign: 'right', marginRight: 0 }}>{numberFormat(fuelSoldTotal)}</Text>
            </View>
          </View>
        )}

        {/* Cash & Credit Summary Table */}
        {cashCreditSummary.length > 0 && (
          <View style={{ width: '100%', marginTop: 15 }}>
            <View style={{ ...pdfStyles.tableRow }}>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, flex: 1, color: contrastText, textAlign: 'center' }}>Cash &amp; Credit Summary</Text>
            </View>
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.15 }}>Station</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.06, textAlign: 'right' }}>Shifts</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.11, textAlign: 'right' }}>Fuel Value</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.11, textAlign: 'right' }}>Fuel Vouchers</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.11, textAlign: 'right' }}>Cashless</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.11, textAlign: 'right' }}>Cash Expected</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.11, textAlign: 'right' }}>Cash Collected</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.1, textAlign: 'right' }}>Short/Over</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.14, textAlign: 'right' }}>Payments Received</Text>
            </View>
            {cashCreditSummary.map((row, index) => (
              <View key={row.station_id} style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.15 }}>{row.station_name}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.06, textAlign: 'right' }}>{row.shifts}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.11, textAlign: 'right' }}>{numberFormat(row.total_fuel_value)}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.11, textAlign: 'right' }}>{numberFormat(row.credit_sales)}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.11, textAlign: 'right' }}>{numberFormat(row.mpesa_bank_collected)}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.11, textAlign: 'right' }}>{numberFormat(row.cash_expected)}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.11, textAlign: 'right' }}>{numberFormat(row.cash_collected)}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.1, textAlign: 'right', color: shortOverColor(row.short_over), fontWeight: 'bold' }}>{numberFormat(row.short_over)}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.14, textAlign: 'right' }}>{numberFormat(row.payments_received)}</Text>
              </View>
            ))}
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.21, textAlign: 'center' }}>Total</Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.11, textAlign: 'right' }}>{numberFormat(cashCreditTotals.total_fuel_value)}</Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.11, textAlign: 'right' }}>{numberFormat(cashCreditTotals.credit_sales)}</Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.11, textAlign: 'right' }}>{numberFormat(cashCreditTotals.mpesa_bank_collected)}</Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.11, textAlign: 'right' }}>{numberFormat(cashCreditTotals.cash_expected)}</Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.11, textAlign: 'right' }}>{numberFormat(cashCreditTotals.cash_collected)}</Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: shortOverColor(cashCreditTotals.short_over) || contrastText, flex: 0.1, textAlign: 'right', fontWeight: 'bold' }}>{numberFormat(cashCreditTotals.short_over)}</Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.14, textAlign: 'right' }}>{numberFormat(cashCreditTotals.payments_received)}</Text>
            </View>
          </View>
        )}

        {/* Shift Detail Table */}
        {shiftDetail.length > 0 && (
          <View style={{ width: '100%', marginTop: 15 }}>
            <View style={{ ...pdfStyles.tableRow }}>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, flex: 1, color: contrastText, textAlign: 'center' }}>Shift Detail</Text>
            </View>
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.13 }}>Shift No</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.13 }}>Station</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.21 }}>Shift</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.07, textAlign: 'right' }}>Cashiers</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.13, textAlign: 'right' }}>Fuel Value</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.13, textAlign: 'right' }}>Cash Collected</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.1, textAlign: 'right' }}>Short/Over</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.1, textAlign: 'center' }}>Status</Text>
            </View>
            {shiftDetail.map((row, index) => (
              <View key={row.shift_id} style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.13 }}>{row.shiftNo}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.13 }}>{row.station_name}</Text>
                <View style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.21, padding: 2, marginRight: 1 }}>
                  <Text style={{ fontSize: '8px', fontWeight: 'bold' }}>{row.team_name || '-'}</Text>
                  <Text style={{ fontSize: '7px', color: '#555555' }}>{`${readableDate(row.shift_start)} - ${readableDate(row.shift_end)}`}</Text>
                </View>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.07, textAlign: 'right' }}>{row.cashiers}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.13, textAlign: 'right' }}>{numberFormat(row.total_fuel_value)}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.13, textAlign: 'right' }}>{numberFormat(row.cash_collected)}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.1, textAlign: 'right', color: shortOverColor(row.short_over), fontWeight: 'bold' }}>{numberFormat(row.short_over)}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.1, textAlign: 'center', color: shortOverColor(row.short_over) }}>{row.balance_status?.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ShiftsSummaryReportPDF;
