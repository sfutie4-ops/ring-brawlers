const TECHNIQUES = [
  {name:'End Rhyme', cost:24, hit:.20, dur:.65, reach:119, dmg:7, kb:45, rapid:true,
    followAt:.38, follow:finishRhyme, onCleanHit:confirmRhyme,
    detail:'Land the opening palm cleanly to earn a second strike.'},
  {name:'Mirage Cross', cost:29, prepareAt:.22, prepare:crossThrough, hit:.39, dur:.69,
    reach:107, dmg:15, kb:180,
    detail:'Slip behind a nearby opponent and strike back the other way.'},
  {name:'Angle Tax', cost:23, hit:.29, dur:.65, reach:127, dmg:13, kb:115,
    onCleanHit:collectAngleTax, detail:'A clean jab consumes an Angle Mark to steal up to 16 mana.'},
  {name:'Iron Wall', cost:26, hit:.37, dur:.72, release:raiseIronWall,
    detail:'Plant a barricade that stops one enemy energy shot for up to 2.6 seconds.'},
  {name:'Ricochet Relay', cost:27, hit:.29, dur:.65, dmg:16, kb:195, release:shootRelay,
    detail:'Fire backward. The cyan shot arms when it bounces off the arena edge.'},
  {name:'Rift Snare', cost:28, hit:.35, dur:.70, release:plantRiftSnare, dmg:8, kb:0,
    status:{root:1.18}, detail:'Set a floor rune. It catches a grounded opponent after it arms.'},
  {name:'Backtalk', cost:22, hit:.24, end:.45, dur:.65, during:reflectIncoming,
    detail:'Swat a nearby incoming energy shot back at its caster.'},
  {name:'Glacier Hook', cost:30, hit:.34, dur:.71, reach:235, dmg:12, kb:0,
    onCleanHit:reelIn, detail:'Catch an opponent with a blue hook and pull them closer for a follow-up.'},
  {name:'Heckle', cost:30, hit:.33, dur:.70, reach:188, dmg:10, kb:140,
    status:{silence:1.65}, detail:'A clean hit locks the opponent’s mana spend and charge for 1.65 seconds.'},
];

const TECHNIQUE_ATLASES = ['unique-early','unique-mid','unique-late'];
ATK.technique = {rank:4.5};
MOVES.forEach((moves,i) => {
  moves.technique = {...ATK.technique,...TECHNIQUES[i],kind:'technique'};
});

function techniqueFrame(f) {
  if (f.st!=='technique') return null;
  const a=moveData(f);
  const index=f.t>=a.dur*.77?3:f.t>=(a.followAt??a.hit)?2:f.t>=a.hit*.57?1:0;
  return cinematicFrames[TECHNIQUE_ATLASES[Math.floor(f.ci/3)]]?.[4*(f.ci%3)+index];
}

function startTechnique(f,a) {
  f.techniqueConfirmed=false;
  label(a.name,f.x,GY-209,COL[f.ci],13);
  ringFx(f.x,GY-13,COL[f.ci],95,.26,.3,3);
  sfx.whoosh(.9);
}

function updateTechnique(f,o) {
  const a=moveData(f);
  if (a.prepare && !f.hit && f.t>=a.prepareAt) {
    f.hit=true;
    a.prepare(f,o);
  }
  if (f.castCount===0 && f.t>=a.hit) {
    f.castCount=1;
    if (a.release) a.release(f,o,a);
    else if (a.reach) techniqueStrike(f,o,a);
  }
  if (a.during && f.t>=a.hit && f.t<=a.end && !f.techniqueConfirmed) a.during(f);
  if (a.follow && f.castCount===1 && f.t>=a.followAt) {
    f.castCount=2;
    a.follow(f,o,a);
  }
  if (f.st==='technique' && f.t>=a.dur) {
    f.st='idle';
    f.t=0;
  }
}

function techniqueStrike(f,o,a) {
  const distance=(o.x-f.x)*f.face;
  if (distance<-16 || distance>a.reach || Math.abs(f.air-o.air)>100) return;
  hit(f,o,a);
}

