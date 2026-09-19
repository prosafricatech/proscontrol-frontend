import axios from '@/lib/services/config';

const customerInvoiceServices = {};

// Customer Invoices for a given customer — used by InvoicePicker (Receipts'
// relatable linking), mirroring purchaseBillServices.listByStakeholder.
customerInvoiceServices.listByStakeholder = async (stakeholderId, params = {}) => {
  const { data } = await axios.get(
    `/api/masters/stakeholders/${stakeholderId}/customer-invoices`,
    { params }
  );
  return data;
};

customerInvoiceServices.details = async (id) => {
  const { data } = await axios.get(`/api/pos/counter/${id}/invoiceDetails`);
  return data;
};

// Manual override for the Due Invoices dashboard card — removes an invoice
// from it when it's been settled through a Receipt that was never linked
// via InvoicePicker. See CustomerInvoice::getUnpaidAmountAttribute().
customerInvoiceServices.markPaid = async (id) => {
  const { data } = await axios.post(`/api/pos/counter/${id}/markInvoicePaid`);
  return data;
};

customerInvoiceServices.unmarkPaid = async (id) => {
  const { data } = await axios.post(`/api/pos/counter/${id}/unmarkInvoicePaid`);
  return data;
};

export default customerInvoiceServices;
