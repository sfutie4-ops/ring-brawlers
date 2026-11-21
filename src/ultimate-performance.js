// Shared timing for the caster's body, HUD face and cut-in. Every sequence
// uses the combat plan's actual beats, including all hits of a multi-hit cast.
const ULTIMATE_ACTING = [
  {wind:['block:0','block:0','block:0'], release:['block:0'], recover:'block:0',
    windPose:[-2,1,-.03,-.032], hitPose:[3,2,.025,-.05]},        // Loonie: prayer
  {wind:['block:0','dash:0','dash:0'], release:['dash:0','punch:3'], recover:'idle:0',
    windPose:[9,0,.19,-.11], hitPose:[20,-10,.25,.08]},          // Abra: phase rush
  {wind:['idle:0','block:0','wave:2'], release:['wave:3'], recover:'block:0',
    windPose:[-9,2,-.08,-.09], hitPose:[11,-4,.08,.12]},         // Shehyee: sight the angle
  {wind:['block:0','wave:1','wave:2'], release:['wave:3'], recover:'block:0',
    windPose:[-4,0,-.11,-.04], hitPose:[12,3,.14,-.06]},         // Batas: summon and seal
  {wind:['idle:0','block:0','wave:1'], release:['punch:3','wave:3','punch:3'], recover:'dash:0',
    windPose:[-5,0,-.055,-.10], hitPose:[-15,2,-.20,-.07]},     // Smugglaz: braced recoil
  {wind:['idle:0','wave:1','wave:2'], release:['wave:2','wave:3','upper:3'], recover:'block:0',
    windPose:[3,0,.036,-.025], hitPose:[8,-12,.15,.09]},        // Aklas: sniff, then pull
  {wind:['idle:0','block:0','wave:1'], release:['upper:2','punch:3'], recover:'idle:0',
    windPose:[-11,3,-.14,-.09], hitPose:[14,4,.20,-.065]},      // Zaito: raise, slam
  {wind:['idle:0','upper:1','jump:0'], release:['kick:3','punch:3','upper:3'], recover:'block:0',
    windPose:[0,-4,-.025,.07], hitPose:[9,-5,.08,.16]},          // Apekz: climb, dive kick
  {wind:['idle:0','block:0','upper:1'], release:['wave:3'], recover:'block:0',
    windPose:[-12,2,-.15,-.09], hitPose:[9,-12,-.12,.13]},       // Sinio: lean back and laugh
];

const completeActing={windPose:[-7,2,-.11,-.08],hitPose:[11,-3,.10,.06]};

function ultimateActingFrame(f,elapsed=f.ultimate?.elapsed??f.t) {
  const cast=f.ultimate,plan=cast?.plan??ULTIMATE_PLANS[f.ci];
  const beats=plan.beats, next=cast?.next??0, style=ULTIMATE_ACTING[f.ci]??completeActing;
  const last=next-1;
  const since=last>=0 ? elapsed-beats[last][0] : Infinity;
  if(last>=0 && since<.20) {
    return {phase:'impact',step:last,amount:1-ease(since/.22),style};
  }
  if(next>=beats.length) {
    return {phase:'recover',step:last,amount:1-ease((elapsed-beats[last][0]-.2)/.32),style};
  }
  const from=last<0?0:beats[last][0];
  const amount=clamp((elapsed-from)/(beats[next][0]-from),0,1);
  return {phase:'windup',step:next,amount,style};
}

function ritualCastFrame(f, {phase,step,amount}) {
  if (f.ci===0 && phase!=='recover') return ritualFrames[phase==='impact'||amount>.48 ? 1 : 0];
  if (f.ci===5 && phase==='windup' && step===0) return ritualFrames[amount>.36 ? 3 : 2];
  return null;
}

