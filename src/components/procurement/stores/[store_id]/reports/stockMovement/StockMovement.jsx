'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import pdfStyles from '@/components/pdf/pdf-styles';
import PDFContent from '@/components/pdf/PDFContent';
import PdfLogo from '@/components/pdf/PdfLogo';
import productCategoryServices from '@/components/productAndServices/productCategories/productCategoryServices';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div, Span } from '@jumbo/shared';
import {
  CheckBox,
  CheckBoxOutlineBlank,
  HighlightOff,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import storeServices from '../../../store-services';
import StoreSelector from '../../../StoreSelector';
import { useStoreProfile } from '../../StoreProfileProvider';
import StockMovementOnScreen from './StockMovementOnScreen';

const ReportDocument = ({
  productCategories,
  organizationHasSubscribed,
  movementsData,
  authOrganization,
  user,
  checkOrganizationPermission,
  store,
  reportTitle,
}) => {
  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const lightColor =
    authOrganization.organization.settings?.light_color || '#bec5da';
  const contrastText =
    authOrganization.organization.settings?.contrast_text || '#FFFFFF';
  const costCenters = movementsData.filters.cost_centers;

  return movementsData ? (
    <Document
      creator={`${user.name} | Powered by ProsERP`}
      producer='ProsERP'
      title={`${store.name} ${reportTitle} ${readableDate(movementsData.filters.from, true)} to ${readableDate(movementsData.filters.to, true)}`}
    >
      <Page size='A3' orientation={'landscape'} style={pdfStyles.page}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
                {reportTitle}
              </Text>
              <Text style={{ ...pdfStyles.midInfo }}>{`${store.name}`}</Text>
              <Text
                style={{ ...pdfStyles.minInfo }}
              >{`${readableDate(movementsData.filters.from, true)} - ${readableDate(movementsData.filters.to, true)}`}</Text>
            </View>
          </View>
        </View>
        <View
          style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}
        >
          {costCenters.length > 0 && (
            <View style={{ flex: 2, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Cost Centers
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {costCenters
                  .map((cost_centers) => cost_centers.name)
                  .join(', ')}
              </Text>
            </View>
          )}
          {productCategories?.length > 0 && (
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Categories
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {productCategories.map((category) => category.name).join(', ')}
              </Text>
            </View>
          )}
          {checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS, PERMISSIONS.STORE_VALUES]) && (
            <View style={{ flex: 2, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Estimated Closing Value
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {movementsData.movements
                  .reduce(
                    (total, movement) =>
                      total +
                      movement.latest_rate *
                        (parseFloat(movement.opening_balance) +
                          parseFloat(movement.quantity_received) -
                          parseFloat(movement.quantity_sold) -
                          parseFloat(movement.quantity_consumed) -
                          parseFloat(movement.quantity_transferred_out) +
                          parseFloat(movement.quantity_transferred_in) +
                          parseFloat(movement.stock_gain) -
                          parseFloat(movement.stock_loss)),
                    0
                  )
                  .toLocaleString({ maximumFractionDigits: 4 })}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed By
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{user.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed On
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {readableDate(undefined, true)}
            </Text>
          </View>
        </View>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 0.5,
              }}
            >
              S/N
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 4,
              }}
            >
              Product
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 0.5,
              }}
            >
              Unit
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.25,
              }}
            >
              Opening Balance
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
              }}
            >
              Purchase Received
            </Text>
            {organizationHasSubscribed(
              MODULES.MANUFACTURING_AND_PROCESSING
            ) && (
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1.5,
                }}
              >
                Produced Quantity
              </Text>
            )}
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.25,
              }}
            >
              Transfer In
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.25,
              }}
            >
              Transfer Out
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Stock Gain
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Stock Loss
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.25,
              }}
            >
              Consumed
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Sold
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.25,
              }}
            >
              Closing Balance
            </Text>
            {checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS, PERMISSIONS.STORE_VALUES]) && (
              <React.Fragment>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1.5,
                  }}
                >
                  Latest Rate
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1.5,
                  }}
                >
                  Est. Closing Value
                </Text>
              </React.Fragment>
            )}
          </View>
          {movementsData.movements.map((movement, index) => {
            const closing_balance =
              Math.round(
                (parseFloat(movement.opening_balance) +
                  parseFloat(movement.quantity_received) +
                  parseFloat(movement.quantity_produced) -
                  parseFloat(movement.quantity_sold) -
                  parseFloat(movement.quantity_consumed) -
                  parseFloat(movement.quantity_transferred_out) +
                  parseFloat(movement.quantity_transferred_in) +
                  parseFloat(movement.stock_gain) -
                  parseFloat(movement.stock_loss)) *
                  10000
              ) / 10000;
            return (
              <View key={index} style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 0.5,
                  }}
                >
                  {index + 1}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 4,
                  }}
                >
                  {movement.name}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 0.5,
                  }}
                >
                  {movement.unit_symbol}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.25,
                    textAlign: 'right',
                  }}
                >
                  {movement.opening_balance}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.5,
                    textAlign: 'right',
                  }}
                >
                  {movement.quantity_received}
                </Text>
                {organizationHasSubscribed(
                  MODULES.MANUFACTURING_AND_PROCESSING
                ) && (
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      flex: 1.5,
                      textAlign: 'right',
                    }}
                  >
                    {movement.quantity_produced}
                  </Text>
                )}
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.25,
                    textAlign: 'right',
                  }}
                >
                  {movement.quantity_transferred_in}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.25,
                    textAlign: 'right',
                  }}
                >
                  {movement.quantity_transferred_out}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                    textAlign: 'right',
                  }}
                >
                  {movement.stock_gain}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                    textAlign: 'right',
                  }}
                >
                  {movement.stock_loss}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.25,
                    textAlign: 'right',
                  }}
                >
                  {movement.quantity_consumed}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                    textAlign: 'right',
                  }}
                >
                  {movement.quantity_sold}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.25,
                    textAlign: 'right',
                  }}
                >
                  {closing_balance}
                </Text>
                {checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS, PERMISSIONS.STORE_VALUES]) && (
                  <React.Fragment>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 1.5,
                        textAlign: 'right',
                      }}
                    >
                      {movement.latest_rate.toLocaleString('en-US', {
                        minimumFractionsDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 1.5,
                        textAlign: 'right',
                      }}
                    >
                      {(movement.latest_rate * closing_balance).toLocaleString(
                        'en-US',
                        { minimumFractionsDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </Text>
                  </React.Fragment>
                )}
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  ) : (
    ''
  );
};

