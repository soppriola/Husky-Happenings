import {useEffect, useState} from "react"
import "./ChatPanel.css";
import MessageBubble from "./MessageBubble.jsx";
import MessageInput from "./MessageInput.jsx";

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
    }, [selectedConversation, setMessages]);

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