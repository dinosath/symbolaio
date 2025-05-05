import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SocialLoginButtonProps {
    provider: "google" | "github" | "gitlab";
    onClick: () => void;
    className?: string;
    children?: ReactNode;
    disabled?: boolean;
}

const providerIcons = {
    google: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="mr-2">
            <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z" />
            <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z" />
            <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9.13 0-.79-.07-1.54-.19-2.27H12v4.51h6.568c-.29 1.75-1.156 3.22-2.534 4.21l3.8 2.68Z" />
            <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z" />
        </svg>
    ),
    github: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="mr-2">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
    ),
    gitlab: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="mr-2">
            <path fill="#E24329" d="M12 20.297L4.334 12.9 1.788 4.954c-.124-.357-.132-.752.002-1.114.129-.353.408-.614.754-.697.349-.085.71.002.993.256.283.256.437.62.45.996l1.96 12.802L12 20.297" />
            <path fill="#FC6D26" d="M12 20.297l7.666-7.396 1.96-12.802c.012-.376.166-.74.45-.996.283-.254.644-.341.993-.256.346.083.625.344.754.697.134.362.126.757.002 1.114L21.279 12.9 12 20.297" />
            <path fill="#FC6D26" d="M4.334 12.9l7.666 7.396 7.279-7.396z" />
            <path fill="#FCA326" d="M23.83 3.84c-.134-.362-.408-.614-.754-.697-.35-.085-.71.002-.993.256-.284.256-.438.62-.45.996L19.673 17.2l3.393-9.295c.124-.357.132-.752-.002-1.114l.767-2.952z" />
            <path fill="#FCA326" d="M.17 3.84c.134-.362.408-.614.754-.697.35-.085.71.002.993.256.284.256.438.62.45.996l1.96 12.803L.934 7.904c-.124-.357-.132-.752.002-1.114L.17 3.84z" />
        </svg>
    ),
};

const providerColors = {
    google: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50",
    github: "bg-[#24292e] text-white hover:bg-[#1a1e22]",
    gitlab: "bg-[#fc6d26] text-white hover:bg-[#e24329]",
};

const providerNames = {
    google: "Google",
    github: "GitHub",
    gitlab: "GitLab",
};

export function SocialLoginButton({
                                      provider,
                                      onClick,
                                      className,
                                      children,
                                      disabled,
                                  }: SocialLoginButtonProps) {
    return (
        <Button
            variant="outline"
            className={cn(
                "flex items-center justify-center w-full",
                providerColors[provider],
                className
            )}
            onClick={onClick}
            disabled={disabled}
        >
            {providerIcons[provider]}
            {children || `Continue with ${providerNames[provider]}`}
        </Button>
    );
}