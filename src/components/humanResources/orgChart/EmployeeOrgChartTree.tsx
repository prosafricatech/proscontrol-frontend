'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useHighcharts } from '@/app/providers/HighchartsProvider';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { OrgChartNode, useEmployeeOrgChart } from './EmployeeOrgChartProvider';

const HighchartsReact = dynamic(
  () => import('highcharts-react-official'),
  { ssr: false, loading: () => <BackdropSpinner /> }
);

const flattenOrgChart = (
  nodes: OrgChartNode[] = [],
  parentId: string | null = null
): any[] => {
  return nodes.flatMap((node) => {
    const flatId = 'emp_' + node.id;
    const flatNode = {
      id: flatId,
      parent: parentId,
      name: `${node.first_name} ${node.last_name}`,
      department: node.department?.name || '',
      employeeId: node.id,
    };
    return [flatNode, ...flattenOrgChart(node.children || [], flatId)];
  });
};

export default function EmployeeOrgChartTree() {
  const { orgChart, isLoading } = useEmployeeOrgChart();
  const { Highcharts, isReady } = useHighcharts();
  const router = useRouter();
  const lang = useLanguage();

  // Show loading states
  if (isLoading || !isReady || !Highcharts) {
    return <BackdropSpinner />;
  }

  if (!orgChart || orgChart.length === 0) {
    return (
      <JumboCardQuick sx={{ borderRadius: 2 }}>
        <Typography variant='body2' color='text.secondary'>
          No employees yet.
        </Typography>
      </JumboCardQuick>
    );
  }

  const orgChartNodes = flattenOrgChart(orgChart);

  const chartOptions = {
    chart: {
      type: 'treegraph',
      inverted: false,
      backgroundColor: 'rgba(128,128,128,0.02)',
      borderWidth: 0,
      height: 3000,
      scrollablePlotArea: {
        minWidth: 2000,
      },
      spacingBottom: 100,
    },
    title: {
      text: 'Org Chart',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
      },
    },
    series: [
      {
        type: 'treegraph',
        name: 'Employees',
        data: orgChartNodes,
        marker: {
          symbol: 'rect',
          width: '15%',
        },
        borderRadius: 10,
        colorByPoint: false,
        color: '#007ad0',
        cursor: 'pointer',
        point: {
          events: {
            click: function (this: any, event: any) {
              const target = event?.target as Element | undefined;
              if (target?.closest?.('.highcharts-collapse-button')) {
                return;
              }
              router.push(`/${lang}/humanResources/employees/${this.employeeId}`);
            },
          },
        },
        dataLabels: {
          pointFormat: '{point.name}',
          style: {
            whiteSpace: 'nowrap',
            fontSize: '12px',
          },
        },
        borderColor: '#ccc',
        borderWidth: 1,
        nodeWidth: 100,
        nodeHeight: 25,
        layoutAlgorithm: {
          split: 'horizontal',
          nodeSpacing: 30,
          levelSpacing: 80,
        },
        levels: [
          {
            level: 1,
            levelIsConstant: false,
          },
          {
            level: 2,
            colorByPoint: true,
          },
          {
            level: 3,
            colorVariation: {
              key: 'brightness',
              to: -0.5,
            },
          },
          {
            level: 4,
            colorVariation: {
              key: 'brightness',
              to: 0.5,
            },
          },
        ],
      },
    ],
    tooltip: {
      outside: true,
      formatter: function (this: any) {
        const { name, department } = this.point;
        return department
          ? `<b>${name}</b><br>${department}`
          : `<b>${name}</b>`;
      },
    },
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 500,
          },
          chartOptions: {
            chart: {
              height: '300px',
            },
            series: [
              {
                nodeWidth: 50,
                nodeHeight: 20,
              },
            ],
          },
        },
      ],
    },
  };

  return (
    <JumboCardQuick sx={{ borderRadius: 2 }}>
      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
        constructorType='chart'
      />
    </JumboCardQuick>
  );
}