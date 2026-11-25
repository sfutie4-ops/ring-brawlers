// ---------- light and air (build.py puts this file into game.js) ----------

// ---------- dynamic lights ----------
// Hits, parries, supers, fireballs and fighters charging up give off light. It pools on the floor under them (on the
// wet rooftop it also streaks towards the camera like a reflection), it brightens the side of a fighter that faces
// it, and a strong light close to a fighter throws a second, longer shadow away from itself. Short lights live a
// fraction of a second; a fireball or a charging fighter is a light for as long as it lasts.
let lights=[];const frameLights=[];
function addLight(x,y,col,r,i,dur){if(lowQ()&&i<.6)return;lights.push({x,y,col,r,i,t:0,dur});if(lights.length>10)lights.shift()}
function updateLights(dt){if(!lights.length)return;for(const l of lights)l.t+=dt;lights=lights.filter(l=>l.t<l.dur)}
// collect this frame's lights as {x,y,col,r,k} (k: strength 0-1); called once per drawn frame, before anything uses them
function gatherLights(){const out=frameLights;out.length=0;if(reduced||!P1)return out;
  for(const l of lights){const a=1-l.t/l.dur;out.push({x:l.x,y:l.y,col:l.col,r:l.r,k:l.i*a*a})}
  for(const s of shots)if(s.path!=='papaya'&&s.visual!=='gold')out.push({x:s.x,y:s.y,col:s.color,r:s.at.rapid?150:230,k:s.at.rapid?.4:.7,shot:true});
  if(phase!=='antic')for(const f of [P1,P2]){const charging=f.st==='chargeMana'||f.st==='chargePower';
    if(charging||f.st==='sp')out.push({x:rxOf(f),y:GY-raOf(f)-95,col:COL[f.ci],r:charging?220:270,k:(charging?.45:.65)+.12*Math.sin(vclock*14),who:f})}
  return out}
// light pools on the floor (fireballs draw their own)
function drawLightPools(){if(!frameLights.length)return;const wet=ARENAS[arenaId].wet&&!lowQ();ctx.save();ctx.globalCompositeOperation='lighter';
  for(const l of frameLights){if(l.shot)continue;const h=Math.max(0,GY-l.y),a=l.k*clamp(1-h/(l.r*1.3),0,1);if(a<.03)continue;const s=l.r*(.75+h/420);
    ctx.globalAlpha=Math.min(.7,a*.5);ctx.drawImage(glow(l.col),l.x-s,GY+2-s*.17,s*2,s*.34);
    if(wet){ctx.globalAlpha=Math.min(.4,a*.26);ctx.drawImage(glow(l.col),l.x-s*.16,GY-4,s*.32,s*.55+h*.4)}}
  ctx.restore()}
// a fighter catches the light of hits, fireballs and the other fighter's aura on the side facing it (two lights at most)
function drawFighterLights(f,fr,X,Y,sx,sy,angle){if(!frameLights.length||lowQ())return;const cy=Y-95*sy;let n=0;
  for(const l of frameLights){if(l.who===f)continue;const dx=l.x-X,dy=l.y-cy,d=Math.sqrt(dx*dx+dy*dy);if(d>=l.r)continue;const q=1-d/l.r,k=l.k*q*q;if(k<.04)continue;
    ctx.save();ctx.globalCompositeOperation='lighter';drawSoft(fr,X+Math.sign(dx)*3,Y,f.face,Math.min(.55,k*.6),sx,sy,angle,l.col);ctx.restore();if(++n>=2)break}}
// a strong light near a fighter throws a second shadow along the floor, away from the light (two at most)
function drawLightShadows(f,fr,X,sx,sy,ra){if(!frameLights.length||lowQ())return;let n=0;
  for(const l of frameLights){if(l.who===f||l.k<.15)continue;const dx=X-l.x,ad=Math.abs(dx);if(ad>=l.r)continue;const a=l.k*(1-ad/l.r)*clamp(1-ra/200,0,1)*.3;if(a<.02)continue;
    const c=shadowSkin(fr),s=fr.scale||1,skew=clamp(dx/Math.max(30,GY-l.y+20),-2.4,2.4);
    ctx.save();ctx.translate(X,GY+3);ctx.transform(1,0,skew,1,0,0);ctx.scale(f.face*sx,-sy*.14);ctx.globalAlpha=a;ctx.imageSmoothingEnabled=true;
    ctx.drawImage(c,-fr.ax*s,-(fr.ay??fr.h)*s,fr.w*s,fr.h*s);ctx.restore();if(++n>=2)break}}

