// Time, base damage, forward offset, horizontal radius, maximum target height.
// A negative radius means the hit covers the forward lane up to the given offset.
const ULTIMATE_PLANS = [
  {title:'Hari ng Tugma: Crown Smash', short:'Crown Smash', art:'royal-bust',
    detail:'Loonie levitates in prayer, then his eyes flare gold as he chants a rhyming couplet. The final rhyme brings his guardian’s crown down for 36 damage. Jump over the shockwave.',
    signature:'Punchline sends five golden punches down the lane.',
    duration:1.84, width:355, aim:112, frames:[.38,.91,1.29], shake:1.12,
    beats:[[.91,36,153,156,48]], floor:2.8},
  {title:'Cerberus: Hellbreath', short:'Cerberus', art:'cerberus-breath',
    detail:'Summon a three-headed hound. Two waves of flame deal 29 total damage and the second slows. Back away or jump out of the flame lane.',
    signature:'Ghost Rush dashes in and slows on contact.',
    duration:1.63, width:319, aim:168, frames:[.24,.52,.91], shake:.57,
    beats:[[.52,12,W,-1,111],[.81,17,W,-1,123]], breath:true, slow:1.35},
  {title:'Third Eye: Crimson Focus', short:'Third Eye', castSheet:'third-eye',
    detail:'Shape a giant eye of crimson energy and fire a piercing laser for 27 damage. An Angle Mark breaks guard and adds 5 damage.',
    signature:'Crimson Mark primes Third Eye.',
    duration:1.63, width:460, aim:249, frames:[.25,.76,1.18], shake:.73,
    beats:[[.76,27,W,-1,132]], eye:true, breakMarked:true},
  {title:'Final Verdict: Axe of Law', short:'Axe of Law', castSheet:'verdict-axe',
    detail:'Open a law book, draw a giant axe and split a stone Lady Liberty. Its shockwave breaks guard and deals 41 damage. Jump or move clear of the statue.',
    signature:'Faultline has startup armor and breaks guard.',
    duration:1.92, width:365, aim:108, frames:[.37,1.03,1.30], shake:1.2,
    beats:[[1.03,41,108,112,55]], armor:1.01, guardBreak:true, floor:2.5, book:true},
  {title:'Triple Timer', short:'Triple Timer', art:'triple-timer',
    detail:'Four speed clones fire three machine-gun bursts. Each burst lands up to four hits, for 33 total damage. Jump or parry in the gaps.',
    signature:'Overclock fires six fast energy shots.',
    duration:1.68, width:126, aim:0, frames:[], shake:.32,
    beats:[.57,.83,1.09].flatMap(start=>[2,2,2,5].map((damage,shot)=>
      [start+shot*.043,damage,W,-1,75])), clones:true},
  {title:'Black Hole', short:'Black Hole', art:'black-hole',
    detail:'Aklas sniffs a puff of fictional charged dust and reels with a dazed grin. His black hole pulls in nearby opponents for three pulses of 7, 9 and 15 damage. The final pulse launches.',
    signature:'Zigzag Burst sends three irregular shots.',
    duration:1.76, width:290, aim:174, frames:[.41,.91,1.15], shake:.64,
    beats:[[.46,7,174,106,73],[.67,9,174,124,104],[.91,15,174,143,150]],
    blackHole:{opens:.30,radius:270,pull:430}, launch:370},
  {title:'Shadow Meteor', short:'Shadow Meteor', art:'freestyle-rebound',
    detail:'Zaito darkens, sends a giant googly-eyed shadow cobra lunging across the arena, and splatters a cartoon poop meteor. The opener deals 13 damage and the slam deals 21. A windup counter pulls the impact closer.',
    signature:'Poop Barrage sends two bouncing cartoon poops. Rebuttal Roll can counter.',
    duration:1.87, width:300, aim:150, frames:[.28,.98,1.38], shake:.55,
    beats:[[.51,13,123,113,100],[.98,21,208,134,131]], response:true},
  {title:'Triple Meaning: Summit Kick', short:'Summit Kick', art:'triple-meaning',
    detail:'Apekz climbs a mountain, leaps from the summit and dive-kicks into two aftershocks for 6, 8 and 9 damage. A live Setup mark adds 15 to the last hit.',
    signature:'Setup marks the opponent. Triple Trigger fires three increasing shots.',
    duration:1.73, width:285, aim:146, frames:[.47,1,1.26], shake:.58,
    beats:[[.47,6,146,132,104],[.72,8,146,146,118],[1,9,146,156,138]], payoff:true, mountain:true},
  {title:'Lotus Ground Smash', short:'Lotus Smash', castSheet:'lotus-smash',
    detail:'Meditate in a floating lotus pose and summon a huge, muscular Sinio to smash the floor for 25 damage. The shockwave slows and drains up to 18 mana.',
    signature:'Laugh Wave trades raw damage for reach and a longer slow.',
    duration:1.77, width:354, aim:142, frames:[.57,.82,1.16], shake:.92,
    beats:[[.82,25,142,172,77]], lotus:true, floor:1.9, slow:2.1, drain:18},
];

