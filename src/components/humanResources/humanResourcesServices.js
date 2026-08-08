import axios from '@/lib/services/config';

const humanResourcesServices = {};

// ============================================
// EMPLOYEES
// ============================================
humanResourcesServices.getEmployeesList = async (params) => {
    const { data } = await axios.get("/api/humanResources/employees", {
        params
    });
    return data;
};

humanResourcesServices.getAllEmployees = async () => {
    const { data } = await axios.get('/api/humanResources/employees/all_employees');
    return data;
};

humanResourcesServices.getOrgChart = async () => {
    const { data } = await axios.get('/api/humanResources/employees/org-chart');
    return data;
};

humanResourcesServices.addEmployee = async (employee) => {
    const { data } = await axios.post(`/api/humanResources/employees/add`, employee)
    return data;
}

humanResourcesServices.updateEmployee = async (employee) => {
    const { data } = await axios.put(`/api/humanResources/employees/${employee.id}/update`, employee)
    return data;
}

humanResourcesServices.showEmployee = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employees/${id}`);
    return data;
};

humanResourcesServices.deleteEmployee = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employees/${id}/delete`);
    return data;
}

humanResourcesServices.downloadEmployeesRegistrationTemplate = async () => {
    const { data } = await axios.post('/api/humanResources/employees/registration-excel-template', {}, {
        responseType: 'blob',
    });
    return data;
}

humanResourcesServices.importEmployeesRegistrationExcel = async (file) => {
    const { data } = await axios.post('/api/humanResources/employees/import-registration-excel', file, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

humanResourcesServices.getMovements = async (employeeId, type = 'all', params) => {
    const { page = 1, limit = 10, keyword = '', ...rest } = params;
    const { data } = await axios.get(`/api/humanResources/employees/${employeeId}/movements`, {
        params: { type, page, limit, keyword, ...rest }
    });
    return data;
};

humanResourcesServices.getEmployeeSalaryHistory = async (employeeId, params) => {
    const { page = 1, limit = 10, keyword = '', ...rest } = params;
    const { data } = await axios.get(`/api/humanResources/employees/${employeeId}/salary-history`, {
        params: { page, limit, keyword, ...rest }
    });
    return data;
};

// Get salary history for a specific contract
humanResourcesServices.getContractSalaryHistory = async (contractId) => {
    const { data } = await axios.get(`/api/humanResources/employee-contracts/${contractId}/salary-history`);
    return data;
};

// ============================================
// EMPLOYEE CONTRACTS
// ============================================
humanResourcesServices.getEmployeesContactList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get("/api/humanResources/employeesContracts", {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addEmployeeContract = async (contract) => {
    const { data } = await axios.post(`/api/humanResources/employeesContracts/add`, contract)
    return data;
}

humanResourcesServices.updateEmployeeContract = async (contract) => {
    const { data } = await axios.put(`/api/humanResources/employeesContracts/${contract.id}/update`, contract)
    return data;
}

humanResourcesServices.showEmployeeContract = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employeesContracts/${id}`);
    return data;
}

humanResourcesServices.terminateEmployeeContract = async ({ id, termination_date, remarks }) => {
    const { data } = await axios.post(`/api/humanResources/employeesContracts/${id}/terminate`, {
        termination_date,
        remarks,
    })
    return data;
}

humanResourcesServices.deleteEmployeeContract = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employeesContracts/${id}/delete`);
    return data;
}

// ============================================
// DEPARTMENTS
// ============================================
humanResourcesServices.getDepartmentsList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/departments', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.getAllDepartments = async () => {
    const { data } = await axios.get('/api/humanResources/departments/all_departments');
    return data;
};

humanResourcesServices.addDepartment = async (department) => {
    const { data } = await axios.post(`/api/humanResources/departments/add`, department)
    return data;
}

humanResourcesServices.updateDepartment = async (department) => {
    const { data } = await axios.put(`/api/humanResources/departments/${department.id}/update`, department)
    return data;
}

humanResourcesServices.showDepartment = async (id) => {
    const { data } = await axios.get(`/api/humanResources/departments/${id}`);
    return data;
}

humanResourcesServices.deleteDepartment = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/departments/${id}/delete`);
    return data;
}

// ============================================
// DESIGNATIONS
// ============================================
humanResourcesServices.getDesignationsList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/designations', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.getAllDesignations = async () => {
    const { data } = await axios.get('/api/humanResources/designations/all_designations');
    return data;
};

humanResourcesServices.addDesignation = async (designation) => {
    const { data } = await axios.post(`/api/humanResources/designations/add`, designation)
    return data;
}

humanResourcesServices.updateDesignation = async (designation) => {
    const { data } = await axios.put(`/api/humanResources/designations/${designation.id}/update`, designation)
    return data;
}

humanResourcesServices.showDesignation = async (id) => {
    const { data } = await axios.get(`/api/humanResources/designations/${id}`);
    return data;
}

humanResourcesServices.deleteDesignation = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/designations/${id}/delete`);
    return data;
}

