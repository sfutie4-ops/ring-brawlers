(() => {
  const result={};
  function reset(ci=0) {
    clearInput();
    sel=ci;
    newMatch(false);
    difficulty='training';
    practiceMana=false;
    phase='fight';
    msg='';
    P1.x=400;P2.x=560;
    P1.mt=70;
  }
  function frames(count){for(let i=0;i<count;i++)step(1/120)}
  const strike={kind:'punch',dmg:10,kb:0,ultimate:true};
  const testHit=(status)=>hit(P1,P2,{...strike,status});
  reset();P1.mt=35;press('charge');frames(25);
  result.chargeHasStartup=P1.mt===35 && P1.st==='chargeMana';
  frames(94);
  result.holdBuildsMana=P1.mt>52 && P1.mt<60;
  const saved=P1.mt;
  held.charge=0;frames(10);
  result.chargeRecovery=P1.st==='chargeRecover'&&P1.mt===saved;
  frames(20);result.chargeEnds=P1.st==='idle';

  reset();press('charge');frames(40);
  hit(P2,P1,strike);
  result.hitInterruptsCharge=P1.st==='hit'&&P1.hp===90;

  reset();P1.mt=98;press('charge');frames(60);
  result.fullManaTrigger=P1.mt===100&&P1.manaFull&&P1.manaBurst>0;

  reset(3);P1.mt=52;press('power');frames(78);held.power=0;frames(2);
  result.lowManaFallsBackToStandard=P1.st==='power'&&!P1.chargedPower&&P1.mt===7;
  reset(3);press('power');frames(17);held.power=0;frames(2);
  result.fastPower=P1.st==='power'&&!P1.chargedPower&&P1.mt===25;
  reset(3);press('power');frames(78);
  const readied=P1.chargeReady;
  held.power=0;frames(2);
  result.chargedPower=readied&&P1.chargedPower&&P1.mt===10;
  const base=moveData(P1);
  const stronger=powerHit(P1,base);
  result.chargedBatasStuns=stronger.dmg===base.dmg+8&&stronger.status.stun===.72;

  reset(7);press('power');frames(78);held.power=0;frames(150);
  result.chargedVolleyFreezes=P2.freeze>0 && P2.hp<100;

  reset(2);testHit({root:1.2});
  result.rootAllowsAttacks=P2.root>0&&!start(P2,'dash')&&start(P2,'punch');
  reset();testHit({stun:.55});
  result.stunLocksActions=P2.st==='stunned'&&!start(P2,'punch');
  frames(78);const before=P2.hp;testHit({stun:.6});
  result.resistancePreventsRepeat=P2.stun===0&&P2.hp===before-10&&P2.controlResist>0;

  reset(7);testHit({chill:2.2});hitstop=0;testHit({chill:2.2});
  result.chillStacksIntoFreeze=P2.st==='frozen'&&P2.freeze>0&&!start(P2,'punch');
  const frosted=P2.hp;hitstop=0;testHit({});
  result.shatterBonus=P2.freeze===0&&P2.hp===frosted-15;

  reset();P2.back=true;testHit({stun:.5,root:1,freeze:.6});
  result.guardPreventsStatuses=!P2.stun&&!P2.root&&!P2.freeze&&P2.st==='block';
  reset();testHit({slow:1.2});
  result.slowApplies=P2.slow===1.2;

  reset();testHit({freeze:.6});startRound();
  result.statusClearsBetweenRounds=!P2.freeze&&!P2.controlResist&&P2.st==='idle';
  result.newPortraitsLoaded=expressions.focus.width===576&&expressions.recoil.width===576;
  practiceMana=true;
  return result;
})()
