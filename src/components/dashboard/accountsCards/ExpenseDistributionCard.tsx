'use client';
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Box, Skeleton, Typography, useMediaQuery } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import exportingModule from 'highcharts/modules/exporting';
import { useEffect, useState } from 'react';
import financialReportsServices from '../../accounts/reports/financial-reports-services';
import { useDashboardSettings } from '../Dashboard';

interface ExpenseData {
  ledger_name: string;
  amount: number;
}
interface ChartDataPoint {
  name: string;
  y: number;
}

function ExpenseDistributionCard() {
  const {
    chartFilters: { from, to, cost_center_ids },
  } = useDashboardSettings();
  const [params, setParams] = useState({
    from,
    to,
    cost_center_ids,
    aggregate_by: 'day' as const,
  });
  const [modulesLoaded, setModulesLoaded] = useState(false);

  useEffect(() => {
    setParams((prev) => ({ ...prev, from, to, cost_center_ids }));
  }, [from, to, cost_center_ids]);

  const { theme } = useJumboTheme();
  const xlScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const midScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const textColor = theme.palette.text.primary;
  const backgroundColor = theme.palette.background.paper;

  const { data: expenseDistribution, isLoading } = useQuery({
    queryKey: ['expenseDistribution', params],
    queryFn: async () => {
      const expenses = await financialReportsServices.expenseFigures({
        from: params.from,
        to: params.to,
        ledgerGroupId: 19,
        cost_center_ids: params.cost_center_ids,
        group_by_ledgers: true,
      });

      return expenses.map((expense: ExpenseData) => ({
        name: expense.ledger_name,
        y: expense.amount,
      })) as ChartDataPoint[];
    },
  });

  useEffect(() => {
    let mounted = true;

    const applyModule = (mod: any) => {
      const init = mod && (mod.default ?? mod);
      if (typeof init === 'function') {
        init(Highcharts);
      }
    };

    async function load() {
      try {
        (window as any).Highcharts = (window as any).Highcharts || Highcharts;

        applyModule(exportingModule);
      } catch (err) {
        console.error('Failed to load Highcharts modules:', err);
      } finally {
        if (mounted) setModulesLoaded(true);
      }
    }

    if (typeof window !== 'undefined') load();

    return () => {
      mounted = false;
    };
  }, []);

  const options: Highcharts.Options = {
    chart: {
      type: 'pie',
      height: 255,
      backgroundColor: 'transparent',
      spacing: [10, 10, 10, 10],
      style: { color: textColor },
    },
    title: { text: '' },
    tooltip: {
      pointFormat: '{point.y}: <b>({point.percentage:.1f}%)</b>',
      backgroundColor,
      style: { color: textColor },
    },
    plotOptions: {
      pie: {
        size: '55%',
        center: ['50%', '55%'],
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          distance: 15,
          format: '<b>{point.name}</b><br>{point.percentage:.1f} %',
          style: {
            color: textColor,
            textOutline: '0px transparent', // prevents shrinking issue
            fontSize: '11px',
          },
        },
      },
    },
    credits: { enabled: false },
    legend: {
      itemStyle: { color: textColor },
    },
    series: [
      {
        type: 'pie',
        name: 'Expenses',
        colorByPoint: true,
        data: expenseDistribution || [],
      } as Highcharts.SeriesPieOptions,
    ],
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      Highcharts.charts.forEach((chart) => chart?.reflow());
    }, 100);
    return () => clearTimeout(timeout);
  }, [theme.type]);

  return (
    <JumboCardQuick
      // title={'Operating Expenses'}
      sx={{
        height: midScreen ? 360 : null,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ px: 2, pt: 1 }}>
        <Typography
          variant='subtitle1'
          sx={{
            color: textColor,
            fontFamily: 'NoirPro, Arial',
          }}
        >
          Operating Expenses
        </Typography>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isLoading || !modulesLoaded ? (
          <Skeleton
            variant='rectangular'
            width='100%'
            height={245}
            sx={{ borderRadius: 2 }}
          />
        ) : (
          <HighchartsReact
            key={theme.type}
            highcharts={Highcharts}
            options={options}
          />
        )}
      </Box>
    </JumboCardQuick>
  );
}

export default ExpenseDistributionCard;