function confirmRhyme(f) {
  f.techniqueConfirmed=true;
}

function finishRhyme(f,o,a) {
  if (!f.techniqueConfirmed) return;
  sfx.cast(2);
  ringFx(f.x+f.face*62,GY-96,COL[f.ci],112,.29,.83,4);
  techniqueStrike(f,o,{...a,dmg:13,kb:205,reach:135,rapid:false,onCleanHit:null});
}

function crossThrough(f,o) {
  const gap=(o.x-f.x)*f.face;
  const destination=o.x+f.face*62;
  if (f.root>0 || o.air>95 || gap<0 || gap>176 || destination<65 || destination>895) return;
  const oldX=f.x;
  if (!reduced) ghosts.push({fr:techniqueFrame(f),x:oldX,air:f.air,face:f.face,col:COL[f.ci],t:0,dur:.34});
  f.x=f.prevX=destination;
  f.face=-f.face;
  f.inv=Math.max(f.inv,.11);
  ringFx(oldX,GY-92,COL[f.ci],104,.30,1.12,4);
  ringFx(f.x,GY-92,COL[f.ci],104,.26,1.12,4);
  sfx.whoosh(1.5);
}

function collectAngleTax(f,o) {
  if (o.angle<=0) return;
  o.angle=0;
  const amount=Math.min(o.mt,16);
  f.mt=Math.min(100,f.mt+amount);
  o.mt-=amount;
  if (amount>0) label('-'+Math.ceil(amount)+' MANA',o.x,GY-194,COL[f.ci],12);
}

function reelIn(f,o) {
  if ((o.x-f.x)*f.face<=63) return;
  o.vx=-f.face*510;
  f.techniqueConfirmed=true;
  ringFx(o.x,GY-o.air-86,COL[f.ci],130,.31,.76,4);
}

function raiseIronWall(f) {
  const x=clamp(f.x+f.face*82,68,892);
  f.techniqueField={kind:'wall',x,age:0,life:2.6,spent:false,face:f.face};
  dust(x,GY,12,0,1.1);
  sfx.thud();
}

function plantRiftSnare(f) {
  const x=clamp(f.x+f.face*108,68,892);
  f.techniqueField={kind:'snare',x,age:0,life:2.9,spent:false,face:f.face};
  ringFx(x,GY-5,COL[f.ci],90,.40,.35,3);
  sfx.cast(1);
}

function updateTechniqueFields(dt) {
  for (const [f,o] of [[P1,P2],[P2,P1]]) {
    const field=f.techniqueField;
    if (!field) continue;
    field.age+=dt;
    field.life-=dt;
    if (field.life<=0) {
      f.techniqueField=null;
      continue;
    }
    if (field.kind==='snare' && !field.spent && field.age>=.22 &&
        o.hp>0 && o.air<27 && Math.abs(o.x-field.x)<34) {
      const a=MOVES[f.ci].technique;
      if (hit(f,o,a,true)) {
        spendField(field,.29);
        ringFx(field.x,GY-31,COL[f.ci],129,.34,.82,5);
      }
    }
  }
}

function spendField(field,tail) {
  field.spent=true;
  field.life=tail;
}

function shootRelay(f,o,a) {
  const dir=-f.face;
  const x=f.x+dir*37, y=GY-101;
  shots.push({x,y,originY:y,vx:dir*692,face:dir,owner:f,t:0,life:2.8,path:'relay',trail:0,
    at:{kind:'technique',dmg:a.dmg,kb:a.kb},color:COL[f.ci],returned:false});
  flare(x,y,COL[f.ci],82);
  sfx.cast(2);
}

