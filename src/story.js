// ===================================================================
// STORY MODE, ISABUHAY TROPHY, PUBLIC RANKINGS + COMMENT WALL
// Appended after game.js by build.py. Hooks in game.js call the
// story* functions below.
// ===================================================================
var RANK_API='https://fliptapwars-api.vercel.app/api/board';
var STAGES=[{d:'easy',tag:'OPENER'},{d:'easy',tag:'WARM-UP'},{d:'normal',tag:'RISING'},{d:'normal',tag:'CONTENDER'},{d:'hard',tag:'SEMIFINAL'},{d:'hard',tag:'FINAL BOSS',boss:true}];
var BOSS_CI=0,BOSS_SHIELD=70,POST_COOLDOWN=120000;
var story={on:false},loseT=null;

function storyNew(){const pool=[1,2,3,4,5,6,7,8].filter(i=>i!==sel);for(let i=pool.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[pool[i],pool[j]]=[pool[j],pool[i]]}
  story={on:true,stage:0,ladder:pool.slice(0,5).concat(BOSS_CI),retries:0,stageScores:[],t0:Date.now(),fighter:sel}}
function storyEnemy(){return story.ladder[story.stage]}
function storyDifficulty(){return STAGES[story.stage].d}
function storyIsBoss(){return story.on&&!!STAGES[story.stage].boss}
// called from newMatch after the fighters exist
function storySetup(){if(!story.on)return;if(storyIsBoss()){P2.boss=true}}
// called from startRound
function storyRoundStart(){if(P2&&P2.boss){P2.bossShield=BOSS_SHIELD;P2.shieldHit=0}}
// damage hook: boss hits harder, the golden shield soaks most of every hit until it breaks
function storyDamage(a,d,dmg,blocking){if(!story.on)return dmg;
  if(a.boss)dmg*=1.18;
  if(d.boss&&d.bossShield>0&&!blocking){const soak=Math.min(d.bossShield,dmg*.75);d.bossShield-=soak;dmg-=soak;d.shieldHit=1;
    if(d.bossShield<=0){d.bossShield=0;label('SHIELD BROKEN!',d.x,GY-250,'#ffd23f',22,true);addShake(.6);flare(d.x,GY-100,'#ffd23f',260,.3);sparks(d.x,GY-100,'#ffd23f',60,null,TAU,700);shards(d.x,GY-100,'#ffe9a0',24,null,TAU,520);sfx.block();sfx.heavy();cheer(1.2)}
    else{sfx.block()}}
  return dmg}

// ---------- boss look: gold glow + shield bubble ----------
function storyDrawFighter(f,fr,X,Y,sx,sy,angle){if(!f.boss||impactOn)return;
  ctx.save();ctx.globalCompositeOperation='lighter';const p=.55+.25*Math.sin(vclock*5);
  drawSprite(fr,X,Y,f.face,.1*p,false,sx,sy,angle,'#ffcf3a');ctx.globalCompositeOperation='destination-over';for(const o of[-5,5,0])drawSprite(fr,X+o,Y-(o?2:5),f.face,.95,false,sx,sy,angle,'#ffd23f');ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=.32*p;ctx.drawImage(glow('#ffc83a'),X-170,Y-330,340,360);ctx.restore();
  if(!lowQ()&&Math.random()<.5)embers(X+(Math.random()-.5)*90,Y-30-Math.random()*170,'#ffd23f',1,6,6);
  if(f.bossShield>0){const k=f.bossShield/BOSS_SHIELD,hit=f.shieldHit||0;f.shieldHit=Math.max(0,hit-.06);
    ctx.save();ctx.translate(X,Y-105);ctx.globalCompositeOperation='lighter';
    const R=118,ry=128;ctx.globalAlpha=.16+.1*k+.4*hit;const g=ctx.createRadialGradient(0,0,R*.55,0,0,R);g.addColorStop(0,'#ffd23f00');g.addColorStop(1,'#ffd23f');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,R,ry,0,0,TAU);ctx.fill();
    ctx.globalAlpha=.55+.35*hit;ctx.strokeStyle='#ffe58a';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,R,ry,0,0,TAU);ctx.stroke();
    ctx.save();ctx.beginPath();ctx.ellipse(0,0,R,ry,0,0,TAU);ctx.clip();ctx.globalAlpha=(.18+.3*hit)*k;ctx.lineWidth=1.2;const r=13,off=(vclock*14)%(r*1.5);ctx.beginPath();
    for(let row=-11;row<=11;row++)for(let x=-130;x<130;x+=r*1.732){const cx=x+(row&1?r*.866:0),cy=row*r*1.5+off;ctx.moveTo(cx+r*Math.cos(Math.PI/6),cy+r*Math.sin(Math.PI/6));for(let i=1;i<=6;i++){const a=Math.PI/6+i*Math.PI/3;ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a))}}ctx.stroke();ctx.restore();
    const a0=vclock*1.6;ctx.globalAlpha=.9;ctx.lineWidth=4;ctx.strokeStyle='#fff6c8';ctx.beginPath();ctx.ellipse(0,0,R,ry,0,a0,a0+.7);ctx.stroke();ctx.beginPath();ctx.ellipse(0,0,R,ry,0,a0+Math.PI,a0+Math.PI+.5);ctx.stroke();
    ctx.restore()}}
