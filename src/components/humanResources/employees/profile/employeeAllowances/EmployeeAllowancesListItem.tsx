'use client';

import EmployeeAllowanceItemAction from '@/components/humanResources/employees/profile/employeeAllowances/EmployeeAllowanceItemAction';
import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { EmployeeAllowanceType } from './EmployeeAllowanceType';

const EmployeeAllowancesListItem = ({
  employeeAllowance,
}: {
  employeeAllowance: EmployeeAllowanceType;
}) => {
  return (
    <>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 6, md: 3.0 }}>
          <Tooltip title='Allowance Type'>
            <Typography>
              {employeeAllowance.allowance_type?.name ||
                `Type #${employeeAllowance.allowance_type_id}`}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 2.0 }}>
          <Tooltip title='Amount'>
            <Typography>{employeeAllowance.amount.toLocaleString()}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 2.5 }}>
          <Tooltip title='Effective From'>
            <Typography>
              {employeeAllowance.effective_from
                ? dayjs(employeeAllowance.effective_from).format('YYYY-MM-DD')
                : '-'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 3.5 }}>
          <Tooltip title='Effective To'>
            <Typography>
              {employeeAllowance.effective_to
                ? dayjs(employeeAllowance.effective_to).format('YYYY-MM-DD')
                : 'Open-ended'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.0 }} textAlign={'end'}>
          <EmployeeAllowanceItemAction employeeAllowance={employeeAllowance} />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeeAllowancesListItem;
