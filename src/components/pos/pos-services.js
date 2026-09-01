import axios from "@/lib/services/config";

const posServices = {};

posServices.getUserOutlets = async (params) => {
    const { userId } = params;
    const { data } = await axios.get(`/api/pos/counter/${userId}/getUserOutlets`);
    return data;
},

    posServices.getCounterLedgers = async (counter_id) => {
        const { data } = await axios.get(`/api/pos/counter/${counter_id}/getCounterLedgers`);
        return data;
    }

posServices.getCounterSales = async ({ counterId, keyword, page, limit, from, to, status }) => {
    const response = await axios.get(`/api/pos/counter/${counterId}/getCounterSales`, {
        params: { counterId, keyword, page, limit, from, to, status },
    });
    return response.data;
};

posServices.salesManifest = async (params) => {
    const { data } = await axios.get(`/api/pos/counter/salesManifest`, {
        params
    });
    return data;
}

posServices.invoiceAdjustmentDetails = async (id, type) => {
    const { data } = await axios.get(`/api/accountsAndFinance/transactions/${type}/${id}/invoiceAdjustmentDetails`);
    return data;
}

posServices.saleRelatableAdjustments = async (id) => {
    const { data } = await axios.get(`/api/pos/counter/${id}/saleRelatableAdjustments`);
    return data;
}

posServices.addSale = async (sale) => {
    const { data } = await axios.post(`/api/pos/counter/addSale`, sale);
    return data;
}

posServices.invoiceAdjustment = async (invoiceAdjustment) => {
    const { data } = await axios.post(`/api/pos/counter/invoiceAdjustment`, invoiceAdjustment);
    return data;
}

posServices.postSaleToVFD = async (saleData) => {
    const { data } = await axios.post(`/api/pos/counter/postSaleToVFD`, saleData);
    return data;
}

posServices.updateSale = async (sale) => {
    const { data } = await axios.put(`/api/pos/counter/${sale.id}/updateSale`, sale)
    return data;
}

posServices.updateInvoiceAdjustment = async (adjustmnet) => {
    const { data } = await axios.put(`/api/accountsAndFinance/transactions/${adjustmnet.note_type}/${adjustmnet.id}/updateInvoiceAdjustment`, adjustmnet)
    return data;
}

posServices.getSaleComplements = async (sale) => {
    const { data } = await axios.get(`/api/pos/counter/${sale.id}/getSaleComplements`);
    return data;
};

posServices.deleteSale = async (sale) => {
    const { data } = await axios.delete(`/api/pos/counter/${sale.id}/deleteSale`);
    return data;
};

posServices.saleDetails = async (id) => {
    const { data } = await axios.get(`/api/pos/counter/${id}/saleDetails`);
    return data;
}

posServices.salesFigures = async (params) => {
    const { data } = await axios.get(`/api/pos/counter/salesFigures`, {
        params
    });
    return data;
};

posServices.productSales = async (params) => {
    const { data } = await axios.get(`/api/pos/counter/productSales`, {
        params
    });
    return data;
};

posServices.productSalesReport = async (params) => {
    const { data } = await axios.get(`/api/pos/counter/productSalesReport`, {
        params
    });
    return data;
};

posServices.exportProductSalesExcel = async (exportedData) => {
    const res = await axios.post(`/api/exports/excel/topProducts/`, exportedData, {
        responseType: 'blob',
    });
    return res.data;
}

posServices.getLastPrice = async (params) => {
    const { data } = await axios.get(`/api/pos/counter/getLastPrice`, {
        params
    });
    return data;
}

posServices.dispatchSale = async (dispatchSale) => {
    const { data } = await axios.post(`/api/pos/counter/dispatchSale`, dispatchSale);
    return data;
}

posServices.invoiceSale = async (invoiceSale) => {
    const id = invoiceSale.id
    const { data } = await axios.post(`/api/pos/counter/${id}/invoiceSale`, invoiceSale);
    return data;
}

posServices.receiptSale = async (invoiceSale) => {
    const id = invoiceSale.id
    const { data } = await axios.post(`/api/pos/counter/${id}/receiptSale`, invoiceSale);
    return data;
}

posServices.deliveryNotesSalesItems = async (params) => {
    const { data } = await axios.get(`/api/pos/counter/deliveryNotesSalesItems`, {
        params
    });
    return data;
}

posServices.updateDeliveryNote = async (deliveryNote) => {
    const { data } = await axios.put(`/api/pos/counter/${deliveryNote.id}/updateDeliveryNote`, deliveryNote)
    return data;
}

posServices.updateInvoice = async (invoice) => {
    const { data } = await axios.put(`/api/pos/counter/${invoice.id}/updateInvoice`, invoice)
    return data;
}

posServices.updateSaleInvoice = async (invoice) => {
    const { data } = await axios.put(`/api/pos/counter/${invoice.id}/updateSaleInvoice`, invoice)
    return data;
}

posServices.saleDeliveryNotes = async (id) => {
    const { data } = await axios.get(`/api/pos/counter/${id}/saleDeliveryNotes`);
    return data;
}

posServices.saleDispatchReport = async (id) => {
    const { data } = await axios.get(`/api/pos/counter/${id}/saleDispatchReport`);
    return data;
}

posServices.saleInvoices = async (id) => {
    const { data } = await axios.get(`/api/pos/counter/${id}/saleInvoices`);
    return data;
}

posServices.saleReceipts = async (id) => {
    const { data } = await axios.get(`/api/pos/counter/${id}/saleReceipts`);
    return data;
}

posServices.receiptDetails = async (id) => {
    const { data } = await axios.get(`/api/pos/counter/${id}/receiptDetails`);
    return data;
}

posServices.deleteDeliveryNote = async (id) => {
    const { data } = await axios.delete(`/api/pos/counter/${id}/deleteDeliveryNote`);
    return data;
};

posServices.deleteInvoice = async (id) => {
    const { data } = await axios.delete(`/api/pos/counter/${id}/deleteInvoice`);
    return data;
};

posServices.deleteReceipt = async (id) => {
    const { data } = await axios.delete(`/api/pos/counter/${id}/deleteReceipt`);
    return data;
};

posServices.deleteSaleInvoiceAdjustment = async ({ id, type }) => {
    const { data } = await axios.delete(`/api/accountsAndFinance/transactions/${type}/${id}/deleteSaleInvoiceAdjustment`);
    return data;
};

posServices.deliveryNoteDetails = async (id) => {
    const { data } = await axios.get(`/api/pos/counter/${id}/deliveryNoteDetails`);
    return data;
}

posServices.invoiceDetails = async (id) => {
    const { data } = await axios.get(`/api/pos/counter/${id}/invoiceDetails`);
    return data;
}

posServices.getAddresses = async () => {
    const { data } = await axios.get(`/api/pos/counter/getAddresses`);
    return data;
}

posServices.getTermsandInstructions = async () => {
    const { data } = await axios.get(`/api/pos/counter/getTermsandInstructions`);
    return data;
}

posServices.getSalesPerson = async () => {
    const { data } = await axios.get(`/api/pos/counter/getSalesPerson`);
    return data;
}

posServices.downloadExcelTemplate = async (filters) => {
    const { data } = await axios.post(`/api/pos/sales-manifest-excel`, filters,
        {
            responseType: 'blob',
        }
    );
    return data;
};

export default posServices;