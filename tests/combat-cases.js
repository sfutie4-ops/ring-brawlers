(()=>{const d=ringDebug;let s=d.state,a=s.P2,b=s.P1;const result={};
 const reset=()=>{Object.assign(a,{x:500,hp:100,st:'punch',t:.11,face:-1,combo:0,mt:40,air:0,inv:0,counter:0,armor:0});Object.assign(b,{x:410,hp:100,st:'idle',t:0,face:1,air:0,inv:0,back:false,backHeld:false,parryWindow:0,parryCooldown:0,counter:0,armor:0});d.held.l=0;d.held.r=0};
 reset();d.held.l=1;d.updateDefense(b,a,.008);d.hit(a,b,{...d.moves.punch,kind:'punch'});result.parry=b.hp===100&&a.st==='hit'&&b.mt>=54;
 reset();d.held.l=1;d.updateDefense(b,a,.008);d.updateDefense(b,a,.15);d.hit(a,b,{...d.moves.punch,kind:'punch'});result.heldBackBlocks=b.st==='block'&&b.hp<100&&b.hp>98;
 reset();d.held.r=1;d.updateDefense(b,a,.008);d.hit(a,b,{...d.moves.punch,kind:'punch'});result.forwardDoesNotBlock=b.st==='hit'&&b.hp<95;
 reset();a.x=300;a.face=1;b.x=410;d.held.r=1;d.updateDefense(b,a,.008);d.hit(a,b,{...d.moves.punch,kind:'punch'});result.crossSideParry=b.hp===100&&b.face===-1;
 reset();d.held.l=1;d.updateDefense(b,a,.008);d.hit(a,b,{...d.moves.sp,kind:'sp',guardBreak:true});result.guardBreak=b.hp<80;
 reset();d.held.l=1;d.updateDefense(b,a,.008);d.hit(a,b,{...d.moves.wave,kind:'wave'},true);result.projectileParry=b.hp===100&&a.st==='punch';
 reset();d.held.l=1;d.updateDefense(b,a,.008);d.held.l=0;d.updateDefense(b,a,.03);d.held.l=1;d.updateDefense(b,a,.03);result.antiMash=b.parryWindow===0;
 d.resetEnvironment();d.floorDamage(145,2);d.floorDamage(145,2);result.breakableProps=d.environment.props[0].hp===0;result.floorDamage=d.environment.floorScars.length===2;
 reset();d.held.l=0;d.held.r=0;b.x=330;a.x=650;b.hp=20;b.mt=100;a.hp=100;a.st='idle';result.noBlockButton=!document.querySelector('[data-k=b]');result.noBlockKey=KM.s==='crouch'&&KM.arrowdown==='crouch'&&!Object.values(KM).includes('block');return result})()