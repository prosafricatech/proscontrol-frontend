import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import React from 'react';

interface ProductSalesReportRow {
  product_id: number;
  product_name: string;
  unit_symbol?: string | null;
  quantity_ordered: number;
  quantity_dispatched: number;
  amount_ordered: number;
  amount_dispatched: number;
  payment_received: number;
}

interface ReportTotals {
  quantity_ordered: number;
  quantity_dispatched: number;
  amount_ordered: number;
  amount_dispatched: number;
  payment_received: number;
}

interface ProductSalesReportPDFProps {
  organization: Organization;
  rows: ProductSalesReportRow[];
  totals: ReportTotals;
  from: string;
  to: string;
  baseCurrencyCode: string;
  printedBy?: string;
}

const formatQuantity = (value: number, unitSymbol?: string | null) =>
  `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}${
    unitSymbol ? ` ${unitSymbol}` : ''
  }`;

const formatAmount = (value: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function ProductSalesReportPDF({
  organization,
  rows,
  totals,
  from,
  to,
  baseCurrencyCode,
  printedBy,
}: ProductSalesReportPDFProps) {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  return (
    <Document
      title={`Product Sales Report | ${organization.name}`}
      creator={`${printedBy || ''} | Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page size='A4' orientation='landscape' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 15 }}>
          <View style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              PRODUCT SALES REPORT
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {dayjs(from).format('DD MMM YYYY HH:mm')} to {dayjs(to).format('DD MMM YYYY HH:mm')}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              Amounts in base currency ({baseCurrencyCode})
            </Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.table, marginTop: 10 }}>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.5 }}>
              Product
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.4, textAlign: 'right' }}>
              Qty Ordered
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.4, textAlign: 'right' }}>
              Qty Dispatched
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.4, textAlign: 'right' }}>
              Qty Undispatched
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.6, textAlign: 'right' }}>
              Amount Ordered
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.6, textAlign: 'right' }}>
              Amount Dispatched
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.6, textAlign: 'right' }}>
              Amount Undispatched
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.6, textAlign: 'right' }}>
              Payment Received
            </Text>
          </View>

          {rows.map((row, index) => (
            <View
              key={row.product_id}
              style={{
                ...pdfStyles.tableRow,
                backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#f0f0f0',
              }}
            >
              <Text style={{ ...pdfStyles.tableCell, flex: 2.5 }}>{row.product_name}</Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 1.4, textAlign: 'right' }}>
                {formatQuantity(row.quantity_ordered, row.unit_symbol)}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 1.4, textAlign: 'right' }}>
                {formatQuantity(row.quantity_dispatched, row.unit_symbol)}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 1.4, textAlign: 'right' }}>
                {formatQuantity(
                  row.quantity_ordered - row.quantity_dispatched,
                  row.unit_symbol
                )}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 1.6, textAlign: 'right' }}>
                {formatAmount(row.amount_ordered)}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 1.6, textAlign: 'right' }}>
                {formatAmount(row.amount_dispatched)}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 1.6, textAlign: 'right' }}>
                {formatAmount(row.amount_ordered - row.amount_dispatched)}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 1.6, textAlign: 'right' }}>
                {formatAmount(row.payment_received)}
              </Text>
            </View>
          ))}

          <View style={{ ...pdfStyles.tableRow, backgroundColor: '#d5d5d5' }}>
            <Text style={{ ...pdfStyles.tableHeader, flex: 2.5 }}>Total</Text>
            <Text style={{ ...pdfStyles.tableHeader, flex: 1.4, textAlign: 'right' }}>
              {totals.quantity_ordered.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, flex: 1.4, textAlign: 'right' }}>
              {totals.quantity_dispatched.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, flex: 1.4, textAlign: 'right' }}>
              {(totals.quantity_ordered - totals.quantity_dispatched).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, flex: 1.6, textAlign: 'right' }}>
              {formatAmount(totals.amount_ordered)}
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, flex: 1.6, textAlign: 'right' }}>
              {formatAmount(totals.amount_dispatched)}
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, flex: 1.6, textAlign: 'right' }}>
              {formatAmount(totals.amount_ordered - totals.amount_dispatched)}
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, flex: 1.6, textAlign: 'right' }}>
              {formatAmount(totals.payment_received)}
            </Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export default ProductSalesReportPDF;