// ---------- laughing during the defeat countdown ----------
function storyLaughPose(f){return !!(loseT&&f===P2)}
function storyWorld(){if(!loseT||!P1)return;const t=vclock;
  if(ultimateImages&&ultimateImages.anygma){const bob=Math.abs(Math.sin(t*9))*6;drawUltimateTile(9,3,W/2,GY-80-bob,140,P2.x<W/2?-1:1,.96)}
  const pop=(x,y,txt,col,ph)=>{const s=1+.12*Math.sin(t*10+ph);ctx.save();ctx.translate(x,y+Math.sin(t*6+ph)*4);ctx.rotate(Math.sin(t*3+ph)*.08);ctx.scale(s,s);dtext(txt,0,0,30,col);ctx.restore()};
  pop(rxOf(P2),GY-260,'HAHAHA!','#ffd23f',0);pop(W/2,GY-270,'HAHA!','#ff8fd1',1.7)}

// ---------- end of a story match ----------
function stageScore(){const hp=Math.max(0,Math.round(P1.hp)),tl=Math.max(0,Math.round(timer)),cb=maxCombo|0,mult=STAGES[story.stage].boss?2:1;
  return{hp,tl,cb,mult,total:Math.round((1000+hp*30+tl*20+cb*150)*mult)}}
function storyTotal(){return Math.max(0,story.stageScores.reduce((a,s)=>a+s.total,0)-story.retries*750+(story.champ?5000:0))}
function storyMatchEnd(won){clearInput();if(won){const s=stageScore();story.stageScores[story.stage]=s;
    if(story.stage>=STAGES.length-1){story.champ=true;storyChampion()}else{confettiT=1.4;buzz([30,60,30]);showStageClear(s)}}
  else startLoseCountdown()}
function ladderHTML(){return '<div class="ladder">'+story.ladder.map((ci,i)=>{const st=i<story.stage?'done':i===story.stage?'now':'lock',boss=STAGES[i].boss;
  return '<div class="rung '+st+(boss?' boss':'')+'" style="--c:'+COL[ci]+';--d:'+i+'"><img src="'+portraitURL(ci)+'" alt=""><b>'+(boss?'👑 ':'')+CH[ci].name+'</b><small>'+STAGES[i].tag+'</small>'+(st==='done'?'<i class="ok">✓</i>':'')+'</div>'}).join('<span class="rarr">›</span>')+'</div>'}
var portraitCache2={};function portraitURL(ci){if(portraitCache2[ci])return portraitCache2[ci];try{return portraitCache2[ci]=portrait(ci).toDataURL()}catch(e){return ''}}
function showStageClear(s){const b=$('stageClear');b.querySelector('.scbox').innerHTML='<div class="eyebrow">STAGE '+(story.stage+1)+' / '+STAGES.length+' CLEARED</div><h3>YOU WON!</h3>'+
  '<div class="breakdown">'+row('HP left',s.hp+' × 30')+row('Time left',s.tl+' × 20')+row('Best combo',s.cb+' × 150')+row('Stage bonus','1000'+(s.mult>1?' · ×2 BOSS':''))+'<div class="tot"><span>STAGE SCORE</span><b>'+s.total.toLocaleString()+'</b></div></div>'+
  '<div class="runscore">RUN TOTAL <b>'+storyTotal().toLocaleString()+'</b>'+(story.retries?' <small>(−'+story.retries*750+' retries)</small>':'')+'</div>';
  story.stage++;b.querySelector('.ladderwrap').innerHTML=ladderHTML();const nx=story.ladder[story.stage];$('scNext').textContent=STAGES[story.stage].boss?'👑 FACE THE BOSS':'NEXT: '+CH[nx].name.toUpperCase();openModal('stageClear');sfx.ui()}
