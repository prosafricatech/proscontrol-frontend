import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import {
  Autocomplete,
  Avatar,
  Box,
  Checkbox,
  Chip,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useProductsSelect } from './ProductsSelectProvider';

function ProductSelect(props) {
  const {
    frontError = null,
    label = 'Select Product',
    excludeIds = [],
    multiple = false,
    startAdornment,
    excludeFuelProducts = false,
    includeOnlyFuelProducts = false,
    allowedCategoryIds = null,
    requiredProducts,
    addedProduct = null,
    defaultValue = null,
    disabled = false,
    readOnly = false,
    onChange,
  } = props;
  const { productOptions } = useProductsSelect();

  const [selectedItems, setSelectedItems] = useState(
    defaultValue ?? (multiple ? [] : null)
  );

  useEffect(() => {
    if (defaultValue !== null) {
      if (JSON.stringify(selectedItems) !== JSON.stringify(defaultValue)) {
        setSelectedItems(defaultValue);
      }
    }
  }, [JSON.stringify(defaultValue)]);

  useEffect(() => {
    if (!addedProduct) return;
    const value = multiple ? [addedProduct] : addedProduct;
    if (JSON.stringify(selectedItems) !== JSON.stringify(value)) {
      setSelectedItems(value);
      if (JSON.stringify(defaultValue) !== JSON.stringify(value)) {
        onChange?.(value);
      }
    }
  }, [JSON.stringify(addedProduct), multiple]);

  const finalOptions = useMemo(() => {
    let opts = productOptions.filter(
      (p) => !excludeIds.includes(p.id) && p.id !== addedProduct?.id
    );

    if (excludeFuelProducts) {
      opts = opts.filter((p) => !p.is_fuel);
    }

    if (includeOnlyFuelProducts) {
      opts = opts.filter((p) => p.is_fuel);
    }

    if (allowedCategoryIds && allowedCategoryIds.length > 0) {
      opts = opts.filter((p) => allowedCategoryIds.includes(p.product_category_id));
    }

    if (addedProduct?.id) {
      opts = [...opts, addedProduct];
    }

    if (requiredProducts) {
      opts = opts.filter((o) => requiredProducts.some((r) => r.id === o.id));
    }

    return opts;
  }, [
    productOptions,
    excludeIds,
    addedProduct,
    requiredProducts,
    excludeFuelProducts,
    includeOnlyFuelProducts,
    allowedCategoryIds,
  ]);

  const handleOnChange = (_, newValue) => {
    setSelectedItems(newValue);
    onChange?.(newValue);
  };

  return (
    <Autocomplete
      multiple={multiple}
      disabled={disabled}
      readOnly={readOnly}
      options={finalOptions}
      value={selectedItems}
      disableCloseOnSelect={multiple}
      onChange={handleOnChange}
      getOptionLabel={(o) => o?.name || ''}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      renderOption={(props, option, { selected }) => {
        const { key, ...rest } = props;
        const imageSrc =
          option.thumbnail ||
          option.image_url ||
          (Array.isArray(option.images) && option.images.length > 0
            ? option.images[0]?.url
            : undefined);
        const hasImage = Boolean(imageSrc);

        return (
          <li {...rest} key={`${option.id}-${key}`}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                // minHeight: 80,
                py: 1,
              }}
            >
              {multiple && (
                <Checkbox
                  icon={<CheckBoxOutlineBlank fontSize='small' />}
                  checkedIcon={<CheckBox fontSize='small' />}
                  checked={selected}
                  sx={{ mr: 1 }}
                />
              )}

              {hasImage && (
                <Avatar
                  src={imageSrc}
                  variant='rounded'
                  sx={{
                    width: 36,
                    height: 36,
                    mr: 1.5,
                    fontWeight: 700,
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {option.name?.charAt(0)?.toUpperCase()}
                </Avatar>
              )}

              <Box>
                <Typography
                  variant='body1'
                  // fontWeight={500}
                >
                  {option.name}
                </Typography>

                {hasImage && option.type && (
                  <Typography variant='caption' color='text.secondary'>
                    {option.type}
                  </Typography>
                )}
              </Box>
            </Box>
          </li>
        );
      }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const { key, ...rest } = getTagProps({ index });

          return (
            <Chip
              {...rest}
              key={`${option.id}-${key}`}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* <ProductThumbnail
                    name={option.name}
                    imageUrl={option.image_url}
                    size={36}
                  /> */}
                  {option.name}
                </Box>
              }
              size='medium'
              sx={{
                borderRadius: 1,
                '& .MuiChip-label': {
                  display: 'flex',
                  alignItems: 'center',
                  pl: 0.5,
                },
              }}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size='small'
          fullWidth
          label={label}
          error={!!frontError}
          helperText={frontError?.message}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                {startAdornment && <Box sx={{ mr: 0.5 }}>{startAdornment}</Box>}
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

export default ProductSelect;
