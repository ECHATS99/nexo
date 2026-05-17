import { useState, useEffect, createContext, useContext } from "react";
import { authService, UserProfile } from "./services/authService.ts";
import { dbService } from "./services/dbService.ts";
import { geoService } from "./services/geoService.ts";
import Home from "./pages/Home.tsx";
import Explore from "./pages/Explore.tsx";
import Publish from "./pages/Publish.tsx";
import Messages from "./pages/Messages.tsx";
import Profile from "./pages/Profile.tsx";
import Auth from "./pages/Auth.tsx";
import ShopDetail from "./pages/ShopDetail.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import { User as FirebaseUser } from "firebase/auth";
import { Card } from "./components/UI.tsx";
import { 
  Home as HomeIcon, 
  MessageCircle, 
  PlusSquare, 
  Store, 
  User, 
  Search, 
  Bell, 
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  Settings as SettingsIcon,
  X,
  Menu,
  ChevronRight
} from "lucide-react";
import { cn } from "./lib/utils.ts";
import NexoIA from "./components/NexoIA.tsx";
import SettingsPage from "./pages/Settings.tsx";
import NotificationCenter from "./components/NotificationCenter.tsx";
import { GlobalTools } from "./components/GlobalTools.tsx";

// Admin UIDs for strict checking
const ADMIN_UIDS = ['uYy9Z3Jk8p']; 

