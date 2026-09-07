/* ============================================================
   APP — Nice → Cannes 2026
   Logique de rendu + navigation. Consomme data-plan.js et
   data-strava.js (jamais modifiés par ce fichier).
   ============================================================ */

/* ---------- ICÔNES (SVG ligne, currentColor) ---------- */
const SVG=(paths)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const ICONS={
  home:SVG(`<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1h4.5v-6h2v6H17.5a1 1 0 0 0 1-1v-9"/>`),
  pin:SVG(`<path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/>`),
  calendar:SVG(`<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>`),
  chart:SVG(`<path d="M4 20V10M11 20V4M18 20v-7"/><path d="M2.5 20.5h19"/>`),
  flask:SVG(`<path d="M10 3h4M9.5 3v6.2L4.8 18a2 2 0 0 0 1.8 2.9h10.8a2 2 0 0 0 1.8-2.9L14.5 9.2V3"/><path d="M7.2 15h9.6"/>`),
  clock:SVG(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/>`),
  target:SVG(`<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>`),
  list:SVG(`<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01" stroke-width="2.6"/>`),
  menu:SVG(`<path d="M4 7h16M4 12h16M4 17h16"/>`),
  x:SVG(`<path d="M6 6l12 12M18 6 6 18"/>`),
  refresh:SVG(`<path d="M4 12a8 8 0 0 1 14.5-4.7M20 12a8 8 0 0 1-14.5 4.7"/><path d="M18 3v4.5h-4.5M6 21v-4.5h4.5"/>`),
  chev:SVG(`<path d="m9 6 6 6-6 6"/>`),
};

/* ---------- PAGES ---------- */
const PAGES=["accueil","semaine-cours","semaine-prochaine","progression","analyse","historique","zones","plan"];
const NAV=[
  {p:"accueil",l:"Accueil",i:"home"},
  {p:"semaine-cours",l:"Semaine en cours",i:"pin"},
  {p:"semaine-prochaine",l:"Semaine prochaine",i:"calendar"},
  {p:"progression",l:"Progression",i:"chart"},
  {p:"analyse",l:"Analyse",i:"flask"},
  {p:"historique",l:"Historique",i:"clock"},
  {p:"zones",l:"Zones",i:"target"},
  {p:"plan",l:"Plan complet",i:"list"},
];
const TITLES=Object.fromEntries(NAV.map(n=>[n.p,n.l]));

/* ---------- ÉTAT ---------- */
const KEY="mnc2026-v3";
let ST=JSON.parse(localStorage.getItem(KEY)||"{}");
const save=()=>localStorage.setItem(KEY,JSON.stringify(ST));
const sid=(w,i)=>`w${w}s${i}`;
const g=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

const isDone=(w,s,i)=>s.past?true:!!(ST[sid(w.n,i)]||{}).done;
const getS=(w,i)=>ST[sid(w.n,i)]||{};
const setS=(w,i,o)=>{ST[sid(w.n,i)]={...getS(w,i),...o};save()};

const pill=t=>String(t).replace(/\b(Z[1-5])\b/g,(m,z)=>
  ZONES[z]?`<span class="pill" style="--pb:${ZONES[z].c}33;--pc:${ZONES[z].c}">${z}</span>`:m);
const ICO={run:"🏃",strength:"🏋️",swim:"🏊"};
const FORMES=[["top","💪 En forme"],["normal","🙂 Normal"],["bof","😐 Fatigué"],["hs","🥵 Cuit"]];

/* ---------- NAVIGATION (drawer + topbar + bottomnav) ---------- */
function buildNav(){
  document.querySelectorAll(".drawer-link").forEach(btn=>{
    const n=NAV.find(x=>x.p===btn.dataset.p);
    if(n) btn.innerHTML=`${ICONS[n.i]}<span>${n.l}</span>`;
  });
  g("bottomnav").innerHTML=`
    <button class="bnav-btn nav-link" data-p="accueil">${ICONS.home}Accueil</button>
    <button class="bnav-btn nav-link" data-p="semaine-cours">${ICONS.pin}Semaine</button>
    <button class="bnav-btn nav-link" data-p="semaine-prochaine">${ICONS.calendar}Prochaine</button>
    <button class="bnav-btn" id="bottomMenuBtn">${ICONS.menu}Menu</button>`;
  g("burgerBtn").innerHTML=ICONS.menu;
  g("syncIconBtn").innerHTML=ICONS.refresh;
  g("syncCloseBtn").innerHTML=ICONS.x;
}
function showPage(id){
  if(!PAGES.includes(id)) id="accueil";
  PAGES.forEach(p=>{const el=g("page-"+p); if(el) el.classList.toggle("on",p===id)});
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("on",b.dataset.p===id));
  g("pageTitle").textContent=TITLES[id]||"Accueil";
  closeDrawer();
  window.scrollTo(0,0);
  try{history.replaceState(null,"","#"+id)}catch(e){}
}
function openDrawer(){g("drawer").classList.add("open");g("drawerScrim").classList.add("on")}
function closeDrawer(){g("drawer").classList.remove("open");g("drawerScrim").classList.remove("on")}
function openSync(){g("syncModal").classList.add("on");g("syncScrim").classList.add("on")}
function closeSync(){g("syncModal").classList.remove("on");g("syncScrim").classList.remove("on")}

/* ---------- COUNTDOWN ---------- */
const NOW=new Date();
const RACE=new Date(META.date);
function tick(){
  const ms=RACE-new Date();
  const el=g("cds"); if(!el) return;
  if(ms<0){el.innerHTML='<div class="cd"><b>🏁</b><span>Bonne course</span></div>';return}
  const d=Math.floor(ms/864e5),h=Math.floor(ms/36e5)%24,m=Math.floor(ms/6e4)%60,s=Math.floor(ms/1e3)%60;
  el.innerHTML=[[Math.ceil(d/7),"semaines"],[d,"jours"],[h,"h"],[m,"min"],[s,"s"]]
    .map(([v,l])=>`<div class="cd"><b>${v}</b><span>${l}</span></div>`).join("");
}

