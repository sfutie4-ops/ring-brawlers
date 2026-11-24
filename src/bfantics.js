// ---------- Story antics: every gag on screen has a cause the player can see ----------
// Nothing pops up at random. Each beat below is started by something that just happened in the fight
// and carries a caption that says why it appeared:
//   overlay  a comic sticker rises from the fighter who caused it, with a caption (REBUTTAL!, MULTIS!, WHIFF!…)
//   crowd    spectators pop up over the railing and shout at a big moment
//   back     the stage amp yawns when nobody attacks (dead air)
//   crew     a stagehand walks in to sweep up a smashed crate, then the debris is gone
// Story captions also explain the cutaways (the sock cutaway, the cat attack, Aklas grabbing the camera).
const bfImg=new Map();
function bfImage(id){let i=bfImg.get(id);if(!i){i=new Image();i.src=BF_ANTICS.clips[id].src;bfImg.set(id,i)}return i}
// event → which clip, which layer behaviour, and the caption that explains it. Clips whose art is cut off are left
// out by build.py, and pickFree() skips them, so each list also names a clip that is in the game
const BF_BEATS={
  parry:{overlay:['rebuttal_boomerang','rebuttal_receipt'],title:'REBUTTAL!',sub:f=>bfName(f)+' turned the bar around',col:'#29c8ff',crowd:['point_to_friend'],shout:['TINURO!','BALIK!']},
  combo3:{overlay:['multis_domino'],title:'MULTIS!',sub:f=>bfName(f)+' chains 3 hits',col:'#ffd23f'},
  combo5:{crowd:['silent_gasp','crowd_side_eye','sabay_iling','tawa_tiklop'],shout:['GRABE!','5 HITS?!','SHEESH!']},
  heavy:{crowd:['sabay_iling','phone_drop_save','hoodie_hide','tawa_tiklop'],shout:['OOF!','SAKIT!','OHHH!','AWIT!']},
  ultimate:{crowd:['napaupo'],shout:['ANO YON?!','PATAY!']},
  whiff:{overlay:['stumble_tiles'],title:'WHIFF!',sub:f=>bfName(f)+' hit nothing but air',col:'#ff8f96'},
  deadair:{overlay:['dead_air_moth'],title:'DEAD AIR…',sub:()=>'nobody is attacking',col:'#c9bfe6',back:['amp_yawn','speaker_sneeze']},
  last10:{overlay:['buzzer_button'],title:'LAST 10 SECONDS!',sub:()=>'finish it',col:'#ff5a4e'},
  timeup:{overlay:['oras_clock'],title:'TIME!',sub:()=>'the clock ran out',col:'#ffd23f'},
  draw:{overlay:['tie_scale'],title:'DRAW',sub:()=>'same HP on both sides',col:'#fff3d6'},
  win:{crowd:['wave_pocket','one_person_clap','napaupo','tawa_tiklop'],shout:['WOOO!','PANALO!','AYOS!']}
};
const bfName=f=>f&&CH[f.ci]?CH[f.ci].name:'';
const BF_FLOOR=402;
let bfActive=[],bfLast={},bfT=0,bfOverAt=0,bfCrowdSide=0,bfIdle=0,bfOvertime=false,bfPrev={},bfWhiffs={},bfCrew=null,bfCrewQueue=[];
function bfReset(){bfActive=[];bfLast={};bfT=0;bfOverAt=0;bfIdle=0;bfOvertime=false;bfPrev={};bfWhiffs={};bfCrew=null;bfCrewQueue=[]}
const bfDur=c=>c.ms.reduce((a,b)=>a+b,0)/1000;
const bfBusy=()=>reduced||!P1||cameraPrank||sockCutaway||catPause||phase==='antic';
function pickFree(ids){const ok=ids.filter(id=>BF_ANTICS.clips[id]&&bfT-(bfLast[id]??-1e9)>=Math.min(BF_ANTICS.clips[id].cd,10));return ok.length?ok[Math.random()*ok.length|0]:null}
// start a beat; who = the fighter that caused it (sticker rises from them)
function bfBeat(key,who){const b=BF_BEATS[key];if(!b||bfBusy())return false;let any=false;
  if(b.overlay&&!bfActive.some(a=>a.kind==='overlay')&&bfT>=bfOverAt){const id=pickFree(b.overlay);if(id){bfLast[id]=bfT;bfImage(id);const c=BF_ANTICS.clips[id];
    bfActive.push({kind:'overlay',id,c,t0:bfT,life:Math.max(1.5,bfDur(c)+.9),who,title:b.title,sub:b.sub?b.sub(who):'',col:b.col});bfOverAt=bfT+1.8;any=true}}
  if(b.crowd&&!bfActive.some(a=>a.kind==='crowd')){const id=pickFree(b.crowd);if(id){bfLast[id]=bfT;bfImage(id);const c=BF_ANTICS.clips[id];
    bfActive.push({kind:'crowd',id,c,t0:bfT,life:bfDur(c)+1.3,side:who?(who.x<480?1:0):(bfCrowdSide^=1),shout:b.shout[Math.random()*b.shout.length|0]});any=true}}
  if(b.back&&!bfActive.some(a=>a.kind==='back')){const id=pickFree(b.back);if(id){bfLast[id]=bfT;bfImage(id);const c=BF_ANTICS.clips[id];
    const x=Math.abs(P1.x-P2.x)>260?(P1.x+P2.x)/2:(P1.x+P2.x)/2<480?700:260;
    bfActive.push({kind:'back',id,c,t0:bfT,life:3.6,x,face:x<480?1:-1});any=true}}
  return any}
