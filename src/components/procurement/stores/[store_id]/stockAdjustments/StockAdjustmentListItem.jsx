import { Box, Chip, Divider, Grid, Tooltip, Typography } from '@mui/material'
import React from 'react'
import StockAdjustmentListItemAction from './StockAdjustmentListItemAction'
import StockAdjustmentApprovalsActionTail from './StockAdjustmentApprovalsActionTail'
import { readableDate } from '@/app/helpers/input-sanitization-helpers'

const STATUS_CHIP_COLOR = {
  in_review: 'info',
  posted: 'success',
  rejected: 'error',
};

function StockAdjustmentListItem({stockAdjustment}) {
  return (
    <>
        <Grid
            sx={{
                cursor: 'pointer',
                '&:hover': {
                    bgcolor: 'action.hover',
                }
            }}
            container 
            columnSpacing={1}
            alignItems={'center'}
        >
            
            <Grid size={{xs: 6, md: 2}}>
                <Tooltip title='Adjustment Date'>
                    <Typography>{`${readableDate(stockAdjustment.adjustment_date)}`}</Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 2}}>
                <Tooltip title='Adjustment No.'>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Typography>{stockAdjustment.adjustmentNo}</Typography>
                        {stockAdjustment.approval_chain && stockAdjustment.status_label && (
                            <Chip
                                label={stockAdjustment.status_label}
                                size="small"
                                color={STATUS_CHIP_COLOR[stockAdjustment.status || ''] || 'default'}
                                variant="outlined"
                            />
                        )}
                    </span>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 1}}>
                <Tooltip title='Reference'>
                    <Typography>{stockAdjustment.reference}</Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 2}}>
                <Tooltip title='Reason'>
                    <Typography>{stockAdjustment.reason}</Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 10, md: 4}}>
                <Tooltip title='Description'>
                    <Typography>{stockAdjustment.narration}</Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 2, md: 1}}>
                <Box display={'flex'} flexDirection={'row'} justifyContent='flex-end' alignItems='center' gap={1} >
                    <StockAdjustmentApprovalsActionTail stockAdjustment={stockAdjustment} />
                    <StockAdjustmentListItemAction stockAdjustment={stockAdjustment} />
                </Box>
            </Grid>
        </Grid>
        <Divider/>
    </>
  )
}

export default StockAdjustmentListItem