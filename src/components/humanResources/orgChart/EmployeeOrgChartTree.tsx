'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Highcharts from 'highcharts';
import treemapModule from 'highcharts/modules/treemap';
import treegraphModule from 'highcharts/modules/treegraph';
import exportingModule from 'highcharts/modules/exporting';
import exportDataModule from 'highcharts/modules/export-data';
import offlineExportingModule from 'highcharts/modules/offline-exporting';
import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';
import { OrgChartNode, useEmployeeOrgChart } from './EmployeeOrgChartProvider';

const HighchartsReact = dynamic(
  () => import('highcharts-react-official').then((m) => (m && (m.default ?? m))),
  { ssr: false }
);

// Flattens the nested manager_id tree into the flat {id, parent} list
// Highcharts' treegraph series needs — same technique as
// TasksTreeView.jsx's flattenGroups(), just without the group/task duality.
const flattenOrgChart = (nodes: OrgChartNode[] = [], parentId: string | null = null): any[] => {
  return nodes.flatMap((node) => {
    const flatId = 'emp_' + node.id;
    const flatNode = {
      id: flatId,
      parent: parentId,
      name: `${node.first_name} ${node.last_name}`,
      designation: node.active_contract?.designation?.title || '',
      employeeId: node.id,
    };

    return [flatNode, ...flattenOrgChart(node.children || [], flatId)];
  });
};

// How many levels deep the tree goes, and the most siblings sharing any
// single level (summed across every branch, not just one parent's own
// children) — used to size the plot area to what this org's chart actually
// needs instead of a fixed guess. A fixed guess either overshoots (small
// org: dead empty space) or undershoots (large org: siblings on a wide
// level rendering right on top of each other, since Highcharts distributes
// them evenly across whatever plot space it's given regardless of the
// node's own configured size).
const getMaxDepth = (nodes: OrgChartNode[] = [], depth = 1): number => {
  if (nodes.length === 0) return depth - 1;
  return Math.max(...nodes.map((node) => getMaxDepth(node.children || [], depth + 1)));
};

const getMaxLevelWidth = (nodes: OrgChartNode[] = []): number => {
  let max = 0;
  let level = nodes;
  while (level.length > 0) {
    max = Math.max(max, level.length);
    level = level.flatMap((node) => node.children || []);
  }
  return max;
};