// engine hooks ------------------------------------------------------------------------------------
function bfEvent(name,who){ // names from completeEvent and the story layer
  const map={counter_success:'parry',combo_three:'combo3',round_win:'win',judges_reveal:'draw',time_up:'timeup'};
  if(map[name])return bfBeat(map[name],who||null);return false}
function bfHit(a,d,at,dmg,blocking){if(blocking||at.assist||!P1)return;bfWhiffs[a===P1?1:2]=0;
  if(at.ultimate){bfBeat('ultimate',a);return}
  if(a.combo===3){bfBeat('combo3',a);return}
  if(a.combo===5){bfBeat('combo5',a);return}
  if(dmg>=13&&Math.random()<.6)bfBeat('heavy',a)}
function bfParry(def){bfBeat('parry',def)}
// a crate or barrel was smashed: a stagehand comes to sweep it up a little later
function bfCrateBroken(p){if(!reduced&&BF_ANTICS.clips.sweep_confetti)bfCrewQueue.push({prop:p,at:bfT+2.6})}   // the sweep clip is left out while its art is cut off
function bfStep(dt){bfT+=dt;bfActive=bfActive.filter(a=>bfT-a.t0<a.life);
  if(!P1||reduced)return;
  stepCrew(dt);
  if(phase!=='fight'||bfBusy())return;
  // dead air: both fighters keep their distance and nobody swings for 3.5 s
  const calm=[P1,P2].every(f=>['idle','walk','block','crouch'].includes(f.st)&&f.air===0)&&Math.abs(P1.x-P2.x)>170;
  bfIdle=calm?bfIdle+dt:Math.min(bfIdle,0);if(bfIdle>3.5){bfIdle=-9;bfBeat('deadair',null)}
  if(!bfOvertime&&difficulty!=='training'&&timer<=10&&timer>0){bfOvertime=true;bfBeat('last10',null)}
  // whiff: two big swings in a row that hit nothing
  for(const [k,f] of [[1,P1],[2,P2]]){const prev=bfPrev[k];
    if(prev&&ATK[prev]&&f.st!==prev&&!f.connected&&['kick','upper','power','sp','rise','dive'].includes(prev)){bfWhiffs[k]=(bfWhiffs[k]||0)+1;if(bfWhiffs[k]>=2){bfWhiffs[k]=0;bfBeat('whiff',f)}}
    bfPrev[k]=f.st}}
// stagehand: walks in from the nearest edge, sweeps the debris, the debris is gone, walks out
const CREW_SPEED=150;
function stepCrew(dt){
  // the stagehand waits until both fighters are clear of the wreck before walking in
  if(!bfCrew&&bfCrewQueue.length&&bfT>=bfCrewQueue[0].at&&phase==='fight'&&!bfBusy()&&[P1,P2].every(f=>Math.abs(f.x-bfCrewQueue[0].prop.x)>190)){const q=bfCrewQueue.shift();if(props.includes(q.prop)&&!q.prop.hp){
    const from=q.prop.x<480?-60:W+60;bfCrew={prop:q.prop,x:from,from,state:'in',t:0,id:'sweep_confetti',t0:bfT};bfImage('sweep_confetti')}}
  const c=bfCrew;if(!c)return;c.t+=dt;
  const target=c.prop.x+(c.from<0?-34:34);
  if(c.state==='in'){c.x+=Math.sign(target-c.x)*CREW_SPEED*dt;if(Math.abs(target-c.x)<6){c.state='sweep';c.t=0}}
  else if(c.state==='sweep'){if(c.t>2){const i=props.indexOf(c.prop);if(i>=0)props.splice(i,1);c.state='out';c.t=0}}
  else{c.x+=Math.sign(c.from-c.x)*CREW_SPEED*dt;if(Math.abs(c.from-c.x)<8)bfCrew=null}}
