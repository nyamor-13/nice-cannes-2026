/* ============================================================
   APP — Nice → Cannes 2026
   Logique de rendu + navigation. Consomme data-plan.js et
   data-strava.js (jamais modifiés par ce fichier).
   ============================================================ */

/* ---------- ICÔNES ----------
   Deux familles, comme prévu par le cahier de refonte (section 3.4) — jamais plus de deux :
   - DUOTONE (Phosphor, licence MIT) pour tout ce qui est structurel/nav : un peu de caractère,
     thémable par currentColor (la forme de fond à 20% d'opacité prend la même teinte que le
     premier plan). Chemins collés en dur, aucune dépendance CDN au runtime.
   - SVG (trait fin, maison) pour le "chrome" utilitaire (menu, fermer, rafraîchir, chevron,
     retour) — assez petits/fonctionnels pour qu'un rendu duotone n'apporte rien de plus. */
const SVG=(paths)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const DUOTONE=(paths)=>`<svg viewBox="0 0 256 256" fill="currentColor">${paths}</svg>`;
const ICONS={
  home:DUOTONE(`<path d="M216,120v96H152V152H104v64H40V120a8,8,0,0,1,2.34-5.66l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,216,120Z" opacity="0.2"/><path d="M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z"/>`),
  pin:DUOTONE(`<path d="M128,24a80,80,0,0,0-80,80c0,72,80,128,80,128s80-56,80-128A80,80,0,0,0,128,24Zm0,112a32,32,0,1,1,32-32A32,32,0,0,1,128,136Z" opacity="0.2"/><path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"/>`),
  calendar:DUOTONE(`<path d="M216,48V88H40V48a8,8,0,0,1,8-8H208A8,8,0,0,1,216,48Z" opacity="0.2"/><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"/>`),
  chart:DUOTONE(`<path d="M208,40V208H152V40Z" opacity="0.2"/><path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z"/>`),
  flask:DUOTONE(`<path d="M208,216H48a8,8,0,0,1-6.86-12.12l30.48-50.8h0c13.23-2.48,32-1.41,56.37,10.92,32.25,16.33,54.75,12.91,67.5,7.65h0l19.34,32.23A8,8,0,0,1,208,216Z" opacity="0.2"/><path d="M221.69,199.77,160,96.92V40h8a8,8,0,0,0,0-16H88a8,8,0,0,0,0,16h8V96.92L34.31,199.77A16,16,0,0,0,48,224H208a16,16,0,0,0,13.72-24.23ZM110.86,103.25A7.93,7.93,0,0,0,112,99.14V40h32V99.14a7.93,7.93,0,0,0,1.14,4.11L183.36,167c-12,2.37-29.07,1.37-51.75-10.11-15.91-8.05-31.05-12.32-45.22-12.81ZM48,208l28.54-47.58c14.25-1.73,30.31,1.85,47.82,10.72,19,9.61,35,12.88,48,12.88a69.89,69.89,0,0,0,19.55-2.7L208,208Z"/>`),
  clock:DUOTONE(`<path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" opacity="0.2"/><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"/>`),
  target:DUOTONE(`<path d="M176,128a48,48,0,1,1-48-48A48,48,0,0,1,176,128Z" opacity="0.2"/><path d="M221.87,83.16A104.1,104.1,0,1,1,195.67,49l22.67-22.68a8,8,0,0,1,11.32,11.32l-96,96a8,8,0,0,1-11.32-11.32l27.72-27.72a40,40,0,1,0,17.87,31.09,8,8,0,1,1,16-.9,56,56,0,1,1-22.38-41.65L184.3,60.39a87.88,87.88,0,1,0,23.13,29.67,8,8,0,0,1,14.44-6.9Z"/>`),
  list:DUOTONE(`<path d="M216,64V192H128V64Z" opacity="0.2"/><path d="M224,128a8,8,0,0,1-8,8H128a8,8,0,0,1,0-16h88A8,8,0,0,1,224,128ZM128,72h88a8,8,0,0,0,0-16H128a8,8,0,0,0,0,16Zm88,112H128a8,8,0,0,0,0,16h88a8,8,0,0,0,0-16ZM82.34,42.34,56,68.69,45.66,58.34A8,8,0,0,0,34.34,69.66l16,16a8,8,0,0,0,11.32,0l32-32A8,8,0,0,0,82.34,42.34Zm0,64L56,132.69,45.66,122.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32,0l32-32a8,8,0,0,0-11.32-11.32Zm0,64L56,196.69,45.66,186.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32,0l32-32a8,8,0,0,0-11.32-11.32Z"/>`),
  trendup:DUOTONE(`<path d="M232,56v64L168,56Z" opacity="0.2"/><path d="M232,48H168a8,8,0,0,0-5.66,13.66L188.69,88,136,140.69l-34.34-34.35a8,8,0,0,0-11.32,0l-72,72a8,8,0,0,0,11.32,11.32L96,123.31l34.34,34.35a8,8,0,0,0,11.32,0L200,99.31l26.34,26.35A8,8,0,0,0,240,120V56A8,8,0,0,0,232,48Zm-8,52.69L187.31,64H224Z"/>`),
  menu:SVG(`<path d="M4 7h16M4 12h16M4 17h16"/>`),
  arrowleft:SVG(`<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>`),
  x:SVG(`<path d="M6 6l12 12M18 6 6 18"/>`),
  refresh:SVG(`<path d="M4 12a8 8 0 0 1 14.5-4.7M20 12a8 8 0 0 1-14.5 4.7"/><path d="M18 3v4.5h-4.5M6 21v-4.5h4.5"/>`),
  chev:SVG(`<path d="m9 6 6 6-6 6"/>`),
};

/* ---------- PAGES ---------- */
const PAGES=["accueil","semaine-cours","semaine-prochaine","progression","analyse","ameliorations","historique","zones","plan","detail"];
const NAV=[
  {p:"accueil",l:"Accueil",i:"home"},
  {p:"semaine-cours",l:"Semaine en cours",i:"pin"},
  {p:"semaine-prochaine",l:"Semaine prochaine",i:"calendar"},
  {p:"progression",l:"Progression",i:"chart"},
  {p:"analyse",l:"Pourquoi ce plan",i:"flask"},
  {p:"ameliorations",l:"Points d'amélioration",i:"trendup"},
  {p:"historique",l:"Historique",i:"clock"},
  {p:"zones",l:"Zones",i:"target"},
  {p:"plan",l:"Plan complet",i:"list"},
];
const TITLES=Object.fromEntries(NAV.map(n=>[n.p,n.l]));

/* ---------- ÉTAT ---------- */
const KEY="mnc2026-v3", TSKEY=KEY+"__ts";
let ST=JSON.parse(localStorage.getItem(KEY)||"{}");
const save=()=>{
  const ts=Date.now();
  localStorage.setItem(KEY,JSON.stringify(ST));
  localStorage.setItem(TSKEY,String(ts));
  window.CloudSync?.push(ST,ts);
};
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
// RACE/curWeek/S dépendent de données chargées depuis Firestore de façon asynchrone (auth.js/
// data-cloud.js) — impossible de les calculer au chargement du script comme avant (l'ancien
// data-plan.js était synchrone, <script src>). Déclarées ici pour rester visibles par toutes les
// fonctions du fichier, mais seulement assignées par initData(), appelé au tout début de boot()
// une fois window.DataCloud.ready résolu. Ne jamais les lire avant ce point.
let RACE, curWeek, S;
function tick(){
  const ms=RACE-new Date();
  const el=g("cds"); if(!el) return;
  if(ms<0){el.innerHTML='<div class="cd"><b>🏁</b><span>Bonne course</span></div>';return}
  const d=Math.floor(ms/864e5),h=Math.floor(ms/36e5)%24,m=Math.floor(ms/6e4)%60,s=Math.floor(ms/1e3)%60;
  el.innerHTML=[[Math.ceil(d/7),"semaines"],[d,"jours"],[h,"h"],[m,"min"],[s,"s"]]
    .map(([v,l])=>`<div class="cd"><b>${v}</b><span>${l}</span></div>`).join("");
}

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
// Assigne RACE/curWeek/S — à appeler une seule fois, tout au début de boot(), une fois les
// données Firestore chargées (window.DataCloud.ready résolu). Voir la déclaration `let` plus haut.
function initData(){
  RACE=new Date(META.date);
  curWeek=(()=>{
    let c=SEMAINES[0];
    for(const w of SEMAINES){const d=new Date(w.du+"T00:00:00");if(d<=NOW)c=w;}
    return c.n;
  })();
  S=stats();
}

