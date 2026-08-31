import axios from "@/lib/services/config";

const depreciationRunsServices = {};

depreciationRunsServices.getList = async ({ year, page, limit }) => {
  const response = await axios.get('/api/assets/depreciation-runs', {
    params: { year, page, limit },
  });
  return response.data;
};

depreciationRunsServices.getOne = async (id) => {
  const { data } = await axios.get(`/api/assets/depreciation-runs/${id}`);
  return data;
};

depreciationRunsServices.preview = async (period) => {
  const { data } = await axios.get('/api/assets/depreciation-runs/preview', {
    params: { period },
  });
  return data;
};

depreciationRunsServices.post = async (payload) => {
  const { data } = await axios.post('/api/assets/depreciation-runs', payload);
  return data;
};

depreciationRunsServices.rollback = async (run) => {
  const { data } = await axios.delete(`/api/assets/depreciation-runs/${run.id}`);
  return data;
};

export default depreciationRunsServices;
