// Time, base damage, forward offset, horizontal radius, maximum target height.
// A negative radius means the hit covers the forward lane up to the given offset.
const ULTIMATE_PLANS = [
  {title:'Hari ng Tugma: Crown Smash', short:'Crown Smash', art:'royal-bust',
    detail:'Loonie levitates in prayer, then his eyes flare gold as he chants a rhyming couplet. The final rhyme brings his guardian’s crown down for 36 damage. Jump over the shockwave.',
    signature:'Five gold bars keep ranged pressure going.',
    duration:1.84, width:355, aim:112, frames:[.38,.91,1.29], shake:1.12,
    beats:[[.91,36,153,156,48]], floor:2.8},
  {title:'Gayuma: Illusion Rush', short:'Illusion Rush', art:'illusion-rush',
    detail:'A violet double opens the attack. Abra phases forward and strikes twice for 29 total damage, slowing on the second hit.',
    signature:'Ghost Rush dashes in and slows on contact.',
    duration:1.44, width:276, aim:30, frames:[.2,.66,1.01], shake:.42,
    beats:[[.37,12,96,110,100],[.66,17,101,120,115]], phaseRush:true, slow:1.35},
  {title:'Angle Breaker', short:'Angle Breaker', art:'angle-breaker',
    detail:'Break a crimson crystal for 27 damage. An Angle Mark breaks guard and adds 5 damage.',
    signature:'Crimson Mark primes Angle Breaker.',
    duration:1.58, width:261, aim:138, frames:[.31,.76,1.09], shake:.73,
    beats:[[.76,27,138,111,114]], breakMarked:true},
  {title:'Final Verdict: Liberty Clap', short:'Liberty Clap', art:'liberty-book',
    detail:'Lady Liberty opens a giant book and locks onto a nearby opponent. The clap deals 41 damage and breaks guard. Jump or move clear of the pages.',
    signature:'Faultline has startup armor and breaks guard.',
    duration:1.92, width:365, aim:108, frames:[.37,1.03,1.4], shake:1.2,
    beats:[[1.03,41,108,112,55]], armor:1.01, guardBreak:true, floor:2.5, book:true},
  {title:'Triple Timer', short:'Triple Timer', art:'triple-timer',
    detail:'Four speed clones fire three volleys. Each volley deals 11 damage for up to 33. Jump or parry to escape the firing lane.',
    signature:'Overclock fires six fast energy shots.',
    duration:1.68, width:126, aim:0, frames:[], shake:.32,
    beats:[[.57,11,555,-1,75],[.83,11,555,-1,75],[1.09,11,555,-1,75]], clones:true},
  {title:'Black Hole', short:'Black Hole', art:'black-hole',
    detail:'Aklas sniffs a puff of fictional charged dust and reels with a dazed grin. His black hole pulls in nearby opponents for three pulses of 7, 9 and 15 damage. The final pulse launches.',
    signature:'Zigzag Burst sends three irregular shots.',
    duration:1.76, width:290, aim:174, frames:[.41,.91,1.15], shake:.64,
    beats:[[.46,7,174,106,73],[.67,9,174,124,104],[.91,15,174,143,150]],
    blackHole:{opens:.30,radius:270,pull:430}, launch:370},
  {title:'Shadow Meteor', short:'Shadow Meteor', art:'freestyle-rebound',
    detail:'Zaito darkens, swings a giant shadow into the ground, and splatters a cartoon poop meteor. The opener deals 13 damage and the slam deals 21. A windup counter pulls the impact closer.',
    signature:'Echo Bounce sends two bouncing shots. Rebuttal Roll can counter.',
    duration:1.87, width:300, aim:150, frames:[.28,.98,1.38], shake:.55,
    beats:[[.51,13,123,113,100],[.98,21,208,134,131]], response:true},
  {title:'Triple Meaning: Summit Kick', short:'Summit Kick', art:'triple-meaning',
    detail:'Apekz climbs a mountain, leaps from the summit and dive-kicks into two aftershocks for 6, 8 and 9 damage. A live Setup mark adds 15 to the last hit.',
    signature:'Setup marks the opponent. Triple Trigger fires three increasing shots.',
    duration:1.73, width:285, aim:146, frames:[.47,1,1.26], shake:.58,
    beats:[[.47,6,146,132,104],[.72,8,146,146,118],[1,9,146,156,138]], payoff:true, mountain:true},
  {title:'Crowd Control', short:'Crowd Control', art:'crowd-control',
    detail:'A pink crowd wave deals 25 damage, slows the opponent and drains up to 18 energy.',
    signature:'Laugh Wave trades raw damage for reach and a longer slow.',
    duration:1.67, width:354, aim:128, frames:[.24,.72,1.08], shake:.66,
    beats:[[.72,25,142,172,130]], slow:2.1, drain:18},
];

