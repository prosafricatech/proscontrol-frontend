import axios from "@/lib/services/config";

const assetBookingsServices = {};

assetBookingsServices.getList = async ({ keyword, asset_detail_id, booking_type, status, page, limit }) => {
  const response = await axios.get('/api/asset-bookings', {
    params: { keyword, asset_detail_id, booking_type, status, page, limit },
  });
  return response.data;
};

assetBookingsServices.getCalendar = async ({ from, to, asset_detail_id }) => {
  const { data } = await axios.get('/api/asset-bookings/calendar', {
    params: { from, to, asset_detail_id },
  });
  return data;
};

assetBookingsServices.getAssetOptions = async (keyword, cost_center_id) => {
  const { data } = await axios.get('/api/asset-bookings/asset-options', {
    params: { keyword, cost_center_id },
  });
  return data;
};

assetBookingsServices.checkAvailability = async ({ asset_detail_id, start_at, end_at, exclude_booking_id = null }) => {
  const { data } = await axios.get('/api/asset-bookings/check-availability', {
    params: { asset_detail_id, start_at, end_at, exclude_booking_id },
  });
  return data;
};

assetBookingsServices.getLinkableSales = async (stakeholder_id, cost_center_id, billing_product_id) => {
  const { data } = await axios.get('/api/asset-bookings/linkable-sales', {
    params: { stakeholder_id, cost_center_id, billing_product_id },
  });
  return data;
};

assetBookingsServices.getOne = async (id) => {
  const { data } = await axios.get(`/api/asset-bookings/${id}`);
  return data;
};

assetBookingsServices.add = async (booking) => {
  const { data } = await axios.post('/api/asset-bookings', booking);
  return data;
};

assetBookingsServices.update = async (booking) => {
  const { data } = await axios.put(`/api/asset-bookings/${booking.id}`, booking);
  return data;
};

assetBookingsServices.confirm = async (booking) => {
  const { data } = await axios.post(`/api/asset-bookings/${booking.id}/confirm`);
  return data;
};

assetBookingsServices.cancel = async ({ id, ...payload }) => {
  const { data } = await axios.post(`/api/asset-bookings/${id}/cancel`, payload);
  return data;
};

assetBookingsServices.linkSale = async ({ id, ...payload }) => {
  const { data } = await axios.post(`/api/asset-bookings/${id}/link-sale`, payload);
  return data;
};

assetBookingsServices.unlinkSale = async (booking) => {
  const { data } = await axios.post(`/api/asset-bookings/${booking.id}/unlink-sale`);
  return data;
};

assetBookingsServices.delete = async (booking) => {
  const { data } = await axios.delete(`/api/asset-bookings/${booking.id}`);
  return data;
};

export default assetBookingsServices;
