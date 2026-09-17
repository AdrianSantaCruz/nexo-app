import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Send, MessageCircle } from "lucide-react";
import { useAuth } from "../context/authContext";
import * as chatApi from "../lib/chatApi";

const COLOR = {
  negro: "#14110F",
  surface: "#1C1815",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function Avatar({ url, initials, size = 44 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden"
      style={{ width: size, height: size, backgroundColor: COLOR.lima, color: COLOR.negro }}
    >
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : initials}
    </div>
  );
}

function ConversationRow({ conversation, active, onClick }) {
  const last = conversation.lastMessage;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left"
      style={{ backgroundColor: active ? "rgba(200,255,77,0.08)" : "transparent" }}
    >
      <Avatar url={conversation.otherAvatarUrl} initials={conversation.otherInitials} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate" style={{ color: COLOR.hueso }}>
            {conversation.otherName}
          </p>
          {last && (
            <span className="text-[10px] shrink-0" style={{ color: COLOR.muted }}>
              {formatTime(last.createdAt)}
            </span>
          )}
        </div>
        <p className="text-xs truncate mt-0.5" style={{ color: COLOR.muted }}>
          {last ? last.text : "Sin mensajes todavía"}
        </p>
      </div>
    </button>
  );
}

function ChatThread({ conversation, currentUserId, onBack, onMessageSent }) {
  const [messages, setMessages] = useState(conversation.messages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsubscribe = chatApi.subscribeToMessages(conversation.id, (message) => {
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });
    return unsubscribe;
  }, [conversation.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    setSending(true);
    try {
      const message = await chatApi.sendMessage(conversation.id, currentUserId, text);
      setMessages((prev) => [...prev, message]);
      onMessageSent?.(conversation.id, message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ height: "100vh" }}>
      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
        <button onClick={onBack} className="md:hidden">
          <ChevronLeft size={20} style={{ color: COLOR.hueso }} />
        </button>
        <Avatar url={conversation.otherAvatarUrl} initials={conversation.otherInitials} size={36} />
        {conversation.isBuyer ? (
          <Link to={`/tienda/${conversation.storeSlug}`} className="text-sm font-medium hover:underline" style={{ color: COLOR.hueso }}>
            {conversation.otherName}
          </Link>
        ) : (
          <span className="text-sm font-medium" style={{ color: COLOR.hueso }}>
            {conversation.otherName}
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5">
        {messages.map((m) => {
          const isMine = m.senderId === currentUserId;
          return (
            <div key={m.id} className="flex flex-col" style={{ alignItems: isMine ? "flex-end" : "flex-start" }}>
              <div
                className="max-w-[75%] md:max-w-sm rounded-2xl px-3.5 py-2 text-sm"
                style={
                  isMine
                    ? { backgroundColor: COLOR.lima, color: COLOR.negro, borderBottomRightRadius: 4 }
                    : { backgroundColor: COLOR.surface, color: COLOR.hueso, border: `1px solid ${COLOR.border}`, borderBottomLeftRadius: 4 }
                }
              >
                {m.text}
              </div>
              <span className="text-[10px] mt-1 px-1" style={{ color: COLOR.muted }}>
                {formatTime(m.createdAt)}
              </span>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-xs text-center mt-6" style={{ color: COLOR.muted }}>
            Todavía no hay mensajes. ¡Escribe el primero!
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderTop: `1px solid ${COLOR.border}` }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
          style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-60"
          style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

export default function ChatsPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState(null);

  useEffect(() => {
    if (!user) return;
    chatApi.fetchConversations(user.id).then((data) => {
      setConversations(data);
      setLoadedUserId(user.id);
    });
  }, [user]);

  const loading = Boolean(user) && loadedUserId !== user?.id;

  const handleMessageSent = (id, message) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, messages: [...c.messages, message], lastMessage: message } : c))
    );
  };

  if (authLoading || loading) return null;

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <p className="text-sm mb-4" style={{ color: COLOR.muted }}>
            Inicia sesión para ver tus chats.
          </p>
          <Link to="/ingresar" className="rounded-full px-5 py-2.5 text-sm font-medium" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
            Ingresar
          </Link>
        </div>
      </div>
    );
  }

  const conversation = conversations.find((c) => c.id === conversationId);

  return (
    <div className="flex" style={{ height: "100vh" }}>
      <div
        className={`w-full md:w-80 shrink-0 overflow-y-auto ${conversation ? "hidden md:block" : "block"}`}
        style={{ borderRight: `1px solid ${COLOR.border}` }}
      >
        <div className="px-4 py-4 shrink-0" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
          <h1 className="text-lg font-semibold" style={{ color: COLOR.hueso }}>
            Chats
          </h1>
        </div>
        {conversations.length === 0 ? (
          <p className="text-xs px-4 py-6 text-center" style={{ color: COLOR.muted }}>
            Todavía no tienes conversaciones. Escribe a una tienda desde "Preguntar" en su página.
          </p>
        ) : (
          conversations.map((c) => (
            <ConversationRow key={c.id} conversation={c} active={c.id === conversationId} onClick={() => navigate(`/chats/${c.id}`)} />
          ))
        )}
      </div>

      {conversation ? (
        <ChatThread
          key={conversation.id}
          conversation={conversation}
          currentUserId={user.id}
          onBack={() => navigate("/chats")}
          onMessageSent={handleMessageSent}
        />
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-2">
          <MessageCircle size={28} style={{ color: COLOR.muted }} />
          <p className="text-sm" style={{ color: COLOR.muted }}>
            Selecciona una conversación para empezar.
          </p>
        </div>
      )}
    </div>
  );
}
