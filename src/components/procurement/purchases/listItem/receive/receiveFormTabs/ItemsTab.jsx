import { Div } from '@jumbo/shared';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';

import { Button } from '@mui/material';
function ItemsTab({
  purchase_order_items,
  onRemoveItem,
  onResetItems,
  canReset,
  onAutofillQuantities,
  onClearQuantities,
  errors, register, setValue, watch
}) {

  return (
    <>
      <Stack
        direction='row'
        spacing={1}
        sx={{ mb: 1.5 }}
        flexWrap='wrap'
        justifyContent='flex-end'
      >
        <Tooltip title='Fill every item with its full unreceived quantity, for shipments received exactly as ordered'>
          <Button
            variant='outlined'
            size='small'
            onClick={onAutofillQuantities}
          >
            Autofill All
          </Button>
        </Tooltip>
        <Tooltip title='Set every item to 0 quantity, then fill in only the items actually received in this shipment'>
          <Button
            variant='outlined'
            color='secondary'
            size='small'
            onClick={onClearQuantities}
          >
            Clear All
          </Button>
        </Tooltip>
        {canReset && (
          <Button
            variant='outlined'
            color='secondary'
            size='small'
            onClick={onResetItems}
          >
            Reset Items
          </Button>
        )}
      </Stack>
      {purchase_order_items?.map((item, index) => {
        return (
          <React.Fragment key={item.id}>
            <Grid
              container
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
            >
              <Grid size={12}>
                <Divider />
              </Grid>
              <Grid size={0.5}>
                <Div sx={{ mt: 1.7, mb: 1.7 }}>{index + 1}.</Div>
              </Grid>
              <Grid size={{ xs: 11.5, md: 6 }}>
                <Div sx={{ mt: 1.7, mb: 1.7 }}>
                  <Tooltip title='Product'>
                    <Typography>{item.product.name}</Typography>
                  </Tooltip>
                </Div>
              </Grid>
              <Grid textAlign={'center'} size={{ xs: 6, md: 2 }}>
                <Div sx={{ mt: 1.7, mb: 1.7 }}>
                  <Tooltip title='Ordered Quantity'>
                    <Typography>{`${item.measurement_unit.symbol} ${item.unreceived_quantity}`}</Typography>
                  </Tooltip>
                </Div>
              </Grid>
              <Grid size={{ xs: 6, md: 3, lg: 2 }}>
                <Div sx={{ mt: 0.7, mb: 0.5 }}>
                  <TextField
                    label='Receive'
                    fullWidth
                    size='small'
                    type={item.product.type === 'Asset' ? 'number' : 'text'}
                    inputProps={item.product.type === 'Asset' ? { step: 1, min: 0 } : undefined}
                    error={
                      !!errors?.items &&
                      !!errors.items[index] &&
                      !!errors.items[index].quantity
                    }
                    helperText={
                      errors?.items &&
                      errors.items[index] &&
                      errors.items[index].quantity?.message
                    }
                    value={watch(`items.${index}.quantity`) || ''}
                    onChange={(e) => {
                      setValue(`items.${index}.quantity`, e.target.value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              {purchase_order_items.length > 1 && (
                <Grid size={{ xs: 12, md: 1 }} textAlign={'end'}>
                  <Div sx={{ mt: 1.7, mb: 1.7 }}>
                    <Tooltip title='Remove item'>
                      <IconButton
                        size='small'
                        color='error'
                        onClick={() => onRemoveItem(index)}
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </Div>
                </Grid>
              )}
              {item.product.type === 'Asset' && (
                <Grid size={{ xs: 12, md: 11.5, offset: { md: 0.5 } }}>
                  <Div sx={{ mt: 0.5, mb: 1.7 }}>
                    <Typography variant='caption' color='text.secondary' display='block' mb={0.5}>
                      Identification / Serial No. for each unit (optional — an asset number is assigned automatically when left blank)
                    </Typography>
                    <Grid container spacing={1}>
                      {Array.from({ length: Math.max(0, Math.floor(watch(`items.${index}.quantity`) || 0)) }).map((_, unit) => (
                        <Grid key={unit} size={{ xs: 6, md: 3 }}>
                          <TextField
                            label={`Unit ${unit + 1}`}
                            fullWidth
                            size='small'
                            value={watch(`items.${index}.identifications.${unit}`) || ''}
                            onChange={(e) => {
                              setValue(`items.${index}.identifications.${unit}`, e.target.value, {
                                shouldDirty: true,
                              });
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Div>
                </Grid>
              )}
            </Grid>
          </React.Fragment>
        );
      })}
      <Grid container>
        <Grid size={12}>
          <Div sx={{ mt: 1, mb: 1 }}>
            <TextField
              label='Remarks'
              fullWidth
              multiline={true}
              minRows={2}
              error={!!errors?.remarks}
              helperText={errors?.remarks?.message}
              {...register('remarks')}
            />
          </Div>
        </Grid>
      </Grid>
    </>
  );
}

export default ItemsTab;
