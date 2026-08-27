'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import DepartmentSelector from '@/components/humanResources/departments/DepartmentSelector';
import { DepartmentsProvider } from '@/components/humanResources/departments/DepartmentsProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import smsServices from './sms-services';

interface EmployeeOption {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  gender: string;
}

interface Department {
  id: number;
  name: string;
}

interface CostCenter {
  id: number;
  name: string;
}

const SmsEmployeeFilterPicker = ({
  onChange,
}: {
  onChange: (selection: { employeeIds: number[]; allEmployees: boolean }) => void;
}) => {
  const [gender, setGender] = useState('');
  const [department, setDepartment] = useState<Department | null>(null);
  const [costCenter, setCostCenter] = useState<CostCenter | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [allEmployees, setAllEmployees] = useState(false);

  const hasFilter = !allEmployees && (!!gender || !!department || !!costCenter);

  const { data, isFetching } = useQuery({
    queryKey: ['sms-employee-filter', gender, department?.id, costCenter?.id],
    queryFn: () =>
      smsServices.searchEmployees({
        gender: gender || undefined,
        department_ids: department ? [department.id] : undefined,
        cost_center_ids: costCenter ? [costCenter.id] : undefined,
        limit: 100,
      }),
    enabled: hasFilter,
  });

  const { data: allCountData, isFetching: isCountFetching } = useQuery({
    queryKey: ['sms-employee-total-count'],
    queryFn: () => smsServices.searchEmployees({ limit: 1 }),
    enabled: allEmployees,
  });

  const employees: EmployeeOption[] = data?.data || [];
  const withPhone = employees.filter((e) => e.phone_number);
  const withoutPhoneCount = employees.length - withPhone.length;
  const totalEmployeeCount = allCountData?.total ?? null;

  useEffect(() => {
    setSelectedIds(new Set());
  }, [gender, department?.id, costCenter?.id]);

  useEffect(() => {
    if (allEmployees) {
      onChange({ employeeIds: [], allEmployees: true });
      return;
    }
    onChange({ employeeIds: employees.filter((e) => selectedIds.has(e.id)).map((e) => e.id), allEmployees: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, allEmployees]);

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.size === withPhone.length ? new Set() : new Set(withPhone.map((e) => e.id))
    );
  };

  return (
    <Stack spacing={1.5}>
      <FormControlLabel
        control={
          <Checkbox
            checked={allEmployees}
            onChange={(e) => {
              setAllEmployees(e.target.checked);
              setSelectedIds(new Set());
            }}
          />
        }
        label='Send to all employees (ignore filters below)'
      />

      {allEmployees && (
        <Alert severity='warning'>
          {isCountFetching
            ? 'Checking total employee count...'
            : `This will message every employee with a valid phone number out of ${totalEmployeeCount ?? '?'} total employees. Those without a valid phone number are skipped automatically.`}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl size='small' fullWidth disabled={allEmployees}>
            <InputLabel>Gender</InputLabel>
            <Select label='Gender' value={gender} onChange={(e) => setGender(e.target.value)}>
              <MenuItem value=''>Any</MenuItem>
              <MenuItem value='male'>Male</MenuItem>
              <MenuItem value='female'>Female</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={allEmployees ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
            <DepartmentsProvider>
              <DepartmentSelector
                label='Department'
                onChange={(value) => setDepartment((value as Department) || null)}
              />
            </DepartmentsProvider>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <CostCenterSelector
            label='Cost Center'
            multiple={false}
            disabled={allEmployees}
            onChange={(value) => setCostCenter((value as CostCenter) || null)}
          />
        </Grid>
      </Grid>

      {hasFilter && (
        <>
          {isFetching && <Typography color='text.secondary'>Searching employees...</Typography>}

          {!isFetching && employees.length === 0 && (
            <Typography color='text.secondary'>No employees match this filter.</Typography>
          )}

          {!isFetching && employees.length > 0 && (
            <>
              <Stack direction='row' alignItems='center' justifyContent='space-between'>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={withPhone.length > 0 && selectedIds.size === withPhone.length}
                      indeterminate={selectedIds.size > 0 && selectedIds.size < withPhone.length}
                      onChange={toggleAll}
                      disabled={withPhone.length === 0}
                    />
                  }
                  label={`Select all with a phone number (${withPhone.length})`}
                />
                {withoutPhoneCount > 0 && (
                  <Chip size='small' color='warning' label={`${withoutPhoneCount} without phone number`} />
                )}
              </Stack>
              <List dense sx={{ maxHeight: 260, overflowY: 'auto' }}>
                {employees.map((employee) => (
                  <ListItem
                    key={employee.id}
                    disablePadding
                    onClick={() => employee.phone_number && toggleOne(employee.id)}
                    sx={{ cursor: employee.phone_number ? 'pointer' : 'not-allowed', opacity: employee.phone_number ? 1 : 0.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox
                        edge='start'
                        size='small'
                        checked={selectedIds.has(employee.id)}
                        disabled={!employee.phone_number}
                        tabIndex={-1}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${employee.first_name} ${employee.last_name}`}
                      secondary={employee.phone_number || 'No phone number'}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </>
      )}
    </Stack>
  );
};

export default SmsEmployeeFilterPicker;