// ============================================
// PUBLIC HOLIDAYS
// ============================================
humanResourcesServices.publicHolidaysLIst = async (params = {}) => {
    const { data } = await axios.get('/api/humanResources/publicHolidays', {
        params,
    });
    return data;
};

humanResourcesServices.addPublicHoliday = async (publicHoliday) => {
    const { data } = await axios.post(`/api/humanResources/publicHolidays/add`, publicHoliday)
    return data;
};

humanResourcesServices.updatePublicHoliday = async (publicHoliday) => {
    const { data } = await axios.put(`/api/humanResources/publicHolidays/${publicHoliday.id}/update`, publicHoliday)
    return data;
}

humanResourcesServices.deletePublicHoliday = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/publicHolidays/${id}/delete`);
    return data;
}

// ============================================
// ATTENDANCE
// ============================================
humanResourcesServices.attendanceLIst = async (params = {}) => {
    const { data } = await axios.get('/api/humanResources/attendance', {
        params,
    });
    return data;
};

humanResourcesServices.downloadEmployeesAttendanceTemplate = async () => {
    const { data } = await axios.post('/api/humanResources/attendance/download-template', {}, {
        responseType: 'blob',
    });
    return data;
}

humanResourcesServices.importEmployeesAttendanceExcel = async (file) => {
    const { data } = await axios.post('/api/humanResources/attendance/import', file, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

// ============================================
// LEAVE TYPES
// ============================================
humanResourcesServices.getLeaveTypesList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/leave_types', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.getAllLeaveTypes = async () => {
    const { data } = await axios.get('/api/humanResources/leave_types/all_leave_types');
    return data;
};

humanResourcesServices.addLeaveType = async (leaveType) => {
    const { data } = await axios.post(`/api/humanResources/leave_types/add`, leaveType)
    return data;
}

humanResourcesServices.updateLeaveType = async (leaveType) => {
    const { data } = await axios.put(`/api/humanResources/leave_types/${leaveType.id}/update`, leaveType)
    return data;
}

humanResourcesServices.showLeaveType = async (id) => {
    const { data } = await axios.get(`/api/humanResources/leave_types/${id}`);
    return data;
}

humanResourcesServices.deleteLeaveType = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/leave_types/${id}/delete`);
    return data;
}

// ============================================
// BANKS
// ============================================
humanResourcesServices.getBanksList = async (params = {}) => {
    const { page = 1, limit = 50, ...queryParams } = params;
    const { data } = await axios.get('/api/masters/banks', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addBank = async (bank) => {
    const { data } = await axios.post('/api/masters/banks', bank);
    return data;
}

humanResourcesServices.updateBank = async (bank) => {
    const { data } = await axios.put(`/api/masters/banks/${bank.id}`, bank);
    return data;
}

humanResourcesServices.showBank = async (id) => {
    const { data } = await axios.get(`/api/masters/banks/${id}`);
    return data;
}

humanResourcesServices.deleteBank = async (id) => {
    const { data } = await axios.delete(`/api/masters/banks/${id}`);
    return data;
}

// ============================================
// EMPLOYEE BANK ACCOUNTS
// ============================================
humanResourcesServices.getEmployeeBankAccountsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/employeesBankAccounts', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addEmployeeBankAccount = async (bankAccount) => {
    const { data } = await axios.post('/api/humanResources/employeesBankAccounts/add', bankAccount);
    return data;
}

humanResourcesServices.updateEmployeeBankAccount = async (bankAccount) => {
    const { data } = await axios.put(`/api/humanResources/employeesBankAccounts/${bankAccount.id}/update`, bankAccount);
    return data;
}

humanResourcesServices.showEmployeeBankAccount = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employeesBankAccounts/${id}`);
    return data;
}

humanResourcesServices.deleteEmployeeBankAccount = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employeesBankAccounts/${id}/delete`);
    return data;
}

