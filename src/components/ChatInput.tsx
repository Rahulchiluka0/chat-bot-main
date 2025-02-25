import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import MicIcon from "@mui/icons-material/Mic";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { useState, useRef, useCallback } from "react";
interface ChatInputProps {
  onSendMessage: (
    message: string | { file: File; fileURL: string },
    type: "text" | "file" | "image" | "audio" | "call"
  ) => void;
  onReceiveMessage: (message: string, type: "text") => void;
}
const ChatInput = ({ onSendMessage }: ChatInputProps) => {
      const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendMessage(message.trim(), "text");
    setMessage("");
  };
  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      let hasImage = false;
      
      if (items) {
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            hasImage = true;
            const file = item.getAsFile();
            if (file) {
              const fileURL = URL.createObjectURL(file);
              onSendMessage(fileURL, "image");
            }
          }
        }
      }
  
      // Prevent default behavior if image was found
      if (hasImage) {
        event.preventDefault();
      }
    },
    [onSendMessage]
  );
  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const file = event.target.files[0];
      const fileURL = URL.createObjectURL(file);
      if (file.type.startsWith("image/")) {
        onSendMessage(fileURL, "image");
      } else {
        onSendMessage({ file, fileURL }, "file");
      }
    }
  };
  const handleMicClick = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorder.current = new MediaRecorder(stream);
        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };
        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, {
            type: "audio/webm",
          });
          const audioURL = URL.createObjectURL(audioBlob);
          onSendMessage(audioURL, "audio");
          audioChunks.current = [];
        };
        mediaRecorder.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Microphone access denied", error);
      }
    } else {
      mediaRecorder.current?.stop();
      setIsRecording(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="chat-input-container">
      <div
        className="input-wrapper"
        onPaste={(e) => handlePaste(e as unknown as ClipboardEvent)}
      >
        <InputBase
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          sx={{
            px: 2,
            py: 1,
            fontSize: "12px",
            borderRadius: 20,
            backgroundColor: "#f1f1f1",
          }}
        />
        <input
          type="file"
          id="fileInput"
          style={{ display: "none" }}
          onChange={handleFileAttach}
          accept="image/*, .pdf, .jpeg"
        />
        <IconButton
          component="label"
          sx={{ marginLeft: 1 }}
          htmlFor="fileInput"
        >
          <AttachFileIcon />
        </IconButton>
        <IconButton
          onClick={handleMicClick}
          color={isRecording ? "error" : "default"}
        >
          <MicIcon />
        </IconButton>
      </div>
    </form>
  );
};
export default ChatInput;