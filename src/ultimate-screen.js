// One screen treatment at a time. World hitboxes and damage live in ultimates.js.
const SUPER_LOOKS = [
  {ink:'#211020', main:'#ffb52f', light:'#fff2a3', draw:crownScreen},
  {ink:'#20102d', main:'#ff641d', light:'#ffd7a9', draw:cerberusScreen},
  {ink:'#290815', main:'#f53952', light:'#ffd0b5', draw:angleScreen},
  {ink:'#071b1d', main:'#46dbb0', light:'#ffe199', draw:libertyScreen},
  {ink:'#0b1726', main:'#24adf0', light:'#ffdc91', draw:timerScreen},
  {ink:'#110722', main:'#87ec4e', light:'#e4ffc5', draw:blackHoleScreen},
  {ink:'#090717', main:'#47996d', light:'#c8ffe0', draw:zaitoStormScreen},
  {ink:'#071449', main:'#537cfc', light:'#c0dcff', draw:meaningScreen},
  {ink:'#260b32', main:'#f644a8', light:'#ffc2eb', draw:lotusScreen}
];
const SIGNATURE_LOOKS={
  gold:{ink:'#2b1710',main:'#ffc52f',light:'#fff2a1',draw:crownScreen},
  wall:{ink:'#111e21',main:'#68c0ae',light:'#fae0aa',draw:libertyScreen},
  papaya:{ink:'#21100e',main:'#ff8628',light:'#fff0a2',draw:lotusScreen},
  target:{ink:'#2b0710',main:'#ff4160',light:'#ffcfbd',draw:angleScreen}
};
const SCREEN_IMPACT_TAIL = .72;
const SCREEN_INTERRUPT_TAIL = .22;
let superScreen = null;

function resetUltimateScreen() {superScreen = null}

function startUltimateScreen(f, cast) {
  superScreen = {f,cast,age:0,since:Infinity,beat:-1,worldX:cast.wellX??cast.x,exit:0};
}

function markUltimateScreen(f, cast, center, index) {
  if (superScreen?.f!==f || superScreen.cast!==cast) return;
  superScreen.worldX = center;
  superScreen.beat = index;
  superScreen.since = 0;
}

function advanceUltimateScreen(real) {
  if (!superScreen) return;
  const s = superScreen;
  s.age += real;
  s.since += real;
  const casting = s.f.st==='sp' && s.f.ultimate===s.cast;
  if (casting && phase==='fight') return;
  if (phase!=='fight' && phase!=='ko') {resetUltimateScreen();return}
  s.exit += real;
  const limit = s.beat<0 ? SCREEN_INTERRUPT_TAIL : SCREEN_IMPACT_TAIL;
  if (s.exit>=limit) resetUltimateScreen();
}

function screenHash(i, salt=0) {
  const value = Math.sin((i+5)*67.13+salt*13.91)*43758.5453;
  return value-Math.floor(value);
}

function readUltimateScreen(transform) {
  if (!superScreen || (phase!=='fight' && phase!=='ko')) return null;
  const s = superScreen;
  const {plan,visualCi}=s.cast;
  const worldY = plan.floor ? GY-35 : GY-138;
  const px = (transform.a*s.worldX+transform.c*worldY+transform.e)/RS;
  const py = (transform.b*s.worldX+transform.d*worldY+transform.f)/RS;
  const groundY=clamp((transform.b*s.worldX+transform.d*GY+transform.f)/RS,H*.65,H*.93);
  const fadeLimit = s.beat<0 ? SCREEN_INTERRUPT_TAIL : SCREEN_IMPACT_TAIL;
  const amount = ease(s.age/.17)*(1-ease(s.exit/fadeLimit));
  const impact = s.beat<0 ? 0 : (1-ease(s.since/SCREEN_IMPACT_TAIL))*amount;
  const progress = s.beat<0 ? ease(s.cast.elapsed/plan.beats[0][0])*.19 : clamp(s.since/.62,0,1);
  const projectX=wx=>(transform.a*wx+transform.c*GY+transform.e)/RS;
  const originX=projectX(s.cast.x);
  const slamX=plan.response ? clamp(projectX(ultimateBeatX(plan,s.cast,plan.beats[1],1)),100,W-100) : null;
  const base=SUPER_LOOKS[visualCi]??SIGNATURE_LOOKS[plan.style]??{ink:'#140e20',main:'#b487ff',light:'#fff0de',draw:angleScreen};
  const copied=visualCi!==s.f.ci;
  const look=copied?{...base,ink:'#111629',main:'#72cef7',light:'#ead2ff'}:base;
  return {
    x:clamp(px,100,W-100),y:clamp(py,H*.39,H*.87),face:s.cast.face,
    f:s.f,cast:s.cast,groundY,originX,slamX,t:s.age,since:s.since,beat:s.beat,progress,impact,amount,look,copied
  };
}

