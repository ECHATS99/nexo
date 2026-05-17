import { useState, useEffect } from "react";
import { useNexo } from "../App.tsx";
import { authService } from "../services/authService.ts";
import { dbService } from "../services/dbService.ts";
import { storageService } from "../services/storageService.ts";
import { Button, Input, Card, Badge } from "../components/UI.tsx";
import { 
  User as UserIcon, 
  Store, 
  Settings, 
  LogOut, 
  Camera, 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck, 
  Crown,
  LayoutDashboard,
  X
} from "lucide-react";
import { cn } from "../lib/utils.ts";

export default function Profile() {
  const { profile, shop, setActivePage, refreshProfile } = useNexo();
  const [loading, setLoading] = useState(false);
  const [editingShop, setEditingShop] = useState(false);

  const [shopForm, setShopForm] = useState({
    name: "",
    description: "",
    category: "Téléphones",
    city: "Brazzaville",
    whatsapp: "",
    phone: "",
    logoURL: "",
    bannerURL: ""
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);

  useEffect(() => {
    if (shop) {
      setShopForm({
        name: shop.name || "",
        description: shop.description || "",
        category: shop.category || "Téléphones",
        city: shop.city || "Brazzaville",
        whatsapp: shop.whatsapp || "",
        phone: shop.phone || "",
        logoURL: shop.logoURL || "",
        bannerURL: shop.bannerURL || ""
      });
    }
  }, [shop]);

  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    const fetchShopItems = async () => {
      if (shop) {
        const items = await dbService.getProducts({ shopId: shop.id });
        setProductCount(items?.length || 0);
      }
    };
    fetchShopItems();
  }, [shop]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/"; // Force redirect and reload
    } catch (e: any) {
      console.error("Logout failed:", e);
      alert("Erreur lors de la déconnexion");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfilePhoto = async (file: File) => {
    if (loading) return;
    setLoading(true);
    try {
      if (file.size > 32 * 1024 * 1024) throw new Error("Image trop lourde (Max 32Mo)");
      const url = await storageService.uploadProfilePhoto(profile!.uid, file);
      await authService.syncUser({ ...profile, photoURL: url } as any);
      await refreshProfile();
      alert("✓ Photo de profil mise à jour !");
    } catch (e: any) {
      console.error("Upload error:", e);
      alert("Erreur: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!shopForm.name.trim()) return alert("Le nom de la boutique est requis");

    setLoading(true);
    try {
      let finalLogoURL = shopForm.logoURL;
      let finalBannerURL = shopForm.bannerURL;

      if (logoFile) {
        if (logoFile.size > 32 * 1024 * 1024) throw new Error("Logo trop lourd (Max 32Mo)");
        finalLogoURL = await storageService.uploadShopLogo(shop?.id || "new", logoFile);
      }

      if (bannerFile) {
        if (bannerFile.size > 32 * 1024 * 1024) throw new Error("Bannière trop lourde (Max 32Mo)");
        const res = await storageService.uploadFile(bannerFile);
        finalBannerURL = res.url;
      }

      const finalData = { 
        ...shopForm, 
        logoURL: finalLogoURL,
        bannerURL: finalBannerURL,
        updatedAt: new Date()
      };

      if (shop) {
        await dbService.updateShop(shop.id, finalData);
      } else {
        await dbService.createShop(finalData, profile);
      }
      await refreshProfile();
      setEditingShop(false);
      setLogoFile(null);
      alert("✓ Boutique enregistrée avec succès !");
    } catch (e: any) {
      console.error("Shop operation error:", e);
      alert("Erreur: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6 py-6 px-4 animate-fade-in">
      
      {/* HEADER SECTION */}
      <section className="flex flex-col items-center gap-4 py-4 pt-10">
        <div className="relative group">
          <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-brand/20 p-1 bg-gradient-to-tr from-brand to-pink-500 shadow-2xl shadow-brand/20">
             <img 
               src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}&background=7c3aed&color=fff`} 
               className="w-full h-full object-cover rounded-[32px] border-2 border-bg"
               alt={profile.displayName}
             />
          </div>
          <label className="absolute -bottom-2 -right-2 bg-brand text-white p-3 rounded-2xl shadow-lg border-4 border-bg hover:scale-110 transition-all cursor-pointer">
            <Camera size={18} />
            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
              if (e.target.files?.[0]) handleUpdateProfilePhoto(e.target.files[0]);
            }} />
          </label>
        </div>
        <div className="text-center flex flex-col items-center gap-1">
          <h1 className="text-3xl font-black font-display tracking-tighter leading-none">{profile.displayName} {profile.flag}</h1>
          <p className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">{profile.city}, {profile.country}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant={profile.plan === "basic" ? "default" : profile.plan === "premium" ? "premium" : "brand"}>
               Plan {profile.plan.toUpperCase()}
            </Badge>
            {profile.isAdmin && <Badge variant="verified" className="bg-blue-500/10 text-blue-400 border-blue-500/20"><ShieldCheck size={10} className="mr-1" /> Admin</Badge>}
          </div>
        </div>
      </section>

      {/* QUICK STATS */}
      <div className="grid grid-cols-3 gap-3 px-2">
         <div className="flex flex-col items-center p-3 rounded-2xl bg-white/2 border border-white/5">
            <span className="text-xl font-black font-display">12</span>
            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Produits</span>
         </div>
         <div className="flex flex-col items-center p-3 rounded-2xl bg-white/2 border border-white/5">
            <span className="text-xl font-black font-display">84</span>
            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Followers</span>
         </div>
         <div className="flex flex-col items-center p-3 rounded-2xl bg-white/2 border border-white/5">
            <span className="text-xl font-black font-display">256</span>
            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Likes</span>
         </div>
      </div>

      {/* SHOP STATUS SECTION */}
      <section>
        {shop ? (
          <Card className="bg-gradient-to-br from-brand/10 to-pink-500/5 border-brand/20 p-6 flex flex-col gap-4 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 bg-brand/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-brand/10 transition-all"></div>
             <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-2xl bg-brand/20 flex items-center justify-center text-brand border border-brand/20">
                      <Store size={32} />
                   </div>
                   <div>
                      <h3 className="font-black font-display text-xl tracking-tight leading-none mb-1">{shop.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-white/50 font-bold uppercase tracking-widest">
                         {shop.isVerified ? (
                           <span className="flex items-center gap-1 text-blue-400">
                             <CheckCircle2 size={12} /> Boutique Vérifiée
                           </span>
                         ) : "Boutique standard"}
                      </div>
                   </div>
                </div>
                <Button variant="secondary" size="sm" className="flex-1 gap-2" onClick={() => setEditingShop(true)}>
                   <Settings size={18} /> Modifier
                </Button>
             </div>
             <div className="grid grid-cols-3 gap-2 relative z-10">
                <Stat icon={<Store size={14}/>} value={productCount} label="Produits" />
                <Stat icon={<UserIcon size={14}/>} value={shop.followerCount || 0} label="Abonnés" />
                <Stat icon={<LayoutDashboard size={14}/>} value={shop.stats?.views || 0} label="Vues" />
             </div>
             <Button variant="primary" className="w-full relative z-10 py-4 rounded-2xl shadow-lg shadow-brand/20" onClick={() => setActivePage("publish")}>
                Gérer mes produits
             </Button>
          </Card>
        ) : (
          <Card className="border-dashed border-white/20 bg-white/2 flex flex-col items-center gap-4 py-12 text-center group cursor-pointer hover:border-brand/50 transition-all" onClick={() => setEditingShop(true)}>
             <div className="w-20 h-20 rounded-[32px] bg-brand/10 text-brand flex items-center justify-center group-hover:scale-110 transition-all">
                <Store size={40} />
             </div>
             <div>
                <h3 className="font-black font-display text-2xl tracking-tighter italic">Vends dans le monde entier</h3>
                <p className="text-xs text-white/40 max-w-[250px] mx-auto mt-2 font-medium leading-relaxed">Crée ta boutique gratuitement, publie tes produits et utilise l'IA Go pour booster tes ventes.</p>
             </div>
             <Button variant="outline" className="px-10 rounded-2xl">
                Créer ma Boutique
             </Button>
          </Card>
        )}
      </section>

      {/* OPTIONS LIST */}
      <section className="flex flex-col gap-2">
        <OptionItem icon={LayoutDashboard} label="Plans & Abonnements" info={profile.plan.toUpperCase()} onClick={() => setActivePage("settings")} />
        <OptionItem icon={Settings} label="Paramètres du compte" onClick={() => setActivePage("settings")} />
        <OptionItem icon={LogOut} label="Déconnexion" danger onClick={handleLogout} />
      </section>

      {/* SHOP MODAL (Simplified as Overlay) */}
      {editingShop && (
        <div className="fixed inset-0 z-[100] bg-bg flex flex-col animate-fade-in">
           <header className="h-16 flex items-center justify-between px-4 border-b border-white/5">
              <Button variant="ghost" onClick={() => setEditingShop(false)}>Annuler</Button>
              <h2 className="font-black font-display font-xl uppercase">Ta Boutique</h2>
              <Button variant="ghost" className="text-brand" onClick={handleCreateOrUpdateShop} loading={loading}>
                 Enregistrer
              </Button>
           </header>
           <form className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-md mx-auto w-full">
              <div className="flex flex-col items-center gap-4 py-4">
                 <label className="w-32 h-32 bg-white/5 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/20 hover:border-brand transition-colors cursor-pointer overflow-hidden relative group">
                    {logoFile || shopForm.logoURL ? (
                      <>
                        <img src={logoFile ? URL.createObjectURL(logoFile) : shopForm.logoURL} className="w-full h-full object-cover" />
                        {logoFile && (
                           <button 
                             type="button" 
                             onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLogoFile(null); }}
                             className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                           >
                              <X size={16} />
                           </button>
                        )}
                      </>
                    ) : (
                      <Camera size={32} />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                       <Camera size={24} />
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                 </label>
                 <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Logo de la boutique</p>
              </div>

              <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1">Bannière de la boutique</p>
                  <label className="w-full h-32 bg-white/5 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/20 hover:border-brand transition-colors cursor-pointer overflow-hidden relative group">
                     {bannerFile || shopForm.bannerURL ? (
                        <>
                           <img src={bannerFile ? URL.createObjectURL(bannerFile) : shopForm.bannerURL} className="w-full h-full object-cover" />
                           {bannerFile && (
                              <button 
                                type="button" 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBannerFile(null); }}
                                className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                              >
                                 <X size={16} />
                              </button>
                           )}
                        </>
                     ) : (
                        <div className="flex flex-col items-center gap-2">
                           <Camera size={24} />
                           <span className="text-[10px] font-black uppercase tracking-tighter">Ajouter une bannière</span>
                        </div>
                     )}
                     <input type="file" className="hidden" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
                  </label>
               </div>

              <Input 
                 label="Nom de la Boutique" 
                 placeholder="Ex: NEXO Store Congo" 
                 value={shopForm.name}
                 onChange={(e: any) => setShopForm({...shopForm, name: e.target.value})}
              />
              <Input 
                 label="Description" 
                 placeholder="Décris ce que tu vends..." 
                 value={shopForm.description}
                 onChange={(e: any) => setShopForm({...shopForm, description: e.target.value})}
              />
              <Input 
                 label="Ville" 
                 placeholder="Brazzaville, Pointe-Noire..." 
                 value={shopForm.city}
                 onChange={(e: any) => setShopForm({...shopForm, city: e.target.value})}
              />
              <Input 
                 label="Numéro WhatsApp (ex: 242060000000)" 
                 placeholder="Sans le +" 
                 value={shopForm.whatsapp}
                 onChange={(e: any) => setShopForm({...shopForm, whatsapp: e.target.value})}
              />
              <Input 
                 label="Téléphone Appels" 
                 placeholder="Ex: +242 06 000 00 00" 
                 value={shopForm.phone}
                 onChange={(e: any) => setShopForm({...shopForm, phone: e.target.value})}
              />
              <div className="flex flex-col gap-1.5">
                 <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1">Catégorie Principale</label>
                 <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50"
                    value={shopForm.category}
                    onChange={(e: any) => setShopForm({...shopForm, category: e.target.value})}
                 >
                    <option>Téléphones</option>
                    <option>Voitures</option>
                    <option>Immobilier</option>
                    <option>Vêtements</option>
                    <option>Informatique</option>
                    <option>Services</option>
                 </select>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, value, label }: any) {
  return (
    <div className="bg-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center gap-1">
       <div className="text-white/40">{icon}</div>
       <div className="text-lg font-black font-display leading-none mt-1">{value}</div>
       <div className="text-[8px] font-bold uppercase tracking-tighter text-white/30">{label}</div>
    </div>
  );
}

function OptionItem({ icon: Icon, label, info, danger, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-4 rounded-2xl bg-white/2 hover:bg-white/5 transition-all text-left",
        danger && "text-red-500 hover:bg-red-500/10"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn("p-2 rounded-xl bg-white/5", danger && "bg-red-500/10")}>
          <Icon size={18} />
        </div>
        <span className="font-bold text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {info && <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded-md">{info}</span>}
        <ChevronRight size={16} className="text-white/20" />
      </div>
    </button>
  );
}
