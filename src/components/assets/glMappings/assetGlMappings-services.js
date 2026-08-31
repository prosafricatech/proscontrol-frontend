import axios from "@/lib/services/config";

const assetGlMappingsServices = {};

assetGlMappingsServices.getList = async ({ keyword, page, limit }) => {
  const response = await axios.get('/api/assets/gl-mappings', {
    params: { keyword, page, limit },
  });
  return response.data;
};

assetGlMappingsServices.add = async (mapping) => {
  const { data } = await axios.post('/api/assets/gl-mappings', mapping);
  return data;
};

assetGlMappingsServices.update = async (mapping) => {
  const { data } = await axios.put(`/api/assets/gl-mappings/${mapping.id}`, mapping);
  return data;
};

assetGlMappingsServices.delete = async (mapping) => {
  const { data } = await axios.delete(`/api/assets/gl-mappings/${mapping.id}`);
  return data;
};

export default assetGlMappingsServices;
