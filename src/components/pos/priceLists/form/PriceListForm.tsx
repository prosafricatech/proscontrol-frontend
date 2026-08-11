import { Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import React, { useState } from 'react';
import * as yup from "yup";
import PriceListsItemForm from './PriceListItemForm';
import { LoadingButton } from '@mui/lab';
import dayjs, { Dayjs } from 'dayjs';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import PriceListsItemRow from './PriceListItemRow';
import priceListServices from '../priceLists-services';
import { useSnackbar } from 'notistack';
import { HighlightOff } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import OutletSelector from '../../outlet/OutletSelector';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import { PriceList, PriceListItem } from '../PriceListType';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { Outlet } from '../../outlet/OutletType';

interface PriceListFormProps {
  toggleOpen: (open: boolean) => void;
  priceList?: PriceList | null;
}

interface FormValues {
  effective_date: string;
  sales_outlets: Array<{ id: number }>;
  items: PriceListItem[];
  narration?: string;
  cost_center_id?: number | null;
  store_id?: number | null;
  id?: number;
}

const PriceListForm: React.FC<PriceListFormProps & { fuelPriceLists?: boolean }> = ({ fuelPriceLists, toggleOpen, priceList = null }) => {
  const [effective_date] = useState<Dayjs>(priceList ? dayjs(priceList.effective_date) : dayjs());
  const [items, setItems] = useState<PriceListItem[]>(priceList ? priceList.items : []);
  const [applicableOutlets, setApplicableOutlets] = useState<any>(priceList ? priceList.items[0]?.sales_outlets || [] : []);
  const [costInsights, setCostInsights] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);

  const validationSchema = yup.object({
    effective_date: yup.string().required('Effective Date is required'),
    sales_outlets: yup.array().min(1, "You must add at least one outlet").of(
      yup.object().required('Outlet is required').typeError('Outlet is required')
    ).typeError('You must add at least one outlet'),
    items: yup.array().min(1, "You must add at least one item").typeError('You must add at least one item').of(
      yup.object().shape({
        product_id: yup.number().required("Product is required").positive('Product is required').typeError('Product is required'),
        price: yup.number().required("Price is required").positive("Price is required").typeError('Price is required'),
        bottom_cap: yup.number().positive("Invalid bottom cap").typeError('Invalid bottom cap'),
      })
    ),
  });

  const { 
    setValue, 
    setError, 
    handleSubmit, 
    watch, 
    register, 
    formState: { errors } 
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      effective_date: effective_date.toISOString(),
      id: priceList?.id,
      items: priceList?.items || [],
      sales_outlets: priceList?.items[0]?.sales_outlets || [],
      narration: priceList?.narration || undefined
    }
  });

  const addPriceList = useMutation({
    mutationFn: priceListServices.add,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['priceLists'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message && enqueueSnackbar(error.response.data.message, { variant: 'error' });
    }
  });
    
  const updatePriceList = useMutation({
    mutationFn: priceListServices.update,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['priceLists'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message && enqueueSnackbar(error.response.data.message, { variant: 'error' });
    }
  });

  const saveMutation = React.useMemo(() => {
    return priceList ? updatePriceList : addPriceList;
  }, [updatePriceList, addPriceList, priceList]);

  const onSubmit = () => {
    if (items.length === 0) {
      setError(`items`, {
        type: "manual",
        message: "You must add at least one item",
      });
      return;
    } else if (isDirty) {
      setShowWarning(true);
    } else {
      handleSubmit((data) => saveMutation.mutate(data))();
    }
  };  

