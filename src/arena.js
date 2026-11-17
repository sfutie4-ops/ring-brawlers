// Arena expansion: deterministic vector art, baked FX frames, environmental reactions.
const ARENAS=[
 {name:'Neon Rooftop',tag:'RAIN / CITY LIGHTS',accent:'#52ddff',floor:'#16263a',wet:true},
 {name:'Foundry District',tag:'SMOKE / MOLTEN LIGHT',accent:'#ff9c52',floor:'#302b30',wet:false},
 {name:'Championship',tag:'CROWD / SPOTLIGHTS',accent:'#f5be58',floor:'#8b7758',wet:false}
];
let arenaId=clamp(store.get('arena',0)|0,0,2),shakeLevel=store.get('shake',1),dangerFX=store.get('danger',true),traceFX=store.get('trace',true);
const arenaImages=[];
let arenaArtKey='',envFx=[],floorScars=[],props=[],envClock=0,atlasCanvas=null;
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
function initArenas(){const box=$('arenas');ARENAS.forEach((a,i)=>{const b=document.createElement('button');b.className='arena-card arena-'+i;b.innerHTML='<span class="arena-art"></span><span class="arena-name">'+a.name+'</span><small>'+a.tag+'</small>';b.style.setProperty('--arena-image','url("'+ARENA_ART[i].src+'")');b.onclick=()=>setArena(i);box.append(b)});setArena(arenaId);buildEffectAtlas()}
function resetEnvironment(){envFx=[];floorScars=[];envClock=0;props=[{x:145,hp:3,kind:'crate'},{x:815,hp:3,kind:arenaId===1?'barrel':'crate'}]}
function floorDamage(x,power=1){if(floorScars.length>=22)floorScars.shift();floorScars.push({x,y:GY+5+rand()*18,size:65+power*40});spriteFX(0,x,GY-15,120+power*40,.9);if(ARENAS[arenaId].wet)spriteFX(1,x,GY-10,130+power*35,.65);shards(x,GY-3,ARENAS[arenaId].floor,7*power,null,TAU,180*power);for(const p of props){if(p.hp>0&&Math.abs(p.x-x)<90+power*35){p.hp=Math.max(0,p.hp-power);spriteFX(0,p.x,GY-35,135,.85);shards(p.x,GY-45,'#bd8b65',p.hp?7:18,null,TAU,270);if(!p.hp){label('BREAK!',p.x,GY-100,'#ffd091',13);addShake(.18)}}}}
function environmentHit(a,d,at){spriteFX(3,d.x-a.face*18,GY-d.air-90,at.kind==='sp'?210:at.kind==='upper'?135:90,.28,a.face);if(at.kind==='sp'||at.kind==='upper')floorDamage(d.x,at.kind==='sp'?2:1)}
function environmentStart(f,move){if(move==='sp'){spriteFX(2,f.x,GY-90,330,.9,f.face);spriteFX(2,f.x,GY-5,440,1.05,-f.face);spriteFX(0,f.x,GY-10,200,1.1);if(ARENAS[arenaId].wet)spriteFX(1,f.x,GY-8,240,.8);if(!reduced){cam.focus=f;cam.focusT=.38;cam.punch+=.04}}
 if(move==='dash'){spriteFX(0,f.x,GY-8,100,.55);if(ARENAS[arenaId].wet)spriteFX(1,f.x,GY-8,110,.5)}}
function environmentUpdate(dt){envClock+=dt;for(const e of envFx)e.t+=dt;envFx=envFx.filter(e=>e.t<e.dur);if(!P1||phase!=='fight')return;
 for(const f of[P1,P2]){f.envStep=(f.envStep||0)-dt;if(f.air===0&&Math.abs(f.vx)>70&&f.envStep<=0){f.envStep=lowQ()?.22:.13;if(ARENAS[arenaId].wet)spriteFX(1,f.x,GY,65,.45);else if(arenaId===1)spriteFX(0,f.x,GY-7,55,.6)}if(f.st==='down'&&f.air===0&&f.t>.30&&!f.floorThud){f.floorThud=true;floorDamage(f.x,1)}if(f.st!=='down')f.floorThud=false}
 if(arenaId===1&&envClock>.24){envClock=0;spriteFX(0,75,GY-90,160,2.1);spriteFX(0,885,GY-85,180,2.4)}}
