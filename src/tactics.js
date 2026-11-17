const MANA_WINDUP = .3;
const MANA_RATE = 28;
const POWER_WINDUP = .55;
const CHARGED_POWER_COST = 60;
const CONTROL_RESISTANCE = .95;
const IMMOBILE_MOVES = new Set(['dash','evade','slide','dive']);
const LOCKED_STATES = new Set(['stunned','frozen']);
const expressions = {};
let practiceMana = store.get('practiceMana',true);

const CONTROL = {
  stun:   {label:'STUNNED', color:'#ffe071'},
  slow:   {label:'SLOWED',  color:'#c6a0ff'},
  freeze: {label:'FROZEN',  color:'#a7eeff'},
  root:   {label:'ROOTED',  color:'#99f58e'},
  chill:  {label:'CHILL',   color:'#88cbff'},
  silence:{label:'MANA LOCK', color:'#ff9bdc'},
};
const CHARGED_POWER = [
  {damage:5, status:{stun:.54}, note:'Last gold bar stuns.'},
  {damage:7, status:{slow:2.5}, note:'A stronger slow traps retreating fighters.'},
  {damage:6, status:{root:1.45}, note:'Roots and marks the opponent for Angle Breaker.'},
  {damage:8, status:{stun:.72}, note:'The guard-breaking Faultline stuns on its clean hit.'},
  {damage:5, status:{stun:.5}, note:'Last shot stuns after a sustained barrage.'},
  {damage:6, status:{root:1.55}, note:'Last zigzag bolt roots, setting up Black Hole.'},
  {damage:7, status:{root:1.15}, note:'Last rebound roots and makes the delay harder to escape.'},
  {damage:6, status:{freeze:.78}, note:'Last blue shot freezes. A clean follow-up shatters the ice.'},
  {damage:6, status:{slow:2.65}, drain:12, note:'The wide sound strike slows and drains up to 12 mana.'},
];

// A clean ranged mark or rift soft-locks spacing; the charged signature is
// the commitment that opens up full crowd control.
MOVES[2].wave.status = {root:1.1};
MOVES[5].wave.status = {root:.76};
MOVES[3].power.status = {stun:.46};
MOVES[7].wave.status = {chill:2.2};
MOVES[6].wave.status = {slow:.8};

