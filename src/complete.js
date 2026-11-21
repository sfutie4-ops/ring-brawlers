const completeMoves = {
  dello:{
    passive:'Rebuttal King counters an incoming hit.',
    upper:{counter:true}, wave:[[.24,.34],[7,6],'straight',500],
    super:{title:'Red Horse Rebuttal',short:'Red Horse',beats:[[.67,28,200,-1,105]],
      signature:'Take a sip, then cast a recolored version of the opponent’s ultimate.'},
    technique:{name:'Last Word Snap',cost:24,reach:144,dmg:13,kb:155},
    fx:{upper:'rebuttal_king',wave:'off_the_dome',sp:'tondo_turnaround',technique:'last_word_snap'},
    comboFx:'last_word_snap'
  },
  tipsy_d:{
    passive:'Quick Rebuttal counters an incoming hit.',
    upper:{counter:true},wave:[[.24,.32,.40],[4.8,4.8,5]],
    super:{title:'Golden Bar Break',short:'Golden Break',duration:1.93,style:'gold',beats:[[.86,33,960,-1,100]],
      projectile:680,signature:'Transform in golden light and launch one large energy ball.'},
    technique:{name:'Syllable Skid',cost:24,reach:150,dmg:12,kb:140},
    fx:{upper:'quick_rebuttal',wave:'three_part_bar',technique:'syllable_skid'},
    comboFx:'three_beat_aftershock'
  },
  blkd:{
    passive:'Blueprint Bars marks. Angle Break spends the mark and breaks guard.',
    upper:{breakMarked:true,consumeMarked:true},wave:[[.24],13],
    waveOptions:{mark:'angle',slow:.65},
    super:{title:'Great Wall of Bars',short:'Great Wall',duration:1.79,style:'wall',width:240,beats:[[1.06,33,245,100,107]],
      breakMarked:true,consumeMarked:true,floor:1.65,
      signature:'Two Great Wall sections close on the marked spot. Blueprint Bars lets the walls break a guard.'},
    technique:{name:'Grid Lock',cost:25,reach:147,dmg:10,kb:110,status:{root:1.1}},
    fx:{upper:'angle_break',wave:'blueprint_bars',technique:'grid_lock'},
    comboFx:'structural_collapse'
  },
  badang:{
    passive:'Sneaky Manyak Hands breaks guard up close.',
    upper:{dur:.51,hit:.16,end:.29,reach:125,dmg:12,kb:190,lunge:430,guardBreak:true,grounded:true},
    wave:[[.24],18,'papaya',365],
    super:{title:'Giant Papaya Smash',short:'Papaya Smash',duration:1.66,style:'papaya',width:315,beats:[[.91,36,260,105,130]],
      guardBreak:true,floor:2.2,signature:'A giant hand slams an oversized papaya down at the marked spot and breaks guard.'},
    technique:{name:'Pressure Landing',cost:26,reach:140,dmg:14,kb:205,guardBreak:true},
    fx:{technique:'pressure_landing'}
  },
  target:{
    passive:'Lock-On Bar marks. Pressure Step spends the mark and breaks guard.',
    upper:{lunge:475,reach:157,grounded:true,breakMarked:true,consumeMarked:true},
    wave:[[.24],12,'straight',570],waveOptions:{mark:'angle'},
    super:{title:'Twenty-Point Barrage',short:'20-Point Barrage',duration:1.9,style:'target',
      beats:Array.from({length:8},(_,i)=>[.70+i*.092,i===7?9:3,960,128,124]),
      signature:'A red sight marks the spot, twenty dots acquire it, and an arcade blaster fires eight bursts.'},
    technique:{name:'Sightline Snap',cost:25,reach:175,dmg:11,kb:135,mark:'angle'},
    fx:{upper:'pressure_step',wave:'lock_on_bar',technique:'sightline_snap'},
    comboFx:'bullseye_overload'
  }
};

const featured=createFeaturedArt(COMPLETE_ART.scenes,COMPLETE_ART.vfx,COMPLETE_ART.sources);
const ringAntics=createRingAntics(COMPLETE_ART.antics,'',COMPLETE_ART.anticImages);
const standTexture=new Image();
standTexture.src=COMPLETE_ART.standsImage;
const stands=createBackgroundStands(CH,standTexture,COMPLETE_ART.stands,(ci,pose,index)=>({
  frame:sceneBody(ci,pose,pose==='walk'?index/10:index*.09),height:standingHeight(ci)
}),drawBackstageSprite);
let standTime=0;
let sockCutaway=false,sockCutawayPlayed=false;
const SOCK_RETURN=10.3;
const SOCK_CUT_END=14.5;

