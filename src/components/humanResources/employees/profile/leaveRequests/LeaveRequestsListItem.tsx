'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PDFContent from '@/components/pdf/PDFContent';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import AddIcon from '@mui/icons-material/Add';
import PreviewOutlined from '@mui/icons-material/PreviewOutlined';
import PrintOutlined from '@mui/icons-material/PrintOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import humanResourcesServices from '../../../humanResourcesServices';
import LeaveApprovalItemAction from './LeaveApprovalItemAction';
import LeaveApprovalsActionTail from './LeaveApprovalsActionTail';
import LeaveRequestItemAction from './LeaveRequestItemAction';
import LeaveRequestPDF from './LeaveRequestPDF';
import LeaveRequestPreview from './LeaveRequestPreview';
import { LeaveRequestType } from './LeaveRequestType';

const LeaveRequestsListItem = ({
  leaveRequest,
}: {
  leaveRequest: LeaveRequestType;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [openPrint, setOpenPrint] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const { authOrganization, authUser } = useJumboAuth() as any;
  const organization = authOrganization?.organization;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

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
          <Grid size={{ xs: 6, md: 2 }}>
            <Tooltip title='Empoyee Name'>
              <Typography>{employeeName}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 2.2 }}>
            <Tooltip title='Leave Type'>
              <Typography>
                {leaveRequest.leave_type?.name ||
                  `Type #${leaveRequest.leave_type_id}`}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 1.8 }}>
            <Tooltip title='Start Date'>
              <Typography>
                {dayjs(leaveRequest.start_date).format('YYYY-MM-DD')}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 1.8 }}>
            <Tooltip title='End Date'>
              <Typography>
                {dayjs(leaveRequest.end_date).format('YYYY-MM-DD')}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 1.2 }}>
            <Tooltip title='Days'>
              <Typography>
                {leaveRequest.days_granted != null
                  ? `${leaveRequest.days_granted}/${leaveRequest.days_requested}`
                  : leaveRequest.days_requested}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
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
        <Dialog
          open={openPreview}
          fullWidth
          maxWidth='sm'
          fullScreen={belowLargeScreen}
          scroll={belowLargeScreen ? 'body' : 'paper'}
          onClose={() => setOpenPreview(false)}
        >
          <DialogContent>
            <LeaveRequestPreview leaveRequest={details} />
          </DialogContent>
          <DialogActions>
            <Button size='small' onClick={() => setOpenPreview(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openPrint}
          onClose={() => setOpenPrint(false)}
          maxWidth='md'
          fullWidth
          fullScreen={belowLargeScreen}
        >
          <DialogContent sx={{ height: belowLargeScreen ? '100%' : '80vh', p: 0 }}>
            {openPrint && (
              <PDFContent
                document={
                  <LeaveRequestPDF
                    data={details}
                    organization={organization}
                    userName={authUser?.user?.name || 'ProsERP'}
                  />
                }
                fileName={`Leave Application - ${employeeName.trim()}`}
              />
            )}
          </DialogContent>
        </Dialog>

        <Grid container spacing={1}>
          <Grid size={{ xs: 12 }} textAlign='end'>
            <Tooltip title='Preview'>
              <IconButton size='small' onClick={() => setOpenPreview(true)}>
                <PreviewOutlined color='primary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Print Leave Application Form'>
              <IconButton size='small' onClick={() => setOpenPrint(true)}>
                <PrintOutlined color='primary' />
              </IconButton>
            </Tooltip>
            <LeaveRequestItemAction
              leaveRequest={leaveRequest}
              approvalsCount={approvals.length}
            />
          </Grid>
          {isLoading ? (
            <Grid size={{ xs: 12 }}>
              <LinearProgress />
            </Grid>
          ) : (
            <>
              {/* Only shown for the very first decision — nothing exists yet
                  to attach an inline Approve button to. Once at least one
                  approval exists, the next approver's Approve button lives
                  on the last row in Approval History below instead (mirrors
                  RequisitionsListItem's ApprovalsTab/ApprovalItemAction). */}
              {details?.approval_chain_id && approvals.length === 0 && (
                <Grid size={{ xs: 12 }} textAlign='end'>
                  <LeaveApprovalsActionTail leaveRequest={details} />
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <Typography variant='subtitle2' color='text.secondary' mb={1}>
                  Approval History
                </Typography>
                {approvals.length === 0 ? (
                  <Alert variant='outlined' severity='info'>
                    No Approvals Found
                  </Alert>
                ) : (
                  <Grid container spacing={1}>
                    {approvals.map((approval, index) => {
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

                      return (
                        <Grid
                          key={approval.id || index}
                          size={{ xs: 12 }}
                          container
                          spacing={2}
                          alignItems='center'
                          sx={{
                            borderTop: 1,
                            borderColor: 'divider',
                            py: 1,
                          }}
                        >
                          <Grid size={{ xs: 12, md: 3 }}>
                            <Tooltip title='Action Date'>
                              <Typography variant='body2'>
                                {approval.approval_date
                                  ? readableDate(approval.approval_date)
                                  : ''}
                              </Typography>
                            </Tooltip>
                          </Grid>

                          <Grid size={{ xs: 12, md: 3 }}>
                            <Tooltip title='Done By'>
                              <Typography variant='body2'>
                                {(approval as any).creator?.name || ''}
                              </Typography>
                            </Tooltip>
                          </Grid>

                          <Grid size={{ xs: 8, md: 3 }}>
                            <Chip
                              size='small'
                              label={approval.status || 'Pending'}
                              color={chipColor as any}
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </Grid>

                          <Grid size={{ xs: 4, md: 3 }} textAlign='right'>
                            {index === approvals.length - 1 && (
                              <LeaveApprovalItemAction
                                leaveRequest={details}
                                approval={approval}
                                approvals={approvals}
                              />
                            )}
                          </Grid>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default LeaveRequestsListItem;
