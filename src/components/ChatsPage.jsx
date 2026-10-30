import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Send, MessageCircle, ShoppingBag, Store } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useMode } from "../context/modeContext";
import * as chatApi from "../lib/chatApi";
import { EASE_OUT, SPRING } from "../lib/motionConfig";

const COLOR = {
  negro: "#0B0A09",
  surface: "#151311",
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

// Dos bandejas separadas: lo que le escribes a otras tiendas (como cliente) y
// lo que te escriben a tu tienda (como vendedor).
function ChatTabs({ active, onChange, clientCount, storeCount }) {
  const tabs = [
    { id: "cliente", label: "Como cliente", icon: ShoppingBag, count: clientCount },
    { id: "tienda", label: "Mi tienda", icon: Store, count: storeCount },
  ];
  return (
    <div className="flex gap-1 p-1 rounded-full mx-4 mt-3 mb-1" style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
      {tabs.map((t) => {
        const on = active === t.id;
        const Icon = t.icon;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} className="relative flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold">
            {on && <motion.span layoutId="chat-tab-pill" transition={SPRING} className="absolute inset-0 rounded-full" style={{ backgroundColor: COLOR.lima }} />}
            <span className="relative flex items-center gap-1.5" style={{ color: on ? COLOR.negro : COLOR.muted }}>
              <Icon size={13} />
              {t.label}
              {t.count > 0 && (
                <span
                  className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: on ? "rgba(11,10,9,0.18)" : COLOR.border, color: on ? COLOR.negro : COLOR.hueso }}
                >
                  {t.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ConversationRow({ conversation, active, currentUserId, index, onClick }) {
  const last = conversation.lastMessage;
  const preview = last ? `${last.senderId === currentUserId ? "Tú: " : ""}${last.text}` : "Sin mensajes todavía";
  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04, ease: EASE_OUT }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left"
      style={{ backgroundColor: active ? "rgba(200,255,77,0.08)" : "transparent" }}
    >
      <Avatar url={conversation.otherAvatarUrl} initials={conversation.otherInitials} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold truncate" style={{ color: COLOR.hueso }}>
            {conversation.otherName}
          </p>
          {last && (
            <span className="text-[10px] shrink-0" style={{ color: COLOR.muted }}>
              {formatTime(last.createdAt)}
            </span>
          )}
        </div>
        <p className="text-xs truncate mt-0.5" style={{ color: COLOR.muted }}>
          {preview}
        </p>
      </div>
    </motion.button>
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
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
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
        <div className="min-w-0 flex-1">
          {conversation.isBuyer ? (
            <Link to={`/tienda/${conversation.storeSlug}`} className="text-sm font-semibold hover:underline" style={{ color: COLOR.hueso }}>
              {conversation.otherName}
            </Link>
          ) : (
            <span className="text-sm font-semibold" style={{ color: COLOR.hueso }}>
              {conversation.otherName}
            </span>
          )}
          <p className="text-[11px]" style={{ color: COLOR.muted }}>
            {conversation.isBuyer ? "Tienda" : "Cliente"}
          </p>
        </div>
        <span
          className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold shrink-0"
          style={{ backgroundColor: "rgba(200,255,77,0.08)", border: "1px solid rgba(200,255,77,0.22)", color: COLOR.lima }}
        >
          {conversation.isBuyer ? <ShoppingBag size={12} /> : <Store size={12} />}
          {conversation.isBuyer ? "Escribes como cliente" : `Respondes como ${conversation.storeName ?? "tu tienda"}`}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5">
        {messages.map((m) => {
          const isMine = m.senderId === currentUserId;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={SPRING}
              className="flex flex-col"
              style={{ alignItems: isMine ? "flex-end" : "flex-start" }}
            >
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
            </motion.div>
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
          className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none border border-[#2A2622] bg-[#151311] text-[#FBF6EF] transition focus:border-[#C8FF4D]"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={sending}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-60"
          style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
        >
          <Send size={16} />
        </motion.button>
      </div>
    </div>
  );
}

export default function ChatsPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { storeMode } = useMode();
  const [conversations, setConversations] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [tabChoice, setTabChoice] = useState(null);

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
  const clientConvs = conversations.filter((c) => c.isBuyer);
  const storeConvs = conversations.filter((c) => !c.isBuyer);
  // La pestaña sigue a la conversación abierta, salvo que la persona elija otra.
  const activeTab = tabChoice ?? (conversation ? (conversation.isBuyer ? "cliente" : "tienda") : storeMode ? "tienda" : "cliente");
  const list = activeTab === "cliente" ? clientConvs : storeConvs;

  const changeTab = (tab) => {
    setTabChoice(tab);
    if (conversation && (tab === "cliente") !== conversation.isBuyer) navigate("/chats");
  };

  return (
    <div className="flex" style={{ height: "100vh" }}>
      <div
        className={`w-full md:w-80 shrink-0 overflow-y-auto ${conversation ? "hidden md:block" : "block"}`}
        style={{ borderRight: `1px solid ${COLOR.border}` }}
      >
        <div className="px-4 pt-4 shrink-0">
          <h1 className="text-lg font-semibold" style={{ color: COLOR.hueso }}>
            Chats
          </h1>
        </div>
        <ChatTabs active={activeTab} onChange={changeTab} clientCount={clientConvs.length} storeCount={storeConvs.length} />

        <p className="px-4 pt-3 pb-1 text-[11px]" style={{ color: COLOR.muted }}>
          {activeTab === "cliente"
            ? "Tus conversaciones con las tiendas donde preguntaste o compraste."
            : `Mensajes de clientes${storeConvs[0]?.storeName ? ` de ${storeConvs[0].storeName}` : " de tu tienda"}.`}
        </p>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {list.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-xs leading-relaxed" style={{ color: COLOR.muted }}>
                  {activeTab === "cliente"
                    ? 'Todavía no le has escrito a ninguna tienda. Usa «Preguntar» en una tienda o en un producto.'
                    : user.storeSlug
                      ? "Aún no te escribió ningún cliente. Cuando alguien te pregunte por un producto, aparecerá aquí."
                      : "Crea tu tienda para recibir mensajes de clientes."}
                </p>
                {activeTab === "tienda" && !user.storeSlug && (
                  <Link to="/vender" className="inline-block mt-3 rounded-full px-5 py-2 text-xs font-semibold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
                    Crear mi tienda
                  </Link>
                )}
              </div>
            ) : (
              list.map((c, i) => (
                <ConversationRow
                  key={c.id}
                  conversation={c}
                  index={i}
                  currentUserId={user.id}
                  active={c.id === conversationId}
                  onClick={() => navigate(`/chats/${c.id}`)}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>
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