/* ---------- TENDANCES ---------- */
// Histogramme SVG avec axes lisibles (échelle + repères hebdo), pour remplacer les
// sparklines quand on veut vraiment comparer les semaines entre elles, pas juste voir
// une tendance globale.
function barChart(data,opts){
  opts=opts||{};
  const vals=data.map(d=>d.value).filter(v=>v!=null);
  if(vals.length<2) return `<div class="kn" style="padding:20px 0">${opts.emptyMsg||"Pas encore assez de semaines pour un histogramme."}</div>`;
  const W=300,H=opts.height||110,padL=30,padR=6,padT=8,padB=16;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const dataMin=Math.min(...vals), dataMax=Math.max(...vals), range=dataMax-dataMin;
  const hasNeg=dataMin<0;
  // Échelle adaptative : si les valeurs varient peu par rapport à leur amplitude (ex. allure
  // entre 5,4 et 6,0), démarrer l'axe à 0 écrase visuellement la tendance. On resserre alors
  // l'échelle autour des valeurs réelles pour la rendre lisible. Les métriques à vraie
  // amplitude (volume, dénivelé...) gardent un axe à 0, plus honnête sur leur échelle.
  // Si les valeurs peuvent être négatives (ex. TSB), l'axe descend sous 0 quoi qu'il arrive —
  // sinon les barres négatives sortent du cadre et disparaissent silencieusement.
  const zoom=opts.autoZoom!==false && !hasNeg && dataMax>0 && (range/dataMax)<0.35;
  const axisMin=hasNeg ? dataMin-(range>0?range*0.15:Math.abs(dataMin)*0.15||1)
    : (zoom?Math.max(0,dataMin-(range>0?range*0.4:dataMax*0.05)):0);
  const axisMax=hasNeg ? Math.max(0,dataMax)+(range>0?range*0.15:1)
    : (zoom?dataMax+(range>0?range*0.4:dataMax*0.05):(dataMax*1.12||1));
  const axisRange=(axisMax-axisMin)||1;
  const n=data.length, slot=plotW/n, bw=Math.min(22,slot*0.6);
  const yFor=v=>padT+plotH-((v-axisMin)/axisRange)*plotH;
  // La "ligne zéro" ne sert de base aux barres que si l'axe traverse réellement zéro (cas des
  // graphiques à valeurs négatives, ex. TSB). Sur un axe zoomé qui ne contient pas zéro (ex.
  // Efficience entre 1,18 et 1,33), yFor(0) tombe hors cadre et ferait exploser la hauteur des
  // barres — dans ce cas, la base reste le bas du graphique, comme sur un histogramme classique.
  const yBase=hasNeg?yFor(0):(padT+plotH);
  const bars=data.map((d,i)=>{
    const x=padL+i*slot+(slot-bw)/2;
    let y,h;
    if(d.value==null){ y=yBase; h=0; }
    else{ const yVal=yFor(d.value); y=Math.min(yBase,yVal); h=Math.abs(yBase-yVal); }
    // Un marqueur "hi" (ex. semaine à côtes) doit rester visible même à valeur nulle
    // (le dénivelé d'une séance de côtes sur tapis reste à 0, faute de GPS).
    if(d.hi && h<3){ h=3; y=yBase-3; }
    const col=d.hi?(opts.colorHi||"#ffb703"):(opts.color||"#22c3e6");
    // Semaine à venir : valeur projetée depuis le plan (pas encore réelle), affichée en clair
    // avec un contour pointillé pour ne jamais la confondre avec une semaine réalisée.
    const projAttrs=d.proj?` fill-opacity="0.32" stroke="${col}" stroke-width="1" stroke-dasharray="3,2"`:"";
    const lundiAttr=d.lundi?` data-lundi="${d.lundi}"`:"";
    // Zone de clic invisible sur toute la hauteur du graphique — une barre proche de 0 (ex. semaine
    // sans dénivelé) est sinon quasi impossible à toucher précisément. Sert le drill-down par semaine
    // sur la page de détail d'indicateur (clic sur une barre → chiffres de cette semaine).
    const hitRect=d.lundi?`<rect x="${x.toFixed(1)}" y="${padT}" width="${bw.toFixed(1)}" height="${plotH.toFixed(1)}" fill="transparent"${lundiAttr} class="bar-hit"/>`:"";
    return `${hitRect}<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(h,0).toFixed(1)}" rx="2" fill="${col}"${projAttrs}${lundiAttr}/>`;
  }).join("");
  // Précision des repères d'axe adaptée à l'écart réel entre eux, sinon un axe resserré (ex.
  // efficience 1,19-1,31) affiche 3× le même nombre arrondi et devient illisible.
  const decimals=axisRange<1?2:axisRange<10?1:0;
  const gridVals=[axisMin,(axisMin+axisMax)/2,axisMax];
  const grid=gridVals.map(v=>{
    const y=yFor(v);
    return `<line x1="${padL}" x2="${W-padR}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--bd)" stroke-width="1"/>
      <text x="${(padL-5).toFixed(1)}" y="${(y+3).toFixed(1)}" text-anchor="end" font-size="7.5" fill="var(--tx3)">${v.toFixed(decimals)}</text>`;
  }).join("");
  const step=n>10?2:1;
  const xlabels=data.map((d,i)=>i%step?"":`<text x="${(padL+i*slot+slot/2).toFixed(1)}" y="${H-4}" text-anchor="middle" font-size="7.5" fill="${d.proj?'var(--tx3)':'var(--tx3)'}">${d.label}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;overflow:visible">${grid}${bars}${xlabels}</svg>`;
}
function trend(vals,inverse){
  const v=vals.filter(x=>x!=null);if(v.length<4)return null;
  const n=Math.min(3,Math.floor(v.length/2));
  const rec=v.slice(-n).reduce((a,b)=>a+b,0)/n, old=v.slice(-2*n,-n).reduce((a,b)=>a+b,0)/n;
  const d=(rec-old)/old*100;
  return{pct:d,good:inverse?d<0:d>0};
}

/* ---------- TEMPS / PRÉDICTIONS ---------- */
function timeToSec(t){
  const p=t.split(":").map(Number);
  return p.length===3 ? p[0]*3600+p[1]*60+p[2] : p[0]*60+p[1];
}
function secToHM(s){
  let h=Math.floor(s/3600), m=Math.round((s%3600)/60);
  if(m===60){h++;m=0;}
  return `${h}h${String(m).padStart(2,"0")}`;
}
function riegel(t1sec,d1,d2){ return t1sec*Math.pow(d2/d1,1.06); }
function hToSec(h){ const m=h.match(/(\d+)\s*h\s*(\d+)/); return m?(+m[1]*3600+ +m[2]*60):0; }
// Potentiel physiologique par Riegel, croisé sur les 3 distances prédites par Garmin.
// Le semi (21,1 km) est retenu comme référence principale : c'est la distance la plus
// proche du marathon, donc l'extrapolation la moins risquée. Le 5 km et le 10 km sont
// gardés comme repères de cohérence — un grand écart entre eux est en soi une information
// (ça confirme le déficit d'endurance spécifique plutôt que la vitesse pure).
function enginePotentiel(){
  const G=GARMIN.predictions;
  const estimates=[["5k",5],["10k",10],["semi",21.1]].map(([k,d])=>({
    label:k, dist:d, sec:riegel(timeToSec(G[k]),d,42.195)
  }));
  const primary=estimates[estimates.length-1];
  const secs=estimates.map(e=>e.sec);
  return{estimates, primary, spreadMin:Math.round((Math.max(...secs)-Math.min(...secs))/60)};
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
// Date calendaire exacte d'une séance, à partir du jour de la semaine indiqué dans son planning
// (w.planning[].j, 1=lundi..7=dimanche). Sert à donner un rendez-vous concret ("mardi 16
// septembre") plutôt qu'un vague "bientôt" dans les points d'amélioration. Renvoie null si le
// planning ne précise pas cette séance ou si le jour n'est pas un simple numéro (ex. "5–7").
function sessionDate(w,i){
  if(!w.planning) return null;
  const entry=w.planning.find(p=>p.i&&p.i.includes(i));
  if(!entry||typeof entry.j!=="number") return null;
  const d=new Date(w.du+"T00:00:00");
  d.setDate(d.getDate()+(entry.j-1));
  return d;
}
const toISO=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
// Prochaine séance à venir (semaine courante incluse) qui vérifie `pred`, non encore cochée
// faite — utilisé pour donner un rendez-vous concret dans les points d'amélioration plutôt
// qu'un conseil générique ("continue le seuil" → "ta prochaine séance de seuil, mardi 23, vise...").
function nextSession(pred){
  let best=null;
  SEMAINES.forEach(w=>{
    if(w.n<curWeek) return;
    w.s.forEach((s,i)=>{
      if(isDone(w,s,i)||!pred(s,w,i)) return;
      const d=sessionDate(w,i);
      const sortKey=(d||new Date(w.du+"T00:00:00")).getTime()+i;
      if(!best||sortKey<best.sortKey) best={w,i,s,date:d,sortKey};
    });
  });
  return best;
}

/* ============================================================
   RENDU — HEADER / ACCUEIL
   ============================================================ */
// Rangée bento secondaire sous le countdown (cahier de refonte, 3.3) : objectif toujours affiché,
// streak seulement à partir de 2 semaines (sinon un "🔥 1" ne dit pas grand-chose et occuperait
// une tuile pour rien), dernière activité si on en a une. Jamais plus de 3 tuiles — pas de scroll
// horizontal sur mobile, et ça garde la hiérarchie "un hero, quelques tuiles" du bento.
function renderHeroRow(){
  const el=g("heroRow"); if(!el) return;
  const streak=pilierStreak();
  const dernier=lastAct();
  const tiles=[
    {k:"Objectif",v:META.objectif.plan,cls:""},
  ];
  if(streak>=2) tiles.push({k:"Régularité",v:`🔥 ${streak} sem.`,cls:"streak"});
  if(dernier){
    const detail=dernier.km?`${dernier.km} km`:dernier.m?`${dernier.m} m`:dernier.nom;
    tiles.push({k:"Dernière",v:detail,cls:""});
  }
  el.innerHTML=tiles.map(t=>`<div class="hero-tile ${t.cls}"><div class="ht-k">${t.k}</div><div class="ht-v">${t.v}</div></div>`).join("");
}
function renderHome(){
  g("subtitle").innerHTML=`12 semaines · objectif <b style="color:var(--soleil)">${META.objectif.plan}</b> `+
    `(${META.objectif.allure}/km) · priorité : ${META.priorite.toLowerCase()}`;
  (()=>{const d=new Date(MAJ.date);
    g("majline").innerHTML=`Dernière synchro <b>${d.toLocaleDateString("fr-FR",{day:"numeric",month:"long"})} à ${d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</b> · Strava${MAJ.garmin?" + Garmin":""}`;
  })();
  renderHeroRow();

  const wCur=SEMAINES.find(x=>x.n===curWeek);
  const okCur=wCur.s.filter((s,i)=>isDone(wCur,s,i)).length;
  const pcCur=Math.round(okCur/wCur.s.length*100);
  const nextN=curWeek+1;
  const wNext=SEMAINES.find(x=>x.n===nextN);

  renderHomeSynthese(wCur,okCur,pcCur);

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
    <button class="qlink nav-link" data-p="plan">${ICONS.list}Les 12 semaines</button>
    <button class="qlink nav-link" data-p="ameliorations">${ICONS.trendup}Points d'amélioration</button>`;

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
   RENDU — SYNTHÈSE HOME (100 % calculée à chaque chargement,
   jamais de texte figé — c'est le point qui manquait)
   ============================================================ */
function renderHomeSynthese(wCur,okCur,pcCur){
  const el=g("homeSynthese"); if(!el) return;
  const H=HEBDO, last=H[H.length-1];
  const d0=new Date(last.lundi+"T00:00:00"), d1=new Date(d0); d1.setDate(d1.getDate()+6);
  const rangeTxt=`${d0.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} – ${d1.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}`;

  const daysToRace=Math.max(0,Math.ceil((RACE-NOW)/864e5));
  const pcPlan=Math.round(S.fait/S.tot*100);
  const kmFait=Math.round(S.km_fait), kmPrevu=Math.round(S.km_prevu);

  const tEff=trend(H.map(x=>x.eff));
  const dernier=lastAct();

  // Le badge croise deux signaux frais : la tendance d'efficience ET la forme (TSB) du modèle
  // charge/fatigue — pas juste l'efficience seule, pour que le statut affiché change plus souvent
  // et reflète mieux "comment tu es" au moment où tu regardes la page.
  let badge,badgeTxt;
  if(last.tsb!=null && last.tsb<-12){badge="var(--rouge)";badgeTxt="🔴 Fatigue à surveiller";}
  else if(tEff && tEff.pct>3){badge="var(--vert)";badgeTxt="🟢 En progression";}
  else if(tEff && tEff.pct<-8){badge="var(--corail)";badgeTxt="🟠 À surveiller";}
  else if(last.tsb!=null && last.tsb>5){badge="var(--vert)";badgeTxt="🟢 Frais, de la marge";}
  else {badge="var(--azur-l)";badgeTxt="🔵 Stable";}

  const effTxt=tEff
    ? `${tEff.pct>0?"en hausse":"en baisse"} de ${Math.abs(tEff.pct).toFixed(0)} % sur les 3 dernières semaines`
    : null;

  const footingHome=footingStats(last.lundi);
  const allureAlerte=!footingHome
    ? `pas de footing pur cette semaine (que de la qualité) — rien à évaluer sur la récup.`
    : footingHome.allure_min<5.9
    ? `<span style="color:var(--soleil)">⚠️ tes footings (hors qualité) tournent à ${footingHome.allure}/km — toujours trop rapide, vise 6:00-6:30/km.</span>`
    : `tes footings (hors qualité) tournent à ${footingHome.allure}/km, plus proche de la Z1 cible — continue.`;

  const pred=GARMIN.predictions.marathon.slice(0,4).replace(':','h');
  const objectifTxt=META.objectif.plan;

  const dernierTxt=dernier
    ? `Ta dernière activité, ${jourLong(dernier.date).toLowerCase()} — <b>${dernier.nom}</b>${dernier.km?` : <b>${dernier.km} km</b> à ${dernier.allure}/km${dernier.fc?` (${dernier.fc} bpm)`:""}`:dernier.duree_min?` : ${Math.round(dernier.duree_min)} min`:""}.`
    : "";

  el.innerHTML=`
  <div class="co co-i" style="border-color:${badge}">
    <b class="t" style="color:${badge}">${badgeTxt}</b>
    ${dernierTxt}
    <br><br>
    Semaine <b>${wCur.n}</b>/12 · <b>${daysToRace} jours</b> avant le marathon. <b>${okCur}/${wCur.s.length}</b> séances
    cochées cette semaine, <b>${pcPlan} %</b> du plan validé au total (<b>${kmFait}</b> km sur ${kmPrevu} prévus).
    <br><br>
    Semaine du ${rangeTxt} : <b>${last.km} km</b> en ${last.sorties} sorties, dont
    <b>${last.longest} km</b> en sortie longue à ${last.allure}/km${last.fc?` (FC moy. ${last.fc} bpm)`:""}.
    Efficience actuelle : <b>${last.eff??"—"}</b> m/battement${effTxt?`, ${effTxt}`:" (encore trop peu de semaines avec FC pour dégager une tendance)"}.
    Allure de récup (footings) : ${allureAlerte}
    <br><br>
    Côté Garmin, la prédiction marathon actuelle est de <b>${pred}</b> pour un objectif fixé à <b>${objectifTxt}</b>.
    Cap de la semaine : <b>${wCur.titre}</b>.
  </div>`;
}

/* ============================================================
   RENDU — FOCUS (semaine en cours / prochaine)
   ============================================================ */
function weekActivities(w){
  if(!window.ACTIVITES) return [];
  const start=new Date(w.du+"T00:00:00");
  const end=new Date(start.getTime()+7*864e5);
  return ACTIVITES.filter(a=>{
    const d=new Date(a.date+"T00:00:00");
    return d>=start && d<end;
  }).sort((a,b)=>a.date<b.date?-1:1);
}
function renderRealActivities(w){
  const acts=weekActivities(w);
  if(!acts.length) return "";
  const jourTxt=d=>{
    const dt=new Date(d+"T00:00:00");
    const s=dt.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
    return s.charAt(0).toUpperCase()+s.slice(1);
  };
  return `
    <h3 class="focus-h3">✅ Ce que tu as réellement fait</h3>
    <div class="advice-list">
      ${acts.map(a=>{
        const detail=[
          a.km?`${a.km} km`:null,
          a.m?`${a.m} m`:null,
          a.allure?`${a.allure}/km`:null,
          a.duree_min?`${Math.round(a.duree_min)} min`:null,
          a.fc?`FC moy. ${a.fc} bpm`:null
        ].filter(Boolean).join(" · ");
        const exBlock=(a.exercices&&a.exercices.length)?`
          <details class="ex-detail">
            <summary>Détail des exercices (${a.exercices.length})</summary>
            <ul class="ex-list">
              ${a.exercices.map(ex=>`<li><b>${esc(ex.nom)}</b> — ${ex.sets.map(esc).join(" · ")}</li>`).join("")}
            </ul>
          </details>`:"";
        return `<div class="advice-item"><span class="advice-ico">${ICO[a.type]||"•"}</span>
          <div><b>${jourTxt(a.date)} — ${a.nom}</b><div class="bt">${detail}</div>${exBlock}</div></div>`;
      }).join("")}
    </div>`;
}
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
        ${isCurrent?(()=>{
          // Bento réduit à 2 tuiles (cahier de refonte, 3.3) : l'anneau de progression est le seul
          // élément "vivant" de cette page (change chaque jour) — le texte "objectif de la semaine"
          // reste hors bento, en pleine largeur, juste en dessous (inchangé).
          const streak=pilierStreak();
          return `<div class="fh-bento">
            <div class="fh-ring" style="--pc:${pc}"><i><b>${ok}/${tot}</b><span>séances</span></i></div>
            <div class="fh-side">
              <div class="fh-tile"><div class="ht-k">Km prévus</div><div class="ht-v">${ws.km} km</div></div>
              ${streak>=2?`<div class="fh-tile"><div class="ht-k">Régularité</div><div class="ht-v" style="color:var(--corail)">🔥 ${streak} sem.</div></div>`:""}
            </div>
          </div>`;
        })():`<div class="co co-i" style="margin-top:14px;margin-bottom:0">Cette semaine n'a pas encore commencé — plan indicatif, tu pourras l'ajuster selon ta forme le moment venu.</div>`}
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

      ${w.nutrition?`
      <h3 class="focus-h3">🍽️ Nutrition</h3>
      <div class="co co-p">${w.nutrition}</div>`:""}

      ${advice.length?`
      <h3 class="focus-h3">🧭 Articulation &amp; repos</h3>
      <div class="advice-list">
        ${advice.map(a=>`<div class="advice-item"><span class="advice-ico">${a.ico}</span>
          <div><b>${a.nom}</b><div class="bt">${a.txt}</div></div></div>`).join("")}
        <div class="advice-item"><span class="advice-ico">😴</span>
          <div><b>Le repos n'est pas une option</b><div class="bt">C'est pendant les jours sans séance que le corps encaisse la charge et progresse réellement.</div></div></div>
      </div>`:""}

      ${renderRealActivities(w)}

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
// Nombre de semaines déjà closes (n<curWeek) où la séance "pilier" (sortie longue ou course)
// a été faite, en comptant à rebours depuis la dernière. Une semaine de coupure planifiée
// (a:"off" avec fixe, ex. S5 mariage) ne casse pas la série — elle est prévue par le plan
// lui-même, la pénaliser reviendrait à contredire la préparation. Sert uniquement de chiffre
// de mise en avant de l'effort ici, ce n'est pas (encore) un mécanisme de streak persistant.
function pilierStreak(){
  let streak=0;
  for(let n=curWeek-1;n>=1;n--){
    const w=SEMAINES.find(x=>x.n===n); if(!w) break;
    // Semaines 1-3 : reconstruites rétroactivement depuis Strava, avant que le plan ne soit
    // structuré en archétypes — leurs séances n'ont donc pas toutes un `a` renseigné, et la
    // dernière n'est pas systématiquement cochée dans ST. `w.past` suffit à les compter : ce
    // sont des semaines réellement vécues, pas des semaines de plan à venir qu'on pourrait sauter.
    if(w.past){ streak++; continue; }
    if(w.s.some(s=>s.a==="off"&&s.fixe)) continue;
    const idx=w.s.findIndex(s=>s.a==="sl"||s.a==="sl_am"||s.a==="course");
    if(idx===-1) break;
    if(isDone(w,w.s[idx],idx)) streak++; else break;
  }
  return streak;
}
const GAIN_BY_TYPE={
  build:"la charge continue de monter — c'est ce qui construit le plafond du 8 novembre",
  peak:"c'est le pic de toute la préparation, le levier le plus lourd du plan",
  taper:"on sécurise ce qui est acquis, sans plus rien risquer",
  race:"le jour où tout ce travail se transforme en chrono",
};
function renderProgressSynthese(){
  const el=g("progressSynthese"); if(!el) return;
  const pcSe=Math.round(S.fait/S.tot*100), pcKm=Math.round(S.km_fait/S.km_prevu*100);
  const longestRecord=Math.max(...HEBDO.map(w=>w.longest));
  const lastRun=lastAct("run");
  const streak=pilierStreak();

  let slTxt;
  if(longestRecord<15) slTxt="tes sorties longues démarrent tout juste — l'essentiel de la progression vers 30 km est encore devant toi.";
  else if(longestRecord<22) slTxt=`tu commences à sentir le format long (<b>${longestRecord} km</b> en record), mais le vrai test arrive avec la montée vers 27-30 km.`;
  else if(longestRecord<28) slTxt=`tu abordes les distances qui comptent vraiment (<b>${longestRecord} km</b> en record) — le pic à 30 km est en vue.`;
  else slTxt=`le pic de volume long est atteint ou presque (<b>${longestRecord} km</b>) — la suite, c'est consolider puis affûter.`;

  let qualTot=0,qualDone=0;
  SEMAINES.forEach(w=>w.s.forEach((s,i)=>{
    const A=s.a?ARCHETYPES[s.a]:null;
    if(A&&QUAL_FAM.includes(A.fam)){ qualTot++; if(isDone(w,s,i)) qualDone++; }
  }));
  let qualTxt;
  if(qualDone===0) qualTxt="les séances de qualité (VMA, seuil, côtes) viennent tout juste de démarrer.";
  else if(qualDone<qualTot*0.4) qualTxt=`<b>${qualDone}/${qualTot}</b> séances de qualité faites — ça commence à élever ton plafond aérobie.`;
  else if(qualDone<qualTot*0.8) qualTxt=`<b>${qualDone}/${qualTot}</b> séances de qualité déjà dans les jambes — le travail de fond est bien engagé.`;
  else qualTxt=`<b>${qualDone}/${qualTot}</b> séances de qualité faites — l'essentiel du travail d'intensité est derrière toi.`;

  let renfoTot=0,renfoDone=0;
  SEMAINES.forEach(w=>w.s.forEach((s,i)=>{ if(s.k==="strength"){ renfoTot++; if(isDone(w,s,i)) renfoDone++; } }));

  const objSec=hToSec(META.objectif.plan);
  const predSec=timeToSec(GARMIN.predictions.marathon);
  const gapMin=Math.round((predSec-objSec)/60);
  const gapTxt=gapMin>0
    ? `l'écart de <b>${gapMin} minutes</b> qui te sépare aujourd'hui de <b>${META.objectif.plan}</b> est exactement ce que la sortie longue, le seuil et le renfo sont chargés de combler d'ici le 8 novembre — chaque semaine cochée grignote une part de ces ${gapMin} minutes, pas juste une case.`
    : `tes données actuelles sont déjà sous l'objectif de <b>${META.objectif.plan}</b> — la fin du bloc sert à sécuriser cette avance, pas à en gagner davantage.`;

  const wNext=SEMAINES[curWeek], wNext2=SEMAINES[curWeek+1];
  const nextTxt=[wNext,wNext2].filter(Boolean).map(w=>
    `<b>S${w.n} — ${w.titre}</b>${GAIN_BY_TYPE[w.type]?` (${GAIN_BY_TYPE[w.type]})`:""}`
  ).join(", puis ");

  const lastRunTxt=lastRun
    ?`Ta dernière sortie, ${jourLong(lastRun.date)} : <b>${lastRun.allure}/km</b>${lastRun.fc?` à <b>${lastRun.fc} bpm</b>`:""} sur <b>${lastRun.km} km</b>.`
    :"";

  el.innerHTML=`
  <div class="co co-g">
    <b>${Math.round(S.km_fait)} km</b> parcourus en <b>${S.fait}</b> séances depuis le 17 août — un socle qui ne se discute pas,
    quoi qu'il arrive en fin de plan.${streak>=2?` <b>${streak}</b> semaines de suite sans sauter la sortie longue : c'est exactement la
    régularité qui construira les 30 km de la semaine 10.`:""}
    <br><br>
    ${lastRunTxt}
    <br><br>
    Côté sortie longue, ${slTxt} Côté intensité, ${qualTxt} Le renfo suit avec <b>${renfoDone}/${renfoTot}</b> séances faites —
    c'est le complément unilatéral qui manquait avant le bloc (leg press une jambe, fentes bulgares).
    <br><br>
    ${nextTxt?`À venir : ${nextTxt}.<br><br>`:""}
    Et le chiffre qui compte : ${gapTxt}
  </div>`;
}
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
function weekHasCotes(lundi){
  const w=SEMAINES.find(x=>x.du===lundi);
  return !!(w && w.s.some(s=>s.a==="cotes"));
}
function wkLabel(lundi){
  const d=new Date(lundi+"T00:00:00");
  return d.toLocaleDateString("fr-FR",{day:"numeric",month:"numeric"});
}
// Une semaine est "complète" une fois son dimanche passé — sert à ne jamais comparer une
// semaine en cours (forcément partielle) à des semaines entières dans les tendances.
function isWeekComplete(lundi){
  const end=new Date(lundi+"T00:00:00"); end.setDate(end.getDate()+7);
  return NOW>=end;
}
// Les 12 semaines du plan, une par une : la vraie donnée HEBDO quand elle existe, sinon une
// projection tirée du plan lui-même (km/sortie longue prévus) pour les semaines à venir —
// coloriée différemment dans les histogrammes (voir barChart). On ne projette que ce qui est
// réellement écrit dans le plan (km, sortie longue) ; le reste (FC, efficience, charge...)
// dépend de l'exécution réelle et reste vide tant que la semaine n'a pas eu lieu.
function planWeeks(){
  return SEMAINES.map(w=>{
    const real=HEBDO.find(h=>h.lundi===w.du);
    if(real) return {...real, proj:false};
    const ws=weekStats(w);
    return {lundi:w.du, km:ws.km, longest:ws.longest, dplus:null, allure_min:null, fc:null,
            eff:null, charge:null, ctl:null, atl:null, tsb:null, aero_min:null, anaero_min:null,
            sl_allure_min:null, fc_footing:null, incline_min:null, proj:true};
  });
}
// Phrase de progression sous un histogramme : toujours essayer de dire ce que la tendance signifie
// concrètement pour l'objectif, plutôt qu'une description neutre — c'est ce qui donne envie de
// revenir voir. `t` = résultat de trend(), `good` = phrase si la tendance va dans le bon sens,
// `flat` = phrase par défaut/pas encore de tendance exploitable.
function progressCaption(t, good, flat){
  if(!t) return flat;
  return t.good ? good(t) : flat;
}
// Définitions partagées des 9 indicateurs de la grille Progression — une seule source de
// vérité utilisée à la fois par les petites cartes (renderKpis) et par la page de détail
// plein écran (renderDetail), pour ne jamais risquer une divergence entre les deux vues.
// Chaque point de `b` embarque `lundi` : c'est ce qui permet le clic sur une barre pour
// afficher le détail de cette semaine précise sur la page dédiée.
function kpiDefs(){
  const H=HEBDO, last=H[H.length-1];
  // Base de calcul des tendances (%) : uniquement des semaines réelles et complètes. Si la
  // dernière semaine de HEBDO est encore en cours, on la retire du calcul et on compare sur
  // la précédente semaine complète — sinon une semaine à moitié faite fausse systématiquement
  // le pourcentage affiché (elle paraît toujours "en baisse").
  const TB=isWeekComplete(last.lundi)?H:H.slice(0,-1);
  const PW=planWeeks();
  // `withHi` : marqueur "semaine à côtes" (surbrillance rouge, hauteur mini visible même à 0) —
  // uniquement pertinent pour l'indicateur "Temps en côte", jamais sur les autres graphiques.
  const bars=(field,withHi)=>PW.map(x=>({label:wkLabel(x.lundi),value:x[field],hi:withHi&&weekHasCotes(x.lundi),proj:x.proj,lundi:x.lundi}));

  const tVol=trend(TB.map(x=>x.km));
  const slFirst=TB.find(w=>w.longest)?.longest, slNow=Math.max(...H.map(x=>x.longest));
  const slGain=(slFirst!=null)?slNow-slFirst:null;
  const tEff=trend(TB.map(x=>x.eff));
  const tSlAllure=trend(TB.map(x=>x.sl_allure_min),true);
  const tFcFooting=trend(TB.map(x=>x.fc_footing),true);
  const tCharge=trend(TB.map(x=>x.charge));
  // Sommeil : câblé dès maintenant (champ HEBDO[].sommeil_min, minutes/nuit en moyenne hebdo)
  // pour qu'il n'y ait aucun effet de bord à intégrer une fois la montre portée en continu
  // (fin septembre / courant octobre) — ni sur la refonte graphique, ni sur d'éventuels futurs
  // indicateurs qui croiseront ces données (ex. correction du verdict de forme/TSB). Aucune
  // valeur réelle tant que GARMIN.sommeil est à null : c'est volontaire, jamais deviné.
  const tSommeil=trend(TB.map(x=>x.sommeil_min));
  const lastSommeil=H.filter(x=>x.sommeil_min!=null).slice(-1)[0]?.sommeil_min;

  return [
    {key:"km",l:"Volume hebdo",v:H[H.length-1].km,u:"km cette semaine",b:bars("km"),c:"#22c3e6",
     t:tVol,n:progressCaption(tVol,
       t=>`En hausse de ${t.pct.toFixed(0)} % sur 3 semaines — tu montes bien vers le pic de ~65 km en semaine 10.`,
       "Le plan te fait monter jusqu'à ~65 km en semaine 10. En clair pointillé : semaines à venir, valeur prévue par le plan.")},
    {key:"longest",l:"Sortie longue max",v:Math.max(...H.map(x=>x.longest)),u:"km (record du bloc)",b:bars("longest"),c:"#ffb703",
     t:trend(TB.map(x=>x.longest)),
     n: slGain>0.5
       ? `+${slGain.toFixed(1)} km depuis le début du suivi — encore ${Math.max(0,30-slNow).toFixed(0)} km avant le pic de la semaine 10.`
       : "Objectif : 30 km en semaine 10. C'est ton principal levier. En clair pointillé : semaines à venir, valeur prévue par le plan."},
    {key:"eff",l:"Efficience",v:H.filter(x=>x.eff).slice(-1)[0]?.eff,u:"m par battement",b:bars("eff"),c:"#2dd4bf",
     t:tEff,n:progressCaption(tEff,
       t=>`En hausse de ${t.pct.toFixed(0)} % sur 3 semaines — ton cœur travaille moins pour la même allure, exactement l'effet recherché.`,
       "Distance parcourue par battement de cœur. En hausse = tu progresses.")},
    {key:"sl_allure_min",l:"Allure sorties longues",v:H.filter(x=>x.sl_allure).slice(-1)[0]?.sl_allure,u:"min/km sur ta sortie longue (hors qualité)",b:bars("sl_allure_min"),c:"#8b5cf6",lowerBetter:true,
     t:tSlAllure,n:progressCaption(tSlAllure,
       t=>`Allure en progression de ${Math.abs(t.pct).toFixed(0)} % sur tes sorties longues — l'endurance spécifique avance, c'est exactement ce que le plan travaille.`,
       "Allure tenue sur ta sortie longue de la semaine (séances de qualité exclues) — le signal le plus direct sur ton endurance spécifique, plus utile que la moyenne toutes sorties.")},
    {key:"fc_footing",l:"FC à l'effort facile",v:H.filter(x=>x.fc_footing).slice(-1)[0]?.fc_footing,u:"bpm sur tes footings (hors qualité)",b:bars("fc_footing"),c:"#ef476f",lowerBetter:true,
     t:tFcFooting,n:progressCaption(tFcFooting,
       t=>`FC en baisse de ${Math.abs(t.pct).toFixed(0)} % à effort comparable — une vraie adaptation cardiaque, pas un effet mécanique de séances plus dures.`,
       "FC sur les footings uniquement (séances de qualité exclues) — isolée de l'effet mécanique des entraînements qui se durcissent, qui ferait mécaniquement monter une FC moyenne toutes sorties.")},
    {key:"incline_min",l:"Temps en côte",v:H.filter(x=>x.incline_min!=null).slice(-1)[0]?.incline_min,u:"min à ≥1 % (tapis inclus) cette semaine",b:bars("incline_min",true),c:"#fb8500",colorHi:"#ef476f",
     t:trend(TB.map(x=>x.incline_min)),n:"Cumule le vrai dénivelé GPS (dehors) et le temps passé en inclinaison sur tapis (dedans) — contrairement au dénivelé seul, qui reste à 0 sur tapis. En rouge : semaines avec séance de côtes au plan."},
    {key:"charge",l:"Charge d'entraînement",v:H[H.length-1].charge,u:"pts (effort relatif Strava, cumulé/semaine)",b:bars("charge"),c:"#22c3e6",
     t:tCharge,n:(tCharge&&tCharge.pct>0&&last.tsb!=null&&last.tsb>-10)
       ?`Charge en hausse de ${tCharge.pct.toFixed(0)} % et forme encore dans la zone normale — la montée en charge est bien tolérée.`
       :"Indice Strava qui combine durée et intensité (proche d'un TRIMP). Sert de repère de charge globale, pas de podomètre précis."},
    {key:"anaero_min",l:"Temps en zone haute",v:H[H.length-1].anaero_min,u:"min ≥163 bpm (seuil/VMA) cette semaine",b:bars("anaero_min"),c:"#7209b7",
     t:trend(TB.map(x=>x.anaero_min)),n:H[H.length-1].aero_min!=null?`Complément : ${H[H.length-1].aero_min} min en aérobie (<163 bpm) cette semaine. Calculé à partir des tours de chaque course — seulement disponible à partir du 7 sept, pas d'historique avant.`:"Calculé à partir des tours de chaque course — seulement disponible à partir du 7 sept, pas d'historique avant."},
    {key:"sommeil",l:"Sommeil",v:lastSommeil!=null?`${Math.round(lastSommeil/6)/10}h`:null,
     u:"heures de sommeil/nuit (moyenne hebdo)",b:bars("sommeil_min"),c:"#818cf8",
     t:tSommeil,n:"Semaines S1-S2 : quelques nuits captées mi/fin août, à titre de test (avant la pause du 9 sept), pas un suivi continu. L'indicateur reprendra automatiquement, sans rien à reconfigurer, dès le port continu de la montre (fin septembre / courant octobre).",
     emptyMsg:"En attente du port continu de la montre (fin septembre / courant octobre) — cet indicateur s'alimentera automatiquement dès que les données Garmin seront disponibles."}
  ];
}
function renderKpis(){
  const kpis=kpiDefs();
  g("kpis").innerHTML=kpis.map(k=>{
    const t=k.t;
    const badge=t?`<span class="trend ${t.good?'tr-up':(Math.abs(t.pct)<3?'tr-eq':'tr-dn')}">${t.pct>0?'▲':'▼'} ${Math.abs(t.pct).toFixed(0)} %</span>`:'';
    return `<div class="kpi kpi-click" data-detail="${k.key}"><div class="kl">${k.l}</div>
      <div class="kv" style="color:${k.c}">${k.v??'—'}</div>
      <div class="ku">${k.u}</div>${badge}
      ${barChart(k.b,{color:k.c,colorHi:k.colorHi,height:100,emptyMsg:k.emptyMsg})}<div class="kn">${k.n}</div></div>`}).join("");
  renderForme();
}
// Charge/Fatigue/Forme — modèle CTL/ATL/TSB (le même principe que TrainingPeaks), calculé
// nous-mêmes à partir de l'effort relatif Strava (moyenne mobile 42 j pour la charge chronique,
// 7 j pour la charge aiguë). Pas de chiffre "Condition physique" Strava/Garmin ici : ces
// formules-là sont propriétaires et non exposées par les connecteurs, celle-ci est transparente
// et cohérente avec le reste de l'app.
// Projette CTL/ATL/TSB sur les semaines à venir du plan, en estimant leur charge probable à
// partir du ratio charge/km observé sur la dernière semaine réelle, puis en simulant la moyenne
// mobile exponentielle jour par jour (charge hebdo répartie sur 7 jours égaux — approximation
// raisonnable, pas une prédiction précise : on ne connaît pas la vraie intensité future).
function projectCtlAtl(){
  const H=HEBDO, last=H[H.length-1];
  if(last.ctl==null||last.atl==null||!last.km) return [];
  const chargePerKm=last.charge/last.km;
  let ctl=last.ctl, atl=last.atl;
  const future=SEMAINES.filter(w=>w.n>=curWeek && !HEBDO.some(h=>h.lundi===w.du));
  return future.map(w=>{
    const ws=weekStats(w);
    const weekCharge=ws.km*chargePerKm;
    const daily=weekCharge/7;
    for(let i=0;i<7;i++){ ctl+=(daily-ctl)/42; atl+=(daily-atl)/7; }
    return {lundi:w.du, ctl:Math.round(ctl*10)/10, atl:Math.round(atl*10)/10, tsb:Math.round((ctl-atl)*10)/10, proj:true};
  });
}
// Définitions partagées des 3 cartes Fitness/Fatigue/Forme — même principe que kpiDefs() :
// une seule source de vérité pour les petites cartes et pour la page de détail.
function formeDefs(){
  const last=HEBDO[HEBDO.length-1];
  if(last.tsb==null) return null;
  const future=projectCtlAtl();
  // Le calcul de CTL/ATL garde tout l'historique HEBDO (depuis début juin) pour que la moyenne
  // mobile 42 j ait le temps de se stabiliser avant le début du plan — mais l'affichage doit se
  // limiter aux 12 semaines du bloc d'entraînement, comme tous les autres indicateurs de la page
  // (voir kpiDefs(), basé sur planWeeks()/SEMAINES). Sinon l'axe démarre début juin au lieu du
  // 17 août, ce qui n'apporte rien et mange de l'espace visuel pour rien.
  const planLundis=new Set(SEMAINES.map(w=>w.du));
  const allWeeks=HEBDO.filter(w=>planLundis.has(w.lundi))
    .map(w=>({lundi:w.lundi,ctl:w.ctl,atl:w.atl,tsb:w.tsb,proj:false})).concat(future);
  const bars=field=>allWeeks.map(x=>({label:wkLabel(x.lundi),value:x[field],proj:x.proj,lundi:x.lundi}));
  return [
    {key:"ctl",l:"Fitness (CTL)",v:last.ctl,u:"projection en clair pointillé",c:"#2dd4bf",b:bars("ctl"),autoZoom:false,n:"Charge chronique — ta capacité de fond, monte lentement (42 j)."},
    {key:"atl",l:"Fatigue (ATL)",v:last.atl,u:"projection en clair pointillé",c:"#ef476f",b:bars("atl"),autoZoom:false,n:"Charge aiguë — réagit vite (7 j) aux semaines dures ou légères."},
    {key:"tsb",l:"Forme (TSB)",v:last.tsb,u:"projection en clair pointillé",c:"#8b5cf6",b:bars("tsb"),autoZoom:false,n:"CTL − ATL. Négatif = en charge (normal en plein bloc), positif = frais (utile en approche de course)."}
  ];
}
function renderForme(){
  const el=g("forme"); if(!el) return;
  const last=HEBDO[HEBDO.length-1];
  if(last.tsb==null){ el.innerHTML=""; return; }
  const tCtl=trend(HEBDO.map(x=>x.ctl));
  let verdict,cls;
  if(last.tsb>5){ verdict="tu es frais — la charge actuelle est bien digérée, il y a de la marge pour absorber plus."; cls="co-v"; }
  else if(last.tsb>-10){ verdict="zone d'entraînement normale pour un bloc de préparation — ni trop frais, ni cramé."; cls="co-i"; }
  else { verdict="fatigue accumulée significative — surveille le sommeil et les sensations, c'est le moment où les blessures de surcharge arrivent."; cls="co-w"; }
  const textCard=`
  <div class="co ${cls}"><b class="t">Forme actuelle (charge/fatigue)</b>
    Fitness (CTL) <b>${last.ctl}</b>${tCtl?`, ${tCtl.pct>0?"en hausse":"en baisse"} de ${Math.abs(tCtl.pct).toFixed(0)} % sur 3 semaines`:""} ·
    Fatigue (ATL) <b>${last.atl}</b> · Forme (TSB = CTL − ATL) <b>${last.tsb>0?"+":""}${last.tsb}</b>.
    <br><br>${verdict}
    <br><br><span style="color:var(--tx3);font-size:.8rem">Modèle qu'on maîtrise nous-mêmes (moyennes mobiles 42 j / 7 j sur l'effort relatif Strava), plutôt que
    la "Condition physique" Strava/Garmin — formule propriétaire non exposée par les connecteurs et pas forcément cohérente avec le reste de l'app.</span>
  </div>`;

  const cards=formeDefs();
  const chartsGrid=`<div class="g g3" style="margin-top:15px">${cards.map(k=>`
    <div class="kpi kpi-click" data-detail="${k.key}"><div class="kl">${k.l}</div>
      <div class="kv" style="color:${k.c}">${k.v>0&&k.key==="tsb"?"+":""}${k.v}</div>
      <div class="ku">${k.u}</div>
      ${barChart(k.b,{color:k.c,height:100,autoZoom:k.autoZoom})}<div class="kn">${k.n}</div></div>`).join("")}</div>`;
  el.innerHTML=textCard+chartsGrid;
}

/* ============================================================
   RENDU — PAGE DE DÉTAIL PAR INDICATEUR (drill-down semaine par semaine)
   Atteinte en cliquant sur n'importe quelle carte KPI de la page Progression. Un seul
   graphique plein écran (kpiDefs()/formeDefs(), même source que les petites cartes — jamais
   de calcul dupliqué) + un panneau qui affiche le détail chiffré de la semaine cliquée.
   ============================================================ */
let detailKey=null;
function findIndicator(key){
  const k1=kpiDefs().find(x=>x.key===key);
  if(k1) return k1;
  const fd=formeDefs();
  return (fd&&fd.find(x=>x.key===key))||null;
}
function openDetail(key){
  if(!findIndicator(key)) return;
  detailKey=key;
  showPage("detail");
  renderDetail(key);
  try{history.replaceState(null,"","#detail/"+key)}catch(e){}
}
// Détail chiffré d'une semaine précise : les valeurs réelles si la semaine a eu lieu (HEBDO),
// sinon un aperçu de ce que le plan prévoit pour cette semaine à venir (weekStats) — cliquer
// sur une barre pointillée du futur reste donc utile, pas juste sur les barres pleines.
function weekDetailPanel(lundi){
  const w=HEBDO.find(h=>h.lundi===lundi);
  const semaine=SEMAINES.find(x=>x.du===lundi);
  const titre=`Semaine du ${jourLong(lundi)}${semaine?` — S${semaine.n} ${semaine.titre}`:""}`;
  if(!w){
    if(!semaine) return `<div class="dw-title">${titre}</div><div class="kn">Pas de données pour cette semaine.</div>`;
    const ws=weekStats(semaine);
    return `<div class="dw-title">${titre}</div>
      <div class="kn" style="margin-bottom:8px">Semaine à venir — pas encore de données réelles, voici ce que prévoit le plan :</div>
      <div class="dw-chips">
        <div class="dw-chip"><span>Volume prévu</span><b>${ws.km} km</b></div>
        <div class="dw-chip"><span>Sortie longue prévue</span><b>${ws.longest} km</b></div>
        <div class="dw-chip"><span>Séances qualité</span><b>${ws.q}</b></div>
        <div class="dw-chip"><span>Renfo</span><b>${ws.renfo}</b></div>
      </div>`;
  }
  const rows=[
    ["Volume","km","km"],["Sortie longue","longest","km"],["Dénivelé GPS","dplus","m"],
    ["Temps en côte","incline_min","min"],["Efficience","eff","m/batt"],
    ["Allure sortie longue","sl_allure","/km"],["FC effort facile","fc_footing","bpm"],
    ["Charge","charge","pts"],["Fitness (CTL)","ctl",""],["Fatigue (ATL)","atl",""],["Forme (TSB)","tsb",""],
    ["Temps en zone haute","anaero_min","min"],["Temps aérobie","aero_min","min"],
    ["Sommeil","sommeil_min","min/nuit"],["Score de sommeil","sommeil_score","/100"],
    ["Sommeil profond","sommeil_profond_min","min/nuit"],["Sommeil paradoxal","sommeil_paradoxal_min","min/nuit"],
    ["VFC nocturne","sommeil_hrv","ms"]
  ];
  const chips=rows.filter(([,f])=>w[f]!=null).map(([l,f,u])=>
    `<div class="dw-chip"><span>${l}</span><b>${w[f]}${u?` ${u}`:""}</b></div>`).join("");
  const acts=semaine?weekActivities(semaine):[];
  const actsTxt=acts.length?`<div class="dw-acts">${acts.map(a=>
    `<div>${ICO[a.type]||"•"} ${esc(a.nom)}${a.km?` — ${a.km} km`:""}${a.allure?` à ${a.allure}/km`:""}${a.fc?` (${a.fc} bpm)`:""}</div>`).join("")}</div>`:"";
  return `<div class="dw-title">${titre}</div><div class="dw-chips">${chips}</div>${actsTxt}`;
}
function selectDetailWeek(lundi){
  document.querySelectorAll(`#detailChart .bar-hit`).forEach(r=>r.classList.toggle("sel",r.dataset.lundi===lundi));
  const panel=g("detailWeekPanel"); if(panel) panel.innerHTML=weekDetailPanel(lundi);
}
// Stats génériques (record/moyenne/nombre de semaines mesurées) — valables pour n'importe quel
// indicateur, calculées uniquement sur les semaines réelles (jamais les projections du plan).
function indicatorGenericStats(ind){
  const nums=ind.b.filter(d=>!d.proj&&d.value!=null).map(d=>d.value);
  if(nums.length<2) return null;
  const round=v=>Math.round(v*100)/100;
  return {
    best: round(ind.lowerBetter?Math.min(...nums):Math.max(...nums)),
    avg: round(nums.reduce((a,b)=>a+b,0)/nums.length),
    n: nums.length
  };
}
// Analyse détaillée par indicateur : réutilise les signaux corrélés déjà construits pour
// "Points d'amélioration" (jamais un second calcul divergent) — chaque indicateur pointe vers
// l'analyse qui le concerne le plus directement, avec les 2-3 autres indicateurs croisés dedans.
function indicatorAnalysis(key){
  if(["eff","sl_allure_min","fc_footing"].includes(key)){
    const cs=cardioSignals();
    return {cls:"co-i",title:"Ton cœur s'adapte-t-il vraiment ?",txt:cs.html};
  }
  if(key==="longest"){ const a=sortieLongueAnalysis(); return {cls:a.cls,title:a.title,txt:a.txt}; }
  if(key==="incline_min"){ const a=qualiteAnalysis(); return {cls:a.cls,title:a.title,txt:a.txt}; }
  if(["charge","ctl","atl","tsb"].includes(key)){
    const a=chargeSignals(); return {cls:a.cls,title:a.title,txt:a.txt};
  }
  if(key==="km"){
    const volPrevu=Math.round(S.km_prevu);
    return {cls:"co-i",title:"Vers le pic de la semaine 10",
      txt:`Le plan monte le volume jusqu'à un pic d'environ 65 km en semaine 10, pour un total de <b>${volPrevu} km</b> sur les 12 semaines. Ce n'est pas un indicateur à faire progresser semaine après semaine comme l'efficience — il suit simplement la charge planifiée, la vraie question est de le réaliser tel quel, pas de le pousser plus haut.`};
  }
  if(key==="anaero_min"){
    const H=HEBDO, last=H[H.length-1];
    return {cls:"co-p",title:"Complément du temps aérobie",
      txt:`${last.aero_min!=null?`Cette semaine : <b>${last.aero_min} min</b> en aérobie (&lt;163 bpm) pour <b>${last.anaero_min ?? 0} min</b> en zone haute (seuil/VMA).`:"Calculé à partir des tours de chaque course, disponible seulement depuis le 7 septembre — pas d'historique avant."} Un ratio qui penche de plus en plus vers la zone haute au fil du bloc est cohérent avec la montée en intensité prévue par le plan.`};
  }
  if(key==="sommeil"){
    const rows=sommeilSignals();
    if(!rows) return {cls:"co-p",title:"En attente de données",
      txt:"Cet indicateur est prêt à s'alimenter dès que tu porteras la montre en continu (attendu fin septembre / courant octobre) — durée de sommeil moyenne par nuit, semaine par semaine, avec exactement le même modèle que les autres indicateurs (histogramme, tendance, projection). Une fois calibré sur de vraies données, il pourra aussi devenir un facteur correctif du verdict de forme (TSB) affiché sur les indicateurs Charge/CTL/ATL/TSB — mais pas avant d'avoir de quoi calibrer ce lien plutôt que de deviner une formule."};
    const lines=rows.map(r=>`Semaine du ${jourLong(r.lundi)} : score <b>${r.score}/100</b>, sommeil profond <b>${Math.round(r.profond)} min/nuit</b> — forme (TSB) <b>${r.tsb>0?"+":""}${r.tsb}</b>${r.fc_footing?`, FC effort facile <b>${r.fc_footing} bpm</b>`:""}.`).join("<br>");
    return {cls:"co-p",title:"Exploration — sommeil croisé avec forme et FC (test, pas un modèle validé)",
      txt:`Sur les seules semaines où on a des nuits captées (quelques jours mi/fin août, avant la pause du 9 sept), voici ce que ça donne à titre d'exemple :<br><br>${lines}
      <br><br>Beaucoup trop peu de semaines pour en tirer une vraie conclusion (3 points, et le sommeil n'est qu'une poignée de nuits par semaine, pas une couverture complète) — mais le mécanisme est prêt : dès que le port continu reprendra, ce croisement s'enrichira automatiquement et pourra nourrir le verdict de forme sur les indicateurs Charge/CTL/ATL/TSB.`};
  }
  return null;
}
// Sommeil (exploration, pas un modèle validé) : croise les quelques nuits réelles captées
// mi/fin août avec la forme (TSB) et la FC à l'effort facile de la même semaine — sert à tester
// le mécanisme de corrélation avant que le vrai suivi continu ne démarre.
function sommeilSignals(){
  const weeks=HEBDO.filter(w=>w.sommeil_score!=null);
  if(!weeks.length) return null;
  return weeks.map(w=>({lundi:w.lundi, score:w.sommeil_score, profond:w.sommeil_profond_min, tsb:w.tsb, fc_footing:w.fc_footing}));
}
function renderDetail(key){
  const ind=findIndicator(key);
  const el=g("detailBody"); if(!el||!ind) return;
  g("pageTitle").textContent=ind.l;
  const t=ind.t;
  const badge=t?`<span class="trend ${t.good?'tr-up':(Math.abs(t.pct)<3?'tr-eq':'tr-dn')}">${t.pct>0?'▲':'▼'} ${Math.abs(t.pct).toFixed(0)} %</span>`:'';
  const realWeeks=ind.b.filter(d=>!d.proj&&d.value!=null&&d.lundi);
  const defaultLundi=realWeeks.length?realWeeks[realWeeks.length-1].lundi:(ind.b.find(d=>d.lundi)?.lundi);
  const hasChart=ind.b.filter(d=>d.value!=null).length>=2;
  const stats=indicatorGenericStats(ind);
  const analyse=indicatorAnalysis(key);
  el.innerHTML=`
    <button class="cross-link nav-link" data-p="progression" style="margin-bottom:16px">${ICONS.arrowleft}
      <div><b>Retour à Progression</b><span>Tous les indicateurs</span></div></button>
    <div class="co co-g">
      <div class="kl">${ind.l}</div>
      <div class="kv" style="color:${ind.c};font-size:2rem">${ind.v??'—'}</div>
      <div class="ku">${ind.u||""}</div>${badge}
    </div>
    <div class="card" style="margin-top:14px" id="detailChart">
      ${barChart(ind.b,{color:ind.c,colorHi:ind.colorHi,height:180,autoZoom:ind.autoZoom,emptyMsg:ind.emptyMsg})}
    </div>
    <p class="lead" style="margin-top:10px">${ind.n}</p>
    ${hasChart?`<p class="scrollhint">👉 Touche une barre pour voir le détail de cette semaine</p>`:""}
    <div class="card dw-panel" id="detailWeekPanel" style="margin-top:10px">${defaultLundi?weekDetailPanel(defaultLundi):"<div class=\"kn\">Pas encore de semaine à détailler.</div>"}</div>
    <h3 class="focus-h3" style="margin-top:22px">🔎 Analyse détaillée</h3>
    ${stats?`<div class="dw-chips" style="margin-bottom:12px">
      ${key!=="tsb"?`<div class="dw-chip"><span>${ind.lowerBetter?"Meilleure valeur":"Record du bloc"}</span><b>${stats.best}</b></div>`:""}
      <div class="dw-chip"><span>Moyenne du bloc</span><b>${stats.avg}</b></div>
      <div class="dw-chip"><span>Semaines mesurées</span><b>${stats.n}</b></div>
    </div>`:""}
    ${analyse?`<div class="co ${analyse.cls}"><b class="t">${analyse.title}</b>${analyse.txt}</div>`
      :`<div class="co co-p">Pas encore assez de recul sur cet indicateur pour une analyse croisée.</div>`}
  `;
  if(defaultLundi) selectDetailWeek(defaultLundi);
}
function renderProjection(){
  const objSec=hToSec(META.objectif.plan), raceSec=hToSec(META.objectif.course);
  const predSec=timeToSec(GARMIN.predictions.marathon);
  const gapMin=Math.round((predSec-objSec)/60);
  const eng=enginePotentiel();
  const volPrevu=Math.round(S.km_prevu);
  const longestRecord=Math.max(...HEBDO.map(w=>w.longest));

  const seuilAll=[]; SEMAINES.forEach(w=>w.s.forEach((s,i)=>{ if(s.a==="seuil"||s.a==="seuil_2000") seuilAll.push({w,i}); }));
  const seuilDone=seuilAll.filter(({w,i})=>isDone(w,w.s[i],i)).length;
  const amAll=[]; SEMAINES.forEach(w=>w.s.forEach((s,i)=>{ if(s.a==="sl_am") amAll.push({w,i}); }));
  const amDone=amAll.filter(({w,i})=>isDone(w,w.s[i],i)).length;

  g("projection").innerHTML=`
  <div class="g g3" style="margin-bottom:15px">
    <div class="kpi"><div class="kl">🎯 Objectif du bloc</div>
      <div class="kv" style="color:var(--soleil)">${META.objectif.plan}</div>
      <div class="ku">objectif d'entraînement</div>
      <div class="kn">Objectif course (marge de sécurité) : ${META.objectif.course}.</div></div>
    <div class="kpi"><div class="kl">Prédiction Garmin actuelle</div>
      <div class="kv" style="color:var(--tx2)">${secToHM(predSec)}</div>
      <div class="ku">calculée sur tes perfs récentes</div>
      <div class="kn">${gapMin>0?`Écart de <b>${gapMin} min</b> avec l'objectif — c'est précisément ce que le plan cible.`:`Déjà sous l'objectif — le plan sert maintenant à consolider cette marge.`}</div></div>
    <div class="kpi"><div class="kl">Potentiel physiologique</div>
      <div class="kv" style="color:var(--vert)">${secToHM(eng.primary.sec)}</div>
      <div class="ku">extrapolé depuis ton semi</div>
      <div class="kn">5 km → ${secToHM(eng.estimates[0].sec)} · 10 km → ${secToHM(eng.estimates[1].sec)}. Écart entre les 3 méthodes : ${eng.spreadMin} min — le semi est retenu car c'est la distance la plus proche du marathon, donc l'extrapolation la plus fiable.</div></div>
  </div>
  <div class="g g2">
    ${[
      ["Sortie longue max",`${longestRecord} km`,"30 km","Le facteur n°1. Passer à 30 km transforme ta capacité à tenir le km 35."],
      ["Volume total du bloc",`${Math.round(S.km_fait)} km`,`${volPrevu} km`,"Densification capillaire et mitochondriale, meilleure utilisation des graisses."],
      ["Sorties à allure marathon",`${amDone}/${amAll.length}`,`${amAll.length} au total`,"L'allure cible devient un automatisme au lieu d'un effort."],
      ["Séances au seuil",`${seuilDone}/${seuilAll.length}`,`${seuilAll.length} au total`,"Relève le plafond aérobie sous lequel se situe ton allure de course."]
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
  leadEl.innerHTML=`Dernier point : <b style="color:var(--vert)">${d.toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</b>.`;
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
function renderMateriel(){
  const el=g("materiel"); if(!el) return;
  const m=window.MATERIEL?.chaussure;
  if(!m){ el.innerHTML=`<div class="co co-i">Pas de chaussure suivie pour l'instant.</div>`; return; }
  const REF=600; // durée de vie typique d'une chaussure de route, en km
  const pc=Math.min(100,Math.round(m.km/REF*100));
  let verdict,cls;
  if(m.km<300){ verdict="Toute fraîche, aucune inquiétude à ce stade."; cls="co-v"; }
  else if(m.km<500){ verdict="Bon état. À surveiller à l'approche du marathon."; cls="co-v"; }
  else if(m.km<700){ verdict="S'approche de la limite d'usure typique (500-700 km) — garde un œil sur l'amorti."; cls="co-i"; }
  else { verdict="Au-delà de la durée de vie habituelle d'une chaussure de route — risque de blessure accru, ne pas utiliser pour le marathon sans vérification."; cls="co-w"; }
  el.innerHTML=`
  <div class="kpi" style="max-width:360px">
    <div class="kl">${esc(m.marque)} ${esc(m.modele)} — « ${esc(m.nom)} »</div>
    <div class="kv" style="color:var(--tx)">${m.km} <span style="font-size:.9rem;color:var(--tx3)">km</span></div>
    <div class="bar" style="margin-top:6px"><i style="width:${pc}%"></i></div>
    <div class="kn">${pc}% d'une durée de vie type (${REF} km)</div>
  </div>
  <div class="co ${cls}" style="margin-top:12px">${verdict}</div>`;
}

/* ============================================================
   RENDU — ANALYSE
   ============================================================ */
function lastAct(type){
  const acts=(window.ACTIVITES||[]).filter(a=>!type||a.type===type).sort((a,b)=>a.date<b.date?1:-1);
  return acts[0]||null;
}
// Allure moyenne des VRAIS footings d'une semaine (hors séances de qualité marquées `qual:true`
// dans ACTIVITES) — jamais la moyenne "toutes sorties confondues" de HEBDO, qui mélange les
// intervalles/côtes/seuil avec les sorties faciles et fausse complètement le diagnostic
// "footings trop rapides" (une séance de VMA à 5:17/km de moyenne globale n'a rien à voir avec
// un vrai footing à cette allure). Ne couvre que la fenêtre glissante de 21 j d'ACTIVITES.
function footingStats(lundi){
  const start=new Date(lundi+"T00:00:00"), end=new Date(start); end.setDate(end.getDate()+7);
  const runs=(window.ACTIVITES||[]).filter(a=>{
    if(a.type!=="run"||a.qual||!a.km||!a.duree_min) return false;
    const d=new Date(a.date+"T00:00:00");
    return d>=start&&d<end;
  });
  if(!runs.length) return null;
  const totalMin=runs.reduce((s,r)=>s+r.duree_min,0), totalKm=runs.reduce((s,r)=>s+r.km,0);
  if(!totalKm) return null;
  const am=totalMin/totalKm, mm=Math.floor(am), ss=Math.round((am-mm)*60);
  return {allure_min:am, allure:`${mm}:${String(ss).padStart(2,"0")}`, n:runs.length};
}
function jourLong(d){
  const dt=new Date(d+"T00:00:00");
  const s=dt.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
  return s.charAt(0).toUpperCase()+s.slice(1);
}
function renderAnalyse(){
  const H=HEBDO, last=H[H.length-1];
  const effArr=H.filter(w=>w.eff!=null);
  const effFirst=effArr[0]?.eff, effLast=effArr[effArr.length-1]?.eff;
  const effPct=(effFirst!=null&&effLast!=null&&effArr.length>1)?Math.round((effLast-effFirst)/effFirst*100):null;
  const lastRun=lastAct("run");

  const longestRecord=Math.max(...H.map(w=>w.longest));
  const pctMarathon=Math.round(longestRecord/42.195*100);

  const eng=enginePotentiel();
  const potentielSec=eng.primary.sec;
  const predSec=timeToSec(GARMIN.predictions.marathon);
  const gapMin=Math.round((predSec-potentielSec)/60);

  const fcSerie=GARMIN.fc_repos_serie||[];
  const fcVals=fcSerie.map(x=>x.v);
  const fcLatest=fcVals.length?fcVals[fcVals.length-1]:null;
  const fcMin=fcVals.length?Math.min(...fcVals):null, fcMax=fcVals.length?Math.max(...fcVals):null;

  // renforcement
  let renfoTot=0,renfoDone=0;
  SEMAINES.forEach(w=>w.s.forEach((s,i)=>{ if(s.k==="strength"){ renfoTot++; if(isDone(w,s,i)) renfoDone++; } }));

  // séances de qualité (VMA/seuil/côtes/course) tous types confondus
  let qualTot=0,qualDone=0;
  SEMAINES.forEach(w=>w.s.forEach((s,i)=>{
    const A=s.a?ARCHETYPES[s.a]:null;
    if(A&&QUAL_FAM.includes(A.fam)){ qualTot++; if(isDone(w,s,i)) qualDone++; }
  }));

  const lastRunTxt=lastRun
    ? `Ta dernière sortie (${jourLong(lastRun.date)}${lastRun.nom.match(/\(([^)]+)\)/)?", "+lastRun.nom.match(/\(([^)]+)\)/)[1]:""}) : <b>${lastRun.allure}/km</b>${lastRun.fc?` à <b>${lastRun.fc} bpm</b>`:""} sur ${lastRun.km} km.`
    : "";

  g("analyse").innerHTML=`
<div class="co co-g"><b class="t">Ton profil</b>
  VO2max <b>${GARMIN.vo2max} ml/kg/min</b> — FC de repos la plus récente : <b>${fcLatest??"—"} bpm</b>
  ${fcMin!=null?`<span style="color:var(--tx3)">(entre ${fcMin} et ${fcMax} bpm ces dernières semaines — la vraie référence arrive avec le port continu de la montre)</span>`:""}.
  <br><br>${lastRunTxt} Ta plus longue sortie à ce jour fait <b>${longestRecord} km</b>, soit <b>${pctMarathon} %</b> de la distance du marathon.
  <br><br>Ton semi prédit (${GARMIN.predictions.semi}) vaudrait un marathon en <b>${secToHM(potentielSec)}</b> par pur calcul physiologique
  (formule de Riegel, extrapolée depuis le semi — la distance la plus proche du marathon, donc la plus fiable) — Garmin prédit
  en réalité <b>${secToHM(predSec)}</b>. L'écart, <b>${gapMin} minutes</b>, chiffre ton déficit d'endurance spécifique : c'est
  exactement ce que le plan comble, semaine après semaine.</div>
<div class="g g2">
  <div class="card"><h3>🔋 Le carburant</h3>
    <p class="lead" style="margin:8px 0 0">Tu stockes environ <b>2 000 kcal</b> de glycogène, un marathon en coûte ~2 800.
    Avec ${longestRecord} km au compteur, tu as déjà testé ce mécanisme sur <b>${pctMarathon} %</b> de la distance de course.
    <br><br><b>Ce que le plan y fait :</b> ${longestRecord<20?"les prochaines sorties longues vont commencer à pousser cette limite plus loin.":longestRecord<28?"chaque sortie longue au-delà de 1h45 entraîne précisément cette bascule vers les graisses — tu es en plein dedans.":"le pic de volume long a fait le plus gros du travail ; l'affûtage préserve cet acquis sans le remettre en jeu."}</p></div>
  <div class="card"><h3>🦵 Les fibres</h3>
    <p class="lead" style="margin:8px 0 0">À chaque foulée, tes quadriceps freinent la descente en contraction
    <b>excentrique</b> — le mode qui crée le plus de micro-lésions.
    <br><br><b>Ce que le plan y fait :</b> <b>${renfoDone}/${renfoTot}</b> séances de renfo déjà réalisées, dont le travail
    unilatéral (leg press une jambe, fentes bulgares) qui manquait avant le bloc.</p></div>
  <div class="card"><h3>❤️ Le cardio</h3>
    <p class="lead" style="margin:8px 0 0">${lastRunTxt||`Dernière semaine complète : <b>${last.allure}/km</b>${last.fc?` à ${last.fc} bpm`:""}.`}
    ${effPct!=null?`Ton efficience a évolué de <b>${effFirst} à ${effLast} m/battement</b> (${effPct>0?"+":""}${effPct} %)
    depuis que la donnée FC existe.`:"Pas encore assez de semaines avec FC pour une tendance fiable."}
    <br><br><b>Conséquence :</b> le plan sert surtout à faire remonter tes jambes au niveau de ton cœur.</p></div>
  <div class="card"><h3>🧠 L'allure</h3>
    <p class="lead" style="margin:8px 0 0"><b>${qualDone}/${qualTot}</b> séances de qualité (VMA, seuil, côtes, allure
    marathon...) déjà réalisées sur l'ensemble du bloc.
    <br><br><b>Logique :</b> chaque répétition à 5:20/km ancre un peu plus l'automatisme, jusqu'à ce que ça ne demande
    plus de concentration le jour J.</p></div>
</div>`;

  renderCrossLinks();
}
// Deux pages se lient l'une à l'autre (Analyse ⇄ Points d'amélioration) : liens statiques,
// rendus une fois au boot, indépendants des données.
function renderCrossLinks(){
  if(g("crossToAmelioration")) g("crossToAmelioration").innerHTML=`
    <button class="cross-link nav-link" data-p="ameliorations">${ICONS.trendup}
      <div><b>Voir les points d'amélioration</b><span>Ce qui mérite ton attention cette semaine, et pourquoi</span></div>
      <span class="chev">${ICONS.chev}</span></button>`;
  if(g("crossToAnalyse")) g("crossToAnalyse").innerHTML=`
    <button class="cross-link nav-link" data-p="analyse">${ICONS.flask}
      <div><b>Voir pourquoi ce plan</b><span>Ce que chaque type de séance fait concrètement dans ton corps</span></div>
      <span class="chev">${ICONS.chev}</span></button>`;
}
/* ============================================================
   RENDU — POINTS D'AMÉLIORATION
   Pas une checklist d'indicateurs isolés : chaque carte croise plusieurs signaux entre eux
   (activités réelles + indicateurs de Progression) et se termine par un rendez-vous concret
   (date + cible réelle tirée du plan), pas un conseil générique.
   ============================================================ */
/* ============================================================
   SIGNAUX CORRÉLÉS — extraits en fonctions autonomes pour être appelés à la fois par
   "Points d'amélioration" (vue d'ensemble) et par l'analyse détaillée de chaque page de
   détail d'indicateur (renderDetail) : jamais deux calculs qui pourraient diverger.
   ============================================================ */
// Efficience / allure sortie longue / FC effort facile : trois angles de la même adaptation
// cardio, plus le contrôle de fiabilité (allure de footing) qui explique un signal bruité.
function cardioSignals(){
  const H=HEBDO, last=H[H.length-1];
  const TB=isWeekComplete(last.lundi)?H:H.slice(0,-1);
  const tEff=trend(TB.map(x=>x.eff));
  const tSlAllure=trend(TB.map(x=>x.sl_allure_min),true);
  const tFcFooting=trend(TB.map(x=>x.fc_footing),true);
  const footing=footingStats(last.lundi);
  const allureBad=footing&&footing.allure_min<5.9, allureOk=footing&&footing.allure_min>=6.4;
  const sigTxt=(t,nom)=>t?`${nom} : <b>${t.pct>0?"+":""}${t.pct.toFixed(0)} %</b> ${t.good?"✅":"⚠️"}`:`${nom} : pas encore assez de données`;
  let fiabTxt;
  if(!footing) fiabTxt="Pas de footing pur cette semaine (que des séances de qualité) — impossible de vérifier la fiabilité de la mesure pour l'instant.";
  else if(allureBad) fiabTxt=`⚠️ <b>Le vrai point à corriger :</b> ton footing tourne encore à <b>${footing.allure}/km</b>, sous la zone Z1 (6:00-6:30). Tant que ça dure, la FC à l'effort facile reste bruitée — tu ne compares pas un effort vraiment facile d'une semaine à l'autre. Ralentis d'abord, juge ensuite.`;
  else if(allureOk) fiabTxt=`Footing déjà dans la bonne zone (<b>${footing.allure}/km</b>) — la mesure est fiable. Si les indicateurs ci-dessus progressent, c'est une vraie adaptation, pas un footing trop rapide qui gonfle artificiellement l'efficience.`;
  else fiabTxt=`Footing à <b>${footing.allure}/km</b> — encore un peu vite pour la zone Z1 (6:00-6:30), mais tu ralentis dans le bon sens.`;
  const html=`Trois indicateurs mesurent la même adaptation sous des angles différents, sur les 3 dernières semaines :
    <br>${sigTxt(tEff,"Efficience")} · ${sigTxt(tSlAllure,"Allure sortie longue")} · ${sigTxt(tFcFooting,"FC effort facile")}
    <br><br>${fiabTxt}`;
  return {tEff,tSlAllure,tFcFooting,footing,allureBad,allureOk,sigTxt,fiabTxt,html};
}
// Charge/CTL/ATL/TSB : croise la tendance de charge avec le TSB et avec le fait que les
// indicateurs cardio tiennent ou pas — un même TSB négatif n'a pas le même sens selon ça.
function chargeSignals(){
  const H=HEBDO, last=H[H.length-1];
  const TB=isWeekComplete(last.lundi)?H:H.slice(0,-1);
  const tCharge=trend(TB.map(x=>x.charge));
  const cs=cardioSignals();
  const tsbState=last.tsb==null?null:last.tsb>5?"frais":last.tsb>-10?"normale":"fatigue";
  const chargeRising=tCharge&&tCharge.pct>0;
  const cardioHolding=(cs.tEff&&cs.tEff.good)||(cs.tFcFooting&&cs.tFcFooting.good);
  const nextTaper=SEMAINES.find(w=>w.n>curWeek&&w.type==="taper");
  let cls,title,txt;
  if(tsbState==null){ cls="co-p"; title="Pas encore assez de données"; txt="Le modèle CTL/ATL/TSB a besoin de quelques semaines de charge pour se stabiliser."; }
  else if(tsbState==="fatigue"&&!cardioHolding){
    cls="co-w"; title=`Forme (TSB) ${last.tsb} — la fatigue s'accumule pour de vrai`;
    txt=`La charge monte${chargeRising?` (+${tCharge.pct.toFixed(0)} % sur 3 semaines)`:""} et ni l'efficience ni la FC à l'effort facile ne progressent en ce moment — deux signaux qui convergent, pas un simple chiffre de modèle qui déraille.
    <br><b>Action :</b> le sommeil devient la priorité n°1 cette semaine.${nextTaper?` La prochaine décharge est la <b>S${nextTaper.n}</b> (${nextTaper.dates}) — tiens jusque-là plutôt que de couper maintenant, sauf si les sensations tournent vraiment mal.`:""}`;
  } else if(tsbState==="fatigue"&&cardioHolding){
    cls="co-i"; title=`Forme (TSB) ${last.tsb} — le modèle dit fatigue, le corps dit pas encore`;
    txt=`Le TSB est dans le rouge, mais l'efficience ou la FC à l'effort facile continuent de progresser — le corps encaisse, pour l'instant. Ça peut basculer vite : cette semaine, fie-toi aux sensations plus qu'au chiffre.`;
  } else if(chargeRising&&(tsbState==="normale"||tsbState==="frais")){
    cls="co-v"; title=`Forme (TSB) ${last.tsb>0?"+":""}${last.tsb} — la charge passe, tout roule`;
    txt=`Charge en hausse de <b>${tCharge.pct.toFixed(0)} %</b> sur 3 semaines et forme dans la zone ${tsbState==="frais"?"fraîche":"normale"} — la montée en charge est encaissée sans effort visible. Il y a de la marge pour la suite du bloc.`;
  } else {
    cls="co-p"; title=`Forme (TSB) ${last.tsb>0?"+":""}${last.tsb}`;
    txt=`Fitness (CTL) <b>${last.ctl}</b> · Fatigue (ATL) <b>${last.atl}</b>. Rien à ajuster, le plan tourne comme prévu.`;
  }
  // Signal sommeil, si la semaine courante en a (câblé dès maintenant, sans effet tant que le
  // port continu n'a pas repris — voir sommeilSignals()/UPDATE.md). Vient nuancer le verdict
  // TSB plutôt que le remplacer : un score de sommeil bas renforce la lecture "fatigue réelle",
  // un score correct nuance un TSB dans le rouge qui pourrait n'être qu'un artefact du modèle.
  if(last.sommeil_score!=null){
    txt+= last.sommeil_score<70
      ? ` <br><br>💤 <b>Signal sommeil (test) :</b> score moyen <b>${last.sommeil_score}/100</b> cette semaine-là, sommeil profond <b>${Math.round(last.sommeil_profond_min)} min/nuit</b> — en dessous de ce qu'on veut voir en période de charge, cohérent avec une fatigue qui ne tiendrait pas qu'au chiffre de modèle.`
      : ` <br><br>💤 <b>Signal sommeil (test) :</b> score moyen <b>${last.sommeil_score}/100</b>, sommeil profond <b>${Math.round(last.sommeil_profond_min)} min/nuit</b> — un bon socle de récupération cette semaine-là.`;
  }
  return {tCharge,tsbState,chargeRising,cardioHolding,nextTaper,cls,title,txt};
}
// Sortie longue : statut vs le pic de 30 km en semaine 10 + le prochain rendez-vous concret.
function sortieLongueAnalysis(){
  const H=HEBDO;
  const longestRecord=Math.max(...H.map(w=>w.longest));
  const slDone=longestRecord>=30, slOk=longestRecord>=20, slStarting=longestRecord<15;
  const cs=cardioSignals();
  const nextSL=nextSession(s=>s.a==="sl"||s.a==="sl_am");
  const slAllureTxt=cs.tSlAllure?` Et ton allure sur ces sorties évolue de <b>${cs.tSlAllure.pct>0?"+":""}${cs.tSlAllure.pct.toFixed(0)} %</b> sur 3 semaines${cs.tSlAllure.good?" — l'endurance spécifique suit.":" — à surveiller si ça ne suit pas la distance."}`:"";
  const cls=slDone?'co-v':slOk?'co-i':'co-w';
  const title=`Sortie longue — record actuel ${longestRecord} km`;
  const txt=`Objectif final : 42,2 km le jour J, pic d'entraînement à 30 km en semaine 10.${slAllureTxt}
    <br><b>Statut :</b> ${slDone?"pic atteint : protège-le, n'en rajoute pas — la suite, c'est l'affûtage.":slOk?"bonne trajectoire, continue sans brûler d'étape.":slStarting?"tout démarre juste, c'est normal à ce stade du bloc.":"c'est le facteur n°1 du plan, ne saute aucune sortie longue d'ici la semaine 10."}
    ${nextSL?`<br><b>Prochain rendez-vous :</b> ${nextSL.date?jourLong(toISO(nextSL.date)):`semaine ${nextSL.w.n}`} — ${esc(nextSL.s.t)}${nextSL.s.km?` (${nextSL.s.km} km)`:""}.`:""}`;
  return {cls,title,txt,longestRecord};
}
// Qualité (VMA/seuil/côtes) : ratio de séances faites + prochaine échéance, cible tapis incluse.
function qualiteAnalysis(){
  let qualTot=0,qualDone=0;
  SEMAINES.forEach(w=>w.s.forEach((s,i)=>{
    const A=s.a?ARCHETYPES[s.a]:null;
    if(A&&QUAL_FAM.includes(A.fam)){ qualTot++; if(isDone(w,s,i)) qualDone++; }
  }));
  const seuilAll=[]; SEMAINES.forEach(w=>w.s.forEach((s,i)=>{ if(s.a==="seuil"||s.a==="seuil_2000") seuilAll.push({w,i}); }));
  const seuilDone=seuilAll.filter(({w,i})=>isDone(w,w.s[i],i)).length;
  const isQual=s=>{const A=s.a&&ARCHETYPES[s.a]; return A&&QUAL_FAM.includes(A.fam);};
  const nextQual=nextSession(isQual);
  const nextQualA=nextQual?ARCHETYPES[nextQual.s.a]:null;
  const cls=seuilDone>=seuilAll.length&&seuilAll.length?'co-v':'co-i';
  const title=`Qualité (VMA/seuil/côtes) — ${qualDone}/${qualTot} séances faites, dont ${seuilDone}/${seuilAll.length} au seuil`;
  const txt=`Le seuil est le levier le plus rentable pour élever ton plafond aérobie ; VMA et côtes complètent en vitesse et en force spécifique.
    <br><b>Statut :</b> ${seuilDone===0?"aucune séance de seuil encore — le plafond aérobie n'a pas commencé à bouger.":seuilDone<seuilAll.length?"en cours : garde l'allure stable du 1ᵉʳ au dernier bloc de chaque séance.":"seuil terminé, le plafond aérobie a été sollicité sur tout le bloc."}
    ${nextQual?`<br><b>Prochain rendez-vous :</b> ${nextQual.date?jourLong(toISO(nextQual.date)):`semaine ${nextQual.w.n}`} — ${esc(nextQual.s.t)}.${nextQualA&&nextQualA.tapis?` Cible tapis : ${nextQualA.tapis}`:""}`:""}`;
  return {cls,title,txt,qualDone,qualTot,seuilDone,seuilTot:seuilAll.length};
}
// Trajectoire vers l'objectif : le même écart que la page Projection, mais lu à travers les
// 3 indicateurs cardio corrélés plutôt qu'un seul chiffre isolé.
function trajectoireAnalysis(){
  const objSec=hToSec(META.objectif.plan), predSec=timeToSec(GARMIN.predictions.marathon);
  const gapMin=Math.round((predSec-objSec)/60);
  const cs=cardioSignals();
  const signals=[cs.tEff,cs.tSlAllure,cs.tFcFooting];
  const signalsKnown=signals.filter(t=>t).length, signalsGood=signals.filter(t=>t&&t.good).length;
  const majority=signalsKnown>0&&(signalsGood/signalsKnown)>=0.6;
  let cls,title,txt;
  if(gapMin<=0){
    cls="co-v"; title="L'objectif est déjà battu sur le papier";
    txt=`La prédiction Garmin (<b>${secToHM(predSec)}</b>) passe déjà sous <b>${META.objectif.plan}</b>. Il ne reste qu'un travail : verrouiller cette avance jusqu'au 8 novembre, pas en chercher davantage.`;
  } else if(signalsKnown<2){
    cls="co-p"; title=`${gapMin} min d'écart — verdict prématuré`;
    txt=`Pas encore assez de semaines avec les 3 indicateurs croisés (efficience, allure sortie longue, FC à l'effort facile) pour trancher. Normal à ce stade — cette carte parlera dans 2-3 semaines, pas avant.`;
  } else if(majority){
    cls="co-v"; title=`${gapMin} min d'écart — le moteur fait son travail`;
    txt=`<b>${signalsGood}/${signalsKnown}</b> indicateurs corrélés avancent ensemble sur les 3 dernières semaines. C'est exactement le signal qu'on veut voir : l'écart se comble par plusieurs mécanismes en même temps, pas par un chiffre isolé qui pourrait n'être qu'un coup de chance.`;
  } else {
    cls="co-w"; title=`${gapMin} min d'écart — ça ne suit pas encore`;
    txt=`Seulement <b>${signalsGood}/${signalsKnown}</b> indicateurs corrélés progressent. ${curWeek<6?"Encore normal en début de bloc — large place pour inverser la tendance.":"Passé la mi-bloc, ça se regarde en face : la carte « Adaptation cardio » juste en dessous dit lequel des trois traîne."}`;
  }
  return {cls,title,txt,gapMin};
}
// Renforcement : ratio de séances faites vs prévues.
function renfoAnalysis(){
  let renfoTot=0,renfoDone=0;
  SEMAINES.forEach(w=>w.s.forEach((s,i)=>{ if(s.k==="strength"){ renfoTot++; if(isDone(w,s,i)) renfoDone++; } }));
  const cls=renfoTot?(renfoDone/renfoTot>=0.7?'co-v':'co-i'):'co-p';
  const title=`Renforcement — ${renfoDone}/${renfoTot} séances faites`;
  const txt=`Le complément unilatéral qui manquait avant le bloc (leg press une jambe, fentes bulgares, mollets unipodaux) — la meilleure prévention de blessure dont tu disposes.
    <br><b>Statut :</b> ${renfoDone===0?"pas encore démarré sur le bloc.":`${Math.round(renfoDone/renfoTot*100)} % du renfo prévu réalisé à ce stade${renfoDone/renfoTot>=0.9?" — quasiment à jour.":"."}`}`;
  return {cls,title,txt,renfoDone,renfoTot};
}
function renderAmeliorations(){
  const traj=trajectoireAnalysis();
  const cs=cardioSignals();
  const charge=chargeSignals();
  const sl=sortieLongueAnalysis();
  const qual=qualiteAnalysis();
  const renfo=renfoAnalysis();

  g("ameliorations").innerHTML=`
<div class="co ${traj.cls}"><b class="t">1. ${traj.title}</b>${traj.txt}</div>

<div class="co co-i"><b class="t">2. Ton cœur s'adapte-t-il vraiment ?</b>${cs.html}</div>

<div class="co ${charge.cls}"><b class="t">3. ${charge.title}</b>${charge.txt}</div>

<div class="co ${sl.cls}"><b class="t">4. ${sl.title}</b>${sl.txt}</div>

<div class="co ${qual.cls}"><b class="t">5. ${qual.title}</b>${qual.txt}</div>

<div class="co ${renfo.cls}"><b class="t">6. ${renfo.title}</b>${renfo.txt}</div>`;

  renderCrossLinks();
}

/* ============================================================
   RENDU — HISTORIQUE
   ============================================================ */
function renderHisto(){
  const rows=HEBDO.slice().reverse().map((w,i)=>{
    const d=new Date(w.lundi+"T00:00:00");
    const fin=new Date(d); fin.setDate(fin.getDate()+6);
    const sameMonth=d.getMonth()===fin.getMonth();
    const range=sameMonth
      ?`${d.getDate()}–${fin.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}`
      :`${d.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}–${fin.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}`;
    const isLast=i===0;
    return `<tr${isLast?' style="background:rgba(45,212,191,.06)"':''}><td>${range}${isLast?' <span class="pill" style="--pb:#2dd4bf33;--pc:#2dd4bf">dernière</span>':''}</td>
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
function allureToMin(a){ const p=a.split(":").map(Number); return p[0]+p[1]/60; }
function zoneBounds(z){
  const [a,b]=z.allure.split("–").map(s=>allureToMin(s.trim()));
  return [Math.min(a,b),Math.max(a,b)];
}
// Classe chaque FOOTING récent (ACTIVITES) dans sa zone réelle par l'allure, pour Z1-Z3.
// Les séances de qualité (qual:true — VO2max, seuil, fractionné...) ne peuvent pas être classées
// par leur allure moyenne globale (mélange échauffement/fractions/récup, trompeur — ex. une séance
// de côtes à 6:13/km de moyenne n'est pas "une sortie en Z1"). Pour Z4/Z5, on les intègre plutôt
// via le champ `zone` posé manuellement à la sync (zone cible réelle de l'archétype de la séance),
// pas par un calcul d'allure. Sans ce champ, Z4/Z5 resteraient structurellement toujours vides
// (les seules séances qui les atteignent sont justement celles qu'on exclut du calcul par allure).
function zoneRecentRuns(){
  const acts=(window.ACTIVITES||[]).slice().sort((a,b)=>a.date<b.date?1:-1);
  const byZone={};
  Object.keys(ZONES).forEach(k=>byZone[k]=[]);
  acts.filter(a=>a.type==="run"&&a.allure&&!a.qual).forEach(r=>{
    const allureMin=allureToMin(r.allure);
    let best=null,bestD=Infinity;
    Object.entries(ZONES).forEach(([k,z])=>{
      const [lo,hi]=zoneBounds(z), mid=(lo+hi)/2;
      const d=Math.abs(allureMin-mid);
      if(allureMin>=lo-0.15&&allureMin<=hi+0.15&&d<bestD){best=k;bestD=d;}
    });
    if(best) byZone[best].push({...r, allureMin});
  });
  acts.filter(a=>a.qual&&a.zone&&byZone[a.zone]).forEach(r=>byZone[r.zone].push(r));
  return byZone;
}
// Archétype → zone cible, pour lister les prochaines séances qui viseront chaque zone
// (utile surtout pour Z4/Z5, qui ne montrent presque jamais de sortie récente autrement).
const ARCH_ZONE={endurance:"Z1", sl:"Z2", sl_am:"Z3",
  interval_1000:"Z4", seuil:"Z4", seuil_2000:"Z4",
  vma_court:"Z5", vma_long:"Z5", vo2max:"Z5"};
function upcomingByZone(){
  const byZone={}; Object.keys(ZONES).forEach(k=>byZone[k]=[]);
  SEMAINES.forEach(w=>{
    if(w.past||w.n<curWeek) return;
    w.s.forEach((s,i)=>{
      const zone=s.a&&ARCH_ZONE[s.a];
      if(!zone||isDone(w,s,i)) return;
      byZone[zone].push({w,s,i});
    });
  });
  return byZone;
}
function renderZones(){
  g("zlead").innerHTML=`Allures dérivées de l'objectif ${META.objectif.plan} (${META.objectif.allure}/km), `+
   `bornes cardiaques calculées par <b>réserve cardiaque</b> — FC repos ${META.athlete.fc_repos} bpm, `+
   `FCmax ${META.athlete.fc_max} bpm, réserve de ${META.athlete.fc_max-META.athlete.fc_repos} bpm. `+
   `<b>Fie-toi à l'allure en priorité</b>, la FC dérive avec la chaleur et la fatigue. `+
   `En dessous de chaque zone : les footings récents qui y correspondent réellement (Z1-Z3), ou les séances de `+
   `qualité récentes/à venir qui la ciblent (Z4-Z5) — leur allure moyenne globale n'a pas de sens, donc on ne les classe pas par calcul mais par ce qu'elles visent vraiment.`;
  const byZone=zoneRecentRuns(), upcoming=upcomingByZone();
  const jourTxt=d=>{const dt=new Date(d+"T00:00:00");return dt.toLocaleDateString("fr-FR",{day:"numeric",month:"short"});};
  g("zones").innerHTML=Object.entries(ZONES).map(([k,z])=>{
    const recents=byZone[k];
    let recentBlock;
    if(!recents.length){
      recentBlock=`<p class="zrecent zrecent-empty">Aucune sortie récente dans cette zone.</p>`;
    }else{
      const last=recents[0];
      const desc=last.qual
        ? `${last.nom} (séance de qualité)`
        : `à ${last.allure}/km${last.fc?` (${last.fc} bpm)`:""}`;
      recentBlock=`<p class="zrecent"><b>${recents.length}</b> sortie${recents.length>1?"s":""} récente${recents.length>1?"s":""} ici —
        la dernière le ${jourTxt(last.date)}, ${desc}.</p>`;
    }
    const next=upcoming[k]||[];
    const nextBlock=next.length?`<p class="zrecent znext"><b>À venir :</b> ${next.slice(0,3).map(({w,s})=>{
      const A=s.a?ARCHETYPES[s.a]:null;
      return `${A?A.ico:""} ${A?A.nom:s.t} <span class="zwk">S${w.n}</span>`;
    }).join(" · ")}</p>`:"";
    return `
   <div class="zone" style="--zc:${z.c}">
     <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
       <span class="zbadge">${k}</span><h3 style="font-size:.9rem">${z.nom}</h3></div>
     <div class="zrow"><span>Allure</span><b>${z.allure} /km</b></div>
     <div class="zrow"><span>Vitesse tapis</span><b>${z.kmh} km/h</b></div>
     <div class="zrow"><span>FC</span><b>${z.fc} bpm</b></div>
     <p>${z.desc}</p>
     ${recentBlock}
     ${nextBlock}</div>`;
  }).join("");
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
       ${w.nutrition?`<div class="plan-prev nutri"><b>🍽️ Nutrition</b>${w.nutrition}</div>`:""}
       ${w.prevu?`<div class="plan-prev"><b>Ce que le plan prévoyait</b>${w.prevu}</div>`:""}
       ${w.past?"":renderRealActivities(w)}
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
  // Un viewer ne peut jamais cocher une séance — même règle visuelle qu'une séance déjà figée
  // dans l'historique (`s.past`), qui réutilise exactement le même style "verrouillé".
  const st=getS(w,i), done=isDone(w,s,i), lock=!!s.past||!isOwner(), k=s.k||"run";
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
        ${analyseBlock(w,i)}
      </div>
    </div>
    ${A?detail(w,s,i,A,forme,st):""}
  </div>`;
}
// Analyse post-sync d'une séance réalisée : ce que je compare (allure/FC réelles vs cible) après
// chaque synchro, publié directement ici plutôt que seulement dit dans le chat. Alimenté par
// window.ANALYSES, régénéré à chaque sync — vide/absent tant qu'aucune analyse n'existe pour
// cette séance précise (pas d'activité correspondante, ou séance pas encore de type "qualité").
function analyseBlock(w,i){
  const a=window.ANALYSES?.[sid(w.n,i)];
  if(!a) return "";
  const icoConclusion=a.conclusion==="conforme"?"✅":a.conclusion==="ajuste"?"🔧":"👀";
  return `<details class="ex-detail an-detail">
    <summary>Analyse de la séance (post-synchro)</summary>
    <div class="an-body"><span class="an-tag">${icoConclusion} ${a.conclusion}</span>${a.texte}</div>
  </details>`;
}
function detail(w,s,i,A,forme,st){
  return `<div class="sdet">
    <div class="blk"><div class="bl">Type · ${A.nom}</div><div class="bt">${A.but}</div></div>
    ${A.exercices?`<div class="blk"><div class="bl">Exercices</div>
      <div class="tbwrap"><table class="tb extb">
        <tr><th>Exercice</th><th>Séries</th><th>Reps</th><th>Charge</th><th>Tempo</th></tr>
        ${A.exercices.map(e=>`<tr><td>${e.nom}</td><td class="n">${e.series}</td><td class="n">${e.reps}</td><td class="n">${e.charge}</td><td>${e.tempo}</td></tr>`).join("")}
      </table></div>
      <p class="exnote">Séries × reps données pour une forme <b>normale</b> — utilise les boutons de forme ci-dessous pour l'ajustement du jour (charge, nombre de séries…).</p>
    </div>`:""}
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
      ${isOwner()
        ?`<div class="formes">${FORMES.map(([k,l])=>
            `<button class="fbtn ${forme===k?"on":""}" data-f="${k}">${l}</button>`).join("")}</div>`
        :`<div class="formes"><span class="fbtn on" style="cursor:default">${FORMES.find(([k])=>k===forme)?.[1]||forme}</span></div>`}
      <div class="fadapt"><b>Adaptation :</b> ${A.forme[forme]}
        ${s.f?`<br><b>Durée :</b> ${forme==="top"?s.f[1]:forme==="bof"?s.f[0]:forme==="hs"?"réduite":Math.round((s.f[0]+s.f[1])/2)} min`:""}</div>
    </div>
    ${isOwner()?`<div class="ressenti">
      <div class="bl">Ressenti après la séance <span class="saved">enregistré ✓</span></div>
      <textarea data-note="1" placeholder="Comment ça s'est passé ? Sensations, allure tenue, douleurs…">${esc(st.note||"")}</textarea>
    </div>`:(st.note?`<div class="ressenti">
      <div class="bl">Ressenti après la séance</div>
      <div class="bt">${esc(st.note)}</div>
    </div>`:"")}
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

  // Carte KPI cliquée (Progression ou Forme) → page de détail plein écran de cet indicateur.
  // Testé avant [data-lundi] : un clic sur une barre à l'intérieur d'une petite carte doit
  // ouvrir le détail de l'indicateur, pas tenter une sélection de semaine (réservée à la
  // grande page de détail, où les cartes .kpi-click n'existent pas).
  const kpiCard=e.target.closest(".kpi-click");
  if(kpiCard && kpiCard.dataset.detail){ openDetail(kpiCard.dataset.detail); return; }

  const barHit=e.target.closest("[data-lundi]");
  if(barHit){ selectDetailWeek(barHit.dataset.lundi); return; }

  if(e.target.closest("#burgerBtn")){ openDrawer(); return; }
  if(e.target.closest("#bottomMenuBtn")){ openDrawer(); return; }
  if(e.target.closest("#drawerScrim")){ closeDrawer(); return; }
  if(e.target.closest("#syncIconBtn")){ openSync(); return; }
  if(e.target.closest("#syncCloseBtn")){ closeSync(); return; }
  if(e.target.closest("#syncScrim")){ closeSync(); return; }

  const se=e.target.closest(".se");
  if(se){
    const w=SEMAINES.find(x=>x.n==+se.dataset.w), i=+se.dataset.i;
    // data-chk/.fbtn n'existent normalement plus dans le HTML d'un viewer (voir sess()/detail()),
    // mais on revérifie isOwner() ici en défense en profondeur — la vraie barrière reste de toute
    // façon firestore.rules (écriture state/* refusée côté serveur pour un non-owner).
    if(e.target.closest("[data-chk]")){ if(isOwner()){ setS(w,i,{done:!getS(w,i).done}); boot(); } return; }
    if(e.target.closest("[data-exp]")){ setS(w,i,{open:!getS(w,i).open}); refreshWeekViews(w.n); return; }
    const fb=e.target.closest(".fbtn");
    if(fb){ if(isOwner()) setS(w,i,{forme:fb.dataset.f}); refreshWeekViews(w.n); return; }
  }
  const wh=e.target.closest(".wh");
  if(wh) wh.parentElement.classList.toggle("open");
});

document.addEventListener("input",e=>{
  const ta=e.target.closest("[data-note]"); if(!ta||!isOwner()) return;
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
    ST={}; save(); location.reload();
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
function boot(){
  initData();
  buildNav();
  // Actions réservées à l'owner (sync manuelle, reset des saisies) : masquées pour un viewer,
  // pas seulement désactivées — un viewer n'a aucune raison de savoir que ces boutons existent.
  document.body.classList.toggle("viewer-mode",!isOwner());
  tick();
  renderHome();
  renderFocusPage("focusCoursBody",curWeek,true);
  renderFocusPage("focusProchaineBody",curWeek+1,false);
  renderProgressSynthese();
  renderGauges();
  renderKpis();
  renderProjection();
  renderWithings();
  renderMateriel();
  renderAnalyse();
  renderAmeliorations();
  renderHisto();
  renderZones();
  renderWeeksList();
  document.querySelector(`.wk[data-w="${curWeek}"]`)?.classList.add("open");
  (()=>{const d=new Date(MAJ.date);
    g("drawerMaj").innerHTML=`Synchro <b>${d.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</b>`;
  })();
  const hash=location.hash?location.hash.slice(1):"accueil";
  // Lien profond vers une page de détail d'indicateur (#detail/eff) : recharger la page (F5,
  // partage du lien) doit rouvrir directement le bon indicateur, pas retomber sur Progression.
  if(hash.startsWith("detail/")) openDetail(hash.slice(7));
  else showPage(hash);
}
// Rôle de la personne connectée ({email,role:"owner"|"viewer"}), résolu une fois pour toutes au
// démarrage — jamais recalculé ailleurs. `isOwner()` est LE point de vérité côté UI pour savoir
// s'il faut afficher les actions d'écriture (cases à cocher, forme, notes, sync, reset...). Ça ne
// remplace pas firestore.rules (seule vraie barrière), ça évite juste d'afficher des contrôles
// qu'un viewer ne pourrait de toute façon pas utiliser.
window.CURRENT_ACCESS=null;
const isOwner=()=>window.CURRENT_ACCESS?.role==="owner";
(async function(){
  // 1. Authentification (auth.js) — résout {email,role} ou null si pas connecté/pas autorisé.
  // auth.js gère déjà l'affichage de l'écran de connexion/refus dans ce cas ; ici on s'arrête
  // simplement, il n'y a rien de plus à faire tant que l'accès n'est pas confirmé.
  const access=window.Auth?await window.Auth.ready:null;
  if(!access) return;
  window.CURRENT_ACCESS=access;

  // 2. Données personnelles (data-cloud.js) — lit appdata/plan+strava+withings depuis Firestore.
  // `false` = les documents n'existent pas encore (migration initiale pas encore faite, voir
  // migrate-to-firestore.html) : on ne peut pas booter sans données, mais on ne casse pas non
  // plus silencieusement — message explicite plutôt qu'une page blanche ou une erreur JS opaque.
  const dataOk=window.DataCloud?await window.DataCloud.ready:false;
  if(!dataOk){
    document.getElementById("appShell").innerHTML=
      `<div style="padding:40px 24px;text-align:center;color:var(--tx2)">
        <b style="color:var(--tx)">Données pas encore initialisées.</b><br><br>
        ${isOwner()?"Ouvre <code>migrate-to-firestore.html</code> en local pour importer les données une première fois.":
        "Contacte Romain — le suivi n'a pas encore été configuré."}
      </div>`;
    document.getElementById("appShell").style.display="";
    return;
  }

  // 3. État de progression (cases cochées, forme, notes) — même logique qu'avant l'auth : si un
  // état cloud plus récent existe, il prime sur le localStorage local. CloudSync lit maintenant la
  // session Google ouverte à l'étape 1 au lieu de sa propre auth anonyme (voir firebase-sync.js).
  if(window.CloudSync){
    const localTs=Number(localStorage.getItem(TSKEY)||0);
    const remote=await window.CloudSync.pull();
    if(remote && remote.ts>localTs){
      ST=remote.st;
      localStorage.setItem(KEY,JSON.stringify(ST));
      localStorage.setItem(TSKEY,String(remote.ts));
    }
  }
  boot();
  const acc=g("drawerAccount");
  if(acc) acc.textContent=`${access.email} · ${access.role==="owner"?"toi":"lecture seule"}`;
  setInterval(tick,1000);
})();
