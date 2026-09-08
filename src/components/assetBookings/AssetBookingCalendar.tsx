'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import AddOutlined from '@mui/icons-material/AddOutlined';
import {
  Box,
  Button,
  Dialog,
  LinearProgress,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import CurrencySelectProvider from '@/components/masters/Currencies/CurrencySelectProvider';
import assetBookingsServices from './asset-bookings-services';
import AssetBookingFormDialogContent from './AssetBookingFormDialogContent';
import AssetBookingDetailDialog from './AssetBookingDetailDialog';

const localizer = momentLocalizer(moment);

const STATUS_BG: Record<string, string> = {
  draft: '#9e9e9e',
  confirmed: '#0288d1',
  ongoing: '#7b1fa2',
  completed: '#2e7d32',
  cancelled: '#c62828',
};

const AssetBookingCalendar = () => {
  const dictionary = useDictionary();
  const { organizationHasSubscribed, checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const belowSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [view, setView] = useState<View>('week');

  // Resource columns (one per asset) are unusable squeezed onto a phone —
  // default to Agenda there instead. Only runs once on mount so a manual
  // view change afterwards isn't fought on every resize.
  useEffect(() => {
    if (belowSmallScreen) setView('agenda');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [range, setRange] = useState(() => ({
    from: dayjs().startOf('week').format('YYYY-MM-DD'),
    to: dayjs().endOf('week').format('YYYY-MM-DD'),
  }));
  const [assetFilter, setAssetFilter] = useState<number | 'all'>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [formDefaults, setFormDefaults] = useState<{ start?: string; end?: string; asset?: any }>({});
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const { data: assets = [] } = useQuery<any[]>({
    queryKey: ['assetBookingOptions'],
    queryFn: () => assetBookingsServices.getAssetOptions(''),
  });

  const { data: bookings = [], isLoading } = useQuery<any[]>({
    queryKey: ['assetBookingsCalendar', range.from, range.to, assetFilter],
    queryFn: () => assetBookingsServices.getCalendar({
      from: range.from,
      to: range.to,
      asset_detail_id: assetFilter === 'all' ? undefined : [assetFilter],
    }),
  });

  const resources = useMemo(() => {
    const list = assetFilter === 'all' ? assets : assets.filter((a: any) => a.id === assetFilter);
    return list.map((a: any) => ({
      resourceId: a.id,
      resourceTitle: `${a.code}${a.product_item?.identification ? ' — ' + a.product_item.identification : ''}`,
    }));
  }, [assets, assetFilter]);

  const events = useMemo(() => bookings.map((b: any) => {
    // Lead with whoever/whatever identifies this booking at a glance —
    // the customer for external bookings, the cost center for internal —
    // the code alone isn't enough to tell events apart in the grid.
    const identifier = b.stakeholder?.name ?? b.cost_center?.name;
    const title = identifier
      ? `${identifier} · ${b.code}`
      : `${b.code} · ${dictionary.bookings.calendar.event[b.booking_type]}`;

    return {
      id: b.id,
      resourceId: b.asset_detail_id,
      title,
      start: new Date(b.start_at),
      end: new Date(b.end_at),
      resource: b,
    };
  }), [bookings, dictionary]);

  const handleRangeChange = (newRange: any) => {
    if (Array.isArray(newRange)) {
      setRange({
        from: dayjs(newRange[0]).format('YYYY-MM-DD'),
        to: dayjs(newRange[newRange.length - 1]).format('YYYY-MM-DD'),
      });
    } else if (newRange?.start && newRange?.end) {
      setRange({
        from: dayjs(newRange.start).format('YYYY-MM-DD'),
        to: dayjs(newRange.end).format('YYYY-MM-DD'),
      });
    }
  };

  const handleSelectSlot = (slotInfo: any) => {
    if (!checkOrganizationPermission([PERMISSIONS.ASSET_BOOKINGS_CREATE])) return;
    setSelectedBooking(null);
    setFormDefaults({
      start: dayjs(slotInfo.start).format('YYYY-MM-DDTHH:mm:ss'),
      end: dayjs(slotInfo.end).format('YYYY-MM-DDTHH:mm:ss'),
      asset: assets.find((a: any) => a.id === slotInfo.resourceId) ?? null,
    });
    setFormOpen(true);
  };

  if (!organizationHasSubscribed(MODULES.ASSET_BOOKINGS)) {
    return <UnsubscribedAccess modules={'Asset Bookings'} />;
  }

  if (!checkOrganizationPermission([PERMISSIONS.ASSET_BOOKINGS_READ])) {
    return <UnauthorizedAccess />;
  }

  return (
    <StakeholderSelectProvider>
    <CurrencySelectProvider>
    <Box>
      <Typography variant={'h4'} mb={2}>{dictionary.bookings.calendar.labels.listHeader}</Typography>

      <Box display="flex" flexWrap="wrap" gap={1} mb={2} justifyContent="space-between" alignItems="center">
        <TextField
          select
          size="small"
          sx={{ minWidth: 260 }}
          label={dictionary.bookings.calendar.labels.asset}
          value={assetFilter}
          onChange={(e) => setAssetFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <MenuItem value="all">{dictionary.bookings.calendar.labels.allAssets}</MenuItem>
          {assets.map((a: any) => (
            <MenuItem key={a.id} value={a.id}>
              {a.code}{a.product_item?.identification ? ' — ' + a.product_item.identification : ''}
            </MenuItem>
          ))}
        </TextField>

        {checkOrganizationPermission([PERMISSIONS.ASSET_BOOKINGS_CREATE]) && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddOutlined />}
            onClick={() => {
              setSelectedBooking(null);
              setFormDefaults({});
              setFormOpen(true);
            }}
          >
            {dictionary.bookings.calendar.labels.newBooking}
          </Button>
        )}
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 1 }} />}

      <Box sx={{ overflowX: 'auto', bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
        <Box
          // react-big-calendar's own stylesheet hardcodes light-mode colors
          // with no dark-mode awareness — this class carries the overrides
          // (see asset-booking-calendar-dark.css) that keep it readable.
          className={theme.type === 'dark' ? 'pros-rbc-dark' : undefined}
          sx={{
            height: belowLargeScreen ? 560 : 720,
            // Resource columns (Day/Week) need real width each to stay legible;
            // this box scrolls horizontally on narrow screens instead of the
            // whole page, and instead of squeezing every column unreadably thin.
            minWidth: (view === 'day' || view === 'week')
              ? Math.max(600, resources.length * 220)
              : 600,
          }}
        >
          <Calendar
            localizer={localizer}
            events={events}
            view={view}
            onView={(v) => setView(v)}
            views={['month', 'week', 'day', 'agenda']}
            onRangeChange={handleRangeChange}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={(event: any) => setSelectedBooking(event.resource)}
            resources={view === 'day' || view === 'week' ? resources : undefined}
            resourceIdAccessor="resourceId"
            resourceTitleAccessor="resourceTitle"
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            eventPropGetter={(event: any) => ({
              style: {
                backgroundColor: STATUS_BG[event.resource.status] ?? STATUS_BG.draft,
                borderColor: 'transparent',
              },
            })}
          />
        </Box>
      </Box>

      <Dialog open={formOpen} scroll="paper" fullWidth fullScreen={belowLargeScreen} onClose={() => setFormOpen(false)}>
        {formOpen && (
          <AssetBookingFormDialogContent
            booking={selectedBooking ?? undefined}
            onClose={() => {
              setFormOpen(false);
              setSelectedBooking(null);
            }}
            defaultAssetDetail={formDefaults.asset}
            defaultStartAt={formDefaults.start}
            defaultEndAt={formDefaults.end}
          />
        )}
      </Dialog>

      <Dialog open={Boolean(selectedBooking) && !formOpen} scroll="paper" fullWidth fullScreen={belowLargeScreen} onClose={() => setSelectedBooking(null)}>
        {selectedBooking && (
          <AssetBookingDetailDialog
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onEdit={() => {
              setFormDefaults({});
              setFormOpen(true);
            }}
          />
        )}
      </Dialog>
    </Box>
    </CurrencySelectProvider>
    </StakeholderSelectProvider>
  );
};

export default AssetBookingCalendar;
