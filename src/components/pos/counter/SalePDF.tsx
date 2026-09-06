import { Document, Page, Text, View } from '@react-pdf/renderer'
import React from 'react'
import pdfStyles from '../../pdf/pdf-styles'
import PdfLogo from '../../pdf/PdfLogo';
import DocumentStakeholders from '../../pdf/DocumentStakeholders';
import PageFooter from '../../pdf/PageFooter';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Organization } from '@/types/auth-types';
import { SalesOrder } from './SalesOrderType';

interface SaleReceipt {
  id: number;
  voucherNo: string;
  transaction_date: string;
  narration?: string;
  debit_ledger?: {
    name: string;
  };
  amount: number;
}

interface SalePDFProps {
  sale: SalesOrder;
  organization: Organization;
  thermalPrinter?: boolean;
  showStatement?: boolean;
  saleReceipts?: SaleReceipt[];
}

const SalePDF: React.FC<SalePDFProps> = ({ sale, organization, thermalPrinter = false, showStatement = false, saleReceipts }) => {
    const currencyCode = sale.currency?.code;
    const mainColor = organization.settings?.main_color || "#2113AD";
    const lightColor = organization.settings?.light_color || "#bec5da";
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";
    const grandTotal = sale.amount + sale.vat_amount;

    let runningBalance = grandTotal;
    const statementRows = showStatement ? (saleReceipts || []).map((receipt) => {
        runningBalance -= receipt.amount;
        return { ...receipt, balance: runningBalance };
    }) : [];

    const OrderStatementA4 = () => (
        <View style={{...pdfStyles.table, marginTop: 15}}>
            <Text style={{...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, textAlign: 'center' }}>
                ORDER STATEMENT
            </Text>
            <View style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, flex: 1.3 }}>Date</Text>
                <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, flex: 1.3 }}>Receipt No.</Text>
                <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, flex: 1.5 }}>Received In</Text>
                <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, flex: 1.7, textAlign: 'right' }}>Amount</Text>
                <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, flex: 1.7, textAlign: 'right' }}>Balance</Text>
            </View>
            <View style={{ ...pdfStyles.tableRow, borderTop: '1px', borderTopStyle: 'solid' }}>
                <Text style={{ ...pdfStyles.tableCell, flex: 5.1, fontStyle: 'italic' }}>Order Amount</Text>
                <Text style={{ ...pdfStyles.tableCell, flex: 1.7, textAlign: 'right' }}>
                    {grandTotal.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}
                </Text>
            </View>
            {statementRows.map((row) => (
                <View key={row.id} style={{ ...pdfStyles.tableRow, borderTop: '1px', borderTopStyle: 'solid' }}>
                    <Text style={{ ...pdfStyles.tableCell, flex: 1.3 }}>{readableDate(row.transaction_date)}</Text>
                    <Text style={{ ...pdfStyles.tableCell, flex: 1.3 }}>{row.voucherNo}</Text>
                    <Text style={{ ...pdfStyles.tableCell, flex: 1.5 }}>{row.debit_ledger?.name || 'N/A'}</Text>
                    <Text style={{ ...pdfStyles.tableCell, flex: 1.7, textAlign: 'right' }}>
                        {row.amount.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}
                    </Text>
                    <Text style={{ ...pdfStyles.tableCell, flex: 1.7, textAlign: 'right' }}>
                        {row.balance.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}
                    </Text>
                </View>
            ))}
            {statementRows.length === 0 && (
                <View style={{ ...pdfStyles.tableRow, borderTop: '1px', borderTopStyle: 'solid' }}>
                    <Text style={{ ...pdfStyles.tableCell, flex: 1 }}>No Receipts Found</Text>
                </View>
            )}
        </View>
    );

    // Narrow (80mm) receipts can't fit a 5-column table, so each receipt is
    // stacked as label/value rows, matching the SaleReceiptPDF layout.
    const OrderStatement80mm = () => (
        <>
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>ORDER STATEMENT</Text>
                </View>
            </View>
            <View style={{ ...pdfStyles.tableRow }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Order Amount</Text>
                </View>
                <View style={{ flex: 1, textAlign: 'right' }}>
                    <Text style={pdfStyles.minInfo}>
                        {grandTotal.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}
                    </Text>
                </View>
            </View>
            <View style={{ ...pdfStyles.tableRow }}>
                <View style={{ ...pdfStyles.blackLine, flex: 1 }} />
            </View>
            {statementRows.map((row) => (
                <React.Fragment key={row.id}>
                    <View style={{ ...pdfStyles.tableRow }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>{row.voucherNo}</Text>
                        </View>
                        <View style={{ flex: 1, textAlign: 'right' }}>
                            <Text style={pdfStyles.minInfo}>{readableDate(row.transaction_date)}</Text>
                        </View>
                    </View>
                    <View style={{ ...pdfStyles.tableRow }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Received In</Text>
                        </View>
                        <View style={{ flex: 1, textAlign: 'right' }}>
                            <Text style={pdfStyles.minInfo}>{row.debit_ledger?.name || 'N/A'}</Text>
                        </View>
                    </View>
                    <View style={{ ...pdfStyles.tableRow }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Amount</Text>
                        </View>
                        <View style={{ flex: 1, textAlign: 'right' }}>
                            <Text style={pdfStyles.minInfo}>
                                {row.amount.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}
                            </Text>
                        </View>
                    </View>
                    <View style={{ ...pdfStyles.tableRow }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Balance</Text>
                        </View>
                        <View style={{ flex: 1, textAlign: 'right' }}>
                            <Text style={pdfStyles.minInfo}>
                                {row.balance.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}
                            </Text>
                        </View>
                    </View>
                    <View style={{ ...pdfStyles.tableRow }}>
                        <View style={{ ...pdfStyles.blackLine, flex: 1 }} />
                    </View>
                </React.Fragment>
            ))}
            {statementRows.length === 0 && (
                <View style={{ ...pdfStyles.tableRow }}>
                    <View style={{ flex: 1 }}>
                        <Text style={pdfStyles.minInfo}>No Receipts Found</Text>
                    </View>
                </View>
            )}
        </>
    );

    const PDF80mm = () => (
        <Page size={[80 * 2.83465, 297 * 2.83465]} style={{...pdfStyles.page, padding: 10 }}>
            <View style={{ ...pdfStyles.tableRow, justifyContent: 'center' }}>
                <View style={{ flex: 1, padding: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
                    <PdfLogo organization={organization} />
                </View>
            </View>
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ ...pdfStyles.midInfo, fontFamily: 'Helvetica-Bold' }}>SALES ORDER</Text>
                </View>
            </View>
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={pdfStyles.minInfo}>{sale.saleNo}</Text>
                </View>
            </View>
            {sale.reference && (
                <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={pdfStyles.minInfo}>Ref: {sale.reference}</Text>
                    </View>
                </View>
            )}
            <View style={{ ...pdfStyles.tableRow }}>
                <View style={{ ...pdfStyles.blackLine, flex: 1 }} />
            </View>

            <View style={{ ...pdfStyles.tableRow }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Sale Date & Time</Text>
                </View>
                <View style={{ flex: 1, textAlign: 'right' }}>
                    <Text style={pdfStyles.minInfo}>{readableDate(sale.transaction_date, true)}</Text>
                </View>
            </View>
            <View style={{ ...pdfStyles.tableRow }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Outlet</Text>
                </View>
                <View style={{ flex: 1, textAlign: 'right' }}>
                    <Text style={pdfStyles.minInfo}>{sale.sales_outlet?.name}</Text>
                </View>
            </View>
            {sale.sales_person && (
                <View style={{ ...pdfStyles.tableRow }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Sales Person</Text>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={pdfStyles.minInfo}>{sale.sales_person}</Text>
                    </View>
                </View>
            )}
            <View style={{ ...pdfStyles.tableRow }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Served By</Text>
                </View>
                <View style={{ flex: 1, textAlign: 'right' }}>
                    <Text style={pdfStyles.minInfo}>{sale.creator?.name}</Text>
                </View>
            </View>
            <View style={{ ...pdfStyles.tableRow }}>
                <View style={{ ...pdfStyles.blackLine, flex: 1 }} />
            </View>

            <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>SUPPLIER</Text>
                </View>
            </View>
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ ...pdfStyles.midInfo, fontFamily: 'Helvetica-Bold' }}>{organization.name}</Text>
                </View>
            </View>
            {organization?.address && (
                <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={pdfStyles.minInfo}>{organization.address}</Text>
                    </View>
                </View>
            )}
            {organization?.tin && (
                <View style={{ ...pdfStyles.tableRow }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>TIN</Text>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={pdfStyles.minInfo}>{organization.tin}</Text>
                    </View>
                </View>
            )}
            {organization?.settings?.vrn && (
                <View style={{ ...pdfStyles.tableRow }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>VRN</Text>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={pdfStyles.minInfo}>{organization.settings.vrn}</Text>
                    </View>
                </View>
            )}
            {organization?.phone && (
                <View style={{ ...pdfStyles.tableRow }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Phone</Text>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={pdfStyles.minInfo}>{organization.phone}</Text>
                    </View>
                </View>
            )}
            {organization?.email && (
                <View style={{ ...pdfStyles.tableRow }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Email</Text>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={pdfStyles.minInfo}>{organization.email}</Text>
                    </View>
                </View>
            )}
            <View style={{ ...pdfStyles.tableRow }}>
                <View style={{ ...pdfStyles.blackLine, flex: 1 }} />
            </View>

            <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>CLIENT</Text>
                </View>
            </View>
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ ...pdfStyles.midInfo, fontFamily: 'Helvetica-Bold' }}>{sale.stakeholder?.name}</Text>
                </View>
            </View>
            {sale.stakeholder?.address && (
                <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={pdfStyles.minInfo}>{sale.stakeholder.address}</Text>
                    </View>
                </View>
            )}
            {sale.stakeholder?.tin && (
                <View style={{ ...pdfStyles.tableRow }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>TIN</Text>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={pdfStyles.minInfo}>{sale.stakeholder.tin}</Text>
                    </View>
                </View>
            )}
            {sale.stakeholder?.vrn && (
                <View style={{ ...pdfStyles.tableRow }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>VRN</Text>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={pdfStyles.minInfo}>{sale.stakeholder.vrn}</Text>
                    </View>
                </View>
            )}
            {sale.stakeholder?.phone && (
                <View style={{ ...pdfStyles.tableRow }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Phone</Text>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={pdfStyles.minInfo}>{sale.stakeholder.phone}</Text>
                    </View>
                </View>
            )}
            {sale.stakeholder?.email && (
                <View style={{ ...pdfStyles.tableRow }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Email</Text>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={pdfStyles.minInfo}>{sale.stakeholder.email}</Text>
                    </View>
                </View>
            )}
            <View style={{ ...pdfStyles.tableRow }}>
                <View style={{ ...pdfStyles.blackLine, flex: 1 }} />
            </View>

            {sale.sale_items?.map((saleItem, index) => (
                <React.Fragment key={saleItem.id}>
                    <View style={{ ...pdfStyles.tableRow }}>
                        <View style={{ flex: 1 }}>
                            <Text style={pdfStyles.minInfo}>{saleItem.product.name}</Text>
                            {saleItem.description && (
                                <Text style={pdfStyles.minInfo}>{`(${saleItem.description})`}</Text>
                            )}
                        </View>
                    </View>
                    <View style={{ ...pdfStyles.tableRow }}>
                        <View style={{ flex: 3 }}>
                            <Text style={pdfStyles.minInfo}>
                                {`${saleItem.quantity} ${saleItem.measurement_unit?.symbol || ''} X ${(saleItem.rate * (1 + (saleItem?.vat_exempted !== 1 ? sale.vat_percentage * 0.01 : 0))).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}`}
                            </Text>
                        </View>
                        <View style={{ flex: 1, textAlign: 'right' }}>
                            <Text style={pdfStyles.minInfo}>
                                {(saleItem.quantity * saleItem.rate * (1 + (saleItem?.vat_exempted !== 1 ? sale.vat_percentage * 0.01 : 0))).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
                            </Text>
                        </View>
                    </View>
                    <View style={{ ...pdfStyles.tableRow }}>
                        <View style={{ ...pdfStyles.blackLine, flex: 1 }} />
                    </View>
                </React.Fragment>
            ))}

            <View style={{ ...pdfStyles.tableRow }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>TOTAL</Text>
                </View>
                <View style={{ flex: 1, textAlign: 'right' }}>
                    <Text style={pdfStyles.minInfo}>
                        {sale.amount?.toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                    </Text>
                </View>
            </View>
            {sale.vat_percentage > 0 && (
                <React.Fragment>
                    <View style={{ ...pdfStyles.tableRow }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>VAT</Text>
                        </View>
                        <View style={{ flex: 1, textAlign: 'right' }}>
                            <Text style={pdfStyles.minInfo}>
                                {sale.vat_amount?.toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                            </Text>
                        </View>
                    </View>
                    <View style={{ ...pdfStyles.tableRow }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Grand Total (VAT Incl.)</Text>
                        </View>
                        <View style={{ flex: 1, textAlign: 'right' }}>
                            <Text style={pdfStyles.minInfo}>
                                {(sale.amount + sale.vat_amount).toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                            </Text>
                        </View>
                    </View>
                </React.Fragment>
            )}
            <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
                <View style={{ ...pdfStyles.blackLine, flex: 1 }} />
            </View>

            {sale.remarks && (
                <>
                    <View style={{ ...pdfStyles.tableRow }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Remarks</Text>
                            <Text style={pdfStyles.minInfo}>{sale.remarks}</Text>
                        </View>
                    </View>
                    <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
                        <View style={{ ...pdfStyles.blackLine, flex: 1 }} />
                    </View>
                </>
            )}

            {showStatement && <OrderStatement80mm/>}

            <View style={{ ...pdfStyles.tableRow, marginTop:20,}}>
                <View style={{flex: 3, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, textDecoration: 'underline'}}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Text>
                    <Text style={{...pdfStyles.minInfo}}>{`Name`}</Text>
                </View>
            </View>
            <View style={{ ...pdfStyles.tableRow, marginTop:15,}}>
                <View style={{flex: 1.5, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, textDecoration: 'underline'}}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Text>
                    <Text style={{...pdfStyles.minInfo}}>{`Signature`}</Text>
                </View>
                <View style={{flex: 1.5, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, textDecoration: 'underline'}}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Text>
                    <Text style={{...pdfStyles.minInfo}}>{`Date`}</Text>
                </View>
            </View>
            <View style={{ ...pdfStyles.tableRow, marginTop: 300, textAlign: 'center'}}>
                <PageFooter/>
            </View>
        </Page>
    )

    const PDFA4 = () => (
        <Page size="A4" style={pdfStyles.page}>
            <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
                <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
                    <PdfLogo organization={organization} />
                </View>
                <View style={{ flex: 1, textAlign: 'right' }}>
                    <Text style={{...pdfStyles.majorInfo, color: mainColor }}>SALES ORDER</Text>
                    <Text style={{ ...pdfStyles.midInfo }}>{sale.saleNo}</Text>
                    {sale.reference && <Text style={{ ...pdfStyles.minInfo }}>Ref: {sale.reference}</Text>}
                </View>
            </View>
            <DocumentStakeholders 
                fromLabel={'SUPPLIER'} 
                toLabel={'CLIENT'} 
                stakeholder={sale.stakeholder} 
                organization={organization}
            />
            <View style={{ ...pdfStyles.tableRow, marginBottom: 10}}>
                <View style={{ flex: 1, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Sale Date & Time</Text>
                    <Text style={{...pdfStyles.minInfo }}>{readableDate(sale.transaction_date, true)}</Text>
                </View>
                <View style={{flex: 1, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Outlet</Text>
                    <Text style={{...pdfStyles.minInfo }}>{sale.sales_outlet?.name}</Text>
                </View>
                {sale.sales_person && (
                    <View style={{flex: 1, padding: 2}}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Sales Person</Text>
                        <Text style={{...pdfStyles.minInfo }}>{sale.sales_person}</Text>
                    </View>
                )}
                <View style={{flex: 1, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Served By</Text>
                    <Text style={{...pdfStyles.minInfo }}>{sale.creator?.name}</Text>
                </View>
            </View>
            <View style={{...pdfStyles.table }}>
                <View style={pdfStyles.tableRow}>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.3 }}>S/N</Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3 }}>Product/Service</Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>Unit</Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.8 }}>Quantity</Text>
                    <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>
                        Price{sale?.vat_percentage ? ' (Excl.)' : ''}
                    </Text>
                    {sale?.vat_percentage > 0 && (
                        <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1 }}>
                            VAT
                        </Text>
                    )}
                    <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>
                        Amount{sale?.vat_percentage ? ' (Incl.)' : ''}
                    </Text>
                </View>
                {sale.sale_items?.map((saleItem, index) => (
                    <View key={saleItem.id} style={pdfStyles.tableRow}>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.4 }}>{index+1}</Text>
                        <View
                            style={{
                                ...pdfStyles.tableCell,
                                backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                                flex: 3,
                                flexDirection: 'column',
                            }}
                        >
                            <Text>
                                {saleItem.product.name}
                            </Text>
                            {saleItem.description && <Text>{`(${saleItem.description})`}</Text>}
                        </View>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.6 }}>{saleItem.measurement_unit?.symbol || ''}</Text>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.9, textAlign: 'right'}}>
                            {saleItem.quantity}
                        </Text>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.2, textAlign: 'right'}}>
                            {saleItem.rate.toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
                        </Text>
                        {sale?.vat_percentage > 0 && (
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right'}}>
                                {(!saleItem.product?.vat_exempted ? sale.vat_percentage * saleItem.rate * 0.01 : 0).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
                            </Text> 
                        )}
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right'}}>
                            {(saleItem.quantity * saleItem.rate * (!saleItem.product?.vat_exempted ? (100 + sale.vat_percentage) * 0.01 : 1)).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
                        </Text> 
                    </View>
                ))}
            </View> 
            <View style={{ ...pdfStyles.tableRow, paddingTop: 15 }}>
                <Text style={{ textAlign: 'center', flex: 4.5 }}></Text>
                <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>Total</Text>
                <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right' }}>
                    {sale.amount?.toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                </Text>
            </View>
            {sale.vat_percentage > 0 && (
                <React.Fragment>
                    <View style={{ ...pdfStyles.tableRow, marginTop: 4 }}>
                        <Text style={{ textAlign: 'center', flex: 4.5 }}></Text>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>VAT</Text>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right' }}>
                            {sale.vat_amount?.toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                        </Text>
                    </View>
                    <View style={{ ...pdfStyles.tableRow, marginTop: 4 }}>
                        <Text style={{ textAlign: 'center', flex: 4.5 }}></Text>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>Grand Total (VAT Incl.)</Text>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right' }}>
                            {(sale.amount + sale.vat_amount).toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                        </Text>
                    </View>
                </React.Fragment>
            )}

            {showStatement && <OrderStatementA4/>}

            <View style={{ ...pdfStyles.tableRow, marginTop:30,}}>
                <View style={{flex: 3, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, textDecoration: 'underline'}}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Text>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>{`Name`}</Text>
                </View>
                <View style={{flex: 1.5, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, textDecoration: 'underline'}}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Text>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>{`Signature`}</Text>
                </View>
                <View style={{flex: 1.5, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, textDecoration: 'underline'}}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Text>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>{`Date`}</Text>
                </View>
            </View>
            <PageFooter/>
        </Page> 
    )
    
    return (
        <Document 
            title={`${sale.saleNo}`}
            author={`${sale.creator?.name as string || 'ProsERP'}`}
            subject='Sale PDF'
            creator='ProsERP'
            producer='ProsERP'
            keywords={sale.stakeholder?.name || ''}
        >
            {thermalPrinter ? <PDF80mm/> : <PDFA4/>}
        </Document>             
    )
}

export default SalePDF;