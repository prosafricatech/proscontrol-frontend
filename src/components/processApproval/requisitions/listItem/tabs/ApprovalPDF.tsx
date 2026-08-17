import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';
import PageNumber from '@/components/pdf/PageNumber';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization, User } from '@/types/auth-types';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { Requisition, RequisitionItem } from '../../../RequisitionType';

interface Creator {
  name: string;
}

interface Approval {
  id: number;
  approval_date: string;
  items: RequisitionItem[];
  additional_costs?: any[];
  requisition: Requisition;
  creator: Creator;
  remarks?: string;
  amount: number;
  vat_amount: number;
  status?: string;
  status_label?: string;
  returned_to_level?: { role?: { name?: string } } | null;
}

interface ApprovalPDFProps {
  approval: Approval;
  organization: Organization;
  requisition: Requisition;
  user?: Omit<User, 'phone' | 'status'>;
}

function ApprovalPDF({
  approval,
  organization,
  requisition,
  user,
}: ApprovalPDFProps) {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';
  const isPurchase = ['purchase', 'material'].includes(
    approval.requisition.process_type?.toLowerCase() || ''
  );
  const isMaterial =
    approval.requisition.process_type?.toLowerCase() === 'material';
  const isImprest =
    approval.requisition.process_type?.toLowerCase() === 'imprest';
  const additionalCosts = isPurchase
    ? ((approval.additional_costs ||
        (approval.requisition as any)?.additional_costs ||
        []) as any[])
    : [];
  const totalAdditionalCosts =
    additionalCosts.reduce(
      (total: number, cost: any) => total + Number(cost?.amount || 0),
      0
    ) || 0;

  const totalVAT =
    approval.items
      ?.filter((item: RequisitionItem) => (item.vat_percentage || 0) > 0)
      .reduce(
        (total: number, item: RequisitionItem) =>
          total + item.rate * item.quantity * (item.vat_percentage || 0) * 0.01,
        0
      ) || 0;

  const productsTotal =
    approval?.items?.reduce(
      (total, item) => total + (item.quantity || 0) * (item.rate || 0),
      0
    ) || 0;

  const grandTotal = productsTotal + totalVAT + totalAdditionalCosts;

  return (
    <Document
      title={`Approval`}
      subject='Approval'
      creator='ProsERP'
      producer='ProsERP'
    >
      <Page size='A4' style={pdfStyles.page}>
        {approval.status?.toLowerCase() === 'rejected' && (
          <View style={pdfStyles.watermark} fixed>
            <Text style={pdfStyles.watermarkText}>REJECTED</Text>
          </View>
        )}
        {approval.status?.toLowerCase() === 'returned' && (
          <View style={pdfStyles.watermark} fixed>
            <Text style={pdfStyles.watermarkText}>RETURNED</Text>
          </View>
        )}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View
            style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}
          >
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              {isMaterial
                ? 'Material Requisition Approval'
                : isPurchase
                  ? 'Purchase Requisition Approval'
                  : isImprest
                    ? 'Imprest Requisition Approval'
                    : 'Payment Requisition Approval'}
            </Text>
            <Text style={{ ...pdfStyles.midInfo }}>
              {approval.requisition.requisitionNo}
            </Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          <View style={{ flex: 1, padding: 0.5 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Approval Date
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {readableDate(approval.approval_date)}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 0.5 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Date Required
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {approval.requisition?.date_required
                ? readableDate(approval.requisition.date_required)
                : '-'}
            </Text>
          </View>
          {requisition?.cost_center.name && (
            <View style={{ flex: 1, padding: 0.5 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Cost Center
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {requisition?.cost_center.name}
              </Text>
            </View>
          )}
        </View>

        {approval.status?.toLowerCase() === 'returned' && (
          <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
            <View style={{ flex: 1, padding: 0.5 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Returned To
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {approval.returned_to_level?.role?.name || 'Requester'}
              </Text>
            </View>
          </View>
        )}

        <View style={{ ...pdfStyles.table, minHeight: 150, marginBottom: 50 }}>
          <>
            <View style={pdfStyles.tableRow}>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 0.05,
                }}
              >
                S/N
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 0.35,
                }}
              >
                {isPurchase || isMaterial ? 'Product' : 'Ledger'}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 0.2,
                }}
              >
                Quantity
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 0.2,
                }}
              >
                Rate
              </Text>
              {isPurchase && approval.vat_amount > 0 && (
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 0.2,
                  }}
                >
                  VAT
                </Text>
              )}
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 0.2,
                }}
              >
                Amount
              </Text>
            </View>

            {approval.items?.map((item, index) => {
              const isCreditItem =
                item.credit_ledger_id !== null &&
                item.credit_ledger_id !== undefined;
              const mainLedgerName =
                isPurchase || isMaterial
                  ? item.requisition_product?.product?.name
                  : item.requisition_ledger_item?.ledger?.name;
              const creditLedgerName = item.credit_ledger?.name;

              return (
                <React.Fragment key={item.id}>
                  <View style={pdfStyles.tableRow}>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 0.05,
                      }}
                    >
                      {index + 1}.
                    </Text>
                    <View
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 0.35,
                        flexDirection: 'column',
                      }}
                    >
                      <Text>{mainLedgerName}</Text>
                      {isCreditItem && creditLedgerName && (
                        <Text
                          style={{ fontSize: 8, color: '#666', marginTop: 2 }}
                        >
                          ({creditLedgerName})
                        </Text>
                      )}
                      {item.relatableNo && <Text>{`${item.relatableNo}`}</Text>}
                      {item.remarks && <Text>{`(${item.remarks})`}</Text>}
                    </View>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 0.2,
                        textAlign: 'right',
                      }}
                    >
                      {item.quantity?.toLocaleString()}{' '}
                      {item.measurement_unit?.symbol ||
                        item.requisition_ledger_item?.measurement_unit?.symbol}
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 0.2,
                        textAlign: 'right',
                      }}
                    >
                      {item.rate?.toLocaleString()}
                    </Text>
                    {isPurchase && approval.vat_amount > 0 && (
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 0.2,
                          textAlign: 'right',
                        }}
                      >
                        {(
                          item.rate * (item.vat_percentage || 0) * 0.01 || 0
                        ).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </Text>
                    )}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 0.2,
                        textAlign: 'right',
                      }}
                    >
                      {(
                        item.quantity *
                        item.rate *
                        (1 + (item.vat_percentage || 0) * 0.01)
                      ).toLocaleString('en-US', {
                        style: 'currency',
                        currency: approval.requisition.currency?.code,
                      })}
                    </Text>
                  </View>

                  {Array.isArray(item?.vendors) && item.vendors.length > 0 && (
                    <React.Fragment>
                      <View style={pdfStyles.tableRow}>
                        <Text
                          style={{ ...pdfStyles.tableCell, flex: 0.05 }}
                        ></Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            flex: 0.95,
                            textAlign: 'center',
                          }}
                        >
                          Vendors
                        </Text>
                      </View>

                      {item.vendors?.map((vendor, i) => (
                        <View key={vendor.id} style={{ ...pdfStyles.tableRow }}>
                          <Text
                            style={{ ...pdfStyles.tableCell, flex: 0.05 }}
                          ></Text>
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              flex: 0.58,
                              paddingLeft: 10,
                              backgroundColor:
                                i % 2 === 0 ? '#FFFFFF' : lightColor,
                            }}
                          >
                            {vendor.name}
                          </Text>
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              flex: 0.42,
                              paddingLeft: 10,
                              backgroundColor:
                                i % 2 === 0 ? '#FFFFFF' : lightColor,
                            }}
                          >
                            {vendor.remarks}
                          </Text>
                        </View>
                      ))}
                      <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
                        <Text style={{ flex: 1 }}></Text>
                      </View>
                    </React.Fragment>
                  )}
                </React.Fragment>
              );
            })}
          </>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 4 }}>
          <Text style={{ flex: 4.5 }}></Text>
          <Text
            style={{
              ...pdfStyles.tableHeader,
              backgroundColor: mainColor,
              color: contrastText,
              flex: 2,
              textAlign: 'left',
            }}
          >
            Total
          </Text>
          <Text
            style={{
              ...pdfStyles.tableHeader,
              backgroundColor: mainColor,
              color: contrastText,
              flex: 2.2,
              textAlign: 'right',
            }}
          >
            {productsTotal.toLocaleString('en-US', {
              style: 'currency',
              currency: approval.requisition.currency?.code,
            })}
          </Text>
        </View>

        {isPurchase &&
          additionalCosts.length > 0 &&
          additionalCosts.map((cost: any, index: number) => {
            const costLabel =
              cost.credit_ledger_name ||
              cost.ledger?.name ||
              cost.name ||
              `Additional Cost ${index + 1}`;
            const currencyCode =
              cost.currency?.code ||
              cost.currency_name ||
              approval.requisition.currency?.code ||
              '';
            return (
              <View
                key={cost.id || cost.requisition_additional_cost_id || index}
                style={{ ...pdfStyles.tableRow, marginBottom: 4 }}
              >
                <Text style={{ flex: 4.5 }}></Text>
                <Text
                  hyphenationCallback={(word) => [word]}
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 2,
                    textAlign: 'left',
                    lineHeight: 1.25,
                  }}
                >
                  {costLabel}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 2.2,
                    textAlign: 'right',
                  }}
                >
                  {`${currencyCode} ${Number(cost.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`.trim()}
                </Text>
              </View>
            );
          })}

        {isPurchase && (totalVAT > 0 || totalAdditionalCosts > 0) && (
          <>
            {totalVAT > 0 && (
              <View style={{ ...pdfStyles.tableRow, marginBottom: 4 }}>
                <Text style={{ flex: 4.5 }}></Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 2,
                    textAlign: 'left',
                  }}
                >
                  VAT
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 2.2,
                    textAlign: 'right',
                  }}
                >
                  {totalVAT.toLocaleString('en-US', {
                    style: 'currency',
                    currency: approval.requisition.currency?.code,
                  })}
                </Text>
              </View>
            )}
            <View style={{ ...pdfStyles.tableRow, marginBottom: 4 }}>
              <Text style={{ flex: 4.5 }}></Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 2,
                  textAlign: 'left',
                }}
              >
                Grand Total
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 2.2,
                  textAlign: 'right',
                }}
              >
                {grandTotal.toLocaleString('en-US', {
                  style: 'currency',
                  currency: approval.requisition.currency?.code,
                })}
              </Text>
            </View>
          </>
        )}

        {approval.remarks && (
          <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
            <View style={{ flex: 1, padding: 0.5 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Remarks
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>{approval.remarks}</Text>
            </View>
          </View>
        )}

        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          <View style={{ flex: 1, padding: 0.5 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Requested By:
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {approval.requisition.creator.name}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 0.5 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Approved By:
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {approval.creator?.name}
            </Text>
          </View>
        </View>

        <View
          style={{
            ...pdfStyles.tableRow,
            marginBottom: 10,
            position: 'absolute',
            bottom: 20,
            width: '100%',
            borderBottomColor: 'black',
            borderBottomWidth: 1,
          }}
        >
          <View style={{ flex: 1, padding: 0.5, flexDirection: 'row' }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed By:
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {user ? user?.name : '-'}
            </Text>
          </View>

          <View style={{ flex: 1, padding: 0.5, flexDirection: 'row' }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed On:
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {readableDate(undefined, true)}
            </Text>
          </View>
        </View>

        <PageFooter />
        <PageNumber />
      </Page>
    </Document>
  );
}

export default ApprovalPDF;
