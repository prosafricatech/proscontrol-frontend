import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  TextField,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import * as yup from 'yup';
import approvalChainsServices from '../approvalChainsServices';
import { approvalChainsListItemContext } from '../ApprovalChainsListItem';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import organizationServices from '@/components/organizations/organizationServices';
import { Div } from '@jumbo/shared';
import { ApprovalChainLevel } from '../ApprovalChainType';

interface Role {
  id: number;
  name: string;
}

interface PositionIndexOption {
  label: string;
  position_index?: number | null;
  id: number | null;
}

interface FormValues {
  id?: number;
  approval_chain_id?: number;
  position_index?: number | null;
  can_finalize: number;
  can_override: number;
  label: string;
  remarks?: string | null;
  role_id?: number;
  role?: Role | null;
}

interface ApprovalChainLevelDialogProps {
  approvalChainLevel?: ApprovalChainLevel;
  toggleOpen: (open: boolean) => void;
  approvalChain?: { id: number };
}

const getValidationSchema = (approvalChain: ApprovalChainLevelDialogProps['approvalChain']) =>
  yup.object({
    label: yup.string().required('Label is required'),
    role_id: yup.number().required('Role is required').typeError('Role is required'),
    approval_chain_id: yup.number()
      .when([], {
        is: () => !!approvalChain,
        then: (schema) => schema.required('Approval chain is required').typeError('Approval chain is required'),
        otherwise: (schema) => schema.notRequired(),
      }),
    position_index: yup.number().nullable(),
    can_finalize: yup.number().nullable(),
    can_override: yup.number().nullable(),
    remarks: yup.string().nullable(),
  });

