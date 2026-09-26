'use client';

import { Add, Article, Assignment, Assessment, ChevronRight, ContentCopy, Edit, Email, EventNote, FilterList, History, Key, MoreHoriz, Notifications, PersonAdd, Phone, Save, Search, Send, Settings, Shield, Timeline } from '@mui/icons-material';
import { Alert, Avatar, Box, Button, Card, CardContent, Checkbox, Chip, Divider, FormControlLabel, IconButton, InputAdornment, MenuItem, Select, Stack, Switch, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import { StatusBadge } from '@/components/supportLayout/StatusBadge';
import { supportCustomers, supportTickets, type Ticket } from '@/lib/support/mockData';
import { createArticle, loadWorkspaceState, markAllNotificationsRead, markNotificationRead, saveReply, saveSettings, type WorkspaceArticle, type WorkspaceReply, type WorkspaceSettings, type WorkspaceState } from '@/lib/support/workspaceStore';

type View = 'staff' | 'customerProfile' | 'settings' | 'create' | 'knowledge' | 'reports' | 'activity' | 'notifications' | 'replies';
const cardSx = { borderRadius: '12px', border: '1px solid var(--pc-border)', boxShadow: 'none', bgcolor: 'var(--pc-surface)' };
const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '8px' } };
const staffMembers = ['Lilian M.', 'Daniel K.', 'Asha N.', 'Musa P.'];

function Header({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}><Box><Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--pc-text)' }}>{title}</Typography><Typography sx={{ color: 'var(--pc-text-3)', mt: 0.5 }}>{subtitle}</Typography></Box>{action}</Box>;
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <Card sx={cardSx}><CardContent sx={{ p: 3 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}><Typography sx={{ fontWeight: 700, color: 'var(--pc-text)' }}>{title}</Typography>{action}</Box>{children}</CardContent></Card>;
}

function useWorkspaceState() {
  const [state, setState] = useState<WorkspaceState>(() => loadWorkspaceState());
  const update = (next: WorkspaceState) => setState(next);
  return { state, update };
}

function StaffDirectory() {
  const [query, setQuery] = useState('');
  const [invited, setInvited] = useState<string[]>([]);
  const members = staffMembers.filter((name) => name.toLowerCase().includes(query.toLowerCase()));
  return <><Header title="Staff Directory" subtitle="Find teammates, check availability, and assign work confidently." action={<Button variant="contained" startIcon={<PersonAdd />} onClick={() => setInvited([...invited, `New teammate ${invited.length + 1}`])}>Invite staff</Button>} /><TextField size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search staff" sx={{ ...fieldSx, width: 320, mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} /><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>{[...members, ...invited].map((name, index) => <Card key={name} sx={cardSx}><CardContent sx={{ p: 2.5 }}><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Box sx={{ display: 'flex', gap: 1.5 }}><Avatar sx={{ bgcolor: 'var(--pc-accent-soft-2)', color: 'var(--pc-accent)' }}>{name[0]}</Avatar><Box><Typography sx={{ fontWeight: 700 }}>{name}</Typography><Typography sx={{ color: 'var(--pc-text-3)', fontSize: 13 }}>{index % 2 ? 'Support Specialist' : 'Senior Support Specialist'}</Typography></Box></Box><Chip label={index % 3 === 0 ? 'Available' : 'Busy'} color={index % 3 === 0 ? 'success' : 'warning'} size="small" /></Box><Divider sx={{ my: 2 }} /><Typography sx={{ color: 'var(--pc-text-3)', fontSize: 13 }}><Email sx={{ fontSize: 15, verticalAlign: 'middle', mr: 1 }} />{name.toLowerCase().replaceAll(' ', '.')}@proscontrol.com</Typography></CardContent></Card>)}</Box></>;
}

