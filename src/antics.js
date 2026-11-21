// Cutscenes own presentation while the match simulation is suspended.
const FIGHTER = {LOONIE:0, ABRA:1, SHEHYEE:2, BATAS:3, SMUGGLAZ:4, AKLAS:5, ZAITO:6, APEKZ:7, SINIO:8};
const anticArt = {};
let antic = null;
let lastAntic = null;
let bonusAntics = false;
let prankPlayed = false;
let rivalryPlayed = false;
let resultAwarded = false;
let pendingFinale = [];

async function loadAnticArt() {
  for (const [name, [source, columns, cell, frames]] of Object.entries(ANTIC_ART)) {
    const im = anticArt[name]?.im ?? await loadImage(source);
    anticArt[name] = {im, columns, cell, frames};
  }
}

function resetAntics() {
  antic = lastAntic = null;
  prankPlayed = rivalryPlayed = resultAwarded = false;
  pendingFinale = [];
  bonusAntics = $('bonusAntics').checked === true;
  $('sceneControls').hidden = true;
  $('replayLastScene').hidden = true;
}

function beginAntic(clip, done) {
  antic = {clip, done, tick:0, cue:0};
  if(clip.kind!=='postBattle'||!lastAntic||lastAntic.event==='match_start'||lastAntic.kind==='duel')lastAntic = clip;
  phase = 'antic';
  hitstop = 0;
  resetUltimateScreen();
  clearInput();
  $('sceneControls').hidden = false;
  $('sceneTitle').textContent = clip.title;
}

function endAntic() {
  if (!antic) return;
  const {done} = antic;
  antic = null;
  $('sceneControls').hidden = true;
  clearInput();
  done();
}

function replayAntic() {
  if (antic) {
    antic.tick = antic.cue = 0;
    return;
  }
  if (!lastAntic) return;
  const previous = {phase, pt, paused, hitstop, screen:superScreen};
  if (!(phase === 'end' || paused)) return;
  $('result').style.display = 'none';
  $('pauseScreen').style.display = 'none';
  paused = false;
  beginAntic(lastAntic, () => {
    ({phase,pt,paused,hitstop,screen:superScreen}=previous);
    $('result').style.display = phase === 'end' ? 'flex' : 'none';
    $('pauseScreen').style.display = paused ? 'flex' : 'none';
  });
}

function updateAntic(dt) {
  const {clip} = antic;
  antic.tick += dt;
  const cue = (clip.cues || [1.0,2.7,4.1])[antic.cue];
  if (antic.tick >= cue) {
    const frequency = antic.cue === 1 ? 400 : 760;
    tone(frequency,.13,'triangle',.12);
    noise(.08,antic.cue===1?710:1570,.07,.22,'bandpass',2);
    antic.cue++;
  }
  if (antic.tick >= clip.duration) endAntic();
}

function anticFrames(name, indices, elapsed, fps=9, loop=true) {
  const i=Math.max(0,Math.floor(elapsed*fps));
  return indices[loop?i%indices.length:Math.min(i,indices.length-1)];
}

function anticTile(name, frame, x, y, size, {face=1,alpha=1,angle=0,sx=1,sy=1,ground=false}={}) {
  const art=anticArt[name];
  if (!art || alpha<=0) return;
  const {im,columns,cell,frames}=art;
  const placement=frames?.[frame];
  if(frames&&!placement)return;
  const [left,top,w,h,ax,cellFloor,feet]=placement??
    [(frame%columns)*cell,Math.floor(frame/columns)*cell,cell,cell,cell/2,cell,cell];
  drawSprite({im,x:left,y:top,w,h,ax,ay:ground?feet:cellFloor,scale:size/cell},
    x,y,face,alpha,false,sx,sy,angle);
}

function drawReaction(actor,emotion,x,t,{lift=0,face=actor.face,size=176,crown=true}={}){
  const state={shock:'hit',laugh:'win',confused:'block',cheer:'win',recover:'idle'}[emotion];
  const elapsed=Math.max(0,t),frame=sceneBody(actor.ci,state,elapsed);
  const fit=size/standingHeight(actor.ci);
  const bob=reduced?0:emotion==='laugh'?Math.abs(Math.sin(elapsed*12))*3:0;
  const recoil=reduced||emotion!=='shock'?0:Math.sin(elapsed*14)*Math.exp(-elapsed*4)*.07;
  drawSprite(frame,x,GY-lift-bob,face,1,false,fit,fit,-recoil);
  const head=crownPosition(frame,x,GY-lift-bob,face,fit,fit,-recoil);
  if(actor.ci===FIGHTER.LOONIE&&crown){
    const seat=crownPosition(frame,x,GY-lift-bob,face,fit,fit,-recoil,22);
    drawLoonieCrown(...seat,face,-recoil,size*.24);
  }
  return head;
}

const CROWN_REVEAL_TIME=.62;

