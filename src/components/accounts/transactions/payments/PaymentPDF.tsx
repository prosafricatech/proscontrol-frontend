import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { AuthObject } from '@/types/auth-types';

interface TransactionItem {
  debitLedgerName: string;
  description: string;
  amount: number;
  relatable_type?: 'purchase' | 'bill';
  relatableNo?: string;
}

interface Transaction {
  voucherNo: string;
  reference?: string;
  transactionDate: string;
  creditLedgerName: string;
  cost_centers: CostCenter[];
  requisitionNo?: string;
  items: TransactionItem[];
  narration: string;
  creator?: {
    name: string
  };
  currency: Currency;
  exchange_rate?: number;
}

interface PaymentPDFProps {
  transaction: Transaction;
  authObject: AuthObject;
}

const PaymentPDF: React.FC<PaymentPDFProps> = ({ transaction, authObject }) => {
  const currencyCode = transaction.currency.code;
  const { authUser: { user } } = authObject;
  const { authOrganization: { organization } } = authObject;
  const baseCurrencyCode = organization.base_currency?.code || 'BASE';
  const mainColor = organization.settings?.main_color || "#2113AD";
  const lightColor = organization.settings?.light_color || "#bec5da";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";
  const showExchangeRate = !!transaction.exchange_rate && transaction.exchange_rate !== 1;
    
  return (
    <Document
      title={`${transaction.voucherNo} | ${organization?.name}`}
      author={transaction.creator?.name}
      subject={'Payment Voucher Document'}
      keywords={transaction.narration}
      creator={`${user?.name} | Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
            <PdfLogo organization={organization}/>
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{...pdfStyles.majorInfo, color: mainColor }}>PAYMENT VOUCHER</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{transaction.voucherNo}</Text>
            {transaction.reference && (
              <Text style={{ ...pdfStyles.minInfo }}>Ref: {transaction.reference}</Text>
            )}
          </View>
        </View>
        
        <View style={{ ...pdfStyles.tableRow }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Transaction Date</Text>
            <Text style={{...pdfStyles.minInfo }}>{readableDate(transaction.transactionDate)}</Text>
          </View>
          <View style={{flex: 1, padding: 2}}>
            <Text style={{...pdfStyles.minInfo, color: mainColor }}>From (Credit)</Text>
            <Text style={{...pdfStyles.minInfo }}>{transaction.creditLedgerName}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Transaction Currency</Text>
            <Text style={{...pdfStyles.minInfo }}>{transaction.currency.name} ({currencyCode})</Text>
          </View>
          {transaction.cost_centers.length > 0 && (
            <View style={{flex: 1, padding: 2}}>
              <Text style={{...pdfStyles.minInfo, color: mainColor }}>Cost center</Text>
              <Text style={{...pdfStyles.minInfo }}>
                {transaction.cost_centers.map((cost_center) => cost_center?.name).join(', ')}
              </Text>
            </View>
          )}
          {transaction?.requisitionNo && (
            <View style={{ flex: 1, padding: 2.5 }}>
              <Text style={{...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>Reference</Text>
              <Text style={{...pdfStyles.minInfo }}>{transaction.requisitionNo}</Text>
            </View>
          )}
          {showExchangeRate && (
            <View style={{ flex: 1, padding: 2.5 }}>
              <Text style={{...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>Exchange Rate</Text>
              <Text style={{...pdfStyles.minInfo}}>
                {transaction.exchange_rate?.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          )}
        </View>
        
        <View style={{...pdfStyles.table, minHeight: 230, marginTop: 10}}>
          <View style={pdfStyles.tableRow}>
            <Text style={{ 
              ...pdfStyles.tableHeader, 
              backgroundColor: mainColor, 
              color: contrastText, 
              flex: 0.3 
            }}>S/N</Text>
            <Text style={{
              ...pdfStyles.tableHeader, 
              backgroundColor: mainColor, 
              color: contrastText, 
              flex: 2 
            }}>Account Paid (Debit)</Text>
            <Text style={{
              ...pdfStyles.tableHeader, 
              backgroundColor: mainColor, 
              color: contrastText, 
              flex: 2 
            }}>Description</Text>
            <Text style={{
              ...pdfStyles.tableHeader, 
              backgroundColor: mainColor, 
              color: contrastText, 
              flex: 1.5 
            }}>Amount ({currencyCode})</Text>
          </View>
          
          {transaction.items.map((transactionItem, index) => (
            <View key={index} style={pdfStyles.tableRow}>
              <Text style={{ 
                ...pdfStyles.tableCell,
                backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, 
                flex: 0.3 
              }}>{index+1}</Text>
              <Text style={{ 
                ...pdfStyles.tableCell, 
                backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, 
                flex: 2
              }}>{transactionItem.debitLedgerName}</Text>
              <Text style={{
                ...pdfStyles.tableCell,
                backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                flex: 2
              }}>
                {transactionItem.description}
                {transactionItem.relatableNo
                  ? `\n${transactionItem.relatable_type === 'bill' ? 'Bill' : 'P.O'}: ${transactionItem.relatableNo}`
                  : ''}
              </Text>
              <Text style={{ 
                ...pdfStyles.tableCell, 
                backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, 
                flex: 1.5, 
                textAlign: 'right' 
              }}>{transactionItem.amount?.toLocaleString()}</Text>
            </View>
          ))}
        </View>
        
        <View style={{ ...pdfStyles.tableRow, marginTop: 10 }}>
          <Text style={{ textAlign: 'center', flex: 4.5 }}></Text>
          <Text style={{
            ...pdfStyles.tableHeader, 
            backgroundColor: mainColor, 
            color: contrastText, 
            flex: 2, 
            textAlign: 'right'   
          }}>Total</Text>
          <Text style={{
            ...pdfStyles.tableHeader, 
            backgroundColor: mainColor, 
            color: contrastText, 
            flex: 2.2, 
            textAlign: 'right'   
          }}>
            {transaction.items.reduce((total, transactionItem) => total + transactionItem.amount, 0)
              .toLocaleString("en-US", {style: "currency", currency: currencyCode})}
          </Text>
        </View>
        
        <View style={{ ...pdfStyles.tableRow, marginTop: 20 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Narration</Text>
            <Text style={{...pdfStyles.minInfo }}>{transaction.narration}</Text>
          </View>
          {transaction.creator?.name && (
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{...pdfStyles.minInfo, color: mainColor }}>Posted By</Text>
              <Text style={{...pdfStyles.minInfo }}>{transaction.creator.name}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document> 
  );
};

export default PaymentPDF;