function stepSockCutaway(dt){
  if(phase!=='fight'||reduced||!stands.laneFor('socks'))return false;
  if(!sockCutaway){
    if(sockCutawayPlayed||standTime<SOCK_RETURN||sockCat||cameraPrank||superScreen)return false;
    sockCutaway=sockCutawayPlayed=true;
    standTime=SOCK_RETURN;
    clearInput();
  }
  standTime=Math.min(SOCK_CUT_END,standTime+dt);
  if(standTime>=SOCK_CUT_END){
    sockCutaway=false;
    clearInput();
  }
  return true;
}
let cameraPrank=null,cameraPrankAt=Infinity,lensTilt=0,lensTiltLeft=0;
const CAMERA_PRANK_DURATION=7.6;
const CAMERA_PRANK_RETREAT=6.55;
const CAMERA_PRANK_LAUGH=4.68;
const CAMERA_PRANK_CONTACT=2.43;
const backstageArt={};
const signatureArt={};

function drawBackstageSprite(g,sheet,index,x,y,height,face=1){
  const frame=backstageArt[sheet]?.[index];
  if(!frame)return false;
  drawSprite(frame,x,y,face,1,false,height,height,0,null,g);
  if(frame.crownAnchor&&g===ctx){
    const [cx,cy]=crownPosition(frame,x,y,face,height,height);
    drawLoonieCrown(cx,cy,face,0,height*.27);
  }
  return true;
}


function drawSignatureTile(style,index,x,y,height,face,alpha){
  const frame=signatureArt[style][index];
  const fit=height/(frame.h*frame.scale);
  drawSprite(frame,x,y,face,alpha,false,fit,fit);
}

function signatureBodyFrame(style,acting){
  const poses=signatureArt[style];
  if(!poses||!['gold','target'].includes(style))return null;
  if(acting.phase==='recover')return poses[3];
  if(acting.phase==='impact')return poses[style==='target'?1+acting.step%2:2];
  return poses[acting.amount<.37?0:1];
}

function drawGoldBall(x,y,radius,time,hue=0){
  ctx.save();
  if(hue)ctx.filter=`hue-rotate(${hue}deg)`;
  const ball=ctx.createRadialGradient(x-radius*.18,y-radius*.18,radius*.06,x,y,radius);
  ball.addColorStop(0,'#fffef7');ball.addColorStop(.38,'#fff7a6');
  ball.addColorStop(.63,'#ffbc37df');ball.addColorStop(.83,'#ff9c6085');ball.addColorStop(1,'#ff950000');
  ctx.fillStyle=ball;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  ctx.strokeStyle='#fff7bb';ctx.lineWidth=2;
  for(let i=0;i<3;i++){
    ctx.beginPath();ctx.ellipse(x,y,radius*.82,radius*(.32+.14*i),time*3+i,0,TAU);ctx.stroke();
  }
  ctx.restore();
}

function drawGoldShots(){
  for(const shot of shots){
    if(shot.visual!=='gold')continue;
    const x=shot.px===undefined?shot.x:lerp(shot.px,shot.x,renderAlpha);
    const y=shot.py===undefined?shot.y:lerp(shot.py,shot.y,renderAlpha);
    drawGoldBall(x,y,shot.radius,shot.t,shot.hue);
  }
}