function drawRoyalCrowns(count,x,y,time,rumble=0,drop=0,size=61) {
  const crownFrames=[0,1,2,3,4,5,6,7];
  for (let i=0;i<count;i++) {
    const clock=time+i*.33;
    const arc=reduced?0:Math.sin(clock*5.6)*6;
    const hit=reduced?-36*Number(rumble>0):-Math.sin(Math.PI*rumble)*61;
    const shake=reduced?0:Math.sin(rumble*57)*Math.sin(Math.PI*rumble);
    const squeeze=reduced?0:Math.cos(clock*5.6)*.085;
    const frame=anticFrames('crowns',crownFrames,reduced?0:clock,8);
    anticTile('crowns',frame,x+shake*9+(count===2?(i===0?-19:21):0),y+arc+hit-drop-(i?13:0),count===2?size*.80:size,
      {angle:(i?.2:-.05)+shake*.3,sx:1+squeeze,sy:1-squeeze});
  }
}

function crownPosition(frame,x,y,face,sx=1,stretch=1,angle=0,lift=0){
  const ax=((frame.crownAnchor?.[0]??frame.ax)-frame.ax)*frame.scale;
  const ay=((frame.crownAnchor?.[1]??5)-lift-frame.ay)*frame.scale;
  const c=Math.cos(angle),s=Math.sin(angle);
  const headX=x+face*sx*(ax*c-ay*s);
  const headY=y+stretch*(ax*s+ay*c)+3;
  return [headX,headY];
}

function drawLoonieCrown(x,y,face,angle=0,width=43){
  const crown=backstageArt.looniecrown?.[0];
  if(crown)drawSprite(crown,x,y,face,1,false,width,width,angle);
  else drawRoyalCrowns(1,x,y,0,0,0,width);
}

function drawCombatCrown(f,x,y,frame,stretch,sx=1,angle=0) {
  const loonie=f.ci===FIGHTER.LOONIE;
  const batasWon=f.ci===FIGHTER.BATAS&&f.st==='win'&&f.wins>0;
  if (!loonie&&!batasWon) return;
  if(loonie){
    if(phase==='ko'&&f.st==='down')return;
    const [cx,cy]=crownPosition(frame,x,y,f.face,sx,stretch,angle,22);
    const rumble=reduced?0:Math.sin((CROWN_REVEAL_TIME-f.crownHit)*42)*Math.min(1,f.crownHit*2.4);
    drawLoonieCrown(cx+rumble*2,cy,f.face,angle+rumble*.12);
  }else{
    drawRoyalCrowns(2,...crownPosition(frame,x,y,f.face,sx,stretch,angle),vclock+f.ci*.15);
  }
}

function royalIntro() {
  if (rivalryPlayed || !pairIs(FIGHTER.LOONIE,FIGHTER.BATAS)) return false;
  rivalryPlayed=true;
  const batas=P1.ci===FIGHTER.BATAS?P1:P2;
  const loonie=batas===P1?P2:P1;
  beginAntic({kind:'duel',title:'BATAS CALLS OUT LOONIE',duration:4.9,lead:batas,other:loonie,cues:[.7,2.1,3.7]}, resumeRoundIntro);
  return true;
}

function pairIs(a,b) {
  return (P1.ci===a && P2.ci===b) || (P1.ci===b && P2.ci===a);
}

function maybeHPPrank() {
  if (!bonusAntics || prankPlayed || !pairIs(FIGHTER.SHEHYEE,FIGHTER.SINIO)) return false;
  const shehyee=P1.ci===FIGHTER.SHEHYEE?P1:P2;
  const sinio=shehyee===P1?P2:P1;
  if (sinio.hp>0 || shehyee.hp<=0 || timer<=0) return false;
  prankPlayed=true;
  beginAntic({kind:'prank',title:'SHEHYEE WINS!',duration:6.6,lead:shehyee,other:sinio,cues:[1.1,2.4,4.5]}, () => {
    // The gag HUD is drawn separately. The bonus rematch resumes at a sliver of HP.
    sinio.hp=sinio.shownHP=MAX_HP*.15;
    shehyee.shownHP=shehyee.hp;
    for(const f of [P1,P2]) {
      Object.assign(f,tacticsState(),{st:'idle',t:0,air:0,vy:0,vx:0,inv:.3,ultimate:null,slow:0,combo:0,comboTime:0,hitGlow:0});
    }
    shots=[];swooshes=[];effects=[];
    phase='fight';pt=0;
    setMsg('KEEP FIGHTING!');
  });
  return true;
}

