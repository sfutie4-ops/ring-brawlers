/* Ring Brawlers engine. build.py injects this file (plus the art data lines) into index.html. */
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
let reduced=store.get('reduced',matchMedia('(prefers-reduced-motion: reduce)').matches),sound=store.get('sound',false),quality=store.get('quality','auto'),haptics=store.get('haptics',true),showFps=store.get('fps',false),meshMode=false,autoLow=false;
const isTouch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
const lowQ=()=>quality==='low'||(quality==='auto'&&autoLow);
const qn=n=>Math.max(1,Math.round(n*(lowQ()?.45:1)));

// ---------- arena art (layered so the crowd, ropes and lights can move) ----------
let scene=null,sceneBS=0,RS=1;
function buildScene(){
  const bs=lowQ()?1:2;if(scene&&sceneBS===bs)return;sceneBS=bs;
  const mk=(w,h,s=bs)=>{const c=document.createElement('canvas');c.width=Math.round(w*s);c.height=Math.round(h*s);const g=c.getContext('2d');g.scale(s,s);return[c,g]};
  let s=7;const R=()=>(s=(s*16807)%2147483647)/2147483647;
  // back wall, lighting truss
  const[far,c]=mk(W,H);
  let g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#07060d');g.addColorStop(.5,'#1e0e1a');g.addColorStop(1,'#0b0810');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.strokeStyle='#ffffff12';c.lineWidth=3;c.beginPath();c.moveTo(0,40);c.lineTo(W,40);c.moveTo(0,56);c.lineTo(W,56);c.stroke();
  c.lineWidth=1.5;c.beginPath();for(let x=0;x<W;x+=32){c.moveTo(x,40);c.lineTo(x+16,56);c.lineTo(x+32,40)}c.stroke();
  [180,480,780].forEach(x=>{c.fillStyle='#17131f';c.fillRect(x-18,48,36,18);c.fillStyle='#fff3d0';c.fillRect(x-12,64,24,4)});
  for(let i=0;i<70;i++){c.fillStyle='rgba(255,220,150,'+(R()*.32)+')';c.fillRect(R()*W,70+R()*170,2,2)}
  // crowd, one strip per row so rows can bob and jump
  const rows=[];
  for(let r=0;r<7;r++){
    const[rc,rg]=mk(W+160,74);
    for(let x=-10;x<W+170;x+=22){
      const hx=x+R()*10,y=24+R()*8,lit=R()<.15,arms=R()<.14;
      rg.fillStyle=lit?'#5a3a2a':r>4?'#1a121d':'#120c14';
      rg.beginPath();rg.arc(hx,y,13,0,7);rg.fill();rg.fillRect(hx-10,y+6,20,44);
      if(arms){rg.strokeStyle=rg.fillStyle;rg.lineWidth=5;rg.lineCap='round';rg.beginPath();rg.moveTo(hx-9,y+12);rg.lineTo(hx-15,y-16);rg.moveTo(hx+9,y+12);rg.lineTo(hx+15,y-14);rg.stroke()}
      if(lit){rg.fillStyle='#ffffff10';rg.beginPath();rg.arc(hx-3,y-3,8,0,7);rg.fill()}
    }
    rows.push({c:rc,y:46+r*24});
  }
  // fixed spotlight cones
  const[lights,l]=mk(W,GY);
  [[180,'#ffd9a0'],[480,'#fff1d6'],[780,'#ffb98a']].forEach(([x,col])=>{const r=l.createRadialGradient(x,0,10,x,320,330);r.addColorStop(0,col+'aa');r.addColorStop(1,col+'00');l.fillStyle=r;l.beginPath();l.moveTo(x-20,0);l.lineTo(x+20,0);l.lineTo(x+240,470);l.lineTo(x-240,470);l.fill()});
  // ring: mat, posts, apron (extra margin so camera shake never shows an edge)
  const M=80,EX=60,[ring,rg]=mk(W+2*M,H+EX);rg.translate(M,0);
  g=rg.createLinearGradient(0,GY-92,0,H);g.addColorStop(0,'#84714f');g.addColorStop(1,'#cdbb92');rg.fillStyle=g;rg.fillRect(-M,GY-92,W+2*M,H+EX-(GY-92));
  let pool=rg.createRadialGradient(480,GY-10,20,480,GY-10,470);pool.addColorStop(0,'#fff6dc38');pool.addColorStop(1,'#fff6dc00');rg.fillStyle=pool;rg.fillRect(-M,GY-92,W+2*M,H-(GY-92));
  rg.fillStyle='#0005';rg.fillRect(-M,GY-96,W+2*M,6);
  rg.strokeStyle='#00000016';rg.lineWidth=2;const tk=(H+EX-(GY-92))/(H-(GY-92));
  for(let x=-760;x<W+760;x+=90){const xt=480+(x-480)*.55,xb=x*1.6-288;rg.beginPath();rg.moveTo(xt,GY-92);rg.lineTo(xt+(xb-xt)*tk,H+EX);rg.stroke()}
  rg.save();rg.translate(480,GY+12);rg.scale(1,.3);rg.strokeStyle='#8a1f1a3c';rg.lineWidth=12;rg.beginPath();rg.arc(0,0,300,0,TAU);rg.stroke();rg.lineWidth=4;rg.beginPath();rg.arc(0,0,270,0,TAU);rg.stroke();rg.restore();
  rg.save();rg.translate(480,GY+32);rg.scale(1,.32);rg.font=`italic ${DW} 96px ${DISP}`;rg.textAlign='center';rg.fillStyle='#8a1f1a66';rg.fillText('RING BRAWLERS',0,34);rg.restore();
  rg.fillStyle='#17101f';rg.fillRect(-M,H-14,W+2*M,14+EX);rg.fillStyle='#d9342b';rg.fillRect(-M,H-15,W+2*M,3);
  [30,930].forEach(x=>{rg.fillStyle='#24242e';rg.fillRect(x-9,232,18,190);rg.fillStyle='#ffffff18';rg.fillRect(x-9,232,5,190);rg.fillStyle='#d9342b';rg.fillRect(x-14,252,28,100);rg.fillStyle='#ffffff26';rg.fillRect(x-14,252,8,100);rg.fillStyle='#00000030';rg.fillRect(x+6,252,8,100)});
  // screen-space vignette
  const[vig,vg]=mk(W,H,1);const v=vg.createRadialGradient(480,290,250,480,290,640);v.addColorStop(0,'#00000000');v.addColorStop(1,'#000000b0');vg.fillStyle=v;vg.fillRect(0,0,W,H);
  scene={far,rows,lights,ring,vig,M,EX};
}

// ---------- roster & move data (unchanged from the original build) ----------
const ATK={punch:{dur:.30,hit:.10,end:.18,reach:106,dmg:7,kb:130,cost:0,rank:1},kick:{dur:.43,hit:.16,end:.27,reach:139,dmg:11,kb:220,cost:0,rank:2},upper:{dur:.64,hit:.22,end:.39,reach:145,dmg:16,kb:180,cost:20,rank:3},wave:{dur:.60,hit:.24,end:.30,reach:0,dmg:13,kb:230,cost:30,rank:4},sp:{dur:.83,hit:.25,end:.57,reach:162,dmg:28,kb:490,cost:100,rank:5}};
const ROSTER=[
{name:'Loonie',color:'#ffd16b',role:'MULTI COMBO',speed:242,power:1,upper:'Multi Lift',wave:'Rhyme Chain',super:'Hari ng Tugma',passive:'Longer combos lose less damage.',detail:'Link hits together. Rhyme Chain fires three golden bars; Hari ng Tugma sends a five-beat barrage.',source:'https://www.fliptop.com.ph/emcees/loonie'},
{name:'Abra',color:'#c49aff',role:'ILLUSION RUSH',speed:274,power:.93,upper:'Wordplay Rise',wave:'Gayuma Spark',super:'Illusion Rush',passive:'Dash has a longer dodge window.',detail:'Fast footwork and feints. Gayuma Spark briefly slows movement; Illusion Rush closes distance behind afterimages.',source:'https://www.fliptop.com.ph/emcees/abra'},
{name:'Shehyee',color:'#ff6375',role:'ANGLE PRESSURE',speed:225,power:1.02,upper:'Pressure Point',wave:'Angle Mark',super:'Angle Breaker',passive:'Uppercut and wave mark a target for three seconds.',detail:'Apply an angle mark, then cash it in with a guard-breaking super. Strong up close; modest range.',source:'https://www.fliptop.com.ph/emcees/shehyee'},
{name:'Batas',color:'#e3a06b',role:'HEAVY PRESSURE',speed:193,power:1.12,upper:'Iron Delivery',wave:'Heavy Bar',super:'Final Verdict',passive:'Uppercut absorbs one hit without staggering.',detail:'Slow, heavy attacks. Heavy Bar travels slowly but hits hard. Final Verdict breaks guard in close range.',source:'https://www.fliptop.com.ph/emcees/batas'},
{name:'Smugglaz',color:'#67d8ff',role:'RAPID FIRE',speed:260,power:.91,upper:'Speed Lift',wave:'Rapid Fire',super:'Double-Time',passive:'Barrage hits create shorter hit-stop.',detail:'Four light wave shots pressure the lane. Double-Time unleashes eight quick shots; each hit is light.',source:'https://www.fliptop.com.ph/emcees/smugglaz'},
{name:'Aklas',color:'#b5f46d',role:'LEFTFIELD CHAOS',speed:238,power:.98,upper:'Odd Angle',wave:'Leftfield Orb',super:'Unorthodox',passive:'Dash becomes a short forward blink.',detail:'Zigzag projectiles and a three-lane super disrupt predictable spacing. Blink is directional and has a cooldown.',source:'https://www.fliptop.com.ph/emcees/aklas'},
{name:'Zaito',color:'#57e4b4',role:'FREESTYLE COUNTER',speed:232,power:.96,upper:'Rebuttal',wave:'Off-the-Top',super:'Punchline Delay',passive:'Rebuttal counters one incoming hit during its opening.',detail:'Time Rebuttal to answer an attack. Off-the-Top bounces through the lane; the super lands after a deliberate pause.',source:'https://www.fliptop.com.ph/emcees/zaito'},
{name:'Apekz',color:'#87aaff',role:'SETUP & PAYOFF',speed:244,power:1,upper:'Setup',wave:'Payoff',super:'Triple Meaning',passive:'Setup marks a target; the next Payoff wave adds damage.',detail:'Land Setup, then connect Payoff within three seconds. Triple Meaning fires three increasingly strong shots.',source:'https://www.fliptop.com.ph/emcees/apekz'},
{name:'Sinio',color:'#ff90c4',role:'CROWD TRICKSTER',speed:236,power:.96,upper:'Punchline Pop',wave:'Joke Wave',super:'Crowd Control',passive:'Blocked attacks and Joke Wave build extra energy.',detail:'Use pressure to win energy. Joke Wave briefly slows movement; Crowd Control is a broad short-range finisher.',source:'https://www.fliptop.com.ph/emcees/sinio'}
];
const COL=ROSTER.map(r=>r.color),ROLES=ROSTER.map(r=>r.super.toUpperCase()),STAT=ROSTER.map(r=>({speed:r.speed,power:r.power}));
const MOVES=ROSTER.map(()=>Object.fromEntries(Object.entries(ATK).map(([kind,a])=>[kind,{...a,kind,knockdown:kind==='sp'}])));
const volley=(times,damages,path='straight',speed=500)=>times.map((at,i)=>({at,dmg:Array.isArray(damages)?damages[i]:damages,path,speed}));
MOVES.forEach(m=>m.wave.volley=volley([.24],13));
MOVES[0].wave.volley=volley([.24,.32,.40],4.6);MOVES[0].sp.volley=volley([.25,.34,.43,.52,.61],6);MOVES[0].sp.lunge=0;
MOVES[1].wave.volley=volley([.24],10);MOVES[1].wave.slow=.9;MOVES[1].sp.lunge=740;
MOVES[2].upper.mark='angle';MOVES[2].wave.mark='angle';MOVES[2].sp.breakMarked=true;
MOVES[3].wave.volley=volley([.24],17,'straight',310);MOVES[3].sp.guardBreak=true;MOVES[3].sp.dmg=30;MOVES[3].sp.lunge=380;
MOVES[4].wave.volley=volley([.24,.31,.38,.45],4);MOVES[4].sp.volley=volley([.25,.31,.37,.43,.49,.55,.61,.67],4.2);MOVES[4].sp.lunge=0;
MOVES[5].wave.volley=volley([.24],13,'zigzag',440);MOVES[5].sp.volley=volley([.25,.34,.43],10,'fan',460);MOVES[5].sp.lunge=0;
MOVES[6].upper.counter=true;MOVES[6].wave.volley=volley([.24],12,'bounce',420);MOVES[6].sp.hit=.50;MOVES[6].sp.end=.68;MOVES[6].sp.dmg=31;MOVES[6].sp.reach=190;MOVES[6].sp.lunge=240;
MOVES[7].upper.mark='setup';MOVES[7].wave.volley=volley([.24],9,'straight',560);MOVES[7].sp.volley=volley([.25,.40,.55],[7,10,13],'straight',560);MOVES[7].sp.lunge=0;
MOVES[8].wave.volley=volley([.24],9);MOVES[8].wave.slow=.6;MOVES[8].sp.dmg=25;MOVES[8].sp.reach=250;MOVES[8].sp.lunge=180;
function moveData(f,move=f.st){return MOVES[f.ci][move]}

