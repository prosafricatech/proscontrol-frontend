// Chart color constants
export const CHART_COLORS = {
  primary: '#007ad0',
  secondary: '#1976D2',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  slate: '#455A64',
  red: '#D32F2F',
  orange: '#ED6C02',
  blue: '#1976D2',
  purple: '#9C27B0',
  amber: '#FF6F00',
};

export const getBaseChartOptions = (height: number = 3000, minWidth: number = 2000) => ({
  chart: {
    inverted: false,
    backgroundColor: 'rgba(128,128,128,0.02)',
    borderWidth: 0,
    height: height,
    scrollablePlotArea: {
      minWidth: minWidth,
    },
    spacingBottom: 100,
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
              dataLabels: {
                style: {
                  fontSize: '10px',
                },
              },
            },
          ],
        },
      },
    ],
  },
});

// Treegraph specific options
export const getTreeGraphOptions = (data: any[], title: string, onClick?: (point: any) => void) => ({
  ...getBaseChartOptions(Math.max(3000, data.length * 30), Math.max(2000, data.length * 20)),
  title: {
    text: title,
    style: {
      fontSize: '18px',
      fontWeight: 'bold',
    },
  },
  series: [
    {
      type: 'treegraph',
      name: 'Nodes',
      data: data,
      marker: {
        symbol: 'rect',
        width: '15%',
      },
      borderRadius: 10,
      colorByPoint: false,
      color: CHART_COLORS.primary,
      cursor: onClick ? 'pointer' : 'default',
      point: onClick ? {
        events: {
          click: function(this: any, event: any) {
            // Guard against collapse button clicks
            const target = event?.target as Element | undefined;
            if (target?.closest?.('.highcharts-collapse-button')) {
              return;
            }
            onClick(this);
          },
        },
      } : undefined,
      dataLabels: {
        pointFormat: '{point.name}',
        style: {
          whiteSpace: 'nowrap',
          fontSize: '12px',
        },
        verticalAlign: 'middle',
        align: 'center',
      },
      borderColor: '#ccc',
      borderWidth: 1,
      nodeWidth: 80,
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
          color: CHART_COLORS.blue,
        },
        {
          level: 2,
          colorByPoint: true,
          color: CHART_COLORS.info,
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
    formatter: function(this: any) {
      const { name, nodeType, className } = this.point;
      let tooltipText = `<b>${name || 'Unnamed'}</b>`;
      if (nodeType) {
        tooltipText += `<br>Type: ${nodeType}`;
      }
      if (className && className.includes('milestone-task')) {
        tooltipText += `<br><span style="color: ${CHART_COLORS.orange};">⭐ Milestone</span>`;
      }
      return tooltipText;
    },
  },
});