const ultimateImages = {};
const ultimateFrameBaselines = [
  [.94,.94,.95,.95], [.86,.86,.80,.79], [.91,.91,.87,.87],
  [.97,.98,.96,.96], [.88,.88,.88,.88], [.50,.50,.50,.50],
  [.87,.87,.87,.87], [.84,.84,.88,.88], [.91,.91,.88,.88],
  [.93,.93,.93,.93],
];
const ritualFrames = [];
let refereeWinner = null;

ULTIMATE_PLANS.forEach((plan, i) => {
  const first = plan.beats[0];
  const last = plan.beats.at(-1);
  Object.assign(MOVES[i].sp, {
    dur:plan.duration, hit:first[0], end:last[0], dmg:plan.beats.reduce((sum, beat) => sum + beat[1], 0),
    reach:W,
    lunge:0, volley:null, guardBreak:!!plan.guardBreak, breakMarked:!!plan.breakMarked
  });
  ROSTER[i].super = plan.title;
  ROLES[i] = plan.title.toUpperCase();
});

async function loadUltimateArt(progress) {
  for (const [i,{name,src}] of ULTIMATE_ART.entries()) {
    progress(i,name);
    ultimateImages[name] ||= await loadImage(src);
  }
  const im = ultimateImages['ritual-casts'], tile = im.width/2;
  const head = [[135,10,211,208],[130,10,211,208],[111,1,224,223],[107,4,224,223]];
  head.forEach((faceCrop,i) => {
    ritualFrames[i] = {im,x:i%2*tile,y:Math.floor(i/2)*tile,w:tile,h:tile,
      ax:tile*(i%2 ? .48 : .49),ay:tile*.932,scale:.42,faceCrop};
  });
}

function ultimateStart(f) {
  const plan = ULTIMATE_PLANS[f.ci];
  const cast = {x:f.x, face:f.face, next:0, elapsed:0, lastBurst:null, countered:false};
  const opponent=f===P1?P2:P1;
  cast.targetX=opponent && (opponent.x-f.x)*cast.face>=0 ? opponent.x : clamp(f.x+cast.face*plan.aim,65,895);
  if (plan.blackHole) cast.wellX=cast.targetX;
  f.ultimate = cast;
  startUltimateScreen(f,cast);
  if (plan.armor) f.armor = plan.armor;
  if (plan.response) f.ultimate.reboundAt = null;
  const col = COL[f.ci];
  superDim = .67;
  banner = {ci:f.ci, face:f.face, t:0, dur:CAST_SECONDS+.72};
  hitstop = Math.max(hitstop, reduced ? .035 : .12);
  hype = .65;
  ringFx(f.x,GY-4,col,plan.width*.46,.55,.21,4);
  sfx.sup();
}

function ultimateDamageBonus(a, d, attack) {
  if (attack.ultimatePayoff && d.setup > 0) {
    d.setup = 0;
    label('SETUP DETONATED',d.x,GY-200,COL[a.ci],15);
    return 15;
  }
  return 0;
}

