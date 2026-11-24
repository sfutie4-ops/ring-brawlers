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
// sharp menu backdrop: the picked arena's own artwork
function menuArenaBg(){const a=ARENA_ART[arenaId];if(a&&a.src)$('menu').style.setProperty('--arenaimg','url("'+a.src+'")')}
function setArena(id){arenaId=id;store.set('arena',id);menuArenaBg();arenaArtKey='';resetEnvironment();document.querySelectorAll('.arena-card').forEach((b,i)=>b.setAttribute('aria-pressed',i===id));$('arenaNote').textContent=ARENAS[id].tag}
function initArenas(){const box=$('arenas');ARENAS.forEach((a,i)=>{const b=document.createElement('button');b.className='arena-card arena-'+i;b.innerHTML='<span class="arena-art"></span><span class="arena-name">'+a.name+'</span><small>'+a.tag+'</small>';b.style.setProperty('--arena-image','url("'+ARENA_ART[i].src+'")');b.onclick=()=>setArena(i);box.append(b)});setArena(arenaId);buildEffectAtlas()}
function resetEnvironment(){envFx=[];floorScars=[];envClock=0;props=[{x:145,hp:3,kind:'crate'},{x:815,hp:3,kind:arenaId===1?'barrel':'crate'}]}
function floorDamage(x,power=1){if(floorScars.length>=16)floorScars.shift();const bucket=power<1.45?1:power<2.2?2:2.6;floorScars.push({x,y:GY+6+rand()*16,power,t0:vclock,art:scarArt(bucket),k:(58+power*30)/(58+bucket*30),flip:rand()<.5?-1:1});spriteFX(0,x,GY-15,120+power*40,.9);if(ARENAS[arenaId].wet)spriteFX(1,x,GY-10,130+power*35,.65);shards(x,GY-3,ARENAS[arenaId].floor,7*power,null,TAU,180*power);for(const p of props){if(p.hp>0&&Math.abs(p.x-x)<90+power*35){p.hp=Math.max(0,p.hp-power);p.hitT=vclock;p.hitDir=Math.sign(p.x-x)||1;if(!p.hp){p.debris=makeDebris(p);if(typeof bfCrateBroken==='function')bfCrateBroken(p)}spriteFX(0,p.x,GY-35,135,.85);shards(p.x,GY-45,'#bd8b65',p.hp?7:18,null,TAU,270);if(!p.hp){label('BREAK!',p.x,GY-100,'#ffd091',13);addShake(.18)}}}}
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
function drawPropArt(p){const state=p.hp===0?2:p.hp<3?1:0,row=Number(p.kind==='barrel'),w=state===2?80:row?58:72,wet=ARENAS[arenaId].wet,dt=vclock-(p.hitT??-9),wob=dt<1?Math.sin(dt*38)*Math.exp(-dt*7)*.09*(p.hitDir||1):0;
  ctx.save();ctx.translate(p.x,GY-6);
  ctx.save();ctx.globalCompositeOperation='multiply';const sh=ctx.createRadialGradient(4,2,2,4,2,46);sh.addColorStop(0,'rgba(0,0,0,.6)');sh.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sh;ctx.scale(1.25,.24);ctx.beginPath();ctx.arc(4,8,46,0,TAU);ctx.fill();ctx.restore();
  if(wet&&state<2&&!lowQ()){ctx.save();ctx.beginPath();ctx.rect(-50,0,100,60);ctx.clip();ctx.globalAlpha=.16;ctx.scale(1,-.55);ctx.drawImage(stageProps,state*160,row*160,160,160,-w/2,-w+6,w,w);ctx.restore()}
  ctx.rotate(wob);ctx.drawImage(stageProps,state*160,row*160,160,160,-w/2,-w+6,w,w);ctx.restore()}