// ---------- state ----------
let P1=null,P2=null,phase='menu',pt=0,round=1,timer=60,sel=clamp(store.get('sel',0)|0,0,CH.length-1),hitstop=0,flash=0,vclock=0,msg='',msgT=0,koMsg='',paused=false,ready=false,audioCtx=null,master=null,noiseBuf=null,difficulty='normal',totalHits=0,maxCombo=0,slowT=0,superDim=0,hype=0,banner=null,lastTick=-1,confettiT=0;
let parts=[],effects=[],ghosts=[],shots=[],texts=[],swooshes=[],flashes=[],MAXP=800;
const held={},buf={},pointers=new Map();let fxImage,renderAlpha=1;
const FIXED_DT=1/120,SLOW=.22;
const cam={x:480,z:1.03,cx:480,cy:270,kx:0,ky:0,kvx:0,kvy:0,trauma:0,punch:0,focus:null,focusT:0};
const rope={a:0,v:0};
const KM={a:'l',arrowleft:'l',d:'r',arrowright:'r',w:'u',arrowup:'u',' ':'u',j:'p',z:'p',k:'k',x:'k',u:'h',i:'w',l:'s',c:'s',shift:'d',s:'b',arrowdown:'b'};

// ---------- feedback helpers ----------
function addShake(t){if(!reduced)cam.trauma=Math.min(1,cam.trauma+t*shakeLevel)}
function kick(dx,dy=0){if(!reduced){cam.kvx+=dx*14*shakeLevel;cam.kvy+=dy*14*shakeLevel}}
function buzz(p){if(!haptics||!isTouch||!navigator.vibrate)return;try{navigator.vibrate(p)}catch(e){}}
function ropeHit(s){rope.v+=s*70}
function crowdFlash(n){n=qn(n);for(let i=0;i<n;i++)flashes.push({x:rand()*W,y:72+rand()*150,t:-rand()*.5,dur:.14+rand()*.12})}
function setMsg(m){if(m!==msg){msg=m;msgT=0}}

// ---------- input ----------
function clearInput(){for(const k in held)held[k]=0;for(const k in buf)buf[k]=0;pointers.clear();document.querySelectorAll('.b.on').forEach(b=>b.classList.remove('on'))}
function press(k){held[k]=1;if(!['l','r','b'].includes(k))buf[k]=.22}
function pauseGame(v=!paused){if(!P1||phase==='menu'||phase==='end')return;paused=v;clearInput();$('pauseScreen').style.display=v?'flex':'none';$('pause').textContent=v?'RESUME':'PAUSE'}
addEventListener('keydown',e=>{if(e.target.tagName==='SELECT')return;const key=e.key.toLowerCase();if(key==='escape'||key==='p'){e.preventDefault();if(!e.repeat)pauseGame();return}if(key==='v'){if(!e.repeat){meshMode=!meshMode;renderOpts()}return}if(key==='f'){if(!e.repeat){showFps=!showFps;store.set('fps',showFps);renderOpts()}return}if(key==='m'){if(!e.repeat)toggleSound();return}if(key==='enter'&&phase==='end'){newMatch(true);return}const k=KM[key];if(!k)return;e.preventDefault();if(!held[k]&&!paused)press(k)});
addEventListener('keyup',e=>{if(KM[e.key.toLowerCase()])held[KM[e.key.toLowerCase()]]=0});
addEventListener('blur',()=>{clearInput();if(phase==='fight'||phase==='intro')pauseGame(true)});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pauseGame(true)}});
if(isTouch)document.body.classList.add('touch');
const padBtn=k=>document.querySelector('#pad [data-k='+k+']'),SLIDE=new Set(['l','r','b']);
function padRelease(id){const k=pointers.get(id);if(!k)return;pointers.delete(id);held[k]=[...pointers.values()].includes(k)?1:0;if(!held[k])padBtn(k)?.classList.remove('on')}
function padPress(id,k){pointers.set(id,k);press(k);padBtn(k)?.classList.add('on');buzz(6)}
document.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k;b.onpointerdown=e=>{e.preventDefault();if(paused||phase!=='fight')return;try{b.setPointerCapture(e.pointerId)}catch(_){}padPress(e.pointerId,k)};
  // slide a thumb between the arrows and GUARD without lifting it
  b.onpointermove=e=>{const cur=pointers.get(e.pointerId);if(!cur||!SLIDE.has(cur))return;const el=document.elementFromPoint(e.clientX,e.clientY),nk=el&&el.closest&&el.closest('[data-k]')?.dataset.k;if(nk&&nk!==cur&&SLIDE.has(nk)){padRelease(e.pointerId);padPress(e.pointerId,nk)}};
  const release=e=>padRelease(e.pointerId);b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;b.oncontextmenu=e=>e.preventDefault()});
$('pause').onclick=()=>pauseGame();$('resume').onclick=()=>pauseGame(false);$('exit').onclick=toMenu;$('select').onclick=toMenu;$('rematch').onclick=()=>newMatch(true);$('go').onclick=()=>newMatch(false);$('sound').onclick=()=>toggleSound();

let turnMode=store.get('turn',false),swapPad=store.get('swap',false),padSize=clamp(store.get('padsize',0)|0,0,2),padGhost=store.get('ghost',false);
function padPrefs(){const c=document.body.classList;c.toggle('swap',swapPad);c.toggle('pad1',padSize===1);c.toggle('pad2',padSize===2);c.toggle('ghost',padGhost);fit()}
// ---------- options ----------
function toggleFull(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().then(()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}).catch(()=>{})}catch(e){}}
const OPTS=[
  {label:()=>'Sound '+(sound?'on':'off'),fn:()=>toggleSound()},
  {label:()=>reduced?'Motion reduced':'Motion full',fn:()=>{reduced=!reduced;store.set('reduced',reduced)}},
  {label:()=>'Quality '+quality,fn:()=>{quality={auto:'high',high:'low',low:'auto'}[quality];autoLow=false;store.set('quality',quality);applyQuality()}},
  {show:()=>isTouch&&!!navigator.vibrate,label:()=>'Vibration '+(haptics?'on':'off'),fn:()=>{haptics=!haptics;store.set('haptics',haptics);buzz(20)}},
  {label:()=>'FPS '+(showFps?'on':'off'),fn:()=>{showFps=!showFps;store.set('fps',showFps)}},
  {show:()=>!!document.documentElement.requestFullscreen,label:()=>document.fullscreenElement?'Exit fullscreen':'Fullscreen',fn:toggleFull},
  {label:()=>'Shake '+(['off','light','full'][Math.round(shakeLevel*2)]),fn:()=>{shakeLevel=shakeLevel===1?0:shakeLevel===0?.5:1;store.set('shake',shakeLevel);cam.kx=cam.ky=cam.kvx=cam.kvy=cam.trauma=0}},
  {label:()=>'Low HP pulse '+(dangerFX?'on':'off'),fn:()=>{dangerFX=!dangerFX;store.set('danger',dangerFX)}},
  {label:()=>'Rim outlines '+(traceFX?'on':'off'),fn:()=>{traceFX=!traceFX;store.set('trace',traceFX)}},
  {label:()=>'Turn around when moving away '+(turnMode?'on':'off'),fn:()=>{turnMode=!turnMode;store.set('turn',turnMode)}},
  {show:()=>isTouch,label:()=>'Swap button sides '+(swapPad?'on':'off'),fn:()=>{swapPad=!swapPad;store.set('swap',swapPad);padPrefs()}},
  {show:()=>isTouch,label:()=>'Button size '+['normal','large','huge'][padSize],fn:()=>{padSize=(padSize+1)%3;store.set('padsize',padSize);padPrefs()}},
  {show:()=>isTouch,label:()=>'Button see-through '+(padGhost?'on':'off'),fn:()=>{padGhost=!padGhost;store.set('ghost',padGhost);padPrefs()}},
  {label:()=>'Comic pops '+(popFX?'on':'off'),fn:()=>{popFX=!popFX;store.set('pops',popFX)}},
  {label:()=>'Mesh '+(meshMode?'on':'off'),fn:()=>{meshMode=!meshMode}}
];
function renderOpts(){document.querySelectorAll('.opts').forEach(box=>{box.innerHTML='';OPTS.forEach(o=>{if(o.show&&!o.show())return;const b=document.createElement('button');b.className='chip';b.textContent=o.label();b.onclick=()=>{o.fn();renderOpts()};box.append(b)})});$('sound').textContent=sound?'SOUND ON':'SOUND OFF'}
document.addEventListener('fullscreenchange',()=>{renderOpts();fit()});
function applyQuality(){MAXP=lowQ()?280:800;buildScene();fit()}
function fit(){const st=$('stage').getBoundingClientRect();if(!st.width||!st.height)return;const k=Math.min(st.width/W,st.height/H),dpr=window.devicePixelRatio||1,s=clamp(k*dpr,.5,lowQ()?1:2),w=Math.round(W*s),h=Math.round(H*s);if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}RS=w/W;const ox=(st.width-W*k)/2,oy=(st.height-H*k)/2,tb=$('toolbar');tb.style.top=Math.round(oy+100*k)+'px';tb.style.right=Math.round(ox+12*k)+'px'}
addEventListener('resize',fit);if(window.ResizeObserver)new ResizeObserver(fit).observe($('stage'));

// ---------- sound (synthesized, starts off) ----------
function ensureAudio(){try{if(!audioCtx){audioCtx=new(window.AudioContext||window.webkitAudioContext)();master=audioCtx.createGain();master.gain.value=.9;master.connect(audioCtx.destination);const n=audioCtx.sampleRate*.7|0;noiseBuf=audioCtx.createBuffer(1,n,audioCtx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<n;i++)d[i]=rand()*2-1}audioCtx.resume().catch(()=>{})}catch(e){audioCtx=null}}
function toggleSound(){sound=!sound;store.set('sound',sound);if(sound){ensureAudio();tone(440,.08)}renderOpts()}
if(sound){const wake=()=>{ensureAudio();removeEventListener('pointerdown',wake);removeEventListener('keydown',wake)};addEventListener('pointerdown',wake);addEventListener('keydown',wake)}
function tone(hz,dur=.07,type='sine',gain=.05){if(!sound||!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime;o.type=type;o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(Math.max(35,hz*.35),t+dur);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur)}
function noise(dur=.1,freq=1200,gain=.08,q=1,type='bandpass',sweep=1){if(!sound||!audioCtx||!noiseBuf)return;const t=audioCtx.currentTime,s=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();s.buffer=noiseBuf;s.loop=true;f.type=type;f.frequency.setValueAtTime(freq,t);f.frequency.exponentialRampToValueAtTime(Math.max(60,freq*sweep),t+dur);f.Q.value=q;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t,rand()*.3);s.stop(t+dur+.02)}
const sfx={
  whoosh:(p=1)=>noise(.13,420*p,.045,1.1,'bandpass',4),
  hit:()=>{tone(150,.1,'sawtooth',.06);noise(.08,1900,.11,.7,'bandpass',.3)},
  heavy:()=>{tone(72,.24,'sine',.16);tone(120,.12,'sawtooth',.07);noise(.2,900,.17,.6,'lowpass',.2)},
  block:()=>{tone(520,.05,'triangle',.05);noise(.05,3400,.06,3)},
  cast:i=>{tone(260+i*45,.08,'sine',.05);noise(.1,1500,.03,2,'bandpass',2.2)},
  sup:()=>{tone(110,.3,'sawtooth',.07);noise(.34,300,.07,1.4,'bandpass',9)},
  ko:()=>{tone(55,.6,'sine',.2);noise(.5,500,.16,.5,'lowpass',.2);noise(1.6,1100,.05,.4,'bandpass',1.4)},
  land:()=>noise(.07,260,.06,.8,'lowpass',.5),
  thud:()=>{tone(60,.16,'sine',.13);noise(.12,340,.1,.7,'lowpass',.4)}
};

// ---------- loading ----------
function loadImage(src){return new Promise((yes,no)=>{let i=new Image();i.onload=()=>yes(i);i.onerror=no;i.src=src})}
// Offline packed atlases use stable pivots, clean alpha, 32px gutters and silhouette meshes.
async function boot(){try{await Promise.all(CH.map(async c=>{c.im=await loadImage(c.img);c.frames.forEach(fr=>{fr.im=c.im;fr.scale=c.scale});c.f={};for(const [name,indices] of Object.entries(c.animations))c.f[name]=indices.map(i=>c.frames[i]);c.upper=c.f.upper}));fxImage=await loadImage(FX_SRC);ready=true;buildCards();drawArenaThumbs();$('go').disabled=false;$('go').textContent='ENTER THE RING';$('status').textContent='3 arenas · 48 new FX frames · Back-to-block / timed parry · Best of three'}catch(e){$('status').textContent='Could not load the artwork. Reopen the complete HTML file.';console.error(e)}}
function buildCards(){const box=$('cards');box.innerHTML='';CH.forEach((c,i)=>{const b=document.createElement('button');b.className='card'+(i===sel?' sel':'');b.style.setProperty('--c',COL[i]);b.setAttribute('aria-pressed',i===sel);const cn=document.createElement('canvas');cn.width=180;cn.height=195;let g=cn.getContext('2d'),fr=c.f.idle[0],bb=fr.bounds,s=165/bb.h;g.drawImage(fr.im,fr.x+bb.x,fr.y+bb.y,bb.w,bb.h,(180-bb.w*s)/2,188-bb.h*s,bb.w*s,bb.h*s);b.append(cn);let name=document.createElement('div');name.className='name';name.textContent=c.name;let role=document.createElement('div');role.className='role';role.textContent=ROSTER[i].role;b.append(name,role);b.onclick=()=>{sel=i;store.set('sel',i);buildCards();tone(480)};box.append(b)});
  const r=ROSTER[sel],sp=clamp((r.speed-170)/(285-170),.08,1),pw=clamp((r.power-.86)/(1.14-.86),.08,1);$('preview').style.setProperty('--c',r.color);
  $('fighterInfo').innerHTML='<h3>'+r.name+'</h3><div class="tag">'+r.role+'</div><div class="stat">SPEED<i><b style="width:'+Math.round(sp*100)+'%"></b></i></div><div class="stat">POWER<i><b style="width:'+Math.round(pw*100)+'%"></b></i></div><div class="mv"><span><b>U</b>'+r.upper+'</span><span><b>I</b>'+r.wave+'</span><span><b>L</b>'+r.super+'</span></div><p class="pas">'+r.passive+'</p><p class="det">'+r.detail+'</p>'}