function ultimateCounter(attacker, defender, attack) {
  if (defender.ci !== 6 || defender.st !== 'sp' || !defender.ultimate || defender.t > .43 || defender.ultimate.countered || attack.isCounter) return false;
  const cast = defender.ultimate;
  cast.countered = true;
  cast.reboundAt = clamp(attacker.x,65,895);
  defender.inv = .13;
  label('IMPROVISED COUNTER',defender.x,GY-201,COL[6],14);
  ringFx(defender.x,GY-84,COL[6],117,.36,.8,4);
  return true;
}

function ultimateBeatX(plan, cast, beat, index) {
  if (plan.response && index===1 && cast.reboundAt!==null) return cast.reboundAt;
  const offset=beat[3]<0 ? plan.aim||beat[2]*.5 : beat[2];
  return cast.bookX ?? cast.wellX ?? cast.targetX ?? clamp(cast.x + cast.face*offset,60,900);
}

function pullIntoBlackHole(opponent, cast, field, dt) {
  if (cast.elapsed<field.opens || opponent.hp<=0 || opponent.st==='down' || opponent.inv>0) return;
  const gap = cast.wellX-opponent.x;
  const distance = Math.abs(gap);
  if (distance>field.radius) return;
  const away = gap*opponent.ctl.dir<0;
  const strength = .52+.48*ease(1-distance/field.radius);
  const travel = field.pull*strength*(away?.73:1)*dt;
  opponent.x += Math.sign(gap)*Math.min(distance,travel);
}

function updateUltimate(f, opponent, dt=FIXED_DT) {
  const cast = f.ultimate;
  if (!cast) return;
  const plan = ULTIMATE_PLANS[f.ci];
  cast.elapsed = f.t;
  if (f.ci===0) advanceCrownRhymes(f,cast,plan);
  if (plan.mountain) advanceMountainKick(f,cast,plan);
  if (plan.book && cast.bookX===undefined && f.t>=plan.frames[0]) {
    const [, , offset,radius] = plan.beats[0];
    const gap = (opponent.x-cast.x)*cast.face;
    cast.bookX = gap>=0 && gap<=W ?
      opponent.x : clamp(cast.x+cast.face*offset,65,895);
    if (superScreen?.cast===cast) superScreen.worldX = cast.bookX;
  }
  if (plan.blackHole && cast.next<plan.beats.length) pullIntoBlackHole(opponent,cast,plan.blackHole,dt);

  const beat = plan.beats[cast.next];
  if (!beat || f.t < beat[0]) return;
  const index = cast.next++;
  const [,damage,,radius,height] = beat;
  const last = index===plan.beats.length-1;
  const center = ultimateBeatX(plan,cast,beat,index);
  const forward = (opponent.x-cast.x)*cast.face;
  const screenTarget=plan.clones||plan.eye||plan.breath;
  markUltimateScreen(f,cast,screenTarget?opponent.x:center,index);

  if (last && f.ci===6) {
    const color='#a792f5';
    ringFx(center,GY-7,color,385,.57,.24,5);
    dust(center,GY,18,0,1.6);
    floorDamage(center,2.3);
    if(!reduced)kick(cast.face*20,-11);
  }
  if (plan.mountain && index===0) {
    floorDamage(center,1.8);
    ringFx(center,GY-12,'#89c6ff',260,.48,.35,4);
    if(!reduced)kick(cast.face*11,-10);
  }
  if (last && plan.floor) {
    floorDamage(center,plan.floor);
    ringFx(center,GY-3,COL[f.ci],plan.width*1.05,.52,.23,6);
    if (ARENAS[arenaId].wet) spriteFX(1,center,GY-9,plan.width*.8,.73,cast.face);
  }
  if (plan.blackHole) {
    ringFx(center,GY-108,last?'#cafa89':'#a473e7',last?280:175,.41,.84,last?6:3);
  }
  if (plan.clones) {
    cast.lastBurst = {time:f.t, x:clamp(cast.x+cast.face*beat[2],35,W-35)};
    noise(.046,1600+(index%4)*310,.052,.84,'bandpass',3);
  } else {
    sfx.heavy();
  }
  addShake((last ? plan.shake : plan.shake*.42) * .65);
  if (last) kick(cast.face*(plan.floor ? 18 : 8),plan.floor ? -10 : -2);

  const inRange = radius<0 ? forward>=-10 && forward<=beat[2] : Math.abs(opponent.x-center)<=radius;
  if (!inRange || opponent.air>height) return;
  const at = {
    kind:'sp', ultimate:true, dmg:damage, kb:last ? (plan.floor ? 465 : 330) : plan.clones?10:22,
    rapid:!last || !!plan.clones, knockdown:last, burstRound:!!plan.clones,
    guardBreak:!!plan.guardBreak, breakMarked:!!plan.breakMarked,
    slow:last ? plan.slow : 0, drain:last ? plan.drain : 0,
    launch:last ? plan.launch : 0, ultimatePayoff:last && !!plan.payoff
  };
  hit(f,opponent,at,!!plan.clones);
}

