import { cn, formatCurrency, formatDate } from "../lib/utils.ts";
import { Star, MessageCircle, Heart, Share2, MapPin, CheckCircle2, ThumbsUp, ThumbsDown, Sparkles, Smartphone, MoreHorizontal } from "lucide-react";
import { currencyService } from "../services/geoService.ts";
import { useNexo } from "../App.tsx";

export const Button = ({ children, className, variant = "primary", size = "md", icon: Icon, loading, ...props }: any) => {
  const variants = {
    primary: "bg-brand text-white hover:bg-brand/90 shadow-[0_0_15px_rgba(124,58,237,0.3)]",
    secondary: "bg-white/5 text-white hover:bg-white/10 border border-white/10",
    outline: "bg-transparent border border-brand text-brand hover:bg-brand hover:text-white",
    ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base"
  };

  return (
    <button 
      className={cn(
        "flex items-center justify-center gap-2 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100", 
        variants[variant as keyof typeof variants], 
        sizes[size as keyof typeof sizes],
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      ) : (
        <>
          {Icon && <Icon size={size === "sm" ? 14 : 18} />}
          {children}
        </>
      )}
    </button>
  );
};

export const Input = ({ label, icon: Icon, error, className, ...props }: any) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1">{label}</label>}
      <div className="relative group">
        {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand transition-colors"><Icon size={18} /></div>}
        <input 
          className={cn(
            "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50 focus:bg-white/10 transition-all text-white placeholder:text-white/20",
            Icon && "pl-12",
            error && "border-red-500/50 bg-red-500/5",
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-[10px] text-red-500 font-medium pl-1">{error}</span>}
    </div>
  );
};

export const Card = ({ children, className, onClick }: any) => {
  return (
    <div 
      onClick={onClick}
      className={cn("bg-card border border-white/5 rounded-2xl p-4 shadow-xl overflow-hidden animate-slide-up", className)}
    >
      {children}
    </div>
  );
};

export const Badge = ({ children, variant = "default" }: any) => {
  const styles = {
    default: "bg-white/10 text-white/70",
    brand: "bg-brand/20 text-brand",
    verified: "bg-blue-500/20 text-blue-400",
    premium: "bg-amber-500/20 text-amber-500"
  };
  return <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider", styles[variant as keyof typeof styles])}>{children}</span>;
};

export const ProductCard = ({ product, onClick }: any) => {
  const { favorites, toggleWishlist } = useNexo();
  const isFavorite = favorites.includes(product.id);

  return (
    <Card className="p-0 border-white/10 hover:border-brand/30 transition-all cursor-pointer group relative" onClick={onClick}>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        className={cn(
          "absolute top-2 left-2 z-10 p-2 rounded-xl backdrop-blur-md transition-all shadow-lg border border-white/10",
          isFavorite ? "bg-red-500/20 text-red-500 border-red-500/20" : "bg-bg/40 text-white/50 hover:text-white"
        )}
      >
        <Heart size={16} className={isFavorite ? "fill-red-500" : ""} />
      </button>

      <div className="aspect-square relative overflow-hidden">
        <img 
          src={typeof product.images?.[0] === 'string' ? product.images[0] : (product.images?.[0]?.url || "https://placehold.co/400?text=Produit+Nexo")} 
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1">
           <div className="bg-bg/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold shadow-lg">
             {product.condition === "new" ? "NEUF" : "OCCASION"}
           </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-bg to-transparent">
          <div className="text-xl font-display font-black text-white">{currencyService.formatPrice(product.price, product.countryCode || "CG")}</div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="text-sm font-bold text-white line-clamp-1 group-hover:text-brand transition-colors">{product.title}</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-white/40 text-[10px] font-bold">
            <MapPin size={10} />
            {product.city} {product.flag}
          </div>
          <div className="flex items-center gap-2 text-white/40">
             <div className="flex items-center gap-1 text-[10px] items-center">
                <Heart size={12} className={product.isLiked ? "fill-red-500 text-red-500" : ""} />
                {product.likeCount || 0}
             </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const ShopCard = ({ shop, onClick }: any) => {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group"
    >
      <div className="relative">
        <div className={cn(
          "w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-brand to-pink-500",
          !shop.hasStatus && !shop.rating && "bg-none border border-white/10"
        )}>
          <img 
            src={shop.logoURL || `https://ui-avatars.com/api/?name=${shop.name}&background=111&color=fff`} 
            className="w-full h-full rounded-full object-cover border-2 border-bg"
            alt={shop.name}
          />
        </div>
        {shop.isVerified && (
          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-bg">
            <CheckCircle2 size={12} />
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-0.5">
         <span className="text-[10px] font-black uppercase text-center line-clamp-1 text-white/80 group-hover:text-brand transition-all">{shop.name}</span>
         {shop.rating > 0 && (
            <div className="flex items-center gap-0.5 text-amber-500">
               <Star size={8} fill="currentColor" />
               <span className="text-[8px] font-bold">{shop.rating.toFixed(1)}</span>
            </div>
         )}
      </div>
    </div>
  );
};

export const RatingStars = ({ rating, count }: any) => {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={12} className={cn(i <= Math.round(rating) ? "text-amber-500 fill-amber-500" : "text-white/10")} />
        ))}
      </div>
      {count !== undefined && <span className="text-[10px] font-bold text-white/30">({count})</span>}
    </div>
  );
};

export const FeedCard = ({ product, onClick }: any) => {
  const { setActivePage, setPageData, user, favorites, toggleWishlist } = useNexo();
  const isLiked = favorites.includes(product.id);

  const handleShare = async (e: any) => {
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Regarde ça sur NEXO : ${product.title}`,
          url: url
        });
      } catch (err) { /* silent */ }
    } else {
      navigator.clipboard.writeText(url);
      alert("Lien copié !");
    }
  };

  return (
    <Card className="p-0 border-white/5 bg-bg/40 backdrop-blur-xl mb-6 animate-fade-in shadow-2xl overflow-visible">
       {/* HEADER */}
       <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); setActivePage("shop"); setPageData(product.shopSlug); }}>
             <div className="w-10 h-10 rounded-xl border-2 border-brand/20 p-0.5">
                <img 
                   src={product.shopLogo || `https://ui-avatars.com/api/?name=${product.shopName || "S"}&background=7c3aed&color=fff`} 
                   className="w-full h-full object-cover rounded-lg" 
                   onError={(e: any) => e.target.src = "https://placehold.co/100?text=S"}
                />
             </div>
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5 leading-none">
                   {product.shopName || "Vendeur Nexo"}
                   {product.isVerified && <CheckCircle2 size={14} className="text-blue-500" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                   <div className="text-[8px] text-white/30 font-black uppercase tracking-[0.2em]">
                      {product.createdAt ? formatDate(product.createdAt).split(' à ')[0] : "Récemment"}
                   </div>
                </div>
             </div>
          </div>
          <button className="p-2 text-white/20 hover:text-white transition-colors">
             <MoreHorizontal size={20} />
          </button>
       </div>

       {/* CONTENT TEXT */}
       <div className="px-4 pb-4">
          <p className="text-sm text-white/80 dark:text-white/80 text-gray-700 leading-relaxed line-clamp-3">
             <span className="font-black text-brand mr-2">{product.title}</span>
             {product.description}
          </p>
       </div>

       {/* IMAGE */}
       <div className="aspect-[4/5] bg-black/20 flex items-center justify-center relative cursor-pointer group" onClick={onClick}>
          <img 
             src={typeof product.images?.[0] === 'string' ? product.images[0] : (product.images?.[0]?.url || "https://placehold.co/600?text=Produit+Nexo")} 
             className="w-full h-full object-cover" 
             referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 right-4 bg-brand px-3 py-1.5 rounded-xl font-black text-xs shadow-2xl text-white">
             {currencyService.formatPrice(product.price, product.countryCode || "CG")}
          </div>
       </div>

       {/* ACTIONS BAR */}
       <div className="p-2 grid grid-cols-3 gap-1 border-t border-white/5">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
            className={cn(
              "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all", 
              isLiked ? "text-brand bg-brand/5" : "text-white/40 hover:bg-white/5 hover:text-brand"
            )}
          >
             <ThumbsUp size={16} className={isLiked ? "fill-brand" : ""} /> 
             {isLiked ? "Aimé" : "J'aime"}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white/40 hover:bg-white/5 hover:text-brand transition-all"
          >
             <MessageCircle size={16} /> Avis
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white/40 hover:bg-white/5 hover:text-brand transition-all"
          >
             <Share2 size={16} /> Partager
          </button>
       </div>

       {/* MINI CTA */}
       <div className="px-2 pb-2 grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" className="bg-green-500/10 text-green-500 border-green-500/10 hover:bg-green-500 hover:text-white rounded-xl h-10" onClick={(e: any) => {
             e.stopPropagation();
             window.open(`https://wa.me/${product.whatsapp || "242060000000"}`, "_blank");
          }}>
             <Smartphone size={14} /> WhatsApp
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl h-10 text-[10px]" onClick={(e: any) => {
             e.stopPropagation();
             setActivePage("product");
             setPageData(product.id);
          }}>
             Voir Détails
          </Button>
       </div>
    </Card>
  );
};
