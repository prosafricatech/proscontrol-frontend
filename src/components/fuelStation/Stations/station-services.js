import axios from "@/lib/services/config";

const stationServices = {};

stationServices.getList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get("/api/fuelStations/stations", {
       params: { page, limit, ...queryParams }
    });
    return data;
};

stationServices.getUserStations = async (params) => {
    if (!params.userId) {
        throw new Error('User ID is required to fetch user stations');
    }
    
    const { data } = await axios.get(`/api/fuelStations/stations/${params.userId}/userStations`);
    return data;
};

stationServices.add = async(station) => {
    const {data} = await axios.post(`/api/fuelStations/stations/add`,station)
    return data;
};

stationServices.update = async(station) => {
    const { data } = await axios.put(`/api/fuelStations/stations/${station.id}/update`, station);
    return data;
};

stationServices.delete = async ({ id }) => {
    const { data } = await axios.delete(`/api/fuelStations/stations/${id}/delete`);
    return data;
};

export default stationServices;