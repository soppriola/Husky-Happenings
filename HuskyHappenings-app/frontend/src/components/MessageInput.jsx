import {useState} from "react";
import "./MessageInput.css";
import { sendMessage } from "../websocket.js";

export default function MessageInput({currentUser, selectedConversation, setMessages}) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    // Send message via WebSocket
    sendMessage(selectedConversation.conversation_id, text, currentUser.user_id);
    
    setText("");
  };

  return (
    <form className="message-input-form" onSubmit={handleSubmit}>
      <input
        className="message-input"
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="message-send-button" type="submit">
        Send
      </button>
    </form>
  );
}