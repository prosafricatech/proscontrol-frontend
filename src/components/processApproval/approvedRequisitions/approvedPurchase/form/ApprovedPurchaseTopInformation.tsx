import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import StakeholderQuickAdd from '@/components/masters/stakeholders/StakeholderQuickAdd';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Div } from '@jumbo/shared';
import { AddOutlined } from '@mui/icons-material';
import { Grid, TextField, Tooltip } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect } from 'react';
import { ApprovalRequisition } from '../../ApprovalRequisitionType';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { Product } from '@/components/productAndServices/products/ProductType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Vendor } from '@/components/processApproval/RequisitionType';

interface Order {
  id?: number;
  order_date?: string;
  currency_id?: number;
  exchange_rate?: number;
  reference?: string;
  stakeholder?: Stakeholder;
  store?: { id: number };
  date_required?: string;
  instant_pay?: boolean;
  instant_receive?: boolean;
  credit_ledger?: { id: number };
  cost_centers?: CostCenter[];
  purchase_order_items?: Array<{
    requisition_approval_product_item_id: number;
    quantity: number;
    rate: number;
    measurement_unit: MeasurementUnit;
    vat_percentage: number;
    product: Product;
    vendors?: Vendor;
  }>;
}

interface ApprovedPurchaseTopInformationProps {
  setAddedStakeholder: (stakeholder: Stakeholder) => void;
  addedStakeholder: Stakeholder;
  setStakeholderQuickAddDisplay: (display: boolean) => void;
  order?: Order;
  approvedRequisition?: ApprovalRequisition;
  order_date: Dayjs;
  stakeholderQuickAddDisplay: boolean;
  approvedDetails?: any;
  setValue: any,
  watch: any,
  register: any,
  errors: any
}

function ApprovedPurchaseTopInformation({
  setAddedStakeholder,
  addedStakeholder,
  setStakeholderQuickAddDisplay,
  order,
  approvedRequisition,
  order_date,
  stakeholderQuickAddDisplay,
  approvedDetails,
  setValue,
  watch,
  register,
  errors
}: ApprovedPurchaseTopInformationProps) {

  const { authOrganization, checkOrganizationPermission } = useJumboAuth();
  const cp = { id: null, name: 'Cash Purchase' };
  const canCashPurchase = checkOrganizationPermission(PERMISSIONS.PURCHASES_INSTANT_PAY);

  // Set values from addedStakeholder
  useEffect(() => {
    if (addedStakeholder?.id) {
      setValue('stakeholder_id', addedStakeholder.id);
      setValue('tin', addedStakeholder.tin ?? null, {
        shouldTouch: true,
      });
      setValue('vrn', addedStakeholder.vrn ?? null);
      setStakeholderQuickAddDisplay(false);
    }
  }, [addedStakeholder, setValue, setStakeholderQuickAddDisplay]);

  const handleDateChange = (newValue: Dayjs | null) => {
    setValue('order_date', newValue ? newValue.toISOString() : '', {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  const handleDateRequiredChange = (newValue: Dayjs | null) => {
    setValue('date_required', newValue ? newValue.toISOString() : null, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  const handleStakeholderChange = (newValue: any) => {
    setValue('stakeholder_id', newValue?.id ?? null, {
      shouldDirty: true,
      shouldValidate: true
    });
    setValue('tin', newValue?.tin ?? null, {
      shouldTouch: true,
    });
    setValue('vrn', newValue?.vrn ?? null);
    setValue(
      'instant_pay',
      !newValue?.id &&
        checkOrganizationPermission(PERMISSIONS.PURCHASES_INSTANT_PAY)
    );
    setValue(
      'instant_receive',
      !newValue?.id &&
        checkOrganizationPermission(PERMISSIONS.PURCHASES_INSTANT_RECEIVE)
    );
    
    if (!newValue?.id) {
      setValue('instant_invoice', false, {
        shouldDirty: true,
        shouldValidate: true
      });
    }
  };

  return (
    <Grid container columnSpacing={1} rowSpacing={2}>
      <Grid size={{xs: 12, md: 4}}>
        <Div sx={{ mt: 0.3 }}>
          <DateTimePicker
            label="Order Date"
            minDate={
              checkOrganizationPermission(PERMISSIONS.PURCHASES_BACKDATE) 
                ? dayjs(authOrganization?.organization.recording_start_date) 
                : dayjs().startOf('day')
            }
            maxDate={
              checkOrganizationPermission(PERMISSIONS.PURCHASES_POSTDATE) 
                ? dayjs().add(10, 'year').endOf('year') 
                : dayjs().endOf('day')
            }
            defaultValue={order_date}
            slotProps={{
                textField: {
                    size: 'small',
                    fullWidth: true,
                    InputProps: {
                        readOnly: true
                    },
                    error: !!errors?.order_date,
                    helperText: errors?.order_date?.message
                }
            }}
            onChange={handleDateChange}
          />
        </Div>
      </Grid>

      {!stakeholderQuickAddDisplay && (
        <Grid size={{xs: 12, md: 8}}>
          <Div sx={{ mt: 0.3 }}>
            <StakeholderSelector
              label='Supplier'
              frontError={errors?.stakeholder_id as any}
              initialOptions={(canCashPurchase ? [cp] : []) as any}
              defaultValue={order?.stakeholder?.id}
              addedStakeholder={addedStakeholder}
              onChange={handleStakeholderChange}
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
      )}

      {stakeholderQuickAddDisplay && (
        <StakeholderQuickAdd 
          setStakeholderQuickAddDisplay={setStakeholderQuickAddDisplay} 
          create_payable={true} 
          setAddedStakeholder={setAddedStakeholder}
        />
      )}

      <Grid size={12}>
        <Grid container rowSpacing={2} columnSpacing={1}>
          <Grid size={{xs: 12, md: 4}}>
            <Div sx={{ mt: 0.3 }}>
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
            <Div sx={{ mt: 0.3 }}>
              <DateTimePicker
                label="Date required"
                defaultValue={order?.date_required ? dayjs(order.date_required) : null}
                minDate={dayjs(order_date)}
                slotProps={{
                    textField: {
                        size: 'small',
                        fullWidth: true,
                        InputProps: {
                            readOnly: true
                        },
                        error: !!errors?.date_required,
                        helperText: errors?.date_required?.message
                    }
                }}
                onChange={handleDateRequiredChange}
              />
            </Div>
          </Grid>

          <Grid size={{xs: 12, md: 4}}>
            <Div sx={{ mt: 0.3 }}>
              <CurrencySelector
                defaultValue={approvedDetails?.currency?.id}
                disabled={true}
              />
            </Div>
          </Grid>

          {watch('currency_id') > 1 && (
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{ mt: 0.3 }}>
                <TextField
                  label="Exchange Rate"
                  fullWidth
                  size='small'
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                  }}
                  value={watch('exchange_rate')}
                  disabled={true}
                />
              </Div>
            </Grid>
          )}

          <Grid size={{xs: 12, md: watch('currency_id') > 1 ? 8 : 12}}>
            <Div sx={{ mt: 0.3 }}>
              <CostCenterSelector
                multiple={true}
                allowSameType={false}
                defaultValue={
                  approvedRequisition 
                    ? [approvedRequisition.requisition.cost_center] 
                    : order?.cost_centers || []
                }
                disabled={true}
              />
            </Div>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default React.memo(ApprovedPurchaseTopInformation);