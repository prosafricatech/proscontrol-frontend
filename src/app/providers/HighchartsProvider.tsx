// app/providers/HighchartsProvider.tsx

'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface HighchartsContextType {
  Highcharts: any;
  isReady: boolean;
}

const HighchartsContext = createContext<HighchartsContextType>({
  Highcharts: null,
  isReady: false,
});

export const useHighcharts = () => useContext(HighchartsContext);

export function HighchartsProvider({ children }: { children: React.ReactNode }) {
  const [Highcharts, setHighcharts] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initHighcharts = async () => {
      try {
        // Import Highcharts core
        const highchartsModule = await import('highcharts');
        const Hc = highchartsModule.default || highchartsModule;
        
        // Set on window
        if (typeof window !== 'undefined') {
          (window as any).Highcharts = Hc;
          (window as any)._Highcharts = Hc;
        }

        // ✅ Import accessibility module with type assertion
        const accessibilityModule = await import('highcharts/modules/accessibility');
        // ✅ Use type assertion to avoid 'never' type error
        const accessibilityInit = (accessibilityModule as any).default || accessibilityModule;
        if (typeof accessibilityInit === 'function') {
          accessibilityInit(Hc);
        }

        // treegraph extends the treemap series type at import time, so treemap
        // must finish registering before treegraph is imported. Loading them via
        // Promise.all races the two and leaves treegraph reading `undefined.prototype`.
        const moduleImports = [
          await (import('highcharts/modules/treemap') as Promise<any>),
          await (import('highcharts/modules/treegraph') as Promise<any>),
          await (import('highcharts/modules/exporting') as Promise<any>),
          await (import('highcharts/modules/export-data') as Promise<any>),
          await (import('highcharts/modules/offline-exporting') as Promise<any>),
        ];

        moduleImports.forEach((module) => {
          // ✅ Use type assertion for each module
          const initFn = (module as any).default || module;
          if (typeof initFn === 'function') {
            initFn(Hc);
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

    if (typeof window !== 'undefined') {
      initHighcharts();
    }

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <HighchartsContext.Provider value={{ Highcharts, isReady }}>
      {children}
    </HighchartsContext.Provider>
  );
}