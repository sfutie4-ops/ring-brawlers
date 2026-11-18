/* FliptapWars engine (unofficial fan-made game). build.py injects this file (plus the art data lines) into index.html. */
const W=960,H=540,GY=470,cv=document.getElementById('g'),ctx=cv.getContext('2d');
const $=s=>document.getElementById(s),TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=Math.random,lerp=(a,b,t)=>a+(b-a)*t;
const ease=v=>{v=clamp(v,0,1);return v*v*(3-2*v)},easeOut=v=>{v=clamp(v,0,1);return 1-Math.pow(1-v,3)};
const backOut=v=>{v=clamp(v,0,1);const c=1.70158;return 1+(c+1)*Math.pow(v-1,3)+c*Math.pow(v-1,2)};

// ---------- fonts ----------
const DISP='Impact,"Arial Black","Roboto Condensed",sans-serif-condensed,Arial,sans-serif';
const hasImpact=(()=>{try{const g=document.createElement('canvas').getContext('2d');g.font='40px monospace';const a=g.measureText('RING BRAWLERS').width;g.font='40px Impact,monospace';return Math.abs(g.measureText('RING BRAWLERS').width-a)>1}catch(e){return false}})();
const DW=hasImpact?400:900;if(!hasImpact)document.body.classList.add('fb');

// ---------- settings (remembered between visits) ----------
const store={get(k,d){try{const v=localStorage.getItem('rb_'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('rb_'+k,JSON.stringify(v))}catch(e){}}};
let reduced=store.get('reduced',matchMedia('(prefers-reduced-motion: reduce)').matches),sound=store.get('sound',true),quality=store.get('quality','auto'),haptics=store.get('haptics',true),showFps=store.get('fps',false),meshMode=false,autoLow=false;
const isTouch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
// dynamic resolution: phones start at 1.5x, PCs at 2x; auto quality steps it down when frames run slow
const RES_MAX=isTouch?1.5:2;let resCap=quality==='high'?RES_MAX:quality==='low'?1:RES_MAX,resT=0,resSlow=0,resFast=0;
const lowQ=()=>quality==='low'||(quality==='auto'&&autoLow);
const qn=n=>Math.max(1,Math.round(n*(lowQ()?.45:1)));

// ---------- arena art (layered so the crowd, ropes and lights can move) ----------
let scene=null,sceneBS=0,RS=1;
function buildScene(){
 if(scene)return;
 const vig=document.createElement('canvas');vig.width=W;vig.height=H;
 const g=vig.getContext('2d'),v=g.createRadialGradient(480,290,260,480,290,640);
 v.addColorStop(0,'#00000000');v.addColorStop(1,'#00000080');g.fillStyle=v;g.fillRect(0,0,W,H);scene={vig};
}

// ---------- roster & move data (unchanged from the original build) ----------
const ATK={punch:{dur:.30,hit:.10,end:.18,reach:106,dmg:7,kb:130,cost:0,rank:1},kick:{dur:.43,hit:.16,end:.27,reach:139,dmg:11,kb:220,cost:0,rank:2},upper:{dur:.64,hit:.22,end:.39,reach:145,dmg:16,kb:180,cost:0,rank:3},wave:{dur:.60,hit:.24,end:.30,reach:0,dmg:13,kb:230,cost:30,rank:4},sp:{dur:.83,hit:.25,end:.57,reach:162,dmg:28,kb:490,cost:100,rank:5}};
const ROSTER=[
{name:'Loonie',color:'#ffd16b',role:'MULTI COMBO',speed:242,power:1,upper:'Multi Lift',wave:'Rhyme Chain',super:'Hari ng Tugma',passive:'Longer combos lose less damage.',detail:'Link hits together. Rhyme Chain fires three golden bars; Hari ng Tugma sends a five-beat barrage.',source:'https://www.fliptop.com.ph/emcees/loonie'},
{name:'Abra',color:'#c49aff',role:'FLAME SUMMONER',speed:274,power:.93,upper:'Wordplay Rise',wave:'Gayuma Spark',super:'Cerberus: Hellbreath',passive:'Dash has a longer dodge window.',detail:'Fast footwork and feints. Gayuma Spark briefly slows movement. Cerberus covers the front lane in two waves of flame.',source:'https://www.fliptop.com.ph/emcees/abra'},
{name:'Shehyee',color:'#ff6375',role:'ANGLE PRESSURE',speed:225,power:1.02,upper:'Pressure Point',wave:'Angle Mark',super:'Third Eye: Crimson Focus',passive:'Uppercut and wave mark a target for three seconds.',detail:'Apply an angle mark, then cash it in with a guard-breaking super. Use quick strikes up close, then control the lane with Third Eye.',source:'https://www.fliptop.com.ph/emcees/shehyee'},
{name:'Batas',color:'#e3a06b',role:'HEAVY PRESSURE',speed:193,power:1.12,upper:'Iron Delivery',wave:'Heavy Bar',super:'Final Verdict: Axe of Law',passive:'Uppercut absorbs one hit without staggering.',detail:'Slow, heavy attacks. Heavy Bar travels slowly but hits hard. Axe of Law breaks guard around the statue.',source:'https://www.fliptop.com.ph/emcees/batas'},
{name:'Smugglaz',color:'#67d8ff',role:'RAPID FIRE',speed:260,power:.91,upper:'Speed Lift',wave:'Rapid Fire',super:'Triple Timer',passive:'Barrage hits create shorter hit-stop.',detail:'Rapid Fire pressures the lane. Triple Timer calls four clones for three machine-gun bursts.',source:'https://www.fliptop.com.ph/emcees/smugglaz'},
{name:'Aklas',color:'#b5f46d',role:'LEFTFIELD CHAOS',speed:238,power:.98,upper:'Odd Angle',wave:'Leftfield Orb',super:'Unorthodox',passive:'Dash becomes a short forward blink.',detail:'Zigzag projectiles and a three-lane super disrupt predictable spacing. Blink is directional and has a cooldown.',source:'https://www.fliptop.com.ph/emcees/aklas'},
{name:'Zaito',color:'#57e4b4',role:'FREESTYLE COUNTER',speed:232,power:.96,upper:'Rebuttal',wave:'Off-the-Top',super:'Punchline Delay',passive:'Rebuttal counters one incoming hit during its opening.',detail:'Time Rebuttal to answer an attack. Off-the-Top bounces through the lane; the super lands after a deliberate pause.',source:'https://www.fliptop.com.ph/emcees/zaito'},
{name:'Apekz',color:'#87aaff',role:'SETUP & PAYOFF',speed:244,power:1,upper:'Setup',wave:'Payoff',super:'Triple Meaning',passive:'Setup marks a target; the next Payoff wave adds damage.',detail:'Land Setup, then connect Payoff within three seconds. Triple Meaning fires three increasingly strong shots.',source:'https://www.fliptop.com.ph/emcees/apekz'},
{name:'Sinio',color:'#ff90c4',role:'CROWD TRICKSTER',speed:236,power:.96,upper:'Punchline Pop',wave:'Joke Wave',super:'Lotus Ground Smash',passive:'Blocked attacks and Joke Wave build extra energy.',detail:'Use pressure to win energy. Joke Wave briefly slows movement. Lotus Ground Smash shakes the floor and drains mana.',source:'https://www.fliptop.com.ph/emcees/sinio'}
];
const COL=ROSTER.map(r=>r.color),ROLES=ROSTER.map(r=>r.super.toUpperCase()),STAT=ROSTER.map(r=>({speed:r.speed,power:r.power}));
const MOVES=ROSTER.map(()=>Object.fromEntries(Object.entries(ATK).map(([kind,a])=>[kind,{...a,kind,knockdown:kind==='sp'}])));
const volley=(times,damages,path='straight',speed=500)=>times.map((at,i)=>({at,dmg:Array.isArray(damages)?damages[i]:damages,path,speed}));
MOVES.forEach(m=>m.wave.volley=volley([.24],13));
MOVES[0].wave.volley=volley([.24,.32,.40],4.6);
MOVES[1].wave.volley=volley([.24],10);MOVES[1].wave.slow=.9;
MOVES[2].upper.mark='angle';MOVES[2].wave.mark='angle';
MOVES[3].wave.volley=volley([.24],17,'straight',310);
MOVES[4].wave.volley=volley([.24,.31,.38,.45],4);
MOVES[5].wave.volley=volley([.24],13,'zigzag',440);
MOVES[6].upper.counter=true;MOVES[6].wave.volley=volley([.24],12,'bounce',420);
MOVES[7].upper.mark='setup';MOVES[7].wave.volley=volley([.24],9,'straight',560);
MOVES[8].wave.volley=volley([.24],9);MOVES[8].wave.slow=.6;
function moveData(f,move=f.st){return MOVES[f.ci][move]}

// ---------- state ----------
let P1=null,P2=null,phase='menu',pt=0,round=1,timer=60,sel=clamp(store.get('sel',0)|0,0,CH.length-1),hitstop=0,flash=0,vclock=0,msg='',msgT=0,koMsg='',paused=false,ready=false,audioCtx=null,master=null,noiseBuf=null,difficulty='normal',totalHits=0,maxCombo=0,slowT=0,superDim=0,hype=0,banner=null,lastTick=-1,confettiT=0;
let parts=[],effects=[],ghosts=[],shots=[],texts=[],swooshes=[],flashes=[],MAXP=800;
const held={},buf={},pointers=new Map();let fxImage,renderAlpha=1;
const FIXED_DT=1/120,SLOW=.22;
const cam={x:480,z:1.03,cx:480,cy:270,kx:0,ky:0,kvx:0,kvy:0,trauma:0,punch:0,focus:null,focusT:0};
const rope={a:0,v:0};
const KM={a:'l',arrowleft:'l',d:'r',arrowright:'r',w:'up',arrowup:'up',' ':'u',s:'crouch',arrowdown:'crouch',j:'p',z:'p',k:'k',x:'k',l:'power',q:'charge',e:'s'};
const GUARD_STATES=new Set(['idle','walk','block','crouch']);

// ---------- feedback helpers ----------
function addShake(t){if(!reduced)cam.trauma=Math.min(1,cam.trauma+t*shakeLevel)}
function kick(dx,dy=0){if(!reduced){cam.kvx+=dx*14*shakeLevel;cam.kvy+=dy*14*shakeLevel}}
function buzz(p){if(!haptics||!isTouch||!navigator.vibrate)return;try{navigator.vibrate(p)}catch(e){}}
function ropeHit(s){rope.v+=s*70}
function crowdFlash(n){n=qn(n);for(let i=0;i<n;i++)flashes.push({x:rand()*W,y:72+rand()*150,t:-rand()*.5,dur:.14+rand()*.12})}
function setMsg(m){if(m!==msg){msg=m;msgT=0}}

// ---------- input ----------
function clearInput(){for(const k in held)held[k]=0;for(const k in buf)buf[k]=0;pointers.clear();if(typeof stickEnd==='function')stickEnd();document.querySelectorAll('.b.on').forEach(b=>b.classList.remove('on'))}
function press(k){if((k==='p'||k==='k')&&P1&&phase==='fight'&&!paused){const c=cmdMatch(k);if(c){k=c.key;cmdFired(c)}}held[k]=1;if(!['l','r','b','charge','crouch','up'].includes(k))buf[k]=.22;if(!['l','r','b','charge','crouch','up','power','p','k','u','s'].includes(k))held[k]=0}
// ---------- motion commands (directions are relative to the way you face: → = toward the opponent) ----------
const DASH_CD=2,UPPER_CD=2;
const COMMANDS=[
 {seq:'bu',btn:'p',key:'h',name:'Uppercut',note:'free · 2 s cooldown'},
 {seq:'df',btn:'p',key:'w',name:'Energy wave',note:'30 mana'},
 {seq:'du',btn:'p',key:'q',name:'Rising strike',note:'25 mana'},
 {seq:'dd',btn:'p',key:'technique',name:'Fighter skill',note:'mana varies'},
 {seq:'df',btn:'k',key:'e',name:'Slide kick',note:'12 mana'},
 {seq:'db',btn:'k',key:'risingDive',name:'Dive kick',note:'22 mana'},
 {seq:'dd',btn:'k',key:'roll',name:'Evade roll',note:'14 mana'}];
const cmdHist=[];let dirSet='';
function cmdMatch(btn){const now=performance.now();const h=cmdHist.filter(e=>now-e.t<480);if(!h.length||now-h[h.length-1].t>320)return null;const seq=h.map(e=>e.s).join('');return COMMANDS.find(c=>c.btn===btn&&seq.endsWith(c.seq))||null}
function cmdFired(c){cmdHist.length=0;buzz([12,24,18]);if(P1)flare(P1.x+P1.face*40,GY-P1.air-110,COL[P1.ci],70,.15)}
// called every frame: records new direction presses and turns a double tap into a dash
function dirTick(){if(!P1||phase!=='fight'||paused){dirSet='';return}const x=(held.r||0)-(held.l||0),fx=x*(P1.face||1),cur=(fx>0?'f':'')+(fx<0?'b':'')+(held.up?'u':'')+(held.crouch?'d':''),now=performance.now();
  for(const ch of cur)if(!dirSet.includes(ch)){const prev=cmdHist[cmdHist.length-1];cmdHist.push({s:ch,t:now});if(cmdHist.length>8)cmdHist.shift();
    if((ch==='f'||ch==='b')&&prev&&prev.s===ch&&now-prev.t<300&&!held.up&&!held.crouch){if(P1.cd<=0){P1.dashBack=ch==='b';buf.d=.22;cmdHist.length=0;buzz(16)}else{buzz(4);if(P1.notice!=='dashcd'){label('DASH COOLING',P1.x,GY-200,'#f5be58');P1.notice='dashcd'}}}}
  dirSet=cur}
// Classic block: guard pose, small lean back, and a white/cyan block spark where the hit lands.
function blockPoseFrame(ci){const art=REVISED_FIGHTERS[ci],fr=art&&cinematicFrames[art.sheet];if(fr&&Number.isInteger(art.block)&&fr[art.block])return fr[art.block];return CH[ci].f.dash?.[0]||null}
// Arena lighting for fighters: a cast shadow away from the key light, coloured rim lights from the two
// light sources (drawn just behind the sprite so only the edge shows) and a light ambient grade on top.
const LIGHTS=[{l:'#ff4fb0',r:'#4fd8ff',amb:'#c4bcff',sk:-.55},{l:'#ff8a3c',r:'#ffcf7a',amb:'#ffcfa6',sk:.45},{l:'#ffd27a',r:'#7ab8ff',amb:'#fff1d6',sk:-.35}];
function drawLighting(f,fr,X,Y,sx,sy,angle,ra,pass){const L=LIGHTS[arenaId]||LIGHTS[0];
  if(pass==='under'){
    if(!lowQ()){const so=clamp(1-ra/220,0,1)*.34;if(so>.01){ctx.save();ctx.translate(X,GY+3);ctx.transform(1,0,L.sk,1,0,0);drawSprite(fr,0,0,f.face,so,false,sx,-sy*.24,0,'#05040c');ctx.restore()}}
    if(traceFX&&!lowQ()){drawSprite(fr,X-3,Y-1.5,f.face,.5,false,sx,sy,angle,L.l);drawSprite(fr,X+3,Y-1.5,f.face,.5,false,sx,sy,angle,L.r)}
  }else if(!lowQ()){ctx.save();ctx.globalCompositeOperation='multiply';drawSprite(fr,X,Y,f.face,.22,false,sx,sy,angle,L.amb);ctx.restore()}}
function drawBlockSpark(f,rx,ra){const gf=clamp(f.guardFlash/.2,0,1),crouch=f.st==='crouch',x=rx+f.face*48,y=GY-ra-(crouch?50:86),L=((1-gf)*.6+.6)*1.25;
  ctx.save();ctx.translate(x,y);ctx.scale(f.face,1);ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  ctx.globalAlpha=gf;ctx.drawImage(glow('#9fefff'),-34,-34,68,68);
  for(let i=0;i<8;i++){const a=-Math.PI/2+(i-3.5)*.36,len=(i%2?20:34)*L;ctx.strokeStyle=i%2?'#7fe6ff':'#ffffff';ctx.lineWidth=i%2?2:3;ctx.beginPath();ctx.moveTo(Math.cos(a+Math.PI/2)*6,Math.sin(a+Math.PI/2)*6);ctx.lineTo(Math.cos(a+Math.PI/2)*(6+len),Math.sin(a+Math.PI/2)*(6+len));ctx.stroke()}
  ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.globalAlpha=gf*.8;ctx.beginPath();ctx.ellipse(0,0,10+(1-gf)*22,16+(1-gf)*30,0,0,TAU);ctx.stroke();
  ctx.restore()}
function drawKeyHint(){if(isTouch||phase!=='fight'||!P1)return;text('←↑ J uppercut  ·  →→ dash  ·  ↓→ J wave  ·  ↓← K dive  ·  Esc › Settings › Command list',480,494,9,'#aab4c8')}
function drawCooldowns(){if(!P1||phase==='menu'||banner)return;const items=[['DASH',P1.cd,DASH_CD,'#f5be58'],['UPPER',P1.upCD||0,UPPER_CD,'#92e5ff']];items.forEach(([n,v,max,c],i)=>{const x=104+i*62,y=118,r=15,ready=v<=0;ctx.save();ctx.fillStyle='#070b14d0';ctx.beginPath();ctx.arc(x,y,r+3,0,TAU);ctx.fill();ctx.strokeStyle=ready?c:'#3a4460';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();if(!ready){ctx.strokeStyle=c;ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+TAU*(1-v/max));ctx.stroke();text(v.toFixed(1),x,y+4,10,'#e9ebf0')}else{ctx.globalAlpha=.6+.4*Math.sin(vclock*6);ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,5,0,TAU);ctx.fill();ctx.globalAlpha=1}text(n,x,y+r+13,8,ready?c:'#8792ab');ctx.restore()})}
function pauseGame(v=!paused){if(!P1||phase==='menu'||phase==='end')return;paused=v;clearInput();$('pauseScreen').style.display=v?'flex':'none';$('pause').textContent=v?'RESUME':'PAUSE'}
addEventListener('keydown',e=>{if(e.target.tagName==='SELECT')return;const key=e.key.toLowerCase();if(key==='escape'||key==='p'){e.preventDefault();if(!e.repeat)pauseGame();return}if(key==='v'){if(!e.repeat){meshMode=!meshMode;renderOpts()}return}if(key==='f'){if(!e.repeat){showFps=!showFps;store.set('fps',showFps);renderOpts()}return}if(key==='enter'&&phase==='end'){newMatch(true);return}const k=KM[key];if(!k)return;e.preventDefault();if(!held[k]&&!paused){held[k]=held[k];if(['l','r','up','crouch'].includes(k)){held[k]=1;dirTick()}else press(k)}});
addEventListener('keyup',e=>{if(KM[e.key.toLowerCase()]){held[KM[e.key.toLowerCase()]]=0;dirTick()}});
addEventListener('blur',()=>{clearInput();if(phase==='fight'||phase==='intro')pauseGame(true)});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pauseGame(true)}});
if(isTouch)document.body.classList.add('touch');
const padBtn=k=>document.querySelector('#pad [data-k='+k+']'),SLIDE=new Set(['l','r','b']);
function padRelease(id){const k=pointers.get(id);if(!k)return;pointers.delete(id);held[k]=[...pointers.values()].includes(k)?1:0;if(!held[k])padBtn(k)?.classList.remove('on')}
function padPress(id,k){pointers.set(id,k);press(k);padBtn(k)?.classList.add('on');buzz(6)}
document.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k;b.onpointerdown=e=>{e.preventDefault();if(paused||phase!=='fight')return;try{b.setPointerCapture(e.pointerId)}catch(_){}padPress(e.pointerId,k)};
  // slide a thumb between the arrows and GUARD without lifting it
  b.onpointermove=e=>{const cur=pointers.get(e.pointerId);if(!cur||!SLIDE.has(cur))return;const el=document.elementFromPoint(e.clientX,e.clientY),nk=el&&el.closest&&el.closest('[data-k]')?.dataset.k;if(nk&&nk!==cur&&SLIDE.has(nk)){padRelease(e.pointerId);padPress(e.pointerId,nk)}};
  const release=e=>padRelease(e.pointerId);b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;b.oncontextmenu=e=>e.preventDefault()});