function CustomerProfile() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(supportCustomers[0].id);
  const customer = supportCustomers.find((item) => item.id === customerId) || supportCustomers[0];
  const tickets = supportTickets.filter((ticket) => ticket.customerName === customer.name);
  return <><Header title="Customer Profile" subtitle="Review contact details and the customer's complete ticket history." action={<Button variant="outlined" startIcon={<Edit />}>Edit profile</Button>} /><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' }, gap: 2 }}><Panel title="Customer"><Select fullWidth size="small" value={customerId} onChange={(event) => setCustomerId(event.target.value)} sx={fieldSx}>{supportCustomers.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select><Box sx={{ textAlign: 'center', py: 3 }}><Avatar sx={{ width: 72, height: 72, mx: 'auto', bgcolor: 'var(--pc-accent-soft-2)', color: 'var(--pc-accent)', fontSize: 28 }}>{customer.name[0]}</Avatar><Typography sx={{ fontWeight: 700, mt: 1 }}>{customer.name}</Typography><Typography sx={{ color: 'var(--pc-text-3)', fontSize: 13 }}>{customer.organization}</Typography></Box><Divider /><Stack spacing={1.5} sx={{ pt: 2, color: 'var(--pc-text-3)', fontSize: 13 }}><span><Email sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />{customer.email}</span><span><Phone sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />+255 700 000 000</span><span><EventNote sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />Customer since September 2026</span></Stack></Panel><Panel title="Ticket history" action={<Button size="small" startIcon={<FilterList />}>Filter</Button>}><Stack divider={<Divider />}>{tickets.length ? tickets.map((ticket) => <Box key={ticket.id} onClick={() => router.push(`/en-US/support/staff/tickets/${ticket.id}`)} sx={{ py: 1.5, cursor: 'pointer' }}><Box sx={{ display: 'flex', gap: 1 }}><StatusBadge status={ticket.status} /><Typography sx={{ color: 'var(--pc-text-4)', fontSize: 12 }}>{ticket.id}</Typography></Box><Typography sx={{ fontWeight: 600, mt: 0.5 }}>{ticket.subject}</Typography><Typography sx={{ color: 'var(--pc-text-3)', fontSize: 13 }}>{ticket.updatedAt}</Typography></Box>) : <Alert severity="info">No tickets found for this customer.</Alert>}</Stack></Panel></Box></>;
}