function row(k,v){return '<div class="br"><span>'+k+'</span><b>'+v+'</b></div>'}
function showLadder(){const b=$('storyLadder');b.querySelector('.ladderwrap').innerHTML=ladderHTML();const ci=storyEnemy(),st=STAGES[story.stage];
  b.querySelector('.vsline').innerHTML='STAGE '+(story.stage+1)+' · <b style="color:'+COL[ci]+'">'+CH[ci].name.toUpperCase()+'</b> · '+(st.boss?'<span class="bosstag">GOLDEN BOSS · SHIELDED</span>':st.d.toUpperCase());openModal('storyLadder')}
function storyFight(){document.querySelectorAll('.modal').forEach(m=>m.style.display='none');story.go=true;newMatch(false)}
// newMatch hook: decide whether this match is part of the story run
function storyPre(same){if(!story.on)return false;if(story.go||story.pick||same){story.go=story.pick=false;storyBanner();return true}story={on:false};storyBanner();return false}

// defeat: 10 second countdown, rematch or pick a new fighter, 0 = back to menu
function startLoseCountdown(){const b=$('storyLose');let n=10;b.style.display='flex';b.querySelector('.num').textContent=n;P2.laugh=true;loseT=setInterval(tick,1000);sfx.laugh&&sfx.laugh();buzz([80,60,80]);
  function tick(){n--;const el=b.querySelector('.num');el.textContent=n;el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');tone(n<=3?880:520,.08,'square',.03);if(n%3===0&&sfx.laugh)sfx.laugh();if(n<=0){endLose();story.lastRun={score:storyTotal(),stages:story.stage,retries:story.retries};story.on=false;toMenu();setTimeout(()=>offerSubmit(false),400)}}}
function endLose(){if(loseT){clearInterval(loseT);loseT=null}$('storyLose').style.display='none';if(P2)P2.laugh=false}
function loseRematch(){endLose();story.retries++;storyFight()}
function loseChoose(){endLose();story.retries++;story.pick=true;toMenu();storyBanner()}
function storyBanner(){const el=$('storyBanner');if(!el)return;if(story.on){el.style.display='flex';el.querySelector('span').innerHTML='STORY · STAGE '+(story.stage+1)+'/'+STAGES.length+' vs <b>'+CH[storyEnemy()].name+'</b> · pick a fighter, then ENTER THE RING'}else el.style.display='none'}

// champion
function storyChampion(){const tot=storyTotal(),secs=Math.round((Date.now()-story.t0)/1000);story.result={score:tot,stages:STAGES.length,retries:story.retries,time:secs,champ:true,fighter:CH[sel].name};
  const tr=store.get('trophies',0)+1;store.set('trophies',tr);store.set('bestStory',Math.max(store.get('bestStory',0),tot));confettiT=6;buzz([40,80,40,80,160]);cheer(1.6);sfx.bell(0,3);
  const b=$('champ');b.querySelector('.champscore').innerHTML='<div class="breakdown">'+story.stageScores.map((s,i)=>row('Stage '+(i+1)+' · '+CH[story.ladder[i]].name,s.total.toLocaleString())).join('')+row('Champion bonus','+5,000')+(story.retries?row('Retries ('+story.retries+')','−'+(story.retries*750).toLocaleString()):'')+'<div class="tot"><span>FINAL SCORE</span><b>'+tot.toLocaleString()+'</b></div></div>';
  b.querySelector('.champfighter').innerHTML='<img src="'+portraitURL(sel)+'" alt=""><b>'+CH[sel].name+'</b>';b.querySelector('.trcount').textContent=tr>1?'×'+tr:'';
  submitForm(b.querySelector('.submitbox'),story.result);setTimeout(()=>{$('result').style.display='none';openModal('champ')},900);story.on=false;storyBanner();renderTrophy()}
function offerSubmit(champ){const r=story.lastRun;if(!r||r.score<=0)return;const b=$('runOver');b.querySelector('.runline').innerHTML='You reached <b>stage '+(r.stages+1)+'</b> · score <b>'+r.score.toLocaleString()+'</b>';submitForm(b.querySelector('.submitbox'),{score:r.score,stages:r.stages,retries:r.retries,time:0,champ:false,fighter:CH[sel].name});openModal('runOver')}
function renderTrophy(){const n=store.get('trophies',0),el=$('trophyBadge');if(!el)return;if(!n){el.style.display='none';return}el.style.display='inline-flex';el.querySelector('b').textContent=n>1?'ISABUHAY CHAMPION ×'+n:'ISABUHAY CHAMPION'}

// ---------- rankings + wall ----------
function cooldownLeft(){return Math.max(0,POST_COOLDOWN-(Date.now()-store.get('lastPost',0)))}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function submitForm(box,res){box.innerHTML='<input class="sname" maxlength="16" placeholder="Your name" value="'+esc(store.get('rankName',''))+'"><textarea class="scomment" maxlength="140" placeholder="Leave a comment for the rankings (optional)"></textarea><button class="go ssend">POST MY SCORE</button><p class="smsg"></p>';
  const nm=box.querySelector('.sname'),cm=box.querySelector('.scomment'),btn=box.querySelector('.ssend'),msg=box.querySelector('.smsg');[nm,cm].forEach(e=>e.onkeydown=ev=>ev.stopPropagation());
  btn.onclick=async()=>{const name=nm.value.trim();if(name.length<2){msg.textContent='Enter a name (2+ letters).';nm.focus();return}const cd=cooldownLeft();if(cd){msg.textContent='Wait '+Math.ceil(cd/1000)+'s before posting again.';return}
    btn.disabled=true;msg.textContent='Posting…';store.set('rankName',name);
    try{const r=await fetch(RANK_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'score',name,comment:cm.value.trim(),...res})});const j=await r.json();
      if(r.status===429){msg.textContent='Cooldown: try again in '+j.wait+'s.';btn.disabled=false;return}if(!r.ok)throw Error(j.error||r.status);
      store.set('lastPost',Date.now());msg.innerHTML='<span class="rankstamp">RANK #'+j.rank+'</span>';btn.textContent='POSTED ✓';buzz([20,40,20]);cheer(.8)}
    catch(e){msg.textContent='Could not reach the rankings. Check your connection and try again.';btn.disabled=false}}}
