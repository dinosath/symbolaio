import React, { useEffect, useState } from 'react';
import { fetchModels } from '../services/apiService';
import { Model } from '../types';

const ModelList: React.FC = () => {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadModels = async () => {
            try {
                const fetchedModels = await fetchModels();
                setModels(fetchedModels);
            } catch (err) {
                setError('Failed to fetch models');
            } finally {
                setLoading(false);
            }
        };

        loadModels();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h2>Available Models</h2>
            <ul>
                {models.map((model) => (
                    <li key={model.id}>{model.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default ModelList;