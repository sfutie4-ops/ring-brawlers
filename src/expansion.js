// Generated 36-frame sheets: five new actions and a replacement ultimate.
const NEW_ACTIONS=['rise','slide','dive','evade','power'];
const EXTRA_NAMES=[
['Crown Rise','Bar Slide','Golden Drop','Beat Step','Rhyme Barrage'],
['Mirage Rise','Phantom Slide','Violet Dive','Illusion Roll','Ghost Rush'],
['Angle Rise','Redline Slide','Pressure Dive','Angle Step','Crimson Mark'],
['Iron Rise','Anvil Slide','Hammer Drop','Iron Roll','Faultline'],
['Turbo Rise','Velocity Slide','Flash Dive','Speed Roll','Overclock'],
['Chaos Rise','Crooked Slide','Wild Dive','Rift Roll','Zigzag Burst'],
['Rebound Rise','Freestyle Slide','Bounce Drop','Rebuttal Roll','Echo Bounce'],
['Setup Rise','Double Slide','Payoff Dive','Pivot Roll','Triple Trigger'],
['Punchline Rise','Crowd Slide','Mic Drop','Juke Roll','Laugh Wave']];
const extraImages=[];
function configureExpansion(){
 const base={rise:{dur:.72,hit:.25,end:.40,reach:140,dmg:17,kb:160,cost:25,rank:3},slide:{dur:.62,hit:.25,end:.43,reach:145,dmg:12,kb:260,cost:12,rank:2,knockdown:true},dive:{dur:.82,hit:.38,end:.58,reach:155,dmg:19,kb:310,cost:22,rank:3},evade:{dur:.44,hit:.20,end:.25,reach:0,dmg:0,kb:0,cost:14,rank:1,counter:true},power:{dur:.95,hit:.38,end:.60,reach:195,dmg:23,kb:340,cost:45,rank:4}};
 Object.assign(ATK,base);
 MOVES.forEach((m,i)=>{for(const k of NEW_ACTIONS)m[k]={...base[k],kind:k};
  m.rise.dmg+=i===3?4:i===4?-3:0;m.slide.reach+=i===1||i===4?30:0;m.dive.kb+=i===3?130:0;
  if(i===0)m.power.volley=volley([.38,.47,.56,.65,.74],5,'straight',540);
  if(i===1){m.power.lunge=670;m.power.slow=1.2}
  if(i===2){m.rise.mark='angle';m.slide.mark='angle';m.power.mark='angle';m.power.breakMarked=true}
  if(i===3){m.power.guardBreak=true;m.power.dmg=28;m.power.reach=210}
  if(i===4)m.power.volley=volley([.32,.38,.44,.50,.56,.62],4,'straight',690);
  if(i===5)m.power.volley=volley([.35,.51,.67],8,'zigzag',470);
  if(i===6)m.power.volley=volley([.38,.60],12,'bounce',430);
  if(i===7){m.rise.mark='setup';m.power.volley=volley([.35,.52,.69],[5,9,14],'straight',530)}
  if(i===8){m.power.reach=260;m.power.slow=1.7;m.slide.slow=.7}
 });
}
async function loadExtraArt(progress){for(let i=0;i<EXTRA_ART.length;i++){progress(i);if(!extraImages[i])extraImages[i]=await loadImage(EXTRA_ART[i]);const im=extraImages[i],w=im.width/6,h=im.height/6;
 CH[i].extra={};[...NEW_ACTIONS,'sp'].forEach((name,row)=>{CH[i].extra[name]=Array.from({length:6},(_,col)=>({im,x:col*w,y:row*h,w,h,ax:w*.48,ay:h*.96,scale:1.04}))});}}
function extraStart(f,move){if(!NEW_ACTIONS.includes(move))return;const a=moveData(f,move);label(EXTRA_NAMES[f.ci][NEW_ACTIONS.indexOf(move)],f.x,GY-210,COL[f.ci],12);
 if(move==='evade'){f.inv=f.ci===1?.35:.23;f.vx=f.face*(f.ctl.dir*f.face<0?-1:1)*(f.ci===4?640:460);if(f.ci===5){f.x=clamp(f.x+f.face*95,65,895);f.prevX=f.x}if(f.ci===6)f.counter=.18}
 if(move==='slide')f.vx=f.face*(f.ci===4?640:f.ci===3?330:480);
 if(move==='dive')f.vx=f.face*350;
 if(move==='rise'){f.vx=f.face*190;if(f.ci===3)f.armor=.3}
 if(move==='power'){f.vx=f.face*(a.lunge||100);if(f.ci===3)f.armor=.4;effect(1,f.x,GY-90,160,f.face,.6)}
}
function extraFrame(f){const frames=CH[f.ci].extra?.[f.st];if(!frames)return null;const a=moveData(f);const peak=a.hit;const times=[0,peak*.32,peak*.7,peak,lerp(peak,a.dur,.5),a.dur*.88];let i=0;for(let j=1;j<6;j++)if(f.t>=times[j])i=j;return frames[i]}
function extraControls(){document.querySelectorAll('[data-extra]').forEach(b=>{const i=+b.dataset.extra;b.textContent=EXTRA_NAMES[sel][i];b.title=['Q','E','R','T','Y'][i]});}
configureExpansion();
