import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES } from '../styles';
import { createWorkbook } from '../workBook';

export async function exportProductSalesReportExcel(exportedData: any) {
  try {
    const {
      organization,
      rows,
      totals,
      collectionDistribution,
      from,
      to,
      baseCurrencyCode,
      printedBy,
    } = exportedData;

    const wb = createWorkbook();
    const ws = wb.addWorksheet('Product Sales Report');

    ws.columns = [
      { width: 30 }, // Product
      { width: 18 }, // Qty Ordered
      { width: 18 }, // Qty Dispatched
      { width: 18 }, // Qty Undispatched
      { width: 20 }, // Amount Ordered
      { width: 20 }, // Amount Dispatched
      { width: 20 }, // Amount Undispatched
      { width: 20 }, // Payment Received
    ];

    ws.addRow([organization.name, ' ', ' ', ' ', ' ', ' ', ' ', 'PRODUCT SALES REPORT']);
    ws.addRow([
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      `${readableDate(from, true)} - ${readableDate(to, true)}`,
    ]);
    ws.addRow([' ', ' ', ' ', ' ', ' ', ' ', ' ', `Amounts in base currency (${baseCurrencyCode})`]);
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.getCell('H1').font = { bold: true, size: 12 };

    ws.addRow([]);
    const infoRow = ws.addRow(['Printed By', ' ', 'Printed On', ' ', ' ', ' ', ' ', ' ']);
    ws.addRow([printedBy || '', ' ', readableDate(undefined, true), ' ', ' ', ' ', ' ', ' ']);
    infoRow.eachCell((cell) => applyCellStyle(cell, CELL_STYLES.filterLabel));

    ws.addRow([]);

    const headerRow = ws.addRow([
      'Product',
      'Qty Ordered',
      'Qty Dispatched',
      'Qty Undispatched',
      'Amount Ordered',
      'Amount Dispatched',
      'Amount Undispatched',
      'Payment Received',
    ]);
    headerRow.eachCell((cell, colNumber) => {
      applyCellStyle(
        cell,
        colNumber === 1 ? CELL_STYLES.tableHeader : CELL_STYLES.tableHeader
      );
      if (colNumber > 1) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });

    (rows || []).forEach((row: any) => {
      const dataRow = ws.addRow([
        row.product_name,
        row.quantity_ordered,
        row.quantity_dispatched,
        row.quantity_ordered - row.quantity_dispatched,
        row.amount_ordered,
        row.amount_dispatched,
        row.amount_ordered - row.amount_dispatched,
        row.payment_received,
      ]);
      dataRow.eachCell((cell, colNumber) => {
        applyCellStyle(
          cell,
          colNumber === 1 ? CELL_STYLES.dataRowText : CELL_STYLES.dataRowNumeric
        );
        if (colNumber > 1) {
          cell.numFmt = '#,##0.00';
        }
      });
    });

    const totalRow = ws.addRow([
      'Total',
      totals.quantity_ordered,
      totals.quantity_dispatched,
      totals.quantity_ordered - totals.quantity_dispatched,
      totals.amount_ordered,
      totals.amount_dispatched,
      totals.amount_ordered - totals.amount_dispatched,
      totals.payment_received,
    ]);
    totalRow.eachCell((cell, colNumber) => {
      applyCellStyle(
        cell,
        colNumber === 1 ? CELL_STYLES.totalRowText : CELL_STYLES.totalRowNumeric
      );
      if (colNumber > 1) {
        cell.numFmt = '#,##0.00';
      }
    });

    if ((collectionDistribution || []).length) {
      ws.addRow([]);
      const cdHeaderRow = ws.addRow(['Collection Distribution', 'Amount']);
      cdHeaderRow.eachCell((cell, colNumber) => {
        applyCellStyle(cell, CELL_STYLES.tableHeader);
        if (colNumber > 1) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      });

      (collectionDistribution || []).forEach((cd: any) => {
        const cdRow = ws.addRow([cd.name, cd.amount]);
        cdRow.eachCell((cell, colNumber) => {
          applyCellStyle(
            cell,
            colNumber === 1 ? CELL_STYLES.dataRowText : CELL_STYLES.dataRowNumeric
          );
          if (colNumber > 1) {
            cell.numFmt = '#,##0.00';
          }
        });
      });

      const cdTotalRow = ws.addRow([
        'Total',
        (collectionDistribution || []).reduce(
          (sum: number, cd: any) => sum + (cd.amount || 0),
          0
        ),
      ]);
      cdTotalRow.eachCell((cell, colNumber) => {
        applyCellStyle(
          cell,
          colNumber === 1 ? CELL_STYLES.totalRowText : CELL_STYLES.totalRowNumeric
        );
        if (colNumber > 1) {
          cell.numFmt = '#,##0.00';
        }
      });
    }

    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting Product Sales Report Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
