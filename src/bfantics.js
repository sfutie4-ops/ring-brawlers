// ---------- Battlefield Antics: 100 cosmetic gag clips around the fight (plus the Antics Vol. 2 layer) ----------
// back    : mascots, props and stage crew loop on the far floor behind the fighters
// crowd   : spectators pop up over the railing to react to big moments
// overlay : comic cue stickers (rebuttal, multis, time up…) pop under the timer
// Purely decorative: no collision, never pauses the fight. Off when motion is reduced.
const bfImg=new Map();
function bfImage(id){let i=bfImg.get(id);if(!i){i=new Image();i.src=BF_ANTICS.clips[id].src;bfImg.set(id,i)}return i}
const BF_BY_EVENT={};for(const[id,c]of Object.entries(BF_ANTICS.clips))(BF_BY_EVENT[c.event]||=[]).push(id);
// engine events → the pack's event names (tried in random order)
const BF_ALIAS={counter_success:['successful_rebuttal','crowd_reaction'],combo_three:['combo_threshold','crowd_reaction'],
  heavy_bar_landed:['heavy_bar_landed','heavy_hit','crowd_reaction','comedy_hit','battle_cue'],judges_reveal:['judges_reveal','draw'],
  round_win:['round_win','crowd_reaction'],round_start:['round_start','match_intro','entrance','rival_intro','audition_enter','bracket_advance'],
  random_cue:['battle_cue','battle_cue','mark_consumed','partner_tag','assist_chain','comedy_hit','crowd_reaction','combo_whiff']};
const BF_MOVERS=/scoot|waddle|jeepney|tricycle|hop|pigeon|trip|delivery|plane|steps|shuffle|crab|snake|chase|sweep/;
const BF_FLOOR=402;
let bfActive=[],bfLast={},bfT=0,bfAmbAt=3,bfOverAt=0,bfCrowdSide=0,bfIdle=0,bfHits=0,bfOvertime=false,bfPrev=null,bfManaFull=false;
function bfReset(){bfActive=[];bfLast={};bfT=0;bfAmbAt=1.5+Math.random()*2;bfOverAt=0;bfIdle=0;bfHits=0;bfOvertime=false;bfPrev=null;bfManaFull=false}
const bfDur=c=>c.ms.reduce((a,b)=>a+b,0)/1000;
function bfPlay(id,opts={}){const c=BF_ANTICS.clips[id];if(!c||reduced||!P1||cameraPrank||sockCutaway)return false;if(bfT-(bfLast[id]??-1e9)<c.cd)return false;
  const same=bfActive.filter(a=>a.c.layer===c.layer).length;
  if(c.layer==='overlay'){if(same||bfT<bfOverAt)return false;bfOverAt=bfT+1.6}
  else if(c.layer==='crowd'){if(same)return false}
  else if(same>=(lowQ()?1:2))return false;
  bfImage(id);bfLast[id]=bfT;
  const d=bfDur(c),a={id,c,t0:bfT,life:c.layer==='back'?Math.max(3.4,d*(c.loop?4:3)):c.layer==='crowd'?d+1.2:d+.8};
  if(c.layer==='back'){const used=bfActive.filter(b=>b.c.layer==='back').map(b=>b.x);let x=480;for(let k=0;k<10;k++){x=80+Math.random()*800;if(used.every(u=>Math.abs(u-x)>170))break}
    a.x=x;a.face=x<480?1:-1;a.vx=BF_MOVERS.test(id)?a.face*(26+Math.random()*24):0;if(a.vx)a.life=Math.max(a.life,5)}
  else if(c.layer==='crowd')a.side=bfCrowdSide^=1;
  else a.x=opts.x??(Math.random()<.5?300:660);
  bfActive.push(a);return true}
function bfEvent(name,opts){if(reduced)return false;const names=BF_ALIAS[name]||[name];
  for(const n of names.slice().sort(()=>Math.random()-.5)){const list=BF_BY_EVENT[n];if(!list)continue;const s=Math.random()*list.length|0;
    for(let i=0;i<list.length;i++)if(bfPlay(list[(s+i)%list.length],opts))return true}
  return false}
// every landed hit: now and then a random cue sticker
function bfHit(a,d,at,dmg,blocking){if(blocking||at.assist||!P1)return;bfHits++;
  if(at.ultimate){bfEvent('ultimate_landed')||bfEvent('crowd_reaction');return}
  if(bfHits%5===0&&Math.random()<.55)bfEvent('random_cue')}
