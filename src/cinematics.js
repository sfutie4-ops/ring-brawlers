const CAST_SECONDS = 2.4;
const CAST_WORLD_RATE = .22;
const MOUNTAIN_HEIGHT = 365;
const REDUCED_CLIMB_SCALE = .64;
const cinematicImages = {};
const cinematicFrames = {};
const STATE_SHEETS = ['states-early','states-mid','states-late'];

async function loadCinematicArt(progress) {
  let index = 0;
  for (const [name,src] of Object.entries(CINEMATIC_ART)) {
    progress(index++);
    const im = cinematicImages[name] ||= await loadImage(src);
    cinematicFrames[name] = CINEMATIC_FRAMES[name]?.map(([x,y,w,h,ax,ay,scale]) =>
      ({im,x,y,w,h,ax,ay,scale}));
  }
}

function castTimeScale(f) {
  if (f?.st!=='sp' || f.ultimate?.next!==0) return 1;
  return ULTIMATE_PLANS[f.ci].beats[0][0]/CAST_SECONDS;
}

function stanceFrame(f) {
  const clips = cinematicFrames[STATE_SHEETS[Math.floor(f.ci/3)]];
  if (!clips) return null;
  const row = 4*(f.ci%3);
  if (f.st==='crouch') return clips[row+(f.t<.10?0:1)];
  if (f.st==='down' && f.air<11 && f.t>=.12) return clips[row+(f.hp>0&&phase==='fight'&&f.t>=.72?3:2)];
  return null;
}

function cinematicBodyFrame(f, acting) {
  const clips = cinematicFrames['cast-actions'];
  if (!clips) return null;
  if (f.ci===0 && acting.phase!=='recover') {
    return clips[acting.phase==='impact'||acting.amount>=.64 ? 2 : acting.amount>=.26 ? 1 : 0];
  }
  if (f.ci===5 && acting.phase==='windup' && acting.step===0) {
    return clips[acting.amount>=.58 ? 5 : acting.amount>=.27 ? 4 : 3];
  }
  if (f.ci===7 && acting.step===0) {
    if (acting.phase==='impact') return clips[8];
    if (acting.phase==='windup') return clips[acting.amount>=.79 ? 8 : acting.amount>=.62 ? 7 : 6];
  }
  return null;
}

function cinematicBodyMotion(f, acting, pose) {
  if (f.ci===0 && acting.phase!=='recover') {
    const lift = acting.phase==='windup' ? ease((acting.amount-.16)/.57) : acting.amount;
    const breath = reduced ? 0 : Math.sin(vclock*5.2)*4;
    pose.dy -= lift*((reduced?60:104)+breath);
  }
  if (f.ci===5 && acting.phase==='windup' && acting.step===0 && acting.amount>=.58 && !reduced) {
    pose.angle += Math.sin(vclock*11)*.065;
    pose.dx += Math.sin(vclock*13)*4;
  }
  if (f.ci===7 && acting.step===0) {
    pose.dx = pose.dy = pose.angle = 0;
  }
  return pose;
}

function advanceCrownRhymes(f,cast,plan) {
  const progress=f.t/plan.beats[0][0];
  const rhyme=progress>=.78 ? 2 : progress>=.41 ? 1 : 0;
  if (!rhyme || cast.rhyme===rhyme) return;
  cast.rhyme=rhyme;
  const col=rhyme===1?'#ffb62e':'#fff2a3';
  ringFx(cast.x,GY-94,col,104+rhyme*48,.50,1.25,3);
  sfx.cast(rhyme);
}

function drawCrownVerse(s) {
  if (s?.f.ci!==0 || !s.cast.rhyme) return;
  const {rhyme,elapsed}=s.cast;
  const alpha=(1-ease((elapsed-1.10)/.28))*s.amount;
  if (alpha<=0) return;
  const side=s.f===P1?1:-1;
  const x=side>0?18:W-298;
  const y=170;
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.fillStyle='#170d1ae6';ctx.fillRect(x,y,280,39);
  ctx.fillStyle='#ffbf45';ctx.fillRect(side>0?x:x+277,y,3,39);
  dtext(rhyme===1?'DIIN SA BIGKAS':'KORONA ANG WAKAS',x+140,y+29,21,'#fff1ad');
  ctx.restore();
}

