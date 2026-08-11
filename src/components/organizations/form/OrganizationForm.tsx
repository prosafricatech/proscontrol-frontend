'use client';
import React, { useEffect, useState } from 'react';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Box,
  Checkbox,
  Divider,
  FormHelperText,
  Grid,
  IconButton,
  Input,
  InputLabel,
  ListItem,
  ListItemAvatar,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import * as yup from 'yup';
import { CorporateFareOutlined, InfoRounded, ListOutlined } from '@mui/icons-material';
import { yupResolver } from '@hookform/resolvers/yup';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';
import { Div, Span } from '@jumbo/shared';
import Link from 'next/link';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { useRouter } from 'next/navigation';
import { COUNTRIES } from '@/utilities/constants/countries';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { CURRENCIES } from '@/utilities/constants/currencies';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import { MODULES } from '@/utilities/constants/modules';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { Organization } from '@/types/auth-types';
import organizationServices from '../organizationServices';

interface Country {
  code: string;
  name: string;
  currency: Currency;
  [key: string]: any;
}

interface Currency {
  code: string;
  name: string;
  name_plural: string;
  symbol: string;
  [key: string]: any;
}

interface OrganizationFormProps {
  organization?: Organization | null;
}

interface FormValues {
  id?: string;
  name: string;
  email?: string | null;
  phone: string;
  tin?: string | null;
  recording_start_date: string;
  address?: string | null;
  vat_registered: boolean;
  vrn?: string | null;
  vat_percentage?: number;
  defer_grn_billing?: boolean;
  defer_project_certificate_invoicing?: boolean;
  standard_hours_per_month?: number | null;
  symbol_path?: string | null;
  main_color: string;
  light_color: string;
  dark_color: string;
  contrast_text: string;
  tagline?: string | null;
  country_code: string;
  currency_code: string;
  website?: string | null;
  logo?: FileList | null;
  organization_symbol?: FileList | null;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({ organization = null }) => {
    const dictionary = useDictionary();
    const lang = useLanguage();
    const dictForm = dictionary.organizations.form;
    const validation = dictForm.errors.validation;

    const { enqueueSnackbar } = useSnackbar();
    const { configAuth, authUser, checkPermission, checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
    const hasProjectManagement = organizationHasSubscribed(MODULES.PROJECT_MANAGEMENT);
    const hasProcurementAndSupply = organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY);
    const router = useRouter();
    const queryClient = useQueryClient();
    const theme = useTheme();

    const allCountries = Object.values(COUNTRIES).map((country: any) => country as Country);
    const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

    const canCreateOrganization = checkPermission([PROS_CONTROL_PERMISSIONS.ORGANIZATIONS_MANAGE]);
    const canEditOrganization = canCreateOrganization || (organization && checkOrganizationPermission([PERMISSIONS.ORGANIZATION_UPDATE]));

    const validationSchema = yup.object({
        id: yup.string().optional(),
        name: yup
            .string()
            .required(validation.name.required)
            .min(3, validation.name.min)
            .max(100, validation.name.max),
        email: yup
            .string()
            .email(validation.email.invalid)
            .nullable(),
        phone: yup
            .string()
            .required(validation.phone.required)
            .matches(
            /^\+?[0-9]{10,15}$/,
            validation.phone.invalid
            ),
        tin: yup.string().nullable(),
        recording_start_date: yup
            .string()
            .required(validation.recordingStart.required),
        address: yup.string().nullable(),
        website: yup
            .string()
            .matches(
            /^$|((https?):\/\/)?(www\.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
            validation.website.invalid
            )
            .nullable(),
        country_code: yup
            .string()
            .required(validation.country.required),
        currency_code: yup
            .string()
            .required(validation.currency.required),
        vat_registered: yup.boolean(),
        vrn: yup.string().when('vat_registered', {
            is: true,
            then: (schema) =>
            schema.required(validation.vrn.required),
            otherwise: (schema) => schema.nullable(),
        }),
        vat_percentage: yup.number().when('vat_registered', {
            is: true,
            then: (schema) =>
            schema
                .positive(validation.vatPercentage.min)
                .max(100, validation.vatPercentage.max)
                .required(validation.vatPercentage.required),
            otherwise: (schema) => schema.positive().optional(),
        }),
        symbol_path: yup.string().nullable(),
        main_color: yup
            .string()
            .matches(
                /^#([0-9A-Fa-f]{3}){1,2}$/i,
                validation.colors.invalid
            )
            .default(theme.palette.primary.main),
        light_color: yup
            .string()
            .matches(
                /^#([0-9A-Fa-f]{3}){1,2}$/i,
                validation.colors.invalid
            )
            .default('#bec5da'),
        dark_color: yup
            .string()
            .matches(
                /^#([0-9A-Fa-f]{3}){1,2}$/i,
                validation.colors.invalid
            )
            .default(theme.palette.primary.dark),
        contrast_text: yup
            .string()
            .matches(
                /^#([0-9A-Fa-f]{3}){1,2}$/i,
                validation.colors.invalid
            )
            .default(theme.palette.primary.contrastText),
        tagline: yup
            .string()
            .max(50, validation.tagline.max)
            .nullable(),
        defer_grn_billing: yup.boolean(),
        defer_project_certificate_invoicing: yup.boolean(),
        standard_hours_per_month: yup
            .number()
            .typeError('Standard hours per month must be a number')
            .positive('Standard hours per month must be greater than 0')
            .nullable(),
    });

    const {
        handleSubmit,
        register,
        setValue,
        watch,
        setError,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: yupResolver(validationSchema) as any,
        defaultValues: {
        id: organization?.id,
        name: organization?.name || '',
        email: organization?.email ?? null,
        phone: organization?.phone || '',
        tin: organization?.tin ?? null,
        recording_start_date: organization?.recording_start_date || '',
        address: organization ? organization.address : null,
        vat_registered: organization?.settings?.vat_registered
            ? organization.settings.vat_registered
            : false,
        vrn: organization?.settings?.vrn ? organization.settings.vrn : null,
        vat_percentage: organization?.settings?.vat_percentage
            ? organization.settings.vat_percentage
            : 18,
        defer_grn_billing: !!organization?.settings?.defer_grn_billing,
        defer_project_certificate_invoicing: !!organization?.settings?.defer_project_certificate_invoicing,
        standard_hours_per_month: organization?.settings?.standard_hours_per_month ?? null,
        symbol_path: organization?.settings?.symbol_path
            ? organization.settings.symbol_path
            : null,
        main_color: organization?.settings?.main_color
            ? organization.settings.main_color
            : theme.palette.primary.main,
        light_color: organization?.settings?.light_color
            ? organization.settings.light_color
            : '#bec5da',
        dark_color: organization?.settings?.dark_color
            ? organization.settings.dark_color
            : theme.palette.primary.dark,
        contrast_text: organization?.settings?.contrast_text
            ? organization.settings.contrast_text
            : theme.palette.primary.contrastText,
        tagline: organization?.settings?.tagline ? organization.settings.tagline : null,
        country_code: organization?.country_code,
        currency_code: selectedCurrency?.code,
        },
    });

    const addOrganization = useMutation<any, Error, FormValues>({
        mutationFn: organizationServices.create,
        onSuccess: async (data) => {
        if (configAuth) {
            configAuth({
            currentOrganization: data.newOrganization,
            currentUser: data.authUser,
            });
        }
        router.push(`/${lang}/organizations/profile/${data.newOrganization.organization.id}`);
        enqueueSnackbar(
            dictForm.messages.createSuccess,
            { variant: 'success' }
        );
        },
        onError: (error: any) => {
        if (error?.response?.data?.validation_errors) {
            Object.entries(error.response.data.validation_errors).forEach(
            ([fieldName, messages]) => {
                setError(fieldName as keyof FormValues, {
                type: 'manual',
                message: (messages as string[]).join('<br/>'),
                });
            }
            );
        } else if (error?.response?.data?.message) {
            enqueueSnackbar(error.response.data.message, { variant: 'error' });
        }
        },
    });

    const updateOrganization = useMutation<any, Error, FormValues>({
        mutationFn: organizationServices.update,
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ['organizationDetails'] });
          enqueueSnackbar(
              dictForm.messages.updateSuccess,
              { variant: 'success' }
          );
          router.push(`/${lang}/organizations`);
        },
        onError: (error: any) => {
            if (error?.response?.data?.validation_errors) {
              Object.entries(error.response.data.validation_errors).forEach(
              ([fieldName, messages]) => {
                setError(fieldName as keyof FormValues, {
                  type: 'manual',
                  message: (messages as string[]).join('<br/>'),
                });
              }
                );
            } else if (error?.response?.data?.message) {
              enqueueSnackbar(error.response.data.message, { variant: 'error' });
            }
        },
    });

    const saveMutation = React.useMemo(() => {
        return organization ? updateOrganization.mutate : addOrganization.mutate;
    }, [updateOrganization, addOrganization]);

    useEffect(() => {
        if (organization) {
            const organizationCountry = allCountries.find(
                (country) => country.code === organization.country_code
            );
            setSelectedCountry(organizationCountry || null);
            if (organizationCountry?.currency) {
                setSelectedCurrency(organizationCountry.currency);
            }
        }
    }, [organization]);

    useEffect(() => {
        if (selectedCurrency) {
        setValue('currency_code', selectedCurrency.code);
        }
    }, [selectedCurrency]);

    useEffect(() => {
        if (!canEditOrganization) {
        router.push(`/${lang}/dashboard`);
        }
    }, [authUser, organization]);

    const saveHandler: SubmitHandler<FormValues> = (formData) => {
        saveMutation(formData);
    };

  return (
    <React.Fragment>
      {(addOrganization.isPending || updateOrganization.isPending) && (
        <BackdropSpinner message={dictForm.messages.loading} />
      )}
      <JumboCardQuick
        title={
          <Typography variant={'h4'}>
            <CorporateFareOutlined />{' '}
            {dictForm.labels.basicInfo}
          </Typography>
        }
        action={
          <Span>
            {organization && (
              <Link href={`/${lang}/organizations/profile/${organization.id}`} passHref>
                <IconButton>
                  <Tooltip
                    title={dictForm.buttons.viewProfile}
                    disableInteractive
                  >
                    <InfoRounded />
                  </Tooltip>
                </IconButton>
              </Link>
            )}
            <Link href={`/${lang}/organizations`} passHref>
              <IconButton>
                <Tooltip
                  title={dictForm.buttons.viewList}
                  disableInteractive
                >
                  <ListOutlined />
                </Tooltip>
                </IconButton>
            </Link>
          </Span>
        }
      >
        <form onSubmit={handleSubmit(saveHandler)} autoComplete="off">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={dictForm.labels.name}
                placeholder={dictForm.placeholders.name}
                size="small"
                autoComplete="off"
                error={!!errors?.name}
                helperText={errors?.name?.message}
                {...register('name')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={dictForm.labels.email}
                placeholder={dictForm.placeholders.email}
                size="small"
                autoComplete="off"
                error={!!errors?.email}
                helperText={errors?.email?.message}
                {...register('email')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={dictForm.labels.phone}
                placeholder={dictForm.placeholders.phone}
                size="small"
                autoComplete="off"
                error={!!errors?.phone}
                helperText={errors?.phone?.message}
                {...register('phone')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={dictForm.labels.website}
                placeholder={dictForm.placeholders.website}
                size="small"
                error={!!errors?.website}
                helperText={errors?.website?.message}
                {...register('website')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4, lg: 4 }}>
              <DatePicker
                label={dictForm.labels.recordingStart}
                defaultValue={
                  organization ? dayjs(organization.recording_start_date) : null
                }
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    error: !!errors?.recording_start_date,
                    helperText:
                      errors?.recording_start_date?.message ||
                      dictForm.helpText.recordingStart,
                  },
                }}
                onChange={(newValue) => {
                  setValue(
                    'recording_start_date',
                    newValue ? newValue.toISOString() : '',
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    }
                  );
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4, lg: 4 }}>
              <TextField
                fullWidth
                label={dictForm.labels.tin}
                placeholder={dictForm.placeholders.tin}
                size="small"
                autoComplete="off"
                error={!!errors?.tin}
                helperText={
                  errors?.tin?.message || dictForm.helpText.tin
                }
                {...register('tin')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                id="checkbox-countries"
                options={allCountries.sort((a, b) => a.name.localeCompare(b.name))}
                isOptionEqualToValue={(option, value) => option.code === value?.code}
                value={selectedCountry}
                getOptionLabel={(option) => `${option.name} (${option.code})`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={dictForm.labels.country}
                    size="small"
                    autoComplete="off"
                    fullWidth
                    error={!!errors.country_code}
                    helperText={errors.country_code?.message}
                  />
                )}
                onChange={(e, newValue) => {
                  setSelectedCountry(newValue);
                  setValue('country_code', newValue ? newValue.code : '', {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  setValue(
                    'currency_code',
                    newValue ? newValue.currency.code : '',
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                    }
                  );
                  setSelectedCurrency(newValue?.currency || null);
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                id="checkbox-currencies"
                options={CURRENCIES.sort((a, b) => a.name.localeCompare(b.name))}
                isOptionEqualToValue={(option, value) => option.code === value?.code}
                getOptionLabel={(option) => `${option.name_plural} (${option.code})`}
                value={selectedCurrency}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={dictForm.labels.currency}
                    size="small"
                    autoComplete="off"
                    fullWidth
                    error={!!errors.currency_code}
                    helperText={errors.currency_code?.message}
                  />
                )}
                onChange={(e, newValue) => {
                  setSelectedCurrency(newValue);
                  setValue('currency_code', newValue ? newValue.code : '', {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <TextField
                fullWidth
                label={dictForm.labels.address}
                placeholder={dictForm.placeholders.address}
                size="small"
                multiline={true}
                minRows={2}
                {...register('address')}
              />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ m: 1, mt: 3 }}>
              <Typography variant="body1">
                {dictForm.labels.vatSection}
              </Typography>
              <Divider />
            </Grid>
            <Grid size={{ xs: 12, md: 4, lg: 3 }}>
              <Typography variant="body1">
                {dictForm.labels.vatRegistered}
              </Typography>
              <Checkbox
                checked={!!watch('vat_registered')}
                size="small"
                onChange={(e) => {
                  const checked = e.target.checked;
                  setValue('vat_registered', checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label={dictForm.labels.vrn}
                placeholder={dictForm.placeholders.vrn}
                size="small"
                error={!!errors?.vrn}
                helperText={
                  errors?.vrn?.message || dictForm.helpText.vrn
                }
                {...register('vrn')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                label={dictForm.labels.vatPercentage}
                placeholder={dictForm.placeholders.vatPercentage}
                size="small"
                error={!!errors?.vat_percentage}
                helperText={errors?.vat_percentage?.message}
                InputProps={{
                  endAdornment: '%',
                }}
                {...register('vat_percentage')}
              />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ m: 1, mt: 3 }}>
              <Typography variant="body1">
                Workflow Settings
              </Typography>
              <Divider />
            </Grid>
            {hasProcurementAndSupply && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" alignItems="center">
                  <Checkbox
                    checked={!!watch('defer_grn_billing')}
                    size="small"
                    onChange={(e) => {
                      setValue('defer_grn_billing', e.target.checked, {
                        shouldDirty: true,
                      });
                    }}
                  />
                  <Typography variant="body2">
                    Bill suppliers separately from GRNs (credits an Unbilled Goods
                    account on receipt; a Purchase Bill later moves the balance
                    to the supplier)
                  </Typography>
                </Box>
              </Grid>
            )}
            {hasProjectManagement && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" alignItems="center">
                  <Checkbox
                    checked={!!watch('defer_project_certificate_invoicing')}
                    size="small"
                    onChange={(e) => {
                      setValue(
                        'defer_project_certificate_invoicing',
                        e.target.checked,
                        { shouldDirty: true }
                      );
                    }}
                  />
                  <Typography variant="body2">
                    Project Certificates start as drafts and only debit the
                    customer once explicitly invoiced
                  </Typography>
                </Box>
              </Grid>
            )}
            <Grid size={{ xs: 12 }} sx={{ m: 1, mt: 3 }}>
              <Typography variant="body1">
                Payroll Settings
              </Typography>
              <Divider />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Standard Hours per Month"
                size="small"
                error={!!errors?.standard_hours_per_month}
                helperText={
                  errors?.standard_hours_per_month?.message ||
                  'Default used to derive monthly-paid employees’ hourly rate for overtime — overridable per employee contract'
                }
                {...register('standard_hours_per_month')}
              />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ m: 1, mt: 3 }}>
              <Typography variant="body1">
                {dictForm.labels.brandingSection}
              </Typography>
              <Divider />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Input type="file" id="logo" error={!!errors?.logo} {...register('logo')} />
              {!errors?.logo ? (
                <InputLabel sx={{ mb: 1 }} id="logo-label" htmlFor={'logo'}>
                  {dictForm.labels.logo}
                </InputLabel>
              ) : (
                <FormHelperText error={!!errors?.logo}>
                  {errors?.logo?.message}
                </FormHelperText>
              )}
              <FormHelperText>
                {dictForm.messages.imageGuide}
              </FormHelperText>
              {organization?.logo_path && (
                <ListItem
                  alignItems="flex-start"
                  sx={{ p: (theme) => theme.spacing(1, 3) }}
                >
                  <ListItemAvatar
                    sx={{ mr: 2, overflow: 'hidden', borderRadius: 2 }}
                  >
                    <img
                      width={'140'}
                      height={'105'}
                      style={{ verticalAlign: 'middle' }}
                      alt={`${organization.name} logo`}
                      src={organization.logo_path}
                    />
                  </ListItemAvatar>
                </ListItem>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Input
                type="file"
                id="organization_symbol"
                error={!!errors?.organization_symbol}
                {...register('organization_symbol')}
              />
              {!errors?.organization_symbol ? (
                <InputLabel
                  sx={{ mb: 1 }}
                  id="symbol-label"
                  htmlFor={'organization_symbol'}
                >
                  {dictForm.labels.symbol}
                </InputLabel>
              ) : (
                <FormHelperText error={!!errors?.organization_symbol}>
                  {errors?.organization_symbol?.message}
                </FormHelperText>
              )}
              <FormHelperText>
                {dictForm.messages.imageGuide}
              </FormHelperText>
              {organization?.settings?.symbol_path && (
                <ListItem
                  alignItems="flex-start"
                  sx={{ p: (theme) => theme.spacing(1, 3) }}
                >
                  <ListItemAvatar
                    sx={{ mr: 2, overflow: 'hidden', borderRadius: 2 }}
                  >
                    <img
                      width={'140'}
                      height={'105'}
                      style={{ verticalAlign: 'middle' }}
                      alt={`${organization.name} symbol`}
                      src={organization.settings.symbol_path}
                    />
                  </ListItemAvatar>
                </ListItem>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                    <InputLabel sx={{ mb: 1 }} id="main-color-label" htmlFor={'main_color'}>
                      {dictForm.labels.mainColor}
                    </InputLabel>
                    <Input
                        fullWidth
                        type="color"
                        id="main_color"
                        value={watch('main_color') || theme.palette.primary.main}
                        onChange={(e) => {
                            setValue('main_color', e.target.value, {
                            shouldValidate: true
                            });
                        }}
                        error={!!errors?.main_color}
                    />
                    {errors?.main_color && (
                        <FormHelperText error>
                            {errors.main_color.message}
                        </FormHelperText>
                    )}
                    <FormHelperText>
                         {dictForm.messages.colorGuide}
                    </FormHelperText>
                </Div>
                <Div sx={{ mt: 1, mb: 1 }}>
                    <InputLabel sx={{ mb: 1 }} id="light-color-label" htmlFor={'light_color'}>
                        {dictForm.labels.lightColor}
                    </InputLabel>
                    <Input
                        fullWidth
                        type="color"
                        id="light_color"
                        value={watch('light_color') || '#bec5da'}
                        onChange={(e) => {
                            setValue('light_color', e.target.value, {
                            shouldValidate: true
                            });
                        }}
                        error={!!errors?.light_color}
                    />
                    {errors?.light_color && (
                        <FormHelperText error>
                            {errors.light_color.message}
                        </FormHelperText>
                    )}
                    <FormHelperText>
                       {dictForm.messages.colorGuide}
                    </FormHelperText>
                </Div>
                <Div sx={{ mt: 1, mb: 1 }}>
                    <InputLabel sx={{ mb: 1 }} id="dark-color-label" htmlFor={'dark_color'}>
                        {dictForm.labels.darkColor}
                    </InputLabel>
                    <Input
                        fullWidth
                        type="color"
                        id="dark_color"
                        value={watch('dark_color') || theme.palette.primary.dark}
                        onChange={(e) => {
                            setValue('dark_color', e.target.value, {
                            shouldValidate: true
                            });
                        }}
                        error={!!errors?.dark_color}
                    />
                    {errors?.dark_color && (
                        <FormHelperText error>
                            {errors.dark_color.message}
                        </FormHelperText>
                    )}
                    <FormHelperText>
                        {dictForm.messages.colorGuide}
                    </FormHelperText>
                </Div>
                <Div sx={{ mt: 1, mb: 1 }}>
                    <InputLabel sx={{ mb: 1 }} id="contrast-text-label" htmlFor={'contrast_text'}>
                        {dictForm.labels.contrastText}
                    </InputLabel>
                    <Input
                        fullWidth
                        type="color"
                        id="contrast_text"
                        value={watch('contrast_text') || theme.palette.primary.contrastText}
                        onChange={(e) => {
                            setValue('contrast_text', e.target.value, {
                            shouldValidate: true
                            });
                        }}
                        error={!!errors?.contrast_text}
                    />
                    {errors?.contrast_text && (
                        <FormHelperText error>
                            {errors.contrast_text.message}
                        </FormHelperText>
                    )}
                    <FormHelperText>
                         {dictForm.messages.colorGuide}
                    </FormHelperText>
                </Div>
                <Div sx={{ mt: 3, mb: 1 }}>
                    <TextField
                        fullWidth
                        label={dictForm.labels.tagline}
                        placeholder={dictForm.placeholders.tagline}
                        size="small"
                        error={!!errors?.tagline}
                        helperText={errors?.tagline?.message}
                        {...register('tagline')}
                    />
                </Div>
                </Grid>
            <Grid size={{ xs: 12 }}>
              <Box display={'flex'} justifyContent={'flex-end'}>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  size="small"
                  sx={{ mb: 3, display: 'flex' }}
                  loading={addOrganization.isPending || updateOrganization.isPending}
                >
                  {dictForm.buttons.submit}
                </LoadingButton>
              </Box>
            </Grid>
          </Grid>
        </form>
      </JumboCardQuick>
    </React.Fragment>
  );
};

export default OrganizationForm;