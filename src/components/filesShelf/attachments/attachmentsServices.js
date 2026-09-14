import axios from "@/lib/services/config";

const attachmentsServices = {};

attachmentsServices.addAttachment = async(postData) => {
  const formData = new FormData();
  formData.append('name', postData.name);
  formData.append('file', postData.file);
  formData.append('attachmentable_id', postData.attachmentable_id);
  formData.append('attachmentable_type', postData.attachmentable_type);

  // The shared axios instance defaults Content-Type to 'application/json'
  // (see lib/services/config.js). Left as-is, axios' own FormData handling
  // treats that as "the caller wants JSON" and actually JSON.stringifies
  // the FormData instead of sending it as a real multipart body — which is
  // why 'file' was showing up as '{}' (a File has no enumerable properties,
  // so it serializes to nothing) and Laravel never saw an uploaded file at
  // all. Explicitly unsetting it (not just omitting it) overrides that
  // instance default and lets the browser generate the correct
  // 'multipart/form-data; boundary=...' header itself.
  const { data } = await axios.post('/api/attachment/add', formData, {
    headers: { 'Content-Type': undefined },
  });
  return data;
}

attachmentsServices.attachments = async(params) => {
  const {data} = await axios.get(`/api/attachment/getAttachments`,{
    params
  });
  return data;
}

attachmentsServices.deleteAttachment = async (id) => {
  const {data} = await axios.delete(`/api/attachment/${id}/delete`);
  return data;
};

attachmentsServices.updateAttachment = async(attachment) => {
  const {data} = await axios.put(`/api/attachment/${attachment.id}/update`,attachment)
  return data;
}

export default attachmentsServices;
