'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { EmployerContributionType } from './EmployerContributionType';
import EmployerContributionTypeItemAction from './EmployerContributionTypeItemAction';

const EmployerContributionTypesListItem = ({
  contributionType,
}: {
  contributionType: EmployerContributionType;
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
        rowSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid
          size={{ xs: 6, md: 2.2 }}
        >
          <Tooltip title='Name'>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0}>
              {contributionType.name}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid
          size={{ xs: 6, md: 1.4 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          <Tooltip title='Code'>
            <Typography>{contributionType.code || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid
          size={{ xs: 6, md: 1.6 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          <Chip
            label={
              contributionType.category === 'statutory'
                ? 'Statutory'
                : 'Voluntary'
            }
            size='small'
            color={
              contributionType.category === 'statutory' ? 'warning' : 'default'
            }
            variant='outlined'
          />
        </Grid>

        <Grid
          size={{ xs: 6, md: 2.1 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          <Tooltip title='Method'>
            <Typography textTransform='capitalize'>
              {contributionType.computation_method.replaceAll('_', ' ')}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid
          size={{ xs: 5, md: 1.2 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          <Tooltip title='Default Value'>
            <Typography>
              {Number(contributionType.default_value || 0).toLocaleString(
                'en-US'
              )}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid
          size={{ xs: 5, md: 2.5 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          <Tooltip title='Description'>
            <Typography noWrap>
              {contributionType.description || '-'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 2, md: 1.0 }} textAlign={'end'}>
          <EmployerContributionTypeItemAction
            contributionType={contributionType}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployerContributionTypesListItem;