function drawSignatureUltimate(f,cast,plan,alpha){
  const t=cast.elapsed,first=plan.beats[0][0],x=cast.targetX;
  ctx.save();
  ctx.globalAlpha*=alpha;
  switch(plan.style){
    case 'papaya':{
      const fall=ease((t-.28)/(first-.28));
      const frame=t<.5?0:t<first?1:t<first+.2?2:3;
      const landing=GY+13;
      drawSignatureTile('papaya',frame,x+cast.face*lerp(-79,0,fall),lerp(190,landing,fall),reduced?275:365,cast.face,1);
      break;
    }
    case 'wall':{
      const close=ease((t-.38)/(first-.38)),rise=ease(t/.43);
      const frame=t<.43?0:t<first?1:t<first+.22?2:3;
      for(const side of [-1,1]){
        drawSignatureTile('wall',frame,x+side*lerp(193,50,close),GY+10,lerp(82,reduced?245:326,rise),-side,1);
      }
      break;
    }
    case 'gold':
      if(t>=.21&&t<first){
        const grow=ease((t-.21)/(first-.21));
        const radius=standingHeight(f.ci)*1.5;
        drawGoldBall(f.x+cast.face*67,GY-lerp(112,radius*.88,grow),lerp(19,radius,grow),t);
      }
      break;
    case 'target':{
      const y=GY-103,muzzle=f.x+cast.face*83,barrel=GY-108;
      ctx.strokeStyle=t<first?'#ff4e4c9b':'#ff8663';ctx.lineWidth=t<first?1.5:4;
      if(t>.14){
        ctx.beginPath();ctx.moveTo(muzzle,barrel);ctx.lineTo(x,y);ctx.stroke();
      }
      ctx.fillStyle='#ff533c';
      const acquired=clamp(Math.floor((t-.18)*48),0,20);
      for(let i=0;i<acquired;i++){
        const angle=i*TAU/20;
        ctx.beginPath();ctx.arc(x+Math.cos(angle)*49,y+Math.sin(angle)*71,2.8,0,TAU);ctx.fill();
      }
      const previous=plan.beats[cast.next-1];
      if(previous&&t-previous[0]<.059){
        ctx.strokeStyle='#fff0a1';ctx.lineWidth=3;
        for(const offset of [-15,5,26]){
          ctx.beginPath();ctx.moveTo(muzzle,barrel+offset*.1);ctx.lineTo(x,y+offset);ctx.stroke();
        }
      }
      break;
    }
  }
  ctx.restore();
}

function resetCameraPrank(){
  cameraPrank=null;
  sockCutaway=sockCutawayPlayed=false;
  cameraPrankAt=stands.laneFor('oddball')==null?Infinity:13+Math.random()*10;
  lensTilt=lensTiltLeft=0;
}

function stepCameraPrank(dt){
  if(reduced){cameraPrank=null;lensTilt=lensTiltLeft=0;return false}
  if(phase!=='fight')return false;
  if(cameraPrank){
    const before=cameraPrank.time;
    cameraPrank.time+=dt;
    if(before<CAMERA_PRANK_CONTACT&&cameraPrank.time>=CAMERA_PRANK_CONTACT){
      noise(.13,270,.11,.45,'bandpass',1);
    }
    for(const [index,pitch] of [184,232,201,170].entries()){
      const laughBeat=CAMERA_PRANK_LAUGH+index*.115;
      if(before<laughBeat&&cameraPrank.time>=laughBeat)tone(pitch,.11,'triangle',.12);
    }
    if(cameraPrank.time>=CAMERA_PRANK_DURATION-1e-8){
      lensTilt=cameraPrank.direction*.051;lensTiltLeft=9;
      cameraPrank=null;clearInput();
    }
    return true;
  }
  lensTiltLeft=Math.max(0,lensTiltLeft-dt);
  if(standTime<cameraPrankAt || shots.length || superScreen ||
    ![P1,P2].every(f=>f.air===0&&f.hp>0&&['idle','walk'].includes(f.st)))return false;
  const lane=stands.laneFor('oddball');
  if(lane==null)return false;
  cameraPrank={time:0,lane,direction:lane<W/2?1:-1};
  cameraPrankAt=Infinity;
  clearInput();
  return true;
}

function lensAngle(){
  if(reduced)return 0;
  if(!cameraPrank)return lensTilt*ease(lensTiltLeft/2);
  const {time,direction}=cameraPrank;
  const contact=Math.max(0,time-CAMERA_PRANK_CONTACT);
  return direction*(.051*ease(contact/.30)+Math.sin(contact*52)*.022*Math.exp(-8*contact));
}

