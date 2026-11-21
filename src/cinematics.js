const CAST_SECONDS = 2.4;
const CAST_WORLD_RATE = .22;
const RELEASE_SECONDS = 2.48;
const MOUNTAIN_HEIGHT = 365;
const REDUCED_CLIMB_SCALE = .64;
const cinematicImages = {};
const cinematicFrames = {};
const STATE_SHEETS = ['states-early','states-mid','states-late'];
const FACE_POSES = {neutral:0, halfBlink:1, blink:2, alert:3, breath:4, attack:5, recoil:6, win:7};
const STREET_COMBAT_POSES = {
  dash:5, crouch:6, jump:7, block:8, hit:9, down:10, getup:11, evade:12,
  punch:[13,12], kick:[14,8], upper:[15,6], rise:[15,6], slide:[16,6], dive:[14,7],
};
const REVISED_FIGHTERS = {
  0: {sheet:'loonie-priest', ...STREET_COMBAT_POSES,
      punch:[13,20,21], kick:[14,22], dive:[23,7], rise:[15,20], wave:[30,29], power:[17,20,25], technique:[24,20,21], charge:[26,27], win:28, super:[18,19]},
  1: {sheet:'abra-renewed', ...STREET_COMBAT_POSES,
      wave:[17,8], power:[19,18], technique:[13,5,12], charge:[8,18], super:[18,19]},
  2: {sheet:'shehyee-replacement', ...STREET_COMBAT_POSES,
      wave:[17,8], power:[19,18], technique:[17,13,12], charge:[8,18], super:[18,19]},
  4: {sheet:'smugglaz-replacement', ...STREET_COMBAT_POSES,
      wave:[17,8], power:[19,18], technique:[18,19,17], charge:[8,17], super:[8,18]},
  8: {sheet:'sinio-ink',...STREET_COMBAT_POSES,wave:[17,8],power:[19,18],
      technique:[17,12,13],charge:[8,18],super:[18,19]},
  7: {sheet:'apekz-replacement', dash:5, crouch:6, jump:8, block:10, hit:11, down:12, getup:13, evade:14,
      punch:[16,15], kick:[17,10], upper:[18,7], rise:[18,7], slide:[19,6], dive:[20,8],
      wave:[22,21], power:[24,23], technique:[26,25,22], charge:[10,23], climb:[27,28,29]},
};

async function loadCinematicArt(progress) {
  let index = 0;
  for (const [name,src] of Object.entries(CINEMATIC_ART)) {
    progress(index++);
    const im = cinematicImages[name] ||= await loadImage(src);
    const fighter=Object.keys(REVISED_FIGHTERS).find(ci=>REVISED_FIGHTERS[ci].sheet===name);
    cinematicFrames[name] = CINEMATIC_FRAMES[name]?.map(([x,y,w,h,ax,ay,scale,faceCrop,crownAnchor]) => {
      const frame = {im,x,y,w,h,ax,ay,scale,crownAnchor};
      if(faceCrop)frame.faceCrop=faceCrop;
      return frame;
    });
  }
}

function rosterFaceFrame(ci,pose) {
  return modelFaces[ci]?.[FACE_POSES[pose] ?? 0];
}

function idleFacePose(ci,time) {
  if (reduced) return 'neutral';
  const period=2.8+(ci%4)*.28;
  const cycle=(time+ci*.22)%period/period;
  if (cycle>=.32 && cycle<.51) return 'breath';
  if (cycle>=.72 && cycle<.805) {
    return cycle>=.738 && cycle<.779 ? 'blink' : 'halfBlink';
  }
  return 'neutral';
}

// Pose changes follow the actual move's hit or projectile release, including multi-hit volleys.
function attackPoseAt(time,move){
  const first=move.volley?.[0]?.at??move.hit;
  const last=move.volley?.at(-1)?.at;
  const recoil=last==null?(move.end??lerp(first,move.dur,.43)):Math.min(move.dur-.035,last+.065);
  return time<first*.42?0:time<first?1:time<recoil?2:3;
}

