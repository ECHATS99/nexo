import { useState } from "react";
import { useNexo } from "../App.tsx";
import { dbService } from "../services/dbService.ts";
import { storageService } from "../services/storageService.ts";
import { Button, Input, Card, Badge } from "../components/UI.tsx";
import { 
  Plus, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  MapPin, 
  ShoppingBag,
  Clock,
  X,
  Crown,
  Sparkles
} from "lucide-react";
import { cn } from "../lib/utils.ts";
import { geminiService } from "../services/geminiService.ts";

export default function Publish() {
  const { profile, shop, setActivePage } = useNexo();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<"product" | "status">("product");

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Téléphones",
    condition: "new",
    city: profile?.city || "Brazzaville",
    isNegotiable: true,
    whatsapp: profile?.phone || "",
    fb: "",
    images: [] as File[],
    // Adaptive fields
    brand: "",
    model: "",
    memory: "",
    mileage: "",
    year: "",
    neighborhood: "",
    zone: "",
    documents: "",
    size: "",
    ram: "",
    storage: "",
  });

  const categories = [
    { name: "Téléphones", icon: "📱", fields: ["brand", "memory"] },
    { name: "Informatique", icon: "💻", fields: ["brand", "ram", "storage"] },
    { name: "Voitures", icon: "🚗", fields: ["brand", "model", "year", "mileage"] },
    { name: "Immobilier", icon: "🏠", fields: ["neighborhood", "zone", "documents"] },
    { name: "Mode", icon: "👕", fields: ["size"] },
    { name: "Maison", icon: "🪑", fields: [] },
    { name: "Services", icon: "🛠️", fields: [] },
    { name: "Emplois", icon: "💼", fields: [] },
    { name: "Autre", icon: "✨", fields: [] },
  ];

  const currentCategory = categories.find(c => c.name === form.category) || categories[0];

  const [statusForm, setStatusForm] = useState({
    text: "",
    image: null as File | null
  });

  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, status: "" });

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) {
      alert("Tu dois d'abord créer une boutique dans ton profil !");
      setActivePage("profile");
      return;
    }

    if (form.images.length === 0) {
      alert("Ajoute au moins une photo !");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload images sequentially with progress
      const imageUrls: any[] = [];
      setUploadProgress({ current: 0, total: form.images.length, status: "Démarrage..." });

      for (let i = 0; i < form.images.length; i++) {
        setUploadProgress(prev => ({ ...prev, current: i + 1, status: `Upload Image ${i + 1}/${form.images.length}` }));
        const result = await storageService.uploadProductImage(shop.id, form.images[i]);
        imageUrls.push(result);
      }

      setUploadProgress(prev => ({ ...prev, status: "Enregistrement du produit..." }));

      // 2. Save product
      await dbService.createProduct({
        ...form,
        price: parseFloat(form.price),
        images: imageUrls,
        shopId: shop.id,
        shopName: shop.name,
        shopLogo: shop.logoURL || "",
        shopSlug: shop.slug,
        shopRating: shop.rating || 0,
        isVerified: shop.isVerified || false,
        whatsapp: form.whatsapp || shop.whatsapp || ""
      }, profile);

      setSuccess(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
      setUploadProgress({ current: 0, total: 0, status: "" });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file => {
        if (file.size > 32 * 1024 * 1024) {
          alert(`L'image ${file.name} est trop lourde (Max 32Mo)`);
          return false;
        }
        return true;
      });
      setForm(prev => ({ ...prev, images: [...prev.images, ...files].slice(0, 5) }));
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) {
      alert("Tu dois d'abord créer une boutique !");
      setActivePage("profile");
      return;
    }
    if (!statusForm.image) {
      alert("Ajoute une photo pour ton statut !");
      return;
    }

    setLoading(true);
    setUploadProgress({ current: 0, total: 1, status: "Upload de la photo..." });
    try {
      const data = await storageService.uploadFile(statusForm.image);
      setUploadProgress(prev => ({ ...prev, current: 1, status: "Enregistrement..." }));
      await dbService.createStatus({
        shopId: shop.id,
        text: statusForm.text,
        imageURL: data.url
      });
      setSuccess(true);
    } catch (e: any) {
      alert("Erreur publication statut : " + e.message);
    } finally {
      setLoading(false);
      setUploadProgress({ current: 0, total: 0, status: "" });
    }
  };

  const handleStatusImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.size > 32 * 1024 * 1024) {
        alert("Image trop lourde (Max 32Mo)");
        return;
      }
      setStatusForm({ ...statusForm, image: file });
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  if (success) {
    // Redirige automatiquement vers l'accueil après 3 secondes
    setTimeout(() => {
      setActivePage("home");
    }, 3000);

    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-2xl font-black font-display mb-2">Publié avec succès !</h2>
        <p className="text-sm text-white/50 mb-8 max-w-[250px]">Ton produit est maintenant visible par toute la communauté NEXO.</p>
        <Button className="w-full" onClick={() => setActivePage("home")}>Retour à l'accueil</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-4 animate-fade-in">
      
      {/* MODE TOGGLE */}
      <section className="flex gap-2 p-1 bg-white/5 rounded-2xl">
         <button 
           onClick={() => setMode("product")}
           className={cn(
             "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
             mode === "product" ? "bg-brand text-white shadow-lg" : "text-white/40 hover:text-white"
           )}
         >
           <ShoppingBag size={14} /> Produit
         </button>
         <button 
           onClick={() => setMode("status")}
           className={cn(
             "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
             mode === "status" ? "bg-brand text-white shadow-lg" : "text-white/40 hover:text-white"
           )}
         >
           <Clock size={14} /> Statut 24h
         </button>
      </section>

      {mode === "product" ? (
        <form onSubmit={handleSubmitProduct} className="flex flex-col gap-6">
          
          {/* IMAGE UPLOADER */}
          <section className="flex flex-col gap-3">
             <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1">Photos (Max 5)</label>
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {form.images.map((img, i) => (
                  <div key={i} className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden relative group">
                     <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" />
                     <button 
                       type="button"
                       onClick={() => removeImage(i)}
                       className="absolute top-1 right-1 bg-black/50 p-1 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <X size={14} />
                     </button>
                  </div>
                ))}
                {form.images.length < 5 && (
                  <label className="w-24 h-24 shrink-0 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-white/20 hover:border-brand cursor-pointer transition-colors bg-white/2">
                    <Plus size={24} />
                    <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Ajouter</span>
                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
                  </label>
                )}
             </div>
          </section>

          <Card className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
               <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1">Catégorie</label>
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map(cat => (
                    <button 
                      key={cat.name}
                      type="button"
                      onClick={() => setForm({...form, category: cat.name})}
                      className={cn(
                        "shrink-0 flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all min-w-[80px]",
                        form.category === cat.name ? "bg-brand/10 border-brand text-brand" : "bg-white/2 border-white/5 text-white/40"
                      )}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-[10px] font-bold whitespace-nowrap">{cat.name}</span>
                    </button>
                  ))}
               </div>
            </div>

            {/* DYNAMIC FIELDS */}
            {currentCategory.fields.length > 0 && (
               <div className="grid grid-cols-2 gap-4 animate-scale-in">
                  {currentCategory.fields.includes("brand") && (
                    <Input label="Marque" placeholder="Ex: Apple, Toyota..." value={form.brand} onChange={(e: any) => setForm({...form, brand: e.target.value})} />
                  )}
                  {currentCategory.fields.includes("model") && (
                    <Input label="Modèle" placeholder="Ex: RAV4, S23..." value={form.model} onChange={(e: any) => setForm({...form, model: e.target.value})} />
                  )}
                  {currentCategory.fields.includes("memory") && (
                    <Input label="Mémoire" placeholder="Ex: 128GB, 256GB..." value={form.memory} onChange={(e: any) => setForm({...form, memory: e.target.value})} />
                  )}
                  {currentCategory.fields.includes("year") && (
                    <Input label="Année" placeholder="Ex: 2022" type="number" value={form.year} onChange={(e: any) => setForm({...form, year: e.target.value})} />
                  )}
                   {currentCategory.fields.includes("mileage") && (
                    <Input label="Kilométrage" placeholder="Ex: 45000 KM" value={form.mileage} onChange={(e: any) => setForm({...form, mileage: e.target.value})} />
                  )}
                  {currentCategory.fields.includes("neighborhood") && (
                    <Input label="Quartier" placeholder="Ex: Ouenzé, Poto-Poto" value={form.neighborhood} onChange={(e: any) => setForm({...form, neighborhood: e.target.value})} />
                  )}
                   {currentCategory.fields.includes("zone") && (
                    <Input label="Zone / Secteur" placeholder="Ex: Secteur 4" value={form.zone} onChange={(e: any) => setForm({...form, zone: e.target.value})} />
                  )}
                  {currentCategory.fields.includes("documents") && (
                    <Input label="Documents" placeholder="Ex: Titre foncier, Acte de vente" value={form.documents} onChange={(e: any) => setForm({...form, documents: e.target.value})} />
                  )}
                  {currentCategory.fields.includes("size") && (
                    <Input label="Taille / Pointure" placeholder="Ex: XL, 42" value={form.size} onChange={(e: any) => setForm({...form, size: e.target.value})} />
                  )}
                   {currentCategory.fields.includes("ram") && (
                    <Input label="Mémoire RAM" placeholder="Ex: 16GB" value={form.ram} onChange={(e: any) => setForm({...form, ram: e.target.value})} />
                  )}
                  {currentCategory.fields.includes("storage") && (
                    <Input label="Stockage" placeholder="Ex: 512GB SSD" value={form.storage} onChange={(e: any) => setForm({...form, storage: e.target.value})} />
                  )}
               </div>
            )}

            <Input 
              label="Titre de l'annonce" 
              placeholder="Ex: iPhone 15 Pro Max 256GB" 
              required
              value={form.title}
              onChange={(e: any) => setForm({...form, title: e.target.value})}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Prix (FCFA)" 
                placeholder="Ex: 850000" 
                type="number"
                required
                icon={DollarSign}
                value={form.price}
                onChange={(e: any) => setForm({...form, price: e.target.value})}
              />
              <Input 
                label="Ville" 
                placeholder="Brazzaville" 
                icon={MapPin}
                required
                value={form.city}
                onChange={(e: any) => setForm({...form, city: e.target.value})}
              />
            </div>

            <div className="flex flex-col gap-1.5">
               <div className="flex items-center justify-between pl-1">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Description</label>
                  <button 
                    type="button"
                    disabled={!form.title || loading}
                    onClick={async () => {
                       setLoading(true);
                       try {
                          const res = await geminiService.chat(`Génère une description de vente concise et attractive (max 100 mots) pour ce produit NEXO : "${form.title}".`, [], { country: profile?.country, city: form.city });
                          setForm({...form, description: res});
                       } catch (e) {
                          alert("Erreur IA");
                       } finally {
                          setLoading(false);
                       }
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-brand bg-brand/10 px-3 py-1 rounded-full hover:bg-brand hover:text-white transition-all disabled:opacity-50"
                  >
                     <Sparkles size={12} /> Générer avec Go
                  </button>
               </div>
               <textarea 
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50 resize-none font-medium leading-relaxed"
                  placeholder="Décrivez l'état, les accessoires, etc..."
                  value={form.description}
                  onChange={(e: any) => setForm({...form, description: e.target.value})}
               />
            </div>

            <div className="flex flex-col gap-1.5">
               <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1">Condition</label>
               <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setForm({...form, condition: "new"})}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-bold border transition-all",
                      form.condition === "new" ? "bg-brand/10 border-brand text-brand" : "bg-white/2 border-white/5 text-white/40"
                    )}
                  >NEUF</button>
                  <button 
                    type="button"
                    onClick={() => setForm({...form, condition: "used"})}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-bold border transition-all",
                      form.condition === "used" ? "bg-brand/10 border-brand text-brand" : "bg-white/2 border-white/5 text-white/40"
                    )}
                  >OCCASION</button>
               </div>
            </div>
          </Card>

          {profile?.plan === "basic" && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
               <AlertCircle className="text-amber-500 shrink-0" size={20} />
               <div>
                  <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Attention</div>
                  <p className="text-[11px] text-amber-500/80 font-bold leading-tight">Plan Basic : Limite de 5 produits. Passe en Premium pour en publier 50 !</p>
               </div>
            </div>
          )}

          {loading && uploadProgress.total > 0 && (
            <div className="flex flex-col gap-2 p-4 bg-brand/5 border border-brand/20 rounded-2xl animate-fade-in">
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-brand">
                  <span>{uploadProgress.status}</span>
                  <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
               </div>
               <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand transition-all duration-500" 
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
               </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="h-14 w-full" 
            loading={loading}
            icon={Plus}
          >
            Publier mon Annonce
          </Button>

        </form>
      ) : (
        <div className="flex flex-col gap-6 h-[50vh] items-center justify-center text-center">
           {profile?.plan === "basic" ? (
             <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/10">
                   <Clock size={40} />
                </div>
                <div>
                   <h3 className="font-bold text-lg">Statuts 24h Réservés</h3>
                   <p className="text-sm text-white/40 max-w-[250px] mx-auto mt-2">Les statuts sont disponibles uniquement pour les membres <b>Premium</b> et <b>NEXO ∞</b>.</p>
                </div>
                <Button variant="outline" className="gap-2">
                   <Crown size={16} className="text-amber-500" /> Passer en Premium
                </Button>
             </div>
           ) : (
             <form onSubmit={handleStatusSubmit} className="w-full flex flex-col gap-6">
                <Card className="flex flex-col items-center gap-4 py-12 border-dashed border-brand/50 relative overflow-hidden">
                   {statusForm.image ? (
                        <div className="absolute inset-0 group">
                           <img src={URL.createObjectURL(statusForm.image)} className="w-full h-full object-cover opacity-50" />
                           <button 
                             type="button"
                             onClick={(e) => { e.preventDefault(); setStatusForm({...statusForm, image: null}); }}
                             className="absolute top-2 right-2 bg-black/50 p-2 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <X size={20} />
                           </button>
                        </div>
                   ) : (
                      <Upload size={32} className="text-brand" />
                   )}
                   <div className="relative z-10 text-lg font-bold">{statusForm.image ? "Photo sélectionnée" : "Upload une photo"}</div>
                   <input type="file" className="hidden" id="status-file" accept="image/*" onChange={handleStatusImageChange} />
                   <label htmlFor="status-file" className="relative z-10 bg-brand px-6 py-2 rounded-xl font-bold cursor-pointer hover:scale-105 transition-transform flex items-center gap-2">
                      {statusForm.image ? "Changer" : "Choisir Image"}
                   </label>
                </Card>
                <Input 
                  label="Texte sur ton statut" 
                  placeholder="Un message pour tes clients ?" 
                  value={statusForm.text}
                  onChange={(e: any) => setStatusForm({...statusForm, text: e.target.value})}
                />
                
                {loading && mode === "status" && uploadProgress.total > 0 && (
                  <div className="flex flex-col gap-2 p-4 bg-brand/5 border border-brand/20 rounded-2xl animate-fade-in">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-brand">
                        <span>{uploadProgress.status}</span>
                        <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand transition-all duration-500" 
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full py-4" loading={loading}>Publier mon Statut</Button>
              </form>
           )}
        </div>
      )}
    </div>
  );
}
