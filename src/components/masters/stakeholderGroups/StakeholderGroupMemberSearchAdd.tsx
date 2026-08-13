'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import stakeholderServices from '@/components/masters/stakeholders/stakeholder-services';
import stakeholderGroupServices from './stakeholderGroup-services';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';

interface StakeholderOption {
  id: number;
  name: string;
  phone?: string | null;
}

/**
 * Search-as-you-type stakeholder picker that adds on selection, instead of
 * preloading every stakeholder into a dropdown — groups (and the overall
 * stakeholder list) can run into the hundreds, so nothing here loads more
 * than a page of matches at a time.
 */
const StakeholderGroupMemberSearchAdd = ({ groupId }: { groupId: number }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [inputValue, setInputValue] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedKeyword(inputValue.trim()), 300);
    return () => clearTimeout(handle);
  }, [inputValue]);

  const { data, isFetching } = useQuery({
    queryKey: ['stakeholder-search', debouncedKeyword],
    queryFn: () => stakeholderServices.getList({ type: 'all', keyword: debouncedKeyword, page: 1, limit: 10 }),
    enabled: debouncedKeyword.length >= 2,
  });

  const options: StakeholderOption[] = data?.data || [];

  const { mutate: addStakeholder, isPending } = useMutation({
    mutationFn: (stakeholderId: number) =>
      stakeholderGroupServices.addStakeholders({ id: groupId, stakeholder_ids: [stakeholderId] }),
    onSuccess: () => {
      enqueueSnackbar('Stakeholder added to group', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['stakeholder-group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['stakeholder-groups'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <Autocomplete<StakeholderOption>
      options={options}
      loading={isFetching}
      filterOptions={(opts) => opts}
      inputValue={inputValue}
      value={null}
      onInputChange={(_e, newValue) => setInputValue(newValue)}
      onChange={(_e, newValue) => {
        if (newValue) {
          addStakeholder(newValue.id);
          setInputValue('');
        }
      }}
      getOptionLabel={(option) => `${option.name}${option.phone ? ' (' + option.phone + ')' : ''}`}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      noOptionsText={debouncedKeyword.length < 2 ? 'Type at least 2 characters to search' : 'No stakeholders found'}
      renderInput={(params) => (
        <TextField
          {...params}
          label='Search stakeholders to add'
          size='small'
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {(isFetching || isPending) && <CircularProgress size={16} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default StakeholderGroupMemberSearchAdd;
