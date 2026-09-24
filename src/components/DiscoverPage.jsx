import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Tag, Play, ShoppingBag } from "lucide-react";
import { fetchFeedItems } from "../lib/feedApi";
import { useAuth } from "../context/authContext";

const COLOR = {
  negro: "#14110F",
  surface: "#1C1815",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

// Alturas variadas para que la cuadrícula se sienta tipo Pinterest en vez de
// un grid parejo.
const HEIGHTS = [260, 340, 220, 300, 240, 360];

export default function DiscoverPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedItems(user?.id)
      .then(setPosts)
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-6">
      <h1 className="text-lg md:text-xl font-semibold mb-1" style={{ color: COLOR.hueso }}>
        Descubrir
      </h1>
      <p className="text-xs md:text-sm mb-5" style={{ color: COLOR.muted }}>
        Productos y publicaciones recomendados según tus intereses.
      </p>

      {!loading && posts.length === 0 && (
        <p className="text-xs" style={{ color: COLOR.muted }}>
          Todavía no hay nada que mostrar. Cuando las tiendas suban productos van a aparecer aquí.
        </p>
      )}

      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-3" style={{ columnFill: "balance" }}>
        {posts.map((post, i) => (
          <Link
            key={post.id}
            to={
              post.productId
                ? `/tienda/${post.storeSlug}/producto/${post.productId}`
                : post.taggedProducts?.[0]
                  ? `/tienda/${post.storeSlug}/producto/${post.taggedProducts[0].id}`
                  : `/tienda/${post.storeSlug}`
            }
            className="block mb-3 rounded-xl overflow-hidden"
            style={{ breakInside: "avoid", backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
          >
            <div className="relative" style={{ height: HEIGHTS[i % HEIGHTS.length], backgroundColor: COLOR.surface }}>
              {post.videoUrl ? (
                <>
                  <video src={post.videoUrl} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline preload="metadata" />
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(20,17,15,0.6)" }}>
                      <Play size={16} fill={COLOR.hueso} style={{ color: COLOR.hueso }} />
                    </div>
                  </div>
                </>
              ) : (
                post.imageUrl && <img src={post.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              {post.kind === "producto" && (
                <div
                  className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-1"
                  style={{ backgroundColor: COLOR.lima }}
                >
                  <Tag size={10} style={{ color: COLOR.negro }} />
                  <span className="text-[10px] font-semibold" style={{ color: COLOR.negro }}>
                    {post.price}
                  </span>
                </div>
              )}
              {post.kind === "publicacion" && post.taggedProducts?.length > 0 && (
                <div
                  className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-1"
                  style={{ backgroundColor: COLOR.lima }}
                >
                  <ShoppingBag size={10} style={{ color: COLOR.negro }} />
                  <span className="text-[10px] font-semibold" style={{ color: COLOR.negro }}>
                    {post.taggedProducts.length > 1 ? `${post.taggedProducts.length} productos` : "Comprar"}
                  </span>
                </div>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-xs leading-snug" style={{ color: COLOR.hueso }}>
                {post.caption}
              </p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px]" style={{ color: COLOR.muted }}>
                  {post.store}
                </span>
                <div className="flex items-center gap-1">
                  <Heart size={11} style={{ color: COLOR.muted }} />
                  <span className="text-[10px]" style={{ color: COLOR.muted }}>
                    {post.likes}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