function drawCinematicFighterFX(f,x,y,frame) {
  if (f.st!=='sp' || !f.ultimate || !cinematicFrames['cast-actions']) return;
  const acting = ultimateActingFrame(f);
  if (f.ci===0 && frame===cinematicFrames['cast-actions'][2]) {
    const lightX=x+f.face*(frame.w*.61-frame.ax)*frame.scale;
    const lightY=y-(frame.ay-frame.h*.17)*frame.scale;
    ctx.save();
    ctx.globalCompositeOperation='screen';
    ctx.globalAlpha=reduced?.45:.65;
    ctx.drawImage(glow('#ffbe2b'),lightX-51,lightY-45,102,90);
    ctx.strokeStyle='#fff2a3';
    ctx.lineWidth=1.8;
    ctx.beginPath();ctx.moveTo(lightX-12,lightY);ctx.lineTo(lightX+12,lightY);ctx.stroke();
    ctx.restore();
  }
  if (f.ci===5 && acting.phase==='windup' && acting.step===0 && acting.amount>.29 && !reduced) {
    const after=ease((acting.amount-.52)/.20);
    const bx=x+f.face*37, by=y-113;
    ctx.save();
    ctx.globalCompositeOperation='screen';
    for (let n=0;n<11;n++) {
      const drift=(n/11+vclock*.85)%1;
      const xx=bx+f.face*(1-drift)*(14+screenHash(n,61)*36);
      const yy=by-Math.sin(drift*Math.PI)*(12+screenHash(n,62)*22);
      ctx.globalAlpha=Math.sin(drift*Math.PI)*(.8-after*.45);
      ctx.fillStyle=n%3===0?'#d9a2ff':'#c5ff77';
      ctx.beginPath();ctx.arc(xx,yy,1.5+screenHash(n,64)*2.7,0,TAU);ctx.fill();
    }
    ctx.restore();
  }
}

function isMountainClimbing(f) {
  return f.ci===7 && f.st==='sp' && f.ultimate?.next===0;
}

function mountainBase(cast) {
  return clamp(cast.x-cast.face*7,105,855);
}

function advanceMountainKick(f,cast,plan) {
  if (cast.next>0) return;
  const p=clamp(f.t/plan.beats[0][0],0,1);
  const rise=ease((p-.055)/.565);
  const dive=clamp((p-.68)/.32,0,1);
  const center=mountainBase(cast);
  const peak=center+cast.face*61;
  const target=clamp(cast.x+cast.face*plan.aim,65,895);
  // Each section ends at the start of the next, even when the mountain faces left.
  const firstLedge=center-cast.face*46;
  const crest=rise<.22 ? lerp(cast.x,firstLedge,ease(rise/.22)) :
    lerp(firstLedge,peak,(rise-.22)/.78);
  const jump=30*Math.sin(Math.PI*dive)*(1-dive);
  f.x=f.root?f.x:lerp(crest,clamp(target-cast.face*55,65,895),ease(dive));
  f.air=Math.max(0,MOUNTAIN_HEIGHT*rise*(1-dive**1.68)+jump);
  f.vy=0;
}

function mountainCameraY() {
  if (reduced || phase!=='fight') return null;
  const climber=[P1,P2].find(f=>f&&isMountainClimbing(f));
  return climber ? Math.min(H-H/(2*cam.z),GY-raOf(climber)-122) : null;
}

function drawMountainSky() {
  if (cam.cy>H/2-5) return;
  const sky=ctx.createLinearGradient(0,-670,0,77);
  sky.addColorStop(0,'#060c22');
  sky.addColorStop(.74,'#1a2860');
  sky.addColorStop(.88,'#151b35');
  sky.addColorStop(1,'#151b3500');
  ctx.fillStyle=sky;ctx.fillRect(-300,-670,W+600,747);
  ctx.globalCompositeOperation='screen';
  ctx.globalAlpha=.42;
  ctx.drawImage(glow('#5279fd'),315,-520,590,590);
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='source-over';
}

function drawMountain(f) {
  const im=cinematicImages['mountain-climb'];
  if (!im || f.ci!==7 || !f.ultimate || (f.st!=='sp' && !(phase==='ko'&&pt<.64))) return;
  const {cast}=superScreen||{};
  if(cast!==f.ultimate && f.st!=='sp')return;
  const elapsed=f.ultimate.elapsed;
  const p=elapsed/ULTIMATE_PLANS[7].beats[0][0];
  const rise=ease(p/.22);
  const fade=(1-ease((elapsed-.62)/.59))*(phase==='ko'?1-pt/.64:1);
  const height=(MOUNTAIN_HEIGHT+18)*(reduced?REDUCED_CLIMB_SCALE:1);
  const width=im.width/im.height*(MOUNTAIN_HEIGHT+18);
  ctx.save();
  ctx.globalAlpha=rise*fade;
  ctx.translate(mountainBase(f.ultimate),GY+6+(1-rise)*83);
  ctx.scale(f.ultimate.face,1);
  ctx.drawImage(im,-width*.5,-height,width,height);
  ctx.restore();
}

function drawCinematicTile(name,index,x,y,width,height,face,alpha,angle=0,baseline=.5) {
  const fr=cinematicFrames[name]?.[index];
  if (!fr || alpha<=0) return;
  ctx.save();
  ctx.translate(x,y);ctx.scale(face,1);ctx.rotate(angle);
  ctx.globalAlpha*=alpha;
  ctx.drawImage(fr.im,fr.x,fr.y,fr.w,fr.h,-width/2,-height*baseline,width,height);
  ctx.restore();
}