function ApprovalChainLevelDialog({
  approvalChainLevel,
  toggleOpen,
  approvalChain,
}: ApprovalChainLevelDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization } = useJumboAuth();
  const { approvalChainLevels = [] } = useContext(approvalChainsListItemContext);

  const [canFinalize, setCanFinalize] = useState(approvalChainLevel?.can_finalize === 1);
  const [canOverride, setCanOverride] = useState(approvalChainLevel?.can_override === 1);

  const isEditMode = !!approvalChainLevel?.id;

  const addNewChainLevel = useMutation({
    mutationFn: (data: FormValues) => approvalChainsServices.addNewChainLevel(data),
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['approvalChainLevels'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to add level';
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });

  const editApprovalChainLevel = useMutation({
    mutationFn: (data: FormValues) => approvalChainsServices.editApprovalChainLevel(data),
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['approvalChainLevels'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to update level';
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });

  const { data: roles, isLoading: isLoadingRoles, isFetching: isFetchingRoles } = useQuery<Role[]>({
    queryKey: ['organizationRoles', authOrganization?.organization?.id],
    queryFn: () => organizationServices.getRoles(authOrganization?.organization?.id!),
    enabled: !!authOrganization?.organization?.id,
  });

  const positionIndexOptions: PositionIndexOption[] = useMemo(
    () => [
      { label: 'At the beginning', position_index: null, id: null },
      ...approvalChainLevels.map((level) => ({
        label: `After ${level.role?.name ?? ''} ${level.label}`,
        position_index: level.position_index ?? null,
        id: level.id ?? null,
      })),
    ],
    [approvalChainLevels]
  );

  const {
    setValue,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(getValidationSchema(approvalChain)) as any,
    defaultValues: {
      id: approvalChainLevel?.id,
      approval_chain_id: approvalChain?.id,
      position_index: approvalChainLevel?.position_index ?? null,
      can_finalize: approvalChainLevel?.can_finalize ?? 0,
      can_override: approvalChainLevel?.can_override ?? 0,
      label: approvalChainLevel?.label ?? '',
      remarks: approvalChainLevel?.remarks ?? '',
      role_id: approvalChainLevel?.role_id,
      role: approvalChainLevel?.role ?? null,
    },
  });

  // Watch the role_id to update the Autocomplete value
  const selectedRoleId = watch('role_id');
  const selectedRole = watch('role');

  // Find the selected role from the roles list
  const selectedRoleValue = useMemo(() => {
    if (!roles) return null;
    // First try to find by role_id
    if (selectedRoleId) {
      const found = roles.find((r) => r.id === selectedRoleId);
      if (found) return found;
    }
    // Then try by the stored role object
    if (selectedRole) {
      const found = roles.find((r) => r.id === selectedRole.id);
      if (found) return found;
    }
    // Finally try the approvalChainLevel
    if (approvalChainLevel?.role) {
      const found = roles.find((r) => r.id === approvalChainLevel.role?.id);
      if (found) return found;
    }
    return null;
  }, [roles, selectedRoleId, selectedRole, approvalChainLevel]);

  // ✅ Ensure required hidden field is always set
  useEffect(() => {
    if (approvalChain?.id) {
      setValue('approval_chain_id', approvalChain.id, { shouldDirty: false, shouldValidate: true });
    }
  }, [approvalChain?.id, setValue]);

  const onSubmit: SubmitHandler<FormValues> = (formData) => {
    if (isEditMode) {
      editApprovalChainLevel.mutate(formData);
    } else {
      addNewChainLevel.mutate(formData);
    }
  };

  return (
    <>
      <DialogTitle>
        <Grid container columnSpacing={1}>
          <Grid size={12} textAlign="center">
            {isEditMode ? 'Edit Level' : 'Add New Chain Level'}
          </Grid>
        </Grid>
      </DialogTitle>

      <DialogContent>
        <form id="approval-chain-level-form" autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
          <Grid container columnSpacing={1} mb={1}>
            <Grid size={{ xs: 12, md: 4 }}>
              {(isFetchingRoles || isLoadingRoles) ? (
                <LinearProgress />
              ) : (
                <Div sx={{ mt: 1 }}>
                  <Autocomplete
                    options={roles || []}
                    value={selectedRoleValue}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    getOptionLabel={(option: Role) => option.name}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Role"
                        size="small"
                        fullWidth
                        error={!!errors.role_id}
                        helperText={errors.role_id?.message}
                      />
                    )}
                    onChange={(_, newValue: Role | null) => {
                      setValue('role_id', newValue?.id ?? undefined, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setValue('role', newValue ?? null, { shouldDirty: true });
                    }}
                  />
                </Div>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label="Label"
                  size="small"
                  fullWidth
                  error={!!errors.label}
                  helperText={errors.label?.message}
                  {...register('label')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <Autocomplete
                  options={positionIndexOptions.filter(
                    (opt) => opt.position_index !== approvalChainLevel?.position_index
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option.label}
                  renderInput={(params) => (
                    <TextField {...params} label="Position" size="small" fullWidth />
                  )}
                  onChange={(_, newValue) => {
                    const val =
                      newValue?.position_index !== null
                        ? (newValue?.position_index ?? 0) + 1
                        : null;

                    setValue('position_index', val, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label="Remarks"
                  size="small"
                  multiline
                  minRows={2}
                  fullWidth
                  {...register('remarks')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 6, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <Checkbox
                  checked={canFinalize}
                  size="small"
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setCanFinalize(checked);
                    setValue('can_finalize', checked ? 1 : 0, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
                Can Finalize
              </Div>
            </Grid>

            <Grid size={{ xs: 6, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <Checkbox
                  checked={canOverride}
                  size="small"
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setCanOverride(checked);
                    setValue('can_override', checked ? 1 : 0, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
                Can Override
              </Div>
            </Grid>
          </Grid>
        </form>
      </DialogContent>

      <DialogActions>
        <Button size="small" onClick={() => toggleOpen(false)}>
          Cancel
        </Button>

        <LoadingButton
          loading={editApprovalChainLevel.isPending || addNewChainLevel.isPending}
          variant="contained"
          size="small"
          type="submit"
          form="approval-chain-level-form"
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  );
}

export default ApprovalChainLevelDialog;