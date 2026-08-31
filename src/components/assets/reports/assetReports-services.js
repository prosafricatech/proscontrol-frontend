import axios from "@/lib/services/config";

const assetReportsServices = {};

assetReportsServices.getSchedule = async ({ from, to, detailed }) => {
  const { data } = await axios.get('/api/assets/reports/schedule', {
    params: { from, to, detailed: detailed ? 1 : undefined },
  });
  return data;
};

assetReportsServices.downloadScheduleExcel = async ({ from, to }) => {
  const { data } = await axios.post('/api/assets/reports/schedule', { from, to }, {
    responseType: 'blob',
  });
  return data;
};

export default assetReportsServices;
