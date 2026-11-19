import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Check, CheckCheck, ChevronLeft, Clock, Send, MessageCircle, ShoppingBag, Store } from "lucide-react";
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
  online: "#4ADE80",
};

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
}

// Hora si es de hoy; si no, el día corto (para la lista de conversaciones).
function listTime(iso) {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString() ? formatTime(iso) : d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

function Avatar({ url, initials, size = 44, online }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden"
        style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
      >
        {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
      <AnimatePresence>
        {online && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute bottom-0 right-0 rounded-full"
            style={{ width: size * 0.28, height: size * 0.28, backgroundColor: COLOR.online, border: `2px solid ${COLOR.negro}` }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Dos bandejas separadas: lo que le escribes a otras tiendas (como cliente) y
// lo que te escriben a tu tienda (como vendedor). El número es de mensajes sin leer.
function ChatTabs({ active, onChange, clientUnread, storeUnread }) {
  const tabs = [
    { id: "cliente", label: "Como cliente", icon: ShoppingBag, count: clientUnread },
    { id: "tienda", label: "Mi tienda", icon: Store, count: storeUnread },
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
              <AnimatePresence>
                {t.count > 0 && (
                  <motion.span
                    key={t.count}
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: on ? "rgba(11,10,9,0.18)" : COLOR.lima, color: COLOR.negro }}
                  >
                    {t.count > 99 ? "99+" : t.count}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ConversationRow({ conversation, active, currentUserId, index, onClick }) {
  const last = conversation.lastMessage;
  const unread = chatApi.unreadCount(conversation, currentUserId);
  const preview = last ? `${last.senderId === currentUserId ? "Tú: " : ""}${last.text}` : "Sin mensajes todavía";
  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04, ease: EASE_OUT, layout: SPRING }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left"
      style={{ backgroundColor: active ? "rgba(200,255,77,0.08)" : "transparent" }}
    >
      <Avatar url={conversation.otherAvatarUrl} initials={conversation.otherInitials} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm truncate" style={{ color: COLOR.hueso, fontWeight: unread ? 700 : 600 }}>
            {conversation.otherName}
          </p>
          {last && (
            <span className="text-[10px] shrink-0" style={{ color: unread ? COLOR.lima : COLOR.muted }}>
              {listTime(last.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs truncate" style={{ color: unread ? COLOR.hueso : COLOR.muted, fontWeight: unread ? 500 : 400 }}>
            {preview}
          </p>
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key={unread}
                initial={{ scale: 0.3 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={SPRING}
                className="min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
              >
                {unread > 99 ? "99+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );
}

// Palomitas estilo mensajería: una = enviado, dos = visto.
function Receipt({ message }) {
  if (message.pending) return <Clock size={11} style={{ color: "rgba(11,10,9,0.5)" }} />;
  if (message.failed) return <AlertCircle size={12} style={{ color: "#B3261E" }} />;
  return message.readAt ? <CheckCheck size={13} style={{ color: "#0B5C2C" }} /> : <Check size={12} style={{ color: "rgba(11,10,9,0.5)" }} />;
}

function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.9 }}
      className="self-start rounded-2xl px-4 py-3 flex items-center gap-1"
      style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, borderBottomLeftRadius: 4 }}
      aria-label="Escribiendo"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: COLOR.muted }}
          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </motion.div>
  );
}

function ChatThread({ conversation, currentUserId, onBack, onSent }) {
  const [pending, setPending] = useState([]);
  const [draft, setDraft] = useState("");
  const [typingMark, setTypingMark] = useState(null); // id del último mensaje ajeno cuando empezó a escribir
  const [otherOnline, setOtherOnline] = useState(false);
  const scrollRef = useRef(null);
  const roomRef = useRef(null);
  const typingTimer = useRef(null);
  const lastIncomingRef = useRef(null);

  // Sala en vivo: "escribiendo…" y "en línea" de la otra persona.
  useEffect(() => {
    const room = chatApi.joinChatRoom(conversation.id, currentUserId, {
      onTyping: (typing) => {
        setTypingMark(typing ? { id: lastIncomingRef.current } : null);
        clearTimeout(typingTimer.current);
        if (typing) typingTimer.current = setTimeout(() => setTypingMark(null), 4000);
      },
      onPresence: setOtherOnline,
    });
    roomRef.current = room;
    return () => {
      clearTimeout(typingTimer.current);
      roomRef.current = null;
      room.leave();
    };
  }, [conversation.id, currentUserId]);

  const all = useMemo(() => [...conversation.messages, ...pending], [conversation.messages, pending]);

  // Si la otra persona termina de escribir y llega su mensaje, "escribiendo…" desaparece.
  // (Estas variables se calculan ANTES de los efectos que las usan.)
  const lastIncomingId = [...conversation.messages].reverse().find((m) => m.senderId !== currentUserId)?.id ?? null;
  const otherTyping = typingMark !== null && typingMark.id === lastIncomingId;
  useEffect(() => {
    lastIncomingRef.current = lastIncomingId;
  }, [lastIncomingId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [all.length, otherTyping]);

  const deliver = async (tempId, text) => {
    try {
      const message = await chatApi.sendMessage(conversation.id, currentUserId, text);
      onSent(message);
      setPending((prev) => prev.filter((p) => p.id !== tempId));
    } catch {
      setPending((prev) => prev.map((p) => (p.id === tempId ? { ...p, failed: true, pending: false } : p)));
    }
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    roomRef.current?.notifyTyping(false);
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setPending((prev) => [...prev, { id: tempId, senderId: currentUserId, text, createdAt: new Date().toISOString(), pending: true }]);
    deliver(tempId, text);
  };

  const retry = (m) => {
    setPending((prev) => prev.map((p) => (p.id === m.id ? { ...p, failed: false, pending: true } : p)));
    deliver(m.id, m.text);
  };

  // Último mensaje mío ya visto: se resalta "Visto" una sola vez.
  const lastSeenMineId = [...conversation.messages].reverse().find((m) => m.senderId === currentUserId && m.readAt)?.id;

  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ height: "100vh" }}>
      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${COLOR.border}`, backgroundColor: "rgba(21,19,17,0.6)", backdropFilter: "blur(10px)" }}>
        <button onClick={onBack} className="md:hidden" aria-label="Volver">
          <ChevronLeft size={20} style={{ color: COLOR.hueso }} />
        </button>
        <Avatar url={conversation.otherAvatarUrl} initials={conversation.otherInitials} size={38} online={otherOnline} />
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
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={otherTyping ? "typing" : otherOnline ? "online" : "role"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-[11px]"
              style={{ color: otherTyping ? COLOR.lima : otherOnline ? COLOR.online : COLOR.muted }}
            >
              {otherTyping ? "escribiendo…" : otherOnline ? "En línea" : conversation.isBuyer ? "Tienda" : "Cliente"}
            </motion.p>
          </AnimatePresence>
        </div>
        <span
          className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold shrink-0"
          style={{ backgroundColor: "rgba(200,255,77,0.08)", border: "1px solid rgba(200,255,77,0.22)", color: COLOR.lima }}
        >
          {conversation.isBuyer ? <ShoppingBag size={12} /> : <Store size={12} />}
          {conversation.isBuyer ? "Escribes como cliente" : `Respondes como ${conversation.storeName ?? "tu tienda"}`}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1.5">
        {all.map((m, i) => {
          const isMine = m.senderId === currentUserId;
          const prev = all[i - 1];
          const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
          const sameSenderAsPrev = prev && prev.senderId === m.senderId && !newDay;
          return (
            <div key={m.id} className="flex flex-col" style={{ marginTop: sameSenderAsPrev ? 0 : 8 }}>
              {newDay && (
                <div className="self-center text-[10px] font-semibold uppercase tracking-wide rounded-full px-3 py-1 my-2" style={{ backgroundColor: COLOR.surface, color: COLOR.muted, border: `1px solid ${COLOR.border}` }}>
                  {dayLabel(m.createdAt)}
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: m.pending ? 0.7 : 1, y: 0, scale: 1 }}
                transition={SPRING}
                className="flex flex-col"
                style={{ alignItems: isMine ? "flex-end" : "flex-start" }}
              >
                <div
                  className="max-w-[78%] md:max-w-md rounded-2xl px-3.5 pt-2 pb-1.5 text-sm"
                  style={
                    isMine
                      ? { backgroundColor: COLOR.lima, color: COLOR.negro, borderBottomRightRadius: 4 }
                      : { backgroundColor: COLOR.surface, color: COLOR.hueso, border: `1px solid ${COLOR.border}`, borderBottomLeftRadius: 4 }
                  }
                >
                  <span className="whitespace-pre-wrap break-words">{m.text}</span>
                  <span className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5" style={{ opacity: 0.7 }}>
                    <span className="text-[10px]">{formatTime(m.createdAt)}</span>
                    {isMine && <Receipt message={m} />}
                  </span>
                </div>
                {m.failed && (
                  <button onClick={() => retry(m)} className="text-[11px] mt-1 px-1 font-semibold" style={{ color: "#FF8A65" }}>
                    No se envió · Reintentar
                  </button>
                )}
                {isMine && m.id === lastSeenMineId && !pending.length && (
                  <span className="text-[10px] mt-0.5 px-1" style={{ color: COLOR.muted }}>
                    Visto
                  </span>
                )}
              </motion.div>
            </div>
          );
        })}
        {all.length === 0 && (
          <p className="text-xs text-center mt-6" style={{ color: COLOR.muted }}>
            Todavía no hay mensajes. ¡Escribe el primero!
          </p>
        )}
        <AnimatePresence>{otherTyping && <TypingBubble key="typing" />}</AnimatePresence>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderTop: `1px solid ${COLOR.border}` }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (e.target.value) roomRef.current?.notifyTyping(true);
          }}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Escribe un mensaje..."
          maxLength={2000}
          className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none border border-[#2A2622] bg-[#151311] text-[#FBF6EF] transition focus:border-[#C8FF4D]"
        />
        <motion.button
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.06 }}
          animate={{ opacity: draft.trim() ? 1 : 0.45 }}
          onClick={handleSend}
          disabled={!draft.trim()}
          aria-label="Enviar"
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
        >
          <Send size={16} />
        </motion.button>
      </div>
    </div>
  );
}

function sortByActivity(list) {
  return [...list].sort((a, b) => chatApi.activityStamp(b) - chatApi.activityStamp(a));
}

function withMessage(conv, message) {
  if (conv.messages.some((m) => m.id === message.id)) return conv;
  const messages = [...conv.messages, message].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return { ...conv, messages, lastMessage: messages[messages.length - 1] };
}

export default function ChatsPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { storeMode } = useMode();
  const [conversations, setConversations] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [tabChoice, setTabChoice] = useState(null);
  const knownIds = useRef(new Set());
  const userId = user?.id;

  useEffect(() => {
    knownIds.current = new Set(conversations.map((c) => c.id));
  }, [conversations]);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    chatApi
      .fetchConversations(userId)
      .then((data) => {
        if (cancelled) return;
        setConversations(data);
        setLoadedUserId(userId);
      })
      .catch(() => !cancelled && setLoadedUserId(userId));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Una conversación que todavía no tenemos (alguien te escribió por primera vez).
  const addConversation = useCallback(
    (id) => {
      if (!userId || knownIds.current.has(id)) return;
      knownIds.current.add(id);
      chatApi.fetchConversation(id, userId).then((conv) => {
        if (!conv) return;
        setConversations((prev) => (prev.some((c) => c.id === id) ? prev : sortByActivity([conv, ...prev])));
      });
    },
    [userId]
  );

  // Todo el chat en vivo: mensajes nuevos, mensajes vistos, conversaciones nuevas.
  useEffect(() => {
    if (!userId) return undefined;
    return chatApi.subscribeToInbox(userId, {
      onMessage: (message) => {
        if (!knownIds.current.has(message.conversationId)) {
          addConversation(message.conversationId);
          return;
        }
        setConversations((prev) => sortByActivity(prev.map((c) => (c.id === message.conversationId ? withMessage(c, message) : c))));
      },
      onMessageUpdate: (message) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== message.conversationId) return c;
            const messages = c.messages.map((m) => (m.id === message.id ? { ...m, readAt: message.readAt } : m));
            return { ...c, messages, lastMessage: messages[messages.length - 1] };
          })
        );
      },
      onConversation: addConversation,
    });
  }, [userId, addConversation]);

  const handleSent = useCallback((message) => {
    setConversations((prev) => sortByActivity(prev.map((c) => (c.id === message.conversationId ? withMessage(c, message) : c))));
  }, []);

  const conversation = conversations.find((c) => c.id === conversationId);

  // Conversación abierta: lo que llegue de la otra persona se marca como visto.
  const unreadOpen = conversation && userId ? chatApi.unreadCount(conversation, userId) : 0;
  useEffect(() => {
    if (!conversationId || unreadOpen === 0) return;
    chatApi.markConversationRead(conversationId).then((ok) => {
      if (!ok) return;
      const now = new Date().toISOString();
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, messages: c.messages.map((m) => (m.senderId !== userId && !m.readAt ? { ...m, readAt: now } : m)) } : c))
      );
    });
  }, [conversationId, unreadOpen, userId]);

  const loading = Boolean(user) && loadedUserId !== user?.id;
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

  const clientConvs = conversations.filter((c) => c.isBuyer);
  const storeConvs = conversations.filter((c) => !c.isBuyer);
  const sumUnread = (list) => list.reduce((sum, c) => sum + chatApi.unreadCount(c, user.id), 0);
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
        <div className="px-4 pt-4 shrink-0 flex items-center gap-2">
          <h1 className="text-lg font-semibold" style={{ color: COLOR.hueso }}>
            Chats
          </h1>
          <span className="flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ color: COLOR.online, backgroundColor: "rgba(74,222,128,0.1)" }}>
            <motion.span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLOR.online }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
            En vivo
          </span>
        </div>
        <ChatTabs active={activeTab} onChange={changeTab} clientUnread={sumUnread(clientConvs)} storeUnread={sumUnread(storeConvs)} />

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
        <ChatThread key={conversation.id} conversation={conversation} currentUserId={user.id} onBack={() => navigate("/chats")} onSent={handleSent} />
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
