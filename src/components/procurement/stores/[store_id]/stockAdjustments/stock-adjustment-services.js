import axios from "@/lib/services/config";

const stockAdjustmentServices = {};

stockAdjustmentServices.add = async (postData) => {
  const formData = new FormData();
  Object.keys(postData).forEach((key) => {
    if (key === 'stock_excel') {
      formData.append(key, postData[key][0]);
    } else if (key === 'items' && Array.isArray(postData[key])) {
      postData[key].forEach((item, index) => {
        Object.keys(item).forEach((itemKey) => {
          formData.append(`items[${index}][${itemKey}]`, item[itemKey]);
        });
      });
    } else {
      // append everything else normally
      formData.append(
        key,
        postData[key] !== 'null' && postData[key] !== undefined
          ? postData[key]
          : ''
      );
    }
  });

  const { data } = await axios.post(`/api/stockAdjustment/add`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
};

stockAdjustmentServices.update = async(stockAdjustment) => {
  const {data} = await axios.put(`/api/stockAdjustment/${stockAdjustment.id}/update`,stockAdjustment)
  return data;
}

stockAdjustmentServices.delete = async (stockAdjustment) => {
  const {data} = await axios.delete(`/api/stockAdjustment/${stockAdjustment.id}/delete`);
  return data;
};

stockAdjustmentServices.getList = async ({ store_id, keyword, page, limit, from, to }) => {
  const response = await axios.get(`/api/stores/${store_id}/getStockAdjustmentList`, {
    params: { store_id, keyword, page, limit, from, to },
  });
  return response.data;
};

stockAdjustmentServices.show = async(id) => {
    const {data} = await axios.get(`/api/stockAdjustment/${id}/show`)
    return data;
}

stockAdjustmentServices.addApproval = async (approval) => {
    const { data } = await axios.post('/api/stockAdjustment/approvals', approval)
    return data;
}

export default stockAdjustmentServices;