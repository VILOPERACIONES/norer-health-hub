import fs from 'fs';

const p = '/Users/eliamjesuscauichvillanueva/Documents/norder-crm/norer-health-hub/src/pages/NewAssessment.tsx';
let txt = fs.readFileSync(p, 'utf8');

txt = txt.replace(/<div className="flex items-center justify-center max-w-lg mx-auto w-full mb-5 mt-1 shrink-0">([\s\S]*?)<div className="w-full flex-1 flex flex-col overflow-y-auto custom-scrollbar" id="escrol">/g, '<div className="w-full flex-1 flex flex-col overflow-y-auto custom-scrollbar px-2" id="main-scroll">');

const renderContent = `        <div className="w-full flex-1 flex flex-col overflow-y-auto custom-scrollbar px-2 pb-24" id="main-scroll">
          
          <div className="flex flex-col flex-shrink-0 animate-slide-up gap-4 mb-10">
            <div className="shrink-0 mb-1">
              <div className="flex items-center gap-2 mb-2">
                 <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[11px] font-bold">1</span>
                 <p className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-[0.15em] m-0">VALORACIÓN CLÍNICA</p>
              </div>
              <h3 className="text-[22px] font-bold text-white m-0 tracking-tight">Medidas y Temario</h3>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-4">
               {/* COLUMNA 1: ANTROPOMETRÍA */}
               <div className="bg-[#111111] p-5 rounded-[16px] border border-[#2a2a2a] flex flex-col shrink-0">
                 <h4 className="text-[13px] font-bold text-white tracking-widest uppercase mb-4">Medidas Antropométricas</h4>
                 <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
                   <Field label="Fecha" value={fecha} onChange={setFecha} type="date" disabled={!!valoracionIdGuardada} />
                   <Field label="Hora" value={hora} onChange={setHora} type="time" disabled={!!valoracionIdGuardada} />
                   
                   <Field label="Peso" value={peso} onChange={setPeso} suffix="kg" placeholder="Ej. 68.5" disabled={!!valoracionIdGuardada} />
                   <Field label="Estatura" value={estatura} onChange={setEstatura} suffix="cm" placeholder="Ej. 165" disabled={!!valoracionIdGuardada} />
                   
                   <Field label="% Grasa Corp." value={pctGrasa} onChange={(v) => { setPctGrasa(v); setIsGrasaModified(true); }} placeholder="Ej. 24.3" disabled={!!valoracionIdGuardada} />
                   <Field label="Masa Muscular" value={masaMagra !== null ? masaMagra.toFixed(2) : ''} disabled suffix="kg" placeholder="Auto" />
                 </div>
               </div>

               {/* COLUMNA 2: TEMARIO */}
               <div className="bg-[#111111] p-5 rounded-[16px] border border-[#2a2a2a] flex flex-col h-[400px]">
                  <h4 className="text-[12px] font-bold text-white tracking-widest uppercase mb-3 shrink-0">Notas y Temario</h4>
                  <div className="shrink-0 mb-4">
                     <label className="block text-[10px] font-bold text-[#8a8a8a] m-0 mb-1.5 uppercase tracking-widest">Notas Clínicas</label>
                     <textarea
                       disabled={!!valoracionIdGuardada}
                       value={comentarios}
                       onChange={(e) => setComentarios(e.target.value)}
                       className="w-full bg-[#181818] rounded-[6px] px-3 py-2 text-[13px] font-medium text-white outline-none border border-[#333] focus:border-[#555] min-h-[60px] resize-y transition-colors placeholder-[#555] disabled:opacity-60"
                       placeholder="Observaciones relevantes de la consulta..."
                     />
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                     <div className="flex items-center justify-between pb-2 border-b border-[#2a2a2a] shrink-0 mb-3">
                       <label className="block text-[11px] font-bold text-[#8a8a8a] m-0 uppercase tracking-widest">Temario Abordado</label>
                       {!valoracionIdGuardada && (
                         <button onClick={addTema} className="text-[11px] font-bold text-white hover:opacity-70 flex items-center gap-1.5 transition-colors uppercase tracking-wider bg-[#1a1a1a] px-3 py-1.5 border border-[#333] rounded-[6px]">
                           <Plus className="h-3 w-3" strokeWidth={3} /> Agregar
                         </button>
                       )}
                     </div>

                     {temario.length === 0 && (
                       <div className="flex flex-col items-center justify-center py-6 border border-[#2a2a2a] border-dashed rounded-[12px] bg-[#141414] shrink-0">
                         <p className="text-[12px] text-[#8a8a8a] text-center max-w-sm px-4">
                           Sin temas asignados. Haz clic en "Agregar" para ir alistando el temario a tratar.
                         </p>
                       </div>
                     )}

                     <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                       {temario.map((t, idx) => (
                         <div key={t.id} className="relative group space-y-2 pb-3 pt-1 border-b border-[#2a2a2a] last:border-0 last:pb-0">
                           {!valoracionIdGuardada && (
                             <button onClick={() => removeTema(idx)} className="absolute top-1 right-0 p-1.5 text-[#555] hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 rounded-[6px] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all z-10">
                               <Trash2 className="h-4 w-4" />
                             </button>
                           )}
                           <input
                             disabled={!!valoracionIdGuardada}
                             type="text"
                             placeholder="Título del tema..."
                             value={t.tema}
                             onChange={(e) => updateTema(idx, 'tema', e.target.value)}
                             className="w-full bg-transparent text-[14px] font-bold text-white outline-none placeholder-[#555] pr-8 border-none m-0 p-0 disabled:opacity-80"
                           />
                           <textarea
                             disabled={!!valoracionIdGuardada}
                             placeholder="Detalles y comentarios de lo conversado..."
                             value={t.detalle}
                             onChange={(e) => updateTema(idx, 'detalle', e.target.value)}
                             className="w-full bg-[#181818] border border-[#333] focus:border-[#555] rounded-[6px] p-2.5 text-[12px] font-medium text-[#8a8a8a] outline-none min-h-[50px] resize-none placeholder-[#444] transition-colors disabled:opacity-60"
                           />
                         </div>
                       ))}
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className={`flex flex-col flex-shrink-0 animate-slide-up gap-4 mb-8 transition-all ${valoracionIdGuardada ? 'opacity-60' : ''}`}>
            <div className="shrink-0 mb-1">
              <div className="flex items-center gap-2 mb-2">
                 <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[11px] font-bold">2</span>
                 <p className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-[0.15em] m-0">METABOLISMO Y MACROS</p>
              </div>
              <h3 className="text-[22px] font-bold text-white m-0 tracking-tight">Equivalencias y Cuadro Sintético</h3>
            </div>

            <div className="bg-[#111111] px-5 py-4 rounded-[16px] border border-[#2a2a2a] shadow-none Pointer-events-none">
              <div className={`${valoracionIdGuardada ? 'pointer-events-none' : ''}`}>
                 <BarridoEquivalenciasComp value={barridoData} onChange={(data) => setBarridoData(data)} hideHeader={true} />
              </div>
            </div>
          </div>

          {!valoracionIdGuardada && (
            <div className="flex justify-end p-4 mb-16 bg-[#0a0a0a] sticky bottom-0 z-20 border-t border-[#1a1a1a]">
              <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                   onClick={() => handleSave(false)}
                   disabled={saving || barridoData?.isValid === false}
                   className="px-5 py-3 bg-transparent border border-[#333] text-white rounded-[8px] text-[13px] font-bold hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                 >
                   {saving ? 'Guardando...' : 'Guardar y Salir'}
                 </button>
                 <button
                   onClick={() => {
                      handleSave(true);
                      setTimeout(() => {
                         const section = document.getElementById('seccion-plan');
                         if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 1000);
                   }}
                   disabled={saving || barridoData?.isValid === false}
                   className="px-8 py-3 bg-white text-black rounded-[8px] text-[13px] font-bold hover:bg-[#e0e0e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2 justify-center"
                 >
                   {saving ? <div className="w-4 h-4 border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a] rounded-full animate-spin" /> : <>Validar y Crear Plan Nutricional →</>}
                 </button>
              </div>
            </div>
          )}

          <div id="seccion-plan" className={`flex flex-col flex-shrink-0 animate-slide-up gap-4 mt-8 pt-10 border-t border-[#1a1a1a] relative min-h-[400px] transition-all \${!valoracionIdGuardada ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
            {!valoracionIdGuardada && (
               <div className="absolute inset-x-0 inset-y-0 z-20 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="bg-[#111] px-6 py-4 rounded-xl border border-[#333] text-[#8a8a8a] font-medium text-[13px] shadow-2xl">
                    Debes guardar la valoración primero para habilitar el plan.
                  </div>
               </div>
            )}
            
            <div className="shrink-0 mb-1">
              <div className="flex items-center gap-2 mb-2">
                 <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[11px] font-bold">3</span>
                 <p className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-[0.15em] m-0">ELABORACIÓN DEL PLAN</p>
              </div>
            </div>

            <div className="\${planIdGuardado ? 'pointer-events-none opacity-60' : ''}">
               <CreateEditPlanForm 
                 pacienteId={pacienteId} 
                 valoracionId={valoracionIdGuardada || undefined} 
                 onSaved={(planId) => {
                    setPlanIdGuardado(planId);
                    setTimeout(() => {
                       const section = document.getElementById('seccion-envio');
                       if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 500);
                 }}
                 hideHeader={true}
               />
            </div>
          </div>

          <div id="seccion-envio" className={`flex flex-col flex-shrink-0 animate-slide-up gap-4 mt-16 pt-10 border-t border-[#1a1a1a] relative transition-all \${!planIdGuardado ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
            {!planIdGuardado && (
               <div className="absolute inset-x-0 inset-y-0 z-20 flex items-center justify-center backdrop-blur-[2px] mt-20">
                  <div className="bg-[#111] px-6 py-4 rounded-xl border border-[#333] text-[#8a8a8a] font-medium text-[13px] shadow-2xl">
                    Guarda el plan nutricional para habilitar las opciones de envío.
                  </div>
               </div>
            )}

            <div className="shrink-0 mb-4">
              <div className="flex items-center gap-2 mb-2">
                 <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[11px] font-bold">4</span>
                 <p className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-[0.15em] m-0">ENTREGA Y ENVÍO</p>
              </div>
            </div>

            {planIdGuardado && (
              <Phase4Delivery 
                pacienteId={pacienteId!} 
                planId={planIdGuardado!}
                onFinish={() => navigate(`/pacientes/${pacienteId}`)}
              />
            )}
            
            {!planIdGuardado && (
              <div className="h-[600px] bg-[#0a0a0a]" />
            )}
          </div>

        </div>`;

// We will find the starting tag: `<div className="w-full flex-1 flex flex-col overflow-y-auto custom-scrollbar">`
const startIndex = txt.indexOf(`{/* STEPPER */}`);
let beforeStr = txt.substring(0, startIndex);

const outStr = beforeStr + renderContent + `\n      </div>\n    </div>\n  );\n};\n\nexport default NewAssessment;\n`;

fs.writeFileSync(p, outStr);
console.log("Done");