function finaleClips(winner,loser) {
  const clip=(kind,title,duration)=>({kind,title,duration,lead:winner,other:loser});
  const wins={
    [FIGHTER.LOONIE]:['praise','KING OF RHYMES',4.0],
    [FIGHTER.ABRA]:['magician','THE VANISHING ACT',4.3],
    [FIGHTER.BATAS]:['doubleCrown','DOUBLE CROWN',3.5],
    [FIGHTER.AKLAS]:['ufo','AKLAS HAS LEFT THE PLANET',5.8],
    [FIGHTER.SMUGGLAZ]:['turtle','TURTLE SURPRISE',5.3],
    [FIGHTER.APEKZ]:['rose','APEKZ HAS A SURPRISE',4.6]
  };
  const scenes=[];
  if(winner.ci===FIGHTER.LOONIE && loser.ci===FIGHTER.ZAITO) scenes.push(clip('batok','ANYGMA HAS A WORD',5.4));
  else if(wins[winner.ci]) scenes.push(clip(...wins[winner.ci]));
  if(loser.ci===FIGHTER.APEKZ) scenes.push(clip('push','EXIT, STAGE RIGHT',4.4));
  if(loser.ci===FIGHTER.LOONIE)scenes.push({...clip('looniePilot','ALIEN ON THE LOOSE',3.8),cues:[.45,1.34,2.42]});
  if([winner.ci,loser.ci].includes(FIGHTER.ZAITO)){
    scenes.push({...clip('loloPickpocket','LOLO, ANO ’YAN?',3.85),cues:[1.17,1.61,2.84]});
  }
  return scenes;
}

function completeMatch() {
  const winner=P1.wins?P1:P2.wins?P2:null;
  const won=winner===P1;
  if (!resultAwarded) {
    resultAwarded=true;
    if (won && !bonusAntics) {
      const wins=store.get('localWins',{})||{};
      wins[P1.ci]=(wins[P1.ci]||0)+1;
      store.set('localWins',wins);
    }
    if(won){confettiT=2.6;buzz([30,60,30,60,90])}
  }
  phase='end';
  showCompleteResult(winner);
  $('resultTitle').textContent=won?'VICTORY':winner?'DEFEATED':'DRAW';
  $('resultTitle').style.color=winner&&!won?'#ff7982':'#f5be58';
  fillResult(won);
  $('resultMode').textContent=bonusAntics?'Bonus Antics':'';
  $('resultMode').hidden=!bonusAntics;
  $('replayResultScene').hidden=!lastAntic;
  $('result').style.display='flex';
  clearInput();
  $('rematch').focus?.();
}

function endAfterFinale() {
  const next=pendingFinale.shift();
  if(next) beginAntic(next,endAfterFinale);
  else completeMatch();
}

const postBattleLines={
  Loonie:['May encore pa!','Balikan ko ’yang linya.'],
  Abra:['And... vanish!','Nagkamali ng spell.'],
  Shehyee:['May resibo ako.','I-edit natin ’yan.'],
  Batas:['Case closed.','Mag-aapela ako.'],
  Smugglaz:['Bilis lang, ’di ba?','Masyadong maaga ’yung finish.'],
  Aklas:['Earth, ako muna!','Signal lost.'],
  Zaito:['Biglaan lang ’yon!','Wait, may punchline pa!'],
  Apekz:['Sakto ang timing!','Nauna ka lang.'],
  Sinio:['Tawa muna tayo!','Ako naman ang punchline?'],
  Dello:['May rebuttal pa ako!','Naubusan ng sagot.'],
  'Tipsy D':['Sakto sa beat!','Na-offbeat ako.'],
  BLKD:['Tama ang sukat.','Ire-revise ko ’yung plano.'],
  Badang:['Papaya break!','Laglag ang papaya.'],
  Target:['Bullseye.','Mintis this time.']
};

function drawPostBattle({lead,other},t,x,y){
  const winnerLine=postBattleLines[CH[lead.ci].name]?.[0]??'Salamat!';
  const loserLine=postBattleLines[CH[other.ci].name]?.[1]??'Bawi ako.';
  const celebrate=t>.35,answer=t>1.35;
  const head=drawReaction(lead,celebrate?'cheer':'recover',x,t-.35,{size:182});
  drawReaction(other,answer?'confused':t>.35?'shock':'recover',y,t-.35,
    {size:176,crown:other.ci!==FIGHTER.LOONIE});
  if(lead.ci===FIGHTER.BATAS&&celebrate)drawRoyalCrowns(2,...head,t);
  if(t>.48&&t<1.73)drawPostBattleLine(winnerLine,x,COL[lead.ci]);
  if(answer)drawPostBattleLine(loserLine,y,COL[other.ci]);
}

function drawPostBattleLine(line,x,color){
  ctx.save();
  ctx.font='800 17px Arial,sans-serif';
  const width=ctx.measureText(line).width+30;
  ctx.beginPath();ctx.roundRect(x-width/2,GY-245,width,34,7);
  ctx.fillStyle='#111321';ctx.fill();
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
  text(line,x,GY-222,17,'#fff4dc');
  ctx.restore();
}

