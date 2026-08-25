import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import {
  Autocomplete,
  Checkbox,
  Chip,
  LinearProgress,
  TextField,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { useEffect, useState } from 'react';
import storeServices from './store-services';

function StoreSelector({
  onChange,
  frontError = null,
  multiple = false,
  label = 'Store',
  value = null,
  defaultValue,
  allowSubStores = false,
  excludeStores = null,
  includeStores = null,
  proposedOptions = null,
}) {
  //Fetch Stores
  const { data: stores, isLoading: isFetchingStores } = useQuery({
    queryKey: ['storeOptions'],
    queryFn: storeServices.getStoreOptions,
  });
  const [selectedStore, setSelectedStore] = useState(
    defaultValue ? defaultValue : multiple ? [] : null
  );

  useEffect(() => {
    if (value) setSelectedStore(value);
  }, [value]);

  // Engine for stores when allowSubStores is true
  const toOptions = (stores, depth = 0, parent_id = null) => {
    const { id, name, children = [] } = stores;
    const subStores = children.flatMap((child) =>
      toOptions(child, depth + 1, id)
    );
    const option = {
      id,
      name,
      depth,
      parent_id,
      matchTerms: [name].concat(subStores.map((obj) => obj.name)),
    };
    return [option].concat(subStores);
  };

  let storeOptions;
  if (!!allowSubStores) {
    if (proposedOptions) {
      storeOptions = proposedOptions.flatMap((stores) => toOptions(stores));
    } else if (stores) {
      storeOptions = stores.flatMap((stores) => toOptions(stores));
    }
  } else {
    storeOptions = proposedOptions || stores;
  }

  function dedupeById(options) {
    if (!Array.isArray(options)) return options;
    const seen = new Set();
    return options.filter((option) => {
      if (!option || !option.id) return false;
      if (seen.has(option.id)) return false;
      seen.add(option.id);
      return true;
    });
  }

  storeOptions = dedupeById(storeOptions);

  // Collects a store's id and, when allowSubStores is true, every descendant id
  function collectIds(store, ids = new Set()) {
    ids.add(store.id);
    if (allowSubStores && Array.isArray(store.children)) {
      store.children.forEach((child) => collectIds(child, ids));
    }
    return ids;
  }

  let finalOptions = storeOptions;
  if (excludeStores) {
    finalOptions = storeOptions?.filter(
      (option) => !excludeStores.every((store) => store.id === option.id)
    );
  } else if (includeStores) {
    const includeIds = includeStores.reduce(
      (ids, store) => collectIds(store, ids),
      new Set()
    );
    finalOptions = storeOptions?.filter((option) => includeIds.has(option.id));
  }
  finalOptions = dedupeById(finalOptions);

  if (isFetchingStores) {
    return <LinearProgress />;
  }

  return (
    <Autocomplete
      id='checkboxes-stores'
      multiple={multiple}
      options={finalOptions}
      disableCloseOnSelect={multiple}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      getOptionLabel={(option) => option.name}
      value={selectedStore}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size='small'
          fullWidth
          error={!!frontError}
          helperText={frontError?.message}
          value={
            multiple
              ? selectedStore?.map((item) => item.name).join(', ')
              : selectedStore
          }
        />
      )}
      renderTags={(tagValue, getTagProps) => {
        return tagValue.map((option, index) => {
          return (
            <Chip
              {...getTagProps({ index })}
              key={`tag-${option.id}-${option.name}`}
              label={option.name}
            />
          );
        });
      }}
      renderOption={(props, option, { selected, inputValue }) => {
        const matches = match(option.name, inputValue);
        const parts = parse(option.name, matches);

        return (
          <li
            {...props}
            key={`option-${option.id}-${option.name}`}
            style={{
              paddingLeft: allowSubStores ? option.depth * 20 : 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {multiple && (
              <Checkbox
                key={`option-${option.id}-${option.name}`}
                size='small'
                icon={<CheckBoxOutlineBlank fontSize='small' />}
                checkedIcon={<CheckBox fontSize='small' />}
                checked={selected}
                sx={{ mr: 1 }}
              />
            )}

            <div style={{ marginLeft: multiple ? 0 : 10 }}>
              {parts.map((part, idx) => (
                <span
                  key={`part-${option.id}-${idx}`}
                  style={{
                    fontWeight: part.highlight ? 700 : 400,
                  }}
                >
                  {part.text}
                </span>
              ))}
            </div>
          </li>
        );
      }}
      onChange={(e, newValue) => {
        onChange(newValue);
        setSelectedStore(newValue);
      }}
    />
  );
}

export default StoreSelector;
