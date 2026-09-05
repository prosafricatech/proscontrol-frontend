export const PROCESS_TYPES = [
  'PURCHASE',
  'PAYMENT',
  'IMPREST',
  // 'MATERIAL', // Disabled pending reassessment/improvement of the feature.
  'IMPREST RETIREMENT',
  'LEAVE REQUEST',
  'PAYROLL',
  'LOAN',
  'SUBCONTRACT CERTIFICATE',
  'PROJECT PAYMENT CLAIM',
  'STOCK ADJUSTMENT',
];

// Process types gated behind the Human Resources module subscription.
const HUMAN_RESOURCES_PROCESS_TYPES = ['LEAVE REQUEST', 'PAYROLL', 'LOAN'];

// Process types gated behind the Project Management module subscription.
const PROJECT_MANAGEMENT_PROCESS_TYPES = [
  'SUBCONTRACT CERTIFICATE',
  'PROJECT PAYMENT CLAIM',
];

// Process types gated behind the Procurement & Supply module subscription.
const PROCUREMENT_AND_SUPPLY_PROCESS_TYPES = ['STOCK ADJUSTMENT'];

export const getProcessTypes = (
  hasHumanResourcesModule: boolean,
  hasProjectManagementModule: boolean = true,
  hasProcurementAndSupplyModule: boolean = true
) => {
  return PROCESS_TYPES.filter((type) => {
    if (HUMAN_RESOURCES_PROCESS_TYPES.includes(type)) {
      return hasHumanResourcesModule;
    }
    if (PROJECT_MANAGEMENT_PROCESS_TYPES.includes(type)) {
      return hasProjectManagementModule;
    }
    if (PROCUREMENT_AND_SUPPLY_PROCESS_TYPES.includes(type)) {
      return hasProcurementAndSupplyModule;
    }
    return true;
  });
};

// Process types whose approval chains can be scoped to a department — kept in
// sync with ApprovalChainController::validator()'s department_id guard.
export const DEPARTMENT_SCOPABLE_PROCESS_TYPES = ['LEAVE REQUEST', 'LOAN'];

// Process types that are actual creatable Requisition documents. Everything
// else in PROCESS_TYPES (Leave Request, Payroll, Loan, Imprest Retirement,
// and the newer Subcontract Certificate / Project Payment Claim / Stock
// Adjustment) only shares the process_type field for ApprovalChain
// configuration purposes — none of those are things a Requisition can be.
// 'MATERIAL' disabled pending reassessment/improvement of the feature.
export const REQUISITION_PROCESS_TYPES = ['PURCHASE', 'PAYMENT', 'IMPREST'];
