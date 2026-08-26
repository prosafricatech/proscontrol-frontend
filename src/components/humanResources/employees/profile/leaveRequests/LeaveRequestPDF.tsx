import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PdfLogo from '@/components/pdf/PdfLogo';
import pdfStyles from '@/components/pdf/pdf-styles';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { LeaveRequestType } from './LeaveRequestType';

interface LeaveRequestPDFProps {
  data: LeaveRequestType;
  organization: any;
  userName: string;
  // My HR's detail response doesn't eager-load `employee` (it's always the
  // caller's own record) — the caller supplies the name directly in that
  // case; HR's `details.employee` is used otherwise.
  employeeName?: string;
}

function days(value?: number | null) {
  return value != null ? Number(value).toLocaleString() : '—';
}

export default function LeaveRequestPDF({
  data,
  organization,
  userName,
  employeeName,
}: LeaveRequestPDFProps) {
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';

  const resolvedEmployeeName =
    employeeName ||
    `${data.employee?.first_name ?? ''} ${data.employee?.middle_name ?? ''} ${data.employee?.last_name ?? ''}`.trim() ||
    `Employee #${data.employee_id}`;

  const balance = data.leave_balance;
  const approvals = data.approvals || [];

  // One signature line per level in the approval chain (e.g. Supervisor,
  // then HR Manager, then Department Head) rather than a single generic
  // "Approver Signature" — a multi-level request needs a space for each
  // person who actually has to sign off, same as Requisitions.
  const levels = [...(data.approval_chain?.levels || [])].sort(
    (a: any, b: any) => Number(a.position_index ?? 0) - Number(b.position_index ?? 0)
  );
  const signatories = levels.length > 0
    ? levels.map((level: any) => `${level.role?.name || level.label || level.level_name || 'Approver'} Signature`)
    : ['Approver Signature'];

  const headerCellStyle = {
    ...pdfStyles.tableHeader,
    backgroundColor: mainColor,
    color: contrastText,
    flex: 1,
  };

  const summaryTiles: { label: string; value: string }[] = balance?.has_allocation
    ? [
        { label: 'Allocated', value: days(balance.allocated_days) },
        { label: 'Used', value: days(balance.used_days) },
        { label: 'Carried Forward', value: days(balance.carried_forward_days) },
        { label: 'Remaining', value: days(balance.remaining_days) },
      ]
    : [];

  return (
    <Document
      title={`Leave Application - ${resolvedEmployeeName}`}
      creator={`${userName} | Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page size='A4' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              Leave Application Form
            </Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 14 }}>
          <View style={{ flex: 1.5 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Employee</Text>
            <Text style={pdfStyles.minInfo}>
              {data.employee?.employee_number ? `${data.employee.employee_number} — ` : ''}
              {resolvedEmployeeName}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Leave Type</Text>
            <Text style={pdfStyles.minInfo}>{data.leave_type?.name || '—'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Status</Text>
            <Text style={pdfStyles.minInfo}>{data.status_label || data.status}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed On</Text>
            <Text style={pdfStyles.minInfo}>{readableDate(undefined, true)}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Start Date</Text>
            <Text style={pdfStyles.minInfo}>{readableDate(data.start_date)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>End Date</Text>
            <Text style={pdfStyles.minInfo}>{readableDate(data.end_date)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Days Requested</Text>
            <Text style={pdfStyles.minInfo}>{days(data.days_requested)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Days Granted</Text>
            <Text style={pdfStyles.minInfo}>{days(data.days_granted)}</Text>
          </View>
        </View>

        {data.reason && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Reason</Text>
            <Text style={pdfStyles.minInfo}>{data.reason}</Text>
          </View>
        )}

        {summaryTiles.length > 0 && (
          <View style={{ ...pdfStyles.tableRow, marginBottom: 16 }}>
            {summaryTiles.map((tile) => (
              <View
                key={tile.label}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: lightColor,
                  padding: 6,
                  marginRight: 6,
                }}
              >
                <Text style={{ fontSize: 8, color: '#666666' }}>{tile.label}</Text>
                <Text style={{ fontSize: 11, fontWeight: 'bold', marginTop: 2 }}>
                  {tile.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ ...pdfStyles.tableRow, marginBottom: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Approval History</Text>
        </View>
        {approvals.length === 0 ? (
          <Text style={{ fontSize: 9, color: '#666666', marginBottom: 20 }}>
            No approval action recorded yet.
          </Text>
        ) : (
          <View style={{ ...pdfStyles.table, marginBottom: 20 }}>
            <View style={pdfStyles.tableRow}>
              <Text style={headerCellStyle}>Date</Text>
              <Text style={headerCellStyle}>By</Text>
              <Text style={headerCellStyle}>Status</Text>
              <Text style={{ ...headerCellStyle, flex: 2 }}>Remarks</Text>
            </View>
            {approvals.map((approval, index) => (
              <View key={approval.id || index} style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                  }}
                >
                  {approval.approval_date ? readableDate(approval.approval_date) : '—'}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                  }}
                >
                  {approval.creator?.name || '—'}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                  }}
                >
                  {approval.status_label || approval.status || '—'}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 2,
                  }}
                >
                  {approval.remarks || '—'}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: 30,
          }}
        >
          <View style={{ width: '48%', marginRight: '4%', marginBottom: 24 }}>
            <View style={{ height: 28 }} />
            <View style={{ ...pdfStyles.blackLine, marginBottom: 4 }} />
            <Text style={pdfStyles.minInfo}>Employee Signature</Text>
            <Text style={{ ...pdfStyles.minInfo, marginTop: 16 }}>Date: ______________</Text>
          </View>
          {signatories.map((label, index) => (
            <View key={index} style={{ width: '48%', marginRight: '4%', marginBottom: 24 }}>
              <View style={{ height: 28 }} />
              <View style={{ ...pdfStyles.blackLine, marginBottom: 4 }} />
              <Text style={pdfStyles.minInfo}>{label}</Text>
              <Text style={{ ...pdfStyles.minInfo, marginTop: 16 }}>Date: ______________</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