$('pause').onclick=()=>pauseGame();$('resume').onclick=()=>pauseGame(false);$('exit').onclick=toMenu;$('select').onclick=toMenu;$('rematch').onclick=()=>newMatch(true);$('go').onclick=()=>newMatch(false);

let turnMode=store.get('turn',false),swapPad=store.get('swap',false),padSize=clamp(store.get('padsize',0)|0,0,2),padGhost=store.get('ghost',false);
let padAlpha=store.get('padA',.75),padFade=store.get('padFade',true);if(![1,.75,.5,.3].includes(padAlpha))padAlpha=.75;
function padPrefs(){const c=document.body.classList;c.toggle('swap',swapPad);document.documentElement.style.setProperty('--padA',padAlpha);layoutPad();fit()}
// ---------- touch gamepad: floating thumb stick + round action buttons in an arc ----------
const stick={id:null,R:52,up:false,guard:false},stickZone=$('stickZone'),stickBase=$('stickBase'),stickKnob=$('stickKnob');
function layoutPad(){const narrow=innerWidth<560,zw=narrow?150:200,U=Math.min([1,1.14,1.28][padSize]*clamp(Math.min(innerWidth,innerHeight)/390,.78,1.06),(innerWidth-(innerHeight>innerWidth?110:26))/(zw+236)),side=swapPad?'left':'right',other=swapPad?'right':'left',az=$('actZone'),lz=$('leftZone');
  az.style.width=Math.round(236*U)+'px';az.style.height=Math.round(282*U)+'px';lz.style.width=Math.round(zw*U)+'px';lz.style.height=Math.round(200*U)+'px';stickZone.style.height=Math.round(200*U)+'px';
  stick.R=48*U;stickBase.style.width=stickBase.style.height=Math.round(130*U)+'px';stickKnob.style.width=stickKnob.style.height=Math.round(58*U)+'px';stickHome();
  const place=(k,w,h,x,y)=>{const b=padBtn(k);if(!b)return;b.style.width=Math.round(w)+'px';b.style.height=Math.round(h)+'px';b.style[side]=Math.round(x-w/2)+'px';b.style[other]='auto';b.style.bottom=Math.round(y-h/2)+'px';b.style.fontSize=Math.round(Math.min(w,h)*.42)+'px'};
  const cx=110*U,cy=110*U,o=64*U,B=70*U;place('k',B,B,cx,cy+o);place('power',B,B,cx-o,cy);place('p',B,B,cx+o,cy);place('u',B,B,cx,cy-o);
  place('s',96*U,42*U,cx-58*U,cy+o+B/2+34*U);place('charge',96*U,42*U,cx+50*U,cy+o+B/2+34*U)}
function stickHome(){stickBase.style.left=(stickZone.clientWidth-stickBase.offsetWidth)/2+'px';stickBase.style.top=(stickZone.clientHeight-stickBase.offsetHeight)/2+'px';stickKnob.style.transform='translate(-50%,-50%)';stickBase.classList.remove('on')}
function stickEnd(){stick.id=null;stick.up=false;stick.guard=false;held.l=held.r=0;held.crouch=0;held.up=0;stick.zone='';stickBase.dataset.z='';stickHome();dirTick()}
function stickMove(e){const r=stickBase.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const m=Math.hypot(dx,dy),R=stick.R;if(m>R){dx*=R/m;dy*=R/m}
  // semi-magnet: within 20 degrees of up/down/left/right the knob snaps onto that axis
  const mag=Math.hypot(dx,dy);if(mag>R*.3){const an=Math.atan2(dy,dx),snap=Math.round(an/(Math.PI/2))*(Math.PI/2);if(Math.abs(an-snap)<.35){dx=Math.cos(snap)*mag;dy=Math.sin(snap)*mag}}
  stickKnob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;const nx=dx/R,ny=dy/R;held.l=nx<-.38?1:0;held.r=nx>.38?1:0;held.up=ny<-.5?1:0;held.crouch=ny>.55?1:0;
  const zone=(held.l?'l':'')+(held.r?'r':'')+(held.up?'u':'')+(held.crouch?'d':'');if(zone!==stick.zone){if(zone)buzz(zone.length>1?6:10);stick.zone=zone;stickBase.dataset.z=zone;dirTick()}}
stickZone.onpointerdown=e=>{e.preventDefault();if(stick.id!==null||paused||phase!=='fight')return;try{stickZone.setPointerCapture(e.pointerId)}catch(_){}stick.id=e.pointerId;const z=stickZone.getBoundingClientRect(),w=stickBase.offsetWidth;stickBase.style.left=clamp(e.clientX-z.left-w/2,-w*.2,z.width-w*.8)+'px';stickBase.style.top=clamp(e.clientY-z.top-w/2,-w*.2,z.height-w*.8)+'px';stickBase.classList.add('on');stickMove(e);buzz(5)};
stickZone.onpointermove=e=>{if(e.pointerId===stick.id)stickMove(e)};
for(const ev of['pointerup','pointercancel','lostpointercapture'])stickZone.addEventListener(ev,e=>{if(e.pointerId===stick.id)stickEnd()});
stickZone.oncontextmenu=e=>e.preventDefault();$('padPause').onclick=()=>pauseGame();addEventListener('resize',()=>layoutPad());
// ---------- options ----------
function toggleFull(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().then(()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}).catch(()=>{})}catch(e){}}
const OPTS=[
  {label:()=>'Sound '+(sound?'on':'off'),fn:()=>toggleSound()},
  {label:()=>reduced?'Motion reduced':'Motion full',fn:()=>{reduced=!reduced;store.set('reduced',reduced)}},
  {label:()=>'Quality '+quality,fn:()=>{quality={auto:'high',high:'low',low:'auto'}[quality];autoLow=false;resCap=quality==='low'?1:RES_MAX;store.set('quality',quality);applyQuality()}},
  {show:()=>isTouch&&!!navigator.vibrate,label:()=>'Vibration '+(haptics?'on':'off'),fn:()=>{haptics=!haptics;store.set('haptics',haptics);buzz(20)}},
  {label:()=>'FPS '+(showFps?'on':'off'),fn:()=>{showFps=!showFps;store.set('fps',showFps)}},
  {show:()=>!!document.documentElement.requestFullscreen,label:()=>document.fullscreenElement?'Exit fullscreen':'Fullscreen',fn:toggleFull},
  {label:()=>'Shake '+(['off','light','full'][Math.round(shakeLevel*2)]),fn:()=>{shakeLevel=shakeLevel===1?0:shakeLevel===0?.5:1;store.set('shake',shakeLevel);cam.kx=cam.ky=cam.kvx=cam.kvy=cam.trauma=0}},
  {label:()=>'Low HP pulse '+(dangerFX?'on':'off'),fn:()=>{dangerFX=!dangerFX;store.set('danger',dangerFX)}},
  {label:()=>'Rim outlines '+(traceFX?'on':'off'),fn:()=>{traceFX=!traceFX;store.set('trace',traceFX)}},
  {show:()=>isTouch,label:()=>'Swap button sides '+(swapPad?'on':'off'),fn:()=>{swapPad=!swapPad;store.set('swap',swapPad);padPrefs()}},
  {show:()=>isTouch,label:()=>'Button size '+['normal','large','huge'][padSize],fn:()=>{padSize=(padSize+1)%3;store.set('padsize',padSize);padPrefs()}},
  {show:()=>isTouch,label:()=>'Controls opacity '+Math.round(padAlpha*100)+'%',fn:()=>{padAlpha={1:.75,.75:.5,.5:.3,.3:1}[padAlpha]||.75;store.set('padA',padAlpha);padPrefs()}},
  {show:()=>isTouch,label:()=>'Fade controls behind fighters '+(padFade?'on':'off'),fn:()=>{padFade=!padFade;store.set('padFade',padFade);padPrefs()}},
  {label:()=>'Comic pops '+(popFX?'on':'off'),fn:()=>{popFX=!popFX;store.set('pops',popFX)}},
  {label:()=>'Mesh '+(meshMode?'on':'off'),fn:()=>{meshMode=!meshMode}}
];
function renderOpts(){document.querySelectorAll('.opts').forEach(box=>{box.innerHTML='';OPTS.forEach(o=>{if(o.show&&!o.show())return;const b=document.createElement('button');b.className='chip';b.textContent=o.label();b.onclick=()=>{o.fn();renderOpts()};box.append(b)})});0}
document.addEventListener('fullscreenchange',()=>{renderOpts();fit()});
function applyQuality(){MAXP=lowQ()?280:800;buildScene();fit()}
function fit(){const st=$('stage').getBoundingClientRect();if(!st.width||!st.height)return;const k=Math.min(st.width/W,st.height/H),dpr=window.devicePixelRatio||1,s=clamp(k*dpr,.5,lowQ()?Math.min(1,resCap):resCap),w=Math.round(W*s),h=Math.round(H*s);if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}RS=w/W;const portrait=isTouch&&st.height>st.width,ox=(st.width-W*k)/2,oy=portrait?st.height-H*k:(st.height-H*k)/2,tb=$('toolbar');cv.style.objectPosition=portrait?'center bottom':'';view={k,ox:st.left+ox,oy:st.top+oy};const mp=$('midPad');if(mp){if(overlayPad()){mp.style.top=Math.round(st.top+oy+94*k)+'px'}else mp.style.top=''}const rh=$('rotateHint');if(rh)rh.style.display=portrait&&uiPlaying?'flex':'none';tb.style.top=Math.round(oy+100*k)+'px';tb.style.right=Math.round(ox+12*k)+'px'}
addEventListener('resize',fit);if(window.ResizeObserver)new ResizeObserver(fit).observe($('stage'));

// ---------- sound (synthesized, starts off) ----------
// ---------- audio: layered synth SFX through a compressor + short room reverb, plus arena ambience ----------
let sfxBus=null,revSend=null,ambNodes=null,ambKey='';
function ensureAudio(){try{if(!audioCtx){const A=audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  const comp=A.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=12;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.18;
  master=A.createGain();master.gain.value=.85;master.connect(comp);comp.connect(A.destination);
  sfxBus=A.createGain();sfxBus.connect(master);
  // generated room impulse: 1.3 s decaying stereo noise
  const len=A.sampleRate*1.3|0,ir=A.createBuffer(2,len,A.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(rand()*2-1)*Math.pow(1-i/len,3.2)}
  const conv=A.createConvolver();conv.buffer=ir;revSend=A.createGain();revSend.gain.value=.2;sfxBus.connect(revSend);revSend.connect(conv);conv.connect(master);
  const n=A.sampleRate*1.2|0;noiseBuf=A.createBuffer(1,n,A.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<n;i++)d[i]=rand()*2-1}
  audioCtx.resume().catch(()=>{})}catch(e){audioCtx=null}}
function toggleSound(){sound=!sound;store.set('sound',sound);if(sound){ensureAudio();sfx.ui()}else ambience(false);renderOpts()}
{const evs=['pointerdown','pointerup','touchend','click','keydown'];const wake=()=>{if(!sound)return;ensureAudio();if(audioCtx&&audioCtx.state==='running')evs.forEach(e=>removeEventListener(e,wake,true))};evs.forEach(e=>addEventListener(e,wake,true))}
window.rbEnter=()=>{if(sound){ensureAudio();setTimeout(()=>sfx.enter(),40)}};
const AOK=()=>sound&&audioCtx&&audioCtx.state!=='closed';
function env(g,t,peak,att,dur,curve='exp'){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+att);if(curve==='exp')g.gain.exponentialRampToValueAtTime(.0001,t+att+dur);else g.gain.linearRampToValueAtTime(0,t+att+dur)}
function tone(hz,dur=.07,type='sine',gain=.05,end=null,delay=0,att=.004){if(!AOK())return;const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,end??hz*.35),t+dur);env(g,t,gain,att,dur);o.connect(g);g.connect(sfxBus);o.start(t);o.stop(t+dur+att+.02)}
function noise(dur=.1,freq=1200,gain=.08,q=1,type='bandpass',sweep=1,delay=0,att=.003){if(!AOK()||!noiseBuf)return;const t=audioCtx.currentTime+delay,s=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();s.buffer=noiseBuf;s.loop=true;f.type=type;f.frequency.setValueAtTime(freq,t);f.frequency.exponentialRampToValueAtTime(Math.max(40,freq*sweep),t+dur);f.Q.value=q;env(g,t,gain,att,dur);s.connect(f);f.connect(g);g.connect(sfxBus);s.start(t,rand()*.5);s.stop(t+dur+att+.03)}
function thump(f0,f1,dur,gain,delay=0){tone(f0,dur,'sine',gain,f1,delay,.002)}
function cheer(level=1,delay=0){if(!AOK()||!noiseBuf)return;const t=audioCtx.currentTime+delay,dur=1.1+level*.9;
  for(const[f,q,gn]of[[650,.8,.05],[1400,1.2,.035],[2600,1.6,.02]]){const s=audioCtx.createBufferSource(),fl=audioCtx.createBiquadFilter(),g=audioCtx.createGain(),lfo=audioCtx.createOscillator(),lg=audioCtx.createGain();s.buffer=noiseBuf;s.loop=true;fl.type='bandpass';fl.frequency.value=f;fl.Q.value=q;
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(gn*level,t+.18);g.gain.setValueAtTime(gn*level,t+dur*.45);g.gain.exponentialRampToValueAtTime(.0001,t+dur);lfo.frequency.value=5+rand()*4;lg.gain.value=gn*level*.35;lfo.connect(lg);lg.connect(g.gain);
    s.connect(fl);fl.connect(g);g.connect(sfxBus);s.start(t,rand());lfo.start(t);s.stop(t+dur+.05);lfo.stop(t+dur+.05)}}
const sfx={
  whoosh:(p=1)=>{noise(.16,280*p,.07,1.4,'bandpass',8.5,0,.05);noise(.1,3000,.02,.7,'highpass',1.5,.03)},
  hit:()=>{thump(190,52,.13,.38);noise(.035,4200,.22,.6,'highpass',1);noise(.08,900,.2,1.1,'bandpass',.45);tone(1800,.025,'square',.03,600)},
  heavy:()=>{thump(150,38,.3,.55);thump(68,30,.42,.32,.01);noise(.045,3600,.3,.6,'highpass',1);noise(.16,620,.26,.9,'bandpass',.3);noise(.3,240,.16,.6,'lowpass',.4,.02)},
  block:()=>{tone(1240,.12,'triangle',.08,1180);tone(1870,.09,'triangle',.05,1800);noise(.05,5200,.12,6,'bandpass',.8);thump(130,80,.08,.18)},
  cast:i=>{tone(420+i*60,.18,'sine',.06,(420+i*60)*2.2);tone(630+i*60,.14,'triangle',.035,(630+i*60)*1.8,.02);noise(.18,5000,.035,2,'bandpass',1.6)},
  sup:()=>{tone(70,1.05,'sawtooth',.06,360,0,.25);noise(1.05,250,.06,1.6,'bandpass',14,0,.3);thump(110,36,.5,.5,1.05);noise(.35,800,.2,.8,'lowpass',.25,1.05);cheer(.8,.9)},
  ko:()=>{thump(90,26,.9,.7);noise(.9,420,.24,.6,'lowpass',.2);noise(.05,3800,.3,.6,'highpass',1);sfx.bell(.25,3);cheer(1.4,.25)},
  land:()=>{thump(110,60,.08,.2);noise(.07,320,.08,.8,'lowpass',.5)},
  thud:()=>{thump(85,34,.24,.42);noise(.18,280,.16,.7,'lowpass',.4)},
  bell:(delay=0,times=2)=>{for(let k=0;k<times;k++)for(const[r,g]of[[1,.09],[2.76,.05],[5.4,.03],[8.9,.015]])tone(880*r,1.3,'sine',g,880*r*.995,delay+k*.22,.002)},
  ui:()=>{tone(1320,.05,'triangle',.035,1500);tone(2640,.03,'sine',.015,2700)},
  enter:()=>{thump(160,45,.4,.45);noise(.5,300,.1,1,'bandpass',9,0,.05);tone(220,.6,'sawtooth',.03,880,0,.1);cheer(1,.1)},
  cheer
};
// subtle looping arena ambience while fighting
function ambience(on){const key=on&&AOK()?String(arenaId):'';if(key===ambKey)return;ambKey=key;if(ambNodes){const t=audioCtx.currentTime;for(const g of ambNodes.gains)g.gain.setTargetAtTime(0,t,.25);const old=ambNodes;setTimeout(()=>old.srcs.forEach(x=>{try{x.stop()}catch(e){}}),900);ambNodes=null}
  if(!key)return;const A=audioCtx,t=A.currentTime,srcs=[],gains=[];const layer=(type,f,q,gain,lfoHz=0)=>{const s=A.createBufferSource(),fl=A.createBiquadFilter(),g=A.createGain();s.buffer=noiseBuf;s.loop=true;fl.type=type;fl.frequency.value=f;fl.Q.value=q;g.gain.value=0;g.gain.setTargetAtTime(gain,t,.6);if(lfoHz){const l=A.createOscillator(),lg=A.createGain();l.frequency.value=lfoHz;lg.gain.value=gain*.5;l.connect(lg);lg.connect(g.gain);l.start();srcs.push(l)}s.connect(fl);fl.connect(g);g.connect(master);s.start(0,rand());srcs.push(s);gains.push(g)};
  if(arenaId===0){layer('highpass',2400,.5,.022);layer('bandpass',900,.6,.012,.13);layer('lowpass',160,.7,.03,.07)}
  else if(arenaId===1){const o=A.createOscillator(),g=A.createGain(),fl=A.createBiquadFilter();o.type='sawtooth';o.frequency.value=55;fl.type='lowpass';fl.frequency.value=180;g.gain.value=0;g.gain.setTargetAtTime(.02,t,.6);o.connect(fl);fl.connect(g);g.connect(master);o.start();srcs.push(o);gains.push(g);layer('lowpass',260,.8,.035,.2);layer('bandpass',3200,2,.006,.5)}
  else{layer('bandpass',520,.7,.03,.31);layer('bandpass',1300,1,.014,.47)}
  ambNodes={srcs,gains}}

