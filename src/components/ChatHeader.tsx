import IconButton from "@mui/material/IconButton";
import PersonIcon from "@mui/icons-material/Person";
import RemoveIcon from "@mui/icons-material/Remove";

interface ChatHeaderProps {
  handleClose?: () => void;
}
const ChatHeader = ({ handleClose }: ChatHeaderProps) => {
  return (
    <div className="chat-header">
      <div className="header-left">
        <IconButton>
          <PersonIcon className="custom-header-icon" fontSize="medium" />
        </IconButton>
        <div className="header-info">Autostock</div>
      </div>
      <div className="header-actions">
        <IconButton onClick={handleClose} sx={{ color: "white" }}>
          <RemoveIcon />
        </IconButton>
      </div>
    </div>
  );
};

export default ChatHeader;
