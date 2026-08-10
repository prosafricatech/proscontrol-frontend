'use client';

import {
  ApartmentOutlined,
  BadgeOutlined,
  CalendarMonthOutlined,
  ContactPhoneOutlined,
  EmailOutlined,
  FingerprintOutlined,
  HomeOutlined,
  PersonOutlineOutlined,
  WorkOutlineOutlined,
} from '@mui/icons-material';
import { Box, Card, Stack, Typography } from '@mui/material';
import type { ReactElement } from 'react';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useEmployeeProfile } from './EmployeeProfileProvider';

const formatEmploymentType = (employmentType?: string | null) => {
  if (!employmentType) return '';
  return employmentType
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function PersonalInfoTab() {
  const { employee } = useEmployeeProfile();
  if (!employee) return null;

  const displayGender = employee.gender
    ? employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1).toLowerCase()
    : undefined;

  const sections: {
    title: string;
    items: { key: string; label: string; value?: string | null; icon: ReactElement }[];
  }[] = [
    {
      title: 'Identity',
      items: [
        { key: 'firstName', label: 'First Name', value: employee.first_name, icon: <PersonOutlineOutlined fontSize='small' /> },
        { key: 'middleName', label: 'Middle Name', value: employee.middle_name, icon: <PersonOutlineOutlined fontSize='small' /> },
        { key: 'lastName', label: 'Last Name', value: employee.last_name, icon: <PersonOutlineOutlined fontSize='small' /> },
        { key: 'gender', label: 'Gender', value: displayGender, icon: <BadgeOutlined fontSize='small' /> },
        {
          key: 'dateOfBirth',
          label: 'Date of Birth',
          value: employee.date_of_birth ? readableDate(employee.date_of_birth, false) : undefined,
          icon: <CalendarMonthOutlined fontSize='small' />,
        },
        { key: 'nationalId', label: 'National ID', value: employee.national_id, icon: <FingerprintOutlined fontSize='small' /> },
        { key: 'passportNumber', label: 'Passport Number', value: employee.passport_number, icon: <BadgeOutlined fontSize='small' /> },
        { key: 'tin', label: 'TIN', value: employee.tin, icon: <FingerprintOutlined fontSize='small' /> },
      ],
    },
    {
      title: 'Contact',
      items: [
        { key: 'phoneNumber', label: 'Phone Number', value: employee.phone_number, icon: <ContactPhoneOutlined fontSize='small' /> },
        { key: 'email', label: 'Email', value: employee.email, icon: <EmailOutlined fontSize='small' /> },
        { key: 'address', label: 'Address', value: employee.address, icon: <HomeOutlined fontSize='small' /> },
      ],
    },
    {
      title: 'Work',
      items: [
        { key: 'department', label: 'Department', value: employee.department?.name, icon: <ApartmentOutlined fontSize='small' /> },
        {
          key: 'employmentType',
          label: 'Employment Type',
          value: formatEmploymentType(employee.employment_type),
          icon: <WorkOutlineOutlined fontSize='small' />,
        },
        {
          key: 'joinDate',
          label: 'Join Date',
          value: employee.join_date ? readableDate(employee.join_date, false) : undefined,
          icon: <CalendarMonthOutlined fontSize='small' />,
        },
      ],
    },
  ];

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      {sections.map((section) => (
        <Card key={section.title} variant='outlined' sx={{ p: 2 }}>
          <Typography variant='subtitle1' fontWeight={600} mb={1.5}>
            {section.title}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: 1.25,
            }}
          >
            {section.items.map((item) => (
              <Box
                key={item.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  p: 1.25,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                }}
              >
                <Box
                  sx={{
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {item.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant='caption' color='text.secondary'>
                    {item.label}
                  </Typography>
                  <Typography variant='body2' fontWeight={500} noWrap>
                    {item.value || '—'}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Card>
      ))}
    </Stack>
  );
}
