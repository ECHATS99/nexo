import { useState, useEffect } from "react";
import { useNexo } from "../App.tsx";
import { Card, Button } from "../components/UI.tsx";
import { 
  User, 
  Store, 
  Bell, 
  Shield, 
  Palette, 
  CreditCard, 
  Lock, 
  Info, 
  ChevronRight,
  LogOut,
  Trash2,
  Moon,
  Sun,
  Monitor,
  ShoppingBag,
  MapPin,
  Users,
  Crown,
  X
} from "lucide-react";
import { authService } from "../services/authService.ts";
import { cn } from "../lib/utils.ts";

export default function Settings() {
  const { profile, shop, refreshProfile } = useNexo();
  const [activeSection, setActiveSection] = useState("mon-compte");
  const [theme, setTheme] = useState(localStorage.getItem("nexo-theme") || "dark");

  const updateTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("nexo-theme", newTheme);
    if (newTheme === "auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  };

  const sections = [
    { id: "mon-compte", label: "Mon Compte", icon: User },
    { id: "ma-boutique", label: "Ma Boutique", icon: Store },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "confidentialite", label: "Confidentialité", icon: Shield },
    { id: "apparence", label: "Apparence", icon: Palette },
    { id: "abonnement", label: "Abonnement", icon: CreditCard },
    { id: "securite", label: "Sécurité", icon: Lock },
    { id: "a-propos", label: "À propos", icon: Info },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 py-8 px-4 lg:px-0 animate-fade-in">
       {/* SIDEBAR NAVIGATION */}
       <aside className="w-full lg:w-64 flex flex-col gap-1">
          <h2 className="text-xl font-display font-black mb-6 px-2">Paramètres</h2>
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 gap-1 scrollbar-hide">
             {sections.map(s => (
               <button
                 key={s.id}
                 onClick={() => setActiveSection(s.id)}
                 className={cn(
                   "flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap",
                   activeSection === s.id ? "bg-brand text-white font-bold" : "text-white/40 hover:bg-white/5 hover:text-white"
                 )}
               >
                 <s.icon size={18} />
                 <span className="text-sm">{s.label}</span>
               </button>
             ))}
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 hidden lg:block">
             <button onClick={() => authService.logout()} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all w-full">
                <LogOut size={18} />
                <span className="text-sm font-bold">Déconnexion</span>
             </button>
          </div>
       </aside>

       {/* CONTENT AREA */}
       <main className="flex-1 max-w-2xl">
          <Card className="p-6 lg:p-8 bg-white/2 border-white/5">
             {activeSection === "mon-compte" && (
                <div className="flex flex-col gap-8">
                   <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-3xl bg-brand/20 flex items-center justify-center text-3xl overflow-hidden">
                         {profile?.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover" /> : profile?.flag}
                      </div>
                      <div className="flex flex-col gap-1">
                         <h3 className="text-lg font-bold">{profile?.displayName}</h3>
                         <p className="text-xs text-white/40">{profile?.email}</p>
                         <button className="text-xs text-brand font-bold hover:underline mt-1 text-left">Changer la photo</button>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputGroup label="Nom complet" value={profile?.displayName} />
                      <InputGroup label="Téléphone" value={profile?.phone || "Non renseigné"} />
                      <InputGroup label="Ville" value={profile?.city} />
                      <InputGroup label="Pays" value={profile?.country} />
                   </div>
                   <div className="pt-6 border-t border-white/5">
                      <Button className="w-full lg:w-auto">Enregistrer les modifications</Button>
                   </div>
                   <div className="pt-6 border-t border-white/5">
                      <button className="text-red-500/50 hover:text-red-500 text-xs font-bold flex items-center gap-2 transition-colors">
                        <Trash2 size={14} /> Supprimer mon compte
                      </button>
                   </div>
                </div>
             )}

             {activeSection === "apparence" && (
                <div className="flex flex-col gap-8">
                   <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold">Thème de l'application</h3>
                      <p className="text-sm text-white/40">Personnalisez votre expérience visuelle.</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <ThemeButton 
                        active={theme === "dark"} 
                        onClick={() => updateTheme("dark")} 
                        icon={Moon} 
                        label="Sombre" 
                        desc="Violet et noir profond"
                      />
                      <ThemeButton 
                        active={theme === "light"} 
                        onClick={() => updateTheme("light")} 
                        icon={Sun} 
                        label="Clair" 
                        desc="Épuré et lumineux"
                      />
                      <ThemeButton 
                        active={theme === "auto"} 
                        onClick={() => updateTheme("auto")} 
                        icon={Monitor} 
                        label="Auto" 
                        desc="Selon votre système"
                      />
                   </div>
                   <div className="flex flex-col gap-4 pt-6 border-t border-white/5">
                      <h4 className="text-sm font-bold">Affichage</h4>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
                         <div className="text-sm">Taille du texte</div>
                         <select className="bg-transparent text-sm font-bold focus:outline-none">
                            <option value="normal">Normal</option>
                            <option value="large">Grand</option>
                         </select>
                      </div>
                   </div>
                </div>
             )}

             {activeSection === "ma-boutique" && (
                <div className="flex flex-col gap-6 text-center py-10">
                   {!shop ? (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
                           <Store size={32} />
                        </div>
                        <h3 className="text-lg font-bold">Vous n'avez pas encore de boutique</h3>
                        <p className="text-sm text-white/40 max-w-xs mx-auto mb-6">Créez votre boutique en quelques secondes et commencez à vendre dans le monde entier.</p>
                        <Button className="mx-auto">Créer ma boutique</Button>
                      </>
                   ) : (
                      <div className="text-left w-full">
                         <h3 className="text-lg font-bold mb-4">Paramètres Boutique</h3>
                         <div className="flex flex-col gap-4">
                            <InputGroup label="Nom de la boutique" value={shop.name} />
                            <InputGroup label="Description" value={shop.description} textarea />
                            <Button variant="outline" className="mt-4">Modifier les informations publiques</Button>
                            <button className="text-yellow-500 text-xs font-bold mt-4 flex items-center gap-2">
                               Mettre la boutique en pause
                            </button>
                         </div>
                      </div>
                   )}
                </div>
             )}

              {/* NOTIFICATIONS */}
              {activeSection === "notifications" && (
                <div className="flex flex-col gap-8">
                   <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold">Centre de Notifications</h3>
                      <p className="text-sm text-white/40">Gérez comment vous restez informé des nouveautés.</p>
                   </div>
                   <div className="flex flex-col gap-1">
                      <ToggleSetting icon={Bell} label="Notifications push" desc="Alertes sur votre mobile et navigateur." defaultChecked />
                      <ToggleSetting icon={ShoppingBag} label="Alertes de prix" desc="Quand un produit suivi baisse de prix." defaultChecked />
                      <ToggleSetting icon={Store} label="Nouveautés boutiques" desc="Nouveaux posts des boutiques suivies." />
                      <ToggleSetting icon={Shield} label="Alertes de sécurité" desc="Connexions suspectes ou changements de MDP." defaultChecked />
                   </div>
                </div>
              )}

              {/* CONFIDENTIALITÉ */}
              {activeSection === "confidentialite" && (
                <div className="flex flex-col gap-8">
                   <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold">Confidentialité & Données</h3>
                      <p className="text-sm text-white/40">Contrôlez vos informations personnelles.</p>
                   </div>
                   <div className="flex flex-col gap-1">
                      <ToggleSetting icon={MapPin} label="Localisation précise" desc="Affiche les produits exactement près de vous." defaultChecked />
                      <ToggleSetting icon={Users} label="Profil public" desc="Permet aux autres de voir vos avis et abonnements." defaultChecked />
                      <ToggleSetting icon={Info} label="Statistiques d'utilisation" desc="Aidez-nous à améliorer NEXO anonymement." />
                   </div>
                   <div className="pt-6 border-t border-white/5">
                      <Button variant="outline" className="w-full">Télécharger mes données</Button>
                   </div>
                </div>
              )}

              {/* ABONNEMENT */}
              {activeSection === "abonnement" && (
                <div className="flex flex-col gap-8">
                   <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold">Abonnement NEXO</h3>
                      <p className="text-sm text-white/40">Statut actuel : <span className="text-brand font-black uppercase tracking-widest">{profile?.plan || "Basic"}</span></p>
                   </div>
                   <div className="p-6 bg-brand/10 border border-brand/20 rounded-3xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Crown size={80} /></div>
                      <h4 className="text-xl font-black font-display mb-2">Passez au niveau supérieur</h4>
                      <p className="text-sm text-white/60 mb-6 max-w-sm">Débloquez les statuts 24h, les produits illimités et le badge certifié.</p>
                      <Button variant="brand" className="w-full">Voir les plans Premium</Button>
                   </div>
                </div>
              )}

              {/* SÉCURITÉ */}
              {activeSection === "securite" && (
                <div className="flex flex-col gap-8">
                   <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold">Sécurité du Compte</h3>
                      <p className="text-sm text-white/40">Protégez votre accès à NEXO.</p>
                   </div>
                   <div className="flex flex-col gap-4">
                      <button className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-left">
                         <div className="flex items-center gap-3">
                            <Lock size={18} className="text-white/40" />
                            <div>
                               <div className="text-sm font-bold">Mot de passe</div>
                               <div className="text-[10px] text-white/30">Dernière modification il y a 3 mois</div>
                            </div>
                         </div>
                         <ChevronRight size={16} className="text-white/20" />
                      </button>
                      <button className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-left">
                         <div className="flex items-center gap-3">
                            <Shield size={18} className="text-white/40" />
                            <div>
                               <div className="text-sm font-bold">Double Facteurs (2FA)</div>
                               <div className="text-[10px] text-white/30 text-amber-500">Non activé - Recommandé</div>
                            </div>
                         </div>
                         <ChevronRight size={16} className="text-white/20" />
                      </button>
                   </div>
                </div>
              )}

              {/* À PROPOS */}
              {activeSection === "a-propos" && (
                <div className="flex flex-col gap-8">
                   <div className="flex flex-col items-center gap-4 py-8">
                      <div className="w-24 h-24 bg-brand rounded-[40px] flex items-center justify-center text-4xl font-black italic tracking-tighter text-white shadow-2xl shadow-brand/40">N</div>
                      <div className="text-center">
                         <h3 className="text-2xl font-black font-display tracking-tight">NEXO v2.4.0</h3>
                         <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mt-1">Conçue pour demain</p>
                      </div>
                   </div>
                   <div className="flex flex-col gap-2">
                      <button className="flex items-center justify-between p-4 border-b border-white/5 text-sm font-medium">
                         <span>Conditions d'utilisation</span>
                         <ChevronRight size={16} />
                      </button>
                      <button className="flex items-center justify-between p-4 border-b border-white/5 text-sm font-medium">
                         <span>Politique de confidentialité</span>
                         <ChevronRight size={16} />
                      </button>
                      <button className="flex items-center justify-between p-4 text-sm font-medium">
                         <span>Nous contacter</span>
                         <ChevronRight size={16} />
                      </button>
                   </div>
                </div>
              )}
          </Card>
       </main>
    </div>
  );
}

function InputGroup({ label, value, textarea = false }: any) {
  return (
    <div className="flex flex-col gap-2">
       <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-1">{label}</label>
       {textarea ? (
         <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand focus:ring-0 transition-all min-h-[100px]" defaultValue={value} />
       ) : (
         <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand focus:ring-0 transition-all" defaultValue={value} />
       )}
    </div>
  );
}

function ThemeButton({ active, onClick, icon: Icon, label, desc }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 p-4 rounded-2xl border transition-all text-left group",
        active ? "bg-brand/10 border-brand" : "bg-white/2 border-white/5 hovr:bg-white/5"
      )}
    >
       <Icon size={24} className={active ? "text-brand" : "text-white/20 group-hover:text-white/40"} />
       <div>
          <div className="text-sm font-bold">{label}</div>
          <div className="text-[10px] text-white/30">{desc}</div>
       </div>
    </button>
  );
}

function ToggleSetting({ icon: Icon, label, desc, defaultChecked = false }: any) {
   return (
     <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
              <Icon size={18} />
           </div>
           <div>
              <div className="text-sm font-bold">{label}</div>
              <div className="text-[10px] text-white/30">{desc}</div>
           </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
           <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
           <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
        </label>
     </div>
   );
}
