import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define the user type based on your Axum backend's response
export interface User {
    id: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    provider?: "google" | "github" | "gitlab";
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (provider: "google" | "github" | "gitlab") => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch("/api/user", {
                    credentials: 'include'
                });
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                }
            } catch (error) {
                console.error("Error checking authentication:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (provider: "google" | "github" | "gitlab") => {
        try {
            setIsLoading(true);
            window.location.href = "/auth/${provider}";
        } catch (error) {
            console.error(`Error during ${provider} login:`, error);
            setIsLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/logout", {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                setUser(null);
            }
        } catch (error) {
            console.error("Error during logout:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
