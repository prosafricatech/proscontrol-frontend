'use client';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import styled from '@emotion/styled';
import { faChartGantt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Span } from '@jumbo/shared';
import { CardIconText } from '@jumbo/shared/components/CardIconText';
import {
  DateRangeOutlined,
  DomainAddRounded,
  EditCalendarOutlined,
  Handshake,
  LocalGasStationOutlined,
  MoneyRounded,
  PointOfSaleRounded,
  PostAddRounded,
  PrecisionManufacturingRounded,
  ShoppingCartRounded,
  StorageRounded,
} from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Badge,
  Chip,
  Divider,
  Grid,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import React, { useState } from 'react';
import SubscriptionItemAction from './SubscriptionItemAction';
import {
  AdditionalFeature,
  Subscription,
  SubscriptionModule,
} from './SubscriptionTypes';

type ModuleIcons = {
  'Accounts & Finance': React.ReactNode;
  'Point Of Sale (POS)': React.ReactNode;
  'Procurement & Supply': React.ReactNode;
  'Project Management': React.ReactNode;
  'Fuel Station': React.ReactNode;
  'Manufacturing & Processing': React.ReactNode;
  [key: string]: React.ReactNode;
};

type FeatureIcons = {
  'Files Storage': React.ReactNode;
  'Additional Outlets': React.ReactNode;
  'Additional Projects': React.ReactNode;
  [key: string]: React.ReactNode;
};