// ---------- floor damage: baked once per impact, blended into the floor with multiply / screen ----------
const SCAR_TINT=['#7fdcff','#ff8a3c','#ffe0a8'],AMBIENT=['#4a5fa8','#ff8a3c','#f5be58'];
// two crack variants per size and arena, made once and reused (mirrored at random): building them mid-fight cost a
// visible hitch on every heavy landing
const scarPool=new Map();
function scarArt(bucket){const key=bucket+':'+arenaId+(lowQ()?'q':'h');let pool=scarPool.get(key);if(!pool)scarPool.set(key,pool=[]);
  if(pool.length<2)pool.push(makeScar(bucket,arenaId));return pool[Math.floor(rand()*pool.length)]}
function warmScars(){for(const b of [1,2,2.6])for(let i=0;i<2;i++)warmQueue.push(()=>{const key=b+':'+arenaId+(lowQ()?'q':'h');let pool=scarPool.get(key);if(!pool)scarPool.set(key,pool=[]);if(pool.length<2)pool.push(makeScar(b,arenaId))})}
function makeScar(power,aid){const R=58+power*30,SQ=.34,w=Math.ceil(R*2.3),h=Math.ceil(R*1.1),k=lowQ()?1:2;
  const mk=()=>{const c=artCanvas(w*k,h*k),g=c.getContext('2d');g.scale(k,k);g.translate(w/2,h/2);g.lineCap='round';g.lineJoin='round';return[c,g]};
  const[dark,d]=mk(),[light,l]=mk(),[glowC,gl]=mk();
  // soft dent: darkest in the middle, fading into the floor
  d.save();d.scale(1,SQ);let r=d.createRadialGradient(0,0,1,0,0,R);r.addColorStop(0,'rgba(0,0,0,.78)');r.addColorStop(.22,'rgba(0,0,0,.5)');r.addColorStop(.55,'rgba(0,0,0,.2)');r.addColorStop(1,'rgba(0,0,0,0)');d.fillStyle=r;d.beginPath();d.arc(0,0,R,0,TAU);d.fill();d.restore();
  // crater lip catches the light on the near side
  l.save();l.scale(1,SQ);l.strokeStyle='rgba(255,246,225,.16)';l.lineWidth=3;l.beginPath();l.arc(0,0,R*.28,.2,Math.PI-.2);l.stroke();l.strokeStyle='rgba(255,246,225,.07)';l.lineWidth=6;l.beginPath();l.arc(0,0,R*.5,.35,Math.PI-.35);l.stroke();l.restore();
  // cracks: tapered branches that wander outwards, a few forks
  const cracks=[];const grow=(x,y,a,len,wd,depth)=>{const pts=[[x,y]];let L=0;while(L<len){a+=(rand()-.5)*.7;const st=5+rand()*5;x+=Math.cos(a)*st;y+=Math.sin(a)*st;L+=st;pts.push([x,y]);if(depth<2&&rand()<.13)grow(x,y,a+(rand()<.5?-1:1)*(.5+rand()*.6),(len-L)*.55,wd*.6,depth+1)}cracks.push({pts,wd})};
  const n=5+Math.round(power*2+rand()*2);for(let i=0;i<n;i++)grow(0,0,i/n*TAU+(rand()-.5)*.5,R*(.5+rand()*.45),2.6+power*.6,0);
  const stroke=(g,dy,col,scale)=>{for(const c of cracks){for(let i=1;i<c.pts.length;i++){const t=i/c.pts.length;g.strokeStyle=col;g.lineWidth=Math.max(.5,c.wd*(1-t*.85)*scale);g.beginPath();g.moveTo(c.pts[i-1][0],c.pts[i-1][1]*SQ+dy);g.lineTo(c.pts[i][0],c.pts[i][1]*SQ+dy);g.stroke()}}};
  if(!lowQ())d.filter='blur(.6px)';stroke(d,0,'rgba(0,0,0,.55)',1.6);d.filter='none';stroke(d,0,'rgba(0,0,0,.62)',.8);stroke(l,1.1,'rgba(255,240,214,.28)',.45);
  gl.shadowColor=SCAR_TINT[aid];gl.shadowBlur=8;stroke(gl,0,SCAR_TINT[aid],.9);
  // loose chips and grit
  for(let i=0;i<14+power*8;i++){const a=rand()*TAU,rr=R*(.15+rand()*.75),x=Math.cos(a)*rr,y=Math.sin(a)*rr*SQ,sz=1+rand()*2.6;d.fillStyle='rgba(0,0,0,.55)';d.beginPath();d.moveTo(x-sz,y);d.lineTo(x,y-sz*.6);d.lineTo(x+sz,y+sz*.2);d.closePath();d.fill();l.fillStyle='rgba(255,244,220,.32)';l.fillRect(x-sz*.3,y-sz*.5,sz*.7,sz*.35)}
  return{dark,light,glow:glowC,w,h}}