function ultimateBodyFrame(f) {
  const acting=ultimateActingFrame(f);
  const animated=cinematicBodyFrame(f,acting);
  if (animated) return animated;
  const ritual=ritualCastFrame(f,acting);
  if (ritual) return ritual;
  const {phase,style,step,amount}=acting;
  const clip=phase==='windup' ? style.wind[Math.min(2,Math.floor(amount*3))] :
    phase==='impact' ? style.release[step] : amount>.15 ? style.recover : 'idle:0';
  const [action,index]=clip.split(':');
  const body=CH[f.ci].f, frames=body[action]||body.idle;
  return frames[Math.min(Number(index),frames.length-1)];
}

function ultimateBodyMotion(f) {
  const {phase,style,step,amount}=ultimateActingFrame(f);
  const isWindup=phase==='windup';
  const factor=(isWindup?ease(amount):amount)*(reduced?.55:1);
  const [x,y,tilt,stretch]=isWindup?style.windPose:style.hitPose;
  const variation=f.ci===5 && step%2===1?-1:1;
  return cinematicBodyMotion(f,{phase,amount,step},
    {dx:x*f.face*factor,dy:y*factor,angle:tilt*factor*variation,sx:1-stretch*factor*.61,sy:1+stretch*factor});
}

function ultimateFaceImage(f) {
  if(!f.ultimate)return null;
  const finishing=phase==='ko'&&f.st==='win'&&f.ultimate.next>0&&pt<.19;
  if(f.st!=='sp'&&!finishing)return null;
  const acting=ultimateActingFrame(f);
  if(acting.phase==='recover')return null;
  return rosterFaceFrame(f.ci,acting.phase==='impact'||acting.amount>.54?'attack':'alert');
}

function drawExpressionCell(atlas,ci,x,y,w,h,crop=.10) {
  if(!atlas)return false;
  if(atlas.faceCrop){
    const [fx,fy,fw,fh]=atlas.faceCrop;
    ctx.drawImage(atlas.im,atlas.x+fx,atlas.y+fy,fw,fh,x,y,w,h);
    return true;
  }
  const cell=atlas.width/3, row=atlas.height/3;
  ctx.drawImage(atlas,(ci%3+crop)*cell,(Math.floor(ci/3)+crop*.61)*row,
    cell*(1-crop*2),row*(1-crop*1.22),x,y,w,h);
  return true;
}

function drawUltimateCutIn(s) {
  if(!s || reduced || !s.f)return;
  const {f,face,look}=s;
  const performance=ultimateActingFrame(f);
  const impact=performance.phase==='impact';
  const initial=performance.phase==='windup' && performance.step===0;
  if(!initial && !impact)return;
  const initialProgress=performance.amount;
  const early=ease(initialProgress/.11)*(1-ease((initialProgress-.23)/.20));
  const charged=ease((initialProgress-.52)/.22)*(1-ease((initialProgress-.91)/.09));
  const envelope=initial?Math.max(early,charged) :
    ease(s.since/.045)*(1-ease((s.since-.09)/.14));
  if(envelope<.02)return;
  const expression=ultimateFaceImage(f);
  if(!expression)return;
  const edge=f===P1 ? 0 : W;
  const side=f===P1 ? 1 : -1;
  const width=(impact?345:283)+envelope*25;
  ctx.save();
  ctx.translate(edge,0);ctx.scale(side,1);
  ctx.globalCompositeOperation='source-over';
  ctx.globalAlpha=envelope*(impact?.32:.25);
  ctx.fillStyle=look.ink;
  screenPolygon([[0,151],[width*.93,151],[width*.66,460],[0,486]]);ctx.fill();
  ctx.save();
  screenPolygon([[0,151],[width*.93,151],[width*.66,460],[0,486]]);ctx.clip();
  ctx.globalAlpha=envelope*(impact?.44:.31);
  if(face!==side){ctx.translate(width,0);ctx.scale(-1,1)}
  drawExpressionCell(expression,f.ci,-13,150,width,width,0);
  ctx.restore();
  ctx.strokeStyle=look.light;ctx.lineWidth=impact?4:2;
  ctx.globalAlpha=envelope*.48;ctx.beginPath();
  ctx.moveTo(width*.93,151);ctx.lineTo(width*.66,460);ctx.stroke();
  ctx.restore();
}
