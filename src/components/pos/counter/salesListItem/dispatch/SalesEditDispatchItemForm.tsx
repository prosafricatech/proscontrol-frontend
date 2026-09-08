import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import productServices from '@/components/productAndServices/products/productServices';
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

interface Product {
  id: number;
  name: string;
  measurement_unit?: {
    symbol: string;
  };
}

interface SaleItem {
  measurement_unit?: {
    symbol: string;
  };
  undispatched_quantity: number;
}

interface Store {
  id: number;
  name: string;
}

interface FormItem {
  product: Product;
  sale_item: SaleItem;
  quantity: number;
  store_id?: number;
  store?: Store;
  available_balance?: number | string;
  current_balance?: number;
}

interface SalesEditDispatchItemFormProps {
  items: FormItem[];
  selectedStore?: any;
}

function SalesEditDispatchItemForm({
  items,
  selectedStore,
}: SalesEditDispatchItemFormProps) {
  const { outlet } = useCounter();
  const { stores, cost_center } = outlet || {};
  const { authOrganization } = useJumboAuth();
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<{
    items: FormItem[];
    dispatch_date: string;
  }>();

  const [isRetrieving, setIsRetrieving] = useState<Record<number, boolean>>({});
  const [removedItemIds, setRemovedItemIds] = useState<Set<number>>(new Set());
  // Raw text per row, kept separate from the numeric RHF value — a
  // controlled TextField bound straight to the coerced number would snap
  // "5." back to "5" on every keystroke, making it impossible to ever type
  // the fractional part of a decimal quantity.
  const [quantityInputs, setQuantityInputs] = useState<Record<number, string>>(
    {}
  );

  // Removed rows stay in `items` (so indices/RHF field paths stay stable)
  // but are hidden here, with their quantity zeroed so the existing
  // quantity > 0 submit filter (SalesDispatchForm.validateItems) drops them —
  // DeliveryNoteController::update() rebuilds movements from scratch on
  // every save, so an item missing from the payload is simply not recreated.
  const visibleItems = useMemo(
    () =>
      items
        .map((item, index) => ({ item, index }))
        .filter(({ index }) => !removedItemIds.has(index)),
    [items, removedItemIds]
  );

  const handleRemoveItem = useCallback(
    (index: number) => {
      setValue(`items.${index}.quantity`, 0, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setQuantityInputs((prev) => ({ ...prev, [index]: '' }));
      setRemovedItemIds((prev) => new Set(prev).add(index));
    },
    [setValue]
  );

  const retrieveBalances = useCallback(
    async (productId: number, storeId: number | undefined, index: number) => {
      if (!productId) {
        setValue(`items.${index}.available_balance`, 'N/A');
        return;
      }

      try {
        setIsRetrieving((prev) => ({ ...prev, [index]: true }));
        const quantity = parseFloat(
          String(watch(`items.${index}.quantity`) || 0)
        );

        const balances = await productServices.getStoreBalances({
          as_at: watch('dispatch_date'),
          productId,
          storeIds: storeId ? [storeId] : [],
          costCenterId: cost_center?.id,
          sales_outlet_id: outlet?.id,
        });

        const storeBalance = storeId
          ? balances.stock_balances.find(
              (balance: any) =>
                balance.store_id === storeId &&
                balance.cost_center_id === outlet?.cost_center?.id
            )
          : null;

        const availableBalance = parseFloat(storeBalance?.balance || '0');
        const currentBalance =
          parseFloat(storeBalance?.current_balance || '0') + quantity;

        setValue(`items.${index}.available_balance`, availableBalance);
        setValue(`items.${index}.current_balance`, currentBalance);
      } catch (error) {
        console.error('Error retrieving balances:', error);
        setValue(`items.${index}.available_balance`, 'N/A');
      } finally {
        setIsRetrieving((prev) => ({ ...prev, [index]: false }));
      }
    },
    [cost_center?.id, outlet?.id, setValue, watch]
  );

  // get bulk item balances
  useEffect(() => {
    if (selectedStore) {
      items.map((item: any, index: number) => {
        retrieveBalances(item.product.id, selectedStore.id, index);
        setValue(`items.${index}.store_id`, selectedStore?.id ?? null, {
          shouldValidate: true,
          shouldDirty: true,
        });
      });
    }
  }, [selectedStore]);

  useEffect(() => {
    items.forEach((item, index) => {
      retrieveBalances(item.product.id, item.store?.id, index);
    });
  }, [items, retrieveBalances]);

  useEffect(() => {
    const initialInputs: Record<number, string> = {};
    items.forEach((item, index) => {
      initialInputs[index] = String(item.quantity);
    });
    setQuantityInputs(initialInputs);
  }, [items]);

  const handleQuantityChange = (index: number, value: string) => {
    setQuantityInputs((prev) => ({ ...prev, [index]: value }));

    const numeric = value === '' ? 0 : Number(value);
    setValue(`items.${index}.quantity`, Number.isNaN(numeric) ? 0 : numeric, {
      shouldValidate: true,
      shouldDirty: true,
    });
    // Trigger revalidation for the store field
    setValue(`items.${index}.store_id`, watch(`items.${index}.store_id`), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <>
      {visibleItems.map(({ item, index }) => (
        <React.Fragment key={`${item.product.id}-${index}`}>
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
                <Tooltip title='Dispatched Product'>
                  <Typography>{item.product.name}</Typography>
                </Tooltip>
              </Div>
            </Grid>
            <Grid size={{ xs: 2, md: 3.5, lg: 1 }} textAlign={'center'}>
              <Div sx={{ mt: 1.7, mb: 1.7 }}>
                <Tooltip title='Undispatched Quantity'>
                  <Typography>
                    {`${item.sale_item.measurement_unit?.symbol || ''} ${item.sale_item.undispatched_quantity + item.quantity}`}
                  </Typography>
                </Tooltip>
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 2.5 }}>
              <Div sx={{ mt: 0.7, mb: 0.5 }}>
                <StoreSelector
                  allowSubStores={true}
                  value={selectedStore}
                  defaultValue={watch(`items.${index}.store`)}
                  proposedOptions={stores as any}
                  includeStores={authOrganization?.stores || []}
                  frontError={errors.items?.[index]?.store_id?.message as any}
                  onChange={(newValue: any) => {
                    if (newValue) {
                      retrieveBalances(item.product.id, newValue.id, index);
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
                    value={watch(`items.${index}.available_balance`) || ''}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <span>
                          {item.product.measurement_unit?.symbol || ''}
                        </span>
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
                    onClick={() => handleRemoveItem(index)}
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

export default SalesEditDispatchItemForm;
