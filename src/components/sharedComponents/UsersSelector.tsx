"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Autocomplete,
  Checkbox,
  Chip,
  LinearProgress,
  TextField,
} from "@mui/material";
import CheckBoxOutlineBlank from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBox from "@mui/icons-material/CheckBox";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import organizationServices from "../organizations/organizationServices";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  name: string;
  [key: string]: any;
}

interface UsersSelectorProps {
  onChange: (value: User | User[] | null) => void;
  multiple?: boolean;
  label?: string;
  value?: User | User[] | null;
  defaultValue?: User | User[] | null;
  frontError?: { message?: string } | null;
  excludeUsers?: User[];
}

const UsersSelector: React.FC<UsersSelectorProps> = ({
  onChange,
  multiple = false,
  label = "Users",
  value: controlledValue,
  defaultValue = null,
  frontError = null,
  excludeUsers = [],
}) => {
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;

  const { data: rawUsers = [], isFetching, error } = useQuery<User[]>({
    queryKey: ["users", organization?.id],
    queryFn: () =>
      organizationServices.getOrganizationUsers({
        organizationId: organization?.id,
      }),
    enabled: !!organization?.id,
  });

  const users = useMemo(() => {
    const excludedIds = new Set(excludeUsers.map((u) => u.id));
    const map = new Map<number, User>();

    rawUsers.forEach((user) => {
      if (!excludedIds.has(user.id) && !map.has(user.id)) {
        map.set(user.id, user);
      }
    });

    return Array.from(map.values());
  }, [rawUsers, excludeUsers]);

  const [internalValue, setInternalValue] = useState<User | User[] | null>(
    multiple ? [] : null
  );

  const syncedRef = useRef(false);

  useEffect(() => {
    if (!defaultValue || users.length === 0 || syncedRef.current) return;

    syncedRef.current = true;

    if (multiple) {
      const ids = new Set(
        (Array.isArray(defaultValue) ? defaultValue : [defaultValue]).map(
          (u) => u.id
        )
      );
      setInternalValue(users.filter((u) => ids.has(u.id)));
    } else {
      const id = Array.isArray(defaultValue)
        ? defaultValue[0]?.id
        : defaultValue.id;

      setInternalValue(users.find((u) => u.id === id) || null);
    }
  }, [defaultValue, users, multiple]);

  const handleChange = useCallback(
    (_: any, newValue: User | User[] | null) => {
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange(newValue);
    },
    [onChange, controlledValue]
  );

  if (isFetching) return <LinearProgress />;

  return (
    <Autocomplete
      multiple={multiple}
      size="small"
      options={users}
      value={controlledValue !== undefined ? controlledValue : internalValue}
      onChange={handleChange}
      disableCloseOnSelect={multiple}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      getOptionLabel={(option) => option.name}
      renderInput={(params) => (
        <TextField
          {...params}
          error={!!frontError || !!error}
          helperText={frontError?.message}
          fullWidth
          label={label}
          placeholder={label}
        />
      )}
      renderTags={(value: User[], getTagProps) =>
        value.map((option, index) => {
          const { key, ...chipProps } = getTagProps({ index });
          return <Chip key={key ?? option.id} {...chipProps} label={option.name} />;
        })
      }
      {...(multiple && {
        renderOption: (props, option: any, { selected }) => {
          const { key, ...rest } = props;

          return (
            <li key={key} {...rest}>
              <Checkbox
                icon={<CheckBoxOutlineBlank fontSize="small" />}
                checkedIcon={<CheckBox fontSize="small" />}
                checked={selected}
                sx={{ mr: 1 }}
              />
              {option.name}
            </li>
          );
        },
      })}
    />
  );
};

export default UsersSelector;
