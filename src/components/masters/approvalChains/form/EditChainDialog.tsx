import { Autocomplete, Button, DialogActions, DialogTitle, Grid, TextField } from '@mui/material'
import React from 'react'
import { LoadingButton } from '@mui/lab';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, SubmitHandler } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import approvalChainsServices from '../approvalChainsServices';
import CostCenterSelector from '../../costCenters/CostCenterSelector';
import DepartmentSelector from '../../../humanResources/departments/DepartmentSelector';
import { DepartmentsProvider } from '../../../humanResources/departments/DepartmentsProvider';
import { getProcessTypes, DEPARTMENT_SCOPABLE_PROCESS_TYPES } from '@/utilities/constants/processTypes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import { CostCenter } from '../../costCenters/CostCenterType';
import { Department } from '../../../humanResources/departments/DepartmentsType';
import { ApprovalChain } from '../ApprovalChainType';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';

interface FormValues {
  id: number;
  process_type: string;
  remarks?: string;
  cost_center_id?: number | null;
  department_id?: number | null;
}

interface EditChainDialogProps {
  toggleOpen: (open: boolean) => void;
  approvalChain: ApprovalChain
}

function EditChainDialog({ toggleOpen, approvalChain }: EditChainDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { organizationHasSubscribed } = useJumboAuth();
  const [selectedProcessType, setSelectedProcessType] = React.useState<string>(approvalChain.process_type);

  const validationSchema = yup.object({
    process_type: yup.string().required('Process Type is required').typeError('Process Type is required'),
    cost_center_id: yup.number().nullable(),
    department_id: yup.number().nullable(),
  });

  const processTypeOptions = React.useMemo(
    () => getProcessTypes(organizationHasSubscribed(MODULES.HUMAN_RESOURCES)),
    [organizationHasSubscribed]
  );

  // A chain that predates department scoping may still carry a cost_center_id
  // — don't resubmit it as-is once the process type is department-scoped, or
  // the backend's "cost center scoping is retired for this type" guard blocks
  // an otherwise-unrelated edit (e.g. just changing the remarks).
  const isDepartmentScoped = DEPARTMENT_SCOPABLE_PROCESS_TYPES.includes(approvalChain.process_type);

  const { handleSubmit, setValue, register, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: approvalChain.id,
      process_type: approvalChain.process_type,
      remarks: approvalChain.remarks || undefined,
      cost_center_id: isDepartmentScoped ? null : (approvalChain.cost_center_id ?? null),
      department_id: approvalChain.department_id ?? null,
    }
  });

  const editApprovalChain = useMutation({
    mutationFn: (data: FormValues) => approvalChainsServices.editApprovalChain(data),
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['approvalChains'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message && enqueueSnackbar(error.response.data.message, { variant: 'error' });
    }
  });

  const onSubmit: SubmitHandler<FormValues> = (formData) => {
    editApprovalChain.mutate(formData);
  };

  return (
    <DepartmentsProvider>
      <DialogTitle>
        <Grid container columnSpacing={2}>
          <Grid size={12} textAlign={"center"} mb={2}>
            {'Edit Approval Chain'}
          </Grid>
          <Grid size={12}>
            <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              <Grid container columnSpacing={1} rowSpacing={2}>
                <Grid size={{xs: 12, md: 3}}>
                  <Div sx={{ mt: 0.3 }}>
                    <Autocomplete
                      id="checkboxes-process_type"
                      options={processTypeOptions}
                      defaultValue={approvalChain.process_type}
                      isOptionEqualToValue={(option, value) => option === value}
                      getOptionLabel={(option) => option}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Process Type"
                          size="small"
                          fullWidth
                          error={!!errors.process_type}
                          helperText={errors.process_type?.message}
                        />
                      )}
                      onChange={(e, newValue: string | null) => {
                        setValue('process_type', newValue ?? '', {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setSelectedProcessType(newValue ?? '');
                        if (!newValue || !DEPARTMENT_SCOPABLE_PROCESS_TYPES.includes(newValue)) {
                          setValue('department_id', null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        } else {
                          setValue('cost_center_id', null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }
                      }}
                    />
                  </Div>
                </Grid>
                {!DEPARTMENT_SCOPABLE_PROCESS_TYPES.includes(selectedProcessType) && (
                  <Grid size={{xs: 12, md: 3}}>
                    <Div sx={{ mt: 0.3 }}>
                      <CostCenterSelector
                        multiple={false}
                        label="Cost Center"
                        withNotSpecified={true}
                        defaultValue={approvalChain?.cost_center as CostCenter || null}
                        onChange={(newValue) => {
                          if (newValue && !Array.isArray(newValue)) {
                            setValue('cost_center_id', newValue.id, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          } else {
                            setValue('cost_center_id', null, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }
                        }}
                      />
                    </Div>
                  </Grid>
                )}
                {DEPARTMENT_SCOPABLE_PROCESS_TYPES.includes(selectedProcessType) && (
                  <Grid size={{xs: 12, md: 3}}>
                    <Div sx={{ mt: 0.3 }}>
                      <DepartmentSelector
                        multiple={false}
                        label="Department"
                        defaultValue={approvalChain?.department as Department || null}
                        onChange={(newValue) => {
                          if (newValue && !Array.isArray(newValue)) {
                            setValue('department_id', newValue.id, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          } else {
                            setValue('department_id', null, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }
                        }}
                      />
                    </Div>
                  </Grid>
                )}
                <Grid size={{xs: 12, md: 3}}>
                  <Div sx={{ mt: 0.3 }}>
                    <TextField
                      label="Remarks"
                      size="small"
                      multiline={true}
                      minRows={2}
                      fullWidth
                      {...register('remarks')}
                    />
                  </Div>
                </Grid>
              </Grid>
            </form>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={editApprovalChain.isPending}
          variant='contained'
          onClick={handleSubmit(onSubmit)}
          size='small'
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </DepartmentsProvider>
  )
}

export default EditChainDialog;