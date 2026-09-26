'use client';

import {
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  History as HistoryIcon,
  InfoOutlined as InfoIcon,
  Person as PersonIcon,
  PlayArrow as ActivateIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import { StatusBadge } from '@/components/supportLayout/StatusBadge';
import { MessageBubble } from '@/components/supportLayout/MessageBubble';
import { MessageComposer } from '@/components/supportLayout/MessageComposer';
import { CHAT_COLUMN_HEIGHT, ChatScrollArea } from '@/components/supportLayout/ChatScrollArea';
import { useTicketThread } from '@/lib/support/useTicketThread';
import { useFormatDate, useT } from '@/lib/i18n/useT';
import { useEscapeToLeave } from '@/lib/support/useEscapeToLeave';
import { canGoBackInApp } from '@/lib/support/inAppNavigation';

const sectionLabelSx = { fontSize: '0.75rem', fontWeight: 700, color: 'var(--pc-text-4)', letterSpacing: 0.5 };

export default function StaffTicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const router = useRouter();
  const dictionary = useDictionary();
  const { authData } = useJumboAuth();
  const t = dictionary.support?.staff?.ticketDetail;
  const tr = useT();
  const formatDate = useFormatDate();
  const formatMessageTime = (value: string) => formatDate(value);
  const currentUser = authData?.authUser?.user;
  const currentUserName = currentUser?.name || tr('portal.common.staff', 'Staff');
  const currentUserId = currentUser?.id ? String(currentUser.id) : '';
  const { ticket, messages, reassignments, loadError, pendingAction, notifyActivity, sendMessage, activate, close, reassign } =
    useTicketThread(params.ticketId, currentUserId, true);
  const lang = useLanguage();
  const [hasDraft, setHasDraft] = useState(false);
  // Same as the back arrow; goes to the list when the ticket was opened directly.
  const goBack = () => (canGoBackInApp() ? router.back() : router.push(`/${lang}/support/staff/tickets`));
  useEscapeToLeave(!hasDraft, goBack);
  const [reassignTo, setReassignTo] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  if (!ticket) {
    return (
      <SupportLayout userRole="staff" userName={currentUserName} userRoleLabel={tr('portal.common.staff', 'Staff')}>
        <Box sx={{ p: 4, bgcolor: 'var(--pc-surface)', borderRadius: '12px', border: '1px solid var(--pc-border)' }}>
          <Typography sx={{ color: loadError ? 'var(--pc-danger)' : 'var(--pc-text-2)' }}>{loadError || t?.loading || 'Loading ticket...'}</Typography>
        </Box>
      </SupportLayout>
    );
  }

  const isAttending = !!ticket.handledById && ticket.handledById === currentUserId;
  const lastMessage = messages.at(-1);
  const busy = pendingAction !== null;

  const composerDisabledReason =
    ticket.status === 'new'
      ? t?.activateToReply || 'Activate this ticket to start the conversation.'
      : ticket.status === 'closed'
        ? t?.ticketClosedStaff || 'This ticket is closed.'
        : !isAttending
          ? t?.onlyAttendingCanReply || 'Only the staff member handling this ticket can reply.'
          : null;

  const runAction = async (action: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setActionError(null);
    const result = await action();
    if (!result.ok) setActionError(result.error);
    return result.ok;
  };

  const statusSteps = [
    { label: t?.statusSubmitted || 'Submitted', done: true, current: ticket.status === 'new' },
    { label: t?.statusInProgress || 'In progress', done: ticket.status !== 'new', current: ticket.status === 'active' },
    { label: t?.statusResolved || 'Resolved', done: ticket.status === 'closed', current: ticket.status === 'closed' },
  ];

  return (
    <SupportLayout userRole="staff" userName={currentUserName} userRoleLabel={tr('portal.common.staff', 'Staff')}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, gap: 3, alignItems: 'start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: CHAT_COLUMN_HEIGHT, minHeight: 480 }}>
          <Box sx={{ flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton onClick={goBack} aria-label={t?.back || 'Back'} sx={{ color: 'var(--pc-text-3)' }}>
                <BackIcon />
              </IconButton>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--pc-text)' }}>
                {ticket.subject}
              </Typography>
              <StatusBadge status={ticket.status} />
            </Box>
            <Typography sx={{ fontSize: '0.85rem', color: 'var(--pc-text-4)', mb: 2, ml: 6 }}>
              {formatDate(ticket.createdAt)}
            </Typography>
          </Box>

          <ChatScrollArea scrollKey={lastMessage?.id ?? ''} forceScroll={lastMessage?.senderId === currentUserId}>
            <Card sx={{ borderRadius: '12px', border: '1px solid var(--pc-border)', boxShadow: 'none', mb: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography sx={{ ...sectionLabelSx, mb: 1 }}>
                  {t?.request || 'REQUEST'}
                </Typography>
                <Typography sx={{ color: 'var(--pc-text)', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                  {ticket.description}
                </Typography>
              </CardContent>
            </Card>

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                senderName={msg.senderName}
                body={msg.body}
                type={msg.type}
                attachments={msg.attachments}
                read={!!msg.readAt}
                createdAt={formatMessageTime(msg.createdAt)}
                align={msg.senderId === currentUserId ? 'right' : 'left'}
              />
            ))}
          </ChatScrollArea>

          <Box sx={{ flexShrink: 0, pt: 2 }}>
            <MessageComposer
              onSend={sendMessage}
              sending={pendingAction === 'send'}
              disabledReason={composerDisabledReason}
              placeholder={t?.typeMessage}
              onActivity={notifyActivity}
              onDraftChange={setHasDraft}
            />
          </Box>
        </Box>

        <Card sx={{ borderRadius: '12px', border: '1px solid var(--pc-border)', boxShadow: 'none', height: 'fit-content', maxHeight: { lg: CHAT_COLUMN_HEIGHT.md }, overflowY: 'auto', position: { lg: 'sticky' }, top: 96 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontWeight: 700, color: 'var(--pc-text)' }}>{t?.details || 'Details'}</Typography>
              <StatusBadge status={ticket.status} />
            </Box>

            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                <ScheduleIcon sx={{ fontSize: 14, color: 'var(--pc-text-4)' }} />
                <Typography sx={sectionLabelSx}>{t?.status || 'STATUS'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {statusSteps.map((step) => (
                  <Box key={step.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: step.done ? '#3b82f6' : 'var(--pc-border)' }} />
                    <Typography sx={{ fontSize: '0.875rem', color: step.done ? 'var(--pc-text)' : 'var(--pc-text-4)', fontWeight: step.current ? 600 : 400 }}>
                      {step.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                <PersonIcon sx={{ fontSize: 14, color: 'var(--pc-text-4)' }} />
                <Typography sx={sectionLabelSx}>{t?.people || 'PEOPLE'}</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.8rem', color: 'var(--pc-text-4)', mb: 0.3 }}>{t?.requester || 'Requester'}</Typography>
              <Typography sx={{ fontSize: '0.9rem', color: 'var(--pc-text)', fontWeight: 600, mb: 1.5 }}>{ticket.customerName}</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'var(--pc-text-4)', mb: 0.3 }}>{t?.handledBy || 'Handled by'}</Typography>
              <Typography sx={{ fontSize: '0.9rem', color: 'var(--pc-text)', fontWeight: 600 }}>
                {ticket.handledBy || t?.unassigned || 'Unassigned'}
                {isAttending ? ` (${t?.you || 'you'})` : ''}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                <InfoIcon sx={{ fontSize: 14, color: 'var(--pc-text-4)' }} />
                <Typography sx={sectionLabelSx}>{t?.ticketInfo || 'TICKET INFO'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionIcon sx={{ fontSize: 16, color: 'var(--pc-text-3)' }} />
                  <Typography sx={{ fontSize: '0.875rem', color: 'var(--pc-text)' }}>#{ticket.id}</Typography>
                </Box>
                {ticket.customerEmail && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ fontSize: 16, color: 'var(--pc-text-3)' }} />
                    <Typography sx={{ fontSize: '0.875rem', color: 'var(--pc-text)', wordBreak: 'break-all' }}>{ticket.customerEmail}</Typography>
                  </Box>
                )}
                {ticket.organizationName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon sx={{ fontSize: 16, color: 'var(--pc-text-3)' }} />
                    <Typography sx={{ fontSize: '0.875rem', color: 'var(--pc-text)' }}>{ticket.organizationName}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 16, color: 'var(--pc-text-3)' }} />
                  <Typography sx={{ fontSize: '0.875rem', color: 'var(--pc-text)' }}>{formatDate(ticket.createdAt)}</Typography>
                </Box>
              </Box>
            </Box>

            {ticket.status !== 'closed' && (
              <>
                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                    <PersonIcon sx={{ fontSize: 14, color: 'var(--pc-text-4)' }} />
                    <Typography sx={sectionLabelSx}>{t?.actions || 'ACTIONS'}</Typography>
                  </Box>

                  {actionError && (
                    <Alert severity="error" onClose={() => setActionError(null)} sx={{ mb: 1.5, borderRadius: '8px' }}>
                      {actionError}
                    </Alert>
                  )}

                  {ticket.status === 'new' && (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ActivateIcon />}
                      disabled={busy}
                      onClick={() => runAction(activate)}
                      sx={{ bgcolor: '#2563eb', borderRadius: '8px', textTransform: 'none', fontWeight: 600, py: 1.2, '&:hover': { bgcolor: '#1d4ed8' } }}
                    >
                      {t?.activateTicket || 'Pick up & activate'}
                    </Button>
                  )}

                  {ticket.status === 'active' && isAttending && (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<CheckIcon />}
                      disabled={busy}
                      onClick={() => runAction(close)}
                      sx={{ bgcolor: '#ef4444', borderRadius: '8px', textTransform: 'none', fontWeight: 600, py: 1.2, mb: 1.5, '&:hover': { bgcolor: 'var(--pc-danger)' } }}
                    >
                      {t?.closeTicket || 'Close ticket'}
                    </Button>
                  )}

                  {ticket.status === 'active' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* No staff directory endpoint exists yet, so the target is entered by user ID. */}
                      <TextField
                        size="small"
                        type="number"
                        label={t?.reassignToUserId || 'Reassign to staff user ID'}
                        value={reassignTo}
                        onChange={(event) => setReassignTo(event.target.value)}
                      />
                      <TextField
                        size="small"
                        label={t?.reassignReason || 'Reason (optional)'}
                        value={reassignReason}
                        onChange={(event) => setReassignReason(event.target.value)}
                        inputProps={{ maxLength: 255 }}
                      />
                      <Button
                        variant="outlined"
                        disabled={busy || !reassignTo}
                        onClick={async () => {
                          const ok = await runAction(() => reassign(reassignTo, reassignReason));
                          if (ok) {
                            setReassignTo('');
                            setReassignReason('');
                          }
                        }}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: 'var(--pc-border)', color: 'var(--pc-text-2)' }}
                      >
                        {t?.reassign || 'Reassign'}
                      </Button>
                    </Box>
                  )}
                </Box>
              </>
            )}

            <Divider sx={{ my: 2 }} />

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                <HistoryIcon sx={{ fontSize: 14, color: 'var(--pc-text-4)' }} />
                <Typography sx={sectionLabelSx}>{t?.reassignmentHistory || 'REASSIGNMENT HISTORY'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {reassignments.length === 0 && (
                  <Typography sx={{ fontSize: '0.85rem', color: 'var(--pc-text-4)' }}>—</Typography>
                )}
                {reassignments.map((event, index) => (
                  <Box key={`${event.at}-${index}`}>
                    <Typography sx={{ fontSize: '0.85rem', color: 'var(--pc-text)', fontWeight: 500 }}>
                      {event.from ? `${event.from} → ${event.to}` : `${t?.firstAssignment || 'First assignment'}: ${event.to}`}
                    </Typography>
                    {event.note && <Typography sx={{ fontSize: '0.8rem', color: 'var(--pc-text-4)' }}>{event.note}</Typography>}
                    <Typography sx={{ fontSize: '0.75rem', color: 'var(--pc-text-4)' }}>{formatDate(event.at)}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </SupportLayout>
  );
}
