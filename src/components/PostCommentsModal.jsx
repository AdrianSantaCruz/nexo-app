import { useEffect, useState } from "react";
import { X, Send } from "lucide-react";
import { fetchPostComments, addComment } from "../lib/postsApi";

const COLOR = {
  negro: "#14110F",
  surface: "#1C1815",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

export default function PostCommentsModal({ postId, currentUser, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loadedPostId, setLoadedPostId] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const loading = loadedPostId !== postId;

  useEffect(() => {
    fetchPostComments(postId).then((data) => {
      setComments(data);
      setLoadedPostId(postId);
    });
  }, [postId]);

  const handleSend = () => {
    const value = text.trim();
    if (!value || !currentUser || sending) return;
    setSending(true);
    addComment(postId, currentUser.id, value)
      .then((comment) => {
        setComments((prev) => [...prev, comment]);
        setText("");
        onCommentAdded?.();
      })
      .finally(() => setSending(false));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-sm max-h-[80vh] md:max-h-[70vh] rounded-t-2xl md:rounded-2xl flex flex-col"
        style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
          <span className="text-sm font-semibold" style={{ color: COLOR.hueso }}>
            Comentarios
          </span>
          <button onClick={onClose}>
            <X size={18} style={{ color: COLOR.muted }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="text-xs" style={{ color: COLOR.muted }}>
              Cargando...
            </p>
          ) : comments.length === 0 ? (
            <p className="text-xs" style={{ color: COLOR.muted }}>
              Sé el primero en comentar.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                    style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
                  >
                    {c.authorInitials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: COLOR.hueso }}>
                      {c.authorName}
                    </p>
                    <p className="text-xs" style={{ color: COLOR.muted }}>
                      {c.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {currentUser ? (
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderTop: `1px solid ${COLOR.border}` }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribe un comentario..."
              className="flex-1 text-xs rounded-full px-3 py-2 outline-none"
              style={{ backgroundColor: COLOR.surface, color: COLOR.hueso, border: `1px solid ${COLOR.border}` }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40"
              style={{ backgroundColor: COLOR.lima }}
            >
              <Send size={14} style={{ color: COLOR.negro }} />
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 text-center" style={{ borderTop: `1px solid ${COLOR.border}` }}>
            <p className="text-xs" style={{ color: COLOR.muted }}>
              Inicia sesión para comentar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