function tacticsState() {
  return {stun:0,root:0,freeze:0,chill:0,silence:0,techniqueField:null,controlResist:0,manaFull:false,manaBurst:0,chargeReady:false,chargedPower:false};
}
function tacticsTick(f, dt) {
  for (const key of ['stun','root','freeze','chill','silence','controlResist','manaBurst']) {
    f[key] = Math.max(0,(f[key]||0)-dt);
  }
  if (LOCKED_STATES.has(f.st) && !f.freeze && !f.stun) {
    f.st='idle';
    f.t=0;
  }
}
function checkFullMana(f) {
  const full = f.mt>=100 && f.hp>0;
  if (full && !f.manaFull) {
    f.manaBurst = .56;
    const x = f.x, y = GY-f.air;
    ringFx(x,y-8,'#ffe186',183,.58,.26,5);
    embers(x,y-83,'#ffe791',13,45,53);
    if (f.human) tone(790,.16,'sine',.065);
  }
  f.manaFull=full;
}
function actionLocked(f) {return f.freeze>0 || f.stun>0}
function movementLocked(f,move) {return f.root>0 && IMMOBILE_MOVES.has(move)}
function chargeStatus(f) {
  return f.t>=POWER_WINDUP && f.mt>=CHARGED_POWER_COST;
}
function enterHold(f, state) {
  f.st=state;
  f.t=0;
  f.vx=0;
  f.back=false;
  f.parryWindow=0;
  f.chargeReady=false;
  f.ultimate=null;
}
function updateHold(f,opponent,controls,dt) {
  if (actionLocked(f)) return true;
  const wantsAttack=controls.p || controls.k || controls.h || controls.w || controls.q || controls.e ||
    controls.risingDive || controls.roll || controls.technique || controls.s || controls.d || controls.u;
  if (f.st==='chargeRecover') {
    if (f.t>=.18) {f.st='idle';f.t=0}
    return true;
  }
  if (f.silence>0) {
    if (f.st==='chargeMana'||f.st==='chargePower') enterHold(f,'chargeRecover');
    return false;
  }
  if (f.st==='chargeMana') {
    if (!controls.charge || controls.dir || controls.power || wantsAttack) {
      f.st='chargeRecover';
      f.t=0;
    } else if(f.t>=MANA_WINDUP) {
      f.mt=Math.min(100,f.mt+MANA_RATE*dt);
    }
    return true;
  }
  if (f.st==='chargePower') {
    const ready=chargeStatus(f);
    if(ready && !f.chargeReady) {
      f.chargeReady=true;
      ringFx(f.x,GY-95,COL[f.ci],115,.33,1,4);
      tone(640,.09,'triangle',.04);
    }
    if (!controls.powerHeld) {
      f.st='idle';
      f.t=0;
      start(f,'power',ready);
    }
    return true;
  }
  if (f.air>0 || !['idle','walk'].includes(f.st)) return false;
  f.face=opponent.x>=f.x?1:-1;
  if (controls.power && controls.powerHeld && f.mt>=moveData(f,'power').cost && !wantsAttack) {
    if (f.human) buf.power=0;
    enterHold(f,'chargePower');
    return true;
  }
  if (controls.charge && !controls.dir && !controls.power && !wantsAttack && f.mt<100) {
    enterHold(f,'chargeMana');
    return true;
  }
  return false;
}
function powerHit(f, attack, index=null) {
  if (f.st!=='power' || !f.chargedPower) return attack;
  const boost=CHARGED_POWER[f.ci];
  if (attack.volley && index!==attack.volley.length-1) return attack;
  return {...attack,powered:true,dmg:attack.dmg+boost.damage,status:{...attack.status,...boost.status},drain:boost.drain||attack.drain};
}
function shatterIce(defender, blocking, armored) {
  if (!(defender.freeze>0) || blocking || armored) return 0;
  defender.freeze=0;
  const col='#a7eeff';
  shards(defender.x,GY-defender.air-75,col,17,null,TAU,420);
  label('SHATTER +5',defender.x,GY-defender.air-194,col,15);
  return 5;
}
function applyTacticsHit(defender, attack, armored) {
  if (armored || defender.hp<=0) return;
  const status=attack.status||{};
  const slow=Math.max(attack.slow||0,status.slow||0);
  if (slow) defender.slow=Math.max(defender.slow,slow);
  if (status.root) {
    defender.root=Math.max(defender.root,status.root);
    ringFx(defender.x,GY-defender.air-8,CONTROL.root.color,113,.41,.35,5);
  }
  if (status.silence) {
    defender.silence=Math.max(defender.silence,status.silence);
    ringFx(defender.x,GY-defender.air-97,CONTROL.silence.color,108,.38,1,4);
  }
  let freeze=status.freeze||0;
  if (status.chill) {
    if (defender.chill>0) {freeze=Math.max(freeze,.66);defender.chill=0}
    else {defender.chill=status.chill;defender.slow=Math.max(defender.slow,.62)}
  }
  const stun=status.stun||0;
  if (defender.controlResist>0 || (!stun&&!freeze) || defender.st==='down') return;
  const type=freeze?'freeze':'stun';
  const time=freeze||stun;
  defender[type]=time;
  defender.controlResist=time+CONTROL_RESISTANCE;
  defender.st=freeze?'frozen':'stunned';
  defender.t=0;
  defender.parryWindow=0;
  const row=CONTROL[type];
  const x=defender.x, y=GY-defender.air-100;
  if (freeze) {
    defender.vx=0;
    defender.vy=0;
    shards(x,y,row.color,15,null,TAU,250);
  } else {
    sparks(x,y-40,row.color,10,null,TAU,240,280);
  }
  ringFx(x,y,row.color,108,.34,1.1,3);
}

