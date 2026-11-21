/* Ring Brawlers Antics Vol. 2. Canvas renderer for cosmetic animation strips. */
(function attach(root) {
  'use strict';
  root.createRingAntics = function createRingAntics(manifest, base = '', embedded = {}) {
    const images = new Map();
    let time = 0;
    let ambientAt = 5;
    let ambientIndex = 0;
    let idleFor = 0;
    let active = [];
    const last = new Map();
    const ambientIds = ['kariton_squeak', 'sampaguita_sway', 'sachet_rustle'];
    const eventIndex = new Map();
    const cursor = new Map();
    for (const [id, clip] of Object.entries(manifest.animations)) {
      const set = eventIndex.get(clip.event) || [];
      set.push(id);
      eventIndex.set(clip.event, set);
    }
    function play(id) {
      const clip = manifest.animations[id];
      if (!clip || active.length >= 3 || time - (last.get(id) ?? -Infinity) < clip.cooldown) return false;
      if (!images.has(id)) {
        const img = new Image();
        images.set(id, img);
        img.src = embedded[id] || base + clip.png;
      }
      last.set(id, time);
      active.push({ id, clip, started: time });
      return true;
    }
    function event(name) {
      const list = eventIndex.get(name);
      if (!list) return false;
      const position = cursor.get(name) || 0;
      const id = list[position % list.length];
      if (!play(id)) return false;
      cursor.set(name, position + 1);
      return true;
    }
    function step(dt, { ambient = false, idle = false, reducedMotion = false } = {}) {
      time += dt;
      idleFor = idle && !reducedMotion ? idleFor + dt : 0;
      if (reducedMotion) {
        active = [];
        ambientAt = time + 5;
        return;
      }
      active = active.filter(item => time - item.started < item.clip.durationMs / 1000);
      if (idleFor >= 4) {
        event('idle_standoff');
        idleFor = 0;
        ambientAt = Math.max(ambientAt, time + 2);
      }
      if (ambient && time >= ambientAt) {
        play(ambientIds[ambientIndex++ % ambientIds.length]);
        ambientAt = time + 6;
      }
    }
    function draw(ctx, layer, width, height, groundY) {
      for (const { id, clip, started } of active) {
        if (clip.layer !== layer) continue;
        const img = images.get(id);
        if (!img?.complete || !img.naturalWidth) continue;
        let elapsed = (time - started) * 1000;
        let index = 0;
        while (index < clip.frameMs.length - 1 && elapsed >= clip.frameMs[index]) {
          elapsed -= clip.frameMs[index++];
        }
        const [sx, sy, sw, sh] = clip.frames[index];
        const s = width * clip.width / sw;
        const x = width * clip.x - sw * s / 2;
        const y = (clip.anchor === 'ground' ? groundY : height * clip.y) - clip.pivotY * s;
        ctx.save();
        ctx.globalAlpha *= layer === 'back' ? .83 : .97;
        ctx.drawImage(img, sx, sy, sw, sh, x, y, sw * s, sh * s);
        ctx.restore();
      }
    }
    function reset() {
      active = [];
      last.clear();
      idleFor = 0;
      ambientAt = time + 5;
    }
    return { play, event, step, draw, reset };
  };
})(globalThis);
