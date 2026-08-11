import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import LedgerGroupProvider from '@/components/accounts/ledgerGroups/LedgerGroupProvider';
import QuickAddLedger from '@/components/accounts/ledgers/forms/QuickAddLedger';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Tooltip,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import * as yup from 'yup';
import LedgerSelect from '../../accounts/ledgers/forms/LedgerSelect';
import productCategoryServices from './productCategoryServices';
import {
  ProductCategory,
  ProductCategoryFormData,
  productCategoryOption,
} from './ProductCategoryType';

interface ProductCategoryFormDialogContentProps {
  title?: string;
  onClose: () => void;
  productCategory?: ProductCategory | null;
  productCategories: productCategoryOption[];
}

interface Ledger {
  id: number;
  name: string;
  code: string | null;
  ledger_group_id: number;
  alias: string | null;
  nature_id?: number;
}

const ProductCategoryFormDialogContent: React.FC<
  ProductCategoryFormDialogContentProps
> = ({
  title = 'New Category',
  onClose,
  productCategory = null,
  productCategories,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary();

  const [openQuickAddLedger, setOpenQuickAddLedger] = useState(false);
  const [ledgertType, setLedgertType] = useState<'credit' | 'debit'>('credit');
  const [recentlyAddedIncomeLedger, setRecentlyAddedIncomeLedger] =
    useState<Ledger | null>(null);
  const [recentlyAddedExpenseLedger, setRecentlyAddedExpenseLedger] =
    useState<Ledger | null>(null);

  const addProductCategory = useMutation({
    mutationFn: productCategoryServices.add,
    onSuccess: (data) => {
      onClose();
      enqueueSnackbar(
        dictionary.productCategories.form.messages.createSuccess,
        { variant: 'success' }
      );
      queryClient.invalidateQueries({ queryKey: ['productCategoryOptions'] });
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const updateProductCategory = useMutation({
    mutationFn: productCategoryServices.update,
    onSuccess: (data) => {
      onClose();
      enqueueSnackbar(
        dictionary.productCategories.form.messages.updateSuccess,
        { variant: 'success' }
      );
      queryClient.invalidateQueries({ queryKey: ['productCategoryOptions'] });
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    name: yup
      .string()
      .required(
        dictionary.productCategories.form.errors.validation.name.required
      ),
    parent_id: yup.number().nullable(),
    income_ledger_id: yup
      .number()
      .required(
        dictionary.productCategories.form.errors.validation.income_ledger_id
          .required
      )
      .positive(
        dictionary.productCategories.form.errors.validation.income_ledger_id
          .positive
      ),
    expense_ledger_id: yup
      .number()
      .required(
        dictionary.productCategories.form.errors.validation.expense_ledger_id
          .required
      )
      .positive(
        dictionary.productCategories.form.errors.validation.expense_ledger_id
          .positive
      ),
    description: yup.string().optional(),
    id: yup.number().optional(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ProductCategoryFormData>({
    resolver: yupResolver(validationSchema as any),
    defaultValues: {
      parent_id: productCategory?.parent_id ?? null,
      name: productCategory?.name ?? '',
      description: productCategory?.description ?? '',
      id: productCategory?.id,
      income_ledger_id: productCategory?.income_ledger_id ?? 0,
      expense_ledger_id: productCategory?.expense_ledger_id ?? 0,
    },
  });

  // ✅ ADD THIS MISSING onSubmit FUNCTION
  const onSubmit: SubmitHandler<ProductCategoryFormData> = (data) => {
    if (productCategory?.id) {
      updateProductCategory.mutate({ ...data, id: productCategory.id });
    } else {
      addProductCategory.mutate(data);
    }
  };

  return (
    <>
      <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
        {' '}
        {/* ✅ Now onSubmit exists */}
        <DialogTitle>{dictionary.productCategories.form.title}</DialogTitle>
        <DialogContent>
          <Grid container p={1} spacing={1} rowGap={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={dictionary.productCategories.form.labels.categoryName}
                size='small'
                error={Boolean(
                  errors.name ||
                  addProductCategory.error?.response?.data?.validation_errors
                    ?.name ||
                  updateProductCategory.error?.response?.data?.validation_errors
                    ?.name
                )}
                helperText={
                  errors.name?.message ||
                  addProductCategory.error?.response?.data?.validation_errors
                    ?.name ||
                  updateProductCategory.error?.response?.data?.validation_errors
                    ?.name
                }
                {...register('name')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                size='small'
                isOptionEqualToValue={(
                  option: productCategoryOption,
                  value: productCategoryOption
                ) => option.id === value.id}
                options={productCategories}
                getOptionLabel={(option: productCategoryOption) => option.name}
                defaultValue={
                  productCategories.find(
                    (parent: productCategoryOption) =>
                      parent.id === productCategory?.parent_id
                  ) || null
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={
                      dictionary.productCategories.form.labels.parentCategory
                    }
                    error={Boolean(errors.parent_id)}
                    helperText={errors.parent_id?.message}
                  />
                )}
                onChange={(event, newValue: productCategoryOption | null) => {
                  if (productCategory && productCategory?.id === newValue?.id) {
                    setValue('parent_id', null);
                    setError('parent_id', {
                      message: 'Cannot be a parent of its own',
                    });
                  } else {
                    setValue('parent_id', newValue ? newValue.id : null, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LedgerSelect
                label={dictionary.productCategories.form.labels.incomeLedger}
                allowedGroups={['Sales and Revenue']}
                frontError={errors.income_ledger_id}
                key={recentlyAddedIncomeLedger?.id || 'income-ledger'}
                value={recentlyAddedIncomeLedger || undefined}
                defaultValue={productCategory?.income_ledger || undefined}
                onChange={(newValue) => {
                  if (newValue && !Array.isArray(newValue)) {
                    setRecentlyAddedIncomeLedger(newValue);
                    setValue('income_ledger_id', newValue.id, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  } else {
                    setRecentlyAddedIncomeLedger(null);
                    setValue('income_ledger_id', 0, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                }}
                startAdornment={
                  <Tooltip
                    title={'Quick Add Ledger'}
                    onClick={() => {
                      setLedgertType('credit');
                      setOpenQuickAddLedger(true);
                    }}
                  >
                    <AddOutlined sx={{ cursor: 'pointer' }} />
                  </Tooltip>
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LedgerSelect
                label={dictionary.productCategories.form.labels.expenseLedger}
                allowedGroups={['Direct Expenses', 'Indirect Expenses']}
                frontError={errors.expense_ledger_id}
                key={recentlyAddedExpenseLedger?.id || 'expense-ledger'}
                value={recentlyAddedExpenseLedger || undefined}
                defaultValue={productCategory?.expense_ledger || undefined}
                onChange={(newValue) => {
                  if (newValue && !Array.isArray(newValue)) {
                    setRecentlyAddedExpenseLedger(newValue);
                    setValue('expense_ledger_id', newValue.id, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  } else {
                    setRecentlyAddedExpenseLedger(null);
                    setValue('expense_ledger_id', 0, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                }}
                startAdornment={
                  <Tooltip
                    title={'Quick Add Ledger'}
                    onClick={() => {
                      setLedgertType('debit');
                      setOpenQuickAddLedger(true);
                    }}
                  >
                    <AddOutlined sx={{ cursor: 'pointer' }} />
                  </Tooltip>
                }
              />
            </Grid>
            <Grid size={12}>
              <TextField
                multiline
                label={dictionary.productCategories.form.labels.description}
                fullWidth
                size='small'
                rows={2}
                {...register('description')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button size='small' onClick={onClose}>
            {dictionary.productCategories.form.buttons.cancel}
          </Button>
          <LoadingButton
            variant='contained'
            type='submit'
            loading={
              addProductCategory.isPending || updateProductCategory.isPending
            }
            size='small'
          >
            {dictionary.productCategories.form.buttons.save}
          </LoadingButton>
        </DialogActions>
      </form>

      <Dialog open={openQuickAddLedger} maxWidth={'md'}>
        <LedgerGroupProvider>
          <QuickAddLedger
            ledgerType={ledgertType}
            toggleOpen={setOpenQuickAddLedger}
            heading='Quick Add Ledger'
            setAddedLedger={(v) => {
              if (ledgertType === 'credit') {
                setRecentlyAddedIncomeLedger(v);
                setValue('income_ledger_id', v.id, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              } else {
                setRecentlyAddedExpenseLedger(v);
                setValue('expense_ledger_id', v.id, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
            }}
          />
        </LedgerGroupProvider>
      </Dialog>
    </>
  );
};

export default ProductCategoryFormDialogContent;
