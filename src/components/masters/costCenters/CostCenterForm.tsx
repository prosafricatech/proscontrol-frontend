import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import UsersSelector from '../../sharedComponents/UsersSelector';
import costCenterservices from './cost-center-services';
import { CostCenter } from './CostCenterType';

interface User {
  id: number;
  name: string;
  [key: string]: any;
}

interface CostCenterFormProps {
  setOpenDialog: (open: boolean) => void;
  costCenter?: CostCenter | null;
}

interface FormData extends Omit<CostCenter, 'users' | 'cost_centerable'> {
  user_ids: number[];
}

interface CostCenterResponse {
  message: string;
}

const CostCenterForm: React.FC<CostCenterFormProps> = ({
  setOpenDialog,
  costCenter,
}) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { mutate: addCostCenter, isPending } = useMutation({
    mutationFn: costCenterservices.add,
    onSuccess: (data: CostCenterResponse) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['costCenters'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
    },
  });

  const { mutate: updateCostCenter, isPending: updateIsLoading } = useMutation({
    mutationFn: costCenterservices.update,
    onSuccess: (data: CostCenterResponse) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['costCenters'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
    },
  });

  const validationSchema = yup.object({
    name: yup.string().required('Cost Center Name is required'),
    description: yup.string().nullable(),
    user_ids: yup
      .array()
      .of(yup.number())
      .min(1, 'At least one user is required'),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: costCenter?.id,
      name: costCenter?.name || '',
      code: costCenter?.code || null,
      description: costCenter?.description || null,
      status: costCenter?.status || '',
      type: costCenter?.type || '',
      user_ids: costCenter?.users?.map((user: User) => Number(user.id)) || [],
    },
  });

  const onSubmit = (data: FormData) => {
    if (costCenter?.id) {
      updateCostCenter({ ...data, id: costCenter.id });
    } else {
      addCostCenter(data);
    }
  };

  return (
    <>
      <DialogTitle>
        <Grid container justifyContent='center'>
          {costCenter ? `Edit ${costCenter.name}` : 'Create New Cost Center'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField
                label='Cost Center name'
                fullWidth
                size='small'
                variant='outlined'
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
              />
            </Grid>

            <Grid size={12}>
              <UsersSelector
                label='Cost Center Users'
                multiple={true}
                defaultValue={costCenter?.users}
                onChange={(value: User | User[] | null) => {
                  const usersArray = value
                    ? Array.isArray(value)
                      ? value
                      : [value]
                    : [];
                  setValue(
                    'user_ids',
                    usersArray.map((u) => Number(u.id)),
                    {
                      shouldValidate: true,
                    }
                  );
                }}
                frontError={errors.user_ids}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                label='Description'
                fullWidth
                size='small'
                multiline
                rows={2}
                variant='outlined'
                {...register('description')}
              />
            </Grid>
          </Grid>

          <DialogActions sx={{ mt: 2 }}>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              loading={isPending || updateIsLoading}
            >
              {costCenter ? 'Update' : 'Create'}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default CostCenterForm;