function redesignedBody(ci,state,time,f){
  const {redraw,frames}=CH[ci];
  const choose=indices=>frames[indices[Math.floor(time*10)%indices.length]];
  if(state==='idle')return frames[f?.land>.026?4:0];
  if(state==='walk')return choose(f?.back?[1,3,2,0]:[1,0,2,3]);
  if(state==='win')return frames[reduced||time>.55?redraw==='batas'?24:15:time>.15?3:0];
  if(state==='jump')return frames[time<.035||f?.vy>280?4:6];
  if(state==='dash')return frames[time<.032?4:time<.16?5:1];
  if(state==='block'||state==='chargeRecover')return frames[time<(state==='block'?.15:.085)?3:0];
  if(state==='crouch')return frames[4];
  if(state==='hit'||state==='stunned'||state==='frozen')return frames[12];
  if(state==='down')return frames[time<.12||f?.air>11?12:time>.72&&f?.hp>0&&(phase==='fight'||f.demo)?14:13];
  if(state==='chargeMana'||state==='chargePower')return frames[time<.13?3:redraw==='badang'?22:11];
  const contact={punch:7,kick:8,upper:9,rise:9,slide:10,dive:8,evade:5,power:11,
    wave:redraw==='badang'?21:11,technique:redraw==='badang'?23:redraw==='batas'?16:7}[state];
  const move=MOVES[ci][state];
  if(contact===undefined||!move)return frames[0];
  const stage=attackPoseAt(time,move);
  if(redraw==='badang'&&state==='kick')return frames[[0,24,25,26][stage]];
  const prep=state==='dive'?6:state==='slide'?4:redraw==='badang'&&state==='wave'?20:3;
  return frames[[0,prep,contact,['dive','evade','slide'].includes(state)?4:3][stage]];
}

function revisedFighterFrame(ci,state,time,f) {
  if(CH[ci].redraw)return redesignedBody(ci,state,time,f);
  const motion=motionFrames[ci];
  if(motion && state==='walk'){
    const count=Math.floor(time*(f?.back?7:10))%4;
    return motion[f?.back?(4-count)%4:count];
  }
  if(CH[ci].id && motion && (state==='kick'||state==='dive')){
    const move=MOVES[ci][state];
    const pose=attackPoseAt(time,move);
    return motion[4+pose];
  }
  const art=REVISED_FIGHTERS[ci];
  const frames=art && cinematicFrames[art.sheet];
  if (!frames) return null;
  if (state==='idle') {
    const pose=idleFacePose(ci,time);
    return frames[pose==='breath'?2 : pose==='halfBlink'||pose==='blink'?1 : 0];
  }
  if (state==='walk') return frames[3+Math.floor(time*8)%(ci===6?3:2)];
  if (state==='down') {
    if (f.air>=11 || time<.12) return frames[art.hit];
    return frames[f.hp>0 && (phase==='fight'||f.demo) && time>=.72 ? art.getup : art.down];
  }
  if(state==='jump'){
    if(time<.035)return frames[art.crouch];
    if(f.vy>550&&motion?.[5])return motion[5];
    if(f.vy>=30)return frames[ci===6?10:ci===7?9:art.jump];
    if(f.vy>-125)return frames[art.jump];
    return frames[art.rise[1]];
  }
  if(state==='dash')return time<.027?frames[art.crouch]:time<.15?frames[art.dash]:motion[1];
  if(state==='evade'&&motion?.[4]){
    return time<.08?frames[art.block]:time<.28?motion[4]:motion[5];
  }
  if(state==='stunned'||state==='frozen')return frames[art.hit];
  if(state==='hit')return frames[f.air<=0&&time>=.23?art.block:art.hit];
  if(state==='chargeMana'||state==='chargePower'){
    return frames[art.charge[Number(time>=.18)]];
  }
  if(state==='chargeRecover')return frames[time<.10?art.block:0];
  if(state==='win'&&motion?.[7]){
    return reduced?motion[7]:time<.15?frames[art.win??0]:motion[time<.95?6:7];
  }
  const pose=art[state];
  if (Number.isInteger(pose)) return frames[pose];
  if (state==='win') return frames[art.win??0];
  if (!Array.isArray(pose)) return null;
  const [active,windup,follow]=pose;
  const move=MOVES[ci][state];
  if (!move) return null;
  const stage=attackPoseAt(time,move);
  if(stage===0)return frames[art.block];
  if(stage===1)return frames[windup];
  if(stage===2)return frames[active];
  return frames[follow??art.block];
}

