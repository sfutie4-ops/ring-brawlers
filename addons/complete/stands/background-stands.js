/* Comedic background animation. Draw once per frame, before the playable fighters. */
function createBackgroundStands(roster, atlas, frames, model, actionSprite) {
  const actors = new Map(roster.map((actor,ci) => [actor.name.toLowerCase(), ci]));
  const clamp = (n, min=0, max=1) => Math.max(min, Math.min(max, n));
  const mix = (a,b,t) => a+(b-a)*clamp(t);
  const smooth = t => { t=clamp(t); return t*t*(3-2*t); };
  const mod = (n,d) => (n%d+d)%d;
  const pulse = (t,a,b) => t>=a && t<b;
  const phaseIndex = (t, ends) => {
    const i=ends.findIndex(end=>t<end);
    return i<0?ends.length:i;
  };

  function prop(c,id,x,y,size,{angle=0,face=1,bottom=false,wide=false}={}) {
    if (!atlas.complete || !atlas.naturalWidth || !frames[id]) return false;
    const [sx,sy,w,h] = frames[id];
    const s = size/(wide ? w : h);
    c.save();
    c.translate(x,y);
    c.rotate(angle);
    c.scale(face,1);
    c.drawImage(atlas,sx,sy,w,h,-w*s/2,bottom?-h*s:-h*s/2,w*s,h*s);
    c.restore();
    return true;
  }

  function actor(c,name,x,y,height,{face=1,pose='idle',index=0,angle=0,stretch=1}={}) {
    const ci=actors.get(name.toLowerCase());
    if(ci===undefined)return;
    const fighter=roster[ci];
    const clip=fighter.f?.[pose]||fighter.f?.idle;
    if(!model&&!clip?.length)return;
    const {frame,height:baseHeight}=model?model(ci,pose,index):{
      frame:clip[clamp(index,0,clip.length-1)],
      height:fighter.f.idle[0].bounds.h*(fighter.f.idle[0].scale||1)
    };
    const unit=frame.scale||1;
    const s=height/baseHeight;
    c.save();
    c.translate(x,y);
    c.scale(face/stretch,stretch);
    c.rotate(angle);
    c.drawImage(frame.im,frame.x,frame.y,frame.w,frame.h,
      -frame.ax*unit*s,-frame.ay*unit*s,frame.w*unit*s,frame.h*unit*s);
    c.restore();
  }

  function bubble(c,text,x,y,fill='#f6db9d') {
    c.save();
    c.font='bold 12px system-ui,sans-serif';
    const w=c.measureText(text).width+14;
    c.fillStyle=fill;
    c.strokeStyle='#291b29';
    c.lineWidth=2;
    c.beginPath();
    c.roundRect(x-w/2,y,w,21,5);
    c.moveTo(x-7,y+20);
    c.lineTo(x-2,y+26);
    c.lineTo(x+3,y+20);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle='#281a20';
    c.textAlign='center';
    c.fillText(text,x,y+14);
    c.restore();
  }

  function accent(c,x,y,t,color,sparks=5) {
    c.save();
    c.lineCap='round';
    c.strokeStyle=color;
    c.lineWidth=2.1;
    c.globalAlpha *= 1-clamp(t);
    for(let i=0;i<sparks;i++){
      const a=Math.PI*(i/(sparks-1)+1.05);
      const d=5+18*t;
      c.beginPath();c.moveTo(x+Math.cos(a)*d,y+Math.sin(a)*d);
      c.lineTo(x+Math.cos(a)*(d+6),y+Math.sin(a)*(d+6));c.stroke();
    }
    c.restore();
  }

  const sockDeck = {center:93, floor:312, catLeft:4, catRight:182};
  const catExit = direction => direction===1?sockDeck.catRight:sockDeck.catLeft;

  function sockScene(c,t,moving,{lane,catDeparted}) {
    const p=moving?mod(t,30):0;
    const away=p>=4.2&&p<10.3;
    if(away)return;
    const leaving=p>=2.2&&p<4.2;
    const returning=p>=10.3;
    const beat=p-10.3;
    const leave=smooth((p-2.2)/2);
    const enter=smooth(beat/1.65);
    const frame=beat<.5?0:beat<1?1:beat<1.75?0:beat<2.38?2:3;
    for(const [i,name] of ['Smugglaz','Zaito'].entries()){
      const seat=62+i*68;
      const path=returning?mix(-22+i*29,seat,enter):mix(seat,-38+i*21,leave);
      const hidden=leaving&&path<7;
      if(hidden)continue;
      const y=311;
      const face=leaving?-1:i===0||returning&&beat<2.4?1:-1;
      if(returning&&actionSprite){
        c.save();
        c.globalAlpha*=clamp(beat/.29);
        actionSprite(c,'socks',i*4+frame,path,y,82,face);
        c.restore();
      }else actor(c,name,path,y,82,{face,pose:leaving?'walk':'idle',index:Math.floor(t*10)%4});
    }
    if(moving&&pulse(p,1.0,2.15))bubble(c,'Tara?',128,204);
    if(moving&&pulse(beat,2.48,4.2))bubble(c,'Bakit dalawa?!',101,203,'#adcfe1');
    const direction=lane<480?1:-1;
    if(t>=14.6&&!catDeparted&&moving){
      const progress=smooth((t-15.0)/.9);
      const catX=mix(sockDeck.center,catExit(direction),progress);
      actionSprite?.(c,'dirtycat',Math.floor(t*9)%2,catX,sockDeck.floor,29,direction);
      if(t<16.25)bubble(c,'Pusa mo ’yan?',99,205,'#f2caa0');
    }
  }

  function quarrel(c,t,moving) {
    const p=mod(t+1.7,14);
    const pair=moving;
    const first=pair&&pulse(p,2.1,3.0), second=pair&&pulse(p,3.0,4.1);
    const joining=pair&&pulse(p,4.1,8.4);
    const frame=!pair?0:phaseIndex(p,[2.1,4.1,6.5,8.4])%4;
    if(!actionSprite?.(c,'argue',frame,299,312,83)){
      actor(c,'Apekz',299,312,73,{pose:joining?'block':'idle'});
      actor(c,'Shehyee',245,312,82,{pose:first?'punch':second?'block':'idle'});
      actor(c,'Sinio',354,312,83,{face:-1,pose:second?'punch':first?'block':'idle'});
    }
    if(pair&&pulse(p,1.1,2.0))bubble(c,'Ano?!',266,204,'#f4c4a5');
    if(first&&pulse(p,2.47,2.73))accent(c,305,252,(p-2.47)/.26,'#ffbb72');
    if(second&&pulse(p,3.49,3.75))accent(c,305,252,(p-3.49)/.26,'#ffe5a9');
    if(joining&&pulse(p,5.2,6.5))bubble(c,'Ako rin!',309,203);
    if(joining&&pulse(p,6.36,6.58))accent(c,308,250,(p-6.36)/.22,'#ffcc80');
  }

  function throneScene(c,t,moving,{lane,bottleTime}) {
    const p=mod(t+2,17);
    const heckle=moving&&pulse(p,3.0,5.5);
    const frame=moving?phaseIndex(p,[3,4.1,5.5,7])%4:0;
    if(!actionSprite?.(c,'throne',frame,499,312,126)){
      prop(c,'throne',499,312,131,{bottom:true});
      actor(c,'Loonie',500,303,81,{pose:'crouch'});
    }
    const throwPose=bottleTime<.57?0:bottleTime<1.27?1:2;
    const throwing=moving&&bottleTime>=0&&bottleTime<2.05&&
      actionSprite?.(c,'waterbottle',throwPose,591,312,88,lane<480?1:-1);
    if(!throwing)actor(c,'Badang',591,312,88,{face:-1,pose:heckle?'win':'idle',index:3});
    if(heckle)bubble(c,'Ayos?',556,191,'#f6b18e');
  }

  const aklasRoutines=[
    [0,1,0,1,2,3,6,7], [7,4,4,5,6,6,1,7], [5,0,1,2,3,4,6,7]
  ];
  let aklasRoutine=0;
  function oddball(c,t,moving) {
    if(!actionSprite){
      actor(c,'Aklas',738,312,79,{pose:moving?'walk':'idle',index:Math.floor(t*6)%4,face:-1});
      return;
    }
    const cycle=Math.floor(t/4.4), beat=t%4.4;
    const routine=aklasRoutines[(cycle+aklasRoutine)%aklasRoutines.length];
    const pose=moving?routine[Math.min(7,Math.floor(beat/.5))]:7;
    const shift=moving&&pose<=2?Math.sin(beat*9)*9:0;
    const lift=moving&&pose===2?16*Math.sin(clamp((beat%.5)/.5)*Math.PI):0;
    actionSprite(c,'dance',pose,738+shift,312-lift,85,cycle%2?1:-1);
  }

  function woods(c,t,moving) {
    const p=moving?mod(t+.9,2.4):0;
    const frame=phaseIndex(p,[.54,1.11,1.39]);
    prop(c,frame===2?'notched_tree':'tree',886,312,120,{bottom:true});
    if(!actionSprite?.(c,'chop',frame,818,312,95))actor(c,'Batas',818,312,90);
  }

  // Choose complete skits so a pair never loses one of its actors.
  const scenes=[
    {id:'socks',cast:['Zaito','Smugglaz'],draw:sockScene,center:sockDeck.center,deck:248},
    {id:'quarrel',cast:['Shehyee','Sinio','Apekz'],draw:quarrel,center:299,deck:247},
    {id:'throne',cast:['Loonie','Badang'],draw:throneScene,center:555,deck:248},
    {id:'oddball',cast:['Aklas'],draw:oddball,center:738,deck:142},
    {id:'woods',cast:['Batas'],draw:woods,center:860,deck:226}
  ];
  let selection=[];
  let excludedKey=null;
  let firstLane=0;
  const keyFor=names=>names.map(name=>name.toLowerCase()).sort().join('|');

  function select(excluded=[],random=Math.random) {
    excludedKey=keyFor(excluded);
    const skip=new Set(excluded.map(name=>name.toLowerCase()));
    const available=scenes.filter(scene=>scene.cast.every(name=>{
      const key=name.toLowerCase();
      return actors.has(key)&&!skip.has(key);
    }));
    const count=Math.min(available.length,1+Number(random()>=.5));
    firstLane=random()<.5?195:765;
    selection=Array.from({length:count},()=>available.splice(Math.floor(random()*available.length),1)[0]);
    aklasRoutine=Math.floor(random()*aklasRoutines.length);
    return selection.map(scene=>scene.id);
  }

  function drawDeck(c,width) {
    const left=-width/2;
    const deck=c.createLinearGradient(0,313,0,364);
    deck.addColorStop(0,'#433d4f');
    deck.addColorStop(.3,'#292638');
    deck.addColorStop(1,'#141521');
    c.fillStyle=deck;
    c.fillRect(left,312,width,23);
    c.fillStyle='#6d6273';
    c.fillRect(left,313,width,2);
    c.strokeStyle='#242336';
    c.lineWidth=5;
    c.beginPath();
    for(const leg of [left+15,-left-15]){
      c.moveTo(leg,334);c.lineTo(leg,365);
    }
    c.moveTo(left+15,360);c.lineTo(-left-15,335);
    c.stroke();
  }

  function laneFor(id){
    const index=selection.findIndex(scene=>scene.id===id);
    return index<0?null:index===0?firstLane:960-firstLane;
  }

  return {
    select,laneFor,
    catExit(){
      const lane=laneFor('socks');
      if(lane===null)return null;
      const direction=lane<480?1:-1;
      return {x:lane+(catExit(direction)-sockDeck.center)*.84,y:317+(sockDeck.floor-315)*.84,direction};
    },
    draw(c,{width=960,height=540,time=0,excluded=[],reducedMotion=false,cameraPrank=false,catDeparted=false,bottleTime=-1}={}) {
      if(excludedKey!==keyFor(excluded))select(excluded);
      c.save();
      c.scale(width/960,height/540);
      for(const [index,scene] of selection.entries()){
        c.save();
        const lane=index===0?firstLane:960-firstLane;
        c.translate(lane,317);
        c.scale(.84,.84);
        c.translate(0,-315);
        c.globalAlpha*=.83;
        drawDeck(c,scene.deck);
        c.translate(-scene.center,0);
        if(!cameraPrank||scene.id!=='oddball')scene.draw(c,time,!reducedMotion,{lane,catDeparted,bottleTime});
        c.restore();
      }
      c.restore();
    }
  };
}