function drawUltimateTile(i, frame, x, floor, width, face, alpha, anchor=.5) {
  const image = ultimateImages[i===9?'anygma':ULTIMATE_PLANS[i].art];
  if (!image) return;
  const cell = image.width/2;
  ctx.save();
  ctx.translate(x,floor);
  ctx.scale(face,1);
  ctx.globalAlpha *= alpha;
  ctx.drawImage(image,frame%2*cell,Math.floor(frame/2)*cell,cell,cell,
    -width*anchor,-width*ultimateFrameBaselines[i][frame],width,width);
  ctx.restore();
}

function clonePlacement(cast) {
  const line = clamp(cast.x-cast.face*150,153,W-153);
  return [
    {x:line-cast.face*79, y:GY-80, size:120},
    {x:line+cast.face*38, y:GY-79, size:120},
    {x:line-cast.face*54, y:GY-11, size:131},
    {x:line+cast.face*114, y:GY-136, size:132},
  ];
}

function drawTripleTimer(f, cast, alpha) {
  clonePlacement(cast).forEach((clone,i) => {
    const since = cast.lastBurst ? cast.elapsed-cast.lastBurst.time : -1;
    const firing = since>=0 && since<.13;
    const recoil = firing && !reduced ? 8*(1-easeOut(since/.13)) : 0;
    const phase=(cast.elapsed*4.8+i/4)%1;
    const sweep=reduced?0:Math.sin(phase*TAU)*Math.min(140,45+Math.abs(cast.targetX-cast.x)*.16);
    const x=clamp(clone.x+sweep*cast.face-recoil*cast.face,42,W-42);
    if (!reduced) for (let ghost=1;ghost<=2;ghost++) {
      const past=clone.x+Math.sin((phase-ghost*.045)*TAU)*Math.min(140,45+Math.abs(cast.targetX-cast.x)*.16)*cast.face;
      drawUltimateTile(f.ci,i,clamp(past,42,W-42),clone.y,clone.size*1.28,cast.face,alpha*(.26/ghost),.36);
    }
    const size=clone.size*(reduced?1.1:1.28);
    drawUltimateTile(f.ci,i,x,clone.y,size,cast.face,alpha*.96,.36);
    if (!firing) return;
    const muzzle = x+cast.face*size*[.59,.60,.58,.40][i];
    const y = clone.y-size*[.27,.33,.27,.37][i];
    const target = cast.lastBurst.x;
    if ((target-muzzle)*cast.face<6) return;
    ctx.save();
    ctx.globalCompositeOperation='screen';
    const pulse=1-ease(since/.079);
    ctx.globalAlpha=alpha*pulse;
    ctx.translate(muzzle,y);ctx.scale(cast.face,1);
    ctx.fillStyle='#ffb74d';
    const flashSize=size*.20*(.63+pulse*.37);
    screenPolygon([[0,0],[-flashSize*.32,-flashSize*.65],[flashSize*.26,-flashSize*.21],
      [flashSize,-flashSize*.38],[flashSize*.64,0],[flashSize,.47*flashSize],
      [flashSize*.14,flashSize*.25],[-flashSize*.20,flashSize*.65]]);
    ctx.fill();
    ctx.fillStyle='#fff5bd';ctx.fillRect(-1,-3,flashSize*.63,6);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha=alpha*(1-ease(since/.13));
    const count=reduced?3:7;
    for (let n=0;n<count;n++) {
      const travel=(since*9+n/count*.87)%1;
      const xx=lerp(muzzle,target,travel);
      const yy=lerp(y,GY-85+i*7,travel)+(screenHash(n+i*11,93)-.5)*38;
      ctx.fillStyle=n%2?'#ffbf60':'#fff5c4';
      ctx.fillRect(xx,yy,(i===2?18:13)+n%3*3,2+n%2);
    }
    if (!reduced) {
      ctx.fillStyle='#b28b51';
      for (let n=0;n<3;n++) {
        const fall=since*8+n*.22;
        const xx=muzzle-cast.face*(28+fall*38);
        const yy=y-fall*52+fall*fall*72;
        ctx.fillRect(xx,yy,5,3);
      }
    }
    ctx.restore();
  });
}

