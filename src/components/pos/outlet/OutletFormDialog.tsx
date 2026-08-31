import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { Ledger } from '@/components/accounts/ledgers/LedgerType';
import ProjectSelector from '@/components/projectManagement/projects/ProjectSelector';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import ProductCategoriesSelector from '@/components/productAndServices/productCategories/ProductCategoriesSelector';
import UsersSelector from '@/components/sharedComponents/UsersSelector';
import { User } from '@/types/auth-types';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { MODULES } from '@/utilities/constants/modules';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { DisabledByDefault } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useMemo } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import * as yup from 'yup';
import outletServices from './outlet-services';
import type {
  AddOutletResponse,
  Outlet,
  UpdateOutletResponse,
} from './OutletType';

interface OutletFormProps {
  outlet?: Outlet;
  setOpenDialog: (open: boolean) => void;
}

interface FormData {
  id?: any;
  name: string;
  address?: string;
  type: string;
  users: User;
  stores: { name: string; id: number }[];
  counters: {
    name: string;
    ledger_ids: number[];
    ledgers?: Ledger[];
  }[];
  project_id?: number | null;
  product_categories?: { name: string; id: number }[];
}

const OUTLET_TYPES = [
  { value: 'work center', name: 'Work Center' },
  { value: 'shop', name: 'Shop' },
  { value: 'fuel Station', name: 'Fuel Station' },
  { value: 'manufacturing', name: 'Manufacturing' },
];

const validationSchema = yup.object({
  name: yup.string().required('Outlet name is required'),
  address: yup.string().optional(),
  type: yup.string().required('Outlet type is required'),
  project_id: yup.number().nullable().optional(),
  users: yup
    .array()
    .of(
      yup.object({
        id: yup.number().required(),
        name: yup.string().required(),
      })
    )
    .when('project_id', {
      is: (value: number | null | undefined) => !value,
      then: (schema) =>
        schema
          .min(1, 'At least one user is required')
          .required('At least one user is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
  stores: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required(),
        id: yup.number().required(),
      })
    )
    .min(1, 'At least one store is required')
    .required('At least one store is required'),
  product_categories: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required(),
        id: yup.number().required(),
      })
    )
    .optional(),
  counters: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required('Counter name is required'),
        ledger_ids: yup
          .array()
          .of(yup.number().required())
          .min(1, 'At least one ledger account is required')
          .required(),
      })
    )
    .min(1, 'At least one counter is required')
    .required(),
});