// ---------- loading ----------
function loadImage(src){return new Promise((yes,no)=>{const i=new Image();let done=false;const timeout=setTimeout(()=>finish(new Error('Artwork decode timed out')),20000);function finish(error){if(done)return;done=true;clearTimeout(timeout);i.onload=i.onerror=null;error?no(error):yes(i)}i.onload=()=>finish();i.onerror=()=>finish(new Error('Artwork could not be decoded'));i.src=src})}
let booting=false;
function loadPct(f){const b=$('go');b.textContent='LOADING '+Math.round(f*100)+'%';try{window.rbLoader&&rbLoader.progress(f)}catch(e){}}
async function boot(){
 if(booting)return;booting=true;ready=false;window.rbReady=false;
 const button=$('go'),status=$('status'),assetCount=CH.length+1+ARENA_ART.length+EXTRA_ART.length+ULTIMATE_ART.length+EXPRESSION_ART.length+Object.keys(CINEMATIC_ART).length;button.disabled=true;button.onclick=()=>newMatch(false);
 try{
  // Load sequentially to avoid a simultaneous image-decode memory spike.
  for(let n=0;n<CH.length;n++){const c=CH[n];loadPct(n/assetCount*100);status.textContent='Loading '+c.name+' · '+(n+1)+' / '+assetCount;
   if(!c.im)c.im=await loadImage(c.img);c.frames.forEach(fr=>{fr.im=c.im;fr.scale=c.scale});c.f={};for(const [name,indices] of Object.entries(c.animations))c.f[name]=indices.map(i=>c.frames[i]);c.upper=c.f.upper;
  }
  loadPct(CH.length/assetCount*100);status.textContent='Loading combat effects…';if(!fxImage)fxImage=await loadImage(FX_SRC);
  await loadArenaArt(i=>{loadPct((CH.length+1+i)/assetCount*100);status.textContent='Loading '+ARENAS[i].name+' artwork · '+(CH.length+2+i)+' / '+assetCount});
  await loadExtraArt(i=>{loadPct((13+i)/assetCount*100);status.textContent='Loading '+ROSTER[i].name+' new moves'});
  await loadUltimateArt((i,name)=>{
    loadPct((CH.length+1+ARENA_ART.length+EXTRA_ART.length+i)/assetCount*100);
    const id=ULTIMATE_PLANS.findIndex(plan=>plan.art===name);
    status.textContent=name==='anygma'?'Loading referee Anygma':id<0?'Loading casting poses':'Loading '+ROSTER[id].name+' ultimate';
  });
  const cinematicCount=Object.keys(CINEMATIC_ART).length;
  await loadExpressions(i=>{
    loadPct((assetCount-cinematicCount-EXPRESSION_ART.length+i)/assetCount*100);
    status.textContent='Loading fighter expressions';
  });
  await loadCinematicArt(i=>{
    loadPct((assetCount-cinematicCount+i)/assetCount*100);
    status.textContent='Loading fighter actions and effects';
  });
  buildCards();ready=true;window.rbReady=true;button.disabled=false;button.textContent='ENTER THE RING';status.textContent='';try{window.rbLoader&&rbLoader.ready()}catch(e){}
 }catch(e){status.textContent='Loading failed: '+e.message+'. Download this HTML and open it directly in Chrome or Edge, then retry.';button.disabled=false;button.textContent='RETRY LOADING';button.onclick=()=>boot();console.error(e)}finally{booting=false}
}
function buildCards(){const box=$('cards');box.innerHTML='';CH.forEach((c,i)=>{const b=document.createElement('button');b.className='card'+(i===sel?' sel':'');b.style.setProperty('--c',COL[i]);b.setAttribute('aria-pressed',i===sel);const cn=document.createElement('canvas');cn.width=180;cn.height=195;let g=cn.getContext('2d'),fr=idleExpressionFrame(i,0)||c.f.idle[0],bb=fr.bounds||{x:0,y:0,w:fr.w,h:fr.h},s=165/bb.h;g.drawImage(fr.im,fr.x+bb.x,fr.y+bb.y,bb.w,bb.h,(180-bb.w*s)/2,188-bb.h*s,bb.w*s,bb.h*s);b.append(cn);let name=document.createElement('div');name.className='name';name.textContent=c.name;let role=document.createElement('div');role.className='role';role.textContent=ROSTER[i].role;b.append(name,role);b.onclick=()=>{sel=i;store.set('sel',i);buildCards();sfx.ui()};box.append(b)});
  const skill=TECHNIQUES[sel],r=ROSTER[sel],sp=clamp((r.speed-170)/(285-170),.08,1),pw=clamp((r.power-.86)/(1.14-.86),.08,1);$('preview').style.setProperty('--c',r.color);
  $('fighterInfo').innerHTML='<h3>'+r.name+'</h3><div class="tag">'+r.role+'</div><div class="stat">SPEED<i><b style="width:'+Math.round(sp*100)+'%"></b></i></div><div class="stat">POWER<i><b style="width:'+Math.round(pw*100)+'%"></b></i></div><div class="mv"><span><b>←↑□</b>'+r.upper+'</span><span><b>↓→□</b>'+r.wave+'</span><span><b>↓↓□</b>'+skill.name+' · '+skill.cost+'</span><span><b>L2</b>'+r.super+'</span></div><p class="pas">'+r.passive+'</p><p class="det">'+ULTIMATE_PLANS[sel].detail+'</p><p class="det"><strong>○ '+EXTRA_NAMES[sel][4]+'</strong> '+ULTIMATE_PLANS[sel].signature+'</p><p class="det"><strong>HOLD ○</strong> '+CHARGED_POWER[sel].note+'</p><p class="det"><strong>↓↓□ '+skill.name+'</strong> '+skill.detail+'</p><p class="det keyhint">PC: J □ · K △ · Space ✕ · L ○ · Q L1 · E L2 · Esc › Settings for the command list</p>'}
function mk(ci,x,face,human){return{...tacticsState(),ci,x,face,human,slow:0,angle:0,setup:0,counter:0,armor:0,castCount:0,hp:100,shownHP:100,mt:40,st:'idle',t:0,air:0,vy:0,vx:0,wins:0,hit:false,connected:false,back:false,backHeld:false,parryWindow:0,parryCooldown:0,inv:0,cd:0,combo:0,comboTime:0,hitGlow:0,think:0,ghostTime:0,ctl:{dir:0},land:0,stepT:0,auraT:0,hudShake:0,comboPop:0,guardFlash:0,downThud:false}}
function newMatch(same){if(!ready)return;difficulty=$('difficulty').value;const enemy=same&&P2?P2.ci:(sel+1+Math.floor(Math.random()*(CH.length-1)))%CH.length;P1=mk(sel,300,1,true);P2=mk(enemy,660,-1,false);stats={dealt:0,taken:0,parries:0,blocks:0,supers:0,t0:performance.now()};totalHits=0;maxCombo=0;round=1;paused=false;confettiT=0;$('menu').style.display='none';$('result').style.display='none';$('pauseScreen').style.display='none';startRound();refreshMoveLabels();buzz(15)}
function refreshMoveLabels(){
  const r=ROSTER[P1.ci], skill=TECHNIQUES[P1.ci];
  const skillButton=document.querySelector('[data-k=technique]');
  if(skillButton){skillButton.innerHTML=skill.name+'<small>'+skill.cost+'</small>';skillButton.title=skill.cost+' mana · '+skill.detail}
  for(const[k,name,cost]of[['h',r.upper,20],['w',r.wave,30],['s',r.super,100]]){const b=document.querySelector('[data-k='+k+']');if(b){b.innerHTML=k==='s'&&b.classList.contains('sh')?'L2 · ULT':(k==='s'?ULTIMATE_PLANS[P1.ci].short:name)+'<small>'+cost+'</small>';b.title=k==='s'?ULTIMATE_PLANS[P1.ci].detail:r.detail}}$('help').innerHTML='← ↑ + J: '+r.upper+' (free) · ↓ → + J: '+r.wave+' (30 mana) · E: '+r.super+' (100 mana)<br>'+r.passive+'<br>↓ ↓ + J · '+skill.name+' ('+skill.cost+' mana). '+skill.detail+'<br>'+ULTIMATE_PLANS[P1.ci].detail+'<br>'+ULTIMATE_PLANS[P1.ci].signature+'<br>A/D: Move · S/↓: Crouch · Space: Jump · J: Punch · K: Kick · double-tap →/←: Dash · Hold back to block · Tap back to parry<br>L: Power (hold and release after the cue for the 60-mana charged version) · Hold Q: charge mana · E: Ultimate · H: command list<br>'+CHARGED_POWER[P1.ci].note+'<br>Root restricts movement. Stun and freeze lock actions. A clean hit shatters freeze.'}
function startRound(){resetUltimateScreen();refereeWinner=null;resetEnvironment();[P1,P2].forEach((f,i)=>Object.assign(f,{x:i?660:300,face:i?-1:1,hp:100,shownHP:100,mt:Math.max(40,Math.min(70,f.mt)),st:'idle',t:0,air:0,vy:0,vx:0,hit:false,connected:false,inv:0,cd:0,combo:0,comboTime:0,hitGlow:0,think:0,ctl:{dir:0},slow:0,angle:0,setup:0,counter:0,armor:0,castCount:0,back:false,backHeld:false,parryWindow:0,parryCooldown:0,prevX:undefined,prevAir:undefined,land:0,stepT:0,hudShake:0,comboPop:0,guardFlash:0,downThud:false,ultimate:null,...tacticsState()}));timer=60;phase='intro';pt=0;koMsg='';setMsg(difficulty==='training'?'TRAINING':'ROUND '+round);parts=[];effects=[];ghosts=[];shots=[];texts=[];swooshes=[];hitstop=0;flash=0;slowT=0;superDim=0;banner=null;lastTick=-1;cam.trauma=0;cam.focus=null;cam.focusT=0;cam.punch=0;clearInput();resetShowtime();introT0=round===1?1.25:0;if(introT0)msg=''}
function toMenu(){resetUltimateScreen();paused=false;phase='menu';P1=null;P2=null;clearInput();parts=[];confettiT=0;$('menu').style.display='flex';$('pauseScreen').style.display='none';$('result').style.display='none';$('pause').textContent='PAUSE';buildCards()}

// ---------- particles & effects ----------
function effect(row,x,y,size=140,face=1,dur=.38){effects.push({row,x,y,size,face,dur,t:0})}
function trim(){if(parts.length>MAXP)parts.splice(0,parts.length-MAXP)}
function sparks(x,y,color,n,dir=null,spread=TAU,speed=420,grav=900){n=qn(n);for(let i=0;i<n;i++){const a=dir===null?rand()*TAU:dir+(rand()-.5)*spread,v=speed*(.3+rand()*.9),life=.16+rand()*.36;parts.push({k:'spark',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-50,g:grav,drag:2.4,l:life,max:life,size:1+rand()*2.3,c:rand()<.3?'#fff6da':color,b:1})}trim()}
function embers(x,y,color,n,sx=30,sy=20){n=qn(n);for(let i=0;i<n;i++){const life=.5+rand()*.9;parts.push({k:'ember',x:x+(rand()-.5)*sx*2,y:y+(rand()-.5)*sy*2,vx:(rand()-.5)*50,vy:-(25+rand()*90),g:-30,drag:.9,l:life,max:life,size:1.4+rand()*2.6,c:color,ph:rand()*TAU})}trim()}
function dust(x,y,n,dir=0,power=1){n=qn(n);for(let i=0;i<n;i++){const life=.32+rand()*.42;parts.push({k:'dust',x:x+(rand()-.5)*16,y:y-rand()*6,vx:dir*(50+rand()*130)*power+(rand()-.5)*50,vy:-(8+rand()*46)*power,g:-10,drag:3.2,l:life,max:life,size:5+rand()*8,grow:20+rand()*22})}trim()}
function shards(x,y,color,n,dir=null,spread=TAU,speed=360){n=qn(n);for(let i=0;i<n;i++){const a=dir===null?rand()*TAU:dir+(rand()-.5)*spread,v=speed*(.35+rand()*.8),life=.35+rand()*.45;parts.push({k:'shard',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-120,g:1150,drag:.9,l:life,max:life,size:2+rand()*3.4,rot:rand()*TAU,spin:(rand()-.5)*22,c:color,b:1})}trim()}
function ringFx(x,y,color,size,dur=.34,sq=.82,w=5){parts.push({k:'ring',x,y,vx:0,vy:0,g:0,drag:0,l:dur,max:dur,size,c:color,sq,w})}
function flare(x,y,color,size,dur=.13){parts.push({k:'flare',x,y,vx:0,vy:0,g:0,drag:0,l:dur,max:dur,size,c:color,rot:rand()*TAU})}
function speedLines(face,color,n){if(reduced)return;n=qn(n);for(let i=0;i<n;i++){const life=.2+rand()*.22;parts.push({k:'line',x:rand()*W,y:90+rand()*350,vx:-face*(1700+rand()*1500),vy:0,g:0,drag:0,l:life,max:life,size:60+rand()*150,c:rand()<.5?'#ffffff':color})}}
const CONF=['#f5be58','#ff6375','#67d8ff','#b5f46d','#c49aff','#ffffff'];
function confetti(n){for(let i=0;i<n;i++){const life=2.6+rand()*2;parts.push({k:'conf',x:rand()*W,y:-10-rand()*80,vx:(rand()-.5)*90,vy:70+rand()*130,g:80,drag:.7,l:life,max:life,size:4+rand()*4,c:CONF[i%CONF.length],rot:rand()*TAU,spin:(rand()-.5)*9,ph:rand()*TAU})}trim()}
function burst(x,y,color,n=15){sparks(x,y,color,n);shards(x,y,color,Math.ceil(n/4))}
function label(text,x,y,col='#fff',size=15,pop=false){texts.push({text,x:x+(pop?(rand()-.5)*26:0),y,col,t:0,dur:pop?.75:.85,size,pop,vx:pop?(rand()-.5)*40:0})}
function fxHit(a,d,at,x,y){
  if(!at.ultimate)environmentHit(a,d,at);
  const heavy=!at.rapid&&at.kind==='sp',mid=at.kind==='upper'||at.kind==='kick',dir=(a.face>0?0:Math.PI)-a.face*.35,col=COL[a.ci];
  sparks(x,y,col,heavy?46:mid?24:at.rapid?10:16,dir,heavy?2.7:1.7,heavy?640:mid?520:430);
  shards(x,y,col,heavy?12:mid?6:3,dir-a.face*.15,1.6,heavy?520:380);
  flare(x,y,'#fff3d0',heavy?150:mid?100:74);parts.push({k:'fglow',x,y:GY+3,vx:0,vy:0,g:0,drag:0,l:heavy?.5:.32,max:heavy?.5:.32,size:heavy?230:mid?150:110,c:col});ringFx(x,y,col,heavy?210:mid?130:95,heavy?.45:.3);
  if(heavy){ringFx(x,y,'#ffffff',300,.55,.82,3);embers(x,y,col,16,50,50);speedLines(a.face,col,12);crowdFlash(12);ropeHit(1)}else if(mid)crowdFlash(2);
  if(d.air===0)dust(d.x,GY,heavy?8:3,a.face,heavy?1.6:1);
  if(d.x<115||d.x>845)ropeHit(.7);
  addShake(heavy?.8:at.kind==='upper'?.42:at.kind==='kick'?.34:at.rapid?.14:.24);kick(a.face*(heavy?26:mid?13:8),at.kind==='upper'?-10:heavy?-6:0);
  if(!reduced)cam.punch+=heavy?.07:mid?.03:.015;
  hype=Math.min(1,hype+(heavy?.8:mid?.3:.15));d.hudShake=heavy?1:.6;
  if(heavy||mid)sfx.heavy();else sfx.hit();
  buzz(heavy?45:d.human?24:10);
}
function fxBlock(a,d,x,y){const back=a.face>0?Math.PI:0;shards(x,y,'#92e5ff',7,back,1.9,300);sparks(x,y,'#c9f3ff',10,back,2.2,360);ringFx(x,y,'#92e5ff',72,.22,1,3);flare(x,y,'#d8f6ff',52,.1);addShake(.1);kick(a.face*4);d.guardFlash=.2;sfx.block();buzz(8)}
function fxKO(winner,loser){
  const x=loser.x,y=GY-loser.air-90,col=COL[winner.ci];
  sparks(x,y,col,70,null,TAU,760);sparks(x,y,'#ffffff',30,null,TAU,520);shards(x,y,col,18,null,TAU,560);embers(x,y,col,26,70,60);
  ringFx(x,y,col,380,.7,.82,7);ringFx(x,y,'#ffffff',520,.9,.82,3);flare(x,y,'#ffffff',170,.2);
  crowdFlash(26);ropeHit(1.4);hype=1;flash=.3;addShake(1);kick(winner.face*34,-10);
  slowT=reduced?.35:1.15;cam.focus=loser;cam.focusT=reduced?0:1.5;sfx.ko();showtimeKO(winner,loser);buzz([60,40,140]);
}

// ---------- combat (rules unchanged from the original build) ----------
function start(f,move,charged=false){if(move==='upper'&&f.upCD>0){if(f.human&&f.notice!=='upcd'){label('UPPERCUT COOLING',f.x,GY-200,'#92e5ff');f.notice='upcd'}return false}if(move==='upper'){const ok=startInner(f,move,charged);if(ok)f.upCD=UPPER_CD;return ok}return startInner(f,move,charged)}
function startInner(f,move,charged=false){if(actionLocked(f)||movementLocked(f,move)||((NEW_ACTIONS.includes(move)||move==='technique')&&f.air>0))return false;const a=moveData(f,move);const cost=move==='power'&&charged?CHARGED_POWER_COST:a?.cost||0;if(f.mt<cost||(cost>0&&f.silence>0)){if(f.human&&f.notice!==move){label(f.silence>0?'MANA LOCKED':'NEED '+cost+' MANA',f.x,GY-200,'#efc677');f.notice=move;tone(150,.06,'square',.02)}return false}f.mt-=cost;Object.assign(f,{chargedPower:move==='power'&&charged,st:move,t:0,hit:false,connected:false,vx:0,notice:null,castCount:0,terrainHit:false});const col=COL[f.ci];
  if(move!=='sp')environmentStart(f,move);extraStart(f,move);
  if(move==='technique')startTechnique(f,a);
  if(move==='dash'){f.cd=DASH_CD;f.inv=f.ci===1?.22:.13;f.vx=f.face*690*(f.dashBack?-1:1);f.dashBack=false;if(f.ci===5){ringFx(f.x,GY-85,col,120,.3);f.x=clamp(f.x+f.face*130,65,895);f.vx=0;f.prevX=f.x;burst(f.x,GY-80,col,18);flare(f.x,GY-85,col,110);ringFx(f.x,GY-85,col,150,.34)}effect(3,f.x,GY-15,110);dust(f.x,GY,5,-f.face,1.3);speedLines(f.face,col,4);sfx.whoosh(1.4);tone(180,.07,'triangle')}
  if(move==='sp')ultimateStart(f);else f.ultimate=null;
  if(move==='kick'){f.vx=f.face*160;effect(1,f.x+f.face*60,GY-85,135,f.face,.32)}
  if(move==='upper'){f.vx=f.face*260;if(f.ci===3){f.armor=.28;ringFx(f.x,GY-90,col,110,.28,1.3,4)}if(f.ci===6){f.counter=.34;f.vx=0;label('REBUTTAL',f.x,GY-200,col);ringFx(f.x,GY-90,col,120,.34,1.2,3)}effect(3,f.x,GY-5,110);dust(f.x,GY,3,-f.face);tone(220,.1,'triangle')}
  if(f.root>0&&move!=='dash')f.vx=0;
  if(a&&move!=='sp'&&move!=='technique'&&!a.volley&&!a.counter){swooshes.push({f,kind:move,t:-(Math.max(0,a.hit-.05)),dur:move==='sp'?.3:.2,col});sfx.whoosh(move==='punch'?1.5:move==='kick'?1:.8)}
  return true}
