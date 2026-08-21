import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  useTheme,
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Organization } from '@/types/auth-types';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';

interface Task {
  id?: string | number;
  name?: string;
  quantity?: number;
}

interface CertifiedItem {
  task?: Task;
  rate?: number;
  measurement_unit?: MeasurementUnit;
  certified_quantity?: number;
  previous_certified_quantity?: number;
}

interface ComplementLedger {
  name?: string;
}

interface Adjustment {
  id?: string | number;
  description: string;
  type: 'addition' | 'deduction';
  amount: number | string;
  complement_ledger?: ComplementLedger;
}

interface Creator {
  name?: string;
}

interface Certificate {
  certificateNo: string;
  certificate_date: string;
  remarks?: string | null;
  currency?: Currency;
  subcontractor?: {
    name?: string;
  };
  creator?: Creator;
  amount?: number | string;
  vat_percentage?: number;
  items: CertifiedItem[];
  adjustments?: Adjustment[];
}

interface CertificateOnScreenProps {
  certificate: Certificate;
  organization: Organization;
}

interface CertificateOnScreenProps {
  certificate: Certificate;
  organization: Organization;
  isFromProcessApproval?: boolean;
}

const CertificateOnScreen: React.FC<CertificateOnScreenProps> = ({ certificate, organization, isFromProcessApproval = false }) => {
  const theme = useTheme();
  const isDark = theme.type === 'dark';

  const mainColor = organization.settings?.main_color || '#2113AD';
  const headerColor = isDark ? '#29f096' : mainColor;
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';
  const currencyCode = certificate.currency?.code || 'TZS';

  // ==================== Summary Section ====================
  const grossAmount = Number(certificate.amount) || 0;
  const vatPercentage = certificate.vat_percentage || 0;
  const vatAmount = grossAmount * (vatPercentage / 100);

  const summaryItems = [
    {
      id: 'gross',
      particular: 'Gross Amount Certified',
      amount: grossAmount,
      complement_ledger: null,
      type: null as 'addition' | 'deduction' | null,
    },
    ...(certificate.adjustments || []).map((adj) => ({
      id: adj.id ?? `adj-${Math.random()}`,
      particular: adj.description,
      complement_ledger: adj.complement_ledger ?? null,
      type: adj.type,
      amount: adj.type === 'deduction' ? -Number(adj.amount) : Number(adj.amount),
    })),
    ...(vatPercentage > 0
    ? [{
        id: 'vat',
        particular: `VAT (${vatPercentage}%)`,
        amount: vatAmount,
        complement_ledger: null,
        type: null,
      }]
    : []),
  ];

  const grandTotal = summaryItems.reduce((sum, item) => sum + Number(item.amount), 0);

  // ==================== Certified Items ====================
  const certifiedItems = certificate.items.map((item, index) => {
    const previousQty = item.previous_certified_quantity || 0;
    const presentQty = item.certified_quantity || 0;
    const cumulativeQty = previousQty + presentQty;
    const rate = item.rate || 0;
    const contractQty = item.task?.quantity || 0;

    return {
      sn: index + 1,
      description: item.task?.name || '',
      unit: item.measurement_unit?.symbol || '',
      contractQty,
      unitRate: rate,
      contractAmount: contractQty * rate,
      previousQty,
      presentQty,
      cumulativeQty,
      previousAmount: previousQty * rate,
      presentAmount: presentQty * rate,
      cumulativeAmount: cumulativeQty * rate,
    };
  });

  const totals = certifiedItems.reduce(
    (acc, item) => ({
      contractAmount: acc.contractAmount + item.contractAmount,
      previousAmount: acc.previousAmount + item.previousAmount,
      presentAmount: acc.presentAmount + item.presentAmount,
      cumulativeAmount: acc.cumulativeAmount + item.cumulativeAmount,
    }),
    { contractAmount: 0, previousAmount: 0, presentAmount: 0, cumulativeAmount: 0 }
  );

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: amount < 0 ? 'always' : 'auto',
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'md', bgcolor: 'background.paper' }}>
      {/* ==================== Header ==================== */}
      <Grid container spacing={3} sx={{ mb: 6, alignItems: 'center' }}>

        <Grid size={{ xs: 12, md: 12 }} textAlign="center">
          <Typography variant="h3" sx={{ color: headerColor, fontWeight: 'bold' }}>
            CERTIFICATE
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ mt: 2 }}>
            {certificate.certificateNo}
          </Typography>
        </Grid>
      </Grid>

      {/* ==================== Certificate Info ==================== */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Certificate Date
          </Typography>
          <Typography variant="h6" fontWeight="medium">
            {readableDate(certificate.certificate_date, false)}
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            SubContractor
          </Typography>
          <Typography variant="h6">
            {certificate?.subcontractor?.name}
          </Typography>
        </Grid>

        {certificate.remarks && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Remarks
            </Typography>
            <Typography variant="h6">{certificate.remarks}</Typography>
          </Grid>
        )}
      </Grid>

      {/* ==================== Summary Table (Right Aligned) ==================== */}
      <Box sx={{ mb: 8, display: 'flex', justifyContent: isFromProcessApproval ? 'flex-start' : 'flex-end' }}>
        <Box sx={{ width: isFromProcessApproval ? '100%' : 'auto' }}>
          <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
            Summary
          </Typography>

          <TableContainer component={Paper} elevation={4}>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ backgroundColor: mainColor }}>
                  <TableCell sx={{ border: `1px solid ${contrastText}`, color: contrastText, fontWeight: 'bold' }}>S/N</TableCell>
                  <TableCell sx={{ border: `1px solid ${contrastText}`, color: contrastText, fontWeight: 'bold' }}>Particulars</TableCell>
                  <TableCell align="right" sx={{ border: `1px solid ${contrastText}`, color: contrastText, fontWeight: 'bold' }}>
                    Amount ({currencyCode})
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summaryItems.map((item, index) => (
                  <TableRow key={item.id} sx={{ bgcolor: index % 2 === 1 ? (isDark ? '#333' : '#f9f9f9') : 'inherit' }}>
                    <TableCell sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1.5 }}>{index + 1}.</TableCell>
                    <TableCell sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1.5 }}>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">{item.particular}</Typography>
                        {item.complement_ledger?.name && (
                          <Typography variant="caption" color="text.secondary">
                            ({item.complement_ledger.name})
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1.5 }}>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        sx={{ color: item.type === 'deduction' ? 'error.main' : 'success.main' }}
                      >
                        {formatAmount(Number(item.amount))}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow sx={{ backgroundColor: mainColor }}>
                  <TableCell colSpan={2} align="center" sx={{ border: `1px solid ${contrastText}`, color: contrastText, py: 2 }}>
                    Grand Total ({currencyCode})
                  </TableCell>
                  <TableCell align="right" sx={{ border: `1px solid ${contrastText}`, color: contrastText, py: 2 }}>
                    {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {/* ==================== Certified Items Table ==================== */}
      <Typography variant="h5" sx={{ mb: 4, textAlign: 'center' }}>
        Certified Items
      </Typography>

      <TableContainer component={Paper} elevation={4} sx={{ mb: 8, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            {/* Group Headers */}
            <TableRow sx={{ backgroundColor: mainColor }}>
              <TableCell colSpan={3} sx={{ border: `1px solid ${contrastText}`, color: contrastText }} />
              <TableCell colSpan={3} align="center" sx={{ border: `1px solid ${contrastText}`, color: contrastText, fontWeight: 'bold' }}>
                Price Schedule
              </TableCell>
              <TableCell colSpan={3} align="center" sx={{ border: `1px solid ${contrastText}`, color: contrastText, fontWeight: 'bold' }}>
                Quantity
              </TableCell>
              <TableCell colSpan={3} align="center" sx={{ border: `1px solid ${contrastText}`, color: contrastText, fontWeight: 'bold' }}>
                Amount ({currencyCode})
              </TableCell>
            </TableRow>

            {/* Sub Headers */}
            <TableRow sx={{ backgroundColor: mainColor + 'dd' }}>
              {[
                'S/N', 'Description', 'Unit',
                'Qty', 'Unit Rate', 'Amount',
                'Previous', 'Present', 'Cumulative',
                'Previous', 'Present', 'Cumulative',
              ].map((header, idx) => (
                <TableCell
                   key={idx} 
                  align={idx >= 3 ? 'right' : idx === 2 ? 'center' : 'left'}
                  sx={{ border: `1px solid ${contrastText}`, color: contrastText, fontWeight: 'bold' }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {certifiedItems.map((item, index) => (
              <TableRow key={item.sn} sx={{ bgcolor: index % 2 === 1 ? (isDark ? '#333' : '#f9f9f9') : 'inherit' }}>
                <TableCell sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{item.sn}.</TableCell>
                <TableCell sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{item.description}</TableCell>
                <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{item.unit}</TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{item.contractQty.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.8rem' }}>{item.unitRate.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.8rem' }}>{item.contractAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{item.previousQty.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{item.presentQty.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{item.cumulativeQty.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.8rem' }}>{item.previousAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.8rem' }}>{item.presentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', fontSize: '0.8rem' }}>{item.cumulativeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            ))}

            {/* Grand Total Row */}
            <TableRow sx={{ backgroundColor: mainColor }}>
              <TableCell colSpan={5} align="right" sx={{ border: `1px solid ${contrastText}`, color: contrastText, py: 2 }}>
                GRAND TOTAL ({currencyCode})
              </TableCell>
              <TableCell align="right" sx={{ border: `1px solid ${contrastText}`, color: contrastText, py: 2 }}>
                {totals.contractAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell colSpan={1} align="right" sx={{ border: `1px solid ${contrastText}`, color: contrastText, py: 2 }}></TableCell>
              <TableCell colSpan={2} sx={{ border: `1px solid ${contrastText}` }} />
              <TableCell align="right" sx={{ border: `1px solid ${contrastText}`, color: contrastText, py: 2 }}>
                {totals.previousAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell align="right" sx={{ border: `1px solid ${contrastText}`, color: contrastText, py: 2 }}>
                {totals.presentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell align="right" sx={{ border: `1px solid ${contrastText}`, color: contrastText, py: 2 }}>
                {totals.cumulativeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CertificateOnScreen;