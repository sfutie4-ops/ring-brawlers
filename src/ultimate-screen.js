// One screen treatment at a time. World hitboxes and damage live in ultimates.js.
const SUPER_LOOKS = [
  {ink:'#211020', main:'#ffb52f', light:'#fff2a3', draw:crownScreen},
  {ink:'#140d3d', main:'#9961ff', light:'#ecc9ff', draw:illusionScreen},
  {ink:'#290815', main:'#f53952', light:'#ffd0b5', draw:angleScreen},
  {ink:'#071b1d', main:'#46dbb0', light:'#ffe199', draw:libertyScreen},
  {ink:'#02192e', main:'#1abfff', light:'#b5f7ff', draw:timerScreen},
  {ink:'#110722', main:'#87ec4e', light:'#e4ffc5', draw:blackHoleScreen},
  {ink:'#090717', main:'#47996d', light:'#c8ffe0', draw:zaitoStormScreen},
  {ink:'#071449', main:'#537cfc', light:'#c0dcff', draw:meaningScreen},
  {ink:'#260b32', main:'#f644a8', light:'#ffc2eb', draw:crowdScreen}
];
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
  const plan = ULTIMATE_PLANS[s.f.ci];
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
  const slamX=plan.response ? clamp(projectX(ultimateBeatX(plan,s.cast,plan.beats[1],1,s.f)),100,W-100) : null;
  return {
    x:clamp(px,100,W-100),y:clamp(py,H*.39,H*.87),face:s.cast.face,
    f:s.f,cast:s.cast,groundY,originX,slamX,t:s.age,since:s.since,beat:s.beat,progress,impact,amount,look:SUPER_LOOKS[s.f.ci]
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

function illusionScreen(s) {
  const {x,y,face,t,progress:p,impact:i,amount:a,look} = s;
  ctx.save();
  ctx.translate(x,y-90);
  ctx.scale(face,1);
  for(let n=0;n<9;n++) {
    const distance=(n+1)*78+((p*150+t*54)%76);
    const wide=70+distance*.54;
    ctx.globalAlpha=(.13+i*.42)*a/(1+n*.13);
    ctx.strokeStyle=n%2===0?look.light:look.main;
    ctx.lineWidth=n%3===0?3:1.3;
    screenPolygon([[-distance,-wide],[-distance+wide*.46,-wide*.66],
      [-distance+wide*.46,wide*.66],[-distance,wide],[-distance-wide*.32,wide*.59],[-distance-wide*.32,-wide*.59]]);
    ctx.stroke();
  }
  ctx.restore();
  for(let n=0;n<(lowQ()?14:32);n++){
    const side=n%2?1:-1, off=screenHash(n,2), y0=screenHash(n,3)*H;
    const xx=x+side*(115+off*420+p*200);
    const yy=y0+i*side*45;
    ctx.fillStyle=n%3?look.main:look.light;
    ctx.globalAlpha=(.11+i*.50)*a*(.55+off*.45);
    screenPolygon([[xx,yy-28-off*38],[xx+side*(18+off*35),yy],[xx-side*5,yy+34*off]]);
    ctx.fill();
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
  const {x,face,t,beat,progress:p,impact:i,amount:a,look} = s;
  const count=lowQ()?18:30;
  for(let n=0;n<count;n++){
    const start=(screenHash(n,7)*W+t*(260+n*13))%(W+660)-330;
    const yy=(n+.5)*H/count;
    const span=230+screenHash(n,8)*570+p*160;
    ctx.globalAlpha=(.045+i*.37)*a*(.5+screenHash(n,9)*.5);
    ctx.fillStyle=n%4?look.main:look.light;
    ctx.fillRect(face>0?start:W-start-span,yy,span,n%4===0?5:1.7);
  }
  for(let n=0;n<4;n++){
    const yy=H*(.20+n*.165)+(beat%3)*18;
    const wave=face>0?-W+easeOut(p)*W*1.7:W*2-easeOut(p)*W*1.7;
    ctx.globalAlpha=(.09+i*.51)*a;
    ctx.strokeStyle=n%2?look.main:look.light;
    ctx.lineWidth=1.5+i*5;
    ctx.beginPath();ctx.moveTo(wave-550,yy+26);ctx.lineTo(wave+650,yy-26);ctx.stroke();
    ctx.globalAlpha=(.06+i*.24)*a;
    ctx.beginPath();ctx.ellipse(clamp(x+face*280,125,W-125),yy,295+p*180,8,0,0,TAU);ctx.stroke();
  }
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

function crowdScreen(s) {
  const {x,y,t,progress:p,impact:i,amount:a,look} = s;
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
    const peak=28+screenHash(n,2)*126*(.5+i*.8);
    const height=peak*(.61+.39*Math.sin(t*12+n*.82)**2);
    ctx.globalAlpha=(.11+i*.36)*a*(.42+fringe*.58);
    ctx.fillStyle=n%3?look.main:look.light;
    ctx.fillRect(xx,H-height,Math.max(3,W/count-4),height);
    ctx.fillRect(xx,0,Math.max(3,W/count-4),height*.4);
  }
}

function drawUltimateAftershock(s) {
  if(s.beat<0 || s.impact<.015)return;
  const {x,y,impact:i,progress:p,look,face}=s;
  const cx=x, cy=y-36;
  const front=126+easeOut(p)*610;
  const profile=AFTERSHOCKS[s.f.ci];
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

const AFTERSHOCKS=['floor','beam','diamond','floor','beam','diamond','floor','diamond','ring'];

function gagShadowPath() {
  ctx.beginPath();
  ctx.moveTo(-25,-288);
  ctx.bezierCurveTo(-25,-341,59,-347,64,-288);
  ctx.bezierCurveTo(70,-235,66,-167,64,-108);
  ctx.bezierCurveTo(130,-130,152,-51,108,-17);
  ctx.bezierCurveTo(76,10,42,0,10,-11);
  ctx.bezierCurveTo(-30,7,-80,5,-105,-24);
  ctx.bezierCurveTo(-136,-69,-91,-131,-30,-109);
  ctx.bezierCurveTo(-29,-182,-25,-235,-25,-288);
  ctx.closePath();
}

function drawZaitoShadow(s) {
  if (s?.f.ci!==6 || s.amount<.04) return;
  const {cast,amount,groundY,originX,slamX,face,beat,since}=s;
  const rise=ease((cast.elapsed-.06)/.36);
  const swing=ease((cast.elapsed-.57)/.41);
  const actorX=clamp(originX-85*face,124,W-124);
  const floor=groundY+13+(1-rise)*85;
  const squash=beat===1 ? ease(since/.10) : 0;
  const scale=(.68+rise*.43)*(1-.12*squash);
  const linger=beat<1 ? 1 : 1-ease((since-.08)/.27);
  const angle=swing*(reduced?.95:1.53);
  const travel=lerp(actorX,slamX-face*(reduced?145:233),swing);
  ctx.save();
  ctx.setTransform(RS,0,0,RS,0,0);
  ctx.globalCompositeOperation='source-over';
  if (swing>.08 && !reduced && beat<1) {
    for (let i=3;i>=1;i--) {
      ctx.save();
      ctx.translate(travel,floor);
      ctx.scale(face*scale,scale);
      ctx.rotate(Math.max(0,angle-i*.115));
      ctx.globalAlpha=amount*rise*.08/(i*.6);
      gagShadowPath();ctx.fillStyle='#b17eff';ctx.fill();
      ctx.restore();
    }
  }
  ctx.translate(travel,floor);
  ctx.scale(face*scale,scale*(1-.56*squash));
  ctx.rotate(angle);
  ctx.globalAlpha=rise*amount*linger*.93;
  gagShadowPath();
  ctx.fillStyle='#090612';ctx.fill();
  ctx.lineWidth=3.5;ctx.strokeStyle='#b392ff';ctx.stroke();
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
  if(s?.f.ci!==6 || s.beat<0 || s.amount<.04)return;
  const {slamX:x,groundY,face,since,beat,amount:a,cast}=s;
  const beats=ULTIMATE_PLANS[6].beats;
  const flight=beats[1][0]-beats[0][0];
  const fallTime=beat===0?Math.max(0,cast.elapsed-beats[0][0]):flight+since;
  const fall=reduced?1:clamp(fallTime/flight,0,1);
  const mainY=lerp(-152,groundY-34,fall*fall);
  const mainX=x-face*220*(1-fall);
  const linger=beat===0?1:1-ease((since-.115)/.31);
  ctx.save();
  ctx.setTransform(RS,0,0,RS,0,0);
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
    drawCinematicTile('poop-meteors',frame,xx,yy,size*1.15,size*.94,frame===1?-face:face,alpha,
      reduced?0:progress*.20);
  }
  if (linger>.015) {
    if (beat===0) {
      const size=148+fall*48;
      drawMeteorTrail(mainX,mainY,face,size,a*linger);
      drawCinematicTile('poop-meteors',1,mainX,mainY,size*1.33,size,-face,a*linger,
        reduced?0:fall*.18);
    } else {
      drawCinematicTile('poop-meteors',since<.19?2:3,x,groundY+21,322+easeOut(since/.25)*96,165,
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
  ctx.globalAlpha=(reduced?.27:.45)*a;
  ctx.fillStyle=look.ink;
  ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='screen';
  screenBloom(x,y-34,540+p*245,look.main,(.19+i*.49)*a*(reduced?.57:1));
  if(!reduced){look.draw(s);drawUltimateAftershock(s)}
  drawUltimateCutIn(s);
  ctx.restore();
}

function drawUltimateEdges(s) {
  if(!s || s.amount<=0)return;
  const {x,y,amount:a,impact:i,progress:p,look} = s;
  ctx.save();
  // The vignette leaves the middle and UI areas readable even at the peak.
  const grade=ctx.createRadialGradient(x,y-32,92,W/2,H*.51,W*.64);
  grade.addColorStop(0,'#00000000');
  grade.addColorStop(.53,'#00000000');
  grade.addColorStop(1,look.main+'d0');
  ctx.fillStyle=grade;
  ctx.globalCompositeOperation='screen';
  ctx.globalAlpha=(.31+i*.47)*a*(reduced?.66:1);
  ctx.fillRect(0,0,W,H);
  if(!reduced){
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