function bfFrameAt(c,t,loop){let e=t*1000;const o=loop?c.order:[0,1,2,3],total=o.reduce((x,i)=>x+c.ms[i],0);if(loop)e%=total;else if(e>=total)return c.frames.length-1;
  for(const i of o){if(e<c.ms[i])return i;e-=c.ms[i]}return o[o.length-1]}
function bfBlitClip(id,frame,x,y,h,face=1,alpha=1){const img=bfImage(id);if(!img.complete||!img.naturalWidth||alpha<=0)return;const c=BF_ANTICS.clips[id],[sx,sy,sw,sh,px,py]=c.frames[frame],s=h/sh;
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.scale(face*s,s);ctx.drawImage(img,sx,sy,sw,sh,-px,-py,sw,sh);ctx.restore()}
// speech bubble in the street style
function shoutBubble(text,x,y,size=15,col='#0b0712'){ctx.save();ctx.font=`${size}px ${DISP}`;const w=ctx.measureText(text).width+18,h=size+12;
  ctx.fillStyle='#fffdf4';ctx.strokeStyle='#0b0712';ctx.lineWidth=2.5;ctx.beginPath();ctx.roundRect(x-w/2,y-h,w,h,7);ctx.moveTo(x-6,y);ctx.lineTo(x+2,y+9);ctx.lineTo(x+7,y);ctx.fill();ctx.stroke();
  ctx.fillStyle='#fffdf4';ctx.fillRect(x-5,y-2.5,11,4);ctx.fillStyle=col;ctx.textAlign='center';ctx.fillText(text,x,y-7);ctx.restore()}
// world space, after the stands and before the fighters
function drawBfBack(){if(!P1||reduced||cameraPrank)return;
  for(const a of bfActive){const age=bfT-a.t0,c=a.c;
    if(a.kind==='back'){const fade=clamp(Math.min(age/.35,(a.life-age)/.5),0,1);ctx.save();ctx.globalAlpha=.3*fade;ctx.fillStyle='#05040c';ctx.beginPath();ctx.ellipse(a.x,BF_FLOOR,30,5.5,0,0,TAU);ctx.fill();ctx.restore();
      bfBlitClip(a.id,bfFrameAt(c,age,true),a.x,BF_FLOOR+2,78,a.face,fade);if(age>.5&&age<2.6)shoutBubble('*YAWN*',a.x,BF_FLOOR-74,12,'#5b4b8a')}
    else if(a.kind==='crowd'){const rise=reduced?1:easeOut(clamp(age/.28,0,1)),drop=ease(clamp((age-(a.life-.35))/.35,0,1)),up=rise*(1-drop),bob=Math.sin(clamp(age/.28,0,1)*Math.PI)*8;
      // keep the crowd inside the camera view (the ring zooms in when the fighters are close)
      const sxp=a.side?(isTouch?690:770):(isTouch?270:190),x=cam.cx+(sxp-W/2)/cam.z,y=372+(1-up)*125-bob;
      ctx.save();ctx.beginPath();ctx.rect(-200,0,W+400,374);ctx.clip();bfBlitClip(a.id,bfFrameAt(c,age,false),x,y,118,a.side?-1:1,clamp(up*1.5,0,1));ctx.restore();
      if(age>.25&&age<a.life-.3)shoutBubble(a.shout,x+(a.side?-30:30),y-104,16)}}
  if(bfCrew){const c=bfCrew,clip=BF_ANTICS.clips[c.id],face=c.state==='out'?(c.from<0?-1:1):(c.from<0?1:-1);
    ctx.save();ctx.globalAlpha=.32;ctx.fillStyle='#05040c';ctx.beginPath();ctx.ellipse(c.x,GY-2,34,7,0,0,TAU);ctx.fill();ctx.restore();
    const walkBob=c.state==='sweep'?0:Math.abs(Math.sin(bfT*9))*3;
    bfBlitClip(c.id,bfFrameAt(clip,bfT-c.t0,true),c.x,GY-walkBob,124,face,1);
    if(c.state==='sweep'&&c.t<1.6)shoutBubble('Linis muna!',c.x,GY-120,13)}}
