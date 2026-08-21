import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import {
  applyCellStyle,
  CELL_STYLES,
  COLORS,
  getAlternatingRowFill,
} from '../styles';
import { getExcelColumnName } from '../uitls';
import { createWorkbook } from '../workBook';

const AMT_FMT = '#,###.00';

function styleHeaderRow(ws: any, rowNum: number, totalCols: number) {
  for (let i = 1; i <= totalCols; i++) {
    applyCellStyle(
      ws.getCell(`${getExcelColumnName(i)}${rowNum}`),
      CELL_STYLES.tableHeader
    );
  }
}

function setNum(cell: any, value: any, fmt: string) {
  cell.value = value ?? null;
  if (value != null) {
    cell.numFmt = fmt;
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
  }
}

export async function exportPurchasesReportToExcel(exportedData: any) {
  try {
    const { reportData, baseCurrency, authOrganization, user } = exportedData;

    const orgName = authOrganization.organization.name || '';
    const costCenters = reportData.filters.cost_centers;
    const suppliers = reportData.filters.suppliers;
    const currency = reportData.filters.currency;

    const showForeignCurrency = currency?.is_base !== 1;

    // Replicate PDF totals logic verbatim
    const totalOrderAmount = reportData.orders.reduce(
      (total: number, order: any) => total + order.amount * order.exchange_rate,
      0
    );
    const totalReceivedAmount = reportData.orders.reduce(
      (total: number, order: any) =>
        total + order.received_amount * order.exchange_rate,
      0
    );
    const totalBalance = reportData.orders.reduce(
      (total: number, order: any) =>
        total + (order.amount - order.received_amount) * order.exchange_rate,
      0
    );

    // Column layout (1-based)
    // Without foreign: S/N | Order Date & No | Supplier | Cost Center | Order Amt | Received Amt | Balance
    // With foreign:    S/N | Order Date & No | Supplier | Cost Center | [Fx Order | Fx Received | Fx Balance] | Order Amt | Received Amt | Balance
    const COL_SN = 1;
    const COL_ORDER_DATE_NO = 2;
    const COL_SUPPLIER = 3;
    const COL_COST_CENTER = 4;
    const COL_FX_ORDER = showForeignCurrency ? 5 : null;
    const COL_FX_RECEIVED = showForeignCurrency ? 6 : null;
    const COL_FX_BALANCE = showForeignCurrency ? 7 : null;
    const baseOffset = showForeignCurrency ? 3 : 0;
    const COL_ORDER_AMOUNT = 5 + baseOffset;
    const COL_RECEIVED_AMOUNT = 6 + baseOffset;
    const COL_BALANCE = 7 + baseOffset;
    const TOTAL_COLS = COL_BALANCE;
    const lastCol = getExcelColumnName(TOTAL_COLS);

    const wb = createWorkbook();
    const ws = wb.addWorksheet('Purchases Report');

    ws.getColumn(getExcelColumnName(COL_SN)).width = 8;
    ws.getColumn(getExcelColumnName(COL_ORDER_DATE_NO)).width = 30;
    ws.getColumn(getExcelColumnName(COL_SUPPLIER)).width = 28;
    ws.getColumn(getExcelColumnName(COL_COST_CENTER)).width = 28;
    if (showForeignCurrency) {
      ws.getColumn(getExcelColumnName(COL_FX_ORDER!)).width = 22;
      ws.getColumn(getExcelColumnName(COL_FX_RECEIVED!)).width = 22;
      ws.getColumn(getExcelColumnName(COL_FX_BALANCE!)).width = 22;
    }
    ws.getColumn(getExcelColumnName(COL_ORDER_AMOUNT)).width = 22;
    ws.getColumn(getExcelColumnName(COL_RECEIVED_AMOUNT)).width = 22;
    ws.getColumn(getExcelColumnName(COL_BALANCE)).width = 22;

    // Row 1: Org name (A) + Report title (last col)
    const r1 = Array(TOTAL_COLS).fill(' ');
    r1[0] = orgName;
    r1[TOTAL_COLS - 1] = 'Purchases Report';
    ws.addRow(r1);
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.getCell(`${lastCol}1`).font = { bold: true, size: 12 };
    ws.getCell(`${lastCol}1`).alignment = { horizontal: 'right' };

    // Row 2: Period (last col)
    const r2 = Array(TOTAL_COLS).fill(' ');
    r2[TOTAL_COLS - 1] =
      `${readableDate(reportData.filters.from, true)} - ${readableDate(reportData.filters.to, true)}`;
    ws.addRow(r2);
    ws.getCell(`${lastCol}2`).font = { bold: true, size: 10 };
    ws.getCell(`${lastCol}2`).alignment = { horizontal: 'right' };

    // Row 3: Spacer
    ws.addRow([]);

    // Meta section — vertical list (label col A, value col B)
    const addMetaRow = (label: string, value: string) => {
      const rowNum = (ws.lastRow?.number ?? 0) + 1;
      const row = Array(TOTAL_COLS).fill('');
      row[0] = label;
      row[1] = value;
      ws.addRow(row);
      if (label) {
        ws.getCell(`A${rowNum}`).font = {
          bold: true,
          size: 9,
          color: { argb: COLORS.GRAY },
        };
      }
      ws.getCell(`B${rowNum}`).font = { size: 10 };
      ws.getRow(rowNum).height = 16;
    };

    if (suppliers?.length > 0) {
      addMetaRow('Suppliers', suppliers.map((s: any) => s.name).join(', '));
    }
    if (currency?.name) {
      addMetaRow('Currency', currency.name);
    }
    if (costCenters?.length > 0) {
      costCenters.forEach((cc: any, i: number) => {
        addMetaRow(i === 0 ? 'Cost Centers' : '', cc.name);
      });
    }
    addMetaRow('Printed By', user.name);
    addMetaRow('Printed On', readableDate(undefined, true));

    // Spacer before table
    ws.addRow([]);

    // Table header row
    const headerRowNum = (ws.lastRow?.number ?? 0) + 1;

    const setHdr = (col: number, label: string, alignRight = false) => {
      const cell = ws.getCell(`${getExcelColumnName(col)}${headerRowNum}`);
      cell.value = label;
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      cell.alignment = {
        horizontal: alignRight ? 'right' : 'center',
        vertical: 'middle',
        wrapText: true,
      };
    };

    setHdr(COL_SN, 'S/N');
    setHdr(COL_ORDER_DATE_NO, 'Order Date & No');
    setHdr(COL_SUPPLIER, 'Supplier');
    setHdr(COL_COST_CENTER, 'Cost Center');

    if (showForeignCurrency) {
      setHdr(COL_FX_ORDER!, `Order Amount`, true);
      setHdr(COL_FX_RECEIVED!, `Received Amount`, true);
      setHdr(COL_FX_BALANCE!, `Balance`, true);
    }

    setHdr(COL_ORDER_AMOUNT, `Order Amount (${baseCurrency?.code})`, true);
    setHdr(
      COL_RECEIVED_AMOUNT,
      `Received Amount (${baseCurrency?.code})`,
      true
    );
    setHdr(COL_BALANCE, `Balance (${baseCurrency?.code})`, true);

    ws.getRow(headerRowNum).height = 28;

    // Data rows
    reportData.orders.forEach((order: any, index: number) => {
      const rowNum = (ws.lastRow?.number ?? 0) + 1;
      const fill = getAlternatingRowFill(index);

      const setTxt = (col: number, value: string) => {
        const cell = ws.getCell(`${getExcelColumnName(col)}${rowNum}`);
        cell.value = value;
        applyCellStyle(cell, { ...CELL_STYLES.dataRowText, fill });
      };

      const setNumCell = (col: number, value: number) => {
        const cell = ws.getCell(`${getExcelColumnName(col)}${rowNum}`);
        applyCellStyle(cell, { ...CELL_STYLES.dataRowNumeric, fill });
        setNum(cell, value, AMT_FMT);
      };

      setTxt(COL_SN, String(index + 1));
      ws.getCell(`${getExcelColumnName(COL_SN)}${rowNum}`).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };

      // PDF: readableDate(order.order_date) + order.orderNo in one cell
      setTxt(
        COL_ORDER_DATE_NO,
        `${readableDate(order.order_date)} ${order.orderNo}`
      );

      setTxt(COL_SUPPLIER, order.stakeholder?.name || '');
      setTxt(
        COL_COST_CENTER,
        (order.cost_centers || []).map((cc: any) => cc.name).join(', ')
      );

      if (showForeignCurrency) {
        setNumCell(COL_FX_ORDER!, order.amount);
        setNumCell(COL_FX_RECEIVED!, order.received_amount);
        setNumCell(COL_FX_BALANCE!, order.amount - order.received_amount);

        const fxFmt = `"${order.currency?.code || ''} "#,###.00`;
        ws.getCell(`${getExcelColumnName(COL_FX_ORDER!)}${rowNum}`).numFmt =
          fxFmt;
        ws.getCell(`${getExcelColumnName(COL_FX_RECEIVED!)}${rowNum}`).numFmt =
          fxFmt;
        ws.getCell(`${getExcelColumnName(COL_FX_BALANCE!)}${rowNum}`).numFmt =
          fxFmt;
      }

      setNumCell(COL_ORDER_AMOUNT, order.amount * order.exchange_rate);
      setNumCell(
        COL_RECEIVED_AMOUNT,
        order.received_amount * order.exchange_rate
      );
      setNumCell(
        COL_BALANCE,
        (order.amount - order.received_amount) * order.exchange_rate
      );

      ws.getRow(rowNum).height = 16;
    });

    // Total row — merge S/N through the column before Order Amount (base)
    const totalRowNum = (ws.lastRow?.number ?? 0) + 1;
    ws.addRow([]);

    const totalLabelEndCol = getExcelColumnName(COL_ORDER_AMOUNT - 1);
    ws.mergeCells(`A${totalRowNum}:${totalLabelEndCol}${totalRowNum}`);
    ws.getCell(`A${totalRowNum}`).value = 'TOTAL';
    styleHeaderRow(ws, totalRowNum, TOTAL_COLS);
    ws.getCell(`A${totalRowNum}`).alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };

    const baseFmt = `"${baseCurrency.symbol} "#,###.00`;

    const setTotalCell = (col: number, value: number) => {
      const cell = ws.getCell(`${getExcelColumnName(col)}${totalRowNum}`);
      cell.value = value;
      cell.numFmt = baseFmt;
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    };

    setTotalCell(COL_ORDER_AMOUNT, totalOrderAmount);
    setTotalCell(COL_RECEIVED_AMOUNT, totalReceivedAmount);
    setTotalCell(COL_BALANCE, totalBalance);

    ws.getRow(totalRowNum).height = 20;

    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting purchases report to Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