// ---------- atmosphere: the air in each arena ----------
// Rooftop: rain falling past the camera and splashing on the wet floor. Foundry: embers drifting up from the molten
// floor. Championship: spotlight beams sweeping slowly over dust in the air. Every arena: a low haze over the floor.
// It is steady ambience (nothing pops up), skipped with reduced motion and thinned out on low quality.
const atmo={rain:[],splash:[],motes:[],mist:[],arena:-1,beams:null};
function atmoView(){const z=cam.z||1,hw=W/2/z,hh=H/2/z;return [cam.cx-hw-30,cam.cy-hh-60,cam.cx+hw+30,cam.cy+hh+20]}
function atmoReset(){atmo.rain.length=atmo.splash.length=atmo.motes.length=atmo.mist.length=0;atmo.arena=arenaId;const [x0,,x1]=atmoView(),q=lowQ();
  if(arenaId===0)for(let i=0;i<(q?40:100);i++)atmo.rain.push(newDrop(rand()));
  if(arenaId===1)for(let i=0;i<(q?14:34);i++)atmo.motes.push(newEmber(true));
  if(arenaId===2)for(let i=0;i<(q?18:44);i++)atmo.motes.push({x:lerp(x0,x1,rand()),y:120+rand()*330,vx:(rand()-.5)*8,vy:(rand()-.5)*6,ph:rand()*TAU,s:1.6+rand()*2.2});
  for(let i=0;i<(q?3:6);i++)atmo.mist.push({x:lerp(x0,x1,rand()),y:GY-12+rand()*46,w:220+rand()*200,v:(rand()<.5?-1:1)*(6+rand()*10),ph:rand()*TAU})}
// a raindrop at a random height of the view (fresh: at the top), landing somewhere on the floor's depth
function newDrop(fresh){const [x0,y0,x1]=atmoView();return {x:lerp(x0,x1+120,rand()),y:fresh===true?y0-rand()*60:lerp(y0,GY,fresh),v:900+rand()*400,len:12+rand()*14,floor:GY-14+rand()*58}}
function newEmber(spread){const [x0,,x1]=atmoView(),life=2.6+rand()*2.8;return {x:lerp(x0,x1,rand()),y:spread?150+rand()*330:GY+20+rand()*30,vx:(rand()-.5)*14,vy:-(18+rand()*34),l:spread?life*rand():life,max:life,ph:rand()*TAU,s:1.4+rand()*2.2}}
function atmosphereUpdate(dt){if(reduced){if(atmo.arena!==-2){atmo.rain.length=atmo.splash.length=atmo.motes.length=atmo.mist.length=0;atmo.arena=-2}return}
  if(atmo.arena!==arenaId)atmoReset();const [x0,,x1]=atmoView();
  for(const d of atmo.rain){d.y+=d.v*dt;d.x-=d.v*.12*dt;if(d.y>=d.floor){if(atmo.splash.length<34)atmo.splash.push({x:d.x,y:d.floor,t:0,s:.7+rand()*.6});Object.assign(d,newDrop(true))}
    else if(d.x<x0-40)d.x+=x1-x0+80}
  for(const s of atmo.splash)s.t+=dt;if(atmo.splash.length)atmo.splash=atmo.splash.filter(s=>s.t<.3);
  if(arenaId===1)for(let i=0;i<atmo.motes.length;i++){const m=atmo.motes[i];m.l-=dt;m.x+=(m.vx+Math.sin(vclock*1.3+m.ph)*10)*dt;m.y+=m.vy*dt;if(m.l<=0||m.y<40)atmo.motes[i]=newEmber(false)}
  if(arenaId===2)for(const m of atmo.motes){m.vx+=(rand()-.5)*14*dt;m.vy+=(rand()-.5)*14*dt;m.vx*=1-dt*.4;m.vy*=1-dt*.4;m.x+=m.vx*dt;m.y+=m.vy*dt;
    if(m.x<x0)m.x=x1;if(m.x>x1)m.x=x0;if(m.y<110)m.vy+=6*dt;if(m.y>GY-10)m.vy-=6*dt}
  for(const m of atmo.mist){m.x+=m.v*dt;if(m.x<x0-m.w)m.x=x1+m.w*.5;if(m.x>x1+m.w)m.x=x0-m.w*.5}}
