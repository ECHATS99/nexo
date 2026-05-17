import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, User, Bot, Minimize2, Maximize2, Search, Bell, TrendingUp, HelpCircle, Trash2, Loader2, ChevronDown, BellOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { geminiService, Message } from "../services/geminiService.ts";
import { dbService } from "../services/dbService.ts";
import { useNexo } from "../App.tsx";
import { cn } from "../lib/utils.ts";
import { Button } from "./UI.tsx";
import ReactMarkdown from "react-markdown";

export default function NexoIA() {
  const { user, profile, geo, setActivePage, setPageData } = useNexo();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsubHistory: (() => void) | undefined;

    if (user && isOpen) {
      unsubHistory = dbService.listenGoHistory(user.uid, (msgs) => {
        if (msgs && msgs.length > 0) {
          setMessages(msgs.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })) as Message[]);
        } else {
          setMessages([{
            role: "model",
            parts: [{ text: "Salut ! Je suis **Go**, ton assistant personnel NEXO. Je suis là pour te guider, trouver les meilleures pépites et surveiller le marché pour toi. \n\nQue puis-je faire aujourd'hui ?" }]
          }]);
        }
      });
      loadAlerts();
    } else if (!user) {
      setMessages([{
        role: "model",
        parts: [{ text: "Bonjour ! Connecte-toi pour profiter de toute ma puissance. Je peux t'aider à trouver des produits, créer des alertes et bien plus !" }]
      }]);
    }

    return () => {
      if (unsubHistory) unsubHistory();
    };
  }, [user, isOpen]);

  const loadAlerts = async () => {
    if (!user) return;
    const alertList = await dbService.getAlerts(user.uid);
    setAlerts(alertList || []);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isMinimized, loading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: "user", parts: [{ text: textToSend }] };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    if (user) {
      await dbService.saveGoMessage(user.uid, "user", textToSend);
    }

    try {
      const systemContext = `Tu es Go, l'assistant Nexo. TON RÔLE : Aide à la recherche, alertes, conseils. Tu NE participes PAS aux chats vendeurs. Ton ton est pro, amical et efficace. Contexte: ${JSON.stringify({ geo, profile })}`;
      const response = await geminiService.chat(textToSend, messages, {
        country: profile?.country || geo?.country_name,
        city: profile?.city || geo?.city,
        systemInstruction: systemContext
      });
      
      const modelMsg: Message = { role: "model", parts: [{ text: response }] };
      setMessages(prev => [...prev, modelMsg]);

      // ACTION PARSING
      const actionMatch = response.match(/\[ACTION:CREATE_ALERT:(.*?)\]/);
      if (actionMatch && user) {
        try {
          const alertData = JSON.parse(actionMatch[1]);
          await dbService.createAlert(user.uid, {
            keyword: alertData.keyword,
            maxPrice: alertData.maxPrice,
            category: alertData.category,
            currency: profile?.currency || "FCFA"
          });
          loadAlerts(); // Refresh list
        } catch (e) {
          console.error("Failed to parse or create alert:", e);
        }
      }

      if (user) {
        await dbService.saveGoMessage(user.uid, "model", response);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "model", parts: [{ text: "Désolé, j'ai eu un petit souci technique. Réessaie encore ?" }] }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (type: string) => {
    switch (type) {
      case "search": handleSend("Cherche des téléphones récents à Lagos"); break;
      case "alert": handleSend("Comment créer une alerte de prix ?"); break;
      case "trends": handleSend("Quelles sont les tendances du jour au Congo ?"); break;
      case "help": handleSend("Comment fonctionne NEXO ?"); break;
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!user) return;
    await dbService.deleteAlert(user.uid, id);
    loadAlerts();
  };

  const toggleAlertStatus = async (id: string, active: boolean) => {
    if (!user) return;
    await dbService.toggleAlert(user.uid, id, !active);
    loadAlerts();
  };

  return (
    <>
      {/* FLOAT BUTTON */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 z-[60] bg-brand text-white p-4 rounded-[24px] shadow-[0_10px_40px_rgba(124,58,237,0.4)] border border-white/20 group"
        >
          <Sparkles size={24} className="group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-bg"></div>
        </motion.button>
      )}

      {/* CHAT WINDOW / PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? "72px" : "600px",
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-2 right-2 left-2 md:left-auto md:bottom-24 md:right-4 z-[60] bg-card border border-white/10 rounded-[32px] shadow-2xl flex flex-col overflow-hidden w-[calc(100%-16px)] md:w-[400px] max-h-[80vh] md:max-h-none"
          >
            {/* HEADER */}
            <div className="p-5 flex items-center justify-between border-b border-white/5 bg-white/2 backdrop-blur-xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-black font-display tracking-tight text-white flex items-center gap-2">
                    Assistant Go 
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  </div>
                  <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Connecté au Cloud Nexo</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-all"
                >
                  {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-red-500/10 rounded-xl text-white/20 hover:text-red-500 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* TOOLBAR / TABS */}
                <div className="flex border-b border-white/5 bg-white/2 shrink-0">
                   <button 
                     onClick={() => setShowAlerts(false)}
                     className={cn(
                       "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2",
                       !showAlerts ? "text-brand border-brand bg-brand/5" : "text-white/20 border-transparent hover:text-white/40"
                     )}
                   >
                      Conversation
                   </button>
                   <button 
                     onClick={() => setShowAlerts(true)}
                     className={cn(
                       "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2",
                       showAlerts ? "text-brand border-brand bg-brand/5" : "text-white/20 border-transparent hover:text-white/40"
                     )}
                   >
                      Mes Alertes ({alerts.length})
                   </button>
                </div>

                {/* CONTENT AREA */}
                {!showAlerts ? (
                  <>
                    <div 
                      ref={scrollRef}
                      className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide"
                    >
                      {/* QUICK SUGGESTIONS */}
                      {messages.length <= 1 && (
                        <div className="grid grid-cols-2 gap-2 mb-6">
                           <SuggestionBtn icon={Search} label="Produits" onClick={() => handleSuggestion("search")} />
                           <SuggestionBtn icon={Bell} label="Alertes" onClick={() => handleSuggestion("alert")} />
                           <SuggestionBtn icon={TrendingUp} label="Tendances" onClick={() => handleSuggestion("trends")} />
                           <SuggestionBtn icon={HelpCircle} label="Aide" onClick={() => handleSuggestion("help")} />
                        </div>
                      )}

                      {messages.map((m, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "flex gap-3 max-w-[90%]",
                            m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-1 border shadow-sm",
                            m.role === "user" ? "bg-white/5 border-white/5" : "bg-brand border-brand/20 text-white"
                          )}>
                            {m.role === "user" ? <User size={14} /> : <Sparkles size={14} />}
                          </div>
                          <div className={cn(
                            "p-4 rounded-2xl text-sm leading-relaxed shadow-lg",
                            m.role === "user" ? "bg-brand text-white rounded-tr-none" : "bg-white/5 text-white/90 rounded-tl-none border border-white/5 backdrop-blur-sm"
                          )}>
                            <div className="markdown-body">
                              <ReactMarkdown>
                                {m.parts[0].text}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="flex gap-3 mr-auto items-center">
                          <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center">
                            <Bot size={14} className="text-white animate-pulse" />
                          </div>
                          <div className="flex gap-1.5 p-3 bg-white/5 rounded-2xl rounded-tl-none items-center border border-white/5">
                             <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                             <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                             <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce"></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* INPUT AREA */}
                    <div className="p-5 border-t border-white/5 bg-white/2 backdrop-blur-xl shrink-0">
                      <div className="relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 focus-within:border-brand/40 transition-all shadow-inner">
                        <input 
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSend()}
                          placeholder="Demande moi n'importe quoi..."
                          className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none placeholder:text-white/20"
                        />
                        <button 
                          onClick={() => handleSend()}
                          disabled={!input.trim() || loading}
                          className={cn(
                            "p-2.5 rounded-xl transition-all shadow-lg",
                            input.trim() && !loading ? "bg-brand text-white" : "bg-white/5 text-white/10"
                          )}
                        >
                           {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                     <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white/30">Surveillance active</h3>
                        <Button size="sm" variant="outline" className="text-[10px] h-8" onClick={() => handleSend("Crée une alerte pour moi")}>
                           Nouvelle Alerte
                        </Button>
                     </div>

                     {alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-10 text-white/20">
                           <BellOff size={40} />
                           <p className="text-[10px] font-black uppercase tracking-widest">Aucune alerte active.</p>
                        </div>
                     ) : (
                        alerts.map(a => (
                           <div key={a.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3 group">
                              <div className="flex justify-between items-start">
                                 <div className="flex items-center gap-3">
                                    <div className={cn(
                                       "w-8 h-8 rounded-xl flex items-center justify-center",
                                       a.active ? "bg-brand/20 text-brand" : "bg-white/5 text-white/20"
                                    )}>
                                       <Bell size={16} />
                                    </div>
                                    <div>
                                       <div className="text-sm font-bold text-white group-hover:text-brand transition-colors">
                                          {a.keywords?.join(", ") || "Tout produit"}
                                       </div>
                                       <div className="text-[10px] text-white/30 font-medium">
                                          {a.maxPrice ? `< ${a.maxPrice} ${a.currency || "FCFA"}` : "Tout prix"} • {a.category}
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => toggleAlertStatus(a.id, a.active)}
                                      className={cn(
                                        "w-8 h-4 rounded-full relative transition-all",
                                        a.active ? "bg-brand" : "bg-white/10"
                                      )}
                                    >
                                       <div className={cn(
                                         "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                                         a.active ? "right-0.5" : "left-0.5"
                                       )}></div>
                                    </button>
                                    <button onClick={() => handleDeleteAlert(a.id)} className="p-1.5 text-white/10 hover:text-red-500 transition-colors">
                                       <Trash2 size={14} />
                                    </button>
                                 </div>
                              </div>
                           </div>
                        ))
                     )}

                     <div className="pt-4 border-t border-white/5">
                        <div className="p-4 rounded-2xl bg-brand/5 border border-brand/10 text-[10px] text-brand font-bold leading-relaxed italic">
                           Go surveille le marché 24h/24. Tu recevras une notification push dès qu'une annonce correspondante sera publiée.
                        </div>
                     </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SuggestionBtn({ icon: Icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-brand/10 hover:border-brand/40 transition-all text-white/40 hover:text-brand shadow-sm"
    >
       <Icon size={20} />
       <span className="text-[8px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}

