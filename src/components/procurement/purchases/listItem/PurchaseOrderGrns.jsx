import React, { useContext, useState } from 'react'
import { Box, Chip, Dialog, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { AttachmentOutlined, ReceiptLongOutlined, UndoOutlined, VisibilityOutlined, EditOutlined } from '@mui/icons-material';
import { listItemContext } from './PurchaseOrderListItem';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import PurchaseBillFormDialog from '../../grns/PurchaseBillFormDialog';

function PurchaseOrderGrns({order}) {
    const { setOpenEditReceive, setAttachDialog, setSelectedOrderGrn, setOpenDialog, setOpenDocumentDialog, purchaseOrderGrns } = useContext(listItemContext);
    const {checkOrganizationPermission, authOrganization: { organization }} = useJumboAuth();
    const deferGrnBilling = !!organization?.settings?.defer_grn_billing;
    const [billGrn, setBillGrn] = useState(null);

  return (
    <React.Fragment>
        {purchaseOrderGrns?.length > 0 && <Typography variant="body1">Order Grns</Typography>}
        {purchaseOrderGrns &&
        purchaseOrderGrns.map((orderGrn) => (
            <Grid
                key={orderGrn.id}
                sx={{
                    cursor: 'pointer',
                    borderTop: 1,
                    borderColor: 'divider',
                    '&:hover': {
                        bgcolor: 'action.hover',
                    },
                    paddingX: 1,
                    width: '100%', m: 0 
                }}
                container
                columnSpacing={1}
                alignItems="center"
            >
                <Grid size={{xs: 6, md: 3}}>
                    <Tooltip title={'Date Received'}>
                        <Typography>
                            {readableDate(orderGrn?.date_received)}
                        </Typography>
                    </Tooltip>
                </Grid>
                <Grid size={{xs: 6, md: 3}}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Tooltip title={'Grn No.'}>
                            <Typography>{orderGrn?.grnNo}</Typography>
                        </Tooltip>
                        {deferGrnBilling && orderGrn.billed && (
                            <Tooltip title='A Purchase Bill has been created for this GRN'>
                                <Chip size='small' variant='outlined' color='success' label='Billed' />
                            </Tooltip>
                        )}
                        {deferGrnBilling && orderGrn.billed === false && orderGrn.unbilled_amount > 0 && (
                            <Tooltip title='Not yet billed to the supplier'>
                                <Chip size='small' variant='outlined' color='warning' label='Unbilled' />
                            </Tooltip>
                        )}
                    </Stack>
                        <Tooltip title={'Reference'}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {orderGrn?.reference}
                            </Typography>
                        </Tooltip>
                </Grid>
                <Grid size={{xs: 6, md: 4}}>
                    <Tooltip title={'Store'}>
                        <Typography>{orderGrn?.store.name}</Typography>
                    </Tooltip>
                </Grid>
                <Grid size={{xs: 6, md: 2}}>
                    <Box
                        display={'flex'}
                        flexDirection={'row'}
                        justifyContent={'flex-end'}
                    >
                        {!orderGrn.billed && order.status !== 'Instantly Received' && order.status !== 'Closed' && checkOrganizationPermission([PERMISSIONS.PURCHASES_UNRECEIVE]) &&
                            <Tooltip title={`Unreceive ${orderGrn.grnNo}`}>
                                <IconButton
                                    onClick={() => {
                                        setSelectedOrderGrn(orderGrn);
                                        setOpenDialog(true);
                                    }}
                                >
                                    <UndoOutlined color='error'/>
                                </IconButton>
                            </Tooltip>
                        }

                        {!orderGrn.billed &&
                            <Tooltip title={`Edit ${orderGrn.grnNo}`}>
                                <IconButton
                                    onClick={() => {
                                        setSelectedOrderGrn(orderGrn);
                                        setOpenEditReceive(true);
                                    }}
                                >
                                    <EditOutlined/>
                                </IconButton>
                            </Tooltip>
                        }

                        <Tooltip  title={`${orderGrn.grnNo} Attachments`}>
                            <IconButton onClick={() => {
                                setSelectedOrderGrn(orderGrn);
                                setAttachDialog(true);
                                setOpenDocumentDialog(false)
                            }}>
                            <AttachmentOutlined/>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={`View ${orderGrn.grnNo}`}>
                            <IconButton
                                onClick={() => {
                                    setSelectedOrderGrn(orderGrn);
                                    setOpenDocumentDialog(true);
                                }}
                            >
                                <VisibilityOutlined
                                    style={{ marginRight: '8px' }}
                                />
                            </IconButton>
                        </Tooltip>

                        {deferGrnBilling && !orderGrn.billed && orderGrn.unbilled_amount > 0 &&
                            checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE]) &&
                            <Tooltip title={`Create Purchase Bill for ${orderGrn.grnNo}`}>
                                <IconButton onClick={() => setBillGrn(orderGrn)}>
                                    <ReceiptLongOutlined />
                                </IconButton>
                            </Tooltip>
                        }
                    </Box>
                </Grid>
            </Grid>
        ))}

        <Dialog
            open={!!billGrn}
            onClose={() => setBillGrn(null)}
            fullWidth
            maxWidth='lg'
        >
            {billGrn && (
                <PurchaseBillFormDialog
                    grn={billGrn}
                    setOpenDialog={(open) => !open && setBillGrn(null)}
                />
            )}
        </Dialog>
    </React.Fragment>
  )
}

export default PurchaseOrderGrns
