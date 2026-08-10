'use client';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { faMoneyBill1 } from '@fortawesome/free-regular-svg-icons';
import {
  faCubes,
  faReceipt,
  faTableCells,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  AssessmentOutlined,
  BeachAccessOutlined,
  FeedOutlined,
  ListAltOutlined,
  Money,
  RequestQuoteOutlined,
  SummarizeOutlined,
  ViewTimelineOutlined,
} from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  Grid,
  LinearProgress,
  Typography,
  useMediaQuery,
} from '@mui/material';
import React, { lazy, useState } from 'react';
import DippingReport from '../fuelStation/reports/dippingReport/DippingReport';
import FuelVouchersReport from '../fuelStation/reports/FuelVouchersReport/FuelVouchersReport';
import StockMovement from '../procurement/stores/[store_id]/reports/stockMovement/StockMovement';
import ItemMovement from '../procurement/stores/[store_id]/storeStock/ItemMovement';
import StockReport from '../procurement/stores/[store_id]/storeStock/StockReport';

const DebtorCreditorReport = lazy(
  () => import('../accounts/reports/debtorCreditor/DebtorCreditorReport')
);
const CashierReport = lazy(
  () => import('../accounts/reports/cashierReport/CashierReport')
);
const SalesAndCashSummary = lazy(
  () => import('../pos/reports/salesAndCashSummary/SalesAndCashSummary')
);
const ProductsSelectProvider = lazy(
  () => import('../productAndServices/products/ProductsSelectProvider')
);
const StakeholderSelectProvider = lazy(
  () => import('../masters/stakeholders/StakeholderSelectProvider')
);
const SalesManifest = lazy(
  () => import('../pos/reports/salesManifest/SalesManifest')
);
const LedgerSelectProvider = lazy(
  () => import('../accounts/ledgers/forms/LedgerSelectProvider')
);
const LeaveBalancesReport = lazy(
  () => import('../humanResources/reports/leaveBalances/LeaveBalancesReport')
);
const StaffLoanReport = lazy(
  () => import('../humanResources/reports/staffLoans/StaffLoanReport')
);
const PayrollSalaryComponentsDashboard = lazy(
  () => import('../humanResources/payrollPeriods/PayrollSalaryComponents/PayrollSalaryComponentsDashboard')
);