export default function EmployeeOrgChartTree() {
  const { orgChart, isLoading } = useEmployeeOrgChart();
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const router = useRouter();
  const lang = useLanguage();
  const { authOrganization } = useJumboAuth() as any;
  const organizationName = authOrganization?.organization?.name;

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

        applyModule(treemapModule);
        applyModule(treegraphModule);
        applyModule(exportingModule);
        applyModule(exportDataModule);
        applyModule(offlineExportingModule);
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

  if (isLoading || !modulesLoaded) {
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
  const maxDepth = Math.max(1, getMaxDepth(orgChart));
  const maxLevelWidth = Math.max(1, getMaxLevelWidth(orgChart));

  // scrollablePlotArea makes the *canvas* bigger, but treegraph computes each
  // node's position from chart.plotSizeX/plotSizeY before that expansion is
  // applied — so the extra room just becomes empty margin around a tree
  // that's still laid out for the original, smaller size. Nodes never
  // actually spread out to fill it (confirmed: canvas got wide, nodes
  // stayed bunched in the middle). The fix is to make the chart's own real
  // width/height big from the start — which treegraph's layout does read
  // correctly — and let the *page* scroll (a wrapping div with overflow:
  // auto below) instead of asking Highcharts' own scroll mechanism to do
  // something it isn't wired up to do for this series type.
  // NODE_SLOT is the room each sibling gets; NODE_BOX is how much of that
  // the drawn rectangle actually occupies. Keeping the box meaningfully
  // smaller than its slot is what produces a visible gap between siblings —
  // sized equal (the earlier values) they render flush against each other,
  // and same-coloured neighbours merge into one continuous pill.
  const NODE_SLOT = 210;
  const NODE_BOX = 120;
  // Levels stack vertically (siblings spread horizontally within a row),
  // so this is what actually controls the level-to-level gap — a quarter
  // of NODE_SLOT, tightening that gap without touching sibling spacing.
  const LEVEL_SLOT = NODE_SLOT * 0.25;

  const roomyUnit = Math.max(maxDepth, maxLevelWidth);
  const chartWidth = Math.max(1000, roomyUnit * NODE_SLOT + 300);
  const chartHeight = Math.max(700, roomyUnit * LEVEL_SLOT + 300);

  const chartOptions = {
    chart: {
      type: 'treegraph',
      // Landscape: root on the left, each level growing to the right,
      // instead of stacking downward — easier to follow across levels for
      // a wide org, and the browser scrolls sideways instead of a very
      // tall page.
      inverted: true,
      backgroundColor: 'rgba(128,128,128,0.02)',
      borderWidth: 0,
      width: chartWidth,
      height: chartHeight,
      reflow: false,
      spacingBottom: 60,
    },
    title: {
      text: organizationName
        ? `${organizationName} Organization Chart`
        : 'Organization Chart',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
      },
    },
    // Anchored left rather than its default top-right: the chart is now
    // deliberately wider than the viewport, so a right-aligned button sits
    // off past the visible edge until you scroll all the way over.
    exporting: {
      enabled: true,
      buttons: {
        contextButton: {
          align: 'left',
          x: 5,
          y: 0,
        },
      },
    },
    series: [
      {
        type: 'treegraph',
        name: 'Employees',
        data: orgChartNodes,
        // Fixed pixel size, not a '%'/nodeWidth+nodeHeight combo — those are
        // relative to plotSizeX/plotSizeY, which Highcharts swaps once
        // `chart.inverted` is on. That swap goes for marker.width/height too
        // (confirmed visually — the larger value rendered as the *vertical*
        // side, not horizontal), so they're deliberately assigned backwards
        // here: the small number is what ends up as the visual width.
        marker: {
          symbol: 'rect',
          width: 28,
          height: NODE_BOX,
          radius: 4,
        },
        borderRadius: 10,
        colorByPoint: false,
        color: '#007ad0',
        cursor: 'pointer',
        point: {
          events: {
            // Highcharts' own collapse/expand button lives inside the same
            // point graphic and fires this same 'click' event — without this
            // guard, toggling collapse also navigated to the employee profile.
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
          align: 'center',
          verticalAlign: 'middle',
          rotation: 0,
          // Kept within the node box — a long name is ellipsized instead of
          // spilling past the rectangle (style.width forces the truncation
          // point; textOverflow does the ellipsis, overriding treegraph's
          // own default of 'none').
          style: {
            whiteSpace: 'nowrap',
            fontSize: '12px',
            textOutline: 'none',
            textOverflow: 'ellipsis',
            // A touch narrower than NODE_BOX so a long name ellipsizes
            // inside the rectangle rather than running to its very edge.
            width: `${NODE_BOX - 14}px`,
          },
        },
        borderColor: '#ccc',
        borderWidth: 1,
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
        const { name, designation } = this.point;
        return designation ? `<b>${name}</b><br>${designation}` : `<b>${name}</b>`;
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
              height: 300,
            },
          },
        },
      ],
    }, 
    
  };

  return (
    <JumboCardQuick sx={{ borderRadius: 2, overflow: 'visible' }}>
      {/* The chart is given a real fixed width/height above (large enough
          for the tree's actual depth/breadth) rather than relying on
          Highcharts' own scrollablePlotArea, which doesn't feed back into
          treegraph's node layout. The browser scrolls this wrapper instead. */}
      {/* width:'100%' + minWidth:0 is the standard fix for a flex/grid
          ancestor (this app's page shell almost certainly has one) letting
          a wide child stretch the whole page instead of scrolling within
          its own box — flex items default to min-width:auto, which lets
          them grow past their container to fit content, silently
          defeating overflow:auto until it's forced back to 0. */}
      <Box
        sx={{
          overflowX: 'auto',
          overflowY: 'auto',
          width: '100%',
          minWidth: 0,
          // Made explicitly visible (not relying on the OS's auto-hiding
          // overlay scrollbar) so it's obvious there's more to scroll to.
          '&::-webkit-scrollbar': { height: 10, width: 10 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: 5,
          },
          scrollbarWidth: 'thin',
        }}
      >
        {/* The explicit px width/height here is essential, not cosmetic:
            Highcharts runs `css(renderTo, { overflow: 'hidden' })` on this
            very div (highcharts.src.js ~38163). Left at its default block
            width it matches the scroll box exactly, clips the wider chart
            inside it, and the scroll box never sees any overflow — so the
            right half vanishes with no scrollbar. Sizing it to the chart
            makes it genuinely wider than the scroll box, which is what
            actually produces the scrollbar. */}
        <HighchartsReact
          highcharts={Highcharts}
          options={chartOptions}
          constructorType='chart'
          containerProps={{
            style: { width: `${chartWidth}px`, height: `${chartHeight}px` },
          }}
        />
      </Box>
    </JumboCardQuick>
  );
}
