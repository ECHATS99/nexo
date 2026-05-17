import { useState, useEffect } from "react";
import { dbService } from "../services/dbService.ts";
import { useNexo } from "../App.tsx";
import { Card, Button, Badge } from "../components/UI.tsx";
import { Search, Store, MapPin, CheckCircle2, ChevronRight, TrendingUp, Star } from "lucide-react";
import { cn } from "../lib/utils.ts";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase.ts";

export default function Explore() {
  const { setActivePage, setPageData, shop: userShop } = useNexo();
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchShops = async () => {
      try {
        // Order by rating desc then createdAt desc
        const q = query(collection(db, "shops"), orderBy("rating", "desc"), orderBy("createdAt", "desc"), limit(50));
        const snap = await getDocs(q);
        setShops(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
        // Fallback if index missing
        const q2 = query(collection(db, "shops"), limit(50));
        const snap2 = await getDocs(q2);
        setShops(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const filteredShops = shops.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 py-8 px-4 lg:px-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
         <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black font-display tracking-tighter">Annuaire des Boutiques</h1>
            <p className="text-sm text-white/50">Découvre les meilleurs vendeurs vérifiés du Congo.</p>
         </div>
         {!userShop && (
           <Button className="rounded-2xl px-6 py-4 shadow-xl" onClick={() => setActivePage("profile")}>
              Créer ma Boutique
           </Button>
         )}
      </div>

      <div className="relative group">
         <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une boutique par nom ou catégorie..." 
            className="w-full bg-white/5 border border-white/10 rounded-3xl px-14 py-5 text-sm font-bold focus:outline-none focus:border-brand/50 focus:bg-white/10 transition-all shadow-2xl"
         />
         <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand" size={20} />
      </div>

      {/* FILTRES RAPIDES */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
         {["Tout", "Téléphones", "Auto", "Immo", "Luxe", "Services", "Autre"].map(f => (
            <button key={f} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-brand/10 hover:text-brand transition-all whitespace-nowrap">
               {f}
            </button>
         ))}
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Boutiques à la une</h3>
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-32 skeleton rounded-3xl" />)
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredShops.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-white/20">
                 <Store size={48} />
                 <p className="text-sm font-bold uppercase tracking-widest">Aucune boutique trouvée.</p>
              </div>
            ) : (
              filteredShops.map(shop => (
                <Card 
                  key={shop.id} 
                  className="p-5 flex items-center justify-between group cursor-pointer hover:border-brand/30 transition-all active:scale-[0.98] bg-white/2 border-white/5 shadow-xl"
                  onClick={() => { setActivePage("shop"); setPageData(shop.slug); }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                     <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-3xl bg-brand/20 p-0.5 overflow-hidden border border-brand/20 shadow-2xl">
                           <img 
                             src={shop.logoURL || `https://ui-avatars.com/api/?name=${shop.name}&background=7c3aed&color=fff`} 
                             className="w-full h-full object-cover rounded-[22px]"
                             alt={shop.name}
                           />
                        </div>
                        {shop.isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-2 border-4 border-bg shadow-lg">
                            <CheckCircle2 size={12} />
                          </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <h3 className="font-black font-display tracking-tight text-white group-hover:text-brand transition-colors truncate text-lg">
                              {shop.name}
                           </h3>
                        </div>
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                              <Badge variant="brand">{shop.category}</Badge>
                              <span className="flex items-center gap-1">
                                <MapPin size={10} /> {shop.city}
                              </span>
                           </div>
                           <p className="text-[10px] text-white/40 italic flex items-center gap-1 mt-1 font-bold">
                             <TrendingUp size={10} className="text-brand" /> {shop.followerCount || 0} abonnés 
                           </p>
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <button className="p-2.5 rounded-xl bg-brand/10 text-brand hover:bg-brand hover:text-white transition-all shadow-lg">
                        <ChevronRight size={18} />
                     </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
