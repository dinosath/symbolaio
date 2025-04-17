import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchModelDetails } from '../services/apiService';
import { JSONSchema7 } from 'json-schema';

const ModelDetails: React.FC = () => {
    const { modelId } = useParams<{ modelId: string }>();
    const [model, setModel] = useState<JSONSchema7 | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getModelDetails = async () => {
            try {
                const data = await fetchModelDetails(modelId);
                setModel(data);
            } catch (err) {
                setError('Failed to fetch model details');
            } finally {
                setLoading(false);
            }
        };

        getModelDetails();
    }, [modelId]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!model) {
        return <div>No model found</div>;
    }

    return (
        <div>
            <h1>{model.name}</h1>
            <pre>{JSON.stringify(model.schema, null, 2)}</pre>
        </div>
    );
};

export default ModelDetails;