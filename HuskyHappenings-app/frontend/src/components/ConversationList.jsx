import "./ConversationList.css";
import ConversationItem from "./ConversationItem";


export default function ConversationList({conversations, selectedConversation, setSelectedConversation,}) {
    return (
    <aside className="conversation-list">
        <div className="conversation-list-header">
            <h2 className="conversation-list-title">Messages</h2>

            <input
                className="conversation-search"
                type="text"
                placeholder="Search conversations"
                />
        </div>

        <button className="new-conversation-button">
            New Conversation
        </button>

        <div className="conversation-items">
        {conversations.map((conversation) => (
            <ConversationItem
            key={conversation.conversation_id}
            conversation={conversation}
            isSelected={selectedConversation?.conversation_id === conversation.conversation_id}
            onClick={() => setSelectedConversation(conversation)}
            /> 
        ))}
        </div>
    </aside>
    );
}