import { useState, useEffect, useRef, useCallback } from "react";
import {
  getKpis, getParEtablissement, getParPathologie, getEvolution,
  getEtablissements, getAnneesDisponibles, getMoisDisponibles,
  getSemainesDisponibles, getJoursDisponibles
} from "../data/api";
import { BoutonExport } from "./ExportPDF";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
function getToken() { return localStorage.getItem("vh_token"); }
async function api(path) {
  const r = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!r.ok) return [];
  return r.json();
}

const COLORS = {
  teal:"#00A89D", lime:"#8DC63F", gray:"#ADB5BD",
  blue:"#3B82F6", amber:"#F59E0B", indigo:"#6366F1",
  red:"#EF4444", pink:"#EC4899",
};
const CHART_COLORS = [COLORS.teal,COLORS.lime,COLORS.blue,COLORS.amber,COLORS.indigo,COLORS.red,COLORS.pink,COLORS.gray];
const PATHO_COLORS = [COLORS.teal,COLORS.lime,COLORS.gray,COLORS.blue,COLORS.amber,"#E2E8F0"];

const KPI_CONFIG = [
  {key:"total_hospitalisations", label:"Hospitalisations",    unit:"",  accent:"teal", badge:"Période sélectionnée", color:COLORS.teal,  evoKey:"hospitalisations"},
  {key:"duree_moyenne_sejour",   label:"Durée moy. séjour",   unit:"j", accent:"lime",                               color:COLORS.lime,  evoKey:"duree_moyenne"},
  {key:"taux_deces",             label:"Taux de décès",       unit:"%", accent:"gray",                               color:COLORS.red,   evoKey:"taux_deces"},
  {key:"repartition_urgences",   label:"Hospitalisations urgence", unit:"%", accent:"teal",                          color:COLORS.amber, evoKey:"repartition_urgences"},
  {key:"total_sortis",           label:"Patients sortis",     unit:"",  accent:"teal",                               color:COLORS.teal,  evoKey:"sortis"},
  {key:"total_transferts",       label:"Transferts",          unit:"",  accent:"gray",                               color:COLORS.amber, evoKey:"transferts"},
  {key:"taux_nuit",              label:"Hospit. de nuit",     unit:"%", accent:"gray",                               color:COLORS.indigo,evoKey:"taux_nuit"},
  {key:"taux_weekend",           label:"Hospit. week-end",    unit:"%", accent:"lime",                               color:COLORS.lime,  evoKey:"taux_weekend"},
];

// ── Charts ────────────────────────────────────────────────────
function BarChart({canvasId,labels,data,color,showValues=false}){
  const ref=useRef(null),chartRef=useRef(null);
  useEffect(()=>{
    if(!ref.current||!window.Chart)return;
    if(chartRef.current)chartRef.current.destroy();
    chartRef.current=new window.Chart(ref.current,{type:"bar",data:{labels,datasets:[{data,backgroundColor:color+"30",borderColor:color,borderWidth:1.5,borderRadius:4,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},datalabels:false},scales:{y:{beginAtZero:true,ticks:{font:{size:10},color:"#ADB5BD"},grid:{color:"#F1F3F5"}},x:{ticks:{font:{size:10},color:"#ADB5BD",maxRotation:45,autoSkip:false},grid:{display:false}}},..( showValues ? {plugins:{legend:{display:false},tooltip:{enabled:true}}} : {})}});
    // Ajouter les valeurs au-dessus si showValues
    if(showValues && chartRef.current){
      const original = chartRef.current.options.animation?.onComplete;
      chartRef.current.options.plugins = chartRef.current.options.plugins || {};
      chartRef.current.options.plugins.datalabels = {
        display: true,
        anchor: "end",
        align: "top",
        color: color,
        font: { size: 10, weight: "bold" },
        formatter: (val) => val > 0 ? val.toLocaleString("fr-CH") : "",
      };
    }
    return()=>chartRef.current?.destroy();
  },[JSON.stringify(labels),JSON.stringify(data),showValues]);
  return <canvas ref={ref} id={canvasId}/>;
}

function LineChart({canvasId,labels,data,color,compareData,compareColor,mainLegend,compareLegend}){
  const ref=useRef(null),chartRef=useRef(null);
  useEffect(()=>{
    if(!ref.current||!window.Chart)return;
    if(chartRef.current)chartRef.current.destroy();
    const datasets=[{label:mainLegend||"Période actuelle",data,borderColor:color,backgroundColor:color+"15",borderWidth:2,pointRadius:4,pointBackgroundColor:"#FFF",pointBorderColor:color,pointBorderWidth:2,fill:true,tension:0.35}];
    if(compareData&&compareData.length)datasets.push({label:compareLegend||"Période comparée",data:compareData,borderColor:compareColor||"#ADB5BD",backgroundColor:"transparent",borderWidth:2,borderDash:[5,4],pointRadius:3,pointBackgroundColor:"#FFF",pointBorderColor:compareColor||"#ADB5BD",pointBorderWidth:2,fill:false,tension:0.35});
    chartRef.current=new window.Chart(ref.current,{type:"line",data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:!!(compareData&&compareData.length),position:"top",labels:{font:{size:11},boxWidth:16,padding:12}}},scales:{y:{beginAtZero:true,ticks:{font:{size:10},color:"#ADB5BD"},grid:{color:"#F1F3F5"}},x:{ticks:{font:{size:10},color:"#ADB5BD",maxRotation:45,autoSkip:false},grid:{display:false}}}}});
    return()=>chartRef.current?.destroy();
  },[JSON.stringify(labels),JSON.stringify(data),JSON.stringify(compareData)]);
  return <canvas ref={ref} id={canvasId}/>;
}

