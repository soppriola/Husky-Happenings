import {useEffect, useState} from "react";
import "./Messages.css";
import ConversationList from "../components/ConversationList.jsx";
import ChatPanel from "../components/ChatPanel.jsx";
import {useAuth} from "../context/AuthContext.jsx";
import { connectWebSocket, disconnectWebSocket } from "../websocket.js";

export default function Messages() {
  const {currentUser} = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Connect to WebSocket when component mounts
    connectWebSocket();

    return () => {
      // Optional: disconnect when component unmounts
      // disconnectWebSocket();
    };
  }, []);

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch("https://localhost:5000/api/conversations", {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load conversation");
          return;
        }

        setConversations(data);
        
        if (data.length > 0) {
          setSelectedConversation(data[0]);
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, []);
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="messages-page">
      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
      />
      <ChatPanel
        currentUser={currentUser}
        selectedConversation={selectedConversation}
        messages={messages}
        setMessages={setMessages}
      />
    </div>
  );
}