/* ---------- SEMAINE COURANTE ---------- */
const curWeek=(()=>{
  let c=SEMAINES[0];
  for(const w of SEMAINES){const d=new Date(w.du+"T00:00:00");if(d<=NOW)c=w;}
  return c.n;
})();

/* ---------- STATS GLOBALES ---------- */
function stats(){
  let tot=0,fait=0,km_prevu=0,km_fait=0,parType={run:[0,0],strength:[0,0],swim:[0,0]};
  let restKm=0,restSe=0;
  SEMAINES.forEach(w=>w.s.forEach((s,i)=>{
    const done=isDone(w,s,i),k=s.k||"run";
    tot++;parType[k][1]++;
    if(s.km){km_prevu+=s.km}
    if(done){fait++;parType[k][0]++;if(s.km)km_fait+=s.km}
    else{restSe++;if(s.km)restKm+=s.km}
  }));
  return{tot,fait,km_prevu,km_fait,parType,restKm,restSe};
}
const S=stats();

/* ---------- SPARKLINES / TENDANCES ---------- */
function spark(vals,color){
  const v=vals.filter(x=>x!=null);if(v.length<2)return"";
  const mn=Math.min(...v),mx=Math.max(...v),rg=mx-mn||1,W=100,H=30;
  const pts=vals.map((x,i)=>x==null?null:[i/(vals.length-1)*W,H-((x-mn)/rg)*(H-5)-2.5]).filter(Boolean);
  const d=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ");
  const last=pts[pts.length-1];
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.6" fill="${color}"/></svg>`;
}
function trend(vals,inverse){
  const v=vals.filter(x=>x!=null);if(v.length<4)return null;
  const n=Math.min(3,Math.floor(v.length/2));
  const rec=v.slice(-n).reduce((a,b)=>a+b,0)/n, old=v.slice(-2*n,-n).reduce((a,b)=>a+b,0)/n;
  const d=(rec-old)/old*100;
  return{pct:d,good:inverse?d<0:d>0};
}

/* ---------- ARCHÉTYPES : famille "qualité/force" pour stats & conseils ---------- */
const QUAL_FAM=["Qualité","Force","Compétition"];
function weekStats(w){
  let km=0,longest=0,renfo=0,nat=0,q=0;
  w.s.forEach(s=>{
    if(s.km){km+=s.km; if((s.k||"run")==="run") longest=Math.max(longest,s.km)}
    if(s.k==="strength") renfo++;
    if(s.k==="swim") nat++;
    const A=s.a?ARCHETYPES[s.a]:null;
    if(A && QUAL_FAM.includes(A.fam)) q++;
  });
  return{km:Math.round(km),longest:Math.round(longest*10)/10,renfo,nat,q};
}
function weekAdvice(w){
  const seen=new Set(),tips=[];
  w.s.forEach(s=>{
    if(!s.a||seen.has(s.a)) return;
    const A=ARCHETYPES[s.a];
    if(!A||A.fam==="Récupération") return;
    seen.add(s.a);
    if(A.avant) tips.push({ico:A.ico,nom:A.nom,txt:A.avant});
  });
  return tips;
}

/* ============================================================
   RENDU — HEADER / ACCUEIL
   ============================================================ */
function renderHome(){
  g("subtitle").innerHTML=`12 semaines · objectif <b style="color:var(--soleil)">${META.objectif.plan}</b> `+
    `(${META.objectif.allure}/km) · priorité : ${META.priorite.toLowerCase()}`;
  (()=>{const d=new Date(MAJ.date);
    g("majline").innerHTML=`Dernière synchro <b>${d.toLocaleDateString("fr-FR",{day:"numeric",month:"long"})} à ${d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</b> · Strava${MAJ.garmin?" + Garmin":""}`;
  })();

  const wCur=SEMAINES.find(x=>x.n===curWeek);
  const okCur=wCur.s.filter((s,i)=>isDone(wCur,s,i)).length;
  const pcCur=Math.round(okCur/wCur.s.length*100);
  const nextN=curWeek+1;
  const wNext=SEMAINES.find(x=>x.n===nextN);

  g("focusCards").innerHTML=`
    <button class="focus-card nav-link" data-p="semaine-cours">
      <div class="fc-top"><span class="fc-badge">Semaine ${wCur.n}</span>${ICONS.chev}</div>
      <div class="fc-title">📍 Semaine en cours</div>
      <div class="fc-sub">${wCur.titre} · ${okCur}/${wCur.s.length} séances faites</div>
      <div class="bar"><i style="width:${pcCur}%"></i></div>
    </button>
    ${wNext?`
    <button class="focus-card nav-link" data-p="semaine-prochaine">
      <div class="fc-top"><span class="fc-badge">Semaine ${wNext.n}</span>${ICONS.chev}</div>
      <div class="fc-title">📅 Semaine prochaine</div>
      <div class="fc-sub">${wNext.titre}</div>
      <div class="bar"><i style="width:0%"></i></div>
    </button>`:`
    <button class="focus-card nav-link" data-p="semaine-prochaine">
      <div class="fc-top"><span class="fc-badge">🏁</span>${ICONS.chev}</div>
      <div class="fc-title">📅 Après la 12</div>
      <div class="fc-sub">Tu es sur la dernière semaine du plan</div>
    </button>`}`;

  g("quicklinks").innerHTML=`
    <button class="qlink nav-link" data-p="progression">${ICONS.chart}Progression</button>
    <button class="qlink nav-link" data-p="analyse">${ICONS.flask}Pourquoi ce plan</button>
    <button class="qlink nav-link" data-p="zones">${ICONS.target}Tes zones</button>
    <button class="qlink nav-link" data-p="plan">${ICONS.list}Les 12 semaines</button>`;

  const pc=Math.round(S.fait/S.tot*100), pk=Math.round(S.km_fait/S.km_prevu*100);
  g("homeGauges").innerHTML=`
    <div class="gauge"><div class="gt"><span class="gl">Séances réalisées</span>
      <span class="gv" style="color:var(--vert)">${pc}%</span></div>
      <div class="bar v"><i style="width:${pc}%"></i></div>
      <div class="gsub"><span><b style="color:var(--tx)">${S.fait}</b> faites</span><span>${S.tot} au total</span></div></div>
    <div class="gauge"><div class="gt"><span class="gl">Kilomètres parcourus</span>
      <span class="gv" style="color:var(--soleil)">${Math.round(S.km_fait)} km</span></div>
      <div class="bar"><i style="width:${pk}%"></i></div>
      <div class="gsub"><span><b style="color:var(--tx)">${pk}%</b> du plan</span><span>${Math.round(S.km_prevu)} km au total</span></div></div>`;
}

