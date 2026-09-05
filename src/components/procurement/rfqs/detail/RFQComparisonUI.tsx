'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Chip,
  Paper,
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import { AssessmentOutlined, ReceiptOutlined, TrendingDown, ShoppingCartOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

interface Quote {
  id: number;
  stakeholder: { id: number; name: string };
  quantity: number;
  rate: number;
  amount: number;
  awarded_quantity: number;
  unawarded_quantity: number;
  vat_percentage: number;
  delivery_date: string | null;
}

interface ComparisonItem {
  id: number;
  product: { id: number; item_name: string; name: string };
  measurement_unit: { id: number; name: string; symbol: string };
  quantity: number;
  quotes: Quote[];
}

interface Currency {
  id: number;
  name: string;
  symbol: string;
  code: string;
  exchangeRate?: number;
}

interface RFQComparisonProps {
  comparison: { items: ComparisonItem[] };
  rfqDetails?: any;
  isAwarding: boolean;
  awardingSupplierId?: number | null;
  onAward: (selectedQuotes: Record<number, Quote>) => void;
  // Awarding creates a Purchase Order directly, bypassing the requisition
  // approval chain — only Purchases:Create holders may do it, or this becomes
  // a loophole for ordering unapproved purchases.
  canAward?: boolean;
}

const TABLE_MAX_HEIGHT = 560;

const RFQComparisonUI: React.FC<RFQComparisonProps> = ({ comparison, rfqDetails, isAwarding, awardingSupplierId, onAward, canAward = true }) => {
  const theme = useTheme();
  const isDarkMode = theme.type === 'dark';

  const [selectedQuoteByItem, setSelectedQuoteByItem] = useState<Record<number, Quote>>({});

  const items = comparison?.items || [];

  const suppliers = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    items.forEach((item) => {
      item.quotes.forEach((q) => {
        if (!map.has(q.stakeholder.id)) map.set(q.stakeholder.id, q.stakeholder);
      });
    });
    return Array.from(map.values());
  }, [items]);

  const currencyBySupplier = useMemo(() => {
    const map = new Map<number, Currency>();
    (rfqDetails?.responses || []).forEach((r: any) => {
      if (r?.stakeholder?.id && r?.currency) {
        map.set(r.stakeholder.id, r.currency);
      }
    });
    return map;
  }, [rfqDetails]);

  const getCurrency = (supplierId: number): Currency | undefined => currencyBySupplier.get(supplierId);

  const formatWithCurrency = (value: number | undefined, supplierId: number) => {
    if (value === undefined || value === null) return '-';
    const currency = getCurrency(supplierId);
    const symbol = currency?.symbol || currency?.code;
    return symbol ? `${symbol} ${value.toLocaleString()}` : value.toLocaleString();
  };

  const getBestPrice = (quotes: Quote[]) => {
    if (!quotes || quotes.length === 0) return null;
    return quotes.reduce((min, q) => (q.amount < min.amount ? q : min));
  };

  const hasUnawardedQuantity = (quote: Quote) => (quote.unawarded_quantity || 0) > 0;
  const getDisplayQuantity = (quote: Quote) =>
    quote.unawarded_quantity !== undefined && quote.unawarded_quantity !== null
      ? quote.unawarded_quantity
      : quote.quantity;

  const selectQuote = (itemId: number, quote: Quote) => {
    setSelectedQuoteByItem((prev) => ({ ...prev, [itemId]: quote }));
  };

  const getSelectionsForSupplier = (supplierId: number) => {
    return Object.entries(selectedQuoteByItem).reduce((acc: Record<number, Quote>, [itemId, quote]) => {
      if (quote.stakeholder.id === supplierId) {
        acc[Number(itemId)] = quote;
      }
      return acc;
    }, {});
  };

  const getSupplierSelectionCount = (supplierId: number) =>
    Object.keys(getSelectionsForSupplier(supplierId)).length;

  const handleAwardSupplier = (supplierId: number) => {
    const supplierSelections = getSelectionsForSupplier(supplierId);
    if (Object.keys(supplierSelections).length === 0) return;
    onAward(supplierSelections);
  };

  const headerBg = isDarkMode ? alpha(theme.palette.common.white, 0.04) : theme.palette.grey[50];
  const footerBg = theme.palette.background.paper;

  return (
    <Paper sx={{ p: 3, bgcolor: isDarkMode ? 'background.paper' : 'background.default' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" rowGap={1}>
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          <AssessmentOutlined fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
          Quote Comparison
        </Typography>
      </Stack>

      <Alert
        severity="info"
        sx={{
          mb: 3,
          bgcolor: isDarkMode ? alpha(theme.palette.info.main, 0.1) : undefined,
          color: isDarkMode ? theme.palette.info.light : undefined,
          '& .MuiAlert-icon': { color: isDarkMode ? theme.palette.info.light : undefined },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <ReceiptOutlined />
          <Typography variant="body2">
            Select the best quote per item, then click "Award" under a supplier's column to create a
            purchase order from that supplier's selected items.
          </Typography>
        </Stack>
      </Alert>

      {suppliers.length === 0 ? (
        <Alert severity="warning">No supplier quotes have been recorded for this RFQ yet.</Alert>
      ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ maxWidth: '100%', maxHeight: TABLE_MAX_HEIGHT, overflow: 'auto', position: 'relative' }}
        >
          <Table size="small" stickyHeader sx={{ minWidth: 600 + suppliers.length * 190 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ position: 'sticky', left: 0, top: 0, bgcolor: headerBg, zIndex: 4, minWidth: 200 }}>
                  Item
                </TableCell>
                <TableCell align="center" sx={{ bgcolor: headerBg, minWidth: 90 }}>
                  Qty
                </TableCell>
                {suppliers.map((s) => {
                  return (
                    <TableCell key={s.id} align="center" sx={{ bgcolor: headerBg, minWidth: 180 }}>
                      <Typography variant="body2" fontWeight="medium">{s.name}</Typography>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const bestPrice = getBestPrice(item.quotes);
                const selectedQuote = selectedQuoteByItem[item.id];

                return (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {item.product?.item_name || item.product?.name || 'Item'}
                      </Typography>
                      {selectedQuote && (
                        <Typography variant="caption" color="primary.main">
                          Selected: {selectedQuote.stakeholder.name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={`${item.quantity} ${item.measurement_unit?.symbol || ''}`} size="small" variant="outlined" />
                    </TableCell>
                    {suppliers.map((supplier) => {
                      const quote = item.quotes.find((q) => q.stakeholder.id === supplier.id);
                      if (!quote) {
                        return (
                          <TableCell key={supplier.id} align="center">
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          </TableCell>
                        );
                      }
                      const isSelected = selectedQuote?.id === quote.id;
                      const isBest = bestPrice?.id === quote.id;
                      const isAvailable = hasUnawardedQuantity(quote);

                      return (
                        <TableCell key={supplier.id} align="center">
                          <Stack alignItems="center" spacing={0.25}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography
                                variant="body2"
                                fontWeight={isBest ? 'bold' : 'regular'}
                                color={isBest ? 'success.main' : 'text.primary'}
                              >
                                TZS {quote.amount?.toLocaleString()}
                              </Typography>
                              {isBest && (
                                <Tooltip title="Best Total Amount">
                                  <TrendingDown fontSize="small" color="success" sx={{ fontSize: 14 }} />
                                </Tooltip>
                              )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              Rate: {formatWithCurrency(quote.rate, supplier.id)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Qty: {getDisplayQuantity(quote).toLocaleString()}
                              {quote.quantity !== getDisplayQuantity(quote) && ` (awarded ${quote.awarded_quantity})`}
                            </Typography>
                            {quote.delivery_date && (
                              <Chip label={readableDate(quote.delivery_date, false)} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                            <Tooltip title={isAvailable ? 'Select this quote' : 'No quantity remaining to award'}>
                              <span>
                                <Radio
                                  checked={isSelected}
                                  disabled={!isAvailable}
                                  onChange={() => selectQuote(item.id, quote)}
                                  size="small"
                                />
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}

              {/* Footer/Award Row - Now properly inside TableBody */}
              <TableRow sx={{ position: 'sticky', bottom: 0, zIndex: 3 }}>
                <TableCell
                  sx={{ position: 'sticky', left: 0, bottom: 0, bgcolor: footerBg, zIndex: 4, borderTop: 2, borderColor: 'divider', fontWeight: 'bold' }}
                >
                  Award
                </TableCell>
                <TableCell sx={{ bgcolor: footerBg, borderTop: 2, borderColor: 'divider' }} />
                {suppliers.map((supplier) => {
                  const count = getSupplierSelectionCount(supplier.id);
                  const isThisSupplierAwarding = isAwarding && awardingSupplierId === supplier.id;

                  return (
                    <TableCell key={supplier.id} align="center" sx={{ bgcolor: footerBg, borderTop: 2, borderColor: 'divider', py: 1.5 }}>
                      {canAward ? (
                        <LoadingButton
                          variant={count > 0 ? 'contained' : 'outlined'}
                          size="small"
                          loading={isThisSupplierAwarding}
                          disabled={count === 0 || isAwarding}
                          onClick={() => handleAwardSupplier(supplier.id)}
                          startIcon={<ShoppingCartOutlined />}
                          sx={{ minWidth: 'auto', px: 1.5 }}
                        >
                          Award{count > 0 ? ` (${count})` : ''}
                        </LoadingButton>
                      ) : (
                        <Tooltip title="You don't have permission to create purchase orders">
                          <span>
                            <LoadingButton
                              variant="outlined"
                              size="small"
                              disabled
                              startIcon={<ShoppingCartOutlined />}
                              sx={{ minWidth: 'auto', px: 1.5 }}
                            >
                              Award
                            </LoadingButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default RFQComparisonUI;