function screenPolygon(points) {
  ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.closePath();
}

function screenBloom(x,y,r,color,alpha) {
  ctx.globalAlpha = alpha;
  ctx.drawImage(glow(color),x-r,y-r,r*2,r*2);
}

function diamond(x,y,r,scale,rotation) {
  ctx.save();
  ctx.translate(x,y);ctx.rotate(rotation);
  screenPolygon([[0,-r*scale],[r,0],[0,r*scale],[-r,0]]);
  ctx.restore();
}

function crownScreen(s) {
  const {x,y,t,progress:p,impact:i,amount:a,look} = s;
  const centerY = y-92;
  ctx.save();
  ctx.translate(x,centerY);
  ctx.rotate(t*.19);
  for(let n=0;n<(lowQ()?10:18);n++) {
    const angle=n*TAU/(lowQ()?10:18);
    const band=.011+screenHash(n)*.046+i*.019;
    ctx.globalAlpha=(.11+i*.32)*a;
    ctx.fillStyle=n%3===0?look.light:look.main;
    screenPolygon([[0,0],[Math.cos(angle-band)*1330,Math.sin(angle-band)*1330],
      [Math.cos(angle+band)*1330,Math.sin(angle+band)*1330]]);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle=look.light;
  ctx.lineWidth=3+i*7;
  for(let n=0;n<3;n++) {
    const r=(98+n*41+p*(390+n*88));
    ctx.globalAlpha=(.1+i*.68)*a/(1+n*.36);
    ctx.beginPath();ctx.ellipse(x,y-6,r,r*.24,0,0,TAU);ctx.stroke();
  }
}

function cerberusScreen(s) {
  const {x,groundY,face,t,impact:i,amount:a,look} = s;
  const count=lowQ()?19:38;
  for (let n=0;n<count;n++) {
    const spark=screenHash(n,25);
    const drift=(n/count+t*(.46+spark*.39))%1;
    const xx=face>0 ? drift*(W+120)-60 : W+60-drift*(W+120);
    const yy=groundY-(spark+.30)*drift*398-35+Math.sin(t*8+n)*20;
    const length=(17+spark*82)*(1-drift*.51);
    ctx.globalAlpha=(.09+i*.43)*a*Math.sin(drift*Math.PI);
    ctx.fillStyle=n%5===0?'#aa6afa':n%3?look.main:look.light;
    screenPolygon([[xx,yy],[xx-face*length,yy+length*.14],[xx-face*length*.49,yy-7],[xx+face*8,yy-2]]);
    ctx.fill();
  }
  for (let n=0;n<3;n++) {
    screenBloom(x-face*(187-n*212),groundY-79-n*39,267+n*29,n===1?look.main:'#b03eff',
      (.09+i*.28)*a);
  }
}

function angleScreen(s) {
  const {x,y,progress:p,impact:i,amount:a,look} = s;
  const centerY=y-60;
  for(let n=0;n<4;n++) {
    ctx.globalAlpha=(.16+i*.42)*a;
    ctx.strokeStyle=n%2?look.main:look.light;
    ctx.lineWidth=n===1?5+i*10:2+i*4;
    diamond(x,centerY,85+n*110+p*(170+n*30),.61,-.12);
    ctx.stroke();
  }
  for(const side of [-1,1]){
    const edge=side<0?0:W;
    ctx.globalAlpha=(.06+i*.31)*a;
    ctx.fillStyle=look.main;
    screenPolygon([[edge,-45],[edge-side*(84+p*109),-40],[edge-side*(205+p*205),H+30],[edge,H+30]]);
    ctx.fill();
    ctx.globalAlpha=(.10+i*.41)*a;
    ctx.fillStyle=look.main;
    screenPolygon([[x-side*630,-60],[x-side*468,-60],[x+side*350,H+80],[x+side*270,H+80]]);
    ctx.fill();
    ctx.strokeStyle=look.light;
    ctx.lineWidth=2+i*7;
    ctx.beginPath();ctx.moveTo(x-side*(410+p*210),-70);ctx.lineTo(x+side*(315+p*240),H+65);ctx.stroke();
  }
}

function libertyScreen(s) {
  const {x,groundY,t,progress:p,impact:i,amount:a,look,cast} = s;
  const hinge = groundY-118;
  const ready = ease((cast.elapsed-.30)/.28);
  const closing = ease((cast.elapsed-.87)/.16);
  const sweep = ready*(1-closing);
  const wide = 85+sweep*570+p*450;
  screenBloom(x,hinge,615,look.main,(.17+i*.47)*a);
  for (const side of [-1,1]) {
    const edge = x+side*wide;
    const gradient = ctx.createLinearGradient(x,hinge,edge,hinge-180);
    gradient.addColorStop(0,look.light+'b8');
    gradient.addColorStop(1,look.main+'09');
    ctx.fillStyle=gradient;
    ctx.globalAlpha=(.15+ready*.23+i*.32)*a;
    screenPolygon([[x,hinge+105],[x,hinge-25],[edge,-30],[edge+side*124,108]]);
    ctx.fill();
    for (let n=0;n<6;n++) {
      ctx.globalAlpha=(.09+sweep*.19+i*.36)*a;
      ctx.strokeStyle=n%3 ? look.main : look.light;
      ctx.lineWidth=n%3 ? 1.8 : 3;
      ctx.beginPath();
      ctx.moveTo(x,hinge+85-n*9);
      ctx.quadraticCurveTo(x+side*wide*.40,hinge-102,edge+side*n*54,hinge-169-n*18);
      ctx.stroke();
    }
  }
  for (let n=0;n<(lowQ()?16:42);n++) {
    const salt = screenHash(n,89), phase = (screenHash(n,90)+t*(.3+salt*.7))%1;
    const side = n%2 ? 1 : -1;
    const xx = s.beat<0 ? x+side*wide*(1-phase)**.55 : x+side*(30+p*(370+salt*470));
    const yy = hinge+(screenHash(n,92)-.62)*300+p*(salt-.68)*260;
    const span = 5+salt*16+i*6;
    ctx.fillStyle=n%4 ? look.light : look.main;
    ctx.globalAlpha=(.07+ready*.09+i*.6)*Math.sin(phase*Math.PI)*a;
    screenPolygon([[xx-span,yy-4],[xx+span*.8,yy-span],[xx+span,yy-1],[xx-span*.45,yy+7]]);
    ctx.fill();
  }
}

function timerScreen(s) {
  const {x,face,t,impact:i,amount:a,look} = s;
  const count=lowQ()?24:51;
  for(let n=0;n<count;n++){
    const start=(screenHash(n,7)*W+t*(260+n*13))%(W+660)-330;
    const yy=(n+.5)*H/count+screenHash(n,9)*21;
    const span=11+screenHash(n,8)*54;
    ctx.globalAlpha=(.10+i*.48)*a*(.5+screenHash(n,9)*.5);
    ctx.fillStyle=n%4?look.light:look.main;
    ctx.fillRect(face>0?start:W-start-span,yy,span,n%4===0?5:1.7);
  }
  const flare=i*(1-ease(s.since/.15));
  if(flare>.02)screenBloom(x,s.y-65,362,look.light,flare*.39);
}

function blackHoleScreen(s) {
  const {x,groundY,t,impact:i,amount:a,look,cast} = s;
  const strength=ease((cast.elapsed-.21)/.23)*a;
  if (strength<.01) return;
  const y=groundY-122;
  ctx.save();
  ctx.globalCompositeOperation='source-over';
  ctx.globalAlpha=strength*(.42+i*.14);
  ctx.fillStyle=look.ink;
  ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='screen';
  screenBloom(x,y,635,'#6741a8',strength*(.23+i*.40));
  for (let n=0;n<(lowQ()?22:47);n++) {
    const salt=screenHash(n,47);
    const phase=(screenHash(n,48)+t*(.69+.54*salt))%1;
    const r=108+950*(1-phase);
    const angle=n*2.39996+t*.92+phase*1.12;
    const tail=angle-.06-salt*.16, head=angle+.07;
    ctx.strokeStyle=n%4===0 ? look.light : n%2 ? look.main : '#9c6ae2';
    ctx.globalAlpha=strength*Math.sin(phase*Math.PI)*(.27+i*.57);
    ctx.lineWidth=1.5+salt*(2+i*7);
    ctx.beginPath();
    ctx.moveTo(x+Math.cos(tail)*(r+90+salt*86),y+Math.sin(tail)*(r+90+salt*86)*.62);
    ctx.quadraticCurveTo(x+Math.cos(angle)*r,y+Math.sin(angle)*r*.62,
      x+Math.cos(head)*(r-48),y+Math.sin(head)*(r-48)*.62);
    ctx.stroke();
  }
  ctx.restore();
}

function zaitoStormScreen(s) {
  const {x,groundY,face,t,progress:p,impact:i,amount:a,look}=s;
  const sky=ctx.createLinearGradient(0,92,0,groundY);
  sky.addColorStop(0,'#060413');
  sky.addColorStop(.53,'#101426');
  sky.addColorStop(1,'#3524475e');
  ctx.globalCompositeOperation='source-over';
  ctx.globalAlpha=a*.70;
  ctx.fillStyle=sky;
  ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='screen';
  screenBloom(x,groundY-83,465+p*185,look.main,(.12+i*.45)*a);
  const count=lowQ()?12:30;
  for(let n=0;n<count;n++){
    const yy=(((n+.5)*H/count+t*(32+n*3))%H)-15;
    const xx=screenHash(n,71)*W;
    const length=29+screenHash(n,72)*125;
    ctx.lineWidth=n%3===0?3.8:1.5;
    ctx.strokeStyle=n%4===0?'#bb99ff':look.main;
    ctx.globalAlpha=(.105+i*.24)*a;
    ctx.beginPath();ctx.moveTo(xx-face*length*.50,yy-length);
    ctx.lineTo(xx,yy);ctx.stroke();
  }
  for(let n=0;n<3;n++){
    const r=74+n*54+easeOut(p)*435;
    ctx.globalAlpha=(.15+i*.49)*a/(1+n*.26);
    ctx.strokeStyle=n%2?'#ab77ff':look.light;
    ctx.lineWidth=2+i*5;
    ctx.beginPath();ctx.ellipse(x,groundY,r,r*.22,0,0,TAU);ctx.stroke();
  }
}

function meaningScreen(s) {
  const {x,y,t,beat,progress:p,impact:i,amount:a,look} = s;
  for(let n=0;n<6;n++) {
    ctx.globalAlpha=(.08+i*.57)*a/(1+n*.15);
    ctx.lineWidth=2+i*4+(n%3===Math.max(0,beat)?3:0);
    ctx.strokeStyle=n%3?look.main:look.light;
    diamond(x,y-66,64+n*72+p*(240+n*31),.76,t*.14-n*.055);
    ctx.stroke();
  }
  ctx.strokeStyle=look.main;ctx.lineWidth=2;
  for(let n=0;n<19;n++){
    const xx=screenHash(n,10)*W, yy=screenHash(n,11)*H, r=8+screenHash(n,12)*16*p;
    ctx.globalAlpha=(.08+i*.51)*a;
    diamond(xx,yy,r,.83,t*.3+n);ctx.stroke();
  }
}

function lotusScreen(s) {
  ctx.save();
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#341037';ctx.globalAlpha=s.amount*.70;ctx.fillRect(0,0,W,H);
  const turn=reduced?0:Math.floor(s.t*3)%4;
  drawCinematicTile('comic-effects',12+turn,W*.5,H*.51,H*.43,H*.92,1,s.amount*(s.beat<0?.82:.27));
  ctx.restore();
  const {x,y,groundY,t,progress:p,impact:i,amount:a,look} = s;
  for(let n=0;n<7;n++) {
    const r=66+n*69+p*(320+n*20);
    ctx.strokeStyle=n%2?look.light:look.main;
    ctx.globalAlpha=(.08+i*.55)*a/(1+n*.13);
    ctx.lineWidth=2+i*(n%3===0?9:4);
    ctx.beginPath();ctx.ellipse(x,y-45,r,r*.55,0,0,TAU);ctx.stroke();
  }
  const count=lowQ()?24:52;
  for(let n=0;n<count;n++){
    const xx=(n+.5)*W/count, fringe=Math.abs(xx-W*.5)/(W*.5);
    const peak=32+screenHash(n,2)*129*(.5+i*.8);
    const height=peak*(.72+.28*Math.sin(t*10+n*.82)**2);
    ctx.globalAlpha=(.11+i*.36)*a*(.42+fringe*.58);
    ctx.fillStyle=n%3?look.main:look.light;
    const yy=groundY-height;
    screenPolygon([[xx-9,groundY+34],[xx-3,yy+18],[xx+8,yy],[xx+4,groundY+19]]);
    ctx.fill();
  }
}

function drawUltimateAftershock(s) {
  if(s.beat<0 || s.impact<.015)return;
  const {x,y,impact:i,progress:p,look,face}=s;
  const cx=x, cy=y-36;
  const front=126+easeOut(p)*610;
  const profile=AFTERSHOCKS[s.cast.visualCi]??(s.cast.plan.style==='target'?'beam':
    s.cast.plan.style==='wall'||s.cast.plan.style==='papaya'?'floor':'ring');
  ctx.save();
  ctx.globalCompositeOperation='screen';
  ctx.lineWidth=3+i*7;
  for(let k=0;k<3;k++){
    const r=front*(1-k*.18);
    ctx.strokeStyle=k===0?look.light:look.main;
    ctx.globalAlpha=i*(.49-k*.10);
    if(profile==='diamond'){
      diamond(cx,cy,r,.62,-.08);
    }else if(profile==='beam'){
      ctx.beginPath();
      ctx.moveTo(cx-face*(r+220),cy+r*.29);
      ctx.lineTo(cx+face*(r+220),cy-r*.29);
    }else{
      ctx.beginPath();
      ctx.ellipse(cx,profile==='floor'?y+15:cy,r,r*(profile==='floor'?.23:.55),0,0,TAU);
    }
    ctx.stroke();
  }
  const particles=lowQ()?20:53;
  for(let n=0;n<particles;n++){
    const ray=screenHash(n,17)*TAU;
    const salt=screenHash(n,13), radius=22+(100+570*salt)*easeOut(p);
    const dx=Math.cos(ray),dy=Math.sin(ray);
    const xx=cx+dx*radius, yy=cy+dy*radius*.67;
    const length=7+salt*21+i*16;
    if(xx<-30||xx>W+30||yy<90||yy>H+30)continue;
    ctx.globalAlpha=(.20+salt*.60)*i;
    ctx.fillStyle=n%4===0?look.light:look.main;
    screenPolygon([[xx+dx*length,yy+dy*length],[xx-dy*4,yy+dx*4],[xx+dy*5,yy-dx*5]]);
    ctx.fill();
  }
  ctx.restore();
}

const AFTERSHOCKS=['floor','ring','beam','floor','ring','diamond','floor','diamond','floor'];

function drawZaitoCarabao(s) {
  if(s?.cast.visualCi!==6||s.amount<.04||s.f.t<s.cast.intro)return;
  const {cast,amount,groundY,originX,slamX,face,beat,since}=s;
  const rise=ease((cast.elapsed-.06)/.36);
  const swing=ease((cast.elapsed-.64)/.34);
  const index=beat===1?3:cast.elapsed>=.67?2:cast.elapsed>=.37?1:0;
  const frame=cinematicFrames['zaito-effects']?.[index];
  if (!frame || rise<.01) return;
  const from=clamp(originX-98*face,125,W-125);
  const travel=index===3?slamX:lerp(from,slamX-116*face,swing);
  const spread=index===3?easeOut(since/.24):0;
  const floor=groundY+15+(1-rise)*49;
  const linger=index===3?1-ease((since-.14)/.31):1;
  const height=index===3?90-spread*24:index===2?310:307*(.70+rise*.30);
  const width=Math.min(W*.76,height*frame.w/frame.h)*(1+spread*.41);
  const angle=index===2 && !reduced ? (swing-.53)*.36 : 0;
  ctx.save();
  ctx.setTransform(RS,0,0,RS,0,0);
  if(s.copied)ctx.filter='hue-rotate(125deg)';
  if(index<3 && backstageArt.carabao){
    const step=cast.elapsed<.25?0:cast.elapsed<.40?1:swing>.92?5:2+Math.floor(cast.elapsed*12)%3;
    const chargeX=lerp(from,slamX-60*face,ease((cast.elapsed-.35)/.65));
    ctx.globalAlpha=amount*rise;
    drawBackstageSprite(ctx,'carabao',step,chargeX,floor,height,face);
  }else{
    drawCinematicTile('zaito-effects',index,travel,floor,width,height,face,
      amount*rise*linger,angle,index===2?.84:1);
  }
  ctx.restore();
}

function drawZaitoImpact(x, y, elapsed, alpha) {
  const progress=clamp(elapsed/.46,0,1);
  const intensity=(1-ease(progress))*alpha;
  if (intensity<=.01) return;
  ctx.save();
  for (let ring=0;ring<3;ring++) {
    const radius=35+easeOut(progress)*(220-ring*40);
    ctx.globalAlpha=intensity*(.68-ring*.14);
    ctx.strokeStyle=ring===0?'#f4dbff':'#ad69f5';
    ctx.lineWidth=(5-ring)*(1-progress)+1;
    ctx.beginPath();
    ctx.ellipse(x,y+ring*5,radius,radius*.22,0,0,TAU);
    ctx.stroke();
  }
  if (!reduced) {
    for (let i=0;i<10;i++) {
      const side=i%2===0?1:-1;
      const salt=screenHash(i,61);
      const dx=side*(38+salt*175)*progress;
      const peak=24+screenHash(i,62)*62;
      const dy=-4*peak*progress*(1-progress);
      ctx.globalAlpha=intensity*.8;
      ctx.fillStyle=i%3===0?'#d89a63':'#8b4d34';
      ctx.beginPath();
      ctx.ellipse(x+dx,y+dy,3+salt*7,2+salt*4,side*.37,0,TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawMeteorTrail(x,y,face,size,alpha) {
  const tailX=x-face*size*.92,tailY=y-size*2.25;
  ctx.save();
  ctx.globalAlpha=alpha;
  const trail=ctx.createLinearGradient(tailX,tailY,x,y);
  trail.addColorStop(0,'#b381ff00');
  trail.addColorStop(.62,'#8345bba0');
  trail.addColorStop(1,'#ffae56ed');
  ctx.fillStyle=trail;
  screenPolygon([[tailX,tailY],[x+size*.29,y-size*.44],[x+size*.28,y+1],
    [x-size*.32,y+7],[x-size*.35,y-size*.17]]);
  ctx.fill();
  ctx.restore();
}

function drawZaitoMeteors(s) {
  if(s?.cast.visualCi!==6||s.beat<0||s.amount<.04)return;
  const {slamX:x,groundY,face,since,beat,amount:a,cast}=s;
  const beats=cast.plan.beats;
  const flight=beats[1][0]-beats[0][0];
  const fallTime=beat===0?Math.max(0,cast.elapsed-beats[0][0]):flight+since;
  const fall=reduced?1:clamp(fallTime/flight,0,1);
  const mainY=lerp(-152,groundY-34,fall*fall);
  const mainX=x-face*220*(1-fall);
  const linger=beat===0?1:1-ease((since-.115)/.31);
  ctx.save();
  ctx.setTransform(RS,0,0,RS,0,0);
  if(s.copied)ctx.filter='hue-rotate(125deg)';
  ctx.globalCompositeOperation='source-over';
  const count=lowQ()?7:15;
  for(let n=0;n<count;n++){
    const salt=screenHash(n,65), timing=screenHash(n,67);
    const total=.32+timing*.42;
    const start=screenHash(n,68)*.24-.14;
    const progress=reduced?.82:clamp((fallTime-start)/total,0,1);
    const endX=(n+.6)*W/count;
    const size=34+salt*61;
    const xx=endX-face*(1-progress)*(54+salt*189);
    const yy=lerp(-size*1.5,groundY-size*.27,progress*progress);
    const alpha=a*(1-ease((fallTime-start-total)/.18));
    if(progress<=0||alpha<.02)continue;
    drawMeteorTrail(xx,yy,face,size,alpha*.63);
    const frame=progress<.54?0:progress<.97?1:2;
    drawCinematicTile('zaito-effects',4+frame,xx,yy,size*1.15,size*.94,frame===1?-face:face,alpha,
      reduced?0:progress*.20);
  }
  if (linger>.015) {
    if (beat===0) {
      const size=192+fall*94;
      drawMeteorTrail(mainX,mainY,face,size,a*linger);
      drawCinematicTile('zaito-effects',5,mainX,mainY,size*1.33,size,-face,a*linger,
        reduced?0:fall*.18);
    } else {
      drawZaitoImpact(x,groundY+10,since,a);
      drawCinematicTile('zaito-effects',since<.19?6:7,x,groundY+21,322+easeOut(since/.25)*96,165,
        face,a*linger,0,.97);
    }
  }
  ctx.restore();
}

function zaitoShadowStrength(f) {
  if(f.ci!==6 || f.st!=='sp' || !f.ultimate)return 0;
  const {elapsed}=f.ultimate;
  return ease(elapsed/.27)*(1-ease((elapsed-1.35)/.47));
}

function drawUltimateBackdrop(s) {
  if(!s || s.amount<=0)return;
  const {x,y,amount:a,impact:i,progress:p,look} = s;
  ctx.save();
  ctx.setTransform(RS,0,0,RS,0,0);
  ctx.globalAlpha=(reduced?.27:.56)*a;
  ctx.fillStyle=look.ink;
  ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='screen';
  screenBloom(W/2,H*.49,630+p*280,look.main,(.25+i*.50)*a*(reduced?.57:1));
  if(!reduced&&s.f.t>=s.cast.intro){
    ctx.save();
    if(s.copied)ctx.filter='hue-rotate(125deg)';
    look.draw(s.copied?{...s,look:SUPER_LOOKS[s.cast.visualCi]??SIGNATURE_LOOKS[s.cast.plan.style]??look}:s);
    ctx.restore();
    drawUltimateAftershock(s);
  }
  if(s.f.t>=s.cast.intro)drawUltimateCutIn(s);
  ctx.restore();
}

function drawUltimateEdges(s) {
  if(!s || s.amount<=0)return;
  const {x,y,amount:a,impact:i,progress:p,look} = s;
  ctx.save();
  // The vignette leaves the middle and UI areas readable even at the peak.
  const grade=ctx.createRadialGradient(x,y-32,92,W/2,H*.51,W*.64);
  grade.addColorStop(0,'#00000000');
  grade.addColorStop(.37,look.main+'20');
  grade.addColorStop(1,look.main+'ea');
  ctx.fillStyle=grade;
  ctx.globalCompositeOperation='screen';
  ctx.globalAlpha=(.41+i*.47)*a*(reduced?.66:1);
  ctx.fillRect(0,0,W,H);
  if(!reduced){
    ctx.globalCompositeOperation='source-over';
    ctx.globalAlpha=a*.83;
    ctx.fillStyle='#0b0810';
    ctx.fillRect(0,0,W,5);
    ctx.fillRect(0,H-5,W,5);
    ctx.globalCompositeOperation='screen';
    const count=lowQ()?18:43;
    for(let n=0;n<count;n++){
      const angle=screenHash(n,7)*TAU;
      const radius=225+screenHash(n,4)*495+p*(100+screenHash(n,2)*205);
      const spread=.39+screenHash(n,1)*.36;
      const xx=x+Math.cos(angle)*radius, yy=y-50+Math.sin(angle)*radius*spread;
      const length=3+screenHash(n,8)*17+i*20;
      if(xx<0 || xx>W || yy<53 || yy>H-19)continue;
      ctx.globalAlpha=(.13+i*.46)*a*(.38+screenHash(n,0)*.62);
      ctx.strokeStyle=n%3===0?look.main:look.light;
      ctx.lineWidth=n%3===0?2.4:1.2;
      ctx.beginPath();
      ctx.moveTo(xx,yy);
      ctx.lineTo(xx+Math.cos(angle)*length,yy+Math.sin(angle)*length*spread);
      ctx.stroke();
    }
  }
  ctx.restore();
}
