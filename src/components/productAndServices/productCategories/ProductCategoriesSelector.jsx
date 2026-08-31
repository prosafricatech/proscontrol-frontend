import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import {
  Autocomplete,
  Checkbox,
  Chip,
  LinearProgress,
  TextField,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import productCategoryServices from './productCategoryServices';

function ProductCategoriesSelector({
  onChange,
  frontError = null,
  multiple = false,
  label = 'Product Category',
  value = null,
  defaultValue,
}) {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['productCategoryOptions'],
    queryFn: productCategoryServices.getCategoryOptions,
  });

  const [selectedCategories, setSelectedCategories] = useState(
    defaultValue ? defaultValue : multiple ? [] : null
  );

  useEffect(() => {
    if (value) setSelectedCategories(value);
  }, [value]);

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Autocomplete
      multiple={multiple}
      options={categories || []}
      disableCloseOnSelect={multiple}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      getOptionLabel={(option) => option.name}
      value={selectedCategories}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size='small'
          fullWidth
          error={!!frontError}
          helperText={frontError?.message}
        />
      )}
      renderTags={(tagValue, getTagProps) => {
        return tagValue.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={`tag-${option.id}-${option.name}`}
            label={option.name}
          />
        ));
      }}
      renderOption={(props, option, { selected }) => {
        const { key, ...rest } = props;
        return (
          <li {...rest} key={`option-${option.id}-${key}`}>
            {multiple && (
              <Checkbox
                size='small'
                icon={<CheckBoxOutlineBlank fontSize='small' />}
                checkedIcon={<CheckBox fontSize='small' />}
                checked={selected}
                sx={{ mr: 1 }}
              />
            )}
            {option.name}
          </li>
        );
      }}
      onChange={(e, newValue) => {
        onChange(newValue);
        setSelectedCategories(newValue);
      }}
    />
  );
}

export default ProductCategoriesSelector;