// ============================================
// EMPLOYEE NEXT OF KINS
// ============================================
humanResourcesServices.getEmployeeNextOfKinsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/employeesNextOfKins', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addEmployeeNextOfKin = async (nextOfKin) => {
    const { data } = await axios.post('/api/humanResources/employeesNextOfKins/add', nextOfKin);
    return data;
}

humanResourcesServices.updateEmployeeNextOfKin = async (nextOfKin) => {
    const { data } = await axios.put(`/api/humanResources/employeesNextOfKins/${nextOfKin.id}/update`, nextOfKin);
    return data;
}

humanResourcesServices.showEmployeeNextOfKin = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employeesNextOfKins/${id}`);
    return data;
}

humanResourcesServices.deleteEmployeeNextOfKin = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employeesNextOfKins/${id}/delete`);
    return data;
}

// ============================================
// ALLOWANCE TYPES
// ============================================
humanResourcesServices.getAllowanceTypesList = async (params = {}) => {
    const { page = 1, limit = 50, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/allowanceTypes', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addAllowanceType = async (allowanceType) => {
    const { data } = await axios.post('/api/humanResources/allowanceTypes/add', allowanceType);
    return data;
}

humanResourcesServices.updateAllowanceType = async (allowanceType) => {
    const { data } = await axios.put(`/api/humanResources/allowanceTypes/${allowanceType.id}/update`, allowanceType);
    return data;
}

humanResourcesServices.showAllowanceType = async (id) => {
    const { data } = await axios.get(`/api/humanResources/allowanceTypes/${id}`);
    return data;
}

humanResourcesServices.deleteAllowanceType = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/allowanceTypes/${id}/delete`);
    return data;
}

// ============================================
// DEDUCTION TYPES
// ============================================
humanResourcesServices.getDeductionTypesList = async (params = {}) => {
    const { page = 1, limit = 50, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/deductionTypes', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addDeductionType = async (deductionType) => {
    const { data } = await axios.post('/api/humanResources/deductionTypes/add', deductionType);
    return data;
}

humanResourcesServices.updateDeductionType = async (deductionType) => {
    const { data } = await axios.put(`/api/humanResources/deductionTypes/${deductionType.id}/update`, deductionType);
    return data;
}

humanResourcesServices.showDeductionType = async (id) => {
    const { data } = await axios.get(`/api/humanResources/deductionTypes/${id}`);
    return data;
}

humanResourcesServices.deleteDeductionType = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/deductionTypes/${id}/delete`);
    return data;
}

// ============================================
// EMPLOYER CONTRIBUTION TYPES
// ============================================
humanResourcesServices.getEmployerContributionTypesList = async (params = {}) => {
    const { page = 1, limit = 50, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/employerContributionTypes', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addEmployerContributionType = async (contributionType) => {
    const { data } = await axios.post('/api/humanResources/employerContributionTypes/add', contributionType);
    return data;
}

humanResourcesServices.updateEmployerContributionType = async (contributionType) => {
    const { data } = await axios.put(`/api/humanResources/employerContributionTypes/${contributionType.id}/update`, contributionType);
    return data;
}

humanResourcesServices.showEmployerContributionType = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employerContributionTypes/${id}`);
    return data;
}

humanResourcesServices.deleteEmployerContributionType = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employerContributionTypes/${id}/delete`);
    return data;
}

// ============================================
// EMPLOYEE ALLOWANCES
// ============================================
humanResourcesServices.getEmployeeAllowancesList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/employeeAllowances', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addEmployeeAllowance = async (employeeAllowance) => {
    const { data } = await axios.post('/api/humanResources/employeeAllowances/add', employeeAllowance);
    return data;
}

humanResourcesServices.updateEmployeeAllowance = async (employeeAllowance) => {
    const { data } = await axios.put(`/api/humanResources/employeeAllowances/${employeeAllowance.id}/update`, employeeAllowance);
    return data;
}

humanResourcesServices.showEmployeeAllowance = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employeeAllowances/${id}`);
    return data;
}

humanResourcesServices.deleteEmployeeAllowance = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employeeAllowances/${id}/delete`);
    return data;
}

// ============================================
// EMPLOYEE DEDUCTIONS
// ============================================
humanResourcesServices.getEmployeeDeductionsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/employeeDeductions', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addEmployeeDeduction = async (employeeDeduction) => {
    const { data } = await axios.post('/api/humanResources/employeeDeductions/add', employeeDeduction);
    return data;
}

humanResourcesServices.updateEmployeeDeduction = async (employeeDeduction) => {
    const { data } = await axios.put(`/api/humanResources/employeeDeductions/${employeeDeduction.id}/update`, employeeDeduction);
    return data;
}

humanResourcesServices.showEmployeeDeduction = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employeeDeductions/${id}`);
    return data;
}

humanResourcesServices.deleteEmployeeDeduction = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employeeDeductions/${id}/delete`);
    return data;
}

// ============================================
// EMPLOYEE EMPLOYER CONTRIBUTIONS
// ============================================
humanResourcesServices.getEmployeeEmployerContributionsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/employeeEmployerContributions', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addEmployeeEmployerContribution = async (employeeEmployerContribution) => {
    const { data } = await axios.post('/api/humanResources/employeeEmployerContributions/add', employeeEmployerContribution);
    return data;
}

humanResourcesServices.updateEmployeeEmployerContribution = async (employeeEmployerContribution) => {
    const { data } = await axios.put(`/api/humanResources/employeeEmployerContributions/${employeeEmployerContribution.id}/update`, employeeEmployerContribution);
    return data;
}

humanResourcesServices.showEmployeeEmployerContribution = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employeeEmployerContributions/${id}`);
    return data;
}

humanResourcesServices.deleteEmployeeEmployerContribution = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employeeEmployerContributions/${id}/delete`);
    return data;
}

// ============================================
// LEAVE ALLOCATIONS
// ============================================
humanResourcesServices.getLeaveAllocationsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/leaveAllocations', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addLeaveAllocation = async (leaveAllocation) => {
    const { data } = await axios.post('/api/humanResources/leaveAllocations/add', leaveAllocation);
    return data;
}

humanResourcesServices.updateLeaveAllocation = async (leaveAllocation) => {
    const { data } = await axios.put(`/api/humanResources/leaveAllocations/${leaveAllocation.id}/update`, leaveAllocation);
    return data;
}

humanResourcesServices.showLeaveAllocation = async (id) => {
    const { data } = await axios.get(`/api/humanResources/leaveAllocations/${id}`);
    return data;
}

humanResourcesServices.deleteLeaveAllocation = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/leaveAllocations/${id}/delete`);
    return data;
}

// ============================================
// LEAVE REQUESTS
// ============================================
humanResourcesServices.getLeaveRequestsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/leaveRequests', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addLeaveRequest = async (leaveRequest) => {
    const { data } = await axios.post('/api/humanResources/leaveRequests/add', leaveRequest);
    return data;
}

humanResourcesServices.updateLeaveRequest = async (leaveRequest) => {
    const { data } = await axios.put(`/api/humanResources/leaveRequests/${leaveRequest.id}/update`, leaveRequest);
    return data;
}

humanResourcesServices.approveLeaveRequest = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/leaveRequests/${id}/approve`, payload);
    return data;
}

humanResourcesServices.rejectLeaveRequest = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/leaveRequests/${id}/reject`, payload);
    return data;
}

humanResourcesServices.cancelLeaveRequest = async (id) => {
    const { data } = await axios.post(`/api/humanResources/leaveRequests/${id}/cancel`);
    return data;
}

humanResourcesServices.addLeaveRequestApproval = async (approval) => {
    const { data } = await axios.post('/api/humanResources/leaveRequestApprovals', approval);
    return data;
}

humanResourcesServices.deleteLeaveRequestApproval = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/leaveRequestApprovals/${id}/delete`);
    return data;
}