function drawCerberus(f,cast,plan,alpha) {
  const frame=plan.frames.filter(time=>cast.elapsed>=time).length;
  const x=clamp(cast.x+cast.face*57,110,W-110);
  const breath=frame===2 && cast.next>0;
  const width=plan.width*(breath?1.07:1);
  drawUltimateTile(f.ci,frame,x,GY-29,width,cast.face,alpha*.97,.58);
  if (!breath) return;
  const front=clamp(cast.x+cast.face*plan.beats[0][2],20,W-20);
  const lift=[152,180,121];
  ctx.save();
  ctx.globalCompositeOperation='screen';
  for (let jaw=0;jaw<3;jaw++) {
    for (let n=0;n<(lowQ()?10:19);n++) {
      const drift=(n*.105+cast.elapsed*2.7+jaw*.14)%1;
      const spread=screenHash(n+jaw*30,11);
      const xx=lerp(x+cast.face*(69-jaw*14),front,drift);
      const yy=lerp(GY-lift[jaw],GY-67,drift)+Math.sin(drift*11+n)*spread*35;
      const size=14+spread*34+drift*30;
      const fade=alpha*Math.sin(drift*Math.PI)*.55;
      screenBloom(xx,yy,size,n%4===0?'#a54bf1':'#ff681e',fade);
      if (!reduced && n%3===0) {
        ctx.globalAlpha=fade;
        ctx.fillStyle='#ffd690';ctx.fillRect(xx,yy,6+spread*8,3);
      }
    }
  }
  ctx.restore();
}

function drawThirdEye(cast,plan,alpha) {
  const frame=cast.next>0 && cast.elapsed<plan.frames[2] ? 5 : cast.elapsed>=plan.frames[0] ? 4 : 3;
  const x=clamp(cast.x+cast.face*60,116,W-116);
  const y=GY-195;
  const swell=ease(cast.elapsed/.43);
  const width=plan.width*(.40+swell*.60);
  const beamFrame=frame===5;
  drawUltimateSprite(plan.castSheet,frame,x+(beamFrame ? width*.13*cast.face : 0),y,
    width*(beamFrame?1.27:1),cast.face,alpha,.5);
  const beamTime=cast.elapsed-plan.beats[0][0];
  if (beamTime<0 || beamTime>.39) return;
  const strength=(1-ease((beamTime-.11)/.28))*alpha;
  const end=clamp(cast.x+cast.face*plan.beats[0][2],15,W-15);
  const beamX=x+cast.face*width*.17;
  const beamY=y+6;
  const travel=easeOut(beamTime/.07);
  const tip=lerp(beamX,end,travel);
  const aimY=GY-78;
  ctx.save();
  ctx.globalCompositeOperation='screen';
  for (const [thick,color] of [[148,'#cf093b'],[90,'#fb1e4a'],[50,'#ff7587'],[17,'#fff1e2']]) {
    ctx.globalAlpha=strength*(thick===148?.53:.92);
    ctx.strokeStyle=color;ctx.lineWidth=thick*(.68+strength*.32);
    ctx.lineCap='round';ctx.beginPath();ctx.moveTo(beamX,beamY);
    ctx.lineTo(tip,lerp(beamY,aimY,travel));ctx.stroke();
  }
  ctx.restore();
}