function bfStep(dt){bfT+=dt;bfActive=bfActive.filter(a=>bfT-a.t0<a.life);for(const a of bfActive)if(a.vx)a.x+=a.vx*dt;
  if(phase!=='fight'||!P1||reduced)return;
  if(bfT>=bfAmbAt){bfEvent('ambient_poll');bfAmbAt=bfT+3+Math.random()*3.5}
  const calm=[P1,P2].every(f=>['idle','walk','block','crouch'].includes(f.st)&&f.air===0)&&Math.abs(P1.x-P2.x)>160;
  bfIdle=calm?bfIdle+dt:Math.min(bfIdle,0);if(bfIdle>3.2){bfIdle=-8;bfEvent('idle_standoff')}
  if(!bfOvertime&&difficulty!=='training'&&timer<=10){bfOvertime=true;bfEvent('overtime_start')}
  const full=P1.mt>=100;if(full&&!bfManaFull)bfEvent('beatbox_break');bfManaFull=full;
  // whiff: an attack that ended without touching anyone
  if(bfPrev&&ATK[bfPrev]&&P1.st!==bfPrev&&!P1.connected&&Math.random()<.22)bfEvent(Math.random()<.5?'whiff':'combo_whiff');
  bfPrev=P1.st}
function bfFrame(a){const c=a.c;let e=(bfT-a.t0)*1000;
  if(c.layer==='back'){const o=c.order,total=o.reduce((x,i)=>x+c.ms[i],0);e%=total;for(const i of o){if(e<c.ms[i])return i;e-=c.ms[i]}return o[o.length-1]}
  const total=c.ms.reduce((x,y)=>x+y,0);if(e>=total)return c.frames.length-1;let i=0;while(i<c.ms.length-1&&e>=c.ms[i])e-=c.ms[i++];return i}
function bfBlit(a,x,y,h,face=1,alpha=1){const img=bfImage(a.id);if(!img.complete||!img.naturalWidth||alpha<=0)return;const[sx,sy,sw,sh,px,py]=a.c.frames[bfFrame(a)],s=h/sh;
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.scale(face*s,s);ctx.drawImage(img,sx,sy,sw,sh,-px,-py,sw,sh);ctx.restore()}
// world space, after the stands and before the fighters
function drawBfBack(){if(!P1||reduced||cameraPrank)return;
  ringAntics.draw(ctx,'back',W,H,GY);
  for(const a of bfActive){const age=bfT-a.t0,fade=clamp(Math.min(age/.35,(a.life-age)/.5),0,1);
    if(a.c.layer==='back'){ctx.save();ctx.globalAlpha=.32*fade;ctx.fillStyle='#05040c';ctx.beginPath();ctx.ellipse(a.x,BF_FLOOR,30,5.5,0,0,TAU);ctx.fill();ctx.restore();
      bfBlit(a,a.x,BF_FLOOR+2,80,a.face,fade*.96)}
    else if(a.c.layer==='crowd'){const up=easeOut(clamp(age/.25,0,1))*(1-ease(clamp((age-(a.life-.35))/.35,0,1)));
      ctx.save();ctx.beginPath();ctx.rect(-200,0,W+400,372);ctx.clip();bfBlit(a,a.side?(isTouch?700:760):(isTouch?250:200),372+(1-up)*120,118,a.side?-1:1,clamp(up*1.4,0,1));ctx.restore()}}}
// screen space, after the vignette and before the HUD
function drawBfOverlay(){if(!P1||reduced||cameraPrank||sockCutaway||phase==='antic')return;
  ringAntics.draw(ctx,'overlay',W,H,GY);
  for(const a of bfActive){if(a.c.layer!=='overlay')continue;const age=bfT-a.t0,k=clamp(age/.2,0,1),pop=easeOut(k)*(1+.22*Math.sin(k*Math.PI)),out=1-ease(clamp((age-(a.life-.28))/.28,0,1));
    ctx.save();ctx.translate(a.x,150);ctx.rotate((a.x<480?-1:1)*.06);ctx.scale(pop,pop);ctx.globalAlpha=out;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=out*.28;ctx.drawImage(glow('#ffd23f'),-64,-64,128,128);ctx.restore();
    bfBlit(a,0,46,104,1,1);dtext(a.c.title.toUpperCase(),0,66,15,'#fff3d6');ctx.restore()}}