function idleExpressionFrame(ci, time) {
  const revised=revisedFighterFrame(ci,'idle',time);
  if (revised) return revised;
  const frames=cinematicFrames['idle-expressions'];
  if (!frames) return null;
  const period=2.45+(ci%4)*.32;
  const cycle=((time+ci*.21)%period)/period;
  const expressive=!reduced && cycle>.67 && cycle<.86;
  const pose=Number(expressive);
  return frames[ci*2+pose];
}

function drawIdlePortrait(ci,time,g,x,y,size) {
  const fr=rosterFaceFrame(ci,idleFacePose(ci,time));
  if (!fr) return false;
  g.drawImage(fr.im,fr.x,fr.y,fr.w,fr.h,x,y,size,size);
  return true;
}

function castTimeScale(f) {
  const cast=f?.ultimate;
  if(f?.st!=='sp'||!cast)return 1;
  const first=cast.plan.beats[0][0];
  return cast.next===0?(first+cast.intro)/CAST_SECONDS:(cast.plan.duration-first)/RELEASE_SECONDS;
}

function ultimateWorldRate(){
  const casters=[P1,P2].filter(f=>f?.st==='sp'&&f.ultimate);
  return casters.some(f=>f.ultimate.next===0)?CAST_WORLD_RATE:casters.length?.48:1;
}

function stanceFrame(f) {
  const down=f.st==='down' && f.air<11 && f.t>=.12;
  if (f.st!=='crouch' && !down) return null;
  const revised=revisedFighterFrame(f.ci,f.st,f.t,f);
  if (revised) return revised;
  const clips = cinematicFrames[STATE_SHEETS[Math.floor(f.ci/3)]];
  if (!clips) return null;
  const row = 4*(f.ci%3);
  if (f.st==='crouch') return clips[row+(f.t<.10?0:1)];
  return clips[row+(f.hp>0&&phase==='fight'&&f.t>=.72?3:2)];
}

