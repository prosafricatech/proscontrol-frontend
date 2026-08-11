import React from 'react';
import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import pdfStyles from '../../pdf/pdf-styles';
import PageFooter from '../../pdf/PageFooter';
import PdfLogo from '../../pdf/PdfLogo';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PriceList } from './PriceListType';
import { AuthObject } from '@/types/auth-types';

interface PriceItem {
  id: number;
  price: number;
  bottom_cap: number;
  product: {
    name: string;
    vat_exempted?: boolean;
    main_photo?: { full_path: string } | null;
  };
  sales_outlets: Array<{
    name: string;
  }>;
}

interface PriceListPDFProps {
  priceList: PriceList & {
    items: PriceItem[];
    is_fuel_price_list: boolean;
  };
  authObject: AuthObject;
}

const PriceListPDF: React.FC<PriceListPDFProps> = ({
  priceList,
  authObject: {
    authUser: { user },
    authOrganization: { organization }
  }
}) => {
  const mainColor = organization.settings?.main_color || "#2113AD";
  const lightColor = organization.settings?.light_color || "#bec5da";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";
  const is_vat_registered = organization.settings?.vat_registered;
  const vat_percentage = organization.settings?.vat_percentage || 0;

  return (
    <Document 
      creator='ProsERP'
      producer='ProsERP'
      title={`Pricelist from ${readableDate(priceList.effective_date)}`}
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>PRICE LIST</Text>
              <Text style={pdfStyles.minInfo}>{`From ${readableDate(priceList.effective_date)}`}</Text>
            </View>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}>
          {priceList.narration && (
            <View style={{ flex: 3, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Narration</Text>
              <Text style={pdfStyles.minInfo}>{priceList.narration}</Text>
            </View>
          )}
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed By</Text>
            <Text style={pdfStyles.minInfo}>{user.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed On</Text>
            <Text style={pdfStyles.minInfo}>{readableDate(undefined, true)}</Text>
          </View>
        </View>

          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 0.3 }}>S/N</Text>
              <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 3 }}>Product/Service</Text>
              <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Price {is_vat_registered ? ' (Excl.)' : ''}</Text>
              {is_vat_registered && (
                <>
                  <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>VAT</Text>
                  <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Price {is_vat_registered ? ' (Incl.)' : ''}</Text>
                </>
              )}
              {!priceList?.is_fuel_price_list && (
                <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Bottom Cap</Text>
              )}
              <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 2 }}>Applicable Outlets</Text>
            </View>

            {priceList.items.map((priceItem, index) => (
              <View key={priceItem.id} style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.3 }}>{index + 1}</Text>
                <View style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 3, flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
                  {priceItem.product.main_photo?.full_path && (
                    <Image src={priceItem.product.main_photo.full_path} style={{ width: 48, height: 48, borderRadius: 4, flexShrink: 0 }} />
                  )}
                  <Text style={{ flex: 1 }}>{priceItem.product.name}</Text>
                </View>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.2, textAlign: 'right' }}>{priceItem.price.toLocaleString()}</Text>
                {is_vat_registered && (
                  <>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.2, textAlign: 'right' }}>
                      {(!priceItem.product?.vat_exempted ? vat_percentage * priceItem.price * 0.01 : 0).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.2, textAlign: 'right' }}>
                      {(priceItem.price * (!priceItem.product?.vat_exempted ? (100 + vat_percentage) * 0.01 : 1)).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                    </Text>
                  </>
                )}
                {!priceList?.is_fuel_price_list && (
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.2, textAlign: 'right' }}>{priceItem.bottom_cap}</Text>
                )}
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2, textAlign: 'right' }}>{priceItem.sales_outlets.map((outlet) => outlet.name).join(', ')}</Text>
              </View>
            ))}
          </View>
        <PageFooter />
      </Page>
    </Document>
  );
};

export default PriceListPDF;