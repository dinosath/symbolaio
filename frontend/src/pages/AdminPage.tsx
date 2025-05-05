import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isUserLoggedIn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const AdminPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("dashboard");

    if (!isUserLoggedIn()) {
        navigate("/login");
        return null;
    }

    const menuItems = [
        { id: "dashboard", label: "Dashboard" },
        { id: "users", label: "Users" },
        { id: "settings", label: "Settings" },
    ];

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col">
                <Card className="h-full">
                    <CardHeader className="p-4 border-b border-gray-800">
                        <CardTitle className="text-xl font-bold">Admin Panel</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 space-y-2">
                        {menuItems.map((item) => (
                            <Button
                                key={item.id}
                                variant={activeTab === item.id ? "default" : "ghost"}
                                onClick={() => setActiveTab(item.id)}
                                className="w-full justify-start"
                            >
                                {item.label}
                            </Button>
                        ))}
                    </CardContent>
                    <CardContent className="p-4 border-t border-gray-800">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                localStorage.removeItem("auth_token");
                                navigate("/login");
                            }}
                            className="w-full"
                        >
                            Logout
                        </Button>
                    </CardContent>
                </Card>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-gray-100 p-6">
                {activeTab === "dashboard" && (
                    <div>
                        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
                        <p>Welcome to the admin dashboard!</p>
                    </div>
                )}
                {activeTab === "users" && (
                    <div>
                        <h1 className="text-3xl font-bold mb-4">Users</h1>
                        <p>Manage your users here.</p>
                    </div>
                )}
                {activeTab === "settings" && (
                    <div>
                        <h1 className="text-3xl font-bold mb-4">Settings</h1>
                        <p>Configure your application settings here.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPage;