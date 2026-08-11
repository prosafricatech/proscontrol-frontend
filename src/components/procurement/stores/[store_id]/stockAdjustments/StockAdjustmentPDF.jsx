import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import {Document, Page, Text, View } from '@react-pdf/renderer'
import React from 'react'

function StockAdjustmentPDF({stockAdjustment,authObject}) {
    const {authOrganization : { organization }, authUser : { user}} = authObject;
    const mainColor = organization.settings?.main_color || "#2113AD";
    const lightColor = organization.settings?.light_color || "#bec5da";
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";

    // Calculate total value change
    const totalValueChange = stockAdjustment.inventory_movements.reduce(
      (sum, movement) => sum + (movement.rate * movement.stock_change),
      0
    );

  return (
    <Document
        title={`${stockAdjustment.adjustmentNo} | ${organization?.name}`}
        author={stockAdjustment.creator?.name}
        subject={'Stock Adjustment Document'}
        keywords={stockAdjustment.narration}
        creator={`${user && user.name} | Powered By ProsERP`}
        producer='ProsERP'
    >
        <Page size="A4" style={pdfStyles.page}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
              <PdfLogo organization={organization}/>
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{...pdfStyles.majorInfo, color: mainColor }}>STOCK ADJUSTMENT</Text>
              <Text style={{ ...pdfStyles.midInfo}}>{stockAdjustment.adjustmentNo}</Text>
            </View>
          </View>
          <View style={{ ...pdfStyles.tableRow}}>
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{...pdfStyles.minInfo, color: mainColor }}>Adjustment Date</Text>
              <Text style={{...pdfStyles.minInfo }}>{readableDate(stockAdjustment.adjustment_date)}</Text>
            </View>
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{...pdfStyles.minInfo, color: mainColor }}>Store</Text>
              <Text style={{...pdfStyles.minInfo }}>{stockAdjustment.store?.name}</Text>
            </View>
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{...pdfStyles.minInfo, color: mainColor }}>Cost Center</Text>
              <Text style={{...pdfStyles.minInfo }}>{stockAdjustment.cost_center?.name}</Text>
            </View>
          </View>
          <View style={{...pdfStyles.table, minHeight: 230,marginTop: 10 }}>
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.5 }}>S/N</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 4 }}>Product</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.5 }}>Unit</Text>
              <View style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>
                <Text>Qty</Text>
                <Text>Before</Text>
              </View>
              <View style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>
                <Text>Qty</Text>
                <Text>After</Text>
              </View>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 1}}>Stock Change</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 2}}>Unit Cost</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 2}}>Value Change</Text>
            </View>
            {
              stockAdjustment.inventory_movements.map((movement,index) => {
                const valueChange = movement.rate * movement.stock_change;
                return (
                  <View key={index} style={pdfStyles.tableRow}>
                    <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.5 }}>{index+1}</Text>
                    <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 4 }}>{movement.product?.name}</Text>
                    <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.5 }}>{movement.product.measurement_unit.symbol}</Text>
                    <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 1, textAlign : 'right' }}>{movement.balance_before}</Text>
                    <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 1, textAlign : 'right' }}>{movement.actual_stock}</Text>
                    <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 1, textAlign : 'right' }}>{movement.stock_change}</Text>
                    <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 2, textAlign : 'right' }}>{movement.rate.toLocaleString()}</Text>
                    <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 2, textAlign : 'right' }}>{valueChange.toLocaleString()}</Text>
                  </View>
                  )
                }
              )
            }
            {/* Total row */}
            <View style={{...pdfStyles.tableRow}}>
              <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader,backgroundColor: mainColor, color: contrastText, flex : 11, textAlign : 'right'   }}>Total</Text>
              <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader,backgroundColor: mainColor, color: contrastText, flex : 2, textAlign : 'right'   }}>
                {totalValueChange.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={{ ...pdfStyles.tableRow,marginTop: 20}}>
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{...pdfStyles.minInfo, color: mainColor }}>Adjustment Reason</Text>
              <Text style={{...pdfStyles.minInfo }}>{stockAdjustment.reason}</Text>
            </View>
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{...pdfStyles.minInfo, color: mainColor }}>Narration</Text>
              <Text style={{...pdfStyles.minInfo }}>{stockAdjustment.narration}</Text>
            </View>
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{...pdfStyles.minInfo, color: mainColor }}>Posted By</Text>
              <Text style={{...pdfStyles.minInfo }}>{stockAdjustment.creator?.name}</Text>
            </View>
          </View>
        </Page>
      </Document>
  )
}

export default StockAdjustmentPDF