function drawCameraPrank(){
  if(!cameraPrank)return;
  const {time:t,lane,direction}=cameraPrank;
  const approach=ease(t/2.26),retreat=ease((t-CAMERA_PRANK_RETREAT)/(CAMERA_PRANK_DURATION-CAMERA_PRANK_RETREAT));
  const reach=approach*(1-retreat);
  const walking=t<1.70&&backstageArt.aklaswalk;
  const pose=walking?Math.floor(t*6)%2:
    t<1.9?1:t<2.16?2:t<CAMERA_PRANK_CONTACT?3:t<2.73?4:t<CAMERA_PRANK_RETREAT?5:7;
  const close=t>=2.73&&t<CAMERA_PRANK_RETREAT&&backstageArt.aklasclose;
  const hold=t-2.73;
  const expression=t>=CAMERA_PRANK_LAUGH+.32?3:t>=CAMERA_PRANK_LAUGH?2:hold<.9?0:1;
  const chuckle=t>CAMERA_PRANK_LAUGH?Math.abs(Math.sin((t-CAMERA_PRANK_LAUGH)*13))*11:0;
  const deckPosition=cam.z;
  const fromX=W/2+(lane-cam.cx)*deckPosition;
  const fromY=H/2+(314-cam.cy)*deckPosition;
  ctx.save();
  ctx.fillStyle='rgba(10,10,24,'+(reach*.29)+')';
  ctx.fillRect(0,0,W,H);
  ctx.translate(W/2,H/2);
  ctx.rotate(lensAngle());
  if(close){
    const sway=expression<2?Math.sin(hold*2.9)*13:Math.sin(hold*4.2)*6;
    drawBackstageSprite(ctx,'aklasclose',expression,sway,596-H/2-chuckle,430,direction);
  }else{
    drawBackstageSprite(ctx,walking?'aklaswalk':'camera',pose,lerp(fromX,W/2,reach)-W/2,
      lerp(fromY,625,reach)-H/2,lerp(73*deckPosition,560,reach),direction);
  }
  ctx.restore();
}

let refereeMark=480,refereeX=480;
let musicPlayer=null;
let musicTrack=store.get('completeMusic','Off');
const musicTracks=['Off',...Object.keys(COMPLETE_ART.music)];
if(!musicTracks.includes(musicTrack))musicTrack='Off';

function cycleMusic(){
  musicPlayer?.pause();
  musicTrack=musicTracks[(musicTracks.indexOf(musicTrack)+1)%musicTracks.length];
  store.set('completeMusic',musicTrack);
  musicPlayer=null;
  syncMusic();
}

function syncMusic(){
  if(musicTrack==='Off'||paused||document.hidden){musicPlayer?.pause();return}
  if(!musicPlayer){
    if(typeof Audio==='undefined')return;
    musicPlayer=new Audio(COMPLETE_ART.music[musicTrack]);
    musicPlayer.volume=.27;
    musicPlayer.loop=true;
  }
  musicPlayer.play()?.catch(()=>{});
}

function completeMoveSet(ci){return completeMoves[CH[ci]?.id]}
function completeEvent(name){if(!reduced)ringAntics.event(name)}
function playCompleteFx(f,move){
  const id=completeMoveSet(f.ci)?.fx[move];
  if(id&&!reduced)featured.playFx(id,f.x+f.face*57,GY-f.air-98,f.face,vclock);
}

function updateCompleteRound(dt){
  if(phase==='fight'){
    const previousBottleTime=backgroundBottleTime();
    standTime+=dt;
    if(previousBottleTime<BOTTLE_IMPACT&&backgroundBottleTime()>=BOTTLE_IMPACT){
      noise(.34,1750,.18,.60,'bandpass',.34);
      tone(145,.10,'triangle',.09);
    }
    const clearance=x=>Math.min(Math.abs(P1.x-x),Math.abs(P2.x-x));
    if(clearance(refereeMark)<126){
      refereeMark=[175,480,785].reduce((best,x)=>clearance(x)>clearance(best)?x:best,refereeMark);
    }
    refereeX=lerp(refereeX,refereeMark,1-Math.exp(-dt*3.4));
  }
  ringAntics.step(dt,{reducedMotion:reduced});
}

function backgroundCast(){
  return [P1,P2].map(f=>CH[f.ci].name);
}

function drawCompleteStands(){
  stands.draw(ctx,{width:W,height:H,time:standTime,excluded:backgroundCast(),
    reducedMotion:reduced,cameraPrank:!!cameraPrank,catDeparted:sockCatDeparted,bottleTime:backgroundBottleTime()});
}

function featuredClip(event,lead,other){
  const winner=event==='match_end'?CH[lead.ci].name:null;
  const duration=featured.sceneStart(event,[lead,other].map(f=>CH[f.ci].name),winner,0,reduced);
  if(!duration)return null;
  return {kind:'featured',event,title:'',lead,other,duration:duration+.35,cues:[.25]};
}