function drawAxeVerdict(cast, plan, alpha) {
  if (cast.elapsed<.14) return;
  const frame=cast.next===0?3:cast.elapsed<plan.frames[2]?4:5;
  const target=cast.bookX ?? clamp(cast.x+cast.face*plan.aim,70,W-70);
  const appear=ease((cast.elapsed-.14)/.24);
  const scale=frame===5 ? 1.06 : .94;
  drawUltimateSprite(plan.castSheet,frame,target,GY+2,plan.width*scale,cast.face,alpha*appear);
  const since=cast.elapsed-plan.beats[0][0];
  if (since<-.11 || since>.29) return;
  const swing=ease((since+.11)/.18);
  const tail=1-ease((since-.07)/.22);
  ctx.save();
  ctx.globalCompositeOperation='screen';
  ctx.translate(target-45*cast.face,GY-98);
  ctx.scale(cast.face,1);
  ctx.rotate(-.51);
  ctx.globalAlpha=alpha*tail*.79;
  ctx.strokeStyle='#ffbf55';ctx.lineWidth=22;
  ctx.beginPath();ctx.ellipse(0,0,112,85,0,-2.7,-2.7+swing*4.9);ctx.stroke();
  ctx.strokeStyle='#fff8d0';ctx.lineWidth=5;ctx.stroke();
  ctx.restore();
}

function drawLotusSmash(cast,plan,alpha) {
  if (cast.elapsed<plan.frames[0]) return;
  const frame=cast.next===0 ? 3 : cast.elapsed<plan.frames[2] ? 4 : 5;
  const target=cast.targetX;
  const appear=ease((cast.elapsed-plan.frames[0])/.15);
  drawUltimateSprite(plan.castSheet,frame,target,GY+6,plan.width,cast.face,alpha*appear);
}

function drawUltimateSprite(name, index, x, y, width, face, alpha, baseline=1) {
  const frame=cinematicFrames[name]?.[index];
  if (!frame) return;
  let maxHeight=reduced?240:319;
  if (baseline===1) {
    const matrix=ctx.getTransform();
    const zoom=Math.hypot(matrix.c,matrix.d)/RS;
    const screenY=(matrix.b*x+matrix.d*y+matrix.f)/RS;
    maxHeight=Math.min(maxHeight,Math.max(90,(screenY-148)/zoom));
  }
  const height=Math.min(maxHeight,width*frame.h/frame.w);
  drawCinematicTile(name,index,x,y,height*frame.w/frame.h,height,face,alpha,0,baseline);
}

function drawBlackHole(f, cast, plan, alpha) {
  const t = cast.elapsed-plan.blackHole.opens;
  if (t<0) return;
  const frame = plan.frames.filter(time => cast.elapsed>=time).length;
  const x = cast.wellX, y = GY-122;
  const start = ease(t/.14);
  const collapse = ease((cast.elapsed-plan.frames[2])/.37);
  const size = plan.width*(.54+.46*start)*(1-.70*collapse);
  const pulse = reduced ? 0 : Math.sin(t*12)*6;
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(reduced ? 0 : -.55*t);
  drawUltimateTile(f.ci,frame,0,0,size+pulse,1,alpha);
  ctx.restore();
  if (reduced || frame===3) return;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let n=0; n<(lowQ()?13:28); n++) {
    const drift = 1-(screenHash(n,56)+t*(.76+screenHash(n,53)*.57))%1;
    const distance = size*(.17+drift*.89);
    const swirl = n*2.39996+t*4+(1-drift)*2.4;
    ctx.strokeStyle = n%3 ? '#bdff79' : '#aa67e5';
    ctx.lineWidth = 1+screenHash(n,58)*3;
    ctx.globalAlpha = alpha*start*Math.sin(drift*Math.PI)*.76;
    ctx.beginPath();
    ctx.moveTo(x+Math.cos(swirl)*distance,y+Math.sin(swirl)*distance*.6);
    ctx.quadraticCurveTo(x+Math.cos(swirl-.08)*distance*.92,y+Math.sin(swirl-.08)*distance*.55,
      x+Math.cos(swirl-.20)*distance*.83,y+Math.sin(swirl-.20)*distance*.50);
    ctx.stroke();
  }
  ctx.restore();
}

