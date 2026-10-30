import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Clapperboard, Heart, MessageCircle, Plus, Tag, Trash2, Play } from "lucide-react";
import { useAuth } from "../context/authContext";
import * as storesApi from "../lib/storesApi";
import * as panelApi from "../lib/panelApi";
import * as postsApi from "../lib/postsApi";
import PostCreateModal from "./PostCreateModal";
import { EmptyState, Reveal, Skeleton, Stagger, StaggerItem } from "./ui/Motion";

const COLOR = { negro: "#0B0A09", surface: "#151311", surfaceHigh: "#1E1B18", border: "#2A2622", lima: "#C8FF4D", hueso: "#FBF6EF", muted: "#8A8378" };

// Miniatura de una publicación de la tienda con sus números reales.
export function PostTile({ post, onDelete }) {
  const date = new Date(post.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
  return (
    <motion.div whileHover={{ y: -3 }} className="group relative rounded-2xl overflow-hidden" style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
      <div className="relative aspect-[3/4]" style={{ backgroundColor: COLOR.surfaceHigh }}>
        {post.mediaUrl &&
          (post.mediaType === "video" ? (
            <>
              <video src={post.mediaUrl} muted playsInline preload="metadata" className="w-full h-full object-cover" />
              <span className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                <Play size={13} fill={COLOR.hueso} style={{ color: COLOR.hueso }} />
              </span>
            </>
          ) : (
            <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
          ))}
        {onDelete && (
          <button
            onClick={onDelete}
            aria-label="Eliminar publicación"
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
          >
            <Trash2 size={14} style={{ color: "#FF8A65" }} />
          </button>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs line-clamp-2 min-h-[2rem]" style={{ color: COLOR.hueso }}>
          {post.caption}
        </p>
        <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: COLOR.muted }}>
          <span className="flex items-center gap-1">
            <Heart size={12} style={{ color: COLOR.lima }} />
            {post.likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={12} style={{ color: COLOR.lima }} />
            {post.comments}
          </span>
          {post.tagged.length > 0 && (
            <span className="flex items-center gap-1">
              <Tag size={12} style={{ color: COLOR.lima }} />
              {post.tagged.length}
            </span>
          )}
          <span className="ml-auto">{date}</span>
        </div>
      </div>
    </motion.div>
  );
}

// "Mis publicaciones": todas las publicaciones de la tienda con sus likes y
// comentarios reales; se puede publicar una nueva o eliminar una.
export default function StorePostsPage() {
  const { user, loading: authLoading } = useAuth();
  const [params] = useSearchParams();
  const slug = user?.storeSlug;
  const [data, setData] = useState(null);
  const [loadedSlug, setLoadedSlug] = useState(null);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(params.get("nueva") === "1");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    storesApi
      .fetchStoreBySlug(slug)
      .then(async (store) => ({ store, posts: store ? await panelApi.fetchStorePosts(store.id) : [] }))
      .then((loaded) => {
        if (cancelled) return;
        setData(loaded);
        setError(false);
        setLoadedSlug(slug);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [slug, reloadKey]);

  if (authLoading) return null;

  if (!user || !slug) {
    return (
      <EmptyState icon={Clapperboard} title="Tus publicaciones" subtitle="Necesitas una tienda para publicar videos y fotos con tus productos.">
        <Link to={user ? "/vender" : "/ingresar"} className="nexo-glow rounded-full px-8 py-3 text-sm font-semibold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
          {user ? "Crear mi tienda" : "Ingresar"}
        </Link>
      </EmptyState>
    );
  }

  const loaded = loadedSlug === slug && data;

  const remove = async (post) => {
    if (!window.confirm("¿Eliminar esta publicación? Dejará de verse en el Feed.")) return;
    try {
      await postsApi.deletePost(post.id);
      setReloadKey((k) => k + 1);
    } catch {
      window.alert("No se pudo eliminar. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
      <Reveal>
        <Link to="/panel" className="inline-flex items-center gap-1.5 text-xs mb-3 hover:underline" style={{ color: COLOR.muted }}>
          <ArrowLeft size={13} />
          Volver al panel
        </Link>
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold" style={{ color: COLOR.hueso }}>
            Mis publicaciones
          </h1>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setCreating(true)}
            disabled={!loaded}
            className="nexo-glow flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
          >
            <Plus size={16} strokeWidth={2.6} />
            Nueva publicación
          </motion.button>
        </div>
      </Reveal>

      {error && !loaded ? (
        <EmptyState icon={Clapperboard} title="No pudimos cargar tus publicaciones" subtitle="Revisa tu conexión e inténtalo de nuevo." />
      ) : !loaded ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="aspect-[3/4]" />
          <Skeleton className="aspect-[3/4]" />
          <Skeleton className="aspect-[3/4]" />
          <Skeleton className="aspect-[3/4]" />
        </div>
      ) : data.posts.length === 0 ? (
        <EmptyState icon={Clapperboard} title="Aún no publicas nada" subtitle="Sube un video o una foto y etiqueta tus productos: el comprador los compra directo desde el Feed.">
          <button onClick={() => setCreating(true)} className="nexo-glow rounded-full px-8 py-3 text-sm font-semibold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
            Crear mi primera publicación
          </button>
        </EmptyState>
      ) : (
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.posts.map((p) => (
            <StaggerItem key={p.id}>
              <PostTile post={p} onDelete={() => remove(p)} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {creating && loaded && data.store && (
        <PostCreateModal
          storeId={data.store.id}
          authorId={user.id}
          accent={COLOR.lima}
          products={data.store.products}
          onCreated={() => {
            setCreating(false);
            setReloadKey((k) => k + 1);
          }}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}