humanResourcesServices.updateLeaveRequestApproval = async (id, payload) => {
    const { data } = await axios.put(`/api/humanResources/leaveRequestApprovals/${id}`, payload);
    return data;
}

humanResourcesServices.showLeaveRequest = async (id) => {
    const { data } = await axios.get(`/api/humanResources/leaveRequests/${id}`);
    return data;
}

humanResourcesServices.deleteLeaveRequest = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/leaveRequests/${id}/delete`);
    return data;
}

// ============================================
// LOAN REQUESTS
// ============================================
humanResourcesServices.getLoanRequestsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/loanRequests', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addLoanRequests = async (loan) => {
    const { data } = await axios.post(`/api/humanResources/loanRequests/add`, loan)
    return data;
}

humanResourcesServices.showLoanRequest = async (id) => {
    const { data } = await axios.get(`/api/humanResources/loanRequests/${id}`);
    return data;
}

humanResourcesServices.approveLoanRequest = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/loanRequests/${id}/directApproval`, payload);
    return data;
}

humanResourcesServices.rejectLoanRequest = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/loanRequests/${id}/reject`, payload);
    return data;
}

humanResourcesServices.loanRequestChainDecision = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/loanRequests/chainDecision`, payload);
    return data;
}

humanResourcesServices.cancelLoanRequest = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/loanRequests/${id}/cancel`, payload);
    return data;
}

humanResourcesServices.deleteLoanRequest = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/loanRequests/${id}/delete`);
    return data;
}

humanResourcesServices.disburseLoanRequest = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/loanRequests/${id}/disburse`, payload);
    return data;
}

humanResourcesServices.markLoanRequestDisbursed = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/loanRequests/${id}/markDisbursed`, payload);
    return data;
}

humanResourcesServices.reverseLoanDisbursement = async (id) => {
    const { data } = await axios.post(`/api/humanResources/loanRequests/${id}/reverseDisbursement`);
    return data;
}

humanResourcesServices.reverseLoanApproval = async (id) => {
    const { data } = await axios.post(`/api/humanResources/loanRequests/${id}/reverseApproval`);
    return data;
}

humanResourcesServices.updateLoanRequest = async ({ id, ...payload }) => {
    const { data } = await axios.put(`/api/humanResources/loanRequests/${id}`, payload);
    return data;
}

// ============================================
// PAYE TAX BANDS
// ============================================
humanResourcesServices.getPayeTaxBandsList = async (params = {}) => {
    const { page = 1, limit = 50, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/payeTaxBands', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addPayeTaxBand = async (payeTaxBand) => {
    const { data } = await axios.post('/api/humanResources/payeTaxBands/add', payeTaxBand);
    return data;
}

humanResourcesServices.updatePayeTaxBand = async (payeTaxBand) => {
    const { data } = await axios.put(`/api/humanResources/payeTaxBands/${payeTaxBand.id}/update`, payeTaxBand);
    return data;
}

humanResourcesServices.showPayeTaxBand = async (id) => {
    const { data } = await axios.get(`/api/humanResources/payeTaxBands/${id}`);
    return data;
}

humanResourcesServices.deletePayeTaxBand = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/payeTaxBands/${id}/delete`);
    return data;
}

// ============================================
// PAYROLL PERIODS
// ============================================
humanResourcesServices.getPayrollPeriodsList = async (params = {}) => {
    const { page = 1, limit = 50, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/payrollPeriods', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addPayrollPeriod = async (payrollPeriod) => {
    const { data } = await axios.post('/api/humanResources/payrollPeriods/add', payrollPeriod);
    return data;
}

humanResourcesServices.updatePayrollPeriod = async (payrollPeriod) => {
    const { data } = await axios.put(`/api/humanResources/payrollPeriods/${payrollPeriod.id}/update`, payrollPeriod);
    return data;
}

humanResourcesServices.deletePayrollPeriod = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/payrollPeriods/${id}/delete`);
    return data;
}

humanResourcesServices.showPayrollPeriod = async (id) => {
    const { data } = await axios.get(`/api/humanResources/payrollPeriods/${id}`);
    return data;
}

humanResourcesServices.processPayrollPeriodAllEmployees = async (payload = {}) => {
    const { id } = payload;
    const { data } = await axios.post(`/api/humanResources/payrollPeriods/${id}/process`);
    return data;
}

humanResourcesServices.processPayrollPeriodSingleEmployee = async (payload = {}) => {
    const { id, employee_id } = payload;
    const { data } = await axios.post(`/api/humanResources/payrollPeriods/${id}/process-employee`, {
        employee_id,
    });
    return data;
}

humanResourcesServices.processPayrollPeriodEmployees = async (payload = {}) => {
    const { id, employee_ids = [] } = payload;
    const { data } = await axios.post(`/api/humanResources/payrollPeriods/${id}/process-employees`, {
        employee_ids,
    });
    return data;
}

humanResourcesServices.approvePayrollPeriod = async (id) => {
    const { data } = await axios.post(`/api/humanResources/payrollPeriods/${id}/approve`);
    return data;
}

humanResourcesServices.markPayrollPeriodPaid = async (id) => {
    const { data } = await axios.post(`/api/humanResources/payrollPeriods/${id}/mark-paid`);
    return data;
}

humanResourcesServices.getSalaryComponentsSummary = async (params = {}) => {
    const { year, month, cost_center_ids = [] } = params;
    const queryParams = {
        year,
        month,
        ...(cost_center_ids?.length ? { cost_center_ids } : {}),
    };
    const { data } = await axios.get('/api/humanResources/payroll-reports/salary-components-summary', {
        params: queryParams,
    });
    return data;
};

// ============================================
// PAYROLL PERIODS ADJUSTMENTS
// ============================================
humanResourcesServices.downloadPeriodAdjustmentTemplate = async () => {
    const { data } = await axios.post('/api/humanResources/payrollPeriods/period-adjustments-template/download', {}, {
        responseType: 'blob',
    });
    return data;
}

humanResourcesServices.importPeriodAdjustmentExcel = async (periodId, file) => {
    const { data } = await axios.post(`/api/humanResources/payrollPeriods/period-adjustments-template/${periodId}/upload`, file, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}
// --- adjustments review --- //
humanResourcesServices.periodAdjustmentReview = async (periodId, params = {}) => {
    const { data } = await axios.get(`/api/humanResources/payrollPeriods/period-adjustments-template/${periodId}`, {
        params,
    });
    return data;
};
// ===== edit an adjustment ===== //
humanResourcesServices.updateperiodAdjustmentAllowance = async (adjustmentAllowance) => {
    const { data } = await axios.put(`/api/humanResources/payrollPeriods/period-adjustments-template/allowances/${adjustmentAllowance.id}/update`, adjustmentAllowance)
    return data;
}
humanResourcesServices.updateperiodAdjustmentDeducction = async (adjustmentDeduction) => {
    const { data } = await axios.put(`/api/humanResources/payrollPeriods/period-adjustments-template/deductions/${adjustmentDeduction.id}/update`, adjustmentDeduction)
    return data;
}
// ===== remove an adjustmen ===== //
humanResourcesServices.deleteperiodAdjustmentAllowance = async (allowanceId) => {
    const { data } = await axios.delete(`/api/humanResources/payrollPeriods/period-adjustments-template/allowances/${allowanceId}/delete`);
    return data;
}
humanResourcesServices.deleteperiodAdjustmentDeduction = async (deductionId) => {
    const { data } = await axios.delete(`/api/humanResources/payrollPeriods/period-adjustments-template/deductions/${deductionId}/delete`);
    return data;
}


// ============================================
// PAYROLL RUNS
// ============================================
humanResourcesServices.getPayrollRunsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/payrollRuns', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addPayrollRun = async (payload) => {
    const { data } = await axios.post('/api/humanResources/payrollRuns/add', payload);
    return data;
}

humanResourcesServices.updatePayrollRun = async (payload) => {
    const { data } = await axios.put(`/api/humanResources/payrollRuns/${payload.id}/update`, payload);
    return data;
}

humanResourcesServices.showPayrollRun = async (id) => {
    const { data } = await axios.get(`/api/humanResources/payrollRuns/${id}`);
    return data?.data || data;
}

humanResourcesServices.deletePayrollRun = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/payrollRuns/${id}/delete`);
    return data;
}

humanResourcesServices.finalizePayrollRun = async (id) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/finalize`);
    return data;
}

// Preview - calculate live without saving
humanResourcesServices.previewPayrollRun = async ({ id, employee_ids = null }) => {
    const payload = Array.isArray(employee_ids) && employee_ids.length ? { employee_ids } : {};
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/preview`, payload);
    return data;
}

// Simulate - calculate for a single employee
humanResourcesServices.simulatePayrollRun = async ({ id, employee_id }) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/simulate`, { employee_id });
    return data;
}

// Submit - saves payslips and moves to submitted status
humanResourcesServices.submitPayrollRun = async ({ id, employee_ids = [] }) => {
    const payload = Array.isArray(employee_ids) && employee_ids.length ? { employee_ids } : {};
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/submit`, payload);
    return data;
}

// Direct Approval (no chain)
humanResourcesServices.approvePayrollRun = async (id) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/approve`);
    return data;
}

// Chain Approval
humanResourcesServices.addPayrollRunApproval = async (approval) => {
    const { data } = await axios.post('/api/humanResources/payrollRunApprovals', approval);
    return data;
}

humanResourcesServices.deletePayrollRunApproval = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/payrollRunApprovals/${id}/delete`);
    return data;
}

humanResourcesServices.updatePayrollRunApproval = async (id, payload) => {
    const { data } = await axios.put(`/api/humanResources/payrollRunApprovals/${id}`, payload);
    return data;
}

// Post Transactions - creates Journal Voucher
humanResourcesServices.postPayrollRunTransactions = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/post-transactions`, payload);
    return data;
}

// Pay Employees - creates Payment Voucher. payload may include payslip_payments
// for partial/specific-employee payments; omit it to pay everyone in full.
humanResourcesServices.payPayrollRun = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/pay`, payload);
    return data;
}

// What's left to pay, per employee — for the partial-payment screen.
humanResourcesServices.payrollRunPayBalances = async (id) => {
    const { data } = await axios.get(`/api/humanResources/payrollRuns/${id}/pay-balances`);
    return data;
}

// What this run accrued/settled/still-owes per deduction/employer-contribution type.
humanResourcesServices.payrollRunPayableSummary = async (id) => {
    const { data } = await axios.get(`/api/humanResources/payrollRuns/${id}/payable-summary`);
    return data;
}

// Settle (some or all of) this run's deduction/employer-contribution payables.
humanResourcesServices.payPayrollRunPayables = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/pay-payables`, payload);
    return data;
}

// Every payment (employee net-pay or payable settlement) made against this run.
humanResourcesServices.payrollRunPayments = async (id) => {
    const { data } = await axios.get(`/api/humanResources/payrollRuns/${id}/payments`);
    return data;
}

// Undo a specific payment (wrong date/amount, etc.) — recomputes the run's paid status.
humanResourcesServices.reversePayrollRunPayment = async ({ id, payment_id }) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/reversePayment`, { payment_id });
    return data;
}

// Full breakdown of one payment — one line per employee/payable type.
humanResourcesServices.payrollRunPaymentDetail = async ({ id, paymentId }) => {
    const { data } = await axios.get(`/api/humanResources/payrollRuns/${id}/payments/${paymentId}`);
    return data;
}

// Edit a payment's date/narration/credit ledger and/or individual line amounts.
humanResourcesServices.updatePayrollRunPayment = async ({ id, paymentId, ...payload }) => {
    const { data } = await axios.put(`/api/humanResources/payrollRuns/${id}/payments/${paymentId}`, payload);
    return data;
}

// Remove one line from a payment (e.g. an employee paid by mistake).
humanResourcesServices.removePayrollRunPaymentItem = async ({ id, paymentId, journal_id }) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/payments/${paymentId}/removeItem`, { journal_id });
    return data;
}

// complete payroll run - if orgnization has not subscribed to accounts and finance module
humanResourcesServices.completePayrollRun = async (id) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/complete`);
    return data;
}

// salary sheet (Bnk transfer list)
humanResourcesServices.bankTransferList = async (id) => {
    const { data } = await axios.get(`/api/humanResources/payrollRuns/${id}/salary-sheet`);
    return data;
}

humanResourcesServices.bankTransferListExcel = async (id) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/salary-sheet`, {}, {
        responseType: 'blob',
    });
    return data;
}