const ultimateImages = [];
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
    reach:Math.max(...plan.beats.map(beat => beat[2] + Math.max(0,beat[3]))),
    lunge:0, volley:null, guardBreak:!!plan.guardBreak, breakMarked:!!plan.breakMarked
  });
  ROSTER[i].super = plan.title;
  ROLES[i] = plan.title.toUpperCase();
});

async function loadUltimateArt(progress) {
  for (let i=0; i<ULTIMATE_ART.length; i++) {
    progress(i);
    if (!ultimateImages[i]) ultimateImages[i] = await loadImage(ULTIMATE_ART[i].src);
  }
  const im = ultimateImages[10], tile = im.width/2;
  const head = [[135,10,211,208],[130,10,211,208],[111,1,224,223],[107,4,224,223]];
  head.forEach((faceCrop,i) => {
    ritualFrames[i] = {im,x:i%2*tile,y:Math.floor(i/2)*tile,w:tile,h:tile,
      ax:tile*(i%2 ? .48 : .49),ay:tile*.932,scale:.42,faceCrop};
  });
}

function ultimateStart(f) {
  const plan = ULTIMATE_PLANS[f.ci];
  const cast = {x:f.x, face:f.face, next:0, elapsed:0, lastBurst:null, countered:false};
  if (plan.blackHole) cast.wellX = clamp(cast.x+cast.face*plan.aim,65,895);
  f.ultimate = cast;
  startUltimateScreen(f,cast);
  if (plan.phaseRush) f.inv = .27;
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

function ultimateBeatX(plan, cast, beat, index, f) {
  if (plan.phaseRush) return f.x + cast.face*beat[2];
  if (plan.response && index===1 && cast.reboundAt!==null) return cast.reboundAt;
  return cast.bookX ?? cast.wellX ?? clamp(cast.x + cast.face*beat[2],60,900);
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
  if (plan.phaseRush && !f.root && cast.next===0 && f.t>=.24 && !cast.shifted) {
    const gap = (opponent.x - f.x)*cast.face;
    f.x = clamp(f.x + cast.face*clamp(gap-92,0,224),65,895);
    f.prevX = f.x;
    cast.shifted = true;
  }
  if (plan.book && cast.bookX===undefined && f.t>=plan.frames[0]) {
    const [, , offset,radius] = plan.beats[0];
    const gap = (opponent.x-cast.x)*cast.face;
    cast.bookX = gap>=0 && gap<=offset+radius ?
      opponent.x : clamp(cast.x+cast.face*offset,65,895);
    if (superScreen?.cast===cast) superScreen.worldX = cast.bookX;
  }
  if (plan.blackHole && cast.next<plan.beats.length) pullIntoBlackHole(opponent,cast,plan.blackHole,dt);

  const beat = plan.beats[cast.next];
  if (!beat || f.t < beat[0]) return;
  const index = cast.next++;
  const [,damage,,radius,height] = beat;
  const last = index===plan.beats.length-1;
  const center = ultimateBeatX(plan,cast,beat,index,f);
  const forward = (opponent.x-cast.x)*cast.face;
  markUltimateScreen(f,cast,plan.clones?opponent.x:center,index);

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
    cast.lastBurst = {time:f.t, x:opponent.x, y:GY-85};
    noise(.13,920+index*280,.09,1.1,'bandpass',3);
  } else {
    sfx.heavy();
  }
  addShake((last ? plan.shake : plan.shake*.42) * .65);
  if (last) kick(cast.face*(plan.floor ? 18 : 8),plan.floor ? -10 : -2);

  const inRange = radius<0 ? forward>=-10 && forward<=beat[2] : Math.abs(opponent.x-center)<=radius;
  if (!inRange || opponent.air>height) return;
  const at = {
    kind:'sp', ultimate:true, dmg:damage, kb:last ? (plan.floor ? 465 : 330) : 22,
    rapid:!last || !!plan.clones, knockdown:last,
    guardBreak:!!plan.guardBreak, breakMarked:!!plan.breakMarked,
    slow:last ? plan.slow : 0, drain:last ? plan.drain : 0,
    launch:last ? plan.launch : 0, ultimatePayoff:last && !!plan.payoff
  };
  hit(f,opponent,at,!!plan.clones);
}