// Generated image backgrounds are the actual stage artwork, including the floor.
// Only transient lighting, weather and gameplay damage are drawn on top.
async function loadArenaArt(onProgress){for(let i=0;i<ARENA_ART.length;i++){onProgress(i);if(!arenaImages[i])arenaImages[i]=await loadImage(ARENA_ART[i].src)}}
function drawEnvironmentBase(){const art=arenaImages[arenaId];if(!art)return;ctx.drawImage(art,-20,-12,W+40,H+24);
 if(arenaId===1&&!reduced){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.035+Math.sin(vclock*6)*.012;for(const x of[200,700])ctx.drawImage(glow('#ff903b'),x-115,230,230,210);ctx.restore()}
 if(arenaId===2){ctx.save();ctx.globalCompositeOperation='lighter';for(const f of flashes){if(f.t<0)continue;const a=1-f.t/f.dur,r=12+a*15;ctx.globalAlpha=a*.7;ctx.drawImage(glow('#dfeeff'),f.x-r,260+f.y*.18-r,r*2,r*2)}ctx.restore()}
}
function drawEnvironmentFloor(){for(const s of floorScars)drawAtlas(5,7,s.x,s.y,s.size,.85);for(const p of props){ctx.save();ctx.translate(p.x,GY-8);if(!p.hp){ctx.fillStyle='#77624f';for(let j=0;j<5;j++){ctx.save();ctx.translate(j*11-23,1+j%2*4);ctx.rotate(j*.8);ctx.fillRect(-12,-4,24,8);ctx.restore()}}else{ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,7,36,8,0,0,TAU);ctx.fill();ctx.fillStyle=p.kind==='barrel'?'#4c5c67':'#80624c';ctx.strokeStyle='#171c26';ctx.lineWidth=4;ctx.fillRect(-23,-46,46,48);ctx.strokeRect(-23,-46,46,48);ctx.strokeStyle='#bba085';ctx.lineWidth=2;ctx.beginPath();if(p.kind==='barrel'){ctx.moveTo(-23,-35);ctx.lineTo(23,-35);ctx.moveTo(-23,-8);ctx.lineTo(23,-8)}else{ctx.moveTo(-20,-43);ctx.lineTo(20,0);ctx.moveTo(20,-43);ctx.lineTo(-20,0)}ctx.stroke();if(p.hp<3){ctx.strokeStyle='#080d17';ctx.beginPath();ctx.moveTo(-6,-45);ctx.lineTo(7,-30);ctx.lineTo(-4,-13);ctx.lineTo(13,0);ctx.stroke()}}ctx.restore()}}
function drawEnvironmentFX(){for(const e of envFx)drawAtlas(e.row,Math.floor(e.t/e.dur*8),e.x,e.y,e.size,1,e.face);
 if(arenaId===0&&!reduced){ctx.save();ctx.strokeStyle='#a6defb45';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<(lowQ()?35:95);i++){const x=(i*97+vclock*90)%1020-30,y=(i*61+vclock*560)%560;ctx.moveTo(x,y);ctx.lineTo(x-5,y+17)}ctx.stroke();ctx.restore()}
 if(P1)for(const f of[P1,P2])if(f.st==='sp'){const p=clamp(f.t/moveData(f).dur,0,1);for(let j=0;j<3;j++){ctx.save();ctx.strokeStyle=COL[f.ci];ctx.globalAlpha=(1-p)*.5;ctx.lineWidth=2-j*.4;ctx.beginPath();ctx.ellipse(f.x,GY-55-j*28,65+p*(230+j*40),18+p*30,-f.face*.15,Math.PI*(p+j*.5),Math.PI*(p+j*.5)+4.5);ctx.stroke();ctx.restore()}}
}
function drawDanger(){if(!dangerFX||!P1||P1.hp>28||P1.hp<=0||phase!=='fight')return;const intensity=1-P1.hp/28,pulse=reduced?.14:.12+(Math.sin(vclock*(4.5+intensity*2))*.5+.5)*.20;ctx.save();const g=ctx.createRadialGradient(480,280,155,480,280,540);g.addColorStop(0,'#c3152200');g.addColorStop(.5,'#c3152200');g.addColorStop(1,`rgba(230,20,47,${pulse+intensity*.24})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle='#ff687a';ctx.fillRect(0,0,3,H);ctx.fillRect(W-3,0,3,H);ctx.restore();text('LOW HEALTH',480,128,10,'#ff8492')}
function drawTrace(fr,x,y,face,sx,sy,angle,col,active){if(!traceFX||lowQ())return;ctx.save();ctx.globalCompositeOperation='lighter';const a=active?.44:.18;for(const dx of[-2,2])drawSprite(fr,x+dx,y,face,a,false,sx,sy,angle,col);drawSprite(fr,x,y-2,face,a,false,sx,sy,angle,col);ctx.restore()}
// Back press gets a 120 ms parry window with a 420 ms re-arm cooldown.
function updateDefense(f,o,dt){f.parryWindow=Math.max(0,(f.parryWindow||0)-dt);f.parryCooldown=Math.max(0,(f.parryCooldown||0)-dt);const dir=f.human?(held.r||0)-(held.l||0):f.ctl.dir||0;const toward=o.x>=f.x?1:-1,back=dir*toward<0;const eligible=f.air===0&&GUARD_STATES.has(f.st);if(back&&!f.backHeld&&eligible&&!f.parryCooldown){f.parryWindow=.12;f.parryCooldown=.42}if(!back||!eligible)f.parryWindow=0;f.backHeld=back;f.back=back;if(eligible)f.face=toward}
function tryParry(a,d,at,projectile){const eligible=d.parryWindow>0&&d.back&&d.air===0&&GUARD_STATES.has(d.st);if(!eligible||at.guardBreak||(at.breakMarked&&d.angle>0))return false;d.parryWindow=0;d.mt=Math.min(100,d.mt+14);d.inv=.10;d.guardFlash=.3;d.st='block';d.t=.10;d.vx=0;if(!projectile){a.st='hit';a.t=-.13;a.vx=-a.face*110;a.connected=false;a.counter=0;a.armor=0}hitstop=.075;label('PERFECT PARRY',d.x,GY-215,'#adfff1',18);spriteFX(4,d.x+d.face*28,GY-95,190,.5);ringFx(d.x,GY-90,'#adfff1',180,.35);sparks(d.x,GY-90,'#adfff1',20);addShake(.18);tone(1050,.13,'sine',.08);buzz([15,20,15]);showtimeParry(a,d);return true}
