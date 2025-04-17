import React from 'react';
import { Link } from 'react-router-dom';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuViewport,
  } from "@/components/ui/navigation-menu"
  
const Navbar: React.FC = () => {
    return (
            <NavigationMenu className="bg-blue-600 text-white shadow-md">
                <NavigationMenuList className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className="text-lg font-bold">
                            Model Builder
                        </NavigationMenuTrigger>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="p-4 bg-white text-black rounded shadow-md">
                                <li className="mb-2">
                                    <NavigationMenuLink asChild>
                                        <Link to="/" className="hover:text-blue-600">
                                            Home
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                                <li className="mb-2">
                                    <NavigationMenuLink asChild>
                                        <Link to="/models" className="hover:text-blue-600">
                                            Models
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                                <li>
                                    <NavigationMenuLink asChild>
                                        <Link to="/editor" className="hover:text-blue-600">
                                            Editor
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
    
    );
};

export default Navbar;