/* ============================================================
   RENDU — FOCUS (semaine en cours / prochaine)
   ============================================================ */
function renderFocusPage(elId,weekNum,isCurrent){
  const el=g(elId); if(!el) return;
  const w=SEMAINES.find(x=>x.n===weekNum);
  if(!w){
    el.innerHTML=`<section><div class="co co-v"><b class="t">Le plan s'arrête à la semaine 12</b>
      Il n'y a pas de semaine suivante — la semaine 12 est celle du marathon !</div></section>`;
    return;
  }
  const tot=w.s.length, ok=w.s.filter((s,i)=>isDone(w,s,i)).length, pc=Math.round(ok/tot*100);
  const ws=weekStats(w), advice=weekAdvice(w);
  const daysTo=Math.ceil((new Date(w.du+"T00:00:00")-NOW)/864e5);

  el.innerHTML=`
    <section>
      <div class="focus-hero">
        <div class="focus-hero-top">
          <span class="tag tg-${w.past?'past':w.type}">${w.tag}</span>
          ${isCurrent?`<span class="focus-days">Semaine ${w.n} / 12</span>`
            :(daysTo>0?`<span class="focus-days">Commence dans ${daysTo} j</span>`:`<span class="focus-days">En cours</span>`)}
        </div>
        <div class="focus-title">Semaine ${w.n} — ${w.titre}</div>
        <div class="wd">${w.dates}</div>
        ${isCurrent?`
          <div class="bar" style="margin-top:14px"><i style="width:${pc}%"></i></div>
          <div class="gsub"><span><b style="color:var(--tx)">${ok}</b>/${tot} séances faites</span><span>${ws.km} km prévus</span></div>
        `:`<div class="co co-i" style="margin-top:14px;margin-bottom:0">Cette semaine n'a pas encore commencé — plan indicatif, tu pourras l'ajuster selon ta forme le moment venu.</div>`}
      </div>

      <div class="stat-strip">
        <div class="stat-chip"><b>${ws.km}</b><span>km prévus</span></div>
        <div class="stat-chip"><b>${ws.longest}</b><span>sortie longue</span></div>
        <div class="stat-chip"><b>${ws.q}</b><span>qualité</span></div>
        <div class="stat-chip"><b>${ws.renfo}</b><span>renfo</span></div>
        <div class="stat-chip"><b>${ws.nat}</b><span>natation</span></div>
      </div>

      <h3 class="focus-h3">🎯 Objectifs de la semaine</h3>
      <div class="co co-g">${w.focus}</div>

      ${advice.length?`
      <h3 class="focus-h3">🧭 Articulation &amp; repos</h3>
      <div class="advice-list">
        ${advice.map(a=>`<div class="advice-item"><span class="advice-ico">${a.ico}</span>
          <div><b>${a.nom}</b><div class="bt">${a.txt}</div></div></div>`).join("")}
        <div class="advice-item"><span class="advice-ico">😴</span>
          <div><b>Le repos n'est pas une option</b><div class="bt">C'est pendant les jours sans séance que le corps encaisse la charge et progresse réellement.</div></div></div>
      </div>`:""}

      <h3 class="focus-h3">🗓️ Déroulé des séances</h3>
      ${renderBlocks(w)}
      ${w.planning?renderPlanning(w):""}
      ${w.bilan?`<div class="bilan" style="margin-top:16px">${w.bilan}</div>`:""}
    </section>`;
}
function refreshWeekViews(weekNum){
  renderWeeksList();
  if(weekNum===curWeek) renderFocusPage("focusCoursBody",curWeek,true);
  if(weekNum===curWeek+1) renderFocusPage("focusProchaineBody",curWeek+1,false);
  document.querySelector(`.wk[data-w="${weekNum}"]`)?.classList.add("open");
}

/* ============================================================
   RENDU — PROGRESSION (jauges + KPI + projection)
   ============================================================ */
