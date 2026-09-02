import axios from "@/lib/services/config";

const fuelStationServices = {};

fuelStationServices.getStationShifts = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get(`/api/fuelStations/stations/${queryParams.stationId}/getStationShifts`, {
        params: { page, limit, ...queryParams }
    });
    return data;
}

fuelStationServices.getStationDippings = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get(`/api/fuelStations/stations/${queryParams.stationId}/dippings`, {
        params: { page, limit, ...queryParams }
    });
    return data;
}

fuelStationServices.dippingReport = async (params) => {
    const { data } = await axios.get(`/api/fuelStations/dippings/dippingReport`, {
        params
    })
    return data;
}

fuelStationServices.exportDippingReportToExcel = async (exportedData) => {
    const res = await axios.post(`/api/exports/excel/dippingReport/`, exportedData, {
        responseType: 'blob',
    });
    return res.data;
}

fuelStationServices.FuelVouchersReport = async (params) => {
    const { data } = await axios.get(`/api/fuelStations/stations/fuelVouchersReport`, {
        params
    })
    return data;
}

fuelStationServices.exportFuelVouchersToExcel = async (exportedData) => {
    const res = await axios.post(`/api/exports/excel/fuelVouchers/`, exportedData, {
        responseType: 'blob',
    });
    return res.data;
}

fuelStationServices.stockSalesSummaryReport = async (params) => {
    const { data } = await axios.get(`/api/fuelStations/stations/stockSalesSummaryReport`, {
        params,
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
    })
    return data;
}

fuelStationServices.getUserStations = async ({ queryKey }) => {
    const { userId } = queryKey[1];
    const { data } = await axios.get(`/api/fuelStations/stations/${userId}/userStations`);
    return data;
}

fuelStationServices.retrieveLastReadings = async (params) => {
    const { data } = await axios.get(`/api/fuelStations/stations/${params.stationId}/retrieveLastReadings`, {
        params
    });
    return data;
}

fuelStationServices.getProductsSellingPrices = async ({ product_ids, sales_outlet_id, as_at }) => {
    const { data } = await axios.get('/api/fuelStations/salesShifts/productsSellingPrices', {
        params: {
            product_ids: product_ids,
            sales_outlet_id,
            as_at,
        },
    });
    return data;
};

fuelStationServices.showShiftDetails = async (id) => {
    const { data } = await axios.get(`/api/fuelStations/salesShifts/${id}/showShiftDetails`);
    return data;
}

fuelStationServices.exportSalesShiftsToExcel = async (exportedData) => {
    const res = await axios.post(`/api/exports/excel/salesShifts/`, exportedData, {
        responseType: 'blob',
    });
    return res.data;
}

fuelStationServices.showDippingDetails = async (id) => {
    const { data } = await axios.get(`/api/fuelStations/dippings/${id}/showDippingDetails`);
    return data;
}

fuelStationServices.addSalesShifts = async (salesShift) => {
    const { data } = await axios.post('/api/fuelStations/salesShifts/add', salesShift)
    return data;
}

fuelStationServices.updateSalesShifts = async (salesShift) => {
    const { data } = await axios.put(`/api/fuelStations/salesShifts/${salesShift.id}/update`, salesShift)
    return data;
}

fuelStationServices.deleteSalesShift = async (id) => {
    const { data } = await axios.delete(`/api/fuelStations/salesShifts/${id}/delete`);
    return data;
};

fuelStationServices.deleteDipping = async (id) => {
    const { data } = await axios.delete(`/api/fuelStations/dippings/${id}/deleteDipping`);
    return data;
};

export default fuelStationServices;