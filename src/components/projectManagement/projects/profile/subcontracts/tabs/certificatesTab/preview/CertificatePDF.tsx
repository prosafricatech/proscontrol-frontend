'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';

interface Creator {
  name?: string;
}

interface ComplementLedger {
  id?: string | number;
  name?: string;
}

interface Adjustment {
  id: number | string;
  description: string;
  type: string;
  amount: number;
  complement_ledger?: ComplementLedger;
}

interface Task {
  id: number | string;
  name: string;
  quantity?: number;
  rate?: number;
}

interface CertifiedItem {
  id?: number | string;
  task?: Task;
  previous_certified_quantity?: number;
  certified_quantity: number | string;
  rate?: number;
  measurement_unit?: MeasurementUnit;
}

interface Certificate {
  certificateNo: string;
  certificate_date: string;
  remarks?: string;
  creator?: Creator;
  currency?: Currency;
  amount: number;
  subcontractor?: {
    name?: string;
  };
  vat_percentage?: number;
  adjustments?: Adjustment[];
  items: CertifiedItem[];
}

interface CertificatePDFProps {
  certificate: Certificate;
  organization: Organization;
  openDetails: boolean;
}

type SummaryItem = {
  id: string | number;
  particular: string;
  amount: number;
  type?: string;
  complement_ledger?: ComplementLedger;
};