// ---------- crates & drums: shaded 3/4 view, three damage stages, tinted to the arena light ----------
const propArtCache=new Map();
function propArt(kind,hp,aid){const key=kind+hp+aid+(lowQ()?'l':'h');if(propArtCache.has(key))return propArtCache.get(key);const k=2,W2=80,H2=80,c=document.createElement('canvas');c.width=W2*k;c.height=H2*k;const g=c.getContext('2d');g.scale(k,k);g.translate(36,72);g.lineJoin='round';g.lineCap='round';
  let s0=kind.length*97+hp*31;const R=()=>((s0=s0*16807%2147483647)/2147483647);
  const poly=(pts,fill,stroke,lw=1.4)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}};
  const crackLine=(pts)=>{g.strokeStyle='#1c120a';g.lineWidth=1.6;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();g.strokeStyle='rgba(255,226,180,.35)';g.lineWidth=.6;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x+.8,y+.8):g.moveTo(x+.8,y+.8));g.stroke()};
  if(kind==='barrel'){
    const L=-21,Rr=21,T=-52;let gr=g.createLinearGradient(L,0,Rr,0);gr.addColorStop(0,'#262d33');gr.addColorStop(.28,'#5d6b74');gr.addColorStop(.42,'#8797a0');gr.addColorStop(.62,'#4f5c64');gr.addColorStop(1,'#1d2328');
    g.fillStyle=gr;g.beginPath();g.moveTo(L,T);g.lineTo(L,-2);g.ellipse(0,-2,Rr,6,0,Math.PI,0,true);g.lineTo(Rr,T);g.closePath();g.fill();
    for(let i=0;i<9;i++){g.fillStyle=`rgba(${120+R()*60|0},${60+R()*30|0},20,${.18+R()*.25})`;g.beginPath();g.ellipse(L+4+R()*34,T+6+R()*42,2+R()*6,1+R()*4,R()*3,0,TAU);g.fill()}
    for(const y of[T+9,-26,-9]){g.strokeStyle='#15191d';g.lineWidth=4;g.beginPath();g.ellipse(0,y,Rr,5.5,0,0,Math.PI);g.stroke();g.strokeStyle='rgba(220,232,240,.45)';g.lineWidth=1.2;g.beginPath();g.ellipse(0,y-1.6,Rr-1,5,0,.25,Math.PI-.9);g.stroke()}
    g.fillStyle='#3d474e';g.beginPath();g.ellipse(0,T,Rr,6,0,0,TAU);g.fill();g.strokeStyle='#14181b';g.lineWidth=1.6;g.stroke();g.fillStyle='#22292e';g.beginPath();g.ellipse(0,T+.5,Rr-4,4,0,0,TAU);g.fill();g.fillStyle='#8a98a0';g.beginPath();g.ellipse(9,T-.5,3,1.4,0,0,TAU);g.fill();
    g.strokeStyle='#101417';g.lineWidth=1.6;g.beginPath();g.moveTo(L,T);g.lineTo(L,-2);g.moveTo(Rr,T);g.lineTo(Rr,-2);g.stroke();
    if(hp<3){g.fillStyle='rgba(0,0,0,.45)';g.beginPath();g.ellipse(-7,-34,7,9,.3,0,TAU);g.fill();g.strokeStyle='rgba(230,240,245,.4)';g.lineWidth=1;g.beginPath();g.ellipse(-6,-34,7,9,.3,.4,1.9);g.stroke()}
    if(hp<2){g.fillStyle='rgba(0,0,0,.5)';g.beginPath();g.ellipse(8,-16,9,7,-.4,0,TAU);g.fill();g.fillStyle='#0b0d10';g.beginPath();g.moveTo(4,-20);g.lineTo(11,-23);g.lineTo(13,-14);g.lineTo(6,-12);g.closePath();g.fill();g.strokeStyle='#9aa8b0';g.lineWidth=.8;g.stroke()}
  }else{
    const F=[[-23,-44],[23,-44],[23,0],[-23,0]],TOP=[[-23,-44],[23,-44],[31,-52],[-15,-52]],SIDE=[[23,-44],[31,-52],[31,-8],[23,0]];
    let gr=g.createLinearGradient(0,-44,0,0);gr.addColorStop(0,'#b0835a');gr.addColorStop(1,'#80603f');poly(F,null);g.fillStyle=gr;g.fill();
    gr=g.createLinearGradient(-15,-52,23,-44);gr.addColorStop(0,'#d1a473');gr.addColorStop(1,'#b48a5f');poly(TOP,null);g.fillStyle=gr;g.fill();
    gr=g.createLinearGradient(23,0,31,0);gr.addColorStop(0,'#6b4c31');gr.addColorStop(1,'#4d3622');poly(SIDE,null);g.fillStyle=gr;g.fill();
    // planks and grain
    g.save();poly(F,null);g.clip();for(let i=1;i<4;i++){const y=-44+i*11;g.fillStyle='rgba(40,24,10,.55)';g.fillRect(-23,y-.8,46,1.6);g.fillStyle='rgba(255,226,180,.18)';g.fillRect(-23,y+.8,46,.8)}
    g.strokeStyle='rgba(60,36,16,.28)';g.lineWidth=.7;for(let i=0;i<14;i++){const y=-42+R()*40,x0=-22+R()*10;g.beginPath();g.moveTo(x0,y);g.bezierCurveTo(x0+12,y+R()*2-1,x0+24,y+R()*2-1,x0+30+R()*12,y+R()*1.4-.7);g.stroke()}
    for(let i=0;i<3;i++){g.fillStyle='rgba(60,36,16,.35)';g.beginPath();g.ellipse(-14+R()*28,-38+R()*32,2.4,1.1,0,0,TAU);g.fill()}g.restore();
    g.save();poly(TOP,null);g.clip();for(let i=1;i<4;i++){const t=i/4;g.strokeStyle='rgba(70,44,20,.45)';g.lineWidth=1;g.beginPath();g.moveTo(-23+46*t,-44);g.lineTo(-15+46*t,-52);g.stroke()}g.restore();
    g.save();poly(SIDE,null);g.clip();for(let i=1;i<4;i++){g.strokeStyle='rgba(20,12,4,.45)';g.lineWidth=1;g.beginPath();g.moveTo(23,-44+i*11);g.lineTo(31,-52+i*11);g.stroke()}g.restore();
    // frame boards and diagonal brace
    const board=(pts)=>{poly(pts,'#7b5636','#2a1a0d',1);g.strokeStyle='rgba(255,220,170,.28)';g.lineWidth=.8;g.beginPath();g.moveTo(pts[0][0]+.8,pts[0][1]+.8);g.lineTo(pts[1][0]-.8,pts[1][1]+.8);g.stroke()};
    board([[-23,-44],[23,-44],[23,-38],[-23,-38]]);board([[-23,-6],[23,-6],[23,0],[-23,0]]);board([[-23,-44],[-17,-44],[-17,0],[-23,0]]);board([[17,-44],[23,-44],[23,0],[17,0]]);
    if(hp>1)board([[-17,-9],[-11,-6],[17,-35],[11,-38]]);else{board([[-17,-9],[-11,-6],[0,-17],[-5,-20]]);poly([[3,-23],[8,-20],[17,-35],[11,-38]],'#7b5636','#2a1a0d',1)}
    for(const[x,y]of[[-20,-41],[20,-41],[-20,-3],[20,-3],[-20,-22],[20,-22]]){g.fillStyle='#2b2520';g.beginPath();g.arc(x,y,1.1,0,TAU);g.fill();g.fillStyle='rgba(255,255,255,.35)';g.fillRect(x-.6,y-.8,.6,.5)}
    // contact occlusion at the base
    gr=g.createLinearGradient(0,-10,0,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.4)');g.fillStyle=gr;g.fillRect(-23,-10,54,10);
    if(hp<3){crackLine([[-4,-44],[-1,-36],[-6,-28],[-2,-20]]);crackLine([[23,-30],[18,-26],[20,-19]]);g.save();g.globalCompositeOperation='destination-out';poly([[23,-44],[31,-52],[31,-46],[24,-38]],'#000');g.restore();poly([[23,-44],[26,-46],[24,-41]],'#d4a875')}
    if(hp<2){g.save();poly([[-16,-30],[16,-30],[16,-20],[-16,-20]],null);g.clip();g.fillStyle='#160e07';g.fillRect(-23,-31,46,12);gr=g.createLinearGradient(0,-30,0,-20);gr.addColorStop(0,'rgba(0,0,0,.6)');gr.addColorStop(1,'rgba(90,60,30,.25)');g.fillStyle=gr;g.fillRect(-23,-31,46,12);g.restore();
      g.fillStyle='#a77b51';g.strokeStyle='#2a1a0d';g.lineWidth=1;g.beginPath();g.moveTo(-16,-30);for(let x=-16;x<=16;x+=4)g.lineTo(x,-30+(x/4&1?3:0)+R()*2);g.lineTo(16,-30);g.closePath();g.fill();g.stroke();
      g.beginPath();g.moveTo(-16,-20);for(let x=-16;x<=16;x+=4)g.lineTo(x,-20-(x/4&1?3:0)-R()*2);g.lineTo(16,-20);g.closePath();g.fill();g.stroke();crackLine([[-12,-12],[-6,-14],[-8,-8]]);crackLine([[8,-40],[12,-34],[9,-31]])}
    poly([[-23,0],[-23,-44],[-15,-52],[31,-52],[31,-8],[23,0]],null,'#1a1109',1.6);
  }
  // arena light: tint everything, then a rim light on the top edge
  g.globalCompositeOperation='source-atop';g.fillStyle=AMBIENT[aid];g.globalAlpha=.16;g.fillRect(-40,-80,90,90);g.globalAlpha=1;g.globalCompositeOperation='source-over';
  g.strokeStyle=ARENAS[aid].accent;g.globalAlpha=.55;g.lineWidth=1.3;g.beginPath();if(kind==='barrel')g.ellipse(0,-52,20,5.6,0,Math.PI+.3,TAU-.3);else{g.moveTo(-15,-52.5);g.lineTo(31,-52.5)}g.stroke();g.globalAlpha=1;
  propArtCache.set(key,c);return c}
