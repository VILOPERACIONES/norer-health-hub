import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  resetKey: number;
}

export class ChatErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[NorderHealthChat] render crash:', error, info.componentStack);
  }

  private reset = () => this.setState((s) => ({ hasError: false, resetKey: s.resetKey + 1 }));

  render() {
    if (!this.state.hasError) return <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>;

    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 bg-[#0a0a0a] px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#1a0f0f] border border-[#3a1515] flex items-center justify-center">
          <AlertTriangle size={20} className="text-[#f87171]" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[15px] font-bold text-white">Algo salió mal en el chat</p>
          <p className="text-[12px] text-[#555] mt-1.5 max-w-[260px]">
            Ocurrió un error inesperado. Puedes reintentar o volver al inicio.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={this.reset}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-[#22c55e] text-black text-[13px] font-bold active:scale-[0.97] transition-transform"
          >
            <RotateCcw size={13} strokeWidth={2.5} />
            Reintentar
          </button>
          <Link
            to="/norder-health"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] border border-[#252525] text-[#888] text-[13px] font-semibold"
          >
            <ArrowLeft size={13} strokeWidth={2.5} />
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }
}