function renderGauges(){
  const pc=Math.round(S.fait/S.tot*100), pk=Math.round(S.km_fait/S.km_prevu*100);
  const semRest=12-curWeek;
  g("gauges").innerHTML=`
  <div class="gauge"><div class="gt"><span class="gl">Séances réalisées</span>
    <span class="gv" style="color:var(--vert)">${pc}%</span></div>
    <div class="bar v"><i style="width:${pc}%"></i></div>
    <div class="gsub"><span><b style="color:var(--tx)">${S.fait}</b> faites</span><span>${S.restSe} restantes · ${S.tot} au total</span></div></div>
  <div class="gauge"><div class="gt"><span class="gl">Kilomètres parcourus</span>
    <span class="gv" style="color:var(--soleil)">${Math.round(S.km_fait)} km</span></div>
    <div class="bar"><i style="width:${pk}%"></i></div>
    <div class="gsub"><span><b style="color:var(--tx)">${pk}%</b> du plan</span><span>${Math.round(S.restKm)} km restants · ${Math.round(S.km_prevu)} au total</span></div></div>
  <div class="gauge"><div class="gt"><span class="gl">Avancement du calendrier</span>
    <span class="gv" style="color:var(--azur-l)">S${curWeek}<span style="font-size:.9rem;color:var(--tx3)">/12</span></span></div>
    <div class="bar"><i style="width:${Math.round(curWeek/12*100)}%"></i></div>
    <div class="gsub"><span>${semRest} semaine${semRest>1?"s":""} après celle-ci</span><span>${SEMAINES[curWeek-1].tag}</span></div></div>
  <div class="gauge"><div class="gt"><span class="gl">Par discipline</span></div>
    ${[["run","🏃 Course"],["strength","🏋️ Renfo"],["swim","🏊 Natation"]].map(([k,l])=>{
      const[a,b]=S.parType[k],p=Math.round(a/b*100);
      return `<div style="margin-bottom:9px"><div class="gsub" style="margin:0 0 4px">
        <span>${l}</span><span><b style="color:var(--tx)">${a}</b>/${b}</span></div>
        <div class="bar v" style="height:7px"><i style="width:${p}%"></i></div></div>`}).join("")}
  </div>`;
}
function renderKpis(){
  const H=HEBDO, last8=H.slice(-8);
  const kpis=[
    {l:"Volume hebdo",v:H[H.length-1].km,u:"km cette semaine",s:last8.map(x=>x.km),c:"#22c3e6",
     t:trend(H.map(x=>x.km)),n:"Le plan te fait monter jusqu'à ~65 km en semaine 10."},
    {l:"Sortie longue max",v:Math.max(...H.map(x=>x.longest)),u:"km (record du bloc)",s:last8.map(x=>x.longest),c:"#ffb703",
     t:trend(H.map(x=>x.longest)),n:"Objectif : 30 km en semaine 10. C'est ton principal levier."},
    {l:"Efficience",v:H.filter(x=>x.eff).slice(-1)[0]?.eff,u:"m par battement",s:H.map(x=>x.eff),c:"#2dd4bf",
     t:trend(H.map(x=>x.eff)),n:"Distance parcourue par battement de cœur. En hausse = tu progresses."},
    {l:"Allure moyenne",v:H[H.length-1].allure,u:"/km toutes sorties",s:last8.map(x=>-x.allure_min),c:"#8b5cf6",
     t:trend(H.map(x=>x.allure_min),true),n:"⚠️ Doit RALENTIR : tes footings sont trop rapides."},
    {l:"FC moyenne",v:H.filter(x=>x.fc).slice(-1)[0]?.fc,u:"bpm en course",s:H.map(x=>x.fc),c:"#ef476f",
     t:trend(H.map(x=>x.fc),true),n:"À allure égale, une FC qui baisse = adaptation cardiaque."},
    {l:"Dénivelé",v:H[H.length-1].dplus,u:"m cette semaine",s:last8.map(x=>x.dplus),c:"#fb8500",
     t:trend(H.map(x=>x.dplus)),n:"Les séances de côtes vont le faire remonter dès la semaine 5."}
  ];
  g("kpis").innerHTML=kpis.map(k=>{
    const t=k.t;
    const badge=t?`<span class="trend ${t.good?'tr-up':(Math.abs(t.pct)<3?'tr-eq':'tr-dn')}">${t.pct>0?'▲':'▼'} ${Math.abs(t.pct).toFixed(0)} %</span>`:'';
    return `<div class="kpi"><div class="kl">${k.l}</div>
      <div class="kv" style="color:${k.c}">${k.v??'—'}</div>
      <div class="ku">${k.u}</div>${badge}
      ${spark(k.s,k.c)}<div class="kn">${k.n}</div></div>`}).join("");
}
function renderProjection(){
  const pc=S.fait/S.tot;
  const predNow=3*60+54.7, cible=3*60+45, potentiel=3*60+26;
  const proj=predNow-(predNow-cible)*pc;
  const fmt=m=>`${Math.floor(m/60)}h${String(Math.round(m%60)).padStart(2,"0")}`;
  const volPrevu=Math.round(S.km_prevu);
  g("projection").innerHTML=`
  <div class="g g3" style="margin-bottom:15px">
    <div class="kpi"><div class="kl">Prédiction Garmin actuelle</div>
      <div class="kv" style="color:var(--tx2)">${GARMIN.predictions.marathon.slice(0,4).replace(':','h')}</div>
      <div class="ku">au 5 septembre</div>
      <div class="kn">Ce que tes données valent aujourd'hui, avant le bloc.</div></div>
    <div class="kpi"><div class="kl">Projection si plan réalisé</div>
      <div class="kv" style="color:var(--soleil)">${fmt(proj)}</div>
      <div class="ku">à ${Math.round(pc*100)} % de réalisation</div>
      <div class="kn">Converge vers 3h45 à mesure que tu coches les séances.</div></div>
    <div class="kpi"><div class="kl">Potentiel du moteur</div>
      <div class="kv" style="color:var(--vert)">${fmt(potentiel)}</div>
      <div class="ku">selon ton 5 km prédit</div>
      <div class="kn">Ce que vaudrait ton VO2max avec une endurance parfaite.</div></div>
  </div>
  <div class="g g2">
    ${[
      ["Sortie longue max","16,4 km","30 km","Le facteur n°1. Passer de 16 à 30 km transforme ta capacité à tenir le km 35."],
      ["Volume total du bloc",`${Math.round(S.km_fait)} km`,`${volPrevu} km`,"Densification capillaire et mitochondriale, meilleure utilisation des graisses."],
      ["Temps à allure marathon","~20 min","~3 h cumulées","L'allure 5:20/km devient un automatisme au lieu d'un effort."],
      ["Séances au seuil","0","4 séances","Relève le plafond aérobie sous lequel se situe ton allure de course."]
    ].map(([l,av,ap,d])=>`
    <div class="card cmp">
      <div class="cmp-l">${l}</div>
      <div class="cmp-vals">
        <div class="cmp-v"><span class="cmp-k">Aujourd'hui</span><b>${av}</b></div>
        <div class="cmp-arrow">→</div>
        <div class="cmp-v"><span class="cmp-k">Fin du plan</span><b class="cmp-hi">${ap}</b></div>
      </div>
      <p class="cmp-d">${d}</p>
    </div>`).join("")}
  </div>
  <div class="co co-i"><b class="t">Comment lire cette projection</b>
    Elle interpole entre la prédiction Garmin actuelle (3h54) et l'objectif (3h45), au prorata des séances validées.
    C'est un <b>modèle simple et volontairement transparent</b>, pas un algorithme physiologique. Le vrai point de contrôle reste
    <b>ton semi en solo du 11 octobre</b> (le 20 km de Paris affiche complet).
  </div>`;
}

