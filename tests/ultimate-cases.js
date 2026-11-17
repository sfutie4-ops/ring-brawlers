(() => {
  const checks = {};
  function fight(ci, opts={}) {
    sel = ci;
    newMatch(false);
    difficulty = 'training';
    phase = 'fight';
    P1.x = opts.left ? 580 : 380;
    P2.x = opts.left ? 430 : 530;
    P1.face = opts.left ? -1 : 1;
    P2.face = -P1.face;
    P1.mt = P2.mt = 100;
    P2.setup = opts.setup ? 3 : 0;
    P2.angle = opts.marked ? 3 : 0;
    if (opts.block) {
      P2.human = true;
      held[opts.left ? 'l' : 'r'] = 1;
      P2.backHeld = true;
    }
    if (opts.parry) P2.parryWindow = .12;
    if (opts.air) {P2.air = opts.air;P2.st = 'jump'}
    start(P1,'sp');
  }

  function playThroughImpact() {
    const plan=ULTIMATE_PLANS[P1.ci];
    for (let i=0;i<560&&P1.st==='sp'&&P1.ultimate.next<plan.beats.length;i++) step(1/120);
  }

  [36,29,27,41,33,31,34,23,25].forEach((expected,i) => {
    fight(i);
    playThroughImpact();
    checks[ROSTER[i].name+' damage'] = Math.abs(100-P2.hp-expected)<.001;
  });

  fight(0,{left:true});
  playThroughImpact();
  checks.mirroredCrown = P2.hp===64 && floorScars.length>=1;
  fight(0,{air:100});
  P1.t=.91;
  updateUltimate(P1,P2);
  checks.crownCanBeJumped = P2.hp===100 && floorScars.length>=1;

  fight(3,{block:true});
  const bookTarget = P2.x;
  P1.t=.38;
  updateUltimate(P1,P2);
  P2.x=bookTarget-24;P2.back=true;P1.t=1.04;
  updateUltimate(P1,P2);
  checks.libertyLocksAndBreaksGuard = P1.ultimate.bookX===bookTarget && P2.hp===59;
  fight(3);
  P1.t=.38;
  updateUltimate(P1,P2);
  P2.x+=130;P1.t=1.04;
  updateUltimate(P1,P2);
  checks.libertyCanBeDodged = P2.hp===100 && P1.ultimate.bookX!==P2.x;

  fight(5,{left:true});
  P2.x=232;
  const distance = Math.abs(P2.x-P1.ultimate.wellX);
  for(let j=0;j<260;j++) step(1/120);
  checks.blackHolePullsBeforeHit = P1.ultimate.next===0 &&
    Math.abs(P2.x-P1.ultimate.wellX)<distance-23 && P2.hp===100;
  P2.x=850;P1.t=.43;
  updateUltimate(P1,P2);
  checks.blackHoleHasLimitedPull = P2.x===850;

  fight(2,{marked:true,block:true});
  P2.back=true;P1.t=.77;
  updateUltimate(P1,P2);
  checks.markBreaksGuard = P2.hp===68 && P2.angle===0;

  fight(4,{block:true,parry:true});
  P2.back=true;P1.t=.58;
  updateUltimate(P1,P2);
  checks.cloneVolleyParry = P2.hp===100 && P2.parryWindow===0 && P1.st==='sp' &&
    clonePlacement(P1.ultimate).length===4;

  fight(6);
  P1.t=.26;
  const hp=P1.hp;
  hit(P2,P1,{kind:'kick',dmg:10,kb:22});
  checks.reboundCounter = P1.hp===hp && P1.ultimate.countered && P1.ultimate.reboundAt===P2.x;

  fight(7,{setup:true});
  playThroughImpact();
  checks.setupDetonates = P2.hp===62 && P2.setup===0;

  fight(0);
  P2.st='jump';P2.air=42;P2.vx=100;P2.vy=-150;
  const initial=P2.x;
  for(let i=0;i<120;i++) step(1/120);
  checks.castSlowsOpponent=P1.ultimate.next===0&&P2.x>initial+10&&P2.x<initial+29;
  for(let i=0;i<126;i++) step(1/120);
  checks.crownRhymeAndLevitation=P1.ultimate.rhyme===2&&ultimateBodyMotion(P1).dy<-80&&
    ultimateFaceImage(P1)===expressions['cast-expressions'];
  for(let i=0;i<49;i++) step(1/120);
  checks.cinematicDelaysFirstHit=P1.ultimate.next===0&&P2.hp===100;
  for(let i=0;i<20;i++) step(1/120);
  checks.cinematicReturnsToNormal=P1.ultimate.next===1&&castTimeScale(P1)===1;

  fight(7,{left:true});
  for(let i=0;i<201;i++) step(1/120);
  checks.mountainPhysicalClimb=P1.air>320&&P1.x<P1.ultimate.x&&mountainCameraY()<100;
  playThroughImpact();
  checks.mountainKickLands=P1.air===0&&P2.hp===77;

  fight(0);
  P1.st='idle';P1.ultimate=null;hitstop=0;
  press('crouch');
  for(let i=0;i<17;i++) step(1/120);
  checks.crouchControlAndSprite=P1.st==='crouch'&&selectFrame(P1)===cinematicFrames['states-early'][1];
  const shot={x:P1.x,y:GY-90,originY:GY-90,vx:70,owner:P2,face:-1,t:0,life:1,at:{kind:'wave',dmg:10,kb:50}};
  shots=[shot];step(1/120);
  checks.crouchDucksHighShot=P1.hp===100&&shot.life>0;
  held.crouch=0;
  step(1/120);
  checks.crouchRelease=P1.st==='hit'&&P1.hp<100;

  checks.distinctCrouchAndDown=[...Array(9).keys()].every(ci=>{
    const f=mk(ci,310,1,false);
    const state=cinematicFrames[STATE_SHEETS[Math.floor(ci/3)]];
    const i=ci%3*4;
    f.st='crouch';f.t=.02;
    const entry=selectFrame(f)===state[i];
    f.t=.19;
    const hold=selectFrame(f)===state[i+1];
    f.st='down';f.t=.52;
    const down=selectFrame(f)===state[i+2];
    f.t=.82;
    return entry&&hold&&down&&selectFrame(f)===state[i+3];
  });

  fight(8);
  P2.mt=40;P1.t=.73;
  updateUltimate(P1,P2);
  checks.crowdDrainAndSlow = P2.hp===75 && P2.mt<40 && P2.slow>2;

  fight(0);
  P2.hp=0;
  finishRound();
  checks.refereeSignalsWinner = refereeWinner===P1 && phase==='ko';
  checks.generatedSheetsLoad = ultimateImages.length===11 && ultimateImages.every(im=>im.width===896) &&
    ritualFrames.length===4 && ritualFrames.every(fr=>fr.im===ultimateImages[10]);
  return checks;
})()
