'use client';

import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { faMoneyBill1 } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  BalanceOutlined,
  DeckOutlined,
  Money,
  QueryStatsOutlined,
  ReceiptLongOutlined,
  ViewTimelineOutlined,
} from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  Grid,
  Typography,
  useMediaQuery,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import LedgerSelectProvider from '../ledgers/forms/LedgerSelectProvider';
import BalanceSheet from './balance sheet/BalanceSheet';
import CashierReport from './cashierReport/CashierReport';
import DebtorCreditorReport from './debtorCreditor/DebtorCreditorReport';
import ApArAgingReport from './agingReport/ApArAgingReport';
import IncomeStatement from './incomeStatement/IncomeStatement';
import TrialBalance from './trial balance/TrialBalance';
import XReport from './zReport/ZReport';

function AccountsReports() {
  const searchParams = useSearchParams();
  const css = useProsERPStyles();
  const [openDialog, setOpenDialog] = useState(false);
  const [openBalanceSheet, setOpenBalanceSheet] = useState(false);
  const [openCashierReport, setOpenCashierReport] = useState(false);
  const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
  const [openTrialBalance, setOpenTrialBalance] = useState(false);
  const [openIncomeStatement, setOpenIncomeStatement] = useState(false);

  const [report, setReport] = useState(null);
  const {
    checkOrganizationPermission,
    authOrganization,
    organizationHasSubscribed,
  } = useJumboAuth();

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-open report dialog if ?report= param is present
  useEffect(() => {
    if (!mounted) return;
    const reportParam = searchParams.get('report');
    if (!reportParam) return;
    if (reportParam === 'trial-balance') {
      setReport(<TrialBalance setOpenTrialBalanceDialog={setOpenTrialBalance} />);
      setOpenTrialBalance(true);
    } else if (reportParam === 'income-statement') {
      setReport(<IncomeStatement setOpenIncomeStatementDialog={setOpenIncomeStatement} />);
      setOpenIncomeStatement(true);
    } else if (reportParam === 'cashier-report') {
      setReport(<CashierReport setOpenCashierReport={setOpenCashierReport} />);
      setOpenCashierReport(true);
    } else if (reportParam === 'balance-sheet') {
      setReport(<BalanceSheet setOpenBalanceSheettDialog={setOpenBalanceSheet} />);
      setOpenBalanceSheet(true);
    } else if (reportParam === 'debtors-creditors') {
      setReport(<DebtorCreditorReport setOpenDebtorsCreditorsDialog={setOpenDialog} />);
      setOpenDialog(true);
    } else if (reportParam === 'ap-ar-aging') {
      setReport(<ApArAgingReport setOpenDialog={setOpenDialog} />);
      setOpenDialog(true);
    } else if (reportParam === 'z-report') {
      setReport(<XReport />);
      setOpenReceiptDialog(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, searchParams]);

  if (!mounted) return null;

  if (!organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE)) {
    return <UnsubscribedAccess modules={'Accounts & Finance'} />;
  }

  if (!checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS)) {
    return <UnauthorizedAccess />;
  }
  return (
    <React.Fragment>
      <LedgerSelectProvider>
        <Dialog
          scroll={belowLargeScreen ? 'body' : 'paper'}
          fullWidth
          maxWidth={
            openCashierReport ||
            openIncomeStatement ||
            openDialog ||
            openTrialBalance
              ? 'lg'
              : 'md'
          }
          fullScreen={
            (openBalanceSheet ||
              openCashierReport ||
              openIncomeStatement ||
              openDialog ||
              openTrialBalance) &&
            belowLargeScreen
          }
          open={
            openDialog ||
            openReceiptDialog ||
            openBalanceSheet ||
            openCashierReport ||
            openTrialBalance ||
            openIncomeStatement
          }
        >
          {report}
          {!openCashierReport &&
            <DialogActions className={css.hiddenOnPrint}>
              {!belowLargeScreen && (
                <Button
                  sx={{ m: 1 }}
                  size='small'
                  variant='outlined'
                  onClick={() => {
                    setOpenDialog(false);
                    setOpenReceiptDialog(false);
                    setOpenBalanceSheet(false);
                    setOpenTrialBalance(false);
                    setOpenCashierReport(false);
                    setOpenIncomeStatement(false);
                  }}
                >
                  Close
                </Button>
              )}
            </DialogActions>
          }
        </Dialog>
        <Typography variant={'h4'} mb={2}>
          Financial Reports
        </Typography>
        <JumboCardQuick sx={{ height: '100%' }}>
          <Grid container textAlign={'center'} columnSpacing={2} rowSpacing={2}>
            <Grid
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              size={{ xs: 6, md: 3, lg: 2 }}
              p={1}
              textAlign={'center'}
              onClick={() => {
                setReport(
                  <CashierReport setOpenCashierReport={setOpenCashierReport} />
                );
                setOpenCashierReport(true);
              }}
            >
              <FontAwesomeIcon
                size='lg'
                icon={faMoneyBill1}
                style={{ fontSize: '48px' }}
              />
              <Typography>Cashier Report</Typography>
            </Grid>
            <Grid
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              size={{ xs: 6, md: 3, lg: 2 }}
              p={1}
              textAlign={'center'}
              onClick={() => {
                setReport(
                  <IncomeStatement
                    setOpenIncomeStatementDialog={setOpenIncomeStatement}
                  />
                );
                setOpenIncomeStatement(true);
              }}
            >
              <ViewTimelineOutlined sx={{ fontSize: '40px' }} />
              <Typography>Income Statement</Typography>
            </Grid>
            <Grid
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              size={{ xs: 6, md: 3, lg: 2 }}
              p={1}
              textAlign={'center'}
              onClick={() => {
                setReport(
                  <TrialBalance
                    setOpenTrialBalanceDialog={setOpenTrialBalance}
                  />
                );
                setOpenTrialBalance(true);
              }}
            >
              <DeckOutlined sx={{ fontSize: '40px' }} />
              <Typography>Trial Balance</Typography>
            </Grid>
            <Grid
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              size={{ xs: 6, md: 3, lg: 2 }}
              p={1}
              textAlign={'center'}
              onClick={() => {
                setReport(
                  <BalanceSheet
                    setOpenBalanceSheettDialog={setOpenBalanceSheet}
                  />
                );
                setOpenBalanceSheet(true);
              }}
            >
              <BalanceOutlined sx={{ fontSize: '40px' }} />
              <Typography>Balance Sheet</Typography>
            </Grid>
            {authOrganization?.organization?.tra_serial_number && (
              <React.Fragment>
                <Grid
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  size={{ xs: 6, md: 3, lg: 2 }}
                  p={1}
                  textAlign={'center'}
                  onClick={() => {
                    setReport(<XReport />);
                    setOpenReceiptDialog(true);
                  }}
                >
                  <ReceiptLongOutlined sx={{ fontSize: '40px' }} />
                  <Typography>Z Report</Typography>
                </Grid>
              </React.Fragment>
            )}
            <Grid
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              size={{ xs: 6, md: 3, lg: 2 }}
              p={1}
              textAlign={'center'}
              onClick={() => {
                setReport(
                  <DebtorCreditorReport
                    setOpenDebtorsCreditorsDialog={setOpenDialog}
                  />
                );
                setOpenDialog(true);
              }}
            >
              <Money sx={{ fontSize: '40px' }} />
              <Typography>Debtors & Creditors</Typography>
            </Grid>
            <Grid
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              size={{ xs: 6, md: 3, lg: 2 }}
              p={1}
              textAlign={'center'}
              onClick={() => {
                setReport(<ApArAgingReport setOpenDialog={setOpenDialog} />);
                setOpenDialog(true);
              }}
            >
              <QueryStatsOutlined sx={{ fontSize: '40px' }} />
              <Typography>A/P &amp; A/R Aging</Typography>
            </Grid>
          </Grid>
        </JumboCardQuick>
      </LedgerSelectProvider>
    </React.Fragment>
  );
}

export default AccountsReports;