/* ============================================================
   RENDU — WITHINGS (poids & composition, relevé manuel)
   ============================================================ */
function trendPill(v,goodDir,unit){
  if(v==null) return "";
  let cls="tr-eq";
  if(Math.abs(v)>=0.05 && (goodDir==="up"||goodDir==="down")){
    const good=goodDir==="up"?v>0:v<0;
    cls=good?"tr-up":"tr-dn";
  }
  const arrow=v>0?"▲":(v<0?"▼":"—");
  return `<span class="trend ${cls}">${arrow} ${Math.abs(v).toFixed(1)}${unit||""}</span>`;
}
function renderWithings(){
  const w=window.WITHINGS;
  const leadEl=g("withingsLead"), bodyEl=g("withings");
  if(!leadEl||!bodyEl) return;
  if(!w){
    bodyEl.innerHTML=`<div class="co co-i">Pas encore de relevé Withings enregistré.</div>`;
    return;
  }
  const d=new Date(w.date+"T00:00:00");
  leadEl.innerHTML=`Relevé <b style="color:var(--tx)">manuel</b> — lu à la demande dans l'app Withings de ton Mac,
    pas de synchronisation automatique. Dernier point : <b style="color:var(--vert)">${d.toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</b>.`;
  bodyEl.innerHTML=`
  <div class="g g3">
    <div class="kpi"><div class="kl">Poids</div>
      <div class="kv" style="color:var(--tx)">${w.poids} <span style="font-size:.9rem;color:var(--tx3)">${w.poids_unite}</span></div>
      <div class="ku">${w.poids_statut}</div>
      ${trendPill(w.poids_tendance_kg,"neutre"," kg")}
      <div class="kn">${w.periode}</div></div>
    <div class="kpi"><div class="kl">IMC</div>
      <div class="kv" style="color:var(--vert)">${w.imc}</div>
      <div class="ku">${w.imc_statut}</div>
      ${trendPill(w.imc_tendance,"neutre")}
      <div class="kn">Sur ${w.taille_cm} cm.</div></div>
    <div class="kpi"><div class="kl">Masse musculaire</div>
      <div class="kv" style="color:var(--azur-l)">${w.muscle_pct} %</div>
      ${trendPill(w.muscle_tendance_pct,"up"," %")}
      <div class="kn">${w.periode}</div></div>
    <div class="kpi"><div class="kl">Masse grasse</div>
      <div class="kv" style="color:var(--soleil)">${w.graisse_pct} %</div>
      ${trendPill(w.graisse_tendance_pct,"down"," %")}
      <div class="kn">${w.periode}</div></div>
    <div class="kpi"><div class="kl">Masse maigre</div>
      <div class="kv" style="color:var(--tx)">${w.masse_maigre_statut}</div>
      ${trendPill(w.masse_maigre_tendance_pct,"up"," %")}
      <div class="kn">Muscles + os + eau + organes.</div></div>
    <div class="kpi"><div class="kl">Masse osseuse</div>
      <div class="kv" style="color:var(--tx)">${w.masse_osseuse_statut}</div>
      <div class="kn">Stable sur la période.</div></div>
  </div>
  <div class="co co-v" style="margin-top:12px"><b class="t">Ce que ça dit pour le bloc</b>
    Poids stable, muscle en légère hausse, gras en légère baisse : la composition évolue dans le bon sens pendant
    la montée en charge. Rien à ajuster dans le plan pour l'instant — demande-moi un nouveau relevé quand tu veux un point.
  </div>`;
}

/* ============================================================
   RENDU — ANALYSE
   ============================================================ */