function startFinale() {
  const winner=P1.wins?P1:P2.wins?P2:null;
  if(!winner){completeMatch();return}
  const loser=winner===P1?P2:P1;
  pendingFinale=finaleClips(winner,loser);
  if(CH[winner.ci].id==='badang'){
    pendingFinale.push({kind:'badangWin',title:'BADANG WINS',duration:2.65,lead:winner,other:loser,
      cues:[.44,1.72]});
  }else{
    const clip=featuredClip('match_end',winner,loser);
    if(clip)pendingFinale.unshift(clip);
  }
  pendingFinale.push({kind:'postBattle',title:'POST-BATTLE',duration:2.85,lead:winner,other:loser,cues:[.4,1.36]});
  endAfterFinale();
}

function refereeWalk(x, face, t, seconds, donePose) {
  anticTile('anygma',t<seconds?anticFrames('anygma',[0,1],t,8):donePose,x,GY,164,{face,ground:true});
}

function drawDuel(lead,other,t,x,y) {
  const walk=easeOut(clamp(t/1.6,0,1));
  const bx=x-lead.face*(170*(1-walk));
  const pose=t<1.65?anticFrames('duel',[0,1],t,6):t<2.45?2:3;
  if(t>1.9&&t<2.85)anticTile('crowns',15,bx-73,GY-100,270,{alpha:.68*(1-clamp((t-2.05)/.8,0,1))});
  drawSprite(CH[lead.ci].frames[[1,2,16,26][pose]],bx,GY,lead.face);
  drawReaction(other,t<1.7?'recover':'confused',y,t,{size:172});
}

function drawBatasVictory({lead,other},t,x,y) {
  drawReaction(other,t<.8?'recover':'confused',y,t);
  const winner=revisedFighterFrame(lead.ci,'win',t,lead);
  drawSprite(winner,x,GY,lead.face);
  const drop=reduced?0:95*(1-easeOut(t/.53));
  drawRoyalCrowns(2,...crownPosition(winner,x,GY,lead.face),t,0,drop);
}

function drawRoyalVictory(clip,t,x,y,batok=false) {
  const {lead,other}=clip;
  drawReaction(lead,batok&&t>2.8?'laugh':'cheer',x,t,{size:180});
  if(t>.26&&t<3.0) {
    for(let i=0;i<4;i++)anticTile('crowns',i%2?10:8,x+(i-1.5)*59,GY-90-(t*.6+i*.08)%1*130,43,
      {alpha:Math.min(1,3.1-t),angle:i*.12+t*.18});
  }
  if(!batok){
    const praise=other.ci===FIGHTER.BATAS?'confused':t<.65?'recover':t<2.5?'cheer':'laugh';
    drawReaction(other,praise,y,t,{size:176});
    return;
  }
  const close=easeOut(clamp(t/1.8,0,1)),retreat=clamp((t-4.05)/1.1,0,1);
  const rx=y-other.face*(52+183*(1-close)+220*retreat);
  const frame=t<1.8||t>=4.1?anticFrames('anygma',[0,1],t,8):t<2.4?2:t<2.75?4:t<3?5:6;
  if(t<1.0)drawSprite(selectFrame(other),y,GY,other.face);
  else drawReaction(other,t<2.72?'confused':t<3.36?'shock':'recover',y,t-2.72,{size:t<2.72?146:168});
  refereeWalk(rx,retreat>.05?-other.face:other.face,t,0,frame);
  if(t>=2.72&&t<3.25)anticTile('crowns',t<2.93?9:8,y+14,GY-154,65,{angle:t*2});
}

function drawAbraVictory(clip,t,x,y) {
  drawReaction(clip.other,t<2.2?'confused':'shock',y,t);
  if(t<1.6)anticTile('abra',t<.42?14:3,x,GY,179,{face:clip.lead.face,ground:true});
  else if(t<2.25)anticTile('abra',12,x,GY,185,{face:clip.lead.face,ground:true});
  else if(t<3.2)anticTile('abra',anticFrames('abra',[4,5,4,6],t-2.25,9),x,GY,112+Math.sin(t*20)*5,{ground:true});
  else anticTile('abra',t<3.75?13:2,x,GY,180,{face:clip.lead.face,ground:true});
  if(t>.45&&t<2.55)anticTile('abra',t<1.6?11:9,x+56,GY-76,138,{angle:(t-1)*.5,alpha:1-clamp((t-2.2)/.35,0,1)});
}

