import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import pdfStyles from '../../../pdf/pdf-styles';
import PdfLogo from '../../../pdf/PdfLogo';

const BUCKET_COLUMNS = [
  { key: 'current', label: 'Current (0-30)' },
  { key: 'days_31_60', label: '31-60' },
  { key: 'days_61_90', label: '61-90' },
  { key: 'days_91_120', label: '91-120' },
  { key: 'over_120', label: '120+' },
];

const money = (value: number = 0) =>
  (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const ApArAgingPDF = ({ reportData, authOrganization, user }: any) => {
  const organization = authOrganization?.organization;
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';
  const reportTitle = reportData?.filters?.type === 'receivable' ? 'A/R Aging Report' : 'A/P Aging Report';
  const reportPeriod = `As at: ${readableDate(reportData?.filters?.as_at, true)}`;

  if (!reportData) return null;

  return (
    <Document creator={`${user?.name || ''} | Powered By ProsERP`} producer='ProsERP' title={reportTitle}>
      <Page size='A4' orientation='landscape' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>{reportTitle}</Text>
            <Text style={pdfStyles.minInfo}>{reportPeriod}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}>
          {reportData.filters?.cost_centers?.length > 0 && (
            <View style={{ flex: 2, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Cost Centers</Text>
              <Text style={pdfStyles.minInfo}>
                {reportData.filters.cost_centers.map((c: any) => c.name).join(', ')}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed By</Text>
            <Text style={pdfStyles.minInfo}>{user?.name || ''}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed On</Text>
            <Text style={pdfStyles.minInfo}>{readableDate(undefined, true)}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.table, minHeight: 230 }}>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>
              S/N
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3 }}>
              Name
            </Text>
            {BUCKET_COLUMNS.map((col) => (
              <Text
                key={col.key}
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1.4,
                  textAlign: 'right',
                }}
              >
                {col.label}
              </Text>
            ))}
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
                textAlign: 'right',
              }}
            >
              Total
            </Text>
          </View>
          {(reportData.rows || []).map((row: any, index: number) => (
            <View key={row.ledger_id} style={pdfStyles.tableRow}>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 0.5,
                  textAlign: 'right',
                }}
              >
                {index + 1}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 3,
                }}
              >
                {row.name}
              </Text>
              {BUCKET_COLUMNS.map((col) => (
                <Text
                  key={col.key}
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.4,
                    textAlign: 'right',
                  }}
                >
                  {money(row.buckets?.[col.key])}
                </Text>
              ))}
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1.5,
                  textAlign: 'right',
                }}
              >
                {money(row.total)}
              </Text>
            </View>
          ))}
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 3.5,
                paddingLeft: 10,
              }}
            >
              Total
            </Text>
            {BUCKET_COLUMNS.map((col) => (
              <Text
                key={col.key}
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1.4,
                  textAlign: 'right',
                  fontSize: '9px',
                }}
              >
                {money(reportData.totals?.[col.key])}
              </Text>
            ))}
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
                textAlign: 'right',
                fontSize: '9px',
              }}
            >
              {money(reportData.grand_total)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ApArAgingPDF;
