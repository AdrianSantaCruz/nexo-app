import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, BadgeCheck } from "lucide-react";
import { search } from "../lib/searchApi";

const COLOR = {
  negro: "#14110F",
  surface: "#1C1815",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

function StoreResult({ store }) {
  return (
    <Link
      to={`/tienda/${store.slug}`}
      className="flex items-center gap-3 rounded-xl p-3"
      style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
    >
      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-sm font-semibold shrink-0" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
        {store.avatarUrl ? <img src={store.avatarUrl} alt="" className="w-full h-full object-cover" /> : store.initials}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: COLOR.hueso }}>
          {store.name}
        </p>
        <p className="text-xs truncate" style={{ color: COLOR.muted }}>
          {store.description}
        </p>
      </div>
    </Link>
  );
}

function ProductResult({ product }) {
  return (
    <Link
      to={`/tienda/${product.storeSlug}/producto/${product.id}`}
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
    >
      <div className="relative aspect-square" style={{ backgroundColor: COLOR.surface }}>
        {product.imageUrl && <img src={product.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
      </div>
      <div className="p-2.5">
        <p className="text-xs leading-snug truncate" style={{ color: COLOR.hueso }}>
          {product.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-semibold" style={{ color: COLOR.lima }}>
            {product.price}
          </span>
          <span className="text-[10px] truncate ml-2" style={{ color: COLOR.muted }}>
            {product.storeName}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(initialQuery);
  const [results, setResults] = useState({ stores: [], products: [] });
  const [loadedQuery, setLoadedQuery] = useState(null);
  const debounceRef = useRef(null);

  const query = searchParams.get("q") ?? "";
  const hasQuery = query.trim().length > 0;
  const loading = hasQuery && loadedQuery !== query;

  useEffect(() => {
    if (!query.trim()) return;
    search(query).then((data) => {
      setResults(data);
      setLoadedQuery(query);
    });
  }, [query]);

  const handleChange = (value) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchParams(value.trim() ? { q: value } : {}, { replace: true });
    }, 400);
  };

  const hasResults = results.stores.length > 0 || results.products.length > 0;

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6">
      <div
        className="flex items-center gap-2 rounded-full px-4 py-3 mb-6"
        style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
      >
        <Search size={17} style={{ color: COLOR.muted }} />
        <input
          type="text"
          autoFocus
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Buscar tiendas o productos"
          className="bg-transparent outline-none text-sm w-full"
          style={{ color: COLOR.hueso }}
        />
      </div>

      {!hasQuery && (
        <p className="text-sm text-center py-12" style={{ color: COLOR.muted }}>
          Escribe el nombre de una tienda o un producto.
        </p>
      )}

      {hasQuery && !loading && !hasResults && (
        <p className="text-sm text-center py-12" style={{ color: COLOR.muted }}>
          No encontramos nada para "{query}".
        </p>
      )}

      {hasQuery && results.stores.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <BadgeCheck size={14} style={{ color: COLOR.lima }} />
            <h2 className="text-sm font-semibold" style={{ color: COLOR.hueso }}>
              Tiendas
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {results.stores.map((s) => (
              <StoreResult key={s.id} store={s} />
            ))}
          </div>
        </div>
      )}

      {hasQuery && results.products.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: COLOR.hueso }}>
            Productos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
            {results.products.map((p) => (
              <ProductResult key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