// soft spotlight cone (white), made once: wide at the bottom, fading towards the floor
function beamTexture(){if(atmo.beams)return atmo.beams;const c=artCanvas(256,512),g=c.getContext('2d');g.filter='blur(10px)';g.fillStyle='#ffffff';
  g.beginPath();g.moveTo(112,0);g.lineTo(144,0);g.lineTo(236,512);g.lineTo(20,512);g.closePath();g.fill();g.filter='none';
  g.globalCompositeOperation='destination-in';const v=g.createLinearGradient(0,0,0,512);v.addColorStop(0,'rgba(0,0,0,1)');v.addColorStop(.55,'rgba(0,0,0,.45)');v.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=v;g.fillRect(0,0,256,512);
  const tint=col=>{const t=artCanvas(256,512),tg=t.getContext('2d');tg.drawImage(c,0,0);tg.globalCompositeOperation='source-in';tg.fillStyle=col;tg.fillRect(0,0,256,512);return t};
  return atmo.beams={warm:tint('#ffe2a8'),cool:tint('#a9cbff')}}
// behind the fighters: beams, dust, embers, haze and rain splashes (world space)
function drawAtmosphereBack(){if(reduced||atmo.arena!==arenaId)return;const L=LIGHTS[arenaId]||LIGHTS[0];ctx.save();ctx.globalCompositeOperation='lighter';
  if(arenaId===2&&!lowQ()){const b=beamTexture();[[170,'warm',.0],[480,'cool',1.7],[790,'warm',3.4]].forEach(([x,k,ph],i)=>{const an=Math.sin(vclock*.32+ph)*.2+(i-1)*.12;
    ctx.save();ctx.translate(x,-40);ctx.rotate(an);ctx.globalAlpha=.13+.035*Math.sin(vclock*.9+ph);ctx.drawImage(b[k],-160,0,320,640);ctx.restore()})}
  if(arenaId===2){const g=glow('#fff6e0');for(const m of atmo.motes){const a=.28+.3*Math.sin(vclock*2+m.ph);if(a<=0)continue;ctx.globalAlpha=a;ctx.drawImage(g,m.x-m.s*2,m.y-m.s*2,m.s*4,m.s*4)}}
  if(arenaId===1){const g=glow('#ff903b');for(const m of atmo.motes){const f=Math.min(1,m.l/.6,(m.max-m.l)/.5),a=f*(.55+.45*Math.sin(vclock*9+m.ph));if(a<=0)continue;ctx.globalAlpha=a;const r=m.s*3;ctx.drawImage(g,m.x-r,m.y-r,r*2,r*2)}}
  if(!lowQ()){const g=glow(L.amb);for(const m of atmo.mist){ctx.globalAlpha=.045+.02*Math.sin(vclock*.5+m.ph);ctx.drawImage(g,m.x-m.w/2,m.y-m.w*.09,m.w,m.w*.18)}}
  ctx.restore();
  if(atmo.splash.length){ctx.save();ctx.strokeStyle='rgba(200,225,255,.42)';ctx.lineWidth=1;ctx.beginPath();for(const s of atmo.splash){const k=s.t/.3,r=(3+k*11)*s.s;ctx.moveTo(s.x+r,s.y);ctx.ellipse(s.x,s.y,r,r*.28,0,0,TAU);
      if(k<.5){const h=(1-k*2)*7*s.s;ctx.moveTo(s.x-2,s.y-1);ctx.lineTo(s.x-4,s.y-h);ctx.moveTo(s.x+2,s.y-1);ctx.lineTo(s.x+4,s.y-h)}}
    ctx.globalAlpha=.7;ctx.stroke();ctx.restore()}}
// in front of the fighters: the rain itself
function drawAtmosphereFront(){if(reduced||atmo.arena!==arenaId||!atmo.rain.length)return;ctx.save();ctx.strokeStyle='rgba(185,212,255,.3)';ctx.lineWidth=1.1;ctx.lineCap='round';ctx.beginPath();
  for(const d of atmo.rain){ctx.moveTo(d.x,d.y);ctx.lineTo(d.x+d.len*.12,d.y-d.len)}ctx.stroke();ctx.restore()}