const PS=1.3;
function makeDebris(p){const out=[];for(let i=0;i<9;i++)out.push({x:(rand()-.5)*86,y:rand()*7,w:p.kind==='barrel'?6+rand()*10:10+rand()*16,h:p.kind==='barrel'?3+rand()*4:4+rand()*3,r:(rand()-.5)*2.4,sh:.75+rand()*.35});return out}
function drawProp(p){if(typeof stageProps!=='undefined'&&stageProps)return drawPropArt(p);const art=propArt(p.kind,Math.max(1,p.hp),arenaId),wet=ARENAS[arenaId].wet,dt=vclock-(p.hitT??-9),wob=dt<1?Math.sin(dt*38)*Math.exp(-dt*7)*.09*(p.hitDir||1):0;
  ctx.save();ctx.translate(p.x,GY-6);
  // contact shadow, multiplied into the floor
  ctx.save();ctx.globalCompositeOperation='multiply';const sh=ctx.createRadialGradient(4,2,2,4,2,46);sh.addColorStop(0,'rgba(0,0,0,.6)');sh.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sh;ctx.scale(1.25,.24);ctx.beginPath();ctx.arc(4,8,46,0,TAU);ctx.fill();ctx.restore();
  if(!p.hp){for(const d of p.debris||[]){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.r);if(p.kind==='barrel'){ctx.fillStyle=`rgb(${80*d.sh|0},${92*d.sh|0},${100*d.sh|0})`;ctx.strokeStyle='#14181b'}else{ctx.fillStyle=`rgb(${168*d.sh|0},${124*d.sh|0},${82*d.sh|0})`;ctx.strokeStyle='#2a1a0d'}ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-d.w/2,-d.h/2);ctx.lineTo(d.w/2,-d.h/2);ctx.lineTo(d.w/2+2,0);ctx.lineTo(d.w/2,d.h/2);ctx.lineTo(-d.w/2,d.h/2);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,230,190,.25)';ctx.fillRect(-d.w/2+1,-d.h/2+.6,d.w-2,.8);ctx.restore()}
    // what is left of the base
    ctx.save();ctx.beginPath();ctx.rect(-50,-15,100,17);ctx.clip();ctx.drawImage(art,-36*PS,-72*PS,80*PS,80*PS);ctx.restore();ctx.restore();return}
  if(wet&&!lowQ()){ctx.save();ctx.beginPath();ctx.rect(-50,0,100,60);ctx.clip();ctx.globalAlpha=.16;ctx.scale(1,-.55);ctx.drawImage(art,-36*PS,-72*PS,80*PS,80*PS);ctx.restore()}
  ctx.rotate(wob);ctx.drawImage(art,-36*PS,-72*PS,80*PS,80*PS);ctx.restore()}