// Charge uses the grounded guard pose as a base. The continuous breath,
// stance compression and rewind on release are rendered at display speed.
function tacticFrame(f) {
  const frames=CH[f.ci].f;
  if (f.st==='chargePower' && f.t>=.15) return frames.block?.[0]||frames.idle[0];
  if (f.st==='chargeMana'||f.st==='chargePower'||f.st==='chargeRecover') return frames.idle[0];
  if (LOCKED_STATES.has(f.st)) return frames.hit?.[0]||frames.idle[0];
  if (f.st==='hit' && f.t>=.21) return frames.block?.[0]||frames.idle[0];
  return null;
}
function chargePose(f, pose) {
  if (f.st==='chargeMana'||f.st==='chargePower'||f.st==='chargeRecover') {
    const wind=f.st==='chargeRecover'?1-ease(f.t/.18):ease(f.t/.33);
    const breath=reduced?0:Math.sin(vclock*10)*.022*wind;
    pose.sx+=wind*.094;
    pose.sy-=wind*.081+breath;
    pose.dy+=wind*2;
    pose.angle-=wind*.046;
  } else if (f.st==='stunned') {
    pose.angle-=.11+(reduced?0:Math.sin(vclock*15)*.055);
    pose.sy-=.04;
  } else if (f.st==='frozen') {
    pose.angle=-.035;
  }
  return pose;
}

function drawManaAura(f,fr,x,y,sx,sy,angle) {
  if(f.hp<=0 || !['fight','intro'].includes(phase))return;
  const full=f.mt>=100;
  const mana=f.st==='chargeMana';
  const power=f.st==='chargePower';
  const release=f.st==='power'&&f.chargedPower;
  if(!full&&!mana&&!power&&!release)return;
  const strength=release?.94-.48*ease(f.t/.64):full?1:mana?.35+.48*ease(f.t/.82):.35+.6*ease(f.t/POWER_WINDUP);
  const color=full?'#ffd673':COL[f.ci];
  const pulse=reduced?0:Math.sin(vclock*9)*.05;
  const burst=f.manaBurst||0;
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=(strength+pulse)*.55;
  ctx.drawImage(glow(color),x-97,y-226,194,242);
  ctx.globalAlpha=(strength+pulse)*.67;
  const flicker=reduced?0:vclock*12;
  const height=157+strength*46+burst*34;
  for (let i=0;i<(lowQ()?7:12);i++) {
    const left=i%2===0?-1:1;
    const base=25+(i%6)*8, lift=(.57+(i%4)*.13)*height;
    const wave=Math.sin(flicker+i*2.4)*9;
    const g=ctx.createLinearGradient(0,y,0,y-lift);
    g.addColorStop(0,color+'10');g.addColorStop(.28,color+'95');g.addColorStop(.7,color+'e0');g.addColorStop(1,'#ffffff00');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(x+left*base,y-4);
    ctx.bezierCurveTo(x+left*(base+35)+wave,y-lift*.42,x+left*(base-8)-wave,y-lift*.7,x+left*(base+10)+wave,y-lift);
    ctx.bezierCurveTo(x+left*(base+25)-wave,y-lift*.55,x+left*(base+7)+wave,y-lift*.32,x+left*(base-7),y);
    ctx.fill();
  }
  ctx.globalAlpha=1;
  ctx.strokeStyle=color;
  ctx.lineWidth=2+burst*4;
  ctx.beginPath();ctx.ellipse(x,y-3,62+burst*40,13,0,0,TAU);ctx.stroke();
  if(full&&!lowQ()) {
    ctx.globalAlpha=.47;
    ctx.strokeStyle='#fff1b6';
    ctx.lineWidth=1.7;
    for (const side of [-1,1]) {
      const offset=reduced?0:Math.sin(flicker*.78+side)*7;
      ctx.beginPath();
      ctx.moveTo(x+side*68,y-34);
      ctx.lineTo(x+side*(82+offset),y-65);
      ctx.lineTo(x+side*74,y-72);
      ctx.lineTo(x+side*(89-offset),y-126);
      ctx.stroke();
    }
    ctx.globalAlpha=.23;
    drawSprite(fr,x-2,y,f.face,1,false,sx*1.025,sy*1.014,angle,color);
  }
  ctx.restore();
}

