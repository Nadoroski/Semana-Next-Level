import React from 'react';
import axios from 'axios';

const api = axios.create({
    baseURL:'http://192.168.100.11:3333'
});

export default api;