function drawEnvironmentFloor(){
  for(const sc of floorScars){const a=sc.art,age=vclock-sc.t0,g=reduced?1:easeOut(Math.min(1,age/.14));ctx.save();ctx.translate(sc.x,sc.y);ctx.scale((.6+.4*g)*(sc.k||1)*(sc.flip||1),(.6+.4*g)*(sc.k||1));
    ctx.globalCompositeOperation='multiply';ctx.globalAlpha=.95;ctx.drawImage(a.dark,-a.w/2,-a.h/2,a.w,a.h);
    ctx.globalCompositeOperation='screen';ctx.globalAlpha=.85;ctx.drawImage(a.light,-a.w/2,-a.h/2,a.w,a.h);
    // molten foundry cracks cool down, rooftop cracks catch the neon for a moment, ring cracks flash briefly
    const hot=arenaId===1?Math.max(0,1-age/3.5):Math.max(0,1-age/.6);if(hot>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=hot*(arenaId===1?.95:.5);ctx.drawImage(a.glow,-a.w/2,-a.h/2,a.w,a.h)}
    if(ARENAS[arenaId].wet){ctx.globalCompositeOperation='screen';ctx.globalAlpha=.18;ctx.drawImage(glow(ARENAS[arenaId].accent),-a.w*.22,-a.h*.18,a.w*.44,a.h*.36)}
    ctx.restore()}
  for(const p of props)drawProp(p)}
