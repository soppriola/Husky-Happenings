import {useState} from "react";
import "./MessageInput.css";

export default function MessageInput({currentUser, selectedConversation, setMessages}) {
  const [text, setText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    try {
      const response = await fetch(
        `https://localhost:5000/api/conversations/${selectedConversation.conversation_id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ body: text }),
        }
      );

      if (response.ok) {
        const newMessage = {
          body: text,
          sender_id: currentUser.user_id,
          sent_at: new Date().toLocaleTimeString(),
          message_id: Date.now(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setText("");
      }
    } catch {
      console.log("Failed to send message");
    }
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