function drawUFOVictory(clip,t,x,y) {
  const lift=ease(clamp((t-2.5)/1.5,0,1));
  const depart=ease(clamp((t-4.2)/.7,0,1));
  const flyX=lerp(W+180,x,easeOut(clamp((t-1.1)/1.18,0,1)))+depart*560;
  const flyY=249-depart*170;
  const frame=t<2.45?anticFrames('ufo',[0,1,2,1],t,8):t<3.7?4:t<4.26?5:6;
  drawReaction(clip.other,t>1.3?'shock':'confused',y,t);
  if(t>=1.1&&t<4.95)anticTile('ufo',frame,flyX,flyY+(frame===4?125:0),238,
    {angle:t>=3.65&&t<4.28&&!reduced?Math.sin(t*34)*.05:0});
  if(t<4.05) {
    const pose=t<1.2?anticFrames('aklas',[0,1,2,1],t,7):t<2.52?3:anticFrames('aklas',[4,5,4,6],t,7);
    const scale=1-lift*.46;
    drawSprite(CH[clip.lead.ci].frames[[0,22,23,27,25,26,6][pose]],x,GY-lift*246,clip.lead.face,
      t<3.82?1:1-ease((t-3.82)/.23),false,scale,scale);
  }
  if(t>=4.8)anticTile('crowns',8,x+212,128,68,{alpha:1-ease((t-4.8)/1.0)});
}

function drawTurtleVictory(clip,t,x,y) {
  const direction=Math.sign(y-x);
  drawReaction(clip.lead,t<2.4?'cheer':'laugh',x,t);
  drawReaction(clip.other,t<1.45?'shock':t<2.6?'confused':'laugh',y,t);
  if(t<.23)return;
  const drop=ease(clamp((t-.45)/1.15,0,1));
  const slide=ease(clamp((t-4.17)/1.12,0,1));
  const hop=easeOut(clamp((t-2.35)/.65,0,1));
  const pose=t<1.47?anticFrames('turtle',[0,1],t,7):t<1.78?2:t<2.05?3:t<2.4?4:t<2.78?5:t<4.12?6:7;
  ctx.fillStyle='#0c1619aa';
  ctx.beginPath();ctx.ellipse(y,GY-3,17+drop*40,8,0,0,TAU);ctx.fill();
  anticTile('turtle',pose,y+direction*(21+hop*105+slide*196),lerp(-10,GY-56,drop)+hop*54-Math.sin(hop*Math.PI)*30,174,
    {face:direction,ground:true,angle:t<1.47?(1-drop)*-.36:0,sy:pose===6?1+Math.sin(t*17)*.05:1});
}

function drawApekzScene(clip,t,x,y,rose) {
  const apekz=rose?clip.lead:clip.other;
  const ax=rose?x:y;
  const other=rose?clip.other:clip.lead;
  const face=apekz.face;
  const away=apekz===clip.lead?-face:Math.sign(y-W/2);
  const run=ease(clamp((t-2.03)/.6,0,1));
  const wrap=lerp(ax,away<0?-111:W+111,run);
  const rx=ax-face*(53+157*(1-easeOut(clamp(t/1.23,0,1))));
  drawReaction(other,rose?'cheer':'confused',rose?y:x,t);
  if(rose){
    const pose=t<.8?3:t<1.3?4:t<1.7?5:t<2.72?6:7;
    anticTile('apekz',pose,ax,GY,176,{face:-face,ground:true,sy:pose===7?1+Math.sin(t*13)*.025:1});
    refereeWalk(rx,face,t,1.1,t<2.58?9:10);
  }else{
    if(t<3.05)anticTile('apekz',t<2.03?1:0,wrap,GY,173,{face:-away,ground:true});
    if(t>=3.1&&t<3.85)anticTile('apekz',2,away<0?32:W-33,GY,151,{face:-away,ground:true});
    refereeWalk(ax-away*(55+154*(1-easeOut(clamp(t/1.25,0,1)))),away,t,1.25,t<1.65?2:t<2.03?3:t<2.65?8:3);
  }
}

function drawPrank(clip,t,x,y) {
  const flipped=t>=2.42 && t<5.5;
  const sp=t<1.3?0:t<2.55?0:t<4.2?1:t<5.17?2:3;
  anticTile('prank',sp,x,GY,176,{face:clip.lead.face,ground:true,sx:sp===1?1+Math.sin(t*26)*.035:1});
  if(t<2.43) drawSprite(selectFrame(clip.other),y,GY,clip.other.face);
  else anticTile('prank',t<3.4?4:5,y,GY,176,{face:clip.other.face,ground:true});
  refereeWalk(480+Math.max(0,1-t/.95)*-240,clip.other.face,t,.95,t<1.42?6:7);
  if(t>2.2&&t<3.75)anticTile('prank',6,480,275,173,{angle:(t-2.43)*.65,alpha:1-clamp((t-3.1)/.65,0,1)});
  const bars=[clip.lead,clip.other].sort((a,b)=>a.human?-1:b.human?1:0);
  for(const [i,f] of bars.entries()){
    const left=i?504:118,shown=flipped?(f===clip.lead?0:MAX_HP):f.hp;
    const nudge=(!reduced&&Math.abs(t-2.42)<.24)?Math.sin(t*100)*5:0;
    ctx.fillStyle='#14101d';ctx.fillRect(left+nudge,66,338,28);
    ctx.fillStyle=flipped?'#f779df':'#96f486';ctx.fillRect(left+3+nudge,69,332*shown/MAX_HP,22);
    text(ROSTER[f.ci].name.toUpperCase()+'  '+Math.ceil(shown),left+169+nudge,87,12,'#ffffff');
  }
}

