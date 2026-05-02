// ChatRoom.jsx
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState("");
  const [message, setMessage] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("https://chat-model-wv7m.onrender.com");
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();

    socketRef.current = io("http://localhost:5000", {
      transports: ["websocket", "polling"]
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to socket server:", socketRef.current.id);
    });

    socketRef.current.on("message", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("message");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const sendMessage = () => {
    if (!user || !message) return;
    const payload = { user, message };
    // send via socket
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("sendMessage", payload);
    } else {
      console.warn("Socket not connected. Falling back to POST (optional).");
    }
    setMessage("");
  };

  return (
    <div>
      <h2>Chat Room</h2>
      <ul>
        {messages.map((msg) => (
          <li key={msg._id}>
            <strong>{msg.user}:</strong> {msg.message}
          </li>
        ))}
      </ul>
      <div>
        <input
          type="text"
          placeholder="Your name"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatRoom;