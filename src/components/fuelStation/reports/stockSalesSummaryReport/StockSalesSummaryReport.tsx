'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import StationSelector from '@/components/fuelStation/Stations/StationSelector';
import { Station } from '@/components/fuelStation/Stations/StationType';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div, Span } from '@jumbo/shared';
import { HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import fuelStationServices from '../../fuelStationServices';
import StockSalesSummaryReportOnScreen from './StockSalesSummaryReportOnScreen';
dayjs.extend(isSameOrAfter);

interface QueryParams {
  fuel_station_ids: number[];
  from: string;
  to: string;
}

interface FilterFormValues {
  from: Dayjs;
  to: Dayjs;
  stations: Station[];
}

const filterSchema = yup.object({
  from: yup
    .mixed<Dayjs>()
    .required('From date is required')
    .test('is-dayjs', 'Invalid date', dayjs.isDayjs),
  to: yup
    .mixed<Dayjs>()
    .required('To date is required')
    .test('is-dayjs', 'Invalid date', dayjs.isDayjs)
    .test(
      'after-or-same',
      'To date must be after or same as From date',
      function (value) {
        const { from } = this.parent;
        return !from || !value || dayjs(value).isSameOrAfter(dayjs(from));
      }
    ),
  stations: yup
    .array()
    .of(yup.mixed<Station>())
    .min(1, 'At least one station is required')
    .required('At least one station is required'),
}) as yup.ObjectSchema<FilterFormValues>;

interface StockSalesSummaryReportProps {
  closeDialog?: (value: boolean) => void;
}

const StockSalesSummaryReport: React.FC<StockSalesSummaryReportProps> = ({
  closeDialog,
}) => {
  const css = useProsERPStyles();
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [queryParams, setQueryParams] = useState<QueryParams | null>(null);
  const [pdfFilters, setPdfFilters] = useState<{ from: string; to: string } | null>(
    null
  );

  const {
    control,
    handleSubmit,
  } = useForm<FilterFormValues>({
    resolver: yupResolver(filterSchema) as any,
    defaultValues: {
      from: dayjs().startOf('day'),
      to: dayjs().endOf('day'),
      stations: [],
    },
  });

  const { data: reportData, isFetching: isFetchingReport } = useQuery({
    queryKey: ['stockSalesSummaryReport', queryParams],
    queryFn: async () => {
      if (!queryParams) return null;
      const report = await fuelStationServices.stockSalesSummaryReport(
        queryParams
      );
      return Array.isArray(report) ? report : [report];
    },
    enabled: !!queryParams,
    refetchOnWindowFocus: false,
  });

  const onSubmit = (data: FilterFormValues) => {
    setQueryParams({
      fuel_station_ids: data.stations
        .map((station) => station.id)
        .filter((id): id is number => id !== undefined),
      from: data.from.toISOString(),
      to: data.to.toISOString(),
    });
    setPdfFilters({
      from: readableDate(data.from),
      to: readableDate(data.to),
    });
  };

  const hasData = !!reportData && reportData.length > 0 && !!pdfFilters;

  return (
    <>
      <DialogTitle textAlign='center'>
        <Stack
          direction='row'
          justifyContent='center'
          alignItems='center'
          position='relative'
        >
          <Typography variant='h4' fontWeight={600}>
            Fuel Stock & Sales Summary
          </Typography>
          {belowLargeScreen && (
            <Tooltip title='Close'>
              <IconButton
                size='small'
                sx={{ position: 'absolute', right: 20, top: 0 }}
                onClick={() => closeDialog?.(false)}
              >
                <HighlightOff color='primary' />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <Span className={css.hiddenOnPrint}>
          <form onSubmit={handleSubmit(onSubmit)} autoComplete='off'>
            <Grid
              container
              spacing={2}
              mt={2}
              alignItems='center'
              justifyContent='center'
            >
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name='stations'
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <StationSelector
                      multiple
                      label='Stations'
                      defaultValue={[]}
                      frontError={error}
                      onChange={(newValue) =>
                        field.onChange(
                          Array.isArray(newValue) ? newValue : newValue ? [newValue] : []
                        )
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name='from'
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <Div sx={{ mt: 1, mb: 1 }}>
                      <DateTimePicker
                        label='From'
                        value={field.value}
                        minDate={dayjs(organization?.recording_start_date)}
                        ampm={false}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            error: !!error,
                            helperText: error?.message,
                          },
                        }}
                        onChange={field.onChange}
                      />
                    </Div>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name='to'
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <Div sx={{ mt: 1, mb: 1 }}>
                      <DateTimePicker
                        label='To'
                        value={field.value}
                        minDate={dayjs(organization?.recording_start_date)}
                        ampm={false}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            error: !!error,
                            helperText: error?.message,
                          },
                        }}
                        onChange={field.onChange}
                      />
                    </Div>
                  )}
                />
              </Grid>

              <Grid
                size={{ xs: 12 }}
                textAlign='right'
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'end',
                  gap: 1,
                }}
              >
                <LoadingButton
                  size='small'
                  type='submit'
                  loading={isFetchingReport}
                  variant='contained'
                >
                  Filter
                </LoadingButton>
              </Grid>
            </Grid>
          </form>
        </Span>
      </DialogTitle>

      <DialogContent>
        {isFetchingReport ? (
          <div style={{ width: '100%', padding: '16px' }}>
            <Skeleton
              variant='text'
              width={180}
              height={32}
              style={{ borderRadius: 4, marginLeft: 'auto' }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={48}
              style={{ borderRadius: 4 }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={32}
              style={{ borderRadius: 4 }}
            />
          </div>
        ) : hasData ? (
          <StockSalesSummaryReportOnScreen
            reportData={reportData}
            organization={organization}
            filters={pdfFilters!}
          />
        ) : (
          <Alert variant='outlined' severity='info'>
            {queryParams
              ? 'No data present for the selected filters'
              : 'Please select filters and click "Filter" to generate the report'}
          </Alert>
        )}
      </DialogContent>
    </>
  );
};

export default StockSalesSummaryReport;
