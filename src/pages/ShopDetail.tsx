import { useState, useEffect } from "react";
import { dbService } from "../services/dbService.ts";
import { useNexo } from "../App.tsx";
import { ProductCard, Button, Badge, Card } from "../components/UI.tsx";
import { 
  CheckCircle2, 
  MapPin, 
  ChevronLeft, 
  Share2, 
  Store, 
  Users, 
  Heart,
  Briefcase,
  Star,
  Smartphone
} from "lucide-react";
import { cn } from "../lib/utils.ts";

export default function ShopDetail({ slug }: { slug: string }) {
  const { setActivePage, setPageData, user, toggleFollow, followedShopIds } = useNexo();
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingLoading, setRatingLoading] = useState(false);

  const isFollowing = shop ? followedShopIds.includes(shop.id) : false;

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const s = await dbService.getShopBySlug(slug);
        if (s) {
          setShop(s);
          const p = await dbService.getProducts({ shopId: s.id });
          setProducts(p || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchShopData();
  }, [slug, user]);

  const handleFollow = async () => {
    if (!shop) return;
    await toggleFollow(shop.id);
    // Refresh shop to update follower count visually if needed (though count is in shop object)
    const updated = await dbService.getShopBySlug(slug);
    setShop(updated);
  };

  const handleRate = async (stars: number) => {
    if (!user) {
      setActivePage("auth");
      return;
    }
    setRatingLoading(true);
    try {
       await dbService.rateShop(shop.id, stars);
       const updated = await dbService.getShopBySlug(slug);
       setShop(updated);
       alert("Merci pour ton évaluation ! 🌟");
    } catch (e) {
       console.error(e);
    } finally {
       setRatingLoading(false);
    }
  };

  if (loading) return <div className="h-screen skeleton" />;
  if (!shop) return <div className="p-10 text-center">Boutique introuvable</div>;

  return (
    <div className="flex flex-col min-h-screen bg-bg animate-fade-in relative">
      
      {/* BANNER & PROFILE */}
      <section className="relative h-48 w-full group">
         <img 
            src={shop.bannerURL || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop"} 
            className="w-full h-full object-cover"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent opacity-80"></div>
         <button className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-md rounded-xl text-white" onClick={() => setActivePage("home")}>
            <ChevronLeft size={24} />
         </button>
      </section>

      {/* SHOP INFO HEADER */}
      <div className="px-6 -mt-16 relative z-10 flex flex-col gap-4">
         <div className="flex items-end justify-between">
            <div className="w-24 h-24 rounded-[32px] p-1.5 bg-brand/30 border-4 border-bg shadow-2xl relative">
               <img src={shop.logoURL || "https://placehold.co/200?text=Shop"} className="w-full h-full object-cover rounded-[24px]" />
               {shop.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1.5 border-4 border-bg">
                    <CheckCircle2 size={14} />
                  </div>
               )}
            </div>
            <div className="flex gap-2 pb-2">
               <Button variant="secondary" size="sm" className="gap-2 px-4" onClick={async () => {
                  const url = `${window.location.origin}/shop/${shop.slug}`;
                  if (navigator.share) {
                     try {
                        await navigator.share({
                           title: shop.name,
                           text: shop.description,
                           url: url
                        });
                     } catch (e) {
                        console.log("Share ended");
                     }
                  } else {
                     navigator.clipboard.writeText(url);
                     alert("Lien de la boutique copié !");
                  }
               }}>
                  <Share2 size={16} /> Partager
               </Button>
               <Button 
                  size="sm" 
                  variant={isFollowing ? "outline" : "primary"}
                  className="gap-2 px-10" 
                  onClick={handleFollow}
               >
                  {isFollowing ? "Suivi" : "Suivre"}
               </Button>
            </div>
         </div>

         <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black font-display tracking-tight flex items-center gap-2">
               {shop.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-wider text-white/40">
               <span className="flex items-center gap-1"><MapPin size={12} className="text-brand" /> {shop.city}</span>
               <span className="flex items-center gap-1"><Briefcase size={12} className="text-brand" /> {shop.category}</span>
               <span className="flex items-center gap-1"><Users size={12} className="text-brand" /> {shop.followerCount || 0} abonnés</span>
            </div>
         </div>

         <p className="text-sm text-white/60 leading-relaxed max-w-sm">
            {shop.description || "Bienvenue dans notre boutique officielle sur NEXO. Découvrez nos produits sélectionnés avec soin."}
         </p>

         <div className="flex flex-col gap-3">
             <div className="flex gap-2">
                <div className="flex-1 bg-white/2 border border-white/5 p-3 rounded-2xl flex flex-col gap-1">
                   <div className="flex items-center gap-1.5">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span className="text-sm font-black">{shop.rating?.toFixed(1) || "5.0"}</span>
                   </div>
                   <span className="text-[8px] font-black uppercase text-white/30">{shop.reviewCount || 0} avis clients</span>
                </div>
                <Button 
                   variant="outline" 
                   size="sm" 
                   className={cn(
                      "flex-1 gap-2 border-green-500/20 bg-green-500/5 text-green-500 hover:bg-green-500 hover:text-white transition-all",
                      !user && "opacity-50 grayscale"
                   )} 
                   onClick={() => {
                      if (!user) {
                         setActivePage("auth");
                         return;
                      }
                      window.open(`https://wa.me/${shop.whatsapp}`, "_blank");
                   }}
                >
                   <Smartphone size={14} /> WhatsApp
                </Button>
             </div>

             {user && shop.ownerId !== user.uid && (
                <div className="flex flex-col gap-2 p-4 bg-white/2 border border-white/5 rounded-2xl">
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/30 text-center">Évaluer Boutique</span>
                   <div className="flex items-center justify-center gap-2">
                      {[1,2,3,4,5].map(star => (
                         <button 
                           key={star} 
                           disabled={ratingLoading}
                           onClick={() => handleRate(star)}
                           className="text-white/10 hover:text-amber-500 transition-colors"
                         >
                            <Star size={24} fill={star <= Math.round(shop.rating || 0) ? "currentColor" : "none"} className={star <= Math.round(shop.rating || 0) ? "text-amber-500" : ""} />
                         </button>
                      ))}
                   </div>
                </div>
             )}
         </div>
      </div>

      <div className="h-[1px] bg-white/5 mx-6 my-8"></div>

      {/* PRODUCTS GRID */}
      <section className="px-4 pb-20 flex flex-col gap-6">
         <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black font-display tracking-tight">Catalogue</h2>
            <select className="bg-white/5 border-none text-[10px] font-bold uppercase py-1 px-3 rounded-lg focus:outline-none">
               <option>Tous les produits</option>
               <option>Nouveautés</option>
               <option>Prix bas</option>
            </select>
         </div>

         {products.length === 0 ? (
           <div className="py-20 flex flex-col items-center justify-center gap-4 text-white/20">
              <Store size={48} />
              <p className="text-sm font-bold uppercase tracking-widest">Aucun produit publié.</p>
           </div>
         ) : (
           <div className="grid grid-cols-2 gap-4">
              {products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onClick={() => { setActivePage("product"); setPageData(product.id); }} 
                />
              ))}
           </div>
         )}
      </section>

    </div>
  );
}
