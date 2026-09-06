import axios from "@/lib/services/config";

const assetsServices = {};

assetsServices.getList = async ({ keyword, product_category_id, store_id, status, page, limit }) => {
  const response = await axios.get('/api/assets', {
    params: { keyword, product_category_id, store_id, status, page, limit },
  });
  return response.data;
};

assetsServices.getOne = async (id) => {
  const { data } = await axios.get(`/api/assets/${id}`);
  return data;
};

assetsServices.add = async (asset) => {
  const { data } = await axios.post('/api/assets', asset);
  return data;
};

assetsServices.update = async (asset) => {
  const { data } = await axios.put(`/api/assets/${asset.id}`, asset);
  return data;
};

assetsServices.activate = async (asset) => {
  const { data } = await axios.post(`/api/assets/${asset.id}/activate`, asset);
  return data;
};

assetsServices.delete = async (asset) => {
  const { data } = await axios.delete(`/api/assets/${asset.id}`);
  return data;
};

assetsServices.dispose = async ({ id, ...payload }) => {
  const { data } = await axios.post(`/api/assets/${id}/dispose`, payload);
  return data;
};

assetsServices.undoDisposal = async (disposal) => {
  const { data } = await axios.delete(`/api/assets/disposals/${disposal.id}`);
  return data;
};

assetsServices.downloadImportTemplate = async () => {
  const { data } = await axios.post('/api/assets/import-template', {}, {
    responseType: 'blob',
  });
  return data;
};

assetsServices.bulkImport = async (formData) => {
  const { data } = await axios.post('/api/assets/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

assetsServices.convertFromStock = async (payload) => {
  const { data } = await axios.post('/api/assets/convert-from-stock', payload);
  return data;
};

export default assetsServices;