// --- CONTEXT ---
interface NexoContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  shop: any | null;
  geo: any | null;
  activePage: string;
  setActivePage: (p: string) => void;
  pageData: any;
  setPageData: (d: any) => void;
  loading: boolean;
  favorites: string[];
  followedShopIds: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  toggleFollow: (shopId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const NexoContext = createContext<NexoContextType | null>(null);

export const useNexo = () => {
  const context = useContext(NexoContext);
  if (!context) throw new Error("useNexo must be used within NexoProvider");
  return context;
};

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shop, setShop] = useState<any | null>(null);
  const [geo, setGeo] = useState<any>(null);
  const [activePage, setActivePage] = useState("home");
  const [pageData, setPageData] = useState<any>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [followedShopIds, setFollowedShopIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [trends, setTrends] = useState<any[]>([]);

  const fetchProfile = async (u: FirebaseUser) => {
    const p = await authService.getUserProfile(u.uid);
    setProfile(p);
    if (p) {
      const s = await dbService.getShopByOwner(u.uid);
      setShop(s);
      const faves = await dbService.getWishlist(u.uid);
      setFavorites(faves || []);
      const followed = await dbService.getFollowedShopIds(u.uid);
      setFollowedShopIds(followed || []);
    }
  };

  useEffect(() => {
    const fetchTrends = async () => {
      const data = await dbService.getCategoryTrends();
      setTrends(data);
    };
    fetchTrends();
    // Theme initialization
    const savedTheme = localStorage.getItem("nexo-theme") || "dark";
    if (savedTheme === "auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }

    const unsub = authService.subscribe(async (u) => {
      setUser(u);
      if (u) {
        await fetchProfile(u);
      } else {
        setProfile(null);
        setShop(null);
        setFavorites([]);
        const g = await geoService.detectLocation();
        setGeo(g);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      setActivePage("auth");
      return;
    }
    const isAdded = await dbService.toggleWishlist(user.uid, productId);
    if (isAdded) {
      setFavorites(prev => [...prev, productId]);
    } else {
      setFavorites(prev => prev.filter(id => id !== productId));
    }
  };

  const toggleFollow = async (shopId: string) => {
     if (!user) {
        setActivePage("auth");
        return;
     }
     const isFollowed = await dbService.toggleFollow(shopId);
     if (isFollowed !== undefined) {
        if (isFollowed) {
           setFollowedShopIds(prev => [...prev, shopId]);
        } else {
           setFollowedShopIds(prev => prev.filter(id => id !== shopId));
        }
     }
  };

  const renderPage = () => {
    switch (activePage) {
      case "home": return <Home />;
      case "explore": return <Explore />;
      case "publish": return user ? <Publish /> : <Auth />;
      case "messages": return user ? <Messages /> : <Auth />;
      case "profile": return user ? <Profile /> : <Auth />;
      case "settings": return user ? <SettingsPage /> : <Auth />;
      case "admin": return (profile?.isAdmin || (user && ADMIN_UIDS.includes(user.uid))) ? <AdminDashboard /> : <Home />;
      case "shop": return <ShopDetail slug={pageData} />;
      case "product": return <ProductDetail id={pageData} />;
      default: return <Home />;
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl font-display font-black text-brand animate-pulse tracking-tighter">NEXO</div>
          <div className="text-[10px] font-black text-brand/40 uppercase tracking-[0.2em]">Chargement Mondiale</div>
        </div>
      </div>
    );
  }

  return (
    <NexoContext.Provider value={{ 
      user, profile, shop, geo, activePage, setActivePage, pageData, setPageData, loading, 
      favorites, followedShopIds, toggleWishlist, toggleFollow, refreshProfile 
    }}>
      <div className="flex bg-bg h-screen overflow-hidden text-white font-sans">
        
        {/* DESKTOP SIDEBAR (HIDDEN ON MOBILE) */}
        <aside className="hidden lg:flex flex-col w-72 h-screen border-r border-white/5 bg-bg/50 backdrop-blur-xl p-6 sticky top-0">
          <div className="text-3xl font-display font-black text-brand mb-10 cursor-pointer" onClick={() => setActivePage("home")}>NEXO</div>
          
          <nav className="flex flex-col gap-2 flex-1">
             <DesktopNavItem icon={HomeIcon} label="Accueil" active={activePage === "home"} onClick={() => setActivePage("home")} />
             <DesktopNavItem icon={Store} label="Exploration" active={activePage === "explore"} onClick={() => setActivePage("explore")} />
             <DesktopNavItem icon={PlusSquare} label="Publier" active={activePage === "publish"} onClick={() => setActivePage("publish")} />
             <DesktopNavItem icon={MessageCircle} label="Messages" active={activePage === "messages"} onClick={() => setActivePage("messages")} />
             <DesktopNavItem icon={User} label="Profil" active={activePage === "profile"} onClick={() => setActivePage("profile")} />
             <DesktopNavItem icon={SettingsIcon} label="Paramètres" active={activePage === "settings"} onClick={() => setActivePage("settings")} />
             {(profile?.isAdmin || (user && ADMIN_UIDS.includes(user.uid))) && (
               <DesktopNavItem icon={ShieldCheck} label="Administration" active={activePage === "admin"} onClick={() => setActivePage("admin")} />
             )}
          </nav>

          {user && profile && (
            <div className="mt-auto pt-6 border-t border-white/5 flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center text-brand font-black">
                  {profile.flag}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{profile.displayName}</div>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{profile.plan} Plan</div>
               </div>
            </div>
          )}
        </aside>

        {/* MOBILE OVERLAY MENU */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-[100] bg-bg/95 backdrop-blur-2xl p-6 flex flex-col gap-8 animate-fade-in">
             <div className="flex items-center justify-between">
                <div className="text-2xl font-display font-black text-brand">MENU</div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2"><X /></button>
             </div>
             <nav className="flex flex-col gap-4">
                <MobileOverlayItem icon={HomeIcon} label="Accueil" onClick={() => { setActivePage("home"); setIsSidebarOpen(false); }} />
                <MobileOverlayItem icon={Store} label="Boutiques" onClick={() => { setActivePage("explore"); setIsSidebarOpen(false); }} />
                <MobileOverlayItem icon={LayoutDashboard} label="Admin" onClick={() => { setActivePage("admin"); setIsSidebarOpen(false); }} />
             </nav>
          </div>
        )}

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          
          {/* HEADER */}
          <header className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 border-b border-white/5 bg-bg/80 backdrop-blur-lg sticky top-0 z-40">
            <div className="flex items-center gap-4">
               <button className="lg:hidden p-2" onClick={() => setIsSidebarOpen(true)}>
                  <Menu size={22} />
               </button>
               <div className="lg:hidden text-2xl font-display font-black text-brand" onClick={() => setActivePage("home")}>NEXO</div>
               
               {/* DESKTOP SEARCH */}
               <div className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2 w-96 group focus-within:border-brand/40 transition-all">
                  <Search size={18} className="text-white/20 group-focus-within:text-brand" />
                  <input placeholder="Rechercher partout dans le monde..." className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-full" />
               </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <GlobalTools onRefresh={async () => {
                 // Soft refresh logic
                 setActivePage("home-refresh");
                 setTimeout(() => setActivePage("home"), 100);
              }} />
              {geo && (
                 <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                    <span className="text-lg">{geoService.getFlagEmoji(geo.country_code)}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{geo.city}</span>
                 </div>
              )}
              <NotificationCenter />
              <div className="w-[1px] h-6 bg-white/10 hidden lg:block"></div>
              {user ? (
                <div onClick={() => setActivePage("profile")} className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center text-brand cursor-pointer hover:scale-105 transition-all">
                   <User size={20} />
                </div>
              ) : (
                <button onClick={() => setActivePage("auth")} className="px-5 py-2 bg-brand rounded-xl font-bold text-sm shadow-brand/20 shadow-lg">Connexion</button>
              )}
            </div>
          </header>

          {/* PAGE CONTENT */}
          <div className="flex-1 overflow-y-auto pb-24 lg:pb-0 scrollbar-hide">
            <div className="max-w-4xl mx-auto min-h-full">
              {renderPage()}
            </div>
          </div>

          {/* MOBILE BOTTOM NAV */}
          <nav className="lg:hidden h-20 bg-bg/95 backdrop-blur-xl border-t border-white/5 fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 shadow-2xl">
            <NavItem icon={<HomeIcon />} active={activePage === "home"} onClick={() => setActivePage("home")} />
            <NavItem icon={<Store />} active={activePage === "explore"} onClick={() => setActivePage("explore")} />
            <NavItem icon={<PlusSquare />} active={activePage === "publish"} onClick={() => setActivePage("publish")} special />
            <NavItem icon={<MessageCircle />} active={activePage === "messages"} onClick={() => setActivePage("messages")} />
            <NavItem icon={<User />} active={activePage === "profile"} onClick={() => setActivePage("profile")} />
          </nav>
        </div>

        {/* RIGHT SIDEBAR (DESKTOP ONLY - AI + TRENDS) */}
        <aside className="hidden xl:flex flex-col w-80 h-screen border-l border-white/5 bg-bg/30 p-6 sticky top-0 overflow-y-auto scrollbar-hide">
           <div className="flex flex-col gap-8">
              {/* GO AI SECTION */}
              <div className="flex flex-col gap-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black font-display uppercase tracking-widest text-white/40 flex items-center gap-2">
                       <Sparkles size={16} className="text-brand" /> Assistant Go
                    </h3>
                 </div>
                 <Card className="bg-gradient-to-br from-brand/10 to-pink-500/10 border-brand/20 p-4">
                    <p className="text-xs font-medium text-white/70 leading-relaxed">
                       Hello ! Je peux t'aider à trouver le meilleur prix localement ou analyser le marché.
                    </p>
                    <button className="mt-3 w-full py-2 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-lg" onClick={() => setIsSidebarOpen(true)}>
                       Parler à Go
                    </button>
                 </Card>
              </div>

              {/* LOCAL TRENDS */}
              <div className="flex flex-col gap-4">
                 <h3 className="text-sm font-black font-display uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <TrendingUp size={16} className="text-brand" /> Tendances {profile?.country ? profile.country : "Mondiale"}
                 </h3>
                 <div className="flex flex-col gap-2">
                    <TrendItem label="iPhone 15 Pro" count={142} />
                    <TrendItem label="Toyota RAV4" count={58} />
                    <TrendItem label="Appartement Brazza" count={34} />
                    <TrendItem label="Luxe Paris" count={12} />
                 </div>
              </div>
           </div>
        </aside>

        <NexoIA />
      </div>
    </NexoContext.Provider>
  );
}

function DesktopNavItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group",
        active ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon size={20} className={cn(active ? "text-white" : "text-brand/40 group-hover:text-brand")} />
      <span className="font-bold text-sm">{label}</span>
    </button>
  );
}

function TrendItem({ label, count }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/2 hover:bg-white/5 transition-all cursor-pointer">
       <span className="text-xs font-bold text-white/70">{label}</span>
       <span className="text-[10px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded-md">{count}</span>
    </div>
  );
}

function MobileOverlayItem({ icon: Icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-6 p-4 rounded-3xl bg-white/5 text-2xl font-black font-display tracking-tight text-white/80">
       <Icon size={32} className="text-brand" />
       {label}
    </button>
  );
}

function NavItem({ icon, active, onClick, special = false }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center transition-all duration-300",
        active ? "text-brand scale-110" : "text-white/40 hover:text-white/70",
        special && "relative -top-6 bg-brand text-white p-4 rounded-[24px] shadow-[0_10px_30px_rgba(124,58,237,0.4)] border-4 border-bg"
      )}
    >
      <span className={cn(special ? "w-7 h-7" : "w-6 h-6")}>
        {icon}
      </span>
    </button>
  );
}

