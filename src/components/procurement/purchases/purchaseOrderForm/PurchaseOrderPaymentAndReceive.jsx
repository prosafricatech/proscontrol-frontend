import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Checkbox, FormControlLabel, Grid, TextField } from '@mui/material';
import React, { useState } from 'react';
import StoreSelector from '../../stores/StoreSelector';
import storeServices from '../../stores/store-services';

function PurchaseOrderPaymentAndReceive({
  instant_receive,
  instant_pay,
  displayStoreSelector,
  setDisplayStoreSelector,
  order,
  items,
  errors,
  setValue,
  watch,
  register,
}) {
  const [storeOptions, setStoreOptions] = useState([]);
  const { productOptions } = useProductsSelect();
  const { checkOrganizationPermission } = useJumboAuth();
  const canInstantPay = checkOrganizationPermission(
    PERMISSIONS.PURCHASES_INSTANT_PAY
  );
  const canInstantReceive = checkOrganizationPermission(
    PERMISSIONS.PURCHASES_INSTANT_RECEIVE
  );

  //Get Store options
  React.useEffect(() => {
    async function fetchStores() {
      if (displayStoreSelector) {
        const stores = await storeServices.getStoreOptions();
        setStoreOptions(stores);
      }
    }
    fetchStores();
  }, [displayStoreSelector]);

  React.useEffect(() => {
    setDisplayStoreSelector(false);
    items?.map((item) => {
      const product = productOptions.find(
        (option) => option.id === item.product.id
      );
      if (product?.type === 'Inventory') {
        setDisplayStoreSelector(true);
        return;
      }
    });

    if (!displayStoreSelector && !watch(`stakeholder_id`)) {
      setValue('instant_receive', false);
    } else if (
      displayStoreSelector &&
      !watch(`stakeholder_id`) &&
      canInstantReceive
    ) {
      setValue('instant_receive', true);
    }
  }, [items, displayStoreSelector, watch(`stakeholder_id`), canInstantReceive]);

  React.useEffect(() => {
    if (!canInstantPay && instant_pay) {
      setValue('instant_pay', false, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue('credit_ledger_id', null, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue('stakeholder_ledger_id', null, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (!canInstantReceive && instant_receive) {
      setValue('instant_receive', false, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue('store_id', null, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [canInstantPay, canInstantReceive, instant_pay, instant_receive, setValue]);

  return (
    <Grid container spacing={1} paddingTop={1} width={'100%'}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Grid container columnSpacing={1} rowSpacing={1}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              size='small'
              multiline
              rows={3}
              fullWidth
              label={'Payment Terms'}
              {...register('terms_of_payment')}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              size='small'
              multiline
              rows={3}
              fullWidth
              label={'Remarks'}
              {...register('remarks')}
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Grid container columnSpacing={1} rowSpacing={1}>
          <Grid size={{ xs: 12, md: 6 }}>
            {canInstantPay && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={instant_pay}
                    disabled={!watch('stakeholder_id')}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setValue('instant_pay', checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    name='instant_pay'
                  />
                }
                label='Instant Payment'
              />
            )}
            {instant_pay && (
              <LedgerSelect
                label='Pay from'
                defaultValue={order?.credit_ledger}
                frontError={errors?.credit_ledger_id} // Added optional chaining
                allowedGroups={['Cash and cash equivalents']}
                onChange={(newValue) => {
                  setValue('credit_ledger_id', newValue?.id || null, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            )}
          </Grid>

          {displayStoreSelector && canInstantReceive && (
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={instant_receive}
                    disabled={!watch('stakeholder_id') || !canInstantReceive}
                    onChange={(e) => {
                      setValue('instant_receive', e.target.checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    name='instant_receive'
                  />
                }
                label='Instant Receive'
              />
              {displayStoreSelector && instant_receive && (
                <StoreSelector
                  allowSubStores
                  frontError={errors?.store_id} // Added optional chaining
                  defaultValue={order?.store}
                  proposedOptions={storeOptions}
                  onChange={(newValue) => {
                    setValue('store_id', newValue?.id || null, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              )}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
}

export default PurchaseOrderPaymentAndReceive;