function summonWidth(x, frame, ci, wanted) {
  const transform = ctx.getTransform();
  const floor = (transform.b*x+transform.d*(GY+4)+transform.f)/RS;
  const zoom = Math.hypot(transform.c,transform.d)/RS;
  // Reserve room for the super banner and absorb small vertical camera kicks.
  const height = (floor-160)/zoom;
  return Math.max(96,Math.min(wanted,height/ultimateFrameBaselines[ci][frame]));
}

function drawUltimate(f) {
  const cast = f.ultimate;
  if (!cast || (f.st!=='sp' && !(phase==='ko' && cast.next>0 && pt<.64))) return;
  const plan = ULTIMATE_PLANS[f.ci];
  const elapsed = cast.elapsed;
  const fade = f.st==='sp' ? 1-clamp((elapsed-plan.duration+.26)/.26,0,1) : 1-pt/.64;
  const alpha = clamp(.42+elapsed*4,0,1)*fade;
  if (plan.mountain && cast.next===0) return;
  if (plan.clones) {drawTripleTimer(f,cast,alpha);return}
  if (plan.blackHole) {drawBlackHole(f,cast,plan,alpha);return}
  if (plan.breath) {drawCerberus(f,cast,plan,alpha);return}
  if (plan.eye) {drawThirdEye(cast,plan,alpha);return}
  if (plan.book) {drawAxeVerdict(cast,plan,alpha);return}
  if (plan.lotus) {drawLotusSmash(cast,plan,alpha);return}
  const frame = plan.frames.filter(time => elapsed>=time).length;
  let x = cast.targetX;

  if (plan.response && frame>=2) x=ultimateBeatX(plan,cast,plan.beats[1],1);
  const powerFrame=frame===2;
  if (f.ci===0) {
    const width = summonWidth(x,frame,f.ci,plan.width*(powerFrame?1.12:1));
    // The crown lands to the right of the guardian within the final two cells.
    const crownOffset = frame>=2 ? (frame===2?.16:.19) : 0;
    if (crownOffset) x = ultimateBeatX(plan,cast,plan.beats[0],0)-cast.face*width*crownOffset;
    const summonAlpha=alpha*ease((elapsed-.10)/.24);
    drawUltimateTile(f.ci,frame,x,GY+4,width,cast.face,summonAlpha);
    return;
  }
  const width=plan.width*(reduced?1.1:powerFrame?1.51:1.28);
  if(!reduced && powerFrame) {
    const offset=cast.face*width*.13;
    drawUltimateTile(f.ci,frame,x-offset,GY+6,width*1.11,cast.face,alpha*.22);
  }
  drawUltimateTile(f.ci,frame,x,GY+4,width,cast.face,alpha*(f.ci===6?.49:.96));
}

function drawReferee() {
  if (!P1 || !ultimateImages.anygma) return;
  const start = phase==='intro' || (phase==='fight' && pt<.65);
  const result = phase==='ko';
  const frame = result ? (refereeWinner && pt>.48 ? 3 : 2) : phase==='intro' ? 0 : start ? 1 : 0;
  const pos = start || result ? W/2 : 485;
  const width = start || result ? 151 : 114;
  const y = GY-80;
  const face = frame===3 && refereeWinner.x<pos ? -1 : 1;
  drawUltimateTile(9,frame,pos,y,width,face,start || result ? 1 : .73);
  if (start || result) text('ANYGMA · REFEREE',pos,y+15,10,'#ffe6ab');
}