function CreateTicket() {
  const { authData } = useJumboAuth();
  const lang = useLanguage();
  const router = useRouter();
  const isStaff = authData.authUser?.user?.is_staff === true;
  const [form, setForm] = useState({ subject: '', organizationName: '', description: '' });
  const [errors, setErrors] = useState<{ subject?: string; description?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const change = (key: keyof typeof form, value: string) => {
    setForm({ ...form, [key]: value });
    if (key in errors) setErrors({ ...errors, [key]: undefined });
  };
  const submit = async () => {
    const nextErrors = {
      subject: form.subject.trim() ? undefined : 'Subject is required.',
      description: form.description.trim() ? undefined : 'Please describe the issue.',
    };
    setErrors(nextErrors);
    if (nextErrors.subject || nextErrors.description) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject.trim(),
          organizationName: form.organizationName.trim() || undefined,
          description: form.description.trim(),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.data?.id) {
        const fieldError = payload?.data && typeof payload.data === 'object' ? Object.values(payload.data).flat()[0] : null;
        setFormError((fieldError as string) || payload?.message || 'Could not create the ticket. Please try again.');
        return;
      }
      router.push(isStaff ? `/${lang}/support/staff/tickets/${payload.data.id}` : `/${lang}/support/customer/${payload.data.id}`);
    } catch {
      setFormError('Could not create the ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  return <><Header title="Create Ticket" subtitle="Describe your issue and our support team will pick it up." /><Box sx={{ maxWidth: 860 }}><Panel title="Ticket details"><Stack spacing={2}>{formError && <Alert severity="error">{formError}</Alert>}{isStaff && <Alert severity="info">Tickets you create here are opened under your own account.</Alert>}<TextField label="Subject" value={form.subject} onChange={(event) => change('subject', event.target.value)} error={!!errors.subject} helperText={errors.subject} inputProps={{ maxLength: 255 }} fullWidth sx={fieldSx} /><TextField label="Organization (optional)" value={form.organizationName} onChange={(event) => change('organizationName', event.target.value)} helperText="The prosERP organization this issue relates to, if any." inputProps={{ maxLength: 255 }} fullWidth sx={fieldSx} /><TextField label="Description" value={form.description} onChange={(event) => change('description', event.target.value)} error={!!errors.description} helperText={errors.description || 'Include steps, error messages and what you expected to happen.'} multiline minRows={7} fullWidth sx={fieldSx} /><Box sx={{ display: 'flex', justifyContent: 'flex-end' }}><Button variant="contained" startIcon={<Send />} onClick={submit} disabled={submitting}>{submitting ? 'Creating…' : 'Create ticket'}</Button></Box></Stack></Panel></Box></>;
}

function SettingsPage() {
  const { state, update } = useWorkspaceState();
  const [settings, setSettings] = useState<WorkspaceSettings>(state.settings);
  const save = () => update(saveSettings(state, settings));
  return <><Header title="System Settings" subtitle="Configure notifications and workspace behavior." action={<Button variant="contained" startIcon={<Save />} onClick={save}>Save changes</Button>} /><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}><Panel title="Notifications"><Stack divider={<Divider />}><FormControlLabel control={<Switch checked={settings.emailAlerts} onChange={(event) => setSettings({ ...settings, emailAlerts: event.target.checked })} />} label="Email alerts for new tickets" sx={{ py: 1 }} /><FormControlLabel control={<Switch checked={settings.reassignmentAlerts} onChange={(event) => setSettings({ ...settings, reassignmentAlerts: event.target.checked })} />} label="Reassignment alerts" sx={{ py: 1 }} /><FormControlLabel control={<Switch checked={settings.dailySummary} onChange={(event) => setSettings({ ...settings, dailySummary: event.target.checked })} />} label="Daily team summary" sx={{ py: 1 }} /></Stack></Panel><Panel title="General behavior"><Stack spacing={2}><TextField select label="Default priority" value={settings.defaultPriority} onChange={(event) => setSettings({ ...settings, defaultPriority: event.target.value })} sx={fieldSx}><MenuItem value="low">Low</MenuItem><MenuItem value="normal">Normal</MenuItem><MenuItem value="high">High</MenuItem></TextField><TextField select label="Default ticket view" value={settings.defaultView} onChange={(event) => setSettings({ ...settings, defaultView: event.target.value })} sx={fieldSx}><MenuItem value="assigned">Assigned to me</MenuItem><MenuItem value="all">All tickets</MenuItem></TextField><FormControlLabel control={<Checkbox checked={settings.requireReassignmentReason} onChange={(event) => setSettings({ ...settings, requireReassignmentReason: event.target.checked })} />} label="Require reassignment reason" /></Stack></Panel><Panel title="API integrations"><Stack spacing={2}><TextField label="ProsERP API base URL" value={settings.apiBaseUrl} onChange={(event) => setSettings({ ...settings, apiBaseUrl: event.target.value })} sx={fieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><Key fontSize="small" /></InputAdornment> }} /><TextField label="API key" type="password" placeholder="Stored by backend later" sx={fieldSx} /><Alert severity="info">Secrets should be stored and encrypted by the backend, never in browser storage.</Alert></Stack></Panel></Box></>;
}