function reflectIncoming(f) {
  const y=GY-f.air-86;
  const incoming=shots.find(s=>s.owner!==f && s.life>0 && !s.reflected &&
    (s.path!=='relay'||s.returned) && Math.abs(s.x-f.x)<102 && Math.abs(s.y-y)<60 && (f.x-s.x)*s.vx>0);
  if (!incoming) return;
  const face=-Math.sign(incoming.vx);
  incoming.owner=f;
  incoming.face=face;
  incoming.vx=face*Math.max(570,Math.abs(incoming.vx));
  incoming.originY=incoming.y;
  incoming.path='straight';
  incoming.life=1.65;
  incoming.color=COL[f.ci];
  incoming.reflected=true;
  incoming.at={kind:'technique',dmg:clamp(incoming.at.dmg,11,19),kb:196,direction:face};
  f.techniqueConfirmed=true;
  label('RETURN TO SENDER',f.x,GY-208,COL[f.ci],14);
  ringFx(incoming.x,incoming.y,COL[f.ci],148,.32,1.04,5);
  sfx.block();
}

function techniqueShotContinues(s,target,previousX) {
  if (s.life<=0) return false;
  if (s.path==='relay' && !s.returned) {
    const edge=s.face<0?47:W-47;
    if ((s.x-edge)*s.face>=0) {
      s.x=s.px=edge;
      s.face=-s.face;
      s.vx=-s.vx;
      s.at.direction=s.face;
      s.returned=true;
      ringFx(edge,s.y,s.color,128,.33,1.05,5);
      sfx.cast(3);
    }
    return false;
  }
  const wall=target.techniqueField;
  if (wall?.kind==='wall' && !wall.spent && Math.abs(s.y-(GY-66))<65 &&
      Math.min(previousX,s.x)<=wall.x+12 && Math.max(previousX,s.x)>=wall.x-12) {
    spendField(wall,.33);
    s.life=0;
    sparks(wall.x,s.y,COL[target.ci],16,null,TAU,285);
    label('SHOT STOPPED',wall.x,GY-154,COL[target.ci],13);
    sfx.block();
    return false;
  }
  return true;
}

function techniqueAI(f,o,dist,controls,roll) {
  if (difficulty==='easy' || roll>.14 || !['idle','walk'].includes(f.st) ||
      f.air>0 || f.silence>0 || f.mt<TECHNIQUES[f.ci].cost || f.mt>=100) return false;
  const incoming=shots.some(s=>s.owner===o && s.life>0 && (f.x-s.x)*s.vx>0 && Math.abs(f.x-s.x)<275);
  const openings=[
    dist<108, dist>90&&dist<164&&!f.root, o.angle>0&&dist<117,
    incoming&&!f.techniqueField, dist>230, dist>99&&dist<170&&!f.techniqueField,
    incoming, dist>135&&dist<210, dist<169&&o.mt>=20,
  ];
  if (!openings[f.ci]) return false;
  controls.technique=true;
  return true;
}

function drawTechnique(f,o) {
  const field=f.techniqueField;
  if (field) {
    const wall=field.kind==='wall';
    const progress=field.spent?1:Math.max(.20,ease(field.age/.14));
    const fade=field.spent?clamp(field.life/.30,0,1):.88;
    const frame=wall?(field.spent?1:0):(field.spent?3:2);
    drawCinematicTile('technique-effects',frame,field.x,GY+7,wall?82:126,
      (wall?132:field.spent?138:41)*progress,field.face,fade,0,.97);
  }
  if (f.ci!==7 || f.st!=='technique' || f.t<.24 || f.t>.58) return;
  const a=MOVES[f.ci].technique;
  const x=rxOf(f)+f.face*49,y=GY-raOf(f)-100;
  const reach=easeOut((f.t-.24)/(a.hit-.24))*(1-ease((f.t-a.hit)/.24));
  const endX=f.techniqueConfirmed?rxOf(o):x+f.face*a.reach*.79*reach;
  const endY=f.techniqueConfirmed?GY-raOf(o)-88:y+6;
  ctx.save();
  ctx.globalCompositeOperation='screen';
  ctx.globalAlpha=.36+.54*reach;
  ctx.beginPath();ctx.moveTo(x,y);
  ctx.quadraticCurveTo((x+endX)*.5,y-33*reach,endX,endY);
  ctx.strokeStyle='#507ef4';ctx.lineWidth=9;ctx.stroke();
  ctx.strokeStyle='#d1f1ff';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.arc(endX,endY,7+6*reach,0,TAU);ctx.stroke();
  ctx.restore();
}
