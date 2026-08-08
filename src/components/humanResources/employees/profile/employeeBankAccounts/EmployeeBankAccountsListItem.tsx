'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import EmployeeBankItemAction from './EmployeeBankItemAction';
import { EmployeeBankAccountType } from './EmployeeBankAccountType';

const EmployeeBankAccountsListItem = ({
  account,
}: {
  account: EmployeeBankAccountType;
}) => {
  const bankDisplayName =
    account.bank?.short_name
      ? `${account.bank.name} (${account.bank.short_name})`
      : account.bank?.name || account.bank_name || '-';

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
        <Grid size={{ xs: 12, md: 4 }}>
          <Tooltip title='Bank'>
            <Typography>{bankDisplayName}</Typography>
          </Tooltip>
          {account.bank_code && (
            <Tooltip title='Bank Code'>
              <Typography variant='caption' color='text.secondary'>
                Code: {account.bank_code}
              </Typography>
            </Tooltip>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Account Name'>
            <Typography noWrap>{account.account_name}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title='Account Number'>
            <Typography>{account.account_number}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 10, md: 2 }}>
          {account.is_primary ? (
            <Chip label='Primary' size='small' color='success' variant='outlined' />
          ) : (
            <Chip label='Secondary' size='small' variant='outlined' />
          )}
        </Grid>

        <Grid size={{ xs: 2, md: 1 }} textAlign={'end'}>
          <EmployeeBankItemAction account={account} />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeeBankAccountsListItem;