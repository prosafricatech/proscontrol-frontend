import axios from "@/lib/services/config";

const projectsServices = {};

projectsServices.getList = async (params) => {
    const response = await axios.get('/api/projectManagement/project', {
        params,
    });
    return response.data;
};

projectsServices.getSubcontractsList = async (params) => {
    const response = await axios.get(`/api/projectManagement/project/${params.project_id}/getSubcontractsList`, {
        params,
    });
    return response.data;
};

projectsServices.projectUpdatesList = async (params) => {
    const response = await axios.get(`/api/projectManagement/project/${params.project_id}/projectUpdatesList`, {
        params,
    });
    return response.data;
}

projectsServices.projectClaimsList = async (params) => {
    const response = await axios.get(`/api/projectManagement/project/${params.project_id}/projectClaimsList`, {
        params,
    });
    return response.data;
}

projectsServices.projectUsersList = async (params) => {
    const response = await axios.get(`/api/projectManagement/project/${params.project_id}/projectUsersList`, {
        params,
    });
    return response.data;
}

projectsServices.getSubContractMaterialIssued = async (params) => {
    const response = await axios.get(
        `/api/projectManagement/project/${params.subcontract_id}/getSubContractMaterialIssued`,
        { params }
    );
    return response.data;
};

projectsServices.getCertificates = async (params) => {
    const response = await axios.get(
        `/api/projectManagement/project/${params.subcontract_id}/getCertificates`,
        { params }
    );
    return response.data;
};

// Org-wide history of certificates/claims that have cleared approval
// (status approved/invoiced) — not scoped to a single subcontract/project.
projectsServices.getApprovedSubcontractCertificates = async (params) => {
    const response = await axios.get(
        '/api/projectManagement/approvedSubcontractCertificates',
        { params }
    );
    return response.data;
};

projectsServices.getApprovedProjectPaymentClaims = async (params) => {
    const response = await axios.get(
        '/api/projectManagement/approvedProjectPaymentClaims',
        { params }
    );
    return response.data;
};

projectsServices.getSubContractDetails = async (id) => {
    const { data } = await axios.get(`/api/projectManagement/project/${id}/getSubContractDetails`);
    return data;
}

projectsServices.getClaimDetails = async (id) => {
    const { data } = await axios.get(`/api/projectManagement/project/${id}/getClaimDetails`);
    return data;
}

projectsServices.getCertificateDetails = async (id) => {
    const { data } = await axios.get(`/api/projectManagement/project/${id}/getCertificateDetails`);
    return data;
}

projectsServices.detachUsers = async (costCenterId, payload) => {
    const { data } = await axios.put(
        `/api/accountsAndFinance/cost-centers/${costCenterId}/detach-users`,
        payload
    );
    return data;
};


projectsServices.getSubcontractOptions = async (id) => {
    const { data } = await axios.get(`/api/projectManagement/project/getSubcontractOptions`, {
        params: { project_id: id }
    });
    return data;
};

projectsServices.getSubContractMaterialIssuedDetails = async (id) => {
    const { data } = await axios.get(`/api/projectManagement/project/${id}/getSubContractMaterialIssuedDetails`);
    return data;
}

projectsServices.getSubContractTasks = async (id) => {
    const { data } = await axios.get(`/api/projectManagement/project/${id}/getSubContractTasks`);
    return data;
}

projectsServices.getbudgetItemsDetails = async (id) => {
    const { data } = await axios.get(`/api/projectManagement/project/${id}/getbudgetItemsDetails`);
    return data;
}

projectsServices.getBudgetedCostItems = async (budgetId, ledgerId) => {
    const { data } = await axios.get(`/api/projectManagement/project/${budgetId}/budgeted-cost-items`, {
        params: { ledgerId }
    });
    return data;
}

projectsServices.getCommittedCostItems = async (budgetId, ledgerId) => {
    const { data } = await axios.get(`/api/projectManagement/project/${budgetId}/committed-cost-items`, {
        params: { ledgerId }
    });
    return data;
}

projectsServices.getBudgetPosition = async (budgetId) => {
    const { data } = await axios.get(`/api/projectManagement/project/${budgetId}/budget-position`);
    return data;
}

projectsServices.exportBudgetItemsDetailsExcel = async (exportedData) => {
    const res = await axios.post(`/api/exports/excel/budgetDetails/`, exportedData, {
        responseType: 'blob',
    });
    return res.data;
}

projectsServices.showProjectBudgets = async (params) => {
    const response = await axios.get(`/api/projectManagement/project/showProjectBudgets`, {
        params,
    });
    return response.data;
};

projectsServices.addProject = async (project) => {
    const { data } = await axios.post('/api/projectManagement/project/addProject', project)
    return data;
}

projectsServices.addSubContractTask = async (tasks) => {
    const { data } = await axios.post('/api/projectManagement/project/addSubContractTask', tasks)
    return data;
}

projectsServices.addCertificates = async (certificate) => {
    const { data } = await axios.post('/api/projectManagement/project/addCertificates', certificate)
    return data;
}

projectsServices.addClaim = async (claim) => {
    const { data } = await axios.post('/api/projectManagement/project/addClaims', claim)
    return data;
}

projectsServices.addSubcontractCertificateApproval = async (approval) => {
    const { data } = await axios.post('/api/projectManagement/project/certificateApprovals', approval)
    return data;
}

projectsServices.addProjectPaymentClaimApproval = async (approval) => {
    const { data } = await axios.post('/api/projectManagement/project/claimApprovals', approval)
    return data;
}

projectsServices.addSubContractMaterialIssued = async (tasks) => {
    const { data } = await axios.post('/api/projectManagement/project/addSubContractMaterialIssued', tasks)
    return data;
}

projectsServices.addSubcontract = async (project) => {
    const { data } = await axios.post('/api/projectManagement/project/addSubcontract', project)
    return data;
}

projectsServices.addDeliverableGroup = async (group) => {
    const { data } = await axios.post('/api/projectManagement/project/addDeliverableGroup', group)
    return data;
}

projectsServices.addTimelineActivity = async (activity) => {
    const { data } = await axios.post('/api/projectManagement/project/addTimelineActivity', activity)
    return data;
}

projectsServices.addProjectUpdates = async (updates) => {
    const { data } = await axios.post('/api/projectManagement/project/addProjectUpdates', updates)
    return data;
}

projectsServices.addDeliverables = async (deliverable) => {
    const { data } = await axios.post('/api/projectManagement/project/addDeliverables', deliverable)
    return data;
}

projectsServices.addTask = async (task) => {
    const { data } = await axios.post('/api/projectManagement/project/addTask', task)
    return data;
}

projectsServices.addBudget = async (budget) => {
    const { data } = await axios.post('/api/projectManagement/project/addBudget', budget)
    return data;
}

projectsServices.addBudgetItems = async (budget) => {
    const { data } = await axios.post(`/api/projectManagement/project/addBudgetItems`, budget)
    return data;
}

projectsServices.updateDeliverableGroup = async (group) => {
    const { data } = await axios.put(`/api/projectManagement/project/${group.id}/updateDeliverableGroup`, group)
    return data;
}

projectsServices.updateTimelineActivity = async (activity) => {
    const { data } = await axios.put(`/api/projectManagement/project/${activity.id}/updateTimelineActivity`, activity)
    return data;
}

projectsServices.updateSubContractTask = async (subContractTask) => {
    const { data } = await axios.put(`/api/projectManagement/project/${subContractTask.id}/updateSubContractTask`, subContractTask)
    return data;
}

projectsServices.updateCertificates = async (certificate) => {
    const { data } = await axios.put(`/api/projectManagement/project/${certificate.id}/updateCertificates`, certificate)
    return data;
}

projectsServices.updateDeliverables = async (deliverable) => {
    const { data } = await axios.put(`/api/projectManagement/project/${deliverable.id}/updateDeliverables`, deliverable)
    return data;
}

projectsServices.updateClaim = async (claim) => {
    const { data } = await axios.put(`/api/projectManagement/project/${claim.id}/updateClaim`, claim)
    return data;
}

projectsServices.invoiceClaim = async (id) => {
    const { data } = await axios.post(`/api/projectManagement/project/${id}/invoiceClaim`)
    return data;
}

projectsServices.updateProjectUpdates = async (update) => {
    const { data } = await axios.put(`/api/projectManagement/project/${update.id}/updateProjectUpdates`, update)
    return data;
}

projectsServices.updateSubcontract = async (subcontract) => {
    const { data } = await axios.put(`/api/projectManagement/project/${subcontract.id}/updateSubcontract`, subcontract)
    return data;
}

projectsServices.updateSubContractMaterialIssued = async (material) => {
    const { data } = await axios.put(`/api/projectManagement/project/${material.id}/updateSubContractMaterialIssued`, material)
    return data;
}

projectsServices.updateProject = async (project) => {
    const { data } = await axios.put(`/api/projectManagement/project/${project.id}/updateProject`, project)
    return data;
}

projectsServices.EditTask = async (task) => {
    const { data } = await axios.put(`/api/projectManagement/project/${task.id}/EditTask`, task)
    return data;
}

projectsServices.ViewTaskMaterials = async (params) => {
    const { data } = await axios.get(`/api/projectManagement/project/${params.id}/getTaskMaterialUsed`, { params })
    return data;
}

projectsServices.EditBudget = async (budget) => {
    const { data } = await axios.put(`/api/projectManagement/project/${budget.id}/EditBudget`, budget)
    return data;
}

projectsServices.showDeliverablesAndGroups = async (id) => {
    const { data } = await axios.get(`/api/projectManagement/project/${id}/showDeliverablesAndGroups`);
    return data;
}