// screen space, after the vignette and before the HUD
function drawBfOverlay(){if(!P1||reduced||cameraPrank||sockCutaway||phase==='antic')return;
  for(const a of bfActive){if(a.kind!=='overlay')continue;const age=bfT-a.t0,k=clamp(age/.22,0,1),out=1-ease(clamp((age-(a.life-.3))/.3,0,1));
    // the sticker rises out of the fighter who caused it, then settles above their head
    let sx=480,sy=168;if(a.who){const [hx,hy]=toScreen(a.who.x,GY-a.who.air-200);sx=clamp(hx,110,850);sy=clamp(hy,150,260)}
    const rise=easeOut(k),pop=1+.18*Math.sin(k*Math.PI),y=lerp(sy+60,sy,rise)-age*6;
    ctx.save();ctx.translate(sx,y);ctx.rotate((sx<480?-1:1)*.05);ctx.scale(pop*(.6+.4*rise),pop*(.6+.4*rise));ctx.globalAlpha=out;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=out*.22;ctx.drawImage(glow(a.col),-60,-70,120,120);ctx.restore();
    bfBlitClip(a.id,bfFrameAt(a.c,age,false),0,22,84,1,1);
    dtext(a.title,0,46,22,a.col);if(a.sub)text(a.sub,0,62,10,'#f4efe6');ctx.restore()}}
// ---------- story captions for cutaways ----------
let storyCap=null,cutT=-1e9;
// a quick dip to black when the camera cuts between the ring and the stands
function cutTransition(){if(!reduced)cutT=performance.now()}
function setStoryCaption(title,sub,dur=3.2){storyCap={title,sub,t0:performance.now(),dur}}
// the dip-to-black part of a cut, drawn over the finished frame
function drawCutDip(){const ca=1-(performance.now()-cutT)/240;if(ca>0){ctx.save();ctx.setTransform(RS,0,0,RS,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle=`rgba(5,4,12,${ca.toFixed(3)})`;ctx.fillRect(0,0,W,H);ctx.restore()}}
function drawStoryCaption(){drawCutDip();if(!storyCap)return;
  const age=(performance.now()-storyCap.t0)/1000;if(age>storyCap.dur){storyCap=null;return}
  // cutaways have no HUD, so the caption sits top-left; during the fight it hangs centred under the timer
  const hud=!sockCutaway&&!cameraPrank,k=reduced?1:easeOut(clamp(age/.35,0,1)),out=clamp((storyCap.dur-age)/.35,0,1);
  ctx.save();ctx.globalAlpha=out;
  ctx.font=`${hud?22:26}px ${DISP}`;const w1=ctx.measureText(storyCap.title).width;ctx.font='700 12px Arial,sans-serif';const w2=ctx.measureText(storyCap.sub).width;const w=Math.max(w1,w2)+46,h=hud?50:58;
  const x0=hud?480-w/2:14,y0=hud?96:44;
  if(hud){ctx.translate(480,y0+h/2);ctx.scale(lerp(.6,1,k),lerp(.6,1,k));ctx.translate(-480,-(y0+h/2))}else ctx.translate(lerp(-420,0,k),0);
  ctx.fillStyle='#0b0712f0';para(x0,y0,w,h,10);ctx.fill();ctx.fillStyle='#ffd23f';para(x0,y0,7,h,10);ctx.fill();
  ctx.fillStyle='#ff2aa0';ctx.fillRect(x0+16,y0+h-4,Math.min(w-30,140)*k,3);
  ctx.textAlign='left';ctx.font=`${hud?22:26}px ${DISP}`;ctx.fillStyle='#ffd23f';ctx.fillText(storyCap.title,x0+20,y0+(hud?25:30));
  ctx.font='700 12px Arial,sans-serif';ctx.fillStyle='#f4efe6';ctx.fillText(storyCap.sub,x0+20,y0+(hud?41:48));ctx.restore()}