const TIMING={punch:[0,.04,.07,.10,.19,.245],kick:[0,.06,.11,.16,.28,.35],upper:[0,.08,.16,.22,.38,.52],wave:[0,.08,.16,.24,.38,.50],sp:[0,.08,.16,.25,.57,.70]};
function selectFrame(f) {
  const {ci,st,t}=f;
  if (st==='sp') return ultimateBodyFrame(f);
  const revised=revisedFighterFrame(ci,st,t,f);
  if (revised) return revised;
  const tactical=tacticFrame(f);
  if (tactical) return tactical;
  if (st==='idle') {
    const idle=idleExpressionFrame(ci,t);
    if (idle) return idle;
  }
  const state=stanceFrame(f)||techniqueFrame(f)||extraFrame(f);
  if (state) return state;
  const body=CH[ci].f, frames=body[st]||body.idle;
  let index=0;
  if (st==='walk') index=Math.floor(t*10)%frames.length;
  else if (TIMING[st]) {
    const times=TIMING[st];
    for(let i=1;i<times.length;i++) if(t>=times[i]) index=i;
  } else if (st==='jump') index=f.vy>0?1:0;
  return frames[Math.min(index,frames.length-1)];
}
function hit(a,d,at,projectile=false){if(d.inv>0||d.st==='down'||phase!=='fight')return false;
  if(tryParry(a,d,at,projectile))return true;
  if(ultimateCounter(a,d,at))return true;
  if(d.counter>0&&!at.isCounter){d.counter=0;d.inv=.14;label('REBUTTAL!',d.x,GY-210,COL[d.ci],18);flare(d.x,GY-95,COL[d.ci],130);ringFx(d.x,GY-95,COL[d.ci],160,.3);hit(d,a,{...ATK.punch,kind:'counter',dmg:11,kb:230,isCounter:true},true);return true}
  let guardBreak=at.guardBreak||(at.breakMarked&&d.angle>0);const guarding=d.back&&d.air===0&&GUARD_STATES.has(d.st),blocking=!guardBreak&&guarding;
  if(guardBreak&&guarding){label('GUARD BREAK!',d.x,GY-232,'#ff8a5c',17);shards(d.x+d.face*30,GY-90,'#92e5ff',14,null,TAU,420)}
  let bonus=blocking?0:ultimateDamageBonus(a,d,at);if(a.ci===7&&['wave','power','dive'].includes(at.kind)&&d.setup>0){bonus=8;d.setup=0;label('PAYOFF!',d.x,GY-205,COL[a.ci],17)}if(a.ci===2&&at.kind==='sp'&&d.angle>0&&!blocking){bonus=5;d.angle=0}
  const armored=d.armor>0;bonus+=shatterIce(d,blocking,armored);const scaling=at.ultimate?1:STAT[a.ci].power*Math.max(a.ci===0?.80:.65,1-a.combo*(a.ci===0?.035:.07));
  const dmg=(at.dmg+bonus)*(blocking?.12:scaling)*(armored?.6:1);
  d.hp=Math.max(0,d.hp-dmg);trackDamage(a,d,dmg,blocking,at);d.damageTime=0;a.mt=Math.min(100,a.mt+(blocking?2:dmg*.72));d.mt=Math.min(100,d.mt+dmg*.45);a.connected=true;
  if(!blocking){if(at.mark==='angle')d.angle=3;if(at.mark==='setup')d.setup=3;
    if(at.drain){const loss=Math.min(d.mt,at.drain);d.mt-=loss;if(loss>=1)label('-'+Math.round(loss)+' MANA',d.x,GY-197,COL[a.ci],13)}}
  if(a.ci===8&&(blocking||at.kind==='wave'))a.mt=Math.min(100,a.mt+8);
  d.hitGlow=.13;const x=d.x-a.face*22,y=GY-d.air-90;
  if(blocking){d.st='block';d.t=0;d.vx=a.face*80;effect(1,x,y,85,-a.face,.27);fxBlock(a,d,x,y);label('BLOCK',d.x,GY-190,'#92e5ff');hitstop=.03}
  else{a.combo=a.comboTime>0?a.combo+1:1;a.comboTime=1.15;a.comboPop=1;if(a.human){totalHits++;maxCombo=Math.max(maxCombo,a.combo)}
    if(!armored||d.hp<=0){d.st=d.hp<=0||at.knockdown?'down':'hit';d.t=0;d.vx=(at.direction??a.face)*at.kb;d.vy=0;d.downThud=false}else{d.armor=0;label('IRON DELIVERY',d.x,GY-195,COL[d.ci])}
    if((['upper','rise'].includes(at.kind)||at.launch)&&!armored){d.air=Math.max(5,d.air);d.vy=-(at.launch||550)}
    if(d.st==='hit'&&d.stun>0)d.st='stunned';
    applyTacticsHit(d,at,armored);
    if(!armored&&d.hp>0)at.onCleanHit?.(a,d);
    effect(0,x,y,at.burstRound?84:at.kind==='sp'?230:145,a.face,at.burstRound?.14:.34);fxHit(a,d,at,x,y);showtimeHit(a,d,at,x,y,dmg);
    if(at.powered){ringFx(x,y,COL[a.ci],162,.44,.82,6);sparks(x,y,COL[a.ci],14,null,TAU,400);addShake(.16)}
    hitstop=at.rapid?.018:at.kind==='sp'?.11:(at.kind==='upper'||at.kind==='kick')?.06:.045;flash=Math.max(flash,at.ultimate?.038:at.kind==='sp'?.12:.03);
    label('-'+Math.round(dmg),d.x+15+(at.burstRound?(a.combo%4-1.5)*29:0),
      y-35-(at.burstRound?(a.combo%3)*10:0),dmg>=14?'#ffffff':COL[a.ci],
      dmg>=20?28:dmg>=11?21:16,true)}
  return true}
function resolve(f,o){const a=powerHit(f,moveData(f));if(a.counter)return;const dist=(o.x-f.x)*f.face;if(dist<-20||dist>a.reach||Math.abs(f.air-o.air)>110)return;if(hit(f,o,a))f.hit=true}
function ai(f,o,dt){let c=f.ctl;if(difficulty==='training'){f.ctl={dir:0};return}f.think-=dt;if(f.think>0)return;let hard=difficulty==='hard',easy=difficulty==='easy';f.think=hard?.10:easy?.34:.22;f.ctl=c={dir:0};const d=Math.abs(o.x-f.x),toward=Math.sign(o.x-f.x),r=Math.random();if(techniqueAI(f,o,d,c,r)||tacticalAI(f,o,d,c,r))return;if(d>165){c.dir=toward;if(f.mt>=30&&d>290&&r<(hard?.3:.14))c.w=1;else if(d>320&&r<.2)c.d=1;else if(r>.93)c.u=1}else if(ATK[o.st]&&r<(hard?.58:easy?.15:.34)){c.dir=-toward}else if(f.mt>=100&&r<.20)c.s=1;else if(f.mt>=20&&r<.34)c.h=1;else if(r<.48)c.power=f.mt>=45;else if(r<.55)c.q=f.mt>=25;else if(r<.61)c.e=f.mt>=12;else if(r<.66)c.k=1;else if(r<.9)c.p=1;else c.dir=-toward}
function updateF(f,o,dt){tacticsTick(f,dt);if(!f.freeze)f.t+=dt;for(const key of['slow','angle','setup','counter','armor','upCD'])f[key]=Math.max(0,(f[key]||0)-dt);f.damageTime=(f.damageTime||0)+dt;f.inv=Math.max(0,f.inv-dt);f.cd=Math.max(0,f.cd-dt);f.hitGlow=Math.max(0,f.hitGlow-dt);f.comboTime=Math.max(0,f.comboTime-dt);if(!f.comboTime)f.combo=0;f.shownHP+=(f.hp-f.shownHP)*Math.min(1,dt*4);if(f.human)f.ctl={charge:!!held.charge,powerHeld:!!held.power,crouch:!!held.crouch,dir:(held.r||0)-(held.l||0),u:buf.u>0,p:buf.p>0,k:buf.k>0,h:buf.h>0,w:buf.w>0,s:buf.s>0,d:buf.d>0,q:buf.q>0,e:buf.e>0,risingDive:buf.risingDive>0,roll:buf.roll>0,power:buf.power>0,technique:buf.technique>0};const c=f.ctl;
  const holding=updateHold(f,o,c,dt);
  const free=!holding&&['idle','walk','crouch'].includes(f.st);if(free)f.face=o.x>=f.x?1:-1;f.back=c.dir*f.face<0;const cancel=!holding&&ATK[f.st]&&f.connected&&f.t>=moveData(f).hit+.035&&f.t<moveData(f).dur-.025;
  if(free||cancel){let chosen=null;for(const [k,a] of [['s','sp'],['technique','technique'],['power','power'],['q','rise'],['e','slide'],['risingDive','dive'],['roll','evade'],['h','upper'],['w','wave'],['k','kick'],['p','punch']])if(c[k]&&(!cancel||ATK[a].rank>ATK[f.st].rank)){if(start(f,a))chosen=a;if(f.human)buf[k]=0;break}if(!chosen&&free){if(c.d&&f.cd<=0){start(f,'dash');if(f.human)buf.d=0}else if(c.u&&f.air===0&&!f.root){f.st='jump';f.t=0;f.vy=-790;f.vx=c.dir*STAT[f.ci].speed;effect(3,f.x,GY-10,90);dust(f.x,GY,4,0,1.1);sfx.whoosh(.7);if(f.human)buf.u=0}else{
      const crouch=c.crouch&&f.air===0;
      f.vx=f.root||crouch?0:c.dir*(f.back?150:STAT[f.ci].speed)*(f.slow>0?.62:1);
      const next=crouch?'crouch':f.vx?'walk':'idle';
      if(next!==f.st)f.t=0;
      f.st=next;
    }}}
  if(f.st==='sp'){updateUltimate(f,o,dt);if(f.st==='sp'&&f.t>=moveData(f).dur){f.st='idle';f.t=0;f.ultimate=null;f.armor=0}}
  else if(f.st==='technique')updateTechnique(f,o);
  else if(ATK[f.st]){const a=moveData(f);if(!f.terrainHit&&f.t>=a.hit&&['kick','upper'].includes(f.st)){f.terrainHit=true;const tx=f.x+f.face*(f.st==='sp'?85:55);if(f.st==='sp'||props.some(p=>p.hp>0&&Math.abs(p.x-tx)<60))floorDamage(tx,f.st==='sp'?2:1)}if(a.volley){while(f.castCount<a.volley.length&&f.t>=a.volley[f.castCount].at){const spec=a.volley[f.castCount],index=f.castCount++,sx=f.x+f.face*65,sy=GY-90;shots.push({x:sx,y:sy,originY:sy,vx:f.face*spec.speed,face:f.face,owner:f,t:0,life:2.3,path:spec.path,lane:index,trail:0,at:{...powerHit(f,{...a,dmg:spec.dmg},index),rapid:a.volley.length>1},color:COL[f.ci]});f.hit=true;flare(sx,sy,COL[f.ci],a.kind==='sp'?110:80);ringFx(sx,sy,COL[f.ci],70,.22,1.3,3);sparks(sx,sy,COL[f.ci],8,f.face>0?Math.PI:0,1.6,260,300);kick(-f.face*(a.kind==='sp'?7:4));addShake(a.kind==='sp'?.12:.05);sfx.cast(index)}}else if(!f.hit&&f.t>=a.hit&&f.t<=a.end)resolve(f,o);if(f.st==='upper'&&!a.counter)f.air=Math.sin(clamp((f.t-.16)/.48,0,1)*Math.PI)*38;if(f.st==='dive')f.air=Math.sin(clamp(f.t/a.dur,0,1)*Math.PI)*48;if(f.st==='rise')f.air=Math.sin(clamp(f.t/a.dur,0,1)*Math.PI)*24;if(f.t>=a.dur){if(['dive','rise'].includes(f.st))f.air=0;f.st='idle';f.t=0;if(a.kind==='upper')f.air=0}}
  if(f.st==='dash'&&f.t>.20){f.st='idle';f.vx=0;f.t=0}if((f.st==='hit'||f.st==='block')&&f.t>(f.st==='hit'?.31:.18)&&f.air===0){f.st='idle';f.t=0}if(f.st==='down'&&f.hp>0&&f.t>1.0&&f.air===0){f.st='idle';f.inv=.35;f.t=0}
  if(!f.freeze&&!isMountainClimbing(f)&&(f.st==='jump'||(f.air>0&&!['upper','rise','dive'].includes(f.st)))){f.vy+=2250*dt;f.air-=f.vy*dt;if(f.air<=0){f.air=0;f.vy=0;effect(3,f.x,GY-8,110);dust(f.x,GY,3,-1);dust(f.x,GY,3,1);f.land=.16;sfx.land();if(f.st==='jump'){f.st='idle';f.vx=0;f.t=0}}}
  if(!['walk','jump','dash','slide','evade'].includes(f.st))f.vx*=Math.pow(f.st==='sp'?.15:.002,dt);f.x=clamp(f.x+f.vx*dt,65,895);
  f.ghostTime-=dt;if(!reduced&&['dash','upper'].includes(f.st)&&f.ghostTime<=0){f.ghostTime=.04;ghosts.push({x:f.x,air:f.air,face:f.face,fr:selectFrame(f),t:0,dur:.26,col:COL[f.ci]})}}
function finishRound(){for(const f of [P1,P2])Object.assign(f,tacticsState(),{slow:0});shots=[];phase='ko';pt=0;const timeUp=P1.hp>0&&P2.hp>0;let draw=P1.hp===P2.hp;let winner=P1.hp>P2.hp?P1:P2;refereeWinner=draw?null:winner;
  if(draw){setMsg('DRAW');koMsg=''}else{winner.wins++;const loser=winner===P1?P2:P1;koMsg=winner.human?(winner.hp>=100?'PERFECT ROUND':'ROUND WON'):'ROUND LOST';setMsg(timeUp?'TIME UP':'K.O.');winner.st='win';winner.t=0;winner.vx=0;loser.st='down';loser.t=0;loser.air=0;loser.downThud=false;if(timeUp){addShake(.3);crowdFlash(8);hype=1}else fxKO(winner,loser)}
  tone(draw?220:winner.human?600:110,.25,'triangle')}
function step(dt){if(hitstop>0){hitstop-=dt;return}pt+=dt;
  if(phase==='intro'){P1.t+=dt;P2.t+=dt;if(introT0&&pt>=introT0&&!msg)setMsg(roundLabel());if(pt>1.4+introT0){phase='fight';pt=0;setMsg('FIGHT');sfx.bell();cheer(.7,.15);addShake(.3);hype=.8;crowdFlash(6);ringFx(480,GY-150,'#ffe9b5',520,.5,.5,4);buzz(25)}}
  else if(phase==='fight'){
    if(pt>.7)setMsg('');
    const scale1=castTimeScale(P1),scale2=castTimeScale(P2);
    const worldDt=dt*(scale1!==1||scale2!==1 ? CAST_WORLD_RATE : 1);
    if(difficulty!=='training')timer=Math.max(0,timer-worldDt);
    if(!P2.human)ai(P2,P1,worldDt);
    updateDefense(P1,P2,dt);updateDefense(P2,P1,dt);
    updateF(P1,P2,scale1===1?worldDt:dt*scale1);
    if(P2.hp>0||difficulty==='training')updateF(P2,P1,scale2===1?worldDt:dt*scale2);
    updateTechniqueFields(worldDt);
    for(const s of shots){
      const previousX=s.x;
      s.t+=worldDt;s.life-=worldDt;s.x+=s.vx*worldDt;
      if(s.path==='zigzag')s.y=s.originY+Math.sin(s.t*17)*40;
      else if(s.path==='bounce')s.y=GY-35-Math.abs(Math.sin(s.t*9))*100;
      else if(s.path==='fan')s.y=s.originY+(s.lane-1)*s.t*90;
      const target=s.owner===P1?P2:P1;
      if(!techniqueShotContinues(s,target,previousX))continue;
      const ducking=target.st==='crouch';
      const bodyY=GY-target.air-(ducking?42:85);
      if(Math.abs(s.x-target.x)<42&&Math.abs(s.y-bodyY)<(ducking?43:75)&&hit(s.owner,target,s.at,true)){
        s.life=0;effect(1,s.x,s.y,100,s.face);
      }
    }
    shots=shots.filter(s=>s.life>0&&s.x>-50&&s.x<1010);
    const dx=P2.x-P1.x;if(Math.abs(dx)<55&&Math.abs(P1.air-P2.air)<60){const push=(55-Math.abs(dx))/2*Math.sign(dx||1);P1.x=clamp(P1.x-push,65,895);P2.x=clamp(P2.x+push,65,895)}
    checkFullMana(P1);checkFullMana(P2);
    if(difficulty==='training'){if(practiceMana)P1.mt=100;if(P2.damageTime>1.5&&P2.hp<100&&P2.comboTime===0&&P1.comboTime===0&&['idle','walk'].includes(P2.st))P2.hp=100;if(P2.hp<=0&&P2.t>.9){P2.hp=100;P2.st='idle';P2.t=0;P2.x=660}}else if(P1.hp<=0||P2.hp<=0||timer<=0)finishRound()}
  else if(phase==='ko'){[P1,P2].forEach(f=>{f.t+=dt;f.shownHP+=(f.hp-f.shownHP)*Math.min(1,dt*5);f.hitGlow=Math.max(0,f.hitGlow-dt);f.comboTime=Math.max(0,f.comboTime-dt);f.vx*=Math.pow(.02,dt);f.x=clamp(f.x+f.vx*dt,65,895)});if(koMsg&&pt>.5){setMsg(koMsg);koMsg=''}
    if(pt>2.2){if(P1.wins>=2||P2.wins>=2){phase='end';const won=P1.wins>=2;$('resultTitle').textContent=won?'VICTORY':'DEFEATED';$('resultTitle').style.color=won?'#f5be58':'#ff7982';$('resultStats').textContent=`${P1.wins} – ${P2.wins} rounds · ${totalHits} hits landed · Best combo: ${maxCombo}`;fillResult(won);$('result').style.display='flex';clearInput();if(won){confettiT=2.6;buzz([30,60,30,60,90])}}else{round++;startRound()}}}
  for(const k in buf)buf[k]=Math.max(0,buf[k]-dt)}

// ---------- per-frame visual update (runs at the display's refresh rate) ----------
const rxOf=f=>f.prevX===undefined?f.x:f.prevX+(f.x-f.prevX)*renderAlpha,raOf=f=>f.prevAir===undefined?f.air:f.prevAir+(f.air-f.prevAir)*renderAlpha;
let uiPlaying=null;const uiBtn={};
let view={k:1,ox:0,oy:0};const overlayMQ=matchMedia('(orientation:landscape) and (max-height:600px)');const overlayPad=()=>isTouch&&overlayMQ.matches;
// fade a control cluster while a fighter is standing behind it
let fadeT=0,padRects=null,padRectsT=0;addEventListener('resize',()=>padRects=null);function padFadeTick(){if(!isTouch||!P1||!padFade||!overlayPad()){if(fadeT){fadeT=0;$('leftZone').classList.remove('dim');$('actZone').classList.remove('dim')}return}fadeT=1;const sx=x=>view.ox+((x-cam.cx)*cam.z+W/2)*view.k,sy=y=>view.oy+((y-cam.cy)*cam.z+H/2)*view.k;
  if(!padRects||padRectsT++>90){padRects={leftZone:$('leftZone').getBoundingClientRect(),actZone:$('actZone').getBoundingClientRect()};padRectsT=0}for(const id of['leftZone','actZone']){const z=$(id),r=padRects[id];let hit=false;for(const f of[P1,P2]){const x0=sx(f.x-48),x1=sx(f.x+48),y0=sy(GY-f.air-185),y1=sy(GY-f.air+6);if(x1>r.left+10&&x0<r.right-10&&y1>r.top+10&&y0<r.bottom)hit=true}for(const sh of shots){const x=sx(sh.x),y=sy(sh.y);if(x>r.left&&x<r.right&&y>r.top&&y<r.bottom)hit=true}z.classList.toggle('dim',hit)}}
