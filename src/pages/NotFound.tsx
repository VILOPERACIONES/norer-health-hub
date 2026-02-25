import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center animate-fade-in">
      <div className="text-center space-y-8">
        <div className="relative">
           <h1 className="text-[120px] font-black text-primary/10 tracking-tighter leading-none select-none">404</h1>
           <p className="absolute inset-0 flex items-center justify-center text-3xl font-black text-foreground uppercase tracking-widest">
              Extraviado
           </p>
        </div>
        
        <div className="max-w-md mx-auto space-y-4">
           <p className="text-muted-foreground font-semibold px-4">
              La página que buscas no existe o ha sido movida. Verifica la URL o regresa al inicio.
           </p>
        </div>
        
        <div className="pt-4">
           <a 
             href="/" 
             className="inline-flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.05] active:scale-[0.98] transition-all"
           >
              Regresar al Dashboard
           </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
