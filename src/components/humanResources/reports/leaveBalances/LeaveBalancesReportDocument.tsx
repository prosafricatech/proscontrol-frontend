import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PdfLogo from '@/components/pdf/PdfLogo';
import pdfStyles from '@/components/pdf/pdf-styles';
import { Document, Page, Text, View } from '@react-pdf/renderer';

type LeaveBalanceRow = {
  employee_number: string;
  employee_name: string;
  department: string | null;
  leave_type: string | null;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
};

type LeaveBalancesResponse = {
  year: number;
  rows: LeaveBalanceRow[];
  totals: {
    allocated_days: number;
    used_days: number;
    remaining_days: number;
    count: number;
  };
};

interface LeaveBalancesReportDocumentProps {
  data: LeaveBalancesResponse;
  organization: any;
  userName: string;
  filtersLabel: string;
}

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const columns = [
  { label: 'Employee No.', flex: 1.2 },
  { label: 'Name', flex: 2 },
  { label: 'Department', flex: 1.5 },
  { label: 'Leave Type', flex: 1.5 },
  { label: 'Allocated', flex: 1, align: 'right' as const },
  { label: 'Used', flex: 1, align: 'right' as const },
  { label: 'Remaining', flex: 1, align: 'right' as const },
];

export default function LeaveBalancesReportDocument({
  data,
  organization,
  userName,
  filtersLabel,
}: LeaveBalancesReportDocumentProps) {
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';

  const rows = data?.rows ?? [];
  const totals = data?.totals;

  return (
    <Document
      title={`Leave Balances ${data?.year ?? ''}`}
      creator={` ${userName} | Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page size='A4' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Leave Balances</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Year</Text>
            <Text style={pdfStyles.minInfo}>{data?.year}</Text>
          </View>
          <View style={{ flex: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Filters</Text>
            <Text style={pdfStyles.minInfo}>{filtersLabel}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed On</Text>
            <Text style={pdfStyles.minInfo}>{readableDate(undefined, true)}</Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            {columns.map((column) => (
              <Text
                key={column.label}
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: column.flex,
                  textAlign: column.align || 'left',
                }}
              >
                {column.label}
              </Text>
            ))}
          </View>

          {rows.map((row, index) => (
            <View key={`${row.employee_number}-${row.leave_type}-${index}`} style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.2 }}>
                {row.employee_number}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2 }}>
                {row.employee_name}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>
                {row.department || '-'}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>
                {row.leave_type || '-'}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                {formatNumber(row.allocated_days)}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                {formatNumber(row.used_days)}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                {formatNumber(row.remaining_days)}
              </Text>
            </View>
          ))}

          {totals && (
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 6.2 }}>
                Total ({totals.count})
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right' }}>
                {formatNumber(totals.allocated_days)}
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right' }}>
                {formatNumber(totals.used_days)}
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right' }}>
                {formatNumber(totals.remaining_days)}
              </Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