function syncUI(){dirTick();if(sound&&audioCtx)ambience(!!P1&&['intro','fight','ko'].includes(phase)&&!paused);padFadeTick();const playing=!!P1&&['intro','fight','ko'].includes(phase)&&!paused;if(playing!==uiPlaying){uiPlaying=playing;document.body.classList.toggle('playing',playing);fit()}
  if(isTouch&&P1)for(const[k,cost]of[['h',20],['w',30],['s',100],['technique',TECHNIQUES[P1.ci].cost]]){const off=P1.mt<cost||P1.silence>0;if(uiBtn[k]!==off){uiBtn[k]=off;const b=document.querySelector('[data-k='+k+']');if(b){b.classList.toggle('off',off);if(k==='s')b.classList.toggle('ready',!off)}}const pr=Math.round(clamp(P1.mt/cost,0,1)*20)*5;if(uiBtn[k+'p']!==pr){uiBtn[k+'p']=pr;padBtn(k)?.style.setProperty('--p',pr+'%')}}const cd=P1?Math.round(clamp(1-P1.cd/DASH_CD,0,1)*20)*5:100;if(isTouch&&P1&&uiBtn.dp!==cd){uiBtn.dp=cd;padBtn('d')?.style.setProperty('--p',cd+'%')}}
function fxUpdate(dt,real){showtimeUpdate(dt,real);advanceUltimateScreen(real);environmentUpdate(dt*(P1&&(castTimeScale(P1)!==1||castTimeScale(P2)!==1)?CAST_WORLD_RATE:1));vclock+=dt;msgT+=real;
  for(const e of effects)e.t+=dt;effects=effects.filter(e=>e.t<e.dur);for(const g of ghosts)g.t+=dt;ghosts=ghosts.filter(g=>g.t<g.dur);
  for(const t of texts){t.t+=dt;t.y-=(t.pop?46*Math.max(0,1-t.t*1.4):25)*dt;t.x+=t.vx*dt}texts=texts.filter(t=>t.t<t.dur);
  if(hitstop<=0)for(const s of swooshes)s.t+=dt;swooshes=swooshes.filter(s=>s.t<s.dur&&(s.t>=0||s.f.st===s.kind));
  for(const f of flashes)f.t+=real;flashes=flashes.filter(f=>f.t<f.dur);
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.l-=dt;if(p.l<=0){parts[i]=parts[parts.length-1];parts.pop();continue}if(p.k==='ring'||p.k==='flare'||p.k==='fglow')continue;p.vy+=p.g*dt;if(p.drag){const d=Math.exp(-p.drag*dt);p.vx*=d;if(p.k!=='spark'&&p.k!=='shard')p.vy*=d}p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.spin)p.rot+=p.spin*dt;if(p.k==='conf')p.x+=Math.sin(vclock*3+p.ph)*30*dt;if(p.b&&p.y>GY+8&&p.vy>0){p.y=GY+8;p.vy*=-.38;p.vx*=.6;if(p.spin)p.spin*=.5}}
  flash=Math.max(0,flash-real);superDim=Math.max(0,superDim-real*1.7);hype=Math.max(0,hype-real*.55);if(banner){banner.t+=real;if(banner.t>banner.dur)banner=null}
  rope.v+=(-rope.a*240-rope.v*5)*real;rope.a+=rope.v*real;
  if(confettiT>0){confettiT-=real;confetti(lowQ()?1:3)}
  if(P1){for(const f of[P1,P2]){f.land=Math.max(0,f.land-dt);f.hudShake=Math.max(0,f.hudShake-real*3.2);f.comboPop=Math.max(0,f.comboPop-real*6);f.guardFlash=Math.max(0,f.guardFlash-dt);
      if(phase==='fight'||phase==='ko'){const x=rxOf(f);
        if(f.st==='walk'&&f.air===0){f.stepT-=dt;if(f.stepT<=0){f.stepT=.2;dust(x-Math.sign(f.vx)*12,GY+2,1,-Math.sign(f.vx)*.5,.7)}}
        if(f.st==='down'){if(!f.downThud&&f.t>.3&&f.air===0){f.downThud=true;dust(x-f.face*40,GY,qn(7),0,1.3);addShake(.22);sfx.thud();ropeHit(.4)}if(Math.abs(f.vx)>90&&f.air===0&&rand()<dt*40)dust(x-f.face*30,GY+2,1,-Math.sign(f.vx)*.3,.8)}
        if(f.mt>=100&&f.hp>0&&phase==='fight'){f.auraT-=dt;if(f.auraT<=0){f.auraT=lowQ()?.12:.05;embers(x,GY-f.air-20-rand()*150,COL[f.ci],1,30,10)}}
        if(f.st==='sp'&&rand()<dt*90)sparks(x-f.face*20,GY-f.air-40-rand()*100,COL[f.ci],1,f.face>0?Math.PI:0,.8,300,200)}}
    for(const s of shots){shotTrailExtra(s,dt);s.trail-=dt;if(s.trail<=0){s.trail=lowQ()?.04:.018;const big=!s.at.rapid;parts.push({k:'ember',x:s.x-s.face*14+(rand()-.5)*10,y:s.y+(rand()-.5)*(big?26:14),vx:-s.face*(40+rand()*90),vy:(rand()-.5)*50,g:-20,drag:1.5,l:.3+rand()*.25,max:.5,size:(big?2.4:1.6)+rand()*2,c:s.color,ph:rand()*TAU});if(rand()<.35)sparks(s.x,s.y,s.color,1,s.face>0?Math.PI:0,1.2,200,300)}}
    if(phase==='fight'&&difficulty!=='training'&&timer<=10&&timer>0){const sec=Math.ceil(timer);if(sec!==lastTick){lastTick=sec;tone(880,.05,'square',.025)}}}
  // camera
  let tx=480,tz=reduced?1:1.03;
  if(P1&&phase!=='menu'){const a=rxOf(P1),b=rxOf(P2),dist=Math.abs(a-b);tx=(a+b)/2;if(!reduced){tz=clamp(1.2-(dist-140)/520*.17,1.03,1.2);if(phase==='intro')tz=lerp(1.0,tz,ease((pt-introT0)/1.2));if(cam.focusT>0&&cam.focus){cam.focusT-=real;tx=lerp(tx,rxOf(cam.focus),.7);tz=1.3}}}
  cam.punch*=Math.exp(-real*9);cam.z+=(tz+cam.punch-cam.z)*(1-Math.exp(-real*5));cam.x+=(tx-cam.x)*(1-Math.exp(-real*5.5));if(reduced){cam.z=1;cam.punch=0}
  cam.kvx+=(-cam.kx*230-cam.kvx*19)*real;cam.kx+=cam.kvx*real;cam.kvy+=(-cam.ky*230-cam.kvy*19)*real;cam.ky+=cam.kvy*real;cam.trauma=Math.max(0,cam.trauma-real*1.55);
  const hw=W/2/cam.z,hh=H/2/cam.z;
  cam.cx=clamp(cam.x,hw,W-hw);
  const cameraY=mountainCameraY();
  cam.cy=lerp(cam.cy,cameraY??H-hh,1-Math.exp(-real*(cameraY===null?11:13)));
  syncUI()}

// ---------- sprite drawing ----------
const outlineCache=new WeakMap();
function outlined(fr){let map=outlineCache.get(fr.im);if(!map){map=new Map();outlineCache.set(fr.im,map)}const key=[fr.x,fr.y,fr.w,fr.h].join(',');if(map.has(key))return map.get(key);const mask=document.createElement('canvas');mask.width=fr.w;mask.height=fr.h;const m=mask.getContext('2d');m.drawImage(fr.im,fr.x,fr.y,fr.w,fr.h,0,0,fr.w,fr.h);m.globalCompositeOperation='source-in';m.fillStyle='#090d17';m.fillRect(0,0,fr.w,fr.h);const out=document.createElement('canvas');out.width=fr.w+6;out.height=fr.h+6;const o=out.getContext('2d');for(const [x,y] of [[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,-1],[-1,1],[1,1]])o.drawImage(mask,3+x,3+y);o.drawImage(fr.im,fr.x,fr.y,fr.w,fr.h,3,3,fr.w,fr.h);map.set(key,out);return out}
const silCache=new Map();
function silhouette(fr,color){let m=silCache.get(color);if(!m){m=new WeakMap();silCache.set(color,m)}let c=m.get(fr);if(c)return c;c=document.createElement('canvas');c.width=fr.w;c.height=fr.h;const g=c.getContext('2d');g.drawImage(fr.im,fr.x,fr.y,fr.w,fr.h,0,0,fr.w,fr.h);g.globalCompositeOperation='source-in';g.fillStyle=color;g.fillRect(0,0,fr.w,fr.h);m.set(fr,c);return c}
function drawSprite(fr,x,y,face,alpha=1,outline=false,scaleX=1,scaleY=1,rotation=0,tint=null,g=ctx,k=1){g.save();g.translate(x,y);g.scale(face*scaleX*k,scaleY*k);g.rotate(rotation);g.globalAlpha*=alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';const s=fr.scale||1,w=fr.w*s,h=fr.h*s,ax=fr.ax*s,ay=(fr.ay??fr.h)*s;if(tint)g.drawImage(silhouette(fr,tint),-ax,-ay,w,h);else if(outline){const oi=outlined(fr);g.drawImage(oi,-ax-3*s,-ay-3*s,w+6*s,h+6*s)}else g.drawImage(fr.im,fr.x,fr.y,fr.w,fr.h,-ax,-ay,w,h);g.restore()}
function drawMesh(fr,x,y,face,sx,sy,rotation){if(!meshMode||!fr.vertices?.length)return;ctx.save();ctx.translate(x,y);ctx.scale(face*sx,sy);ctx.rotate(rotation);ctx.scale(fr.scale,fr.scale);ctx.translate(-fr.ax,-fr.ay);ctx.lineWidth=.7/fr.scale;ctx.strokeStyle='#4ae5ec45';for(let i=0;i<fr.triangles.length;i+=3){ctx.beginPath();for(let j=0;j<3;j++){const v=fr.vertices[fr.triangles[i+j]];j?ctx.lineTo(...v):ctx.moveTo(...v)}ctx.closePath();ctx.stroke()}ctx.strokeStyle='#6bf6ee';ctx.lineWidth=1.2/fr.scale;ctx.beginPath();(fr.silhouette||fr.vertices).forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.closePath();ctx.stroke();ctx.fillStyle='#ffcb65';fr.vertices.forEach(v=>{ctx.beginPath();ctx.arc(v[0],v[1],1.5/fr.scale,0,TAU);ctx.fill()});ctx.restore()}
const glowCache=new Map();
function glow(color){let c=glowCache.get(color);if(c)return c;c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'#ffffff');r.addColorStop(.22,color);r.addColorStop(.55,color+'50');r.addColorStop(1,color+'00');g.fillStyle=r;g.fillRect(0,0,64,64);glowCache.set(color,c);return c}
const DUST=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,32);r.addColorStop(0,'#e6d8b8');r.addColorStop(.6,'#d9caa888');r.addColorStop(1,'#d9caa800');g.fillStyle=r;g.fillRect(0,0,64,64);return c})();
function drawF(f){let fr=selectFrame(f);const guarding=f.air===0&&f.back&&['idle','walk','block'].includes(f.st);if(guarding){const bf=blockPoseFrame(f.ci);if(bf)fr=bf}f.shieldA=(f.shieldA||0)+((guarding?1:0)-(f.shieldA||0))*.3;const rx0=rxOf(f),ra=raOf(f)*(reduced&&isMountainClimbing(f)?REDUCED_CLIMB_SCALE:1),vt=f.t+(hitstop>0||paused?0:renderAlpha*FIXED_DT),col=COL[f.ci];
  let rx=rx0,breath=!reduced&&['idle','block'].includes(f.st)?Math.sin(vt*(3.9+f.ci%3*.6)+f.ci)*.023:0,sx=1-breath,sy=1+breath,angle=0,dx=0,dy=0;
  if(phase==='intro'&&!reduced){const k=1-easeOut((pt-introT0)/.9);if(k>.015){rx-=f.face*k*340;const wf=CH[f.ci].f.walk;fr=revisedFighterFrame(f.ci,'walk',vclock)||wf[Math.floor(vclock*10)%wf.length];dy=Math.sin(vclock*20)*1.4;angle=Math.sin(vclock*10)*.014}}
  // shadow + color ring
  if(!impactOn){ctx.save();const so=clamp(1-ra/260,.15,1);ctx.globalAlpha=so;const sg=ctx.createRadialGradient(rx,GY+5,4,rx,GY+5,54);sg.addColorStop(0,'rgba(4,4,10,.62)');sg.addColorStop(1,'rgba(4,4,10,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(rx,GY+5,Math.max(24,56-ra*.1),11,0,0,TAU);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=col+'70';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(rx,GY+4,41,8,0,0,TAU);ctx.stroke();
  if(!lowQ()){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=f.mt>=100?.3+.12*Math.sin(vclock*8):.14;ctx.drawImage(glow(col),rx-90,GY-12,180,34)}ctx.restore()}
  if(f.st==='idle'&&!reduced){
    const sway=Math.sin(vt*(2.8+f.ci%3*.45)+f.ci);
    dx+=sway*2.5;
    angle=sway*.013;
  }
  if(f.st==='walk'){dy=Math.sin(vt*20)*1.6;angle=Math.sin(vt*10)*.016}
  if(f.st==='jump'){const s=clamp(-f.vy/790,-1,1);sy+=Math.abs(s)*.07;sx-=Math.abs(s)*.045;angle=f.face*Math.sign(f.vx)*.05}
  if(f.st==='sp'&&f.ultimate){({sx,sy,angle,dx,dy}=ultimateBodyMotion(f))}
  else if(ATK[f.st]){const a=moveData(f),wind=ease(vt/a.hit),rec=ease((vt-a.hit)/(a.dur-a.hit)),pulse=Math.sin(wind*Math.PI)*(1-rec),thrust=wind*(1-rec);sx+=pulse*.03+thrust*.03;sy-=pulse*.022+thrust*.012;angle=(f.st==='upper'?-.05:.03)*Math.sin(clamp(vt/a.dur,0,1)*Math.PI);dx+=f.face*(thrust*9-(1-wind)*4*(vt<a.hit?1:0))}
  if(f.st==='hit'){const k=Math.sin(clamp(vt/.31,0,1)*Math.PI);angle=-k*.17;dx=-f.face*k*6;sx-=k*.03;sy+=k*.02}
  if(f.st==='down'&&fr!==stanceFrame(f)){const t=ease(vt/.25);angle=-t*.95;dx=f.face*t*22}
  if(f.st==='crouch'&&!reduced)sy+=Math.sin(vt*5+f.ci)*.023;
  if(f.st==='dash'){angle=.13;sy=.95;sx=1.06}if(f.st==='block'){sy=.97;dx-=f.face*Math.sin(clamp(vt/.18,0,1)*Math.PI)*4}if(f.shieldA>.02){const g=f.shieldA*(REVISED_FIGHTERS[f.ci]?.5:1);angle-=.08*g;sy-=.035*g;sx+=.02*g;dx-=f.face*6*g}
  if(f.st==='win'&&!reduced)dy-=Math.abs(Math.sin(vt*6.5))*13*Math.exp(-vt*.9);
  if(f.land>0){const k=Math.sin(f.land/.16*Math.PI);sy-=k*.09;sx+=k*.07}
  if(hitstop>0&&(f.st==='hit'||f.st==='down')&&!reduced)dx+=Math.sin(vclock*95)*3;
  ({sx,sy,angle,dy}=chargePose(f,{sx,sy,angle,dy}));
  if(f.ci===0&&f.st==='sp'&&dy<0){
    const view=ctx.getTransform(), floor=GY-ra;
    const top=(view.b*(rx+dx)+view.d*(floor+dy-fr.ay*fr.scale*sy)+view.f)/RS;
    dy=Math.min(0,dy+Math.max(0,155-top)*RS/view.d);
  }
  const X=rx+dx,Y=GY-ra+dy,opacity=f.inv>0&&Math.floor(vclock*30)%2?.7:1;
  if(impactOn){drawSprite(fr,X,Y,f.face,1,false,sx,sy,angle,f===impact.victim?'#ffffff':COL[f.ci]);return}
  if(ARENAS[arenaId].wet&&!lowQ()){ctx.save();ctx.beginPath();ctx.rect(0,GY+5,W,H-GY);ctx.clip();drawSprite(fr,X,GY+11+ra-dy,f.face,.13,false,sx,-sy*.48,angle,col);ctx.restore()}
  if(!CH[f.ci].extra?.[f.st]&&(ATK[f.st]||f.st==='dash'))drawTrace(fr,X,Y,f.face,sx,sy,angle,col,true);
  const zaitoShade=zaitoShadowStrength(f);
  if(zaitoShade>.06) {
    ctx.save();
    ctx.globalAlpha=zaitoShade*.34;
    ctx.drawImage(glow('#9b68e7'),X-128,Y-239,256,250);
    ctx.restore();
  } else if(f.st!=='sp'&&f.st!=='technique')drawManaAura(f,fr,X,Y,sx,sy,angle);
  if(!impactOn)drawLighting(f,fr,X,Y,sx,sy,angle,ra,'under');
  drawSprite(fr,X,Y,f.face,opacity,!CH[f.ci].extra?.[f.st],sx,sy,angle);
  if(!impactOn)drawLighting(f,fr,X,Y,sx,sy,angle,ra,'over');
  if(f.shieldA>.05&&!lowQ()){ctx.save();ctx.globalCompositeOperation='lighter';const ga=.12*f.shieldA+(f.guardFlash>0?.2*clamp(f.guardFlash/.2,0,1):0);for(const o of[-2,2])drawSprite(fr,X+o,Y,f.face,ga,false,sx,sy,angle,'#7fe6ff');ctx.restore()}
  if(zaitoShade>0)drawSprite(fr,X,Y,f.face,zaitoShade*.83,false,sx,sy,angle,'#080610');
  drawCinematicFighterFX(f,X,Y,fr);
  drawTacticalOverlay(f,X,Y);
  if(f.armor>0||f.counter>0){ctx.save();ctx.globalCompositeOperation='lighter';drawSprite(fr,X,Y,f.face,.32+.2*Math.sin(vclock*30),false,sx,sy,angle,col);ctx.restore()}
  if(f.hitGlow>0)drawSprite(fr,X,Y,f.face,clamp(f.hitGlow/.13,0,1)*(superScreen?.beat>=0?.51:.85),false,sx,sy,angle,'#ffffff');
  drawMesh(fr,X,Y,f.face,sx,sy,angle);
  if((f.angle>0||f.setup>0)&&!currentStatus(f)){const c2=f.angle>0?'#ff758b':f.setup>0?'#8eb6ff':'#d5a8ff';text(f.angle>0?'MARKED':f.setup>0?'SETUP':'SLOWED',rx,GY-ra-205,10,c2);ctx.save();ctx.strokeStyle=c2;ctx.lineWidth=1.5;ctx.globalAlpha=.8;ctx.setLineDash([5,5]);ctx.lineDashOffset=-vclock*30;ctx.beginPath();ctx.ellipse(rx,GY-ra-222,13,5,0,0,TAU);ctx.stroke();ctx.restore()}
}
function crescent(R,aT,aH,thick){const n=14;ctx.beginPath();for(let i=0;i<=n;i++){const a=aT+(aH-aT)*i/n;ctx.lineTo(Math.cos(a)*R,Math.sin(a)*R)}for(let i=n;i>=0;i--){const a=aT+(aH-aT)*i/n,r=R-thick*Math.sin(Math.PI*i/n)*(.35+.65*i/n);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill()}
function drawSwoosh(s){if(s.t<0)return;const f=s.f,p=s.t/s.dur,head=easeOut(p*1.7),tail=easeOut(clamp(p*1.7-.55,0,1)),al=(1-p)*(1-p);if(head<=tail)return;ctx.save();ctx.translate(rxOf(f),GY-raOf(f));ctx.scale(f.face,1);ctx.globalCompositeOperation='lighter';
  const arc=(R,a0,a1,th,cy)=>{ctx.save();ctx.translate(0,cy);ctx.globalAlpha=al*.75;ctx.fillStyle=s.col;crescent(R,lerp(a0,a1,tail),lerp(a0,a1,head),th);ctx.globalAlpha=al*.9;ctx.fillStyle='#ffffff';crescent(R,lerp(a0,a1,tail),lerp(a0,a1,head),th*.3);ctx.restore()};
  if(s.kind==='punch'){const x0=20+tail*70,x1=20+head*100;ctx.globalAlpha=al*.8;ctx.fillStyle=s.col;ctx.beginPath();ctx.moveTo(x0,-100);ctx.lineTo(x1,-112);ctx.lineTo(x1+14,-103);ctx.lineTo(x1,-94);ctx.closePath();ctx.fill();ctx.globalAlpha=al;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(x0+10,-102);ctx.lineTo(x1,-107);ctx.lineTo(x1+8,-103);ctx.lineTo(x1,-99);ctx.closePath();ctx.fill()}
  else if(s.kind==='kick')arc(118,-1.15,.55,26,-88);
  else if(s.kind==='upper')arc(112,1.0,-1.45,28,-80);
  else{arc(150,-1.3,.7,38,-90);arc(118,.9,-1.2,22,-90)}
  ctx.restore()}
const tintCache=new Map();
function tintedFX(frame,color){const key=frame+color;if(tintCache.has(key))return tintCache.get(key);const fr=FX_META.frames[12+frame],c=document.createElement('canvas');c.width=c.height=320;const g=c.getContext('2d');g.drawImage(fxImage,fr.x,fr.y,320,320,0,0,320,320);g.globalCompositeOperation='source-atop';g.globalAlpha=.7;g.fillStyle=color;g.fillRect(0,0,320,320);tintCache.set(key,c);return c}
function drawFX(row,frame,x,y,size,face=1,alpha=1,t=0,color=null){if(!fxImage||row===4)return;ctx.save();ctx.translate(x,y);ctx.scale(face,1);ctx.globalAlpha=alpha;const fr=FX_META.frames[row*6+clamp(frame,0,5)],s=size/256;ctx.imageSmoothingEnabled=true;if(row===2&&color)ctx.drawImage(tintedFX(clamp(frame,0,5),color),-160*s,-160*s,320*s,320*s);else ctx.drawImage(fxImage,fr.x,fr.y,320,320,-160*s,-160*s,320*s,320*s);ctx.restore()}
function drawSkillGlyph(s,x,y){ctx.save();ctx.translate(x,y);ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=2;ctx.globalAlpha=.9;const id=s.owner.ci;if([0,4,7].includes(id)){for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-14,i*7);ctx.lineTo(10,i*7);ctx.stroke()}}else if(id===2){ctx.beginPath();ctx.arc(0,0,16,0,TAU);ctx.moveTo(-22,0);ctx.lineTo(22,0);ctx.moveTo(0,-22);ctx.lineTo(0,22);ctx.stroke()}else if(id===8||id===6){ctx.beginPath();ctx.arc(0,0,15,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(0,1,8,0,Math.PI);ctx.stroke();ctx.fillRect(-6,-6,2,3);ctx.fillRect(5,-6,2,3)}else{ctx.rotate(s.t*5);ctx.strokeRect(-11,-11,22,22)}ctx.restore()}
function drawParticles(){
  for(const p of parts){const a=clamp(p.l/p.max,0,1);
    if(p.k==='dust'){const r=p.size+p.grow*(1-a);ctx.globalAlpha=.36*a;ctx.drawImage(DUST,p.x-r,p.y-r,r*2,r*2)}
    else if(p.k==='shard'){ctx.globalAlpha=Math.min(1,a*2.2);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.c;ctx.beginPath();ctx.moveTo(-p.size*1.7,0);ctx.lineTo(0,-p.size*.7);ctx.lineTo(p.size*2.1,0);ctx.lineTo(0,p.size*.7);ctx.closePath();ctx.fill();ctx.strokeStyle='#0b1020';ctx.lineWidth=.8;ctx.stroke();ctx.restore()}
    else if(p.k==='conf'){ctx.globalAlpha=Math.min(1,a*3);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.scale(1,Math.cos(vclock*7+p.ph));ctx.fillStyle=p.c;ctx.fillRect(-p.size,-p.size*.5,p.size*2,p.size);ctx.restore()}}
  ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  for(const p of parts){const a=clamp(p.l/p.max,0,1);
    if(p.k==='spark'){ctx.globalAlpha=a;ctx.strokeStyle=p.c;ctx.lineWidth=p.size*(.4+.6*a);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.03,p.y-p.vy*.03);ctx.stroke()}
    else if(p.k==='ember'){const r=p.size*2.7;ctx.globalAlpha=a*(.6+.4*Math.sin(vclock*18+p.ph));ctx.drawImage(glow(p.c),p.x-r,p.y-r,r*2,r*2)}
    else if(p.k==='ring'){const t=1-a,r=p.size*(.18+.82*easeOut(t));ctx.globalAlpha=a*a;ctx.strokeStyle=p.c;ctx.lineWidth=p.w*a+.6;ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*p.sq,0,0,TAU);ctx.stroke()}
    else if(p.k==='flare'){const t=1-a,s=p.size*(.45+.75*easeOut(t));ctx.globalAlpha=a;ctx.drawImage(glow(p.c),p.x-s*.8,p.y-s*.8,s*1.6,s*1.6);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle='#ffffff';ctx.beginPath();for(let i=0;i<8;i++){const r=i%2?s*.07:s*(i%4?.5:1),an=i*TAU/8;ctx.lineTo(Math.cos(an)*r,Math.sin(an)*r)}ctx.closePath();ctx.fill();ctx.restore()}
    else if(p.k==='fglow'){ctx.globalAlpha=a*.6;ctx.drawImage(glow(p.c),p.x-p.size,p.y-p.size*.2,p.size*2,p.size*.4)}
    else if(p.k==='line'){ctx.globalAlpha=a*.5;ctx.strokeStyle=p.c;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.sign(p.vx)*-p.size,p.y);ctx.stroke()}}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1}

