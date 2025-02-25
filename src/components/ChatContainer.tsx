"use client";

import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import useWebSocket from "../hooks/useWebSocket"; // Ensure casing matches your file

const initialMessages = [
  { id: 1, message: "hi", sender: "user", name: "John", type: "text" },
  {
    id: 2,
    message: "How may I help you?",
    sender: "auto",
    name: "Autostock",
    type: "text",
  },
  {
    id: 3,
    message: "Could you help me in finding a car",
    sender: "user",
    name: "John",
    type: "text",
  },
  {
    id: 4,
    message: "Yes sure, please ask",
    sender: "auto",
    name: "Autostock",
    type: "text",
  },
] as const;

type Message = {
  id: number;
  message: string | { file: File; fileURL: string };
  sender: "user" | "auto";
  name: string;
  type?: "text" | "file" | "audio" | "call" | "image";
};

const ChatContainer = () => {
  const [messages, setMessages] = useState<Message[]>([...initialMessages]);
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Import values from your WebSocket hook.
  const { messages: wsMessages, sendMessage: sendWsMessage, isConnected } = useWebSocket();

  // Auto-scroll when new messages are added.
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Append any new WebSocket messages to the local messages state.
  useEffect(() => {
    if (wsMessages.length > 0) {
      setMessages(prevMessages => {
        const newId = prevMessages.length + 1;
        return [
          ...prevMessages,
          {
            id: newId,
            message: wsMessages[wsMessages.length - 1],
            sender: "auto",
            name: "Autostock",
            type: "text",
          },
        ];
      });
    }
  }, [wsMessages]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSendMessage = async (
    message: string | { file: File; fileURL: string },
    type: "text" | "file" | "audio" | "call" | "image"
  ) => {
    // Add user's message to local state.
    const newUserMessage: Message = {
      id: messages.length + 1,
      message,
      sender: "user",
      name: "John",
      type,
    };
    setMessages(prev => [...prev, newUserMessage]);

    // For text messages, send via WebSocket.
    if (type === "text" && typeof message === "string") {
      sendWsMessage(message);
    }
    // You may add handling for other types if needed.
  };

  const handleReceiveMessage = (message: string, type: "text") => {
    // Legacy handler (if needed).
    const newMessage: Message = {
      id: messages.length + 1,
      message,
      sender: "auto",
      name: "Autostock",
      type,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Drag and drop handlers for file/image uploads.
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
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason === "backdropClick") return;
          handleClose();
        }}
        fullWidth
        maxWidth="xs"
        sx={{ position: "fixed", margin: 0 }}
        PaperProps={{
          sx: {
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "350px",
            borderRadius: "0px",
            margin: "0px",
          },
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <DialogTitle>
          <ChatHeader handleClose={handleClose} />
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            padding: 0,
            position: "relative",
            overflowY: "auto",
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {isDragging && <div className="drop-overlay">Drop your image here</div>}
          <div className="messages-container" style={{ maxHeight: "400px" }}>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg.message}
                sender={msg.sender}
                name={msg.name}
                type={msg.type}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </DialogContent>
        <DialogActions className="custome-dialog-actions">
          <ChatInput
            onSendMessage={handleSendMessage}
            onReceiveMessage={handleReceiveMessage}
          />
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatContainer;