function renderAnalyse(){
  g("analyse").innerHTML=`
<div class="co co-g"><b class="t">Ton profil : un gros moteur sur des jambes sous-entraînées</b>
  Ton VO2max de <b>52 ml/kg/min</b> te place dans le top 10 % des hommes de ton âge, et ton cœur tournait à
  <b>49 bpm au repos</b> fin août <span style="color:var(--tx3)">(mesuré en vacances, donc plutôt optimiste — ta vraie
  ligne de base en rythme de vie normal sera connue quand tu reprendras le port continu)</span>. Côté cardio-respiratoire,
  tu as le moteur d'un coureur proche de 3h26.
  <br><br>Mais un marathon ne se joue pas seulement là. Il se joue dans ta capacité à encaisser
  <b>~35 000 impacts</b> à 2,5-3 fois ton poids de corps, et à alimenter tes muscles pendant 3h45.
  Ta plus longue sortie de l'été fait 16,4 km : tes fibres n'ont jamais été confrontées à ce que tu leur demanderas.</div>
<div class="g g2">
  <div class="card"><h3>🔋 Ce qui limite : le carburant</h3>
    <p class="lead" style="margin:8px 0 0">Tu stockes environ <b>2 000 kcal</b> de glycogène. Un marathon en coûte
    ~2 800. Le mur du km 32, c'est ce moment où le réservoir se vide et où le corps doit basculer sur les graisses.
    <br><br><b>Ce que le plan y fait :</b> les sorties longues au-delà de 1h45 entraînent précisément cette bascule.</p></div>
  <div class="card"><h3>🦵 Ce qui casse : les fibres</h3>
    <p class="lead" style="margin:8px 0 0">À chaque foulée, tes quadriceps freinent la descente en contraction
    <b>excentrique</b> — le mode qui crée le plus de micro-lésions. Après 30 km, l'accumulation dégrade ta foulée.
    <br><br><b>Ce que le plan y fait :</b> les côtes, le renfo excentrique et l'unilatéral construisent des fibres qui résistent.</p></div>
  <div class="card"><h3>❤️ Ce qui va bien : le cardio</h3>
    <p class="lead" style="margin:8px 0 0">14,2 km à 5:26/km à <b>137 bpm</b>, soit 74 % de ta FCmax. Ton efficience
    progresse de <b>1,214 à 1,331 m par battement</b> en trois semaines.
    <br><br><b>Conséquence :</b> tout le plan sert à faire remonter tes jambes au niveau de ton cœur.</p></div>
  <div class="card"><h3>🧠 Ce qui s'apprend : l'allure</h3>
    <p class="lead" style="margin:8px 0 0">Tenir 5:20/km pendant 42 km demande un automatisme, pas un calcul.
    <br><br><b>Total sur le bloc :</b> environ 3 heures cumulées à allure marathon, dont la majorité après 1 h de course.</p></div>
</div>`;
  g("ameliorations").innerHTML=`
<div class="co co-w"><b class="t">1. Tes footings sont trop rapides — priorité absolue</b>
  Tes sorties « faciles » tournent à 5:26-5:28/km, soit ton allure marathon cible.
  <br><b>Action :</b> tes Z1 à <b>6:00-6:30/km</b>.</div>
<div class="co co-w"><b class="t">2. Ton volume de sortie longue est très insuffisant</b>
  16,4 km maximum sur l'été, pour un objectif à 42,2 km.
  <br><b>Action :</b> la progression est déjà écrite (18 → 21 → 24 → 27 → 30 km, semi test en solo au passage).</div>
<div class="co co-i"><b class="t">3. Tu n'as jamais travaillé au seuil</b>
  Aucune séance de type 5 × 6′ en Z4 dans ton historique.
  <br><b>Action :</b> quatre séances de seuil sont programmées (semaines 7, 10 et 11).</div>
<div class="co co-i"><b class="t">4. Ton renfo est efficace mais incomplet</b>
  Bonne base, mais 100 % sur machines guidées. Aucun travail unilatéral.
  <br><b>Action :</b> séance B ajoutée — leg press une jambe, fentes bulgares, mollets unipodaux.</div>
<div class="co co-p"><b class="t">5. Angle mort : pas encore de vraie ligne de base de récupération</b>
  Ta FC de repos a oscillé entre 54 et 61 bpm début septembre, contre 49 bpm fin août — mais ce 49 vient de tes
  vacances (relâché, sans le stress du quotidien ni la charge d'entraînement). Ce n'est pas la bonne référence pour
  juger une hausse : on ne peut pas encore dire si 58-61 est anormal ou simplement ton niveau normal en vie active.
  <br><b>Action :</b> port continu de la montre prévu dans quelques semaines pour obtenir sommeil, VFC et une vraie
  ligne de base en contexte d'entraînement — c'est à partir de là que les écarts deviendront réellement interprétables.</div>`;
}

/* ============================================================
   RENDU — HISTORIQUE
   ============================================================ */
function renderHisto(){
  const rows=HEBDO.slice().reverse().map(w=>{
    const d=new Date(w.lundi+"T00:00:00");
    return `<tr><td>${d.toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}</td>
      <td class="w">${w.km} km</td><td class="n">${w.h} h</td><td class="n">${w.sorties}</td>
      <td class="n">${w.longest} km</td><td class="n">${w.allure||"—"}</td>
      <td class="n">${w.dplus} m</td><td class="n">${w.fc||"—"}</td>
      <td class="n" style="color:var(--vert);font-weight:700">${w.eff||"—"}</td>
      <td class="n">${w.natations||"—"}</td></tr>`}).join("");
  g("histo").innerHTML=`<tr><th>Semaine</th><th>Volume</th><th>Temps</th><th>Sorties</th><th>SL max</th>
    <th>Allure</th><th>D+</th><th>FC</th><th>Efficience</th><th>Nat.</th></tr>${rows}`;
}

/* ============================================================
   RENDU — ZONES
   ============================================================ */
function renderZones(){
  g("zlead").innerHTML=`Allures dérivées de l'objectif ${META.objectif.plan} (${META.objectif.allure}/km), `+
   `bornes cardiaques calculées par <b>réserve cardiaque</b> — FC repos ${META.athlete.fc_repos} bpm, `+
   `FCmax ${META.athlete.fc_max} bpm, réserve de ${META.athlete.fc_max-META.athlete.fc_repos} bpm. `+
   `<b>Fie-toi à l'allure en priorité</b>, la FC dérive avec la chaleur et la fatigue.`;
  g("zones").innerHTML=Object.entries(ZONES).map(([k,z])=>`
   <div class="zone" style="--zc:${z.c}">
     <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
       <span class="zbadge">${k}</span><h3 style="font-size:.9rem">${z.nom}</h3></div>
     <div class="zrow"><span>Allure</span><b>${z.allure} /km</b></div>
     <div class="zrow"><span>Vitesse tapis</span><b>${z.kmh} km/h</b></div>
     <div class="zrow"><span>FC</span><b>${z.fc} bpm</b></div>
     <p>${z.desc}</p></div>`).join("");
}

/* ============================================================
   RENDU — SEMAINES (plan complet + réutilisé par focus pages)
   ============================================================ */
