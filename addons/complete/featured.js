/* Cosmetic asset playback on the existing simulation clock. */
function createFeaturedArt(scene, vfx, sources) {
  const art = new Map();
  const effects = [];
  let story = null;

  function image(key) {
    if (!art.has(key)) {
      const img = new Image();
      img.src = sources[key];
      art.set(key,img);
    }
    return art.get(key);
  }

  function pick(frames, durations, time) {
    for (let i = 0; i < frames.length - 1; i++) {
      if (time < durations[i]) return frames[i];
      time -= durations[i];
    }
    return frames.at(-1);
  }

  function sceneStart(event, names, winner, clock, reduce) {
    const ids = names.map(fighterId);
    const outcome = winner ? fighterId(winner) : 'draw';
    let route = scene.routes.filter(r => r.event === event && r.pair.every(id => ids.includes(id)))
      .sort((a,b) => b.priority - a.priority)[0];
    if (!route && event === 'match_start') {
      route = scene.routes.find(r => r.event === 'rare_entrance' &&
        r.fighters.some(id => ids.includes(id)) && Math.random() < r.probability);
    }
    let list = route?.outcomes?.[outcome] || route?.sequence;
    if (!list) {
      list = ids.map(id => {
        const map = scene.fighters[id]?.animationMap;
        return event === 'match_start' ? map?.match_intro : map?.[id===outcome?'match_win':'match_loss'];
      }).filter(Boolean);
    }
    if (reduce) list = list.slice(-1);
    let duration=0;
    const clips = list.map(id => {
      const clip=scene.clips[id];
      image('scene/'+clip.sheet);
      const ms=reduce?450:clip.durationsMs.reduce((a,b)=>a+b,0);
      const entry={clip,start:duration,end:duration+ms};
      duration+=ms;
      return entry;
    });
    story=clips.length?{event,clock,clips,reduce}:null;
    return duration/1000;
  }

  function drawScene(c, event, clock, width, height, x=0, y=0, stageActors=null) {
    if (!story || story.event !== event) return;
    const elapsed=(clock-story.clock)*1000;
    const part=story.clips.find(clip => elapsed < clip.end);
    if (!part && event==='match_start') return;
    const {clip,start}=part || story.clips.at(-1);
    const sheet=scene.sheets[clip.sheet];
    const img=image('scene/'+clip.sheet);
    if (!img.complete || !img.naturalWidth) return;
    const frame=story.reduce?clip.frames.at(-1):pick(clip.frames,clip.durationsMs,elapsed-start);
    if(stageActors && stageActors(clip,frame,Math.max(0,(elapsed-start)/1000),img,sheet.frames[frame]))return;
    const [sx,sy,w,h]=sheet.frames[frame].rect;
    const scale=Math.min(width/w,height/h);
    c.save();
    c.fillStyle='#0d1121';
    c.fillRect(x,y,width,height);
    c.drawImage(img,sx,sy,w,h,x+(width-w*scale)/2,y+(height-h*scale)/2,w*scale,h*scale);
    c.restore();
  }

  function playFx(id,x,y,face,clock) {
    if (!vfx[id]) return;
    image('vfx/'+id);
    effects.push({id,x,y,face,clock});
    if(effects.length>8)effects.shift();
  }

  function drawFx(c,clock,reduced) {
    for(let index=effects.length-1;index>=0;index--){
      const e=effects[index],clip=vfx[e.id],ms=(clock-e.clock)*1000;
      if(reduced||ms>=clip.frameMs.reduce((a,b)=>a+b,0)){effects.splice(index,1);continue;}
      const img=image('vfx/'+e.id);
      if(!img.complete||!img.naturalWidth)continue;
      const {rect:[x,y,w,h],pivot:[px,py]}=pick(clip.frames,clip.frameMs,ms);
      const scale=150/Math.max(w,h);
      c.save();
      c.translate(e.x,e.y);
      c.scale(e.face,1);
      c.globalAlpha=.88;
      c.drawImage(img,x,y,w,h,-px*scale,-py*scale,w*scale,h*scale);
      c.restore();
    }
  }

  function fighterId(name) {return name.trim().toLowerCase().replace(/\s+/g,'_');}
  return {sceneStart,drawScene,hasResult:()=>story?.event==='match_end',playFx,drawFx,resetFx:()=>{effects.length=0;}};
}
