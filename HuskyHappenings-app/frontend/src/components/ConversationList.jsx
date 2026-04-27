import {useState, useEffect} from "react";
import "./ConversationList.css";
import ConversationItem from "./ConversationItem";


export default function ConversationList({conversations, selectedConversation, setSelectedConversation, onConversationCreated}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchError, setSearchError] = useState("");

    // Search for users when searchTerm changes
    useEffect(() => {
        if (isSearching && searchTerm.trim().length >= 2) {
            searchForUsers();
        } else if (isSearching && searchTerm.trim().length === 0) {
            setSearchResults([]);
        }
    }, [searchTerm, isSearching]);

    const searchForUsers = async () => {
        setLoadingSearch(true);
        setSearchError("");
        try {
            const response = await fetch(`https://localhost:5000/api/users/search?q=${encodeURIComponent(searchTerm)}`, {
                credentials: "include"
            });
            if (!response.ok) throw new Error("Search failed");
            const results = await response.json();
            setSearchResults(results);
        } catch (error) {
            setSearchError("Failed to search users");
            console.error(error);
        } finally {
            setLoadingSearch(false);
        }
    };

    const toggleUserSelection = (user) => {
        setSelectedUsers(prev => {
            const isSelected = prev.some(u => u.user_id === user.user_id);
            if (isSelected) {
                return prev.filter(u => u.user_id !== user.user_id);
            } else {
                return [...prev, user];
            }
        });
    };

    const createConversation = async () => {
        if (selectedUsers.length === 0) {
            setSearchError("Please select at least one user");
            return;
        }

        try {
            const response = await fetch("https://localhost:5000/api/conversations", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    otherUsers: selectedUsers.map(u => u.user_id),
                    conversationName: selectedUsers.length === 1 
                        ? selectedUsers[0].name 
                        : `Group (${selectedUsers.length+1} members)`
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create conversation");
            }
            
            // Reset search and selected users
            setSearchTerm("");
            setSelectedUsers([]);
            setIsSearching(false);
            setSearchResults([]);
            setSearchError("");
            
            // Call the callback to refresh conversations
            if (onConversationCreated) {
                onConversationCreated();
            }
        } catch (error) {
            setSearchError(error.message || "Failed to create conversation");
            console.error(error);
        }
    };

    const cancelSearch = () => {
        setIsSearching(false);
        setSearchTerm("");
        setSelectedUsers([]);
        setSearchResults([]);
        setSearchError("");
    };

    return (
    <aside className="conversation-list">
        <div className="conversation-list-header">
            <h2 className="conversation-list-title">Messages</h2>

            {!isSearching ? (
                <>
                    <input
                        className="conversation-search"
                        type="text"
                        placeholder="Search conversations"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsSearching(true)}
                    />
                    <button className="new-conversation-button" onClick={() => setIsSearching(true)}>
                        New Conversation
                    </button>
                </>
            ) : (
                <div className="search-mode">
                    <input
                        className="conversation-search"
                        type="text"
                        placeholder="Search users by name or username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                    {searchError && <p className="search-error">{searchError}</p>}
                    {loadingSearch && <p className="search-loading">Loading...</p>}
                    
                    {selectedUsers.length > 0 && (
                        <div className="selected-users">
                            {selectedUsers.map(user => (
                                <span key={user.user_id} className="selected-user-tag">
                                    {user.name}
                                    <button 
                                        onClick={() => toggleUserSelection(user)}
                                        className="remove-user-btn"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="search-results">
                        {searchResults.map(user => (
                            <div
                                key={user.user_id}
                                className={`search-result-item ${selectedUsers.some(u => u.user_id === user.user_id) ? 'selected' : ''}`}
                                onClick={() => toggleUserSelection(user)}
                            >
                                {user.picture_url && (
                                    <img src={user.picture_url} alt={user.name} className="result-avatar" />
                                )}
                                <div className="result-info">
                                    <div className="result-name">{user.name}</div>
                                    <div className="result-username">@{user.username}</div>
                                </div>
                                {selectedUsers.some(u => u.user_id === user.user_id) && (
                                    <span className="checkmark">✓</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="search-actions">
                        <button className="cancel-btn" onClick={cancelSearch}>Cancel</button>
                        <button 
                            className="create-btn" 
                            onClick={createConversation}
                            disabled={selectedUsers.length === 0}
                        >
                            Create Conversation
                        </button>
                    </div>
                </div>
            )}
        </div>

        <div className="conversation-items">
        {!isSearching && conversations.map((conversation) => (
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