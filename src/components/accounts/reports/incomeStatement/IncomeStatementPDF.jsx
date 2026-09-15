'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';

const IncomeStatementPDF = ({ reportData, authOrganization, user }) => {
  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const contrastText =
    authOrganization.organization.settings?.contrast_text || 'black';
  const lightColor =
    authOrganization.organization.settings?.light_color || '#bec5da';

  // On screen, incomes/directExpenses/indirectExpenses are now ledger-group
  // trees (subgroups shown collapsible, matching Balance Sheet). The PDF
  // still lists individual ledgers flat, so flatten back down to leaves
  // here rather than reworking this layout into a nested table too.
  const flattenLedgerLeaves = (nodes) =>
    (nodes || []).flatMap((node) =>
      Array.isArray(node.children) && node.children.length > 0
        ? flattenLedgerLeaves(node.children)
        : [
            {
              ledger_id: node.ledger_id,
              ledger_name: node.name ?? node.ledger_name,
              increasesWith: node.increasesWith,
              amounts: node.amounts,
            },
          ]
    );

  const incomes = flattenLedgerLeaves(reportData?.incomes);
  const directExpenses = flattenLedgerLeaves(
    reportData?.directExpenses || reportData?.direct_expenses
  );
  const indirectExpenses = flattenLedgerLeaves(
    reportData?.indirectExpenses || reportData?.indirect_expenses
  );

  const getLedgerTotal = (ledger) => {
    if (!Array.isArray(ledger?.amounts)) return 0;
    return ledger.amounts.reduce(
      (acc, item) => acc + (Number(item?.amount) || 0),
      0
    );
  };

  const allLedgers = [...incomes, ...directExpenses, ...indirectExpenses];

  const periodMeta = allLedgers
    .flatMap((ledger) => (Array.isArray(ledger.amounts) ? ledger.amounts : []))
    .reduce((acc, item) => {
      if (!item?.period) return acc;
      if (!acc[item.period]) {
        acc[item.period] = {
          period: item.period,
          start_datetime: item.start_datetime,
          end_datetime: item.end_datetime,
        };
      }
      return acc;
    }, {});

  const periods = Object.values(periodMeta).sort((a, b) => {
    const aTime = a.start_datetime ? new Date(a.start_datetime).getTime() : 0;
    const bTime = b.start_datetime ? new Date(b.start_datetime).getTime() : 0;
    return aTime - bTime;
  });

  const MAX_COLUMNS = 6;

  const mergePeriods = (periods) => {
    if (periods.length <= MAX_COLUMNS) return periods.map((p) => [p]);

    const groupSize = Math.ceil(periods.length / MAX_COLUMNS);

    const groups = [];

    for (let i = 0; i < periods.length; i += groupSize) {
      groups.push(periods.slice(i, i + groupSize));
    }

    return groups;
  };

  const mergedPeriods = mergePeriods(periods);

  const getAmountByPeriodGroup = (ledger, group) => {
    return group.reduce((total, period) => {
      return total + getAmountByPeriod(ledger, period.period);
    }, 0);
  };

  const getAmountItemByPeriod = (ledger, period) => {
    if (!Array.isArray(ledger?.amounts)) return null;
    return ledger.amounts.find((item) => item.period === period) || null;
  };

  const getAmountByPeriod = (ledger, period) => {
    const matched = getAmountItemByPeriod(ledger, period);
    return Number(matched?.amount) || 0;
  };

  const getSectionPeriodTotal = (items, period) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce(
      (acc, ledger) => acc + getAmountByPeriod(ledger, period),
      0
    );
  };

  // Totals based on new amounts[] response structure
  const totalRevenue = incomes.reduce(
    (acc, curr) => acc + getLedgerTotal(curr),
    0
  );
  const totalCostOfRevenue = directExpenses.reduce(
    (acc, curr) => acc + getLedgerTotal(curr),
    0
  );
  const totalOperatingExpenses = indirectExpenses.reduce(
    (acc, curr) => acc + getLedgerTotal(curr),
    0
  );

  const reportPeriod = `${readableDate(reportData.filters.from, true)} - ${readableDate(reportData.filters.to, true)}`;
  const costCenters = reportData.filters.cost_centers;
  const organization = authOrganization.organization;

  const extraCol = mergedPeriods.length > 1 ? 2 : 1;
  const colWidth = String(100 / (mergedPeriods.length + extraCol)) + '%';

  return reportData ? (
    <Document
      creator={` ${user.name} | Powered By ProsERP`}
      producer='ProsERP'
      title={`Income Statement ${reportPeriod}`}
    >
      <Page
        size='A4'
        style={pdfStyles.page}
        orientation={mergedPeriods.length < 3 ? 'potrait' : 'landscape'}
      >
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View
              style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}
            >
              <PdfLogo organization={organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text
                style={{ ...pdfStyles.majorInfo, color: mainColor }}
              >{`Income Statement`}</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{reportPeriod}</Text>
            </View>
          </View>
        </View>
        <View
          style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}
        >
          {costCenters.length !== 0 && (
            <View style={{ flex: 2, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Cost Centers
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {costCenters
                  .map((cost_centers) => cost_centers.name)
                  .join(', ')}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed By
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{user.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed On
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {readableDate(undefined, true)}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          {/* ====== HEADER ===== */}
          <View style={pdfStyles.tableRow}>
            <View
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                flex: 1,
              }}
            >
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  color: contrastText,
                  fontSize: 12,
                }}
              >
                Category
              </Text>
            </View>
            {mergedPeriods.map((group, index) => {
              const start = group[0];
              const end = group[group.length - 1];

              const label =
                group.length === 1
                  ? start.period
                  : `${start.period} - ${end.period}`;
              return (
                <View
                  key={index}
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    flex: 1,
                  }}
                >
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      color: contrastText,
                      fontSize: 12,
                    }}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
            {mergedPeriods.length > 1 && (
              <View
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    color: contrastText,
                    fontSize: 12,
                  }}
                >
                  Total
                </Text>
              </View>
            )}
          </View>

          {/* ====== REVENUE ===== */}
          <View style={pdfStyles.tableRow}>
            <View
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                marginTop: 2,
                width: '100%',
              }}
            >
              <Text style={{ ...pdfStyles.tableCell }}>Revenues</Text>
            </View>
          </View>
          {incomes.map((income, index) => (
            <View
              key={index}
              style={{
                ...pdfStyles.tableRow,
              }}
            >
              <View
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF',
                  width: colWidth,
                  paddingLeft: 12,
                }}
              >
                <Text>{income.ledger_name}</Text>
              </View>

              {mergedPeriods.map((group, i) => {
                return (
                  <View
                    key={i}
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF',
                      width: colWidth,
                      textAlign: 'right',
                    }}
                  >
                    <Text>
                      {getAmountByPeriodGroup(income, group).toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </Text>
                  </View>
                );
              })}
              {mergedPeriods.length > 1 && (
                <View
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF',
                    textAlign: 'right',
                    width: colWidth,
                  }}
                >
                  <Text>
                    {getLedgerTotal(income).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              )}
            </View>
          ))}
          <View style={{ ...pdfStyles.tableRow }}>
            <View
              style={{
                ...pdfStyles.tableCell,
                backgroundColor: mainColor,
                color: contrastText,
                fontWeight: 'bold',
                width: colWidth,
                paddingLeft: 12,
              }}
            >
              <Text style={{ ...pdfStyles.tableCell }}>Total</Text>
            </View>
            {mergedPeriods.map((group, index) => (
              <View
                key={index}
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontWeight: 'bold',
                  width: colWidth,
                }}
              >
                <Text style={{ ...pdfStyles.tableCell, textAlign: 'right' }}>
                  {group
                    .reduce(
                      (sum, p) =>
                        sum + getSectionPeriodTotal(incomes, p.period),
                      0
                    )
                    .toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </Text>
              </View>
            ))}
            {mergedPeriods.length > 1 && (
              <View
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontWeight: 'bold',
                  width: colWidth,
                  textAlign: 'right',
                }}
              >
                <Text style={{ ...pdfStyles.tableCell }}>
                  {totalRevenue.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            )}
          </View>

          {/* ===== COST OF REVENUE ===== */}
          <View style={{ ...pdfStyles.tableRow, marginTop: 2 }}>
            <View
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                marginTop: 2,
                width: '100%',
              }}
            >
              <Text style={{ ...pdfStyles.tableCell }}>Cost Of Revenue</Text>
            </View>
          </View>
          {directExpenses.map((exp, index) => (
            <View
              key={index}
              style={{
                ...pdfStyles.tableRow,
              }}
            >
              <View
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF',
                  width: colWidth,
                  paddingLeft: 12,
                }}
              >
                <Text>{exp.ledger_name}</Text>
              </View>

              {mergedPeriods.map((group, i) => {
                return (
                  <View
                    key={i}
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF',
                      width: colWidth,
                      textAlign: 'right',
                    }}
                  >
                    <Text>
                      {getAmountByPeriodGroup(exp, group).toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </Text>
                  </View>
                );
              })}
              {mergedPeriods.length > 1 && (
                <View
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF',
                    textAlign: 'right',
                    width: colWidth,
                  }}
                >
                  <Text>
                    {getLedgerTotal(exp).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              )}
            </View>
          ))}
          <View style={{ ...pdfStyles.tableRow, marginTop: 2 }}>
            <View
              style={{
                ...pdfStyles.tableCell,
                backgroundColor: mainColor,
                color: contrastText,
                fontWeight: 'bold',
                width: colWidth,
                paddingLeft: 12,
              }}
            >
              <Text style={{ ...pdfStyles.tableCell }}>Total</Text>
            </View>
            {mergedPeriods.map((group, index) => (
              <View
                key={index}
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontWeight: 'bold',
                  width: colWidth,
                }}
              >
                <Text style={{ ...pdfStyles.tableCell, textAlign: 'right' }}>
                  {group
                    .reduce(
                      (sum, p) =>
                        sum + getSectionPeriodTotal(directExpenses, p.period),
                      0
                    )
                    .toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </Text>
              </View>
            ))}
            {mergedPeriods.length > 1 && (
              <View
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontWeight: 'bold',
                  width: colWidth,
                  textAlign: 'right',
                }}
              >
                <Text style={{ ...pdfStyles.tableCell }}>
                  {totalCostOfRevenue.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            )}
          </View>

          {/* ===== GROSS PROFIT ===== */}
          <View style={{ ...pdfStyles.tableRow, marginTop: 2 }}>
            <View
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                width: colWidth,
              }}
            >
              <Text style={{ ...pdfStyles.tableCell }}>Gross Profit</Text>
            </View>
            {mergedPeriods.map((group, index) => (
              <View
                key={index}
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  width: colWidth,
                }}
              >
                <Text style={{ ...pdfStyles.tableCell, textAlign: 'right' }}>
                  {(
                    group.reduce(
                      (sum, p) =>
                        sum + getSectionPeriodTotal(incomes, p.period),
                      0
                    ) -
                    group.reduce(
                      (sum, p) =>
                        sum + getSectionPeriodTotal(directExpenses, p.period),
                      0
                    )
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            ))}
            {mergedPeriods.length > 1 && (
              <View
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  width: colWidth,
                  textAlign: 'right',
                }}
              >
                <Text style={{ ...pdfStyles.tableCell }}>
                  {(totalRevenue - totalCostOfRevenue).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            )}
          </View>

          {/* ===== OPERATING EXPENSES */}
          <View style={{ ...pdfStyles.tableRow, marginTop: 2 }}>
            <View
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                marginTop: 2,
                width: '100%',
              }}
            >
              <Text style={{ ...pdfStyles.tableCell }}>Operating Expenses</Text>
            </View>
          </View>
          {indirectExpenses.map((exp, index) => (
            <View
              key={index}
              style={{
                ...pdfStyles.tableRow,
              }}
            >
              <View
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF',
                  width: colWidth,
                  paddingLeft: 12,
                }}
              >
                <Text>{exp.ledger_name}</Text>
              </View>

              {mergedPeriods.map((group, i) => {
                return (
                  <View
                    key={i}
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF',
                      width: colWidth,
                      textAlign: 'right',
                    }}
                  >
                    <Text>
                      {getAmountByPeriodGroup(exp, group).toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </Text>
                  </View>
                );
              })}
              {mergedPeriods.length > 1 && (
                <View
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF',
                    textAlign: 'right',
                    width: colWidth,
                  }}
                >
                  <Text>
                    {getLedgerTotal(exp).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              )}
            </View>
          ))}
          <View style={{ ...pdfStyles.tableRow, marginTop: 2 }}>
            <View
              style={{
                ...pdfStyles.tableCell,
                backgroundColor: mainColor,
                color: contrastText,
                fontWeight: 'bold',
                width: colWidth,
                paddingLeft: 12,
              }}
            >
              <Text style={{ ...pdfStyles.tableCell }}>Total</Text>
            </View>
            {mergedPeriods.map((group, index) => (
              <View
                key={index}
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontWeight: 'bold',
                  width: colWidth,
                }}
              >
                <Text style={{ ...pdfStyles.tableCell, textAlign: 'right' }}>
                  {group
                    .reduce(
                      (sum, p) =>
                        sum + getSectionPeriodTotal(indirectExpenses, p.period),
                      0
                    )
                    .toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </Text>
              </View>
            ))}
            {mergedPeriods.length > 1 && (
              <View
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontWeight: 'bold',
                  width: colWidth,
                  textAlign: 'right',
                }}
              >
                <Text style={{ ...pdfStyles.tableCell }}>
                  {totalOperatingExpenses.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            )}
          </View>

          {/* ===== NET INCOME ===== */}
          <View style={{ ...pdfStyles.tableRow, marginTop: 2 }}>
            <View
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                width: colWidth,
              }}
            >
              <Text style={{ ...pdfStyles.tableCell }}>Net Income</Text>
            </View>
            {mergedPeriods.map((group, index) => (
              <View
                key={index}
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  width: colWidth,
                }}
              >
                <Text style={{ ...pdfStyles.tableCell, textAlign: 'right' }}>
                  {(
                    group.reduce(
                      (sum, p) =>
                        sum + getSectionPeriodTotal(incomes, p.period),
                      0
                    ) -
                    group.reduce(
                      (sum, p) =>
                        sum + getSectionPeriodTotal(directExpenses, p.period),
                      0
                    ) -
                    group.reduce(
                      (sum, p) =>
                        sum + getSectionPeriodTotal(indirectExpenses, p.period),
                      0
                    )
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            ))}
            {mergedPeriods.length > 1 && (
              <View
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  width: colWidth,
                  textAlign: 'right',
                }}
              >
                <Text style={{ ...pdfStyles.tableCell }}>
                  {(
                    totalRevenue -
                    totalCostOfRevenue -
                    totalOperatingExpenses
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  ) : (
    ''
  );
};

export default IncomeStatementPDF;
