import axios from '@/lib/services/config';

const stakeholderGroupServices = {};

stakeholderGroupServices.getList = async (params = {}) => {
  const { page = 1, limit = 10, ...queryParams } = params;
  const { data } = await axios.get('/api/masters/stakeholderGroups', {
    params: { page, limit, ...queryParams },
  });
  return data;
};

stakeholderGroupServices.getSelectOptions = async () => {
  const { data } = await axios.get('/api/masters/stakeholderGroups');
  return data;
};

stakeholderGroupServices.show = async (id) => {
  const { data } = await axios.get(`/api/masters/stakeholderGroups/${id}`);
  return data;
};

stakeholderGroupServices.add = async (group) => {
  const { data } = await axios.post('/api/masters/stakeholderGroups/add', group);
  return data;
};

stakeholderGroupServices.update = async (group) => {
  const { data } = await axios.put(`/api/masters/stakeholderGroups/${group.id}/update`, group);
  return data;
};

stakeholderGroupServices.delete = async (id) => {
  const { data } = await axios.delete(`/api/masters/stakeholderGroups/${id}/delete`);
  return data;
};

stakeholderGroupServices.getMembers = async ({ id, page = 1, limit = 15, keyword = '' }) => {
  const { data } = await axios.get(`/api/masters/stakeholderGroups/${id}/stakeholders`, {
    params: { page, limit, keyword },
  });
  return data;
};

stakeholderGroupServices.addStakeholders = async ({ id, stakeholder_ids }) => {
  const { data } = await axios.post(`/api/masters/stakeholderGroups/${id}/stakeholders`, { stakeholder_ids });
  return data;
};

stakeholderGroupServices.removeStakeholder = async ({ id, stakeholderId }) => {
  const { data } = await axios.delete(`/api/masters/stakeholderGroups/${id}/stakeholders/${stakeholderId}/remove`);
  return data;
};

export default stakeholderGroupServices;