function drawEnvironmentFX(){for(const e of envFx)drawAtlas(e.row,Math.floor(e.t/e.dur*8),e.x,e.y,e.size,1,e.face);
 if(arenaId===0&&!reduced){ctx.save();ctx.strokeStyle='#a6defb45';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<(lowQ()?35:95);i++){const x=(i*97+vclock*90)%1020-30,y=(i*61+vclock*560)%560;ctx.moveTo(x,y);ctx.lineTo(x-5,y+17)}ctx.stroke();ctx.restore()}
 if(P1)for(const f of[P1,P2])if(f.st==='sp'){const p=clamp(f.t/moveData(f).dur,0,1);for(let j=0;j<3;j++){ctx.save();ctx.strokeStyle=COL[f.ci];ctx.globalAlpha=(1-p)*.5;ctx.lineWidth=2-j*.4;ctx.beginPath();ctx.ellipse(f.x,GY-55-j*28,65+p*(230+j*40),18+p*30,-f.face*.15,Math.PI*(p+j*.5),Math.PI*(p+j*.5)+4.5);ctx.stroke();ctx.restore()}}
}
function drawDanger(){if(!dangerFX||!P1||P1.hp>MAX_HP*.28||P1.hp<=0||phase!=='fight')return;const intensity=1-P1.hp/(MAX_HP*.28),pulse=reduced?.14:.12+(Math.sin(vclock*(4.5+intensity*2))*.5+.5)*.20;ctx.save();const g=ctx.createRadialGradient(480,280,155,480,280,540);g.addColorStop(0,'#c3152200');g.addColorStop(.5,'#c3152200');g.addColorStop(1,`rgba(230,20,47,${pulse+intensity*.24})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle='#ff687a';ctx.fillRect(0,0,3,H);ctx.fillRect(W-3,0,3,H);ctx.restore();text('LOW HEALTH',480,128,10,'#ff8492')}
function drawTrace(fr,x,y,face,sx,sy,angle,col,active){if(!traceFX||lowQ())return;const c=traceSkin(fr,col),s=fr.scale||1;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=active?.44:.18;ctx.translate(x,y);ctx.scale(face*sx,sy);ctx.rotate(angle);ctx.drawImage(c,-(fr.ax+2)*s,-((fr.ay??fr.h)+2)*s,(fr.w+4)*s,(fr.h+4)*s);ctx.restore()}
// Back press gets a 120 ms parry window with a 420 ms re-arm cooldown.
function updateDefense(f,o,dt){f.parryWindow=Math.max(0,(f.parryWindow||0)-dt);f.parryCooldown=Math.max(0,(f.parryCooldown||0)-dt);const dir=f.human?(held.r||0)-(held.l||0):f.ctl.dir||0;const toward=o.x>=f.x?1:-1,back=dir*toward<0;const eligible=f.air===0&&GUARD_STATES.has(f.st);if(back&&!f.backHeld&&eligible&&!f.parryCooldown){f.parryWindow=.12;f.parryCooldown=.42}if(!back||!eligible)f.parryWindow=0;f.backHeld=back;f.back=back;if(eligible)f.face=toward}
function tryParry(a,d,at,projectile){const eligible=d.parryWindow>0&&d.back&&d.air===0&&GUARD_STATES.has(d.st);if(!eligible||at.guardBreak||(at.breakMarked&&d.angle>0))return false;d.parryWindow=0;d.mt=Math.min(100,d.mt+14);d.inv=.10;d.guardFlash=.3;d.st='block';d.t=.10;d.vx=0;if(!projectile){a.st='hit';a.t=-.13;a.vx=-a.face*110;a.connected=false;a.counter=0;a.armor=0}hitstop=.075;label('PERFECT PARRY',d.x,GY-215,'#adfff1',18);spriteFX(4,d.x+d.face*28,GY-95,190,.5);ringFx(d.x,GY-90,'#adfff1',180,.35);sparks(d.x,GY-90,'#adfff1',20);addShake(.18);tone(1050,.13,'sine',.08);buzz([15,20,15]);showtimeParry(a,d);return true}
