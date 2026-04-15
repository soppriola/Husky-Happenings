import "./ConversationItem.css";


export default function ConversationItem({conversation, isSelected, onClick}) {
    return (
        <div
            className={`conversation-item ${isSelected ? "active" : ""}`}
            onClick={onClick}
        >
            <div className="conversation-item-top">
                <h3 className="conversation-name">
                    {conversation.display_name}
                </h3>

                <span className="conversation-time">
                    {conversation.latest_time}
                </span>
            </div>

            <p className="conversation-preview">
                {conversation.latest_message}
            </p>

        </div>
    );
}