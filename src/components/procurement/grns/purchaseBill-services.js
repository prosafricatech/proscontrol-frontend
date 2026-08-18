import axios from '@/lib/services/config';

const purchaseBillServices = {};

purchaseBillServices.create = async ({ grnId, ...payload }) => {
  const { data } = await axios.post(`/api/grns/${grnId}/bill`, payload);
  return data;
};

// For non-inventory purchase orders (services, etc.) that never go through
// a GRN — bills the order's Unbilled Goods balance directly.
purchaseBillServices.createForOrder = async ({ orderId, ...payload }) => {
  const { data } = await axios.post(`/api/purchaseOrders/${orderId}/bill`, payload);
  return data;
};

// All Purchase Bills (optionally filtered) — used by the Accounts &
// Finance > Purchase Bills list page.
purchaseBillServices.getList = async (params = {}) => {
  const { page = 1, limit = 10, ...queryParams } = params;
  const { data } = await axios.get('/api/accountsAndFinance/purchaseBills', {
    params: { page, limit, ...queryParams },
  });
  return data;
};

purchaseBillServices.details = async (id) => {
  const { data } = await axios.get(`/api/purchaseBills/${id}`);
  return data;
};

purchaseBillServices.delete = async (id) => {
  const { data } = await axios.delete(`/api/purchaseBills/${id}`);
  return data;
};

// Bills (purchase invoices) for a given supplier — used by the Bill
// search-picker (Payment Requisitions / Direct Payments relatable linking).
purchaseBillServices.listByStakeholder = async (stakeholderId, params = {}) => {
  const { data } = await axios.get(
    `/api/masters/stakeholders/${stakeholderId}/purchase-bills`,
    { params }
  );
  return data;
};

export default purchaseBillServices;
