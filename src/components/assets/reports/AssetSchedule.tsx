'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { DownloadOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Card,
  Checkbox,
  FormControlLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import dayjs from 'dayjs';
import assetReportsServices from './assetReports-services';

const fmt = (amount: number) =>
  (amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const AssetSchedule = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { organizationHasSubscribed, checkOrganizationPermission } = useJumboAuth();
  const dictionary = useDictionary();

  const [from, setFrom] = useState(dayjs().startOf('year').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [detailed, setDetailed] = useState(false);
  const [report, setReport] = useState<any>(null);

  const runReport = useMutation({
    mutationFn: () => assetReportsServices.getSchedule({ from, to, detailed }),
    onSuccess: (data: any) => setReport(data),
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const downloadExcel = useMutation({
    mutationFn: () => assetReportsServices.downloadScheduleExcel({ from, to }),
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'Fixed Asset Schedule.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  if (!organizationHasSubscribed(MODULES.ASSET_REGISTER)) {
    return <UnsubscribedAccess modules={'Asset Register'} />;
  }

  if (!checkOrganizationPermission([PERMISSIONS.ASSETS_READ])) {
    return <UnauthorizedAccess />;
  }

  const labels = dictionary.reports.schedule.labels;

  return (
    <>
      <Typography variant={'h4'} mb={2}>{dictionary.reports.schedule.title}</Typography>
      <Card sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" mb={2}>
          <TextField
            type="date"
            size="small"
            label={labels.from}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            size="small"
            label={labels.to}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={<Checkbox checked={detailed} onChange={(e) => setDetailed(e.target.checked)} />}
            label={labels.showDetails}
          />
          <LoadingButton variant="contained" loading={runReport.isPending} onClick={() => runReport.mutate()}>
            {dictionary.reports.schedule.buttons.run}
          </LoadingButton>
          <LoadingButton
            variant="outlined"
            startIcon={<DownloadOutlined />}
            loading={downloadExcel.isPending}
            onClick={() => downloadExcel.mutate()}
          >
            {dictionary.reports.schedule.buttons.downloadExcel}
          </LoadingButton>
        </Stack>

        {report && (
          <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{labels.category}</TableCell>
                <TableCell align="right">{labels.costBf}</TableCell>
                <TableCell align="right">{labels.additions}</TableCell>
                <TableCell align="right">{labels.disposalsCost}</TableCell>
                <TableCell align="right">{labels.costCf}</TableCell>
                <TableCell align="right">{labels.depBf}</TableCell>
                <TableCell align="right">{labels.depCharge}</TableCell>
                <TableCell align="right">{labels.depReleased}</TableCell>
                <TableCell align="right">{labels.depCf}</TableCell>
                <TableCell align="right">{labels.nbvCf}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.categories.map((category: any) => (
                <React.Fragment key={category.category_name}>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{category.category_name} ({category.assets_count})</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(category.cost_bf)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(category.additions)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(category.disposals_cost)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(category.cost_cf)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(category.dep_bf)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(category.dep_charge)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(category.dep_released)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(category.dep_cf)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(category.nbv_cf)}</TableCell>
                  </TableRow>
                  {category.assets?.map((asset: any) => (
                    <TableRow key={asset.code}>
                      <TableCell sx={{ pl: 4 }}>
                        <Typography variant="body2">{asset.code} {asset.asset_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{asset.identification}</Typography>
                      </TableCell>
                      <TableCell align="right">{fmt(asset.cost_bf)}</TableCell>
                      <TableCell align="right">{fmt(asset.additions)}</TableCell>
                      <TableCell align="right">{fmt(asset.disposals_cost)}</TableCell>
                      <TableCell align="right">{fmt(asset.cost_cf)}</TableCell>
                      <TableCell align="right">{fmt(asset.dep_bf)}</TableCell>
                      <TableCell align="right">{fmt(asset.dep_charge)}</TableCell>
                      <TableCell align="right">{fmt(asset.dep_released)}</TableCell>
                      <TableCell align="right">{fmt(asset.dep_cf)}</TableCell>
                      <TableCell align="right">{fmt(asset.nbv_cf)}</TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
              <TableRow>
                <TableCell sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>{labels.total}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>{fmt(report.totals.cost_bf)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>{fmt(report.totals.additions)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>{fmt(report.totals.disposals_cost)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>{fmt(report.totals.cost_cf)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>{fmt(report.totals.dep_bf)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>{fmt(report.totals.dep_charge)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>{fmt(report.totals.dep_released)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>{fmt(report.totals.dep_cf)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>{fmt(report.totals.nbv_cf)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          </TableContainer>
        )}
      </Card>
    </>
  );
};

export default AssetSchedule;