function mk(ci,x,face,human){return{ci,x,face,human,slow:0,angle:0,setup:0,counter:0,armor:0,castCount:0,hp:100,shownHP:100,mt:40,st:'idle',t:0,air:0,vy:0,vx:0,wins:0,hit:false,connected:false,back:false,backHeld:false,parryWindow:0,parryCooldown:0,inv:0,cd:0,combo:0,comboTime:0,hitGlow:0,think:0,ghostTime:0,ctl:{dir:0},land:0,stepT:0,auraT:0,hudShake:0,comboPop:0,guardFlash:0,downThud:false}}
function newMatch(same){if(!ready)return;difficulty=$('difficulty').value;const enemy=same&&P2?P2.ci:(sel+1+Math.floor(Math.random()*(CH.length-1)))%CH.length;P1=mk(sel,300,1,true);P2=mk(enemy,660,-1,false);stats={dealt:0,taken:0,parries:0,blocks:0,supers:0,t0:performance.now()};totalHits=0;maxCombo=0;round=1;paused=false;confettiT=0;$('menu').style.display='none';$('result').style.display='none';$('pauseScreen').style.display='none';startRound();refreshMoveLabels();buzz(15)}
function refreshMoveLabels(){const r=ROSTER[P1.ci];for(const[k,name,cost]of[['h',r.upper,20],['w',r.wave,30],['s',r.super,100]]){const b=document.querySelector('[data-k='+k+']');if(b){b.innerHTML=name+'<small>'+cost+'</small>';b.title=r.detail}}$('help').innerHTML='U: '+r.upper+' (20 energy) · I: '+r.wave+' (30 energy) · L: '+r.super+' (100 energy)<br>'+r.passive+'<br>'+r.detail+'<br>A/D: Move · W: Jump · J: Punch · K: Kick · Shift: Dash · Block: hold back, or hold S / GUARD · Parry: tap it just before impact'}
function startRound(){resetEnvironment();[P1,P2].forEach((f,i)=>Object.assign(f,{x:i?660:300,face:i?-1:1,hp:100,shownHP:100,mt:Math.max(40,Math.min(70,f.mt)),st:'idle',t:0,air:0,vy:0,vx:0,hit:false,connected:false,inv:0,cd:0,combo:0,comboTime:0,hitGlow:0,think:0,ctl:{dir:0},slow:0,angle:0,setup:0,counter:0,armor:0,castCount:0,back:false,backHeld:false,parryWindow:0,parryCooldown:0,prevX:undefined,prevAir:undefined,land:0,stepT:0,hudShake:0,comboPop:0,guardFlash:0,downThud:false}));timer=60;phase='intro';pt=0;koMsg='';setMsg(difficulty==='training'?'TRAINING':'ROUND '+round);parts=[];effects=[];ghosts=[];shots=[];texts=[];swooshes=[];hitstop=0;flash=0;slowT=0;superDim=0;banner=null;lastTick=-1;cam.trauma=0;cam.focus=null;cam.focusT=0;cam.punch=0;clearInput();resetShowtime();introT0=round===1?1.25:0;if(introT0)msg=''}
function toMenu(){paused=false;phase='menu';P1=null;P2=null;clearInput();parts=[];confettiT=0;$('menu').style.display='flex';$('pauseScreen').style.display='none';$('result').style.display='none';$('pause').textContent='PAUSE';buildCards()}

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
  environmentHit(a,d,at);
  const heavy=at.kind==='sp',mid=at.kind==='upper'||at.kind==='kick',dir=(a.face>0?0:Math.PI)-a.face*.35,col=COL[a.ci];
  sparks(x,y,col,heavy?46:mid?24:at.rapid?10:16,dir,heavy?2.7:1.7,heavy?640:mid?520:430);
  shards(x,y,col,heavy?12:mid?6:3,dir-a.face*.15,1.6,heavy?520:380);
  flare(x,y,'#fff3d0',heavy?150:mid?100:74);ringFx(x,y,col,heavy?210:mid?130:95,heavy?.45:.3);
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
function start(f,move){const a=moveData(f,move);if(a&&f.mt<a.cost){if(f.human&&f.notice!==move){label('NEED '+a.cost+' ENERGY',f.x,GY-200,'#efc677');f.notice=move;tone(150,.06,'square',.02)}return false}if(a)f.mt-=a.cost;Object.assign(f,{st:move,t:0,hit:false,connected:false,vx:0,notice:null,castCount:0,terrainHit:false});const col=COL[f.ci];
  environmentStart(f,move);
  if(move==='dash'){f.cd=.85;f.inv=f.ci===1?.22:.13;f.vx=f.face*690;if(f.ci===5){ringFx(f.x,GY-85,col,120,.3);f.x=clamp(f.x+f.face*130,65,895);f.vx=0;f.prevX=f.x;burst(f.x,GY-80,col,18);flare(f.x,GY-85,col,110);ringFx(f.x,GY-85,col,150,.34)}effect(3,f.x,GY-15,110);dust(f.x,GY,5,-f.face,1.3);speedLines(f.face,col,4);sfx.whoosh(1.4);tone(180,.07,'triangle')}
  if(move==='sp'){f.vx=f.face*(a.lunge??620);flash=.12;addShake(.35);effect(1,f.x,GY-85,190,f.face,.45);
    hitstop=Math.max(hitstop,reduced?.08:.26);superDim=1;banner={ci:f.ci,face:f.face,t:0,dur:1.05};hype=1;crowdFlash(8);
    const n=qn(30);for(let i=0;i<n;i++){const an=rand()*TAU,r=120+rand()*90,life=.2+rand()*.1;parts.push({k:'spark',x:f.x+Math.cos(an)*r,y:GY-90+Math.sin(an)*r*.8,vx:-Math.cos(an)*r/life,vy:-Math.sin(an)*r*.8/life,g:0,drag:0,l:life,max:life,size:1.5+rand()*2,c:rand()<.4?'#ffffff':col})}
    ringFx(f.x,GY-4,col,240,.5,.25,5);dust(f.x,GY,6,0,1.2);speedLines(f.face,col,14);sfx.sup();buzz(35)}
  if(move==='kick'){f.vx=f.face*160;effect(1,f.x+f.face*60,GY-85,135,f.face,.32)}
  if(move==='upper'){f.vx=f.face*260;if(f.ci===3){f.armor=.28;ringFx(f.x,GY-90,col,110,.28,1.3,4)}if(f.ci===6){f.counter=.34;f.vx=0;label('REBUTTAL',f.x,GY-200,col);ringFx(f.x,GY-90,col,120,.34,1.2,3)}effect(3,f.x,GY-5,110);dust(f.x,GY,3,-f.face);tone(220,.1,'triangle')}
  if(a&&!a.volley&&!a.counter){swooshes.push({f,kind:move,t:-(Math.max(0,a.hit-.05)),dur:move==='sp'?.3:.2,col});sfx.whoosh(move==='punch'?1.5:move==='kick'?1:.8)}
  return true}
const TIMING={punch:[0,.04,.07,.10,.19,.245],kick:[0,.06,.11,.16,.28,.35],upper:[0,.08,.16,.22,.38,.52],wave:[0,.08,.16,.24,.38,.50],sp:[0,.08,.16,.25,.57,.70]};
function selectFrame(f){const F=CH[f.ci].f,st=f.st;let frames=F[st]||F.idle,index=0;if(st==='walk')index=Math.floor(f.t*10)%frames.length;else if(TIMING[st]){let times=f.ci===6&&st==='sp'?[0,.1,.3,.5,.65,.75]:TIMING[st];for(let i=1;i<times.length;i++)if(f.t>=times[i])index=i}else if(st==='jump')index=f.vy>0?1:0;return frames[Math.min(index,frames.length-1)]}
function hit(a,d,at,projectile=false){if(d.inv>0||d.st==='down'||phase!=='fight')return false;
  if(tryParry(a,d,at,projectile))return true;
  if(d.counter>0&&!at.isCounter){d.counter=0;d.inv=.14;label('REBUTTAL!',d.x,GY-210,COL[d.ci],18);flare(d.x,GY-95,COL[d.ci],130);ringFx(d.x,GY-95,COL[d.ci],160,.3);hit(d,a,{...ATK.punch,kind:'counter',dmg:11,kb:230,isCounter:true},true);return true}
  let guardBreak=at.guardBreak||(at.breakMarked&&d.angle>0);const blocking=!guardBreak&&d.back&&d.air===0&&['idle','walk','block'].includes(d.st);
  if(guardBreak&&d.back&&d.air===0&&['idle','walk','block'].includes(d.st)){label('GUARD BREAK!',d.x,GY-232,'#ff8a5c',17);shards(d.x+d.face*30,GY-90,'#92e5ff',14,null,TAU,420)}
  let bonus=0;if(a.ci===7&&at.kind==='wave'&&d.setup>0){bonus=8;d.setup=0;label('PAYOFF!',d.x,GY-205,COL[a.ci],17)}if(a.ci===2&&at.kind==='sp'&&d.angle>0){bonus=5;d.angle=0}
  const armored=d.armor>0;let dmg=(at.dmg+bonus)*STAT[a.ci].power*(blocking?.12:Math.max(a.ci===0?.80:.65,1-a.combo*(a.ci===0?.035:.07)))*(armored?.6:1);
  d.hp=Math.max(0,d.hp-dmg);trackDamage(a,d,dmg,blocking,at);d.damageTime=0;a.mt=Math.min(100,a.mt+(blocking?2:dmg*.72));d.mt=Math.min(100,d.mt+dmg*.45);a.connected=true;
  if(!blocking){if(at.mark==='angle')d.angle=3;if(at.mark==='setup')d.setup=3;if(at.slow)d.slow=at.slow}
  if(a.ci===8&&(blocking||at.kind==='wave'))a.mt=Math.min(100,a.mt+8);
  d.hitGlow=.13;const x=d.x-a.face*22,y=GY-d.air-90;
  if(blocking){d.st='block';d.t=0;d.vx=a.face*80;effect(1,x,y,85,-a.face,.27);fxBlock(a,d,x,y);label('BLOCK',d.x,GY-190,'#92e5ff');hitstop=.03}
  else{a.combo=a.comboTime>0?a.combo+1:1;a.comboTime=1.15;a.comboPop=1;if(a.human){totalHits++;maxCombo=Math.max(maxCombo,a.combo)}
    if(!armored||d.hp<=0){d.st=d.hp<=0||at.knockdown?'down':'hit';d.t=0;d.vx=a.face*at.kb;d.vy=0;d.downThud=false}else{d.armor=0;label('IRON DELIVERY',d.x,GY-195,COL[d.ci])}
    if(at.kind==='upper'&&!armored){d.air=Math.max(5,d.air);d.vy=-550}
    effect(0,x,y,at.kind==='sp'?230:145,a.face,.34);fxHit(a,d,at,x,y);showtimeHit(a,d,at,x,y,dmg);
    hitstop=at.rapid?.018:at.kind==='sp'?.11:(at.kind==='upper'||at.kind==='kick')?.06:.045;flash=Math.max(flash,at.kind==='sp'?.12:.03);
    label('-'+Math.round(dmg),d.x+15,y-35,dmg>=14?'#ffffff':COL[a.ci],dmg>=20?28:dmg>=11?21:16,true)}
  return true}
