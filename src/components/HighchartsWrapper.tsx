'use client';

import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';
import { useHighcharts } from '@/app/providers/HighchartsProvider';
import dynamic from 'next/dynamic';
import { forwardRef, useEffect, useRef, useState, useCallback } from 'react';

const HighchartsReact = dynamic(
  () => import('highcharts-react-official'),
  {
    ssr: false,
    loading: () => <BackdropSpinner />
  }
);

interface HighchartsWrapperProps {
  options: any;
  className?: string;
  onChartReady?: (chart: any) => void;
  loadingComponent?: React.ReactNode;
  callback?: (chart: any) => void;
  constructorType?: 'chart' | 'ganttChart' | 'stockChart' | 'mapChart';
}

export const HighchartsWrapper = forwardRef<any, HighchartsWrapperProps>(
  ({
    options,
    className,
    onChartReady,
    loadingComponent,
    callback,
    constructorType = 'chart'
  }, ref) => {
    const { Highcharts, isReady } = useHighcharts();
    const chartRef = useRef<any>(null);
    const [chartInstance, setChartInstance] = useState<any>(null);
    const isMounted = useRef(true);

    // ✅ Cleanup on unmount
    useEffect(() => {
      isMounted.current = true;
      return () => {
        isMounted.current = false;
      };
    }, []);

    // Forward ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(chartRef.current);
        } else {
          ref.current = chartRef.current;
        }
      }
    }, [ref, chartRef.current]);

    // ✅ Safe reflow function with proper checks
    const safeReflow = useCallback((chart: any) => {
      if (!isMounted.current) return;
      
      // Check if chart exists and has reflow method
      if (!chart || typeof chart !== 'object') {
        console.debug('Chart not available for reflow');
        return;
      }

      // Check if reflow is a function
      if (typeof chart.reflow !== 'function') {
        console.debug('Chart reflow is not a function');
        return;
      }

      try {
        // Check if chart has container before reflow
        if (chart.container && chart.container.parentNode) {
          chart.reflow();
        } else {
          console.debug('Chart container not ready for reflow');
        }
      } catch (error) {
        // Silently fail - chart might not be ready
        console.debug('Chart reflow error:', error instanceof Error ? error.message : 'Unknown error');
      }
    }, []);

    // ✅ Handle chart ready with proper reflow
    const handleChartReady = useCallback((chart: any) => {
      if (!isMounted.current) return;

      // Store chart instance
      setChartInstance(chart);

      // Call the callback if provided
      if (callback) {
        callback(chart);
      }

      // Call onChartReady if provided
      if (onChartReady) {
        onChartReady(chart);
      }

      // ✅ Safely reflow the chart after it's ready
      if (chart) {
        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
          if (isMounted.current) {
            safeReflow(chart);
          }
        });
      }
    }, [callback, onChartReady, safeReflow]);

    // ✅ Handle window resize with safety
    useEffect(() => {
      if (!chartInstance) return;

      const handleResize = () => {
        if (!isMounted.current) return;
        
        if (chartInstance && typeof chartInstance.reflow === 'function') {
          try {
            if (chartInstance.container && chartInstance.container.parentNode) {
              chartInstance.reflow();
            }
          } catch (error) {
            // Silent fail
          }
        }
      };

      // Use ResizeObserver for better performance
      let resizeObserver: ResizeObserver | null = null;
      
      if (typeof window !== 'undefined' && window.ResizeObserver && chartInstance.container) {
        try {
          resizeObserver = new ResizeObserver(() => {
            handleResize();
          });
          resizeObserver.observe(chartInstance.container);
        } catch (error) {
          // Fallback to window resize
          window.addEventListener('resize', handleResize);
        }
      } else {
        window.addEventListener('resize', handleResize);
      }

      return () => {
        if (resizeObserver && chartInstance.container) {
          try {
            resizeObserver.disconnect();
          } catch (error) {
            // Ignore
          }
        }
        window.removeEventListener('resize', handleResize);
      };
    }, [chartInstance]);

    // ✅ Handle options changes with safe reflow
    useEffect(() => {
      if (chartInstance) {
        // Update chart with new options if needed
        const timeoutId = setTimeout(() => {
          if (isMounted.current) {
            safeReflow(chartInstance);
          }
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    }, [options, chartInstance, safeReflow]);

    if (!isReady || !Highcharts) {
      return loadingComponent || <BackdropSpinner />;
    }

    return (
      <div className={className}>
        <HighchartsReact
          ref={chartRef}
          highcharts={Highcharts}
          options={options}
          constructorType={constructorType}
          callback={handleChartReady}
        />
      </div>
    );
  }
);

HighchartsWrapper.displayName = 'HighchartsWrapper';