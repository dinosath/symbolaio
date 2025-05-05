import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { isUserLoggedIn } from "@/lib/utils";
import { useEffect, useState} from "react";
import AdminPage from "@/pages/AdminPage.tsx";

const Index = () => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!isUserLoggedIn()) {
            navigate("/login");
        }
    }, [navigate]);

    return <AdminPage />;
};

export default Index;
