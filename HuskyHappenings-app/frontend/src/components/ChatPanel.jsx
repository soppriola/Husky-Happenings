import {useEffect, useState} from "react"
import "./ChatPanel.css";
import MessageBubble from "./MessageBubble.jsx";
import MessageInput from "./MessageInput.jsx";
import { joinConversation, leaveConversation, onMessage } from "../websocket.js";

export default function ChatPanel({currentUser, selectedConversation, messages, setMessages}) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function loadMessages() {
            if (!selectedConversation) return;

            setLoading(true);

            try {
                const response = await fetch(`https://localhost:5000/api/conversations/${selectedConversation.conversation_id}/messages`,
                {
                    credentials: "include",
                });

                const data = await response.json();

                if (response.ok) {
                    setMessages(data);
                }
            } finally {
                setLoading(false);
            }
        }
        loadMessages();
    }, [selectedConversation]);

    useEffect(() => {
        if (!selectedConversation) return;

        // Join the conversation room
        joinConversation(selectedConversation.conversation_id);

        // Listen for new messages
        const unsubscribe = onMessage((messageData) => {
            setMessages((prev) => {
                // Prevent duplicates by checking if message already exists
                if (prev.some(msg => msg.message_id === messageData.message_id)) {
                    return prev;
                }
                return [...prev, messageData];
            });
        });

        // Cleanup: leave room and unsubscribe when changing conversations
        return () => {
            leaveConversation(selectedConversation.conversation_id);
            unsubscribe();
        };
    }, [selectedConversation]);

    if (!selectedConversation) {
        return <section className="chat-empty">Select a conversation</section>;
    }
    return (
        <section className="chat-panel">
            <div className="chat-header">
                <h2 className="chat-header-name">
                    {selectedConversation.display_name}
                </h2>
            </div>

            <div className="chat-messages">
                {loading ? (
                <p>Loading chat...</p>
                ) : (
                messages.map((message) => (
                    <MessageBubble
                     key={message.message_id}
                     isOwn={message.sender_id === currentUser.user_id}
                     text={message.body}
                     time={message.sent_at}
                    />
                ))
                )}
            </div>

            <MessageInput
                currentUser={currentUser}
                selectedConversation={selectedConversation}
                setMessages={setMessages}
            />
        </section>
    );
}