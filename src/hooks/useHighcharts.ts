'use client';

import { useEffect, useState } from 'react';

interface HighchartsHookReturn {
  Highcharts: any;
  isReady: boolean;
}

export function useHighcharts(): HighchartsHookReturn {
  const [Highcharts, setHighcharts] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadHighcharts = async () => {
      try {
        // ✅ Import Highcharts core
        const highchartsModule = await import('highcharts');
        const Hc = highchartsModule.default || highchartsModule;
        
        if (typeof window !== 'undefined') {
          (window as any).Highcharts = Hc;
        }

        // ✅ Import modules with proper error handling
        const modules = await Promise.all([
          import('highcharts/modules/treemap'),
          import('highcharts/modules/treegraph'),
          import('highcharts/modules/exporting'),
          import('highcharts/modules/export-data'),
          import('highcharts/modules/offline-exporting')
        ]);

        // ✅ Fix: Check module type before calling
        modules.forEach((module) => {
          if (module && typeof module === 'object') {
            // Try to get the default export or the module itself
            const initFn = (module as any).default || module;
            if (typeof initFn === 'function') {
              initFn(Hc);
            }
          }
        });

        if (mounted) {
          setHighcharts(Hc);
          setIsReady(true);
        }
      } catch (error) {
        console.error('Failed to load Highcharts:', error);
        if (mounted) {
          setIsReady(true);
        }
      }
    };

    // ✅ Only run on client side
    if (typeof window !== 'undefined') {
      loadHighcharts();
    }

    return () => {
      mounted = false;
    };
  }, []);

  return { Highcharts, isReady };
}