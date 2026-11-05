import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  Tag,
  MessageSquareQuote,
  Film,
  Heart,
  MessageCircle,
  Share2,
  ChevronUp,
  ChevronDown,
  ShoppingBag,
  X,
  Volume2,
  VolumeX,
  Search,
  MoreHorizontal,
  Flag,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { fetchFeedItems } from "../lib/feedApi";
import { deletePost, likePost, unlikePost } from "../lib/postsApi";
import { useAuth } from "../context/authContext";
import { EASE_OUT, SPRING, SPRING_BOUNCY } from "../lib/motionConfig";
import PostCommentsModal from "./PostCommentsModal";
import QuickBuySheet from "./QuickBuySheet";
import ReportModal from "./ReportModal";
import { EmptyState } from "./ui/Motion";

// ---------------------------------------------------------------------------
// Paleta de marca (Nexo — Nero Labs): negro dominante, lima como acento puntual
// ---------------------------------------------------------------------------
const COLOR = {
  negro: "#0B0A09",
  surface: "#151311",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#C9C0B3",
  border: "#2A2622",
};

function ActionButton({ icon: Icon, count, active, onClick, fillWhenActive, label }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.82 }}
      whileHover={{ scale: 1.08 }}
      transition={SPRING}
      aria-label={label}
      className="flex flex-col items-center gap-1"
    >
      <motion.div
        key={active ? "on" : "off"}
        initial={active && fillWhenActive ? { scale: 0.6 } : false}
        animate={{ scale: 1 }}
        transition={SPRING_BOUNCY}
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "rgba(11,10,9,0.5)", backdropFilter: "blur(6px)" }}
      >
        <Icon
          size={21}
          fill={active && fillWhenActive ? COLOR.lima : "none"}
          style={{ color: active && fillWhenActive ? COLOR.lima : COLOR.hueso }}
        />
      </motion.div>
      {count !== undefined && (
        <span className="text-[11px] font-semibold" style={{ color: COLOR.hueso }}>
          {count}
        </span>
      )}
    </motion.button>
  );
}

