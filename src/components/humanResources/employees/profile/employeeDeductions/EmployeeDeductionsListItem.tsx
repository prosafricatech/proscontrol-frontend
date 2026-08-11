'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import EmployeeDeductionItemAction from './EmployeeDeductionItemAction';
import { EmployeeDeductionType } from './EmployeeDeductionType';

const EmployeeDeductionsListItem = ({
  employeeDeduction,
}: {
  employeeDeduction: EmployeeDeductionType;
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
        <Grid size={{ xs: 12, md: 3.0 }}>
          <Tooltip title='Deduction Type'>
            <Typography>{employeeDeduction.deduction_type?.name || `Type #${employeeDeduction.deduction_type_id}`}</Typography>
          </Tooltip>
          {employeeDeduction.member_no && (
            <Tooltip title='Member No.'>
              <Typography variant='caption' color='text.secondary' display='block'>
                No: {employeeDeduction.member_no}
              </Typography>
            </Tooltip>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 2.0 }}>
          <Tooltip title='Value'>
            <Typography>{Number(employeeDeduction.value || 0).toLocaleString('en-US')}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='Effective From'>
            <Typography>{employeeDeduction.effective_from ? dayjs(employeeDeduction.effective_from).format('YYYY-MM-DD') : '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3.5 }}>
          <Tooltip title='Effective To'>
            <Typography>{employeeDeduction.effective_to ? dayjs(employeeDeduction.effective_to).format('YYYY-MM-DD') : 'Open-ended'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 2, md: 1.0 }} textAlign={'end'}>
          <EmployeeDeductionItemAction employeeDeduction={employeeDeduction} />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeeDeductionsListItem;
