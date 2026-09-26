'use client';

import { Box, Pagination, Typography } from '@mui/material';
import type { TicketPageMeta } from '@/lib/support/usePaginatedTickets';

interface TicketPaginationProps {
  meta: TicketPageMeta;
  onPageChange: (page: number) => void;
}

export const TicketPagination = ({ meta, onPageChange }: TicketPaginationProps) => {
  if (meta.total === 0) return null;

  const from = (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mt: 3, flexWrap: 'wrap' }}>
      <Typography sx={{ color: 'var(--pc-text-3)', fontSize: '0.875rem' }}>
        {from}–{to} of {meta.total}
      </Typography>
      {meta.last_page > 1 && (
        <Pagination
          count={meta.last_page}
          page={meta.current_page}
          onChange={(_, value) => {
            onPageChange(value);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          shape="rounded"
          color="primary"
        />
      )}
    </Box>
  );
};