// Cada publicación ocupa toda la altura disponible bajo el encabezado (como
// la versión web de TikTok/Instagram: una columna centrada, con la página
// scrolleando de verdad — no una caja fija en miniatura).
function FeedSlide({ post, liked, active, muted, onToggleMute, onToggleLike, onOpenComments, onOpenMenu, onBuy }) {
  const isProduct = post.kind === "producto";
  const isPost = post.kind === "publicacion";
  const [showProducts, setShowProducts] = useState(false);
  const [burst, setBurst] = useState(0);
  const videoRef = useRef(null);
  const count = isPost ? post.likes : post.likes + (liked ? 1 : 0);
  const taggedProducts = post.taggedProducts ?? [];
  const hasTagged = isPost && taggedProducts.length > 0;

  // Solo se reproduce el video que está en pantalla.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) video.play().catch(() => undefined);
    else video.pause();
  }, [active]);

  const handleDoubleClick = () => {
    setBurst((b) => b + 1);
    if (!liked) onToggleLike();
  };

  return (
    <div className="h-full w-full flex items-stretch justify-center px-2 md:px-0" style={{ scrollSnapAlign: "start" }}>
      <div className="relative h-full w-full max-w-md flex items-end overflow-hidden md:rounded-3xl" style={{ backgroundColor: COLOR.surface }}>
        <div className="absolute inset-0" onDoubleClick={handleDoubleClick}>
          {post.videoUrl ? (
            <video ref={videoRef} src={post.videoUrl} className="w-full h-full object-cover" muted={muted} loop playsInline preload="metadata" />
          ) : post.imageUrl ? (
            <motion.img
              src={post.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              initial={{ scale: 1.06 }}
              animate={{ scale: active ? 1 : 1.06 }}
              transition={{ duration: 6, ease: "easeOut" }}
            />
          ) : (
            <div className="w-full h-full" style={{ background: "linear-gradient(160deg, #12300B, #0B0A09)" }} />
          )}
        </div>

        <div className="absolute inset-x-0 top-0 h-28 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(11,10,9,0.55), transparent)" }} />
        <div className="absolute inset-x-0 bottom-0 h-72 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(11,10,9,0.95), transparent)" }} />

        {/* corazón grande al dar doble clic */}
        <AnimatePresence>
          {burst > 0 && (
            <motion.div
              key={burst}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.25, 1], opacity: [0, 1, 1] }}
              exit={{ opacity: 0, scale: 1.3 }}
              transition={{ duration: 0.5 }}
              onAnimationComplete={() => setBurst(0)}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart size={110} fill={COLOR.lima} style={{ color: COLOR.lima, filter: "drop-shadow(0 0 24px rgba(200,255,77,0.6))" }} />
            </motion.div>
          )}
        </AnimatePresence>

        {post.videoUrl && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onToggleMute}
            className="absolute right-3 top-3 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(11,10,9,0.55)", backdropFilter: "blur(6px)" }}
            aria-label={muted ? "Activar sonido" : "Silenciar"}
          >
            {muted ? <VolumeX size={16} style={{ color: COLOR.hueso }} /> : <Volume2 size={16} style={{ color: COLOR.hueso }} />}
          </motion.button>
        )}

        {/* columna de acciones */}
        <div className="absolute right-3 bottom-24 flex flex-col gap-4 items-center">
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }} transition={SPRING}>
            <Link
              to={`/tienda/${post.storeSlug}`}
              className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-semibold overflow-hidden"
              style={{ backgroundColor: COLOR.lima, color: COLOR.negro, boxShadow: "0 0 0 2px #C8FF4D, 0 0 0 5px rgba(200,255,77,0.2)" }}
            >
              {post.storeAvatarUrl ? <img src={post.storeAvatarUrl} alt="" className="w-full h-full object-cover" /> : post.initials}
            </Link>
          </motion.div>
          <ActionButton icon={Heart} count={count} active={liked} fillWhenActive onClick={onToggleLike} label="Me gusta" />
          {isPost && <ActionButton icon={MessageCircle} count={post.comments} onClick={onOpenComments} label="Comentarios" />}
          {hasTagged && <ActionButton icon={ShoppingBag} onClick={() => setShowProducts((v) => !v)} label="Productos del video" />}
          <ActionButton icon={Share2} onClick={() => navigator.share?.({ title: post.store, text: post.caption }).catch(() => undefined)} label="Compartir" />
          <ActionButton icon={MoreHorizontal} onClick={onOpenMenu} label="Más opciones" />
        </div>

        <AnimatePresence>
          {hasTagged && showProducts && (
            <motion.div
              initial={{ opacity: 0, x: 16, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 16, scale: 0.96 }}
              transition={SPRING}
              className="absolute right-[4.5rem] bottom-24 w-60 rounded-2xl overflow-hidden max-h-72 overflow-y-auto"
              style={{ backgroundColor: "rgba(11,10,9,0.95)", border: `1px solid ${COLOR.border}`, backdropFilter: "blur(10px)" }}
            >
              <div className="flex items-center justify-between px-3.5 py-2.5" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
                <span className="text-xs font-semibold" style={{ color: COLOR.hueso }}>
                  Productos en este video
                </span>
                <button onClick={() => setShowProducts(false)} aria-label="Cerrar">
                  <X size={14} style={{ color: COLOR.muted }} />
                </button>
              </div>
              {taggedProducts.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                  <button
                    onClick={() => {
                      setShowProducts(false);
                      onBuy(p.id);
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-white/5 transition-colors"
                    style={{ borderBottom: `1px solid ${COLOR.border}` }}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: COLOR.surface }}>
                      {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] truncate" style={{ color: COLOR.hueso }}>
                        {p.name}
                      </p>
                      <p className="text-xs font-bold" style={{ color: COLOR.lima }}>
                        {p.price}
                      </p>
                    </div>
                    <span className="shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
                      <ShoppingBag size={11} />
                      Comprar
                    </span>
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* texto inferior */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0.85, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="relative px-4 pb-6 pr-20 w-full"
        >
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 mb-2"
            style={{ backgroundColor: "rgba(11,10,9,0.55)", border: "1px solid rgba(200,255,77,0.22)", backdropFilter: "blur(6px)" }}
          >
            {isProduct && <Tag size={12} style={{ color: COLOR.lima }} />}
            {isPost && <Film size={12} style={{ color: COLOR.lima }} />}
            {!isProduct && !isPost && <MessageSquareQuote size={12} style={{ color: COLOR.lima }} />}
            <span className="text-[11px] font-medium" style={{ color: COLOR.lima }}>
              {isProduct ? "Producto nuevo" : isPost ? (post.videoUrl ? "Video de la tienda" : "Publicación de la tienda") : "Reseña de comprador"}
            </span>
          </div>

          <div className="flex items-center gap-1 mb-1 flex-wrap">
            {isProduct || isPost ? (
              <Link to={`/tienda/${post.storeSlug}`} className="text-base font-bold hover:underline" style={{ color: COLOR.hueso }}>
                {post.store}
              </Link>
            ) : (
              <>
                {post.buyerId ? (
                  <Link to={`/perfil/${post.buyerId}`} className="text-base font-bold hover:underline" style={{ color: COLOR.hueso }}>
                    {post.buyer}
                  </Link>
                ) : (
                  <span className="text-base font-bold" style={{ color: COLOR.hueso }}>
                    {post.buyer}
                  </span>
                )}
                <span className="text-xs" style={{ color: COLOR.muted }}>
                  compró en{" "}
                  <Link to={`/tienda/${post.storeSlug}`} className="hover:underline font-semibold" style={{ color: COLOR.lima }}>
                    {post.store}
                  </Link>
                </span>
              </>
            )}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: COLOR.hueso }}>
            {post.caption}
          </p>

          {post.kind === "review" && post.productId && (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onBuy(post.productId)}
              className="nexo-glow mt-3 flex items-center gap-2.5 rounded-2xl pl-3 pr-3.5 py-2.5 max-w-full text-left"
              style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
            >
              <ShoppingBag size={16} className="shrink-0" />
              <span className="min-w-0">
                <span className="block text-[11px] font-medium leading-none opacity-70">Comprar este producto</span>
                <span className="block text-sm font-bold truncate mt-0.5">
                  {post.productName ?? "Ver producto"}
                  {post.price && ` · ${post.price}`}
                </span>
              </span>
              <ArrowRight size={15} className="shrink-0" />
            </motion.button>
          )}

          {isProduct && post.productId && (
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="inline-block mt-3">
              <button
                onClick={() => onBuy(post.productId)}
                className="nexo-glow inline-flex items-center gap-2.5 rounded-full pl-4 pr-3.5 py-2.5 text-sm font-bold"
                style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
              >
                {post.price}
                <span className="w-px h-3.5" style={{ backgroundColor: "rgba(11,10,9,0.3)" }} />
                <span className="font-semibold">Comprar</span>
                <ShoppingBag size={15} />
              </button>
            </motion.div>
          )}

          {hasTagged && (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => (taggedProducts.length === 1 ? onBuy(taggedProducts[0].id) : setShowProducts(true))}
              className="nexo-glow mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
            >
              <ShoppingBag size={15} />
              Comprar {taggedProducts.length === 1 ? "este producto" : `${taggedProducts.length} productos`}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="h-full w-full flex items-stretch justify-center px-2 md:px-0">
      <div className="nexo-skeleton h-full w-full max-w-md md:rounded-3xl" />
    </div>
  );
}

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loadedFor, setLoadedFor] = useState(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [likedIds, setLikedIds] = useState(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [commentsPostId, setCommentsPostId] = useState(null);
  const [menuPost, setMenuPost] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [buyProductId, setBuyProductId] = useState(null);
  const scrollRef = useRef(null);
  const userId = user?.id;
  const who = userId ?? "anon";
  const loading = loadedFor !== who && !error;

  useEffect(() => {
    let cancelled = false;
    fetchFeedItems(userId)
      .then((data) => {
        if (cancelled) return;
        setPosts(data);
        setError(false);
        setLoadedFor(who);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [userId, who, reloadKey]);

  const toggleLike = (post) => {
    if (post.kind !== "publicacion") {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (next.has(post.id)) next.delete(post.id);
        else next.add(post.id);
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

  const reportFor = (post) => {
    if (post.kind === "publicacion" && post.postId) return { type: "post", id: post.postId };
    if (post.kind === "producto" && post.productId) return { type: "product", id: post.productId };
    if (post.kind === "review") return { type: "review", id: post.id.replace("resena-", "") };
    return null;
  };

  const handleDelete = async (post) => {
    setMenuPost(null);
    if (!window.confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) return;
    try {
      await deletePost(post.postId);
      setPosts((prev) => prev.filter((p) => p.postId !== post.postId));
    } catch {
      window.alert("No se pudo eliminar la publicación.");
    }
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
      <div className="flex items-center justify-between px-4 md:px-8 py-3 shrink-0" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
        <span className="text-base font-bold" style={{ color: COLOR.hueso }}>
          Para ti
        </span>
        <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}>
          <Link to="/buscar" className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
            <Search size={16} style={{ color: COLOR.hueso }} />
          </Link>
        </motion.div>
      </div>

      {/* región scrolleable: cada publicación llena la pantalla disponible,
          como en la web de TikTok/Instagram, pero es la página real la que
          scrollea, no una caja diminuta centrada en el vacío. La barra de
          scroll nativa se oculta — la navegación es con las flechas o con
          scroll/swipe normal. */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto no-scrollbar md:py-3" style={{ scrollSnapType: "y mandatory" }}>
        {error && !posts.length ? (
          <EmptyState icon={Film} title="No pudimos cargar el feed" subtitle="Revisa tu conexión e inténtalo de nuevo.">
            <button
              onClick={() => {
                setError(false);
                setReloadKey((k) => k + 1);
              }}
              className="rounded-full px-8 py-3 text-sm font-semibold"
              style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
            >
              Reintentar
            </button>
          </EmptyState>
        ) : loading ? (
          <FeedSkeleton />
        ) : posts.length > 0 ? (
          posts.map((post, index) => (
            <FeedSlide
              key={post.id}
              post={post}
              active={index === activeIndex}
              muted={muted}
              liked={post.kind === "publicacion" ? post.likedByMe : likedIds.has(post.id)}
              onToggleMute={() => setMuted((m) => !m)}
              onToggleLike={() => toggleLike(post)}
              onOpenComments={() => setCommentsPostId(post.postId)}
              onOpenMenu={() => setMenuPost(post)}
              onBuy={setBuyProductId}
            />
          ))
        ) : (
          <EmptyState
            icon={Film}
            title="Todavía no hay publicaciones"
            subtitle="Cuando las tiendas suban productos o los compradores dejen reseñas, van a aparecer aquí."
          />
        )}
      </div>

      {/* flechas de navegación, como en Instagram/YouTube Shorts web */}
      {posts.length > 1 && (
        <div className="hidden md:flex flex-col gap-3 fixed right-6 top-1/2 -translate-y-1/2 z-30">
          {[
            { icon: ChevronUp, to: activeIndex - 1, disabled: activeIndex === 0, label: "Anterior" },
            { icon: ChevronDown, to: activeIndex + 1, disabled: activeIndex === posts.length - 1, label: "Siguiente" },
          ].map(({ icon: Icon, to, disabled, label }) => (
            <motion.button
              key={label}
              onClick={() => scrollToIndex(to)}
              disabled={disabled}
              whileHover={{ scale: disabled ? 1 : 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={label}
              className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-30"
              style={{ backgroundColor: "rgba(21,19,17,0.9)", border: `1px solid ${COLOR.border}`, backdropFilter: "blur(8px)" }}
            >
              <Icon size={20} style={{ color: COLOR.hueso }} />
            </motion.button>
          ))}
        </div>
      )}

      {/* menú de la publicación: reportar / eliminar */}
      <AnimatePresence>
        {menuPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)" }}
            onClick={() => setMenuPost(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={SPRING}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-3xl p-3 flex flex-col gap-1.5"
              style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}` }}
            >
              {reportFor(menuPost) && (
                <button
                  onClick={() => {
                    const target = reportFor(menuPost);
                    setMenuPost(null);
                    if (!user) navigate("/ingresar");
                    else setReportTarget(target);
                  }}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold hover:bg-white/5 transition-colors"
                  style={{ color: COLOR.hueso }}
                >
                  <Flag size={18} />
                  Reportar
                </button>
              )}
              {menuPost.kind === "publicacion" && user && menuPost.storeOwnerId === user.id && (
                <button
                  onClick={() => handleDelete(menuPost)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold hover:bg-white/5 transition-colors"
                  style={{ color: "#FF8A65" }}
                >
                  <Trash2 size={18} />
                  Eliminar publicación
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {reportTarget && <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />}

      <AnimatePresence>{buyProductId && <QuickBuySheet key={buyProductId} productId={buyProductId} onClose={() => setBuyProductId(null)} />}</AnimatePresence>

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
