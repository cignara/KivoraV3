/* ══════════════════════════════════════════════════════════════
   Kivora Coloring Studio — on-screen colour-in engine
   Deterministically generates distinct, printable SVG line-art
   across 10 categories (600 pages total). Tap a region to fill it
   with the selected colour; print or reset any page.
══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Categories (counts sum to 600) ───────────────────────── */
  const CATS = [
    { id: 'animals',   name: 'Animals',            emoji: '🐘', count: 80, color: '#4A90E2', kinds: ['cat','fish','bird','butterfly','tortoise','rabbit'] },
    { id: 'nature',    name: 'Nature & Flowers',   emoji: '🌸', count: 70, color: '#27AE60', kinds: ['flower','tree','leaf','sun','mushroom'] },
    { id: 'alphabet',  name: 'Alphabet A–Z',       emoji: '🔤', count: 60, color: '#8E44AD', kinds: ['letter'] },
    { id: 'math',      name: 'Numbers & Shapes',   emoji: '🔢', count: 55, color: '#EF5350', kinds: ['number','shape'] },
    { id: 'festivals', name: 'World Festivals',    emoji: '🎉', count: 75, color: '#F39C12', kinds: ['mandala','star','lantern'] },
    { id: 'wildlife',  name: 'Sri Lankan Wildlife',emoji: '🦚', count: 50, color: '#16A085', kinds: ['bird','fish','butterfly','tortoise','elephant'] },
    { id: 'space',     name: 'Space & Science',    emoji: '🚀', count: 65, color: '#2980B9', kinds: ['rocket','planet','star','sun'] },
    { id: 'emotions',  name: 'Emotions & Feelings',emoji: '❤️', count: 40, color: '#E91E63', kinds: ['face','heart'] },
    { id: 'everyday',  name: 'Everyday Life',      emoji: '🏡', count: 55, color: '#E67E22', kinds: ['house','tree','sun','car'] },
    { id: 'music',     name: 'Music & Dance',      emoji: '🎵', count: 50, color: '#9B59B6', kinds: ['note','drum','star','mandala'] },
  ];

  /* ── Palette ──────────────────────────────────────────────── */
  const PALETTE = [
    '#EF5350','#EC407A','#AB47BC','#7E57C2','#5C6BC0','#42A5F5','#29B6F6','#26C6DA',
    '#26A69A','#66BB6A','#9CCC65','#D4E157','#FFEE58','#FFCA28','#FFA726','#FF7043',
    '#8D6E63','#BCAAA4','#78909C','#EC9A9A','#F48FB1','#CE93D8','#90CAF9','#A5D6A7',
    '#FFE082','#FFAB91','#5D4037','#212121','#9E9E9E','#FFFFFF'
  ];

  /* ── Seeded PRNG (mulberry32) ─────────────────────────────── */
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];
  const irange = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

  const S = 500;                       // viewbox size
  const OPEN = `<svg viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg" class="cs-canvas">`;
  const CLOSE = `</svg>`;
  // A fillable outlined shape
  function reg(shape, extra) {
    return `<${shape} class="cs-region" fill="#ffffff" stroke="#1e293b" stroke-width="3" stroke-linejoin="round" ${extra}/>`;
  }
  function regPath(d) {
    return `<path class="cs-region" d="${d}" fill="#ffffff" stroke="#1e293b" stroke-width="3" stroke-linejoin="round"/>`;
  }

  /* ══════════ GENERATORS ══════════ */

  function genMandala(r) {
    let out = '';
    const rings = irange(r, 3, 5);
    const shapes = ['ellipse', 'circle'];
    for (let ring = rings; ring >= 1; ring--) {
      const rad = 40 + ring * (200 / rings);
      const k = [6, 8, 10, 12][irange(r, 0, 3)];
      const shp = pick(r, shapes);
      const rx = 14 + r() * 22, ry = 22 + r() * 34;
      for (let i = 0; i < k; i++) {
        const ang = (360 / k) * i;
        if (shp === 'ellipse') {
          out += reg('ellipse', `cx="${S/2}" cy="${S/2 - rad}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${ang} ${S/2} ${S/2})"`);
        } else {
          out += reg('circle', `cx="${S/2}" cy="${(S/2 - rad).toFixed(1)}" r="${(rx*0.8).toFixed(1)}" transform="rotate(${ang} ${S/2} ${S/2})"`);
        }
      }
    }
    // center
    out += reg('circle', `cx="${S/2}" cy="${S/2}" r="${irange(r,26,46)}"`);
    out += reg('circle', `cx="${S/2}" cy="${S/2}" r="${irange(r,10,20)}"`);
    return out;
  }

  function genFlower(r) {
    let out = '';
    const cx = S/2, cy = 220;
    const petals = [5, 6, 8][irange(r, 0, 2)];
    const pr = 60 + r() * 20;
    for (let i = 0; i < petals; i++) {
      const ang = (360 / petals) * i;
      out += reg('ellipse', `cx="${cx}" cy="${cy - 78}" rx="26" ry="46" transform="rotate(${ang} ${cx} ${cy})"`);
    }
    out += reg('circle', `cx="${cx}" cy="${cy}" r="${pr*0.5}"`);
    // stem + leaves
    out += regPath(`M ${cx-8} ${cy+30} L ${cx-8} 430 L ${cx+8} 430 L ${cx+8} ${cy+30} Z`);
    out += reg('ellipse', `cx="${cx-52}" cy="340" rx="46" ry="22" transform="rotate(-28 ${cx-52} 340)"`);
    out += reg('ellipse', `cx="${cx+52}" cy="380" rx="46" ry="22" transform="rotate(28 ${cx+52} 380)"`);
    // ground
    out += regPath(`M 40 430 Q ${cx} 400 460 430 L 460 470 L 40 470 Z`);
    return out;
  }

  function genTree(r) {
    let out = '';
    const cx = S/2;
    out += regPath(`M ${cx-26} 470 L ${cx-16} 260 L ${cx+16} 260 L ${cx+26} 470 Z`);
    const blobs = irange(r, 3, 5);
    for (let i = 0; i < blobs; i++) {
      const bx = cx + (r() - 0.5) * 200;
      const by = 140 + r() * 120;
      out += reg('circle', `cx="${bx.toFixed(0)}" cy="${by.toFixed(0)}" r="${irange(r,50,78)}"`);
    }
    if (r() > 0.5) {
      for (let i = 0; i < irange(r,3,6); i++)
        out += reg('circle', `cx="${(cx + (r()-0.5)*160).toFixed(0)}" cy="${(160 + r()*120).toFixed(0)}" r="10"`);
    }
    out += regPath(`M 30 470 Q ${cx} 448 470 470 L 470 490 L 30 490 Z`);
    return out;
  }

  function genLeaf(r) {
    let out = '';
    const cx = S/2, cy = S/2;
    out += regPath(`M ${cx} 90 C 190 180 190 320 ${cx} 420 C 310 320 310 180 ${cx} 90 Z`);
    out += regPath(`M ${cx} 120 L ${cx} 400`);
    const veins = irange(r, 3, 6);
    for (let i = 1; i <= veins; i++) {
      const y = 150 + (250 / (veins+1)) * i;
      out += regPath(`M ${cx} ${y} Q ${cx-40} ${y-6} ${cx-70} ${y+18}`);
      out += regPath(`M ${cx} ${y} Q ${cx+40} ${y-6} ${cx+70} ${y+18}`);
    }
    return out;
  }

  function genSun(r) {
    let out = '';
    const cx = S/2, cy = S/2;
    const rays = [8, 10, 12][irange(r, 0, 2)];
    for (let i = 0; i < rays; i++) {
      const ang = (360 / rays) * i;
      out += regPath(`M ${cx-14} ${cy-150} L ${cx} ${cy-200} L ${cx+14} ${cy-150} Z`.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m,a,b)=>a+' '+b)) .replace('<path', `<path transform="rotate(${ang} ${cx} ${cy})"`);
    }
    out += reg('circle', `cx="${cx}" cy="${cy}" r="110"`);
    out += reg('circle', `cx="${cx-38}" cy="${cy-16}" r="12"`);
    out += reg('circle', `cx="${cx+38}" cy="${cy-16}" r="12"`);
    out += regPath(`M ${cx-40} ${cy+34} Q ${cx} ${cy+70} ${cx+40} ${cy+34}`);
    return out;
  }

  function genMushroom(r) {
    let out = '';
    const cx = S/2;
    out += regPath(`M ${cx-90} 240 Q ${cx} 120 ${cx+90} 240 Z`);
    const dots = irange(r, 3, 6);
    for (let i = 0; i < dots; i++)
      out += reg('circle', `cx="${(cx + (r()-0.5)*130).toFixed(0)}" cy="${(190 + (r()-0.5)*40).toFixed(0)}" r="${irange(r,10,18)}"`);
    out += regPath(`M ${cx-40} 240 L ${cx-34} 400 Q ${cx} 430 ${cx+34} 400 L ${cx+40} 240 Z`);
    out += regPath(`M 40 410 Q ${cx} 388 460 410 L 460 460 L 40 460 Z`);
    return out;
  }

  function genCat(r) {
    let out = '';
    const cx = S/2, cy = 250;
    out += regPath(`M ${cx-70} ${cy-60} L ${cx-100} ${cy-140} L ${cx-30} ${cy-96} Z`);
    out += regPath(`M ${cx+70} ${cy-60} L ${cx+100} ${cy-140} L ${cx+30} ${cy-96} Z`);
    out += reg('circle', `cx="${cx}" cy="${cy}" r="105"`);
    out += reg('circle', `cx="${cx-40}" cy="${cy-14}" r="14"`);
    out += reg('circle', `cx="${cx+40}" cy="${cy-14}" r="14"`);
    out += regPath(`M ${cx-14} ${cy+18} L ${cx+14} ${cy+18} L ${cx} ${cy+34} Z`);
    out += regPath(`M ${cx} ${cy+34} Q ${cx-30} ${cy+56} ${cx-56} ${cy+44}`);
    out += regPath(`M ${cx} ${cy+34} Q ${cx+30} ${cy+56} ${cx+56} ${cy+44}`);
    // body
    out += regPath(`M ${cx-72} ${cy+80} Q ${cx} ${cy+230} ${cx+72} ${cy+80} Z`);
    out += regPath(`M ${cx+64} ${cy+180} Q ${cx+150} ${cy+150} ${cx+120} ${cy+70}`);
    return out;
  }

  function genFish(r) {
    let out = '';
    const cx = S/2, cy = S/2;
    out += regPath(`M ${cx-120} ${cy} Q ${cx} ${cy-90} ${cx+120} ${cy} Q ${cx} ${cy+90} ${cx-120} ${cy} Z`);
    out += regPath(`M ${cx+110} ${cy} L ${cx+180} ${cy-56} L ${cx+180} ${cy+56} Z`);
    out += reg('circle', `cx="${cx-70}" cy="${cy-16}" r="13"`);
    const scales = irange(r, 4, 8);
    for (let i = 0; i < scales; i++) {
      const sx = cx - 40 + i * 22;
      out += regPath(`M ${sx} ${cy-30} Q ${sx+20} ${cy} ${sx} ${cy+30}`);
    }
    out += regPath(`M ${cx} ${cy-70} Q ${cx+30} ${cy-110} ${cx+58} ${cy-70}`);
    return out;
  }

  function genBird(r) {
    let out = '';
    const cx = S/2, cy = 250;
    out += reg('circle', `cx="${cx}" cy="${cy}" r="90"`);
    out += reg('circle', `cx="${cx-6}" cy="${cy-110}" r="52"`);
    out += reg('circle', `cx="${cx-22}" cy="${cy-120}" r="11"`);
    out += regPath(`M ${cx+30} ${cy-116} L ${cx+78} ${cy-104} L ${cx+30} ${cy-92} Z`);
    // wing
    out += regPath(`M ${cx+10} ${cy-10} Q ${cx+120} ${cy-30} ${cx+96} ${cy+70} Q ${cx+40} ${cy+50} ${cx+10} ${cy-10} Z`);
    // tail
    out += regPath(`M ${cx-80} ${cy+40} L ${cx-160} ${cy+70} L ${cx-84} ${cy+90} Z`);
    // legs
    out += regPath(`M ${cx-20} ${cy+88} L ${cx-24} ${cy+140}`);
    out += regPath(`M ${cx+20} ${cy+88} L ${cx+24} ${cy+140}`);
    return out;
  }

  function genButterfly(r) {
    let out = '';
    const cx = S/2, cy = S/2;
    out += regPath(`M ${cx} ${cy} Q ${cx-160} ${cy-140} ${cx-90} ${cy-30} Q ${cx-150} ${cy+10} ${cx} ${cy} Z`);
    out += regPath(`M ${cx} ${cy} Q ${cx+160} ${cy-140} ${cx+90} ${cy-30} Q ${cx+150} ${cy+10} ${cx} ${cy} Z`);
    out += regPath(`M ${cx} ${cy} Q ${cx-130} ${cy+150} ${cx-70} ${cy+50} Z`);
    out += regPath(`M ${cx} ${cy} Q ${cx+130} ${cy+150} ${cx+70} ${cy+50} Z`);
    for (const s of [-1, 1]) {
      out += reg('circle', `cx="${cx + s*95}" cy="${cy-60}" r="${irange(r,12,20)}"`);
      out += reg('circle', `cx="${cx + s*80}" cy="${cy+70}" r="12"`);
    }
    out += regPath(`M ${cx} ${cy-40} L ${cx} ${cy+80}`);
    out += regPath(`M ${cx} ${cy-40} L ${cx-16} ${cy-64}`);
    out += regPath(`M ${cx} ${cy-40} L ${cx+16} ${cy-64}`);
    return out;
  }

  function genTortoise(r) {
    let out = '';
    const cx = S/2, cy = S/2;
    out += regPath(`M ${cx-130} ${cy} Q ${cx} ${cy-120} ${cx+130} ${cy} Q ${cx} ${cy+70} ${cx-130} ${cy} Z`);
    const cells = irange(r, 4, 7);
    for (let i = 0; i < cells; i++) {
      const ox = cx - 90 + (i * 180 / cells);
      out += regPath(`M ${ox} ${cy-50} L ${ox+22} ${cy-50} L ${ox+14} ${cy+10} L ${ox-8} ${cy+10} Z`);
    }
    out += reg('circle', `cx="${cx+150}" cy="${cy-6}" r="30"`);
    out += reg('circle', `cx="${cx+158}" cy="${cy-12}" r="6"`);
    for (const p of [[-100,55],[100,55]]) out += reg('ellipse', `cx="${cx+p[0]}" cy="${cy+p[1]}" rx="26" ry="16"`);
    return out;
  }

  function genElephant(r) {
    let out = '';
    const cx = S/2 - 20, cy = 250;
    out += reg('ellipse', `cx="${cx}" cy="${cy}" rx="120" ry="100"`);
    out += reg('ellipse', `cx="${cx-96}" cy="${cy-6}" rx="70" ry="80"`);
    out += reg('circle', `cx="${cx-96}" cy="${cy-24}" r="9"`);
    out += regPath(`M ${cx-150} ${cy+30} Q ${cx-210} ${cy+110} ${cx-160} ${cy+150} Q ${cx-140} ${cy+120} ${cx-150} ${cy+30} Z`);
    // ear
    out += reg('circle', `cx="${cx-70}" cy="${cy-40}" r="46"`);
    // legs
    for (const lx of [-70,-20,40,90]) out += regPath(`M ${cx+lx} ${cy+80} L ${cx+lx} ${cy+150} L ${cx+lx+40} ${cy+150} L ${cx+lx+40} ${cy+80} Z`);
    return out;
  }

  function genRocket(r) {
    let out = '';
    const cx = S/2;
    out += regPath(`M ${cx} 70 Q ${cx+60} 180 ${cx+60} 300 L ${cx-60} 300 Q ${cx-60} 180 ${cx} 70 Z`);
    out += reg('circle', `cx="${cx}" cy="200" r="30"`);
    out += regPath(`M ${cx-60} 260 L ${cx-120} 340 L ${cx-60} 320 Z`);
    out += regPath(`M ${cx+60} 260 L ${cx+120} 340 L ${cx+60} 320 Z`);
    out += regPath(`M ${cx-40} 300 L ${cx+40} 300 L ${cx+26} 360 L ${cx-26} 360 Z`);
    const flames = irange(r, 3, 5);
    for (let i = 0; i < flames; i++) {
      const fx = cx - 26 + i * (52 / (flames-1));
      out += regPath(`M ${fx} 360 L ${fx+8} 430 L ${fx+16} 360 Z`);
    }
    for (let i = 0; i < irange(r,4,8); i++)
      out += regPath(starPts(irange(r,40,460), irange(r,60,180), 10));
    return out;
  }

  function genPlanet(r) {
    let out = '';
    const cx = S/2, cy = S/2;
    out += reg('circle', `cx="${cx}" cy="${cy}" r="110"`);
    const bands = irange(r, 2, 4);
    for (let i = 1; i <= bands; i++) {
      const yy = cy - 80 + (160/(bands+1))*i;
      out += regPath(`M ${cx-Math.sqrt(110*110-(yy-cy)*(yy-cy)).toFixed(0)} ${yy.toFixed(0)} Q ${cx} ${(yy+14).toFixed(0)} ${(cx+Math.sqrt(110*110-(yy-cy)*(yy-cy))).toFixed(0)} ${yy.toFixed(0)}`);
    }
    out += reg('ellipse', `cx="${cx}" cy="${cy}" rx="180" ry="42" transform="rotate(-18 ${cx} ${cy})"`);
    for (let i = 0; i < irange(r,4,8); i++)
      out += regPath(starPts(irange(r,40,460), irange(r,40,460), 9));
    return out;
  }

  function starPts(cx, cy, rad) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? rad * 0.45 : rad;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1) + ' ';
    }
    return d + 'Z';
  }

  function genStar(r) {
    let out = '';
    const cx = S/2, cy = S/2;
    out += regPath(starPts(cx, cy, 150));
    out += regPath(starPts(cx, cy, 78));
    for (let i = 0; i < irange(r,5,9); i++)
      out += regPath(starPts(irange(r,40,460), irange(r,40,460), irange(r,10,20)));
    return out;
  }

  function genLantern(r) {
    let out = '';
    const cx = S/2;
    out += regPath(`M ${cx-16} 70 L ${cx+16} 70 L ${cx+16} 100 L ${cx-16} 100 Z`);
    out += reg('ellipse', `cx="${cx}" cy="240" rx="100" ry="140"`);
    const ribs = irange(r, 2, 4);
    for (let i = 1; i <= ribs; i++) {
      const xx = cx - 100 + (200/(ribs+1))*i;
      out += regPath(`M ${xx.toFixed(0)} 118 Q ${cx} 240 ${xx.toFixed(0)} 362`);
    }
    out += regPath(`M ${cx-70} 375 L ${cx+70} 375 L ${cx+70} 400 L ${cx-70} 400 Z`);
    for (let i = 0; i < irange(r,3,6); i++)
      out += regPath(`M ${cx-40+i*18} 400 L ${cx-40+i*18} 450`);
    return out;
  }

  function genFace(r, seed) {
    let out = '';
    const cx = S/2, cy = S/2;
    out += reg('circle', `cx="${cx}" cy="${cy}" r="150"`);
    out += reg('circle', `cx="${cx-56}" cy="${cy-30}" r="20"`);
    out += reg('circle', `cx="${cx+56}" cy="${cy-30}" r="20"`);
    const mood = seed % 4;
    if (mood === 0) out += regPath(`M ${cx-64} ${cy+50} Q ${cx} ${cy+110} ${cx+64} ${cy+50}`);        // happy
    else if (mood === 1) out += regPath(`M ${cx-60} ${cy+70} Q ${cx} ${cy+30} ${cx+60} ${cy+70}`);      // sad
    else if (mood === 2) out += regPath(`M ${cx-50} ${cy+60} L ${cx+50} ${cy+60}`);                     // neutral
    else out += reg('ellipse', `cx="${cx}" cy="${cy+60}" rx="26" ry="34"`);                             // surprised
    out += reg('circle', `cx="${cx-92}" cy="${cy+30}" r="20"`);
    out += reg('circle', `cx="${cx+92}" cy="${cy+30}" r="20"`);
    return out;
  }

  function genHeart(r) {
    let out = '';
    const cx = S/2, cy = 240;
    out += regPath(`M ${cx} ${cy+120} C ${cx-180} ${cy-40} ${cx-70} ${cy-140} ${cx} ${cy-40} C ${cx+70} ${cy-140} ${cx+180} ${cy-40} ${cx} ${cy+120} Z`);
    const inner = irange(r, 1, 3);
    for (let i = 1; i <= inner; i++) {
      const sc = 1 - i * 0.24;
      out += `<path class="cs-region" fill="#ffffff" stroke="#1e293b" stroke-width="3" transform="translate(${cx} ${cy}) scale(${sc.toFixed(2)}) translate(${-cx} ${-cy})" d="M ${cx} ${cy+120} C ${cx-180} ${cy-40} ${cx-70} ${cy-140} ${cx} ${cy-40} C ${cx+70} ${cy-140} ${cx+180} ${cy-40} ${cx} ${cy+120} Z"/>`;
    }
    return out;
  }

  function genHouse(r) {
    let out = '';
    const cx = S/2;
    out += regPath(`M ${cx-140} 250 L ${cx-140} 440 L ${cx+140} 440 L ${cx+140} 250 Z`);
    out += regPath(`M ${cx-160} 250 L ${cx} 120 L ${cx+160} 250 Z`);
    out += regPath(`M ${cx-50} 440 L ${cx-50} 330 L ${cx+50} 330 L ${cx+50} 440 Z`);
    out += reg('circle', `cx="${cx+30}" cy="385" r="7"`);
    out += reg('rect', `x="${cx-120}" y="290" width="60" height="60" rx="4"`);
    out += reg('rect', `x="${cx+60}" y="290" width="60" height="60" rx="4"`);
    out += regPath(`M ${cx+80} 250 L ${cx+80} 170 L ${cx+112} 170 L ${cx+112} 250 Z`);
    out += reg('circle', `cx="${cx-170}" cy="150" r="46"`);
    out += regPath(`M 20 440 Q ${cx} 415 480 440 L 480 470 L 20 470 Z`);
    return out;
  }

  function genCar(r) {
    let out = '';
    const cx = S/2, cy = 260;
    out += regPath(`M ${cx-170} ${cy+40} L ${cx-120} ${cy-30} L ${cx+110} ${cy-30} L ${cx+170} ${cy+40} Z`);
    out += regPath(`M ${cx-96} ${cy-24} L ${cx-70} ${cy-70} L ${cx+30} ${cy-70} L ${cx+50} ${cy-24} Z`);
    out += reg('circle', `cx="${cx-100}" cy="${cy+50}" r="42"`);
    out += reg('circle', `cx="${cx+100}" cy="${cy+50}" r="42"`);
    out += reg('circle', `cx="${cx-100}" cy="${cy+50}" r="18"`);
    out += reg('circle', `cx="${cx+100}" cy="${cy+50}" r="18"`);
    out += reg('rect', `x="${cx+120}" y="${cy}" width="34" height="22" rx="4"`);
    out += regPath(`M 20 ${cy+92} L 480 ${cy+92} L 480 ${cy+120} L 20 ${cy+120} Z`);
    return out;
  }

  function genNote(r) {
    let out = '';
    const cx = S/2;
    out += reg('ellipse', `cx="${cx-40}" cy="360" rx="46" ry="34" transform="rotate(-20 ${cx-40} 360)"`);
    out += regPath(`M ${cx} 350 L ${cx} 120 L ${cx+120} 90 L ${cx+120} 150 L ${cx} 180`);
    out += reg('ellipse', `cx="${cx+80}" cy="315" rx="46" ry="34" transform="rotate(-20 ${cx+80} 315)"`);
    out += regPath(`M ${cx+120} 305 L ${cx+120} 90`);
    for (let i = 0; i < irange(r,3,6); i++)
      out += regPath(starPts(irange(r,40,460), irange(r,60,200), 12));
    return out;
  }

  function genDrum(r) {
    let out = '';
    const cx = S/2, cy = S/2;
    out += reg('ellipse', `cx="${cx}" cy="${cy-70}" rx="130" ry="40"`);
    out += regPath(`M ${cx-130} ${cy-70} L ${cx-110} ${cy+90} Q ${cx} ${cy+130} ${cx+110} ${cy+90} L ${cx+130} ${cy-70}`);
    const zig = irange(r, 5, 8);
    for (let i = 0; i < zig; i++) {
      const x1 = cx - 120 + (i * 240 / zig);
      const x2 = cx - 120 + ((i+0.5) * 240 / zig);
      out += regPath(`M ${x1.toFixed(0)} ${cy-60} L ${x2.toFixed(0)} ${cy+20} L ${(x1+240/zig).toFixed(0)} ${cy-60}`);
    }
    // sticks
    out += regPath(`M ${cx-40} ${cy-160} L ${cx-120} ${cy-90}`);
    out += regPath(`M ${cx+40} ${cy-160} L ${cx+120} ${cy-90}`);
    out += reg('circle', `cx="${cx-40}" cy="${cy-160}" r="14"`);
    out += reg('circle', `cx="${cx+40}" cy="${cy-160}" r="14"`);
    return out;
  }

  function genLetter(r, seed) {
    const ch = String.fromCharCode(65 + (seed % 26));
    let out = `<text x="${S/2}" y="330" text-anchor="middle" font-family="'Baloo 2',cursive" font-size="300" font-weight="800" class="cs-region" fill="#ffffff" stroke="#1e293b" stroke-width="5" paint-order="stroke">${ch}</text>`;
    // decorative fillable frame dots
    const k = 16;
    for (let i = 0; i < k; i++) {
      const a = (2 * Math.PI / k) * i;
      out += reg('circle', `cx="${(S/2 + 224 * Math.cos(a)).toFixed(0)}" cy="${(S/2 + 224 * Math.sin(a)).toFixed(0)}" r="${(i%2?10:16)}"`);
    }
    return out;
  }

  function genNumber(r, seed) {
    const n = seed % 21;
    let out = `<text x="${S/2}" y="300" text-anchor="middle" font-family="'Baloo 2',cursive" font-size="240" font-weight="800" class="cs-region" fill="#ffffff" stroke="#1e293b" stroke-width="5" paint-order="stroke">${n}</text>`;
    const show = Math.min(n === 0 ? 10 : n, 10);
    for (let i = 0; i < show; i++) {
      const cxp = 70 + (i % 5) * 90;
      const cyp = 380 + Math.floor(i / 5) * 60;
      out += reg('circle', `cx="${cxp}" cy="${cyp}" r="22"`);
    }
    return out;
  }

  function genShape(r, seed) {
    let out = '';
    const cx = S/2, cy = S/2;
    const kinds = ['triangle','square','pentagon','hexagon','star','diamond'];
    const kind = kinds[seed % kinds.length];
    const sides = { triangle:3, square:4, pentagon:5, hexagon:6, diamond:4 }[kind];
    if (kind === 'star') { out += regPath(starPts(cx, cy, 150)); }
    else {
      const R = 150, rot = kind === 'diamond' ? Math.PI/4 : (kind==='square'?Math.PI/4:-Math.PI/2);
      let d = '';
      for (let i = 0; i < sides; i++) {
        const a = rot + (2*Math.PI/sides)*i;
        const ry = kind === 'diamond' ? R*1.3 : R;
        d += (i?'L':'M') + (cx + R*Math.cos(a)).toFixed(1) + ' ' + (cy + ry*Math.sin(a)).toFixed(1) + ' ';
      }
      out += regPath(d + 'Z');
    }
    // nested + corner motifs
    out += reg('circle', `cx="${cx}" cy="${cy}" r="${irange(r,30,60)}"`);
    for (let i = 0; i < irange(r,3,6); i++)
      out += reg('circle', `cx="${irange(r,50,450)}" cy="${irange(r,50,450)}" r="${irange(r,10,22)}"`);
    return out;
  }

  const GEN = {
    mandala: genMandala, flower: genFlower, tree: genTree, leaf: genLeaf, sun: genSun,
    mushroom: genMushroom, cat: genCat, fish: genFish, bird: genBird, butterfly: genButterfly,
    tortoise: genTortoise, elephant: genElephant, rocket: genRocket, planet: genPlanet,
    star: genStar, lantern: genLantern, face: genFace, heart: genHeart, house: genHouse,
    car: genCar, note: genNote, drum: genDrum, letter: genLetter, number: genNumber, shape: genShape,
  };

  /* Build one page's SVG for a category + page index */
  function buildPage(cat, idx) {
    const seed = (CATS.indexOf(cat) + 1) * 100003 + idx * 61;
    const r = rng(seed);
    let kind;
    if (cat.id === 'alphabet') kind = 'letter';
    else if (cat.id === 'math') kind = (idx % 2 === 0) ? 'number' : 'shape';
    else kind = cat.kinds[idx % cat.kinds.length];
    const inner = GEN[kind](r, seed + idx);
    // subtle fillable corner flourishes shared by all (keeps pages lively)
    return OPEN + inner + CLOSE;
  }

  /* ══════════ UI ══════════ */
  let cur = { cat: CATS[0], page: 0, color: '#EF5350' };

  function el(id) { return document.getElementById(id); }

  function renderCats() {
    const wrap = el('csCats');
    wrap.innerHTML = CATS.map((c, i) =>
      `<button class="cs-cat${i === CATS.indexOf(cur.cat) ? ' active' : ''}" style="--cc:${c.color}" onclick="csPickCat(${i})">
        <span class="cs-cat-emoji">${c.emoji}</span>
        <span class="cs-cat-name">${c.name}</span>
        <span class="cs-cat-count">${c.count} pages</span>
      </button>`).join('');
  }

  function renderPalette() {
    el('csPalette').innerHTML = PALETTE.map(c =>
      `<button class="cs-swatch${c === cur.color ? ' active' : ''}${c === '#FFFFFF' ? ' cs-eraser' : ''}" style="background:${c}" onclick="csPickColor('${c}')" aria-label="${c === '#FFFFFF' ? 'Eraser' : c}"></button>`
    ).join('');
  }

  function renderPage() {
    el('csStage').innerHTML = buildPage(cur.cat, cur.page);
    el('csStage').querySelectorAll('.cs-region').forEach(reg => {
      reg.addEventListener('click', function () { this.setAttribute('fill', cur.color); });
    });
    el('csPageInfo').textContent = `${cur.cat.name} · Page ${cur.page + 1} of ${cur.cat.count}`;
    el('csPrev').disabled = cur.page === 0;
    el('csNext').disabled = cur.page === cur.cat.count - 1;
  }

  window.csPickCat = function (i) { cur.cat = CATS[i]; cur.page = 0; renderCats(); renderPage(); };
  window.csPickColor = function (c) { cur.color = c; renderPalette(); };
  window.csPrev = function () { if (cur.page > 0) { cur.page--; renderPage(); } };
  window.csNext = function () { if (cur.page < cur.cat.count - 1) { cur.page++; renderPage(); } };
  window.csRandom = function () { cur.page = Math.floor(Math.random() * cur.cat.count); renderPage(); };
  window.csReset = function () { el('csStage').querySelectorAll('.cs-region').forEach(r => r.setAttribute('fill', '#ffffff')); };
  window.csPrint = function () { window.print(); };

  function init() {
    // deep-link ?cat=animals or #studio-animals
    const params = new URLSearchParams(location.search);
    const hashCat = (location.hash.match(/cat=([a-z]+)/) || [])[1];
    const want = params.get('cat') || hashCat;
    const found = CATS.find(c => c.id === want);
    if (found) cur.cat = found;
    renderCats(); renderPalette(); renderPage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
