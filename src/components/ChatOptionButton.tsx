"use client";

import React from "react";

interface ChatOptionButtonProps {
    label: string;
    onClick: () => void;
}

const ChatOptionButton: React.FC<ChatOptionButtonProps> = ({ label, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="
                inline-block
                py-2 px-4
                my-1
                border
                border-gray-400
                text-gray-800
                font-medium
                rounded-full
                bg-white
                hover:bg-blue-500
                hover:text-white
                hover:border-blue-500
                transition-colors
                duration-200
                cursor-pointer
            "
        >
            {label}
        </button>
    );
};

export default ChatOptionButton;