function drawLoloPickpocket({lead,other},t,x,y){
  const won=lead.ci===FIGHTER.ZAITO;
  const zaito=won?lead:other,target=won?other:lead;
  const zx=won?x:y,tx=won?y:x;
  const face=Math.sign(zx-tx);
  const approach=easeOut(t/1.26),escape=ease((t-2.04)/1.40);
  const displayWallet=ease((t-1.48)/.29);
  const loloX=tx-face*(lerp(219,52,approach)+displayWallet*57+escape*231);
  const frame=t<1.12?Math.floor(t*9)%2:t<1.57?3:t<2.04?4:5+Math.floor(t*11)%2;
  const lx=reduced?tx-face*lerp(55,109,displayWallet):loloX;
  const opacity=reduced?1-ease((t-2.25)/.6):1;
  ctx.save();
  ctx.globalAlpha*=opacity;
  ctx.fillStyle='#09091972';
  ctx.beginPath();ctx.ellipse(lx,GY+2,27,5,0,0,TAU);ctx.fill();
  anticTile('lolo',frame,lx,GY,127,{face:t<2.04?face:-face,ground:true});
  ctx.restore();
  drawReaction(zaito,t<1.55?'recover':'laugh',zx,t);
  drawReaction(target,t<1.6?'recover':t<2.3?'shock':'confused',tx,t-1.6);
  if(t>1.76&&t<3.3)drawPostBattleLine('Hoy, Lolo!',tx,COL[target.ci]);
}

function drawLooniePilot({lead,other},t,x,y){
  const face=Math.sign(y-x);
  const body=sceneBody(other.ci,'down',.4);
  drawReaction(lead,t<1?'recover':'shock',x,t);
  drawSprite(body,y,GY,-face);
  const [hx,hy]=crownPosition(body,y,GY,-face,1,1,0,16);
  const drop=ease((t-.48)/.58);
  drawLoonieCrown(hx+face*56*drop,lerp(hy,GY-1,drop)-Math.sin(drop*Math.PI)*32,
    -face,drop*.77,43);
  if(t<.56)return;
  if(t<1.23){
    const emerge=ease((t-.56)/.47);
    drawBackstageSprite(ctx,'pilotrun',0,hx,hy+11,52*emerge,face);
    return;
  }
  const jump=clamp((t-1.23)/.55,0,1);
  const run=ease((t-1.78)/1.7);
  const xx=lerp(hx,hx+face*100,easeOut(jump))+face*run*365;
  const yy=lerp(hy,GY,jump)-Math.sin(jump*Math.PI)*48;
  drawBackstageSprite(ctx,'pilotrun',jump<1?1:2+Math.floor(t*13)%2,xx,yy,52,face);
}

const ANTIC_RENDERERS = {
  featured:drawFeaturedClip, badangWin:drawBadangWin, postBattle:drawPostBattle,
  loloPickpocket:drawLoloPickpocket,looniePilot:drawLooniePilot,
  duel:(clip,t,x,y)=>drawDuel(clip.lead,clip.other,t,x,y),
  doubleCrown:drawBatasVictory,
  praise:(clip,t,x,y)=>drawRoyalVictory(clip,t,x,y),
  batok:(clip,t,x,y)=>drawRoyalVictory(clip,t,x,y,true),
  magician:drawAbraVictory, ufo:drawUFOVictory, turtle:drawTurtleVictory,
  rose:(clip,t,x,y)=>drawApekzScene(clip,t,x,y,true),
  push:(clip,t,x,y)=>drawApekzScene(clip,t,x,y,false),
  prank:drawPrank
};

function drawAntic() {
  const {clip:source,tick:t}=antic;
  const left=source.lead.human;
  const x=left?316:645,y=left?645:316;
  const face=Math.sign(y-x);
  const clip={...source,lead:{...source.lead,face},other:{...source.other,face:-face}};
  ctx.save();
  const pulse=reduced?0:Math.max(0,1-Math.abs(t-2.75)*9)*Math.sin(t*83)*2;
  ctx.translate(pulse,0);
  drawScene();
  drawCompleteStands();
  drawEnvironmentFloor();
  const shade=ctx.createLinearGradient(0,0,0,H);
  shade.addColorStop(0,'#0d0c2077');shade.addColorStop(.58,'#0d0b2348');shade.addColorStop(1,'#17102138');
  ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#09091966';
  for(const pos of [x,y]){
    ctx.beginPath();ctx.ellipse(pos,GY+2,39,6,0,0,TAU);ctx.fill();
  }
  ANTIC_RENDERERS[clip.kind](clip,t,x,y);
  ctx.restore();
  const headline=clip.kind==='prank'&&t>=2.42?(t<5.5?'PLOT TWIST!':'KEEP FIGHTING!'):
    clip.kind==='turtle'&&t>2.8?'HAHAHAHA!':clip.title;
  const headerY=clip.kind==='prank'?44:59;
  if(headline)dtext(headline,480,headerY,clip.kind==='prank'?31:38,'#f5ff9b');
  if(clip.kind==='prank')text('BONUS ANTICS',480,126,12,'#f9e9ff');
}