const featuredGestures={
  'Adjust the Hat':[0,0], 'Beat on Palm':[1,2], 'Big Grin Victory':[1,2],
  'Defeat Shrug':[1,3], 'Listen for the Punchline':[0,1],
  'Cap Tip Entrance':[0,0], 'Count the Beat':[0,1], 'Three Finger Multis':[0,1],
  'Crowd Salute':[1,2], 'Palms Up':[0,3], 'Freak Sanchez Reveal':[0,2],
  'Notebook Entrance':[0,1], 'Page Flip':[0,1], 'The Knowing Nod':[1,2],
  'Close the Notebook':[1,2], 'Waiting on the Judges':[2,3], 'Blueprint Reveal':[0,1]
};
function drawFeaturedClip(clip,t){
  featured.drawScene(ctx,clip.event,t,W,H,0,0,(part,index,elapsed,original,source)=>{
    if(part.sheet==='rivalry_cards'||(part.sheet==='kambal_tuko'&&index>=12))return false;
    const left=clip.lead.human?296:664,right=W-left;
    if(part.sheet==='kambal_tuko'){
      const finale=index>=4,beat=index%4;
      const hop=finale&&!reduced?Math.sin(Math.PI*clamp(elapsed/.85,0,1))*34:0;
      drawReaction(clip.lead,finale?'laugh':'confused',left,t);
      drawReaction(clip.other,finale?'shock':'confused',right+(finale?Math.sign(right-left)*beat*12:0),t,{lift:hop});
      if(index>0){
        const fr=mascots[beat],scale=(index===1?94:155)/fr.h;
        drawSprite(fr,480+(finale?(right-left)*.17:0),GY,Math.sign(right-left),1,false,scale,scale);
      }
    }else{
      const cast=[clip.lead,clip.other];
      const actor=cast.find(a=>CH[a.ci].id===part.owner);
      if(!actor)return false;
      const other=cast.find(a=>a!==actor);
      const pos=actor===clip.lead?left:right,enemy=W-pos;
      drawReaction(other,'confused',enemy,t);
      if(part.owner==='target'){
        const [x,y,w,h]=source.rect,[ax,ay]=source.pivot;
        const frame={im:original,x,y,w,h,ax,ay,scale:170/235};
        drawSprite(frame,pos,GY,actor.face);
      }else{
        const poses=featuredGestures[part.name]??[0,2];
        const key=poses[Number(reduced||index!==part.frames[0])];
        const frame=CH[actor.ci].redraw?sceneBody(actor.ci,key===2?'win':'idle',elapsed):gestureFrames[(actor.ci-9)*4+key];
        const travel=clip.event==='match_start'&&!reduced?20*(1-easeOut(clamp(elapsed/.42,0,1))):0;
        drawSprite(frame,pos-actor.face*travel,GY,actor.face);
      }
    }
    return true;
  });
}

function completeBodyFrame(f){
  const {st,t,ci}=f;
  const body=CH[ci].f,poses=motionFrames[ci];
  if(st==='idle')return body.idle[reduced?0:Math.floor(t*4)%body.idle.length];
  if(st==='win'){
    if(ci===12)return body.win[reduced?body.win.length-1:Math.min(body.win.length-1,Math.floor(t*6))];
    return reduced?poses[19]:t<.14?body.idle[0]:t<.95?poses[19]:body.win.at(-1);
  }
  if(st==='jump'){
    if(t<.035)return poses[11];
    return poses[f.vy<20?13:14];
  }
  if(st==='dash')return poses[t<.025?11:t<.155?12:1];
  if(st==='hit'||st==='stunned'||st==='frozen')return poses[st==='hit'&&f.air===0&&t>.23?8:9];
  if(st==='block')return t>.14?body.idle[0]:poses[8];
  if(st==='crouch')return poses[11];
  if(st==='down'){
    if(f.air>11||t<.12)return poses[9];
    return poses[f.hp>0&&(phase==='fight'||f.demo)&&t>=.72?11:10];
  }
  if(st==='chargeMana'||st==='chargePower')return poses[t<.13?8:18];
  if(st==='chargeRecover')return t<.085?poses[8]:body.idle[0];
  if(st==='slide'||st==='evade'){
    const stage=attackPoseAt(t,moveData(f));
    return poses[(st==='slide'?[11,12,15,11]:[8,9,12,11])[stage]];
  }
  if(['punch','upper','rise','wave','power','technique'].includes(st)){
    const stage=attackPoseAt(t,moveData(f));
    if(stage===0)return poses[8];
    if(stage===1)return st==='punch'?body.punch[2]:poses[18];
    if(stage===3)return st==='punch'?body.punch.at(-1):body[st]?.at(-1)??poses[8];
    if(st==='upper'&&moveData(f).counter)return poses[f.counter>0?8:17];
    if(st==='upper'||st==='rise')return poses[17];
    if(st==='wave'||st==='power')return body[st][3];
    return poses[16];
  }
  return null;
}