function cinematicBodyFrame(f, acting) {
  const {redraw,frames}=CH[f.ci];
  if(redraw){
    const timing={batas:[17,18,19,24],aklas:[24,11,26,23],zaito:[21,21,22,23],badang:[22,20,23,27]}[redraw];
    const index=acting.phase==='impact'?2:acting.phase==='recover'?3:acting.amount>.55?1:0;
    return frames[timing[index]];
  }
  if(CH[f.ci].id)return completeUltimateFrame(f,acting);
  const art=REVISED_FIGHTERS[f.ci];
  const revised=art && cinematicFrames[art.sheet];
  if (revised) {
    if (acting.phase==='recover') return revised[f.ci===6?39:art.block];
    if (f.ci===6 && acting.phase==='windup' && acting.step===0 && acting.amount<.26) return revised[36];
    if (f.ci===0) return revised[acting.phase==='impact'||acting.amount>=.64?19:acting.amount>=.36?31:18];
    if (art.climb) {
      if (acting.step>0) return revised[art.power[acting.phase==='impact'?0:1]];
      if (acting.phase==='impact') return revised[art.climb[2]];
      return revised[art.climb[acting.amount>=.79?2:acting.amount>=.62?1:0]];
    }
    if (acting.phase==='impact') return revised[art.super[1]];
    if (acting.step>0 || acting.amount>=.26) return revised[art.super[0]];
    return revised[0];
  }
  const clips = cinematicFrames['cast-actions'];
  if (!clips) return null;
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
  if(f.ultimate?.visualCi===0&&f.t>=f.ultimate.intro&&acting.phase!=='recover'){
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
  if (f.ci===8 && acting.phase!=='recover') {
    pose.angle=0;
    pose.dy-=ease((acting.amount-.12)/.50)*(reduced?30:82);
  }
  return pose;
}

function advanceCrownRhymes(f,cast,plan) {
  const progress=cast.elapsed/plan.beats[0][0];
  const rhyme=progress>=.78 ? 2 : progress>=.41 ? 1 : 0;
  if (!rhyme || cast.rhyme===rhyme) return;
  cast.rhyme=rhyme;
  const col=f.ci!==cast.visualCi?'#8dd5ff':rhyme===1?'#ffb62e':'#fff2a3';
  ringFx(cast.x,GY-94,col,104+rhyme*48,.50,1.25,3);
  sfx.cast(rhyme);
}

function drawCrownVerse(s) {
  if(s?.cast.visualCi!==0||!s.cast.rhyme)return;
  const {rhyme,elapsed}=s.cast;
  const alpha=(1-ease((elapsed-1.10)/.28))*s.amount;
  if (alpha<=0) return;
  const side=s.f===P1?1:-1;
  const x=side>0?18:W-298;
  const y=170;
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.fillStyle='#170d1ae6';ctx.fillRect(x,y,280,39);
  ctx.fillStyle=s.copied?'#83d8ff':'#ffbf45';ctx.fillRect(side>0?x:x+277,y,3,39);
  dtext(rhyme===1?'DIIN SA BIGKAS':'KORONA ANG WAKAS',x+140,y+29,21,s.copied?'#eff3ff':'#fff1ad');
  ctx.restore();
}

function drawCinematicFighterFX(f,x,y,frame) {
  if (f.st!=='sp' || !f.ultimate || !cinematicFrames['cast-actions']) return;
  const acting = ultimateActingFrame(f);
  if (f.ci===0 && frame===cinematicFrames['loonie-priest']?.[19] && frame.faceCrop) {
    const [fx,fy,fw,fh]=frame.faceCrop;
    const lightX=x+f.face*(fx+fw*.60-frame.ax)*frame.scale;
    const lightY=y-(frame.ay-fy-fh*.53)*frame.scale;
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
  return f.st==='sp'&&f.ultimate?.plan.mountain&&f.ultimate.next===0&&f.t>=f.ultimate.intro;
}

function mountainBase(cast) {
  return clamp(cast.x-cast.face*7,105,855);
}

function advanceMountainKick(f,cast,plan) {
  if (cast.next>0) return;
  const p=clamp(cast.elapsed/plan.beats[0][0],0,1);
  const rise=ease((p-.055)/.565);
  const dive=clamp((p-.68)/.32,0,1);
  const center=mountainBase(cast);
  const peak=center+cast.face*61;
  const target=cast.targetX;
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
  if (!im || !f.ultimate?.plan.mountain || (f.st!=='sp' && !(phase==='ko'&&pt<.64))) return;
  const {cast}=superScreen||{};
  if(cast!==f.ultimate && f.st!=='sp')return;
  const elapsed=f.ultimate.elapsed;
  const p=elapsed/f.ultimate.plan.beats[0][0];
  const rise=ease(p/.22);
  const fade=(1-ease((elapsed-.62)/.59))*(phase==='ko'?1-pt/.64:1);
  const height=(MOUNTAIN_HEIGHT+18)*(reduced?REDUCED_CLIMB_SCALE:1);
  const width=im.width/im.height*(MOUNTAIN_HEIGHT+18);
  ctx.save();
  if(f.ultimate.visualCi!==f.ci)ctx.filter='hue-rotate(125deg)';
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