function renderWeeksList(){
  const el=g("weeks"); if(!el) return;
  el.innerHTML=SEMAINES.map(w=>{
    const tot=w.s.length, ok=w.s.filter((s,i)=>isDone(w,s,i)).length;
    const full=ok===tot, pc=Math.round(ok/tot*100), now=w.n===curWeek;
    const cls=[full?"done":"",w.past?"past":"",(w.type==="race"||w.n===12)?"race":"",now?"now":""].join(" ");
    return `<div class="wk ${cls}" data-w="${w.n}">
     <div class="wh">
       <div class="wn">${full?"✓":w.n}</div>
       <div class="wm"><h3>Semaine ${w.n} — ${w.titre}
         <span class="tag tg-${now?'now':(w.type==='past'?'past':w.type)}">${now?"en cours":w.tag}</span></h3>
         <div class="wd2">${w.dates}</div></div>
       <div class="ws"><span><b style="color:var(--tx)">${ok}</b>/${tot}</span>
         <div class="mini"><i style="width:${pc}%"></i></div><span class="chev-ico">${ICONS.chev}</span></div>
     </div>
     <div class="wb">
       <div class="wf">${w.focus}</div>
       ${w.prevu?`<div class="plan-prev"><b>Ce que le plan prévoyait</b>${w.prevu}</div>`:""}
       ${w.past?w.s.map((s,i)=>sess(w,s,i)).join(""):renderBlocks(w)}
       ${(!w.past&&w.planning)?renderPlanning(w):""}
       ${w.bilan?`<div class="bilan">${w.bilan}</div>`:""}
     </div></div>`}).join("");
  applyFilter();
}

const BLOCKS=[["run","🏃","Course à pied"],["strength","🏋️","Renforcement"],["swim","🏊","Natation"]];
function renderBlocks(w){
  return BLOCKS.map(([k,ico,label])=>{
    const items=w.s.map((s,i)=>({s,i})).filter(x=>(x.s.k||"run")===k);
    if(!items.length) return "";
    return `<div class="blockgrp">
      <div class="bgh"><span>${ico}</span>${label}<span class="bgc">${items.length}</span></div>
      ${items.map(({s,i})=>sess(w,s,i)).join("")}
    </div>`;
  }).join("");
}
function archLabel(w,idx){
  const s=w.s[idx], A=s.a?ARCHETYPES[s.a]:null;
  return `${A?A.ico:ICO[s.k||"run"]} ${A?A.nom:s.t}`;
}
function renderPlanning(w){
  const rows=w.planning.map(slot=>{
    const jour=typeof slot.j==="number"?`Jour ${slot.j}`:`Jours ${slot.j}`;
    let contenu;
    if(slot.lbl) contenu=`<span class="prest">${slot.lbl}</span>`;
    else if(slot.i) contenu=slot.i.map(idx=>archLabel(w,idx)).join(" <span class='plus'>+</span> ");
    else contenu=`<span class="prest">😴 Repos</span>`;
    return `<tr class="${!slot.i&&!slot.lbl?'prow-rest':''}"><td>${jour}</td><td>${contenu}</td></tr>`;
  }).join("");
  return `<div class="planning">
    <div class="plh">🗓️ Proposition d'agencement sur la semaine</div>
    <table class="tb ptb"><tr><th>Jour</th><th>Contenu</th></tr>${rows}</table>
    <p class="pnote">Respecte l'ordre et les espacements ci-dessus ; décale librement ces jours selon ta semaine réelle.</p>
  </div>`;
}
function sess(w,s,i){
  const st=getS(w,i), done=isDone(w,s,i), lock=!!s.past, k=s.k||"run";
  const A=s.a?ARCHETYPES[s.a]:null;
  const forme=st.forme||"normal";
  const mets=s.m?`<div class="mets">${[
      s.m.allure&&`<span class="met hi">${s.m.allure}</span>`,
      s.m.temps&&`<span class="met">${s.m.temps}</span>`,
      s.m.fc&&`<span class="met hr">${s.m.fc} bpm</span>`,
      s.m.fcmax&&`<span class="met hr">max ${s.m.fcmax}</span>`
    ].filter(Boolean).join("")}</div>`:"";
  return `<div class="se ${done&&!lock?"ok":""} ${lock?"pastse":""} ${st.open?"open":""}" data-k="${k}" data-done="${done}" data-w="${w.n}" data-i="${i}">
    <div class="sh">
      <div class="chk ${done?"on":""} ${lock?"lock":""}" ${lock?"":`data-chk="1"`}>✓</div>
      <div class="sb">
        <div class="st">${s.d?`<span class="sd">${s.d}</span>`:""}<span class="si">${A?A.ico:ICO[k]}</span>
          <span class="sn">${pill(s.t)}</span></div>
        ${s.fixe?`<div class="sx fixe">📌 ${s.fixe}</div>`:""}
        ${s.lieu?`<div class="sx">${pill(s.lieu)}</div>`:""}
        ${s.f?`<div class="sx" style="color:var(--tx3)">Fourchette : ${s.f[0]} à ${s.f[1]} min</div>`:""}
        ${mets}
        ${s.km&&!s.past?`<div class="sx" style="color:var(--tx3);margin-top:3px">📏 ≈ ${s.km} km</div>`:""}
        ${s.note?`<div class="snote">${pill(s.note)}</div>`:""}
        ${A?`<span class="expand" data-exp="1">${st.open?"− Masquer le détail":"+ Objectif, physiologie, adaptation, enchaînement"}</span>`:""}
      </div>
    </div>
    ${A?detail(w,s,i,A,forme,st):""}
  </div>`;
}
function detail(w,s,i,A,forme,st){
  return `<div class="sdet">
    <div class="blk"><div class="bl">Type · ${A.nom}</div><div class="bt">${A.but}</div></div>
    <div class="blk"><div class="bl">Ce qui se passe dans tes muscles</div><div class="bt">${A.muscu}</div></div>
    <div class="blk"><div class="bl">Résultat recherché</div><div class="bt">${A.resultat}</div></div>
    <div class="blk"><div class="bl">Séance réussie si…</div><div class="bt">${A.reussite}</div></div>
    ${(A.avant||A.apres)?`<div class="blk deps">
      ${A.avant?`<div class="dep"><span class="depl">⬅ Avant cette séance</span><div class="bt">${A.avant}</div></div>`:""}
      ${A.apres?`<div class="dep"><span class="depl">➡ Après cette séance</span><div class="bt">${A.apres}</div></div>`:""}
    </div>`:""}
    ${A.tapis?`<div class="blk"><div class="bl">🏃 Sur tapis</div><div class="bt">${A.tapis}</div></div>`:""}
    ${A.lieux?`<div class="blk"><div class="bl">Où</div><div class="bt">${A.lieux}</div></div>`:""}
    ${A.ravito?`<div class="blk"><div class="bl">Ravitaillement</div><div class="bt">${A.ravito}</div></div>`:""}
    <div class="blk"><div class="bl">Comment je me sens aujourd'hui ?</div>
      <div class="formes">${FORMES.map(([k,l])=>
        `<button class="fbtn ${forme===k?"on":""}" data-f="${k}">${l}</button>`).join("")}</div>
      <div class="fadapt"><b>Adaptation :</b> ${A.forme[forme]}
        ${s.f?`<br><b>Durée :</b> ${forme==="top"?s.f[1]:forme==="bof"?s.f[0]:forme==="hs"?"réduite":Math.round((s.f[0]+s.f[1])/2)} min`:""}</div>
    </div>
    <div class="ressenti">
      <div class="bl">Ressenti après la séance <span class="saved">enregistré ✓</span></div>
      <textarea data-note="1" placeholder="Comment ça s'est passé ? Sensations, allure tenue, douleurs…">${esc(st.note||"")}</textarea>
    </div>
  </div>`;
}

