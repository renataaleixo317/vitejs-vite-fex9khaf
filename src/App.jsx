// Cole este arquivo inteiro em src/App.jsx no StackBlitz

import { useState, useEffect, useRef } from "react";

// ─── DATA LAYER ───────────────────────────────────────────────────────────────
const DB = {
  set: (col,id,data) => { const k=`lv__${col}__${id}`; const prev=DB.get(col,id)||{}; localStorage.setItem(k,JSON.stringify({...prev,...data})); },
  get: (col,id) => { try{const v=localStorage.getItem(`lv__${col}__${id}`);return v?JSON.parse(v):null;}catch{return null;} },
  del: (col,id) => localStorage.removeItem(`lv__${col}__${id}`),
  query: (col,field,val) => { const r=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k.startsWith(`lv__${col}__`))continue;try{const d=JSON.parse(localStorage.getItem(k));if(d[field]===val)r.push({id:k.split("__")[2],...d});}catch{}}return r; },
  all: (col) => { const r=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k.startsWith(`lv__${col}__`))continue;try{r.push(JSON.parse(localStorage.getItem(k)));}catch{}}return r; },
};
const AUTH = {
  current: () => { try{return JSON.parse(sessionStorage.getItem("lv_sess"));}catch{return null;} },
  signIn: (email,pass) => { const u=(DB.get("_auth","users")||{})[email]; if(!u)throw new Error("auth/user-not-found"); if(u.pass!==pass)throw new Error("auth/wrong-password"); const s={uid:u.uid,email,role:u.role||"patient"}; sessionStorage.setItem("lv_sess",JSON.stringify(s)); return s; },
  register: (email,pass,role="patient") => { const users=DB.get("_auth","users")||{}; if(users[email])throw new Error("auth/email-already-in-use"); const uid=(role==="pro"?"pro_":"uid_")+Date.now(); users[email]={uid,pass,role}; DB.set("_auth","users",users); const s={uid,email,role}; sessionStorage.setItem("lv_sess",JSON.stringify(s)); return s; },
  signOut: () => sessionStorage.removeItem("lv_sess"),
};

const genCode = () => Math.random().toString(36).slice(2,8).toUpperCase();
const todayKey = () => new Date().toISOString().slice(0,10);
const fmtDate = dk => new Date(dk+"T12:00:00").toLocaleDateString("pt-BR",{day:"numeric",month:"short"});
const last30 = () => Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return d.toISOString().slice(0,10);});
const daysRange = (from,to) => {const r=[];const d=new Date(from);const end=new Date(to);while(d<=end){r.push(d.toISOString().slice(0,10));d.setDate(d.getDate()+1);}return r;};
const dayOfJourney = s => !s?1:Math.max(1,Math.floor((new Date()-new Date(s))/86400000)+1);
const calcStreak = uid => { let s=0;for(const d of last30()){if(DB.get("daily_logs",`${uid}_${d}`)?.mood)s++;else break;}return s; };
const calcConsistency = uid => { const done=last30().filter(d=>DB.get("daily_logs",`${uid}_${d}`)?.mood).length; return Math.round((done/30)*100); };

const C = {mint:"#A8D5BA",emerald:"#2D6A4F",nude:"#F5EDE3",rose:"#F2B5C0",white:"#fff",bg:"#F9F6F2",text:"#2C2C2C",muted:"#8A8A8A",pro:"#1E3A5F",proLight:"#EEF4FF",proMid:"#C7D9F5",proAccent:"#3B7DD8",amber:"#F59E0B",amberLight:"#FEF3C7"};
const PRICE="12,90";
const KIWIFY_URL="https://pay.kiwify.com.br/sPHFZoC";
const goKiwify = () => window.open(KIWIFY_URL, "_blank");

const RECIPES=[
  {id:1,cat:"Alta Proteína",name:"Bowl de Frango com Quinoa",kcal:420,prot:38,time:"25min",emoji:"🍗",steps:["Cozinhe 80g de quinoa em água com sal.","Grelhe 150g de frango temperado com ervas.","Monte o bowl com folhas verdes e tomate cereja.","Finalize com fio de azeite, chia e limão."]},
  {id:2,cat:"Alta Proteína",name:"Omelete de Claras com Espinafre",kcal:180,prot:24,time:"10min",emoji:"🥚",steps:["Bata 4 claras com pitada de sal e pimenta.","Refogue espinafre com alho e azeite.","Despeje as claras sobre o espinafre.","Cozinhe em fogo baixo, dobre ao meio e sirva."]},
  {id:3,cat:"Alta Proteína",name:"Frango ao Molho de Iogurte",kcal:310,prot:40,time:"30min",emoji:"🫙",steps:["Tempere 200g de frango com alho, limão e sal.","Misture 100g de iogurte grego com cúrcuma e azeite.","Cubra o frango e leve ao forno 25min a 200°C.","Sirva com folhas verdes e quinoa cozida."]},
  {id:4,cat:"Alta Proteína",name:"Atum com Grão-de-Bico",kcal:290,prot:35,time:"8min",emoji:"🐟",steps:["Escorra 1 lata de atum e 1 lata de grão-de-bico.","Misture com tomate picado, cebola roxa e salsinha.","Tempere com limão, azeite e sal.","Sirva frio como salada."]},
  {id:5,cat:"Alta Proteína",name:"Shake Proteico de Cacau",kcal:220,prot:28,time:"5min",emoji:"🍫",steps:["Bata 200ml leite vegetal, 1 scoop proteína, 1 col. cacau, 1 banana congelada.","Adicione gelo a gosto.","Bata até cremoso.","Consuma após o treino."]},
  {id:6,cat:"Alta Proteína",name:"Tilápia Grelhada com Batata Doce",kcal:350,prot:36,time:"20min",emoji:"🐠",steps:["Tempere 180g de tilápia com limão, alho e sal.","Grelhe 4min de cada lado.","Cozinhe 150g de batata doce no vapor.","Monte o prato e finalize com ervas."]},
  {id:7,cat:"Alta Proteína",name:"Ovos Mexidos com Cottage",kcal:200,prot:22,time:"8min",emoji:"🍳",steps:["Bata 2 ovos inteiros com 2 claras e sal.","Cozinhe em fogo baixo mexendo devagar.","Finalize com 2 col. de cottage e cebolinha.","Sirva com torrada integral."]},
  {id:8,cat:"Alta Proteína",name:"Salada de Frango Desfiado",kcal:260,prot:34,time:"15min",emoji:"🥗",steps:["Cozinhe e desfie 150g de peito de frango.","Misture com alface, tomate, milho e pepino.","Faça molho com iogurte, mostarda e limão.","Tempere e sirva."]},
  {id:9,cat:"Intestino Preso",name:"Vitamina Verde Detox",kcal:140,prot:5,time:"5min",emoji:"🥦",steps:["Bata: 1 folha de couve, 1 banana congelada, 200ml água de coco.","Adicione 1 col. sopa de linhaça dourada.","Bata até homogêneo.","Beba imediatamente em jejum."]},
  {id:10,cat:"Intestino Preso",name:"Mingau de Aveia com Ameixa",kcal:180,prot:6,time:"10min",emoji:"🥣",steps:["Cozinhe 4 col. aveia em 200ml de água.","Mexa em fogo baixo por 5min.","Adicione 3 ameixas pretas e mel.","Finalize com canela."]},
  {id:11,cat:"Intestino Preso",name:"Salada de Mamão com Chia",kcal:110,prot:3,time:"3min",emoji:"🍈",steps:["Corte 2 fatias de mamão papaya.","Adicione 1 col. sopa de chia.","Regue com suco de limão.","Consuma pela manhã em jejum."]},
  {id:12,cat:"Intestino Preso",name:"Sopa de Legumes com Linhaça",kcal:160,prot:7,time:"25min",emoji:"🥕",steps:["Refogue cebola, alho, cenoura e abobrinha.","Adicione caldo de legumes e cozinhe 15min.","Bata metade da sopa.","Finalize com 1 col. linhaça e salsinha."]},
  {id:13,cat:"Intestino Preso",name:"Iogurte com Kiwi e Mel",kcal:150,prot:8,time:"3min",emoji:"🥝",steps:["Disponha 150g de iogurte natural em tigela.","Fatie 1 kiwi por cima.","Adicione 1 col. chá de mel.","Consuma pela manhã."]},
  {id:14,cat:"Falta de Apetite",name:"Caldo Proteico Suave",kcal:160,prot:18,time:"20min",emoji:"🍲",steps:["Cozinhe 100g de frango desfiado com cúrcuma e gengibre.","Bata no liquidificador com o caldo até cremoso.","Aqueça e sirva morno em xícara.","Ideal quando não há apetite para mastigar."]},
  {id:15,cat:"Falta de Apetite",name:"Vitamina de Banana com Amendoim",kcal:280,prot:10,time:"5min",emoji:"🥜",steps:["Bata 1 banana congelada com 200ml leite vegetal.","Adicione 1 col. pasta de amendoim.","Acrescente mel e canela.","Consuma gelado."]},
  {id:16,cat:"Falta de Apetite",name:"Sopa Creme de Abóbora",kcal:130,prot:4,time:"20min",emoji:"🎃",steps:["Cozinhe 200g de abóbora com cebola e alho.","Bata tudo até liso.","Tempere com sal, noz-moscada e azeite.","Sirva morno com torrada."]},
  {id:17,cat:"Falta de Apetite",name:"Pudim de Chia com Frutas",kcal:190,prot:6,time:"5min",emoji:"🫐",steps:["Misture 3 col. chia com 200ml leite de coco.","Adicione mel e baunilha.","Leve à geladeira por 4 horas.","Sirva com frutas vermelhas."]},
  {id:18,cat:"Café da Manhã",name:"Panqueca de Banana e Aveia",kcal:230,prot:12,time:"15min",emoji:"🥞",steps:["Amasse 1 banana madura.","Misture com 2 ovos e 3 col. aveia.","Cozinhe em frigideira antiaderente.","Sirva com mel e frutas vermelhas."]},
  {id:19,cat:"Café da Manhã",name:"Torrada Integral com Abacate",kcal:220,prot:7,time:"5min",emoji:"🥑",steps:["Torre 2 fatias de pão integral.","Amasse meio abacate com limão e sal.","Espalhe sobre as torradas.","Finalize com sementes e páprica."]},
  {id:20,cat:"Café da Manhã",name:"Tapioca com Queijo e Tomate",kcal:200,prot:11,time:"8min",emoji:"🫓",steps:["Aqueça frigideira e adicione 2 col. goma de tapioca.","Aguarde firmar.","Recheie com queijo branco e tomate.","Dobre e sirva quente."]},
  {id:21,cat:"Café da Manhã",name:"Bowl de Açaí Proteico",kcal:310,prot:15,time:"5min",emoji:"🫐",steps:["Bata 100g açaí com 1 banana e leite vegetal.","Despeje em tigela.","Cubra com granola sem açúcar e frutas.","Dissolva proteína no açaí antes de bater."]},
  {id:22,cat:"Lanches Leves",name:"Iogurte Grego com Frutas",kcal:150,prot:14,time:"2min",emoji:"🍓",steps:["Disponha 150g iogurte grego em pote.","Adicione frutas vermelhas.","Finalize com granola e chia.","Consuma gelado."]},
  {id:23,cat:"Lanches Leves",name:"Palito de Pepino com Homus",kcal:100,prot:5,time:"5min",emoji:"🥒",steps:["Corte 1 pepino em palitos.","Abra ou prepare o homus.","Sirva os palitos para mergulhar.","Adicione páprica por cima."]},
  {id:24,cat:"Lanches Leves",name:"Mix de Castanhas",kcal:180,prot:5,time:"1min",emoji:"🌰",steps:["Separe 30g de mix: castanha, amêndoa, noz.","Adicione uva passa ou damasco picado.","Coloque em potinho para carregar.","Ideal para segurar a fome."]},
  {id:25,cat:"Lanches Leves",name:"Crepioca de Cottage",kcal:160,prot:13,time:"10min",emoji:"🧀",steps:["Misture 1 ovo, 2 col. tapioca e sal.","Cozinhe em frigideira como panqueca fina.","Recheie com cottage e cebolinha.","Dobre e sirva morno."]},
];

