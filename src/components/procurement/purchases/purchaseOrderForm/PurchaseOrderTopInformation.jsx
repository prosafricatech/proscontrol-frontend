import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import StakeholderQuickAdd from '@/components/masters/stakeholders/StakeholderQuickAdd';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Div } from '@jumbo/shared';
import { AddOutlined } from '@mui/icons-material';
import { Grid, TextField, Tooltip } from '@mui/material';
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import React, { useEffect } from 'react'

function PurchaseOrderTopInformation({setValue, errors, clearErrors, watch, register, order, setStakeholderQuickAddDisplay, setAddedStakeholder, stakeholderQuickAddDisplay, addedStakeholder, order_date, costCenters, lockedCurrencyId = null, isCurrencyLocked = false}) {
    const {authOrganization,checkOrganizationPermission} = useJumboAuth();
    const cp = {id:null,name: 'Cash Purchase'};
    const canCashPurchase = checkOrganizationPermission(PERMISSIONS.PURCHASES_INSTANT_PAY);

    // setvalues from coming addedStakeholder
    useEffect(() => {
        if(addedStakeholder?.id){
            setValue('stakeholder_id', addedStakeholder.id);
            setValue('tin', addedStakeholder.tin, {
               shouldTouch: true,
            });
            setValue('vrn', addedStakeholder.vrn);
            setStakeholderQuickAddDisplay(false)
        }
    }, [addedStakeholder])
    
  return (
    <Grid container columnSpacing={1} rowSpacing={2}>
        <Grid size={{xs: 12, md: 4}}>
            <Div sx={{mt: 0.3}}>
                <DateTimePicker
                    fullWidth={true}
                    label="Order Date"
                    minDate={checkOrganizationPermission(PERMISSIONS.PURCHASES_BACKDATE) ? dayjs(authOrganization.organization.recording_start_date) : dayjs().startOf('day')}
                    maxDate={checkOrganizationPermission(PERMISSIONS.PURCHASES_POSTDATE) ? dayjs().add(10,'year').endOf('year') : dayjs().endOf('day')}
                    defaultValue={order_date}
                    slotProps={{
                        textField : {
                        size: 'small',
                        fullWidth: true,
                        readOnly: true,
                        error: !!errors?.order_date,
                        helperText: errors?.order_date?.message
                        }
                    }}
                    onChange={(newValue) => {
                        setValue('order_date', newValue ? newValue.toISOString() : null,{
                        shouldValidate: true,
                        shouldDirty: true
                        });
                    }}
                />
            </Div>
        </Grid>
        { !stakeholderQuickAddDisplay && 
            <Grid size={{xs: 12, md: 8}}>
                <Div sx={{ mt: 0.3 }}>
                    <StakeholderSelector
                        label='Vendor'
                        frontError={errors?.stakeholder_id}
                        defaultValue={order && order.stakeholder.id}
                        addedStakeholder={addedStakeholder}
                        initialOptions={canCashPurchase ? [cp] : []}
                        onChange={(newValue) => {
                        setValue('stakeholder_id', newValue ? newValue.id: null,{
                            shouldDirty: true,
                            shouldValidate: true
                        });
                        setValue('tin', newValue ? newValue.tin : null,{
                            shouldTouch:true,
                        });
                        setValue('vrn', newValue ? newValue.vrn : null);
                        setValue('instant_pay', !newValue?.id ? checkOrganizationPermission(PERMISSIONS.PURCHASES_INSTANT_PAY) : false);
                        setValue('instant_receive', !newValue?.id ? checkOrganizationPermission(PERMISSIONS.PURCHASES_INSTANT_RECEIVE) : false);
                        if(!newValue?.id){
                            setValue('instant_invoice',false,{
                            shouldDirty: true,
                            shouldValidate: true
                            });
                        }
                        }}
                        startAdornment= {
                            checkOrganizationPermission(PERMISSIONS.STAKEHOLDERS_CREATE) && (
                                <Tooltip title="Add Supplier">
                                    <AddOutlined
                                        onClick={() => setStakeholderQuickAddDisplay(true)}
                                        sx={{ cursor: 'pointer' }}
                                    />
                                </Tooltip>
                            )
                        }
                    />
                </Div>
            </Grid>
        }

        {!!stakeholderQuickAddDisplay && <StakeholderQuickAdd setStakeholderQuickAddDisplay={setStakeholderQuickAddDisplay} create_payable={true} setAddedStakeholder={setAddedStakeholder}/>} 

        <Grid size={12}>
            <Grid container rowSpacing={2} columnSpacing={1}>
                <Grid size={{xs: 12, md: 4}}>
                    <Div sx={{mt: 0.3}}>
                        <TextField
                            size='small'
                            label='Reference'
                            fullWidth
                            error={!!errors?.reference}
                            helperText={errors?.reference?.message}
                            {...register('reference')}
                        />
                    </Div>
                </Grid>
                <Grid size={{xs: 12, md: 4}}>
                    <Div sx={{mt: 0.3}}>
                        <DatePicker
                            fullWidth={true}
                            label="Date required"
                            minDate={order && dayjs(order.order_date)}
                            defaultValue={order && dayjs(order.date_required)}
                            slotProps={{
                                textField : {
                                    size: 'small',
                                    fullWidth: true,
                                    readOnly: true,
                                    error: !!errors?.order_date,
                                    helperText: errors?.order_date?.message
                                }
                            }}
                            onChange={(newValue) => {
                                setValue('date_required', newValue ? newValue.toISOString() : null,{
                                shouldValidate: true,
                                shouldDirty: true
                                });
                            }}
                        />
                    </Div>
                </Grid>
                <Grid size={{xs: 12, md: 4}}>
                    <Div sx={{mt: 0.3}}>
                        <CurrencySelector
                            key={watch('currency_id') || 1}
                            frontError={errors?.currency_id}
                            disabled={isCurrencyLocked}
                            defaultValue={watch('currency_id') || 1}
                            onChange={(newValue) => {
                                setValue('currency_id', newValue ? newValue.id : null,{
                                shouldDirty: true,
                                shouldValidate: true
                                });

                                clearErrors('exchange_rate');

                                setValue('exchange_rate', newValue?.exchangeRate ? newValue.exchangeRate : 1);

                            }}
                        />
                    </Div>
                </Grid>
                {
                   watch('currency_id') > 1 &&
                    <Grid size={{xs: 12, md: 4}}>
                        <Div sx={{mt: 0.3}}>
                            <TextField
                                label="Exchange Rate"
                                fullWidth
                                size='small'
                                error={!!errors?.exchange_rate}
                                helperText={errors?.exchange_rate?.message}
                                InputProps={{
                                inputComponent: CommaSeparatedField,
                                disabled: isCurrencyLocked,
                                }}
                                value={watch('exchange_rate')}
                                onChange={(e) => {
                                setValue(`exchange_rate`,e.target.value ? sanitizedNumber(e.target.value ): null,{
                                    shouldValidate: true,
                                    shouldDirty: true
                                });
                                }}
                            />
                        </Div>
                    </Grid>
                }
                <Grid size={{xs: 12, md: watch('currency_id') > 1 ? 8 : 12}}>
                    <Div sx={{mt: 0.3}}>
                        <CostCenterSelector
                            label="Cost Centers"
                            frontError={errors?.cost_centers}
                            multiple={true}
                            allowSameType={false}
                            defaultValue={watch('cost_centers') || []}
                            onChange={(newValue) => {
                                const valueArray = Array.isArray(newValue)
                                ? newValue
                                : newValue
                                ? [newValue]
                                : [];

                                setValue('cost_centers', valueArray, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                });
                            }}
                        />
                    </Div>
                </Grid>
            </Grid>
        </Grid>
    </Grid>
  )
}

export default PurchaseOrderTopInformation