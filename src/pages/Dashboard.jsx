import { useState, useEffect, useRef } from "react";
import {
  getKpis, getParEtablissement, getParPathologie, getEvolution,
  getEtablissements, getAnneesDisponibles, getMoisDisponibles,
  getSemainesDisponibles, getJoursDisponibles
} from "../data/api";

const COLORS = {
  teal:"#00A89D", lime:"#8DC63F", gray:"#ADB5BD",
  teal2:"#009990", lime2:"#6A9A2A", blue:"#3B82F6", amber:"#F59E0B",
};
const PATHO_COLORS = [COLORS.teal,COLORS.lime,COLORS.gray,COLORS.blue,COLORS.amber,"#E2E8F0"];

const KPI_CONFIG = [
  {key:"total_hospitalisations", label:"Hospitalisations",    unit:"",  accent:"teal", badge:"Période sélectionnée", color:COLORS.teal,  evoKey:"hospitalisations"},
  {key:"duree_moyenne_sejour",   label:"Durée moy. séjour",   unit:"j", accent:"lime",                               color:COLORS.lime,  evoKey:"duree_moyenne"},
  {key:"attente_moyenne_avant_op",label:"Attente avant op.",  unit:"j", accent:"teal",                               color:COLORS.teal,  evoKey:"attente_moyenne"},
  {key:"taux_remplissage_moyen", label:"Taux de remplissage", unit:"%", accent:"lime",                               color:COLORS.lime,  evoKey:"taux_remplissage"},
  {key:"total_sortis",           label:"Patients sortis",     unit:"",  accent:"teal",                               color:COLORS.teal,  evoKey:"sortis"},
  {key:"total_presents",         label:"Patients présents",   unit:"",  accent:"gray",                               color:COLORS.gray,  evoKey:"presents"},
  {key:"total_transferts",       label:"Transferts",          unit:"",  accent:"gray",                               color:COLORS.amber, evoKey:"transferts"},
  {key:"total_rehospitalisations",label:"Réhospitalisations", unit:"",  accent:"gray",                               color:"#6366F1",    evoKey:"rehospitalisations"},
];

function BarChart({canvasId,labels,data,color}){
  const ref=useRef(null),chartRef=useRef(null);
  useEffect(()=>{
    if(!ref.current||!window.Chart)return;
    if(chartRef.current)chartRef.current.destroy();
    chartRef.current=new window.Chart(ref.current,{type:"bar",data:{labels,datasets:[{data,backgroundColor:color+"30",borderColor:color,borderWidth:1.5,borderRadius:4,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{font:{size:10},color:"#ADB5BD"},grid:{color:"#F1F3F5"}},x:{ticks:{font:{size:10},color:"#ADB5BD",maxRotation:45,autoSkip:false},grid:{display:false}}}}});
    return()=>chartRef.current?.destroy();
  },[JSON.stringify(labels),JSON.stringify(data)]);
  return <canvas ref={ref} id={canvasId}/>;
}

function LineChart({canvasId,labels,data,color,compareLabels,compareData,compareColor,compareLegend,mainLegend}){
  const ref=useRef(null),chartRef=useRef(null);
  useEffect(()=>{
    if(!ref.current||!window.Chart)return;
    if(chartRef.current)chartRef.current.destroy();
    const datasets=[{
      label:mainLegend||"Période actuelle",
      data,borderColor:color,backgroundColor:color+"15",borderWidth:2,
      pointRadius:4,pointBackgroundColor:"#FFFFFF",pointBorderColor:color,pointBorderWidth:2,
      fill:true,tension:0.35,
    }];
    if(compareData&&compareData.length){
      datasets.push({
        label:compareLegend||"Période comparée",
        data:compareData,borderColor:compareColor||"#ADB5BD",
        backgroundColor:"transparent",borderWidth:2,
        borderDash:[5,4],pointRadius:3,pointBackgroundColor:"#FFFFFF",
        pointBorderColor:compareColor||"#ADB5BD",pointBorderWidth:2,
        fill:false,tension:0.35,
      });
    }
    chartRef.current=new window.Chart(ref.current,{
      type:"line",
      data:{labels:labels.length>=( compareLabels||[]).length?labels:(compareLabels||labels),datasets},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:!!(compareData&&compareData.length),position:"top",labels:{font:{size:11},boxWidth:16,padding:12}}},
        scales:{y:{beginAtZero:true,ticks:{font:{size:10},color:"#ADB5BD"},grid:{color:"#F1F3F5"}},x:{ticks:{font:{size:10},color:"#ADB5BD",maxRotation:45,autoSkip:false},grid:{display:false}}}}
    });
    return()=>chartRef.current?.destroy();
  },[JSON.stringify(labels),JSON.stringify(data),JSON.stringify(compareData)]);
  return <canvas ref={ref} id={canvasId}/>;
}