var rankTab='top',rankData=null,isAdmin=location.hash==='#admin';
async function openRanks(tab){if(tab)rankTab=tab;openModal('ranks');renderRanks();try{const r=await fetch(RANK_API+'?t='+Math.floor(Date.now()/10000),{cache:'no-store'});rankData=await r.json()}catch(e){rankData={error:true}}renderRanks()}
function ago(t){const s=(Date.now()-t)/1000;return s<60?'just now':s<3600?Math.floor(s/60)+'m ago':s<86400?Math.floor(s/3600)+'h ago':Math.floor(s/86400)+'d ago'}
function renderRanks(){const box=$('rankBody');document.querySelectorAll('#ranks .rtab').forEach(b=>b.classList.toggle('on',b.dataset.t===rankTab));
  if(rankTab==='inbox'){renderInbox(box);return}if(!rankData){box.innerHTML='<div class="rload">LOADING<i class="dots"><b>.</b><b>.</b><b>.</b></i></div>';return}if(rankData.error){box.innerHTML='<div class="rload">Rankings are offline right now. Try again later.</div>';return}
  const del=id=>isAdmin?'<button class="rdel" data-id="'+id+'">✕</button>':'';
  if(rankTab==='inbox'){renderInbox(box);return}
  if(rankTab==='patrons'){const p=rankData.patrons||[];box.innerHTML='<p class="patronhead">💛 Salamat to everyone keeping FliptapWars free! Donate from ☕ Buy me a coffee.</p>'+(p.length?'<ol class="rlist patrons">'+p.map((e,i)=>'<li class="rrow'+(i<3?' top'+(i+1):'')+'" style="--d:'+Math.min(i,20)+'"><span class="rk">'+(i<3?['👑','🥈','🥉'][i]:'#'+(i+1))+'</span><div class="rwho"><b>'+esc(e.name)+'</b><small>'+e.count+' donation'+(e.count>1?'s':'')+' · '+ago(e.at)+'</small>'+(e.message?'<q>'+esc(e.message)+'</q>':'')+'</div><span class="rs">₱'+Number(e.total).toLocaleString()+'</span>'+del(e.id)+'</li>').join('')+'</ol>':'<div class="rload">No patrons yet. Be the first legend! ☕</div>');return}
  if(rankTab==='top'){const s=rankData.scores||[];box.innerHTML=s.length?'<ol class="rlist">'+s.map((e,i)=>'<li class="rrow'+(i<3?' top'+(i+1):'')+'" style="--d:'+Math.min(i,20)+'"><span class="rk">'+(i<3?['🥇','🥈','🥉'][i]:'#'+(i+1))+'</span><div class="rwho"><b>'+esc(e.name)+(e.champ?' <i class="crown">👑</i>':'')+'</b><small>'+esc(e.fighter)+' · stage '+(e.champ?'6/6':(e.stages+1)+'/6')+' · '+e.retries+' retries · '+ago(e.at)+'</small>'+(e.comment?'<q>'+esc(e.comment)+'</q>':'')+'</div><span class="rs">'+Number(e.score).toLocaleString()+'</span>'+del(e.id)+'</li>').join('')+'</ol>':'<div class="rload">No scores yet. Beat story mode and be the first!</div>'}
  else{const c=rankData.comments||[];box.innerHTML='<div class="wallpost"><input id="wName" maxlength="16" placeholder="Name" value="'+esc(store.get('rankName',''))+'"><input id="wText" maxlength="140" placeholder="Say something to the community…"><button class="go" id="wSend">POST</button><p id="wMsg"></p></div>'+(c.length?'<div class="wall">'+c.map((e,i)=>'<div class="wnote" style="--d:'+Math.min(i,20)+';--r:'+(((i*37)%7)-3)*.6+'deg"><b>'+esc(e.name)+'</b>'+(e.score?'<span class="wsc">'+Number(e.score).toLocaleString()+'</span>':'')+'<p>'+esc(e.comment)+'</p><small>'+ago(e.at)+'</small>'+del(e.id)+'</div>').join('')+'</div>':'<div class="rload">The wall is empty. Write the first tag!</div>');
    ['wName','wText'].forEach(id=>$(id).onkeydown=ev=>{ev.stopPropagation();if(ev.key==='Enter')$('wSend').click()});
    $('wSend').onclick=async()=>{const name=$('wName').value.trim(),text=$('wText').value.trim(),msg=$('wMsg');if(name.length<2||text.length<2){msg.textContent='Add a name and a message.';return}const cd=cooldownLeft();if(cd){msg.textContent='Cooldown: '+Math.ceil(cd/1000)+'s left (one post every 2 minutes).';return}
      $('wSend').disabled=true;store.set('rankName',name);try{const r=await fetch(RANK_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'comment',name,comment:text})});const j=await r.json();if(r.status===429){msg.textContent='Cooldown: '+j.wait+'s left.';$('wSend').disabled=false;return}if(!r.ok)throw 0;store.set('lastPost',Date.now());buzz(15);rankData=null;openRanks('wall')}catch(e){msg.textContent='Could not post. Try again.';$('wSend').disabled=false}}}
  box.querySelectorAll('.rdel').forEach(b=>b.onclick=async()=>{let k=store.get('adminKey','');if(!k){k=prompt('Admin key');if(!k)return;store.set('adminKey',k)}const r=await fetch(RANK_API,{method:'DELETE',headers:{'Content-Type':'application/json','X-Admin-Key':k},body:JSON.stringify({id:b.dataset.id})});if(r.status===403){store.set('adminKey','');alert('Wrong admin key')}rankData=null;openRanks()})}

