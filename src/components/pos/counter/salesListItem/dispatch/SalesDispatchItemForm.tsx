import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import productServices from '@/components/productAndServices/products/productServices';
import { Product } from '@/components/productAndServices/products/ProductType';
import { Div } from '@jumbo/shared';
import { HighlightOff } from '@mui/icons-material';
import {
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCounter } from '../../CounterProvider';

interface SaleItem {
  id: number;
  product_id?: number;
  product: Product;
  measurement_unit_id?: number;
  measurement_unit?: MeasurementUnit;
  undispatched_quantity: number;
  quantity: number;
  rate: number;
  available_balance: number;
  current_balance?: number;
  store_id?: any;
  vat_exempted?: number;
}

interface SaleItemFormProps {
  sale_items: SaleItem[];
  selectedStore?: any;
}

function SalesDispatchItemForm({
  sale_items,
  selectedStore,
}: SaleItemFormProps) {
  const { outlet } = useCounter();
  const { stores, cost_center } = outlet || {};
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<{
    items: SaleItem[];
    dispatch_date: string;
  }>();

  const { authOrganization } = useJumboAuth();
  const [isRetrieving, setIsRetrieving] = useState<Record<number, boolean>>({});
  const [removedItemIds, setRemovedItemIds] = useState<Set<number>>(new Set());
  // Raw text per row, kept separate from the numeric RHF value — a
  // controlled TextField bound straight to the coerced number would snap
  // "5." back to "5" on every keystroke, making it impossible to ever type
  // the fractional part of a decimal quantity.
  const [quantityInputs, setQuantityInputs] = useState<Record<number, string>>(
    {}
  );
  const dispatch_date = watch('dispatch_date');

  // Memoize filtered items to prevent unnecessary re-renders
  const filteredItems = useMemo(
    () => sale_items.filter((item) => item.undispatched_quantity !== 0),
    [sale_items]
  );

  // Items still visible on the form — removed ones stay in filteredItems
  // (so indices/RHF field paths stay stable) but are hidden here, and their
  // quantity is zeroed so the existing quantity > 0 submit filter drops them.
  const visibleItems = useMemo(
    () =>
      filteredItems
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => !removedItemIds.has(item.id)),
    [filteredItems, removedItemIds]
  );

  const handleRemoveItem = useCallback(
    (item: SaleItem, index: number) => {
      setValue(`items.${index}.quantity`, 0, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setQuantityInputs((prev) => ({ ...prev, [index]: '' }));
      setRemovedItemIds((prev) => new Set(prev).add(item.id));
    },
    [setValue]
  );

  // Improved balance retrieval with error handling and memoization
  const retrieveBalances = useCallback(
    async (
      productId: number,
      storeId: number,
      measurement_unit_id: number,
      index: number
    ) => {
      if (!productId || storeId == null) {
        setValue(`items.${index}.available_balance`, 0);
        return;
      }

      try {
        setIsRetrieving((prev) => ({ ...prev, [index]: true }));

        const balances = await productServices.getStoreBalances({
          as_at: dispatch_date,
          productId,
          storeIds: [storeId],
          costCenterId: cost_center?.id,
          sales_outlet_id: outlet?.id,
          measurement_unit_id,
        });

        const storeBalance = balances.stock_balances.find(
          (balance: any) =>
            balance.store_id === storeId &&
            balance.cost_center_id === outlet?.cost_center?.id
        );

        setValue(`items.${index}.measurement_unit_id`, measurement_unit_id);
        setValue(
          `items.${index}.available_balance`,
          storeBalance?.balance ?? 0
        );
        setValue(
          `items.${index}.current_balance`,
          storeBalance?.current_balance ?? 0
        );
      } catch (error) {
        console.error('Error retrieving balances:', error);
        setValue(`items.${index}.available_balance`, 0);
      } finally {
        setIsRetrieving((prev) => ({ ...prev, [index]: false }));
      }
    },
    [dispatch_date, cost_center?.id, outlet?.id, setValue]
  );

  // get bulk item balances
  useEffect(() => {
    if (selectedStore) {
      filteredItems.map((item, index) => {
        retrieveBalances(
          item.product.id,
          selectedStore.id,
          Number(item.measurement_unit_id),
          index
        );
        setValue(`items.${index}.store_id`, selectedStore?.id ?? null, {
          shouldValidate: true,
          shouldDirty: true,
        });
      });
    }
  }, [selectedStore]);

  // Initialize quantities when component mounts
  useEffect(() => {
    const initialInputs: Record<number, string> = {};
    filteredItems.forEach((item, index) => {
      setValue(`items.${index}.quantity`, item.undispatched_quantity);
      initialInputs[index] = String(item.undispatched_quantity);
    });
    setQuantityInputs(initialInputs);
  }, [filteredItems, setValue]);

  // Update balances when dispatch date changes
  useEffect(() => {
    filteredItems.forEach((item, index) => {
      retrieveBalances(
        item.product.id,
        watch(`items.${index}.store_id`),
        Number(item.measurement_unit_id),
        index
      );
    });
  }, [dispatch_date, retrieveBalances, filteredItems, watch]);

  // Handle quantity change with validation
  const handleQuantityChange = useCallback(
    (index: number, value: string) => {
      setQuantityInputs((prev) => ({ ...prev, [index]: value }));

      const numeric = value === '' ? 0 : Number(value);
      setValue(
        `items.${index}.quantity`,
        Number.isNaN(numeric) ? 0 : numeric,
        {
          shouldValidate: true,
          shouldDirty: true,
        }
      );
      // Trigger revalidation for the store field
      setValue(`items.${index}.store_id`, watch(`items.${index}.store_id`), {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [setValue, watch]
  );

  return (
    <>
      {visibleItems.map(({ item, index }) => (
        <React.Fragment key={item.id}>
          <Grid
            container
            spacing={1}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Grid size={12}>
              <Divider />
            </Grid>
            <Grid size={0.5}>
              <Div sx={{ mt: 1.7, mb: 1.7 }}>{index + 1}.</Div>
            </Grid>
            <Grid size={{ xs: 9.5, md: 8, lg: 3.5 }}>
              <Div sx={{ mt: 1.7, mb: 1.7 }}>
                <Tooltip title='Product'>
                  <Typography>{item.product?.name}</Typography>
                </Tooltip>
              </Div>
            </Grid>
            <Grid textAlign={'center'} size={{ xs: 2, md: 3.5, lg: 1 }}>
              <Div sx={{ mt: 1.7, mb: 1.7 }}>
                <Tooltip title='Undispatched Quantity'>
                  <Typography>
                    {`${item.measurement_unit?.symbol || ''} ${item.undispatched_quantity}`}
                  </Typography>
                </Tooltip>
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 2.5 }}>
              <Div sx={{ mt: 0.7, mb: 0.5 }}>
                <StoreSelector
                  allowSubStores={true}
                  value={selectedStore}
                  defaultValue={null}
                  proposedOptions={stores as any}
                  includeStores={authOrganization?.stores}
                  frontError={errors.items?.[index]?.store_id as any}
                  onChange={(newValue: any) => {
                    if (newValue) {
                      retrieveBalances(
                        item.product.id,
                        newValue.id,
                        Number(item.measurement_unit_id),
                        index
                      );
                    }
                    setValue(`items.${index}.store_id`, newValue?.id ?? null, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 6, md: 3, lg: 2 }}>
              <Div sx={{ mt: 0.7, mb: 0.5 }}>
                {isRetrieving[index] ? (
                  <LinearProgress />
                ) : (
                  <TextField
                    label='Available Balance'
                    fullWidth
                    size='small'
                    value={watch(`items.${index}.available_balance`) ?? 0}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <span>{item.measurement_unit?.symbol || ''}</span>
                      ),
                    }}
                  />
                )}
              </Div>
            </Grid>
            <Grid size={{ xs: 6, md: 3, lg: 2 }}>
              <Div sx={{ mt: 0.7, mb: 0.5 }}>
                <TextField
                  label='Dispatch Quantity'
                  fullWidth
                  size='small'
                  error={!!errors.items?.[index]?.quantity}
                  helperText={errors.items?.[index]?.quantity?.message}
                  value={quantityInputs[index] ?? ''}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                />
              </Div>
            </Grid>
            <Grid
              size={{ xs: 12, md: 12, lg: 0.5 }}
              textAlign={{ xs: 'right', lg: 'center' }}
            >
              {visibleItems.length > 1 && (
                <Tooltip title='Remove item'>
                  <IconButton
                    size='small'
                    color='error'
                    onClick={() => handleRemoveItem(item, index)}
                  >
                    <HighlightOff fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
            </Grid>
          </Grid>
        </React.Fragment>
      ))}
    </>
  );
}

export default SalesDispatchItemForm;
