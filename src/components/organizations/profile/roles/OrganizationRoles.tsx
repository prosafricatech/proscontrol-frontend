'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import axios from '@/lib/services/config';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { EditOutlined, ExpandMoreOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import organizationServices from '../../organizationServices';
import { useOrganizationProfile } from '../OrganizationProfileProvider';
import { NewRoleForm } from './NewRoleForm';

interface Permission {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Permission[];
}

interface FormValues {
  name: string;
  description?: string;
  organization_id: string;
  role_id?: number | null;
}

interface ValidationErrors {
  [key: string]: string[];
}

interface ApiErrorResponse {
  message?: string;
  validation_errors?: ValidationErrors;
}

interface AddRoleResponse {
  message: string;
}

interface PermissionModuleGroup {
  displayName: string;
  permissions: Permission[];
}

interface PermissionModuleConfig {
  key: string;
  displayName: string;
  prefixes: string[];
}

const PERMISSION_MODULES: PermissionModuleConfig[] = [
  {
    key: 'accounts_and_finance',
    displayName: MODULES.ACCOUNTS_AND_FINANCE,
    prefixes: [
      'Accounts',
      'AccountsMasters',
      'AccountsTransactions',
      'BankReconciliation',
      'CostCenters',
      'FundTransfers',
      'JournalVouchers',
      'Payments',
      'Receipts',
      'Budgets'
    ],
  },
  {
    key: 'process_approval',
    displayName: MODULES.PROCESS_APPROVAL,
    prefixes: [
      'Approvals',
      'ApprovalChains',
      'ApprovedRequisitions',
      'ImprestRetirements',
      "ImprestRetirementApprovals",
      'Requisitions',
      'RequisitionApprovals',
    ],
  },
  {
    key: 'point_of_sale',
    displayName: MODULES.POINT_OF_SALE,
    prefixes: [
      'Outlets',
      'POS',
      'PriceLists',
      'ProformaInvoices',
      'Sales',
      'SalesDispatch',
    ],
  },
  {
    key: 'fuel_station',
    displayName: MODULES.FUEL_STATION,
    prefixes: ['FuelSalesShifts', 'FuelStations'],
  },
  {
    key: 'procurement_and_supply',
    displayName: MODULES.PROCUREMENT_AND_SUPPLY,
    prefixes: [
      'InventoryConsumptions',
      'InventoryTransfers',
      'ProductCategories',
      'Products',
      'Purchases',
      'StockAdjustments',
      'Stores',
      'RFQs'
    ],
  },
  {
    key: 'manufacturing_and_processing',
    displayName: MODULES.MANUFACTURING_AND_PROCESSING,
    prefixes: ['BOM', 'ManufacturingOrders', 'ProductionBatches', 'WorkCenters'],
  },
  {
    key: 'project_management',
    displayName: MODULES.PROJECT_MANAGEMENT,
    prefixes: ['ProjectCategories', 'Projects', 'ProjectClaims', 'ProjectSubcontracts'],
  },
  {
    key: 'human_resources',
    displayName: MODULES.HUMAN_RESOURCES,
    prefixes: ['Employees', 'Payroll', 'PayrollRuns','LeaveAllocations', 'LeaveRequests', 'LoanRequests', 'Loans', 'ApprovedLoans', 'ApprovedPayroll'],
  },
  {
    key: 'sms',
    displayName: MODULES.SMS,
    prefixes: ['Sms'],
  },
  {
    key: 'shared',
    displayName: 'Shared / Organization',
    prefixes: [
      'FilesShelf',
      'MeasurementUnits',
      'Organization',
      'Roles',
      'Subscriptions',
      'Users',
      'Audit',
      'Stakeholders',
      'StakeholderGroups'
    ],
  },
];