function resolve(f,o){let a=moveData(f);if(a.counter)return;const dist=(o.x-f.x)*f.face;if(dist<-20||dist>a.reach||Math.abs(f.air-o.air)>110)return;if(hit(f,o,a))f.hit=true}
function ai(f,o,dt){let c=f.ctl;if(difficulty==='training'){f.ctl={dir:0};return}f.think-=dt;if(f.think>0)return;let hard=difficulty==='hard',easy=difficulty==='easy';f.think=hard?.10:easy?.34:.22;f.ctl=c={dir:0};const d=Math.abs(o.x-f.x),toward=Math.sign(o.x-f.x),r=Math.random();if(d>165){c.dir=toward;if(f.mt>=30&&d>290&&r<(hard?.3:.14))c.w=1;else if(d>320&&r<.2)c.d=1;else if(r>.93)c.u=1}else if(ATK[o.st]&&r<(hard?.58:easy?.15:.34)){c.dir=-toward}else if(f.mt>=100&&r<.20)c.s=1;else if(f.mt>=20&&r<.34)c.h=1;else if(r<.66)c.k=1;else if(r<.9)c.p=1;else c.dir=-toward}
function updateF(f,o,dt){f.t+=dt;for(const key of['slow','angle','setup','counter','armor'])f[key]=Math.max(0,(f[key]||0)-dt);f.damageTime=(f.damageTime||0)+dt;f.inv=Math.max(0,f.inv-dt);f.cd=Math.max(0,f.cd-dt);f.hitGlow=Math.max(0,f.hitGlow-dt);f.comboTime=Math.max(0,f.comboTime-dt);if(!f.comboTime)f.combo=0;f.shownHP+=(f.hp-f.shownHP)*Math.min(1,dt*4);if(f.human)f.ctl={dir:(held.r||0)-(held.l||0),u:buf.u>0,p:buf.p>0,k:buf.k>0,h:buf.h>0,w:buf.w>0,s:buf.s>0,d:buf.d>0};const c=f.ctl;
  const free=['idle','walk'].includes(f.st);if(free&&!(f.human&&turnMode&&c.dir&&!held.b))f.face=o.x>=f.x?1:-1;const cancel=ATK[f.st]&&f.connected&&f.t>=moveData(f).hit+.035&&f.t<moveData(f).dur-.025;
  if(free||cancel){let chosen=null;for(const [k,a] of [['s','sp'],['h','upper'],['w','wave'],['k','kick'],['p','punch']])if(c[k]&&(!cancel||ATK[a].rank>ATK[f.st].rank)){if(start(f,a))chosen=a;if(f.human)buf[k]=0;break}if(!chosen&&free){if(c.d&&f.cd<=0){start(f,'dash');if(f.human)buf.d=0}else if(c.u&&f.air===0){f.st='jump';f.t=0;f.vy=-790;f.vx=c.dir*STAT[f.ci].speed;effect(3,f.x,GY-10,90);dust(f.x,GY,4,0,1.1);sfx.whoosh(.7);if(f.human)buf.u=0}else{f.vx=(f.human&&held.b?0:c.dir)*(f.back?150:STAT[f.ci].speed)*(f.slow>0?.62:1);let ns=f.vx?'walk':'idle';if(ns!==f.st)f.t=0;f.st=ns}}}
  if(ATK[f.st]){const a=moveData(f);if(!f.terrainHit&&f.t>=a.hit&&['kick','upper','sp'].includes(f.st)){f.terrainHit=true;const tx=f.x+f.face*(f.st==='sp'?85:55);if(f.st==='sp'||props.some(p=>p.hp>0&&Math.abs(p.x-tx)<60))floorDamage(tx,f.st==='sp'?2:1)}if(a.volley){while(f.castCount<a.volley.length&&f.t>=a.volley[f.castCount].at){const spec=a.volley[f.castCount],index=f.castCount++,sx=f.x+f.face*65,sy=GY-90;shots.push({x:sx,y:sy,originY:sy,vx:f.face*spec.speed,face:f.face,owner:f,t:0,life:2.3,path:spec.path,lane:index,trail:0,at:{...a,dmg:spec.dmg,knockdown:a.kind==='sp'&&index===a.volley.length-1,rapid:a.volley.length>1},color:COL[f.ci]});f.hit=true;flare(sx,sy,COL[f.ci],a.kind==='sp'?110:80);ringFx(sx,sy,COL[f.ci],70,.22,1.3,3);sparks(sx,sy,COL[f.ci],8,f.face>0?Math.PI:0,1.6,260,300);kick(-f.face*(a.kind==='sp'?7:4));addShake(a.kind==='sp'?.12:.05);sfx.cast(index)}}else if(!f.hit&&f.t>=a.hit&&f.t<=a.end)resolve(f,o);if(f.st==='upper'&&!a.counter)f.air=Math.sin(clamp((f.t-.16)/.48,0,1)*Math.PI)*38;if(f.t>=a.dur){f.st='idle';f.t=0;if(a.kind==='upper')f.air=0}}
  if(f.st==='dash'&&f.t>.20){f.st='idle';f.vx=0;f.t=0}if((f.st==='hit'||f.st==='block')&&f.t>(f.st==='hit'?.31:.18)&&f.air===0){f.st='idle';f.t=0}if(f.st==='down'&&f.hp>0&&f.t>1.0&&f.air===0){f.st='idle';f.inv=.35;f.t=0}
  if(f.st==='jump'||(f.air>0&&f.st!=='upper')){f.vy+=2250*dt;f.air-=f.vy*dt;if(f.air<=0){f.air=0;f.vy=0;effect(3,f.x,GY-8,110);dust(f.x,GY,3,-1);dust(f.x,GY,3,1);f.land=.16;sfx.land();if(f.st==='jump'){f.st='idle';f.vx=0;f.t=0}}}
  if(!['walk','jump','dash'].includes(f.st))f.vx*=Math.pow(f.st==='sp'?.15:.002,dt);f.x=clamp(f.x+f.vx*dt,65,895);
  f.ghostTime-=dt;if(!reduced&&['dash','sp','upper'].includes(f.st)&&f.ghostTime<=0){f.ghostTime=.04;ghosts.push({x:f.x,air:f.air,face:f.face,fr:selectFrame(f),t:0,dur:.26,col:COL[f.ci]})}}
function finishRound(){shots=[];phase='ko';pt=0;const timeUp=P1.hp>0&&P2.hp>0;let draw=P1.hp===P2.hp;let winner=P1.hp>P2.hp?P1:P2;
  if(draw){setMsg('DRAW');koMsg=''}else{winner.wins++;const loser=winner===P1?P2:P1;koMsg=winner.human?(winner.hp>=100?'PERFECT ROUND':'ROUND WON'):'ROUND LOST';setMsg(timeUp?'TIME UP':'K.O.');winner.st='win';winner.t=0;winner.vx=0;loser.st='down';loser.t=0;loser.air=0;loser.downThud=false;if(timeUp){addShake(.3);crowdFlash(8);hype=1}else fxKO(winner,loser)}
  tone(draw?220:winner.human?600:110,.25,'triangle')}
function step(dt){if(hitstop>0){hitstop-=dt;return}pt+=dt;
  if(phase==='intro'){P1.t+=dt;P2.t+=dt;if(introT0&&pt>=introT0&&!msg)setMsg(roundLabel());if(pt>1.4+introT0){phase='fight';pt=0;setMsg('FIGHT');tone(550,.14,'triangle');noise(.25,900,.06,.6,'bandpass',2);addShake(.3);hype=.8;crowdFlash(6);ringFx(480,GY-150,'#ffe9b5',520,.5,.5,4);buzz(25)}}
  else if(phase==='fight'){if(pt>.7)setMsg('');if(difficulty!=='training')timer=Math.max(0,timer-dt);if(!P2.human)ai(P2,P1,dt);updateDefense(P1,P2,dt);updateDefense(P2,P1,dt);updateF(P1,P2,dt);if(P2.hp>0||difficulty==='training')updateF(P2,P1,dt);
    for(const s of shots){s.t+=dt;s.life-=dt;s.x+=s.vx*dt;if(s.path==='zigzag')s.y=s.originY+Math.sin(s.t*17)*40;else if(s.path==='bounce')s.y=GY-35-Math.abs(Math.sin(s.t*9))*100;else if(s.path==='fan')s.y=s.originY+(s.lane-1)*s.t*90;const target=s.owner===P1?P2:P1;if(Math.abs(s.x-target.x)<42&&Math.abs(s.y-(GY-target.air-85))<75&&hit(s.owner,target,s.at,true)){s.life=0;effect(1,s.x,s.y,100,s.face)}}shots=shots.filter(s=>s.life>0&&s.x>-50&&s.x<1010);
    const dx=P2.x-P1.x;if(Math.abs(dx)<55&&Math.abs(P1.air-P2.air)<60){const push=(55-Math.abs(dx))/2*Math.sign(dx||1);P1.x=clamp(P1.x-push,65,895);P2.x=clamp(P2.x+push,65,895)}
    if(difficulty==='training'){P1.mt=100;if(P2.damageTime>1.5&&P2.hp<100&&P2.comboTime===0&&P1.comboTime===0&&['idle','walk'].includes(P2.st))P2.hp=100;if(P2.hp<=0&&P2.t>.9){P2.hp=100;P2.st='idle';P2.t=0;P2.x=660}}else if(P1.hp<=0||P2.hp<=0||timer<=0)finishRound()}
  else if(phase==='ko'){[P1,P2].forEach(f=>{f.t+=dt;f.shownHP+=(f.hp-f.shownHP)*Math.min(1,dt*5);f.hitGlow=Math.max(0,f.hitGlow-dt);f.comboTime=Math.max(0,f.comboTime-dt);f.vx*=Math.pow(.02,dt);f.x=clamp(f.x+f.vx*dt,65,895)});if(koMsg&&pt>.5){setMsg(koMsg);koMsg=''}
    if(pt>2.2){if(P1.wins>=2||P2.wins>=2){phase='end';const won=P1.wins>=2;$('resultTitle').textContent=won?'VICTORY':'DEFEATED';$('resultTitle').style.color=won?'#f5be58':'#ff7982';$('resultStats').textContent=`${P1.wins} – ${P2.wins} rounds · ${totalHits} hits landed · Best combo: ${maxCombo}`;fillResult(won);$('result').style.display='flex';clearInput();if(won){confettiT=2.6;buzz([30,60,30,60,90])}}else{round++;startRound()}}}
  for(const k in buf)buf[k]=Math.max(0,buf[k]-dt)}

// ---------- per-frame visual update (runs at the display's refresh rate) ----------
const rxOf=f=>f.prevX===undefined?f.x:f.prevX+(f.x-f.prevX)*renderAlpha,raOf=f=>f.prevAir===undefined?f.air:f.prevAir+(f.air-f.prevAir)*renderAlpha;
let uiPlaying=null;const uiBtn={};
function syncUI(){const playing=!!P1&&['intro','fight','ko'].includes(phase)&&!paused;if(playing!==uiPlaying){uiPlaying=playing;document.body.classList.toggle('playing',playing);fit()}
  if(isTouch&&P1)for(const[k,cost]of[['h',20],['w',30],['s',100]]){const off=P1.mt<cost;if(uiBtn[k]!==off){uiBtn[k]=off;const b=document.querySelector('[data-k='+k+']');if(b){b.classList.toggle('off',off);if(k==='s')b.classList.toggle('ready',!off)}}}}
