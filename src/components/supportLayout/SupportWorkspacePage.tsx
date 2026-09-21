'use client';

import {
  Add,
  Article,
  Assignment,
  BarChart,
  Check,
  ChevronRight,
  ContentCopy,
  Edit,
  Email,
  EventNote,
  FilterList,
  Key,
  MenuBook,
  MoreHoriz,
  Notifications,
  Person,
  PersonAdd,
  Phone,
  Save,
  Search,
  Send,
  Settings,
  Shield,
  Speed,
  Timeline,
  Tune,
  Visibility,
  Warning,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { SupportLayout } from '@/components/supportLayout/SupportLayout';
import { StatusBadge } from '@/components/supportLayout/StatusBadge';
import { supportCustomers, supportTickets, type Ticket } from '@/lib/support/mockData';

type WorkspaceView = 'staff' | 'customerProfile' | 'settings' | 'create' | 'knowledge' | 'reports' | 'activity' | 'notifications' | 'replies';

type StaffMember = { id: string; name: string; role: string; email: string; status: 'Available' | 'Busy' | 'Away'; load: number };

const staff: StaffMember[] = [
  { id: 'staff-1', name: 'Lilian M.', role: 'Senior Support Specialist', email: 'lilian@proscontrol.com', status: 'Available', load: 4 },
  { id: 'staff-2', name: 'Daniel K.', role: 'Support Specialist', email: 'daniel@proscontrol.com', status: 'Busy', load: 7 },
  { id: 'staff-3', name: 'Asha N.', role: 'Customer Success Lead', email: 'asha@proscontrol.com', status: 'Available', load: 2 },
  { id: 'staff-4', name: 'Musa P.', role: 'Support Specialist', email: 'musa@proscontrol.com', status: 'Away', load: 0 },
];

const articles = [
  { id: 'KB-104', title: 'Troubleshooting warehouse stock sync', category: 'Inventory', views: 238, updated: '2 days ago' },
  { id: 'KB-103', title: 'Resolving failed billing exports', category: 'Finance', views: 187, updated: '5 days ago' },
  { id: 'KB-102', title: 'Managing approval queue permissions', category: 'Access', views: 142, updated: '1 week ago' },
  { id: 'KB-101', title: 'Resetting a user password', category: 'Account', views: 96, updated: '2 weeks ago' },
];

const activities = [
  { action: 'Ticket reassigned', detail: 'TCK-1001 moved from Unassigned to Lilian M.', actor: 'Daniel K.', time: '12 minutes ago', tone: 'blue' },
  { action: 'Ticket closed', detail: 'TCK-1003 marked as resolved', actor: 'Daniel K.', time: '42 minutes ago', tone: 'green' },
  { action: 'Article updated', detail: 'Troubleshooting warehouse stock sync', actor: 'Asha N.', time: '2 hours ago', tone: 'purple' },
  { action: 'Settings changed', detail: 'Email notifications enabled for staff', actor: 'Willbard Beatus', time: 'Yesterday', tone: 'orange' },
];

const notifications = [
  { title: 'Ticket assigned to you', detail: 'TCK-1001 needs your attention', time: '12 minutes ago', unread: true },
  { title: 'New customer reply', detail: 'Grace Mkilima replied to Billing export failed for August', time: '1 hour ago', unread: true },
  { title: 'Ticket closed', detail: 'TCK-1003 was marked as resolved', time: 'Yesterday', unread: false },
  { title: 'Knowledge base article updated', detail: 'Asha N. updated the stock sync guide', time: 'Yesterday', unread: false },
];

const replies = [
  { title: 'Request more information', body: 'Thanks for reaching out. Please share the steps you took and a screenshot of the error so we can investigate.', shortcut: 'more-info', updated: 'Today' },
  { title: 'Issue resolved', body: 'We have applied a fix and confirmed that the issue is resolved. Please let us know if you notice anything else.', shortcut: 'resolved', updated: 'Yesterday' },
  { title: 'Escalate to engineering', body: 'Thanks for the details. We are escalating this to our engineering team and will update you shortly.', shortcut: 'escalate', updated: 'Last week' },
];

const volumeData = [
  { day: 'Sep 15', opened: 8, closed: 5 }, { day: 'Sep 16', opened: 11, closed: 7 }, { day: 'Sep 17', opened: 7, closed: 9 },
  { day: 'Sep 18', opened: 14, closed: 8 }, { day: 'Sep 19', opened: 10, closed: 11 }, { day: 'Sep 20', opened: 16, closed: 10 }, { day: 'Sep 21', opened: 12, closed: 13 },
];

const cardSx = { borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none', bgcolor: '#fff' };
const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '8px' } };

