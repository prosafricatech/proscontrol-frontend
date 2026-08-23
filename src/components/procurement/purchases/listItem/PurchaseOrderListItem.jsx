import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Attachment } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { createContext, lazy, useState } from 'react';
import purchaseServices from '../purchase-services';
import PurchaseOrderListItemAction from './PurchaseOrderListItemAction';

export const listItemContext = createContext({});

const PurchaseOrderGrns = lazy(() => import('./PurchaseOrderGrns'));
const PurchaseOrderGrnsItemAction = lazy(
  () => import('./PurchaseOrderGrnsItemAction')
);

const PurchaseOrderListItem = ({ order }) => {
  const { checkOrganizationPermission } = useJumboAuth();
  const [expanded, setExpanded] = useState(false);
  const [selectedOrderGrn, setSelectedOrderGrn] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);
  const [poAttachDialog, setPoAttachDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [openEditReceive, setOpenEditReceive] = React.useState(false);

  const { data: purchaseOrderGrns, isLoading } = useQuery({
    queryKey: ['purchaseOrderGrns', { orderId: order.id }],
    queryFn: () => purchaseServices.getPurchaseOrderGrns(order.id),
    enabled: expanded,
  });

  return (
    <listItemContext.Provider
      value={{
        attachDialog,
        setAttachDialog,
        poAttachDialog,
        setPoAttachDialog,
        purchaseOrderGrns,
        expanded,
        setExpanded,
        selectedOrderGrn,
        setSelectedOrderGrn,
        openDialog,
        setOpenDialog,
        openDocumentDialog,
        setOpenDocumentDialog,
        openEditReceive,
        setOpenEditReceive,
      }}
    >
      <React.Fragment>
        <Accordion
          expanded={expanded}
          square
          sx={{
            borderRadius: 2,
            borderTop: 2,
            borderColor: 'divider',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onChange={() => setExpanded((prevExpanded) => !prevExpanded)}
        >
          <AccordionSummary
            expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
            sx={{
              px: 2,
              flexDirection: 'row-reverse',
              '.MuiAccordionSummary-content': {
                alignItems: 'center',
                minWidth: 0,
                '&.Mui-expanded': {
                  margin: '10px 0',
                },
              },
              '.MuiAccordionSummary-expandIconWrapper': {
                borderRadius: 1,
                border: 1,
                color: 'text.secondary',
                transform: 'none',
                mr: 1,
                '&.Mui-expanded': {
                  transform: 'none',
                  color: 'primary.main',
                  borderColor: 'primary.main',
                },
                '& svg': {
                  fontSize: '0.9rem',
                },
              },
            }}
          >
            <Grid
              container
              spacing={1}
              alignItems='center'
              sx={{ width: '100%', m: 0, minWidth: 0 }}
            >
              <Grid size={{ xs: 12, md: 2.5 }}>
                <ListItemText
                  primary={
                    <>
                      <Stack direction={'row'}>
                        <Tooltip title='Order No.'>
                          <Typography>{order.orderNo}</Typography>
                        </Tooltip>
                        {!!order?.requisitionNo && (
                          <Tooltip title='Requisition No.'>
                            <Typography variant='caption' color={'gray'}>
                              {' '}
                              &nbsp;{` - ${order.requisitionNo}`}
                            </Typography>
                          </Tooltip>
                        )}
                      </Stack>
                      <Stack direction={'column'}>
                        <Tooltip title='Date'>
                          <Typography variant='caption'>
                            {readableDate(order.order_date)}
                          </Typography>
                        </Tooltip>
                        {order?.reference && (
                          <Tooltip title={'Reference'}>
                            <Typography variant='caption' mt={1}>
                              {order?.reference}
                            </Typography>
                          </Tooltip>
                        )}
                      </Stack>
                    </>
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4.5 }} sx={{ minWidth: 0 }}>
                <Tooltip title={order.stakeholder.name}>
                  <Typography noWrap>{order.stakeholder.name}</Typography>
                </Tooltip>
                {order.cost_centers.length > 0 && (
                  <Stack
                    direction='row'
                    flexWrap='wrap'
                    gap={0.5}
                    mt={0.5}
                    sx={{ width: '100%', minWidth: 0 }}
                  >
                    {order.cost_centers.map((cc) => (
                      <Tooltip key={cc.id} title={cc.name}>
                        <Chip
                          size='small'
                          label={cc.name}
                          sx={{
                            maxWidth: '100%',
                            minWidth: 0,
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            },
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Stack>
                )}
              </Grid>

              <Grid
                size={{ xs: 11, md: 4 }}
                display={'flex'}
                alignItems={'center'}
                justifyContent={'space-between'}
              >
                <Stack direction='row' spacing={0.5} alignItems='center'>
                  <Tooltip title={'Status'}>
                    <Chip
                      size='small'
                      label={order.status}
                      color={
                        order.status === 'Completed' ||
                        order.status === 'Fully Received' ||
                        order.status === 'Instantly Received'
                          ? 'success'
                          : order.status === 'Partially Received'
                            ? 'warning'
                            : order.status === 'Closed'
                              ? 'info'
                              : 'primary'
                      }
                    />
                  </Tooltip>
                  {order.billed && (
                    <Tooltip title='A Purchase Bill has been created for this order'>
                      <Chip size='small' variant='outlined' color='success' label='Billed' />
                    </Tooltip>
                  )}
                  {order.billed === false && order.unbilled_amount > 0 && (
                    <Tooltip title='Not yet billed to the supplier'>
                      <Chip size='small' variant='outlined' color='warning' label='Unbilled' />
                    </Tooltip>
                  )}
                </Stack>
                {checkOrganizationPermission(PERMISSIONS.PURCHASES_CREATE) && (
                  <Tooltip title={'Amount'}>
                    <Typography>
                      {(order.amount + order.vat_amount).toLocaleString(
                        'en-US',
                        {
                          style: 'currency',
                          currency: order.currency.code,
                        }
                      )}
                    </Typography>
                  </Tooltip>
                )}
              </Grid>

              <Grid size={{ xs: 1, md: 1 }} textAlign={'right'}>
                <Tooltip title='Attachments'>
                  <IconButton
                    size='small'
                    onClick={(event) => {
                      event.stopPropagation();
                      setPoAttachDialog(true);
                    }}
                  >
                    <Badge
                      badgeContent={
                        (order.attachments_count || 0) +
                        (order.requisition_attachments_count || 0)
                      }
                      color='info'
                    >
                      <Attachment fontSize='small' />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
            <Divider />
          </AccordionSummary>
          <AccordionDetails
            sx={{
              backgroundColor: 'background.paper',
              marginBottom: 3,
            }}
          >
            {isLoading && <LinearProgress />}
            <Grid container>
              <Grid size={12} textAlign={'end'}>
                <PurchaseOrderListItemAction order={order} />
              </Grid>

              {/*OrderGrns*/}
              <PurchaseOrderGrns order={order} />
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/*OrderGrnsItemAction*/}
        <PurchaseOrderGrnsItemAction order={order} />
      </React.Fragment>
    </listItemContext.Provider>
  );
};

export default PurchaseOrderListItem;
