import axios from '@/lib/services/config';

const smsAccountsServices = {};

smsAccountsServices.getList = async (params = {}) => {
  const { page = 1, limit = 10, ...queryParams } = params;
  const { data } = await axios.get('/api/prosControl/smsAccounts', {
    params: { page, limit, ...queryParams },
  });
  return data;
};

smsAccountsServices.add = async (account) => {
  const { data } = await axios.post('/api/prosControl/smsAccounts/add', account);
  return data;
};

smsAccountsServices.update = async (account) => {
  const { data } = await axios.put(`/api/prosControl/smsAccounts/${account.id}/update`, account);
  return data;
};

smsAccountsServices.topUp = async ({ id, amount, notes }) => {
  const { data } = await axios.post(`/api/prosControl/smsAccounts/${id}/top-up`, { amount, notes });
  return data;
};

smsAccountsServices.getTransactions = async (params = {}) => {
  const { id, page = 1, limit = 10, ...queryParams } = params;
  const { data } = await axios.get(`/api/prosControl/smsAccounts/${id}/transactions`, {
    params: { page, limit, ...queryParams },
  });
  return data;
};

export default smsAccountsServices;