function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 3, flexWrap: 'wrap' }}><Box><Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', mb: 0.5 }}>{title}</Typography><Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>{subtitle}</Typography></Box>{action}</Box>;
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <Card sx={cardSx}><CardContent sx={{ p: 3 }}><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}><Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{title}</Typography>{action}</Box>{children}</CardContent></Card>;
}

function StatusPill({ status }: { status: StaffMember['status'] }) {
  const colors = { Available: ['#dcfce7', '#15803d'], Busy: ['#fef3c7', '#b45309'], Away: ['#f1f5f9', '#64748b'] };
  return <Chip label={status} size="small" sx={{ bgcolor: colors[status][0], color: colors[status][1], fontWeight: 600 }} />;
}

function TicketRows({ tickets, onOpen }: { tickets: Ticket[]; onOpen: (id: string) => void }) {
  return <Stack divider={<Divider />} spacing={0}>{tickets.map((ticket) => <Box key={ticket.id} onClick={() => onOpen(ticket.id)} sx={{ py: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' }, px: 1, mx: -1, borderRadius: '8px' }}><Box sx={{ minWidth: 0 }}><Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}><StatusBadge status={ticket.status} /><Typography sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>{ticket.id}</Typography></Box><Typography sx={{ color: '#0f172a', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.subject}</Typography><Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>{ticket.customerName} · updated {new Date(ticket.updatedAt).toLocaleDateString()}</Typography></Box><ChevronRight sx={{ color: '#94a3b8' }} /></Box>)}</Stack>;
}

function StaffDirectory() {
  const [query, setQuery] = useState('');
  const filtered = staff.filter((member) => `${member.name} ${member.role} ${member.email}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageHeader title="Staff Directory" subtitle="See who is available to help with ticket assignment and internal communication." action={<Button variant="contained" startIcon={<PersonAdd />}>Invite staff</Button>} /><TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search staff by name, role, or email" size="small" sx={{ ...inputSx, width: { xs: '100%', md: 360 }, mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} /><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>{filtered.map((member) => <Card key={member.id} sx={cardSx}><CardContent sx={{ p: 2.5 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}><Box sx={{ display: 'flex', gap: 1.5 }}><Avatar sx={{ bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 700 }}>{member.name.charAt(0)}</Avatar><Box><Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{member.name}</Typography><Typography sx={{ color: '#64748b', fontSize: '0.86rem' }}>{member.role}</Typography></Box></Box><StatusPill status={member.status} /></Box><Divider sx={{ my: 2 }} /><Stack spacing={1}><Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}><Email sx={{ fontSize: 15, verticalAlign: 'middle', mr: 1 }} />{member.email}</Typography><Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}><Assignment sx={{ fontSize: 15, verticalAlign: 'middle', mr: 1 }} />{member.load} active tickets</Typography></Stack></CardContent></Card>)}</Box></>;
}

function CustomerProfile() {
  const [selectedId, setSelectedId] = useState(supportCustomers[0].id);
  const customer = supportCustomers.find((item) => item.id === selectedId) || supportCustomers[0];
  const tickets = supportTickets.filter((ticket) => ticket.customerName === customer.name);
  const customerTickets = tickets.length ? tickets : supportTickets;
  return <><PageHeader title="Customer Profile" subtitle="Review customer details and their complete support history." action={<Button variant="outlined" startIcon={<Edit />}>Edit profile</Button>} /><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' }, gap: 2 }}><SectionCard title="Customer"><Select fullWidth value={selectedId} onChange={(event) => setSelectedId(event.target.value)} size="small" sx={inputSx}>{supportCustomers.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select><Box sx={{ textAlign: 'center', py: 3 }}><Avatar sx={{ width: 72, height: 72, mx: 'auto', bgcolor: '#dbeafe', color: '#2563eb', fontSize: 28 }}>{customer.name.charAt(0)}</Avatar><Typography sx={{ mt: 1.5, fontWeight: 700, color: '#0f172a' }}>{customer.name}</Typography><Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>{customer.organization}</Typography></Box><Divider /><Stack spacing={1.5} sx={{ pt: 2 }}><Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}><Email sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />{customer.email}</Typography><Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}><Phone sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />+255 700 000 000</Typography><Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}><EventNote sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />Customer since September 2026</Typography></Stack></SectionCard><SectionCard title="Ticket history" action={<Button size="small" startIcon={<FilterList />}>Filter</Button>}><TicketRows tickets={customerTickets} onOpen={() => {}} /></SectionCard></Box></>;
}

function CreateTicket() {
  const [submitted, setSubmitted] = useState(false);
  return <><PageHeader title="Create Ticket" subtitle="Start a detailed support request for a customer or your own account." /><Box sx={{ maxWidth: 840 }}><SectionCard title="Ticket details"><Stack spacing={2.2}><TextField label="Subject" fullWidth sx={inputSx} placeholder="Briefly describe the issue" /><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}><TextField label="Customer" fullWidth sx={inputSx} placeholder="Search customer" /><TextField select label="Priority" defaultValue="normal" fullWidth sx={inputSx}><MenuItem value="low">Low</MenuItem><MenuItem value="normal">Normal</MenuItem><MenuItem value="high">High</MenuItem><MenuItem value="urgent">Urgent</MenuItem></TextField></Box><TextField select label="Category" defaultValue="account" fullWidth sx={inputSx}><MenuItem value="account">Account and access</MenuItem><MenuItem value="billing">Billing and finance</MenuItem><MenuItem value="inventory">Inventory</MenuItem><MenuItem value="technical">Technical issue</MenuItem></TextField><TextField label="Description" multiline minRows={7} fullWidth sx={inputSx} placeholder="Include steps to reproduce, expected behavior, and any useful context" /><TextField label="Attachments" type="file" fullWidth sx={inputSx} InputLabelProps={{ shrink: true }} /><Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}><Button variant="outlined">Save draft</Button><Button variant="contained" startIcon={<Send />} onClick={() => setSubmitted(true)}>Submit ticket</Button></Box>{submitted && <Alert severity="success">Ticket draft submitted locally. Connect the ticket create API to persist it.</Alert>}</Stack></SectionCard></Box></>;
}

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  return <><PageHeader title="System Settings" subtitle="Configure notifications, integrations, and support workspace behavior." action={<Button variant="contained" startIcon={<Save />} onClick={() => setSaved(true)}>Save changes</Button>} />{saved && <Alert severity="success" sx={{ mb: 2 }}>Settings saved locally for this session.</Alert>}<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}><SectionCard title="Notifications"><Stack divider={<Divider />}><FormControlLabel control={<Switch defaultChecked />} label="Email alerts for new tickets" sx={{ py: 1 }} /><FormControlLabel control={<Switch defaultChecked />} label="Notify staff when tickets are reassigned" sx={{ py: 1 }} /><FormControlLabel control={<Switch />} label="Daily team performance summary" sx={{ py: 1 }} /><FormControlLabel control={<Switch defaultChecked />} label="Browser notifications" sx={{ py: 1 }} /></Stack></SectionCard><SectionCard title="General behavior"><Stack spacing={2}><TextField select label="Default ticket priority" defaultValue="normal" fullWidth sx={inputSx}><MenuItem value="low">Low</MenuItem><MenuItem value="normal">Normal</MenuItem><MenuItem value="high">High</MenuItem></TextField><TextField select label="Default ticket view" defaultValue="assigned" fullWidth sx={inputSx}><MenuItem value="assigned">Assigned to me</MenuItem><MenuItem value="all">All tickets</MenuItem><MenuItem value="new">New tickets</MenuItem></TextField><FormControlLabel control={<Checkbox defaultChecked />} label="Require a reason when reassigning tickets" /></Stack></SectionCard><SectionCard title="API integrations"><Stack spacing={2}><TextField label="ProsERP API base URL" defaultValue="https://dev-api.proserp.co.tz" fullWidth sx={inputSx} InputProps={{ startAdornment: <InputAdornment position="start"><Key fontSize="small" /></InputAdornment> }} /><TextField label="API key" type="password" placeholder="Enter integration key" fullWidth sx={inputSx} /><Alert severity="info">Keys are shown here for configuration UI only until the settings API is connected.</Alert></Stack></SectionCard><SectionCard title="Security"><Stack spacing={1}><FormControlLabel control={<Switch defaultChecked />} label="Require two-factor authentication for administrators" /><FormControlLabel control={<Switch defaultChecked />} label="Log administrative actions" /><Button variant="outlined" startIcon={<Shield />} sx={{ alignSelf: 'flex-start', mt: 1 }}>Review access policies</Button></Stack></SectionCard></Box></>;
}

function KnowledgeBase() {
  const [query, setQuery] = useState('');
  const filtered = articles.filter((article) => `${article.title} ${article.category}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageHeader title="Knowledge Base" subtitle="Manage reusable solutions and link helpful articles from tickets." action={<Button variant="contained" startIcon={<Add />}>New article</Button>} /><TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search articles" size="small" sx={{ ...inputSx, width: { xs: '100%', md: 320 }, mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} /><SectionCard title={`${filtered.length} articles`} action={<Button size="small" startIcon={<Tune />}>Manage categories</Button>}><Stack divider={<Divider />} spacing={0}>{filtered.map((article) => <Box key={article.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.8 }}><Avatar sx={{ bgcolor: '#eff6ff', color: '#2563eb' }}><Article fontSize="small" /></Avatar><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 600, color: '#0f172a' }}>{article.title}</Typography><Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>{article.id} · {article.views} views · updated {article.updated}</Typography></Box><Chip label={article.category} size="small" sx={{ display: { xs: 'none', sm: 'flex' } }} /><IconButton><MoreHoriz /></IconButton></Box>)}</Stack></SectionCard></>;
}

function Reports() {
  return <><PageHeader title="Ticket Reports" subtitle="Track volume, throughput, and resolution speed across the support team." action={<Button variant="outlined" startIcon={<EventNote />}>Last 7 days</Button>} /><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}{...{}}><Metric label="Tickets opened" value="78" change="+12%" /><Metric label="Tickets closed" value="63" change="+8%" /><Metric label="Avg. resolution" value="6h 24m" change="-18%" /><Metric label="SLA met" value="94%" change="+4%" /></Box><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 2 }}><SectionCard title="Ticket volume"><Box sx={{ height: 300 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={volumeData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="opened" stroke="#2563eb" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="closed" stroke="#22c55e" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></Box></SectionCard><SectionCard title="Average resolution by team member"><Box sx={{ height: 300 }}><ResponsiveContainer width="100%" height="100%"><RechartsBarChart layout="vertical" data={[{ name: 'Lilian', hours: 4.2 }, { name: 'Daniel', hours: 6.1 }, { name: 'Asha', hours: 3.8 }, { name: 'Musa', hours: 5.4 }]}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" /><XAxis type="number" tickLine={false} axisLine={false} /><YAxis dataKey="name" type="category" tickLine={false} axisLine={false} /><Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} /></RechartsBarChart></ResponsiveContainer></Box></SectionCard></Box></>;
}

function Metric({ label, value, change }: { label: string; value: string; change: string }) { return <Card sx={cardSx}><CardContent sx={{ p: 2.2 }}><Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>{label}</Typography><Typography sx={{ color: '#0f172a', fontWeight: 700, fontSize: '1.45rem', mt: 0.5 }}>{value}</Typography><Typography sx={{ color: change.startsWith('-') ? '#16a34a' : '#2563eb', fontSize: '0.78rem', mt: 0.4 }}>{change} vs previous period</Typography></CardContent></Card>; }

function ActivityLogs() {
  return <><PageHeader title="Activity Logs" subtitle="Audit administrative actions and changes across the support workspace." action={<Button variant="outlined" startIcon={<FilterList />}>Filter logs</Button>} /><SectionCard title="Recent activity" action={<Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>Showing last 30 days</Typography>}><Stack divider={<Divider />} spacing={0}>{activities.map((activity) => <Box key={`${activity.action}-${activity.time}`} sx={{ display: 'flex', gap: 2, py: 2 }}><Avatar sx={{ width: 36, height: 36, bgcolor: activity.tone === 'green' ? '#dcfce7' : activity.tone === 'orange' ? '#fef3c7' : '#dbeafe', color: activity.tone === 'green' ? '#15803d' : activity.tone === 'orange' ? '#b45309' : '#2563eb' }}><Timeline fontSize="small" /></Avatar><Box sx={{ flex: 1 }}><Typography sx={{ color: '#0f172a', fontWeight: 600 }}>{activity.action}</Typography><Typography sx={{ color: '#64748b', fontSize: '0.88rem' }}>{activity.detail}</Typography><Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', mt: 0.5 }}>{activity.actor} · {activity.time}</Typography></Box><IconButton size="small"><MoreHoriz /></IconButton></Box>)}</Stack></SectionCard></>;
}

function NotificationCenter() {
  const [items, setItems] = useState(notifications);
  const unread = items.filter((item) => item.unread).length;
  return <><PageHeader title="Notification Center" subtitle="Review alerts, assignments, and updates from your support workspace." action={<Button variant="outlined" onClick={() => setItems(items.map((item) => ({ ...item, unread: false })))}>Mark all read</Button>} /><Box sx={{ display: 'flex', gap: 1, mb: 2 }}><Chip label={`All ${items.length}`} color="primary" /><Chip label={`Unread ${unread}`} variant="outlined" /></Box><SectionCard title="Your notifications"><Stack divider={<Divider />} spacing={0}>{items.map((item, index) => <Box key={`${item.title}-${index}`} sx={{ display: 'flex', gap: 2, py: 2, bgcolor: item.unread ? '#f8fbff' : 'transparent', px: 1, mx: -1, borderRadius: '8px' }}><Avatar sx={{ bgcolor: item.unread ? '#dbeafe' : '#f1f5f9', color: item.unread ? '#2563eb' : '#64748b' }}><Notifications fontSize="small" /></Avatar><Box sx={{ flex: 1 }}><Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Typography sx={{ fontWeight: item.unread ? 700 : 600, color: '#0f172a' }}>{item.title}</Typography>{item.unread && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#2563eb' }} />}</Box><Typography sx={{ color: '#64748b', fontSize: '0.88rem' }}>{item.detail}</Typography><Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', mt: 0.5 }}>{item.time}</Typography></Box><Button size="small" onClick={() => setItems(items.map((current, currentIndex) => currentIndex === index ? { ...current, unread: false } : current))}>View</Button></Box>)}</Stack></SectionCard></>;
}

function SavedReplies() {
  const [selected, setSelected] = useState(replies[0]);
  return <><PageHeader title="Saved Replies" subtitle="Create and manage canned responses for faster customer communication." action={<Button variant="contained" startIcon={<Add />}>New reply</Button>} /><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '340px 1fr' }, gap: 2 }}><SectionCard title="Reply library"><Stack spacing={1}>{replies.map((reply) => <Button key={reply.shortcut} onClick={() => setSelected(reply)} sx={{ justifyContent: 'flex-start', textAlign: 'left', color: '#0f172a', p: 1.5, borderRadius: '8px', bgcolor: selected.shortcut === reply.shortcut ? '#eff6ff' : 'transparent' }}><Box><Typography sx={{ fontWeight: 600 }}>{reply.title}</Typography><Typography sx={{ color: '#64748b', fontSize: '0.78rem' }}>/{reply.shortcut}</Typography></Box></Button>)}</Stack></SectionCard><SectionCard title="Edit saved reply" action={<Button startIcon={<ContentCopy />}>Copy</Button>}><Stack spacing={2}><TextField label="Title" defaultValue={selected.title} fullWidth sx={inputSx} /><TextField label="Shortcut" defaultValue={selected.shortcut} fullWidth sx={inputSx} InputProps={{ startAdornment: <InputAdornment position="start">/</InputAdornment> }} /><TextField label="Response" defaultValue={selected.body} multiline minRows={8} fullWidth sx={inputSx} /><Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}><Button color="error">Delete</Button><Button variant="contained" startIcon={<Save />}>Save reply</Button></Box></Stack></SectionCard></Box></>;
}

export default function SupportWorkspacePage({ view }: { view: WorkspaceView }) {
  const { authData } = useJumboAuth();
  const lang = useLanguage();
  const router = useRouter();
  const authUser = authData?.authUser?.user;
  const isStaff = authUser?.is_staff === true;
  const userRole = (view === 'create' && !isStaff) || (view === 'notifications' && !isStaff)
    ? 'customer'
    : 'staff';
  const staffOnlyViews: WorkspaceView[] = ['staff', 'customerProfile', 'settings', 'knowledge', 'reports', 'activity', 'replies'];

  useEffect(() => {
    if (!authData.isLoading && !isStaff && staffOnlyViews.includes(view)) {
      router.replace(`/${lang}/support/customer`);
    }
  }, [authData.isLoading, isStaff, lang, router, view]);

  if (!authData.isLoading && !isStaff && staffOnlyViews.includes(view)) {
    return null;
  }
  const content = { staff: <StaffDirectory />, customerProfile: <CustomerProfile />, settings: <SettingsPage />, create: <CreateTicket />, knowledge: <KnowledgeBase />, reports: <Reports />, activity: <ActivityLogs />, notifications: <NotificationCenter />, replies: <SavedReplies /> }[view];
  return <SupportLayout userRole={userRole} userName={authUser?.name || (userRole === 'staff' ? 'Staff' : 'Customer')} userRoleLabel={userRole === 'staff' ? 'Staff' : 'Customer'}>{content}</SupportLayout>;
}
