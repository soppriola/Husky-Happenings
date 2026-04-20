import "./MessageBubble.css";

export default function MessageBubble({key, isOwn, text, time}) {
    return (
        <div className={`message-bubble ${isOwn ? "message-sent" : "message-received"}`}>
            {text}
        </div>
    );
}