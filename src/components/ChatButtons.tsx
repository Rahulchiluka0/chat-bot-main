"use client";
import React from "react";
import ChatOptionButton from "./ChatOptionButton";

interface ChatButtonsProps {
    /** Array of label strings for each button */
    options: string[];
    /** Name of the sender (e.g. "Autostock") */
    name: string;
    /** Whether to show the sender's name */
    showName: boolean;
    /** Whether this bubble is from the user or from auto/bot */
    sender: "user" | "auto";
    /** Called when the user clicks an option */
    onOptionClick: (option: string) => void;
}

/**
 * Renders a separate bubble containing only option buttons.
 */
const ChatButtons: React.FC<ChatButtonsProps> = ({
    options,
    name,
    showName,
    sender,
    onOptionClick,
}) => {
    const isUser = sender === "user";

    return (
        <div className={`message-bubble user`}>
            <div className="message-content">
                {showName && name && (
                    <span className={isUser ? "name-message-align" : "message-sender"}>
                        {name}
                    </span>
                )}
                <div className={` ${sender} flex justify-end flex-wrap gap-2`}>
                    {options.map((opt) => (
                        <ChatOptionButton
                            key={opt}
                            label={opt}
                            onClick={() => onOptionClick(opt)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChatButtons;
