'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { EmployeeEmployerContributionType } from './EmployeeEmployerContributionType';
import EmployeeEmployerContributionItemAction from './EmployeeEmployerContributionItemAction';

const EmployeeEmployerContributionsListItem = ({
  employeeEmployerContribution,
}: {
  employeeEmployerContribution: EmployeeEmployerContributionType;
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
          <Tooltip title='Contribution Type'>
            <Typography>
              {employeeEmployerContribution.contribution_type?.name ||
                `Type #${employeeEmployerContribution.employer_contribution_type_id}`}
            </Typography>
          </Tooltip>
          {employeeEmployerContribution.member_no && (
            <Tooltip title='Member No.'>
              <Typography variant='caption' color='text.secondary' display='block'>
                No: {employeeEmployerContribution.member_no}
              </Typography>
            </Tooltip>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 2.0 }}>
          <Tooltip title='Value'>
            <Typography>
              {Number(employeeEmployerContribution.value || 0).toLocaleString('en-US')}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='Effective From'>
            <Typography>
              {employeeEmployerContribution.effective_from
                ? dayjs(employeeEmployerContribution.effective_from).format(
                    'YYYY-MM-DD'
                  )
                : '-'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3.5 }}>
          <Tooltip title='Effective To'>
            <Typography>
              {employeeEmployerContribution.effective_to
                ? dayjs(employeeEmployerContribution.effective_to).format(
                    'YYYY-MM-DD'
                  )
                : 'Open-ended'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 2, md: 1.0 }} textAlign={'end'}>
          <EmployeeEmployerContributionItemAction
            employeeEmployerContribution={employeeEmployerContribution}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeeEmployerContributionsListItem;
