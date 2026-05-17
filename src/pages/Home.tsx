import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { dbService } from "../services/dbService.ts";
import { ProductCard, Card, Badge, Button, FeedCard } from "../components/UI.tsx";
import { useNexo } from "../App.tsx";
import { Sparkles, TrendingUp, Search, Filter, PlusSquare, MapPin, Zap, Store, CheckCircle2, Users, X, Heart } from "lucide-react";
import { currencyService } from "../services/geoService.ts";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "../lib/firebase.ts";

const NEXO_MSGS = [
  "NEXO : L'écosystème mondial dans votre poche. 🌍",
  "Boostez vos ventes avec NEXO Premium. ✨",
  "Nouveau : Payez en toute sécurité avec NEXO Pay. 💳",
  "Go IA : Votre assistant shopping intelligent. ✦",
  "Découvrez les boutiques vérifiées du Congo. ✅"
];

function VerticalBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % NEXO_MSGS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-8 bg-brand flex items-center justify-center overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
           key={index}
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: -20, opacity: 0 }}
           transition={{ duration: 0.5 }}
           className="flex items-center gap-2"
        >
           <Zap size={10} className="text-white fill-white" />
           <span className="text-[10px] font-black uppercase tracking-widest text-white">{NEXO_MSGS[index]}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const { setActivePage, setPageData, geo, profile, shop: userShop, followedShopIds, toggleFollow } = useNexo();
  const [products, setProducts] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ userCount: 1542, shopCount: 84 });
  const [selectedStatus, setSelectedStatus] = useState<any>(null);

  useEffect(() => {
    // REAL-TIME PRODUCTS
    const unsubProds = dbService.listenProducts({}, (data) => {
      setProducts(data);
      setLoading(false);
    });

    // REAL-TIME SHOPS
    const unsubShops = dbService.listenShops((data) => {
      setShops(data);
    });

    // REAL-TIME STATS
    const unsubStats = dbService.listenGlobalStats((data) => {
      if (data) setStats(data);
    });

    // REAL-TIME STATUSES
    const unsubStatuses = dbService.listenStatuses((data) => {
      setStatuses(data);
    });

    return () => {
      unsubProds();
      unsubShops();
      unsubStats();
      unsubStatuses();
    };
  }, []);

  // Filter statuses: must be < 24h AND from a followed shop (if user logged in)
  const activeStatuses = statuses.filter(s => {
    if (!s.createdAt) return true;
    const date = s.createdAt.toDate();
    const now = new Date();
    const isRecent = (now.getTime() - date.getTime()) < 24 * 60 * 60 * 1000;
    
    if (!isRecent) return false;
    
    // If not logged in, show all recent
    if (!profile) return true;
    
    // Show user's own shop statuses
    if (userShop && s.shopId === userShop.id) return true;

    // Show only followed shop statuses
    return followedShopIds.includes(s.shopId);
  });

  // Group statuses by shop
  const groupedStatuses = activeStatuses.reduce((acc: any, s: any) => {
    if (!acc[s.shopId]) {
      const shop = shops.find(sh => sh.id === s.shopId);
      acc[s.shopId] = {
        shopId: s.shopId,
        shopName: shop?.name || "Boutique",
        shopLogo: shop?.logoURL || "",
        isVerified: shop?.isVerified || false,
        rating: shop?.rating || 0,
        items: []
      };
    }
    acc[s.shopId].items.push(s);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-8 py-8 animate-fade-in relative pt-0">
      <VerticalBanner />
      
      {/* SECTION: STATS BAR */}
      <div className="px-4 lg:px-8 grid grid-cols-2 gap-4 -mt-4">
         <Card className="bg-white/2 border-white/5 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
               <Users size={20} />
            </div>
            <div>
               <div className="text-xl font-black font-display leading-none">{stats.userCount?.toLocaleString()}</div>
               <div className="text-[8px] font-bold uppercase tracking-widest text-white/30">Membres Nexo</div>
            </div>
         </Card>
         <Card className="bg-white/2 border-white/5 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
               <Store size={20} />
            </div>
            <div>
               <div className="text-xl font-black font-display leading-none">{stats.shopCount?.toLocaleString()}</div>
               <div className="text-[8px] font-bold uppercase tracking-widest text-white/30">Boutiques Actives</div>
            </div>
         </Card>
      </div>
      
      {/* SECTION: STATUSES (STORIES) */}
      <section className="flex flex-col gap-4 px-4 lg:px-8 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
            <Sparkles size={16} className="text-brand" /> Direct Vendeurs
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
           {/* MY STORY (IF SHOP) */}
           {userShop && (
             <div className="flex flex-col items-center gap-2 shrink-0" onClick={() => setActivePage("publish")}>
                <div className="w-16 h-16 rounded-[24px] bg-white/2 border-2 border-dashed border-white/20 flex items-center justify-center p-1 group cursor-pointer hover:border-brand transition-all">
                   <div className="w-full h-full rounded-[18px] bg-white/5 flex items-center justify-center group-hover:bg-brand/10">
                      <PlusSquare size={20} className="text-white/20 group-hover:text-brand" />
                   </div>
                </div>
                <span className="text-[10px] font-bold text-white/30 tracking-tight">Ajouter</span>
             </div>
           )}

          {loading ? (
             [1,2,3,4,5,6].map(i => <div key={i} className="w-16 h-16 rounded-[24px] skeleton shrink-0" />)
          ) : (
            <>
              {Object.values(groupedStatuses).map((group: any) => (
                <div 
                  key={group.shopId} 
                  className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
                  onClick={() => setSelectedStatus(group)}
                >
                   <div className="w-16 h-16 rounded-[24px] p-1 bg-gradient-to-tr from-brand to-pink-500 shadow-lg shadow-brand/20 group-hover:scale-105 transition-all">
                      <div className="w-full h-full rounded-[18px] border-2 border-bg overflow-hidden relative">
                         <img src={group.shopLogo || `https://ui-avatars.com/api/?name=${group.shopName}&background=111&color=fff`} className="w-full h-full object-cover" />
                         {group.items.length > 1 && (
                            <div className="absolute top-1 right-1 bg-brand text-[8px] font-black px-1.5 rounded-full border border-bg">
                               {group.items.length}
                            </div>
                         )}
                      </div>
                   </div>
                   <span className="text-[10px] font-bold text-white/60 tracking-tight text-center truncate w-16">{group.shopName}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* STATUS VIEWER OVERLAY */}
      <AnimatePresence>
         {selectedStatus && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 lg:p-20"
           >
              <div className="relative w-full max-w-sm aspect-[9/16] bg-bg rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                 <img src={typeof selectedStatus.items[0].imageURL === 'string' ? selectedStatus.items[0].imageURL : (selectedStatus.items[0].imageURL?.url || "")} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"></div>
                 
                 <div className="absolute top-0 left-0 right-0 p-6 flex flex-col gap-4">
                    <div className="flex gap-1">
                       {selectedStatus.items.map((_: any, i: number) => (
                          <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: "100%" }}
                               transition={{ duration: 5 }}
                               onAnimationComplete={() => setSelectedStatus(null)}
                               className="h-full bg-brand"
                             />
                          </div>
                       ))}
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <img src={selectedStatus.shopLogo} className="w-8 h-8 rounded-lg border-2 border-brand" />
                          <span className="font-bold text-sm">{selectedStatus.shopName}</span>
                       </div>
                       <button onClick={() => setSelectedStatus(null)} className="p-2 text-white/60"><X size={20}/></button>
                    </div>
                 </div>

                 <div className="absolute bottom-10 left-0 right-0 p-8 text-center">
                    <p className="text-lg font-bold drop-shadow-lg">{selectedStatus.items[0].text}</p>
                    <Button variant="primary" className="mt-6 w-full py-4 rounded-2xl" onClick={() => { setActivePage("shop"); setPageData(shops.find(s => s.id === selectedStatus.shopId)?.slug); setSelectedStatus(null); }}>
                       Visiter la boutique
                    </Button>
                 </div>
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      {/* SECTION: HERO */}
      <div className="px-4 lg:px-8">
        <Card className="bg-gradient-to-br from-[#0a0a14] to-brand/10 border-white/5 p-8 text-white overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
           <div className="flex flex-col gap-3 relative z-10">
              <div className="flex items-center gap-2 px-3 py-1 bg-brand/10 border border-brand/20 rounded-full w-fit">
                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand">Nouveauté Mondiale</span>
              </div>
              <h3 className="text-3xl lg:text-5xl font-black font-display leading-[0.9] tracking-tighter italic">L'Élite du Marché local & Global.</h3>
              <p className="text-sm text-white/40 font-medium max-w-sm">Achète, vends et échange en toute sécurité avec l'assistance IA Go.</p>
           </div>
           
           <div className="mt-10 relative z-10 group/search">
              <input 
                placeholder="Chercher iPhone, Maison, Voiture..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-5 text-sm placeholder:text-white/20 focus:outline-none focus:border-brand/40 focus:bg-white/10 transition-all font-bold shadow-2xl"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/search:text-brand" size={20} />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-brand text-white rounded-xl shadow-lg shadow-brand/20">
                 <Search size={18} />
              </button>
           </div>
        </Card>
      </div>

      {/* SECTION: BOUTIQUES SUGGÉRÉES */}
      <section className="flex flex-col gap-6 px-4 lg:px-8 bg-brand/5 py-8 border-y border-brand/10">
        <div className="flex items-center justify-between">
           <h2 className="text-2xl font-display font-black tracking-tighter flex items-center gap-2">
             <Store size={24} className="text-brand" />
             Boutiques certifiées
           </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {shops.map(shop => {
                const isUserShop = userShop && shop.id === userShop.id;
                const isFollowing = followedShopIds.includes(shop.id);
                
                return (
                  <div 
                    key={shop.id} 
                    className="w-72 shrink-0 bg-bg/50 border border-white/5 dark:border-white/5 rounded-3xl p-6 flex flex-col items-center gap-4 hover:border-brand/30 transition-all cursor-pointer group relative overflow-hidden"
                  >
                     <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); toggleFollow(shop.id); }}>
                        <Heart size={18} className={isFollowing ? "fill-red-500 text-red-500" : "text-white"} />
                     </div>
                     <div className="w-20 h-20 rounded-[32px] p-0.5 bg-brand/20" onClick={() => { setActivePage("shop"); setPageData(shop.slug); }}>
                        <img src={shop.logoURL || `https://ui-avatars.com/api/?name=${shop.name}&background=111&color=fff`} className="w-full h-full object-cover rounded-[28px]" />
                     </div>
                     <div className="text-center" onClick={() => { setActivePage("shop"); setPageData(shop.slug); }}>
                        <div className="flex items-center justify-center gap-1 font-bold text-sm">
                           {shop.name}
                           {shop.isVerified && <CheckCircle2 size={12} className="text-blue-400" />}
                        </div>
                        <p className="text-[10px] text-white/30 font-medium line-clamp-2 mt-1 px-2 h-10">
                           {shop.description || "Pas encore de description pour cette boutique."}
                        </p>
                        <div className="text-[10px] text-brand font-black uppercase tracking-widest mt-2">{shop.city} • {shop.followerCount || 0} Abonnés</div>
                     </div>
                     <div className="w-full flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 rounded-xl text-[10px]" onClick={() => { setActivePage("shop"); setPageData(shop.slug); }}>Visiter</Button>
                        {!isUserShop && (
                          <Button 
                            variant={isFollowing ? "secondary" : "brand"} 
                            size="sm" 
                            className="flex-1 rounded-xl text-[10px]"
                            onClick={(e) => { e.stopPropagation(); toggleFollow(shop.id); }}
                          >
                            {isFollowing ? "Suivi" : "Suivre"}
                          </Button>
                        )}
                     </div>
                  </div>
                );
              })}
        </div>
      </section>

      {/* SECTION: PRÈS DE TOI */}


      <section className="flex flex-col gap-6 px-4 lg:px-8 bg-white/2 py-8 border-y border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
             <h2 className="text-2xl font-display font-black tracking-tighter flex items-center gap-2">
               <MapPin size={24} className="text-brand" />
               À proximité de toi
             </h2>
             <div className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse"></span>
                {geo?.city || "Ta Ville"}, {geo?.country_name || "Ton Pays"}
             </div>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
           {loading ? (
             [1,2,3,4].map(i => <div key={i} className="w-64 aspect-[4/5] skeleton rounded-[32px] shrink-0" />)
           ) : (
             products.slice(0, 8).map(product => (
               <div key={product.id} className="w-64 shrink-0">
                 <ProductCard product={product} onClick={() => { setActivePage("product"); setPageData(product.id); }} />
               </div>
             ))
           )}
        </div>
      </section>

      {/* SECTION: TENDANCES */}
      <section className="flex flex-col gap-6 px-4 lg:px-8">
        <div className="flex items-center justify-between">
           <h2 className="text-2xl font-display font-black tracking-tighter flex items-center gap-2">
             <TrendingUp size={24} className="text-brand" />
             Fil d'actualité
           </h2>
        </div>

        <div className="flex flex-col gap-0 max-w-lg mx-auto w-full">
           {loading ? (
             [1,2,3].map(i => <div key={i} className="w-full aspect-[4/5] skeleton rounded-3xl mb-6" />)
           ) : (
             products.map(product => (
               <FeedCard key={product.id} product={product} onClick={() => { setActivePage("product"); setPageData(product.id); }} />
             ))
           )}
        </div>
      </section>
    </div>
  );
}