function fxUpdate(dt,real){environmentUpdate(dt);showtimeUpdate(dt,real);vclock+=dt;msgT+=real;
  for(const e of effects)e.t+=dt;effects=effects.filter(e=>e.t<e.dur);for(const g of ghosts)g.t+=dt;ghosts=ghosts.filter(g=>g.t<g.dur);
  for(const t of texts){t.t+=dt;t.y-=(t.pop?46*Math.max(0,1-t.t*1.4):25)*dt;t.x+=t.vx*dt}texts=texts.filter(t=>t.t<t.dur);
  if(hitstop<=0)for(const s of swooshes)s.t+=dt;swooshes=swooshes.filter(s=>s.t<s.dur&&(s.t>=0||s.f.st===s.kind));
  for(const f of flashes)f.t+=real;flashes=flashes.filter(f=>f.t<f.dur);
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.l-=dt;if(p.l<=0){parts[i]=parts[parts.length-1];parts.pop();continue}if(p.k==='ring'||p.k==='flare')continue;p.vy+=p.g*dt;if(p.drag){const d=Math.exp(-p.drag*dt);p.vx*=d;if(p.k!=='spark'&&p.k!=='shard')p.vy*=d}p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.spin)p.rot+=p.spin*dt;if(p.k==='conf')p.x+=Math.sin(vclock*3+p.ph)*30*dt;if(p.b&&p.y>GY+8&&p.vy>0){p.y=GY+8;p.vy*=-.38;p.vx*=.6;if(p.spin)p.spin*=.5}}
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
  const hw=W/2/cam.z,hh=H/2/cam.z;cam.cx=clamp(cam.x,hw,W-hw);cam.cy=H-hh;
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
function drawF(f){let fr=selectFrame(f);const rx0=rxOf(f),ra=raOf(f),vt=f.t+(hitstop>0||paused?0:renderAlpha*FIXED_DT),col=COL[f.ci];
  let rx=rx0,breath=['idle','block'].includes(f.st)?Math.sin(vclock*3.7+f.ci)*.013:0,sx=1-breath,sy=1+breath,angle=0,dx=0,dy=0;
  if(phase==='intro'&&!reduced){const k=1-easeOut((pt-introT0)/.9);if(k>.015){rx-=f.face*k*340;const wf=CH[f.ci].f.walk;fr=wf[Math.floor(vclock*10)%wf.length];dy=Math.sin(vclock*20)*1.4;angle=Math.sin(vclock*10)*.014}}
  // shadow + color ring
  if(!impactOn){ctx.save();ctx.fillStyle='#080a1266';ctx.beginPath();ctx.ellipse(rx,GY+4,Math.max(20,46-ra*.09),9,0,0,TAU);ctx.fill();ctx.strokeStyle=col+'70';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(rx,GY+4,41,8,0,0,TAU);ctx.stroke();}
  if(!lowQ()){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=f.mt>=100?.3+.12*Math.sin(vclock*8):.14;ctx.drawImage(glow(col),rx-90,GY-12,180,34)}ctx.restore();
  if(f.st==='walk'){dy=Math.sin(vt*20)*1.6;angle=Math.sin(vt*10)*.016}
  if(f.st==='jump'){const s=clamp(-f.vy/790,-1,1);sy+=Math.abs(s)*.07;sx-=Math.abs(s)*.045;angle=f.face*Math.sign(f.vx)*.05}
  if(ATK[f.st]){const a=moveData(f),wind=ease(vt/a.hit),rec=ease((vt-a.hit)/(a.dur-a.hit)),pulse=Math.sin(wind*Math.PI)*(1-rec),thrust=wind*(1-rec);sx+=pulse*.03+thrust*.03;sy-=pulse*.022+thrust*.012;angle=(f.st==='upper'?-.05:.03)*Math.sin(clamp(vt/a.dur,0,1)*Math.PI);dx+=f.face*(thrust*9-(1-wind)*4*(vt<a.hit?1:0))}
  if(f.st==='hit'){const k=Math.sin(clamp(vt/.31,0,1)*Math.PI);angle=-k*.17;dx=-f.face*k*6;sx-=k*.03;sy+=k*.02}
  if(f.st==='down'){const t=ease(vt/.36);angle=-t*Math.PI*.48;dx=f.face*t*55;dy=-Math.sin(t*Math.PI)*22-Math.max(0,Math.sin(clamp((vt-.36)/.22,0,1)*Math.PI))*7}
  if(f.st==='dash'){angle=.13;sy=.95;sx=1.06}if(f.st==='block'){sy=.97;dx-=f.face*Math.sin(clamp(vt/.18,0,1)*Math.PI)*4}
  if(f.st==='win'&&!reduced)dy-=Math.abs(Math.sin(vt*6.5))*13*Math.exp(-vt*.9);
  if(f.land>0){const k=Math.sin(f.land/.16*Math.PI);sy-=k*.09;sx+=k*.07}
  if(hitstop>0&&(f.st==='hit'||f.st==='down')&&!reduced)dx+=Math.sin(vclock*95)*3;
  const X=rx+dx,Y=GY-ra+dy,opacity=f.inv>0&&Math.floor(vclock*30)%2?.7:1;
  if(impactOn){drawSprite(fr,X,Y,f.face,1,false,sx,sy,angle,f===impact.victim?'#ffffff':COL[f.ci]);return}
  if(ARENAS[arenaId].wet&&!lowQ()){ctx.save();ctx.beginPath();ctx.rect(0,GY+5,W,H-GY);ctx.clip();drawSprite(fr,X,GY+11+ra-dy,f.face,.13,false,sx,-sy*.48,angle,col);ctx.restore()}
  drawTrace(fr,X,Y,f.face,sx,sy,angle,col,ATK[f.st]||f.st==='dash');
  drawSprite(fr,X,Y,f.face,opacity,true,sx,sy,angle);
  if(f.mt>=100&&f.hp>0&&!lowQ()){ctx.save();ctx.globalCompositeOperation='lighter';drawSprite(fr,X,Y,f.face,.1+.07*Math.sin(vclock*8),false,sx,sy,angle,col);ctx.restore()}
  if(f.armor>0||f.counter>0){ctx.save();ctx.globalCompositeOperation='lighter';drawSprite(fr,X,Y,f.face,.32+.2*Math.sin(vclock*30),false,sx,sy,angle,col);ctx.restore()}
  if(f.hitGlow>0)drawSprite(fr,X,Y,f.face,clamp(f.hitGlow/.13,0,1)*.85,false,sx,sy,angle,'#ffffff');
  drawMesh(fr,X,Y,f.face,sx,sy,angle);
  if(f.angle>0||f.setup>0||f.slow>0){const c2=f.angle>0?'#ff758b':f.setup>0?'#8eb6ff':'#d5a8ff';text(f.angle>0?'MARKED':f.setup>0?'SETUP':'SLOWED',rx,GY-ra-205,10,c2);ctx.save();ctx.strokeStyle=c2;ctx.lineWidth=1.5;ctx.globalAlpha=.8;ctx.setLineDash([5,5]);ctx.lineDashOffset=-vclock*30;ctx.beginPath();ctx.ellipse(rx,GY-ra-222,13,5,0,0,TAU);ctx.stroke();ctx.restore()}
  if((f.back&&['idle','walk','block'].includes(f.st))||f.guardFlash>0){const gf=clamp(f.guardFlash/.2,0,1);ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#8be2ff';ctx.globalAlpha=.55+gf*.45;ctx.lineWidth=3+gf*5;ctx.lineCap='round';ctx.translate(rx,GY-ra-90);ctx.scale(f.face,1);ctx.beginPath();ctx.ellipse(35,0,20+gf*5,64+gf*8,0,-1.4,1.4);ctx.stroke();ctx.restore()}}
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
    else if(p.k==='line'){ctx.globalAlpha=a*.5;ctx.strokeStyle=p.c;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.sign(p.vx)*-p.size,p.y);ctx.stroke()}}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1}

// ---------- text & HUD ----------
function text(s,x,y,size=20,col='#fff',align='center'){ctx.save();ctx.font=`800 ${size}px Arial,sans-serif`;ctx.textAlign=align;ctx.lineJoin='round';ctx.lineWidth=Math.max(3,size*.22);ctx.strokeStyle='#090d17';ctx.strokeText(s,x,y);ctx.fillStyle=col;ctx.fillText(s,x,y);ctx.restore()}
function dtext(s,x,y,size=20,col='#fff',align='center',stroke='#090d17'){ctx.save();ctx.font=`italic ${DW} ${size}px ${DISP}`;ctx.textAlign=align;ctx.lineJoin='round';ctx.lineWidth=Math.max(3,size*.2);ctx.strokeStyle=stroke;ctx.strokeText(s,x,y);ctx.fillStyle=col;ctx.fillText(s,x,y);ctx.restore()}
function para(x,y,w,h,sk){ctx.beginPath();ctx.moveTo(x+sk,y);ctx.lineTo(x+w+sk,y);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath()}
const portraits=[];
function portrait(ci){if(portraits[ci])return portraits[ci];const fr=CH[ci].f.idle[0],bb=fr.bounds,c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),side=Math.min(bb.w,bb.h*.62);g.imageSmoothingQuality='high';g.drawImage(fr.im,fr.x+bb.x+(bb.w-side)/2,fr.y+bb.y,side,side,0,0,128,128);portraits[ci]=c;return c}
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
  ctx.fillStyle=full?(Math.sin(vclock*10)>0?'#fff2af':'#ffd36a'):col;para(x0,ey,d*ew*f.mt/100,eh,d*3);ctx.fill();
  if(full&&!lowQ()){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.35+.25*Math.sin(vclock*10);ctx.drawImage(glow('#ffd36a'),Math.min(x0,x0+d*ew)-10,ey-10,ew+20,eh+20);ctx.restore()}
  ctx.strokeStyle='#00000066';for(const tk of[.2,.3]){const xx=x0+d*ew*tk;ctx.beginPath();ctx.moveTo(xx,ey);ctx.lineTo(xx,ey+eh);ctx.stroke()}
  text(full?'SUPER READY':Math.floor(f.mt)+' ENERGY',x0+d*(ew+10),ey+8,10,full?'#ffe49d':'#aab7cc',right?'right':'left');
  dtext(CH[f.ci].name.toUpperCase(),x0+d*2,31,21,'#f4efe6',right?'right':'left');
  text(f.human?'YOU':difficulty==='training'?'DUMMY':'CPU',x0+d*bw,29,10,f.human?'#f5ce84':'#8f9eb9',right?'left':'right');
  for(let k=0;k<2;k++){ctx.save();ctx.translate(m(352-k*16),25);ctx.rotate(Math.PI/4);ctx.fillStyle=k<f.wins?'#ffda86':'#3d4558';ctx.fillRect(-5,-5,10,10);ctx.strokeStyle='#090d17';ctx.lineWidth=1.5;ctx.strokeRect(-5,-5,10,10);ctx.restore()}
  // portrait
  const px=m(50),py=50,pr=31;ctx.save();ctx.beginPath();ctx.arc(px,py,pr,0,TAU);ctx.fillStyle='#141a2a';ctx.fill();ctx.clip();if(ready){ctx.translate(px,py);ctx.scale(right?-1:1,1);ctx.drawImage(portrait(f.ci),-pr,-pr+2,pr*2,pr*2)}ctx.restore();
  if(f.hitGlow>0){ctx.save();ctx.globalAlpha=clamp(f.hitGlow/.13,0,1)*.6;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px,py,pr,0,TAU);ctx.fill();ctx.restore()}
  ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(px,py,pr,0,TAU);ctx.stroke();ctx.strokeStyle='#090d17';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(px,py,pr+2.4,0,TAU);ctx.stroke();
  ctx.restore();
  // combo counter
  if(f.combo>=2&&f.comboTime>0){const a=clamp(f.comboTime/.3,0,1),pop=1+.45*f.comboPop;ctx.save();ctx.globalAlpha=a;ctx.translate(m(36),196);ctx.rotate(d*-.07);ctx.scale(pop,pop);dtext(String(f.combo),0,0,54,col,right?'right':'left');const nw=(()=>{ctx.font=`italic ${DW} 54px ${DISP}`;return ctx.measureText(String(f.combo)).width})();dtext(f.combo>=7?'UNSTOPPABLE':f.combo>=5?'ON FIRE':'HITS',d*(nw+10),0,20,'#fff3d5',right?'right':'left');ctx.restore()}}
function drawTimer(){const training=difficulty==='training',low=!training&&timer<=10&&phase==='fight';ctx.save();ctx.fillStyle='#070b14d8';ctx.beginPath();ctx.moveTo(436,12);ctx.lineTo(524,12);ctx.lineTo(512,88);ctx.lineTo(448,88);ctx.closePath();ctx.fill();ctx.strokeStyle=low?'#ff5a4e':'#f5be5880';ctx.lineWidth=2;ctx.stroke();
  const s=low&&!reduced?1+.1*Math.abs(Math.sin(vclock*Math.PI)):1;ctx.translate(480,62);ctx.scale(s,s);dtext(training?'∞':String(Math.ceil(timer)),0,0,42,low?'#ff7a6e':'#f8efdc');ctx.restore();text(training?'PRACTICE':'ROUND '+round,480,82,9,'#adbad0')}
function drawSkillBar(){if(isTouch||phase!=='fight')return;const skills=[['J','PUNCH',0],['K','KICK',0],['U','UPPER',20],['I','WAVE',30],['⇧','DASH',0],['L','SUPER',100]];
  skills.forEach(([key,name,cost],i)=>{const x=205+i*93,y=503,w=86,h=28,dash=name==='DASH',ok=P1.mt>=cost&&(!dash||P1.cd<=0),sup=name==='SUPER'&&ok;
    ctx.fillStyle=ok?'#0d1422e0':'#0d142290';para(x,y,w,h,6);ctx.fill();
    if(dash&&P1.cd>0){ctx.fillStyle='#f5be5830';para(x,y,w*(1-P1.cd/.85),h,6);ctx.fill()}
    if(cost&&!ok){ctx.fillStyle=COL[P1.ci]+'38';para(x,y,w*clamp(P1.mt/cost,0,1),h,6);ctx.fill()}
    ctx.strokeStyle=sup?(Math.sin(vclock*10)>0?'#fff2af':'#f5be58'):ok?'#ffffff30':'#ffffff14';ctx.lineWidth=sup?2:1;para(x,y,w,h,6);ctx.stroke();
    ctx.fillStyle=ok?'#f5be58':'#555d70';para(x+4,y+5,18,18,3);ctx.fill();ctx.save();ctx.font='800 11px Arial,sans-serif';ctx.textAlign='center';ctx.fillStyle='#10141f';ctx.fillText(key,x+14.5,y+18);ctx.restore();
    text(name,x+30,y+18,10,ok?'#e9ebf0':'#69728a','left')})}
function drawAnnounce(){if(!msg||!['intro','fight','ko'].includes(phase))return;const t=msgT,big=msg==='FIGHT'||msg==='K.O.',inn=reduced?1:easeOut(t/.16),col=msg==='ROUND WON'||msg==='PERFECT ROUND'||msg==='FIGHT'?'#f5be58':msg==='K.O.'?'#ff5a4e':msg==='ROUND LOST'?'#ff8f96':'#fff0d5';
  ctx.save();ctx.globalAlpha=clamp(t/.08,0,1);ctx.fillStyle='#070b14a8';const bw=W*inn;para(480-bw/2-30,214,bw+60,92,-34);ctx.fill();ctx.fillStyle=col;ctx.globalAlpha*=.8;para(480-bw/2-30,214,bw+60,3,0);ctx.fill();para(480-bw/2-64,303,bw+60,3,0);ctx.fill();ctx.restore();
  const sc=reduced?1:lerp(big?3:2.1,1,easeOut(t/(big?.2:.16)))*(big?1+.03*Math.sin(vclock*30)*Math.max(0,1-t*2):1),size=msg.length>12?52:big?92:66;
  ctx.save();ctx.translate(480,260+size*.32);ctx.scale(sc,sc);ctx.globalAlpha=clamp(t/.06,0,1);dtext(msg,0,0,size,col);ctx.restore()}