// Group permissions by configured business modules in a fixed display order.
const groupPermissionsByModule = (permissions: Permission[]) => {
  const grouped: Record<string, PermissionModuleGroup> = {};

  PERMISSION_MODULES.forEach((moduleConfig) => {
    grouped[moduleConfig.key] = {
      displayName: moduleConfig.displayName,
      permissions: [],
    };
  });

  const uncategorizedKey = 'uncategorized';
  grouped[uncategorizedKey] = {
    displayName: 'Uncategorized',
    permissions: [],
  };

  permissions.forEach((permission) => {
    const permissionPrefix = permission.name.split(':')[0];
    const matchedModule = PERMISSION_MODULES.find((moduleConfig) =>
      moduleConfig.prefixes.includes(permissionPrefix)
    );

    if (matchedModule) {
      grouped[matchedModule.key].permissions.push(permission);
      return;
    }

    grouped[uncategorizedKey].permissions.push(permission);
  });

  const orderedKeys = [
    ...PERMISSION_MODULES.map((moduleConfig) => moduleConfig.key),
    uncategorizedKey,
  ];

  return orderedKeys.reduce((result, key) => {
    if (grouped[key].permissions.length > 0) {
      result[key] = {
        ...grouped[key],
        permissions: [...grouped[key].permissions].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      };
    }
    return result;
  }, {} as Record<string, PermissionModuleGroup>);
};

