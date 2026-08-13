import axios from '@/lib/services/config';

const smsServices = {};

smsServices.getBalance = async () => {
  const { data } = await axios.get('/api/sms/balance');
  return data;
};

smsServices.getTransactions = async (params = {}) => {
  const { page = 1, limit = 10, ...queryParams } = params;
  const { data } = await axios.get('/api/sms/transactions', {
    params: { page, limit, ...queryParams },
  });
  return data;
};

smsServices.getMessages = async (params = {}) => {
  const { page = 1, limit = 10, ...queryParams } = params;
  const { data } = await axios.get('/api/sms/messages', {
    params: { page, limit, ...queryParams },
  });
  return data;
};

smsServices.send = async (payload) => {
  const { data } = await axios.post('/api/sms/send', payload);
  return data;
};

smsServices.bulkSend = async (payload) => {
  const { data } = await axios.post('/api/sms/bulk-send', payload);
  return data;
};

export default smsServices;