// ============================================
// PAYSLIPS
// ============================================
humanResourcesServices.getPayslipsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/payslips', {
        params: { page, limit, ...queryParams }
    });
    return data;
}

humanResourcesServices.showPayslip = async (id) => {
    const { data } = await axios.get(`/api/humanResources/payslips/${id}`);
    return data?.data || data;
}

// ============================================
// MY HR
// ============================================

// --- Profile tab ---
humanResourcesServices.myHrProfile = async () => {
    const { data } = await axios.get(`/api/humanResources/myHr/profile`);
    return data;
};

// --- Payslips tab ---
humanResourcesServices.myHrPayslipsList = async (params = {}) => {
    const { data } = await axios.get('/api/humanResources/myHr/payslips', {
        params,
    });
    return data;
};

humanResourcesServices.myHrPayslip = async (id) => {
    const { data } = await axios.get(`/api/humanResources/myHr/payslips/${id}`);
    return data;
};

// --- contractstab ---
humanResourcesServices.myHrContracts = async (params = {}) => {
    const { data } = await axios.get('/api/humanResources/myHr/contracts', {
        params,
    });
    return data;
};

// --- next of kin tab ---
humanResourcesServices.myHrNextOfKin = async (params = {}) => {
    const { data } = await axios.get('/api/humanResources/myHr/nextOfKin', {
        params,
    });
    return data;
};

// --- account statemtnt tab ---
humanResourcesServices.myHrAccountStatement = async (params = {}) => {
    const { data } = await axios.get('/api/humanResources/myHr/accountStatement', {
        params,
    });
    return data;
};

// --- imprest accounts tab ---
humanResourcesServices.myHrImprestAccounts = async (params = {}) => {
    const { data } = await axios.get('/api/humanResources/myHr/imprestAccounts', {
        params,
    });
    return data;
};

humanResourcesServices.myHrImprestAccountStatement = async (id, params = {}) => {
    const { data } = await axios.get(`/api/humanResources/myHr/imprestAccounts/${id}`, { params });
    return data;
};

// ===== LEAVES TAB ===== //
// ---Leave requests ---
humanResourcesServices.myHrLeaveRequests = async (params = {}) => {
    const { data } = await axios.get('/api/humanResources/myHr/leave/leaveRequests', {
        params,
    });
    return data;
};

humanResourcesServices.myHrAddLeaveRequests = async (leaveRequest) => {
    const { data } = await axios.post('/api/humanResources/myHr/leave/leaveRequests/add', leaveRequest);
    return data;
}

// ---Leave balances ---
humanResourcesServices.myHrLeaveBalances = async (params = {}) => {
    const { data } = await axios.get('/api/humanResources/myHr/leave/leaveBalances', {
        params,
    });
    return data;
};

//  ===== LOANS TAB ===== //
// --- laon reuqests --- 
humanResourcesServices.myHrLoanRequests = async (params = {}) => {
    const { data } = await axios.get('/api/humanResources/myHr/loanRequests', {
        params,
    });
    return data;
};
// --- add loan request ---
humanResourcesServices.myHrAddLoanRequests = async (loan) => {
    const { data } = await axios.post(`/api/humanResources/myHr/loanRequests/add`, loan)
    return data;
}
// --- update loan request (creator only, while still in_review) ---
humanResourcesServices.myHrUpdateLoanRequest = async ({ id, ...payload }) => {
    const { data } = await axios.put(`/api/humanResources/myHr/loanRequests/${id}`, payload);
    return data;
}

// ============================================
// EXPORT
// ============================================
humanResourcesServices.ExportPayrollToExcel = async (exportedData) => {
    const res = await axios.post(`/api/exports/excel/payrolls/`, exportedData, {
        responseType: 'blob',
    });
    return res.data;
}
humanResourcesServices.ExportPayrollPeriodToExcel = async (exportedData) => {
    const res = await axios.post(`/api/exports/excel/payrollPeriod/`, exportedData, {
        responseType: 'blob',
    });
    return res.data;
}

export default humanResourcesServices;