// ---------- text & HUD ----------
function text(s,x,y,size=20,col='#fff',align='center'){ctx.save();ctx.font=`800 ${size}px Arial,sans-serif`;ctx.textAlign=align;ctx.lineJoin='round';ctx.lineWidth=Math.max(3,size*.22);ctx.strokeStyle='#090d17';ctx.strokeText(s,x,y);ctx.fillStyle=col;ctx.fillText(s,x,y);ctx.restore()}
function dtext(s,x,y,size=20,col='#fff',align='center',stroke='#090d17'){ctx.save();ctx.font=`italic ${DW} ${size}px ${DISP}`;ctx.textAlign=align;ctx.lineJoin='round';ctx.lineWidth=Math.max(3,size*.2);ctx.strokeStyle=stroke;ctx.strokeText(s,x,y);ctx.fillStyle=col;ctx.fillText(s,x,y);ctx.restore()}
function para(x,y,w,h,sk){ctx.beginPath();ctx.moveTo(x+sk,y);ctx.lineTo(x+w+sk,y);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath()}
const portraits=[];
function portrait(ci){if(portraits[ci])return portraits[ci];const fr=CH[ci].f.idle[0],bb=fr.bounds,c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),side=Math.min(bb.w,bb.h*.62);g.imageSmoothingQuality='high';if(!drawIdlePortrait(ci,0,g,0,0,128))g.drawImage(fr.im,fr.x+bb.x+(bb.w-side)/2,fr.y+bb.y,side,side,0,0,128,128);portraits[ci]=c;return c}
// The HUD face changes only a few times a second, but drawing it straight from the big expression sheets
// through a circular clip every frame was the single most expensive thing on screen. Bake each face once.
const portraitCache=new Map();let portraitIds=new WeakMap(),portraitNext=1;
function drawPortraitCached(f,px,py,pr,right){const ex=ready?combatPortraitFrame(f):null;let id=ex?portraitIds.get(ex):0;if(ex&&!id){id=portraitNext++;portraitIds.set(ex,id)}const key=f.ci+':'+id+':'+(right?1:0);let c=portraitCache.get(key);
  if(!c){const S=3,D=pr*2*S;c=document.createElement('canvas');c.width=c.height=D;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.beginPath();g.arc(D/2,D/2,D/2,0,TAU);g.fillStyle='#141a2a';g.fill();g.clip();g.translate(D/2,D/2);g.scale((right?-1:1)*S,S);
    if(ready){if(!ex)g.drawImage(portrait(f.ci),-pr,-pr+2,pr*2,pr*2);else if(ex.faceCrop){const[fx,fy,fw,fh]=ex.faceCrop;g.drawImage(ex.im,ex.x+fx,ex.y+fy,fw,fh,-pr,-pr-2,pr*2,pr*2+5)}else{const crop=.10,cell=ex.width/3,row=ex.height/3,ci=f.ci;g.drawImage(ex,(ci%3+crop)*cell,(Math.floor(ci/3)+crop*.61)*row,cell*(1-crop*2),row*(1-crop*1.22),-pr,-pr-2,pr*2,pr*2+5)}}
    if(ready){if(portraitCache.size>160)portraitCache.clear();portraitCache.set(key,c)}}
  ctx.drawImage(c,px-pr,py-pr,pr*2,pr*2)}
function hud(f,right){const d=right?-1:1,m=x=>right?W-x:x,col=COL[f.ci],sh=f.hudShake>0&&!reduced?Math.sin(vclock*85)*f.hudShake*4:0;
  ctx.save();ctx.translate(sh*d,sh*.6);
  ctx.fillStyle='#070b14cc';para(m(14),14,d*424,72,d*-16);ctx.fill();ctx.fillStyle=col;para(m(14),83,d*424,3,0);ctx.globalAlpha=.55;ctx.fill();ctx.globalAlpha=1;
  // health
  const x0=m(88),bw=330,by=36,bh=19,sk=d*7;
  ctx.fillStyle='#2b2030';para(x0,by,d*bw,bh,sk);ctx.fill();
  ctx.fillStyle='#ffe9d6';para(x0,by,d*bw*f.shownHP/100,bh,sk);ctx.fill();
  if(f.hp>0){const g=ctx.createLinearGradient(0,by,0,by+bh);g.addColorStop(0,'#ffffff');g.addColorStop(.18,col);g.addColorStop(1,col);ctx.fillStyle=g;para(x0,by,d*bw*f.hp/100,bh,sk);ctx.fill();ctx.fillStyle='#00000030';para(x0,by+bh*.62,d*bw*f.hp/100,bh*.38,sk*.38);ctx.fill();
    if(f.hp<25){ctx.fillStyle=`rgba(255,59,48,${.3+.3*Math.sin(vclock*10)})`;para(x0,by,d*bw*f.hp/100,bh,sk);ctx.fill()}}
  ctx.strokeStyle='#00000055';ctx.lineWidth=1;for(let i=1;i<10;i++){const xx=x0+d*bw*i/10;ctx.beginPath();ctx.moveTo(xx+sk,by);ctx.lineTo(xx,by+bh);ctx.stroke()}
  ctx.strokeStyle=f.hitGlow>0?'#ffffff':'#ffffff40';ctx.lineWidth=1.5;para(x0,by,d*bw,bh,sk);ctx.stroke();
  // energy
  const ey=61,eh=7,ew=236,full=f.mt>=100;ctx.fillStyle='#18233a';para(x0,ey,d*ew,eh,d*3);ctx.fill();
  ctx.fillStyle=full?(reduced||Math.sin(vclock*7)>0?'#fff2af':'#ffd36a'):col;para(x0,ey,d*ew*f.mt/100,eh,d*3);ctx.fill();
  if(full&&!lowQ()){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.35+.25*Math.sin(vclock*10);ctx.drawImage(glow('#ffd36a'),Math.min(x0,x0+d*ew)-10,ey-10,ew+20,eh+20);ctx.restore()}
  ctx.strokeStyle='#00000066';for(const tk of[.2,.3]){const xx=x0+d*ew*tk;ctx.beginPath();ctx.moveTo(xx,ey);ctx.lineTo(xx,ey+eh);ctx.stroke()}
  text(full?'FULL MANA':Math.floor(f.mt)+' MANA',x0+d*(ew+10),ey+8,10,full?'#ffe49d':'#aab7cc',right?'right':'left');
  dtext(CH[f.ci].name.toUpperCase(),x0+d*2,31,21,'#f4efe6',right?'right':'left');
  text(f.human?'YOU':difficulty==='training'?'DUMMY':'CPU',x0+d*bw,29,10,f.human?'#f5ce84':'#8f9eb9',right?'left':'right');
  for(let k=0;k<2;k++){ctx.save();ctx.translate(m(352-k*16),25);ctx.rotate(Math.PI/4);ctx.fillStyle=k<f.wins?'#ffda86':'#3d4558';ctx.fillRect(-5,-5,10,10);ctx.strokeStyle='#090d17';ctx.lineWidth=1.5;ctx.strokeRect(-5,-5,10,10);ctx.restore()}
  // portrait
  const px=m(50),py=50,pr=31;drawPortraitCached(f,px,py,pr,right);
  if(f.hitGlow>0){ctx.save();ctx.globalAlpha=clamp(f.hitGlow/.13,0,1)*.21;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px,py,pr,0,TAU);ctx.fill();ctx.restore()}
  ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(px,py,pr,0,TAU);ctx.stroke();ctx.strokeStyle='#090d17';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(px,py,pr+2.4,0,TAU);ctx.stroke();
  ctx.restore();
  // combo counter
  if(f.combo>=2&&f.comboTime>0){const a=clamp(f.comboTime/.3,0,1),pop=1+.45*f.comboPop;ctx.save();ctx.globalAlpha=a;ctx.translate(m(36),196);ctx.rotate(d*-.07);ctx.scale(pop,pop);dtext(String(f.combo),0,0,54,col,right?'right':'left');const nw=(()=>{ctx.font=`italic ${DW} 54px ${DISP}`;return ctx.measureText(String(f.combo)).width})();dtext(f.combo>=7?'UNSTOPPABLE':f.combo>=5?'ON FIRE':'HITS',d*(nw+10),0,20,'#fff3d5',right?'right':'left');ctx.restore()}}
function drawTimer(){const training=difficulty==='training',low=!training&&timer<=10&&phase==='fight';ctx.save();ctx.fillStyle='#070b14d8';ctx.beginPath();ctx.moveTo(436,12);ctx.lineTo(524,12);ctx.lineTo(512,88);ctx.lineTo(448,88);ctx.closePath();ctx.fill();ctx.strokeStyle=low?'#ff5a4e':'#f5be5880';ctx.lineWidth=2;ctx.stroke();
  const s=low&&!reduced?1+.1*Math.abs(Math.sin(vclock*Math.PI)):1;ctx.translate(480,62);ctx.scale(s,s);dtext(training?'∞':String(Math.ceil(timer)),0,0,42,low?'#ff7a6e':'#f8efdc');ctx.restore();text(training?'PRACTICE':'ROUND '+round,480,82,9,'#adbad0')}
function drawSkillBar(){if(isTouch||phase!=='fight')return;const skills=[['J','□ PUNCH',0],['K','△ KICK',0],['␣','✕ JUMP',0],['L','○ POWER',45],['Q','L1 CHARGE',0],['E','L2 ULT',100]];
  skills.forEach(([key,name,cost],i)=>{const x=205+i*93,y=503,w=86,h=28,dash=name==='DASH',ok=P1.mt>=cost&&(!dash||P1.cd<=0)&&(name!=='UPPER'||!(P1.upCD>0)),sup=name==='L2 ULT'&&ok;
    ctx.fillStyle=ok?'#0d1422e0':'#0d142290';para(x,y,w,h,6);ctx.fill();
    if(dash&&P1.cd>0){ctx.fillStyle='#f5be5830';para(x,y,w*(1-P1.cd/DASH_CD),h,6);ctx.fill()}if(name==='UPPER'&&P1.upCD>0){ctx.fillStyle='#92e5ff30';para(x,y,w*(1-P1.upCD/UPPER_CD),h,6);ctx.fill()}
    if(cost&&!ok){ctx.fillStyle=COL[P1.ci]+'38';para(x,y,w*clamp(P1.mt/cost,0,1),h,6);ctx.fill()}
    ctx.strokeStyle=sup?(Math.sin(vclock*10)>0?'#fff2af':'#f5be58'):ok?'#ffffff30':'#ffffff14';ctx.lineWidth=sup?2:1;para(x,y,w,h,6);ctx.stroke();
    ctx.fillStyle=ok?'#f5be58':'#555d70';para(x+4,y+5,18,18,3);ctx.fill();ctx.save();ctx.font='800 11px Arial,sans-serif';ctx.textAlign='center';ctx.fillStyle='#10141f';ctx.fillText(key,x+14.5,y+18);ctx.restore();
    text(name,x+30,y+18,10,ok?'#e9ebf0':'#69728a','left')})}
function drawAnnounce(){if(!msg||!['intro','fight','ko'].includes(phase))return;const t=msgT,big=msg==='FIGHT'||msg==='K.O.',inn=reduced?1:easeOut(t/.16),col=msg==='ROUND WON'||msg==='PERFECT ROUND'||msg==='FIGHT'?'#f5be58':msg==='K.O.'?'#ff5a4e':msg==='ROUND LOST'?'#ff8f96':'#fff0d5';
  ctx.save();ctx.globalAlpha=clamp(t/.08,0,1);ctx.fillStyle='#070b14a8';const bw=W*inn;para(480-bw/2-30,159,bw+60,70,-34);ctx.fill();ctx.fillStyle=col;ctx.globalAlpha*=.8;para(480-bw/2-30,159,bw+60,3,0);ctx.fill();para(480-bw/2-64,226,bw+60,3,0);ctx.fill();ctx.restore();
  const sc=reduced?1:lerp(big?3:2.1,1,easeOut(t/(big?.2:.16)))*(big?1+.03*Math.sin(vclock*30)*Math.max(0,1-t*2):1),size=msg.length>12?44:big?64:52;
  ctx.save();ctx.translate(480,192+size*.30);ctx.scale(sc,sc);ctx.globalAlpha=clamp(t/.06,0,1);dtext(msg,0,0,size,col);ctx.restore()}
