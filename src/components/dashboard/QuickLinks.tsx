import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import {
  AssessmentOutlined,
  AutoStoriesOutlined,
  CalendarMonthOutlined,
  FormatListNumberedRtl,
  Inventory2Outlined,
  ListOutlined,
  LocalGasStation,
  PeopleAltOutlined,
  PointOfSaleOutlined,
  QrCode2Rounded,
  QrCodeOutlined,
  ReceiptOutlined,
  ShoppingCartOutlined,
} from '@mui/icons-material';
import { Grid, Skeleton, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DashboardQuickLink from '../procurement/reports/productInsights/DashboardQuickLink';

function QuickLinks() {
  const router = useRouter();
  const lang = useLanguage();
  const { checkOrganizationPermission, organizationHasSubscribed } =
    useJumboAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigation = (path: string) => {
    setIsLoading(true);
    router.push(`/${lang}${path}`);
    setTimeout(() => setIsLoading(false), 500); // Simulate loading time; adjust as needed
  };

  return (
    <JumboCardQuick title={'Quick Links'}>
      {isLoading && (
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
      )}
      <Grid
        container
        columnSpacing={1}
        rowSpacing={1}
        justifyContent={'center'}
      >
        {organizationHasSubscribed(MODULES.PROJECT_MANAGEMENT) &&
          checkOrganizationPermission([
            PERMISSIONS.PROJECTS_READ,
            PERMISSIONS.PROJECTS_CREATE,
            PERMISSIONS.PROJECTS_EDIT,
            PERMISSIONS.PROJECTS_DELETE,
          ]) && (
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
              onClick={() => handleNavigation('/projectManagement/projects')}
            >
              <ListOutlined sx={{ fontSize: '40px' }} />
              <Typography>Projects</Typography>
            </Grid>
          )}
        {organizationHasSubscribed(MODULES.MANUFACTURING_AND_PROCESSING) &&
          checkOrganizationPermission([
            PERMISSIONS.BOM_READ,
            PERMISSIONS.BOM_CREATE,
            PERMISSIONS.BOM_EDIT,
            PERMISSIONS.BOM_DELETE,
            PERMISSIONS.PRODUCTION_BATCHES_CREATE,
            PERMISSIONS.PRODUCTION_BATCHES_READ,
            PERMISSIONS.PRODUCTION_BATCHES_EDIT,
            PERMISSIONS.PRODUCTION_BATCHES_DELETE,
            PERMISSIONS.MANUFACTURING_ORDERS_CREATE,
            PERMISSIONS.MANUFACTURING_ORDERS_READ,
            PERMISSIONS.MANUFACTURING_ORDERS_EDIT,
            PERMISSIONS.MANUFACTURING_ORDERS_DELETE,
          ]) && (
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
              onClick={() => handleNavigation('/manufacturing/batches')}
            >
              <QrCodeOutlined sx={{ fontSize: '40px' }} />
              <Typography>Batches</Typography>
            </Grid>
          )}
        {organizationHasSubscribed(MODULES.FUEL_STATION) &&
          checkOrganizationPermission([
            PERMISSIONS.FUEL_SALES_SHIFTS_READ,
            PERMISSIONS.FUEL_SALES_SHIFTS_CREATE,
            PERMISSIONS.FUEL_SALES_SHIFTS_UPDATE,
            PERMISSIONS.FUEL_SALES_SHIFTS_DELETE,
            PERMISSIONS.FUEL_SALES_SHIFTS_CLOSE,
          ]) && (
            <Grid
              size={{ xs: 6, md: 2, lg: 1 }}
              p={1}
              textAlign={'center'}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => handleNavigation('/fuelStations/salesShifts')}
            >
              <LocalGasStation sx={{ fontSize: '40px' }} />
              <Typography>Sales Shift</Typography>
            </Grid>
          )}
        {organizationHasSubscribed(MODULES.POINT_OF_SALE) &&
          checkOrganizationPermission([
            PERMISSIONS.SALES_READ,
            PERMISSIONS.SALES_CREATE,
            PERMISSIONS.SALES_EDIT,
            PERMISSIONS.SALES_COMPLETE,
          ]) && (
            <Grid
              size={{ xs: 6, md: 2, lg: 1 }}
              p={1}
              textAlign={'center'}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => handleNavigation('/pos/sales-counters')}
            >
              <PointOfSaleOutlined sx={{ fontSize: '40px' }} />
              <Typography>Sales</Typography>
            </Grid>
          )}
        {organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) &&
          checkOrganizationPermission([
            PERMISSIONS.PURCHASES_READ,
            PERMISSIONS.PURCHASES_CREATE,
            PERMISSIONS.PURCHASES_RECEIVE,
          ]) && (
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
              onClick={() => handleNavigation('/procurement/purchases')}
            >
              <ShoppingCartOutlined sx={{ fontSize: '40px' }} />
              <Typography>Purchases</Typography>
            </Grid>
          )}
        {organizationHasSubscribed(MODULES.PROCESS_APPROVAL) &&
          checkOrganizationPermission([
            PERMISSIONS.REQUISITIONS_READ,
            PERMISSIONS.REQUISITIONS_CREATE,
            PERMISSIONS.REQUISITIONS_EDIT,
          ]) && (
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
              onClick={() => handleNavigation('/requisitions')}
            >
              <FormatListNumberedRtl sx={{ fontSize: '40px' }} />
              <Typography>Requisitions</Typography>
            </Grid>
          )}
        {organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE) &&
          checkOrganizationPermission([
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
            PERMISSIONS.PAYMENTS_READ,
            PERMISSIONS.PAYMENTS_CREATE,
            PERMISSIONS.PAYMENTS_EDIT,
            PERMISSIONS.PAYMENTS_DELETE,
            PERMISSIONS.FUND_TRANSFERS_READ,
            PERMISSIONS.FUND_TRANSFERS_CREATE,
            PERMISSIONS.FUND_TRANSFERS_DELETE,
            PERMISSIONS.FUND_TRANSFERS_EDIT,
            PERMISSIONS.RECEIPTS_READ,
            PERMISSIONS.RECEIPTS_EDIT,
            PERMISSIONS.RECEIPTS_CREATE,
            PERMISSIONS.RECEIPTS_DELETE,
            PERMISSIONS.JOURNAL_VOUCHERS_READ,
            PERMISSIONS.JOURNAL_VOUCHERS_CREATE,
            PERMISSIONS.JOURNAL_VOUCHERS_DELETE,
            PERMISSIONS.JOURNAL_VOUCHERS_EDIT,
          ]) && (
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
              onClick={() => handleNavigation('/accounts/transactions')}
            >
              <ReceiptOutlined sx={{ fontSize: '40px' }} />
              <Typography>Transactions</Typography>
            </Grid>
          )}
        {organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE) &&
          checkOrganizationPermission(PERMISSIONS.ACCOUNTS_MASTERS_READ) && (
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
              onClick={() => handleNavigation('/accounts/ledgers')}
            >
              <AutoStoriesOutlined sx={{ fontSize: '40px' }} />
              <Typography>Ledgers</Typography>
            </Grid>
          )}
        {organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) &&
          checkOrganizationPermission([
            PERMISSIONS.STORES_READ,
            PERMISSIONS.STORES_CREATE,
            PERMISSIONS.INVENTORY_TRANSFERS_READ,
            PERMISSIONS.INVENTORY_TRANSFERS_CREATE,
            PERMISSIONS.INVENTORY_CONSUMPTIONS_READ,
            PERMISSIONS.INVENTORY_CONSUMPTIONS_CREATE,
          ]) && (
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
              onClick={() => handleNavigation('/procurement/stores')}
            >
              <Inventory2Outlined sx={{ fontSize: '40px' }} />
              <Typography>Stores</Typography>
            </Grid>
          )}
        {organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) &&
          checkOrganizationPermission(
            [
              PERMISSIONS.STORES_REPORTS,
              PERMISSIONS.PURCHASES_REPORTS,
              PERMISSIONS.ACCOUNTS_REPORTS,
            ],
            true
          ) && (
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
            >
              <DashboardQuickLink />
            </Grid>
          )}
        {organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) &&
          checkOrganizationPermission([
            PERMISSIONS.PRODUCTS_READ,
            PERMISSIONS.PRODUCTS_CREATE,
            PERMISSIONS.PRODUCTS_EDIT,
          ]) && (
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
              onClick={() => handleNavigation('/procurement/products')}
            >
              <QrCode2Rounded sx={{ fontSize: '40px' }} />
              <Typography>Products</Typography>
            </Grid>
          )}
        {organizationHasSubscribed(MODULES.HUMAN_RESOURCES) && (
          <>
            {checkOrganizationPermission([
              PERMISSIONS.EMPLOYEES_READ,
              PERMISSIONS.EMPLOYEES_CREATE,
              PERMISSIONS.EMPLOYEES_UPDATE,
            ]) && (
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
                onClick={() => handleNavigation('/humanResources/employees')}
              >
                <PeopleAltOutlined sx={{ fontSize: '40px' }} />
                <Typography>Employees</Typography>
              </Grid>
            )}

            {checkOrganizationPermission([
              PERMISSIONS.PAYROLLRUNS_CREATE,
              PERMISSIONS.PAYROLL_READ,
            ]) && (
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
                onClick={() => handleNavigation('/humanResources/payroll-runs')}
              >
                <AssessmentOutlined sx={{ fontSize: '40px' }} />
                <Typography>Payroll Runs</Typography>
              </Grid>
            )}
          </>
        )}
        {organizationHasSubscribed(MODULES.ASSET_BOOKINGS) &&
          checkOrganizationPermission([PERMISSIONS.ASSET_BOOKINGS_READ]) && (
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
              onClick={() => handleNavigation('/asset-bookings')}
            >
              <CalendarMonthOutlined sx={{ fontSize: '40px' }} />
              <Typography>Asset Bookings</Typography>
            </Grid>
          )}
      </Grid>
    </JumboCardQuick>
  );
}

export default QuickLinks;