function QuickReports() {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { checkOrganizationPermission, organizationHasSubscribed } =
    useJumboAuth();
  const [stockReportDialogOpen, setStockReportDialogOpen] = useState(false);
  const [itemMovementDialogOpen, setItemMovementDialogOpen] = useState(false);
  const [openCashierReport, setOpenCashierReport] = useState(false);
  const [stockMovementDialogOpen, setStockMovementDialogOpen] = useState(false);
  const [debtorsCreditorsDialogOpen, setDebtorsCreditorsDialogOpen] =
    useState(false);
  const [openSalesAndCashSummary, setOpenSalesAndCashSummary] = useState(false);
  const [openSalesManifest, setOpenSalesManifest] = useState(false);
  const [openDippingReport, setOpenDippingReport] = useState(false);
  const [fuelVouchersDialogOpen, setFuelVouchersDialogOpen] = useState(false);
  const [openLeaveBalancesReport, setOpenLeaveBalancesReport] = useState(false);
  const [openStaffLoanReport, setOpenStaffLoanReport] = useState(false);
  const [openPayrollComponentsSummary, setOpenPayrollComponentsSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const css = useProsERPStyles();

  const handleOpenDialog = (
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setIsLoading(true);
    setter(true);
    setTimeout(() => setIsLoading(false), 500); // Simulate loading time; adjust as needed
  };

  const handleCloseDialog = () => {
    setOpenDippingReport(false);
    setOpenSalesAndCashSummary(false);
    setDebtorsCreditorsDialogOpen(false);
    setOpenCashierReport(false);
    setStockReportDialogOpen(false);
    setItemMovementDialogOpen(false);
    setStockMovementDialogOpen(false);
    setOpenSalesManifest(false);
    setFuelVouchersDialogOpen(false);
    setOpenLeaveBalancesReport(false);
    setOpenStaffLoanReport(false);
    setOpenPayrollComponentsSummary(false);
  };

  return (
    <>
      <Dialog
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        maxWidth={
          stockMovementDialogOpen ||
          openDippingReport ||
          openSalesManifest ||
          openCashierReport ||
          openLeaveBalancesReport ||
          openStaffLoanReport ||
          openPayrollComponentsSummary
            ? 'lg'
            : fuelVouchersDialogOpen
              ? 'xl'
              : 'md'
        }
        fullScreen={belowLargeScreen}
        open={
          openCashierReport ||
          openSalesAndCashSummary ||
          debtorsCreditorsDialogOpen ||
          openDippingReport ||
          stockReportDialogOpen ||
          itemMovementDialogOpen ||
          stockMovementDialogOpen ||
          openSalesManifest ||
          fuelVouchersDialogOpen ||
          openLeaveBalancesReport ||
          openStaffLoanReport ||
          openPayrollComponentsSummary
        }
      >
        {openSalesAndCashSummary && (
          <SalesAndCashSummary
            setOpenSalesAndCashSummary={setOpenSalesAndCashSummary}
          />
        )}
        {debtorsCreditorsDialogOpen && (
          <DebtorCreditorReport
            setOpenDebtorsCreditorsDialog={setDebtorsCreditorsDialogOpen}
          />
        )}
        {openCashierReport && (
          <LedgerSelectProvider>
            <CashierReport setOpenCashierReport={setOpenCashierReport} />
          </LedgerSelectProvider>
        )}
        {stockReportDialogOpen && (
          <StockReport
            setOpenDialog={setStockReportDialogOpen}
            isFromDashboard={true}
          />
        )}
        {itemMovementDialogOpen && (
          <ProductsSelectProvider>
            <ItemMovement
              toggleOpen={setItemMovementDialogOpen}
              isFromDashboard={true}
            />
          </ProductsSelectProvider>
        )}
        {stockMovementDialogOpen && (
          <StockMovement
            toggleOpen={setStockMovementDialogOpen}
            isFromDashboard={true}
          />
        )}
        {openDippingReport && (
          <DippingReport closeDialog={setOpenDippingReport} />
        )}
        {openSalesManifest && (
          <StakeholderSelectProvider>
            <SalesManifest setOpenSalesManifest={setOpenSalesManifest} />
          </StakeholderSelectProvider>
        )}
        {fuelVouchersDialogOpen && (
          <StakeholderSelectProvider>
            <LedgerSelectProvider>
              <FuelVouchersReport
                closeDialog={() => setFuelVouchersDialogOpen(false)}
              />
            </LedgerSelectProvider>
          </StakeholderSelectProvider>
        )}
        {openLeaveBalancesReport && (
          <LeaveBalancesReport onClose={() => setOpenLeaveBalancesReport(false)} />
        )}
        {openStaffLoanReport && (
          <StaffLoanReport onClose={() => setOpenStaffLoanReport(false)} />
        )}
        {openPayrollComponentsSummary && (
          <PayrollSalaryComponentsDashboard onClose={() => setOpenPayrollComponentsSummary(false)} />
        )}

        {(debtorsCreditorsDialogOpen ||
          openDippingReport ||
          (fuelVouchersDialogOpen && !belowLargeScreen)) && (
          <DialogActions className={css.hiddenOnPrint}>
            <Button
              sx={{ m: 1 }}
              size='small'
              variant='outlined'
              onClick={handleCloseDialog}
            >
              Close
            </Button>
          </DialogActions>
        )}
      </Dialog>
      <JumboCardQuick title={'Quick Reports'}>
        {isLoading ? (
          <LinearProgress />
        ) : (
          <Grid
            container
            columnSpacing={1}
            rowSpacing={1}
            justifyContent={'center'}
          >
            {(organizationHasSubscribed(MODULES.FUEL_STATION) ||
              organizationHasSubscribed(MODULES.POINT_OF_SALE)) &&
              checkOrganizationPermission(PERMISSIONS.SALES_REPORTS) && (
                <Grid
                  size={{ xs: 6, md: 2, lg: 1.5 }}
                  p={1}
                  textAlign={'center'}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleOpenDialog(setOpenSalesAndCashSummary)}
                >
                  <SummarizeOutlined sx={{ fontSize: '40px' }} />
                  <Typography>Sales & Cash Summary</Typography>
                </Grid>
              )}
            {organizationHasSubscribed(MODULES.POINT_OF_SALE) &&
              checkOrganizationPermission(PERMISSIONS.SALES_REPORTS) && (
                <Grid
                  size={{ xs: 6, md: 2, lg: 1.5 }}
                  p={1}
                  textAlign={'center'}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleOpenDialog(setOpenSalesManifest)}
                >
                  <ListAltOutlined sx={{ fontSize: '40px' }} />
                  <Typography>Sales Manifest</Typography>
                </Grid>
              )}

            {organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE) &&
              checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS) && (
                <Grid
                  size={{ xs: 6, md: 2, lg: 1.5 }}
                  p={1}
                  textAlign={'center'}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleOpenDialog(setOpenCashierReport)}
                >
                  <FontAwesomeIcon
                    size='lg'
                    icon={faMoneyBill1}
                    style={{ fontSize: '48px' }}
                  />
                  <Typography>Cashier Report</Typography>
                </Grid>
              )}
            {organizationHasSubscribed(MODULES.FUEL_STATION) && (
              <Grid
                size={{ xs: 6, md: 2, lg: 1.5 }}
                p={1}
                textAlign={'center'}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={() => handleOpenDialog(setOpenDippingReport)}
              >
                <FontAwesomeIcon
                  size='lg'
                  icon={faTableCells}
                  style={{ fontSize: '48px' }}
                />
                <Typography>Dipping Report</Typography>
              </Grid>
            )}
            {organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) &&
              checkOrganizationPermission(PERMISSIONS.STORES_REPORTS) && (
                <Grid
                  size={{ xs: 6, md: 2, lg: 1.5 }}
                  p={1}
                  textAlign={'center'}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleOpenDialog(setStockReportDialogOpen)}
                >
                  <FontAwesomeIcon
                    size='lg'
                    icon={faCubes}
                    style={{ fontSize: '48px' }}
                  />
                  <Typography>Stock Report</Typography>
                </Grid>
              )}

            {organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) &&
              checkOrganizationPermission(PERMISSIONS.STORES_REPORTS) && (
                <Grid
                  size={{ xs: 6, md: 2, lg: 1.5 }}
                  p={1}
                  textAlign={'center'}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleOpenDialog(setItemMovementDialogOpen)}
                >
                  <ViewTimelineOutlined sx={{ fontSize: '40px' }} />
                  <Typography>Item Movement</Typography>
                </Grid>
              )}
            {organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) &&
              checkOrganizationPermission(PERMISSIONS.STORES_REPORTS) && (
                <Grid
                  size={{ xs: 6, md: 2, lg: 1.5 }}
                  p={1}
                  textAlign={'center'}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleOpenDialog(setStockMovementDialogOpen)}
                >
                  <FeedOutlined sx={{ fontSize: '40px' }} />
                  <Typography>Stock Movement</Typography>
                </Grid>
              )}
            {organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE) &&
              checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS) && (
                <Grid
                  size={{ xs: 6, md: 2, lg: 1.5 }}
                  p={1}
                  textAlign={'center'}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() =>
                    handleOpenDialog(setDebtorsCreditorsDialogOpen)
                  }
                >
                  <Money sx={{ fontSize: '40px' }} />
                  <Typography>Debtors & Creditors</Typography>
                </Grid>
              )}
            {organizationHasSubscribed(MODULES.FUEL_STATION) && (
              <Grid
                size={{ xs: 6, md: 2, lg: 1.5 }}
                p={1}
                textAlign={'center'}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={() => handleOpenDialog(setFuelVouchersDialogOpen)}
              >
                <FontAwesomeIcon
                  size='lg'
                  icon={faReceipt}
                  style={{ fontSize: '48px' }}
                />
                <Typography>FV Report</Typography>
              </Grid>
            )}
            {organizationHasSubscribed(MODULES.HUMAN_RESOURCES) &&
              checkOrganizationPermission(PERMISSIONS.PAYROLL_READ) && (
                <Grid
                  size={{ xs: 6, md: 2, lg: 1.5 }}
                  p={1}
                  textAlign={'center'}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleOpenDialog(setOpenPayrollComponentsSummary)}
                >
                  <AssessmentOutlined sx={{ fontSize: '40px' }} />
                  <Typography>Payroll Components Summary</Typography>
                </Grid>
              )}
            {organizationHasSubscribed(MODULES.HUMAN_RESOURCES) &&
              checkOrganizationPermission(PERMISSIONS.LEAVE_ALLOCATIONS_READ) && (
                <Grid
                  size={{ xs: 6, md: 2, lg: 1.5 }}
                  p={1}
                  textAlign={'center'}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleOpenDialog(setOpenLeaveBalancesReport)}
                >
                  <BeachAccessOutlined sx={{ fontSize: '40px' }} />
                  <Typography>Leave Balances</Typography>
                </Grid>
              )}
            {organizationHasSubscribed(MODULES.HUMAN_RESOURCES) &&
              checkOrganizationPermission(PERMISSIONS.LOANS_READ) && (
                <Grid
                  size={{ xs: 6, md: 2, lg: 1.5 }}
                  p={1}
                  textAlign={'center'}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleOpenDialog(setOpenStaffLoanReport)}
                >
                  <RequestQuoteOutlined sx={{ fontSize: '40px' }} />
                  <Typography>Staff Loans</Typography>
                </Grid>
              )}
          </Grid>
        )}
      </JumboCardQuick>
    </>
  );
}

export default QuickReports;
