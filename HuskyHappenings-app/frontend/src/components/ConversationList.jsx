import {useState} from "react";
import "./ConversationList.css";
import ConversationItem from "./ConversationItem";


export default function ConversationList({conversations, selectedConversation, setSelectedConversation,}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchUsers, setSearchUsers] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchError, setSearchError] = useState("");


    return (
    <aside className="conversation-list">
        <div className="conversation-list-header">
            <h2 className="conversation-list-title">Messages</h2>

            <input
                className="conversation-search"
                type="text"
                placeholder="Search conversations"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
        </div>

        <button className="new-conversation-button" onClick={() => setSearchUsers(true)}>
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