function KnowledgeBase() {
  const { state, update } = useWorkspaceState();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState({ title: '', category: 'General', body: '' });
  const filtered = state.articles.filter((article) => `${article.title} ${article.category}`.toLowerCase().includes(query.toLowerCase()));
  const addArticle = () => { if (!draft.title.trim() || !draft.body.trim()) return; update(createArticle(state, draft)); setDraft({ title: '', category: 'General', body: '' }); };
  return <><Header title="Knowledge Base" subtitle="Create reusable solutions that agents can link from tickets." /><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.5fr' }, gap: 2 }}><Panel title="New article"><Stack spacing={2}><TextField label="Title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} sx={fieldSx} /><TextField label="Category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} sx={fieldSx} /><TextField label="Article body" value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} multiline minRows={5} sx={fieldSx} /><Button variant="contained" startIcon={<Add />} onClick={addArticle}>Save article</Button></Stack></Panel><Panel title={`${filtered.length} articles`}><TextField size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search articles" sx={{ ...fieldSx, width: '100%', mb: 1 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} /><Stack divider={<Divider />}>{filtered.map((article) => <Box key={article.id} sx={{ py: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}><Avatar sx={{ bgcolor: 'var(--pc-accent-soft)', color: 'var(--pc-accent)' }}><Article fontSize="small" /></Avatar><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 600 }}>{article.title}</Typography><Typography sx={{ color: 'var(--pc-text-3)', fontSize: 12 }}>{article.id} · {article.category} · {article.views} views</Typography></Box><IconButton><MoreHoriz /></IconButton></Box>)}</Stack></Panel></Box></>;
}

function Reports() { const data = [{ day: 'Mon', opened: 8, closed: 5 }, { day: 'Tue', opened: 11, closed: 7 }, { day: 'Wed', opened: 7, closed: 9 }, { day: 'Thu', opened: 14, closed: 8 }, { day: 'Fri', opened: 10, closed: 11 }]; return <><Header title="Ticket Reports" subtitle="Track volume, throughput, and resolution speed." /><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>{[['Opened', '78'], ['Closed', '63'], ['Avg. resolution', '6h 24m'], ['SLA met', '94%']].map(([label, value]) => <Card key={label} sx={cardSx}><CardContent><Typography sx={{ color: 'var(--pc-text-3)', fontSize: 13 }}>{label}</Typography><Typography sx={{ fontWeight: 700, fontSize: 24 }}>{value}</Typography></CardContent></Card>)}</Box><Panel title="Ticket volume"><Box sx={{ height: 320 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="day" /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="opened" stroke="#2563eb" strokeWidth={3} /><Line type="monotone" dataKey="closed" stroke="#22c55e" strokeWidth={3} /></LineChart></ResponsiveContainer></Box></Panel></> }

function ActivityLogs() { return <><Header title="Activity Logs" subtitle="Audit administrative actions across the support workspace." action={<Button variant="outlined" startIcon={<FilterList />}>Filter logs</Button>} /><Panel title="Recent activity"><Stack divider={<Divider />}>{['Ticket reassigned · TCK-1001 → Lilian M.', 'Ticket closed · TCK-1003', 'Article updated · Stock sync guide', 'Settings changed · Email alerts'].map((item) => <Box key={item} sx={{ display: 'flex', gap: 2, py: 2 }}><Avatar sx={{ bgcolor: 'var(--pc-accent-soft-2)', color: 'var(--pc-accent)' }}><History fontSize="small" /></Avatar><Box><Typography sx={{ fontWeight: 600 }}>{item}</Typography><Typography sx={{ color: 'var(--pc-text-4)', fontSize: 12 }}>System audit event · today</Typography></Box></Box>)}</Stack></Panel></> }

function NotificationCenter() { const { state, update } = useWorkspaceState(); const unread = state.notifications.filter((item) => item.unread).length; return <><Header title="Notification Center" subtitle="Review alerts, assignments, and updates." action={<Button variant="outlined" onClick={() => update(markAllNotificationsRead(state))}>Mark all read</Button>} /><Box sx={{ display: 'flex', gap: 1, mb: 2 }}><Chip label={`All ${state.notifications.length}`} color="primary" /><Chip label={`Unread ${unread}`} variant="outlined" /></Box><Panel title="Your notifications"><Stack divider={<Divider />}>{state.notifications.map((item) => <Box key={item.id} sx={{ display: 'flex', gap: 2, py: 2, bgcolor: item.unread ? 'var(--pc-accent-softer)' : 'transparent' }}><Avatar sx={{ bgcolor: 'var(--pc-accent-soft-2)', color: 'var(--pc-accent)' }}><Notifications fontSize="small" /></Avatar><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: item.unread ? 700 : 600 }}>{item.title}</Typography><Typography sx={{ color: 'var(--pc-text-3)', fontSize: 13 }}>{item.detail}</Typography><Typography sx={{ color: 'var(--pc-text-4)', fontSize: 12 }}>{item.time}</Typography></Box><Button size="small" onClick={() => update(markNotificationRead(state, item.id))}>Mark read</Button></Box>)}</Stack></Panel></> }