// ---------- suggestions stored on the game server + device history ----------
async function sendSuggestion(){const txt=$('sugText').value.trim(),note=$('sugNote');if(txt.length<4){note.textContent='Write at least a few words.';return}
  const cd=cooldownLeft();if(cd){note.textContent='Cooldown: '+Math.ceil(cd/1000)+'s left (one post every 2 minutes).';return}
  const name=$('sugName').value.trim();$('sugSend').disabled=true;note.textContent='Sending…';
  try{const r=await fetch(RANK_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'suggestion',name,cat:sugCat,stars:sugStars,text:txt,device:isTouch?'phone':'pc'})});const j=await r.json().catch(()=>({}));
    if(r.status===429){note.textContent='Cooldown: '+j.wait+'s left.';$('sugSend').disabled=false;return}if(!r.ok)throw 0;
    store.set('lastPost',Date.now());const h=store.get('sugHist',[]);h.unshift({cat:sugCat,stars:sugStars,text:txt.slice(0,300),at:Date.now()});store.set('sugHist',h.slice(0,30));
    note.textContent='';const sh=document.querySelector('.sugsheet');sh.classList.remove('sent');void sh.offsetWidth;sh.classList.add('sent');$('sugThanks').classList.add('show');$('sugText').value='';$('sugText').oninput();buzz([10,30,20]);renderSugHistory()}
  catch(e){note.textContent='Could not send. Check your connection and try again.';$('sugSend').disabled=false}}
