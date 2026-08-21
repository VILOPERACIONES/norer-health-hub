import React from 'react';
import { normalizeRecall24, hasRecall24Data } from '@/lib/recall24';

function SidebarSeccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#2a2a2a] rounded-[8px] p-3 bg-[#0f0f0f]">
      <p className="text-[9px] font-black text-[#555] uppercase tracking-widest mb-1.5">{titulo}</p>
      {children}
    </div>
  );
}

export interface PacienteResumenSidebarProps {
  pacienteNombre?: string;
  pacienteInfo: any;
  alimentosAEvitar: string[];
  tiemposNombres?: string[];
  suplementosDetalle: any[];
  comentarios?: string;
  esqueHidratacion?: string;
  notasLibres?: string;
  className?: string;
  /** Muestra la sección "Número de comidas". Default: false */
  mostrarTiemposComida?: boolean;
  /**
   * Oculta las secciones Tránsito Intestinal, Signos y Síntomas, Ciclo Menstrual,
   * Patología y Agua al día — solo para la vista de Personalizar Menú, donde no
   * aportan y sobrecargan el sidebar. Default: false (se muestran todas).
   */
  ocultarSeccionesMenu?: boolean;
}

export function PacienteResumenSidebar({
  pacienteNombre,
  pacienteInfo,
  alimentosAEvitar,
  tiemposNombres,
  suplementosDetalle,
  comentarios,
  esqueHidratacion,
  notasLibres,
  className = '',
  mostrarTiemposComida = false,
  ocultarSeccionesMenu = false,
}: PacienteResumenSidebarProps) {
  return (
    <aside className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        {/* Información prioritaria: lo que no come, alergias y sus tiempos de comida */}
        <SidebarSeccion titulo="Alimentos a evitar / No consume">
          {alimentosAEvitar.length > 0 ? (
            <ul className="space-y-1">
              {alimentosAEvitar.map((alimento, index) => (
                <li key={`${alimento}-${index}`} className="text-[12px] text-red-300 flex items-start gap-1.5 break-words">
                  <span className="mt-0.5 shrink-0 text-red-500">✕</span>
                  <span>{alimento}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-[#666] italic">Sin información registrada.</p>
          )}
        </SidebarSeccion>

        {pacienteInfo?.antecedentes?.alergias && (
          <SidebarSeccion titulo="Alergias"><p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.alergias}</p></SidebarSeccion>
        )}

        {mostrarTiemposComida && tiemposNombres && tiemposNombres.length > 0 && (
          <SidebarSeccion titulo="Número de comidas">
            <p className="text-[12px] font-bold text-white leading-snug">
              {tiemposNombres.length} tiempos:{' '}
              {tiemposNombres.join(', ')}
            </p>
          </SidebarSeccion>
        )}

        {/* En la vista de Personalizar Menú, Ejercicio se reemplaza por Alimentos que le gustan */}
        {ocultarSeccionesMenu && pacienteInfo?.antecedentes?.alimentosGustan && (
          <SidebarSeccion titulo="Le gustan / Consume">
            <p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.alimentosGustan}</p>
          </SidebarSeccion>
        )}

        {/* Ejercicio */}
        {!ocultarSeccionesMenu && (pacienteInfo?.ejercicio?.objetivo || pacienteInfo?.ejercicio?.disciplina) && (() => {
          const raw = pacienteInfo.ejercicio?.disciplina;
          let disciplinas: { disciplina?: string; frecuencia?: string; tiempo?: string }[] = [];
          if (raw) {
            if (Array.isArray(raw)) {
              disciplinas = raw;
            } else if (typeof raw === 'string') {
              try { disciplinas = JSON.parse(raw); } catch { disciplinas = [{ disciplina: raw }]; }
            }
          }
          return (
            <SidebarSeccion titulo="Ejercicio">
              <div className="space-y-1">
                {pacienteInfo.ejercicio?.objetivo && (
                  <p className="text-[12px] text-[#e0e0e0] mb-1">
                    <span className="text-[#8a8a8a]">Obj:</span> {pacienteInfo.ejercicio.objetivo}
                  </p>
                )}
                {disciplinas.length > 0 ? (
                  <ul className="space-y-0.5">
                    {disciplinas.map((d, i) => {
                      const partes = [
                        d.disciplina,
                        d.frecuencia,
                        d.tiempo,
                      ].filter(Boolean);
                      return (
                        <li key={i} className="text-[12px] text-[#e0e0e0]">
                          {partes.map((p, pi) => (
                            <span key={pi}>
                              {pi === 0
                                ? <span className="font-medium text-white capitalize">{p}</span>
                                : <><span className="text-[#555] mx-1">//</span><span className="text-[#aaa]">{p}</span></>
                              }
                            </span>
                          ))}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  pacienteInfo.ejercicio?.frecuencia && (
                    <p className="text-[12px] text-[#e0e0e0]">
                      <span className="text-[#8a8a8a]">Frecuencia:</span> {pacienteInfo.ejercicio.frecuencia}
                    </p>
                  )
                )}
              </div>
            </SidebarSeccion>
          );
        })()}

        {/* Suplementos activos */}
        {suplementosDetalle.filter((s: any) => s.activo && s.nombre).length > 0 && (
          <SidebarSeccion titulo="Suplementos activos">
            <ul className="space-y-1">
              {suplementosDetalle.filter((s: any) => s.activo && s.nombre).map((s: any, i: number) => (
                <li key={i} className="text-[12px] text-[#e0e0e0] flex items-start gap-1.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  <span><span className="font-semibold text-white">{s.nombre}</span>{s.indicaciones && <span className="text-[#8a8a8a]"> — {s.indicaciones}</span>}</span>
                </li>
              ))}
            </ul>
          </SidebarSeccion>
        )}

        {/* Recordatorio 24 Horas */}
        {hasRecall24Data(normalizeRecall24(pacienteInfo?.habitos)) && (
          <SidebarSeccion titulo="Recordatorio 24 Horas">
            <ul className="space-y-1.5">
              {normalizeRecall24(pacienteInfo?.habitos).map((row, index) => (
                (row.hora || row.notas) && (
                  <li key={`${row.label}-${index}`} className="text-[12px] text-[#e0e0e0]">
                    <span className="font-semibold text-white">{row.label}</span>
                    {row.hora && <span className="text-[#8a8a8a]"> — {row.hora}</span>}
                    {row.notas && <p className="text-[#8a8a8a] mt-0.5">{row.notas}</p>}
                  </li>
                )
              ))}
            </ul>
          </SidebarSeccion>
        )}

        {/* Notas clínicas */}
        {comentarios && (
          <SidebarSeccion titulo="Notas clínicas">
            <p className="text-[12px] text-[#e0e0e0] whitespace-pre-wrap leading-relaxed">{comentarios}</p>
          </SidebarSeccion>
        )}

        {/* Patología */}
        {!ocultarSeccionesMenu && pacienteInfo?.antecedentes?.patologia && (
          <SidebarSeccion titulo="Patología"><p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.patologia}</p></SidebarSeccion>
        )}

        {/* Fármacos */}
        {((pacienteInfo?.antecedentes?.farmacosDetalle?.length ?? 0) > 0 || pacienteInfo?.antecedentes?.farmacos) && (
          <SidebarSeccion titulo="Fármacos">
            {pacienteInfo?.antecedentes?.farmacosDetalle && pacienteInfo.antecedentes.farmacosDetalle.length > 0 ? (
              <ul className="list-disc list-inside space-y-0.5">
                {pacienteInfo.antecedentes.farmacosDetalle.map((f: any, i: number) => (
                  <li key={i} className="text-[12px] text-[#e0e0e0]">
                    {f.nombre}{f.tiempoTomando ? ` — ${f.tiempoTomando}` : ''}{!f.activo ? ' (ya no)' : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.farmacos}</p>
            )}
          </SidebarSeccion>
        )}

        {/* Ciclo menstrual */}
        {!ocultarSeccionesMenu && pacienteInfo?.antecedentes?.cicloMenstrual && (
          <SidebarSeccion titulo="Ciclo Menstrual"><p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.cicloMenstrual}</p></SidebarSeccion>
        )}

        {/* Alimentos que sí le gustan (ya se muestra arriba, en lugar de Ejercicio, en Personalizar Menú) */}
        {!ocultarSeccionesMenu && pacienteInfo?.antecedentes?.alimentosGustan && (
          <SidebarSeccion titulo="Le gustan / Consume">
            <p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.alimentosGustan}</p>
          </SidebarSeccion>
        )}

        {/* Tránsito intestinal */}
        {!ocultarSeccionesMenu && pacienteInfo?.antecedentes?.estrenimiento && (
          <SidebarSeccion titulo="Tránsito Intestinal">
            <p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.estrenimiento}</p>
          </SidebarSeccion>
        )}

        {/* Agua (reporte del paciente en entrevista) */}
        {!ocultarSeccionesMenu && pacienteInfo?.antecedentes?.agua && (
          <SidebarSeccion titulo="Agua al día (reporte paciente)">
            <p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.agua}</p>
          </SidebarSeccion>
        )}

        {/* Esquema de hidratación prescrito en consulta */}
        {esqueHidratacion && (
          <SidebarSeccion titulo="Esquema de Hidratación">
            <p className="text-[12px] text-[#e0e0e0] whitespace-pre-wrap leading-relaxed">{esqueHidratacion}</p>
          </SidebarSeccion>
        )}

        {/* Signos y síntomas */}
        {!ocultarSeccionesMenu && pacienteInfo?.antecedentes?.signosYSintomas && (
          <SidebarSeccion titulo="Signos y Síntomas">
            <p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.signosYSintomas}</p>
          </SidebarSeccion>
        )}

        {/* Hora y duración entrenamiento */}
        {(pacienteInfo?.ejercicio?.horaEntrenamiento || pacienteInfo?.ejercicio?.tiempo) && (
          <SidebarSeccion titulo="Entrenamiento">
            <div className="space-y-0.5">
              {pacienteInfo.ejercicio?.horaEntrenamiento && <p className="text-[12px] text-[#e0e0e0]"><span className="text-[#8a8a8a]">Hora:</span> {pacienteInfo.ejercicio.horaEntrenamiento}</p>}
              {pacienteInfo.ejercicio?.tiempo && <p className="text-[12px] text-[#e0e0e0]"><span className="text-[#8a8a8a]">Duración:</span> {pacienteInfo.ejercicio.tiempo}</p>}
            </div>
          </SidebarSeccion>
        )}

        {/* Historial suplementos */}
        {pacienteInfo?.antecedentes?.historialProductos && (
          <SidebarSeccion titulo="Historial suplementos">
            <p className="text-[12px] text-[#8a8a8a] italic">{pacienteInfo.antecedentes.historialProductos}</p>
          </SidebarSeccion>
        )}

        {/* Notas de entrenamiento */}
        {notasLibres && (
          <SidebarSeccion titulo="Notas de Entrenamiento">
            <p className="text-[12px] text-[#e0e0e0] whitespace-pre-wrap leading-relaxed">{notasLibres}</p>
          </SidebarSeccion>
        )}
      </div>
    </aside>
  );
}
