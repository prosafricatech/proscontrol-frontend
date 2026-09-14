import axios from "@/lib/services/config";

const fundTransferServices = {};

fundTransferServices.add = async(transfer) => {
    const {data} = await axios.post(`/api/accountsAndFinance/transactions/transfers/add`,transfer);
    return data;
}

fundTransferServices.show = async (id) => {
    const {data} = await axios.get(`/api/accountsAndFinance/transactions/transfers/${id}/show`);
    return data;
}

fundTransferServices.update = async(transfer) => {
    const {data} = await axios.put(`/api/accountsAndFinance/transactions/transfers/${transfer.id}/update`,transfer)
    return data;
}

fundTransferServices.delete = async (transfer) => {
    const {data} = await axios.delete(`/api/accountsAndFinance/transactions/transfers/${transfer.id}/delete`);
    return data;
};

fundTransferServices.cancel = async (transfer, {reason, cancellation_date}) => {
    const {data} = await axios.post(`/api/accountsAndFinance/transactions/transfers/${transfer.id}/cancel`, {reason, cancellation_date});
    return data;
};

fundTransferServices.reverseCancellation = async (transfer) => {
    const {data} = await axios.post(`/api/accountsAndFinance/transactions/transfers/${transfer.id}/reverse-cancellation`);
    return data;
};

export default fundTransferServices;