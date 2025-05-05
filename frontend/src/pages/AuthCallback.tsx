import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function AuthCallback() {
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // The Axum backend should handle the OAuth callback and set the session cookie
                // After that, it should redirect back here with a success or error status
                const params = new URLSearchParams(location.search);
                const status = params.get('status');

                if (status === 'error') {
                    const errorMessage = params.get('message') || 'Authentication failed';
                    setError(errorMessage);
                    toast.error(errorMessage);
                    setTimeout(() => navigate('/login'), 3000);
                } else if (isAuthenticated) {
                    toast.success('Successfully logged in!');
                    navigate('/');
                } else {
                    // If we're not authenticated after the callback, something went wrong
                    setError('Authentication failed. Please try again.');
                    toast.error('Authentication failed. Please try again.');
                    setTimeout(() => navigate('/login'), 3000);
                }
            } catch (err) {
                console.error("Error processing callback:", err);
                setError('An unexpected error occurred');
                toast.error('An unexpected error occurred');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handleCallback();
    }, [location, navigate, isAuthenticated]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center max-w-lg">
                {error ? (
                    <div className="space-y-4">
                        <h1 className="text-2xl font-bold text-red-500">Authentication Error</h1>
                        <p className="text-gray-600">{error}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h1 className="text-2xl font-bold">Completing Authentication</h1>
                        <p className="text-gray-600">Please wait while we complete the authentication process...</p>
                        <div className="flex justify-center mt-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
