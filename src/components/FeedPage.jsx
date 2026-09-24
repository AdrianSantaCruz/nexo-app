import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Tag, MessageSquareQuote, Film, Heart, MessageCircle, Share2, ChevronUp, ChevronDown, ShoppingBag, X } from "lucide-react";
import { fetchFeedItems } from "../lib/feedApi";
import { likePost, unlikePost } from "../lib/postsApi";
import { useAuth } from "../context/authContext";
import PostCommentsModal from "./PostCommentsModal";

// ---------------------------------------------------------------------------
// Paleta de marca (Nexo — Nero Labs): negro dominante, lima como acento puntual
// ---------------------------------------------------------------------------
const COLOR = {
  negro: "#14110F",
  surface: "#1C1815",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#C9C0B3",
  border: "#2A2622",
};

function ActionButton({ icon: Icon, count, active, onClick, fillWhenActive }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
        <Icon
          size={20}
          fill={active && fillWhenActive ? COLOR.lima : "none"}
          style={{ color: active && fillWhenActive ? COLOR.lima : COLOR.hueso }}
        />
      </div>
      {count !== undefined && (
        <span className="text-[11px] font-medium" style={{ color: COLOR.hueso }}>
          {count}
        </span>
      )}
    </button>
  );
}

// Cada publicación ocupa toda la altura disponible bajo el encabezado (como
// la versión web de TikTok/Instagram: una columna centrada, con la página
// scrolleando de verdad — no una caja fija en miniatura).
function FeedSlide({ post, liked, onToggleLike, onOpenComments }) {
  const isProduct = post.kind === "producto";
  const isPost = post.kind === "publicacion";
  const [showProducts, setShowProducts] = useState(false);
  const count = isPost ? post.likes : post.likes + (liked ? 1 : 0);
  const taggedProducts = post.taggedProducts ?? [];
  return (
    <div className="h-full w-full flex items-stretch justify-center px-2 md:px-0" style={{ scrollSnapAlign: "start" }}>
      <div className="relative h-full w-full max-w-md flex items-end" style={{ backgroundColor: COLOR.surface }}>
        {post.videoUrl ? (
          <video
            src={post.videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            controls
          />
        ) : (
          post.imageUrl && <img src={post.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* degradado inferior para legibilidad del texto */}
        <div
          className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(20,17,15,0.85), transparent)" }}
        />

        {/* columna de acciones */}
        <div className="absolute right-3 bottom-24 flex flex-col gap-4 items-center">
          <Link
            to={`/tienda/${post.storeSlug}`}
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold overflow-hidden"
            style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
          >
            {post.storeAvatarUrl ? (
              <img src={post.storeAvatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              post.initials
            )}
          </Link>
          <ActionButton icon={Heart} count={count} active={liked} fillWhenActive onClick={onToggleLike} />
          <ActionButton icon={MessageCircle} count={post.comments} onClick={isPost ? onOpenComments : undefined} />
          <ActionButton icon={Share2} onClick={() => {}} />
          {isPost && taggedProducts.length > 0 && (
            <ActionButton icon={ShoppingBag} onClick={() => setShowProducts((v) => !v)} />
          )}
        </div>

        {isPost && showProducts && taggedProducts.length > 0 && (
          <div
            className="absolute right-16 bottom-24 w-56 rounded-xl overflow-hidden max-h-64 overflow-y-auto"
            style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}` }}
          >
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
              <span className="text-xs font-semibold" style={{ color: COLOR.hueso }}>
                Productos en este video
              </span>
              <button onClick={() => setShowProducts(false)}>
                <X size={14} style={{ color: COLOR.muted }} />
              </button>
            </div>
            {taggedProducts.map((p) => (
              <Link
                key={p.id}
                to={`/tienda/${post.storeSlug}/producto/${p.id}`}
                className="flex items-center gap-2 px-3 py-2 hover:opacity-80"
                style={{ borderBottom: `1px solid ${COLOR.border}` }}
              >
                <div className="w-9 h-9 rounded-md overflow-hidden shrink-0" style={{ backgroundColor: COLOR.surface }}>
                  {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] truncate" style={{ color: COLOR.hueso }}>
                    {p.name}
                  </p>
                  <p className="text-[11px] font-semibold" style={{ color: COLOR.lima }}>
                    {p.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* texto inferior */}
        <div className="relative px-4 pb-6 pr-16">
          <div className="flex items-center gap-1 mb-1 flex-wrap">
            {isProduct || isPost ? (
              <Link to={`/tienda/${post.storeSlug}`} className="text-sm font-semibold hover:underline" style={{ color: COLOR.hueso }}>
                {post.store}
              </Link>
            ) : (
              <>
                {post.buyerId ? (
                  <Link to={`/perfil/${post.buyerId}`} className="text-sm font-semibold hover:underline" style={{ color: COLOR.hueso }}>
                    {post.buyer}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold" style={{ color: COLOR.hueso }}>
                    {post.buyer}
                  </span>
                )}
                <span className="text-xs" style={{ color: COLOR.muted }}>
                  compró en{" "}
                  <Link to={`/tienda/${post.storeSlug}`} className="hover:underline" style={{ color: COLOR.muted }}>
                    {post.store}
                  </Link>
                </span>
              </>
            )}
          </div>
          <p className="text-sm mb-1" style={{ color: COLOR.hueso }}>
            {post.caption}
          </p>
          {isProduct && post.price && (
            <p className="text-sm font-semibold mb-1" style={{ color: COLOR.lima }}>
              {post.price}
            </p>
          )}
          <div className="flex items-center gap-1">
            {isProduct && (
              <>
                <Tag size={13} style={{ color: COLOR.lima }} />
                <span className="text-[11px]" style={{ color: COLOR.lima }}>
                  Producto nuevo
                </span>
              </>
            )}
            {isPost && (
              <>
                <Film size={13} style={{ color: COLOR.lima }} />
                <span className="text-[11px]" style={{ color: COLOR.lima }}>
                  {post.videoUrl ? "Video de la tienda" : "Publicación de la tienda"}
                </span>
              </>
            )}
            {!isProduct && !isPost && (
              <>
                <MessageSquareQuote size={13} style={{ color: COLOR.lima }} />
                <span className="text-[11px]" style={{ color: COLOR.lima }}>
                  Reseña de comprador
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentsPostId, setCommentsPostId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchFeedItems(user?.id)
      .then(setPosts)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const toggleLike = (post) => {
    if (post.kind !== "publicacion") {
      setLikedIds((prev) => {
        const next = new Set(prev);
        next.has(post.id) ? next.delete(post.id) : next.add(post.id);
        return next;
      });
      return;
    }
    if (!user) return;
    const wasLiked = post.likedByMe;
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, likedByMe: !wasLiked, likes: p.likes + (wasLiked ? -1 : 1) } : p))
    );
    const action = wasLiked ? unlikePost(post.postId, user.id) : likePost(post.postId, user.id);
    action.catch(() => {
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, likedByMe: wasLiked, likes: p.likes + (wasLiked ? 1 : -1) } : p))
      );
    });
  };

  const handleCommentAdded = (postId) => {
    setPosts((prev) => prev.map((p) => (p.postId === postId ? { ...p, comments: p.comments + 1 } : p)));
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientHeight === 0) return;
    setActiveIndex(Math.round(el.scrollTop / el.clientHeight));
  };

  const scrollToIndex = (index) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(posts.length - 1, index));
    el.scrollTo({ top: clamped * el.clientHeight, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col relative" style={{ height: "100vh" }}>
      <div className="flex items-center px-4 md:px-8 py-3 shrink-0" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
        <span className="text-sm font-semibold" style={{ color: COLOR.hueso }}>
          Para ti
        </span>
      </div>

      {/* región scrolleable: cada publicación llena la pantalla disponible,
          como en la web de TikTok/Instagram, pero es la página real la que
          scrollea, no una caja diminuta centrada en el vacío. La barra de
          scroll nativa se oculta — la navegación es con las flechas o con
          scroll/swipe normal. */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto no-scrollbar" style={{ scrollSnapType: "y mandatory" }}>
        {loading ? null : posts.length > 0 ? (
          posts.map((post) => (
            <FeedSlide
              key={post.id}
              post={post}
              liked={post.kind === "publicacion" ? post.likedByMe : likedIds.has(post.id)}
              onToggleLike={() => toggleLike(post)}
              onOpenComments={() => setCommentsPostId(post.postId)}
            />
          ))
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-center px-10" style={{ color: COLOR.muted }}>
              Todavía no hay publicaciones. Cuando las tiendas suban productos o los compradores dejen reseñas, van a aparecer aquí.
            </p>
          </div>
        )}
      </div>

      {/* flechas de navegación, como en Instagram/YouTube Shorts web */}
      {posts.length > 1 && (
        <div className="hidden md:flex flex-col gap-3 fixed right-6 top-1/2 -translate-y-1/2 z-30">
          <button
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
            style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}` }}
          >
            <ChevronUp size={20} style={{ color: COLOR.hueso }} />
          </button>
          <button
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === posts.length - 1}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
            style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}` }}
          >
            <ChevronDown size={20} style={{ color: COLOR.hueso }} />
          </button>
        </div>
      )}

      {commentsPostId && (
        <PostCommentsModal
          postId={commentsPostId}
          currentUser={user}
          onClose={() => setCommentsPostId(null)}
          onCommentAdded={() => handleCommentAdded(commentsPostId)}
        />
      )}
    </div>
  );
}
