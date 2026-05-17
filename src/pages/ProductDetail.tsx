import { useState, useEffect } from "react";
import { dbService } from "../services/dbService.ts";
import { useNexo } from "../App.tsx";
import { Button, Card, Badge } from "../components/UI.tsx";
import { 
  Heart, 
  Share2, 
  MapPin, 
  ChevronLeft, 
  MessageCircle, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2,
  User as UserIcon,
  Star,
  ChevronRight,
  Loader2,
  Flag,
  HandCoins,
  Check,
  QrCode
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { ProductCard } from "../components/UI.tsx";
import { cn, formatDate } from "../lib/utils.ts";
import { currencyService } from "../services/geoService.ts";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase.ts";
import QRCode from "react-qr-code";

export default function ProductDetail({ id }: { id: string }) {
  const { user, profile, setActivePage, setPageData } = useNexo();
  const [product, setProduct] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [offerValue, setOfferValue] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const isOwner = user?.uid === product?.ownerId;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const p = { id: snap.id, ...snap.data() } as any;
          setProduct(p);
          
          const shopSnap = await getDoc(doc(db, "shops", p.shopId));
          if (shopSnap.exists()) setShop({ id: shopSnap.id, ...shopSnap.data() });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();

    const unsubComments = dbService.listenComments(id, (data) => {
      setComments(data);
    });
    return () => unsubComments();
  }, [id]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !user || isCommenting) return;
    setIsCommenting(true);
    try {
      await dbService.addComment(id, commentText, profile);
      setCommentText("");
    } catch (e) {
      alert("Erreur lors du commentaire");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleContact = async () => {
    if (!user) {
      setActivePage("auth");
      return;
    }
    if (!product || !shop) return;
    
    setLoading(true);
    try {
      await dbService.getOrCreateConversation([user.uid, product.ownerId]);
      setActivePage("messages");
    } catch (e) {
      alert("Erreur de messagerie");
    } finally {
      setLoading(false);
    }
  };

  const handleOffer = async () => {
    if (!user) return setActivePage("auth");
    if (!offerValue) return;
    setLoading(true);
    try {
      const convId = await dbService.getOrCreateConversation([user.uid, product.ownerId]);
      await dbService.sendMessage(convId, `[OFFRE]: Je propose ${offerValue} ${product.currency || "FCFA"} pour votre produit "${product.title}".`);
      setActivePage("messages");
    } catch (e) {
      alert("Erreur lors de l'offre");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSold = async () => {
    if (!confirm("Voulez-vous marquer ce produit comme vendu ?")) return;
    setLoading(true);
    try {
      await dbService.markAsSold(product.id);
      setProduct({ ...product, status: "sold" });
    } catch (e) {
      alert("Erreur");
    } finally {
      setLoading(false);
    }
  };

   const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Regarde ce que j'ai trouvé sur NEXO : ${product.title}`,
          url: url
        });
      } catch (e) {
        console.log("Share finished");
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Lien copié dans le presse-papier !");
    }
  };

  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  useEffect(() => {
     if (!product) return;
     const fetchSimilar = async () => {
        try {
           const prods = await dbService.getProducts();
           setSimilarProducts(prods.filter((p: any) => p.id !== product.id && p.category === product.category).slice(0, 4));
        } catch (e) { console.error(e); }
     };
     fetchSimilar();
  }, [product]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-bg"><Loader2 className="animate-spin text-brand" size={40} /></div>;
  if (!product) return <div className="p-10 text-center font-display font-black uppercase text-white/20">Produit introuvable</div>;

  return (
    <div className="flex flex-col min-h-screen bg-bg animate-fade-in relative">
      
      {/* HEADER OVERLAY */}
      <div className="h-16 fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pointer-events-none max-w-md mx-auto">
         <button className="p-2 bg-bg/40 backdrop-blur-md rounded-xl text-white pointer-events-auto" onClick={() => setActivePage("home")}>
            <ChevronLeft size={24} />
         </button>
         <div className="flex gap-2 pointer-events-auto">
            <button className="p-2 bg-bg/40 backdrop-blur-md rounded-xl text-white" onClick={() => setShowQR(true)}>
               <QrCode size={20} />
            </button>
            <button className="p-2 bg-bg/40 backdrop-blur-md rounded-xl text-white" onClick={() => dbService.toggleLike(product.id, "product")}>
               <Heart size={20} className={product.isLiked ? "fill-red-500 text-red-500" : ""} />
            </button>
            <button className="p-2 bg-bg/40 backdrop-blur-md rounded-xl text-white" onClick={handleShare}>
               <Share2 size={20} />
            </button>
         </div>
      </div>

      {/* IMAGE GALLERY */}
      <section className="relative aspect-square w-full">
         <img 
           src={typeof product.images?.[activeImg] === 'string' ? product.images[activeImg] : (product.images?.[activeImg]?.url || "https://placehold.co/600?text=Produit+Nexo")} 
           className="w-full h-full object-cover"
         />
         {product.images?.length > 1 && (
           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-bg/40 backdrop-blur-md rounded-full">
              {product.images.map((_: any, i: number) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImg(i)}
                  className={cn("w-1.5 h-1.5 rounded-full transition-all", activeImg === i ? "bg-brand w-4" : "bg-white/40")}
                />
              ))}
           </div>
         )}
      </section>

      {/* CONTENT */}
      <div className="flex-1 bg-bg -mt-8 rounded-t-[40px] p-6 flex flex-col gap-6 relative z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
         
         <div className="flex flex-col gap-2">
            <div className="flex justify-between items-start">
               <div className="flex-1 flex flex-col gap-1">
                  <h1 className="text-2xl font-black font-display tracking-tight leading-tight flex items-center gap-3">
                    {product.title}
                    {product.status === "sold" && <span className="px-2 py-0.5 bg-red-500 text-[10px] text-white rounded-md">VENDU</span>}
                    {product.whatsapp && (
                       <button 
                         onClick={() => {
                            const message = encodeURIComponent(`Bonjour ! Je vous contacte depuis NEXO concernant votre annonce : "${product.title}". Est-ce toujours disponible ?`);
                            window.open(`https://wa.me/${product.whatsapp}?text=${message}`, "_blank");
                         }}
                         className="p-1 px-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all flex items-center gap-1.5"
                       >
                          <Smartphone size={14} />
                          <span className="text-[10px] font-black">WA</span>
                       </button>
                    )}
                  </h1>
               </div>
               <div className="text-brand text-2xl font-black font-display text-right whitespace-nowrap">
                  {currencyService.formatPrice(product.price, product.countryCode || "CG")}
               </div>
            </div>
            <div className="flex items-center gap-2">
               <Badge variant="brand">{product.category}</Badge>
               <Badge>{product.condition === "new" ? "Neuf" : "Occasion"}</Badge>
               {product.isNegotiable && <Badge variant="verified">Prix Négociable</Badge>}
            </div>
            
            {/* ADAPTIVE INFO DISPLAY */}
            {(product.brand || product.model || product.memory || product.mileage || product.year || product.neighborhood || product.zone || product.documents || product.size || product.ram || product.storage) && (
               <div className="flex flex-wrap gap-2 mt-2">
                  {product.brand && <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold border border-white/5">Marque: {product.brand}</div>}
                  {product.model && <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold border border-white/5">Modèle: {product.model}</div>}
                  {product.memory && <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold border border-white/5">Mémoire: {product.memory}</div>}
                  {product.ram && <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold border border-white/5">RAM: {product.ram}</div>}
                  {product.storage && <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold border border-white/5">Stockage: {product.storage}</div>}
                  {product.year && <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold border border-white/5">Année: {product.year}</div>}
                  {product.mileage && <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold border border-white/5">Kilométrage: {product.mileage} KM</div>}
                  {product.neighborhood && <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold border border-white/5">Quartier: {product.neighborhood}</div>}
                  {product.zone && <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold border border-white/5">Zone: {product.zone}</div>}
                  {product.documents && <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold border border-white/5">Docs: {product.documents}</div>}
                  {product.size && <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold border border-white/5">Taille: {product.size}</div>}
               </div>
            )}

            <div className="flex items-center gap-1 text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">
               <MapPin size={12} />
               {product.city} • Publié {formatDate(product.createdAt)}
            </div>
         </div>

         <div className="h-[1px] bg-white/5"></div>

         <div className="flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/30">Description</h3>
            <p className="text-sm text-white/70 leading-relaxed font-medium">
               {product.description || "Aucune description fournie par le vendeur."}
            </p>
         </div>

         {/* OWNER ACTIONS */}
         {isOwner && product.status !== "sold" && (
            <div className="p-4 bg-brand/10 border border-brand/20 rounded-2xl flex flex-col gap-3">
               <div className="text-[10px] font-black uppercase tracking-widest text-brand">Gestion du Vendeur</div>
               <Button onClick={handleMarkAsSold} className="bg-brand text-white border-none" loading={loading}>
                  <Check size={18} /> Marquer comme Vendu
               </Button>
            </div>
         )}

         {/* OFFER SECTION (FOR BUYER) */}
         {!isOwner && product.status !== "sold" && product.isNegotiable && (
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-3">
               <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Négocier le prix</div>
               <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={offerValue}
                    onChange={(e) => setOfferValue(e.target.value)}
                    placeholder="Ton prix..." 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand/50"
                  />
                  <Button onClick={handleOffer} className="px-4" loading={loading}>
                     <HandCoins size={16} /> Offrir
                  </Button>
               </div>
            </div>
         )}

         {/* SHOP CARD */}
         {shop && (
           <Card 
             className="bg-white/5 border-white/5 p-4 flex items-center justify-between cursor-pointer group hover:bg-white/10"
             onClick={() => { setActivePage("shop"); setPageData(shop.slug); }}
           >
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl p-0.5 bg-brand/20">
                    <img src={shop.logoURL || "https://placehold.co/100?text=S"} className="w-full h-full object-cover rounded-xl" />
                 </div>
                 <div>
                    <div className="flex items-center gap-1 font-bold text-sm">
                       {shop.name}
                       {shop.isVerified && <CheckCircle2 size={12} className="text-blue-400" />}
                    </div>
                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Voir la boutique</div>
                 </div>
              </div>
              <ChevronRight size={20} className="text-white/20 group-hover:text-brand transition-all" />
           </Card>
         )}

         {/* TRUST BADGE */}
         <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl flex gap-3 items-center">
            <ShieldCheck className="text-green-500" size={24} />
            <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest leading-tight">
               Vérifié par NEXO
               <p className="text-white/40 mt-0.5 font-medium normal-case">Ne payez jamais avant d'avoir vu le produit.</p>
            </div>
         </div>

          {/* COMMENTS SECTION */}
          <div className="flex flex-col gap-6 py-4">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/30">Commentaires ({comments.length})</h3>
             </div>
             <div className="flex flex-col gap-4">
                {/* Add comment input if logged in */}
                {user && (
                  <div className="flex gap-3">
                     <div className="w-10 h-10 rounded-xl bg-brand/20 shrink-0 flex items-center justify-center text-brand">
                        <UserIcon size={18} />
                     </div>
                     <div className="flex-1 flex flex-col gap-2">
                        <textarea 
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand/50 resize-none h-20 font-medium"
                           placeholder="Qu'en penses-tu ? Laisse un avis..."
                           value={commentText}
                           onChange={(e) => setCommentText(e.target.value)}
                        />
                        <div className="flex justify-end">
                           <Button size="sm" onClick={handleAddComment} loading={isCommenting} disabled={!commentText.trim()}>Publier</Button>
                        </div>
                     </div>
                  </div>
                )}
 
                {/* Comments List */}
                <div className="flex flex-col gap-6 mt-2">
                   {comments.length > 0 ? comments.map((c) => (
                     <div key={c.id} className="flex gap-3 animate-fade-in group">
                        <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0 flex items-center justify-center overflow-hidden border border-white/5">
                           {c.userAvatar ? (
                             <img src={c.userAvatar} className="w-full h-full object-cover" />
                           ) : (
                             <UserIcon size={18} className="text-white/20" />
                           )}
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                           <div className="flex justify-between items-center">
                              <span className="text-sm font-bold">{c.userName}</span>
                              <span className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">
                                 {formatDate(c.createdAt)}
                              </span>
                           </div>
                           <p className="text-xs text-white/60 leading-relaxed font-normal">{c.text}</p>
                        </div>
                     </div>
                   )) : (
                     <div className="text-center py-6">
                        <p className="text-xs text-white/20 font-black uppercase tracking-widest">Aucun commentaire pour le moment</p>
                     </div>
                   )}
                </div>
             </div>
          </div>

         {/* SIMILAR PRODUCTS */}
         {similarProducts.length > 0 && (
           <div className="flex flex-col gap-6 py-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/30">Produits Similaires</h3>
              <div className="grid grid-cols-2 gap-4">
                 {similarProducts.map((p: any) => (
                   <ProductCard key={p.id} product={p} onClick={() => { setProduct(null); setLoading(true); setPageData(p.id); }} />
                 ))}
              </div>
           </div>
         )}

         <div className="flex items-center justify-between py-6 border-t border-white/5">
            <button className="flex items-center gap-2 text-[10px] font-bold text-white/20 hover:text-white transition-all uppercase tracking-widest">
               <Flag size={12} /> Signaler ce produit
            </button>
         </div>

      </div>

      {/* QR MODAL */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
             <div className="absolute inset-0 bg-bg/80 backdrop-blur-md" onClick={() => setShowQR(false)}></div>
             <Card className="relative z-10 w-full max-w-xs bg-bg border-white/10 p-8 flex flex-col items-center gap-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-brand">Partager l'Annonce</h3>
                <div className="bg-white p-4 rounded-3xl shadow-2xl">
                   <QRCode value={window.location.href} size={200} />
                </div>
                <p className="text-[10px] text-white/40 font-bold text-center uppercase tracking-widest">Scanner pour ouvrir l'annonce sur NEXO</p>
                <Button onClick={() => setShowQR(false)} variant="secondary" className="w-full">Fermer</Button>
             </Card>
          </div>
        )}
      </AnimatePresence>


      {/* ACTIONS BAR (FIXED BOTTOM) */}
      <footer className="fixed bottom-2 px-4 w-full h-20 flex gap-3 max-w-md mx-auto pointer-events-none">
         <div className="flex-1 flex gap-3 pointer-events-auto items-end pb-4 w-full">
            {!user ? (
               <Button 
                  className="flex-1 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border-white/10"
                  onClick={() => setActivePage("auth")}
               >
                  <ShieldCheck size={20} className="text-brand" />
                  <span className="flex flex-col items-start gap-0.5">
                     <span className="text-[10px] font-black uppercase opacity-50">Sécurisé</span>
                     <span className="text-xs font-bold whitespace-nowrap">Connexion requise</span>
                  </span>
               </Button>
            ) : product.whatsapp ? (
               <Button 
                  variant="secondary" 
                  className="flex-1 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border-white/10"
                  onClick={() => {
                     const message = encodeURIComponent(`Bonjour ! Je vous contacte depuis NEXO concernant votre annonce : "${product.title}" à ${currencyService.formatPrice(product.price, product.countryCode || "CG")}. Est-ce toujours disponible ?`);
                     window.open(`https://wa.me/${product.whatsapp}?text=${message}`, "_blank");
                  }}
               >
                  <Smartphone size={20} className="text-green-500" />
                  <span className="flex flex-col items-start gap-0.5">
                     <span className="text-[10px] font-black uppercase opacity-50">WhatsApp</span>
                     <span className="text-xs font-bold whitespace-nowrap">Contacter</span>
                  </span>
               </Button>
            ) : null}
            
            <Button 
               className="flex-[1.5] h-16 rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.5)]"
               icon={MessageCircle}
               onClick={handleContact}
               loading={loading}
            >
               Chat NEXO
            </Button>
         </div>
      </footer>
    </div>
  );
}