function StockMovement({ toggleOpen, dormantStock = false, isFromDashboard }) {
  const classes = useProsERPStyles();
  const {
    authOrganization,
    authUser: { user },
    checkOrganizationPermission,
    organizationHasSubscribed,
  } = useJumboAuth();
  const { activeStore } = useStoreProfile();
  const [selectedTab, setSelectedTab] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [isDownloadingTemplate, setIsDownloadingTemplate] =
    React.useState(false);

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [includeChildren, setIncludeChildren] = useState(true);
  const [withDetails, setWithDetails] = useState(false);

  // Validation schema
  const validationSchema = yup.object({
    isFromDashboard: yup.boolean(),
    store_id: yup
      .number()
      .nullable()
      .when('isFromDashboard', (isFromDashboard, schema) => {
        return isFromDashboard
          ? schema.required('Store is required').typeError('Store is required')
          : schema;
      }),
    include_children: yup.boolean(),
  });

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      from: dormantStock
        ? dayjs().subtract(3, 'months').toISOString()
        : dayjs().startOf('day').toISOString(),
      to: dayjs().toISOString(),
      isFromDashboard: isFromDashboard || false,
      store_id: isFromDashboard ? null : activeStore?.id,
      cost_center_ids: authOrganization.costCenters.map(
        (cost_center) => cost_center.id
      ),
      include_children: includeChildren,
    },
  });

  const [isFetching, setisFetching] = useState(false);
  const [movements, setMovements] = useState(null);

  useEffect(() => {
    setValue('include_children', includeChildren);
  }, [includeChildren, setValue]);

  const getMovements = async (filters) => {
    if (!filters?.store_id) {
      enqueueSnackbar('Please select a store first', { variant: 'warning' });
      return;
    }

    setisFetching(true);
    const data = await storeServices.getStockMovement(filters, dormantStock);
    setMovements(data);
    setisFetching(false);
  };

  const buildFilters = (overrides = {}) => ({
    from: watch('from'),
    to: watch('to'),
    store_id: watch('store_id'),
    cost_center_ids: watch('cost_center_ids'),
    product_category_ids: watch('product_category_ids'),
    include_children: includeChildren,
    with_details: withDetails,
    ...overrides,
  });

  const downloadExcelTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);

      // Get all current filter parameters
      const filters = buildFilters();

      // Pass all filters to the service
      const responseData = await storeServices.getStockMovementExcel(filters);

      const blob = new Blob([responseData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Stock Movement ${readableDate(filters.as_at, true)}.xlsx`;
      link.click();
      setIsDownloadingTemplate(false);
    } catch (error) {
      enqueueSnackbar('Error downloading Excel template', { variant: 'error' });
      setIsDownloadingTemplate(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const reportTitle = dormantStock ? 'Dormant Stock' : 'Stock Movement';
  document.title = `${isFromDashboard ? 'Store' : activeStore?.name} - ${reportTitle} Report`;

  const exportedData = {
    organizationHasSubscribed: organizationHasSubscribed(
      MODULES.MANUFACTURING_AND_PROCESSING
    ),
    productCategories: watch('product_categories'),
    movementsData: movements,
    authOrganization: authOrganization,
    user: user,
    checkOrganizationPermission: checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_REPORTS,
      PERMISSIONS.STORE_VALUES,
    ]),
    store: isFromDashboard ? watch('store') : activeStore,
    reportTitle: reportTitle,
    withDetails: withDetails,
  };

  const handlExcelExport = async (exportedData) => {
    setIsDownloadingTemplate(true);
    try {
      // Get all current filter parameters
      const filters = buildFilters();
      const blob =
        await storeServices.exportStockMovementReportToExcel(exportedData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${!dormantStock ? 'Stock-Movement' : 'Dormant-Stock'} ${readableDate(filters.as_at, true)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
    } catch (e) {
      console.log('error exporting: ', e);
      enqueueSnackbar('Error exporting Excel', { variant: 'error' });
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const { data: productCategories, isLoading: isLoadingProductCategories } =
    useQuery({
      queryKey: ['productCategoryOptions'],
      queryFn: productCategoryServices.getCategoryOptions,
    });

  if (isLoadingProductCategories) {
    return <LinearProgress />;
  }

  return (
    <React.Fragment>
      <DialogTitle textAlign={'center'}>
        <Span className={classes.hiddenOnPrint}>
          <form autoComplete='off' onSubmit={handleSubmit(getMovements)}>
            <Grid
              container
              columnSpacing={1}
              paddingTop={2}
              rowSpacing={1}
              alignItems={'center'}
              justifyContent={'center'}
            >
              <Grid container size={12}>
                <Grid size={belowLargeScreen ? 11 : 12}>
                  <Typography variant='h3'>
                    {dormantStock ? 'Dormant Stock' : 'Stock Movement'}
                  </Typography>
                </Grid>
                {belowLargeScreen && (
                  <Grid size={1}>
                    <Tooltip title='Close'>
                      <IconButton
                        size='small'
                        sx={{ mb: 1 }}
                        onClick={() => toggleOpen(false)}
                      >
                        <HighlightOff color='primary' />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                )}
              </Grid>
              {isFromDashboard && (
                <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <StoreSelector
                      allowSubStores={true}
                      label='Store'
                      proposedOptions={authOrganization?.stores}
                      frontError={errors.store_id}
                      onChange={(newValue) => {
                        setValue(`store`, newValue);
                        setValue(`store_id`, newValue ? newValue.id : '', {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 0.3 }}>
                  <CostCenterSelector
                    label='Cost and Profit Centers'
                    multiple={true}
                    allowSameType={true}
                    onChange={(cost_centers) => {
                      setValue(
                        'cost_center_ids',
                        cost_centers.map((cost_center) => cost_center.id)
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 0.3 }}>
                  <Autocomplete
                    multiple
                    id='product-categories-select'
                    options={productCategories}
                    disableCloseOnSelect
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    renderOption={(props, option, { selected }) => (
                      <li {...props} key={`${option.id}-${props.id}`}>
                        <Checkbox
                          icon={<CheckBoxOutlineBlank fontSize='small' />}
                          checkedIcon={<CheckBox fontSize='small' />}
                          style={{ marginRight: 8 }}
                          checked={selected}
                          size='small'
                        />
                        <Typography variant='body2'>{option.name}</Typography>
                      </li>
                    )}
                    renderTags={(value, getTagProps) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {value.map((option, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={option.id}
                            label={option.name}
                            size='small'
                            sx={{ maxWidth: 200 }}
                          />
                        ))}
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Product Categories'
                        size='small'
                        fullWidth
                      />
                    )}
                    onChange={(event, newValue) => {
                      const categoryIds = newValue.map(
                        (category) => category.id
                      );
                      const categories = newValue.map((category) => category);
                      setValue('product_category_ids', categoryIds);
                      setValue('product_categories', categories);
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: isFromDashboard ? 3 : 6 }}>
                <Div sx={{ mt: 0.3 }}>
                  <DateTimePicker
                    label='From (MM/DD/YYYY)'
                    fullWidth
                    minDate={dayjs(
                      authOrganization.organization.recording_start_date
                    )}
                    maxDate={dayjs()}
                    value={watch('from') ? dayjs(watch('from')) : null}
                    onChange={(newValue) => {
                      setValue(
                        'from',
                        newValue ? newValue.toISOString() : null,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    }}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: isFromDashboard ? 3 : 6 }}>
                <Div sx={{ mt: 0.3 }}>
                  <DateTimePicker
                    label='To (MM/DD/YYYY)'
                    fullWidth
                    minDate={dayjs(
                      authOrganization.organization.recording_start_date
                    )}
                    maxDate={dayjs()}
                    value={watch('to') ? dayjs(watch('to')) : null}
                    onChange={(newValue) => {
                      setValue('to', newValue ? newValue.toISOString() : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                  />
                </Div>
              </Grid>
              <Grid container size={{ xs: 12, md: 12 }} textAlign={'right'}>
                <Grid size={{ xs: 6, md: 4 }} textAlign={'left'}>
                  <Div sx={{ mt: 0.3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={includeChildren}
                          onChange={(e) => {
                            const nextValue = e.target.checked;
                            setIncludeChildren(nextValue);
                            setValue('include_children', nextValue);
                            getMovements(
                              buildFilters({
                                include_children: nextValue,
                              })
                            );
                          }}
                        />
                      }
                      label='Include Substores'
                    />
                  </Div>
                </Grid>
                {checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS, PERMISSIONS.STORE_VALUES]) && (
                  <Grid size={{ xs: 6, md: 4 }} textAlign={'left'}>
                    <Div sx={{ mt: 0.3 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={withDetails}
                            onChange={async (e) => {
                              const newValue = e.target.checked;
                              setWithDetails(newValue);

                              // Reset to On-Screen tab when withDetails is enabled
                              if (newValue) {
                                setSelectedTab(0);
                              }

                              // Fetch data with the new withDetails value
                              const filters = buildFilters({
                                with_details: newValue,
                              });
                              await getMovements(filters);
                            }}
                          />
                        }
                        label='With more details'
                      />
                    </Div>
                  </Grid>
                )}
                <Grid size={{ xs: 12, md: 4 }} textAlign={'right'}>
                  <Stack
                    direction='row'
                    spacing={0.5}
                    justifyContent='flex-end'
                    alignItems='center'
                  >
                    <>
                      <LoadingButton
                        size='small'
                        onClick={() => handlExcelExport(exportedData)}
                        loading={isDownloadingTemplate}
                        variant='contained'
                        color='success'
                      >
                        Excel
                      </LoadingButton>
                      <LoadingButton
                        loading={isFetching}
                        type='submit'
                        size='small'
                        variant='contained'
                      >
                        Filter
                      </LoadingButton>
                    </>
                  </Stack>
                </Grid>
              </Grid>
            </Grid>
          </form>
          {/* Tabs - hidden when withDetails is true on below large screens */}
          {belowLargeScreen &&
            !isFetching &&
            movements?.movements?.length > 0 &&
            !withDetails && (
              <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                indicatorColor='primary'
                textColor='primary'
              >
                <Tab label='On-Screen' />
                <Tab label='PDF' />
              </Tabs>
            )}
        </Span>
      </DialogTitle>
      <DialogContent>
        {isFetching && (
          <div style={{ width: '100%', padding: '16px' }}>
            <Skeleton
              variant='text'
              width={180}
              height={32}
              style={{ borderRadius: 4, marginLeft: 'auto' }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={48}
              style={{ borderRadius: 4 }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={32}
              style={{ borderRadius: 4 }}
            />
          </div>
        )}
        {!isFetching && movements?.movements?.length > 0 && (
          <React.Fragment>
            {withDetails ? (
              // Show this message on ALL screens when withDetails is true
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 200,
                  p: 4,
                  textAlign: 'center',
                }}
              >
                <Typography variant='h2' sx={{ fontSize: 40, mb: 2 }}>
                  📊
                </Typography>
                <Typography variant='h6' color='text.secondary' gutterBottom>
                  Download Excel to view more details
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  The detailed view is only available in Excel format. Please
                  click the Excel button above to download the complete report.
                </Typography>
              </Box>
            ) : (
              // Show normal content when withDetails is false
              <React.Fragment>
                {belowLargeScreen && selectedTab === 0 ? (
                  <StockMovementOnScreen
                    movementsData={movements}
                    authOrganization={authOrganization}
                    user={user}
                    productCategories={watch('product_categories')}
                    checkOrganizationPermission={checkOrganizationPermission}
                    organizationHasSubscribed={organizationHasSubscribed}
                    store={isFromDashboard ? watch('store') : activeStore}
                    reportTitle={reportTitle}
                  />
                ) : (
                  <PDFContent
                    document={
                      <ReportDocument
                        organizationHasSubscribed={organizationHasSubscribed}
                        productCategories={watch('product_categories')}
                        movementsData={movements}
                        authOrganization={authOrganization}
                        user={user}
                        checkOrganizationPermission={
                          checkOrganizationPermission
                        }
                        store={isFromDashboard ? watch('store') : activeStore}
                        reportTitle={reportTitle}
                      />
                    }
                    fileName={
                      isFromDashboard
                        ? watch('store')?.name
                        : `${activeStore?.name} ${dormantStock ? 'Dormant Stock' : 'Stock Movement'} ${readableDate(watch('from'))}-${readableDate(watch('to'))}`
                    }
                  />
                )}
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          size='small'
          sx={{ mt: 1 }}
          variant='outlined'
          onClick={() => toggleOpen(false)}
        >
          Close
        </Button>
      </DialogActions>
    </React.Fragment>
  );
}

export default StockMovement;
