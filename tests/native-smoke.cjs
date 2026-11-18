const fs=require('fs'),vm=require('vm'),{createCanvas,Image}=require('@napi-rs/canvas');
process.chdir(require('path').resolve(__dirname,'..'));fs.mkdirSync('.qa',{recursive:true});
const html=fs.readFileSync('index.html','utf8');const nodes={};function element(tag='div'){let e=tag==='canvas'?createCanvas(960,540):{};Object.assign(e,{tagName:tag.toUpperCase(),style:{setProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){}},children:[],offsetParent:true,innerHTML:'',append(...x){this.children.push(...x)},setAttribute(k,v){this[k]=v},getBoundingClientRect(){return{width:960,height:540}},addEventListener(){}});return e}for(const m of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"/g))nodes[m[2]]=element(m[1]);nodes.difficulty.value='training';const buttons={};for(const m of html.matchAll(/data-k="([^"]+)"/g)){buttons[m[1]]=element('button');buttons[m[1]].dataset.k=m[1]}
const doc={getElementById:id=>nodes[id]||(nodes[id]=element()),createElement:element,body:element(),documentElement:element(),addEventListener(){},querySelector:s=>buttons[s.match(/data-k[=\"']+([a-z])/i)?.[1]]||null,querySelectorAll:s=>s==='[data-k]'?Object.values(buttons):s==='.opts'?[element(),element()]:s==='.arena-card'?nodes.arenas.children:[]};const sb={console,Image,setTimeout,clearTimeout,document:doc,navigator:{maxTouchPoints:0},matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null,setItem(){}},addEventListener(){},removeEventListener(){},requestAnimationFrame(){},performance:{now:()=>0},devicePixelRatio:1};sb.window=sb;vm.createContext(sb);vm.runInContext([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n'),sb);const run=s=>vm.runInContext(s,sb);
(async()=>{for(let i=0;i<750&&!run('ready');i++)await new Promise(r=>setTimeout(r,20));if(!run('ready'))throw Error('Art not loaded');if(!run('arenaImages.length===3&&arenaImages.every(i=>i.width>0)'))throw Error('Generated arena assets not loaded');console.log('All three generated arena images loaded: PASS');run('newMatch(false);phase="fight";msg="";');
const tests=run(fs.readFileSync('tests/combat-cases.js','utf8'));
const ultimateTests=run(fs.readFileSync('tests/ultimate-cases.js','utf8'));
console.log(ultimateTests);
const tacticTests=run(fs.readFileSync('tests/tactics-cases.js','utf8'));
console.log(tacticTests);
const techniqueTests=run(fs.readFileSync('tests/technique-cases.js','utf8'));
console.log(techniqueTests);
Object.assign(tests,ultimateTests,tacticTests,techniqueTests);
tests.idleExpressionsForNineFighters=run(`CH.every((_,ci)=>{
  const f=mk(ci,350,1,true);f.st='idle';
  const period=2.8+(ci%4)*.28;
  f.t=period-ci*.22;const neutral=combatPortraitFrame(f);
  f.t=.42*period-ci*.22;const breath=combatPortraitFrame(f);
  f.t=.75*period-ci*.22;const blink=combatPortraitFrame(f);
  const atlas=ci<=1?'priest-abra-faces':'roster-faces';
  return new Set([neutral,breath,blink]).size===3 &&
    [neutral,breath,blink].every(frame=>frame.im===cinematicImages[atlas]);
})`);
tests.facialReactionsForNineFighters=run(`CH.every((_,ci)=>{
  const f=mk(ci,350,1,true);
  const states={punch:'attack',down:'recoil',frozen:'recoil',stunned:'recoil',block:'alert',win:'win'};
  return Object.entries(states).every(([st,pose])=>{
    f.st=st;f.t=MOVES[ci][st]?.hit??.3;
    return combatPortraitFrame(f)===rosterFaceFrame(ci,pose);
  });
})`);
tests.revisedSpritesStayConsistent=run(`Object.keys(REVISED_FIGHTERS).map(Number).every(ci=>[
  'idle','walk','dash','jump','block','hit','crouch','down','frozen','stunned','win',
  'chargeMana','chargePower','chargeRecover',...Object.keys(MOVES[ci]).filter(st=>st!=='sp')
].every(st=>{
  const f=mk(ci,350,1,true);f.st=st;f.t=MOVES[ci][st]?.hit??.2;
  return selectFrame(f).im===cinematicImages[REVISED_FIGHTERS[ci].sheet];
}))`);
tests.classicZaito=run(`(()=>{
  const f=mk(6,350,1,true);
  return selectFrame(f).im===cinematicImages['idle-expressions'] && (f.st='punch',CH[6].f.punch.includes(selectFrame(f)));
})()`);
for(const ci of [0,1,2,4,6,7]) {
  run(`setArena(2);sel=${ci};newMatch(false);phase='fight';msg='';P1.x=318;P2.x=646;
    cam.z=1;cam.cx=480;cam.cy=270;cam.kx=cam.ky=cam.trauma=0;draw();`);
  fs.writeFileSync(`.qa/roster-${ci}.png`,nodes.g.toBuffer('image/png'));
}
run("setArena(2);sel=3;newMatch(false);phase='fight';msg='';P1.x=300;P1.mt=100;checkFullMana(P1);P2.x=690;P2.st='frozen';P2.freeze=.7;P2.hitGlow=0;cam.z=1;cam.cx=480;cam.cy=270;cam.kx=cam.ky=cam.trauma=0;draw()");
fs.writeFileSync('.qa/full-mana-and-freeze.png',nodes.g.toBuffer('image/png'));

// Each character must change expression on the exact combat beat, including
// repeat volleys, then return to the normal portrait after the release.
tests.castingExpressions=run(`(()=>{
  if(!expressions['ultimate-windup']||!expressions['ultimate-impact'])return false;
  return ULTIMATE_PLANS.every((plan,i)=>{
    sel=i;newMatch(false);phase='fight';P1.mt=100;start(P1,'sp');
    const activeSheet=plan.castSheet && cinematicFrames[plan.castSheet];
    const revised=REVISED_FIGHTERS[i] && cinematicFrames[REVISED_FIGHTERS[i].sheet];
    const windup=activeSheet?.[0] || (i===0 ? revised[18] : i===5 ? ritualFrames[2] : rosterFaceFrame(i,'alert'));
    if(ultimateFaceImage(P1)!==windup||!ultimateBodyFrame(P1))return false;
    if(i===5&&ultimateBodyFrame(P1)!==cinematicFrames['cast-actions'][3])return false;
    if(revised&&i!==5&&!activeSheet&&ultimateBodyFrame(P1).im!==revised[0].im)return false;
    for(const beat of plan.beats){
      P1.t=beat[0]+.001;updateUltimate(P1,P2);
      const impact=activeSheet?.[2] || ((i===0||i===1) ? revised[19] : rosterFaceFrame(i,'attack'));
      if(ultimateFaceImage(P1)!==impact||!ultimateBodyFrame(P1))return false;
    }
    P1.ultimate.elapsed+=.25;
    return !ultimateFaceImage(P1)&&ultimateActingFrame(P1).phase==='recover';
  });
})()`);
// Compare the same impact frame with and without the new screen effects.
const canvas=nodes.g.getContext('2d');
for(const [ci,progress] of [[0,.41],[1,.42],[2,.33],[3,.51],[4,.33],[5,.52],[6,.33],[7,.39],[8,.38]]){
  run(`setArena(2);sel=${ci};newMatch(false);phase='fight';msg='';P1.x=340;P2.x=${ci===3?620:ci===7?540:446};P1.mt=100;
    cam.z=1;cam.cx=480;cam.cy=270;cam.kx=cam.ky=cam.trauma=0;start(P1,'technique');
    while(P1.st==='technique'&&P1.t<${progress}){step(FIXED_DT);fxUpdate(FIXED_DT,FIXED_DT)}draw();`);
  fs.writeFileSync(`.qa/unique-skill-${ci}.png`,nodes.g.toBuffer('image/png'));
}
for(const [ci,targets] of [
  [0,[[.08,'loonie-praying'],[.74,'loonie-gold-eyes']]],
  [1,[[.20,'abra-summon'],[.63,'abra-hellbreath']]],
  [2,[[.35,'shehyee-eye-open'],[.87,'shehyee-laser']]],
  [3,[[.65,'batas-law-book'],[1.13,'batas-axe-impact']]],
  [4,[[.45,'smugglaz-clones'],[.592,'smugglaz-muzzle-flash']]],
  [5,[[.19,'aklas-sniff-cinematic'],[.29,'aklas-dazed']]],
  [6,[[.38,'zaito-shadow-raised'],[.89,'zaito-shadow-swing'],[1.03,'zaito-shadow-splash']]],
  [7,[[.18,'apekz-climb'],[.30,'apekz-summit'],[.425,'apekz-dive'],[.53,'apekz-landed']]],
  [8,[[.32,'sinio-lotus'],[.70,'sinio-alter-ego'],[.88,'sinio-ground-smash']]],
]){
  run(`setArena(2);sel=${ci};newMatch(false);phase='fight';msg='';P1.x=340;P2.x=540;P1.mt=100;
    cam.z=1;cam.cx=480;cam.cy=270;cam.kx=cam.ky=cam.trauma=0;start(P1,'sp');`);
  for(const [elapsed,name] of targets){
    run(`for(let i=0;i<500&&P1.ultimate?.elapsed<${elapsed};i++){
      P1.prevX=P1.x;P1.prevAir=P1.air;step(FIXED_DT);fxUpdate(FIXED_DT,FIXED_DT);
    }
    renderAlpha=1;draw();`);
    fs.writeFileSync(`.qa/${name}.png`,nodes.g.toBuffer('image/png'));
  }
}
for(const [ci,time,name] of [[0,.53,'loonie-prayer'],[3,.31,'batas-statue'],
  [3,.72,'batas-book-open'],[5,.26,'aklas-sniff'],[5,.43,'aklas-pull']]){
  run(`setArena(2);sel=${ci};newMatch(false);phase='fight';msg='';P1.x=340;P2.x=550;P1.mt=100;
    cam.z=1;cam.cx=480;cam.cy=270;cam.kx=cam.ky=cam.trauma=0;start(P1,'sp');
    P1.t=${time};updateUltimate(P1,P2);advanceUltimateScreen(${time});banner.t=${time};flash=0;draw()`);
  fs.writeFileSync(`.qa/${name}.png`,nodes.g.toBuffer('image/png'));
}
for (let ci=0;ci<9;ci++){
  run(`setArena(2);sel=${ci};newMatch(false);phase='fight';msg='';P1.x=390;P2.x=580;P1.mt=100;
    cam.z=1;cam.cx=480;cam.cy=270;cam.kx=cam.ky=cam.trauma=0;start(P1,'sp');
    while(P1.ultimate.next<ULTIMATE_PLANS[sel].beats.length){
      P1.t=ULTIMATE_PLANS[sel].beats[P1.ultimate.next][0]+.002;
      updateUltimate(P1,P2);
    }
    advanceUltimateScreen(P1.t+.13);superScreen.since=.13;banner.t=.49;flash=0;cam.trauma=0;draw()`);
  const effected=canvas.getImageData(0,0,960,540).data;
  fs.writeFileSync(`.qa/ultimate-${ci}.png`,nodes.g.toBuffer('image/png'));
  run('var savedTestScreen=superScreen;resetUltimateScreen();draw()');
  const normal=canvas.getImageData(0,0,960,540).data;
  let changed=0,total=0,edgeChanged=0,edgeTotal=0;
  for(let y=156;y<493;y+=4)for(let x=0;x<960;x+=4){
    const k=(y*960+x)*4;
    const difference=Math.abs(effected[k]-normal[k])+Math.abs(effected[k+1]-normal[k+1])+Math.abs(effected[k+2]-normal[k+2]);
    const edge=x<128||x>832;
    if(difference>=45){changed++;if(edge)edgeChanged++}
    total++;
    if(edge)edgeTotal++;
  }
  tests['screen coverage '+ci]=changed/total>.28&&edgeChanged/edgeTotal>.3;
  console.log('Ultimate '+ci+' coverage:',(changed/total).toFixed(2),(edgeChanged/edgeTotal).toFixed(2));
  run('superScreen=savedTestScreen;reduced=true;draw();reduced=false;P1.st="hit";advanceUltimateScreen(1)');
  tests['impact cleanup '+ci]=run('superScreen===null');
}
run("P1.mt=100;start(P1,'sp');P1.st='hit';advanceUltimateScreen(.24)");
tests.interruptedWindupCleanup=run('superScreen===null');
run("P1.mt=100;start(P1,'sp');startRound()");
tests.roundResetsScreen=run('superScreen===null');
run("sel=6;newMatch(false);phase='fight';P1.mt=100;start(P1,'sp');P1.t=.79;updateUltimate(P1,P2)");
tests.zaitoDarkInMeteorWindup=run("zaitoShadowStrength(P1)>.8&&superScreen.beat===0&&ULTIMATE_PLANS[P1.ci].title==='Shadow Meteor'");
run("P1.t=.982;updateUltimate(P1,P2);advanceUltimateScreen(1.11)");
tests.zaitoMeteorTerminalBeat=run("superScreen.beat===1&&zaitoShadowStrength(P1)>.8");
run("sel=8;newMatch(false);phase='fight';P1.mt=100;start(P1,'sp');P1.t=.9;updateUltimate(P1,P2)");
tests.sinioUsesLotusSmash=run("zaitoShadowStrength(P1)===0&&ULTIMATE_PLANS[P1.ci].lotus===true");
run("newMatch(false);pt=.6;msgT=.6;draw()");
fs.writeFileSync('.qa/referee.png',nodes.g.toBuffer('image/png'));
console.log(tests);fs.writeFileSync('.qa/results.json',JSON.stringify({tests,validation:'Native Canvas rendering and JS simulation; browser unavailable in container'},null,2));fs.writeFileSync('assets/aftershock_fx_atlas.png',run('atlasCanvas.toBuffer("image/png")'));
for(let id=0;id<3;id++){run(`setArena(${id});startRound();phase='fight';msg='';P1.x=330;P2.x=650;P2.st='idle';P1.hp=100;P1.mt=100;cam.z=1;cam.cx=480;cam.cy=270;cam.kx=cam.ky=cam.trauma=0;vclock=2;draw()`);fs.writeFileSync(`.qa/arena-${id}.png`,nodes.g.toBuffer('image/png'));run(`start(P1,'sp');P1.t=.3;hitstop=0;for(let n=0;n<24;n++)fxUpdate(1/120,1/120);draw()`);fs.writeFileSync(`.qa/super-${id}.png`,nodes.g.toBuffer('image/png'))}
run("P1.hp=16;phase='fight';draw()");fs.writeFileSync('.qa/danger.png',nodes.g.toBuffer('image/png'));
let frames=0;for(let ci=0;ci<9;ci++){run(`sel=${ci};newMatch(false);phase='fight';P1.mt=100;P1.x=380;P2.x=540;`);for(const move of['punch','kick','upper','wave','sp','dash','rise','slide','dive','evade','power']){run(`P1.mt=100;P1.st='idle';P2.hp=100;start(P1,'${move}')`);for(let j=0;j<120;j++){run('step(1/120);fxUpdate(1/120,1/120)');frames++}}}const originalLoader=run('loadImage');run('CH[0].im=null;loadImage=()=>Promise.reject(new Error("simulated decode failure"))');await run('boot()');if(nodes.go.disabled||nodes.go.textContent!=='RETRY LOADING')throw Error('Retry recovery UI missing');sb.restoreLoader=originalLoader;run('loadImage=restoreLoader');await nodes.go.onclick();if(!run('ready'))throw Error('Retry did not recover');console.log('Loader failure/retry recovery: PASS');if(!run('CH.every(c=>Object.keys(c.extra).length===6&&Object.values(c.extra).every(a=>a.length===6))'))throw Error('Missing generated frames');console.log('324 generated frames wired: PASS');console.log('Simulated steps:',frames);console.log('PASS:',Object.values(tests).every(Boolean));if(Object.values(tests).some(v=>!v))process.exitCode=1;})();