const handleMainFormSubmit = async () => {
  // First trigger the item form submission
  setSubmitItemForm(true);
  setShowWarning(false);
  
  // Wait a brief moment to allow the item form to process
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Then submit the main form
  handleSubmit((data) => saveMutation.mutate(data))();
};

  const handleConfirmSubmitWithoutAdd = () => {
    handleSubmit((data) => saveMutation.mutate(data))();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey(prev => prev + 1)
  };

  //Set Item values
  React.useEffect(() => {
    async function loopItems() {
      await setValue("items", []);
      await items.forEach((item, index) => {
        setValue(`items.${index}.product_id`, item?.product?.id ? item.product.id : item.product_id);
        setValue(`items.${index}.sales_outlet_ids`, applicableOutlets.map((outlet: Outlet) => outlet.id));
        setValue(`items.${index}.price`, item.price);
        setValue(`items.${index}.measurement_unit_id`, item.measurement_unit_id);
        setValue(`items.${index}.bottom_cap`, item.bottom_cap);
      });
    }
    loopItems();
  }, [items, applicableOutlets, priceList, setValue]);

  //for Cost Insights
  const costCenterId = watch("cost_center_id");
  const storeId = watch("store_id");

  return (
    <React.Fragment>
      <DialogTitle>
        <Grid size={12} textAlign={"center"} mb={2}>
          {priceList ? `Edit Price List` : `New Price List`}
        </Grid>
        <form autoComplete='off'>
          <Grid container spacing={1}>
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <DateTimePicker
                  label="Effective Date & Time"
                  defaultValue={effective_date}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      InputProps: {
                        readOnly: true,
                        fullWidth: true
                      },
                    }
                  }}
                  onChange={(newValue: Dayjs | null) => {
                    setValue('effective_date', newValue ? newValue.toISOString() : '', {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 8}}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <OutletSelector
                  multiple={true}
                  defaultValue={applicableOutlets}
                  label='Applicable Outlets'
                  frontError={errors.sales_outlets}
                  onChange={(newValue: any) => {
                    setApplicableOutlets(newValue);
                    setValue("sales_outlets", newValue, {
                      shouldDirty: true,
                      shouldValidate: true
                    });
                  }}
                />
              </Div>
            </Grid>
            {!fuelPriceLists &&
              <Grid size={{xs: 12, md: 4}}>
                <Grid container rowSpacing={0.3}>
                  <Stack direction={'row'} alignItems={'center'}>
                    <Checkbox
                      checked={costInsights}
                      size='small'
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setCostInsights(isChecked);
                      }}
                    />
                    <Typography>Cost Insights</Typography>
                  </Stack>
                  {!!costInsights && (
                    <>
                      <Grid size={12}>
                        <Div sx={{ mt: 0.5}}>
                          <StoreSelector
                            defaultValue={null}
                            allowSubStores={true}
                            onChange={(newValue: { id: number } | null) => {
                              setValue('store_id', newValue ? newValue.id : null, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }}
                          />
                        </Div>
                      </Grid>
                      <Grid size={12}>
                        <Div sx={{mt: 0.5}}>
                          <CostCenterSelector
                            label="Cost Center"
                            multiple={false}
                            frontError={errors.cost_center_id}
                            onChange={(newValue: any) => {
                              setValue('cost_center_id', newValue?.id ? newValue.id : null, {
                                shouldValidate: true,
                                shouldDirty: true
                              });
                            }}
                          />
                        </Div>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Grid>
            }
            <Grid size={{xs: 12, md: !fuelPriceLists ? 8 : 12}} alignItems={'start'}>
              <Div sx={{ mt: {xs: 1, md: !!costInsights ? 6 : 1}, mb: 1 }}>
                <TextField
                  label='Narration'
                  fullWidth
                  multiline={true}
                  minRows={2}
                  error={!!errors?.narration}
                  helperText={errors?.narration?.message}
                  {...register('narration')}
                />
              </Div>
            </Grid>
          </Grid>
        </form>
        <Grid size={12}>
          <Divider />
          <PriceListsItemForm 
            fuelPriceLists={fuelPriceLists} setClearFormKey={setClearFormKey} submitItemForm={submitItemForm} setSubmitItemForm={setSubmitItemForm} key={clearFormKey} setIsDirty={setIsDirty} costInsights={costInsights} costCenterId={Number(costCenterId)} storeId={Number(storeId)} setItems={setItems} items={items} 
          />
        </Grid>
      </DialogTitle>
      <DialogContent>
        {errors?.items?.message && items.length < 1 && <Alert severity='error'>{errors.items.message}</Alert>}
        
        {items.map((item, index) => (
          <PriceListsItemRow fuelPriceLists={fuelPriceLists} setClearFormKey={setClearFormKey} submitItemForm={submitItemForm} setSubmitItemForm={setSubmitItemForm} setIsDirty={setIsDirty} key={index} index={index} setItems={setItems} items={items} item={item} />
        ))}

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>            
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid size={11}>
                Unsaved Changes
              </Grid>
              <Grid size={1} textAlign="right">
                <Tooltip title="Close">
                  <IconButton
                    size="small" 
                    onClick={() => setShowWarning(false)}
                  >
                    <HighlightOff color="primary" />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </DialogTitle>
          <DialogContent>
            Last item was not added to the list
          </DialogContent>
          <DialogActions>
            <Button size="small" onClick={handleMainFormSubmit}>
              Add and Submit
            </Button>
            <Button size="small" onClick={handleConfirmSubmitWithoutAdd} color="secondary">
              Submit without add
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={addPriceList.isPending || updatePriceList.isPending}
          variant='contained'
          size='small'
          onClick={onSubmit}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </React.Fragment>
  );
};

export default PriceListForm;