/* ---------- FILTRES (page Plan complet uniquement) ---------- */
let filter="all";
function applyFilter(){
  document.querySelectorAll("#page-plan .se").forEach(el=>{
    const k=el.dataset.k,d=el.dataset.done==="true";
    let show=true;
    if(filter==="todo")show=!d; else if(filter!=="all")show=k===filter;
    el.style.display=show?"block":"none";
  });
}

/* ============================================================
   ÉVÉNEMENTS
   ============================================================ */
document.addEventListener("click",e=>{
  const nl=e.target.closest(".nav-link");
  if(nl && nl.dataset.p){ showPage(nl.dataset.p); return; }

  if(e.target.closest("#burgerBtn")){ openDrawer(); return; }
  if(e.target.closest("#bottomMenuBtn")){ openDrawer(); return; }
  if(e.target.closest("#drawerScrim")){ closeDrawer(); return; }
  if(e.target.closest("#syncIconBtn")){ openSync(); return; }
  if(e.target.closest("#syncCloseBtn")){ closeSync(); return; }
  if(e.target.closest("#syncScrim")){ closeSync(); return; }

  const se=e.target.closest(".se");
  if(se){
    const w=SEMAINES.find(x=>x.n==+se.dataset.w), i=+se.dataset.i;
    if(e.target.closest("[data-chk]")){ setS(w,i,{done:!getS(w,i).done}); location.reload(); return; }
    if(e.target.closest("[data-exp]")){ setS(w,i,{open:!getS(w,i).open}); refreshWeekViews(w.n); return; }
    const fb=e.target.closest(".fbtn");
    if(fb){ setS(w,i,{forme:fb.dataset.f}); refreshWeekViews(w.n); return; }
  }
  const wh=e.target.closest(".wh");
  if(wh) wh.parentElement.classList.toggle("open");
});

document.addEventListener("input",e=>{
  const ta=e.target.closest("[data-note]"); if(!ta) return;
  const se=ta.closest(".se");
  const w=SEMAINES.find(x=>x.n==+se.dataset.w);
  setS(w,+se.dataset.i,{note:ta.value});
  const s=se.querySelector(".saved"); s.classList.add("show");
  clearTimeout(ta._t); ta._t=setTimeout(()=>s.classList.remove("show"),1400);
});

document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll(".filters button").forEach(b=>b.onclick=()=>{
    document.querySelectorAll(".filters button").forEach(x=>x.classList.remove("on"));
    b.classList.add("on"); filter=b.dataset.f;
    if(filter!=="all") document.querySelectorAll(".wk").forEach(w=>w.classList.add("open"));
    applyFilter();
  });
  g("rst").onclick=()=>{if(confirm("Effacer toutes tes saisies (cases cochées, formes, ressentis) ?")){
    ST={}; localStorage.removeItem(KEY); location.reload();
  }};
});

/* ---------- SYNCHRONISATION MANUELLE ---------- */
const SYNC_CMD="Mets à jour mon suivi marathon : lis \"marathon/UPDATE.md\" et suis la procédure. "+
  "Chrome est ouvert avec Garmin Connect connecté, tu peux récupérer les métriques Garmin.";
document.addEventListener("DOMContentLoaded",()=>{
  g("spcopy").onclick=async()=>{
    const b=g("spcopy");
    try{
      await navigator.clipboard.writeText(SYNC_CMD);
      b.textContent="✓ Copié";
    }catch(e){
      b.textContent="📋 Copier la commande";
      const ta=document.createElement("textarea");
      ta.value=SYNC_CMD;
      ta.style.cssText="width:100%;margin-top:9px;background:var(--bg);border:1px solid var(--bd);"+
        "border-radius:8px;color:var(--tx);padding:9px;font-size:.78rem;font-family:inherit;min-height:64px";
      b.after(ta); ta.select(); return;
    }
    setTimeout(()=>b.textContent="📋 Copier la commande",1800);
  };
});

/* ============================================================
   INITIALISATION
   ============================================================ */
buildNav();
tick(); setInterval(tick,1000);
renderHome();
renderFocusPage("focusCoursBody",curWeek,true);
renderFocusPage("focusProchaineBody",curWeek+1,false);
renderGauges();
renderKpis();
renderProjection();
renderWithings();
renderAnalyse();
renderHisto();
renderZones();
renderWeeksList();
document.querySelector(`.wk[data-w="${curWeek}"]`)?.classList.add("open");
(()=>{const d=new Date(MAJ.date);
  g("drawerMaj").innerHTML=`Synchro <b>${d.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</b>`;
})();
showPage(location.hash?location.hash.slice(1):"accueil");
