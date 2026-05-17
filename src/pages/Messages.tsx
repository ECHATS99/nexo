import { useState, useEffect, useRef } from "react";
import { useNexo } from "../App.tsx";
import { dbService } from "../services/dbService.ts";
import { Card, Button, Badge } from "../components/UI.tsx";
import { Send, MapPin, Search, ChevronLeft, Image as ImageIcon, Check, CheckCheck, Sparkles, FileText, Languages, RotateCcw, MessageSquare, Loader2, X, TrendingUp, Bell } from "lucide-react";
import { cn, formatDate } from "../lib/utils.ts";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase.ts";
import { geminiService } from "../services/geminiService.ts";

export default function Messages() {
  const { user, profile, geo } = useNexo();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [goLoading, setGoLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const GO_ASSISTANT_VIRTUAL = {
    id: "go_assistant",
    isGo: true,
    otherUser: {
      displayName: "Assistant Go",
      photoURL: null,
      isBot: true
    },
    lastMessage: {
      content: "Je suis là pour t'aider !",
      createdAt: { seconds: Date.now() / 1000 }
    }
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "conversations"),
      where("participantIds", "array-contains", user.uid),
      orderBy("lastMessage.createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const realConvs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setConversations([GO_ASSISTANT_VIRTUAL, ...realConvs]);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  useEffect(() => {
    if (!activeConv || !user) return;
    
    if (activeConv.isGo) {
       const unsub = dbService.listenGoHistory(user.uid, (msgs) => {
          setMessages(msgs.map(m => ({
             id: m.id,
             content: typeof m.text === 'string' ? m.text : (m.parts?.[0]?.text || ""),
             senderId: m.role === "user" ? user.uid : "go_bot",
             createdAt: m.timestamp || { seconds: Date.now() / 1000 },
             role: m.role
          })));
       });
       return unsub;
    } else {
       const unsub = dbService.listenMessages(activeConv.id, (msgs) => {
         setMessages(msgs);
       });
       return unsub;
    }
  }, [activeConv, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeConv]);

  const handleSend = async () => {
    if (!input.trim() || !activeConv || !user) return;
    const content = input;
    setInput("");

    if (activeConv.isGo) {
      setGoLoading(true);
      try {
        await dbService.saveGoMessage(user.uid, "user", content);
        const systemContext = `Tu es Go, l'assistant Nexo. TON RÔLE : Aide à la recherche, alertes, conseils. Tu NE participes PAS aux chats vendeurs. Ton ton est pro, amical et efficace. Contexte: ${JSON.stringify({ geo, profile })}`;
        
        const history = messages.map(m => ({ 
           role: m.role || (m.senderId === user.uid ? "user" : "model"), 
           parts: [{ text: m.content }] 
        }));

        const response = await geminiService.chat(content, history, {
           country: profile?.country || geo?.country_name,
           city: profile?.city || geo?.city,
           systemInstruction: systemContext
        });
        
        await dbService.saveGoMessage(user.uid, "model", response);
      } catch (e) {
        console.error(e);
      } finally {
        setGoLoading(false);
      }
    } else {
      try {
        await dbService.sendMessage(activeConv.id, content);
      } catch (e) {
        alert("Erreur lors de l'envoi");
      }
    }
  };

  if (activeConv) {
    return (
      <div className="fixed inset-0 z-[100] bg-bg flex flex-col animate-fade-in lg:max-w-4xl lg:mx-auto">
        {/* CHAT HEADER */}
        <header className="h-16 flex items-center gap-3 px-4 border-b border-white/5 bg-bg/80 backdrop-blur-lg shrink-0">
          <button onClick={() => setActiveConv(null)} className="p-2 -ml-2 text-white/50 hover:text-white">
            <ChevronLeft size={24} />
          </button>
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-lg",
            activeConv.isGo ? "bg-brand text-white" : "bg-brand/20 text-brand"
          )}>
             {activeConv.isGo ? <Sparkles size={20} /> : (activeConv.otherUser?.displayName?.charAt(0) || "U")}
          </div>
          <div className="flex-1 min-w-0">
             <div className="text-sm font-bold truncate leading-none mb-1 flex items-center gap-2">
                {activeConv.otherUser?.displayName || "Utilisateur Nexo"}
                {activeConv.isGo && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>}
             </div>
             <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none">
                {activeConv.isGo ? "Assistant Nexo Intelligence" : "En ligne"}
             </div>
          </div>
        </header>

        {/* GO TOOLS (ONLY IF IS GO) */}
        {activeConv.isGo && (
          <div className="bg-bg/40 backdrop-blur-xl border-b border-white/5 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0">
             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full shrink-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand">Outils Go</span>
             </div>
             <button onClick={() => setInput("Tendances du jour ?")} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all shrink-0 text-[10px] font-bold text-white/60">
                <TrendingUp size={12} /> Tendances
             </button>
             <button onClick={() => setInput("Mes alertes actives")} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all shrink-0 text-[10px] font-bold text-white/60">
                <Bell size={12} /> Alertes
             </button>
             <button onClick={() => setInput("Comment vendre sur Nexo ?")} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all shrink-0 text-[10px] font-bold text-white/60">
                <RotateCcw size={12} /> Aide
             </button>
          </div>
        )}

        {/* MESSAGES LIST */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((m, i) => (
            <div 
              key={m.id || i}
              className={cn(
                "flex gap-2 max-w-[80%]",
                m.senderId === user?.uid ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                 "p-3 rounded-2xl text-sm break-words relative pb-4 shadow-lg",
                 m.senderId === user?.uid ? "bg-brand text-white rounded-tr-none" : "bg-white/5 text-white/90 rounded-tl-none border border-white/5"
              )}>
                {m.content}
                <div className={cn(
                   "absolute bottom-1 right-2 text-[8px] flex items-center gap-1 font-bold",
                   m.senderId === user?.uid ? "text-white/60" : "text-white/30"
                )}>
                  {m.createdAt?.seconds ? formatDate(m.createdAt).split(" à ")[1] : "Envoi..."}
                  {m.senderId === user?.uid && !activeConv.isGo && (m.isRead ? <CheckCheck size={10} /> : <Check size={10} />)}
                </div>
              </div>
            </div>
          ))}
          {goLoading && (
            <div className="flex gap-2 mr-auto animate-pulse">
               <div className="p-3 bg-white/5 rounded-2xl rounded-tl-none text-xs text-white/30 border border-white/5">
                  Go réfléchit...
               </div>
            </div>
          )}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-white/20 gap-4">
              <MessageSquare size={40} />
              <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">Début de la conversation.<br/>Dis bonjour ! 👋</p>
            </div>
          )}
        </div>

        {/* CHAT INPUT AREA */}
        <div className="p-4 border-t border-white/5 bg-white/2 pb-8 shrink-0">
           <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-1 group focus-within:border-brand/40 transition-all">
              <button className="text-white/40 hover:text-brand">
                 <ImageIcon size={20} />
              </button>
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Tape ton message..."
                className="flex-1 bg-transparent border-none py-3 text-sm text-white focus:outline-none focus:ring-0"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  input.trim() ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-white/20"
                )}
              >
                <Send size={20} />
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in lg:px-8">
      <div className="px-4 py-6 border-b border-white/5">
         <h1 className="text-2xl font-black font-display tracking-tight mb-4">Messages</h1>
         <div className="relative">
            <input 
              placeholder="Rechercher une discussion..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-10 py-3 text-sm focus:outline-none focus:border-brand/50"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
          </div>
        ) : (
          <div className="flex flex-col">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-10 text-center gap-4 text-white/20">
                 <div className="w-20 h-20 bg-white/2 rounded-full flex items-center justify-center">
                    <MessageCircle size={40} />
                 </div>
                 <p className="text-sm font-bold uppercase tracking-widest text-center">Aucune discussion.<br/>Contacte un vendeur !</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button 
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={cn(
                    "flex items-center gap-4 p-4 border-b border-white/5 hover:bg-white/2 transition-all active:scale-[0.98]",
                    conv.isGo && "bg-brand/5 border-l-4 border-l-brand"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg",
                    conv.isGo ? "bg-brand text-white" : "bg-brand/10 border border-brand/20 text-brand"
                  )}>
                     {conv.isGo ? <Sparkles size={28} /> : (conv.otherUser?.displayName?.charAt(0) || "?")}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                     <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm truncate flex items-center gap-2">
                          {conv.otherUser?.displayName || "Vendeur Nexo"}
                          {conv.isGo && <Badge className="bg-brand text-white text-[8px] h-4">OFFICIEL</Badge>}
                        </span>
                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">
                          {conv.lastMessage?.createdAt?.seconds ? formatDate(conv.lastMessage.createdAt).split(" à ")[1] : ""}
                        </span>
                     </div>
                     <div className="flex items-center justify-between">
                        <p className={cn(
                          "text-xs truncate flex-1 pr-4",
                          conv.isGo ? "text-brand font-medium" : "text-white/40"
                        )}>
                           {conv.lastMessage ? (
                             <>
                               {conv.lastMessage.senderId === user?.uid && !conv.isGo && "Moi : "}
                               {conv.lastMessage.content}
                             </>
                           ) : "Inicie la discussion..."}
                        </p>
                        {conv.lastMessage && conv.lastMessage.senderId !== user?.uid && !conv.lastMessage.isRead && (
                          <div className="w-2 h-2 bg-brand rounded-full ring-4 ring-brand/20"></div>
                        )}
                     </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageCircle({ size, className }: any) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
    </svg>
  );
}
