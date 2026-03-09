import { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon, Mail, MessageSquare, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPass, setShowPass] = useState(false);

  // Configuración de envío
  const [emailRemitente, setEmailRemitente] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [asuntoCorreo, setAsuntoCorreo] = useState('Tu plan alimenticio - NORER Health');
  const [mensajeWhatsApp, setMensajeWhatsApp] = useState('Hola! Te comparto tu plan alimenticio personalizado. Cualquier duda estoy aquí para ayudarte. 🥗');

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/api/configuracion');
        const cfg = data?.data || data;
        if (cfg) {
          if (cfg.emailRemitente) setEmailRemitente(cfg.emailRemitente);
          if (cfg.asuntoCorreo) setAsuntoCorreo(cfg.asuntoCorreo);
          // El backend puede devolver el campo como mensajeWhatsApp (capital A)
          const msg = cfg.mensajeWhatsApp || cfg.mensajeWhatsapp;
          if (msg) setMensajeWhatsApp(msg);
          // No pre-llenar el password por seguridad
        }
      } catch {
        // Sin configuración previa, usar defaults
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!emailRemitente) {
      toast({ title: 'Campo requerido', description: 'El email remitente es obligatorio.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        emailRemitente,
        asuntoCorreo,
        mensajeWhatsApp,  // capital A — coincide con el schema del backend
      };
      if (emailPassword) payload.emailPassword = emailPassword;

      await api.put('/api/configuracion', payload);
      toast({ title: 'Configuración guardada', description: 'Los ajustes de envío han sido actualizados.' });
      setEmailPassword(''); // Limpiar el password después de guardar
    } catch (err: any) {
      toast({
        title: 'Error al guardar',
        description: err.response?.data?.message || 'No se pudo guardar la configuración.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
      <div className="w-6 h-6 rounded-full border-2 border-border-subtle border-t-text-primary animate-spin" />
      <p className="text-[13px] font-medium text-text-muted">Cargando configuración...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-none w-full pb-20 px-6 lg:px-10 mt-2">
      {/* HEADER */}
      <div className="border-b border-border-subtle pb-6 space-y-1">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-5 h-5 text-text-muted" />
          <h1 className="text-[26px] font-bold text-text-primary m-0 tracking-tight">Configuración</h1>
        </div>
        <p className="text-[14px] text-text-secondary m-0">Ajusta los parámetros de envío de planes al paciente</p>
      </div>

      {/* CONFIGURACIÓN DE ENVÍO */}
      <div className="bg-bg-surface border border-border-subtle rounded-[12px] p-6 space-y-6">
        {/* Header sección */}
        <div className="flex items-center gap-3 border-b border-border-default pb-4">
          <div className="p-2 rounded-[8px] bg-bg-elevated">
            <Mail className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-text-primary m-0">Configuración de envío</h3>
            <p className="text-[12px] text-text-muted m-0">Correo electrónico y WhatsApp para entregar planes</p>
          </div>
        </div>

        {/* Email remitente */}
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium text-text-secondary m-0">
            Email remitente
          </label>
          <input
            type="email"
            value={emailRemitente}
            onChange={(e) => setEmailRemitente(e.target.value)}
            placeholder="eyder@norer.health"
            className="w-full bg-bg-elevated rounded-[8px] px-3 py-2.5 text-[14px] font-normal text-text-primary outline-none border border-border-subtle focus:border-[#444] transition-colors placeholder:text-text-muted"
          />
          <p className="text-[11px] text-text-muted m-0">Dirección desde la cual se enviarán los correos al paciente</p>
        </div>

        {/* Contraseña de aplicación */}
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium text-text-secondary m-0">
            Contraseña de aplicación (SMTP)
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="Dejar vacío para mantener el actual"
              className="w-full bg-bg-elevated rounded-[8px] px-3 py-2.5 pr-10 text-[14px] font-mono text-text-primary outline-none border border-border-subtle focus:border-[#444] transition-colors placeholder:text-text-muted font-normal"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-text-muted m-0">
            Contraseña de aplicación de Gmail/Outlook — NO es tu contraseña normal.{' '}
            <a
              href="https://support.google.com/accounts/answer/185833"
              target="_blank"
              rel="noreferrer"
              className="text-text-secondary underline underline-offset-2 hover:text-text-primary"
            >
              ¿Cómo obtenerla?
            </a>
          </p>
        </div>

        {/* Asunto del correo */}
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium text-text-secondary m-0">
            Asunto del correo
          </label>
          <input
            type="text"
            value={asuntoCorreo}
            onChange={(e) => setAsuntoCorreo(e.target.value)}
            placeholder="Tu plan alimenticio - NORER Health"
            className="w-full bg-bg-elevated rounded-[8px] px-3 py-2.5 text-[14px] font-normal text-text-primary outline-none border border-border-subtle focus:border-[#444] transition-colors placeholder:text-text-muted"
          />
        </div>

        {/* Mensaje de WhatsApp */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <label className="block text-[12px] font-medium text-text-secondary m-0">
              Mensaje de WhatsApp
            </label>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-text-muted" />
            </div>
          </div>
          <textarea
            value={mensajeWhatsApp}
            onChange={(e) => setMensajeWhatsApp(e.target.value)}
            rows={4}
            placeholder="Mensaje que acompaña el PDF enviado por WhatsApp..."
            className="w-full bg-bg-elevated rounded-[8px] px-3 py-2.5 text-[14px] font-normal text-text-primary outline-none border border-border-subtle focus:border-[#444] transition-colors resize-y placeholder:text-text-muted"
          />
          <p className="text-[11px] text-text-muted m-0">
            Este texto se enviará junto con el PDF del plan al WhatsApp del paciente.
          </p>
        </div>

        {/* Vista previa del mensaje */}
        {mensajeWhatsApp && (
          <div className="bg-bg-elevated rounded-[10px] border border-border-subtle p-4 space-y-2">
            <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider m-0">Vista previa — WhatsApp</p>
            <div className="bg-[#1a2e1a] rounded-[8px] rounded-tl-none p-3 max-w-[80%] border border-accent-green/10">
              <p className="text-[13px] text-accent-green m-0 leading-relaxed whitespace-pre-wrap">{mensajeWhatsApp}</p>
            </div>
            <p className="text-[11px] text-text-muted m-0">+ PDF adjunto del plan</p>
          </div>
        )}
      </div>

      {/* BOTÓN GUARDAR */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-bg-base rounded-[8px] text-[14px] font-bold hover:bg-[#e0e0e0] transition-all disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
