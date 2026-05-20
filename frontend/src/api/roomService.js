import api from './axiosConfig';

export const fetchRoomsForDate = async (selectedDate) => {
    try {
        // Format the date to YYYY-MM-DD for Django
        const dateString = selectedDate.toISOString().split('T')[0];
        
        // Make the GET request to our Django endpoint
        const response = await api.get(`/rooms/?date=${dateString}`);
        
        // Return the JSON data
        return response.data;
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return []; // Return empty array on failure so the UI doesn't crash
    }
};


export const updateRoomStatusInDB = async (roomId, newStatus) => {
    try {
        const response = await api.post(`/rooms/${roomId}/update-status/`, { status: newStatus });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || "Failed to update status");
    }
};

export const submitBooking = async (bookingData) => {
    try {
        const response = await api.post('/book-room/', bookingData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || "Booking failed");
    }
};


export const bulkCreateRooms = async (count) => {
    const response = await api.post('/rooms/bulk-create/', { count });
    return response.data;
};

export const updateCheckoutDate = async (roomId, checkOutDate) => {
    const response = await api.post(`/rooms/${roomId}/update-checkout/`, { checkOutDate });
    return response.data;
};

export const clearRoomDB = async (roomId) => {
    const response = await api.post(`/rooms/${roomId}/clear/`);
    return response.data;
};