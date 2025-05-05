import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export function UserProfile() {
    const { user, logout, isLoading } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const getProviderColor = (provider?: string) => {
        switch (provider) {
            case "google":
                return "bg-red-500";
            case "github":
                return "bg-gray-800";
            case "gitlab":
                return "bg-orange-500";
            default:
                return "bg-blue-500";
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map(part => part[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-xl">Your Profile</CardTitle>
                <CardDescription>Logged in with {user.provider}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className={getProviderColor(user.provider)}>
                        {getInitials(user.name)}
                    </AvatarFallback>
                </Avatar>

                <div className="text-center">
                    <h3 className="text-lg font-medium">{user.name}</h3>
                    {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                        ID: {user.id}
                    </p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Button
                    variant="outline"
                    onClick={handleLogout}
                    disabled={isLoading}
                >
                    Sign Out
                </Button>
            </CardFooter>
        </Card>
    );
}
