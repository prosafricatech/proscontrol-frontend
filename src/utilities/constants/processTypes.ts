export const PROCESS_TYPES = [
  'PURCHASE',
  'PAYMENT',
  'IMPREST',
  'MATERIAL',
  'IMPREST RETIREMENT',
  'LEAVE REQUEST',
  'PAYROLL',
  'LOAN',
];

export const getProcessTypes = (hasHumanResourcesModule: boolean) => {
  if (hasHumanResourcesModule) {
    return PROCESS_TYPES;
  }

  return PROCESS_TYPES.filter(
    (type) => !['LEAVE REQUEST', 'PAYROLL', 'LOAN'].includes(type)
  );
};

// Process types whose approval chains can be scoped to a department — kept in
// sync with ApprovalChainController::validator()'s department_id guard.
export const DEPARTMENT_SCOPABLE_PROCESS_TYPES = ['LEAVE REQUEST', 'LOAN'];