const OutletFormDialog: React.FC<OutletFormProps> = ({
  outlet,
  setOpenDialog,
}) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { organizationHasSubscribed } = useJumboAuth();
  const hasProjectManagement = organizationHasSubscribed(
    MODULES.PROJECT_MANAGEMENT
  );
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      id: outlet?.id,
      name: outlet ? outlet.name : '',
      address: outlet?.address || '',
      type: outlet?.type?.toLowerCase() || 'shop',
      counters: outlet?.id
        ? outlet.counters.map(
            (counter: {
              name: string;
              ledger_ids: number[];
              ledgers?: Ledger[];
            }) => ({
              ...counter,
              ledger_ids: counter.ledgers?.map((ledger: Ledger) => ledger.id),
            })
          )
        : [{ name: '', ledger_ids: [] }],
      users: outlet?.users || [],
      stores: outlet?.stores || [],
      product_categories: outlet?.product_categories || [],
      project_id: outlet?.project?.id ?? null,
    },
    resolver: yupResolver(validationSchema) as any,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'counters',
  });

  const projectId = useWatch({ control, name: 'project_id' });

  const { mutate: addOutlet, isPending: addLoading } = useMutation<
    AddOutletResponse,
    unknown,
    Outlet
  >({
    mutationFn: outletServices.add,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['Outlets'] });
      setOpenDialog(false);
    },
    onError: (error: unknown) => {
      let message = getErrorMessage(error);

      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const { mutate: updateOutlet, isPending: updateLoading } = useMutation<
    UpdateOutletResponse,
    unknown,
    Outlet & { id: number }
  >({
    mutationFn: outletServices.update,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['Outlets'] });
      setOpenDialog(false);
    },
    onError: (error: unknown) => {
      let message = getErrorMessage(error);

      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const saveMutation = useMemo(() => {
    return outlet?.id ? updateOutlet : addOutlet;
  }, [outlet, updateOutlet, addOutlet]);

  const onSubmit = (formData: FormData) => {
    const dataToSend = {
      ...formData,
      user_ids: formData.users.map((user: User) => user.id),
      ...(outlet?.id ? { id: outlet.id } : {}),
    };

    saveMutation(dataToSend as any);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogTitle sx={{ textAlign: 'center' }}>
        {!outlet ? 'New Outlet Form' : `Edit ${outlet.name}`}
      </DialogTitle>
      <DialogContent>
        <Grid container columnSpacing={1}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <TextField
                fullWidth
                label='Name'
                size='small'
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <Controller
                name='type'
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={OUTLET_TYPES}
                    getOptionLabel={(opt) => opt.name}
                    isOptionEqualToValue={(a, b) => a.value === b.value}
                    onChange={(_, val) => field.onChange(val?.value)}
                    value={
                      outlet
                        ? OUTLET_TYPES.find(
                            (opt) =>
                              opt.value.toLowerCase() ===
                              outlet?.type?.toLowerCase()
                          )
                        : OUTLET_TYPES.find((opt) => opt.value === field.value)
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Type'
                        size='small'
                        error={!!errors.type}
                        helperText={errors.type?.message}
                      />
                    )}
                  />
                )}
              />
            </Div>
          </Grid>
          <Grid size={12}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <TextField
                fullWidth
                label='Address'
                size='small'
                {...register('address')}
                error={!!errors.address}
                helperText={errors.address?.message}
              />
            </Div>
          </Grid>
          {hasProjectManagement && (
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='project_id'
                  control={control}
                  render={({ field }) => (
                    <ProjectSelector
                      label='Project (optional — sells on the project cost center)'
                      defaultValue={outlet?.project ?? null}
                      onChange={(project) => field.onChange(project?.id ?? null)}
                    />
                  )}
                />
              </Div>
            </Grid>
          )}
          <Grid size={12}>
            <Grid container spacing={1}>
              <Grid size={12}>
                <Typography mb={0.5}>Counters</Typography>
                {fields.map((item, index) => (
                  <Grid
                    container
                    columnSpacing={1}
                    alignItems='center'
                    key={item.id}
                  >
                    <Grid size={{ xs: 12, md: fields.length > 1 ? 5.5 : 6 }}>
                      <Div sx={{ mt: 0.3, mb: 0.3 }}>
                        <TextField
                          fullWidth
                          size='small'
                          label='Counter Name'
                          {...register(`counters.${index}.name`)}
                          error={!!errors?.counters?.[index]?.name}
                          helperText={errors?.counters?.[index]?.name?.message}
                        />
                      </Div>
                    </Grid>
                    <Grid size={{ xs: 12, md: fields.length > 1 ? 5.5 : 6 }}>
                      <Div sx={{ mt: 0.3, mb: 0.3 }}>
                        <Controller
                          control={control}
                          name={`counters.${index}.ledger_ids`}
                          render={({ field }) => (
                            <LedgerSelect
                              multiple
                              label='Ledger Accounts'
                              defaultValue={outlet ? item.ledgers : null}
                              onChange={(val) => {
                                if (Array.isArray(val)) {
                                  field.onChange(val.map((v) => v.id));
                                } else {
                                  field.onChange([]);
                                }
                              }}
                              frontError={errors?.counters?.[index]?.ledger_ids}
                            />
                          )}
                        />
                      </Div>
                    </Grid>
                    <Grid size={{ xs: 12, md: 1 }} textAlign='end'>
                      {fields.length > 1 && (
                        <IconButton onClick={() => remove(index)} color='error'>
                          <DisabledByDefault />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                ))}
              </Grid>
              <Grid size={12} textAlign={'end'}>
                <Button
                  variant='outlined'
                  size='small'
                  startIcon={<AddIcon />}
                  onClick={() => append({ name: '', ledger_ids: [] })}
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </Grid>
          <Grid size={12} sx={{ mt: 1, mb: 1 }}>
            <Controller
              name='stores'
              control={control}
              render={({ field }) => (
                <StoreSelector
                  multiple
                  allowSubStores={true}
                  defaultValue={outlet ? outlet.stores : []}
                  onChange={field.onChange}
                  frontError={errors.stores as any}
                />
              )}
            />
          </Grid>
          <Grid size={12} sx={{ mt: 1, mb: 1 }}>
            <Typography variant='body2' color='text.secondary' mb={0.5}>
              Restrict this outlet to selling only products from selected
              categories. Leave empty to allow all products.
            </Typography>
            <Controller
              name='product_categories'
              control={control}
              render={({ field }) => (
                <ProductCategoriesSelector
                  multiple
                  defaultValue={outlet ? outlet.product_categories : []}
                  onChange={field.onChange}
                  frontError={errors.product_categories as any}
                />
              )}
            />
          </Grid>
          <Grid size={12} sx={{ mt: 1, mb: 1 }}>
            {projectId ? (
              <Div>
                <Typography variant='body2' color='text.secondary' mb={0.5}>
                  Users are managed via the linked project&apos;s cost center,
                  not per outlet.
                </Typography>
                <Stack direction='row' flexWrap='wrap' gap={0.5}>
                  {(outlet?.users ?? []).map((user) => (
                    <Chip key={user.id} label={user.name} size='small' />
                  ))}
                </Stack>
              </Div>
            ) : (
              <Controller
                name='users'
                control={control}
                render={({ field }) => (
                  <UsersSelector
                    multiple
                    defaultValue={outlet && outlet.users}
                    onChange={field.onChange}
                    frontError={errors.users}
                  />
                )}
              />
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)} size='small'>
          Cancel
        </Button>
        <LoadingButton
          type='submit'
          variant='contained'
          size='small'
          loading={addLoading || updateLoading}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </form>
  );
};

export default OutletFormDialog;