function SubscriptionItem({
  subscription,
  isFromProsAfricanSubscriptions,
}: {
  subscription: Subscription;
  isFromProsAfricanSubscriptions: boolean;
}) {
  const dictionary = useDictionary();
  const subsDict = dictionary.organizations.profile.subscriptionsTab;

  const [expanded, setExpanded] = useState(false);

  const { theme } = useJumboTheme();
  const isDarkMode = theme.type === 'dark';
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const moduleIcons: ModuleIcons = {
    'Accounts & Finance': <MoneyRounded fontSize='large' />,
    'Point Of Sale (POS)': <PointOfSaleRounded fontSize='large' />,
    'Procurement & Supply': <ShoppingCartRounded fontSize='large' />,
    'Project Management': <FontAwesomeIcon size='lg' icon={faChartGantt} />,
    'Fuel Station': <LocalGasStationOutlined fontSize='large' />,
    'Manufacturing & Processing': (
      <PrecisionManufacturingRounded fontSize='large' />
    ),
  };

  const additionalFeatureIcons: FeatureIcons = {
    'Files Storage': <StorageRounded fontSize='large' />,
    'Additional Outlets': <DomainAddRounded fontSize='large' />,
    'Additional Projects': <PostAddRounded fontSize='large' />,
  };

  const totalModuleRate = subscription.modules.reduce(
    (total: number, module: SubscriptionModule) => total + module.rate,
    0
  );
  const totalAdditionalFeatureRate = subscription.additional_features.reduce(
    (total: number, additionalFeature: AdditionalFeature) =>
      total + additionalFeature.rate * additionalFeature.quantity,
    0
  );
  const totalMonthlyRate = totalModuleRate + totalAdditionalFeatureRate;
  const subscriptionValue = totalMonthlyRate * subscription.months;

  const Item = styled(Span)(({ theme }) => ({
    padding: theme.spacing(0, 1),
  }));

  return (
    <Accordion
      key={subscription.id}
      expanded={expanded}
      onChange={() => setExpanded((prev) => !prev)}
      sx={{
        borderRadius: 2,
        borderTop: 2,
        padding: 0.5,
        borderColor: 'divider',
        bgcolor: isDarkMode ? 'background.paper' : 'background.default',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <AccordionSummary
        expandIcon={
          isFromProsAfricanSubscriptions ? (
            !belowLargeScreen && (expanded ? <RemoveIcon /> : <AddIcon />)
          ) : expanded ? (
            <RemoveIcon />
          ) : (
            <AddIcon />
          )
        }
        sx={{
          px: 2,
          flexDirection: 'row-reverse',
          '&:hover': {
            bgcolor: isDarkMode ? 'grey.800' : 'action.hover',
          },
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': {
              margin: '10px 0',
            },
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',
            transform: 'none',
            mr: 1,
            '&.Mui-expanded': {
              transform: 'none',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
            '& svg': {
              fontSize: '0.9rem',
            },
          },
        }}
      >
        {isFromProsAfricanSubscriptions && (
          <Item>
            <Badge
              overlap='circular'
              sx={{
                '.MuiBadge-badge': {
                  border: '2px solid #FFF',
                  height: '14px',
                  width: '14px',
                  borderRadius: '50%',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 45,
                  height: 45,
                }}
                alt={subscription.organization?.name}
                src={
                  subscription.organization?.logo_path ||
                  '/assets/images/logo-symbol.png'
                }
              />
            </Badge>
          </Item>
        )}

        <Grid container spacing={2} sx={{ width: '100%' }}>
          {isFromProsAfricanSubscriptions && (
            <Grid size={12}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, md: 4, lg: 2.5 }}>
                  <Tooltip title={subsDict.labels.subscriptionNo}>
                    <Typography component='span' paddingLeft={{ md: 4 }}>
                      {subscription.subscriptionNo}
                    </Typography>
                  </Tooltip>
                </Grid>
                {subscription.organization && (
                  <Grid size={{ xs: 12, md: 4, lg: 5.5 }}>
                    <Tooltip title={subsDict.labels.organizationName}>
                      <Typography
                        variant='h4'
                        sx={{ color: isDarkMode ? 'text.primary' : 'inherit' }}
                      >
                        {subscription.organization.name}
                      </Typography>
                    </Tooltip>
                  </Grid>
                )}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Tooltip title={subsDict.labels.subscriptionValue}>
                    <Typography
                      paddingLeft={{ md: 3 }}
                      variant='h4'
                      textAlign={'end'}
                      sx={{ color: isDarkMode ? 'text.primary' : 'inherit' }}
                    >
                      {subscriptionValue.toLocaleString('en-US', {
                        style: 'currency',
                        currency: subscription.currency.code,
                      })}
                    </Typography>
                  </Tooltip>
                </Grid>
              </Grid>
              <Divider sx={{ marginBottom: 0.5 }} />
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 4, lg: 3.5 }}>
            <ListItemText
              primary={
                <Tooltip title={subsDict.labels.createdOn}>
                  <Stack direction={'row'} spacing={1}>
                    <EditCalendarOutlined fontSize={'small'} />
                    <Typography component='span' variant='caption'>
                      {readableDate(subscription.created_at)}
                    </Typography>
                  </Stack>
                </Tooltip>
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4, lg: 5.5 }}>
            <Tooltip title={subsDict.labels.dateRange}>
              <Stack direction={'row'} alignItems={'center'} spacing={1}>
                <DateRangeOutlined fontSize={'small'} />
                <Typography variant='caption'>
                  {`${readableDate(subscription.start_date, true)} - ${readableDate(subscription.end_date, true)}`}
                </Typography>
              </Stack>
            </Tooltip>
            {!!subscription?.successor && (
              <Tooltip title={subsDict.labels.successor}>
                <Stack direction={'row'} alignItems={'center'} spacing={1}>
                  <Handshake fontSize={'small'} />
                  <Typography variant='caption'>
                    {`${readableDate(subscription.successor.start_date, true)} - ${readableDate(subscription.successor.end_date, true)} - (${subscription.successor.subscriptionNo})`}
                  </Typography>
                </Stack>
              </Tooltip>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 4, lg: 3 }}>
            <Tooltip title={subsDict.labels.status}>
              <Stack direction={'row'} display='flex' justifyContent='flex-end'>
                <Chip
                  size='small'
                  color={
                    subscription.days_remaining <= 0
                      ? !!subscription?.successor
                        ? 'info'
                        : 'error'
                      : subscription.days_remaining < 30
                        ? !!subscription?.successor
                          ? 'info'
                          : 'warning'
                        : 'success'
                  }
                  label={
                    subsDict.status[subscription.status.toLowerCase()] ||
                    subscription.status
                  }
                  sx={{
                    color: 'white',
                  }}
                />
              </Stack>
            </Tooltip>
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          marginBottom: 3,
        }}
      >
        <JumboCardQuick sx={{ bgcolor: 'transparent' }}>
          <Grid container spacing={1}>
            {isFromProsAfricanSubscriptions && (
              <Grid size={12} textAlign={'end'}>
                <SubscriptionItemAction subscription={subscription} />
                <Divider />
              </Grid>
            )}
            <Grid size={12}>
              <Typography variant='h3' align='center'>
                {subsDict.labels.modules}
              </Typography>
            </Grid>
            {subscription.modules.map((module: SubscriptionModule) => (
              <Grid key={module.id} size={{ xs: 12, md: 4, lg: 3 }}>
                <CardIconText
                  icon={moduleIcons[module.name]}
                  title={
                    <Typography
                      fontWeight={'bold'}
                      sx={{ color: isDarkMode ? 'white' : 'black' }}
                    >
                      {module.rate.toLocaleString('en-US', {
                        style: 'currency',
                        currency: subscription.currency?.code,
                      })}
                    </Typography>
                  }
                  subTitle={
                    <Typography
                      variant='caption'
                      sx={{ color: isDarkMode ? 'grey.300' : 'text.secondary' }}
                    >
                      {module.name}
                    </Typography>
                  }
                  disableHoverEffect={true}
                  color={'primary.main'}
                  hideArrow={true}
                  variant='outlined'
                />
              </Grid>
            ))}
            <Grid size={12} p={1}>
              <Typography textAlign={'center'} fontWeight={'bold'}>
                {subsDict.labels.modulesMonthlyCost}:{' '}
                {totalModuleRate.toLocaleString('en-US', {
                  style: 'currency',
                  currency: subscription.currency.code,
                })}
              </Typography>
            </Grid>
            {subscription.additional_features.length > 0 && (
              <>
                <Grid size={12}>
                  <Typography paddingTop={3} variant='h3' align='center'>
                    {subsDict.labels.additionalFeatures}
                  </Typography>
                </Grid>
                {subscription.additional_features.map(
                  (additionalFeature: AdditionalFeature) => (
                    <Grid
                      key={additionalFeature.id}
                      size={{ xs: 12, md: 4, lg: 3 }}
                    >
                      <CardIconText
                        icon={
                          additionalFeatureIcons[additionalFeature.feature.name]
                        }
                        title={
                          <Grid container justifyContent='space-between'>
                            <Tooltip title='Monthly Rate'>
                              <Typography
                                variant='caption'
                                sx={{
                                  color: isDarkMode
                                    ? 'grey.300'
                                    : 'text.secondary',
                                }}
                              >
                                {additionalFeature.rate.toLocaleString(
                                  'en-US',
                                  {
                                    style: 'currency',
                                    currency: subscription.currency.code,
                                  }
                                )}
                              </Typography>
                            </Tooltip>
                            <Tooltip title='Quantity'>
                              <Typography
                                variant='caption'
                                sx={{
                                  color: isDarkMode
                                    ? 'grey.300'
                                    : 'text.secondary',
                                }}
                              >
                                {`${additionalFeature.quantity} ${additionalFeature.feature.unit.symbol}`}
                              </Typography>
                            </Tooltip>
                          </Grid>
                        }
                        subTitle={
                          <Grid
                            container
                            direction='column'
                            alignItems='center'
                          >
                            <Tooltip title='Amount'>
                              <Typography
                                fontWeight={'bold'}
                                sx={{ color: isDarkMode ? 'white' : 'black' }}
                              >
                                {(
                                  additionalFeature.rate *
                                  additionalFeature.quantity
                                ).toLocaleString('en-US', {
                                  style: 'currency',
                                  currency: subscription.currency.code,
                                })}
                              </Typography>
                            </Tooltip>
                            <Typography
                              variant='caption'
                              sx={{
                                color: isDarkMode
                                  ? 'grey.300'
                                  : 'text.secondary',
                              }}
                            >
                              {additionalFeature.feature.name}
                            </Typography>
                          </Grid>
                        }
                        disableHoverEffect={true}
                        color={'primary.main'}
                        hideArrow={true}
                        variant='outlined'
                      />
                    </Grid>
                  )
                )}
                <Grid size={12} p={1}>
                  <Typography textAlign={'center'} fontWeight={'bold'}>
                    {subsDict.labels.featuresMonthlyCost}:{' '}
                    {totalAdditionalFeatureRate.toLocaleString('en-US', {
                      style: 'currency',
                      currency: subscription.currency.code,
                    })}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </JumboCardQuick>
      </AccordionDetails>
    </Accordion>
  );
}

export default SubscriptionItem;