const CertificatePDF: React.FC<CertificatePDFProps> = ({
  certificate,
  organization,
  openDetails,
}) => {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';
  const currencyCode = certificate.currency?.code || 'TZS';

  const vatPercentage = certificate.vat_percentage || 0;
  const grossAmount = Number(certificate.amount) || 0;
  const vatAmount = (grossAmount * vatPercentage) / 100;

  const grossItem: SummaryItem = {
    id: 'gross',
    particular: 'Gross Amount Certified',
    amount: grossAmount,
  };

  const vatItem: SummaryItem | null =
    vatPercentage > 0
      ? {
          id: 'vat',
          particular: `VAT (${vatPercentage}%)`,
          amount: vatAmount,
        }
      : null;

  const adjustmentItems: SummaryItem[] = (certificate.adjustments || []).map(
    (adj) => ({
      id: adj.id,
      particular: adj.description,
      complement_ledger: adj.complement_ledger,
      type: adj.type,
      amount: adj.type === 'deduction' ? -adj.amount : adj.amount,
    })
  );

  const summaryItems: SummaryItem[] = [
    grossItem,
    ...adjustmentItems,
    ...(vatItem ? [vatItem] : []),
  ];

  const grandTotal = summaryItems.reduce((sum, item) => sum + item.amount, 0);

  const certifiedItems = certificate.items.map((it) => {
    const previousQty = it.previous_certified_quantity || 0;
    const presentQty = Number(it.certified_quantity) || 0;
    const cumulativeQty = previousQty + presentQty;
    const rate = it.rate || it.task?.rate || 0;

    return {
      id: `T${it.task?.id || ''}`,
      description: it.task?.name || '',
      unit: it.measurement_unit?.symbol || '',
      contractQty: it.task?.quantity || 0,
      unitRate: rate,
      contractAmount: (it.task?.quantity || 0) * rate,
      previousQty,
      presentQty,
      cumulativeQty,
      previousAmount: previousQty * rate,
      presentAmount: presentQty * rate,
      cumulativeAmount: cumulativeQty * rate,
    };
  });

  const totals = certifiedItems.reduce(
    (acc, item) => ({
      contractAmount: acc.contractAmount + (item.contractAmount || 0),
      previousAmount: acc.previousAmount + (item.previousAmount || 0),
      presentAmount: acc.presentAmount + (item.presentAmount || 0),
      cumulativeAmount: acc.cumulativeAmount + (item.cumulativeAmount || 0),
    }),
    {
      contractAmount: 0,
      previousAmount: 0,
      presentAmount: 0,
      cumulativeAmount: 0,
    }
  );

  return (
    <Document
      title={certificate.certificateNo}
      author={certificate.creator?.name || 'System'}
    >
      <Page
        size='A4'
        orientation={openDetails ? 'landscape' : 'portrait'}
        style={pdfStyles.page}
      >
        {/* ================= HEADER ================= */}
        <View
          style={{
            ...pdfStyles.tableRow,
            marginBottom: 20,
            justifyContent: 'space-between',
          }}
        >
          <View style={{ maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>

          <View style={{ textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              Certificate
            </Text>
            <Text style={pdfStyles.minInfo}>{certificate.certificateNo}</Text>
          </View>
        </View>

        {/* ================= INFO ================= */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20, gap: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Certificate Date
            </Text>
            <Text style={pdfStyles.minInfo}>
              {readableDate(certificate.certificate_date, false)}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              SubContractor
            </Text>
            <Text style={pdfStyles.minInfo}>
              {certificate?.subcontractor?.name}
            </Text>
          </View>

          {certificate.remarks && (
            <View style={{ flex: 1 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Remarks
              </Text>
              <Text style={pdfStyles.minInfo}>{certificate.remarks}</Text>
            </View>
          )}
        </View>

        {/* ================= SUMMARY ================= */}
        <View style={{ marginBottom: 40, marginTop: 20, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 12,
              color: mainColor,
              marginBottom: 8,
              fontWeight: 'bold',
            }}
          >
            Summary
          </Text>

          <View style={{ width: '100%', minWidth: 380 }}>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '10%',
                  }}
                >
                  S/N
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '70%',
                  }}
                >
                  Particulars
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '20%',
                    textAlign: 'right',
                  }}
                >
                  Amount ({currencyCode})
                </Text>
              </View>

              {summaryItems.map((item, index) => (
                <View key={item.id} style={pdfStyles.tableRow}>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 ? lightColor : '#FFF',
                      width: '10%',
                    }}
                  >
                    {index + 1}.
                  </Text>

                  <View
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      width: '70%',
                      flexDirection: 'column',
                    }}
                  >
                    <Text style={{ fontSize: 8 }}>{item.particular}</Text>

                    {'complement_ledger' in item &&
                      item.complement_ledger?.name && (
                        <Text style={{ fontSize: 6.5, color: '#555' }}>
                          ({item.complement_ledger.name})
                        </Text>
                      )}
                  </View>

                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 ? lightColor : '#FFF',
                      width: '20%',
                      textAlign: 'right',
                      fontSize: 7.5,
                      color:
                        'type' in item && item.type === 'deduction'
                          ? '#B00020'
                          : '#000',
                    }}
                  >
                    {item.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              ))}

              <View style={{ ...pdfStyles.tableRow, marginTop: 6 }}>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '80%',
                    textAlign: 'center',
                  }}
                >
                  Grand Total ({currencyCode})
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '20%',
                    textAlign: 'right',
                  }}
                >
                  {grandTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ==================== CERTIFIED ITEMS ==================== */}
        {openDetails && (
          <View break style={{ marginTop: 20 }}>
            <Text
              style={{
                fontSize: 12,
                color: mainColor,
                textAlign: 'center',
                marginBottom: 10,
              }}
            >
              Certified Items
            </Text>

            <View style={pdfStyles.table}>
              {/* Group Headers */}
              <View style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 4.32,
                  }}
                ></Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1.97,
                    textAlign: 'center',
                  }}
                >
                  Price Schedule
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 3.6,
                    textAlign: 'center',
                  }}
                >
                  Quantity
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 3.6,
                    textAlign: 'center',
                  }}
                >
                  Amount ({currencyCode})
                </Text>
              </View>

              {/* Sub Headers */}
              <View style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 0.5,
                  }}
                >
                  S/N
                </Text>
                <Text
                  style={{
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
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 0.7,
                  }}
                >
                  Unit
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1,
                  }}
                >
                  Qty
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1,
                  }}
                >
                  Unit Rate ({currencyCode})
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1,
                  }}
                >
                  Amount ({currencyCode})
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1.2,
                  }}
                >
                  Previous
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1.2,
                  }}
                >
                  Present
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1.2,
                  }}
                >
                  Cumulative
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1.2,
                  }}
                >
                  Previous
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1.2,
                  }}
                >
                  Present
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1.2,
                  }}
                >
                  Cumulative
                </Text>
              </View>

              {/* Body Rows */}
              {certifiedItems.map((item, index) => (
                <View key={item.id} style={pdfStyles.tableRow}>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                      flex: 0.5,
                    }}
                  >
                    {index + 1}.
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                      flex: 2,
                    }}
                  >
                    {item.description}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                      flex: 0.7,
                      textAlign: 'center',
                    }}
                  >
                    {item.unit}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                      flex: 1,
                      textAlign: 'right',
                    }}
                  >
                    {item.contractQty}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                      flex: 1,
                      textAlign: 'right',
                      fontSize: 7.5,
                    }}
                  >
                    {item.unitRate.toLocaleString()}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                      flex: 1,
                      textAlign: 'right',
                      fontSize: 7.5,
                    }}
                  >
                    {item.contractAmount.toLocaleString()}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                      flex: 1.2,
                      textAlign: 'right',
                    }}
                  >
                    {item.previousQty}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                      flex: 1.2,
                      textAlign: 'right',
                    }}
                  >
                    {item.presentQty}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                      flex: 1.2,
                      textAlign: 'right',
                    }}
                  >
                    {item.cumulativeQty}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                      flex: 1.2,
                      textAlign: 'right',
                      fontSize: 7.5,
                    }}
                  >
                    {item.previousAmount.toLocaleString()}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                      flex: 1.2,
                      textAlign: 'right',
                      fontSize: 7.5,
                    }}
                  >
                    {item.presentAmount.toLocaleString()}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                      flex: 1.2,
                      textAlign: 'right',
                      fontSize: 7.5,
                    }}
                  >
                    {item.cumulativeAmount.toLocaleString()}
                  </Text>
                </View>
              ))}

              {/* GRAND TOTAL ROW */}
              <View style={{ ...pdfStyles.tableRow, marginTop: 12 }}>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 5.9,
                    textAlign: 'right',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                >
                  GRAND TOTAL {currencyCode}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1,
                    textAlign: 'right',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                >
                  {totals.contractAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 3.9,
                  }}
                ></Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1.2,
                    textAlign: 'right',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                >
                  {totals.previousAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1.2,
                    textAlign: 'right',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                >
                  {totals.presentAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1.2,
                    textAlign: 'right',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                >
                  {totals.cumulativeAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ================= SIGNATURE ================= */}
        <View
          style={{
            marginTop: 40,
            flexDirection: 'row',
            justifyContent: 'flex-end',
          }}
        >
          <View style={{ width: 300 }}>
            <Text
              style={{
                ...pdfStyles.minInfo,
                color: mainColor,
                marginBottom: 10,
              }}
            >
              Prepared By:
            </Text>
            <Text
              style={{
                ...pdfStyles.minInfo,
                paddingTop: 5,
              }}
            >
              {certificate.creator?.name || ''}
            </Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
};

export default CertificatePDF;
