import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import projectsServices from './project-services';

export interface ProjectOption {
  id: number;
  name: string;
  projectNo?: string;
}

interface ProjectSelectorProps {
  onChange: (value: ProjectOption | null) => void;
  label?: string;
  defaultValue?: ProjectOption | null;
  frontError?: { message?: string } | null;
  disabled?: boolean;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  onChange,
  label = 'Project',
  defaultValue = null,
  frontError = null,
  disabled = false,
}) => {
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [selected, setSelected] = useState<ProjectOption | null>(
    defaultValue
  );

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(timeout);
  }, [keyword]);

  useEffect(() => {
    setSelected(defaultValue ?? null);
  }, [defaultValue?.id]);

  const { data, isFetching } = useQuery({
    queryKey: ['projectOptions', debouncedKeyword],
    queryFn: () =>
      projectsServices.getList({ keyword: debouncedKeyword, limit: 20 }),
  });

  const options: ProjectOption[] = data?.data || [];
  const mergedOptions = selected
    ? [selected, ...options.filter((opt) => opt.id !== selected.id)]
    : options;

  return (
    <Autocomplete
      options={mergedOptions}
      loading={isFetching}
      disabled={disabled}
      value={selected}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      getOptionLabel={(option) => option.name}
      onInputChange={(_, value) => setKeyword(value)}
      onChange={(_, newValue) => {
        setSelected(newValue);
        onChange(newValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size='small'
          fullWidth
          error={!!frontError}
          helperText={frontError?.message}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isFetching && <CircularProgress color='inherit' size={16} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default ProjectSelector;