function renderSugHistory(){const h=store.get('sugHist',[]),c=$('sugCountH'),box=$('sugHist');if(!c)return;c.textContent=h.length;box.innerHTML=h.length?h.map(x=>'<div class="shi"><b>'+esc(x.cat)+'</b>'+(x.stars?' <i>'+'★'.repeat(x.stars)+'</i>':'')+'<span>'+ago(x.at)+' · ✓ sent</span><p>'+esc(x.text)+'</p></div>').join(''):'<p class="shempty">Nothing sent yet from this device.</p>'}
// ---------- donation claims → patrons board ----------
async function sendClaim(){const note=$('cNote'),name=$('cName').value.trim(),amount=+$('cAmt').value,ref=$('cRef').value.trim();
  if(name.length<2||!(amount>=1)||ref.replace(/\D/g,'').length<6){note.textContent='Add your name, the amount and the GCash reference number.';note.classList.add('err');return}
  const cd=cooldownLeft();if(cd){note.textContent='Cooldown: '+Math.ceil(cd/1000)+'s left.';return}$('cSend').disabled=true;note.classList.remove('err');note.textContent='Sending…';
  try{const r=await fetch(RANK_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'claim',name,amount,ref,message:$('cMsg').value.trim()})});const j=await r.json().catch(()=>({}));
    if(r.status===429){note.textContent='Cooldown: '+j.wait+'s left.';$('cSend').disabled=false;return}if(!r.ok)throw 0;store.set('lastPost',Date.now());store.set('rankName',name);
    note.innerHTML='<span class="rankstamp">SALAMAT!</span><br>You will show on 💛 Top Patrons once the dev confirms it.';$('cSend').textContent='SENT ✓';buzz([20,40,20]);cheer(.8)}
  catch(e){note.textContent='Could not send. Try again.';$('cSend').disabled=false}}
