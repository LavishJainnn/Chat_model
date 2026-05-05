import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, User, Hash, Settings, LogOut, 
  ChevronRight, Smile, Users, Clock, Globe, Zap, AlertCircle,
  Wifi, WifiOff, Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmojiPicker from 'emoji-picker-react';

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000' 
  : 'https://chat-model-wv7m.onrender.com';

const MessageBubble = memo(({ msg, isOwnMessage }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
  >
    <div className={`flex flex-col max-w-[75%] ${isOwnMessage ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-2 mb-1.5 px-2">
        <span className="text-[10px] font-black text-brown-700 uppercase tracking-widest">
          {msg.user}
        </span>
        <span className="text-[9px] text-brown-400 font-bold flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div 
        className={`px-5 py-3.5 rounded-[20px] text-sm leading-relaxed shadow-lg group relative border-2 ${
          isOwnMessage 
            ? "bg-terracotta text-white rounded-tr-none border-terracotta shadow-terracotta/20" 
            : "bg-white text-brown-900 rounded-tl-none border-beige-200"
        }`}
      >
        {msg.message}
      </div>
    </div>
  </motion.div>
));

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(localStorage.getItem('chat-user') || "Guest");
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("general");
  const [channels, setChannels] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const roomRef = useRef(room);
  const navigate = useNavigate();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API_URL}/rooms`);
      const data = await res.json();
      setChannels(data.map(r => r.name));
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  };

  const fetchMessages = useCallback(async (roomName, beforeTimestamp = null) => {
    try {
      const beforeQuery = beforeTimestamp ? `&before=${beforeTimestamp}` : "";
      const res = await fetch(`${API_URL}/messages/${roomName}?limit=50${beforeQuery}`);
      const data = await res.json();
      
      if (!beforeTimestamp) {
        setMessages(data);
        setHasMore(data.length === 50);
      } else {
        setMessages(prev => [...data, ...prev]);
        setHasMore(data.length === 50);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setIsLoading(false);
    }
  }, []);

  const handleAddChannel = async () => {
    const name = prompt("Enter new channel name:");
    if (!name) return;
    
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const newRoom = await res.json();
        setRoom(newRoom.name); // Still change the room locally for the creator
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create channel");
      }
    } catch (err) {
      console.error("Error creating room:", err);
    }
  };

  useEffect(() => {
    fetchRooms();
    socketRef.current = io(API_URL);

    socketRef.current.on("connect", () => setIsConnected(true));
    socketRef.current.on("disconnect", () => setIsConnected(false));
    
    socketRef.current.on("message", (newMessage) => {
      setMessages((prev) => {
        if (newMessage.room === roomRef.current) {
          return [...prev, newMessage];
        }
        return prev;
      });
    });

    socketRef.current.on("userList", (users) => setOnlineUsers(users));
    socketRef.current.on("roomCreated", (newRoom) => {
      setChannels(prev => {
        if (prev.includes(newRoom.name)) return prev;
        return [...prev, newRoom.name].sort();
      });
    });

    socketRef.current.on("userTyping", ({ user: typingUser }) => {
      setTypingUsers((prev) => new Set(prev).add(typingUser));
    });

    socketRef.current.on("userStoppedTyping", ({ user: typingUser }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(typingUser);
        return next;
      });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    roomRef.current = room;
    const join = () => {
      if (socketRef.current) socketRef.current.emit("joinRoom", { user, room });
    };
    join();
    if (socketRef.current) socketRef.current.on("connect", join);
    setIsLoading(true);
    fetchMessages(room);
    return () => {
      if (socketRef.current) socketRef.current.off("connect", join);
    };
  }, [room, user, fetchMessages]);

  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      scrollToBottom();
    }
  }, [messages.length, isLoading, scrollToBottom]);

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!user || !message.trim() || !isConnected) return;
    const payload = { user, message, room };
    socketRef.current.emit("sendMessage", payload);
    socketRef.current.emit("stopTyping", { user, room });
    setMessage("");
    setShowEmojiPicker(false);
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (!isConnected) return;
    socketRef.current.emit("typing", { user, room });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("stopTyping", { user, room });
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-beige-100 text-brown-900 overflow-hidden font-sans selection:bg-terracotta/20">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-80 bg-white border-r border-beige-200 flex flex-col z-20 shadow-xl relative"
          >
            <div className="p-7 border-b border-beige-200 flex items-center justify-between bg-beige-50">
              <div className="flex items-center gap-3">
                <div className="bg-terracotta p-2.5 rounded-xl shadow-md">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-xl tracking-tight text-brown-900 uppercase">Nexus</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-beige-100 rounded-lg text-brown-400 transition-colors">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-10 scrollbar-hide">
              <div>
                <div className="flex items-center justify-between px-2 mb-6">
                  <h3 className="text-[10px] font-black text-brown-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Channels
                  </h3>
                  <button onClick={handleAddChannel} className="p-1.5 hover:bg-terracotta/10 text-brown-400 hover:text-terracotta rounded-lg transition-all border border-transparent hover:border-terracotta/20">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {channels.map(name => (
                    <ChannelItem key={name} name={name} active={room === name} onClick={() => setRoom(name)} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-brown-400 uppercase tracking-[0.2em] px-2 mb-6 flex items-center gap-2">
                  <Users className="w-3 h-3" /> Online — {onlineUsers.length}
                </h3>
                <div className="space-y-3 px-2">
                  {onlineUsers.map((u, i) => (
                    <div key={i} className="flex items-center gap-3 group">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-beige-100 flex items-center justify-center border-2 border-beige-200 group-hover:border-terracotta/30 transition-all">
                          <User className="w-4 h-4 text-brown-700" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                      </div>
                      <span className="text-sm font-bold text-brown-700 group-hover:text-brown-900 transition-colors truncate">{u}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-brown-400 uppercase tracking-[0.2em] px-2 mb-4">Profile</h3>
                <div className="px-2">
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-300 group-focus-within:text-terracotta transition-colors" />
                    <input
                      type="text"
                      placeholder="Display name"
                      value={user}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUser(val);
                        localStorage.setItem('chat-user', val);
                      }}
                      className="w-full bg-beige-50 border-2 border-beige-100 rounded-[15px] py-3.5 pl-11 pr-4 text-sm font-bold focus:outline-none focus:border-terracotta/30 transition-all placeholder:text-brown-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-beige-200 bg-beige-50">
              <button 
                onClick={() => navigate('/')}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-brown-400 hover:text-terracotta hover:bg-terracotta/5 rounded-[15px] transition-all font-bold group border border-transparent hover:border-terracotta/10"
              >
                <LogOut className="w-4 h-4" />
                Exit Chatroom
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_50%_0%,rgba(226,114,91,0.05),transparent)]">
        {!isSidebarOpen && (
          <button onClick={() => setIsSidebarOpen(true)} className="absolute top-7 left-7 z-10 p-2.5 bg-white border-2 border-beige-200 rounded-xl text-brown-400 hover:text-brown-900 transition-all shadow-lg active:scale-95">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <header className="h-24 border-b border-beige-200 px-10 flex items-center justify-between bg-white/70 backdrop-blur-2xl z-10 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-terracotta/10 rounded-2xl border border-terracotta/10">
              <Hash className="w-6 h-6 text-terracotta" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight capitalize text-brown-900">{room}</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-red-500 animate-pulse"}`} />
                <span className="text-[10px] text-brown-400 font-black uppercase tracking-[0.2em]">
                  {isConnected ? "Secure Line Active" : "Reconnecting..."}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {isConnected ? <Wifi className="w-4 h-4 text-emerald-500/30" /> : <WifiOff className="w-4 h-4 text-red-500/30" />}
             <Settings className="w-5 h-5 text-brown-300 cursor-pointer hover:text-brown-900 transition-all hover:rotate-90 duration-500" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-brown-300">
              <div className="w-10 h-10 border-4 border-terracotta/20 border-t-terracotta rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-[0.3em]">Synchronizing</p>
            </div>
          ) : (
            <>
              {hasMore && (
                <button onClick={() => fetchMessages(room, messages[0]?.timestamp)} className="w-full py-4 text-[10px] font-black text-brown-300 hover:text-terracotta transition-colors uppercase tracking-[0.4em]">
                  Load older history
                </button>
              )}
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <MessageBubble key={msg._id} msg={msg} isOwnMessage={msg.user === user} />
                ))}
              </AnimatePresence>
            </>
          )}
          
          {typingUsers.size > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-[10px] text-brown-400 font-bold bg-white/50 py-2.5 px-5 rounded-full border border-beige-200 w-fit">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-terracotta rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-terracotta rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-terracotta rounded-full animate-bounce" />
              </div>
              {Array.from(typingUsers).filter(u => u !== user).join(", ")} is typing...
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <footer className="p-10 pt-0">
          {!isConnected && (
            <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-500/5 border-2 border-red-500/10 rounded-2xl flex items-center gap-4 text-red-500 text-xs font-bold shadow-lg">
              <AlertCircle className="w-5 h-5" />
              System Offline. Re-establishing link...
            </div>
          )}
          <div className="max-w-4xl mx-auto relative">
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="absolute bottom-full right-0 mb-6 z-50 shadow-2xl rounded-3xl overflow-hidden border-2 border-beige-200">
                  <EmojiPicker onEmojiClick={(e) => setMessage(p => p + e.emoji)} theme="light" width={350} />
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={sendMessage} className="relative group flex items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={`Write to #${room}...`}
                  value={message}
                  onChange={handleTyping}
                  disabled={!isConnected}
                  className="w-full bg-white border-2 border-beige-200 rounded-[22px] py-5 pl-8 pr-16 text-sm font-bold focus:outline-none focus:border-terracotta/30 transition-all shadow-xl shadow-brown-900/5 disabled:opacity-50 placeholder:text-brown-200"
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${showEmojiPicker ? "bg-terracotta/10 text-terracotta" : "text-brown-300 hover:text-terracotta hover:bg-terracotta/5"}`}
                >
                  <Smile className="w-6 h-6" />
                </button>
              </div>
              <button 
                type="submit"
                disabled={!message.trim() || !isConnected}
                className="p-5 bg-brown-900 text-white rounded-[22px] hover:bg-brown-800 transition-all shadow-xl shadow-brown-900/20 active:scale-95 disabled:grayscale"
              >
                <Send className="w-6 h-6" />
              </button>
            </form>
          </div>
        </footer>
      </div>
    </div>
  );
};

const ChannelItem = memo(({ name, active = false, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-[18px] cursor-pointer transition-all group border-2 ${
      active 
        ? "bg-terracotta/5 border-terracotta/10 text-terracotta font-black shadow-inner" 
        : "border-transparent text-brown-400 hover:bg-beige-50 hover:text-brown-700"
    }`}
  >
    <Hash className={`w-4 h-4 ${active ? "text-terracotta" : "text-brown-200 group-hover:text-brown-400"}`} />
    <span className="text-sm tracking-tight capitalize">{name}</span>
    {active && <div className="ml-auto w-2 h-2 bg-terracotta rounded-full shadow-[0_0_10px_rgba(226,114,91,0.5)]" />}
  </button>
));

export default ChatRoom;