function SavedReplies() { const { state, update } = useWorkspaceState(); const [selected, setSelected] = useState<WorkspaceReply>(state.replies[0]); const [draft, setDraft] = useState(selected); const save = () => update(saveReply(state, draft)); return <><Header title="Saved Replies" subtitle="Manage reusable responses for faster customer communication." action={<Button variant="contained" startIcon={<Add />} onClick={() => { const reply = { id: `reply-${Date.now()}`, title: 'New reply', body: '', shortcut: 'new-reply', updated: 'Just now' }; setSelected(reply); setDraft(reply); }}>New reply</Button>} /><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' }, gap: 2 }}><Panel title="Reply library"><Stack>{state.replies.map((reply) => <Button key={reply.id} onClick={() => { setSelected(reply); setDraft(reply); }} sx={{ justifyContent: 'flex-start', textAlign: 'left', bgcolor: selected.id === reply.id ? 'var(--pc-accent-soft)' : 'transparent', p: 1.5 }}><Box><Typography sx={{ fontWeight: 600 }}>{reply.title}</Typography><Typography sx={{ color: 'var(--pc-text-3)', fontSize: 12 }}>/{reply.shortcut}</Typography></Box></Button>)}</Stack></Panel><Panel title="Edit reply" action={<Button startIcon={<ContentCopy />} onClick={() => navigator.clipboard?.writeText(draft.body)}>Copy</Button>}><Stack spacing={2}><TextField label="Title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} sx={fieldSx} /><TextField label="Shortcut" value={draft.shortcut} onChange={(event) => setDraft({ ...draft, shortcut: event.target.value })} sx={fieldSx} /><TextField label="Response" value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} multiline minRows={8} sx={fieldSx} /><Button variant="contained" startIcon={<Save />} onClick={save}>Save reply</Button></Stack></Panel></Box></> }

export default function InteractiveSupportWorkspacePage({ view }: { view: View }) {
  const { authData } = useJumboAuth();
  const lang = useLanguage();
  const router = useRouter();
  const authUser = authData.authUser?.user;
  const isStaff = authUser?.is_staff === true;
  const role = (view === 'create' && !isStaff) || (view === 'notifications' && !isStaff) ? 'customer' : 'staff';
  const staffOnly: View[] = ['staff', 'customerProfile', 'settings', 'knowledge', 'reports', 'activity', 'replies'];
  useEffect(() => { if (!authData.isLoading && !isStaff && staffOnly.includes(view)) router.replace(`/${lang}/support/customer`); }, [authData.isLoading, isStaff, lang, router, view]);
  // Render nothing for staff-only views until we know the user is staff, so a customer never sees the staff UI flash.
  if (staffOnly.includes(view) && (authData.isLoading || !isStaff)) return null;
  const pages = { staff: <StaffDirectory />, customerProfile: <CustomerProfile />, settings: <SettingsPage />, create: <CreateTicket />, knowledge: <KnowledgeBase />, reports: <Reports />, activity: <ActivityLogs />, notifications: <NotificationCenter />, replies: <SavedReplies /> };
  return <SupportLayout userRole={role} userName={authUser?.name || (role === 'staff' ? 'Staff' : 'Customer')} userRoleLabel={role === 'staff' ? 'Staff' : 'Customer'}>{pages[view]}</SupportLayout>;
}
