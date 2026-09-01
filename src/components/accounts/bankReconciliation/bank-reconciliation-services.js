import axios from "@/lib/services/config";

const bankReconciliationServices = {};

bankReconciliationServices.getBankAccounts = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get(`/api/accounts/bankReconciliation/bankAccounts`, {
        params: { page, limit, ...queryParams }
    });
    return data;
};

bankReconciliationServices.getEligibleLedgers = async () => {
    const { data } = await axios.get(`/api/accounts/bankReconciliation/bankAccounts/eligibleLedgers`);
    return data;
};

bankReconciliationServices.getBanks = async (params = {}) => {
    const { data } = await axios.get(`/api/masters/banks`, { params });
    return data;
};

bankReconciliationServices.addBank = async (bank) => {
    const { data } = await axios.post(`/api/masters/banks`, bank);
    return data;
};

bankReconciliationServices.addBankAccount = async (bankAccount) => {
    const { data } = await axios.post(`/api/accounts/bankReconciliation/bankAccounts`, bankAccount);
    return data;
};

bankReconciliationServices.updateBankAccount = async (bankAccount) => {
    const { data } = await axios.put(`/api/accounts/bankReconciliation/bankAccounts/${bankAccount.id}`, bankAccount);
    return data;
};

bankReconciliationServices.deleteBankAccount = async (bankAccountId) => {
    const { data } = await axios.delete(`/api/accounts/bankReconciliation/bankAccounts/${bankAccountId}`);
    return data;
};

bankReconciliationServices.previewColumns = async (formData) => {
    const { data } = await axios.post(`/api/accounts/bankReconciliation/bankAccounts/previewColumns`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
};

bankReconciliationServices.importStatement = async (bankAccountId, formData) => {
    const { data } = await axios.post(`/api/accounts/bankReconciliation/bankAccounts/${bankAccountId}/importStatement`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
};

bankReconciliationServices.getReconciliationWorkspace = async (bankAccountId, params = {}) => {
    const { data } = await axios.get(`/api/accounts/bankReconciliation/bankAccounts/${bankAccountId}/reconciliation`, {
        params
    });
    return data;
};

bankReconciliationServices.matchLine = async (lineId, journalIds) => {
    const { data } = await axios.post(`/api/accounts/bankReconciliation/statementLines/${lineId}/match`, { journal_ids: journalIds });
    return data;
};

bankReconciliationServices.unmatchLine = async (lineId) => {
    const { data } = await axios.post(`/api/accounts/bankReconciliation/statementLines/${lineId}/unmatch`);
    return data;
};

bankReconciliationServices.removeMatch = async (matchId) => {
    const { data } = await axios.post(`/api/accounts/bankReconciliation/matches/${matchId}/remove`);
    return data;
};

bankReconciliationServices.matchJournal = async (bankAccountId, journalId, lineIds) => {
    const { data } = await axios.post(`/api/accounts/bankReconciliation/bankAccounts/${bankAccountId}/journals/${journalId}/matchLines`, { line_ids: lineIds });
    return data;
};

bankReconciliationServices.ignoreLine = async (lineId) => {
    const { data } = await axios.post(`/api/accounts/bankReconciliation/statementLines/${lineId}/ignore`);
    return data;
};

bankReconciliationServices.completeStatement = async (statementId) => {
    const { data } = await axios.post(`/api/accounts/bankReconciliation/statements/${statementId}/complete`);
    return data;
};

bankReconciliationServices.deleteStatement = async (statementId) => {
    const { data } = await axios.delete(`/api/accounts/bankReconciliation/statements/${statementId}`);
    return data;
};

export default bankReconciliationServices;