projectsServices.showProjectTimelineActivities = async (id) => {
    const { data } = await axios.get(`/api/projectManagement/project/${id}/showProjectTimelineActivities`);
    return data;
}

projectsServices.cloneProjectWbsDraft = async (payload) => {
    const { data } = await axios.post('/api/projectManagement/project/cloneTimelineActivities', payload);
    return data;
}

projectsServices.projectUpdateDetails = async (id) => {
    const { data } = await axios.get(`/api/projectManagement/project/${id}/projectUpdateDetails`);
    return data;
}

projectsServices.showProjectTaskDetails = async (taskId) => {
    const { data } = await axios.get(`/api/projectManagement/project/${taskId}/showProjectTaskDetails`);
    return data;
}

projectsServices.showSubcontractTaskDetails = async (taskId, certificateDate) => {
    const { data } = await axios.get(
        `/api/projectManagement/project/${taskId}/showSubcontractTaskDetails`,
        {
            params: {
                as_at: certificateDate
            }
        }
    );
    return data;
};

projectsServices.showDelUncertifiedQTY = async (delId, claimDate) => {
    const { data } = await axios.get(
        `/api/projectManagement/project/${delId}/showDelUncertifiedQTY`,
        {
            params: {
                as_at: claimDate
            }
        }
    );
    return data;
};

projectsServices.showDeliverableDetails = async (id) => {
    const { data } = await axios.get(`/api/projectManagement/project/${id}/showDeliverableDetails`);
    return data;
}

projectsServices.showProject = async ({ queryKey }) => {
    const id = queryKey[1]?.id;
    const { data } = await axios.get(`/api/projectManagement/project/${id}/showProject`)
    return data;
}


projectsServices.getProjectDashboardFigures = async (projectId) => {
    const { data } = await axios.get(`/api/projectManagement/project/${projectId}/dashboard-figures`);
    return data;
}

projectsServices.getProjectCommitments = async (projectId) => {
    const { data } = await axios.get(`/api/projectManagement/project/${projectId}/commitments`);
    return data;
}

projectsServices.exportProjectLiabilitiesExcel = async (params) => {
    const { data } = await axios.post(`/api/exports/excel/projectLiabilitiesReport/`, params, {
        responseType: 'blob',
    }
    );
    return data;
},

    projectsServices.exportProjectInventoryValuesReportExcel = async (params) => {
        const { data } = await axios.post(`/api/exports/excel/projectInventoryValuesReport/`, params, {
            responseType: 'blob'
        }
        );
        return data;
    },

    projectsServices.deleteProject = async (project_id) => {
        const { data } = await axios.delete(`/api/projectManagement/project/${project_id}/deleteProject`);
        return data;
    };

projectsServices.deleteExistingBudgetItem = async ({ id, type }) => {
    const { data } = await axios.delete(`/api/projectManagement/project/deleteExistingBudgetItem/${type}/${id}`);
    return data;
};

projectsServices.deleteDeliverableGroup = async (group) => {
    const { data } = await axios.delete(`/api/projectManagement/project/${group.id}/deleteDeliverableGroup`);
    return data;
};

projectsServices.deleteTimelineActivity = async (activity) => {
    const { data } = await axios.delete(`/api/projectManagement/project/${activity.id}/deleteTimelineActivity`);
    return data;
};

projectsServices.deleteDeliverable = async (id) => {
    const { data } = await axios.delete(`/api/projectManagement/project/${id}/deleteDeliverable`);
    return data;
};

projectsServices.deleteTask = async (id) => {
    const { data } = await axios.delete(`/api/projectManagement/project/${id}/deleteTask`);
    return data;
};

projectsServices.deleteClaim = async (id) => {
    const { data } = await axios.delete(`/api/projectManagement/project/${id}/deleteClaim`);
    return data;
};

projectsServices.deleteBudget = async (id) => {
    const { data } = await axios.delete(`/api/projectManagement/project/${id}/deleteBudget`);
    return data;
};

projectsServices.deleteSubContractTask = async (id) => {
    const { data } = await axios.delete(`/api/projectManagement/project/${id}/deleteSubContractTask`);
    return data;
};

projectsServices.deleteSubContract = async (id) => {
    const { data } = await axios.delete(`/api/projectManagement/project/${id}/deleteSubContract`);
    return data;
};

projectsServices.deleteCertificate = async (id) => {
    const { data } = await axios.delete(`/api/projectManagement/project/${id}/deleteCertificate`);
    return data;
};

projectsServices.invoiceCertificate = async (id) => {
    const { data } = await axios.post(`/api/projectManagement/project/${id}/invoiceCertificate`);
    return data;
};

projectsServices.deleteSubContractMaterialIssued = async (id) => {
    const { data } = await axios.delete(`/api/projectManagement/project/${id}/deleteSubContractMaterialIssued`);
    return data;
};

projectsServices.deleteUpdate = async (id) => {
    const { data } = await axios.delete(`/api/projectManagement/project/${id}/deleteUpdate`);
    return data;
};

export default projectsServices;