'use client';

import useProsERPStyles from '@/app/helpers/style-helpers';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import {
  faReceipt,
  faTableCells,
  faChartColumn,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  Button,
  Dialog,
  DialogActions,
  Grid,
  Typography,
  useMediaQuery,
} from '@mui/material';
import React, { ReactNode, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DippingReport from './dippingReport/DippingReport';
import FuelVouchersReport from './FuelVouchersReport/FuelVouchersReport';
import StockSalesSummaryReport from './stockSalesSummaryReport/StockSalesSummaryReport';

interface ReportProps {
  closeDialog: () => void;
}
const FuelStationReports: React.FC = () => {
  const searchParams = useSearchParams();
  const css = useProsERPStyles();

  const [openReportDialog, setOpenReportDialog] = useState<boolean>(false);
  const [report, setReport] = useState<ReactNode | null>(null);
  const [mounted, setMounted] = useState(false);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const openReport = (Component: React.ComponentType<ReportProps>) => {
    setReport(<Component closeDialog={() => setOpenReportDialog(false)} />);
    setOpenReportDialog(true);
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-open report dialog if ?report= param is present
  React.useEffect(() => {
    if (!mounted) return;
    const reportParam = searchParams.get('report');
    if (!reportParam) return;
    if (reportParam === 'dipping-report') {
      openReport(DippingReport);
    } else if (reportParam === 'fv-report') {
      openReport(FuelVouchersReport);
    } else if (reportParam === 'stock-sales-summary-report') {
      openReport(StockSalesSummaryReport);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, searchParams]);

  return (
    <StakeholderSelectProvider>
      <LedgerSelectProvider>
        <Typography variant='h4' mb={2}>
          Fuel Station Reports
        </Typography>

        <Dialog
          scroll={belowLargeScreen ? 'body' : 'paper'}
          fullScreen={belowLargeScreen}
          fullWidth
          maxWidth='xl'
          open={openReportDialog}
          onClose={() => setOpenReportDialog(false)}
        >
          {report}
          <DialogActions className={css.hiddenOnPrint}>
            {!belowLargeScreen && (
              <Button
                sx={{ m: 1 }}
                size='small'
                variant='outlined'
                onClick={() => setOpenReportDialog(false)}
              >
                Close
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <JumboCardQuick sx={{ height: '100%' }}>
          <Grid container textAlign='center' columnSpacing={2} rowSpacing={2}>
            {/* Dipping Report */}
            <Grid
              sx={{
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              size={{ xs: 6, md: 3, lg: 2 }}
              p={2}
              onClick={() => openReport(DippingReport)}
            >
              <FontAwesomeIcon
                size='lg'
                icon={faTableCells}
                style={{ fontSize: '48px' }}
              />
              <Typography mt={1}>Dipping Report</Typography>
            </Grid>

            {/* Fuel Vouchers Report */}
            <Grid
              sx={{
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              size={{ xs: 6, md: 3, lg: 2 }}
              p={2}
              onClick={() => openReport(FuelVouchersReport)}
            >
              <FontAwesomeIcon
                size='lg'
                icon={faReceipt}
                style={{ fontSize: '48px' }}
              />
              <Typography mt={1}>FV Report</Typography>
            </Grid>

            {/* Fuel Stock & Sales Summary Report */}
            <Grid
              sx={{
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              size={{ xs: 6, md: 3, lg: 2 }}
              p={2}
              onClick={() => openReport(StockSalesSummaryReport)}
            >
              <FontAwesomeIcon
                size='lg'
                icon={faChartColumn}
                style={{ fontSize: '48px' }}
              />
              <Typography mt={1}>Fuel Stock & Sales Summary</Typography>
            </Grid>
          </Grid>
        </JumboCardQuick>
      </LedgerSelectProvider>
    </StakeholderSelectProvider>
  );
};

export default FuelStationReports;
