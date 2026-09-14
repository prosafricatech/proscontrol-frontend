import axios from "@/lib/services/config";

const paymentServices = {};

paymentServices.add = async(payment) => {
    const {data} = await axios.post(`/api/accountsAndFinance/transactions/payments/add`,payment);
    return data;
}

paymentServices.show = async (id) => {
    const {data} = await axios.get(`/api/accountsAndFinance/transactions/payments/${id}/show`);
    return data;
}


paymentServices.update = async(payment) => {
    const {data} = await axios.put(`/api/accountsAndFinance/transactions/payments/${payment.id}/update`,payment)
    return data;
}


paymentServices.delete = async (payment) => {
    const {data} = await axios.delete(`/api/accountsAndFinance/transactions/payments/${payment.id}/delete`);
    return data;
};

paymentServices.cancel = async (payment, {reason, cancellation_date}) => {
    const {data} = await axios.post(`/api/accountsAndFinance/transactions/payments/${payment.id}/cancel`, {reason, cancellation_date});
    return data;
};

paymentServices.reverseCancellation = async (payment) => {
    const {data} = await axios.post(`/api/accountsAndFinance/transactions/payments/${payment.id}/reverse-cancellation`);
    return data;
};

export default paymentServices;