import { useState, useEffect } from "react";
import { Bell, X, Package, MessageSquare, AlertCircle, Trash2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { dbService } from "../services/dbService.ts";
import { useNexo } from "../App.tsx";
import { cn, formatDate } from "../lib/utils.ts";
import { Card } from "./UI.tsx";

export default function NotificationCenter() {
  const { user, setActivePage, setPageData } = useNexo();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!user) return;
    const unsub = dbService.listenNotifications(user.uid, (data) => {
      setNotifications(data);
    });
    return unsub;
  }, [user]);

  const handleNotifClick = async (notif: any) => {
    if (user) {
      await dbService.markNotificationAsRead(user.uid, notif.id);
    }
    
    if (notif.link) {
      if (notif.link.includes("/product/")) {
        const id = notif.link.replace("/product/", "");
        setPageData(id);
        setActivePage("product");
      } else if (notif.link === "/messages") {
        setActivePage("messages");
      }
    }
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "alert": return <AlertCircle className="text-orange-500" size={16} />;
      case "order": return <Package className="text-brand" size={16} />;
      case "message": return <MessageSquare className="text-blue-500" size={16} />;
      default: return <Bell className="text-white/40" size={16} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-white/50 hover:text-white transition-colors relative"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-red-500 rounded-full border-2 border-bg text-[8px] font-black flex items-center justify-center px-0.5">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[60] lg:hidden" 
              onClick={() => setIsOpen(false)}
            ></div>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-12 z-[70] w-[320px] md:w-[380px] bg-card border border-white/10 rounded-[28px] shadow-2xl overflow-hidden shadow-black/50"
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/2">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
                   Notifications 
                   {unreadCount > 1 && <span className="px-2 py-0.5 bg-brand/20 text-brand rounded-full text-[8px]">{unreadCount} nouveaux</span>}
                </h3>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/5 rounded-lg">
                   <X size={16} className="text-white/20" />
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-4 text-white/20">
                     <Bell size={40} strokeWidth={1} />
                     <p className="text-[10px] font-black uppercase tracking-widest">Rien pour le moment</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={cn(
                          "p-4 border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer flex gap-4 relative",
                          !n.isRead && "bg-brand/5"
                        )}
                      >
                         {!n.isRead && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-brand rounded-full"></div>}
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                            {getIcon(n.type)}
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                               <span className="text-[10px] font-black uppercase tracking-widest text-brand">{n.title}</span>
                               <span className="text-[8px] text-white/20 font-bold uppercase">{n.createdAt?.seconds ? formatDate(n.createdAt).split(" à ")[1] : "À l'instant"}</span>
                            </div>
                            <p className="text-xs text-white/60 leading-tight">
                               {n.message}
                            </p>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-4 bg-white/2 border-t border-white/5 text-center">
                   <button className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-brand transition-colors">
                      Tout marquer comme lu
                   </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