// Special effects are layered on the existing move timings and hitboxes.
const ANTIC_MOVE_NAMES = {
  0:{technique:'Infinite Rhyme',wave:'Royal Bars',sp:'Multisyllabic Storm',power:'Royal Bars'},
  1:{technique:'Abrakadabra',wave:'Magic Mic',power:'Illusion Clones',sp:'Magic Hat'},
  2:{technique:'Personal Files',wave:'Dramatic Roast',power:'Fake Mic Drop',sp:'Intimidating Spotlight',rise:'Comeback Rage'},
  3:{technique:'Pressure',chargePower:'Intimidation Aura',wave:'Final Boss Stare',sp:'Royal Dominance'},
  5:{technique:'Alien Invasion',wave:'Insect Swarm',power:'Galactic Glitch',sp:'Alien Abduction'},
  6:{technique:'Lolo Assist',wave:'Random Nonsense',power:'Poop Meteor'},
  7:{technique:'Speed Dash',wave:'Rapid-Fire Microphone',power:'Fast Rap Barrage',sp:'Endless Word Combo'},
  8:{technique:'Awkward Silence',wave:'Sarcasm Counter',power:'Reverse Punchline',sp:'Crowd Laugh Explosion'}
};

function drawAnticCombatFX(f,o) {
  const name=ANTIC_MOVE_NAMES[f.ci]?.[f.st];
  if(!name) return;
  const t=f.t, x=rxOf(f), y=GY-raOf(f), enemy=rxOf(o);
  const duration=moveData(f)?.dur||.78;
  const p=clamp(t/duration,0,1), alpha=.79*(1-ease((p-.75)/.25));
  const tile=(sheet,frame,atX,atY,size,options={})=>anticTile(sheet,frame,atX,atY,size,{alpha,face:f.face,...options});
  const advance=(poses,fps=10)=>anticFrames('',poses,t,fps);
  switch(name){
    case 'Infinite Rhyme': case 'Royal Bars': case 'Multisyllabic Storm':
      for(let i=0;i<3;i++)tile('crowns',name==='Infinite Rhyme'?11:10,x+f.face*(50+i*70+p*123),y-52-i*20,64,{angle:(i-1)*.08});
      break;
    case 'Abrakadabra':
      tile('abra',advance([8,9,8,15]),x,y+10,188);
      if(f.anticOriginX!==undefined && Math.abs(f.anticOriginX-x)>40)
        tile('abra',9,f.anticOriginX,y+5,137,{alpha:(1-p)*.57});
      if(p>.38)tile('abra',4,enemy,GY-164,91,{angle:.2});
      break;
    case 'Magic Mic':
      tile('abra',advance([10,10,11,15]),enemy,GY-40,169,{angle:t*2.5});
      break;
    case 'Rapid-Fire Microphone': case 'Fast Rap Barrage': case 'Endless Word Combo':
      tile('effects',advance([0,1,2,3]),lerp(x,enemy,p),y-36,136,{angle:-.12});
      break;
    case 'Illusion Clones':
      for(let i=0;i<3;i++)tile('abra',advance([i%2,2,(i+1)%3]),x+f.face*(35+i*66),y-i*9,158,{alpha:.40-.08*i});
      break;
    case 'Magic Hat':
      tile('abra',advance([4,5,6,7],7),clamp(lerp(x,enemy,.55),100,W-100),GY+18,185);
      break;
    case 'Alien Invasion':
      tile('ufo',advance([0,1,4,5]),enemy,GY-118,191);
      for(let i=0;i<2;i++)tile('ufo',8+((Math.floor(t*12)+i)%2),enemy+(i?71:-66),GY,77);
      break;
    case 'Insect Swarm':
      for(let i=0;i<6;i++){
        const a=t*10+i*TAU/6;tile('ufo',10+(Math.floor(t*18+i)%2),enemy+Math.cos(a)*87,GY-52+Math.sin(a)*43,42);
      }
      break;
    case 'Galactic Glitch':
      tile('effects',13,enemy,GY+3,251,{angle:t*2});
      break;
    case 'Alien Abduction':
      tile('ufo',advance([1,4,4,5,4,6],8),enemy,GY-38,235);
      break;
    case 'Pressure': case 'Intimidation Aura': case 'Final Boss Stare': case 'Royal Dominance':
      tile('crowns',{'Pressure':14,'Intimidation Aura':12,'Final Boss Stare':15,'Royal Dominance':14}[name],x,y+10,235+p*85,
        {sx:1+p*.3,sy:1-p*.08});
      break;
    case 'Lolo Assist':
      tile('lolo',advance([0,1,2,4,5,6]),lerp(x-73*f.face,enemy-50*f.face,p),GY,115,{ground:true});
      break;
    case 'Poop Meteor':
      drawCinematicTile('zaito-effects',p<.52?4:p<.73?5:6,enemy,lerp(62,GY+7,ease(p*1.6)),146,146,f.face,alpha,0,1);
      break;
    case 'Personal Files':
      tile('effects',advance([4,5,6,7]),x+f.face*59,y-59,128);
      break;
    case 'Dramatic Roast': case 'Comeback Rage': case 'Intimidating Spotlight':
      tile('crowns',p<.5?15:12,name==='Intimidating Spotlight'?enemy:x,y+15,184+p*108);
      break;
    case 'Fake Mic Drop': case 'Speed Dash':
      tile('effects',advance([1,0,3]),x+f.face*60,y,122);
      break;
    case 'Awkward Silence': case 'Reverse Punchline': case 'Sarcasm Counter':
      tile('prank',6,x+f.face*(58+p*88),y-54,105,{angle:p*TAU});
      break;
    case 'Crowd Laugh Explosion':
      tile('prank',7,enemy,GY+12,245+p*82);
      break;
  }
}