function drawBanner(){if(!banner)return;const b=banner,p=b.t/b.dur,inn=reduced?1:easeOut(p*4),out=reduced?0:ease((p-.78)/.22),col=COL[b.ci],y=96;
  ctx.save();ctx.globalAlpha=1-out;const off=(1-inn)*-b.face*W+out*b.face*200;ctx.translate(off,0);
  ctx.fillStyle='#070b14d0';para(-40,y,W+80,56,-26);ctx.fill();ctx.fillStyle=col;para(-40,y,W+80,4,-2);ctx.fill();para(-66,y+52,W+80,4,-2);ctx.fill();
  dtext(ROLES[b.ci],b.face>0?150:W-150,y+42,40,col,b.face>0?'left':'right');text(CH[b.ci].name.toUpperCase()+' · SUPER',b.face>0?152:W-152,y+12,10,'#f4efe6',b.face>0?'left':'right');
  ctx.save();ctx.beginPath();ctx.arc(b.face>0?92:W-92,y+28,40,0,TAU);ctx.fillStyle='#141a2a';ctx.fill();ctx.clip();ctx.translate(b.face>0?92:W-92,y+28);ctx.scale(b.face,1);const caster=superScreen?.f;
  const faceArt=caster?.ci===b.ci?ultimateFaceImage(caster):null;
  if(!drawExpressionCell(faceArt,b.ci,-40,-40,80,83))ctx.drawImage(portrait(b.ci),-40,-38,80,80);
  ctx.restore();ctx.strokeStyle=col;ctx.lineWidth=4;ctx.beginPath();ctx.arc(b.face>0?92:W-92,y+28,40,0,TAU);ctx.stroke();ctx.restore()}

// ---------- scene drawing ----------
const noiseAt=(t,s)=>Math.sin(t*37.1+s)*.6+Math.sin(t*61.7+s*2.3)*.4;
function drawScene(){drawEnvironmentBase()}
function draw(){ctx.setTransform(RS,0,0,RS,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#07060d';ctx.fillRect(0,0,W,H);if(!scene)return;
  ctx.save();const tr=reduced?0:cam.trauma*cam.trauma,t=vclock;
  ctx.translate(W/2+noiseAt(t,1)*tr*17+(reduced?0:cam.kx),H/2+noiseAt(t,7)*tr*13+(reduced?0:cam.ky));ctx.rotate(noiseAt(t,13)*tr*.02);ctx.scale(cam.z,cam.z);ctx.translate(-cam.cx,-cam.cy);
  const screenFx=superScreen?readUltimateScreen(ctx.getTransform()):null;
  drawScene();drawMountainSky();drawEnvironmentFloor();drawReferee();
  if(P1){
    if(superDim>0){ctx.fillStyle=`rgba(6,5,16,${.62*ease(superDim)})`;ctx.fillRect(-100,-100,W+200,H+200)}
    drawUltimateBackdrop(screenFx);
    for(const g of ghosts){ctx.save();ctx.globalCompositeOperation='lighter';drawSprite(g.fr,g.x,GY-g.air,g.face,(1-g.t/g.dur)*.42,false,1,1,0,g.col);ctx.restore()}
    drawMountain(P1);drawMountain(P2);
    drawTechnique(P1,P2);drawTechnique(P2,P1);
    drawUltimate(P1);drawUltimate(P2);
    drawZaitoShadow(screenFx);
    drawZaitoMeteors(screenFx);
    const order=ATK[P1.st]&&!ATK[P2.st]?[P2,P1]:[P1,P2];drawF(order[0]);drawF(order[1]);for(const f of[P1,P2])if(f.guardFlash>0)drawBlockSpark(f,rxOf(f),raOf(f));
    for(const s of swooshes)drawSwoosh(s);
    for(const s of shots){const x=s.px===undefined?s.x:lerp(s.px,s.x,renderAlpha),y=s.py===undefined?s.y:lerp(s.py,s.y,renderAlpha),sz=s.at.rapid?80:110;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55+.15*Math.sin(vclock*30);ctx.drawImage(glow(s.color),x-sz*.7,y-sz*.7,sz*1.4,sz*1.4);ctx.globalAlpha=.45*clamp(1-(GY-y)/260,0,1);ctx.drawImage(glow(s.color),x-sz*.9,GY-sz*.1,sz*1.8,sz*.3);ctx.restore();if(s.at.kind==='power' && (s.owner.ci===0||s.owner.ci===6)){
      if(s.owner.ci===6) drawCinematicTile('comic-effects',4+Math.floor(s.t*10)%3,x,y,60,48,s.face,1);
      else {
        const punch=cinematicFrames['loonie-priest'][17];
        ctx.save();ctx.translate(x,y);ctx.scale(s.face,1);
        ctx.drawImage(punch.im,punch.x+punch.w*.62,punch.y+punch.h*.35,punch.w*.37,punch.h*.21,-31,-14,62,28);ctx.restore();
      }
    }else{drawFX(2,Math.floor(s.t*18)%6,x,y,sz,s.face,1,0,s.color);drawSkillGlyph(s,x,y)}}
    for(const e of effects){const t=e.t/e.dur;drawFX(e.row,Math.min(5,Math.floor(t*6)),e.x,e.y,e.size*(.9+.15*ease(t)),e.face,1-ease((t-.7)/.3),t)}
  }
  drawEnvironmentFX();drawParticles();drawBolts();if(P1)drawPops();
  if(P1)for(const t of texts){const k=t.t/t.dur,sc=t.pop&&!reduced?lerp(1.9,1,easeOut(t.t/.13)):1;ctx.save();ctx.globalAlpha=1-ease((k-.65)/.35);ctx.translate(t.x,t.y);ctx.scale(sc,sc);if(t.pop)dtext(t.text,0,0,t.size,t.col);else text(t.text,0,0,t.size,t.col);ctx.restore()}
  drawImpact();
  ctx.restore();
  ctx.drawImage(scene.vig,0,0,W,H);
  drawUltimateEdges(screenFx);
  drawCrownVerse(screenFx);
  if(flash>0&&!reduced){ctx.fillStyle=`rgba(255,236,205,${Math.min(.75,flash*2.4)})`;ctx.fillRect(0,0,W,H)}
  if(!P1){if(showFps)drawFps();return}
  drawDanger();drawBanner();hud(P1,false);hud(P2,true);drawTimer();drawAnnounce();drawSkillBar();drawKeyHint();drawCooldowns();drawUiFx();drawCrowdTexts();drawVS();if(showFps)drawFps()}
let fpsEma=60;function drawFps(){text(Math.round(fpsEma)+' FPS'+(lowQ()?' · low':''),480,104,9,'#9fe7a4')}
function drawPreview(){const c=$('pv');if(!c||!ready||!c.offsetParent)return;const g=c.getContext('2d'),w=c.width,h=c.height,F=CH[sel].f,col=COL[sel],cyc=vclock%4.4;g.clearRect(0,0,w,h);
  let fr=idleExpressionFrame(sel,vclock)||F.idle[0],st='idle',lt=0;for(const[name,at]of[['punch',1.2],['kick',2.2],['upper',3.2]])if(cyc>=at&&cyc<at+ATK[name].dur){st=name;lt=cyc-at;let idx=0;TIMING[name].forEach((tt,i)=>{if(lt>=tt)idx=i});fr=revisedFighterFrame(sel,name,lt)||F[name][Math.min(idx,F[name].length-1)]}
  const k=h*.86/185,x=w*.46,y=h*.95,br=st==='idle'&&!reduced?Math.sin(vclock*4.1)*.024:0,th=st==='idle'?0:Math.sin(clamp(lt/ATK[st].dur,0,1)*Math.PI);
  g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.5;g.drawImage(glow(col),x-w*.36,y-h*.1,w*.72,h*.2);g.restore();g.fillStyle='#05070c88';g.beginPath();g.ellipse(x,y+4,70*k/1.6,10,0,0,TAU);g.fill();
  drawSprite(fr,x+th*14,y,1,1,true,1-br+th*.03,1+br-th*.02,st==='upper'?-th*.05:th*.03,null,g,k)}

/*__ARENA__*/
/*__EXPANSION__*/
/*__ULTIMATES__*/
/*__ULTIMATE_SCREEN__*/
/*__ULTIMATE_PERFORMANCE__*/
/*__CINEMATICS__*/
/*__TECHNIQUES__*/
/*__TACTICS__*/
// ---------- Showtime layer: impact frames, comic pops, lightning, UI orbs, VS splash, living arenas ----------
let impact=null,impactOn=false,pops=[],bolts=[],uiOrbs=[],uiChips=[],crowdTexts=[],stats={dealt:0,taken:0,parries:0,blocks:0,supers:0,t0:0},introT0=0,vsSlam=false,skyFlash=0,skyBolt=null,nextSky=4,ambT=0,showerT=1.5,popFX=store.get('pops',true);
const POP_WORDS={kick:['WHAM!','CRACK!','BAM!'],upper:['POW!','BOOM!','OOF!'],sp:['KABOOM!','BARS!','BODIED!'],counter:['REBUTTAL!']};
const CROWD_WORDS=['OOOOH!','AYOS!','GRABE!','BARS!','WOOO!','SHEESH!'];
function resetShowtime(){impact=null;pops=[];bolts=[];uiOrbs=[];uiChips=[];crowdTexts=[];vsSlam=false;skyFlash=0;skyBolt=null}
const toScreen=(x,y)=>[(x-cam.cx)*cam.z+W/2,(y-cam.cy)*cam.z+H/2];
function roundLabel(){return difficulty==='training'?'TRAINING':'ROUND '+round}
function jagged(x1,y1,x2,y2,jag){const n=Math.max(4,Math.round(Math.hypot(x2-x1,y2-y1)/22)),nx=-(y2-y1),ny=x2-x1,len=Math.hypot(nx,ny)||1,pts=[];for(let i=0;i<=n;i++){const t=i/n,off=i&&i<n?(rand()-.5)*jag*2:0;pts.push([lerp(x1,x2,t)+nx/len*off,lerp(y1,y2,t)+ny/len*off])}return pts}
function bolt(x1,y1,x2,y2,col,life=.16,width=2.4,jag=18){bolts.push({pts:jagged(x1,y1,x2,y2,jag),col,t:0,dur:life,w:width});if(bolts.length>(lowQ()?16:40))bolts.shift()}
function strokeBolt(b,a){const path=()=>{ctx.beginPath();b.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]))};ctx.globalAlpha=a*.45;ctx.strokeStyle=b.col;ctx.lineWidth=b.w*3.2;path();ctx.stroke();ctx.globalAlpha=a;ctx.strokeStyle='#ffffff';ctx.lineWidth=b.w*.8;path();ctx.stroke()}
function drawBolts(){if(!bolts.length)return;ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineJoin='round';ctx.lineCap='round';for(const b of bolts)strokeBolt(b,1-b.t/b.dur);ctx.restore()}
let popGate=0;function pop(text,x,y,col,size=34){if(!popFX)return;const now=performance.now();if(now<popGate)return;popGate=now+380;pops.push({text,x:clamp(x,90,W-90),y,col,size,rot:(rand()-.5)*.5,t:0,dur:.62,seed:rand()*10});if(pops.length>5)pops.shift()}
function crowdShout(){if(arenaId!==2||!popFX||crowdTexts.filter(c=>c.t<.7).length>=2)return;const left=!crowdTexts.length||crowdTexts[crowdTexts.length-1].x>480;crowdTexts.push({text:CROWD_WORDS[Math.floor(rand()*CROWD_WORDS.length)],x:left?110+rand()*170:680+rand()*170,y:150+rand()*30,t:0,dur:1.15,rot:(rand()-.5)*.22});if(crowdTexts.length>4)crowdTexts.shift()}
function drawPops(){
  for(const c of []){const k=0;ctx.rotate(c.rot);ctx.globalAlpha=clamp(c.t/.1,0,1)*(1-ease((k-.55)/.45));const s=reduced?1:backOut(clamp(c.t/.18,0,1));ctx.scale(s,s);dtext(c.text,0,0,27,'#fff3d5');ctx.restore()}
  for(const p of pops){const k=p.t/p.dur,sc=reduced?1:backOut(clamp(p.t/.14,0,1)),al=1-ease((k-.6)/.4);ctx.save();ctx.translate(p.x,p.y-k*14);ctx.rotate(p.rot);ctx.scale(sc,sc);ctx.globalAlpha=al;ctx.font=`italic ${DW} ${p.size}px ${DISP}`;
    const w=ctx.measureText(p.text).width/2+20,h=p.size*.74,n=18;ctx.beginPath();for(let i=0;i<n*2;i++){const an=i*Math.PI/n,r=i%2?1:1.28+.14*Math.sin(i*7.3+p.seed);ctx.lineTo(Math.cos(an)*w*r,Math.sin(an)*h*r-p.size*.32)}ctx.closePath();ctx.fillStyle='#fffaf0';ctx.fill();ctx.lineJoin='round';ctx.lineWidth=5;ctx.strokeStyle='#090d17';ctx.stroke();ctx.lineWidth=2.2;ctx.strokeStyle=p.col;ctx.stroke();
    dtext(p.text,0,0,p.size,p.col);ctx.restore()}
  // "YOU" marker at the start of a round
  if(P1&&(phase==='fight'?pt<2.2:phase==='intro'&&pt>introT0+.7)){const x=rxOf(P1),y=GY-raOf(P1)-224+(reduced?0:Math.sin(vclock*7)*4);ctx.save();ctx.globalAlpha=phase==='fight'?clamp((2.2-pt)/.4,0,1):1;dtext('YOU',x,y,18,'#f5be58');ctx.fillStyle='#f5be58';ctx.strokeStyle='#090d17';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-8,y+6);ctx.lineTo(x+8,y+6);ctx.lineTo(x,y+17);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}}
// One dark frame with white silhouettes and speed rays on the biggest hits (off when motion is reduced).
function impactFrame(victim,x,y,col,dur=.085){if(reduced)return;const rays=[];for(let i=0;i<26;i++)rays.push([rand()*TAU,.25+rand()*.5,.008+rand()*.03]);impact={victim,x,y,col,t:0,dur,rays}}
function drawImpact(){if(!impact||!P1)return;ctx.save();ctx.fillStyle='rgba(7,5,14,.93)';ctx.fillRect(-200,-200,W+400,H+400);ctx.globalCompositeOperation='lighter';ctx.fillStyle=impact.col;ctx.globalAlpha=.5;for(const[a,r0,wd]of impact.rays){ctx.beginPath();ctx.moveTo(impact.x+Math.cos(a-wd)*1300,impact.y+Math.sin(a-wd)*1300);ctx.lineTo(impact.x+Math.cos(a)*r0*260,impact.y+Math.sin(a)*r0*260);ctx.lineTo(impact.x+Math.cos(a+wd)*1300,impact.y+Math.sin(a+wd)*1300);ctx.closePath();ctx.fill()}ctx.restore();impactOn=true;drawF(P1);drawF(P2);impactOn=false}
function trackDamage(a,d,dmg,blocking,at){if(a.human){stats.dealt+=dmg;if(at.kind==='sp'&&!blocking&&!(at.rapid&&!at.knockdown))stats.supers++}if(d.human){stats.taken+=dmg;if(blocking)stats.blocks++}}
function showtimeHit(a,d,at,x,y,dmg){
  const heavy=at.kind==='sp',mid=at.kind==='upper'||at.kind==='kick',col=COL[a.ci],[sx,sy]=toScreen(x,y),right=a===P2;
  for(let i=0,n=qn(heavy?7:mid?4:2);i<n;i++)uiOrbs.push({x:sx,y:sy,f:a,right,t:-i*.035,dur:.42+rand()*.18,cx:sx+(rand()-.5)*220,cy:sy-60-rand()*120,col});
  const hx=d===P2?W-88-330*d.hp/100:88+330*d.hp/100;for(let i=0,n=qn(heavy?10:4);i<n;i++)uiChips.push({x:hx,y:38+rand()*16,vx:(rand()-.5)*130,vy:-40-rand()*90,l:.5+rand()*.3,max:.8,c:rand()<.5?'#ffe9d6':COL[d.ci],s:2+rand()*3});
  if((mid||heavy||at.kind==='counter')&&d.hp>0){const words=POP_WORDS[at.kind]||POP_WORDS.kick;if(heavy||at.kind==='counter'||rand()<.65)pop(words[Math.floor(rand()*words.length)],x+a.face*34,y-74-rand()*20,col,heavy?46:32)}
  if(heavy&&(!at.rapid||at.knockdown)){for(let i=0;i<qn(5);i++){const an=rand()*TAU,r=120+rand()*130;bolt(x,y,x+Math.cos(an)*r,y+Math.sin(an)*r*.7,col,.22,2.6)}crowdShout()}
  else if(at.kind==='upper')bolt(x,y+46,x+a.face*22,y-112,col,.14,2,10);
  if([3,5,7,10].includes(a.combo)){cheer(.35+a.combo*.06);ringFx(a.x,GY-90,col,200,.4,1,4);crowdFlash(4);tone(520+a.combo*40,.12,'triangle',.05);if(a.combo>=5)crowdShout()}}
function showtimeParry(a,d){if(d.human)stats.parries++;const x=d.x+d.face*30,y=GY-95;impactFrame(a,x,y,'#adfff1',.07);for(let i=0;i<qn(4);i++){const an=rand()*TAU;bolt(x,y,x+Math.cos(an)*110,y+Math.sin(an)*80,'#adfff1',.18,2)}pop('DENIED!',d.x,GY-250,'#2bb9a8',30);crowdShout()}
function showtimeKO(winner,loser){const x=loser.x,y=GY-loser.air-90,col=COL[winner.ci];impactFrame(loser,x,y,col,.13);for(let i=0;i<qn(9);i++){const an=i/9*TAU+rand()*.4,r=170+rand()*200;bolt(x,y,x+Math.cos(an)*r,y+Math.sin(an)*r*.7,col,.3,3)}crowdShout();crowdShout()}
function shotTrailExtra(s,dt){s.fxT=(s.fxT||0)-dt;if(s.fxT>0)return;const ci=s.owner.ci,c=s.color;s.fxT=lowQ()?.13:.065;
  if(ci===0)ringFx(s.x,s.y,c,26,.25,1.6,2);
  else if(ci===1)embers(s.x,s.y+Math.sin(s.t*20)*16,'#ff9de0',1,4,4);
  else if(ci===2){if(rand()<.5)flare(s.x,s.y,c,26,.1)}
  else if(ci===3){dust(s.x,s.y+10,1,-s.face*.4,.6);addShake(.012)}
  else if(ci===4)shards(s.x,s.y,c,1,s.face>0?Math.PI:0,1,160);
  else if(ci===5)bolt(s.x,s.y,s.x-s.face*40,s.y+(rand()-.5)*50,c,.1,1.4,8);
  else if(ci===6){if(s.y>GY-52)dust(s.x,GY,2,0,.8)}
  else if(ci===7)sparks(s.x,s.y,c,2,s.face>0?Math.PI:0,.9,240,100);
  else ringFx(s.x,s.y+(rand()-.5)*22,'#ffffff',16,.3,1,1.5)}
