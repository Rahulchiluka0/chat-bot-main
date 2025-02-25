import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { Box, IconButton, Modal } from "@mui/material";
import { useState } from "react";

interface ChatMessageProps {
  message: string | { file: File; fileURL: string };
  sender: "user" | "auto";
  name?: string;
  type?: "text" | "file" | "audio" | "call" | "image"; // Added image type
}
// Define the file type to icon mapping
const fileIconMap: Record<string, string> = {
  csv: "/icons/csv.png",
  docx: "/icons/docx.png",
  doc: "/icons/doc.png",
  txt: "/icons/txt.png",
  mp3: "/icons/mp3.png",
  pdf: "/icons/pdf.png",
  psd: "/icons/psd.png",
  ppt: "/icons/ppt.png",
  xlsx: "/icons/xlsx.png",
  xml: "/icons/xml.png",
  zip: "/icons/zip.png",
};

// Get the icon for a file based on its extension
const getFileIcon = (fileName: string): string => {
  console.log("fileName=", fileName);

  const extension = fileName.split(".").pop()?.toLowerCase();
  return (
    fileIconMap[extension as keyof typeof fileIconMap] || "/icons/file-icon.png"
  ); // Default file icon if extension doesn't match
};

const ChatMessage = ({
  message,
  sender,
  name,
  type = "text",
}: ChatMessageProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isUser = sender === "user";

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = imageUrl.split("/").pop() || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };
  return (
    <div className={`message-bubble ${isUser ? "user" : ""}`}>
      <div className="message-content">
        {name && (
          <span className={isUser ? "name-message-align" : "message-sender"}>
            {name}
          </span>
        )}

        {type === "text" &&  typeof message === "string" && (
          <div className={`message-text ${sender}`}>{message}</div>
        )}

        {type === "file" && typeof message !== "string" && (
          <a
            href={message?.fileURL}
            download={message.file.name}
            className="file-link"
          >
            <Box
              component="img"
              src={getFileIcon(message?.file.name)}
              alt="file icon"
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1,
                marginRight: 1,
              }}
            />
            <span>{message.file.name}</span>
          </a>
        )}

        {type === "image" && typeof message === "string" && (
          <div className="image-container">
            <img src={message} alt="attachment" className="chat-image" />
            <IconButton
              className="download-icon"
              onClick={() => handleDownloadImage(message)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                padding: "4px",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                },
              }}
            >
              <FileDownloadIcon fontSize="small" />
            </IconButton>
          </div>
        )}
        {type === "audio" && typeof message === "string" && (
          <audio controls className="audio-design">
            <source src={message} type="audio/webm" />
            Your browser does not support the audio element.
          </audio>
        )}

      </div>
      {/* Image Fullscreen Modal */}
      <Modal open={!!selectedImage} onClose={() => setSelectedImage(null)}>
        <div className="image-modal">
          <img src={selectedImage!} alt="Full Size" className="large-image" />
        </div>
      </Modal>
    </div>
  );
};

export default ChatMessage;