const WORKOUTS=[
  {id:1,cat:"Glúteos",name:"Glúteo Intenso",duration:"35min",level:"Intermediário",emoji:"🍑",exercises:["Agachamento sumô 4x12","Hip thrust com peso corporal 4x15","Extensão de quadril no solo 3x20 cada lado","Glúteo com elástico em pé 3x15 cada lado","Ponte unilateral 3x12 cada lado","Agachamento isométrico 3x30seg"]},
  {id:2,cat:"Glúteos",name:"Glúteo Iniciante",duration:"25min",level:"Iniciante",emoji:"🌸",exercises:["Ponte de glúteo no chão 3x15","Abdução de quadril deitada 3x15 cada lado","Agachamento livre sem peso 3x12","Coice de burro no solo 3x12 cada lado","Elevação de quadril com pés elevados 3x12","Alongamento de quadril 2x30seg"]},
  {id:3,cat:"Pernas",name:"Pernas Completo",duration:"40min",level:"Intermediário",emoji:"🦵",exercises:["Agachamento livre 4x10","Afundo alternado 3x12 cada perna","Agachamento búlgaro 3x10 cada perna","Panturrilha em pé 4x20","Leg press com cadeira 4x12","Extensão de joelho sentada 3x15"]},
  {id:4,cat:"Pernas",name:"Pernas Iniciante",duration:"30min",level:"Iniciante",emoji:"🏃‍♀️",exercises:["Agachamento com pausa 3x10","Step up em degrau 3x12 cada perna","Afundo estático 3x15 cada perna","Agachamento lateral 3x10 cada lado","Salto agachado suave 3x8","Alongamento de isquiotibiais 2x30seg"]},
  {id:5,cat:"Superiores",name:"Braços e Ombros",duration:"30min",level:"Iniciante",emoji:"💪",exercises:["Flexão adaptada (joelhos) 3x10","Rosca direta com garrafa 3x15","Elevação lateral com garrafa 3x12","Tríceps mergulho na cadeira 3x12","Press de ombros sentada 3x12","Crucifixo com garrafas 3x12"]},
  {id:6,cat:"Superiores",name:"Costas e Postura",duration:"25min",level:"Iniciante",emoji:"🧍‍♀️",exercises:["Remada curvada com garrafa 3x12","Superman no chão 3x15","Extensão de coluna deitada 3x12","Abertura de cotovelos 3x15","Encolhimento de ombros 3x20","Rotação de ombro com garrafa 3x12"]},
  {id:7,cat:"Full Body",name:"Circuito Full Body",duration:"35min",level:"Intermediário",emoji:"🔥",exercises:["Agachamento + press de ombros 3x12","Afundo com rosca direta 3x10 cada perna","Flexão + remada unilateral 3x8","Agachamento lateral + elevação 3x10","Prancha com toque no ombro 3x20","Burpee adaptado sem salto 3x8"]},
  {id:8,cat:"Full Body",name:"HIIT Suave",duration:"20min",level:"Intermediário",emoji:"⚡",exercises:["30seg agachamento rápido + 30seg descanso x4","30seg corrida estacionária + 30seg descanso x4","30seg afundo alternado + 30seg descanso x4","30seg mountain climber + 30seg descanso x4","30seg pulo corda imaginário + 30seg descanso x4"]},
  {id:9,cat:"Core",name:"Abdômen e Core",duration:"25min",level:"Iniciante",emoji:"🎯",exercises:["Prancha frontal 3x30seg","Abdominal remador 3x15","Prancha lateral 3x20seg cada lado","Bird dog 3x10 cada lado","Dead bug 3x10 cada lado","Respiração diafragmática 2x10"]},
  {id:10,cat:"Core",name:"Core Funcional",duration:"20min",level:"Todos",emoji:"🌀",exercises:["Prancha com toque alternado 3x20","Hollow body 3x20seg","Abdominal bicicleta 3x20","Side plank com elevação 3x10 cada lado","Rollout com joelhos 3x10","Alongamento de coluna 2x30seg"]},
  {id:11,cat:"Caminhada",name:"Caminhada Metabolismo Ativo",duration:"30min",level:"Iniciante",emoji:"🚶‍♀️",exercises:["5min aquecimento passo tranquilo","10min ritmo moderado","10min ritmo acelerado","5min desaceleração gradual","Alongamento panturrilha 30seg cada","Alongamento quadríceps 30seg cada"]},
  {id:12,cat:"Caminhada",name:"Caminhada com Intervalos",duration:"35min",level:"Iniciante",emoji:"🏅",exercises:["5min aquecimento","3x: 3min acelerado + 2min moderado","5min ritmo moderado contínuo","3x: 1min muito acelerado + 2min recuperação","5min desaceleração e alongamento"]},
  {id:13,cat:"Mobilidade",name:"Mobilidade Matinal",duration:"20min",level:"Todos",emoji:"🧘‍♀️",exercises:["Rotação de quadril 2x10 cada lado","Gato-vaca 2x10 respirações","Abertura torácica lateral 2x8 cada lado","Alongamento isquiotibiais 30seg cada","Pigeon pose 30seg cada lado","Rotação de coluna deitada 2x8"]},
  {id:14,cat:"Mobilidade",name:"Relaxamento e Flexibilidade",duration:"25min",level:"Todos",emoji:"🌙",exercises:["Respiração 4-7-8 por 5 repetições","Abertura de quadril baixo 1min cada","Twist sentada 30seg cada lado","Child's pose 1min","Pigeon pose profundo 1min cada","Shavasana 3min"]},
  {id:15,cat:"Funcional",name:"Funcional Sem Equipamento",duration:"30min",level:"Intermediário",emoji:"🏠",exercises:["Agachamento com salto suave 3x10","Flexão diamante 3x8","Afundo reverso 3x12 cada perna","Tríceps no chão 3x12","Elevação de quadril com pausa 3x15","Prancha com elevação de braço 3x8"]},
];

const PLAYLISTS=[
  {id:1,cat:"Caminhada",name:"Walk & Glow",songs:18,duration:"72min",emoji:"🎵",vibe:"Pop animado para manter o ritmo",link:"https://open.spotify.com/playlist/37i9dQZF1DX0BcQWzuvk4r"},
  {id:2,cat:"Treino",name:"Power Up",songs:22,duration:"88min",emoji:"🔥",vibe:"Hits motivacionais para treino",link:"https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP"},
  {id:3,cat:"Relaxamento",name:"Soft Landing",songs:15,duration:"60min",emoji:"🌙",vibe:"Sons suaves para relaxar",link:"https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO"},
  {id:4,cat:"Foco",name:"Deep Flow",songs:20,duration:"80min",emoji:"🧠",vibe:"Lo-fi para concentração",link:"https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ"},
];

const MOODS=["😄 Ótima","🙂 Bem","😐 Neutra","😔 Cansada","😞 Difícil"];
const SYMPTOMS=["Náusea","Refluxo","Constipação","Diarreia","Fadiga","Tontura","Dor de cabeça","Fome reduzida","Ansiedade","Insônia"];

const Card=({children,onClick,style})=><div onClick={onClick} style={{background:"#fff",borderRadius:20,padding:16,boxShadow:"0 2px 12px rgba(0,0,0,.07)",...style}}>{children}</div>;
const Btn=({children,onClick,variant="primary",small,full,disabled,loading,style})=>{
  const base={borderRadius:50,fontWeight:700,border:"none",cursor:disabled||loading?"not-allowed":"pointer",transition:"all .2s",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,opacity:disabled||loading?.6:1};
  const v={primary:{background:"linear-gradient(135deg,#A8D5BA,#2D6A4F)",color:"#fff",padding:small?"8px 18px":"14px 28px",fontSize:small?13:15},outline:{background:"transparent",border:"2px solid #2D6A4F",color:"#2D6A4F",padding:small?"7px 17px":"12px 26px",fontSize:small?13:15},rose:{background:"linear-gradient(135deg,#F2B5C0,#e8748a)",color:"#fff",padding:small?"8px 18px":"14px 28px",fontSize:small?13:15},ghost:{background:"transparent",color:"#8A8A8A",padding:small?"6px 12px":"10px 20px",fontSize:small?13:14},pro:{background:"linear-gradient(135deg,#3B7DD8,#1E3A5F)",color:"#fff",padding:small?"8px 18px":"14px 28px",fontSize:small?13:15},amber:{background:"linear-gradient(135deg,#F59E0B,#D97706)",color:"#fff",padding:small?"8px 18px":"14px 28px",fontSize:small?13:15}};
  return <button onClick={onClick} disabled={disabled||loading} style={{...base,...v[variant],...(full?{width:"100%"}:{}),...style}}>{loading?"Aguarde...":children}</button>;
};
const Input=({label,type="text",value,onChange,placeholder,min,max,step})=>(
  <div style={{marginBottom:16}}>
    {label&&<label style={{display:"block",fontSize:13,fontWeight:600,color:"#2D6A4F",marginBottom:6}}>{label}</label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} min={min} max={max} step={step}
      style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"1.5px solid #E0D8CF",background:"#fff",fontSize:15,color:"#2C2C2C",outline:"none",boxSizing:"border-box"}}/>
  </div>
);
const ProgressBar=({value,max,color="#A8D5BA",label,sublabel})=>{
  const pct=Math.min(100,Math.round((value/max)*100));
  return <div><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,fontWeight:600,color:"#2C2C2C"}}>{label}</span><span style={{fontSize:13,color:"#8A8A8A"}}>{sublabel}</span></div><div style={{background:"#EEE8E0",borderRadius:99,height:10,overflow:"hidden"}}><div style={{width:`${pct}%`,background:`linear-gradient(90deg,${color},#2D6A4F)`,height:"100%",borderRadius:99,transition:"width .5s"}}/></div><div style={{textAlign:"right",fontSize:11,color:"#8A8A8A",marginTop:3}}>{pct}%</div></div>;
};
const Toast=({msg,type="success"})=><div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:type==="error"?"#e05c6a":type==="amber"?"#F59E0B":"#2D6A4F",color:"#fff",padding:"12px 22px",borderRadius:99,fontSize:13,fontWeight:700,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,.2)",whiteSpace:"nowrap"}}>{msg}</div>;

function PremiumGate({feature,onClose,onUpgrade}){
  const defs={default:{icon:"✨",title:"Funcionalidade Premium",desc:"Desbloqueie acesso completo ao Leve+.",teaser:"Disponível apenas no Plano Evolução."},history:{icon:"📅",title:"Histórico Completo",desc:"Veja todos os seus check-ins e evolução.",teaser:"No plano gratuito só o check-in do dia está disponível."},body:{icon:"⚖️",title:"Evolução Corporal",desc:"Registre peso, cintura, quadril e acompanhe cada centímetro.",teaser:"Disponível apenas no Plano Evolução."},gallery:{icon:"✨",title:"Galeria de Transformação",desc:"Registre e acompanhe sua transformação visual.",teaser:"Disponível apenas no Plano Evolução."},wellness:{icon:"🌿",title:"Receitas, Treinos & Playlists",desc:"Acesso completo ao conteúdo de bem-estar GLP-1.",teaser:"Disponível apenas no Plano Evolução."},report:{icon:"📄",title:"Relatório de Evolução",desc:"Gere PDF completo para seu médico ou nutricionista.",teaser:"Disponível apenas no Plano Evolução."}};
  const f=defs[feature]||defs.default;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:1000,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"28px 28px 0 0",padding:28,width:"100%",boxSizing:"border-box"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#F59E0B,#D97706)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 14px"}}>🔒</div>
          <h2 style={{fontSize:21,fontWeight:900,color:"#2C2C2C",margin:"0 0 6px"}}>{f.title}</h2>
          <p style={{fontSize:13,color:"#8A8A8A",margin:0,lineHeight:1.5}}>{f.teaser}</p>
        </div>
        <div style={{background:"#FEF3C7",borderRadius:16,padding:14,marginBottom:18,border:"1px solid #F59E0B"}}>
          <p style={{fontSize:13,fontWeight:700,color:"#92400E",margin:"0 0 4px"}}>{f.icon} {f.title}</p>
          <p style={{fontSize:13,color:"#B45309",margin:0,lineHeight:1.5}}>{f.desc}</p>
        </div>
        <div style={{textAlign:"center",marginBottom:6}}>
          <span style={{fontSize:13,color:"#8A8A8A",textDecoration:"line-through",marginRight:8}}>R$29,90/mês</span>
          <span style={{fontSize:36,fontWeight:900,color:"#2C2C2C"}}>R${PRICE}</span>
          <span style={{fontSize:13,color:"#8A8A8A"}}>/mês</span>
        </div>
        <p style={{textAlign:"center",fontSize:13,color:"#2D6A4F",fontWeight:700,margin:"0 0 16px"}}>✅ 7 dias grátis para começar</p>
        <Btn full variant="amber" onClick={onUpgrade}>Desbloquear Evolução — 7 dias grátis →</Btn>
        <Btn full onClick={onClose} variant="ghost" style={{marginTop:8}}>Agora não</Btn>
      </div>
    </div>
  );
}

function StreakCelebration({streak,onClose,onUpgrade}){
  const msgs={7:"Uma semana inteira! 🎉",14:"Duas semanas seguidas! 🔥",21:"21 dias — um hábito nasceu! ⭐",30:"30 dias! Você é incrível! 🏆",60:"60 dias de consistência! 💎",90:"90 dias! Lendária! 👑"};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"#fff",borderRadius:28,padding:32,textAlign:"center",maxWidth:340,width:"100%"}}>
        <div style={{fontSize:72,marginBottom:8}}>🎉</div>
        <h2 style={{fontSize:24,fontWeight:900,color:"#2D6A4F",margin:"0 0 8px"}}>{streak} dias seguidos!</h2>
        <p style={{fontSize:15,color:"#2C2C2C",margin:"0 0 6px",fontWeight:600}}>{msgs[streak]}</p>
        <p style={{fontSize:13,color:"#8A8A8A",margin:"0 0 22px",lineHeight:1.5}}>Mostre essa evolução pro seu médico com um relatório completo.</p>
        <div style={{background:"#FEF3C7",borderRadius:14,padding:12,marginBottom:18,border:"1px solid #F59E0B"}}>
          <p style={{fontSize:13,fontWeight:800,color:"#92400E",margin:"0 0 2px"}}>✨ Oferta especial</p>
          <p style={{fontSize:13,color:"#92400E",margin:0}}>7 dias grátis do Plano Evolução</p>
        </div>
        <Btn full onClick={onUpgrade} variant="amber">Desbloquear Evolução grátis →</Btn>
        <Btn full onClick={onClose} variant="ghost" style={{marginTop:8}}>Continuar no gratuito</Btn>
      </div>
    </div>
  );
}