function DoughnutChart({canvasId,labels,data,colors}){
  const ref=useRef(null),chartRef=useRef(null);
  useEffect(()=>{
    if(!ref.current||!window.Chart)return;
    if(chartRef.current)chartRef.current.destroy();
    chartRef.current=new window.Chart(ref.current,{type:"doughnut",data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:"65%"}});
    return()=>chartRef.current?.destroy();
  },[JSON.stringify(data)]);
  return <canvas ref={ref} id={canvasId}/>;
}

function EtabMultiSelect({etablissements,selected,onChange}){
  const [open,setOpen]=useState(false),ref=useRef(null);
  useEffect(()=>{
    const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  const isAll=selected.length===0||selected.length===etablissements.length;
  const label=isAll?"Tous les établissements":`${selected.length} établissement${selected.length>1?"s":""} sélectionné${selected.length>1?"s":""}`;
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

// ── Sélecteur de période pour la comparaison ──────────────────
function PeriodPicker({label,color,annees,value,onChange}){
  const [ann,setAnn]=useState(value.annee||"");
  const [moisList,setMoisList]=useState([]);
  const [mo,setMo]=useState(value.mois||"");
  const [semList,setSemList]=useState([]);
  const [sem,setSem]=useState(value.semaine||"");

  useEffect(()=>{
    setMo("");setMoisList([]);setSem("");setSemList([]);
    if(!ann)return;
    getMoisDisponibles({annee:ann}).then(setMoisList);
  },[ann]);

  useEffect(()=>{
    setSem("");setSemList([]);
    if(!ann||!mo)return;
    getSemainesDisponibles({annee:ann,mois:mo}).then(setSemList);
  },[mo,ann]);

  useEffect(()=>{
    onChange({annee:ann,mois:mo,semaine:sem});
  },[ann,mo,sem]);

  const fs={fontSize:11,padding:"5px 8px",border:`1px solid ${color}40`,borderRadius:6,background:"#FFFFFF",color:"#495057",fontFamily:"inherit",outline:"none",cursor:"pointer"};
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

// ── Libellé période ───────────────────────────────────────────
function periodStr(p,moisList){
  if(!p.annee)return"Toutes périodes";
  if(p.semaine)return`S${p.semaine} ${p.annee}`;
  if(p.mois){const m=moisList?.find(x=>String(x.numero)===String(p.mois));return`${m?.nom||p.mois} ${p.annee}`;}
  return`${p.annee}`;
}

export default function Dashboard(){
  const [etablissements,setEtablissements]=useState([]);
  const [selectedEtabs,setSelectedEtabs]=useState([]);
  const [selectedKpi,setSelectedKpi]=useState("total_hospitalisations");
  const [compareMode,setCompareMode]=useState(false);

  const [annees,setAnnees]=useState([]);
  const [moisList,setMoisList]=useState([]);
  const [semainesList,setSemainesList]=useState([]);
  const [joursList,setJoursList]=useState([]);
  const [annee,setAnnee]=useState("");
  const [mois,setMois]=useState("");
  const [semaine,setSemaine]=useState("");
  const [jour,setJour]=useState("");

  // Périodes de comparaison
  const [periodeA,setPeriodeA]=useState({annee:"",mois:"",semaine:""});
  const [periodeB,setPeriodeB]=useState({annee:"",mois:"",semaine:""});
  const [moisListA,setMoisListA]=useState([]);
  const [moisListB,setMoisListB]=useState([]);
  const [evolutionA,setEvolutionA]=useState([]);
  const [evolutionB,setEvolutionB]=useState([]);
  const [loadingCompare,setLoadingCompare]=useState(false);

  const [kpis,setKpis]=useState(null);
  const [etabStats,setEtabStats]=useState([]);
  const [pathoStats,setPathoStats]=useState([]);
  const [evolution,setEvolution]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([getEtablissements(),getAnneesDisponibles()]).then(([etabs,ans])=>{
      setEtablissements(etabs);setAnnees(ans);
    });
  },[]);

  useEffect(()=>{
    setMois("");setMoisList([]);setSemaine("");setSemainesList([]);setJour("");setJoursList([]);
    if(!annee)return;
    getMoisDisponibles({annee}).then(setMoisList);
  },[annee]);

  useEffect(()=>{
    setSemaine("");setSemainesList([]);setJour("");setJoursList([]);
    if(!annee||!mois)return;
    getSemainesDisponibles({annee,mois}).then(setSemainesList);
  },[mois,annee]);

  useEffect(()=>{
    setJour("");setJoursList([]);
    if(!annee||!semaine)return;
    getJoursDisponibles({annee,...(mois&&{mois}),semaine}).then(setJoursList);
  },[semaine,mois,annee]);

  useEffect(()=>{
    setLoading(true);
    const base={};
    if(annee)base.annee=annee;if(mois)base.mois=mois;if(semaine)base.semaine=semaine;if(jour)base.jour=jour;
    const etabsToQuery=selectedEtabs.length>0&&selectedEtabs.length<etablissements.length?selectedEtabs:[null];
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
  },[annee,mois,semaine,jour,selectedEtabs,etablissements]);

  // Charger les évolutions de comparaison
  useEffect(()=>{
    if(!compareMode)return;
    if(!periodeA.annee&&!periodeB.annee)return;
    setLoadingCompare(true);
    const paramsA={};
    if(periodeA.annee)paramsA.annee=periodeA.annee;
    if(periodeA.mois)paramsA.mois=periodeA.mois;
    if(periodeA.semaine)paramsA.semaine=periodeA.semaine;
    const paramsB={};
    if(periodeB.annee)paramsB.annee=periodeB.annee;
    if(periodeB.mois)paramsB.mois=periodeB.mois;
    if(periodeB.semaine)paramsB.semaine=periodeB.semaine;
    const etabParam=selectedEtabs.length===1?{etablissement_id:selectedEtabs[0]}:{};
    Promise.all([
      periodeA.annee?getEvolution({...paramsA,...etabParam}):Promise.resolve([]),
      periodeB.annee?getEvolution({...paramsB,...etabParam}):Promise.resolve([]),
      periodeA.annee?getMoisDisponibles({annee:periodeA.annee}):Promise.resolve([]),
      periodeB.annee?getMoisDisponibles({annee:periodeB.annee}):Promise.resolve([]),
    ]).then(([evA,evB,mA,mB])=>{
      setEvolutionA(evA);setEvolutionB(evB);
      setMoisListA(mA);setMoisListB(mB);
    }).finally(()=>setLoadingCompare(false));
  },[compareMode,periodeA,periodeB,selectedEtabs]);

  const activeKpi=KPI_CONFIG.find(k=>k.key===selectedKpi)||KPI_CONFIG[0];

  const getEvoData=(evo)=>{
    if(!evo||!evo.length)return[];
    const key=activeKpi.evoKey;
    return evo.map(e=>e[key]??e.value??0);
  };

  const periodLabel=()=>{
    const etabL=selectedEtabs.length>0&&selectedEtabs.length<etablissements.length?`${selectedEtabs.length} établissement${selectedEtabs.length>1?"s":""}` :"Tous les établissements";
    const dateL=jour?`Journée du ${jour}`:semaine?`Semaine ${semaine}${mois?` · ${moisList.find(m=>String(m.numero)===mois)?.nom||""}`:""} ${annee}`:mois?`${moisList.find(m=>String(m.numero)===mois)?.nom||""} ${annee}`:annee?`Année ${annee}`:"Toutes périodes";
    return`${etabL} · ${dateL}`;
  };

  const hasFilters=selectedEtabs.length>0||annee||mois||semaine||jour;
  const resetFilters=()=>{setSelectedEtabs([]);setAnnee("");setMois("");setSemaine("");setJour("");};
  const fStyle={fontSize:12,padding:"7px 12px",border:"1px solid #E2E8F0",borderRadius:6,background:"#FFFFFF",color:"#495057",fontFamily:"inherit",outline:"none",cursor:"pointer"};
  const fDisabled={...fStyle,opacity:0.45,cursor:"not-allowed"};

  // Calcul delta N vs N-1 si comparaison active
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
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">{periodLabel()}</div>
        </div>
        <div className="filters-bar">
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
          {hasFilters&&<button style={{...fStyle,background:"#F1F3F5"}} onClick={resetFilters}>Réinitialiser</button>}
        </div>
      </div>

      <div className="page-content">
        {loading?(
          <div className="loading-wrap"><div className="spinner"/>Chargement des données…</div>
        ):(
          <>
            <div style={{fontSize:11,color:"#ADB5BD",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="6" stroke="#ADB5BD" strokeWidth="1"/><text x="6.5" y="10" textAnchor="middle" fontSize="8" fill="#ADB5BD">i</text></svg>
              Cliquez sur un indicateur pour afficher sa courbe d'évolution
            </div>

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

            {/* Graphique évolution + bouton comparer */}
            <div style={{display:"grid",gridTemplateColumns:"minmax(0,2fr) minmax(0,1fr)",gap:14}}>
              <div className="card" style={{borderTop:`3px solid ${activeKpi.color}`}}>
                <div className="card-header">
                  <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                    <div className="card-title">
                      Évolution — {activeKpi.label}
                      {activeKpi.unit&&<span style={{fontSize:11,color:"#ADB5BD",marginLeft:6,fontWeight:400}}>({activeKpi.unit})</span>}
                    </div>
                    {/* Badge delta */}
                    {delta&&(
                      <span style={{
                        fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,
                        background:delta.positive?"#F2F9E8":"#FEF2F2",
                        color:delta.positive?COLORS.lime:"#DC2626",
                      }}>
                        {delta.positive?"▲":"▼"} {Math.abs(delta.delta)}%
                      </span>
                    )}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {annee&&!compareMode&&<span className="card-tag">{annee}</span>}
                    <button
                      onClick={()=>setCompareMode(!compareMode)}
                      style={{
                        fontSize:11,padding:"4px 12px",borderRadius:6,border:"none",cursor:"pointer",
                        fontWeight:600,transition:"all 0.15s",
                        background:compareMode?activeKpi.color:"#F1F3F5",
                        color:compareMode?"white":"#495057",
                      }}
                    >
                      {compareMode?"✕ Fermer":"⇄ Comparer"}
                    </button>
                  </div>
                </div>

                {/* Sélecteurs de périodes comparées */}
                {compareMode&&(
                  <div style={{padding:"12px 16px",borderBottom:"1px solid #F1F5F9",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <PeriodPicker label="Période A" color={activeKpi.color} annees={annees} value={periodeA} onChange={setPeriodeA}/>
                    <PeriodPicker label="Période B" color="#ADB5BD" annees={annees} value={periodeB} onChange={setPeriodeB}/>
                  </div>
                )}

                <div className="card-body" style={{height:compareMode?180:200}}>
                  {loadingCompare?(
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#ADB5BD",fontSize:13}}>
                      <div className="spinner" style={{marginRight:8}}/>Chargement…
                    </div>
                  ):(
                    <LineChart
                      canvasId={`evo-${selectedKpi}-${annee}-${mois}-${semaine}-${compareMode}`}
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

                {/* Résumé chiffré comparaison */}
                {compareMode&&delta&&(
                  <div style={{padding:"10px 16px",borderTop:"1px solid #F1F5F9",display:"flex",gap:20,fontSize:12}}>
                    <div>
                      <span style={{color:"#ADB5BD"}}>Période A : </span>
                      <strong style={{color:activeKpi.color}}>{delta.totalA.toLocaleString("fr-CH")}</strong>
                    </div>
                    <div>
                      <span style={{color:"#ADB5BD"}}>Période B : </span>
                      <strong style={{color:"#64748B"}}>{delta.totalB.toLocaleString("fr-CH")}</strong>
                    </div>
                    <div>
                      <span style={{color:"#ADB5BD"}}>Évolution : </span>
                      <strong style={{color:delta.positive?COLORS.lime:"#DC2626"}}>
                        {delta.positive?"+":""}{delta.delta}%
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Répartition par pathologie</div></div>
                <div className="card-body">
                  <div style={{height:140}}>
                    <DoughnutChart canvasId={`donut-${annee}-${mois}`} labels={pathoStats.map(p=>p.pathologie)} data={pathoStats.map(p=>p.count)} colors={PATHO_COLORS.slice(0,pathoStats.length)}/>
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

            {etabStats.length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:14}}>
                <div className="card">
                  <div className="card-header"><div className="card-title">Hospitalisations par établissement</div></div>
                  <div className="card-body" style={{height:200}}>
                    <BarChart canvasId={`bar-etab-${annee}`} labels={etabStats.map(e=>e.etablissement_nom.split(" ").slice(-1)[0])} data={etabStats.map(e=>e.hospitalisations)} color={COLORS.teal}/>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><div className="card-title">Durée moy. séjour par établissement (j)</div></div>
                  <div className="card-body" style={{height:200}}>
                    <BarChart canvasId={`bar-duree-${annee}`} labels={etabStats.map(e=>e.etablissement_nom.split(" ").slice(-1)[0])} data={etabStats.map(e=>e.duree_moyenne??0)} color={COLORS.lime}/>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <div className="card-title">Détail par établissement</div>
                <span style={{fontSize:11,color:"#ADB5BD"}}>{etabStats.filter(e=>e.hospitalisations>0).length} établissements</span>
              </div>
              {etabStats.length===0?(
                <div className="empty-state">Aucune donnée pour cette sélection.</div>
              ):(
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Établissement</th><th>Hospit.</th><th>Durée moy.</th><th>Attente op.</th><th>Taux rempl.</th><th>Sortis</th><th>Transferts</th><th>Réhospit.</th></tr></thead>
                    <tbody>
                      {etabStats.map(e=>(
                        <tr key={e.etablissement_id}>
                          <td>{e.etablissement_nom}</td>
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
