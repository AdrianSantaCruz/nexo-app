import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Heart, Tag, Play, ShoppingBag, LayoutGrid } from "lucide-react";
import { fetchFeedItems } from "../lib/feedApi";
import { useAuth } from "../context/authContext";
import { EASE_OUT, SPRING_SOFT } from "../lib/motionConfig";
import { EmptyState, Reveal } from "./ui/Motion";

const MotionLink = motion.create(Link);

const COLOR = {
  negro: "#0B0A09",
  surface: "#151311",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

// Alturas variadas para que la cuadrícula se sienta tipo Pinterest en vez de
// un grid parejo.
const HEIGHTS = [260, 340, 220, 300, 240, 360];

function SkeletonGrid() {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-3">
      {HEIGHTS.concat(HEIGHTS).map((h, i) => (
        <div key={i} className="nexo-skeleton mb-3 rounded-2xl" style={{ height: h + 70, breakInside: "avoid" }} />
      ))}
    </div>
  );
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const [posts, setPosts] = useState([]);
  const [loadedFor, setLoadedFor] = useState(null);
  const [error, setError] = useState(false);
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
  }, [userId, who]);

  return (
    <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-6">
      <Reveal>
        <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: COLOR.hueso }}>
          Descubrir
        </h1>
        <p className="text-xs md:text-sm mb-6" style={{ color: COLOR.muted }}>
          Productos y publicaciones recomendados según tus intereses.
        </p>
      </Reveal>

      {error ? (
        <EmptyState icon={LayoutGrid} title="No pudimos cargar Descubrir" subtitle="Revisa tu conexión e inténtalo de nuevo." />
      ) : loading ? (
        <SkeletonGrid />
      ) : posts.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="Nada por aquí todavía" subtitle="Cuando las tiendas suban productos van a aparecer aquí." />
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-3" style={{ columnFill: "balance" }}>
          {posts.map((post, i) => (
            <MotionLink
              key={post.id}
              to={
                post.productId
                  ? `/tienda/${post.storeSlug}/producto/${post.productId}`
                  : post.taggedProducts?.[0]
                    ? `/tienda/${post.storeSlug}/producto/${post.taggedProducts[0].id}`
                    : `/tienda/${post.storeSlug}`
              }
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_SOFT, delay: Math.min(i, 14) * 0.04, ease: EASE_OUT }}
              whileHover={{ y: -6, boxShadow: "0 18px 40px rgba(0,0,0,0.5)" }}
              whileTap={{ scale: 0.98 }}
              className="block mb-3 rounded-2xl overflow-hidden group"
              style={{ breakInside: "avoid", backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
            >
              <div className="relative overflow-hidden" style={{ height: HEIGHTS[i % HEIGHTS.length], backgroundColor: COLOR.surface }}>
                {post.videoUrl ? (
                  <>
                    <video
                      src={post.videoUrl}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ backgroundColor: "rgba(0,0,0,0.15)" }}>
                      <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(11,10,9,0.65)", backdropFilter: "blur(6px)" }}>
                        <Play size={18} fill={COLOR.hueso} style={{ color: COLOR.hueso }} />
                      </div>
                    </div>
                  </>
                ) : (
                  post.imageUrl && (
                    <img src={post.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )
                )}
                <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(11,10,9,0.6), transparent)" }} />
                {post.kind === "producto" && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: COLOR.lima }}>
                    <Tag size={10} style={{ color: COLOR.negro }} />
                    <span className="text-[10px] font-bold" style={{ color: COLOR.negro }}>
                      {post.price}
                    </span>
                  </div>
                )}
                {post.kind === "publicacion" && post.taggedProducts?.length > 0 && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: COLOR.lima }}>
                    <ShoppingBag size={10} style={{ color: COLOR.negro }} />
                    <span className="text-[10px] font-bold" style={{ color: COLOR.negro }}>
                      {post.taggedProducts.length > 1 ? `${post.taggedProducts.length} productos` : "Comprar"}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs leading-snug font-medium" style={{ color: COLOR.hueso }}>
                  {post.caption}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] truncate" style={{ color: COLOR.muted }}>
                    {post.store}
                  </span>
                  {post.kind === "publicacion" && (
                    <div className="flex items-center gap-1">
                      <Heart size={11} style={{ color: COLOR.muted }} />
                      <span className="text-[10px]" style={{ color: COLOR.muted }}>
                        {post.likes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </MotionLink>
          ))}
        </div>
      )}
    </div>
  );
}
