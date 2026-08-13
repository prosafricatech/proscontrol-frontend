import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Attachment, VerifiedRounded } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Chip,
  Grid,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import AttachmentForm from '../../../filesShelf/attachments/AttachmentForm';
import { Requisition } from '../../RequisitionType';
import {
  processTypeConfig,
  requisitionAmountDisplay,
} from '../../utils/requisition';
import RequisitionsItemAction from './RequisitionsItemAction';
import ApprovalsTab from './tabs/ApprovalsTab';

interface RequisitionsListItemProps {
  requisition: Requisition;
}

const RequisitionsListItem = ({ requisition }: RequisitionsListItemProps) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (id: number) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [id]: !prevExpanded[id],
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const processConfig = processTypeConfig[
    requisition.process_type as keyof typeof processTypeConfig
  ] || {
    label: requisition.process_type,
    color: 'default' as const,
  };

  return (
    <Accordion
      key={requisition.id}
      expanded={!!expanded[requisition.id]}
      onChange={() => handleChange(requisition.id)}
      square
      sx={{
        borderRadius: 2,
        borderTop: 2,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <AccordionSummary
        expandIcon={expanded[requisition.id] ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 2,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': {
              margin: '10px 0',
            },
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',
            transform: 'none',
            mr: 0.5,
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
          alignItems={'center'}
          width={'100%'}
          paddingLeft={1}
          paddingRight={1}
        >
          <Grid size={{ xs: 12, md: 2 }}>
            <Tooltip title='Requistion No.'>
              <Typography>{requisition.requisitionNo}</Typography>
            </Tooltip>
            <Tooltip title='Requistion Date'>
              <Typography variant='caption'>
                {readableDate(requisition.requisition_date)}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Tooltip title='Process'>
              <Typography variant='body2'>{processConfig.label}</Typography>
            </Tooltip>
            <Tooltip title={'Cost Center'}>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ display: 'block', mt: 0.5 }}
              >
                {requisition.cost_center?.name || '-'}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 12, md: 4, lg: 4 }}>
            <Tooltip title={'Remarks'}>
              <Typography
                component='span'
                variant='body2'
                fontSize={14}
                mb={0}
                sx={{ flexWrap: 'wrap' }}
              >
                {requisition.remarks}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 8, md: 2.5, lg: 2 }}>
            <Tooltip title='Amount'>
              <Typography>
                {requisitionAmountDisplay(
                  requisition,
                  requisition.currency?.code
                )}
              </Typography>
            </Tooltip>
            <Tooltip title='Status'>
              <Chip
                size='small'
                label={requisition.status_label}
                color={
                  requisition.status === 'suspended'
                    ? 'primary'
                    : requisition.status?.toLowerCase() === 'rejected'
                      ? 'error'
                      : requisition.status?.toLowerCase() === 'on hold'
                        ? 'warning'
                        : requisition.status?.toLowerCase() === 'returned'
                          ? 'secondary'
                          : requisition.status?.toLowerCase() === 'submitted' &&
                              requisition.status_label?.toLowerCase() ===
                                'completed'
                            ? 'success'
                            : 'info'
                }
              />
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 4, md: 1 }}>
            <Stack
              direction='row'
              mt={2}
              spacing={2}
              justifyContent='flex-end'
              alignItems='center'
            >
              {!!requisition?.attachments_count && (
                <Tooltip title='Attachments Count'>
                  <Badge
                    badgeContent={requisition.attachments_count}
                    color='info'
                  >
                    <Attachment fontSize='small' />
                  </Badge>
                </Tooltip>
              )}
              {(requisition.process_type === 'PAYMENT'
                ? requisition.is_fully_paid
                : requisition.process_type === 'MATERIAL'
                  ? (requisition as any).is_fully_fulfilled
                  : requisition.is_fully_ordered) && (
                <Tooltip
                  title={
                    requisition.process_type === 'PAYMENT'
                      ? 'Fully Paid'
                      : requisition.process_type === 'MATERIAL'
                        ? 'Fully Fulfilled'
                        : 'Fully Ordered'
                  }
                >
                  <VerifiedRounded fontSize='small' color='success' />
                </Tooltip>
              )}
            </Stack>
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          backgroundColor: 'background.paper',
          marginBottom: 3,
        }}
      >
        <Grid container spacing={1}>
          <Grid size={{ xs: 12 }} textAlign={'end'}>
            <RequisitionsItemAction requisition={requisition} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant='scrollable'
              scrollButtons='auto'
              allowScrollButtonsMobile
              sx={{ display: 'flex', justifyContent: 'center' }}
            >
              <Tab label='Approvals' />
              <Tab label='Attachments' />
            </Tabs>
          </Grid>
        </Grid>

        <Grid container>
          {activeTab === 0 && (
            <Grid
              container
              spacing={1}
              justifyContent='center'
              width={'100%'}
              marginTop={1}
            >
              <Grid size={{ xs: 12 }}>
                <ApprovalsTab
                  isExpanded={expanded[requisition.id]}
                  requisition={requisition}
                />
              </Grid>
            </Grid>
          )}
          {activeTab === 1 && (
            <Grid
              container
              spacing={1}
              justifyContent='center'
              marginTop={1}
              width={'100%'}
            >
              <Grid size={{ xs: 12 }}>
                <AttachmentForm
                  hideFeatures={true}
                  attachment_name={'Requisition'}
                  attachmentable_type={'requisition'}
                  attachmentable_id={requisition.id}
                />
              </Grid>
            </Grid>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default RequisitionsListItem;
