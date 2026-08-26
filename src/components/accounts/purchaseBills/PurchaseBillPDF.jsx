import React from 'react';
import { Text, View, Document, Page } from '@react-pdf/renderer';
import pdfStyles from '../../pdf/pdf-styles';
import PdfLogo from '../../pdf/PdfLogo';
import PageFooter from '../../pdf/PageFooter';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

const styles = pdfStyles;

const money = (value = 0) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function PurchaseBillPDF({ bill, organization }) {
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';
  const sourceNo = bill.source?.orderNo || bill.source?.grnNo || '';

  return (
    <Document
      title={bill.invoiceNo}
      author={`${bill.creator?.name}`}
      subject='PURCHASE BILL'
      creator='ProsERP'
      producer='ProsERP'
      keywords={bill.stakeholder?.name}
    >
      <Page size='A4' style={styles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>PURCHASE BILL</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{bill.invoiceNo}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginTop: 10 }}>
          <View style={{ ...pdfStyles.table, flex: 0.5 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Bill Date:</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{readableDate(bill.transaction_date)}</Text>
          </View>
          <View style={{ ...pdfStyles.table, flex: 0.5 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Supplier:</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{bill.stakeholder?.name}</Text>
          </View>
          {sourceNo && (
            <View style={{ ...pdfStyles.table, flex: 0.5 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Source Document:</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{sourceNo}</Text>
            </View>
          )}
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 10, marginTop: 5 }}>
          {bill.internal_reference && (
            <View style={{ ...pdfStyles.table, flex: 0.5 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Internal Reference:</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{bill.internal_reference}</Text>
            </View>
          )}
          {bill.supplier_reference && (
            <View style={{ ...pdfStyles.table, flex: 0.5 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Supplier Reference:</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{bill.supplier_reference}</Text>
            </View>
          )}
        </View>

        {!!bill.items?.length && (
          <View style={{ ...pdfStyles.table, minHeight: 40, marginTop: 10 }}>
            <View style={styles.tableRow}>
              <Text
                style={{
                  ...styles.tableCell,
                  ...styles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 5,
                }}
              >
                Item
              </Text>
              {bill.items.some((item) => item.quantity != null) && (
                <>
                  <Text
                    style={{
                      ...styles.tableCell,
                      ...styles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 2,
                      textAlign: 'right',
                    }}
                  >
                    Qty
                  </Text>
                  <Text
                    style={{
                      ...styles.tableCell,
                      ...styles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 2,
                      textAlign: 'right',
                    }}
                  >
                    Rate
                  </Text>
                </>
              )}
              <Text
                style={{
                  ...styles.tableCell,
                  ...styles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 2,
                  textAlign: 'right',
                }}
              >
                Amount
              </Text>
            </View>
            {bill.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text
                  style={{
                    ...styles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 5,
                  }}
                >
                  {item.product?.name || item.product?.item_name}
                </Text>
                {bill.items.some((i) => i.quantity != null) && (
                  <>
                    <Text
                      style={{
                        ...styles.tableCell,
                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 2,
                        textAlign: 'right',
                      }}
                    >
                      {item.quantity ?? ''}
                    </Text>
                    <Text
                      style={{
                        ...styles.tableCell,
                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 2,
                        textAlign: 'right',
                      }}
                    >
                      {item.rate != null ? money(item.rate) : ''}
                    </Text>
                  </>
                )}
                <Text
                  style={{
                    ...styles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 2,
                    textAlign: 'right',
                  }}
                >
                  {money(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {!!bill.adjustments?.length && (
          <View style={{ ...pdfStyles.table, minHeight: 40, marginTop: 10 }}>
            <View style={styles.tableRow}>
              <Text
                style={{
                  ...styles.tableCell,
                  ...styles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 3,
                }}
              >
                Ledger
              </Text>
              <Text
                style={{
                  ...styles.tableCell,
                  ...styles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 4,
                }}
              >
                Description
              </Text>
              <Text
                style={{
                  ...styles.tableCell,
                  ...styles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 2,
                }}
              >
                Type
              </Text>
              <Text
                style={{
                  ...styles.tableCell,
                  ...styles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 2,
                  textAlign: 'right',
                }}
              >
                Amount
              </Text>
            </View>
            {bill.adjustments.map((adjustment, index) => (
              <View key={adjustment.id} style={styles.tableRow}>
                <Text
                  style={{
                    ...styles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 3,
                  }}
                >
                  {adjustment.complement_ledger?.name}
                </Text>
                <Text
                  style={{
                    ...styles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 4,
                  }}
                >
                  {adjustment.description}
                </Text>
                <Text
                  style={{
                    ...styles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 2,
                  }}
                >
                  {adjustment.type}
                </Text>
                <Text
                  style={{
                    ...styles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 2,
                    textAlign: 'right',
                  }}
                >
                  {adjustment.type === 'deduction' ? '-' : '+'}
                  {money(adjustment.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}></View>
          <View style={{ ...pdfStyles.table, marginTop: 20, flex: 1 }}>
            <View style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, flex: 0.6 }}>Goods/Services Amount</Text>
              <Text style={{ ...styles.tableCell, flex: 0.4, textAlign: 'right' }}>{money(bill.amount)}</Text>
            </View>
            {!!bill.vat_amount && (
              <View style={styles.tableRow}>
                <Text style={{ ...styles.tableCell, flex: 0.6 }}>VAT</Text>
                <Text style={{ ...styles.tableCell, flex: 0.4, textAlign: 'right' }}>{money(bill.vat_amount)}</Text>
              </View>
            )}
            <View style={styles.tableRow}>
              <Text
                style={{
                  ...styles.tableCell,
                  ...styles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 0.6,
                }}
              >
                Net Payable to Supplier
              </Text>
              <Text
                style={{
                  ...styles.tableCell,
                  ...styles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 0.4,
                  textAlign: 'right',
                }}
              >
                {money(bill.net_amount)}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginTop: 50 }}>
          <View style={{ flex: 0.8 }}>
            {bill.narration && (
              <>
                <Text style={{ ...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>
                  Narration:
                </Text>
                <Text style={{ ...pdfStyles.minInfo }}>{bill.narration}</Text>
              </>
            )}
          </View>
          <View style={{ flex: 0.2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>
              Prepared By:
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{bill.creator?.name}</Text>
          </View>
        </View>
        <PageFooter />
      </Page>
    </Document>
  );
}

export default PurchaseBillPDF;
