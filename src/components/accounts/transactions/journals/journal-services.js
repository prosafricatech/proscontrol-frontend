import axios from "@/lib/services/config";

const journalServices = {};

journalServices.add = async(journal) => {
    const {data} = await axios.post(`/api/accountsAndFinance/transactions/journal/add`,journal);
    return data;
}

journalServices.show = async (id) => {
    const {data} = await axios.get(`/api/accountsAndFinance/transactions/journal/${id}/show`);
    return data;
}


journalServices.update = async(journal) => {
    const {data} = await axios.put(`/api/accountsAndFinance/transactions/journal/${journal.id}/update`,journal)
    return data;
}


journalServices.delete = async (journal) => {
    const {data} = await axios.delete(`/api/accountsAndFinance/transactions/journal/${journal.id}/delete`);
    return data;
};

journalServices.cancel = async (journal, {reason, cancellation_date}) => {
    const {data} = await axios.post(`/api/accountsAndFinance/transactions/journal/${journal.id}/cancel`, {reason, cancellation_date});
    return data;
};

journalServices.reverseCancellation = async (journal) => {
    const {data} = await axios.post(`/api/accountsAndFinance/transactions/journal/${journal.id}/reverse-cancellation`);
    return data;
};

export default journalServices;