function drawBanner(){if(!banner)return;const b=banner,p=b.t/b.dur,inn=reduced?1:easeOut(p*4),out=reduced?0:ease((p-.78)/.22),col=COL[b.ci],y=132;
  ctx.save();ctx.globalAlpha=1-out;const off=(1-inn)*-b.face*W+out*b.face*200;ctx.translate(off,0);
  ctx.fillStyle='#070b14d0';para(-40,y,W+80,56,-26);ctx.fill();ctx.fillStyle=col;para(-40,y,W+80,4,-2);ctx.fill();para(-66,y+52,W+80,4,-2);ctx.fill();
  dtext(ROLES[b.ci],b.face>0?150:W-150,y+42,40,col,b.face>0?'left':'right');text(CH[b.ci].name.toUpperCase()+' · SUPER',b.face>0?152:W-152,y+12,10,'#f4efe6',b.face>0?'left':'right');
  ctx.save();ctx.beginPath();ctx.arc(b.face>0?92:W-92,y+28,40,0,TAU);ctx.fillStyle='#141a2a';ctx.fill();ctx.clip();ctx.translate(b.face>0?92:W-92,y+28);ctx.scale(b.face,1);ctx.drawImage(portrait(b.ci),-40,-38,80,80);ctx.restore();ctx.strokeStyle=col;ctx.lineWidth=4;ctx.beginPath();ctx.arc(b.face>0?92:W-92,y+28,40,0,TAU);ctx.stroke();ctx.restore()}

// ---------- scene drawing ----------
const noiseAt=(t,s)=>Math.sin(t*37.1+s)*.6+Math.sin(t*61.7+s*2.3)*.4;
function drawScene(){if(arenaId!==2){drawEnvironmentBase();return}const px=cam.cx-480,py=cam.cy-270,S=scene;
  ctx.drawImage(S.far,-W*.06+px*.7,-H*.06+py*.7,W*1.12,H*1.12);
  const jump=reduced?0:hype;
  S.rows.forEach((r,i)=>{const p=.5+i*.05,bob=reduced?0:Math.sin(vclock*(1.5+i*.17)+i*1.9)*1.8+jump*Math.abs(Math.sin(vclock*8.5+i*1.3))*-6;ctx.drawImage(r.c,-80+px*(1-p),r.y+bob+py*(1-p)*.6,W+160,74)});
  ctx.save();ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=.8+.06*Math.sin(vclock*2.3)+hype*.14;ctx.drawImage(S.lights,px*.25,py*.3,W,GY);
  for(const f of flashes){if(f.t<0)continue;const a=1-f.t/f.dur,r=16+a*22;ctx.globalAlpha=a;ctx.drawImage(glow('#dfeeff'),f.x+px*.4-r,f.y-r,r*2,r*2)}
  if(!reduced){for(let i=0;i<3;i++){const x=170+i*300+Math.sin(vclock*.4+i)*70,g=ctx.createLinearGradient(x,0,x,GY);g.addColorStop(0,i===1?'#87c8ff18':'#ffb0871c');g.addColorStop(1,'#87c8ff00');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-8,0);ctx.lineTo(x+8,0);ctx.lineTo(x+150,GY);ctx.lineTo(x-130,GY);ctx.fill()}
    const n=lowQ()?16:34;for(let i=0;i<n;i++){const mx=(i*67+vclock*(5+i%4)*1.6)%(W+40)-20,my=100+(i*37+Math.sin(vclock*.7+i)*12)%320;ctx.globalAlpha=.16+.14*Math.sin(vclock*1.7+i*2.1);ctx.fillStyle='#ffe9b5';ctx.fillRect(mx,my,2,2)}}
  ctx.restore();
  // ropes (wobble when someone is hit hard or slammed near them)
  [[262,'#e8e2d0'],[300,'#d9342b'],[338,'#e8e2d0']].forEach(([y,col],i)=>{const sag=3+rope.a*(1-i*.22)*(i%2?-1:1);ctx.lineCap='round';ctx.strokeStyle='#000a';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(30,y+3);ctx.quadraticCurveTo(480,y+3+sag*2,930,y+3);ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(30,y);ctx.quadraticCurveTo(480,y+sag*2,930,y);ctx.stroke();ctx.strokeStyle='#ffffff40';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(30,y-2);ctx.quadraticCurveTo(480,y-2+sag*2,930,y-2);ctx.stroke()});
  ctx.drawImage(S.ring,-S.M,0,W+2*S.M,H+S.EX)}