function currentStatus(f) {
  for (const key of ['freeze','stun','silence','root','chill','slow']) {
    if (f[key]>0) return {...CONTROL[key],key,time:f[key]};
  }
  return null;
}
function drawTacticalOverlay(f,x,y) {
  const status=currentStatus(f);
  if (f.freeze>0) {
    ctx.save();
    ctx.fillStyle='#9eeaff48';
    ctx.strokeStyle='#bbf6ffb0';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(x-54,y-28);ctx.lineTo(x-51,y-115);ctx.lineTo(x-27,y-181);
    ctx.lineTo(x+21,y-193);ctx.lineTo(x+48,y-142);ctx.lineTo(x+56,y-15);
    ctx.lineTo(x+32,y+5);ctx.lineTo(x-31,y+5);ctx.closePath();
    ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(x-27,y-181);ctx.lineTo(x-8,y-87);ctx.lineTo(x-31,y+5);
    ctx.moveTo(x+21,y-193);ctx.lineTo(x+17,y-73);ctx.lineTo(x+56,y-15);ctx.stroke();
    ctx.restore();
  }
  if (f.root>0 || f.slow>0) {
    const rooted=f.root>0, col=rooted?CONTROL.root.color:CONTROL.slow.color;
    ctx.save();ctx.strokeStyle=col+'b0';ctx.lineWidth=2;ctx.setLineDash(rooted?[7,3]:[3,7]);
    ctx.lineDashOffset=reduced?0:-vclock*(rooted?16:48);
    for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(x,y+2-i*9,51-i*9,10-i,0,0,TAU);ctx.stroke()}
    ctx.restore();
  }
  if(f.stun>0) {
    for(let i=0;i<3;i++) {
      const a=(reduced?0:vclock*5)+i*TAU/3;
      const starX=x+37*Math.cos(a), starY=y-190+7*Math.sin(a);
      ctx.save();ctx.translate(starX,starY);ctx.fillStyle=CONTROL.stun.color;ctx.rotate(Math.PI/4);
      ctx.fillRect(-4,-4,8,8);ctx.restore();
    }
  }
  if (status) {
    text(status.label+' '+status.time.toFixed(1)+'s',x,y-211,11,status.color);
  } else if(f.st==='chargeMana'||f.st==='chargePower') {
    const mana=f.st==='chargeMana';
    const progress=mana?f.mt/100:clamp(f.t/POWER_WINDUP,0,1);
    const col=mana?'#ffd77a':COL[f.ci];
    ctx.fillStyle='#0e1426de';ctx.fillRect(x-43,y-205,86,6);
    ctx.fillStyle=col;ctx.fillRect(x-43,y-205,86*progress,6);
    const labelText=mana?(progress>=1?'FULL MANA':'CHARGING MANA'):f.chargeReady?'CHARGED · RELEASE':f.mt<CHARGED_POWER_COST?'STANDARD · NEED 60 MANA':'CHARGING POWER';
    text(labelText,x,y-212,10,col);
  }
}

async function loadExpressions(progress) {
  for(const [index,asset] of EXPRESSION_ART.entries()) {
    progress(index);
    if(!expressions[asset.name])expressions[asset.name]=await loadImage(asset.src);
  }
}
function drawCombatPortrait(f,pr) {
  let expression=ultimateFaceImage(f);
  if(LOCKED_STATES.has(f.st)||f.st==='hit'||f.st==='down')expression=expressions.recoil;
  else if(!expression && (f.st==='chargeMana'||f.st==='chargePower'||(f.st!=='sp'&&f.mt>=100)))expression=expressions.focus;
  if(!expression) {
    ctx.drawImage(portrait(f.ci),-pr,-pr+2,pr*2,pr*2);
    return;
  }
  drawExpressionCell(expression,f.ci,-pr,-pr-2,pr*2,pr*2+5);
}

function tacticalAI(f,opponent,dist,controls,roll) {
  if (f.st==='chargeMana') {
    controls.charge=dist>290 && f.mt<90 && !shots.some(shot=>shot.owner===opponent);
    return true;
  }
  if (f.st==='chargePower') {
    controls.powerHeld=f.t<POWER_WINDUP+.06;
    return true;
  }
  if (difficulty==='easy'||!['idle','walk'].includes(f.st)||f.air>0) return false;
  if (dist>405 && f.mt<66 && roll<.25 && !ATK[opponent.st] && !shots.some(shot=>shot.owner===opponent)) {
    controls.charge=true;
    return true;
  }
  if (difficulty==='hard' && dist>=108 && dist<=215 && f.mt>=CHARGED_POWER_COST &&
      f.mt<100 && roll<.12 && !ATK[opponent.st]) {
    controls.power=true;
    controls.powerHeld=true;
    return true;
  }
  return false;
}
