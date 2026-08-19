import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import PdfLogo from '@/components/pdf/PdfLogo';
import pdfStyles from '@/components/pdf/pdf-styles';
import { Document, Page, Text, View } from '@react-pdf/renderer';

type Metric = {
  period_a: number;
  period_b: number;
  diff: number;
  pct_change: number | null;
};

type GroupDiffItem = Metric & {
  type_id: number | null;
  type_name: string;
};

type ComparisonResponse = {
  comparison?: {
    total_employees?: Metric;
    total_employer_cost?: Metric;
    basic_salary?: Metric;
    gross_salary?: Metric;
    net_salary?: Metric;
    employer_contributions_total?: Metric;
    allowances?: GroupDiffItem[];
    deductions?: GroupDiffItem[];
    employer_contributions?: GroupDiffItem[];
  };
};

interface PayrollComparisonReportDocumentProps {
  data: ComparisonResponse;
  periodALabel: string;
  periodBLabel: string;
  selectedCostCenters: CostCenter[];
  organization: any;
  userName: string;
}

function formatCurrency(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDiff(diff: number, pctChange: number | null) {
  const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';
  const pct = pctChange !== null ? ` (${Math.abs(pctChange)}%)` : '';
  return `${sign}${formatCurrency(Math.abs(diff))}${pct}`;
}

function diffColor(diff: number): string {
  if (diff > 0) return '#B45309';
  if (diff < 0) return '#15803D';
  return '#000000';
}

export default function PayrollComparisonReportDocument({
  data,
  periodALabel,
  periodBLabel,
  selectedCostCenters,
  organization,
  userName,
}: PayrollComparisonReportDocumentProps) {
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';

  const comparison = data?.comparison;
  const metrics: { label: string; metric?: Metric }[] = [
    { label: 'Total Employer Cost', metric: comparison?.total_employer_cost },
    { label: 'Basic Salary', metric: comparison?.basic_salary },
    { label: 'Gross Salary', metric: comparison?.gross_salary },
    { label: 'Net Salary', metric: comparison?.net_salary },
    { label: 'Employer Contributions Total', metric: comparison?.employer_contributions_total },
    { label: 'Total Employees', metric: comparison?.total_employees },
  ].filter((row) => row.metric);

  const costCentersLabel = selectedCostCenters.length
    ? selectedCostCenters.map((cc) => cc.name).join(', ')
    : `${organization?.name || 'All'} (company wide)`;

  const headerCellStyle = {
    ...pdfStyles.tableHeader,
    backgroundColor: mainColor,
    color: contrastText,
    flex: 1,
  };

  return (
    <Document
      title={`Payroll Comparison ${periodALabel} vs ${periodBLabel}`}
      creator={` ${userName} | Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page size='A4' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Payroll Comparison</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          <View style={{ flex: 1.5 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Comparing</Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {periodALabel} vs {periodBLabel}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Cost Centers</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{costCentersLabel}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed On</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{readableDate(undefined, true)}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.table, marginBottom: 12 }}>
          <View style={pdfStyles.tableRow}>
            <Text style={headerCellStyle}>Metric</Text>
            <Text style={{ ...headerCellStyle, textAlign: 'right' }}>{periodALabel}</Text>
            <Text style={{ ...headerCellStyle, textAlign: 'right' }}>{periodBLabel}</Text>
            <Text style={{ ...headerCellStyle, textAlign: 'right' }}>Difference</Text>
          </View>
          {metrics.map((row, index) => (
            <View key={row.label} style={pdfStyles.tableRow}>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1,
                }}
              >
                {row.label}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1,
                  textAlign: 'right',
                }}
              >
                {formatCurrency(row.metric?.period_a)}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1,
                  textAlign: 'right',
                }}
              >
                {formatCurrency(row.metric?.period_b)}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1,
                  textAlign: 'right',
                  color: diffColor(row.metric?.diff ?? 0),
                }}
              >
                {formatDiff(row.metric?.diff ?? 0, row.metric?.pct_change ?? null)}
              </Text>
            </View>
          ))}
        </View>

        {[
          { title: 'Allowances', rows: comparison?.allowances ?? [] },
          { title: 'Deductions', rows: comparison?.deductions ?? [] },
          { title: 'Employer Contributions', rows: comparison?.employer_contributions ?? [] },
        ]
          .filter((section) => section.rows.length > 0)
          .map((section) => (
            <View key={section.title} style={{ ...pdfStyles.table, marginBottom: 10 }}>
              <View style={pdfStyles.tableRow}>
                <Text style={{ flex: 4, textAlign: 'center', fontSize: 12 }}>{section.title}</Text>
              </View>
              <View style={pdfStyles.tableRow}>
                <Text style={headerCellStyle}>Type</Text>
                <Text style={{ ...headerCellStyle, textAlign: 'right' }}>{periodALabel}</Text>
                <Text style={{ ...headerCellStyle, textAlign: 'right' }}>{periodBLabel}</Text>
                <Text style={{ ...headerCellStyle, textAlign: 'right' }}>Difference</Text>
              </View>
              {section.rows.map((row, index) => (
                <View key={String(row.type_id ?? row.type_name ?? index)} style={pdfStyles.tableRow}>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      flex: 1,
                    }}
                  >
                    {row.type_name || '-'}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      flex: 1,
                      textAlign: 'right',
                    }}
                  >
                    {formatCurrency(row.period_a)}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      flex: 1,
                      textAlign: 'right',
                    }}
                  >
                    {formatCurrency(row.period_b)}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      flex: 1,
                      textAlign: 'right',
                      color: diffColor(row.diff),
                    }}
                  >
                    {formatDiff(row.diff, row.pct_change)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
      </Page>
    </Document>
  );
}
