import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import projectsServices from '../../project-services';
import { useProjectProfile } from '../ProjectProfileProvider';
import BudgetSummaryTab from './budgetItems/tabs/BudgetSummaryTab';
import LedgerItemsRow from './budgetItems/tabs/LedgerItemsRow';
import LedgerItemsTab from './budgetItems/tabs/LedgerItemsTab';
import ProductItemsRow from './budgetItems/tabs/ProductItemsRow';
import ProductItemsTab from './budgetItems/tabs/ProductItemsTab';
import SubContractTasksRow from './budgetItems/tabs/SubContractTasksRow';
import SubContractTasksTab from './budgetItems/tabs/SubContractTasksTab';

const BudgetsForm = ({
  setOpenDialog,
  budget = null,
  isProjectBudget = true,
  isDuplicate = false,
}) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const costCenters = authOrganization?.costCenters;
  const { project } = useProjectProfile();
  const [activeTab, setActiveTab] = useState(0);
  const [serverError, setServerError] = useState(null);
  const [ledgerItems, setLedgerItems] = useState(
    budget ? budget.ledger_items : []
  );
  const [productItems, setProductItems] = useState(
    budget ? budget.product_items : []
  );
  const [subContractItems, setSubContractItems] = useState(
    budget ? budget.subcontract_task_items : []
  );

  const [subContractItemsByCostCenter, setSubContractItemsByCostCenter] =
    useState({});
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreTargetCostCenter, setRestoreTargetCostCenter] = useState(null);

  const [showWarning, setShowWarning] = useState(false);
  const [showSubcontractLossDialog, setShowSubcontractLossDialog] =
    useState(false);
  const [pendingCostCenter, setPendingCostCenter] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [submitItemForm, setSubmitItemForm] = useState(false);
  const [boundToOption, setBoundToOption] = useState('');
  const [selectedItemable, setSelectedItemable] = useState(null);
  const [selectedBoundTo, setSelectedBoundTo] = useState(null);
  const [selectedExpenseFilters, setSelectedExpenseFilters] = useState([]);
  const [selectedProductFilters, setSelectedProductFilters] = useState([]);
  const [selectedSubTaskFilters, setSelectedSubTaskFilters] = useState([]);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const addBudgetMutation = useMutation({
    mutationFn: (data) => projectsServices.addBudget(data),
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-list'] });
    },
    onError: (err) => {
      if (err.response?.status === 400)
        setServerError(err.response?.data?.validation_errors);
      else enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    },
  });

  const editBudgetMutation = useMutation({
    mutationFn: (data) => projectsServices.EditBudget(data),
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-list'] });
    },
    onError: (err) => {
      if (err.response?.status === 400)
        setServerError(err.response?.data?.validation_errors);
      else enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    },
  });

  const saveMutation = useMemo(
    () =>
      budget && !isDuplicate
        ? editBudgetMutation.mutate
        : addBudgetMutation.mutate,
    [budget, editBudgetMutation.mutate, addBudgetMutation.mutate]
  );

  const isPending = isDuplicate
    ? addBudgetMutation.isPending
    : budget
      ? editBudgetMutation.isPending
      : addBudgetMutation.isPending;

  useEffect(() => {
    setLedgerItems(budget?.ledger_items || []);
    setProductItems(budget?.product_items || []);
    setSubContractItems(budget?.subcontract_task_items || []);
  }, [budget]);

  const validationSchema = yup.object({
    name: yup.string().required('Budget name is required'),
    start_date: yup.string().required('Start Date is required'),
    end_date: yup
      .string()
      .required('End Date is required')
      .test(
        'is-after-start-date',
        'End date must be after start date',
        function (value) {
          const { start_date } = this.parent;
          if (!start_date || !value) return true;
          return new Date(value) > new Date(start_date);
        }
      ),
    cost_center_id: yup
      .number()
      .required('Cost Center is required')
      .positive('Cost Center is Required')
      .typeError('Cost Center is Required'),
  });

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: budget?.id,
      name: isDuplicate ? '' : budget?.name,
      start_date: !isDuplicate ? budget?.start_date : null,
      end_date: !isDuplicate ? budget?.end_date : null,
      cost_center_id:
        !isDuplicate && (project?.cost_center?.id || budget?.cost_center_id),
      remarks: isDuplicate ? '' : budget?.remarks || '',
    },
  });

  // Determine the project id to use for timeline activities
  const selectedCostCenterId = watch('cost_center_id');
  const selectedCostCenter = useMemo(
    () => costCenters?.find((c) => c.id === selectedCostCenterId),
    [costCenters, selectedCostCenterId]
  );
  const timelineProjectId =
    selectedCostCenter?.cost_centerable_id || project?.id;

  // Track previous project-typed cost center for dialog logic
  const prevProjectCostCenterRef = React.useRef(
    selectedCostCenter?.cost_centerable_id
  );
  useEffect(() => {
    prevProjectCostCenterRef.current = selectedCostCenter?.cost_centerable_id;
  }, [selectedCostCenter?.cost_centerable_id]);

  const {
    data: timelineActivitiesData,
    isFetching: isTimelineActivitiesFetching,
  } = useQuery({
    queryKey: ['projectTimelineActivities', timelineProjectId],
    queryFn: () =>
      projectsServices.showProjectTimelineActivities(timelineProjectId),
    enabled: !!timelineProjectId,
  });

  const getTaskOptions = (activities, depth = 0) => {
    if (!Array.isArray(activities)) {
      return [];
    }

    return activities.flatMap((activity) => {
      const { children, tasks } = activity;

      const tasksOptions = (tasks || []).map((task) => ({
        id: task.id,
        label: task.name,
        handlers: task.handlers,
        code: task.code,
        dependencies: task.dependencies,
        quantity: task.quantity,
        measurement_unit: task.measurement_unit,
        start_date: dayjs(task.start_date).format('YYYY-MM-DD'),
        end_date: dayjs(task.end_date).format('YYYY-MM-DD'),
        weighted_percentage: task.weighted_percentage,
        project_deliverable_id: task.project_deliverable_id,
      }));

      const tasksFromgroupChildren = getTaskOptions(children, depth + 1);

      return [...tasksOptions, ...tasksFromgroupChildren];
    });
  };

  const allTasks = getTaskOptions(timelineActivitiesData);

  const hasSubcontractTab =
    !!isProjectBudget && !!selectedCostCenter?.cost_centerable_id;
  const subcontractTabIndex = hasSubcontractTab ? 2 : -1;
  const summaryTabIndex = hasSubcontractTab ? 3 : 2;
  const tabsCount = hasSubcontractTab ? 4 : 3;

  useEffect(() => {
    if (!hasSubcontractTab) {
      setBoundToOption('');
      setSelectedItemable(null);
      setSelectedBoundTo(null);
      setSelectedSubTaskFilters([]);
    }
  }, [hasSubcontractTab]);

  useEffect(() => {
    if (activeTab > tabsCount - 1) {
      setActiveTab(tabsCount - 1);
    }
  }, [activeTab, tabsCount]);

  const expenseFilterOptions = useMemo(() => {
    const expenseMap = new Map();
    (ledgerItems || []).forEach((item) => {
      const id =
        item?.ledger_id || item?.ledger?.id || item?.expense_ledger?.id;
      const label = item?.ledger?.name || item?.expense_ledger?.name;
      if (id && label && !expenseMap.has(id)) {
        expenseMap.set(id, { id, label });
      }
    });
    return Array.from(expenseMap.values());
  }, [ledgerItems]);

  const productFilterOptions = useMemo(() => {
    const productMap = new Map();
    (productItems || []).forEach((item) => {
      const id = item?.product_id || item?.product?.id;
      const label = item?.product_name || item?.product?.name;
      if (id && label && !productMap.has(id)) {
        productMap.set(id, { id, label });
      }
    });
    return Array.from(productMap.values());
  }, [productItems]);

  const subTaskFilterOptions = useMemo(() => {
    const taskMap = new Map();
    (subContractItems || []).forEach((item) => {
      const id = item?.project_task_id || item?.project_task?.id;
      const label = item?.project_task?.name || item?.project_task?.label;
      if (id && label && !taskMap.has(id)) {
        taskMap.set(id, { id, label });
      }
    });
    return Array.from(taskMap.values());
  }, [subContractItems]);

  const filteredLedgerEntries = useMemo(() => {
    const selectedExpenseIds = selectedExpenseFilters.map((option) =>
      Number(option.id)
    );
    return (ledgerItems || [])
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const matchesBoundTo =
          !selectedItemable?.id ||
          (item?.bound_to === selectedBoundTo &&
            Number(item?.budget_itemable_id) === Number(selectedItemable?.id));
        const expenseId = Number(
          item?.ledger_id || item?.ledger?.id || item?.expense_ledger?.id
        );
        const matchesExpense =
          selectedExpenseIds.length === 0 ||
          selectedExpenseIds.includes(expenseId);
        return matchesBoundTo && matchesExpense;
      });
  }, [ledgerItems, selectedItemable, selectedBoundTo, selectedExpenseFilters]);

  const filteredProductEntries = useMemo(() => {
    const selectedProductIds = selectedProductFilters.map((option) =>
      Number(option.id)
    );
    return (productItems || [])
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const matchesBoundTo =
          !selectedItemable?.id ||
          (item?.bound_to === selectedBoundTo &&
            Number(item?.budget_itemable_id) === Number(selectedItemable?.id));
        const productId = Number(item?.product_id || item?.product?.id);
        const matchesProduct =
          selectedProductIds.length === 0 ||
          selectedProductIds.includes(productId);
        return matchesBoundTo && matchesProduct;
      });
  }, [productItems, selectedItemable, selectedBoundTo, selectedProductFilters]);

  const filteredSubContractEntries = useMemo(() => {
    const selectedTaskIds = selectedSubTaskFilters.map((option) =>
      Number(option.id)
    );
    return (subContractItems || [])
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const matchesGlobalTask =
          !selectedItemable?.id ||
          Number(item?.project_task_id) === Number(selectedItemable?.id);
        const matchesTaskFilter =
          selectedTaskIds.length === 0 ||
          selectedTaskIds.includes(Number(item?.project_task_id));
        return matchesGlobalTask && matchesTaskFilter;
      });
  }, [subContractItems, selectedItemable, selectedSubTaskFilters]);

  const handleSubmitForm = (data) => {
    const payload = {
      ...data,
      ledger_items: ledgerItems,
      product_items: productItems,
      subcontract_task_items: subContractItems,
    };
    saveMutation(payload);
  };

  const submitMainForm = () => {
    handleSubmit((data) => handleSubmitForm(data))();
  };

  const onSubmit = (data) => {
    if (activeTab === 0 && isDirty) {
      setShowWarning(true);
      return;
    }
    handleSubmitForm(data);
  };

  const handleConfirmSubmitWithoutAdd = () => {
    setShowWarning(false);
    setIsDirty(false);
    setSubmitItemForm(false);
    submitMainForm();
  };

  const handleAddAndSubmit = () => {
    setShowWarning(false);
    setSubmitItemForm(true);
  };

  return (
    <>
      <DialogTitle textAlign='center' sx={{ pb: 1 }}>
        {budget
          ? `${isDuplicate ? `Duplicate` : `Edit`} ${' '} ${budget?.name} Budget`
          : isProjectBudget
            ? 'New Project Budget'
            : 'New Budget'}
      </DialogTitle>
      <DialogContent>
        <Dialog
          open={showRestoreDialog}
          onClose={() => setShowRestoreDialog(false)}
        >
          <DialogTitle>Restore Previous Subcontract Tasks?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You have previous Subcontract Tasks for this cost center. Would
              you like to restore them or start with a blank list?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setShowRestoreDialog(false);
                setValue('cost_center_id', restoreTargetCostCenter?.id, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                setSubContractItems([]);
                setRestoreTargetCostCenter(null);
                if (
                  activeTab === subcontractTabIndex &&
                  !restoreTargetCostCenter?.cost_centerable_id
                ) {
                  setActiveTab(0);
                }
              }}
              color='inherit'
            >
              Start New
            </Button>
            <Button
              onClick={() => {
                setShowRestoreDialog(false);
                setValue('cost_center_id', restoreTargetCostCenter?.id, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                setSubContractItems(
                  subContractItemsByCostCenter[
                    restoreTargetCostCenter.cost_centerable_id
                  ] || []
                );
                setRestoreTargetCostCenter(null);
                if (
                  activeTab === subcontractTabIndex &&
                  !restoreTargetCostCenter?.cost_centerable_id
                ) {
                  setActiveTab(0);
                }
              }}
              color='primary'
              variant='contained'
            >
              Restore Previous
            </Button>
          </DialogActions>
        </Dialog>
        <Grid
          container
          spacing={1.5}
          alignItems='start'
          justifyContent='center'
          sx={{ mt: 1 }}
        >
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label='Budget Name'
              size='small'
              fullWidth
              error={!!errors?.name}
              helperText={errors?.name?.message}
              {...register('name')}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <DateTimePicker
              label='Start Date'
              fullWidth
              minDate={dayjs(organization.recording_start_date)}
              defaultValue={
                budget && !isDuplicate ? dayjs(budget.start_date) : null
              }
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  readOnly: true,
                  error: !!errors?.start_date,
                  helperText: errors?.start_date?.message,
                },
              }}
              onChange={(newValue) => {
                setServerError(null);
                setValue(
                  'start_date',
                  newValue ? newValue.toISOString() : null,
                  { shouldValidate: true, shouldDirty: true }
                );
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <DateTimePicker
              label='End Date'
              fullWidth
              minDate={dayjs(watch('start_date'))}
              defaultValue={
                budget && !isDuplicate ? dayjs(budget.end_date) : null
              }
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  readOnly: true,
                  error: !!errors?.end_date,
                  helperText: errors?.end_date?.message,
                },
              }}
              onChange={(newValue) => {
                setServerError(null);
                setValue('end_date', newValue ? newValue.toISOString() : null, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                trigger('start_date');
              }}
            />
          </Grid>

          {serverError?.date_overlap && (
            <Grid size={12}>
              <Alert severity='error' variant='outlined' sx={{ color: 'red' }}>
                {serverError.date_overlap[0]}
              </Alert>
            </Grid>
          )}

          {!project && (
            <Grid size={{ xs: 12, md: 4 }}>
              <CostCenterSelector
                label='Cost Center'
                frontError={errors.cost_center_id}
                defaultValue={
                  (budget && !isDuplicate && budget.cost_center) ||
                  (costCenters.length === 1 ? costCenters[0] : null)
                }
                multiple={false}
                onChange={(newValue) => {
                  // Always update subContractItemsByCostCenter before dialog logic
                  let updatedSubContractItemsByCostCenter = {
                    ...subContractItemsByCostCenter,
                  };
                  if (selectedCostCenter?.cost_centerable_id) {
                    updatedSubContractItemsByCostCenter[
                      selectedCostCenter.cost_centerable_id
                    ] = subContractItems;
                  }
                  // If switching from project to non-project, save current tasks and clear
                  if (
                    !newValue?.cost_centerable_id &&
                    selectedCostCenter?.cost_centerable_id
                  ) {
                    setSubContractItemsByCostCenter(
                      updatedSubContractItemsByCostCenter
                    );
                    setSubContractItems([]);
                  }
                  // If switching between two project cost centers and there is data, show dialog
                  else if (
                    newValue?.cost_centerable_id &&
                    selectedCostCenter?.cost_centerable_id &&
                    newValue?.cost_centerable_id !==
                      selectedCostCenter?.cost_centerable_id &&
                    subContractItems.length > 0
                  ) {
                    setSubContractItemsByCostCenter(
                      updatedSubContractItemsByCostCenter
                    );
                    setPendingCostCenter(newValue);
                    setShowSubcontractLossDialog(true);
                    return;
                  }
                  // If switching to a project cost center with saved tasks, prompt to restore
                  if (
                    newValue?.cost_centerable_id &&
                    updatedSubContractItemsByCostCenter[
                      newValue.cost_centerable_id
                    ]?.length > 0
                  ) {
                    setSubContractItemsByCostCenter(
                      updatedSubContractItemsByCostCenter
                    );
                    setRestoreTargetCostCenter(newValue);
                    setShowRestoreDialog(true);
                    return;
                  }
                  setSubContractItemsByCostCenter(
                    updatedSubContractItemsByCostCenter
                  );
                  setValue('cost_center_id', newValue?.id, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  if (
                    activeTab === subcontractTabIndex &&
                    !newValue?.cost_centerable_id
                  ) {
                    setActiveTab(0);
                  }
                  {
                    /* Dialog for restoring previous subcontract tasks */
                  }
                  <Dialog
                    open={showRestoreDialog}
                    onClose={() => setShowRestoreDialog(false)}
                  >
                    <DialogTitle>
                      Restore Previous Subcontract Tasks?
                    </DialogTitle>
                    <DialogContent>
                      <DialogContentText>
                        You have previous Subcontract Tasks for this cost
                        center. Would you like to restore them or start with a
                        blank list?
                      </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                      <Button
                        onClick={() => {
                          setShowRestoreDialog(false);
                          setValue(
                            'cost_center_id',
                            restoreTargetCostCenter?.id,
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                            }
                          );
                          setSubContractItems([]);
                          setRestoreTargetCostCenter(null);
                          if (
                            activeTab === subcontractTabIndex &&
                            !restoreTargetCostCenter?.cost_centerable_id
                          ) {
                            setActiveTab(0);
                          }
                        }}
                        color='inherit'
                      >
                        Start New
                      </Button>
                      <Button
                        onClick={() => {
                          setShowRestoreDialog(false);
                          setValue(
                            'cost_center_id',
                            restoreTargetCostCenter?.id,
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                            }
                          );
                          setSubContractItems(
                            subContractItemsByCostCenter[
                              restoreTargetCostCenter.cost_centerable_id
                            ] || []
                          );
                          setRestoreTargetCostCenter(null);
                          if (
                            activeTab === subcontractTabIndex &&
                            !restoreTargetCostCenter?.cost_centerable_id
                          ) {
                            setActiveTab(0);
                          }
                        }}
                        color='primary'
                        variant='contained'
                      >
                        Restore Previous
                      </Button>
                    </DialogActions>
                  </Dialog>;
                }}
              />
              {/* Dialog for subcontract task data loss warning */}
              <Dialog
                open={showSubcontractLossDialog}
                onClose={() => setShowSubcontractLossDialog(false)}
              >
                <DialogTitle>Subcontract Tasks Will Be Lost</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    Changing the cost center will clear all current Subcontract
                    Tasks. Do you want to continue?
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => setShowSubcontractLossDialog(false)}
                    color='inherit'
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSubcontractLossDialog(false);
                      setSubContractItems([]);
                      setValue('cost_center_id', pendingCostCenter?.id, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      if (
                        activeTab === subcontractTabIndex &&
                        !pendingCostCenter?.cost_centerable_id
                      ) {
                        setActiveTab(0);
                      }
                      setPendingCostCenter(null);
                    }}
                    color='warning'
                    variant='contained'
                  >
                    Continue
                  </Button>
                </DialogActions>
              </Dialog>
            </Grid>
          )}

          <Grid size={{ xs: 12, md: project ? 12 : 8 }}>
            <Div>
              <TextField
                label='Remarks'
                size='small'
                fullWidth
                multiline
                rows={2}
                {...register('remarks')}
              />
            </Div>
          </Grid>

          <Grid size={12}>
            <Paper variant='outlined' sx={{ p: 1.5, mt: 0.5 }}>
              <Grid
                container
                alignItems='center'
                justifyContent='space-between'
              >
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant='subtitle2'>Optional Filters</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Use these filters to narrow down listed items. Leave blank
                    to show all.
                  </Typography>
                </Grid>
                <Grid
                  size={{ xs: 12, md: 4 }}
                  textAlign={{ xs: 'left', md: 'right' }}
                >
                  <FormControlLabel
                    sx={{ m: 0 }}
                    control={
                      <Switch
                        size='small'
                        checked={showFiltersPanel}
                        onChange={(e) => setShowFiltersPanel(e.target.checked)}
                      />
                    }
                    label='Show Filters'
                  />
                </Grid>
              </Grid>

              {showFiltersPanel && (
                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                  {hasSubcontractTab && (
                    <>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth>
                          <InputLabel id='budget-bound-to-filter-label'>
                            Filter by Bound To (Optional)
                          </InputLabel>
                          <Select
                            labelId='budget-bound-to-filter-label'
                            value={boundToOption}
                            label='Filter by Bound To (Optional)'
                            size='small'
                            onChange={(e) => {
                              setSelectedItemable(null);
                              setSelectedBoundTo(null);
                              setBoundToOption(e.target.value);
                            }}
                          >
                            <MenuItem value=''>All</MenuItem>
                            <MenuItem value='Task'>Task</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid size={{ xs: 12, md: 8 }}>
                        <Autocomplete
                          options={boundToOption === 'Task' ? allTasks : []}
                          isOptionEqualToValue={(option, value) =>
                            option.id === value?.id
                          }
                          getOptionLabel={(option) => option.label}
                          value={selectedItemable}
                          disabled={boundToOption !== 'Task'}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={
                                boundToOption === 'Task'
                                  ? 'Filter by Task (Optional)'
                                  : 'Select Bound To to enable Task filter'
                              }
                              size='small'
                              fullWidth
                            />
                          )}
                          onChange={(e, newValue) => {
                            if (newValue) {
                              setSelectedItemable(newValue);
                              setSelectedBoundTo(
                                boundToOption === 'Task' ? 'ProjectTask' : null
                              );
                            } else {
                              setSelectedItemable(null);
                              setSelectedBoundTo(null);
                            }
                          }}
                          renderOption={(props, option) => (
                            <li {...props} key={option.id}>
                              {option.label}
                            </li>
                          )}
                        />
                      </Grid>
                    </>
                  )}

                  {activeTab === 0 && (
                    <Grid size={{ xs: 12 }}>
                      <Autocomplete
                        multiple
                        options={expenseFilterOptions}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value?.id
                        }
                        getOptionLabel={(option) => option.label}
                        value={selectedExpenseFilters}
                        onChange={(e, newValue) =>
                          setSelectedExpenseFilters(newValue || [])
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Filter by Expense (Optional)'
                            size='small'
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                  )}

                  {activeTab === 1 && (
                    <Grid size={{ xs: 12 }}>
                      <Autocomplete
                        multiple
                        options={productFilterOptions}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value?.id
                        }
                        getOptionLabel={(option) => option.label}
                        value={selectedProductFilters}
                        onChange={(e, newValue) =>
                          setSelectedProductFilters(newValue || [])
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Filter by Product (Optional)'
                            size='small'
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                  )}

                  {activeTab === subcontractTabIndex && (
                    <Grid size={{ xs: 12 }}>
                      <Autocomplete
                        multiple
                        options={subTaskFilterOptions}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value?.id
                        }
                        getOptionLabel={(option) => option.label}
                        value={selectedSubTaskFilters}
                        onChange={(e, newValue) =>
                          setSelectedSubTaskFilters(newValue || [])
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Filter by Subcontract Task (Optional)'
                            size='small'
                            fullWidth
                            helperText='Not required'
                          />
                        )}
                      />
                    </Grid>
                  )}
                </Grid>
              )}
            </Paper>
          </Grid>

          <Grid size={12}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => {
                setActiveTab(newValue);
              }}
              variant='scrollable'
              scrollButtons='auto'
              allowScrollButtonsMobile
            >
              <Tab label='Expense Items' />
              <Tab label='Product Items' />
              {selectedCostCenter?.cost_centerable_id && (
                <Tab label='Subcontract Task' />
              )}
              <Tab label='Summary' />
            </Tabs>
          </Grid>

          <Grid size={12}>
            {activeTab === 0 && (
              <>
                <LedgerItemsTab
                  ledgerItems={ledgerItems}
                  setLedgerItems={setLedgerItems}
                  submitMainForm={submitMainForm}
                  submitItemForm={submitItemForm}
                  setSubmitItemForm={setSubmitItemForm}
                  setIsDirty={setIsDirty}
                  selectedCostCenter={selectedCostCenter}
                  allTasks={allTasks}
                />
                {filteredLedgerEntries?.map(({ item: ledgerItem, index }) => (
                  <LedgerItemsRow
                    key={`${ledgerItem?.id ?? 'new'}-${index}`}
                    ledgerItem={ledgerItem}
                    index={index}
                    ledgerItems={ledgerItems}
                    setLedgerItems={setLedgerItems}
                    submitMainForm={submitMainForm}
                    setSubmitItemForm={setSubmitItemForm}
                    submitItemForm={submitItemForm}
                    allTasks={allTasks}
                    selectedCostCenter={selectedCostCenter}
                    setIsDirty={setIsDirty}
                  />
                ))}
              </>
            )}
            {activeTab === 1 && (
              <>
                <ProductItemsTab
                  productItems={productItems}
                  setProductItems={setProductItems}
                  submitMainForm={submitMainForm}
                  submitItemForm={submitItemForm}
                  setSubmitItemForm={setSubmitItemForm}
                  setIsDirty={setIsDirty}
                  selectedCostCenter={selectedCostCenter}
                  allTasks={allTasks}
                />
                {filteredProductEntries?.map(({ item: productItem, index }) => (
                  <ProductItemsRow
                    key={`${productItem?.id ?? 'new'}-${index}`}
                    productItem={productItem}
                    index={index}
                    productItems={productItems}
                    setProductItems={setProductItems}
                    allTasks={allTasks}
                    submitMainForm={submitMainForm}
                    setSubmitItemForm={setSubmitItemForm}
                    selectedCostCenter={selectedCostCenter}
                    submitItemForm={submitItemForm}
                    setIsDirty={setIsDirty}
                  />
                ))}
              </>
            )}
            {activeTab === subcontractTabIndex &&
              selectedCostCenter?.cost_centerable_id && (
                <>
                  <SubContractTasksTab
                    subContractItems={subContractItems}
                    setSubContractItems={setSubContractItems}
                    submitMainForm={submitMainForm}
                    submitItemForm={submitItemForm}
                    setSubmitItemForm={setSubmitItemForm}
                    setIsDirty={setIsDirty}
                    allTasks={allTasks}
                    selectedCostCenter={selectedCostCenter}
                  />
                  {filteredSubContractEntries?.map(
                    ({ item: subContractItem, index }) => (
                      <SubContractTasksRow
                        key={`${subContractItem?.id ?? 'new'}-${index}`}
                        subContractItem={subContractItem}
                        index={index}
                        subContractItems={subContractItems}
                        setSubContractItems={setSubContractItems}
                        allTasks={allTasks}
                        submitMainForm={submitMainForm}
                        setSubmitItemForm={setSubmitItemForm}
                        submitItemForm={submitItemForm}
                        setIsDirty={setIsDirty}
                        selectedCostCenter={selectedCostCenter}
                      />
                    )
                  )}
                </>
              )}
            {activeTab === summaryTabIndex && (
              <BudgetSummaryTab
                ledgerItems={filteredLedgerEntries.map(({ item }) => item)}
                productItems={filteredProductEntries.map(({ item }) => item)}
                subContractItems={filteredSubContractEntries.map(
                  ({ item }) => item
                )}
                hasSubcontractTab={hasSubcontractTab}
              />
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpenDialog(false)}>
          Cancel
        </Button>
        <LoadingButton
          type='submit'
          onClick={handleSubmit(onSubmit)}
          variant='contained'
          size='small'
          sx={{ display: 'flex' }}
          loading={isPending}
        >
          Submit
        </LoadingButton>
      </DialogActions>
      <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
        <DialogTitle>Unsaved Expense Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes in Expense Items form. Do you want to add
            the item first, or submit without adding it?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWarning(false)} color='inherit'>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmitWithoutAdd}
            color='warning'
            variant='outlined'
          >
            Submit Without Add
          </Button>
          <LoadingButton onClick={handleAddAndSubmit} variant='contained'>
            Add & Submit
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BudgetsForm;
