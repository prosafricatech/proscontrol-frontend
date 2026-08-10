import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import PdfLogo from '@/components/pdf/PdfLogo';
import pdfStyles from '@/components/pdf/pdf-styles';
import { Document, Page, Text, View } from '@react-pdf/renderer';

type GroupedSummaryItem = {
  type_id?: number | null;
  type_name?: string | null;
  total?: number;
  label?: string;
  name?: string;
};

type SalarySummaryResponse = {
  summary?: {
    period?: string;
    total_employees?: number;
    total_payroll_runs?: number;
    total_employer_cost?: number;
  };
  salary_components?: {
    basic_salary?: {
      total?: number;
    };
    allowances?: GroupedSummaryItem[];
    gross_salary?: number;
  };
  deductions?: GroupedSummaryItem[];
  employer_contributions?: GroupedSummaryItem[];
  net_salary?: {
    total?: number;
  };
};

interface PayrollSalarySummaryReportDocumentProps {
  data: SalarySummaryResponse;
  periodLabel: string;
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

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function PayrollSalarySummaryReportDocument({
  data,
  periodLabel,
  selectedCostCenters,
  organization,
  userName,
}: PayrollSalarySummaryReportDocumentProps) {
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';

  const allowances = data?.salary_components?.allowances ?? [];
  const deductions = data?.deductions ?? [];
  const employerContributions = data?.employer_contributions ?? [];
  const summary = data?.summary;
  const costCentersLabel = selectedCostCenters.length
    ? selectedCostCenters.map((cc) => cc.name).join(', ')
    : `${organization?.name || 'All'} (company wide)`;

  return (
    <Document
      title={`Payroll Components Summary ${periodLabel}`}
      creator={` ${userName} | Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page size='A4' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              Payroll Components Summary
            </Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          <View style={{ flex: 1.5 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Period</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{periodLabel}</Text>
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

        <View style={{ ...pdfStyles.tableRow, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Employees</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{formatNumber(summary?.total_employees)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Payroll Runs</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{formatNumber(summary?.total_payroll_runs)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Total Employer Cost</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{formatCurrency(summary?.total_employer_cost)}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.table, marginBottom: 12, width: '50%' }}>
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
                textAlign: 'center',
              }}
            >
              Summary
            </Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableCell, backgroundColor: '#FFFFFF', flex: 1 }}>Basic Salary</Text>
            <Text style={{ ...pdfStyles.tableCell, backgroundColor: '#FFFFFF', flex: 1, textAlign: 'right' }}>
              {formatCurrency(data?.salary_components?.basic_salary?.total)}
            </Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableCell, backgroundColor: lightColor, flex: 1 }}>Gross Salary</Text>
            <Text style={{ ...pdfStyles.tableCell, backgroundColor: lightColor, flex: 1, textAlign: 'right' }}>
              {formatCurrency(data?.salary_components?.gross_salary)}
            </Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableCell, backgroundColor: '#FFFFFF', flex: 1 }}>Net Salary</Text>
            <Text style={{ ...pdfStyles.tableCell, backgroundColor: '#FFFFFF', flex: 1, textAlign: 'right' }}>
              {formatCurrency(data?.net_salary?.total)}
            </Text>
          </View>
        </View>

        {[
          { title: 'Allowances', rows: allowances },
          { title: 'Deductions', rows: deductions },
          { title: 'Employer Contributions', rows: employerContributions },
        ]
          .filter((section) => section.rows.length > 0)
          .map((section) => {
            const sectionTotal = section.rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);

            return (
              <View key={section.title} style={{ ...pdfStyles.table, marginBottom: 10 }}>
                <View style={pdfStyles.tableRow}>
                  <Text style={{ flex: 2, textAlign: 'center', fontSize: 12 }}>{section.title}</Text>
                </View>
                <View style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>
                    Name
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 1,
                      textAlign: 'right',
                    }}
                  >
                    Value
                  </Text>
                </View>
                {section.rows.map((row, index) => (
                  <View key={String(row.type_id ?? row.type_name ?? row.label ?? row.name ?? index)} style={pdfStyles.tableRow}>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 1,
                      }}
                    >
                      {row.type_name || row.label || row.name || '-'}
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 1,
                        textAlign: 'right',
                      }}
                    >
                      {formatCurrency(row.total)}
                    </Text>
                  </View>
                ))}
                <View style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>
                    Total
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 1,
                      textAlign: 'right',
                    }}
                  >
                    {formatCurrency(sectionTotal)}
                  </Text>
                </View>
              </View>
            );
          })}
      </Page>
    </Document>
  );
}