const CAT_SWIPE_AT=.77;
const CAT_EXIT_AT=1.46;
const CAT_SWIPE={kind:'cat',dmg:3,kb:120,nonlethal:true,assist:true};
let sockCat=null,sockCatAt=Infinity,sockCatDeparted=false;

function resetSockCat(){
  sockCat=null;
  sockCatAt=15.94+Math.random()*1.04;
  sockCatDeparted=false;
}

function updateSockCat(dt){
  if(reduced)return;
  if(!sockCat){
    if(sockCatDeparted||standTime<sockCatAt||!backstageArt.dirtycat)return;
    const origin=stands.catExit();
    if(!origin)return;
    const targets=[P1,P2].filter(f=>f.hp>1&&f.air<32&&!['sp','down'].includes(f.st));
    if(!targets.length||[P1,P2].some(f=>f.st==='sp'))return;
    const target=targets[Math.floor(Math.random()*targets.length)];
    const face=Math.sign(target.x-origin.x)||origin.direction;
    sockCat={elapsed:0,origin,target,face,strike:target.x};
    sockCatDeparted=true;
  }
  const cat=sockCat;
  const previous=cat.elapsed;
  cat.elapsed+=dt;
  if(previous<CAT_SWIPE_AT&&cat.elapsed>=CAT_SWIPE_AT&&
    Math.abs(cat.target.x-cat.strike)<54&&cat.target.air<58&&
    cat.target.hp>1&&!['sp','down'].includes(cat.target.st)){
    const other=cat.target===P1?P2:P1;
    const source={...other,ci:FIGHTER.ZAITO,x:cat.strike-cat.face*36,face:cat.face};
    hit(source,cat.target,{...CAT_SWIPE,direction:cat.face},true);
  }
  if(cat.elapsed>=CAT_EXIT_AT)sockCat=null;
}

function drawSockCat(){
  if(!sockCat||phase!=='fight')return;
  const {elapsed,origin,face,strike}=sockCat;
  const approach=clamp(elapsed/CAT_SWIPE_AT,0,1);
  const exit=clamp((elapsed-CAT_SWIPE_AT)/(CAT_EXIT_AT-CAT_SWIPE_AT),0,1);
  const x=lerp(origin.x,strike-face*36,easeOut(approach))+face*exit*218;
  const descent=ease(elapsed/.46);
  const leap=Math.sin(Math.PI*clamp(elapsed/.51,0,1))*21;
  const pounce=Math.sin(Math.PI*clamp((elapsed-.51)/.46,0,1))*29;
  const y=lerp(origin.y,GY,descent)-leap-pounce;
  const frame=elapsed<.52?Math.floor(elapsed*10)%2:elapsed<.90?2:3;
  ctx.save();
  ctx.globalAlpha*=1-ease((exit-.62)/.38);
  drawBackstageSprite(ctx,'dirtycat',frame,x,y,lerp(24,66,descent),face);
  ctx.restore();
}

$('skipScene').onclick=endAntic;
$('replayScene').onclick=$('replayResultScene').onclick=$('replayLastScene').onclick=replayAntic;
$('bonusAntics').checked=store.get('bonusAntics',false);
$('bonusAntics').onchange=()=>store.set('bonusAntics',$('bonusAntics').checked);

for(const [ci,fighter] of ROSTER.entries()){
  const choice=document.createElement('option');
  choice.value=String(ci);choice.textContent=fighter.name;
  $('rivalSelect').append(choice);
}
const loloArt=ANTIC_ART.lolo;
if(loloArt){
  $('secretLolo').style.setProperty('--lolo-art','url('+loloArt[0]+')');
  $('secretLolo').style.setProperty('--lolo-delay',(8+Math.random()*25)+'s');
}

