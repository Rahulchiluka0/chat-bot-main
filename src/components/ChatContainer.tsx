"use client";

import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import ChatOptionButton from "./ChatOptionButton";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import useWebSocket from "../hooks/useWebSocket";
import ChatButtons from "./ChatButtons";

// Optional: if you want a distinct type for messages
export type MessageType =
  | "text"
  | "file"
  | "audio"
  | "call"
  | "image"
  | "link"
  | "options";

export type Message = {
  id: number;
  message: string | { file: File; fileURL: string };
  sender: "user" | "auto";
  name: string;
  type?: MessageType;
  options?: string[];
};

const ChatContainer = () => {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Form states
  const [showForm, setShowForm] = useState(true);
  const [formError, setFormError] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // For form fade-out transition
  const [isFormVisible, setIsFormVisible] = useState(true);

  // Track if Autostock is typing
  const [isTyping, setIsTyping] = useState(false);

  // (Optional) If you want to show a separate "options" screen:
  const [showOptions, setShowOptions] = useState(false);

  // For auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket hook
  const { messages: wsMessages, sendMessage: sendWsMessage, isConnected } = useWebSocket();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for new WebSocket messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      // Turn off typing indicator when a response is received
      setIsTyping(false);

      const lastRawMessage = wsMessages[wsMessages.length - 1];
      try {
        const parsed = JSON.parse(lastRawMessage);
        let finalText = "";
        let finalType: MessageType = "text";

        // Check if there's a URL
        if (parsed.message?.url) {
          try {
            const urlData = JSON.parse(parsed.message.url);
            if (urlData.detail) {
              finalText = urlData.detail;
              finalType = "link";
            } else {
              finalText = "No URL detail found.";
            }
          } catch (error) {
            console.error("Error parsing message.url JSON:", error);
            finalText = "Error reading URL data.";
          }
        } else if (typeof parsed.message === "string") {
          finalText = parsed.message;
        } else if (typeof parsed.message === "object" && parsed.message !== null) {
          if (parsed.message.suggestMessage) {
            finalText = parsed.message.suggestMessage;
          } else if (parsed.message.greeting) {
            finalText = parsed.message.greeting;
          } else {
            finalText = "Unknown message format.";
          }
        } else {
          finalText = "Unknown message format.";
        }

        // Append new message
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            message: finalText,
            sender: "auto",
            name: "Autostock",
            type: finalType,
          },
        ]);
      } catch (error) {
        console.error("Error parsing raw message:", error);
      }
    }
  }, [wsMessages]);

  // Open/Close chat
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Send a message
  const handleSendMessage = (
    message: string | { file: File; fileURL: string },
    type: "text" | "file" | "audio" | "call" | "image"
  ) => {
    const newUserMessage: Message = {
      id: messages.length + 1,
      message,
      sender: "user",
      name: userName || "User",
      type,
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // If text, also send via WebSocket
    if (type === "text" && typeof message === "string") {
      sendWsMessage(message);
      setIsTyping(true);
    }
  };

  // Called when an option button is clicked
  function handleOptionClick(option: string) {
    // Send that option as a user message
    handleSendMessage(option, "text");

    // Optionally remove the "options" bubble
    setMessages((prev) => prev.filter((m) => m.type !== "options"));
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("guestUserData");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserName(parsedUser.userName);
      setUserEmail(parsedUser.email);
      setShowForm(false);

      // Set welcome and options messages when localStorage exists
      const welcomeMsg: Message = {
        id: 1,
        message: `Welcome ${parsedUser.userName}! What can we help you with?`,
        sender: "auto",
        name: "Autostock",
        type: "text",
      };

      const optionsMsg: Message = {
        id: 2,
        message: "",
        sender: "auto",
        name: "Autostock",
        type: "options",
        options: [
          "Show me some latest cars",
          "I want to buy a family car",
          "I have a question for my car",
        ],
      };

      setMessages([welcomeMsg, optionsMsg]);
    }
  }, []);

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(""); // reset any previous errors

    const payload = {
      userName,
      email: userEmail,
      uuid: "0a6ad088-f2ee-4611-80d5-5c1170d7fb7e",
    };

    try {
      const response = await fetch("http://192.168.29.156:8080/meta/api/home/guest-user/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // optionally parse the error response
        throw new Error("Failed to save guest user");
      }

      // Success: parse JSON and hide form
      const data = await response.json();
      console.log("Guest user saved:", data);
      localStorage.setItem(
        "guestUserData",
        JSON.stringify({ userName, userEmail })
      );


      // Fade out the form
      setIsFormVisible(false);

      setTimeout(() => {
        // Now actually remove the form
        setShowForm(false);

        // Show welcome + options
        const welcomeMsg: Message = {
          id: 1,
          message: `Welcome ${userName}! What can we help you with?`,
          sender: "auto",
          name: "Autostock",
          type: "text",
        };

        const optionsMsg: Message = {
          id: 2,
          message: "",
          sender: "auto",
          name: "Autostock",
          type: "options",
          options: [
            "Show me some latest cars",
            "I want to buy a family car",
            "I have a question for my car",
          ],
        };

        setMessages([welcomeMsg, optionsMsg]);
      }, 300);
    } catch (error) {
      console.error("Error saving guest user:", error);
      // Don’t hide the form. Instead, show an error message.
      setFormError("Failed to save guest user. Please try again later.");
    }
  };


  // For drag-and-drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) {
      const file = event.dataTransfer.files[0];
      const fileURL = URL.createObjectURL(file);
      if (file.type.startsWith("image/")) {
        handleSendMessage(fileURL, "image");
      } else {
        handleSendMessage({ file, fileURL }, "file");
      }
    }
  };
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  return (
    <>
      {/* Floating Chat Icon */}
      {!open && (
        <IconButton
          onClick={handleOpen}
          sx={{
            position: "fixed",
            bottom: 40,
            right: 60,
            background: "#1976d2",
            color: "white",
            "&:hover": { background: "#1976d2", color: "white" },
          }}
          size="large"
        >
          <ChatIcon />
        </IconButton>
      )}

      {/* Main Chat Dialog */}
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason === "backdropClick") return;
          handleClose();
        }}
        fullWidth={false}
        maxWidth={false}
        sx={{ position: "fixed", margin: 0 }}
        PaperProps={{
          sx: {
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "400px",
            height: "600px",
            borderRadius: "10px 10px 0 0",
            margin: "0px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {/* Chat Header */}
        <DialogTitle sx={{ p: 0 }}>
          <ChatHeader handleClose={handleClose} />
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent
          dividers
          sx={{
            flex: 1,
            position: "relative",
            overflowY: "auto",
            p: 0,
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {isDragging && <div className="drop-overlay">Drop your image here</div>}

          {/* If form is still shown, show the form; otherwise show chat messages */}
          {showForm ? (
            <div
              className={`p-4 transition-opacity duration-300 ${isFormVisible ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            >
              <h3 className="text-xl font-semibold mb-2">How can we help?</h3>
              <p className="mb-4 text-gray-600">We'll get back to you soon.</p>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1 text-sm text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-sm text-gray-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                {formError && (
                  <p className="text-red-600 mb-2">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-500 text-white rounded mt-2 hover:bg-blue-600 transition-colors"
                >
                  Submit
                </button>
              </form>
            </div>
          ) : (
            <div className="messages-container" style={{ maxHeight: "100%", padding: "1rem" }}>
              {messages.map((msg, index) => {
                const previousMessage = messages[index - 1];
                const isSameSender = index > 0 && previousMessage?.sender === msg.sender;
                const bubbleStyle = {
                  marginTop: isSameSender ? "0px" : "12px",
                };
                const showName = index === 0 || previousMessage?.sender !== msg.sender;

                // If it's an "options" message, show ChatButtons
                if (msg.type === "options" && msg.options) {
                  return (
                    <div key={msg.id} style={bubbleStyle}>
                      <ChatButtons
                        options={msg.options}
                        name={msg.name}
                        showName={showName}
                        sender={msg.sender}
                        onOptionClick={handleOptionClick}
                      />
                    </div>
                  );
                }

                // Otherwise, it's a normal message
                return (
                  <div key={msg.id} style={bubbleStyle}>
                    <ChatMessage
                      key={msg.id}
                      message={msg.message}
                      sender={msg.sender}
                      name={msg.name}
                      type={msg.type}
                      showName={showName}
                    />
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="message-bubble auto" style={{ marginTop: "4px" }}>
                  <div className="message-content">
                    <div className="message-text auto typing">
                      Autostock is typing
                      <span className="dots">
                        <span className="dot" />
                        <span className="dot" />
                        <span className="dot" />
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </DialogContent>

        {/* Show ChatInput only if form is not shown */}
        {!showForm && (
          <DialogActions className="custome-dialog-actions" sx={{ p: 0 }}>
            <ChatInput onSendMessage={handleSendMessage} />
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};

export default ChatContainer;
