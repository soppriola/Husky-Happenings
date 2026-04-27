import { useEffect, useState } from "react";
import "./Messages.css";
import ConversationList from "../components/ConversationList.jsx";
import ChatPanel from "../components/ChatPanel.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { connectWebSocket } from "../websocket.js";

export default function Messages() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    connectWebSocket();

    return () => {
      // Optional: disconnect when component unmounts
      // disconnectWebSocket();
    };
  }, []);

  const loadConversations = async () => {
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

      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  if (loading) {
    return (
      <main className="messages-page">
        <div className="messages-status-card">Loading messages...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="messages-page">
        <div className="messages-status-card messages-error">{error}</div>
      </main>
    );
  }

  return (
    <main className="messages-page">
      <section className="messages-shell">
        <header className="messages-header">
          <div>
            <p className="messages-eyebrow">Direct Messages</p>
            <h1>Messages</h1>
            <p>
              Keep conversations organized and stay connected with your campus
              community.
            </p>
          </div>
        </header>

        <div className="messages-layout">
          <aside className="messages-sidebar-panel">
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              setSelectedConversation={setSelectedConversation}
              onConversationCreated={loadConversations}
            />
          </aside>

          <section className="messages-chat-panel">
            <ChatPanel
              currentUser={currentUser}
              selectedConversation={selectedConversation}
              messages={messages}
              setMessages={setMessages}
            />
          </section>
        </div>
      </section>
    </main>
  );
}