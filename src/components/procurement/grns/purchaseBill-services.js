import axios from '@/lib/services/config';

const purchaseBillServices = {};

purchaseBillServices.create = async ({ grnId, ...payload }) => {
  const { data } = await axios.post(`/api/grns/${grnId}/bill`, payload);
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

export default purchaseBillServices;