function DoughnutChart({canvasId,labels,data,colors,showLegend=false}){
  const ref=useRef(null),chartRef=useRef(null);
  useEffect(()=>{
    if(!ref.current||!window.Chart)return;
    if(chartRef.current)chartRef.current.destroy();
    chartRef.current=new window.Chart(ref.current,{type:"doughnut",data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:2,borderColor:"#fff",hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:showLegend,position:"right",labels:{font:{size:10},boxWidth:12,padding:8}}},cutout:"60%"}});
    return()=>chartRef.current?.destroy();
  },[JSON.stringify(data)]);
  return <canvas ref={ref} id={canvasId}/>;
}

// ── Mini camembert avec légende ───────────────────────────────
function MiniDonut({title,data,canvasId,height=130}){
  if(!data||!data.length)return(
    <div style={{textAlign:"center",color:"#ADB5BD",fontSize:12,paddingTop:20}}>Aucune donnée</div>
  );
  const top=data.slice(0,6);
  const colors=CHART_COLORS.slice(0,top.length);
  return(
    <div>
      <div style={{height,position:"relative"}}>
        <DoughnutChart canvasId={canvasId} labels={top.map(d=>d.label)} data={top.map(d=>d.count)} colors={colors}/>
      </div>
      <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:3}}>
        {top.map((d,i)=>(
          <div key={d.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:10}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:colors[i],flexShrink:0}}/>
              <span style={{color:"#475569",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{d.label}</span>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <span style={{fontWeight:700,color:colors[i]}}>{d.pourcentage}%</span>
              <span style={{color:"#94A3B8"}}>({d.count})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Multi-select établissements ───────────────────────────────
function EtabMultiSelect({etablissements,selected,onChange}){
  const [open,setOpen]=useState(false),ref=useRef(null);
  useEffect(()=>{
    const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  const isAll=selected.length===0||selected.length===etablissements.length;
  const label=isAll?"Tous les établissements":`${selected.length} étab. sélectionné${selected.length>1?"s":""}`;
  return(
    <div ref={ref} className="etab-multiselect">
      <button className="etab-multiselect-btn" onClick={()=>setOpen(!open)} type="button">
        <span style={{flex:1,textAlign:"left"}}>{label}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4l4 4 4-4"/></svg>
      </button>
      {open&&(
        <div className="etab-dropdown">
          <div className="etab-dropdown-all" onClick={()=>onChange(isAll?etablissements.map(e=>e.id):[])}>
            <input type="checkbox" readOnly checked={isAll}/>Tous les établissements
          </div>
          {etablissements.map(e=>(
            <div key={e.id} className="etab-dropdown-item" onClick={()=>onChange(selected.includes(e.id)?selected.filter(s=>s!==e.id):[...selected,e.id])}>
              <input type="checkbox" readOnly checked={selected.includes(e.id)}/><span>{e.nom}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── KPI Card cliquable ────────────────────────────────────────
function KpiCard({label,value,unit,accent="teal",badge,selected,onClick}){
  const col=accent==="teal"?COLORS.teal:accent==="lime"?COLORS.lime:COLORS.gray;
  return(
    <div className={`kpi-card kpi-${accent}`} onClick={onClick} style={{cursor:"pointer",outline:selected?`2.5px solid ${col}`:"none",outlineOffset:2,transform:selected?"translateY(-2px)":"none",boxShadow:selected?`0 4px 16px ${col}30`:undefined,transition:"all 0.15s ease",position:"relative"}}>
      {selected&&<div style={{position:"absolute",top:8,right:8,width:8,height:8,borderRadius:"50%",background:col}}/>}
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value??"—"}{unit&&<span style={{fontSize:14,fontWeight:400,color:"#ADB5BD",marginLeft:2}}>{unit}</span>}</div>
      {badge&&<div className="kpi-badge">{badge}</div>}
      {selected&&<div style={{fontSize:10,color:col,marginTop:4,fontWeight:600}}>↓ Courbe affichée</div>}
    </div>
  );
}

// ── Filtre select simple ──────────────────────────────────────
function FilterSelect({label,options,value,onChange,fStyle,fDisabled,disabled=false}){
  return(
    <select style={disabled?fDisabled:fStyle} disabled={disabled} value={value} onChange={e=>onChange(e.target.value)}>
      <option value="">{label}</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ── Sélecteur période comparaison ────────────────────────────
function PeriodPicker({label,color,annees,value,onChange}){
  const [ann,setAnn]=useState(value.annee||"");
  const [moisList,setMoisList]=useState([]);
  const [mo,setMo]=useState(value.mois||"");
  const [semList,setSemList]=useState([]);
  const [sem,setSem]=useState(value.semaine||"");
  useEffect(()=>{setMo("");setMoisList([]);setSem("");setSemList([]);if(!ann)return;getMoisDisponibles({annee:ann}).then(setMoisList);},[ann]);
  useEffect(()=>{setSem("");setSemList([]);if(!ann||!mo)return;getSemainesDisponibles({annee:ann,mois:mo}).then(setSemList);},[mo,ann]);
  useEffect(()=>{onChange({annee:ann,mois:mo,semaine:sem});},[ann,mo,sem]);
  const fs={fontSize:11,padding:"5px 8px",border:`1px solid ${color}40`,borderRadius:6,background:"#FFF",color:"#495057",fontFamily:"inherit",outline:"none",cursor:"pointer"};
  const fd={...fs,opacity:0.45,cursor:"not-allowed"};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:6,padding:"10px 12px",background:color+"08",borderRadius:8,border:`1px solid ${color}30`}}>
      <div style={{fontSize:11,fontWeight:700,color,marginBottom:2}}>{label}</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <select style={fs} value={ann} onChange={e=>setAnn(e.target.value)}>
          <option value="">Année</option>
          {annees.map(a=><option key={a} value={a}>{a}</option>)}
        </select>
        <select style={ann?fs:fd} disabled={!ann} value={mo} onChange={e=>setMo(e.target.value)}>
          <option value="">Mois</option>
          {moisList.map(m=><option key={m.numero} value={m.numero}>{m.nom}</option>)}
        </select>
        <select style={ann?fs:fd} disabled={!ann} value={sem} onChange={e=>setSem(e.target.value)}>
          <option value="">Semaine</option>
          {semList.map(s=><option key={s.numero} value={s.numero}>S{s.numero}</option>)}
        </select>
      </div>
    </div>
  );
}

function periodStr(p,moisList){
  if(!p.annee)return"Toutes périodes";
  if(p.semaine)return`S${p.semaine} ${p.annee}`;
  if(p.mois){const m=moisList?.find(x=>String(x.numero)===String(p.mois));return`${m?.nom||p.mois} ${p.annee}`;}
  return`${p.annee}`;
}

// ── Modal détail établissement ────────────────────────────────
function ModalDetail({etab,filters,onClose}){
  const [hosps,setHosps]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    if(!etab)return;
    setLoading(true);
    const params=new URLSearchParams({etablissement_id:etab.etablissement_id,limit:200});
    if(filters.annee)params.append("annee",filters.annee);
    if(filters.mois)params.append("mois",filters.mois);
    if(filters.semaine)params.append("semaine",filters.semaine);
    if(filters.typeHosp)params.append("type_hosp",filters.typeHosp);
    if(filters.motif)params.append("motif",filters.motif);
    if(filters.lieuHosp)params.append("lieu_hosp",filters.lieuHosp);
    fetch(`${BASE_URL}/dashboard/detail-hospitalisations?${params}`,{headers:{Authorization:`Bearer ${getToken()}`}})
      .then(r=>r.json()).then(setHosps).finally(()=>setLoading(false));
  },[etab]);

  if(!etab)return null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"white",borderRadius:14,width:"100%",maxWidth:900,maxHeight:"85vh",overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #E2E8F0",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#1A2332"}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"white"}}>{etab.etablissement_nom}</div>
            <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>Détail des hospitalisations</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"white",fontSize:20,cursor:"pointer",padding:"0 4px"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {loading?(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:200,color:"#ADB5BD",gap:8}}>
              <div className="spinner"/>Chargement…
            </div>
          ):(
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead style={{position:"sticky",top:0,background:"#F8F9FA",zIndex:1}}>
                <tr>
                  {["Date","Résident","Âge","Genre","Type","Lieu","Demandeur","Motif","Durée","Issue","Classe"].map(h=>(
                    <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid #E2E8F0",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hosps.map((h,i)=>(
                  <tr key={h.id} style={{background:i%2===0?"white":"#FAFAFA",borderBottom:"1px solid #F1F5F9"}}>
                    <td style={{padding:"7px 10px",whiteSpace:"nowrap"}}>{h.date_hosp}</td>
                    <td style={{padding:"7px 10px",fontWeight:600,color:"#00A89D"}}>{h.num_resident}</td>
                    <td style={{padding:"7px 10px"}}>{h.age}</td>
                    <td style={{padding:"7px 10px"}}>
                      <span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:600,background:h.genre==="Homme"?"#EFF6FF":"#FDF2F8",color:h.genre==="Homme"?"#1D4ED8":"#9D174D"}}>{h.genre}</span>
                    </td>
                    <td style={{padding:"7px 10px"}}>
                      <span style={{padding:"2px 6px",borderRadius:4,fontSize:10,background:h.type_hosp==="Urgence"?"#FEF2F2":"#F2F9E8",color:h.type_hosp==="Urgence"?"#DC2626":"#166534"}}>{h.type_hosp}</span>
                    </td>
                    <td style={{padding:"7px 10px",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.lieu_hosp}</td>
                    <td style={{padding:"7px 10px"}}>{h.demandeur}</td>
                    <td style={{padding:"7px 10px",maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.motif}</td>
                    <td style={{padding:"7px 10px"}}>{h.duree_hosp}j</td>
                    <td style={{padding:"7px 10px"}}>{h.issue}</td>
                    <td style={{padding:"7px 10px",textAlign:"center",fontWeight:600,color:"#6366F1"}}>{h.classe_plaisir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{padding:"10px 20px",borderTop:"1px solid #E2E8F0",fontSize:11,color:"#94A3B8",background:"#F8F9FA"}}>
          {hosps.length} hospitalisation{hosps.length>1?"s":""} affichée{hosps.length>1?"s":""}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────
export default function Dashboard(){
  const [etablissements,setEtablissements]=useState([]);
  const [selectedEtabs,setSelectedEtabs]=useState([]);
  const [selectedKpi,setSelectedKpi]=useState("total_hospitalisations");
  const [compareMode,setCompareMode]=useState(false);
  const [modalEtab,setModalEtab]=useState(null);

  // Filtres temporels
  const [annees,setAnnees]=useState([]);
  const [moisList,setMoisList]=useState([]);
  const [semainesList,setSemainesList]=useState([]);
  const [joursList,setJoursList]=useState([]);
  const [annee,setAnnee]=useState("");
  const [mois,setMois]=useState("");
  const [semaine,setSemaine]=useState("");
  const [jour,setJour]=useState("");

  // Filtres métier
  const [typesHosp,setTypesHosp]=useState([]);
  const [motifs,setMotifs]=useState([]);
  const [lieux,setLieux]=useState([]);
  const [typeHosp,setTypeHosp]=useState("");
  const [motif,setMotif]=useState("");
  const [lieuHosp,setLieuHosp]=useState("");
  const [classeP,setClasseP]=useState("");
  const [typeEtab,setTypeEtab]=useState("");
  const [showMoreFilters,setShowMoreFilters]=useState(false);

  // Données
  const [kpis,setKpis]=useState(null);
  const [etabStats,setEtabStats]=useState([]);
  const [pathoStats,setPathoStats]=useState([]);
  const [evolution,setEvolution]=useState([]);
  const [statsEnrichies,setStatsEnrichies]=useState(null);
  const [loading,setLoading]=useState(true);

  // Comparaison
  const [periodeA,setPeriodeA]=useState({annee:"",mois:"",semaine:""});
  const [periodeB,setPeriodeB]=useState({annee:"",mois:"",semaine:""});
  const [moisListA,setMoisListA]=useState([]);
  const [moisListB,setMoisListB]=useState([]);
  const [evolutionA,setEvolutionA]=useState([]);
  const [evolutionB,setEvolutionB]=useState([]);
  const [loadingCompare,setLoadingCompare]=useState(false);

  // Charger filtres statiques
  useEffect(()=>{
    Promise.all([
      getEtablissements(),
      getAnneesDisponibles(),
      api("/dashboard/filtres/types-hosp"),
      api("/dashboard/filtres/motifs"),
      api("/dashboard/filtres/lieux"),
    ]).then(([etabs,ans,th,mo,li])=>{
      setEtablissements(etabs);setAnnees(ans);
      setTypesHosp(th);setMotifs(mo);setLieux(li);
    });
  },[]);

  useEffect(()=>{
    setMois("");setMoisList([]);setSemaine("");setSemainesList([]);setJour("");setJoursList([]);
    if(!annee)return;getMoisDisponibles({annee}).then(setMoisList);
  },[annee]);

  useEffect(()=>{
    setSemaine("");setSemainesList([]);setJour("");setJoursList([]);
    if(!annee||!mois)return;getSemainesDisponibles({annee,mois}).then(setSemainesList);
  },[mois,annee]);

  useEffect(()=>{
    setJour("");setJoursList([]);
    if(!annee||!semaine)return;getJoursDisponibles({annee,...(mois&&{mois}),semaine}).then(setJoursList);
  },[semaine,mois,annee]);

  // Construire params communs
  const buildParams=useCallback(()=>{
    const p={};
    if(annee)p.annee=annee;if(mois)p.mois=mois;if(semaine)p.semaine=semaine;if(jour)p.jour=jour;
    if(typeHosp)p.type_hosp=typeHosp;if(motif)p.motif=motif;if(lieuHosp)p.lieu_hosp=lieuHosp;
    if(classeP)p.classe_plaisir=classeP;if(typeEtab)p.type_etab=typeEtab;
    return p;
  },[annee,mois,semaine,jour,typeHosp,motif,lieuHosp,classeP,typeEtab]);

  // Charger données dashboard
  useEffect(()=>{
    setLoading(true);
    const base=buildParams();
    const etabsToQuery=selectedEtabs.length>0&&selectedEtabs.length<etablissements.length?selectedEtabs:[null];

    // Stats enrichies
    const enrichParams=new URLSearchParams(base);
    if(etabsToQuery.length===1&&etabsToQuery[0])enrichParams.append("etablissement_id",etabsToQuery[0]);
    api(`/dashboard/stats-enrichies?${enrichParams}`).then(setStatsEnrichies);

    Promise.all(etabsToQuery.map(etabId=>{
      const params={...base};if(etabId)params.etablissement_id=etabId;
      return Promise.all([getKpis(params),getParEtablissement(params),getParPathologie(params),getEvolution(params)]);
    })).then(results=>{
      if(results.length===1){
        const[k,e,p,ev]=results[0];setKpis(k);setEtabStats(e);setPathoStats(p);setEvolution(ev);
      }else{
        const allKpis=results.map(r=>r[0]);
        const avg=(arr)=>{const v=arr.filter(Boolean);return v.length?Math.round(v.reduce((a,b)=>a+b)/v.length*10)/10:null;};
        setKpis({
          total_hospitalisations:allKpis.reduce((s,k)=>s+(k?.total_hospitalisations||0),0),
          total_sortis:allKpis.reduce((s,k)=>s+(k?.total_sortis||0),0),
          total_presents:allKpis.reduce((s,k)=>s+(k?.total_presents||0),0),
          total_transferts:allKpis.reduce((s,k)=>s+(k?.total_transferts||0),0),
          total_rehospitalisations:allKpis.reduce((s,k)=>s+(k?.total_rehospitalisations||0),0),
          duree_moyenne_sejour:avg(allKpis.map(k=>k?.duree_moyenne_sejour)),
          attente_moyenne_avant_op:avg(allKpis.map(k=>k?.attente_moyenne_avant_op)),
          taux_remplissage_moyen:avg(allKpis.map(k=>k?.taux_remplissage_moyen)),
        });
        setEtabStats(results.flatMap(r=>r[1]).filter(e=>e.hospitalisations>0));
        const pm={};results.forEach(r=>r[2].forEach(p=>{pm[p.pathologie]=(pm[p.pathologie]||0)+p.count;}));
        const tot=Object.values(pm).reduce((a,b)=>a+b,0);
        setPathoStats(Object.entries(pm).map(([p,c])=>({pathologie:p,count:c,pourcentage:Math.round(c/tot*100*10)/10})).sort((a,b)=>b.count-a.count));
        setEvolution(results[0][3]);
      }
    }).catch(console.error).finally(()=>setLoading(false));
  },[annee,mois,semaine,jour,selectedEtabs,etablissements,typeHosp,motif,lieuHosp,classeP,typeEtab]);

  // Comparaison
  useEffect(()=>{
    if(!compareMode)return;
    if(!periodeA.annee&&!periodeB.annee)return;
    setLoadingCompare(true);
    const paramsA={};if(periodeA.annee)paramsA.annee=periodeA.annee;if(periodeA.mois)paramsA.mois=periodeA.mois;if(periodeA.semaine)paramsA.semaine=periodeA.semaine;
    const paramsB={};if(periodeB.annee)paramsB.annee=periodeB.annee;if(periodeB.mois)paramsB.mois=periodeB.mois;if(periodeB.semaine)paramsB.semaine=periodeB.semaine;
    const etabParam=selectedEtabs.length===1?{etablissement_id:selectedEtabs[0]}:{};
    Promise.all([
      periodeA.annee?getEvolution({...paramsA,...etabParam}):Promise.resolve([]),
      periodeB.annee?getEvolution({...paramsB,...etabParam}):Promise.resolve([]),
      periodeA.annee?getMoisDisponibles({annee:periodeA.annee}):Promise.resolve([]),
      periodeB.annee?getMoisDisponibles({annee:periodeB.annee}):Promise.resolve([]),
    ]).then(([evA,evB,mA,mB])=>{setEvolutionA(evA);setEvolutionB(evB);setMoisListA(mA);setMoisListB(mB);}).finally(()=>setLoadingCompare(false));
  },[compareMode,periodeA,periodeB,selectedEtabs]);

  const activeKpi=KPI_CONFIG.find(k=>k.key===selectedKpi)||KPI_CONFIG[0];
  const getEvoData=(evo)=>{
    if(!evo||!evo.length)return[];
    const key=activeKpi.evoKey;
    return evo.map(e=>e[key]??e.value??0);
  };

  const periodLabel=()=>{
    const etabL=selectedEtabs.length>0&&selectedEtabs.length<etablissements.length?`${selectedEtabs.length} établissement${selectedEtabs.length>1?"s":""}` :"Tous les établissements";
    const dateL=jour?`Journée du ${jour}`:semaine?`Semaine ${semaine} ${annee}`:mois?`${moisList.find(m=>String(m.numero)===mois)?.nom||""} ${annee}`:annee?`Année ${annee}`:"Toutes périodes";
    const filtresL=[typeHosp,motif,lieuHosp,classeP?`Classe ${classeP}`:"",typeEtab].filter(Boolean).join(" · ");
    return`${etabL} · ${dateL}${filtresL?` · ${filtresL}`:""}`;
  };

  const hasFilters=selectedEtabs.length>0||annee||mois||semaine||jour||typeHosp||motif||lieuHosp||classeP||typeEtab;
  const resetFilters=()=>{setSelectedEtabs([]);setAnnee("");setMois("");setSemaine("");setJour("");setTypeHosp("");setMotif("");setLieuHosp("");setClasseP("");setTypeEtab("");};

  const fStyle={fontSize:12,padding:"7px 12px",border:"1px solid #E2E8F0",borderRadius:6,background:"#FFFFFF",color:"#495057",fontFamily:"inherit",outline:"none",cursor:"pointer"};
  const fDisabled={...fStyle,opacity:0.45,cursor:"not-allowed"};

  const getDelta=()=>{
    if(!compareMode||!evolutionA.length||!evolutionB.length)return null;
    const key=activeKpi.evoKey;
    const totalA=evolutionA.reduce((s,e)=>s+(e[key]??0),0);
    const totalB=evolutionB.reduce((s,e)=>s+(e[key]??0),0);
    if(totalB===0)return null;
    const delta=((totalA-totalB)/totalB*100).toFixed(1);
    return{delta,totalA,totalB,positive:parseFloat(delta)>=0};
  };
  const delta=getDelta();

  return(
    <>
      <ModalDetail etab={modalEtab} filters={{annee,mois,semaine,typeHosp,motif,lieuHosp}} onClose={()=>setModalEtab(null)}/>

      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">{periodLabel()}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <BoutonExport kpis={kpis} etabStats={etabStats} pathoStats={pathoStats} evolution={evolution} activeKpiConfig={activeKpi} periodLabel={periodLabel()} etablissements={etablissements} selectedEtabs={selectedEtabs}/>
        </div>
      </div>

      {/* Filtres principaux */}
      <div style={{padding:"10px 24px",background:"#F8F9FA",borderBottom:"1px solid #E2E8F0",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <EtabMultiSelect etablissements={etablissements} selected={selectedEtabs} onChange={setSelectedEtabs}/>
        <select style={fStyle} value={annee} onChange={e=>setAnnee(e.target.value)}>
          <option value="">Toutes les années</option>
          {annees.map(a=><option key={a} value={a}>{a}</option>)}
        </select>
        <select style={annee?fStyle:fDisabled} disabled={!annee} value={mois} onChange={e=>setMois(e.target.value)}>
          <option value="">Tous les mois</option>
          {moisList.map(m=><option key={m.numero} value={m.numero}>{m.nom}</option>)}
        </select>
        <select style={annee?fStyle:fDisabled} disabled={!annee} value={semaine} onChange={e=>setSemaine(e.target.value)}>
          <option value="">Toutes les semaines</option>
          {semainesList.map(s=><option key={s.numero} value={s.numero}>Semaine {s.numero}</option>)}
        </select>
        <select style={semaine?fStyle:fDisabled} disabled={!semaine} value={jour} onChange={e=>setJour(e.target.value)}>
          <option value="">Tous les jours</option>
          {joursList.map(j=><option key={j} value={j}>{j}</option>)}
        </select>
        <button onClick={()=>setShowMoreFilters(!showMoreFilters)} style={{...fStyle,background:showMoreFilters?"#00A89D":"#F1F3F5",color:showMoreFilters?"white":"#495057",fontWeight:600}}>
          {showMoreFilters?"▲ Moins de filtres":"▼ Filtres métier"}
        </button>
        {hasFilters&&<button style={{...fStyle,background:"#FEF2F2",color:"#DC2626",fontWeight:600}} onClick={resetFilters}>✕ Réinitialiser</button>}
      </div>

      {/* Filtres métier */}
      {showMoreFilters&&(
        <div style={{padding:"10px 24px",background:"#FFFBEB",borderBottom:"1px solid #FDE68A",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:11,fontWeight:700,color:"#92400E",textTransform:"uppercase",letterSpacing:"0.5px"}}>Filtres métier</span>
          <select style={fStyle} value={typeEtab} onChange={e=>setTypeEtab(e.target.value)}>
            <option value="">Tous types d'étab.</option>
            {["EMS","CAT","EPSM","LOG","RES","FON"].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <select style={fStyle} value={typeHosp} onChange={e=>setTypeHosp(e.target.value)}>
            <option value="">Tous types d'hosp.</option>
            {typesHosp.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <select style={fStyle} value={motif} onChange={e=>setMotif(e.target.value)}>
            <option value="">Tous motifs</option>
            {motifs.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <select style={fStyle} value={lieuHosp} onChange={e=>setLieuHosp(e.target.value)}>
            <option value="">Tous lieux</option>
            {lieux.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
          <select style={fStyle} value={classeP} onChange={e=>setClasseP(e.target.value)}>
            <option value="">Toutes classes</option>
            {[1,2,3,4,5,6,7,8,9].map(c=><option key={c} value={c}>Classe {c}</option>)}
          </select>
        </div>
      )}

      <div className="page-content">
        {loading?(
          <div className="loading-wrap"><div className="spinner"/>Chargement des données…</div>
        ):(
          <>
            <div style={{fontSize:11,color:"#ADB5BD",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="6" stroke="#ADB5BD" strokeWidth="1"/><text x="6.5" y="10" textAnchor="middle" fontSize="8" fill="#ADB5BD">i</text></svg>
              Cliquez sur un indicateur pour afficher sa courbe d'évolution
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
              {KPI_CONFIG.slice(0,4).map(k=>(
                <KpiCard key={k.key} label={k.label} value={kpis?.[k.key]?.toLocaleString?.("fr-CH")??kpis?.[k.key]} unit={k.unit} accent={k.accent} badge={k.badge} selected={selectedKpi===k.key} onClick={()=>setSelectedKpi(k.key)}/>
              ))}
            </div>
            <div className="kpi-grid">
              {KPI_CONFIG.slice(4,8).map(k=>(
                <KpiCard key={k.key} label={k.label} value={kpis?.[k.key]?.toLocaleString?.("fr-CH")??kpis?.[k.key]} unit={k.unit} accent={k.accent} selected={selectedKpi===k.key} onClick={()=>setSelectedKpi(k.key)}/>
              ))}
            </div>

            {/* Graphique évolution + comparaison */}
            <div style={{display:"grid",gridTemplateColumns:"minmax(0,2fr) minmax(0,1fr)",gap:14}}>
              <div className="card" style={{borderTop:`3px solid ${activeKpi.color}`}}>
                <div className="card-header">
                  <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                    <div className="card-title">
                      Évolution — {activeKpi.label}
                      {activeKpi.unit&&<span style={{fontSize:11,color:"#ADB5BD",marginLeft:6,fontWeight:400}}>({activeKpi.unit})</span>}
                    </div>
                    {delta&&<span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,background:delta.positive?"#F2F9E8":"#FEF2F2",color:delta.positive?COLORS.lime:"#DC2626"}}>{delta.positive?"▲":"▼"} {Math.abs(delta.delta)}%</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {annee&&!compareMode&&<span className="card-tag">{annee}</span>}
                    <button onClick={()=>setCompareMode(!compareMode)} style={{fontSize:11,padding:"4px 12px",borderRadius:6,border:"none",cursor:"pointer",fontWeight:600,background:compareMode?activeKpi.color:"#F1F3F5",color:compareMode?"white":"#495057"}}>
                      {compareMode?"✕ Fermer":"⇄ Comparer"}
                    </button>
                  </div>
                </div>
                {compareMode&&(
                  <div style={{padding:"12px 16px",borderBottom:"1px solid #F1F5F9",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <PeriodPicker label="Période A" color={activeKpi.color} annees={annees} value={periodeA} onChange={setPeriodeA}/>
                    <PeriodPicker label="Période B" color="#ADB5BD" annees={annees} value={periodeB} onChange={setPeriodeB}/>
                  </div>
                )}
                <div className="card-body" style={{height:compareMode?170:200}}>
                  {loadingCompare?(
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#ADB5BD",fontSize:13}}><div className="spinner" style={{marginRight:8}}/>Chargement…</div>
                  ):(
                    <LineChart
                      canvasId={`evo-${selectedKpi}-${annee}-${mois}-${semaine}-${compareMode}-${typeHosp}-${motif}`}
                      labels={compareMode?(evolutionA.length?evolutionA.map(e=>e.label):evolutionB.map(e=>e.label)):evolution.map(e=>e.label)}
                      data={compareMode?getEvoData(evolutionA):getEvoData(evolution)}
                      color={activeKpi.color}
                      compareData={compareMode?getEvoData(evolutionB):null}
                      compareColor="#ADB5BD"
                      mainLegend={compareMode?periodStr(periodeA,moisListA):null}
                      compareLegend={compareMode?periodStr(periodeB,moisListB):null}
                    />
                  )}
                </div>
                {compareMode&&delta&&(
                  <div style={{padding:"10px 16px",borderTop:"1px solid #F1F5F9",display:"flex",gap:20,fontSize:12}}>
                    <div><span style={{color:"#ADB5BD"}}>Période A : </span><strong style={{color:activeKpi.color}}>{delta.totalA.toLocaleString("fr-CH")}</strong></div>
                    <div><span style={{color:"#ADB5BD"}}>Période B : </span><strong style={{color:"#64748B"}}>{delta.totalB.toLocaleString("fr-CH")}</strong></div>
                    <div><span style={{color:"#ADB5BD"}}>Évolution : </span><strong style={{color:delta.positive?COLORS.lime:"#DC2626"}}>{delta.positive?"+":""}{delta.delta}%</strong></div>
                  </div>
                )}
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Répartition par pathologie</div></div>
                <div className="card-body">
                  <div style={{height:140}}>
                    <DoughnutChart canvasId={`donut-${annee}-${mois}-${typeHosp}`} labels={pathoStats.map(p=>p.pathologie)} data={pathoStats.map(p=>p.count)} colors={PATHO_COLORS.slice(0,pathoStats.length)}/>
                  </div>
                  <div className="legend" style={{marginTop:10}}>
                    {pathoStats.slice(0,5).map((p,i)=>(
                      <span key={p.pathologie} className="legend-item">
                        <span className="legend-dot" style={{background:PATHO_COLORS[i]}}/>
                        {p.pathologie} <span style={{color:"#ADB5BD"}}>{p.pourcentage}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Graphiques enrichis */}
            {statsEnrichies&&(
              <>
                <div style={{fontSize:13,fontWeight:700,color:"#1A2332",margin:"16px 0 8px",display:"flex",alignItems:"center",gap:8}}>
                  Analyses détaillées
                  <span style={{fontSize:11,color:"#94A3B8",fontWeight:400}}>— {statsEnrichies.total?.toLocaleString("fr-CH")} hospitalisations</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                  {/* Genre */}
                  <div className="card">
                    <div className="card-header"><div className="card-title">Répartition H/F</div></div>
                    <div className="card-body" style={{paddingTop:8}}>
                      <MiniDonut title="Genre" data={statsEnrichies.par_genre} canvasId={`genre-${annee}-${mois}-${typeHosp}`} height={120}/>
                    </div>
                  </div>
                  {/* Heure */}
                  <div className="card">
                    <div className="card-header"><div className="card-title">Par heure d'hospitalisation</div></div>
                    <div className="card-body" style={{paddingTop:8}}>
                      <MiniDonut title="Heure" data={statsEnrichies.par_heure_hosp} canvasId={`heure-${annee}-${mois}-${typeHosp}`} height={120}/>
                    </div>
                  </div>
                  {/* Lieu */}
                  <div className="card">
                    <div className="card-header"><div className="card-title">Par lieu d'hospitalisation</div></div>
                    <div className="card-body" style={{paddingTop:8}}>
                      <MiniDonut title="Lieu" data={statsEnrichies.par_lieu_hosp} canvasId={`lieu-${annee}-${mois}-${typeHosp}`} height={120}/>
                    </div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginTop:12}}>
                  {/* Jour */}
                  <div className="card">
                    <div className="card-header"><div className="card-title">Par jour d'hospitalisation</div></div>
                    <div className="card-body" style={{paddingTop:8}}>
                      <MiniDonut title="Jour" data={statsEnrichies.par_jour_hosp} canvasId={`jour-${annee}-${mois}-${typeHosp}`} height={130}/>
                    </div>
                  </div>
                  {/* Demandeur */}
                  <div className="card">
                    <div className="card-header"><div className="card-title">Par demandeur (à la demande de…)</div></div>
                    <div className="card-body" style={{height:220}}>
                      <BarChart canvasId={`demandeur-${annee}-${mois}-${typeHosp}`} labels={statsEnrichies.par_demandeur?.map(d=>d.label)||[]} data={statsEnrichies.par_demandeur?.map(d=>d.count)||[]} color={COLORS.indigo} showValues={true}/>
                    </div>
                  </div>
                </div>
                {/* Issue de l'hospitalisation */}
                <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginTop:12}}>
                  <div className="card">
                    <div className="card-header"><div className="card-title">Par issue de l'hospitalisation</div></div>
                    <div className="card-body" style={{paddingTop:8}}>
                      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:16,alignItems:"center"}}>
                        <div style={{height:160}}>
                          <MiniDonut title="Issue" data={statsEnrichies.par_issue||[]} canvasId={`issue-${annee}-${mois}-${typeHosp}`} height={160}/>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {(statsEnrichies.par_issue||[]).map((d,i)=>(
                            <div key={d.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderRadius:8,background:i===0?"#FEF2F2":i===1?"#F2F9E8":i===2?"#EEF2FF":"#F8F9FA",border:`1px solid ${CHART_COLORS[i]}30`}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:10,height:10,borderRadius:"50%",background:CHART_COLORS[i]}}/>
                                <span style={{fontSize:12,fontWeight:600,color:"#1A2332"}}>{d.label}</span>
                              </div>
                              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                                <span style={{fontSize:14,fontWeight:800,color:CHART_COLORS[i]}}>{d.pourcentage}%</span>
                                <span style={{fontSize:11,color:"#94A3B8"}}>({d.count})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Graphiques par établissement */}
            {etabStats.length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:14}}>
                <div className="card">
                  <div className="card-header"><div className="card-title">Hospitalisations par établissement</div></div>
                  <div className="card-body" style={{height:200}}>
                    <BarChart canvasId={`bar-etab-${annee}-${typeHosp}`} labels={etabStats.map(e=>e.etablissement_nom.split(" ").slice(-1)[0])} data={etabStats.map(e=>e.hospitalisations)} color={COLORS.teal}/>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><div className="card-title">Durée moy. séjour par établissement (j)</div></div>
                  <div className="card-body" style={{height:200}}>
                    <BarChart canvasId={`bar-duree-${annee}-${typeHosp}`} labels={etabStats.map(e=>e.etablissement_nom.split(" ").slice(-1)[0])} data={etabStats.map(e=>e.duree_moyenne??0)} color={COLORS.lime}/>
                  </div>
                </div>
              </div>
            )}

            {/* Tableau détail cliquable */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Détail par établissement</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,color:"#ADB5BD"}}>{etabStats.filter(e=>e.hospitalisations>0).length} établissements</span>
                  <span style={{fontSize:10,color:"#94A3B8",fontStyle:"italic"}}>Cliquez sur une ligne pour le détail</span>
                </div>
              </div>
              {etabStats.length===0?(
                <div className="empty-state">Aucune donnée pour cette sélection.</div>
              ):(
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Établissement</th><th>Hospit.</th><th>Durée moy.</th><th>Attente op.</th><th>Taux rempl.</th><th>Sortis</th><th>Transferts</th><th>Réhospit.</th></tr>
                    </thead>
                    <tbody>
                      {etabStats.map(e=>(
                        <tr key={e.etablissement_id}
                          onClick={()=>setModalEtab(e)}
                          style={{cursor:"pointer",transition:"background 0.1s"}}
                          onMouseEnter={ev=>ev.currentTarget.style.background="#E6F7F6"}
                          onMouseLeave={ev=>ev.currentTarget.style.background=""}>
                          <td style={{fontWeight:600,color:"#1A2332"}}>{e.etablissement_nom}</td>
                          <td style={{fontFamily:"var(--font-mono)",fontWeight:600,color:"var(--teal)"}}>{e.hospitalisations.toLocaleString("fr-CH")}</td>
                          <td>{e.duree_moyenne?`${e.duree_moyenne}j`:"—"}</td>
                          <td>{e.attente_moyenne?`${e.attente_moyenne}j`:"—"}</td>
                          <td>{e.taux_remplissage?(<span style={{background:e.taux_remplissage>90?"#FEF2F2":"var(--teal-light)",color:e.taux_remplissage>90?"#DC2626":"var(--teal-dark)",padding:"2px 7px",borderRadius:4,fontSize:11,fontWeight:500}}>{e.taux_remplissage}%</span>):"—"}</td>
                          <td>{e.sortis}</td><td>{e.transferts}</td><td>{e.rehospitalisations}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
