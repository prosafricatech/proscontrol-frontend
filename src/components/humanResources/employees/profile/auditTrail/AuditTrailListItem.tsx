'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Person } from '@mui/icons-material';
import { Chip, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import { Movement } from './AuditTrailType';

interface AuditTrailListItemProps {
  movement: Movement;
  showType?: boolean;
}

const employeeName = (employee?: { first_name: string; last_name: string } | null) =>
  employee ? `${employee.first_name} ${employee.last_name}` : undefined;

const AuditTrailListItem = ({ movement, showType = false }: AuditTrailListItemProps) => {
  const isCostCenter = !!(movement.from_cost_center_id || movement.to_cost_center_id);
  const isManager = !isCostCenter && !!(movement.from_manager_id || movement.to_manager_id);

  const fromName = isCostCenter
    ? movement.from_cost_center?.name
    : isManager
      ? employeeName(movement.from_manager)
      : movement.from_department?.name;
  const toName = isCostCenter
    ? movement.to_cost_center?.name
    : isManager
      ? employeeName(movement.to_manager)
      : movement.to_department?.name;

  const movementType = isCostCenter ? 'Cost Center' : isManager ? 'Manager' : 'Department';
  const movementColor = isCostCenter ? 'primary' : isManager ? 'success' : 'info';

  return (
    <TableRow
      hover
      sx={{
        '&:hover': { bgcolor: 'action.hover' },
        '& td, & th': {
          border: '1px solid',
          borderColor: 'divider',
          py: 1.5,
          px: 2,
        },
      }}
    >
      {/* Date */}
      <TableCell>
        <Typography variant="body2">
          {movement.moved_date ? readableDate(movement.moved_date, false) : '-'}
        </Typography>
      </TableCell>

      {/* From */}
      <TableCell>
        <Typography variant="body2">
          {fromName || '-'}
        </Typography>
        {showType && (
          <Chip
            label={movementType}
            size="small"
            color={movementColor}
            variant="outlined"
            sx={{ mt: 0.5 }}
          />
        )}
      </TableCell>

      {/* To */}
      <TableCell>
        <Typography variant="body2">
          {toName || '-'}
        </Typography>
      </TableCell>

      {/* Reason */}
      <TableCell>
        {movement.reason ? (
          <Tooltip title={movement.reason}>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
              {movement.reason}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.disabled">-</Typography>
        )}
      </TableCell>
    </TableRow>
  );
};

export default AuditTrailListItem;