function UpgradeScreen({onUpgrade}){
  const items=["Histórico completo de check-ins","Evolução corporal (peso e medidas)","Galeria de Transformação com fotos","25 receitas para GLP-1","15 treinos adaptados em casa","Playlists motivacionais","Relatório PDF para profissionais","Compartilhar com médico/nutricionista"];
  return (
    <div>
      <div style={{background:"linear-gradient(160deg,#F59E0B,#D97706)",padding:"32px 24px 28px",borderRadius:"0 0 32px 32px",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:10}}>✨</div>
        <h2 style={{color:"#fff",fontSize:22,fontWeight:900,margin:"0 0 6px"}}>Plano Evolução</h2>
        <p style={{color:"rgba(255,255,255,.85)",fontSize:13,margin:"0 0 16px"}}>Desbloqueie tudo e acompanhe sua jornada</p>
        <div style={{background:"rgba(255,255,255,.2)",borderRadius:16,padding:"14px 20px",display:"inline-block"}}>
          <p style={{color:"rgba(255,255,255,.7)",fontSize:12,margin:"0 0 2px",textDecoration:"line-through"}}>R$29,90/mês</p>
          <p style={{color:"#fff",fontSize:38,fontWeight:900,margin:"0 0 2px"}}>R${PRICE}<span style={{fontSize:15,fontWeight:400}}>/mês</span></p>
          <p style={{color:"rgba(255,255,255,.9)",fontSize:13,fontWeight:700,margin:0}}>✅ 7 dias grátis</p>
        </div>
      </div>
      <div style={{padding:"20px 16px",display:"flex",flexDirection:"column",gap:12}}>
        <Card>
          <p style={{fontSize:13,fontWeight:800,color:"#2C2C2C",margin:"0 0 12px"}}>🔓 O que você desbloqueia</p>
          {items.map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<items.length-1?"1px solid #F0EBE3":"none"}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:"linear-gradient(135deg,#A8D5BA,#2D6A4F)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,color:"#fff"}}>✓</div>
              <span style={{fontSize:13,color:"#2C2C2C"}}>{item}</span>
            </div>
          ))}
        </Card>
        <Btn full variant="amber" onClick={onUpgrade}>Assinar agora — 7 dias grátis →</Btn>
        <p style={{textAlign:"center",fontSize:12,color:"#8A8A8A"}}>Cancele quando quiser · Sem fidelidade</p>
      </div>
    </div>
  );
}

export default function App(){
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [screen,setScreen]=useState("splash");
  const [nav,setNav]=useState("home");
  const [toast,setToast]=useState(null);
  const [streakModal,setStreakModal]=useState(null);
  const [gate,setGate]=useState(null);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2800);};
  const openGate=(feature)=>setGate(feature);
  const handleUpgrade=()=>{
    setGate(null);setStreakModal(null);
    goKiwify();
  };

  useEffect(()=>{
    setTimeout(()=>{
      const sess=AUTH.current();
      if(sess){setUser(sess);if(sess.role==="pro"){const p=DB.get("pros",sess.uid);setProfile(p);setScreen("pro");}else{const p=DB.get("users",sess.uid);setProfile(p);setScreen(p?.name?"app":"onboarding");}}
      else setScreen("login");
    },1500);
  },[]);

  useEffect(()=>{
    if(!user||user.role==="pro")return;
    const streak=calcStreak(user.uid);
    const last=DB.get("meta",`streak_${user.uid}`);
    if([7,14,21,30,60,90].includes(streak)&&last?.streak!==streak){setTimeout(()=>setStreakModal(streak),1200);DB.set("meta",`streak_${user.uid}`,{streak});}
  },[user]);

  if(screen==="splash")return <Splash/>;
  if(screen==="login")return <Login onAuth={(sess,p)=>{setUser(sess);setProfile(p);setScreen(sess.role==="pro"?"pro":(p?.name?"app":"onboarding"));}} showToast={showToast}/>;
  if(screen==="onboarding")return <Onboarding user={user} onDone={p=>{setProfile(p);setScreen("app");}} showToast={showToast}/>;
  if(screen==="pro")return <ProApp user={user} profile={profile} showToast={showToast} onLogout={()=>{AUTH.signOut();setUser(null);setProfile(null);setScreen("login");}}/>;

  const isPremium=profile?.plan==="premium";
  const screens={
    home:<Home profile={profile} user={user} goCheckin={()=>setNav("checkin")} isPremium={isPremium} openGate={openGate}/>,
    checkin:<CheckIn profile={profile} user={user} showToast={showToast} onStreakUpdate={s=>{if([7,14,21,30,60,90].includes(s)){const last=DB.get("meta",`streak_${user.uid}`);if(last?.streak!==s){setStreakModal(s);DB.set("meta",`streak_${user.uid}`,{streak:s});}}}}/>,
    timeline:isPremium?<Timeline user={user}/>:<UpgradeScreen onUpgrade={handleUpgrade}/>,
    body:isPremium?<BodyMetrics user={user} showToast={showToast}/>:<UpgradeScreen onUpgrade={handleUpgrade}/>,
    wellness:isPremium?<Wellness/>:<UpgradeScreen onUpgrade={handleUpgrade}/>,
    gallery:isPremium?<Gallery user={user} showToast={showToast}/>:<UpgradeScreen onUpgrade={handleUpgrade}/>,
    report:isPremium?<ReportScreen user={user} profile={profile} showToast={showToast}/>:<UpgradeScreen onUpgrade={handleUpgrade}/>,
    profile:<ProfileScreen profile={profile} user={user} showToast={showToast} isPremium={isPremium} openGate={openGate} onUpgrade={handleUpgrade} onLogout={()=>{AUTH.signOut();setUser(null);setProfile(null);setScreen("login");}}/>,
  };

  if(!profile?.name)return <Onboarding user={user} onDone={p=>{setProfile(p);setScreen("app");}} showToast={showToast}/>;

  return (
    <div style={{background:"#F9F6F2",minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:"'Inter',system-ui,sans-serif"}}>
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
      {streakModal&&<StreakCelebration streak={streakModal} onClose={()=>setStreakModal(null)} onUpgrade={handleUpgrade}/>}
      {gate&&<PremiumGate feature={gate} onClose={()=>setGate(null)} onUpgrade={handleUpgrade}/>}
      <div style={{paddingBottom:80}}>{screens[nav]||screens.home}</div>
      <BottomNav active={nav} setNav={setNav} isPremium={isPremium} openGate={openGate}/>
    </div>
  );
}

