import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import React, { useMemo } from 'react';
import pdfStyles from '../../../pdf/pdf-styles';
import PdfLogo from '../../../pdf/PdfLogo';
import QRCode from 'qrcode';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { Organization, User } from '@/types/auth-types';
import { Currency } from '@/components/masters/Currencies/CurrencyType';

interface Product {
  name: string;
}

interface SaleItem {
  product: Product;
  quantity: number;
  rate: number;
  vat_exempted?: number;
  measurement_unit: MeasurementUnit;
}

interface VFDReceipt {
  verification_url: string;
  verification_code: string;
  created_at: string;
  receipt_time: string;
  customer_name?: string;
  customer_tin?: string;
  customer_vrn?: string;
}

interface Sale {
  saleNo: string;
  transaction_date: string;
  reference?: string;
  amount: number;
  vat_percentage: number;
  sales_outlet: {
    name: string;
  };
  stakeholder: Stakeholder;
  sale_items: SaleItem[];
  creator: User | null;
  currency: Currency;
  vfd_receipt?: VFDReceipt;
}

interface SaleReceiptPDFProps {
  user: User;
  organization: Organization;
  sale: Sale;
}

const SaleReceiptPDF: React.FC<SaleReceiptPDFProps> = ({ user, organization, sale }) => {
  const vatFactor = sale.vat_percentage * 0.01;

  // Calculate VAT amounts
  const { totalAmountForVAT, vatAmount } = useMemo(() => {
    const totalForVAT = sale.sale_items
      .filter(item => item.vat_exempted !== 1)
      .reduce((total, item) => total + (item.rate * item.quantity), 0);

    const vat = totalForVAT * sale.vat_percentage / 100;
    return { totalAmountForVAT: totalForVAT, vatAmount: vat };
  }, [sale.sale_items, sale.vat_percentage]);

  const generateQRCodeDataUrl = () => {
    if (!sale.vfd_receipt) return '';
    return QRCode.toDataURL(sale.vfd_receipt.verification_url);
  };

  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString('en-US', {
      style: 'currency',
      currency: sale.currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const renderOrganizationInfo = () => (
    <>
      <View style={{ ...pdfStyles.tableRow, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ flex: 1, padding: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
          {!!organization?.logo_path && <PdfLogo organization={organization} />}
        </View>
      </View>
      <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...pdfStyles.midInfo, fontFamily: 'Helvetica-Bold' }}>{organization.name}</Text>
        </View>
      </View>
      {organization.address && (
        <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, textAlign: 'center' }}>{organization.address}</Text>
          </View>
        </View>
      )}
      {organization.tin && (
        <View style={{ ...pdfStyles.tableRow }}>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>TIN:</Text>
          </View>
          <View style={{ flex: 1, textAlign: 'left' }}>
            <Text style={pdfStyles.minInfo}>{organization.tin}</Text>
          </View>
        </View>
      )}
      {organization.settings?.vrn && (
        <View style={{ ...pdfStyles.tableRow }}>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>VRN:</Text>
          </View>
          <View style={{ flex: 1, textAlign: 'left' }}>
            <Text style={pdfStyles.minInfo}>{organization.settings.vrn}</Text>
          </View>
        </View>
      )}
      {organization.phone && (
        <View style={{ ...pdfStyles.tableRow }}>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Phone:</Text>
          </View>
          <View style={{ flex: 1, textAlign: 'left' }}>
            <Text style={pdfStyles.minInfo}>{organization.phone}</Text>
          </View>
        </View>
      )}
      {organization.tra_serial_number && (
        <View style={{ ...pdfStyles.tableRow }}>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Serial Number:</Text>
          </View>
          <View style={{ flex: 1, textAlign: 'left' }}>
            <Text style={pdfStyles.minInfo}>{organization.tra_serial_number}</Text>
          </View>
        </View>
      )}
      {organization.email && (
        <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={pdfStyles.minInfo}>{organization.email}</Text>
          </View>
        </View>
      )}
      <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>{sale.sales_outlet.name}</Text>
        </View>
      </View>
      <View style={{ ...pdfStyles.tableRow }}>
        <View style={{ ...pdfStyles.blackLine, flex: 1 }} />
      </View>
    </>
  );

  const renderReceiptInfo = () => (
    <>
      <View style={{ ...pdfStyles.tableRow }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Receipt No.</Text>
        </View>
        <View style={{ flex: 1, textAlign: 'right' }}>
          <Text style={pdfStyles.minInfo}>{sale.saleNo}</Text>
        </View>
      </View>
      <View style={{ ...pdfStyles.tableRow }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Date</Text>
        </View>
        <View style={{ flex: 1, textAlign: 'right' }}>
          <Text style={pdfStyles.minInfo}>
            {readableDate(sale?.vfd_receipt ? sale.vfd_receipt.created_at : sale.transaction_date)}
          </Text>
        </View>
      </View>
      {sale?.vfd_receipt && (
        <View style={{ ...pdfStyles.tableRow }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Time</Text>
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={pdfStyles.minInfo}>{sale.vfd_receipt.receipt_time}</Text>
          </View>
        </View>
      )}
      {sale.reference && (
        <View style={{ ...pdfStyles.tableRow }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Reference</Text>
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={pdfStyles.minInfo}>{sale.reference}</Text>
          </View>
        </View>
      )}
      <View style={{ ...pdfStyles.tableRow }}>
        <View style={{ ...pdfStyles.blackLine, flex: 1 }} />
      </View>
    </>
  );

  const renderCustomerInfo = () => (
    <>
      <View style={{ ...pdfStyles.tableRow }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Customer Name</Text>
        </View>
        <View style={{ flex: 1, textAlign: 'right' }}>
          <Text style={pdfStyles.minInfo}>
            {sale?.vfd_receipt?.customer_name || sale.stakeholder.name}
          </Text>
        </View>
      </View>
      {(sale?.vfd_receipt?.customer_tin || sale.stakeholder?.tin) && (
        <View style={{ ...pdfStyles.tableRow }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Customer TIN</Text>
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={pdfStyles.minInfo}>
              {sale?.vfd_receipt?.customer_tin || sale.stakeholder.tin}
            </Text>
          </View>
        </View>
      )}
      {(sale?.vfd_receipt?.customer_vrn || sale.stakeholder?.vrn) && (
        <View style={{ ...pdfStyles.tableRow }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Customer VRN</Text>
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={pdfStyles.minInfo}>
              {sale?.vfd_receipt?.customer_vrn || sale.stakeholder.vrn}
            </Text>
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
      <View style={{ ...pdfStyles.tableRow }}>
        <View style={{ ...pdfStyles.blackLine, flex: 1 }} />
      </View>
    </>
  );

  const renderItems = () => (
    <>
      {sale.sale_items.map((item, index) => (
        <React.Fragment key={`${item.product.name}-${index}`}>
          <View style={{ ...pdfStyles.tableRow }}>
            <View style={{ flex: 1 }}>
              <Text style={pdfStyles.minInfo}>{item.product.name}</Text>
            </View>
          </View>
          <View style={{ ...pdfStyles.tableRow }}>
            <View style={{ flex: 1 }}>
              <View style={{ ...pdfStyles.tableRow }}>
                <View style={{ flex: 3 }}>
                  <Text style={pdfStyles.minInfo}>
                    {`${item.quantity} ${item.measurement_unit.symbol} X ${(item.rate * (1 + (item?.vat_exempted !== 1 ? vatFactor : 0))).toLocaleString()}`}
                  </Text>
                </View>
                <View style={{ flex: 1, textAlign: 'right' }}>
                  <Text style={pdfStyles.minInfo}>
                    {(item.quantity * item.rate * (1 + (item?.vat_exempted !== 1 ? vatFactor : 0)))
                      .toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View style={{ ...pdfStyles.tableRow }}>
            <View style={{ ...pdfStyles.blackLine, flex: 1 }} />
          </View>
        </React.Fragment>
      ))}
    </>
  );

  const renderTotals = () => (
    <>
      <View style={{ ...pdfStyles.tableRow }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>TOTAL</Text>
        </View>
        <View style={{ flex: 1, textAlign: 'right' }}>
          <Text style={pdfStyles.minInfo}>{formatCurrency(sale.amount)}</Text>
        </View>
      </View>
      {sale.vat_percentage > 0 && (
        <>
          <View style={{ ...pdfStyles.tableRow }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>VAT</Text>
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={pdfStyles.minInfo}>{formatCurrency(vatAmount)}</Text>
            </View>
          </View>
          <View style={{ ...pdfStyles.tableRow }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Total (VAT Incl.)</Text>
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={pdfStyles.minInfo}>{formatCurrency(sale.amount + vatAmount)}</Text>
            </View>
          </View>
        </>
      )}
      <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
        <View style={{ ...pdfStyles.blackLine, flex: 1 }} />
      </View>
    </>
  );

  const renderVerification = () => (
    sale.vfd_receipt && (
      <>
        <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>Receipt Verification Code</Text>
          </View>
        </View>
        <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={pdfStyles.minInfo}>{sale.vfd_receipt.verification_code}</Text>
          </View>
        </View>
        <View style={{ ...pdfStyles.tableRow, justifyContent: 'center', marginBottom: 10 }}>
          <View>
            <Image src={generateQRCodeDataUrl()} style={{ width: 100, height: 100 }} />
          </View>
        </View>
      </>
    )
  );

  return (
    <Document
      creator={`${user.name} | Powered By ProsERP`}
      producer="ProsERP"
    >
      <Page size={[80 * 2.83465, 297 * 2.83465]} style={{ ...pdfStyles.page, padding: 10 }}>
        {sale.vfd_receipt && (
          <View style={{ ...pdfStyles.tableRow, textAlign: 'center', marginBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>*** START OF LEGAL RECEIPT ***</Text>
            </View>
          </View>
        )}

        {renderOrganizationInfo()}
        {renderReceiptInfo()}
        {renderCustomerInfo()}
        {renderItems()}
        {renderTotals()}
        {renderVerification()}

        <View style={{ ...pdfStyles.tableRow, textAlign: 'center', marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={pdfStyles.minInfo}>Served by: {sale.creator?.name || '-'}</Text>
          </View>
        </View>
        <View style={{ ...pdfStyles.tableRow, textAlign: 'center', marginBottom: 15 }}>
          <View style={{ flex: 1 }}>
            <Text style={{...pdfStyles.microInfo, fontSize: 7}}>Powered by: proserp.co.tz</Text>
          </View>
        </View>

        {sale.vfd_receipt && (
          <View style={{ ...pdfStyles.tableRow, textAlign: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold' }}>*** END OF LEGAL RECEIPT ***</Text>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default SaleReceiptPDF;