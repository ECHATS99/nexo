import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase.ts";
import { Card, Badge, Button } from "../components/UI.tsx";
import { Users, Store, TrendingUp, Globe, ShieldCheck } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({
    users: 0,
    shops: 0,
    products: 0,
    activePlans: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // In a real app we'd trigger a cloud function or read a stats doc
      setStats({
        users: 1240,
        shops: 450,
        products: 3200,
        activePlans: 120
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col gap-8 py-8 px-6 animate-fade-in">
       <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-display font-black tracking-tight">Tableau de Bord Admin</h1>
          <p className="text-sm text-white/50">Gestion mondiale de l'écosystème NEXO.</p>
       </div>

       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Utilisateurs" value={stats.users} color="text-blue-500" />
          <StatCard icon={Store} label="Boutiques" value={stats.shops} color="text-brand" />
          <StatCard icon={TrendingUp} label="Produits" value={stats.products} color="text-pink-500" />
          <StatCard icon={ShieldCheck} label="Plans Pro" value={stats.activePlans} color="text-amber-500" />
       </div>

       <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/2 flex items-center justify-between">
             <h3 className="font-bold flex items-center gap-2 italic"><Globe size={16} /> Activité par Pays</h3>
             <Badge variant="verified">Live</Badge>
          </div>
          <div className="p-4 overflow-x-auto">
             <table className="w-full text-sm">
                <thead>
                   <tr className="text-left text-white/30 font-black uppercase tracking-widest text-[10px]">
                      <th className="py-3 px-4">Pays</th>
                      <th className="py-3 px-4">Utilisateurs</th>
                      <th className="py-3 px-4">Ventes</th>
                      <th className="py-3 px-4">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   <AdminRow flag="🇨🇬" country="Congo" users="850" sales="240" />
                   <AdminRow flag="🇫🇷" country="France" users="120" sales="45" />
                   <AdminRow flag="🇨🇲" country="Cameroun" users="90" sales="32" />
                </tbody>
             </table>
          </div>
       </Card>

       <div className="flex flex-col gap-4">
          <h3 className="font-bold flex items-center gap-2"><ShieldCheck size={18} /> Validations en attente</h3>
          <div className="flex flex-col gap-2">
             {[1,2].map(i => (
               <Card key={i} className="flex items-center justify-between p-4 bg-white/2">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white/10" />
                     <div>
                        <div className="text-sm font-bold">Boutique Tech Congo</div>
                        <div className="text-[10px] text-white/40">Demande de certification</div>
                     </div>
                  </div>
                  <Button size="sm" variant="outline">Vérifier</Button>
               </Card>
             ))}
          </div>
       </div>
    </div>
  );
}

function AdminRow({ flag, country, users, sales }: any) {
    return (
        <tr className="hover:bg-white/2 transition-colors">
            <td className="py-4 px-4 font-bold flex items-center gap-3">
                <span className="text-xl">{flag}</span>
                {country}
            </td>
            <td className="py-4 px-4 text-white/60">{users}</td>
            <td className="py-4 px-4 text-white/60">{sales}</td>
            <td className="py-4 px-4">
                <button className="text-brand text-xs font-bold hover:underline">Détails</button>
            </td>
        </tr>
    );
}

function StatCard({ icon: Icon, label, value, color }: any) {
    return (
        <Card className="flex flex-col gap-2 p-4 bg-white/2">
            <Icon size={20} className={color} />
            <div className="text-2xl font-display font-black leading-none">{value}</div>
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</div>
        </Card>
    );
}
