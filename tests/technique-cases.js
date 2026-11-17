(() => {
  const checks={};
  function setup(ci, x=360, opponentX=459) {
    sel=ci;
    newMatch(false);
    difficulty='training';
    practiceMana=false;
    phase='fight';
    P1.x=x;P1.face=1;P1.mt=70;
    P2.x=opponentX;P2.face=-1;P2.mt=55;
  }
  function tick(count) {
    for (let i=0;i<count;i++) step(FIXED_DT);
  }
  function shot(x, speed) {
    const y=GY-89;
    const s={x,y,originY:y,vx:speed,face:Math.sign(speed),owner:P2,t:0,life:2.5,
      path:'straight',trail:0,at:{kind:'wave',dmg:13,kb:170},color:'#d4c4ff'};
    shots.push(s);
    return s;
  }
  const atlasFrames=TECHNIQUE_ATLASES.flatMap(name=>cinematicFrames[name]);
  checks.uniqueSkillSprites=atlasFrames.length===36&&new Set(atlasFrames).size===36&&
    TECHNIQUES.every((skill,i)=>{
      const f=mk(i,400,1,true);
      f.st='technique';
      const wind=selectFrame(f);
      f.t=skill.followAt??skill.hit;
      const active=selectFrame(f);
      f.t=skill.dur*.95;
      return wind&&active&&wind!==active&&selectFrame(f)!==active;
    });

  setup(0);
  press(KM.g);tick(1);held.technique=0;
  checks.skillInputAndCost=P1.st==='technique'&&P1.mt===70-TECHNIQUES[0].cost;
  tick(83);
  checks.endRhymeConfirmsTwoHits=P1.combo===2&&P2.hp<83;
  setup(0,300,550);
  start(P1,'technique');tick(84);
  checks.endRhymeWhiffHasNoFollowup=P1.combo===0&&!P1.techniqueConfirmed&&P2.hp===100;
  setup(0,360,439);
  P2.human=true;P2.backHeld=true;P2.parryCooldown=.5;held.r=1;
  start(P1,'technique');tick(84);
  checks.endRhymeGuardStopsFollowup=P2.hp<100&&P2.hp>98&&!P1.techniqueConfirmed;

  setup(1);
  start(P1,'technique');tick(28);
  const crossed=P1.x>P2.x&&P1.face===-1;
  tick(60);
  checks.mirageCrossSwapsAndStrikes=crossed&&P2.hp<100;
  setup(1,740,875);
  start(P1,'technique');tick(55);
  checks.mirageCrossRespectsArenaEdge=P1.x<P2.x&&P1.face===1;

  setup(2);
  P2.angle=2;
  start(P1,'technique');tick(50);
  checks.angleTaxSpendsMarkAndSteals=P2.angle===0&&P2.mt<47&&P1.mt>65;
  setup(2);
  start(P1,'technique');tick(50);
  checks.angleTaxNeedsMark=P2.mt>55&&P1.mt<60;

  setup(3,330,650);
  start(P1,'technique');tick(49);
  const wall=P1.techniqueField;
  shot(wall.x+66,-610);tick(19);
  const caught=wall.spent&&P1.hp===100;
  shot(wall.x+66,-610);tick(37);
  checks.ironWallStopsOnlyOneShot=caught&&P1.hp<100;

  setup(4,310,535);
  start(P1,'technique');tick(41);
  const relay=shots[0];
  const outbound=relay&&relay.vx<0&&!relay.returned&&P2.hp===100;
  tick(124);
  checks.ricochetArmsOnReturn=outbound&&relay.returned&&relay.vx>0&&P2.hp<100;

  setup(5,300,600);
  start(P1,'technique');tick(48);
  const snare=P1.techniqueField;
  P2.x=snare.x;P2.air=100;P2.st='jump';P2.vy=-90;
  tick(31);
  const canJump=!snare.spent&&P2.hp===100;
  P2.air=P2.vy=0;P2.st='idle';tick(1);
  checks.riftSnareOnlyCatchesGround=canJump&&snare.spent&&P2.root>1&&P2.hp<100;
  startRound();
  checks.techniqueFieldsClearBetweenRounds=P1.techniqueField===null&&P2.techniqueField===null;

  setup(6,310,620);
  start(P1,'technique');tick(27);
  const reflected=shot(408,-580);
  tick(53);
  checks.backtalkReflectsToCaster=reflected.reflected&&reflected.owner===P1&&reflected.vx>0&&
    P1.hp===100&&P2.hp<100;
  setup(6);
  start(P1,'technique');tick(86);
  checks.backtalkIsProjectileOnly=P2.hp===100;

  setup(7,360,570);
  start(P1,'technique');tick(78);
  checks.glacierHookPullsOnHit=P2.hp<100&&P2.x<523;

  setup(8);
  start(P1,'technique');tick(58);
  const mana=P2.mt;
  const locked=P2.hp<100&&P2.silence>0&&!start(P2,'wave')&&P2.mt===mana;
  P2.st='idle';
  const blocksCharge=!updateHold(P2,P1,{charge:true,dir:0},FIXED_DT)&&P2.st==='idle';
  const allowsBasics=start(P2,'punch');
  tacticsTick(P2,2);
  checks.heckleLocksManaTemporarily=locked&&blocksCharge&&allowsBasics&&start(P2,'wave');

  practiceMana=true;
  return checks;
})()