// ---------- admin inbox (open the game with #admin) ----------
function adminKey(){let k=store.get('adminKey','');if(!k){k=prompt('Admin key')||'';if(k)store.set('adminKey',k)}return k}
async function adminCall(method,bodyObj,query){const k=adminKey();if(!k)return null;const r=await fetch(RANK_API+(query||''),{method,headers:{'Content-Type':'application/json','X-Admin-Key':k},body:bodyObj?JSON.stringify(bodyObj):undefined});if(r.status===403){store.set('adminKey','');alert('Wrong admin key');return null}return r.json()}
async function renderInbox(box){box.innerHTML='<div class="rload">LOADING INBOX…</div>';const d=await adminCall('GET',null,'?inbox=1&t='+Date.now());if(!d){box.innerHTML='<div class="rload">Admin key needed.</div>';return}
  const claims=d.claims.map(c=>'<div class="inrow claim"><b>💛 '+esc(c.name)+' · ₱'+c.amount.toLocaleString()+'</b><small>Ref '+esc(c.ref)+' · '+ago(c.at)+'</small>'+(c.message?'<q>'+esc(c.message)+'</q>':'')+'<div class="inbtns"><button class="go ok" data-ap="'+c.id+'">APPROVE</button><button class="secondary" data-rm="'+c.id+'">REJECT</button></div></div>').join('')||'<p class="shempty">No pending donations.</p>';
  const sugs=d.suggestions.map(x=>'<div class="inrow"><b>'+esc(x.cat||'Idea')+(x.stars?' · '+'★'.repeat(x.stars):'')+'</b><small>'+esc(x.name)+' · '+esc(x.device||'')+' · '+ago(x.at)+'</small><p>'+esc(x.text)+'</p><button class="rdel" data-rm="'+x.id+'">✕</button></div>').join('')||'<p class="shempty">No suggestions yet.</p>';
  box.innerHTML='<h4 class="inh">PENDING DONATIONS ('+d.claims.length+')</h4><p class="shempty">Check each reference number in your GCash history before approving.</p>'+claims+'<div class="addp"><input id="apName" placeholder="Patron name" maxlength="16"><input id="apAmt" type="number" placeholder="₱" min="1"><button class="go" id="apAdd">ADD PATRON</button></div><h4 class="inh">SUGGESTIONS ('+d.suggestions.length+')</h4>'+sugs;
  box.querySelectorAll('[data-ap]').forEach(b=>b.onclick=async()=>{b.disabled=true;await adminCall('POST',{type:'approve',id:b.dataset.ap});renderInbox(box)});
  box.querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this?'))return;await adminCall('DELETE',{id:b.dataset.rm});renderInbox(box)});
  $('apAdd').onclick=async()=>{const name=$('apName').value.trim(),amount=+$('apAmt').value;if(!name||!(amount>0))return;await adminCall('POST',{type:'patron',name,amount});renderInbox(box)};
  box.querySelectorAll('input').forEach(i=>i.onkeydown=e=>e.stopPropagation())}
// ---------- laugh sfx ----------
sfx.laugh=()=>{for(let i=0;i<5;i++){const d=i*.13;tone(330-i*18,.09,'sawtooth',.05,240-i*15,d,.005);noise(.08,900-i*40,.06,3,'bandpass',.7,d)}};