const completeBadang=CH.find(c=>c.id==='badang');
function drawBadangProp(index,x,y,size,face,alpha=1){
  if(index===3){drawFX(0,2,x,y,size,face,alpha);return;}
  const frame=backstageArt.papayafx?.[index];
  if(frame)drawSprite(frame,x,y,face,alpha,false,size,size);
}

const BOTTLE_RELEASE=1.27;
const BOTTLE_IMPACT=1.74;
const WET_LENS_DURATION=2.75;
const BACKGROUND_BOTTLE_START=5.7;

function backgroundBottleTime(){
  if(reduced||phase!=='fight'||stands.laneFor('throne')==null)return -1;
  return standTime-BACKGROUND_BOTTLE_START;
}

function drawBackgroundBottle(cameraMatrix,time){
  if(time<BOTTLE_RELEASE||time>=BOTTLE_IMPACT+WET_LENS_DURATION)return;
  const lane=stands.laneFor('throne');
  const face=lane< W/2?1:-1;
  if(time>=BOTTLE_IMPACT){
    drawWetLens(time,face);
    return;
  }
  const projectile=backstageArt.waterbottle?.[3];
  if(!projectile)return;
  const progress=clamp((time-BOTTLE_RELEASE)/(BOTTLE_IMPACT-BOTTLE_RELEASE),0,1);
  const track=easeOut(progress),scale=lerp(20,315,progress**2.6);
  const x=lane+(591-555)*.84,y=317-75;
  const startX=(cameraMatrix.a*x+cameraMatrix.c*y+cameraMatrix.e)/RS;
  const startY=(cameraMatrix.b*x+cameraMatrix.d*y+cameraMatrix.f)/RS;
  drawSprite(projectile,lerp(startX,W/2+face*22,track),lerp(startY,H*.42,track),
    face,1,false,scale,scale,-progress*2.6);
}

function drawBadangWin(clip,t,x,y){
  const face=Math.sign(y-x);
  drawSprite(sceneBody(clip.other.ci,'down',.38),y,GY,-face);
  const pose=t<.45?0:t<1.7?1:2;
  if(!drawBackstageSprite(ctx,'bleee',pose,x,GY,standingHeight(clip.lead.ci),face)){
    drawSprite(sceneBody(clip.lead.ci,'win',t),x,GY,face);
  }
}

const lensDrops=Array.from({length:32},(_,index)=>({
  angle:index*2.39996, travel:70+(index*47)%340, size:3+(index*17)%24,
  run:24+(index*23)%133
}));
let dryLensFrame=null;

