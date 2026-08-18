'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { DeductionType } from './DeductionType';
import DeductionTypeItemAction from './DeductionTypeItemAction';

const DeductionTypesListItem = ({
  deductionType,
}: {
  deductionType: DeductionType;
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
          size={{ xs: 6, md: 3.2 }}
        >
          <Tooltip title='Name'>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0}>
              {deductionType.name}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid
          size={{ xs: 6, md: 1.4 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          <Tooltip title='Code'>
            <Typography>{deductionType.code || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid
          size={{ xs: 6, md: 1.6 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          <Chip
            label={
              deductionType.category === 'statutory' ? 'Statutory' : 'Voluntary'
            }
            size='small'
            color={
              deductionType.category === 'statutory' ? 'warning' : 'default'
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
              {deductionType.computation_method.replaceAll('_', ' ')}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid
          size={{ xs: 5, md: 1.2 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          <Tooltip title='Default Value'>
            <Typography>
              {Number(deductionType.default_value || 0).toLocaleString('en-US')}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid
          size={{ xs: 5, md: 1.5 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          {deductionType.is_pre_tax ? (
            <Chip
              label='Pre-tax'
              size='small'
              color='success'
              variant='outlined'
            />
          ) : (
            <Chip label='Post-tax' size='small' variant='outlined' />
          )}
        </Grid>

        <Grid size={{ xs: 2, md: 1.0 }} textAlign={'end'}>
          <DeductionTypeItemAction deductionType={deductionType} />
        </Grid>
      </Grid>
    </>
  );
};

export default DeductionTypesListItem;