function draw(){ctx.setTransform(RS,0,0,RS,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#07060d';ctx.fillRect(0,0,W,H);if(!scene)return;
  ctx.save();const tr=reduced?0:cam.trauma*cam.trauma,t=vclock;
  ctx.translate(W/2+noiseAt(t,1)*tr*17+(reduced?0:cam.kx),H/2+noiseAt(t,7)*tr*13+(reduced?0:cam.ky));ctx.rotate(noiseAt(t,13)*tr*.02);ctx.scale(cam.z,cam.z);ctx.translate(-cam.cx,-cam.cy);
  drawScene();drawEnvironmentFloor();
  if(P1){
    if(superDim>0){ctx.fillStyle=`rgba(6,5,16,${.62*ease(superDim)})`;ctx.fillRect(-100,-100,W+200,H+200)}
    for(const g of ghosts){ctx.save();ctx.globalCompositeOperation='lighter';drawSprite(g.fr,g.x,GY-g.air,g.face,(1-g.t/g.dur)*.42,false,1,1,0,g.col);ctx.restore()}
    const order=ATK[P1.st]&&!ATK[P2.st]?[P2,P1]:[P1,P2];drawF(order[0]);drawF(order[1]);
    for(const s of swooshes)drawSwoosh(s);
    for(const s of shots){const x=s.px===undefined?s.x:lerp(s.px,s.x,renderAlpha),y=s.py===undefined?s.y:lerp(s.py,s.y,renderAlpha),sz=s.at.rapid?80:110;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55+.15*Math.sin(vclock*30);ctx.drawImage(glow(s.color),x-sz*.7,y-sz*.7,sz*1.4,sz*1.4);ctx.restore();drawFX(2,Math.floor(s.t*18)%6,x,y,sz,s.face,1,0,s.color);drawSkillGlyph(s,x,y)}
    for(const e of effects){const t=e.t/e.dur;drawFX(e.row,Math.min(5,Math.floor(t*6)),e.x,e.y,e.size*(.9+.15*ease(t)),e.face,1-ease((t-.7)/.3),t)}
  }
  drawEnvironmentFX();drawParticles();drawBolts();if(P1)drawPops();
  if(P1)for(const t of texts){const k=t.t/t.dur,sc=t.pop&&!reduced?lerp(1.9,1,easeOut(t.t/.13)):1;ctx.save();ctx.globalAlpha=1-ease((k-.65)/.35);ctx.translate(t.x,t.y);ctx.scale(sc,sc);if(t.pop)dtext(t.text,0,0,t.size,t.col);else text(t.text,0,0,t.size,t.col);ctx.restore()}
  drawImpact();
  ctx.restore();
  ctx.drawImage(scene.vig,0,0,W,H);
  if(flash>0&&!reduced){ctx.fillStyle=`rgba(255,236,205,${Math.min(.75,flash*2.4)})`;ctx.fillRect(0,0,W,H)}
  if(!P1){if(showFps)drawFps();return}
  drawDanger();drawCrowdTexts();drawBanner();hud(P1,false);hud(P2,true);drawTimer();drawAnnounce();drawSkillBar();drawUiFx();drawVS();if(showFps)drawFps()}
let fpsEma=60;function drawFps(){text(Math.round(fpsEma)+' FPS'+(lowQ()?' · low':''),480,104,9,'#9fe7a4')}
function drawPreview(){const c=$('pv');if(!c||!ready||!c.offsetParent)return;const g=c.getContext('2d'),w=c.width,h=c.height,F=CH[sel].f,col=COL[sel],cyc=vclock%4.4;g.clearRect(0,0,w,h);
  let fr=F.idle[0],st='idle',lt=0;for(const[name,at]of[['punch',1.2],['kick',2.2],['upper',3.2]])if(cyc>=at&&cyc<at+ATK[name].dur){st=name;lt=cyc-at;let idx=0;TIMING[name].forEach((tt,i)=>{if(lt>=tt)idx=i});fr=F[name][Math.min(idx,F[name].length-1)]}
  const k=h*.86/185,x=w*.46,y=h*.95,br=st==='idle'?Math.sin(vclock*3.7)*.014:0,th=st==='idle'?0:Math.sin(clamp(lt/ATK[st].dur,0,1)*Math.PI);
  g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.5;g.drawImage(glow(col),x-w*.36,y-h*.1,w*.72,h*.2);g.restore();g.fillStyle='#05070c88';g.beginPath();g.ellipse(x,y+4,70*k/1.6,10,0,0,TAU);g.fill();
  drawSprite(fr,x+th*14,y,1,1,true,1-br+th*.03,1+br-th*.02,st==='upper'?-th*.05:th*.03,null,g,k)}

// Arena expansion: deterministic vector art, baked FX frames, environmental reactions.
const ARENAS=[
 {name:'Neon Rooftop',tag:'RAIN / CITY LIGHTS',accent:'#52ddff',floor:'#16263a',wet:true},
 {name:'Foundry District',tag:'SMOKE / MOLTEN LIGHT',accent:'#ff9c52',floor:'#302b30',wet:false},
 {name:'Championship',tag:'CROWD / SPOTLIGHTS',accent:'#f5be58',floor:'#8b7758',wet:false}
];
let arenaId=clamp(store.get('arena',0)|0,0,2),shakeLevel=store.get('shake',1),dangerFX=store.get('danger',true),traceFX=store.get('trace',true);
let arenaArt=null,arenaArtKey='',envFx=[],floorScars=[],props=[],envClock=0,atlasCanvas=null;
const FX_ROWS=['smoke','splash','wind','impact','parry','crack'];
function buildEffectAtlas(){
 const c=document.createElement('canvas');c.width=1024;c.height=768;const g=c.getContext('2d');
 for(let row=0;row<6;row++)for(let frame=0;frame<8;frame++){
  const p=frame/7;g.save();g.beginPath();g.rect(frame*128,row*128,128,128);g.clip();g.translate(frame*128+64,row*128+64);g.lineCap='round';g.lineJoin='round';
  if(row===0){for(let j=0;j<9;j++){const a=j*2.399,r=(9+p*27)*(j%3/3+.4),x=Math.cos(a)*r,y=Math.sin(a)*r-p*15;const gr=g.createRadialGradient(x,y,0,x,y,13+p*16);gr.addColorStop(0,`rgba(180,202,220,${.25*(1-p*.8)})`);gr.addColorStop(1,'#8ba1ba00');g.fillStyle=gr;g.fillRect(x-45,y-45,90,90)}}
  if(row===1){g.strokeStyle=`rgba(146,235,255,${1-p*.8})`;g.lineWidth=2.4;g.beginPath();g.ellipse(0,28,10+p*48,3+p*11,0,0,TAU);g.stroke();for(let j=0;j<11;j++){const a=Math.PI+j*Math.PI/10,x=Math.cos(a)*(10+p*45),y=23+Math.sin(a)*Math.sin(p*Math.PI)*51;g.beginPath();g.moveTo(x,y);g.lineTo(x*.87,y+5*(1-p));g.stroke()}}
  if(row===2){g.strokeStyle=`rgba(190,246,255,${1-p*.85})`;for(let j=0;j<4;j++){g.lineWidth=4-j*.8;g.beginPath();g.ellipse(0,0,15+p*44,8+p*24,.2+j*.4,p*TAU+j*1.5,p*TAU+j*1.5+2.1);g.stroke()}}
  if(row===3){g.fillStyle=`rgba(255,238,187,${1-p*.85})`;g.beginPath();for(let j=0;j<24;j++){const a=j*TAU/24,r=j%2?(8+p*12):(21+p*40);g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fill();g.fillStyle='#ffffff';g.beginPath();g.arc(0,0,Math.max(0,10-p*12),0,TAU);g.fill()}
  if(row===4){g.strokeStyle=`rgba(170,255,246,${1-p*.8})`;g.lineWidth=3*(1-p)+.8;g.rotate(p*.7);g.strokeRect(-15-p*25,-15-p*25,30+p*50,30+p*50);g.beginPath();g.arc(0,0,12+p*46,0,TAU);g.stroke();for(let j=0;j<4;j++){g.rotate(Math.PI/2);g.beginPath();g.moveTo(0,8+p*25);g.lineTo(0,24+p*35);g.stroke()}}
  if(row===5){g.strokeStyle='#0a101bee';g.lineWidth=2.2;for(let j=0;j<7;j++){const a=j*TAU/7;g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(a+.2)*(8+p*18),Math.sin(a+.2)*(8+p*18)*.45);g.lineTo(Math.cos(a)*(18+p*42),Math.sin(a)*(18+p*42)*.45);g.stroke()}}
  g.restore();
 }
 atlasCanvas=c;return c;
}
function spriteFX(row,x,y,size=120,dur=.6,face=1){if(envFx.length>100)envFx.shift();envFx.push({row,x,y,size,dur,t:0,face})}
function drawAtlas(row,frame,x,y,size,alpha=1,face=1){if(!atlasCanvas)return;ctx.save();ctx.translate(x,y);ctx.scale(face,1);ctx.globalAlpha=alpha;ctx.drawImage(atlasCanvas,clamp(frame|0,0,7)*128,row*128,128,128,-size/2,-size/2,size,size);ctx.restore()}
function setArena(id){arenaId=id;store.set('arena',id);arenaArtKey='';resetEnvironment();document.querySelectorAll('.arena-card').forEach((b,i)=>b.setAttribute('aria-pressed',i===id));$('arenaNote').textContent=ARENAS[id].tag}
function initArenas(){const box=$('arenas');ARENAS.forEach((a,i)=>{const b=document.createElement('button');b.className='arena-card arena-'+i;b.innerHTML='<canvas class="arena-art" width="360" height="104"></canvas><span class="arena-name">'+a.name+'</span><small>'+a.tag+'</small>';b.onclick=()=>setArena(i);box.append(b)});setArena(arenaId);buildEffectAtlas()}
function resetEnvironment(){envFx=[];floorScars=[];envClock=0;props=[{x:145,hp:3,kind:'crate'},{x:815,hp:3,kind:arenaId===1?'barrel':'crate'}]}
function floorDamage(x,power=1){if(floorScars.length>=22)floorScars.shift();floorScars.push({x,y:GY+5+rand()*18,size:65+power*40});spriteFX(0,x,GY-15,120+power*40,.9);if(ARENAS[arenaId].wet)spriteFX(1,x,GY-10,130+power*35,.65);shards(x,GY-3,ARENAS[arenaId].floor,7*power,null,TAU,180*power);for(const p of props){if(p.hp>0&&Math.abs(p.x-x)<90+power*35){p.hp=Math.max(0,p.hp-power);spriteFX(0,p.x,GY-35,135,.85);shards(p.x,GY-45,'#bd8b65',p.hp?7:18,null,TAU,270);if(!p.hp){label('BREAK!',p.x,GY-100,'#ffd091',13);addShake(.18)}}}}
function environmentHit(a,d,at){spriteFX(3,d.x-a.face*18,GY-d.air-90,at.kind==='sp'?210:at.kind==='upper'?135:90,.28,a.face);if(at.kind==='sp'||at.kind==='upper')floorDamage(d.x,at.kind==='sp'?2:1)}
function environmentStart(f,move){if(move==='sp'){spriteFX(2,f.x,GY-90,330,.9,f.face);spriteFX(2,f.x,GY-5,440,1.05,-f.face);spriteFX(0,f.x,GY-10,200,1.1);if(ARENAS[arenaId].wet)spriteFX(1,f.x,GY-8,240,.8);if(!reduced){cam.focus=f;cam.focusT=.38;cam.punch+=.04}}
 if(move==='dash'){spriteFX(0,f.x,GY-8,100,.55);if(ARENAS[arenaId].wet)spriteFX(1,f.x,GY-8,110,.5)}}
function environmentUpdate(dt){envClock+=dt;for(const e of envFx)e.t+=dt;envFx=envFx.filter(e=>e.t<e.dur);if(!P1||phase!=='fight')return;
 for(const f of[P1,P2]){f.envStep=(f.envStep||0)-dt;if(f.air===0&&Math.abs(f.vx)>70&&f.envStep<=0){f.envStep=lowQ()?.22:.13;if(ARENAS[arenaId].wet)spriteFX(1,f.x,GY,65,.45);else if(arenaId===1)spriteFX(0,f.x,GY-7,55,.6)}if(f.st==='down'&&f.air===0&&f.t>.30&&!f.floorThud){f.floorThud=true;floorDamage(f.x,1)}if(f.st!=='down')f.floorThud=false}
 if(arenaId===1&&envClock>.24){envClock=0;spriteFX(0,75,GY-90,160,2.1);spriteFX(0,885,GY-85,180,2.4)}}
function makeArenaArt(id){const c=document.createElement('canvas');c.width=W*2;c.height=H*2;const g=c.getContext('2d');g.scale(2,2);const a=ARENAS[id];let gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,id===1?'#160f1e':'#080e24');gr.addColorStop(.7,id===1?'#623327':'#26435d');gr.addColorStop(1,'#080c18');g.fillStyle=gr;g.fillRect(0,0,W,H);
 let seed=51;const R=()=>((seed=seed*16807%2147483647)/2147483647);
 if(id===0){g.fillStyle='#e9eaff';g.beginPath();g.arc(730,95,27,0,TAU);g.fill();for(let layer=0;layer<3;layer++){for(let x=-30;x<W;x+=35+R()*40){const h=65+R()*(90+layer*33),w=30+R()*40;g.fillStyle=['#1b2c49','#14233e','#0c192e'][layer];g.fillRect(x,365-h,w,h);for(let wx=x+7;wx<x+w-5;wx+=10)for(let wy=370-h;wy<350;wy+=13){if(R()>.38){g.fillStyle=R()>.55?'#67d6f753':'#ffd49766';g.fillRect(wx,wy,3,5)}}}}g.fillStyle='#0c1525';g.fillRect(0,332,W,40);g.strokeStyle='#4f7189';g.lineWidth=2;g.beginPath();for(let x=0;x<W;x+=55){g.moveTo(x,294);g.lineTo(x,375)}g.moveTo(0,298);g.lineTo(W,298);g.stroke();g.fillStyle='#ff72bc';g.font='900 25px Arial';g.fillText('MIDNIGHT CYPHER',300,282);g.fillStyle='#1c2940';g.fillRect(70,300,130,65);g.strokeStyle='#62748d';for(let j=0;j<9;j++){g.beginPath();g.moveTo(80,309+j*5);g.lineTo(190,309+j*5);g.stroke()}}
 else{g.fillStyle='#130f1b';for(let i=0;i<5;i++){g.fillRect(i*220+25,60,16,315);g.fillRect(i*220,65,220,13);g.strokeStyle='#483b46';g.lineWidth=7;g.beginPath();g.moveTo(i*220+40,90);g.lineTo(i*220+205,250);g.stroke()}for(let x=100;x<900;x+=250){g.fillStyle='#170e17';g.fillRect(x,190,120,155);gr=g.createLinearGradient(0,225,0,355);gr.addColorStop(0,'#ff6a2144');gr.addColorStop(1,'#ffc36b');g.fillStyle=gr;g.fillRect(x+8,224,104,110);g.fillStyle='#362832';for(let j=0;j<5;j++)g.fillRect(x+j*25,218,5,127)}g.strokeStyle='#68606a';g.lineWidth=16;g.beginPath();g.moveTo(75,355);g.lineTo(75,164);g.lineTo(280,164);g.lineTo(280,110);g.stroke();g.lineWidth=7;g.strokeStyle='#aea0a255';g.stroke();g.fillStyle='#ffc074';g.font='900 25px Arial';g.fillText('THE FOUNDRY',375,155)}
 gr=g.createLinearGradient(0,370,0,H);gr.addColorStop(0,a.floor);gr.addColorStop(1,id===0?'#0b1525':'#181720');g.fillStyle=gr;g.fillRect(0,372,W,H-372);g.strokeStyle=id===0?'#5dc7e025':'#a59aa421';g.lineWidth=1;for(let x=-500;x<1500;x+=90){g.beginPath();g.moveTo(480+(x-480)*.4,372);g.lineTo(x,H);g.stroke()}for(let y=385;y<H;y+=30){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}for(let i=0;i<100;i++){g.fillStyle='#bdcde815';g.fillRect(R()*W,380+R()*160,2+R()*8,1)}
 g.save();g.translate(480,435);g.scale(1,.28);g.strokeStyle=a.accent+'55';g.lineWidth=3;g.beginPath();g.arc(0,0,180,0,TAU);g.stroke();g.font='italic 900 44px Arial';g.textAlign='center';g.fillStyle=a.accent+'55';g.fillText('RING BRAWLERS',0,15);g.restore();
 if(id===0){for(let i=0;i<7;i++){g.fillStyle=['#53d8ed15','#f372b118'][i%2];g.beginPath();g.ellipse(90+i*134,399+i%3*37,55+R()*34,5+R()*8,0,0,TAU);g.fill()}}return c;
}
function drawEnvironmentFloor(){for(const s of floorScars)drawAtlas(5,7,s.x,s.y,s.size,.85);for(const p of props){ctx.save();ctx.translate(p.x,GY-8);if(!p.hp){ctx.fillStyle='#77624f';for(let j=0;j<5;j++){ctx.save();ctx.translate(j*11-23,1+j%2*4);ctx.rotate(j*.8);ctx.fillRect(-12,-4,24,8);ctx.restore()}}else{ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,7,36,8,0,0,TAU);ctx.fill();ctx.fillStyle=p.kind==='barrel'?'#4c5c67':'#80624c';ctx.strokeStyle='#171c26';ctx.lineWidth=4;ctx.fillRect(-23,-46,46,48);ctx.strokeRect(-23,-46,46,48);ctx.strokeStyle='#bba085';ctx.lineWidth=2;ctx.beginPath();if(p.kind==='barrel'){ctx.moveTo(-23,-35);ctx.lineTo(23,-35);ctx.moveTo(-23,-8);ctx.lineTo(23,-8)}else{ctx.moveTo(-20,-43);ctx.lineTo(20,0);ctx.moveTo(20,-43);ctx.lineTo(-20,0)}ctx.stroke();if(p.hp<3){ctx.strokeStyle='#080d17';ctx.beginPath();ctx.moveTo(-6,-45);ctx.lineTo(7,-30);ctx.lineTo(-4,-13);ctx.lineTo(13,0);ctx.stroke()}}ctx.restore()}}
function drawEnvironmentFX(){for(const e of envFx)drawAtlas(e.row,Math.floor(e.t/e.dur*8),e.x,e.y,e.size,1,e.face);
 if(arenaId===0&&!reduced){ctx.save();ctx.strokeStyle='#a6defb45';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<(lowQ()?35:95);i++){const x=(i*97+vclock*90)%1020-30,y=(i*61+vclock*560)%560;ctx.moveTo(x,y);ctx.lineTo(x-5,y+17)}ctx.stroke();ctx.restore()}
 if(P1)for(const f of[P1,P2])if(f.st==='sp'){const p=clamp(f.t/moveData(f).dur,0,1);for(let j=0;j<3;j++){ctx.save();ctx.strokeStyle=COL[f.ci];ctx.globalAlpha=(1-p)*.5;ctx.lineWidth=2-j*.4;ctx.beginPath();ctx.ellipse(f.x,GY-55-j*28,65+p*(230+j*40),18+p*30,-f.face*.15,Math.PI*(p+j*.5),Math.PI*(p+j*.5)+4.5);ctx.stroke();ctx.restore()}}
}
function drawDanger(){if(!dangerFX||!P1||P1.hp>28||P1.hp<=0||phase!=='fight')return;const intensity=1-P1.hp/28,pulse=reduced?.14:.12+(Math.sin(vclock*(4.5+intensity*2))*.5+.5)*.20;ctx.save();const g=ctx.createRadialGradient(480,280,155,480,280,540);g.addColorStop(0,'#c3152200');g.addColorStop(.5,'#c3152200');g.addColorStop(1,`rgba(230,20,47,${pulse+intensity*.24})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle='#ff687a';ctx.fillRect(0,0,3,H);ctx.fillRect(W-3,0,3,H);ctx.restore();text('LOW HEALTH',480,128,10,'#ff8492')}
function drawTrace(fr,x,y,face,sx,sy,angle,col,active){if(!traceFX||lowQ())return;ctx.save();ctx.globalCompositeOperation='lighter';const a=active?.44:.18;for(const dx of[-2,2])drawSprite(fr,x+dx,y,face,a,false,sx,sy,angle,col);drawSprite(fr,x,y-2,face,a,false,sx,sy,angle,col);ctx.restore()}
// Back press gets a 120 ms parry window with a 420 ms re-arm cooldown.
function updateDefense(f,o,dt){f.parryWindow=Math.max(0,(f.parryWindow||0)-dt);f.parryCooldown=Math.max(0,(f.parryCooldown||0)-dt);const dir=f.human?(held.r||0)-(held.l||0):f.ctl.dir||0;const toward=o.x>=f.x?1:-1,guard=f.human&&!!held.b,free=f.human&&turnMode,back=guard||(!free&&dir*toward<0);const eligible=f.air===0&&['idle','walk','block'].includes(f.st);if(back&&!f.backHeld&&eligible&&!f.parryCooldown){f.parryWindow=.12;f.parryCooldown=.42}if(!back||!eligible)f.parryWindow=0;f.backHeld=back;f.back=back;if(eligible)f.face=free&&dir&&!guard?dir:toward}
function tryParry(a,d,at,projectile){const eligible=d.parryWindow>0&&d.back&&d.air===0&&['idle','walk','block'].includes(d.st);if(!eligible||at.guardBreak||(at.breakMarked&&d.angle>0))return false;d.parryWindow=0;d.mt=Math.min(100,d.mt+14);d.inv=.10;d.guardFlash=.3;d.st='block';d.t=.10;d.vx=0;if(!projectile){a.st='hit';a.t=-.13;a.vx=-a.face*110;a.connected=false;a.counter=0;a.armor=0}hitstop=.075;label('PERFECT PARRY',d.x,GY-215,'#adfff1',18);spriteFX(4,d.x+d.face*28,GY-95,190,.5);ringFx(d.x,GY-90,'#adfff1',180,.35);sparks(d.x,GY-90,'#adfff1',20);addShake(.18);tone(1050,.13,'sine',.08);buzz([15,20,15]);showtimeParry(a,d);return true}

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
function pop(text,x,y,col,size=34){if(!popFX)return;pops.push({text,x:clamp(x,90,W-90),y,col,size,rot:(rand()-.5)*.5,t:0,dur:.62,seed:rand()*10});if(pops.length>5)pops.shift()}
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
  if(heavy&&(!at.rapid||at.knockdown)){impactFrame(d,x,y,col);for(let i=0;i<qn(5);i++){const an=rand()*TAU,r=120+rand()*130;bolt(x,y,x+Math.cos(an)*r,y+Math.sin(an)*r*.7,col,.22,2.6)}crowdShout()}
  else if(at.kind==='upper')bolt(x,y+46,x+a.face*22,y-112,col,.14,2,10);
  if([3,5,7,10].includes(a.combo)){ringFx(a.x,GY-90,col,200,.4,1,4);crowdFlash(4);tone(520+a.combo*40,.12,'triangle',.05);if(a.combo>=5)crowdShout()}}
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
  // arena life
  if(reduced)return;ambT-=dt;
  if(arenaId===0){nextSky-=real;if(nextSky<=0){nextSky=5+rand()*8;skyFlash=1;const x=110+rand()*740;skyBolt={pts:jagged(x,-10,x+(rand()-.5)*180,250,26),col:'#9fc4ff',w:2.6,t:0,dur:.24};noise(1.1,200,.06,.5,'lowpass',.4)}}
  else if(arenaId===1){if(ambT<=0){ambT=lowQ()?.2:.07;embers(rand()*W,GY+14+rand()*46,'#ff9c52',1,10,6)}showerT-=dt;if(showerT<=0){showerT=1.3+rand()*2.2;const x=[280,520,760][Math.floor(rand()*3)]+(rand()-.5)*40;sparks(x,112,'#ffb45c',18,Math.PI/2,1.2,260,700);flare(x,112,'#ffd9a0',46,.12)}}
  else if(ambT<=0){ambT=.5+rand()*.6;crowdFlash(1)}}
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
// Arena backdrops: parallax back wall + floor, with moving light and weather on top.
const arenaArts=new Map();
function arenaArtFor(id){const key=id+':'+lowQ();if(!arenaArts.has(key))arenaArts.set(key,makeArenaArt(id));return arenaArts.get(key)}
function drawEnvironmentBase(){const art=arenaArtFor(arenaId),px=cam.cx-480,py=cam.cy-270,S2=art.width/W,bx=-W*.05+px*.45,by=-22+py*.5,B=(x,y)=>[bx+x*1.1,by+y*1.06];
  ctx.drawImage(art,0,0,art.width,372*S2,bx,by,W*1.1,372*1.06+2);
  ctx.save();ctx.globalCompositeOperation='lighter';
  if(arenaId===0){
    let[mx,my]=B(730,95);ctx.globalAlpha=.3+.05*Math.sin(vclock*1.3);ctx.drawImage(glow('#cfd8ff'),mx-80,my-80,160,160);
    if(!reduced)for(let i=0;i<2;i++){const[sx,sy]=B(210+i*540,338),an=-Math.PI/2+Math.sin(vclock*.35+i*2.1)*.5,g=ctx.createLinearGradient(sx,sy,sx+Math.cos(an)*380,sy+Math.sin(an)*380);g.addColorStop(0,'#9fd8ff2e');g.addColorStop(1,'#9fd8ff00');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+Math.cos(an-.07)*400,sy+Math.sin(an-.07)*400);ctx.lineTo(sx+Math.cos(an+.07)*400,sy+Math.sin(an+.07)*400);ctx.fill()}
    for(let i=0,n=lowQ()?18:44;i<n;i++){const a=Math.sin(vclock*(.5+i%5*.3)+i*12.9);if(a<=0)continue;const[wx,wy]=B((i*173.3)%W,235+(i*71.7)%112);ctx.globalAlpha=a*.55;ctx.fillStyle=i%3?'#67d6f7':'#ffd497';ctx.fillRect(wx,wy,3,5)}
    const fl=reduced?.4:(Math.sin(vclock*13)+Math.sin(vclock*7.3)>1.55?.12:.42+.06*Math.sin(vclock*3)),[nx,ny]=B(300,250);ctx.globalAlpha=fl;ctx.drawImage(glow('#ff72bc'),nx-40,ny-34,390,120);
    if(skyFlash>0){ctx.globalAlpha=skyFlash*.42;ctx.fillStyle='#bcd4ff';ctx.fillRect(bx,by,W*1.1,372*1.06)}
    if(skyBolt){ctx.lineJoin='round';ctx.lineCap='round';ctx.translate(bx,by);ctx.scale(1.1,1.06);strokeBolt(skyBolt,1-skyBolt.t/skyBolt.dur)}
  }else{
    for(let i=0;i<4;i++){const[fx,fy]=B(160+i*250,280);ctx.globalAlpha=.3+.1*Math.sin(vclock*(4+i)+i*2)+.05*Math.sin(vclock*17+i);ctx.drawImage(glow('#ff7a2e'),fx-120,fy-120,240,240)}
  }
  ctx.restore();
  if(arenaId===1){ctx.save();ctx.strokeStyle='#0d0a12';ctx.lineCap='round';for(let i=0;i<3;i++){const[cx,cy]=B(230+i*265,0),len=150+i%2*55,an=reduced?0:Math.sin(vclock*.9+i*1.7)*.07,ex=cx+Math.sin(an)*len,ey=cy+Math.cos(an)*len;ctx.lineWidth=5;ctx.setLineDash([9,5]);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=5;ctx.beginPath();ctx.arc(ex,ey+12,11,-.4,Math.PI+.6);ctx.stroke()}ctx.restore()}
  // floor (wider than the screen so shake never shows an edge)
  ctx.drawImage(art,0,372*S2,art.width,(H-372)*S2,-60,372,W+120,H-372+50);
  ctx.save();
  if(arenaId===0){ctx.globalCompositeOperation='lighter';for(let i=0;i<10;i++){const x=90+i*94;ctx.fillStyle=(i%2?'#ef74c4':'#63d9fa')+'0e';ctx.fillRect(x+Math.sin(vclock+i)*4,390,12,95)}
    if(skyFlash>0){ctx.globalAlpha=skyFlash*.16;ctx.fillStyle='#bcd4ff';ctx.fillRect(-60,372,W+120,H)}
    if(!reduced){ctx.globalAlpha=1;ctx.strokeStyle='#a6defb';ctx.lineWidth=1;for(let i=0,n=lowQ()?8:20;i<n;i++){const ph=(vclock*1.3+i*.37)%1,x=(i*197.3)%W,y=386+(i*89.7)%140,r=4+ph*16;ctx.globalAlpha=(1-ph)*.34;ctx.beginPath();ctx.ellipse(x,y,r,r*.3,0,0,TAU);ctx.stroke()}}}
  else{ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.13+Math.sin(vclock*5)*.02;ctx.drawImage(glow('#ff712b'),-60,170,1080,410)}
  ctx.restore()}
function drawArenaThumbs(){document.querySelectorAll('.arena-card canvas').forEach((c,i)=>{const g=c.getContext('2d'),w=c.width,h=c.height,k=w/W;g.clearRect(0,0,w,h);g.save();g.scale(k,k);g.translate(0,-205);
    if(i!==2){const art=arenaArtFor(i);g.drawImage(art,0,0,W,H)}
    else if(scene){const S=scene;g.drawImage(S.far,0,0,W,H);S.rows.forEach(r=>g.drawImage(r.c,-80,r.y,W+160,74));g.globalCompositeOperation='lighter';g.globalAlpha=.8;g.drawImage(S.lights,0,0,W,GY);g.globalCompositeOperation='source-over';g.globalAlpha=1;[[262,'#e8e2d0'],[300,'#d9342b'],[338,'#e8e2d0']].forEach(([y,col])=>{g.strokeStyle=col;g.lineWidth=6;g.beginPath();g.moveTo(30,y);g.lineTo(930,y);g.stroke()});g.drawImage(S.ring,-S.M,0,W+2*S.M,H+S.EX)}
    g.restore();const v=g.createLinearGradient(0,0,0,h);v.addColorStop(.45,'#0b101c00');v.addColorStop(1,'#0b101ce0');g.fillStyle=v;g.fillRect(0,0,w,h)})}
// menus: settings sheet, how-to sheet, difficulty buttons, result card
function openModal(id){$(id).style.display='flex'}
document.querySelectorAll('.closeModal').forEach(b=>b.onclick=()=>{b.closest('.modal').style.display='none'});
document.querySelectorAll('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)m.style.display='none'});
$('openSettings').onclick=$('pauseSettings').onclick=()=>openModal('settings');$('openHelp').onclick=$('pauseHelp').onclick=()=>openModal('howto');
addEventListener('keydown',e=>{if(e.key!=='Escape')return;const m=[...document.querySelectorAll('.modal')].find(m=>m.style.display==='flex');if(m){m.style.display='none';e.stopImmediatePropagation();e.preventDefault()}},true);
function initDiff(){const box=$('diffSeg'),selEl=$('difficulty');selEl.value=store.get('diff','normal');if(!selEl.value)selEl.value='normal';const sync=()=>box.querySelectorAll('button').forEach(b=>b.setAttribute('aria-checked',b.dataset.v===selEl.value));[['easy','Easy'],['normal','Normal'],['hard','Hard'],['training','Training']].forEach(([v,l])=>{const b=document.createElement('button');b.textContent=l;b.dataset.v=v;b.setAttribute('role','radio');b.onclick=()=>{selEl.value=v;store.set('diff',v);sync();tone(420)};box.append(b)});sync()}
function fillResult(won){const secs=Math.round((performance.now()-stats.t0)/1000),score=(won?50:0)+(P1.wins-P2.wins)*10+Math.min(20,maxCombo*3)+Math.min(15,stats.parries*5)+Math.max(0,20-stats.taken/10),grade=score>=88?'S':score>=70?'A':score>=50?'B':score>=30?'C':'D';
  $('resultStats').textContent=`${P1.wins} – ${P2.wins} rounds · ${CH[P1.ci].name} vs ${CH[P2.ci].name} · ${ARENAS[arenaId].name}`;$('grade').textContent=grade;$('grade').dataset.g=grade;
  $('statGrid').innerHTML=[['Hits landed',totalHits],['Best combo',maxCombo],['Damage dealt',Math.round(stats.dealt)],['Damage taken',Math.round(stats.taken)],['Parries',stats.parries],['Supers landed',stats.supers],['Blocks',stats.blocks],['Time',Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0')]].map(([k,v])=>'<div><b>'+v+'</b><span>'+k+'</span></div>').join('');
  const c=$('resultArt'),g=c.getContext('2d'),w=won?P1:P2,fr=(CH[w.ci].f.win||CH[w.ci].f.idle)[0];g.clearRect(0,0,c.width,c.height);g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.6;g.drawImage(glow(COL[w.ci]),10,c.height-120,c.width-20,130);g.restore();drawSprite(fr,c.width/2,c.height-24,1,1,true,1,1,0,null,g,1.95);$('result').style.setProperty('--c',COL[w.ci])}

// ---------- main loop: fixed 120 Hz rules, drawing at whatever the screen can do (60/120/144/240 Hz) ----------
let last=performance.now(),accumulator=0,slowAcc=0;
function loop(n){const real=clamp((n-last)/1000,0,.1);last=n;if(real>0)fpsEma+=(1/real-fpsEma)*.06;
  if(quality==='auto'&&!autoLow&&phase==='fight'&&!paused){slowAcc=real>1/42?slowAcc+real:Math.max(0,slowAcc-real*.5);if(slowAcc>1.6){autoLow=true;applyQuality();renderOpts()}}
  if(!paused){slowT=Math.max(0,slowT-real);const el=real*(slowT>0?lerp(1,SLOW,clamp(slowT/.25,0,1)):1);accumulator+=el;let guard=0;
    while(accumulator>=FIXED_DT&&guard++<30){if(P1&&phase!=='menu'&&phase!=='end'){for(const f of[P1,P2]){f.prevX=f.x;f.prevAir=f.air}for(const s of shots){s.px=s.x;s.py=s.y}step(FIXED_DT)}accumulator-=FIXED_DT}
    if(guard>=30)accumulator=0;renderAlpha=accumulator/FIXED_DT;fxUpdate(el,real)}else{accumulator=0;renderAlpha=1}
  draw();if(phase==='menu')drawPreview();requestAnimationFrame(loop)}
padPrefs();initArenas();initDiff();applyQuality();renderOpts();boot();requestAnimationFrame(loop);
// Local diagnostics for smoke tests and frame inspection.
window.ringDebug={get state(){return{phase,paused,round,timer,P1,P2,shots,effects,ready,parts:parts.length,fps:fpsEma,renderScale:RS,lowQuality:lowQ(),cam,hitstop,msg}},arenas:ARENAS,setArena,atlas:()=>atlasCanvas,hit,step,updateDefense,floorDamage,resetEnvironment,get environment(){return{floorScars,props,envFx}},moves:ATK,press,held,start:(f,m)=>start(f,m)};