function Splash(){return <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#A8D5BA,#2D6A4F)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}><div style={{fontSize:64}}>🌿</div><h1 style={{color:"#fff",fontSize:42,fontWeight:800,margin:0}}>Leve+</h1><p style={{color:"rgba(255,255,255,.85)",fontSize:15,margin:0}}>Sua jornada com leveza e constância</p></div>;}

function Login({onAuth,showToast}){
  const [mode,setMode]=useState("login");const [role,setRole]=useState("patient");
  const [email,setEmail]=useState("");const [pass,setPass]=useState("");const [pass2,setPass2]=useState("");
  const [name,setName]=useState("");const [specialty,setSpecialty]=useState("");
  const [loading,setLoading]=useState(false);const [err,setErr]=useState("");
  const submit=()=>{
    setErr("");if(!email||!pass){setErr("Preencha todos os campos.");return;}setLoading(true);
    try{
      if(mode==="login"){const sess=AUTH.signIn(email,pass);const p=sess.role==="pro"?DB.get("pros",sess.uid):DB.get("users",sess.uid);onAuth(sess,p);}
      else{
        if(pass.length<6){setErr("Mínimo 6 caracteres.");setLoading(false);return;}
        if(pass!==pass2){setErr("Senhas não coincidem.");setLoading(false);return;}
        const sess=AUTH.register(email,pass,role);
        if(role==="pro"){const code=genCode();const p={uid:sess.uid,email,name,specialty,code,patients:[]};DB.set("pros",sess.uid,p);onAuth(sess,p);}
        else{DB.set("users",sess.uid,{email,uid:sess.uid,plan:"free"});onAuth(sess,null);}
      }
    }catch(e){const msgs={"auth/user-not-found":"E-mail não encontrado.","auth/wrong-password":"Senha incorreta.","auth/email-already-in-use":"E-mail já cadastrado."};setErr(msgs[e.message]||"Erro.");setLoading(false);}
  };
  const isLogin=mode==="login";const isPro=role==="pro";
  return (
    <div style={{minHeight:"100vh",background:"#F9F6F2"}}>
      <div style={{background:`linear-gradient(160deg,${isPro?"#1E3A5F":isLogin?"#A8D5BA":"#F2B5C0"},${isPro?"#2d5a9e":isLogin?"#2D6A4F":"#c0617a"})`,padding:"56px 24px 36px",borderRadius:"0 0 40px 40px"}}>
        <div style={{fontSize:40}}>{isPro?"🩺":isLogin?"🌿":"✨"}</div>
        <h1 style={{color:"#fff",fontSize:28,fontWeight:800,margin:"8px 0 4px"}}>{isLogin?(isPro?"Painel Profissional":"Bem-vinda de volta"):(isPro?"Criar conta profissional":"Criar conta")}</h1>
        <p style={{color:"rgba(255,255,255,.8)",margin:0,fontSize:14}}>Leve+ · {isLogin?"Continue sua jornada 💚":"Comece agora 🌱"}</p>
      </div>
      <div style={{padding:"28px 24px"}}>
        {mode==="register"&&<div style={{display:"flex",gap:8,marginBottom:20}}>{[{id:"patient",label:"🌿 Sou paciente"},{id:"pro",label:"🩺 Sou profissional"}].map(r=><div key={r.id} onClick={()=>setRole(r.id)} style={{flex:1,textAlign:"center",padding:"10px 8px",borderRadius:12,border:`2px solid ${role===r.id?(isPro?"#3B7DD8":"#2D6A4F"):"#E0D8CF"}`,background:role===r.id?(isPro?"#EEF4FF":"rgba(168,213,186,.3)"):"#fff",fontWeight:role===r.id?700:400,fontSize:13,color:role===r.id?(isPro?"#1E3A5F":"#2D6A4F"):"#2C2C2C",cursor:"pointer"}}>{r.label}</div>)}</div>}
        {mode==="register"&&isPro&&<><Input label="Nome completo" value={name} onChange={setName} placeholder="Dr(a). Nome Sobrenome"/><Input label="Especialidade" value={specialty} onChange={setSpecialty} placeholder="Ex: Nutricionista..."/></>}
        <Input label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com"/>
        <Input label="Senha" type="password" value={pass} onChange={setPass} placeholder={isLogin?"••••••••":"mínimo 6 caracteres"}/>
        {!isLogin&&<Input label="Confirmar senha" type="password" value={pass2} onChange={setPass2} placeholder="repita a senha"/>}
        {err&&<p style={{color:"#e05c6a",fontSize:13,marginTop:-8,marginBottom:12}}>{err}</p>}
        <Btn full onClick={submit} loading={loading} variant={isPro?"pro":isLogin?"primary":"rose"}>{isLogin?"Entrar":"Criar conta"}</Btn>
        <p style={{textAlign:"center",marginTop:20,fontSize:14,color:"#8A8A8A"}}>{isLogin?"Não tem conta?":"Já tem conta?"}{" "}<span onClick={()=>{setMode(isLogin?"register":"login");setErr("");}} style={{color:"#2D6A4F",fontWeight:700,cursor:"pointer"}}>{isLogin?"Criar agora":"Entrar"}</span></p>
      </div>
    </div>
  );
}

function Onboarding({user,onDone,showToast}){
  const [step,setStep]=useState(0);const [loading,setLoading]=useState(false);
  const [data,setData]=useState({name:"",goal:"",motivation:"",weight:"",proteinGoal:"100",waterGoal:"2000",medication:"",startDate:todayKey()});
  const set=(k,v)=>setData(p=>({...p,[k]:v}));
  const goals=["Perder peso com saúde","Manter o peso conquistado","Melhorar hábitos e energia","Controlar sintomas do GLP-1","Ter mais consistência"];
  const meds=["Ozempic (semaglutida)","Wegovy (semaglutida)","Mounjaro (tirzepatida)","Saxenda (liraglutida)","Outro GLP-1","Suplemento próprio","Prefiro não informar"];
  const steps=[
    <div key={0}><div style={{fontSize:48,marginBottom:12}}>👋</div><h2 style={{fontSize:24,fontWeight:800,color:"#2D6A4F",margin:"0 0 8px"}}>Qual é o seu nome?</h2><Input value={data.name} onChange={v=>set("name",v)} placeholder="Seu nome"/></div>,
    <div key={1}><div style={{fontSize:48,marginBottom:12}}>🎯</div><h2 style={{fontSize:22,fontWeight:800,color:"#2D6A4F",margin:"0 0 16px"}}>Qual é o seu objetivo?</h2><div style={{display:"flex",flexDirection:"column",gap:10}}>{goals.map(g=><div key={g} onClick={()=>set("goal",g)} style={{padding:"14px 18px",borderRadius:14,border:`2px solid ${data.goal===g?"#2D6A4F":"#E0D8CF"}`,background:data.goal===g?"rgba(168,213,186,.3)":"#fff",cursor:"pointer",fontWeight:data.goal===g?700:400,color:data.goal===g?"#2D6A4F":"#2C2C2C",fontSize:14}}>{g}</div>)}</div></div>,
    <div key={2}><div style={{fontSize:48,marginBottom:12}}>💭</div><h2 style={{fontSize:22,fontWeight:800,color:"#2D6A4F",margin:"0 0 8px"}}>O que te motiva?</h2><textarea value={data.motivation} onChange={e=>set("motivation",e.target.value)} placeholder="Ex: Quero me sentir mais leve..." style={{width:"100%",minHeight:100,padding:"12px 16px",borderRadius:14,border:"1.5px solid #E0D8CF",fontSize:14,color:"#2C2C2C",resize:"none",boxSizing:"border-box",fontFamily:"inherit",marginTop:16}}/></div>,
    <div key={3}><div style={{fontSize:48,marginBottom:12}}>⚖️</div><h2 style={{fontSize:22,fontWeight:800,color:"#2D6A4F",margin:"0 0 8px"}}>Peso atual e metas</h2><Input label="Peso atual (kg)" type="number" value={data.weight} onChange={v=>set("weight",v)} placeholder="Ex: 78.5" step="0.1"/><Input label="Meta proteína (g/dia)" type="number" value={data.proteinGoal} onChange={v=>set("proteinGoal",v)} placeholder="Ex: 100"/><Input label="Meta água (ml/dia)" type="number" value={data.waterGoal} onChange={v=>set("waterGoal",v)} placeholder="Ex: 2000"/></div>,
    <div key={4}><div style={{fontSize:48,marginBottom:12}}>💊</div><h2 style={{fontSize:22,fontWeight:800,color:"#2D6A4F",margin:"0 0 8px"}}>Medicamento</h2><p style={{color:"#8A8A8A",fontSize:13,marginBottom:16}}>Apenas para lembretes. Não prescrevemos doses.</p><div style={{display:"flex",flexDirection:"column",gap:8}}>{meds.map(m=><div key={m} onClick={()=>set("medication",m)} style={{padding:"12px 16px",borderRadius:12,border:`2px solid ${data.medication===m?"#2D6A4F":"#E0D8CF"}`,background:data.medication===m?"rgba(168,213,186,.3)":"#fff",cursor:"pointer",fontWeight:data.medication===m?700:400,color:data.medication===m?"#2D6A4F":"#2C2C2C",fontSize:14}}>{m}</div>)}</div></div>,
    <div key={5}><div style={{fontSize:48,marginBottom:12}}>📅</div><h2 style={{fontSize:22,fontWeight:800,color:"#2D6A4F",margin:"0 0 8px"}}>Quando começou?</h2><Input label="Data de início" type="date" value={data.startDate} onChange={v=>set("startDate",v)}/></div>,
  ];
  const canNext=[data.name.trim(),data.goal,true,data.weight,data.medication,true][step];
  const isLast=step===steps.length-1;
  const finish=()=>{setLoading(true);const code=genCode();const p={...data,email:user?.email,uid:user?.uid,plan:"free",shareCode:code};DB.set("users",user.uid,p);showToast("Bem-vinda ao Leve+! 🌿");onDone(p);};
  return (
    <div style={{minHeight:"100vh",background:"#F9F6F2"}}>
      <div style={{background:"linear-gradient(160deg,rgba(168,213,186,.8),#fff)",padding:"40px 24px 24px"}}>
        <div style={{display:"flex",gap:6,marginBottom:24}}>{steps.map((_,i)=><div key={i} style={{flex:1,height:4,borderRadius:99,background:i<=step?"#2D6A4F":"#E0D8CF",transition:"background .3s"}}/>)}</div>
        {steps[step]}
      </div>
      <div style={{padding:24}}>
        <Btn full onClick={isLast?finish:()=>setStep(s=>s+1)} disabled={!canNext} loading={isLast&&loading}>{isLast?"Começar minha jornada 🌿":"Continuar →"}</Btn>
        {step>0&&<Btn full variant="ghost" onClick={()=>setStep(s=>s-1)} style={{marginTop:8}}>Voltar</Btn>}
      </div>
    </div>
  );
}

function Home({profile,user,goCheckin,isPremium,openGate}){
  const dk=todayKey();
  const log=DB.get("daily_logs",`${profile?.uid}_${dk}`)||{};
  const water=log.water||0;const protein=log.protein||0;
  const wGoal=parseInt(profile?.waterGoal||2000);const pGoal=parseInt(profile?.proteinGoal||100);
  const day=dayOfJourney(profile?.startDate);
  const streak=calcStreak(profile?.uid);
  const consistency=calcConsistency(profile?.uid);
  const hour=new Date().getHours();
  const greeting=hour<12?"Bom dia":hour<18?"Boa tarde":"Boa noite";
  const msgs=DB.query("messages","toUid",profile?.uid).filter(m=>!m.read);
  const recipe=RECIPES[new Date().getDay()%RECIPES.length];
  const workout=WORKOUTS[new Date().getDay()%WORKOUTS.length];
  const playlist=PLAYLISTS[new Date().getDay()%PLAYLISTS.length];
  return (
    <div style={{paddingBottom:16}}>
      <div style={{background:"linear-gradient(160deg,#A8D5BA,#2D6A4F)",padding:"48px 24px 24px",borderRadius:"0 0 32px 32px"}}>
        <p style={{color:"rgba(255,255,255,.8)",fontSize:13,margin:"0 0 2px"}}>{greeting} ✨ Dia {day} da sua jornada</p>
        <h1 style={{color:"#fff",fontSize:26,fontWeight:800,margin:"0 0 14px"}}>Olá, {profile?.name?.split(" ")[0]||"linda"}! 🌿</h1>
        <div style={{display:"flex",gap:8}}>
          <div style={{background:"rgba(255,255,255,.18)",borderRadius:14,padding:"8px 12px",flex:1,textAlign:"center"}}><p style={{fontSize:20,fontWeight:900,color:"#fff",margin:"0 0 2px"}}>{streak}</p><p style={{fontSize:10,color:"rgba(255,255,255,.8)",margin:0}}>🔥 streak</p></div>
          <div style={{background:"rgba(255,255,255,.18)",borderRadius:14,padding:"8px 12px",flex:1,textAlign:"center"}}><p style={{fontSize:20,fontWeight:900,color:consistency>=80?"#A8FFD0":consistency>=50?"#FFE680":"#FFB3B3",margin:"0 0 2px"}}>{consistency}%</p><p style={{fontSize:10,color:"rgba(255,255,255,.8)",margin:0}}>⭐ 30 dias</p></div>
          <div style={{background:"rgba(255,255,255,.18)",borderRadius:14,padding:"8px 12px",flex:1,textAlign:"center"}}><p style={{fontSize:20,fontWeight:900,color:"#fff",margin:"0 0 2px"}}>{day}</p><p style={{fontSize:10,color:"rgba(255,255,255,.8)",margin:0}}>📅 total</p></div>
        </div>
      </div>
      <div style={{padding:"20px 16px",display:"flex",flexDirection:"column",gap:14}}>
        {!isPremium&&<div onClick={()=>openGate("default")} style={{background:"linear-gradient(135deg,#FEF3C7,#fff)",borderRadius:20,padding:"14px 18px",border:"1.5px solid #F59E0B",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:28}}>✨</span><div style={{flex:1}}><p style={{fontWeight:800,color:"#92400E",fontSize:13,margin:"0 0 2px"}}>Plano Evolução — R${PRICE}/mês</p><p style={{fontSize:12,color:"#B45309",margin:0}}>Histórico, medidas, galeria, relatórios →</p></div></div>}
        {msgs.length>0&&<Card style={{background:"linear-gradient(135deg,#EEF4FF,#fff)",border:"1.5px solid #C7D9F5"}}><div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:28}}>🩺</span><div><p style={{fontWeight:700,color:"#1E3A5F",margin:"0 0 2px",fontSize:14}}>{msgs.length} mensagem{msgs.length>1?"s":""} do profissional</p><p style={{fontSize:12,color:"#8A8A8A",margin:0}}>{msgs[0].text.slice(0,55)}...</p></div></div></Card>}
        <Card>
          <p style={{fontSize:13,fontWeight:700,color:"#2D6A4F",margin:"0 0 14px"}}>📊 Hoje até agora</p>
          <div style={{marginBottom:14}}><ProgressBar value={protein} max={pGoal} color="#F2B5C0" label="Proteína" sublabel={`${protein}g / ${pGoal}g`}/></div>
          <ProgressBar value={water} max={wGoal} color="#A8D5BA" label="Hidratação" sublabel={`${water}ml / ${wGoal}ml`}/>
        </Card>
        {!log.mood
          ?<div style={{background:"linear-gradient(135deg,rgba(242,181,192,.6),rgba(168,213,186,.6))",borderRadius:20,padding:18,textAlign:"center"}}><p style={{fontSize:15,fontWeight:700,color:"#2D6A4F",margin:"0 0 10px"}}>✅ Fazer check-in de hoje</p><Btn onClick={goCheckin} small>Fazer Check-in</Btn></div>
          :<Card style={{background:"linear-gradient(135deg,rgba(168,213,186,.3),#fff)"}}><p style={{fontSize:13,fontWeight:700,color:"#2D6A4F",margin:"0 0 4px"}}>✅ Check-in concluído! Streak: {streak} dias 🔥</p></Card>
        }
        {isPremium&&<>
          <Card><p style={{fontSize:12,color:"#8A8A8A",margin:"0 0 6px",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>🍽 Receita do dia</p><div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:36}}>{recipe.emoji}</span><div><p style={{fontWeight:700,color:"#2C2C2C",margin:"0 0 2px",fontSize:15}}>{recipe.name}</p><p style={{fontSize:12,color:"#8A8A8A",margin:0}}>{recipe.prot}g prot · {recipe.kcal} kcal · {recipe.time}</p></div></div></Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card style={{padding:14}}><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 6px",fontWeight:600}}>🏋️ TREINO</p><p style={{fontSize:14,fontWeight:700,color:"#2C2C2C",margin:"0 0 2px"}}>{workout.emoji} {workout.name}</p><p style={{fontSize:11,color:"#8A8A8A",margin:0}}>{workout.duration}</p></Card>
            <Card style={{padding:14}}><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 6px",fontWeight:600}}>🎵 PLAYLIST</p><p style={{fontSize:14,fontWeight:700,color:"#2C2C2C",margin:"0 0 2px"}}>{playlist.emoji} {playlist.name}</p><p style={{fontSize:11,color:"#8A8A8A",margin:0}}>{playlist.songs} músicas</p></Card>
          </div>
        </>}
        {!isPremium&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{icon:"⚖️",label:"Medidas"},{icon:"✨",label:"Galeria"},{icon:"🌿",label:"Bem-estar"},{icon:"📄",label:"Relatório"}].map((item,i)=>(
            <div key={i} onClick={()=>openGate(["body","gallery","wellness","report"][i])} style={{background:"#fff",borderRadius:16,padding:14,boxShadow:"0 2px 8px rgba(0,0,0,.06)",cursor:"pointer",textAlign:"center",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"rgba(255,255,255,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1}}><span style={{fontSize:18}}>🔒</span></div>
              <span style={{fontSize:28,display:"block",marginBottom:6,opacity:.4}}>{item.icon}</span>
              <p style={{fontSize:11,fontWeight:700,color:"#8A8A8A",margin:0,opacity:.5}}>{item.label}</p>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}

function CheckIn({profile,user,showToast,onStreakUpdate}){
  const dk=todayKey();const ex=DB.get("daily_logs",`${user?.uid}_${dk}`)||{};
  const [water,setWater]=useState(ex.water||0);const [protein,setProtein]=useState(ex.protein||0);
  const [mood,setMood]=useState(ex.mood||"");const [symptoms,setSymptoms]=useState(ex.symptoms||[]);
  const [saving,setSaving]=useState(false);
  const wGoal=parseInt(profile?.waterGoal||2000);const pGoal=parseInt(profile?.proteinGoal||100);
  const save=()=>{setSaving(true);DB.set("daily_logs",`${user.uid}_${dk}`,{water,protein,mood,symptoms,dateKey:dk,uid:user.uid});const streak=calcStreak(user.uid);setTimeout(()=>{setSaving(false);showToast(`Check-in salvo! ✅ Streak: ${streak} dias 🔥`);onStreakUpdate?.(streak);},400);};
  return (
    <div>
      <div style={{background:"linear-gradient(160deg,#A8D5BA,#2D6A4F)",padding:"48px 24px 28px",borderRadius:"0 0 32px 32px"}}>
        <h1 style={{color:"#fff",fontSize:24,fontWeight:800,margin:"0 0 4px"}}>✅ Check-in de Hoje</h1>
        <p style={{color:"rgba(255,255,255,.8)",fontSize:14,margin:0}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</p>
      </div>
      <div style={{padding:"20px 16px",display:"flex",flexDirection:"column",gap:14}}>
        <Card><p style={{fontSize:14,fontWeight:700,color:"#2D6A4F",margin:"0 0 12px"}}>💧 Hidratação</p><ProgressBar value={water} max={wGoal} color="#A8D5BA" sublabel={`${water} / ${wGoal} ml`}/><div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>{[150,250,300,500].map(ml=><Btn key={ml} small onClick={()=>setWater(w=>Math.max(0,w+ml))} variant="outline">+{ml}ml</Btn>)}<Btn small onClick={()=>setWater(w=>Math.max(0,w-250))} variant="ghost">-250ml</Btn></div></Card>
        <Card><p style={{fontSize:14,fontWeight:700,color:"#2D6A4F",margin:"0 0 12px"}}>🥩 Proteína</p><ProgressBar value={protein} max={pGoal} color="#F2B5C0" sublabel={`${protein}g / ${pGoal}g`}/><div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>{[10,20,30,50].map(g=><Btn key={g} small onClick={()=>setProtein(p=>Math.max(0,p+g))} variant="outline">+{g}g</Btn>)}<Btn small onClick={()=>setProtein(p=>Math.max(0,p-10))} variant="ghost">-10g</Btn></div></Card>
        <Card><p style={{fontSize:14,fontWeight:700,color:"#2D6A4F",margin:"0 0 12px"}}>😊 Como você está?</p><div style={{display:"flex",flexDirection:"column",gap:8}}>{MOODS.map(m=><div key={m} onClick={()=>setMood(m)} style={{padding:"12px 16px",borderRadius:12,border:`2px solid ${mood===m?"#2D6A4F":"#E0D8CF"}`,background:mood===m?"rgba(168,213,186,.3)":"#fff",cursor:"pointer",fontWeight:mood===m?700:400,color:mood===m?"#2D6A4F":"#2C2C2C",fontSize:14}}>{m}</div>)}</div></Card>
        <Card><p style={{fontSize:14,fontWeight:700,color:"#2D6A4F",margin:"0 0 4px"}}>🩺 Sintomas</p><p style={{fontSize:12,color:"#8A8A8A",margin:"0 0 14px"}}>Selecione os que sentiu</p><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{SYMPTOMS.map(s=><div key={s} onClick={()=>setSymptoms(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])} style={{padding:"8px 14px",borderRadius:99,border:`2px solid ${symptoms.includes(s)?"#F2B5C0":"#E0D8CF"}`,background:symptoms.includes(s)?"rgba(242,181,192,.3)":"#fff",cursor:"pointer",fontSize:12,fontWeight:symptoms.includes(s)?700:400,color:symptoms.includes(s)?"#c0617a":"#2C2C2C"}}>{s}</div>)}</div></Card>
        <Btn full onClick={save} loading={saving}>Salvar Check-in</Btn>
      </div>
    </div>
  );
}

function Timeline({user}){
  const entries=last30().map(dk=>({dk,log:DB.get("daily_logs",`${user?.uid}_${dk}`),metric:DB.get("body_metrics",`${user?.uid}_${dk}`)})).filter(e=>e.log||e.metric);
  return (
    <div>
      <div style={{background:"linear-gradient(160deg,#F5EDE3,rgba(242,181,192,.6))",padding:"48px 24px 28px",borderRadius:"0 0 32px 32px"}}>
        <h1 style={{fontSize:24,fontWeight:800,color:"#2D6A4F",margin:"0 0 4px"}}>📅 Histórico</h1>
        <p style={{color:"#8A8A8A",fontSize:14,margin:0}}>{entries.length} registros — últimos 30 dias</p>
      </div>
      <div style={{padding:"20px 16px",display:"flex",flexDirection:"column",gap:12}}>
        {entries.length===0&&<div style={{textAlign:"center",padding:"48px 24px"}}><p style={{fontSize:48}}>📋</p><p style={{color:"#8A8A8A"}}>Nenhum registro ainda.</p></div>}
        {entries.map(({dk,log,metric})=>(
          <Card key={dk}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><p style={{fontWeight:700,color:"#2D6A4F",margin:0,fontSize:14}}>{fmtDate(dk)}</p>{log?.mood&&<span style={{fontSize:12,background:"rgba(168,213,186,.4)",color:"#2D6A4F",padding:"3px 10px",borderRadius:99,fontWeight:600}}>{log.mood}</span>}</div>
            {log&&<div style={{display:"flex",gap:16,marginBottom:metric?10:0}}>{log.water>0&&<div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>💧</p><p style={{fontSize:14,fontWeight:700,color:"#2C2C2C",margin:0}}>{log.water}ml</p></div>}{log.protein>0&&<div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>🥩</p><p style={{fontSize:14,fontWeight:700,color:"#2C2C2C",margin:0}}>{log.protein}g</p></div>}{log.symptoms?.length>0&&<div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>🩺</p><p style={{fontSize:13,color:"#2C2C2C",margin:0}}>{log.symptoms.slice(0,2).join(", ")}</p></div>}</div>}
            {metric&&<div style={{display:"flex",gap:12,borderTop:log?"1px solid #F0EBE3":"none",paddingTop:log?10:0}}>{metric.weight&&<div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>⚖️</p><p style={{fontSize:14,fontWeight:700,color:"#2D6A4F",margin:0}}>{metric.weight} kg</p></div>}{metric.waist&&<div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>📏</p><p style={{fontSize:14,fontWeight:700,color:"#2C2C2C",margin:0}}>{metric.waist} cm</p></div>}</div>}
          </Card>
        ))}
      </div>
    </div>
  );
}

function BodyMetrics({user,showToast}){
  const dk=todayKey();const ex=DB.get("body_metrics",`${user?.uid}_${dk}`)||{};
  const [weight,setWeight]=useState(ex.weight||"");const [waist,setWaist]=useState(ex.waist||"");
  const [hip,setHip]=useState(ex.hip||"");const [arm,setArm]=useState(ex.arm||"");const [thigh,setThigh]=useState(ex.thigh||"");
  const [saving,setSaving]=useState(false);const [tab,setTab]=useState("register");
  const history=last30().map(d=>({dk:d,...DB.get("body_metrics",`${user?.uid}_${d}`)||{}})).filter(r=>r.weight||r.waist);
  const save=()=>{if(!weight&&!waist&&!hip&&!arm&&!thigh){showToast("Preencha ao menos um campo.","error");return;}setSaving(true);DB.set("body_metrics",`${user.uid}_${dk}`,{weight:weight||null,waist:waist||null,hip:hip||null,arm:arm||null,thigh:thigh||null,dateKey:dk,uid:user.uid});setTimeout(()=>{setSaving(false);showToast("Medidas salvas! 📏");},400);};
  return (
    <div>
      <div style={{background:"linear-gradient(160deg,#F5EDE3,rgba(242,181,192,.5))",padding:"48px 24px 24px",borderRadius:"0 0 32px 32px"}}>
        <h1 style={{fontSize:24,fontWeight:800,color:"#2D6A4F",margin:"0 0 4px"}}>⚖️ Evolução Corporal</h1>
        <div style={{display:"flex",background:"rgba(255,255,255,.6)",borderRadius:99,padding:4,gap:4,marginTop:16}}>
          {["register","history"].map(t=><div key={t} onClick={()=>setTab(t)} style={{flex:1,textAlign:"center",padding:8,borderRadius:99,background:tab===t?"#fff":"transparent",fontWeight:tab===t?700:400,fontSize:13,color:tab===t?"#2D6A4F":"#8A8A8A",cursor:"pointer"}}>{t==="register"?"Registrar":"Histórico"}</div>)}
        </div>
      </div>
      <div style={{padding:"20px 16px"}}>
        {tab==="register"&&<Card><Input label="Peso (kg)" type="number" value={weight} onChange={setWeight} placeholder="Ex: 75.5" step="0.1"/><Input label="Cintura (cm)" type="number" value={waist} onChange={setWaist} placeholder="Ex: 82"/><Input label="Quadril (cm)" type="number" value={hip} onChange={setHip} placeholder="Ex: 100"/><Input label="Braço (cm)" type="number" value={arm} onChange={setArm} placeholder="Ex: 30"/><Input label="Coxa (cm)" type="number" value={thigh} onChange={setThigh} placeholder="Ex: 58"/><Btn full onClick={save} loading={saving}>Salvar Medidas</Btn></Card>}
        {tab==="history"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>{history.length===0&&<div style={{textAlign:"center",padding:"40px 0"}}><p style={{fontSize:40}}>📏</p><p style={{color:"#8A8A8A"}}>Nenhuma medida ainda.</p></div>}{history.map(m=><Card key={m.dk}><p style={{fontWeight:700,color:"#2D6A4F",fontSize:13,margin:"0 0 10px"}}>{fmtDate(m.dk)}</p><div style={{display:"flex",flexWrap:"wrap",gap:14}}>{m.weight&&<div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>Peso</p><p style={{fontWeight:700,fontSize:16,color:"#2D6A4F",margin:0}}>{m.weight} kg</p></div>}{m.waist&&<div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>Cintura</p><p style={{fontWeight:700,fontSize:16,color:"#2C2C2C",margin:0}}>{m.waist} cm</p></div>}{m.hip&&<div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>Quadril</p><p style={{fontWeight:700,fontSize:16,color:"#2C2C2C",margin:0}}>{m.hip} cm</p></div>}{m.arm&&<div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>Braço</p><p style={{fontWeight:700,fontSize:16,color:"#2C2C2C",margin:0}}>{m.arm} cm</p></div>}{m.thigh&&<div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>Coxa</p><p style={{fontWeight:700,fontSize:16,color:"#2C2C2C",margin:0}}>{m.thigh} cm</p></div>}</div></Card>)}</div>}
      </div>
    </div>
  );
}

function Wellness(){
  const [tab,setTab]=useState("recipes");const [catR,setCatR]=useState("Todas");const [catW,setCatW]=useState("Todos");const [catP,setCatP]=useState("Todas");const [sel,setSel]=useState(null);
  const wCats=["Todos","Glúteos","Pernas","Superiores","Full Body","Core","Caminhada","Mobilidade","Funcional"];
  const fR=catR==="Todas"?RECIPES:RECIPES.filter(r=>r.cat===catR);
  const fW=catW==="Todos"?WORKOUTS:WORKOUTS.filter(w=>w.cat===catW);
  const fP=catP==="Todas"?PLAYLISTS:PLAYLISTS.filter(p=>p.cat===catP);
  return (
    <div>
      {sel&&<DetailModal item={sel} onClose={()=>setSel(null)}/>}
      <div style={{background:"linear-gradient(160deg,rgba(168,213,186,.8),#F5EDE3)",padding:"48px 24px 20px",borderRadius:"0 0 32px 32px"}}>
        <h1 style={{fontSize:24,fontWeight:800,color:"#2D6A4F",margin:"0 0 20px"}}>🌿 Bem-estar</h1>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>{[{id:"recipes",label:"🍽 Receitas"},{id:"workouts",label:"🏋️ Treinos"},{id:"playlists",label:"🎵 Playlists"}].map(t=><div key={t.id} onClick={()=>setTab(t.id)} style={{whiteSpace:"nowrap",padding:"8px 16px",borderRadius:99,background:tab===t.id?"#2D6A4F":"rgba(255,255,255,.7)",color:tab===t.id?"#fff":"#8A8A8A",fontWeight:tab===t.id?700:400,fontSize:13,cursor:"pointer"}}>{t.label}</div>)}</div>
      </div>
      <div style={{padding:16}}>
        {tab==="recipes"&&<><div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:12}}>{["Todas","Alta Proteína","Intestino Preso","Falta de Apetite","Café da Manhã","Lanches Leves"].map(c=><div key={c} onClick={()=>setCatR(c)} style={{whiteSpace:"nowrap",padding:"6px 14px",borderRadius:99,background:catR===c?"#F2B5C0":"#F0EBE3",color:catR===c?"#fff":"#8A8A8A",fontSize:12,fontWeight:catR===c?700:400,cursor:"pointer"}}>{c}</div>)}</div><div style={{display:"flex",flexDirection:"column",gap:12}}>{fR.map(r=><Card key={r.id} onClick={()=>setSel({type:"recipe",...r})} style={{cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:14}}><span style={{fontSize:40}}>{r.emoji}</span><div style={{flex:1}}><p style={{fontWeight:700,color:"#2C2C2C",margin:"0 0 3px",fontSize:15}}>{r.name}</p><div style={{display:"flex",gap:10}}><span style={{fontSize:11,color:"#8A8A8A"}}>{r.prot}g prot</span><span style={{fontSize:11,color:"#8A8A8A"}}>{r.kcal} kcal</span><span style={{fontSize:11,color:"#8A8A8A"}}>⏱ {r.time}</span></div></div><span style={{color:"#8A8A8A",fontSize:18}}>›</span></div></Card>)}</div></>}
        {tab==="workouts"&&<><div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:12}}>{wCats.map(c=><div key={c} onClick={()=>setCatW(c)} style={{whiteSpace:"nowrap",padding:"6px 14px",borderRadius:99,background:catW===c?"#2D6A4F":"#F0EBE3",color:catW===c?"#fff":"#8A8A8A",fontSize:12,fontWeight:catW===c?700:400,cursor:"pointer"}}>{c}</div>)}</div><div style={{display:"flex",flexDirection:"column",gap:12}}>{fW.map(w=><Card key={w.id} onClick={()=>setSel({type:"workout",...w})} style={{cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:14}}><span style={{fontSize:40}}>{w.emoji}</span><div style={{flex:1}}><p style={{fontWeight:700,color:"#2C2C2C",margin:"0 0 3px",fontSize:15}}>{w.name}</p><div style={{display:"flex",gap:10}}><span style={{fontSize:11,color:"#8A8A8A"}}>⏱ {w.duration}</span><span style={{fontSize:11,color:"#8A8A8A"}}>{w.level}</span></div></div><span style={{color:"#8A8A8A",fontSize:18}}>›</span></div></Card>)}</div></>}
        {tab==="playlists"&&<><div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:12}}>{["Todas","Caminhada","Treino","Relaxamento","Foco"].map(c=><div key={c} onClick={()=>setCatP(c)} style={{whiteSpace:"nowrap",padding:"6px 14px",borderRadius:99,background:catP===c?"#F2B5C0":"#F0EBE3",color:catP===c?"#fff":"#8A8A8A",fontSize:12,fontWeight:catP===c?700:400,cursor:"pointer"}}>{c}</div>)}</div><div style={{display:"flex",flexDirection:"column",gap:12}}>{fP.map(p=><Card key={p.id} style={{background:`linear-gradient(135deg,rgba(45,106,79,.15),rgba(168,213,186,.2))`}}><div style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#2D6A4F,#A8D5BA)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{p.emoji}</div><div style={{flex:1}}><p style={{fontWeight:700,color:"#2C2C2C",margin:"0 0 2px",fontSize:15}}>{p.name}</p><p style={{fontSize:12,color:"#8A8A8A",margin:"0 0 4px"}}>{p.vibe}</p></div><a href={p.link} target="_blank" rel="noreferrer" style={{background:"#2D6A4F",color:"#fff",padding:"8px 14px",borderRadius:99,fontSize:12,fontWeight:700,textDecoration:"none"}}>▶</a></div></Card>)}</div></>}
      </div>
    </div>
  );
}

function DetailModal({item,onClose}){
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:999,display:"flex",alignItems:"flex-end"}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:24,width:"100%",maxHeight:"80vh",overflowY:"auto",boxSizing:"border-box"}}><div style={{textAlign:"center",fontSize:52,marginBottom:12}}>{item.emoji}</div><h2 style={{textAlign:"center",fontSize:20,fontWeight:800,color:"#2D6A4F",margin:"0 0 8px"}}>{item.name}</h2>{item.type==="recipe"&&item.steps.map((s,i)=><div key={i} style={{display:"flex",gap:12,marginBottom:10}}><div style={{minWidth:24,height:24,borderRadius:99,background:"#2D6A4F",color:"#fff",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</div><p style={{margin:0,fontSize:14,color:"#2C2C2C",lineHeight:1.5}}>{s}</p></div>)}{item.type==="workout"&&item.exercises.map((e,i)=><div key={i} style={{display:"flex",gap:12,marginBottom:10}}><span style={{fontSize:18}}>💪</span><p style={{margin:0,fontSize:14,color:"#2C2C2C",lineHeight:1.5}}>{e}</p></div>)}<Btn full onClick={onClose} variant="outline" style={{marginTop:16}}>Fechar</Btn></div></div>;
}

function Gallery({user,showToast}){
  const [photos,setPhotos]=useState(()=>DB.query("photos","uid",user?.uid).sort((a,b)=>b.ts-a.ts));
  const [uploading,setUploading]=useState(null);
  const refFrente=useRef();const refLado=useRef();const refCostas=useRef();
  const cats=["Frente","Lado","Costas"];
  const fileRefs={"Frente":refFrente,"Lado":refLado,"Costas":refCostas};
  const handleFile=(cat,e)=>{
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>5*1024*1024){showToast("Máximo 5MB.","error");return;}
    setUploading(cat);
    try{
      const reader=new FileReader();
      reader.onloadend=()=>{
        try{
          if(reader.error){showToast("Erro ao ler arquivo.","error");setUploading(null);return;}
          const result=reader.result;if(!result){showToast("Arquivo inválido.","error");setUploading(null);return;}
          const id=`photo_${user.uid}_${cat}_${Date.now()}`;
          const photo={id,uid:user.uid,photoUrl:result,category:cat,ts:Date.now(),createdAt:new Date().toLocaleDateString("pt-BR")};
          DB.set("photos",id,photo);setPhotos(prev=>[photo,...prev.filter(x=>x.id!==id)]);
          showToast(`Foto de ${cat} salva! ✨`);
        }catch{showToast("Erro ao salvar.","error");}finally{setUploading(null);}
      };
      reader.readAsDataURL(file);
    }catch{showToast("Erro inesperado.","error");setUploading(null);}
    setTimeout(()=>{try{e.target.value="";}catch{}},100);
  };
  const grouped=cats.reduce((acc,c)=>({...acc,[c]:photos.filter(p=>p.category===c)}),{});
  return (
    <div>
      <div style={{background:"linear-gradient(160deg,#1a4030,#2D6A4F)",padding:"48px 24px 28px",borderRadius:"0 0 32px 32px"}}><div style={{fontSize:36,marginBottom:8}}>✨</div><h1 style={{color:"#fff",fontSize:24,fontWeight:800,margin:"0 0 4px"}}>Galeria de Transformação</h1><p style={{color:"rgba(255,255,255,.7)",fontSize:14,margin:0}}>Suas fotos privadas de evolução</p></div>
      <div style={{padding:"20px 16px",display:"flex",flexDirection:"column",gap:16}}>
        <Card>
          <p style={{fontSize:14,fontWeight:700,color:"#2D6A4F",margin:"0 0 6px"}}>📸 Adicionar fotos</p>
          <p style={{fontSize:12,color:"#8A8A8A",margin:"0 0 16px"}}>JPG, PNG ou WEBP até 5MB.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {cats.map(cat=>(
              <div key={cat}>
                <input ref={fileRefs[cat]} type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={e=>handleFile(cat,e)}/>
                <Btn full variant={grouped[cat].length>0?"outline":"primary"} loading={uploading===cat} onClick={()=>fileRefs[cat].current?.click()}>
                  {grouped[cat].length>0?`📷 Atualizar — ${cat} (${grouped[cat].length})`:`📷 Enviar foto — ${cat}`}
                </Btn>
              </div>
            ))}
          </div>
        </Card>
        {cats.map(cat=>grouped[cat].length>0&&(
          <div key={cat}>
            <p style={{fontWeight:700,color:"#2D6A4F",fontSize:14,margin:"0 0 10px"}}>{cat==="Frente"?"👁 Frente":cat==="Lado"?"↔️ Lado":"🔙 Costas"} ({grouped[cat].length})</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {grouped[cat].map(p=>(
                <div key={p.id} style={{position:"relative",borderRadius:14,overflow:"hidden",aspectRatio:"3/4",background:"#eee"}}>
                  <img src={p.photoUrl} alt={p.category} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                  <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.65))",padding:"20px 10px 8px"}}><p style={{color:"#fff",fontSize:10,margin:0}}>{p.createdAt}</p></div>
                  <div onClick={()=>{DB.del("photos",p.id);setPhotos(x=>x.filter(i=>i.id!==p.id));showToast("Foto removida.");}} style={{position:"absolute",top:8,right:8,background:"rgba(255,255,255,.92)",borderRadius:99,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14}}>🗑</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {photos.length===0&&<div style={{textAlign:"center",padding:"40px 0"}}><p style={{fontSize:48}}>✨</p><p style={{fontWeight:700,color:"#2D6A4F",margin:"0 0 6px"}}>Sua galeria está vazia</p><p style={{color:"#8A8A8A",fontSize:13}}>Adicione sua primeira foto!</p></div>}
      </div>
    </div>
  );
}

function ReportScreen({user,profile,showToast}){
  const [from,setFrom]=useState(()=>{const d=new Date();d.setDate(d.getDate()-30);return d.toISOString().slice(0,10);});
  const [to,setTo]=useState(todayKey());const [preview,setPreview]=useState(false);
  const generate=()=>{if(!from||!to){showToast("Selecione o período.","error");return;}setPreview(true);};
  const days=preview?daysRange(from,to):[];
  const logs=days.map(dk=>DB.get("daily_logs",`${user?.uid}_${dk}`)).filter(Boolean);
  const metrics=days.map(dk=>DB.get("body_metrics",`${user?.uid}_${dk}`)).filter(Boolean);
  const avgWater=logs.length?Math.round(logs.reduce((s,l)=>s+(l.water||0),0)/logs.length):0;
  const avgProtein=logs.length?Math.round(logs.reduce((s,l)=>s+(l.protein||0),0)/logs.length):0;
  const checkinDays=logs.filter(l=>l.mood).length;
  const allSymptoms=logs.flatMap(l=>l.symptoms||[]);
  const symptomCount=allSymptoms.reduce((acc,s)=>({...acc,[s]:(acc[s]||0)+1}),{});
  const topSymptoms=Object.entries(symptomCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const firstW=metrics.find(m=>m.weight)?.weight;const lastW=[...metrics].reverse().find(m=>m.weight)?.weight;
  const weightDelta=firstW&&lastW?(parseFloat(lastW)-parseFloat(firstW)).toFixed(1):null;
  return (
    <div>
      <div style={{background:"linear-gradient(160deg,#1E3A5F,#3B7DD8)",padding:"48px 24px 28px",borderRadius:"0 0 32px 32px"}}><div style={{fontSize:36,marginBottom:8}}>📄</div><h1 style={{color:"#fff",fontSize:24,fontWeight:800,margin:"0 0 4px"}}>Relatório de Evolução</h1><p style={{color:"rgba(255,255,255,.75)",fontSize:14,margin:0}}>Compartilhe com seu profissional</p></div>
      <div style={{padding:"20px 16px",display:"flex",flexDirection:"column",gap:14}}>
        {!preview?<Card><p style={{fontSize:14,fontWeight:700,color:"#1E3A5F",margin:"0 0 16px"}}>📅 Selecione o período</p><Input label="De" type="date" value={from} onChange={setFrom}/><Input label="Até" type="date" value={to} onChange={setTo}/><Btn full onClick={generate} variant="pro">Gerar Relatório →</Btn></Card>
        :<>
          <Card style={{border:"2px solid #C7D9F5",background:"#EEF4FF"}}>
            <p style={{fontSize:13,color:"#1E3A5F",fontWeight:800,margin:"0 0 12px"}}>🌿 Leve+ · Relatório · {new Date(from+"T12:00:00").toLocaleDateString("pt-BR")} a {new Date(to+"T12:00:00").toLocaleDateString("pt-BR")}</p>
            <div style={{background:"#fff",borderRadius:14,padding:14,marginBottom:12}}><p style={{fontSize:12,fontWeight:800,color:"#1E3A5F",margin:"0 0 6px"}}>👤 {profile?.name}</p><p style={{fontSize:12,color:"#8A8A8A",margin:"0 0 2px"}}>{profile?.medication}</p><p style={{fontSize:12,color:"#8A8A8A",margin:0}}>Início: {profile?.startDate?new Date(profile.startDate+"T12:00:00").toLocaleDateString("pt-BR"):"—"}</p></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>{[{label:"Check-ins",value:`${checkinDays}d`,icon:"✅"},{label:"Média água",value:`${avgWater}ml`,icon:"💧"},{label:"Média prot.",value:`${avgProtein}g`,icon:"🥩"},{label:"Variação",value:weightDelta!==null?`${weightDelta}kg`:"—",icon:"⚖️",delta:weightDelta}].map((item,i)=><div key={i} style={{background:"#fff",borderRadius:12,padding:12}}><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 4px"}}>{item.icon} {item.label}</p><p style={{fontSize:18,fontWeight:900,color:item.delta&&parseFloat(item.delta)<0?"#2D6A4F":"#1E3A5F",margin:0}}>{item.value}</p></div>)}</div>
            {metrics.length>0&&<div style={{background:"#fff",borderRadius:14,padding:14,marginBottom:12}}><p style={{fontSize:12,fontWeight:800,color:"#1E3A5F",margin:"0 0 8px"}}>📏 Medidas</p>{metrics.slice(0,3).map((m,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<2?"1px solid #F0EBE3":"none"}}><span style={{fontSize:12,color:"#8A8A8A"}}>{fmtDate(m.dateKey)}</span><span style={{fontSize:12,fontWeight:700,color:"#2C2C2C"}}>{m.weight&&`${m.weight}kg`}{m.waist&&` · ${m.waist}cm`}</span></div>)}</div>}
            {topSymptoms.length>0&&<div style={{background:"#fff",borderRadius:14,padding:14,marginBottom:12}}><p style={{fontSize:12,fontWeight:800,color:"#1E3A5F",margin:"0 0 8px"}}>🩺 Sintomas</p>{topSymptoms.map(([s,n])=><div key={s} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #F0EBE3"}}><span style={{fontSize:13,color:"#2C2C2C"}}>{s}</span><span style={{fontSize:12,fontWeight:700,color:"#3B7DD8"}}>{n}x</span></div>)}</div>}
            <div style={{background:"#FFF8F0",borderRadius:12,padding:12,border:"1px solid #F2D8B0"}}><p style={{fontSize:11,color:"#7A5A2A",margin:0,lineHeight:1.6}}>⚠️ Relatório gerado pela paciente no Leve+. Não prescreve tratamentos ou doses.</p></div>
          </Card>
          <Btn full onClick={()=>window.print()} variant="pro">🖨 Imprimir / Salvar PDF</Btn>
          <Btn full onClick={()=>setPreview(false)} variant="ghost">← Novo período</Btn>
        </>}
      </div>
    </div>
  );
}

function ProfileScreen({profile,user,showToast,isPremium,openGate,onUpgrade,onLogout}){
  const [showCode,setShowCode]=useState(false);
  const day=dayOfJourney(profile?.startDate);const streak=calcStreak(user?.uid);const consistency=calcConsistency(user?.uid);
  const msgs=DB.query("messages","toUid",user?.uid);
  return (
    <div>
      <div style={{background:"linear-gradient(160deg,#F5EDE3,rgba(242,181,192,.5))",padding:"48px 24px 32px",borderRadius:"0 0 32px 32px",textAlign:"center"}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#A8D5BA,#2D6A4F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 12px"}}>🌿</div>
        <h1 style={{fontSize:22,fontWeight:800,color:"#2D6A4F",margin:"0 0 4px"}}>{profile?.name}</h1>
        <p style={{color:"#8A8A8A",fontSize:14,margin:"0 0 10px"}}>{user?.email}</p>
        <span style={{fontSize:12,background:isPremium?"linear-gradient(135deg,#F59E0B,#D97706)":"#F0EBE3",color:isPremium?"#fff":"#8A8A8A",padding:"5px 16px",borderRadius:99,fontWeight:700}}>{isPremium?"✨ Plano Evolução":"Plano Gratuito"}</span>
      </div>
      <div style={{padding:"20px 16px",display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <Card style={{textAlign:"center",padding:12}}><p style={{fontSize:22,fontWeight:900,color:"#2D6A4F",margin:"0 0 2px"}}>{day}</p><p style={{fontSize:10,color:"#8A8A8A",margin:0}}>dias totais</p></Card>
          <Card style={{textAlign:"center",padding:12}}><p style={{fontSize:22,fontWeight:900,color:"#F59E0B",margin:"0 0 2px"}}>{streak}</p><p style={{fontSize:10,color:"#8A8A8A",margin:0}}>🔥 streak</p></Card>
          <Card style={{textAlign:"center",padding:12}}><p style={{fontSize:22,fontWeight:900,color:consistency>=70?"#2D6A4F":"#F59E0B",margin:"0 0 2px"}}>{consistency}%</p><p style={{fontSize:10,color:"#8A8A8A",margin:0}}>consistência</p></Card>
        </div>
        {!isPremium&&<div style={{background:"linear-gradient(135deg,#FEF3C7,#fff)",borderRadius:20,padding:18,border:"1.5px solid #F59E0B"}}><p style={{fontWeight:800,color:"#92400E",fontSize:14,margin:"0 0 4px"}}>✨ Desbloqueie o Plano Evolução</p><p style={{fontSize:13,color:"#B45309",margin:"0 0 14px",lineHeight:1.5}}>Histórico, medidas, galeria, receitas, treinos, relatórios e mais.</p><Btn full variant="amber" onClick={onUpgrade} small>Assinar por R${PRICE}/mês · 7 dias grátis</Btn></div>}
        {isPremium&&<Card style={{background:"linear-gradient(135deg,#EEF4FF,#fff)",border:"1.5px solid #C7D9F5"}}><p style={{fontSize:14,fontWeight:700,color:"#1E3A5F",margin:"0 0 8px"}}>🩺 Compartilhar com profissional</p><p style={{fontSize:13,color:"#8A8A8A",margin:"0 0 12px",lineHeight:1.5}}>Compartilhe seu código com médico, nutricionista ou personal.</p>{showCode?<div style={{textAlign:"center",background:"#fff",borderRadius:12,padding:14,border:"1px solid #C7D9F5"}}><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 6px",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>Seu código de acesso</p><p style={{fontSize:30,fontWeight:900,letterSpacing:6,color:"#1E3A5F",margin:"0 0 10px",fontFamily:"monospace"}}>{profile?.shareCode}</p><Btn small onClick={()=>{navigator.clipboard?.writeText(profile?.shareCode);showToast("Código copiado!");}} variant="pro">📋 Copiar</Btn></div>:<Btn full onClick={()=>setShowCode(true)} variant="pro">Ver meu código de acesso</Btn>}</Card>}
        {msgs.length>0&&<Card><p style={{fontSize:14,fontWeight:700,color:"#1E3A5F",margin:"0 0 12px"}}>💬 Mensagens do profissional</p>{msgs.slice(-5).reverse().map((m,i)=><div key={i} style={{background:"#EEF4FF",borderRadius:12,padding:12,marginBottom:8,border:"1px solid #C7D9F5"}}><p style={{fontSize:12,fontWeight:700,color:"#1E3A5F",margin:"0 0 4px"}}>{m.proName||"Profissional"}</p><p style={{fontSize:14,color:"#2C2C2C",margin:"0 0 4px",lineHeight:1.5}}>{m.text}</p><p style={{fontSize:11,color:"#8A8A8A",margin:0}}>{m.sentAt}</p></div>)}</Card>}
        {profile?.goal&&<Card><p style={{fontSize:13,fontWeight:700,color:"#2D6A4F",margin:"0 0 6px"}}>🎯 Objetivo</p><p style={{fontSize:14,color:"#2C2C2C",margin:0}}>{profile.goal}</p></Card>}
        {profile?.medication&&<Card><p style={{fontSize:13,fontWeight:700,color:"#2D6A4F",margin:"0 0 6px"}}>💊 Medicamento</p><p style={{fontSize:14,color:"#2C2C2C",margin:0}}>{profile.medication}</p></Card>}
        <Card style={{background:"#FFF8F0",border:"1.5px solid #F2D8B0"}}><p style={{fontSize:12,fontWeight:700,color:"#B07D3A",margin:"0 0 6px"}}>⚠️ Aviso importante</p><p style={{fontSize:12,color:"#7A5A2A",margin:0,lineHeight:1.6}}>O Leve+ é uma ferramenta de organização pessoal. Não prescreve medicamentos, doses, dietas, treinos ou tratamentos. Sempre siga a orientação do seu profissional de saúde.</p></Card>
        <Btn full variant="outline" onClick={()=>setTimeout(onLogout,300)}>Sair da conta</Btn>
        <p style={{textAlign:"center",fontSize:11,color:"#8A8A8A"}}>Leve+ v1.0 · Feito com 💚 para mulheres em jornada</p>
      </div>
    </div>
  );
}

function ProApp({user,profile,showToast,onLogout}){
  const [tab,setTab]=useState("dashboard");const [sel,setSel]=useState(null);
  if(sel)return <PatientDetail pro={profile} patient={sel} onBack={()=>setSel(null)} showToast={showToast}/>;
  return (
    <div style={{background:"#F9F6F2",minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:"linear-gradient(160deg,#1E3A5F,#3B7DD8)",padding:"48px 24px 24px",borderRadius:"0 0 32px 32px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><p style={{color:"rgba(255,255,255,.75)",fontSize:13,margin:"0 0 2px"}}>🩺 Painel Profissional</p><h1 style={{color:"#fff",fontSize:22,fontWeight:800,margin:"0 0 2px"}}>{profile?.name||"Profissional"}</h1><p style={{color:"rgba(255,255,255,.7)",fontSize:13,margin:0}}>{profile?.specialty}</p></div>
          <Btn small variant="ghost" onClick={onLogout} style={{color:"rgba(255,255,255,.7)"}}>Sair</Btn>
        </div>
        <div style={{display:"flex",gap:8,marginTop:20}}>{[{id:"dashboard",label:"👥 Pacientes"},{id:"code",label:"🔑 Vincular"},{id:"settings",label:"⚙️ Perfil"}].map(t=><div key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 14px",borderRadius:99,background:tab===t.id?"rgba(255,255,255,.25)":"transparent",color:"#fff",fontSize:12,fontWeight:tab===t.id?700:400,cursor:"pointer",border:tab===t.id?"1px solid rgba(255,255,255,.4)":"1px solid transparent"}}>{t.label}</div>)}</div>
      </div>
      <div style={{padding:"20px 16px"}}>
        {tab==="dashboard"&&<ProDashboard pro={profile} onSelect={setSel}/>}
        {tab==="code"&&<ProLinkPatient pro={profile} user={user} showToast={showToast}/>}
        {tab==="settings"&&<ProSettings pro={profile}/>}
      </div>
    </div>
  );
}

function ProDashboard({pro,onSelect}){
  const patients=(pro?.patients||[]).map(uid=>DB.get("users",uid)).filter(Boolean);const dk=todayKey();
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><p style={{fontSize:16,fontWeight:800,color:"#1E3A5F",margin:0}}>Minhas pacientes</p><span style={{fontSize:13,color:"#8A8A8A"}}>{patients.length} vinculada{patients.length!==1?"s":""}</span></div>
      {patients.length===0&&<Card style={{textAlign:"center",padding:40}}><p style={{fontSize:40,marginBottom:12}}>👥</p><p style={{fontWeight:700,color:"#1E3A5F",fontSize:15,margin:"0 0 6px"}}>Nenhuma paciente ainda</p><p style={{color:"#8A8A8A",fontSize:13,margin:0}}>Vá em "Vincular" e insira o código da paciente</p></Card>}
      {patients.map(p=>{
        const log=DB.get("daily_logs",`${p.uid}_${dk}`)||{};const lastMetric=(()=>{for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);const m=DB.get("body_metrics",`${p.uid}_${d.toISOString().slice(0,10)}`);if(m?.weight)return m;}return null;})();
        const streak=calcStreak(p.uid);const consistency=calcConsistency(p.uid);
        return (
          <Card key={p.uid} onClick={()=>onSelect(p)} style={{marginBottom:12,cursor:"pointer",border:"1.5px solid #C7D9F5"}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#A8D5BA,#2D6A4F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🌿</div>
              <div style={{flex:1}}><p style={{fontWeight:700,color:"#2C2C2C",margin:"0 0 2px",fontSize:15}}>{p.name}</p><p style={{fontSize:12,color:"#8A8A8A",margin:0}}>{p.medication||"Medicamento não informado"}</p></div>
              <span style={{color:"#8A8A8A",fontSize:18}}>›</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1,background:"#F9F6F2",borderRadius:10,padding:8,textAlign:"center"}}><p style={{fontSize:15,fontWeight:800,color:"#F59E0B",margin:0}}>{streak}</p><p style={{fontSize:10,color:"#8A8A8A",margin:0}}>🔥</p></div>
              <div style={{flex:1,background:"#F9F6F2",borderRadius:10,padding:8,textAlign:"center"}}><p style={{fontSize:15,fontWeight:800,color:consistency>=70?"#2D6A4F":"#F59E0B",margin:0}}>{consistency}%</p><p style={{fontSize:10,color:"#8A8A8A",margin:0}}>consist.</p></div>
              <div style={{flex:1,background:"#F9F6F2",borderRadius:10,padding:8,textAlign:"center"}}><p style={{fontSize:15,fontWeight:800,color:"#3B7DD8",margin:0}}>{lastMetric?.weight||"—"}</p><p style={{fontSize:10,color:"#8A8A8A",margin:0}}>kg</p></div>
              <div style={{flex:1,background:log.mood?"rgba(168,213,186,.3)":"#F9F6F2",borderRadius:10,padding:8,textAlign:"center"}}><p style={{fontSize:15,fontWeight:800,color:log.mood?"#2D6A4F":"#8A8A8A",margin:0}}>{log.mood?log.mood.split(" ")[0]:"—"}</p><p style={{fontSize:10,color:"#8A8A8A",margin:0}}>hoje</p></div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ProLinkPatient({pro,user,showToast}){
  const [code,setCode]=useState("");const [loading,setLoading]=useState(false);
  const link=()=>{if(code.trim().length<4){showToast("Código inválido.","error");return;}setLoading(true);const allUsers=DB.all("users");const patient=allUsers.find(u=>u.shareCode===code.trim().toUpperCase());if(!patient){showToast("Código não encontrado.","error");setLoading(false);return;}const patients=pro?.patients||[];if(patients.includes(patient.uid)){showToast("Já vinculada.","error");setLoading(false);return;}DB.set("pros",user.uid,{...pro,patients:[...patients,patient.uid]});showToast(`${patient.name} vinculada! 🎉`);setCode("");setLoading(false);window.location.reload();};
  return (
    <div>
      <Card style={{marginBottom:16}}><p style={{fontSize:14,fontWeight:700,color:"#1E3A5F",margin:"0 0 8px"}}>🔑 Vincular nova paciente</p><p style={{fontSize:13,color:"#8A8A8A",margin:"0 0 16px",lineHeight:1.5}}>Insira o código que a paciente encontra no Perfil do app.</p><Input label="Código de acesso" value={code} onChange={v=>setCode(v.toUpperCase())} placeholder="Ex: A1B2C3"/><Btn full onClick={link} loading={loading} variant="pro">Vincular paciente</Btn></Card>
      <Card style={{background:"#EEF4FF",border:"1px solid #C7D9F5"}}><p style={{fontSize:13,fontWeight:700,color:"#1E3A5F",margin:"0 0 6px"}}>💡 Como funciona</p><p style={{fontSize:13,color:"#8A8A8A",margin:0,lineHeight:1.6}}>1. Paciente assina o Plano Evolução<br/>2. Abre o Perfil no Leve+<br/>3. Toca em "Compartilhar com profissional"<br/>4. Te envia o código<br/>5. Você insere aqui</p></Card>
    </div>
  );
}

function PatientDetail({pro,patient,onBack,showToast}){
  const [tab,setTab]=useState("overview");const [note,setNote]=useState("");const [msg,setMsg]=useState("");const [savingNote,setSavingNote]=useState(false);const [sendingMsg,setSendingMsg]=useState(false);
  const logs=last30().map(dk=>({dk,...DB.get("daily_logs",`${patient.uid}_${dk}`)||{}})).filter(l=>l.mood||l.water||l.protein);
  const metrics=last30().map(dk=>({dk,...DB.get("body_metrics",`${patient.uid}_${dk}`)||{}})).filter(m=>m.weight||m.waist);
  const notes=DB.query("pro_notes","patientUid",patient.uid).filter(n=>n.proUid===pro?.uid).sort((a,b)=>b.ts-a.ts);
  const messages=DB.query("messages","toUid",patient.uid).filter(m=>m.proUid===pro?.uid);
  const allSymptoms=logs.flatMap(l=>l.symptoms||[]);const symptomCount=allSymptoms.reduce((acc,s)=>({...acc,[s]:(acc[s]||0)+1}),{});const topSymptoms=Object.entries(symptomCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const streak=calcStreak(patient.uid);const consistency=calcConsistency(patient.uid);
  const saveNote=()=>{if(!note.trim())return;setSavingNote(true);const id=`${pro?.uid}_${patient.uid}_${Date.now()}`;DB.set("pro_notes",id,{id,proUid:pro?.uid,patientUid:patient.uid,text:note,sentAt:new Date().toLocaleDateString("pt-BR"),ts:Date.now()});setSavingNote(false);setNote("");showToast("Anotação salva!");window.location.reload();};
  const sendMsg=()=>{if(!msg.trim())return;setSendingMsg(true);const id=`${patient.uid}_${Date.now()}`;DB.set("messages",id,{id,proUid:pro?.uid,proName:pro?.name||"Profissional",toUid:patient.uid,text:msg,sentAt:new Date().toLocaleDateString("pt-BR"),ts:Date.now(),read:false});setSendingMsg(false);setMsg("");showToast("Mensagem enviada! 💬");};
  return (
    <div style={{background:"#F9F6F2",minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:"linear-gradient(160deg,#1E3A5F,#3B7DD8)",padding:"48px 24px 24px",borderRadius:"0 0 32px 32px"}}>
        <div onClick={onBack} style={{display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",background:"rgba(255,255,255,.2)",borderRadius:99,padding:"6px 14px",marginBottom:16,fontSize:13,color:"#fff",fontWeight:700}}>← Voltar</div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#A8D5BA,#2D6A4F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🌿</div>
          <div><h1 style={{color:"#fff",fontSize:20,fontWeight:800,margin:"0 0 2px"}}>{patient.name}</h1><p style={{color:"rgba(255,255,255,.7)",fontSize:13,margin:0}}>{patient.medication||"GLP-1"} · Dia {dayOfJourney(patient.startDate)}</p></div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:20,overflowX:"auto"}}>{[{id:"overview",label:"📊 Visão"},{id:"history",label:"📅 Histórico"},{id:"notes",label:"📝 Notas"},{id:"messages",label:"💬 Msgs"}].map(t=><div key={t.id} onClick={()=>setTab(t.id)} style={{whiteSpace:"nowrap",padding:"8px 14px",borderRadius:99,background:tab===t.id?"rgba(255,255,255,.25)":"transparent",color:"#fff",fontSize:12,fontWeight:tab===t.id?700:400,cursor:"pointer",border:tab===t.id?"1px solid rgba(255,255,255,.4)":"1px solid transparent"}}>{t.label}</div>)}</div>
      </div>
      <div style={{padding:"20px 16px",display:"flex",flexDirection:"column",gap:14}}>
        {tab==="overview"&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}><Card style={{textAlign:"center",padding:12}}><p style={{fontSize:20,fontWeight:900,color:"#1E3A5F",margin:"0 0 2px"}}>{dayOfJourney(patient.startDate)}</p><p style={{fontSize:10,color:"#8A8A8A",margin:0}}>dias</p></Card><Card style={{textAlign:"center",padding:12}}><p style={{fontSize:20,fontWeight:900,color:"#F59E0B",margin:"0 0 2px"}}>{streak}</p><p style={{fontSize:10,color:"#8A8A8A",margin:0}}>🔥 streak</p></Card><Card style={{textAlign:"center",padding:12}}><p style={{fontSize:20,fontWeight:900,color:consistency>=70?"#2D6A4F":"#F59E0B",margin:"0 0 2px"}}>{consistency}%</p><p style={{fontSize:10,color:"#8A8A8A",margin:0}}>consistência</p></Card></div>
          {patient.goal&&<Card><p style={{fontSize:13,fontWeight:700,color:"#1E3A5F",margin:"0 0 4px"}}>🎯</p><p style={{fontSize:14,color:"#2C2C2C",margin:0}}>{patient.goal}</p></Card>}
          {metrics.length>0&&<Card><p style={{fontSize:14,fontWeight:700,color:"#1E3A5F",margin:"0 0 12px"}}>⚖️ Últimas medidas</p>{metrics.slice(0,3).map((m,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<2?"1px solid #F0EBE3":"none"}}><span style={{fontSize:12,color:"#8A8A8A"}}>{fmtDate(m.dk)}</span><span style={{fontSize:13,fontWeight:700,color:"#2C2C2C"}}>{m.weight&&`${m.weight}kg`}{m.waist&&` · ${m.waist}cm`}</span></div>)}</Card>}
          {topSymptoms.length>0&&<Card><p style={{fontSize:14,fontWeight:700,color:"#1E3A5F",margin:"0 0 12px"}}>🩺 Sintomas (30 dias)</p>{topSymptoms.map(([s,n])=><div key={s} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #F0EBE3"}}><span style={{fontSize:13,color:"#2C2C2C"}}>{s}</span><span style={{fontSize:12,fontWeight:700,color:"#3B7DD8",background:"#EEF4FF",padding:"2px 10px",borderRadius:99}}>{n}x</span></div>)}</Card>}
          <Card><p style={{fontSize:14,fontWeight:700,color:"#1E3A5F",margin:"0 0 12px"}}>💧 Médias 30 dias</p><div style={{display:"flex",gap:16}}><div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>Água/dia</p><p style={{fontSize:18,fontWeight:800,color:"#2C2C2C",margin:0}}>{logs.length?Math.round(logs.reduce((s,l)=>s+(l.water||0),0)/logs.length):0}ml</p></div><div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>Proteína/dia</p><p style={{fontSize:18,fontWeight:800,color:"#2C2C2C",margin:0}}>{logs.length?Math.round(logs.reduce((s,l)=>s+(l.protein||0),0)/logs.length):0}g</p></div><div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>Check-ins</p><p style={{fontSize:18,fontWeight:800,color:"#2C2C2C",margin:0}}>{logs.filter(l=>l.mood).length}</p></div></div></Card>
        </>}
        {tab==="history"&&<>{logs.length===0&&<div style={{textAlign:"center",padding:"40px 0"}}><p style={{fontSize:40}}>📋</p><p style={{color:"#8A8A8A"}}>Nenhum check-in ainda.</p></div>}{logs.map(l=><Card key={l.dk}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><p style={{fontWeight:700,color:"#1E3A5F",margin:0,fontSize:14}}>{fmtDate(l.dk)}</p>{l.mood&&<span style={{fontSize:12,background:"#EEF4FF",color:"#1E3A5F",padding:"3px 10px",borderRadius:99,fontWeight:600}}>{l.mood}</span>}</div><div style={{display:"flex",gap:12}}>{l.water>0&&<div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>💧</p><p style={{fontSize:13,fontWeight:700,color:"#2C2C2C",margin:0}}>{l.water}ml</p></div>}{l.protein>0&&<div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>🥩</p><p style={{fontSize:13,fontWeight:700,color:"#2C2C2C",margin:0}}>{l.protein}g</p></div>}{l.symptoms?.length>0&&<div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>🩺</p><p style={{fontSize:12,color:"#2C2C2C",margin:0}}>{l.symptoms.join(", ")}</p></div>}</div></Card>)}</>}
        {tab==="notes"&&<><Card><p style={{fontSize:14,fontWeight:700,color:"#1E3A5F",margin:"0 0 10px"}}>📝 Nova anotação</p><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Ex: Paciente relatou melhora..." style={{width:"100%",minHeight:100,padding:"12px 16px",borderRadius:12,border:"1.5px solid #E0D8CF",fontSize:14,color:"#2C2C2C",resize:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:12}}/><Btn full onClick={saveNote} loading={savingNote} variant="pro">Salvar anotação</Btn></Card>{notes.length===0&&<div style={{textAlign:"center",padding:"32px 0"}}><p style={{fontSize:36}}>📋</p><p style={{color:"#8A8A8A"}}>Nenhuma anotação ainda.</p></div>}{notes.map(n=><Card key={n.id} style={{border:"1px solid #C7D9F5",background:"#EEF4FF"}}><p style={{fontSize:13,color:"#2C2C2C",margin:"0 0 8px",lineHeight:1.6}}>{n.text}</p><p style={{fontSize:11,color:"#8A8A8A",margin:0}}>{n.sentAt}</p></Card>)}</>}
        {tab==="messages"&&<><Card><p style={{fontSize:14,fontWeight:700,color:"#1E3A5F",margin:"0 0 10px"}}>💬 Enviar mensagem</p><p style={{fontSize:12,color:"#8A8A8A",margin:"0 0 12px"}}>Aparece na home e perfil de {patient.name?.split(" ")[0]}.</p><textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Ex: Oi! Vi que sua proteína caiu essa semana 💪" style={{width:"100%",minHeight:90,padding:"12px 16px",borderRadius:12,border:"1.5px solid #E0D8CF",fontSize:14,color:"#2C2C2C",resize:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:12}}/><Btn full onClick={sendMsg} loading={sendingMsg} variant="pro">Enviar mensagem 💬</Btn></Card>{messages.length===0&&<div style={{textAlign:"center",padding:"32px 0"}}><p style={{fontSize:36}}>💬</p><p style={{color:"#8A8A8A"}}>Nenhuma mensagem ainda.</p></div>}{messages.map(m=><div key={m.id} style={{background:"#EEF4FF",borderRadius:16,padding:14,border:"1px solid #C7D9F5"}}><p style={{fontSize:14,color:"#2C2C2C",margin:"0 0 8px",lineHeight:1.5}}>{m.text}</p><p style={{fontSize:11,color:"#8A8A8A",margin:0}}>{m.sentAt}</p></div>)}</>}
      </div>
    </div>
  );
}

function ProSettings({pro}){
  return <div style={{display:"flex",flexDirection:"column",gap:12}}><Card><p style={{fontSize:14,fontWeight:700,color:"#1E3A5F",margin:"0 0 12px"}}>🩺 Seus dados</p><div style={{display:"flex",flexDirection:"column",gap:8}}><div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>Nome</p><p style={{fontSize:14,fontWeight:700,color:"#2C2C2C",margin:0}}>{pro?.name}</p></div><div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>Especialidade</p><p style={{fontSize:14,color:"#2C2C2C",margin:0}}>{pro?.specialty}</p></div><div><p style={{fontSize:11,color:"#8A8A8A",margin:"0 0 2px"}}>Pacientes</p><p style={{fontSize:14,fontWeight:700,color:"#1E3A5F",margin:0}}>{pro?.patients?.length||0}</p></div></div></Card><Card style={{background:"#FFF8F0",border:"1.5px solid #F2D8B0"}}><p style={{fontSize:12,fontWeight:700,color:"#B07D3A",margin:"0 0 6px"}}>⚠️ Aviso</p><p style={{fontSize:12,color:"#7A5A2A",margin:0,lineHeight:1.6}}>Os dados são registrados pela própria paciente e não substituem avaliação clínica.</p></Card></div>;
}

function BottomNav({active,setNav,isPremium,openGate}){
  const items=[{id:"home",icon:"🏠",label:"Hoje",free:true},{id:"checkin",icon:"✅",label:"Check-in",free:true},{id:"body",icon:"⚖️",label:"Medidas",free:false},{id:"wellness",icon:"🌿",label:"Bem-estar",free:false},{id:"gallery",icon:"✨",label:"Galeria",free:false},{id:"report",icon:"📄",label:"Relatório",free:false},{id:"profile",icon:"👤",label:"Perfil",free:true}];
  const handleNav=(item)=>{if(!isPremium&&!item.free){openGate(item.id==="gallery"?"gallery":item.id==="wellness"?"wellness":item.id==="report"?"report":"body");return;}setNav(item.id);};
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(255,255,255,.97)",backdropFilter:"blur(12px)",borderTop:"1px solid #F0EBE3",display:"flex",zIndex:100}}>
      {items.map(item=>(
        <div key={item.id} onClick={()=>handleNav(item)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 1px 8px",cursor:"pointer",position:"relative"}}>
          {!isPremium&&!item.free&&<div style={{position:"absolute",top:8,right:"50%",transform:"translateX(6px)",width:8,height:8,borderRadius:"50%",background:"#F59E0B"}}/>}
          <span style={{fontSize:17,marginBottom:2,filter:active===item.id?"none":"grayscale(1) opacity(.5)"}}>{item.icon}</span>
          <span style={{fontSize:8,fontWeight:active===item.id?700:400,color:active===item.id?"#2D6A4F":"#8A8A8A",textAlign:"center"}}>{item.label}</span>
          {active===item.id&&<div style={{width:16,height:3,background:"#2D6A4F",borderRadius:99,marginTop:3}}/>}
        </div>
      ))}
    </div>
  );
}