'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Chip,
  Grid,
  LinearProgress,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import humanResourcesServices from '../../../humanResourcesServices';
import LeaveApprovalItemAction from './LeaveApprovalItemAction';
import LeaveApprovalsActionTail from './LeaveApprovalsActionTail';
import LeaveRequestItemAction from './LeaveRequestItemAction';
import { LeaveRequestType } from './LeaveRequestType';

const LeaveRequestsListItem = ({
  leaveRequest,
}: {
  leaveRequest: LeaveRequestType;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { data: leaveDetails, isLoading } = useQuery({
    queryKey: ['showLeaveRequest', leaveRequest.id],
    queryFn: () => humanResourcesServices.showLeaveRequest(leaveRequest.id),
    enabled: expanded,
    refetchOnWindowFocus: true,
  });

  const details: LeaveRequestType = (leaveDetails?.data ||
    leaveDetails ||
    leaveRequest) as LeaveRequestType;

  const approvals = details?.approvals || [];

  const statusColor: any =
    leaveRequest.status === 'approved'
      ? 'success'
      : leaveRequest.status === 'rejected'
        ? 'error'
        : leaveRequest.status === 'cancelled'
          ? 'default'
          : 'warning';

  // status_label is backend-computed — "Waiting for {Role}" while a chain-driven
  // request sits at a pending level, same convention as Requisitions.
  const formattedStatus =
    leaveRequest.status_label ||
    (leaveRequest.status === 'in_review'
      ? 'In Review'
      : leaveRequest.status === 'approved'
        ? 'Approved'
        : leaveRequest.status === 'cancelled'
          ? 'Cancelled'
          : leaveRequest.status === 'rejected'
            ? 'Rejected'
            : leaveRequest.status || 'Pending');

  const employeeName = `${leaveRequest.employee?.first_name ?? ''} ${leaveRequest.employee?.middle_name ?? ''} ${leaveRequest.employee?.last_name ?? ''}`;

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      square
      sx={{
        borderRadius: 2,
        borderTop: 2,
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <AccordionSummary
        expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 2,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': { margin: '10px 0' },
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
            '& svg': { fontSize: '0.9rem' },
          },
        }}
      >
        <Grid
          container
          spacing={1}
          alignItems='center'
          width='100%'
          paddingLeft={1}
          paddingRight={1}
        >
          <Grid size={{ xs: 12, md: 2 }}>
            <Tooltip title='Empoyee Name'>
              <Typography>{employeeName}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 2.2 }}>
            <Tooltip title='Leave Type'>
              <Typography>
                {leaveRequest.leave_type?.name ||
                  `Type #${leaveRequest.leave_type_id}`}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 1.8 }}>
            <Tooltip title='Start Date'>
              <Typography>
                {dayjs(leaveRequest.start_date).format('YYYY-MM-DD')}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 1.8 }}>
            <Tooltip title='End Date'>
              <Typography>
                {dayjs(leaveRequest.end_date).format('YYYY-MM-DD')}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 1.2 }}>
            <Tooltip title='Days'>
              <Typography>
                {leaveRequest.days_granted != null
                  ? `${leaveRequest.days_granted}/${leaveRequest.days_requested}`
                  : leaveRequest.days_requested}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Chip
              label={formattedStatus}
              size='small'
              color={statusColor}
              variant='outlined'
              sx={{ textTransform: 'capitalize' }}
            />
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails sx={{ backgroundColor: 'background.paper', mb: 3 }}>
        <Grid container spacing={1}>
          <Grid size={{ xs: 12 }} textAlign='end'>
            <LeaveRequestItemAction
              leaveRequest={leaveRequest}
              approvalsCount={approvals.length}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant='scrollable'
              scrollButtons='auto'
              allowScrollButtonsMobile
              sx={{ display: 'flex', justifyContent: 'center' }}
            >
              <Tab label='Approvals' />
            </Tabs>
          </Grid>
        </Grid>

        <Grid container>
          {activeTab === 0 && (
            <Grid
              container
              spacing={1}
              justifyContent='center'
              width='100%'
              marginTop={1}
            >
              {isLoading ? (
                <Grid size={{ xs: 12 }}>
                  <LinearProgress />
                </Grid>
              ) : (
                <>
                  {approvals.length === 0 && details?.approval_chain_id && (
                    <Grid size={{ xs: 12 }} textAlign='end'>
                      <LeaveApprovalsActionTail leaveRequest={details} />
                    </Grid>
                  )}
                  <Grid size={{ xs: 12 }}>
                    <Grid container spacing={2}>
                      {approvals.length > 0 ? (
                        approvals.map((approval, index) => {
                          const approvalStatus = (
                            approval.status || ''
                          ).toLowerCase();
                          const chipColor =
                            approvalStatus === 'rejected'
                              ? 'error'
                              : approvalStatus === 'on hold'
                                ? 'warning'
                                : approvalStatus === 'approved'
                                  ? 'success'
                                  : 'info';

                          const chainLevel =
                            details?.approval_chain?.levels?.find(
                              (level) =>
                                Number(level.id) ===
                                Number(
                                  approval.chain_level_id ||
                                    approval.approval_chain_level_id
                                )
                            );

                          return (
                            <Grid
                              key={approval.id || index}
                              size={{ xs: 12 }}
                              sx={{
                                cursor: 'pointer',
                                borderTop: 1,
                                borderColor: 'divider',
                                '&:hover': { bgcolor: 'action.hover' },
                                padding: 1,
                              }}
                              container
                              spacing={2}
                              width='100%'
                              alignItems='center'
                            >
                              <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                                <Tooltip title='Action Date'>
                                  <Typography variant='h6'>
                                    {approval.approval_date
                                      ? readableDate(approval.approval_date)
                                      : ''}
                                  </Typography>
                                </Tooltip>
                              </Grid>

                              <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                                <Tooltip title='Done By'>
                                  <Typography variant='h6'>
                                    {(approval as any).creator?.name || ''}
                                  </Typography>
                                </Tooltip>
                              </Grid>

                              <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                                <Chip
                                  size='small'
                                  label={approval.status || 'Pending'}
                                  color={chipColor as any}
                                  sx={{ textTransform: 'capitalize' }}
                                />
                              </Grid>

                              <Grid
                                size={{ xs: 12, md: 2, lg: 2 }}
                                textAlign='right'
                              >
                                <LeaveApprovalItemAction
                                  leaveRequest={details}
                                  approval={approval}
                                  approvals={approvals}
                                />
                              </Grid>
                            </Grid>
                          );
                        })
                      ) : (
                        <Grid size={{ xs: 12 }}>
                          <Alert variant='outlined' severity='info'>
                            No Approvals Found
                          </Alert>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default LeaveRequestsListItem;
