'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Chip, Divider, Grid, Stack, Tooltip, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import EmployeeItemAction from './EmployeeItemAction';
import EmployeePhotoUpload from './EmployeePhotoUpload';
import { Employee } from './EmployeesType';

const formatEmploymentType = (value?: string) =>
  (value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const EmployeesListItem = ({ employee }: { employee: Employee }) => {
  const router = useRouter();
  const lang = useLanguage();
  const { checkOrganizationPermission } = useJumboAuth();

  const fullName = [
    employee.first_name,
    employee.middle_name,
    employee.last_name,
  ]
    .filter(Boolean)
    .join(' ');

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
        spacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 12, md: 3.5 }}>
          <Tooltip title='View Employee Profile'>
            <Stack
              direction='row'
              spacing={1}
              alignItems='center'
              onClick={() =>
                router.push(`/${lang}/humanResources/employees/${employee.id}`)
              }
              sx={{ cursor: 'pointer' }}
            >
              <EmployeePhotoUpload
                employeeId={employee.id}
                photoPath={employee.photo_path}
                firstName={employee.first_name}
                size={36}
                editable={false}
              />
              <div>
                <Typography
                  variant='h5'
                  fontSize={14}
                  lineHeight={1.25}
                  mb={0}
                  noWrap
                  sx={{
                    '&:hover': {
                      color: 'primary.main',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {fullName}
                </Typography>
                <Typography variant='body2' color='text.secondary' noWrap>
                  {employee.employee_number}
                </Typography>
              </div>
            </Stack>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='Department and Designation'>
            <div>
              <Typography noWrap>{employee.department?.name}</Typography>
              <Typography variant='body2' color='text.secondary' noWrap>
                {employee.active_contract?.designation?.title}
              </Typography>
            </div>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Contact'>
            <div>
              <Typography noWrap>{employee.email}</Typography>
              <Typography variant='body2' color='text.secondary' noWrap>
                {employee.phone_number}
              </Typography>
            </div>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title='Employment'>
            <div>
              <Chip
                size='small'
                label={formatEmploymentType(employee.employment_type)}
                color='default'
                sx={{ textTransform: 'capitalize', mb: 0.5 }}
              />
              <Typography variant='body2' color='text.secondary' noWrap>
                Joined:{' '}
                {employee.join_date
                  ? new Date(employee.join_date).toLocaleDateString()
                  : '-'}
              </Typography>
            </div>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1 }} textAlign={'end'}>
          {checkOrganizationPermission([PERMISSIONS.EMPLOYEES_UPDATE]) && (
            <EmployeeItemAction employee={employee} />
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeesListItem;