function drawUltimateTile(i, frame, x, floor, width, face, alpha, anchor=.5) {
  const image = ultimateImages[i];
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
    {x:line-cast.face*101, y:GY-80, size:120},
    {x:line+cast.face*38, y:GY-79, size:120},
    {x:line-cast.face*54, y:GY-11, size:131},
    {x:line+cast.face*95, y:GY-12, size:132},
  ];
}

function drawTripleTimer(f, cast, alpha) {
  const clones = clonePlacement(cast);
  clones.forEach((clone, i) => {
    const since = cast.lastBurst ? cast.elapsed-cast.lastBurst.time : -1;
    const recoil = since>=0 && since<.12 && !reduced ? 13*(1-since/.12) : 0;
    const x = clone.x-recoil*cast.face;
    const size=clone.size*(reduced?1.1:1.28);
    drawUltimateTile(f.ci,i,x,clone.y,size,cast.face,alpha*.96,.36);
    if (since<0 || since>.18) return;
    const muzzle = x+cast.face*size*.52;
    const target = cast.lastBurst.x;
    if ((target-muzzle)*cast.face<6) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha*(1-since/.18)*.74;
    ctx.lineCap='round';
    ctx.strokeStyle = i%2 ? '#19beff' : '#3fd4ff';
    ctx.lineWidth = i===2 ? 18 : 11;
    ctx.beginPath();
    ctx.moveTo(muzzle,clone.y-size*[.32,.40,.51,.44][i]);
    ctx.lineTo(target,cast.lastBurst.y+(i-1.5)*9);
    ctx.stroke();
    ctx.strokeStyle='#c8faff';ctx.lineWidth=i===2?6:3;ctx.stroke();
    ctx.restore();
  });
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
  const frame = plan.frames.filter(time => elapsed>=time).length;
  let x = clamp(cast.x+cast.face*plan.aim,60,900);

  if (plan.phaseRush) x=rxOf(f)+cast.face*(frame===0 ? -22 : 43);
  if (plan.response && frame>=2) x=ultimateBeatX(plan,cast,plan.beats[1],1,f);
  const powerFrame=frame===2;
  if (f.ci===0 || plan.book) {
    if (plan.book) x = cast.bookX ?? x;
    const width = summonWidth(x,frame,f.ci,plan.width*(powerFrame?1.12:1));
    // The crown lands to the right of the guardian within the final two cells.
    const crownOffset = f.ci===0 && frame>=2 ? (frame===2?.16:.19) : 0;
    if (crownOffset) x = ultimateBeatX(plan,cast,plan.beats[0],0,f)-cast.face*width*crownOffset;
    const summonAlpha=f.ci===0?alpha*ease((elapsed-.10)/.24):alpha;
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
  if (!P1 || !ultimateImages[9]) return;
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