function showtimeUpdate(dt,real){
  if(impact){impact.t+=real;if(impact.t>=impact.dur)impact=null}
  for(const p of pops)p.t+=dt;pops=pops.filter(p=>p.t<p.dur);for(const b of bolts)b.t+=dt;bolts=bolts.filter(b=>b.t<b.dur);
  for(const c of crowdTexts)c.t+=real;crowdTexts=crowdTexts.filter(c=>c.t<c.dur);
  for(const o of uiOrbs){o.t+=real;if(o.t>=o.dur)o.f.mtPulse=1}uiOrbs=uiOrbs.filter(o=>o.t<o.dur);
  for(const c of uiChips){c.l-=real;c.vy+=520*real;c.x+=c.vx*real;c.y+=c.vy*real}uiChips=uiChips.filter(c=>c.l>0);
  skyFlash=Math.max(0,skyFlash-real*3.2);if(skyBolt){skyBolt.t+=real;if(skyBolt.t>skyBolt.dur)skyBolt=null}
  if(P1){for(const f of[P1,P2]){f.mtPulse=Math.max(0,(f.mtPulse||0)-real*4);
      if(phase==='fight'&&f.hp>0){if(f.mt>=100&&!f.wasFull){f.wasFull=true;if(difficulty!=='training'||f!==P1||pt<.1){flare(f.x,GY-f.air-95,'#fff2af',150,.2);ringFx(f.x,GY-4,COL[f.ci],230,.45,.25,5);label('SUPER READY!',f.x,GY-236,'#fff2af',16,true);tone(660,.16,'triangle',.05);tone(990,.2,'sine',.04)}}
        if(f.mt<100)f.wasFull=false;
        if(f.mt>=100&&!lowQ()){f.arcT=(f.arcT||0)-dt;if(f.arcT<=0){f.arcT=.16+rand()*.22;const x=rxOf(f)+(rand()-.5)*74,y=GY-f.air-20-rand()*150;bolt(x,y,x+(rand()-.5)*60,y-20-rand()*40,COL[f.ci],.1,1.3,7)}}}}
    if(phase==='intro'&&introT0&&!vsSlam&&pt>.42){vsSlam=true;sfx.heavy();addShake(.45);buzz(30)}}
}
function drawCrowdTexts(){for(const c of crowdTexts){const k=c.t/c.dur;ctx.save();ctx.translate(c.x,c.y-k*22);ctx.rotate(c.rot);ctx.globalAlpha=clamp(c.t/.1,0,1)*(1-ease((k-.55)/.45))*.9;const s=reduced?1:backOut(clamp(c.t/.18,0,1));ctx.scale(s,s);dtext(c.text,0,0,24,'#fff3d5');ctx.restore()}}
function drawUiFx(){if(!P1)return;ctx.save();ctx.globalCompositeOperation='lighter';
  for(const o of uiOrbs){if(o.t<0)continue;const k=ease(o.t/o.dur),f=o.f,tx=o.right?W-88-236*f.mt/100:88+236*f.mt/100,u=1-k,x=u*u*o.x+2*u*k*o.cx+k*k*tx,y=u*u*o.y+2*u*k*o.cy+k*k*64,r=10-k*4;ctx.globalAlpha=.95;ctx.drawImage(glow(o.col),x-r,y-r,r*2,r*2)}
  for(const f of[P1,P2])if(f.mtPulse>0){const x=f===P2?W-88-236*f.mt/100:88+236*f.mt/100,r=10+f.mtPulse*18;ctx.globalAlpha=f.mtPulse;ctx.drawImage(glow(COL[f.ci]),x-r,64-r,r*2,r*2)}
  ctx.restore();for(const c of uiChips){ctx.globalAlpha=clamp(c.l/c.max*1.6,0,1);ctx.fillStyle=c.c;ctx.fillRect(c.x,c.y,c.s,c.s)}ctx.globalAlpha=1}
function drawVS(){if(phase!=='intro'||!introT0||!P1)return;const t=pt,a=1-ease((t-introT0+.12)/.34);if(a<=0)return;const inn=reduced?1:easeOut(t/.36),sl=(1-inn)*520,c1=COL[P1.ci],c2=COL[P2.ci];
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#07090ff2';ctx.fillRect(0,0,W,H);
  let g=ctx.createLinearGradient(0,0,500,0);g.addColorStop(0,c1+'d0');g.addColorStop(1,c1+'18');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-40-sl,0);ctx.lineTo(530-sl,0);ctx.lineTo(400-sl,H);ctx.lineTo(-40-sl,H);ctx.fill();
  g=ctx.createLinearGradient(W,0,460,0);g.addColorStop(0,c2+'d0');g.addColorStop(1,c2+'18');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(W+40+sl,0);ctx.lineTo(560+sl,0);ctx.lineTo(430+sl,H);ctx.lineTo(W+40+sl,H);ctx.fill();
  if(!reduced){ctx.strokeStyle='#ffffff26';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<22;i++){const y=(i*53+11)%H,x=((i*211+vclock*(900+i*40))%(W+400))-200,left=i%2;ctx.moveTo(left?x:W-x,y);ctx.lineTo(left?x+90+i*4:W-x-90-i*4,y)}ctx.stroke()}
  const f1=CH[P1.ci].f.idle[0],f2=CH[P2.ci].f.idle[0],bob=reduced?0:Math.sin(vclock*3)*3;
  drawSprite(f1,205-sl,H-14+bob,1,1,true,1,1,0,null,ctx,2.2);drawSprite(f2,W-205+sl,H-14-bob,-1,1,true,1,1,0,null,ctx,2.2);
  ctx.fillStyle='#07090fb0';ctx.fillRect(0,0,W,118);
  dtext(CH[P1.ci].name.toUpperCase(),36-sl,72,58,'#ffffff','left');text(ROSTER[P1.ci].role+' · YOU',40-sl,98,12,c1,'left');
  dtext(CH[P2.ci].name.toUpperCase(),W-36+sl,72,58,'#ffffff','right');text((difficulty==='training'?'DUMMY':'CPU')+' · '+ROSTER[P2.ci].role,W-40+sl,98,12,c2,'right');
  const vt=reduced?1:clamp((t-.42)/.16,0,1);if(vt>0){const s=lerp(4,1,easeOut(vt));ctx.save();ctx.translate(480,300);ctx.rotate(-.08);ctx.scale(s,s);ctx.globalAlpha=a*clamp(vt*3,0,1);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=.5;ctx.drawImage(glow('#f5be58'),-150,-130,300,220);ctx.restore();dtext('VS',0,34,128,'#f5be58');ctx.restore()}
  ctx.globalAlpha=a;text(ARENAS[arenaId].name.toUpperCase()+' · '+(difficulty==='training'?'TRAINING':'BEST OF THREE'),480,H-22,12,'#e7ecf7');ctx.restore()}
// menus: settings sheet, how-to sheet, difficulty buttons, result card
function openModal(id){$(id).style.display='flex'}
document.querySelectorAll('.closeModal').forEach(b=>b.onclick=()=>{b.closest('.modal').style.display='none'});
document.querySelectorAll('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)m.style.display='none'});
$('setCmds').onclick=()=>openCmds();$('setSuggest').onclick=$('suggestBtn').onclick=()=>openSuggest();$('setAbout').onclick=$('aboutLink').onclick=()=>openModal('about');$('fanOk').onclick=()=>{store.set('fanAck',1);$('fanNotice').style.display='none'};if(!store.get('fanAck',0))openModal('fanNotice');$('setHelp').onclick=()=>openModal('howto');$('setCoffee').onclick=$('coffeeBtn').onclick=()=>openModal('coffee');$('openGcash').onclick=openGcash;$('openSettings').onclick=$('pauseSettings').onclick=()=>openModal('settings');
addEventListener('keydown',e=>{if(e.key!=='Escape')return;const m=[...document.querySelectorAll('.modal')].find(m=>m.style.display==='flex');if(m){m.style.display='none';e.stopImmediatePropagation();e.preventDefault()}},true);
function initDiff(){const box=$('diffSeg'),selEl=$('difficulty');selEl.value=store.get('diff','normal');if(selEl.value==='training'||!selEl.value)selEl.value='normal';if(!selEl.value)selEl.value='normal';const sync=()=>box.querySelectorAll('button').forEach(b=>b.setAttribute('aria-checked',b.dataset.v===selEl.value));[['easy','Easy'],['normal','Normal'],['hard','Hard']].forEach(([v,l])=>{const b=document.createElement('button');b.textContent=l;b.dataset.v=v;b.setAttribute('role','radio');b.onclick=()=>{selEl.value=v;store.set('diff',v);sync();tone(420)};box.append(b)});sync()}
function cmdHTML(){const r=ROSTER[(P1?P1.ci:sel)],sk=TECHNIQUES[(P1?P1.ci:sel)],T=isTouch;
  const dir={f:'→',b:'←',u:'↑',d:'↓'},btn={p:['□','sq','J'],k:['△','tr','K'],x:['✕','cr','Space'],o:['○','ci','L'],l1:['L1','sh','Q'],l2:['L2','sh','E']};
  const step=(x,i)=>x in dir?`<i class="st dir" style="--i:${i}">${dir[x]}</i>`:`<i class="st b ${btn[x][1]}" style="--i:${i}">${T?btn[x][0]:btn[x][2]}</i>`;
  const seq=(arr,hold)=>'<div class="seq" style="--n:'+arr.length+'">'+arr.map(step).join('<b class="plus">›</b>')+(hold?'<em>hold</em>':'')+'</div>';
  const card=(name,sub,arr,cost,hold,i)=>`<div class="ccard" style="--d:${i}"><div class="ct"><b>${name}</b><span class="cost ${cost==='free'?'free':''}">${cost}</span></div>${sub?'<div class="cs">'+sub+'</div>':''}${seq(arr,hold)}</div>`;
  const specials=[['Dash','double-tap toward or away',['f','f'],'free · 2 s'],['Uppercut',r.upper,['b','u','p'],'free · 2 s'],['Energy wave',r.wave,['d','f','p'],'30 mana'],['Rising strike','',['d','u','p'],'25 mana'],['Fighter skill',sk.name,['d','d','p'],sk.cost+' mana'],['Slide kick','',['d','f','k'],'12 mana'],['Dive kick','',['d','b','k'],'22 mana'],['Evade roll','',['d','d','k'],'14 mana']];
  const basics=[['Punch','',['p'],''],['Kick','',['k'],''],['Jump','',['x'],''],['Power','hold to charge it',['o'],'45 · 60'],['Charge mana','',['l1'],'',true],['Ultimate',r.super,['l2'],'100 mana'],['Block','hold away · tap just before a hit to parry',['b'],'',true],['Crouch','',['d'],'',true]];
  return '<p class="cmdnote">'+(T?'Stick directions, then the button.':'Arrows or WASD, then the key.')+' <b>→</b> is toward your opponent.</p><h4>Special moves</h4><div class="cgrid">'+specials.map((c,i)=>card(c[0],c[1],c[2],c[3],false,i)).join('')+'</div><h4>Buttons</h4><div class="cgrid small">'+basics.map((c,i)=>card(c[0],c[1],c[2],c[3],c[4],i+8)).join('')+'</div>'}
// ---------- suggestion box ----------
// Posts go to the public GitHub issue board of the game's repo (prefilled in a new tab).
// To collect suggestions without a GitHub account, set SUGGEST_FORM to a Google Form "formResponse" URL and its entry ids.
const SUGGEST_REPO='https://github.com/sfutie4-ops/ring-brawlers/issues/new',SUGGEST_FORM=null;let sugCat='Idea',sugStars=0;
function openSuggest(){const t=$('sugText');$('sugThanks').classList.remove('show');openModal('suggest');setTimeout(()=>t.focus(),60)}
document.querySelectorAll('.sugcats button').forEach(b=>b.onclick=()=>{sugCat=b.dataset.c;document.querySelectorAll('.sugcats button').forEach(x=>x.setAttribute('aria-checked',x===b));buzz(8)});
document.querySelectorAll('#sugStars button').forEach(b=>b.onclick=()=>{sugStars=+b.dataset.s;document.querySelectorAll('#sugStars button').forEach(x=>x.classList.toggle('on',+x.dataset.s<=sugStars));buzz(8)});
$('sugText').oninput=()=>{const n=$('sugText').value.trim().length;$('sugCount').textContent=$('sugText').value.length+' / 1000';$('sugSend').disabled=n<4};
$('sugText').onkeydown=e=>e.stopPropagation();$('sugName').onkeydown=e=>e.stopPropagation();
$('sugSend').onclick=()=>{const txt=$('sugText').value.trim();if(txt.length<4)return;const name=$('sugName').value.trim().replace(/[<>]/g,'');
  const title='['+sugCat+'] '+txt.split('\n')[0].slice(0,70);const body=txt+'\n\n---\nType: '+sugCat+(sugStars?'\nRating: '+'★'.repeat(sugStars):'')+(name?'\nFrom: '+name:'')+'\nSent from the FliptapWars suggestion box ('+(isTouch?'phone':'PC')+')';
  if(SUGGEST_FORM){const fd=new URLSearchParams();for(const[k,v]of Object.entries(SUGGEST_FORM.fields({cat:sugCat,txt,name,stars:sugStars})))fd.append(k,v);fetch(SUGGEST_FORM.url,{method:'POST',mode:'no-cors',body:fd}).catch(()=>{});$('sugThanks').querySelector('span').textContent='Your suggestion was sent. Thank you for helping!'}
  else window.open(SUGGEST_REPO+'?title='+encodeURIComponent(title)+'&body='+encodeURIComponent(body)+'&labels=suggestion','_blank','noopener');
  $('sugThanks').classList.add('show');$('sugText').value='';$('sugText').oninput();buzz([10,30,20])};
// ---------- buy me a coffee (GCash) ----------
// The number is kept scrambled in the page and only decoded when the player taps the button; it is never displayed.
const GC=['m7rtbTq2H1rFBw4=',[171,131,218,93,13,131,44,107,253,52,63]];
function gcNum(){const b=atob(GC[0]);let o='';for(let i=0;i<b.length;i++)o+=String.fromCharCode(b.charCodeAt(i)^GC[1][i]);return o}
async function openGcash(){const msg=$('coffeeMsg');let copied=false;try{await navigator.clipboard.writeText(gcNum());copied=true}catch(e){try{const t=document.createElement('textarea');t.value=gcNum();t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();copied=document.execCommand('copy');t.remove()}catch(_){}}
  buzz([15,30,15]);const ua=navigator.userAgent||'',android=/Android/i.test(ua),ios=/iPhone|iPad|iPod/i.test(ua);
  msg.innerHTML=(copied?'<b>Account copied.</b> ':'')+'In GCash tap <b>Send › Express Send</b>, then paste the number. Salamat! ☕';msg.classList.add('show');
  if(android)location.href='intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.globe.gcash.android;S.browser_fallback_url='+encodeURIComponent('https://play.google.com/store/apps/details?id=com.globe.gcash.android')+';end';
  else if(ios){const t0=Date.now();location.href='gcash://';setTimeout(()=>{if(!document.hidden&&Date.now()-t0<2500)location.href='https://apps.apple.com/ph/app/gcash/id520020791'},1600)}
  else msg.innerHTML=(copied?'<b>Account copied.</b> ':'')+'Open GCash on your phone, tap <b>Send › Express Send</b> and paste it. Salamat! ☕'}
function openCmds(){$('cmdBox').innerHTML=cmdHTML();openModal('cmds')}
function fillResult(won){const secs=Math.round((performance.now()-stats.t0)/1000),score=(won?50:0)+(P1.wins-P2.wins)*10+Math.min(20,maxCombo*3)+Math.min(15,stats.parries*5)+Math.max(0,20-stats.taken/10),grade=score>=88?'S':score>=70?'A':score>=50?'B':score>=30?'C':'D';
  $('resultStats').textContent=`${P1.wins} – ${P2.wins} rounds · ${CH[P1.ci].name} vs ${CH[P2.ci].name} · ${ARENAS[arenaId].name}`;$('grade').textContent=grade;$('grade').dataset.g=grade;
  $('statGrid').innerHTML=[['Hits landed',totalHits],['Best combo',maxCombo],['Damage dealt',Math.round(stats.dealt)],['Damage taken',Math.round(stats.taken)],['Parries',stats.parries],['Supers landed',stats.supers],['Blocks',stats.blocks],['Time',Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0')]].map(([k,v])=>'<div><b>'+v+'</b><span>'+k+'</span></div>').join('');
  const c=$('resultArt'),g=c.getContext('2d'),w=won?P1:P2,fr=(CH[w.ci].f.win||CH[w.ci].f.idle)[0];g.clearRect(0,0,c.width,c.height);g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.6;g.drawImage(glow(COL[w.ci]),10,c.height-120,c.width-20,130);g.restore();drawSprite(fr,c.width/2,c.height-24,1,1,true,1,1,0,null,g,1.95);$('result').style.setProperty('--c',COL[w.ci])}

// ---------- main loop: fixed 120 Hz rules, drawing at whatever the screen can do (60/120/144/240 Hz) ----------
let last=performance.now(),accumulator=0,slowAcc=0;
function loop(n){const real=clamp((n-last)/1000,0,.1);last=n;if(real>0)fpsEma+=(1/real-fpsEma)*.06;
  if(quality==='auto'&&phase==='fight'&&!paused&&real>0&&real<.25){resT+=real;resSlow+=real>1/50?real:0;resFast+=real<1/57?real:0;if(resT>=1.2){const slow=resSlow/resT,fast=resFast/resT;resT=resSlow=resFast=0;if(slow>.35){if(resCap>1){resCap=Math.max(1,resCap-.25);fit()}else if(!autoLow){autoLow=true;applyQuality();renderOpts()}else if(resCap>.75){resCap-=.25;fit()}}else if(fast>.9&&!autoLow&&resCap<RES_MAX){resCap=Math.min(RES_MAX,resCap+.25);fit()}}}
  if(!paused){slowT=Math.max(0,slowT-real);const el=real*(slowT>0?lerp(1,SLOW,clamp(slowT/.25,0,1)):1);accumulator+=el;let guard=0;
    while(accumulator>=FIXED_DT&&guard++<30){if(P1&&phase!=='menu'&&phase!=='end'){for(const f of[P1,P2]){f.prevX=f.x;f.prevAir=f.air}for(const s of shots){s.px=s.x;s.py=s.y}step(FIXED_DT)}accumulator-=FIXED_DT}
    if(guard>=30)accumulator=0;renderAlpha=accumulator/FIXED_DT;fxUpdate(el,real)}else{accumulator=0;renderAlpha=1}
  draw();if(phase==='menu')drawPreview();requestAnimationFrame(loop)}
padPrefs();initArenas();initDiff();applyQuality();renderOpts();boot();requestAnimationFrame(loop);
// Local diagnostics for smoke tests and frame inspection.
window.ringDebug={get state(){return{phase,paused,round,timer,P1,P2,shots,effects,ready,parts:parts.length,fps:fpsEma,renderScale:RS,lowQuality:lowQ(),cam,hitstop,msg}},arenas:ARENAS,get arenaImages(){return arenaImages},setArena,atlas:()=>atlasCanvas,hit,step,updateDefense,floorDamage,resetEnvironment,get environment(){return{floorScars,props,envFx}},moves:ATK,press,held,start:(f,m)=>start(f,m)};
