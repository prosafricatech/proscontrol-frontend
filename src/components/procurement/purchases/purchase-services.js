import axios from "@/lib/services/config";

const purchaseServices = {};

purchaseServices.getList = async (params) => {
    const response = await axios.get('/api/purchaseOrders', {
        params,
    });
    return response.data;
};

purchaseServices.getEditComplements = async (order_id) => {
    const { data } = await axios.get(`/api/purchaseOrders/${order_id}/getEditComplements`);
    return data;
}

purchaseServices.PurchaseGrnsReport = async (id) => {
    const { data } = await axios.get(`/api/purchaseOrders/${id}/PurchaseGrnsReport`);
    return data;
}

purchaseServices.exportPurchaseGrnsReportToExcel = async (params) => {
    const { data } = await axios.post(`/api/exports/excel/purchaseGrnsReport`, params, {
        responseType: 'blob',
    })
    return data;
}

purchaseServices.add = async (order) => {
    const { data } = await axios.post(`/api/purchaseOrders/add`, order)
    return data;
}

purchaseServices.update = async (order) => {
    const { data } = await axios.put(`/api/purchaseOrders/${order.id}/update`, order)
    return data;
}

purchaseServices.delete = async (order) => {
    const { data } = await axios.delete(`/api/purchaseOrders/${order.id}/delete`);
    return data;
};

purchaseServices.orderDetails = async (id) => {
    const { data } = await axios.get(`/api/purchaseOrders/${id}/orderDetails`);
    return data;
}

purchaseServices.getPurchaseOrderGrns = async (id) => {
    const { data } = await axios.get(`/api/purchaseOrders/${id}/getPurchaseOrderGrns`);
    return data;
}

purchaseServices.unReceiveOrderGrn = async (id) => {
    const { data } = await axios.delete(`/api/purchaseOrders/${id}/unReceiveOrderGrn`);
    return data;
}

purchaseServices.purchaseValues = async (params) => {
    const { data } = await axios.get(`/api/purchaseOrders/purchaseValues`, { params });
    return data;
}

purchaseServices.receive = async (order) => {
    const { data } = await axios.post(`/api/purchaseOrders/${order.id}/receive`, order)
    return data;
}

purchaseServices.getPurchasesReport = async (params) => {
    const { data } = await axios.get(`/api/purchaseOrders/getPurchasesReport`, {
        params: params,
        paramsSerializer: (params) => {
            const searchParams = new URLSearchParams();

            Object.keys(params).forEach(key => {
                const value = params[key];
                if (Array.isArray(value)) {
                    value.forEach(item => searchParams.append(`${key}[]`, item));
                } else if (value !== null && value !== undefined && value !== '') {
                    searchParams.append(key, value);
                }
            });

            return searchParams.toString();
        }
    });
    return data;
};

purchaseServices.getPurchasesManifestData = async (params) => {
    const { data } = await axios.get(`/api/purchaseOrders/purchaseManifestReport`, { params });
    return data;
}
purchaseServices.exportPurchaseManifestReportToExcel = async (params) => {
    const { data } = await axios.post(`/api/exports/excel/purchaseManifestReport/`, params, {
        responseType: 'blob',
    })
    return data;
}

purchaseServices.exportPurchasesReportToExcel = async (params) => {
    const { data } = await axios.post(`/api/exports/excel/purchasesReport/`, params, {
        responseType: 'blob',
    })
    return data;
}

purchaseServices.getLastPrice = async (params) => {
    const { data } = await axios.get(`/api/purchaseOrders/getLastPrice`, {
        params
    });
    return data;
}

purchaseServices.closeOrder = async (order) => {
    const { data } = await axios.post(`/api/purchaseOrders/${order.id}/closeOrder`, order)
    return data;
}

purchaseServices.reOpenOrder = async (order) => {
    const { data } = await axios.put(`/api/purchaseOrders/${order.id}/reOpenOrder`, order)
    return data;
}

purchaseServices.editGrn = async (grnId, grnData) => {
    const { data } = await axios.put(`/api/grns/${grnId}/editGrn`, grnData)
    return data;
};

export default purchaseServices;