// ---------- markup ----------
(function(){const html=`
<div id="storyLadder" class="modal"><div class="msheet storysheet"><h3>STORY MODE</h3><p class="storysub">Six battles, easy to hardest. The last boss is <b>Golden Loonie</b>, glowing gold behind a shield.</p><div class="ladderwrap"></div><div class="vsline"></div><button id="slFight" class="go">FIGHT!</button><button class="closeModal secondary">BACK</button></div></div>
<div id="stageClear" class="modal" data-lock="1"><div class="msheet storysheet"><div class="scbox"></div><div class="ladderwrap"></div><button id="scNext" class="go">NEXT</button></div></div>
<div id="storyLose"><div class="lbg2"></div><div class="losebox"><div class="eyebrow">YOU GOT BODIED</div><h2>CONTINUE?</h2><div class="num">10</div><div class="losebtns"><button id="lRematch" class="go">REMATCH</button><button id="lChoose" class="secondary">CHOOSE FIGHTER</button></div><small>Each retry costs 750 points · at 0 you go back to the menu</small></div></div>
<div id="champ" class="modal"><div class="msheet champsheet"><div class="rays"></div><div class="trophy"><svg viewBox="0 0 200 220" aria-hidden="true"><defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#b8860b"/><stop offset=".45" stop-color="#ffe680"/><stop offset=".6" stop-color="#ffd23f"/><stop offset="1" stop-color="#a87400"/></linearGradient></defs><path d="M40 18h120v36c0 46-26 74-60 78-34-4-60-32-60-78z" fill="url(#tg)" stroke="#0b0712" stroke-width="6"/><path d="M40 34H14c0 30 14 46 34 50M160 34h26c0 30-14 46-34 50" fill="none" stroke="#0b0712" stroke-width="12"/><path d="M40 34H14c0 30 14 46 34 50M160 34h26c0 30-14 46-34 50" fill="none" stroke="url(#tg)" stroke-width="6"/><rect x="86" y="130" width="28" height="34" fill="url(#tg)" stroke="#0b0712" stroke-width="6"/><rect x="52" y="164" width="96" height="22" rx="4" fill="url(#tg)" stroke="#0b0712" stroke-width="6"/><rect x="40" y="186" width="120" height="24" rx="4" fill="#1d1233" stroke="#0b0712" stroke-width="6"/><path d="M72 66l10-16 18 14 18-14 10 16-4 18H76z" fill="#0b0712" opacity=".85"/><text x="100" y="204" text-anchor="middle" font-family="Bangers,Impact" font-size="15" fill="#ffd23f">ISABUHAY</text></svg><i class="shine"></i><span class="trcount"></span></div>
<div class="eyebrow">FLIPTAPWARS STORY · COMPLETE</div><h2 class="champtitle">ISABUHAY CHAMPION</h2><div class="champfighter"></div><div class="champscore"></div><div class="submitbox"></div><div class="champbtns"><button class="secondary" id="champRanks">🏆 RANKINGS</button><button class="closeModal go">MENU</button></div></div></div>
<div id="runOver" class="modal"><div class="msheet storysheet"><h3>RUN OVER</h3><p class="runline"></p><p class="storysub">Post your score to the public rankings?</p><div class="submitbox"></div><button class="closeModal secondary">NO THANKS</button></div></div>
<div id="ranks" class="modal"><div class="msheet rankssheet"><h3>RANKINGS</h3><div class="rtabs"><button class="rtab on" data-t="top">🏆 TOP SCORES</button><button class="rtab" data-t="wall">🖊 THE WALL</button><button class="rtab" data-t="patrons">💛 PATRONS</button></div><div id="rankBody"></div><p class="rnote">Score = per stage (1000 + HP left ×30 + time left ×20 + best combo ×150, boss ×2) + 5000 champion bonus − 750 per retry.</p><button class="closeModal go">CLOSE</button></div></div>`;
  document.getElementById('app').insertAdjacentHTML('beforeend',html);
  const opts=document.querySelector('#menu .options');opts.insertAdjacentHTML('beforeend','<button id="storyBtn" class="go storybtn">⚔ STORY MODE</button>');
  document.querySelector('#menu .menuBtns').insertAdjacentHTML('afterbegin','<button id="ranksBtn" class="chip gear"><span class="gi">🏆</span> RANKINGS</button>');
  document.querySelector('#menu .badges').insertAdjacentHTML('afterend','<div id="trophyBadge" class="trophybadge"><i>🏆</i><b></b></div><div id="storyBanner" class="storybanner"><span></span><button id="quitStory" class="chip">QUIT STORY</button></div>');
  const sl=document.querySelector('#settings .setlinks');if(sl)sl.insertAdjacentHTML('afterbegin','<button id="setRanks" class="chip big">🏆 Rankings</button>');
  document.querySelectorAll('#storyLadder .closeModal,#stageClear .closeModal,#champ .closeModal,#runOver .closeModal,#ranks .closeModal').forEach(b=>b.onclick=()=>{b.closest('.modal').style.display='none'});
  document.querySelectorAll('#storyLadder,#champ,#runOver,#ranks').forEach(m=>m.onclick=e=>{if(e.target===m)m.style.display='none'});
  $('storyBtn').onclick=()=>{if(!ready)return;goLandscape&&goLandscape();storyNew();storyBanner();showLadder()};
  $('slFight').onclick=storyFight;$('scNext').onclick=()=>{$('stageClear').style.display='none';showLadder()};
  $('lRematch').onclick=loseRematch;$('lChoose').onclick=loseChoose;
  $('quitStory').onclick=()=>{story={on:false};storyBanner()};
  $('ranksBtn').onclick=$('setRanks').onclick=$('champRanks').onclick=()=>{document.querySelectorAll('.modal').forEach(m=>m.style.display='none');openRanks('top')};
  if(isAdmin)document.querySelector('#ranks .rtabs').insertAdjacentHTML('beforeend','<button class="rtab" data-t="inbox">📥 INBOX</button>');
  document.querySelectorAll('#ranks .rtab').forEach(b=>b.onclick=()=>{rankTab=b.dataset.t;renderRanks()});
  $('donatedBtn').onclick=()=>{$('claimBox').classList.toggle('open');$('cName').value=store.get('rankName','');buzz(8)};$('cSend').onclick=sendClaim;['cName','cAmt','cRef','cMsg'].forEach(id=>$(id).onkeydown=e=>e.stopPropagation());
  document.querySelector('#menu .menuBtns').insertAdjacentHTML('beforeend','<button id="patronsBtn" class="chip gear"><span class="gi">💛</span> PATRONS</button>');$('patronsBtn').onclick=()=>openRanks('patrons');
  renderTrophy();storyBanner()})();
