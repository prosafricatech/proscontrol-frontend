import { Organization } from '@/types/auth-types';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';
import PageFooter from '../../pdf/PageFooter';
import pdfStyles from '../../pdf/pdf-styles';
import PdfLogo from '../../pdf/PdfLogo';
import { formatPayslipPeriod, getEmployeeName } from './payrollUtils';

interface PayslipPDFProps {
  payslip: any;
  organization: Organization | null;
  thermalPrinter?: boolean;
}

function fmt(value: number) {
  return (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const PayslipPDF: React.FC<PayslipPDFProps> = ({
  payslip,
  organization,
  thermalPrinter = false,
}) => {
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';

  const employeeName = getEmployeeName(payslip?.employee || payslip);

  const employeeNo =
    payslip?.employee?.employee_number || payslip?.employee_number || 'N/A';

  const period = formatPayslipPeriod(payslip);

  // 80mm Thermal Version
  const PDF80mm = () => (
    <Page
      size={[80 * 2.83465, 297 * 2.83465]}
      style={{ ...pdfStyles.page, padding: 10 }}
    >
      <View>
        {/* Header Logo */}
        <View
          style={{
            ...pdfStyles.tableRow,
            marginBottom: 10,
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              flex: 1,
              padding: 1,
              maxWidth: organization?.logo_path ? 130 : 250,
            }}
          >
            {organization && <PdfLogo organization={organization} />}
          </View>
        </View>

        {/* Title & Organization Info */}
        <View
          style={{
            ...pdfStyles.tableRow,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.midInfo, fontWeight: 'bold' }}>
              PAYSLIP
            </Text>
            <Text style={{ ...pdfStyles.midInfo, textAlign: 'center' }}>
              {organization?.name}
            </Text>
          </View>
        </View>

        {/* Employee Info */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 4 }}>
          <Text style={{ ...pdfStyles.minInfo, flex: 1 }}>Employee:</Text>
          <Text style={{ ...pdfStyles.minInfo, flex: 1.5, textAlign: 'right' }}>
            {employeeName}
          </Text>
        </View>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 4 }}>
          <Text style={{ ...pdfStyles.minInfo, flex: 1 }}>Emp No:</Text>
          <Text style={{ ...pdfStyles.minInfo, flex: 1.5, textAlign: 'right' }}>
            {employeeNo}
          </Text>
        </View>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 8 }}>
          <Text style={{ ...pdfStyles.minInfo, flex: 1 }}>Period:</Text>
          <Text style={{ ...pdfStyles.minInfo, flex: 1.5, textAlign: 'right' }}>
            {period}
          </Text>
        </View>

        {/* Summary Table */}
        <View style={{ ...pdfStyles.table, marginBottom: 8 }}>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableHeader, flex: 2 }}>Item</Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                flex: 1.5,
                textAlign: 'right',
              }}
            >
              Amount
            </Text>
          </View>

          <View style={{ ...pdfStyles.tableRow, borderTop: '1px solid #ddd' }}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>
              Basic Salary
            </Text>
            <Text
              style={{ ...pdfStyles.tableCell, flex: 1.5, textAlign: 'right' }}
            >
              {fmt(payslip?.basic_salary)}
            </Text>
          </View>
          <View style={{ ...pdfStyles.tableRow }}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>
              Gross Salary
            </Text>
            <Text
              style={{ ...pdfStyles.tableCell, flex: 1.5, textAlign: 'right' }}
            >
              {fmt(payslip?.gross_salary)}
            </Text>
          </View>
          <View style={{ ...pdfStyles.tableRow }}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>
              Total Allowances
            </Text>
            <Text
              style={{ ...pdfStyles.tableCell, flex: 1.5, textAlign: 'right' }}
            >
              {fmt(payslip?.total_allowances)}
            </Text>
          </View>
          <View style={{ ...pdfStyles.tableRow }}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>
              Total Deductions
            </Text>
            <Text
              style={{ ...pdfStyles.tableCell, flex: 1.5, textAlign: 'right' }}
            >
              {fmt(payslip?.total_deductions)}
            </Text>
          </View>
          <View style={{ ...pdfStyles.tableRow }}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>PAYE</Text>
            <Text
              style={{ ...pdfStyles.tableCell, flex: 1.5, textAlign: 'right' }}
            >
              {fmt(payslip?.paye)}
            </Text>
          </View>
          <View
            style={{
              ...pdfStyles.tableRow,
              borderTop: '1px solid #000',
              marginTop: 2,
            }}
          >
            <Text style={{ ...pdfStyles.tableHeader, flex: 2 }}>Net Pay</Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                flex: 1.5,
                textAlign: 'right',
              }}
            >
              {fmt(payslip?.net_salary)}
            </Text>
          </View>
        </View>

        {/* Allowances Breakdown */}
        {payslip?.allowances?.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                ...pdfStyles.minInfo,
                fontWeight: 'bold',
                textDecoration: 'underline',
                marginBottom: 2,
              }}
            >
              Allowances
            </Text>
            {payslip.allowances.map((item: any, idx: number) => (
              <View key={idx} style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.minInfo, flex: 2 }}>
                  {item.label}
                </Text>
                <Text
                  style={{ ...pdfStyles.minInfo, flex: 1, textAlign: 'right' }}
                >
                  {fmt(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Deductions Breakdown */}
        {payslip?.deductions?.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                ...pdfStyles.minInfo,
                fontWeight: 'bold',
                textDecoration: 'underline',
                marginBottom: 2,
              }}
            >
              Deductions
            </Text>
            {payslip.deductions.map((item: any, idx: number) => (
              <View key={idx} style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.minInfo, flex: 2 }}>
                  {item.label}
                </Text>
                <Text
                  style={{ ...pdfStyles.minInfo, flex: 1, textAlign: 'right' }}
                >
                  {fmt(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Employer Contributions Breakdown */}
        {payslip?.employer_contributions?.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                ...pdfStyles.minInfo,
                fontWeight: 'bold',
                textDecoration: 'underline',
                marginBottom: 2,
              }}
            >
              Employer Contributions
            </Text>
            {payslip.employer_contributions.map((item: any, idx: number) => (
              <View key={idx} style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.minInfo, flex: 2 }}>
                  {item.label}
                </Text>
                <Text
                  style={{ ...pdfStyles.minInfo, flex: 1, textAlign: 'right' }}
                >
                  {fmt(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 15, textAlign: 'center' }}>
          <PageFooter />
        </View>
      </View>
    </Page>
  );

  // A4 Standard Version
  const PDFA4 = () => (
    <Page size='A4' style={pdfStyles.page}>
      {/* Header */}
      <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
        <View
          style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}
        >
          {organization && <PdfLogo organization={organization} />}
        </View>
        <View style={{ flex: 1, textAlign: 'right' }}>
          <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
            PAYSLIP
          </Text>
          <Text style={{ ...pdfStyles.midInfo }}>{period}</Text>
        </View>
      </View>

      {/* Employee & Org Metadata */}
      <View style={{ ...pdfStyles.tableRow, marginBottom: 15 }}>
        <View style={{ flex: 1, padding: 2 }}>
          <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
            Employee Name
          </Text>
          <Text style={{ ...pdfStyles.minInfo }}>{employeeName}</Text>
        </View>
        <View style={{ flex: 1, padding: 2 }}>
          <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
            Employee No.
          </Text>
          <Text style={{ ...pdfStyles.minInfo }}>{employeeNo}</Text>
        </View>
        <View style={{ flex: 1, padding: 2 }}>
          <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
            Company
          </Text>
          <Text style={{ ...pdfStyles.minInfo }}>
            {organization?.name || '-'}
          </Text>
        </View>
      </View>

      {/* Payslip Summary Table */}
      <View style={{ ...pdfStyles.table, marginBottom: 15 }}>
        <View style={pdfStyles.tableRow}>
          <Text
            style={{
              ...pdfStyles.tableHeader,
              backgroundColor: mainColor,
              color: contrastText,
              flex: 3,
            }}
          >
            Description
          </Text>
          <Text
            style={{
              ...pdfStyles.tableHeader,
              backgroundColor: mainColor,
              color: contrastText,
              flex: 1.5,
              textAlign: 'right',
            }}
          >
            Amount
          </Text>
        </View>

        <View style={pdfStyles.tableRow}>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: '#FFFFFF',
              flex: 3,
            }}
          >
            Basic Salary
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: '#FFFFFF',
              flex: 1.5,
              textAlign: 'right',
            }}
          >
            {fmt(payslip?.basic_salary)}
          </Text>
        </View>
        <View style={pdfStyles.tableRow}>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: lightColor,
              flex: 3,
            }}
          >
            Gross Salary
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: lightColor,
              flex: 1.5,
              textAlign: 'right',
            }}
          >
            {fmt(payslip?.gross_salary)}
          </Text>
        </View>
        <View style={pdfStyles.tableRow}>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: '#FFFFFF',
              flex: 3,
            }}
          >
            Total Allowances
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: '#FFFFFF',
              flex: 1.5,
              textAlign: 'right',
            }}
          >
            {fmt(payslip?.total_allowances)}
          </Text>
        </View>
        <View style={pdfStyles.tableRow}>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: lightColor,
              flex: 3,
            }}
          >
            Total Deductions
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: lightColor,
              flex: 1.5,
              textAlign: 'right',
            }}
          >
            {fmt(payslip?.total_deductions)}
          </Text>
        </View>
        <View style={pdfStyles.tableRow}>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: '#FFFFFF',
              flex: 3,
            }}
          >
            PAYE
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: '#FFFFFF',
              flex: 1.5,
              textAlign: 'right',
            }}
          >
            {fmt(payslip?.paye)}
          </Text>
        </View>

        {/* Net Pay Highlight */}
        <View style={{ ...pdfStyles.tableRow, marginTop: 4 }}>
          <Text
            style={{
              ...pdfStyles.tableHeader,
              backgroundColor: mainColor,
              color: contrastText,
              flex: 3,
            }}
          >
            Net Pay
          </Text>
          <Text
            style={{
              ...pdfStyles.tableHeader,
              backgroundColor: mainColor,
              color: contrastText,
              flex: 1.5,
              textAlign: 'right',
            }}
          >
            {fmt(payslip?.net_salary)}
          </Text>
        </View>
      </View>

      {/* Allowances List */}
      {payslip?.allowances?.length > 0 && (
        <View style={{ marginBottom: 15 }}>
          <Text
            style={{ ...pdfStyles.midInfo, color: mainColor, marginBottom: 5 }}
          >
            Allowances Breakdown
          </Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 3,
                }}
              >
                Label
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1.5,
                  textAlign: 'right',
                }}
              >
                Amount
              </Text>
            </View>
            {payslip.allowances.map((item: any, idx: number) => (
              <View key={idx} style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 3,
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.5,
                    textAlign: 'right',
                  }}
                >
                  {fmt(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Deductions List */}
      {payslip?.deductions?.length > 0 && (
        <View style={{ marginBottom: 15 }}>
          <Text
            style={{ ...pdfStyles.midInfo, color: mainColor, marginBottom: 5 }}
          >
            Deductions Breakdown
          </Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 3,
                }}
              >
                Label
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1.5,
                  textAlign: 'right',
                }}
              >
                Amount
              </Text>
            </View>
            {payslip.deductions.map((item: any, idx: number) => (
              <View key={idx} style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 3,
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.5,
                    textAlign: 'right',
                  }}
                >
                  {fmt(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Employer Contributions List */}
      {payslip?.employer_contributions?.length > 0 && (
        <View style={{ marginBottom: 15 }}>
          <Text
            style={{ ...pdfStyles.midInfo, color: mainColor, marginBottom: 5 }}
          >
            Employer Contributions
          </Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 3,
                }}
              >
                Label
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1.5,
                  textAlign: 'right',
                }}
              >
                Amount
              </Text>
            </View>
            {payslip.employer_contributions.map((item: any, idx: number) => (
              <View key={idx} style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 3,
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.5,
                    textAlign: 'right',
                  }}
                >
                  {fmt(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <PageFooter />
    </Page>
  );

  return (
    <Document
      title={`Payslip - ${employeeName}`}
      subject='Employee Payslip'
      creator='ProsERP'
      producer='ProsERP'
    >
      {thermalPrinter ? <PDF80mm /> : <PDFA4 />}
    </Document>
  );
};

export default PayslipPDF;
