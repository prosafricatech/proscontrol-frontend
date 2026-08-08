import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  LinearProgress,
  TextField,
} from '@mui/material';
import React, { useEffect } from 'react';
import { useEmployees } from './EmployeesProvider';
import { Employee } from './EmployeesType';

const EMPTY_EMPLOYEE_REFS: EmployeeRef[] = [];

type EmployeeRef = number | Employee | { id: number };

interface EmployeeSelector {
  onChange: (value: Employee | Employee[] | null) => void;
  frontError?: { message?: string } | null;
  label?: string;
  defaultValue?: Employee | Employee[] | null;
  value?: Employee | Employee[] | null;
  addedEmployee?: Employee | null;
  multiple?: boolean;
  startAdornment?: React.ReactNode;
  /** Excludes this employee id from the options — e.g. so someone can't pick themselves as their own manager. */
  excludeId?: number;
  renderOption?: (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: Employee,
    state: { selected: boolean }
  ) => React.ReactNode;
}

const EmployeeSelector = (props: EmployeeSelector) => {
  const {
    onChange,
    frontError = null,
    label = 'Select Employee',
    defaultValue = null,
    value = null,
    addedEmployee = null,
    multiple = false,
    startAdornment,
    excludeId,
  } = props;

  const { employees, isLoading } = useEmployees();
  const [options, setOptions] = React.useState<Employee[]>([]);
  const [selectedValue, setSelectedValue] = React.useState<
    Employee | Employee[] | null
  >(defaultValue ? defaultValue : multiple ? [] : value);

  useEffect(() => {
    if (employees) {
      setOptions(
        excludeId
          ? employees.filter((employee: Employee) => employee.id !== excludeId)
          : employees
      );
    }
  }, [employees, excludeId]);

  useEffect(() => {
    if (value) setSelectedValue(value);
  }, [value]);

  React.useEffect(() => {
    if (!addedEmployee) return;

    const value = multiple ? [addedEmployee] : addedEmployee;
    setSelectedValue(value);
    onChange?.(value);
  }, [addedEmployee]);

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option: Employee) =>
        `${option.first_name} ${option.middle_name ? option.middle_name : ''} ${option.last_name}`
      }
      value={selectedValue}
      multiple={multiple}
      isOptionEqualToValue={(option: Employee, value: Employee) =>
        option.id === value.id
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size='small'
          fullWidth
          label={label}
          error={!!frontError}
          helperText={frontError?.message}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                {startAdornment && <Box sx={{ mr: 0.5 }}>{startAdornment}</Box>}
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
      {...(multiple && {
        renderOption: (
          props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key }, // extend type to include key optionally
          option: Employee,
          { selected }
        ) => {
          const { key, ...otherProps } = props;

          return (
            <li key={option.id} {...otherProps}>
              <Checkbox
                icon={<CheckBoxOutlineBlank fontSize='small' />}
                checkedIcon={<CheckBox fontSize='small' />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {`${option.first_name} ${option.middle_name ? option.middle_name : ''} ${option.last_name}`}
            </li>
          );
        },
      })}
      onChange={(
        event: React.SyntheticEvent,
        newValue: Employee | Employee[] | null
      ) => {
        onChange(newValue);
        setSelectedValue(newValue);
      }}
      renderTags={(tagValue: Employee[], getTagProps) => {
        return tagValue.map((option: Employee, index: number) => {
          const { key, ...restProps } = getTagProps({ index });
          return (
            <Chip
              {...restProps}
              key={`${option.id}-${key}`}
              label={`${option.first_name} ${option.middle_name ? option.middle_name : ''} ${option.last_name}`}
            />
          );
        });
      }}
    />
  );
};

export default EmployeeSelector;
