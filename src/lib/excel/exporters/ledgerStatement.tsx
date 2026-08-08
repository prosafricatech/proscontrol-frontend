import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES, COLORS } from '../styles';
import { createWorkbook } from '../workBook';

export async function exportLedgerStatement(exportedData: any) {
  try {
    const {
      authOrganization,
      transactionsData,
      user,
      ledger,
      ledgerName,
      increasesWith,
    } = exportedData;

    const organization = authOrganization.organization;
    const costCenters = transactionsData.filters.cost_centers;
    const reportFrom = readableDate(transactionsData.filters.from, true);
    const reportTo = readableDate(transactionsData.filters.to, true);
    const reportPeriod = `${reportFrom} - ${reportTo}`;
    const effectiveLedgerName = ledger?.name || ledgerName || '';

    const hasForeignCurrency = !!transactionsData.filters.ledger?.currency;
    const currencyCode = transactionsData.filters.ledger?.currency?.code || '';

    // ── Process transactions ──────────────────────────────────────────────────
    const [openingBalanceTx, ...restTransactions] =
      transactionsData.transactions;

    const openingBalance = openingBalanceTx
      ? increasesWith === 'DR'
        ? openingBalanceTx.debit - openingBalanceTx.credit
        : openingBalanceTx.credit - openingBalanceTx.debit
      : 0;

    const foreignOpeningBalance = openingBalanceTx && hasForeignCurrency
      ? increasesWith === 'DR'
        ? (openingBalanceTx.debit_foreign || 0) - (openingBalanceTx.credit_foreign || 0)
        : (openingBalanceTx.credit_foreign || 0) - (openingBalanceTx.debit_foreign || 0)
      : 0;

    const totalCredits = restTransactions.reduce(
      (total: number, t: any) => total + (t.credit || 0),
      0
    );
    const totalDebits = restTransactions.reduce(
      (total: number, t: any) => total + (t.debit || 0),
      0
    );

    const totalForeignCredits = hasForeignCurrency ? restTransactions.reduce(
      (total: number, t: any) => total + (t.credit_foreign || 0),
      0
    ) : 0;

    const totalForeignDebits = hasForeignCurrency ? restTransactions.reduce(
      (total: number, t: any) => total + (t.debit_foreign || 0),
      0
    ) : 0;

    // Build table rows
    let runningBalance = openingBalance;
    let foreignRunningBalance = foreignOpeningBalance;

    const tableRows = [];

    if (openingBalanceTx) {
      tableRows.push({
        transactionDate: openingBalanceTx.transactionDate,
        reference: '',
        description: 'Opening Balance',
        correspondingLedger: '',
        debit: null as number | null,
        credit: null as number | null,
        balance: openingBalance,
        debit_foreign: hasForeignCurrency ? (openingBalanceTx.debit_foreign || null) : null,
        credit_foreign: hasForeignCurrency ? (openingBalanceTx.credit_foreign || null) : null,
        balance_foreign: hasForeignCurrency ? foreignOpeningBalance : null,
        isOpeningBalance: true,
      });
    }

    for (const transaction of restTransactions) {
      runningBalance +=
        increasesWith === 'DR'
          ? (transaction.debit || 0) - (transaction.credit || 0)
          : (transaction.credit || 0) - (transaction.debit || 0);

      if (hasForeignCurrency) {
        foreignRunningBalance +=
          increasesWith === 'DR'
            ? (transaction.debit_foreign || 0) - (transaction.credit_foreign || 0)
            : (transaction.credit_foreign || 0) - (transaction.debit_foreign || 0);
      }

      tableRows.push({
        transactionDate: transaction.transactionDate,
        reference:
          `${transaction.voucherNo ? transaction.voucherNo : ''} ${transaction.reference ? transaction.reference : ''}`.trim(),
        description: transaction.description,
        correspondingLedger: transaction.correspondingLedger || '',
        debit: transaction.debit || 0,
        credit: transaction.credit || 0,
        balance: runningBalance,
        debit_foreign: hasForeignCurrency ? (transaction.debit_foreign || null) : null,
        credit_foreign: hasForeignCurrency ? (transaction.credit_foreign || null) : null,
        balance_foreign: hasForeignCurrency ? foreignRunningBalance : null,
        isOpeningBalance: false,
      });
    }

    // ── Workbook & worksheet ───────────────────────────────────────────────────
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Ledger Statement');

    // "Corresponding Ledger" is appended as the last column (rather than inserted
    // after Description) since every other column below is addressed by a
    // hardcoded letter that depends on hasForeignCurrency; appending avoids having
    // to shift all of those.
    const columnCount = hasForeignCurrency ? 10 : 7;
    const correspondingLedgerCol = String.fromCharCode(65 + columnCount - 1);
    if (hasForeignCurrency) {
      ws.columns = [
        { width: 22 }, { width: 22 }, { width: 40 },
        { width: 18 }, { width: 18 }, { width: 18 },
        { width: 18 }, { width: 22 }, { width: 22 },
        { width: 30 }
      ];
    } else {
      ws.columns = [
        { width: 22 }, { width: 22 }, { width: 40 },
        { width: 20 }, { width: 20 }, { width: 22 },
        { width: 30 }
      ];
    }

    let currentRow = 1;

    // ── ROW 1: Organization name ──────────────────────────────────────────────
    ws.getCell(`A${currentRow}`).value = organization.name;
    ws.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    if (hasForeignCurrency) {
      ws.getCell(`I${currentRow}`).value = 'Ledger Statement';
      ws.getCell(`I${currentRow}`).font = { bold: true, size: 12 };
      ws.getCell(`I${currentRow}`).alignment = { horizontal: 'right' };
    } else {
      ws.getCell(`F${currentRow}`).value = 'Ledger Statement';
      ws.getCell(`F${currentRow}`).font = { bold: true, size: 12 };
      ws.getCell(`F${currentRow}`).alignment = { horizontal: 'right' };
    }
    currentRow++;

    // ── ROW 2: Ledger name ────────────────────────────────────────────────────
    const ledgerDisplayName = hasForeignCurrency 
      ? `${effectiveLedgerName} (${currencyCode})`
      : effectiveLedgerName;
    if (hasForeignCurrency) {
      ws.getCell(`I${currentRow}`).value = ledgerDisplayName;
      ws.getCell(`I${currentRow}`).font = { bold: true, size: 11 };
      ws.getCell(`I${currentRow}`).alignment = { horizontal: 'right' };
    } else {
      ws.getCell(`F${currentRow}`).value = ledgerDisplayName;
      ws.getCell(`F${currentRow}`).font = { bold: true, size: 11 };
      ws.getCell(`F${currentRow}`).alignment = { horizontal: 'right' };
    }
    currentRow++;

    // ── ROW 3: Report period ──────────────────────────────────────────────────
    if (hasForeignCurrency) {
      ws.getCell(`I${currentRow}`).value = reportPeriod;
      ws.getCell(`I${currentRow}`).font = { bold: true, size: 10 };
      ws.getCell(`I${currentRow}`).alignment = { horizontal: 'right' };
    } else {
      ws.getCell(`F${currentRow}`).value = reportPeriod;
      ws.getCell(`F${currentRow}`).font = { bold: true, size: 10 };
      ws.getCell(`F${currentRow}`).alignment = { horizontal: 'right' };
    }
    currentRow++;

    // ── ROW 4: Spacer ──────────────────────────────────────────────────────────
    currentRow++;

    // ── ROW 5: INFO LABELS (ALL IN ONE ROW) ──────────────────────────────────
    const infoLabels = hasForeignCurrency
      ? [
          'Total Credits',
          'Total Debits',
          `Total Credits (${currencyCode})`,
          `Total Debits (${currencyCode})`,
          'Printed By',
          'Printed On',
          '', '', ''
        ]
      : [
          'Total Credits',
          'Total Debits',
          'Printed By',
          'Printed On',
          '', ''
        ];

    for (let col = 0; col < columnCount; col++) {
      const cell = ws.getCell(`${String.fromCharCode(65 + col)}${currentRow}`);
      cell.value = infoLabels[col] || '';
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      if (col < 4 || (hasForeignCurrency && col < 4)) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    }
    ws.getRow(currentRow).height = 20;
    currentRow++;

    // ── ROW 6: INFO VALUES (ALL IN ONE ROW) ──────────────────────────────────
    const infoValues = hasForeignCurrency
      ? [
          totalCredits || 0,
          totalDebits || 0,
          totalForeignCredits || 0,
          totalForeignDebits || 0,
          user?.name || '',
          readableDate(undefined, true),
          '', '', ''
        ]
      : [
          totalCredits || 0,
          totalDebits || 0,
          user?.name || '',
          readableDate(undefined, true),
          '', ''
        ];

    for (let col = 0; col < columnCount; col++) {
      const cell = ws.getCell(`${String.fromCharCode(65 + col)}${currentRow}`);
      const value = infoValues[col];
      if (value !== undefined && value !== '') {
        cell.value = value;
        if (col < 4 || (hasForeignCurrency && col < 4)) {
          cell.numFmt = '#,###.00';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      }
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
    }
    ws.getRow(currentRow).height = 18;
    currentRow++;

    // ── ROW 7: Spacer ──────────────────────────────────────────────────────────
    currentRow++;

    // ── ROW 8: Cost Centers ────────────────────────────────────────────────────
    if (Array.isArray(costCenters) && costCenters.length > 0) {
      const ccLabels = ['Cost Centers', '', '', '', '', '', '', '', ''];
      for (let col = 0; col < columnCount; col++) {
        const cell = ws.getCell(`${String.fromCharCode(65 + col)}${currentRow}`);
        cell.value = ccLabels[col] || '';
        applyCellStyle(cell, CELL_STYLES.tableHeader);
      }
      ws.getRow(currentRow).height = 20;
      currentRow++;

      const ccNames = costCenters.map((cc: any) => cc.name).join(', ');
      const cell = ws.getCell(`A${currentRow}`);
      cell.value = ccNames;
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
      ws.getRow(currentRow).height = 18;
      currentRow++;
    }

    // ── ROW 9: Spacer ──────────────────────────────────────────────────────────
    currentRow++;

    // ── TABLE HEADER ROW ──────────────────────────────────────────────────────
    const headers = hasForeignCurrency
      ? ['Date', 'Reference', 'Description', 'Debit', 'Credit', `Debit (${currencyCode})`, `Credit (${currencyCode})`, 'Balance', `Balance (${currencyCode})`, 'Corresponding Ledger']
      : ['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance', 'Corresponding Ledger'];

    for (let col = 0; col < columnCount; col++) {
      const cell = ws.getCell(`${String.fromCharCode(65 + col)}${currentRow}`);
      cell.value = headers[col] || '';
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      // The appended "Corresponding Ledger" column is text, like Description, so
      // it's excluded from the right-alignment applied to the numeric columns.
      if (col >= 3 && col < columnCount - 1) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    }
    ws.getRow(currentRow).height = 25;
    currentRow++;

    // ── DATA ROWS ─────────────────────────────────────────────────────────────
    if (tableRows.length === 0) {
      ws.getCell(`A${currentRow}`).value = 'No transactions found';
      currentRow++;
    } else {
      for (const row of tableRows) {
        const rowNum = currentRow;
        
        ws.getCell(`A${rowNum}`).value = readableDate(row.transactionDate);
        ws.getCell(`B${rowNum}`).value = row.reference || '';
        ws.getCell(`C${rowNum}`).value = row.description || '';
        
        if (row.debit && row.debit !== 0) {
          ws.getCell(`D${rowNum}`).value = row.debit;
          ws.getCell(`D${rowNum}`).numFmt = '#,###.00';
        } else {
          ws.getCell(`D${rowNum}`).value = null;
        }
        
        if (row.credit && row.credit !== 0) {
          ws.getCell(`E${rowNum}`).value = row.credit;
          ws.getCell(`E${rowNum}`).numFmt = '#,###.00';
        } else {
          ws.getCell(`E${rowNum}`).value = null;
        }

        if (hasForeignCurrency) {
          if (row.debit_foreign && row.debit_foreign !== 0) {
            ws.getCell(`F${rowNum}`).value = row.debit_foreign;
            ws.getCell(`F${rowNum}`).numFmt = '#,###.00';
          } else {
            ws.getCell(`F${rowNum}`).value = null;
          }

          if (row.credit_foreign && row.credit_foreign !== 0) {
            ws.getCell(`G${rowNum}`).value = row.credit_foreign;
            ws.getCell(`G${rowNum}`).numFmt = '#,###.00';
          } else {
            ws.getCell(`G${rowNum}`).value = null;
          }

          if (row.balance_foreign !== null && row.balance_foreign !== undefined) {
            const balanceDisplay = Math.abs(row.balance_foreign) < 0.005 ? 0 : row.balance_foreign;
            ws.getCell(`I${rowNum}`).value = balanceDisplay;
            ws.getCell(`I${rowNum}`).numFmt = '#,###.00';
          } else {
            ws.getCell(`I${rowNum}`).value = null;
          }
        }

        const balanceDisplay = Math.abs(row.balance) < 0.005 ? 0 : row.balance;
        const balanceCol = hasForeignCurrency ? 'H' : 'F';
        ws.getCell(`${balanceCol}${rowNum}`).value = balanceDisplay;
        ws.getCell(`${balanceCol}${rowNum}`).numFmt = '#,###.00';

        ws.getCell(`${correspondingLedgerCol}${rowNum}`).value = row.correspondingLedger || '';

        for (let col = 0; col < columnCount; col++) {
          const cell = ws.getCell(`${String.fromCharCode(65 + col)}${rowNum}`);
          applyCellStyle(cell, CELL_STYLES.dataRowText);
          if (col >= 3 && col < columnCount - 1) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        }

        ws.getCell(`C${rowNum}`).alignment = { wrapText: true, vertical: 'top' };
        ws.getCell(`${correspondingLedgerCol}${rowNum}`).alignment = { wrapText: true, vertical: 'top' };

        if (row.isOpeningBalance) {
          for (let col = 0; col < columnCount; col++) {
            const cell = ws.getCell(`${String.fromCharCode(65 + col)}${rowNum}`);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
          }
        }

        currentRow++;
      }
    }

    // ── TOTAL ROW ─────────────────────────────────────────────────────────────
    const totalRowNum = currentRow;
    ws.getRow(totalRowNum).height = 20;

    ws.mergeCells(`A${totalRowNum}:C${totalRowNum}`);
    const totalLabelCell = ws.getCell(`A${totalRowNum}`);
    totalLabelCell.value = 'TOTAL';
    totalLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };
    applyCellStyle(totalLabelCell, CELL_STYLES.tableHeader);

    for (let col = 0; col < columnCount; col++) {
      const cell = ws.getCell(`${String.fromCharCode(65 + col)}${totalRowNum}`);
      if (col >= 3) {
        applyCellStyle(cell, CELL_STYLES.tableHeader);
        if (col < columnCount - 1) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      }
    }

    ws.getCell(`D${totalRowNum}`).value = totalDebits || 0;
    ws.getCell(`D${totalRowNum}`).numFmt = '#,###.00';
    ws.getCell(`E${totalRowNum}`).value = totalCredits || 0;
    ws.getCell(`E${totalRowNum}`).numFmt = '#,###.00';

    if (hasForeignCurrency) {
      ws.getCell(`F${totalRowNum}`).value = totalForeignDebits || 0;
      ws.getCell(`F${totalRowNum}`).numFmt = '#,###.00';
      ws.getCell(`G${totalRowNum}`).value = totalForeignCredits || 0;
      ws.getCell(`G${totalRowNum}`).numFmt = '#,###.00';
      ws.getCell(`H${totalRowNum}`).value = null;
      ws.getCell(`I${totalRowNum}`).value = null;
    } else {
      ws.getCell(`F${totalRowNum}`).value = null;
    }

    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting Ledger Statement Excel:', e);
    throw new Error(e?.message || 'Excel export failed during workbook generation');
  }
};