const OrganizationRoles = () => {
  const { checkOrganizationPermission } = useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { organization } = useOrganizationProfile();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary();
  const roleManagementDict =
    dictionary.organizations.profile.rolesTab.roleManagement;
  const newRoleDict = dictionary.organizations.profile.rolesTab.newRoleForm;
  // const

  // state to track edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedRole, setEditedRole] = useState<Role | null>(null);

  const { data: permissions = [], isLoading: isLoadingPermissions } = useQuery<
    Permission[]
  >({
    queryKey: ['organizationPermissionsOptions', organization?.id],
    queryFn: async () =>
      organizationServices.getPermissionOptions(organization?.id),
    enabled: !!organization?.id,
  });

  const {
    data: roles = [],
    isLoading: isLoadingRoles,
    isFetching: isFetchingRoles,
  } = useQuery<Role[]>({
    queryKey: ['organizationRoles', organization?.id],
    queryFn: async () => organizationServices.getRoles(organization?.id),
    enabled: !!organization?.id,
  });

  const validationSchema = yup.object({
    name: yup.string().required(newRoleDict.validation.nameRequired),
    description: yup.string().optional(),
    organization_id: yup.string().required(),
  });

  const { setError, reset } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      organization_id: organization?.id,
    },
  });

  const deleteRole = (role: Role) => {
    showDialog({
      variant: 'confirm',
      title: roleManagementDict.buttons.confirmDelete.title.replace(
        '{roleName}',
        role.name
      ),
      content: roleManagementDict.buttons.confirmDelete.content,
      onYes: async () => {
        hideDialog();
        try {
          const res = await axios.put(
            `/api/organizations/${organization?.id}/delete-role`,
            { role_id: role.id }
          );
          enqueueSnackbar(roleManagementDict.messages.deleteSuccess, {
            variant: 'success',
          });

          await queryClient.invalidateQueries({
            queryKey: ['organizationRoles', organization?.id],
          });
        } catch (err: any) {
          enqueueSnackbar(roleManagementDict.messages.deleteError, {
            variant: 'error',
          });
        }
      },
    });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedRole(null);
  };

  const addRole = useMutation<
    AddRoleResponse,
    AxiosError<ApiErrorResponse>,
    FormValues
  >({
    mutationFn: (data: FormValues) => organizationServices.addRole(data),
    onSuccess: (data) => {
      enqueueSnackbar(newRoleDict.messages.success, {
        variant: 'success',
      });
      queryClient.invalidateQueries({
        queryKey: [`organizationRoles`],
      });
      reset();
    },
    onError: (error) => {
      if (
        error?.response?.data &&
        error?.response?.status === 400 &&
        error?.response?.data?.validation_errors
      ) {
        const validationErrors = error.response.data.validation_errors;
        Object.keys(validationErrors).forEach((fieldName) => {
          const errorMessages = validationErrors[fieldName];
          setError(fieldName as keyof FormValues, {
            type: 'manual',
            message: errorMessages.join('<br/>'),
          });
        });
      } else {
        enqueueSnackbar(newRoleDict.messages.error, { variant: 'error' });
      }
    },
  });

  const updateRoleFn = useMutation<any, any, FormValues>({
    mutationFn: (data: FormValues) => organizationServices.updateRole(data),
    onSuccess: (data) => {
      enqueueSnackbar('Role Update success', {
        variant: 'success',
      });
      queryClient.invalidateQueries({
        queryKey: [`organizationRoles`],
      });
      setIsEditMode(false);
      setEditedRole(null);
      reset();
    },
    onError: (error) => {
      enqueueSnackbar('error updating role', { variant: 'error' });
    },
  });

  const RoleAccordion: React.FC<{ role: Role }> = ({ role }) => {
    const [checkedPermissions, setCheckedPermissions] = useState<number[]>(
      role.permissions
        .filter((rolePermission) =>
          permissions?.some(
            (permission: Permission) => permission.id === rolePermission.id
          )
        )
        .map((permission) => permission.id)
    );

    const [isSavingRole, setIsSavingRole] = useState(false);
    const [roleIsNotTouched, setRoleIsNotTouched] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPermissions =
      permissions?.filter((permission: Permission) =>
        permission.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) || [];

    const groupedPermissions = groupPermissionsByModule(filteredPermissions);

    const allPermissionsChecked =
      filteredPermissions.length > 0 &&
      filteredPermissions.every((permission: Permission) =>
        checkedPermissions.includes(permission.id)
      );
    const somePermissionsChecked =
      filteredPermissions.some((permission: Permission) =>
        checkedPermissions.includes(permission.id)
      ) && !allPermissionsChecked;

    const saveRole = async () => {
      if (roleIsNotTouched) {
        enqueueSnackbar(roleManagementDict.messages.noChanges, {
          variant: 'info',
        });
        return;
      }

      setIsSavingRole(true);
      try {
        const response = await axios.put(
          `/api/organizations/${organization?.id}/edit-role`,
          {
            role_id: role.id,
            permission_ids: checkedPermissions,
          }
        );
        enqueueSnackbar(roleManagementDict.messages.updateSuccess, {
          variant: 'success',
        });
        queryClient.invalidateQueries({
          queryKey: ['organizationRoles', organization?.id],
        });
        setRoleIsNotTouched(true);
      } catch (error: any) {
        enqueueSnackbar(roleManagementDict.messages.updateError, {
          variant: 'error',
        });
      } finally {
        setIsSavingRole(false);
      }
    };

    return (
      <Grid size={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            {!isEditMode || editedRole?.id !== role.id ? (
              <>
                <Typography variant='h4'>{role.name}</Typography>
                {role.description && (
                  <Typography ml={1} variant='caption'>
                    - {role.description}
                  </Typography>
                )}
              </>
            ) : (
              <Grid size={12}>
                <NewRoleForm
                  isEditMode={isEditMode}
                  isLoading={updateRoleFn.isPending}
                  role={editedRole}
                  handleCancelEdit={handleCancelEdit}
                  handleFormSubmit={(data) => {
                    isEditMode && role !== null
                      ? (data.role_id = role?.id)
                      : (data.role_id = null);
                    const newFormValue = data;
                    isEditMode
                      ? updateRoleFn.mutate(newFormValue)
                      : addRole.mutate(data);
                  }}
                />
              </Grid>
            )}
          </AccordionSummary>
          <AccordionDetails>
            {editedRole?.id !== role.id && (
              <Grid container columnSpacing={2}>
                {role.id > 1 && (
                  <>
                    <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                      <TextField
                        label={roleManagementDict.search}
                        variant='outlined'
                        size='small'
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3, lg: 6 }}>
                      <FormControlLabel
                        label={roleManagementDict.selectAll}
                        control={
                          <Checkbox
                            checked={allPermissionsChecked}
                            indeterminate={somePermissionsChecked}
                            onChange={(event) => {
                              setRoleIsNotTouched(false);
                              if (event.target.checked) {
                                setCheckedPermissions((prev) =>
                                  Array.from(
                                    new Set([
                                      ...prev,
                                      ...filteredPermissions.map((p) => p.id),
                                    ])
                                  )
                                );
                              } else {
                                setCheckedPermissions((prev) =>
                                  prev.filter(
                                    (id) =>
                                      !filteredPermissions.some(
                                        (p) => p.id === id
                                      )
                                  )
                                );
                              }
                            }}
                          />
                        }
                      />
                    </Grid>
                    <Grid
                      size={{ xs: 6, md: 3 }}
                      sx={{
                        position: 'relative',
                      }}
                    >
                      {isEditMode && editedRole?.id === role.id ? (
                        <Button
                          variant='contained'
                          color='error'
                          size='small'
                          sx={{
                            position: 'absolute',
                            right: 0,
                          }}
                          onClick={() => {
                            setIsEditMode(false);
                            setEditedRole(null);
                          }}
                        >
                          Cancel
                        </Button>
                      ) : (
                        <Tooltip title={newRoleDict.buttons.edit}>
                          <IconButton
                            size='small'
                            sx={{
                              position: 'absolute',
                              right: 0,
                            }}
                            onClick={() => {
                              setIsEditMode(true);
                              setEditedRole(role);
                            }}
                          >
                            <EditOutlined fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Grid>
                    <Grid size={12}>
                      <Divider />
                    </Grid>
                  </>
                )}
                {Object.entries(groupedPermissions).map(
                  ([moduleName, moduleData]: [string, PermissionModuleGroup]) => (
                    <Grid size={12} key={moduleName} mb={0.5}>
                      <Accordion disableGutters>
                        <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                          <Typography variant='h6'>
                            {moduleData.displayName}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={1}>
                            {moduleData.permissions.map((permission: Permission) => (
                              <Grid
                                size={{ xs: 12, md: 6, lg: 4, xl: 3 }}
                                key={permission.id}
                              >
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      value={permission.id}
                                      disabled={
                                        role.id === 1 ||
                                        (role.id > 1 &&
                                          !checkOrganizationPermission(
                                            PERMISSIONS.ROLES_UPDATE
                                          ))
                                      }
                                      checked={checkedPermissions.includes(permission.id)}
                                      onChange={(e) => {
                                        setRoleIsNotTouched(false);
                                        const permissionId = parseInt(
                                          e.target.value.toString()
                                        );
                                        setCheckedPermissions((prev) =>
                                          e.target.checked
                                            ? [...prev, permissionId]
                                            : prev.filter((id) => id !== permissionId)
                                        );
                                      }}
                                    />
                                  }
                                  label={permission.name}
                                />
                              </Grid>
                            ))}
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )
                )}
                {role.id > 1 && (
                  <Grid size={12}>
                    <Divider />
                    <Stack
                      direction='row'
                      spacing={1}
                      mt={1}
                      justifyContent='flex-end'
                    >
                      {checkOrganizationPermission(PERMISSIONS.ROLES_ADD) && (
                        <Button
                          sx={{ marginLeft: 0.5 }}
                          onClick={() => deleteRole(role)}
                          size='small'
                          variant='contained'
                          color='error'
                        >
                          {roleManagementDict.buttons.delete}
                        </Button>
                      )}
                      {checkOrganizationPermission(
                        PERMISSIONS.ROLES_UPDATE
                      ) && (
                        <LoadingButton
                          disabled={roleIsNotTouched}
                          loading={isSavingRole}
                          onClick={saveRole}
                          size='small'
                          variant='contained'
                          color='primary'
                        >
                          {roleManagementDict.buttons.save}
                        </LoadingButton>
                      )}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            )}
          </AccordionDetails>
        </Accordion>
      </Grid>
    );
  };

  if (isLoadingRoles || isLoadingPermissions || isFetchingRoles) {
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton variant="text" width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
        <Skeleton variant="rectangular" width="100%" height={48} style={{ borderRadius: 4 }} />
        <Skeleton variant="rectangular" width="100%" height={32} style={{ borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <Grid mt={1} container rowSpacing={1} columnSpacing={2}>
      {checkOrganizationPermission(PERMISSIONS.ROLES_ADD) && (
        <Grid size={12}>
          <NewRoleForm
            isEditMode={false}
            role={null}
            isLoading={addRole.isPending}
            handleFormSubmit={(data) => {
              addRole.mutate(data);
            }}
          />
        </Grid>
      )}
      {roles?.map((role: Role) => (
        <RoleAccordion key={role.id} role={role} />
      ))}
    </Grid>
  );
};

export default OrganizationRoles;