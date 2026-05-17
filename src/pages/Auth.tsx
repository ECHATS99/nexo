import { useState } from "react";
import { authService } from "../services/authService.ts";
import { useNexo } from "../App.tsx";
import { Button, Input, Card } from "../components/UI.tsx";
import { Mail, Lock, User, LogIn, ArrowRight } from "lucide-react";

export default function Auth() {
  const { setActivePage, refreshProfile } = useNexo();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await authService.signIn(form.email, form.password);
      } else {
        await authService.signUp(form.email, form.password, form.name);
      }
      await refreshProfile();
      setActivePage("home");
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
      await refreshProfile();
      setActivePage("home");
    } catch (e: any) {
      setError(e.message || "Erreur de connexion Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center py-12 px-6 animate-fade-in">
      <div className="w-full flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="text-5xl font-display font-black text-brand mb-2">NEXO</div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {isLogin ? "Bon retour !" : "Crée ton compte"}
          </h1>
          <p className="text-sm text-white/50 px-4">
            {isLogin 
              ? "Connecte-toi pour gérer ta boutique et tes messages." 
              : "Rejoins la plus grande plateforme de vente au Congo."
            }
          </p>
        </div>

        <Card className="flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <Input 
                label="Nom Complet" 
                icon={User} 
                placeholder="Ex: Jean Congo" 
                required
                value={form.name}
                onChange={(e: any) => setForm({...form, name: e.target.value})}
              />
            )}
            <Input 
              label="Email" 
              icon={Mail} 
              type="email" 
              placeholder="votre@email.com" 
              required
              value={form.email}
              onChange={(e: any) => setForm({...form, email: e.target.value})}
            />
            <Input 
              label="Mot de passe" 
              icon={Lock} 
              type="password" 
              placeholder="••••••••" 
              required
              value={form.password}
              onChange={(e: any) => setForm({...form, password: e.target.value})}
            />

            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold">{error}</div>}

            <Button 
              type="submit" 
              loading={loading} 
              className="mt-2"
              icon={LogIn}
            >
              {isLogin ? "Se Connecter" : "S'Inscrire"}
            </Button>
          </form>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-[1px] bg-white/5"></div>
            <span className="text-[10px] font-black uppercase text-white/20 whitespace-nowrap">OU CONTINUER AVEC</span>
            <div className="flex-1 h-[1px] bg-white/5"></div>
          </div>

          <Button 
            variant="secondary" 
            onClick={handleGoogle}
            disabled={loading}
            className="w-full"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 mr-2" alt="Google" />
            Google
          </Button>

          <div className="pt-4 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-white/50 hover:text-brand transition-colors inline-flex items-center gap-2"
            >
              {isLogin ? "Nouveau sur Nexo ?" : "Déjà un compte ?"}
              <span className="text-brand flex items-center gap-1 uppercase tracking-widest text-[10px]">
                {isLogin ? "S'inscrire" : "Se connecter"} 
                <ArrowRight size={12} />
              </span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