function drawWetLens(time,face){
  const age=time-BOTTLE_IMPACT;
  if(age<0||age>WET_LENS_DURATION||!backstageArt.waterbottle)return;
  const fade=1-ease((age-1.94)/(WET_LENS_DURATION-1.94));
  const burst=reduced?1:easeOut(age/.28);
  const centerX=W/2+face*22,centerY=H*.42;
  const refraction=!reduced&&!lowQ();
  if(refraction){
    dryLensFrame??=document.createElement('canvas');
    if(dryLensFrame.width!==cv.width||dryLensFrame.height!==cv.height){
      dryLensFrame.width=cv.width;dryLensFrame.height=cv.height;
    }
    dryLensFrame.getContext('2d').drawImage(cv,0,0);
  }
  ctx.save();
  ctx.globalAlpha=fade;
  const wash=ctx.createRadialGradient(centerX,centerY,24,centerX,centerY,420);
  const sheetAlpha=reduced?.22:1-ease(age/.53);
  wash.addColorStop(0,'#c5f6ff65');
  wash.addColorStop(.55,'#a6d9ec3f');
  wash.addColorStop(1,'#2e608e53');
  ctx.fillStyle=wash;ctx.fillRect(0,0,W,H);
  if(sheetAlpha>.01){
    // A single sheet hits the glass before breaking into separate droplets.
    const radius=lerp(27,407,burst);
    ctx.save();
    ctx.globalAlpha=fade*sheetAlpha;
    ctx.translate(centerX,centerY);
    const rim=Array.from({length:26},(_,i)=>{
      const a=i*TAU/26,spill=radius*(.81+.13*Math.sin(i*2.71)+.09*Math.sin(i*.92));
      return [Math.cos(a)*spill,Math.sin(a)*spill*.69];
    });
    const [firstX,firstY]=rim[0], [lastX,lastY]=rim.at(-1);
    ctx.beginPath();ctx.moveTo((firstX+lastX)/2,(firstY+lastY)/2);
    for(const [i,[x,y]] of rim.entries()){
      const [qx,qy]=rim[(i+1)%rim.length];
      ctx.quadraticCurveTo(x,y,(x+qx)/2,(y+qy)/2);
    }
    ctx.closePath();
    const sheet=ctx.createRadialGradient(0,0,8,0,0,radius);
    sheet.addColorStop(0,'#d6f8ff70');
    sheet.addColorStop(.52,'#9bdaeb45');
    sheet.addColorStop(1,'#defaffc4');
    ctx.fillStyle=sheet;ctx.fill();
    ctx.strokeStyle='#dff8fbb8';ctx.lineWidth=2.3;ctx.stroke();
    ctx.restore();
  }
  for(const {angle,travel,size,run} of lensDrops){
    const fall=reduced?0:Math.max(0,age-.26)**1.28*run*.56;
    const x=centerX+Math.cos(angle)*travel*burst*1.5;
    const y=centerY+Math.sin(angle)*travel*burst*.72+fall;
    const r=size*(.45+burst*.78),ry=r+(reduced?0:Math.min(37,age*run*.13));
    ctx.save();
    ctx.translate(x,y);ctx.rotate(Math.cos(angle)*.23);
    const droplet=ctx.createLinearGradient(-r,-r,r,ry);
    droplet.addColorStop(0,'#e2f7ff85');
    droplet.addColorStop(.33,'#344c651f');
    droplet.addColorStop(.8,'#0a233877');
    droplet.addColorStop(1,'#d0f1ff5f');
    ctx.beginPath();ctx.ellipse(0,0,r,ry,0,0,TAU);
    if(refraction&&x>=r&&y>=ry&&x+r<=W&&y+ry<=H){
      ctx.save();
      ctx.clip();
      ctx.drawImage(dryLensFrame,(x-r*.62)*RS,(y-ry*.68)*RS,1.24*r*RS,1.31*ry*RS,-r,-ry,2*r,2*ry);
      ctx.restore();
    }
    ctx.fillStyle=droplet;ctx.fill();
    ctx.strokeStyle='#d9f5ff88';ctx.lineWidth=1.35;ctx.stroke();
    if(!reduced&&run>105&&age>.42){
      const streak=Math.min(126,(age-.42)*run*.39);
      const light=ctx.createLinearGradient(0,-ry-streak,0,0);
      light.addColorStop(0,'#c6f7ff00');light.addColorStop(1,'#c6f7ff89');
      ctx.strokeStyle=light;ctx.lineWidth=Math.max(1,r*.18);
      ctx.beginPath();ctx.moveTo(r*.1,-ry-streak);
      ctx.quadraticCurveTo(-r*.23,-ry*1.3,-r*.11,-ry);ctx.stroke();
    }
    ctx.beginPath();ctx.ellipse(-r*.31,-ry*.57,Math.max(1,r*.31),Math.max(1,r*.14),-.2,0,TAU);
    ctx.fillStyle='#f4fdffc5';ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function showCompleteResult(winner){
  const canvas=$('badangResult');
  canvas.hidden=!winner||CH[winner.ci]!==completeBadang;
  if(canvas.hidden)return;
  const frame=completeBadang.f.win.at(-1);
  const {x,y,w,h}=frame.bounds;
  const size=Math.min(canvas.width/w,canvas.height/h)*.94;
  const g=canvas.getContext('2d');
  g.clearRect(0,0,canvas.width,canvas.height);
  g.drawImage(frame.im,frame.x,frame.y,w,h,(canvas.width-w*size)/2,(canvas.height-h*size)/2,w*size,h*size);
}

function configureCompleteMoves(){
  ROSTER.forEach((fighter,ci)=>{
    const setup=completeMoveSet(ci);
    if(!setup)return;
    const moves=MOVES[ci];
    Object.assign(moves.upper,setup.upper);
    moves.wave.volley=volley(...setup.wave);
    Object.assign(moves.wave,setup.waveOptions);
    fighter.passive=setup.passive;
    fighter.detail=setup.super.signature;
  });
}

const mascots=[];
const gestureFrames=[];
let stageProps;
const motionFrames=[];
const modelFaces=[];
let lobbyPortraits;
async function loadModelArt(){
  for(const [style,art] of Object.entries(MOTION_ART.signatures)){
    const im=await loadImage(art.src);
    signatureArt[style]=art.frames.map(([x,y,w,h,scale,ax])=>({im,x,y,w,h,ax,ay:h-2,scale}));
  }
  for(const [name,art] of Object.entries(MOTION_ART.backstage)){
    const im=await loadImage(art.src);
    backstageArt[name]=art.frames.map(([x,y,w,h,scale,ax=w/2,ay=h,headX,headY])=>
      ({im,x,y,w,h,scale,ax,ay,crownAnchor:headX===undefined?null:[headX,headY],bounds:{x:0,y:0,w,h}}));
  }
  lobbyPortraits ||= await loadImage(MOTION_ART.lobby);
  stageProps=await loadImage(MOTION_ART.props);
  const gestures=await loadImage(MOTION_ART.gestures);
  MOTION_ART.gestureFrames.forEach(([x,y,w,h,ax,ay,scale],i)=>{
    gestureFrames[i]={im:gestures,x,y,w,h,ax,ay,scale};
  });
  const geckos=await loadImage(MOTION_ART.mascots);
  for(let i=0;i<4;i++)mascots[i]={im:geckos,x:i*256,y:0,w:256,h:176,ax:128,ay:174,scale:1};
  const image=await loadImage(MOTION_ART.faces);
  for(const [ci,record] of MOTION_ART.fighters.entries()){
    if(CH[ci].redraw){
      motionFrames[ci]=CH[ci].frames;
      modelFaces[ci]=portraitRow(image,ci);
      continue;
    }
    const sheet=await loadImage(record.src);
    motionFrames[ci]=record.frames.map(([x,y,w,h,ax,ay,scale,crownAnchor])=>
      ({im:sheet,x,y,w,h,ax,ay,scale,crownAnchor,bounds:{x:0,y:0,w,h}}));
    modelFaces[ci]=portraitRow(image,ci);

  }
  const scaled=(name,indices)=>indices.map(index=>{
    const {frames}=CH.find(f=>f.redraw===name);
    return {...frames[index],scale:1/frames[0].h,crownAnchor:null};
  });
  backstageArt.chop=scaled('batas',[20,21,22,23]);
  backstageArt.socks.push(...scaled('zaito',[16,17,18,19]));
  backstageArt.dance=scaled('aklas',[22,23,25,24,16,17,23,0]);
  backstageArt.camera=scaled('aklas',[16,18,19,19,20,20,21,17]);
  backstageArt.aklaswalk=scaled('aklas',[16,17]);
  backstageArt.waterbottle=[...CH[12].frames.slice(16,19),...backstageArt.bottleprop];
}

function portraitRow(image,ci){
  return Object.keys(FACE_POSES).map((_,pose)=>({
    im:image,x:pose*160,y:ci*160,w:160,h:160,faceCrop:[0,0,160,160]}));
}

// A standing fighter's world height is also the scale reference for seated and reaching poses.
function neutralBody(ci){
  return revisedFighterFrame(ci,'idle',0)||CH[ci].f.idle[0];
}
function standingHeight(ci){
  const frame=neutralBody(ci);
  return (frame.bounds?.h??frame.h)*frame.scale;
}
function sceneBody(ci,state,time){
  const actor={ci,st:state,t:Math.max(0,time),air:0,vy:0,hp:MAX_HP};
  return selectFrame(actor);
}

function completeUltimateFrame(f,acting){
  const brew=backstageArt.delobrew;
  if(f.ci===9&&brew&&f.ultimate){
    const sip=f.t/f.ultimate.intro;
    return sip<1?brew[sip<.24?0:sip<.74?1:2]:acting.phase==='recover'?CH[f.ci].f.idle[0]:brew[3];
  }
  const special=signatureBodyFrame((f.ultimate?.plan??ULTIMATE_PLANS[f.ci]).style,acting);
  if(special)return special;
  const body=CH[f.ci].f, frames=body.sp;
  const count=frames.length;
  if(acting.phase==='recover')return acting.amount>.38?frames[count-1]:body.idle[0];
  if(acting.phase==='impact'){
    const beats=ULTIMATE_PLANS[f.ci].beats.length;
    return frames[Math.min(count-1,Math.floor(count*.6+acting.step*count*.4/beats))];
  }
  if(acting.amount<.24)return motionFrames[f.ci][18];
  return frames[Math.min(count-2,Math.floor(acting.amount*count*.58))];
}
