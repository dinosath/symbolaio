import axios from 'axios';
import { apicurioConfig } from '../config/apicurio-config';

const apiClient = axios.create({
    baseURL: apicurioConfig.baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const fetchModels = async () => {
    try {
        const response = await apiClient.get('/models');
        return response.data;
    } catch (error) {
        console.error('Error fetching models:', error);
        throw error;
    }
};

export const fetchModelDetails = async (modelId) => {
    try {
        const response = await apiClient.get(`/models/${modelId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching model details for ${modelId}:`, error);
        throw error;
    }
};

export const createModel = async (modelData) => {
    try {
        const response = await apiClient.post('/models', modelData);
        return response.data;
    } catch (error) {
        console.error('Error creating model:', error);
        throw error;
    }
};

export const updateModel = async (modelId, modelData) => {
    try {
        const response = await apiClient.put(`/models/${modelId}`, modelData);
        return response.data;
    } catch (error) {
        console.error(`Error updating model ${modelId}:`, error);
        throw error;
    }
};

export const deleteModel = async (modelId) => {
    try {
        await apiClient.delete(`/models/${modelId}`);
    } catch (error) {
        console.error(`Error deleting model ${modelId}:`, error);
        throw error;
    }
};