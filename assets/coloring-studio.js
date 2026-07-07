/* ══════════════════════════════════════════════════════════════
   Kivora Coloring Studio — on-screen colour-in engine
   Generates full illustrated cartoon SCENES (characters, animals,
   places) as fillable line-art. 10 categories, 600 distinct pages.
   Tap a region to fill it with the selected colour; print or reset.
══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Categories (counts sum to 600) ───────────────────────── */
  const CATS = [
    { id: 'animals',   name: 'Animals',            emoji: '🐘', count: 80, color: '#4A90E2' },
    { id: 'nature',    name: 'Nature & Flowers',   emoji: '🌸', count: 70, color: '#27AE60' },
    { id: 'alphabet',  name: 'Alphabet A–Z',       emoji: '🔤', count: 60, color: '#8E44AD' },
    { id: 'math',      name: 'Numbers & Counting', emoji: '🔢', count: 55, color: '#EF5350' },
    { id: 'festivals', name: 'World Festivals',    emoji: '🎉', count: 75, color: '#F39C12' },
    { id: 'wildlife',  name: 'Sri Lankan Wildlife',emoji: '🦚', count: 50, color: '#16A085' },
    { id: 'space',     name: 'Space & Science',    emoji: '🚀', count: 65, color: '#2980B9' },
    { id: 'emotions',  name: 'Emotions & Feelings',emoji: '❤️', count: 40, color: '#E91E63' },
    { id: 'everyday',  name: 'Everyday Life',      emoji: '🏡', count: 55, color: '#E67E22' },
    { id: 'music',     name: 'Music & Dance',      emoji: '🎵', count: 50, color: '#9B59B6' },
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
  const pick   = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];
  const irange = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

  const S = 500;                       // viewbox size
  const OPEN  = `<svg viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg" class="cs-canvas">`;
  const CLOSE = `</svg>`;

  /* Fillable region helpers */
  function P(d, sw) {                                    // fillable closed path
    return `<path class="cs-region" d="${d}" fill="#ffffff" stroke="#1e293b" stroke-width="${sw||3}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  function C(cx, cy, r, sw) {                            // fillable circle
    return `<circle class="cs-region" cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="#1e293b" stroke-width="${sw||3}"/>`;
  }
  function E(cx, cy, rx, ry, rot, sw) {                  // fillable ellipse
    const t = rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : '';
    return `<ellipse class="cs-region" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#ffffff" stroke="#1e293b" stroke-width="${sw||3}"${t}/>`;
  }
  function LINE(d, sw) {                                 // detail stroke — NOT fillable
    return `<path d="${d}" fill="none" stroke="#1e293b" stroke-width="${sw||3}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  function DOT(cx, cy, r) {                              // solid detail dot (pupil, nose) — NOT fillable
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1e293b"/>`;
  }

  /* ══════════ SCENE PIECES ══════════ */

  function cloud(cx, cy, s) {
    s = s || 1;
    return P(`M ${cx-42*s} ${cy}
      a ${16*s} ${16*s} 0 0 1 ${14*s} -${20*s}
      a ${20*s} ${20*s} 0 0 1 ${34*s} -${6*s}
      a ${16*s} ${16*s} 0 0 1 ${26*s} ${10*s}
      a ${13*s} ${13*s} 0 0 1 -${6*s} ${16*s} Z`);
  }

  function sunCorner(r) {
    let o = '';
    const cx = 74, cy = 74, R = 44;
    const rays = irange(r, 7, 9);
    for (let i = 0; i < rays; i++) {
      const a = (Math.PI * 2 / rays) * i;
      const x1 = cx + Math.cos(a) * (R + 8),  y1 = cy + Math.sin(a) * (R + 8);
      const x2 = cx + Math.cos(a) * (R + 26), y2 = cy + Math.sin(a) * (R + 26);
      o += LINE(`M ${x1.toFixed(0)} ${y1.toFixed(0)} L ${x2.toFixed(0)} ${y2.toFixed(0)}`, 4);
    }
    o += C(cx, cy, R);
    o += DOT(cx-13, cy-6, 3.5) + DOT(cx+13, cy-6, 3.5);
    o += LINE(`M ${cx-14} ${cy+10} Q ${cx} ${cy+22} ${cx+14} ${cy+10}`);
    return o;
  }

  function moonStars(r) {
    let o = P(`M 96 46 A 40 40 0 1 0 96 118 A 32 32 0 1 1 96 46 Z`);
    for (let i = 0; i < irange(r, 4, 6); i++)
      o += starP(irange(r, 150, 460), irange(r, 30, 130), irange(r, 8, 14));
    return o;
  }

  function starP(cx, cy, rad) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? rad * 0.45 : rad;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1) + ' ';
    }
    return P(d + 'Z');
  }

  function flyingBird(cx, cy) {
    return P(`M ${cx-18} ${cy} Q ${cx-8} ${cy-12} ${cx} ${cy} Q ${cx+8} ${cy-12} ${cx+18} ${cy} Q ${cx+8} ${cy-4} ${cx} ${cy+2} Q ${cx-8} ${cy-4} ${cx-18} ${cy} Z`, 2.5);
  }

  function miniFlower(cx, cy, s) {
    s = s || 1; let o = '';
    for (let i = 0; i < 5; i++)
      o += E(cx, cy - 11*s, 5.5*s, 9*s, 72 * i, 2.5).replace(`rotate(${72*i} ${cx} ${cy - 11*s})`, `rotate(${72*i} ${cx} ${cy})`);
    o += C(cx, cy, 5*s, 2.5);
    o += LINE(`M ${cx} ${cy+5*s} L ${cx} ${cy+22*s}`, 2.5);
    return o;
  }

  function grassTuft(cx, cy) {
    return LINE(`M ${cx-8} ${cy} Q ${cx-7} ${cy-14} ${cx-10} ${cy-18} M ${cx} ${cy} Q ${cx} ${cy-18} ${cx-1} ${cy-22} M ${cx+8} ${cy} Q ${cx+8} ${cy-13} ${cx+11} ${cy-17}`, 2.5);
  }

  function bgTree(cx, groundY, s) {
    s = s || 1;
    let o = P(`M ${cx-9*s} ${groundY} L ${cx-6*s} ${groundY-52*s} L ${cx+6*s} ${groundY-52*s} L ${cx+9*s} ${groundY} Z`);
    o += P(`M ${cx-34*s} ${groundY-46*s}
      a ${20*s} ${20*s} 0 0 1 ${16*s} -${26*s}
      a ${22*s} ${22*s} 0 0 1 ${36*s} 0
      a ${20*s} ${20*s} 0 0 1 ${16*s} ${26*s}
      a ${18*s} ${18*s} 0 0 1 -${16*s} ${18*s}
      a ${26*s} ${26*s} 0 0 1 -${36*s} 0
      a ${18*s} ${18*s} 0 0 1 -${16*s} -${18*s} Z`);
    return o;
  }

  function bush(cx, groundY, s) {
    s = s || 1;
    return P(`M ${cx-34*s} ${groundY} a ${14*s} ${14*s} 0 0 1 ${10*s} -${20*s} a ${16*s} ${16*s} 0 0 1 ${24*s} -${4*s} a ${15*s} ${15*s} 0 0 1 ${22*s} ${8*s} a ${12*s} ${12*s} 0 0 1 -${4*s} ${16*s} Z`);
  }

  /* Meadow scene: ground curve, hills, clouds, sun/birds, flora.
     Returns {pre, post, groundY} — pre = behind subject, post = in front */
  function meadow(r, opts) {
    opts = opts || {};
    const groundY = 392;
    let pre = '';
    // rolling ground
    pre += P(`M 0 ${groundY} Q 125 ${groundY-26} 250 ${groundY-8} Q 375 ${groundY+8} 500 ${groundY-18} L 500 500 L 0 500 Z`);
    // sky things
    if (opts.night) pre += moonStars(r);
    else pre += sunCorner(r);
    const nClouds = irange(r, 2, 3);
    for (let i = 0; i < nClouds; i++)
      pre += cloud(150 + i * 130 + irange(r, -24, 24), 58 + irange(r, -14, 40), 0.75 + r() * 0.5);
    if (!opts.night && r() > 0.4) { pre += flyingBird(irange(r, 300, 430), irange(r, 120, 170)); if (r() > 0.5) pre += flyingBird(irange(r, 250, 420), irange(r, 90, 150)); }
    // background flora
    if (!opts.noTrees) {
      if (r() > 0.35) pre += bgTree(irange(r, 40, 92), groundY - 4, 0.9 + r() * 0.35);
      if (r() > 0.35) pre += bgTree(irange(r, 408, 462), groundY - 8, 0.85 + r() * 0.3);
      if (r() > 0.5)  pre += bush(irange(r, 120, 170), groundY + 2, 0.9);
    }
    // foreground flora drawn after the subject
    let post = '';
    const nFl = irange(r, 2, 4);
    for (let i = 0; i < nFl; i++)
      post += miniFlower(36 + i * (440 / nFl) + irange(r, -16, 16), groundY + irange(r, 34, 74), 0.8 + r() * 0.5);
    for (let i = 0; i < irange(r, 2, 4); i++)
      post += grassTuft(irange(r, 30, 470), groundY + irange(r, 26, 84));
    return { pre, post, groundY };
  }

  /* ══════════ CHARACTER BUILDER (child) ══════════
     Detailed kid: hair styles, face, clothes, backpack, shoes. */
  function child(r, cx, footY, o) {
    o = o || {};
    const H = 210;                       // total height
    const headR = 52;
    const headCX = cx, headCY = footY - H + headR;
    const bodyTop = headCY + headR - 6;
    const hipY = bodyTop + 74;
    let out = '';

    // back arm (waving or down)
    if (o.wave) {
      out += P(`M ${cx-30} ${bodyTop+18} Q ${cx-72} ${bodyTop-4} ${cx-80} ${headCY-8} L ${cx-64} ${headCY-16} Q ${cx-56} ${bodyTop+8} ${cx-22} ${bodyTop+26} Z`);
      out += C(cx-74, headCY-16, 11);   // hand
    } else {
      out += P(`M ${cx-30} ${bodyTop+16} Q ${cx-52} ${bodyTop+48} ${cx-46} ${hipY-4} L ${cx-32} ${hipY-8} Q ${cx-36} ${bodyTop+46} ${cx-20} ${bodyTop+24} Z`);
      out += C(cx-40, hipY, 10);
    }

    // backpack behind body
    if (o.backpack) {
      out += P(`M ${cx+18} ${bodyTop+8} Q ${cx+66} ${bodyTop+4} ${cx+64} ${bodyTop+58} Q ${cx+62} ${bodyTop+86} ${cx+26} ${bodyTop+84} Z`);
      out += P(`M ${cx+34} ${bodyTop+40} L ${cx+58} ${bodyTop+40} L ${cx+58} ${bodyTop+64} L ${cx+34} ${bodyTop+64} Z`); // pocket
    }

    // legs (walking pose = one forward one back)
    const legW = 15;
    if (o.walk) {
      out += P(`M ${cx-16} ${hipY} L ${cx-34} ${footY-14} L ${cx-34+legW} ${footY-12} L ${cx-2} ${hipY+2} Z`);
      out += P(`M ${cx+4} ${hipY} L ${cx+26} ${footY-14} L ${cx+26+legW} ${footY-16} L ${cx+18} ${hipY} Z`);
      // shoes
      out += P(`M ${cx-40} ${footY-14} Q ${cx-46} ${footY} ${cx-30} ${footY} L ${cx-8} ${footY} Q ${cx-10} ${footY-12} ${cx-20} ${footY-14} Z`);
      out += P(`M ${cx+20} ${footY-16} Q ${cx+14} ${footY-2} ${cx+30} ${footY-2} L ${cx+52} ${footY-2} Q ${cx+50} ${footY-14} ${cx+40} ${footY-16} Z`);
      out += LINE(`M ${cx-42} ${footY-4} L ${cx-10} ${footY-4} M ${cx+18} ${footY-6} L ${cx+50} ${footY-6}`, 2);
    } else {
      out += P(`M ${cx-16} ${hipY} L ${cx-16} ${footY-12} L ${cx-1} ${footY-12} L ${cx-1} ${hipY} Z`);
      out += P(`M ${cx+3} ${hipY} L ${cx+3} ${footY-12} L ${cx+18} ${footY-12} L ${cx+18} ${hipY} Z`);
      out += P(`M ${cx-22} ${footY-12} Q ${cx-26} ${footY} ${cx-12} ${footY} L ${cx+1} ${footY} L ${cx+1} ${footY-12} Z`);
      out += P(`M ${cx+1} ${footY-12} L ${cx+1} ${footY} L ${cx+14} ${footY} Q ${cx+28} ${footY} ${cx+24} ${footY-12} Z`);
    }

    // torso: dress or t-shirt + shorts
    if (o.dress) {
      out += P(`M ${cx-24} ${bodyTop+4} L ${cx+24} ${bodyTop+4} Q ${cx+30} ${bodyTop+30} ${cx+42} ${hipY+16} L ${cx-42} ${hipY+16} Q ${cx-30} ${bodyTop+30} ${cx-24} ${bodyTop+4} Z`);
      out += LINE(`M ${cx-34} ${hipY+2} L ${cx+34} ${hipY+2}`, 2);
    } else {
      out += P(`M ${cx-26} ${bodyTop+2} L ${cx+26} ${bodyTop+2} Q ${cx+32} ${bodyTop+40} ${cx+26} ${bodyTop+66} L ${cx-26} ${bodyTop+66} Q ${cx-32} ${bodyTop+40} ${cx-26} ${bodyTop+2} Z`);
      out += P(`M ${cx-24} ${bodyTop+66} L ${cx+24} ${bodyTop+66} L ${cx+22} ${hipY+18} L ${cx-22} ${hipY+18} Z`); // shorts
      if (o.backpack) out += LINE(`M ${cx-12} ${bodyTop+6} L ${cx-4} ${bodyTop+62} M ${cx+12} ${bodyTop+6} L ${cx+6} ${bodyTop+62}`, 2.5); // straps
      else out += DOT(cx, bodyTop+26, 2.6) + DOT(cx, bodyTop+42, 2.6); // buttons
    }

    // front arm
    out += P(`M ${cx+26} ${bodyTop+14} Q ${cx+52} ${bodyTop+42} ${cx+44} ${hipY-6} L ${cx+30} ${hipY-10} Q ${cx+34} ${bodyTop+44} ${cx+18} ${bodyTop+22} Z`);
    out += C(cx+38, hipY-4, 10);

    // head + face
    out += C(headCX, headCY, headR);
    // hair styles
    const hair = o.hair || 'short';
    if (hair === 'cap') {
      out += P(`M ${headCX-50} ${headCY-14} Q ${headCX-44} ${headCY-66} ${headCX+8} ${headCY-58} Q ${headCX+52} ${headCY-52} ${headCX+48} ${headCY-16} Q ${headCX+20} ${headCY-34} ${headCX-16} ${headCY-30} Q ${headCX-42} ${headCY-26} ${headCX-50} ${headCY-14} Z`); // fringe
      out += P(`M ${headCX-54} ${headCY-24} Q ${headCX-40} ${headCY-84} ${headCX+22} ${headCY-72} Q ${headCX+60} ${headCY-62} ${headCX+54} ${headCY-30} Q ${headCX+10} ${headCY-52} ${headCX-54} ${headCY-24} Z`); // cap dome
      out += P(`M ${headCX+40} ${headCY-46} Q ${headCX+86} ${headCY-46} ${headCX+92} ${headCY-26} Q ${headCX+64} ${headCY-30} ${headCX+44} ${headCY-30} Z`); // brim
      out += C(headCX+2, headCY-70, 7);  // cap button
    } else if (hair === 'bow') {
      out += P(`M ${headCX-52} ${headCY+6} Q ${headCX-62} ${headCY-52} ${headCX-10} ${headCY-58} Q ${headCX+48} ${headCY-62} ${headCX+52} ${headCY+4} Q ${headCX+40} ${headCY-30} ${headCX+12} ${headCY-34} Q ${headCX-30} ${headCY-38} ${headCX-52} ${headCY+6} Z`);
      // side hair
      out += P(`M ${headCX-52} ${headCY} Q ${headCX-66} ${headCY+30} ${headCX-56} ${headCY+62} Q ${headCX-46} ${headCY+40} ${headCX-48} ${headCY+8} Z`);
      out += P(`M ${headCX+52} ${headCY} Q ${headCX+66} ${headCY+30} ${headCX+56} ${headCY+62} Q ${headCX+46} ${headCY+40} ${headCX+48} ${headCY+8} Z`);
      // bow
      out += P(`M ${headCX-30} ${headCY-52} L ${headCX-52} ${headCY-66} L ${headCX-46} ${headCY-40} Z`);
      out += P(`M ${headCX-30} ${headCY-52} L ${headCX-12} ${headCY-70} L ${headCX-6} ${headCY-44} Z`);
      out += C(headCX-27, headCY-53, 6);
    } else if (hair === 'pigtails') {
      out += P(`M ${headCX-50} ${headCY+2} Q ${headCX-58} ${headCY-56} ${headCX} ${headCY-58} Q ${headCX+58} ${headCY-56} ${headCX+50} ${headCY+2} Q ${headCX+30} ${headCY-34} ${headCX} ${headCY-34} Q ${headCX-30} ${headCY-34} ${headCX-50} ${headCY+2} Z`);
      out += E(headCX-62, headCY+6, 15, 26, 18);
      out += E(headCX+62, headCY+6, 15, 26, -18);
      out += C(headCX-56, headCY-14, 6) + C(headCX+56, headCY-14, 6); // ties
    } else { // short
      out += P(`M ${headCX-50} ${headCY-6} Q ${headCX-50} ${headCY-62} ${headCX+4} ${headCY-58} Q ${headCX+52} ${headCY-54} ${headCX+50} ${headCY-4} Q ${headCX+30} ${headCY-34} ${headCX-2} ${headCY-32} Q ${headCX-34} ${headCY-32} ${headCX-50} ${headCY-6} Z`);
    }
    // face details
    const eyeY = headCY + 2;
    out += C(headCX-19, eyeY, 8, 2.5) + C(headCX+19, eyeY, 8, 2.5);
    out += DOT(headCX-17, eyeY+1, 3.4) + DOT(headCX+21, eyeY+1, 3.4);
    out += LINE(`M ${headCX-28} ${eyeY-14} Q ${headCX-19} ${eyeY-19} ${headCX-10} ${eyeY-14}`, 2.5);
    out += LINE(`M ${headCX+10} ${eyeY-14} Q ${headCX+19} ${eyeY-19} ${headCX+28} ${eyeY-14}`, 2.5);
    out += LINE(`M ${headCX-10} ${eyeY+22} Q ${headCX} ${eyeY+30} ${headCX+10} ${eyeY+22}`, 3);
    out += C(headCX-32, eyeY+14, 6, 2) + C(headCX+32, eyeY+14, 6, 2);   // blush
    if (o.freckles) { out += DOT(headCX-30, eyeY+6, 1.4) + DOT(headCX-25, eyeY+9, 1.4) + DOT(headCX+30, eyeY+6, 1.4) + DOT(headCX+25, eyeY+9, 1.4); }
    return out;
  }

  /* ══════════ ANIMAL BUILDER (quadruped) ══════════ */
  function quadruped(r, cx, footY, o) {
    o = o || {};
    const bw = o.big ? 150 : 120, bh = o.big ? 86 : 70;
    const bodyCX = cx, bodyCY = footY - bh + 6;
    const headR = o.big ? 56 : 48;
    const headCX = cx - bw * 0.62, headCY = bodyCY - bh * 0.55;
    let out = '';

    // tail
    if (o.tail === 'bushy')
      out += P(`M ${bodyCX+bw*0.55} ${bodyCY-8} Q ${bodyCX+bw*0.95} ${bodyCY-70} ${bodyCX+bw*0.62} ${bodyCY-96} Q ${bodyCX+bw*0.92} ${bodyCY-60} ${bodyCX+bw*0.7} ${bodyCY+6} Z`);
    else if (o.tail === 'curl')
      out += LINE(`M ${bodyCX+bw*0.55} ${bodyCY-10} Q ${bodyCX+bw*0.85} ${bodyCY-40} ${bodyCX+bw*0.68} ${bodyCY-56} Q ${bodyCX+bw*0.55} ${bodyCY-64} ${bodyCX+bw*0.58} ${bodyCY-48}`, 4);
    else
      out += LINE(`M ${bodyCX+bw*0.55} ${bodyCY-6} Q ${bodyCX+bw*0.9} ${bodyCY+10} ${bodyCX+bw*0.82} ${bodyCY+44}`, 4);

    // far legs
    out += P(`M ${bodyCX-bw*0.34} ${bodyCY+bh*0.4} L ${bodyCX-bw*0.38} ${footY} L ${bodyCX-bw*0.22} ${footY} L ${bodyCX-bw*0.2} ${bodyCY+bh*0.4} Z`);
    out += P(`M ${bodyCX+bw*0.22} ${bodyCY+bh*0.4} L ${bodyCX+bw*0.18} ${footY} L ${bodyCX+bw*0.34} ${footY} L ${bodyCX+bw*0.36} ${bodyCY+bh*0.4} Z`);
    // body
    out += E(bodyCX, bodyCY, bw * 0.58, bh * 0.62);
    // near legs
    out += P(`M ${bodyCX-bw*0.5} ${bodyCY+bh*0.3} L ${bodyCX-bw*0.54} ${footY} L ${bodyCX-bw*0.36} ${footY} L ${bodyCX-bw*0.34} ${bodyCY+bh*0.3} Z`);
    out += P(`M ${bodyCX+bw*0.36} ${bodyCY+bh*0.3} L ${bodyCX+bw*0.34} ${footY} L ${bodyCX+bw*0.52} ${footY} L ${bodyCX+bw*0.54} ${bodyCY+bh*0.3} Z`);
    // spots / stripes / mane
    if (o.spots) for (let i = 0; i < o.spots; i++)
      out += C(bodyCX - bw*0.3 + (r() * bw * 0.6), bodyCY - bh*0.2 + r() * bh * 0.4, 7 + r() * 7, 2.5);
    if (o.mane) out += P(`M ${headCX-headR*1.3} ${headCY} a ${headR*1.32} ${headR*1.32} 0 1 1 ${headR*2.64} 0 a ${headR*1.32} ${headR*1.32} 0 1 1 -${headR*2.64} 0 Z`);
    // ears
    if (o.ears === 'point') {
      out += P(`M ${headCX-headR*0.7} ${headCY-headR*0.6} L ${headCX-headR*0.95} ${headCY-headR*1.5} L ${headCX-headR*0.2} ${headCY-headR*0.92} Z`);
      out += P(`M ${headCX+headR*0.7} ${headCY-headR*0.6} L ${headCX+headR*0.95} ${headCY-headR*1.5} L ${headCX+headR*0.2} ${headCY-headR*0.92} Z`);
    } else if (o.ears === 'floppy') {
      out += E(headCX-headR*0.85, headCY-headR*0.1, headR*0.3, headR*0.62, 20);
      out += E(headCX+headR*0.85, headCY-headR*0.1, headR*0.3, headR*0.62, -20);
    } else {
      out += C(headCX-headR*0.72, headCY-headR*0.72, headR*0.34);
      out += C(headCX+headR*0.72, headCY-headR*0.72, headR*0.34);
    }
    // head
    out += C(headCX, headCY, headR);
    // trunk (elephant)
    if (o.trunk) {
      out += P(`M ${headCX-headR*0.3} ${headCY+headR*0.35} Q ${headCX-headR*1.1} ${headCY+headR*1.3} ${headCX-headR*0.6} ${headCY+headR*1.8} Q ${headCX-headR*0.3} ${headCY+headR*1.95} ${headCX-headR*0.25} ${headCY+headR*1.7} Q ${headCX-headR*0.62} ${headCY+headR*1.35} ${headCX+headR*0.05} ${headCY+headR*0.5} Z`);
    } else {
      // muzzle + nose + mouth
      out += E(headCX, headCY + headR*0.42, headR*0.42, headR*0.3);
      out += DOT(headCX, headCY + headR*0.26, 4.5);
      out += LINE(`M ${headCX} ${headCY+headR*0.32} L ${headCX} ${headCY+headR*0.5} M ${headCX-10} ${headCY+headR*0.58} Q ${headCX} ${headCY+headR*0.7} ${headCX+10} ${headCY+headR*0.58}`, 2.5);
      if (o.whiskers) out += LINE(`M ${headCX-headR*0.5} ${headCY+headR*0.3} L ${headCX-headR*0.95} ${headCY+headR*0.2} M ${headCX-headR*0.5} ${headCY+headR*0.42} L ${headCX-headR*0.95} ${headCY+headR*0.46} M ${headCX+headR*0.5} ${headCY+headR*0.3} L ${headCX+headR*0.95} ${headCY+headR*0.2} M ${headCX+headR*0.5} ${headCY+headR*0.42} L ${headCX+headR*0.95} ${headCY+headR*0.46}`, 2);
    }
    // eyes
    out += C(headCX-headR*0.34, headCY-headR*0.1, 7, 2.5) + C(headCX+headR*0.34, headCY-headR*0.1, 7, 2.5);
    out += DOT(headCX-headR*0.32, headCY-headR*0.08, 3) + DOT(headCX+headR*0.36, headCY-headR*0.08, 3);
    if (o.collar) { out += LINE(`M ${headCX-headR*0.66} ${headCY+headR*0.82} Q ${headCX} ${headCY+headR*1.06} ${headCX+headR*0.66} ${headCY+headR*0.82}`, 5); out += C(headCX, headCY+headR*1.06, 6, 2); }
    return out;
  }

  /* ══════════ MORE SUBJECTS ══════════ */

  function kiviFox(r, cx, footY) {
    let out = '';
    const headCY = footY - 148, headR = 52;
    // tail (attached to lower body, curling up)
    out += P(`M ${cx+40} ${footY-34} Q ${cx+118} ${footY-40} ${cx+108} ${footY-124} Q ${cx+92} ${footY-64} ${cx+42} ${footY-62} Z`);
    out += P(`M ${cx+108} ${footY-124} Q ${cx+116} ${footY-96} ${cx+96} ${footY-84} Q ${cx+108} ${footY-104} ${cx+100} ${footY-118} Z`, 2.5); // white tail tip
    // body (tall enough to meet the head)
    out += P(`M ${cx-42} ${footY} Q ${cx-52} ${footY-92} ${cx} ${footY-116} Q ${cx+52} ${footY-92} ${cx+42} ${footY} Z`);
    out += E(cx, footY-44, 24, 32, 0, 2.5);  // tummy
    // paws
    out += E(cx-26, footY-4, 14, 9) + E(cx+26, footY-4, 14, 9);
    // ears (outer + inner)
    out += P(`M ${cx-44} ${headCY-24} L ${cx-58} ${headCY-84} L ${cx-10} ${headCY-52} Z`);
    out += P(`M ${cx+44} ${headCY-24} L ${cx+58} ${headCY-84} L ${cx+10} ${headCY-52} Z`);
    out += P(`M ${cx-40} ${headCY-34} L ${cx-48} ${headCY-70} L ${cx-20} ${headCY-50} Z`, 2.5);
    out += P(`M ${cx+40} ${headCY-34} L ${cx+48} ${headCY-70} L ${cx+20} ${headCY-50} Z`, 2.5);
    // head + cheeks + muzzle
    out += C(cx, headCY, headR);
    out += E(cx, headCY+22, 26, 18, 0, 2.5);
    out += C(cx-20, headCY-4, 9, 2.5) + C(cx+20, headCY-4, 9, 2.5);
    out += DOT(cx-18, headCY-2, 3.6) + DOT(cx+22, headCY-2, 3.6);
    out += DOT(cx, headCY+14, 4.5);
    out += LINE(`M ${cx} ${headCY+18} Q ${cx-8} ${headCY+30} ${cx-16} ${headCY+24} M ${cx} ${headCY+18} Q ${cx+8} ${headCY+30} ${cx+16} ${headCY+24}`, 2.5);
    out += starP(cx, headCY-40, 9); // forehead star
    return out;
  }

  function rabbit(r, cx, footY) {
    let out = '';
    const headCY = footY - 150, headR = 44;
    out += E(cx-30, headCY-70, 13, 44, -10);
    out += E(cx+30, headCY-70, 13, 44, 10);
    out += E(cx-30, headCY-70, 6, 30, -10, 2.5);
    out += E(cx+30, headCY-70, 6, 30, 10, 2.5);
    out += P(`M ${cx-34} ${footY} Q ${cx-44} ${footY-70} ${cx} ${footY-76} Q ${cx+44} ${footY-70} ${cx+34} ${footY} Z`);
    out += E(cx, footY-30, 18, 24, 0, 2.5);
    out += E(cx-26, footY-4, 14, 9) + E(cx+26, footY-4, 14, 9);
    out += C(cx, headCY, headR);
    out += C(cx-16, headCY-4, 8, 2.5) + C(cx+16, headCY-4, 8, 2.5);
    out += DOT(cx-14, headCY-2, 3.2) + DOT(cx+18, headCY-2, 3.2);
    out += P(`M ${cx-5} ${headCY+12} L ${cx+5} ${headCY+12} L ${cx} ${headCY+19} Z`, 2.5);
    out += LINE(`M ${cx} ${headCY+19} L ${cx} ${headCY+26} M ${cx-8} ${headCY+30} Q ${cx} ${headCY+36} ${cx+8} ${headCY+30}`, 2.5);
    out += LINE(`M ${cx-22} ${headCY+16} L ${cx-46} ${headCY+12} M ${cx-22} ${headCY+22} L ${cx-46} ${headCY+26} M ${cx+22} ${headCY+16} L ${cx+46} ${headCY+12} M ${cx+22} ${headCY+22} L ${cx+46} ${headCY+26}`, 2);
    out += DOT(cx-8, headCY+8, 1.6) + DOT(cx+8, headCY+8, 1.6);
    return out;
  }

  function duckPond(r) {
    let out = '';
    // pond
    out += E(250, 400, 190, 52);
    out += LINE(`M 120 396 Q 150 388 180 396 M 300 412 Q 330 404 360 412`, 2.5);
    // duck body
    out += P(`M 190 384 Q 186 344 226 340 Q 240 338 246 350 Q 252 336 264 330 Q 258 344 262 352 Q 306 350 312 378 Q 314 396 286 398 Q 226 402 190 384 Z`);
    // head
    out += C(232, 312, 26);
    out += P(`M 254 312 L 286 306 L 256 322 Z`, 2.5);   // beak
    out += C(226, 306, 5.5, 2) + DOT(228, 307, 2.4);
    out += P(`M 216 372 Q 236 358 256 372 Q 240 382 216 372 Z`, 2.5); // wing
    // ducklings
    for (let i = 0; i < irange(r, 1, 2); i++) {
      const dx = 320 + i * 56;
      out += C(dx, 388, 14, 2.5);
      out += C(dx+10, 374, 9, 2.5);
      out += P(`M ${dx+18} 374 L ${dx+28} 372 L ${dx+18} 378 Z`, 2);
      out += DOT(dx+8, 371, 1.8);
    }
    // reeds
    out += LINE(`M 90 392 L 84 330 M 102 396 L 100 322`, 3);
    out += E(84, 322, 6, 16, 0, 2.5) + E(100, 314, 6, 16, 0, 2.5);
    return out;
  }

  function bird(r, cx, footY, big) {
    const s = big ? 1.25 : 1;
    let out = '';
    const bodyCY = footY - 70 * s;
    // branch
    out += LINE(`M ${cx-130*s} ${footY-8} Q ${cx} ${footY-24*s} ${cx+130*s} ${footY-4}`, 6);
    out += LINE(`M ${cx+60*s} ${footY-14} Q ${cx+86*s} ${footY-34*s} ${cx+104*s} ${footY-30*s}`, 4);
    // leaves on branch
    out += E(cx-90*s, footY-26*s, 14*s, 7*s, -24, 2.5) + E(cx+96*s, footY-40*s, 13*s, 7*s, 20, 2.5);
    // tail
    out += P(`M ${cx-34*s} ${bodyCY+6*s} L ${cx-96*s} ${bodyCY+30*s} L ${cx-40*s} ${bodyCY+34*s} Z`);
    // body + head
    out += E(cx, bodyCY, 46*s, 40*s);
    out += C(cx+26*s, bodyCY-44*s, 27*s);
    out += P(`M ${cx+48*s} ${bodyCY-48*s} L ${cx+78*s} ${bodyCY-42*s} L ${cx+48*s} ${bodyCY-34*s} Z`, 2.5);
    out += C(cx+20*s, bodyCY-50*s, 6*s, 2) + DOT(cx+22*s, bodyCY-49*s, 2.6*s);
    // wing
    out += P(`M ${cx-18*s} ${bodyCY-14*s} Q ${cx+30*s} ${bodyCY-24*s} ${cx+26*s} ${bodyCY+18*s} Q ${cx-4*s} ${bodyCY+22*s} ${cx-18*s} ${bodyCY-14*s} Z`);
    out += LINE(`M ${cx-8*s} ${bodyCY} Q ${cx+12*s} ${bodyCY-6*s} ${cx+18*s} ${bodyCY+8*s}`, 2);
    // chest feathers
    out += LINE(`M ${cx-26*s} ${bodyCY+18*s} Q ${cx-20*s} ${bodyCY+24*s} ${cx-14*s} ${bodyCY+18*s} M ${cx-10*s} ${bodyCY+26*s} Q ${cx-4*s} ${bodyCY+32*s} ${cx+2*s} ${bodyCY+26*s}`, 2);
    // legs
    out += LINE(`M ${cx-6*s} ${bodyCY+38*s} L ${cx-8*s} ${footY-16*s} M ${cx+10*s} ${bodyCY+38*s} L ${cx+12*s} ${footY-14*s}`, 3);
    return out;
  }

  function butterflyBig(r, cx, cy) {
    let out = '';
    // wings (upper pair + lower pair)
    out += P(`M ${cx-6} ${cy-10} Q ${cx-150} ${cy-140} ${cx-130} ${cy-30} Q ${cx-124} ${cy+6} ${cx-6} ${cy+4} Z`);
    out += P(`M ${cx+6} ${cy-10} Q ${cx+150} ${cy-140} ${cx+130} ${cy-30} Q ${cx+124} ${cy+6} ${cx+6} ${cy+4} Z`);
    out += P(`M ${cx-6} ${cy+8} Q ${cx-120} ${cy+120} ${cx-56} ${cy+108} Q ${cx-16} ${cy+96} ${cx-4} ${cy+16} Z`);
    out += P(`M ${cx+6} ${cy+8} Q ${cx+120} ${cy+120} ${cx+56} ${cy+108} Q ${cx+16} ${cy+96} ${cx+4} ${cy+16} Z`);
    // wing patterns
    out += C(cx-84, cy-56, irange(r, 12, 18), 2.5) + C(cx+84, cy-56, irange(r, 12, 18), 2.5);
    out += C(cx-56, cy+64, 11, 2.5) + C(cx+56, cy+64, 11, 2.5);
    out += E(cx-100, cy-16, 12, 7, -16, 2) + E(cx+100, cy-16, 12, 7, 16, 2);
    // body + head + antennae
    out += E(cx, cy+18, 12, 46);
    out += C(cx, cy-36, 14);
    out += DOT(cx-5, cy-38, 2.4) + DOT(cx+5, cy-38, 2.4);
    out += LINE(`M ${cx} ${cy-30} Q ${cx-3} ${cy-26} ${cx+3} ${cy-24}`, 2);
    out += LINE(`M ${cx-5} ${cy-48} Q ${cx-18} ${cy-70} ${cx-30} ${cy-72} M ${cx+5} ${cy-48} Q ${cx+18} ${cy-70} ${cx+30} ${cy-72}`, 2.5);
    out += C(cx-32, cy-73, 4, 2) + C(cx+32, cy-73, 4, 2);
    out += LINE(`M ${cx-4} ${cy-8} L ${cx-4} ${cy+50} M ${cx+4} ${cy-8} L ${cx+4} ${cy+50}`, 1.5);
    return out;
  }

  function tortoiseBeach(r) {
    let out = '';
    const cx = 240, footY = 404;
    // shell
    out += P(`M ${cx-110} ${footY-40} Q ${cx} ${footY-160} ${cx+110} ${footY-40} Q ${cx} ${footY-4} ${cx-110} ${footY-40} Z`);
    // shell plates
    out += P(`M ${cx-40} ${footY-118} L ${cx+2} ${footY-124} L ${cx+40} ${footY-112} L ${cx+30} ${footY-70} L ${cx-30} ${footY-70} Z`, 2.5);
    out += LINE(`M ${cx-40} ${footY-118} L ${cx-72} ${footY-84} M ${cx+40} ${footY-112} L ${cx+74} ${footY-80} M ${cx-30} ${footY-70} L ${cx-40} ${footY-42} M ${cx+30} ${footY-70} L ${cx+42} ${footY-42}`, 2.5);
    // head + legs + tail
    out += C(cx+136, footY-70, 30);
    out += C(cx+128, footY-80, 6, 2) + DOT(cx+130, footY-79, 2.6);
    out += LINE(`M ${cx+126} ${footY-58} Q ${cx+136} ${footY-52} ${cx+146} ${footY-58}`, 2.5);
    out += E(cx-84, footY-16, 24, 14) + E(cx+70, footY-16, 24, 14);
    out += LINE(`M ${cx-150} ${footY-36} L ${cx-170} ${footY-28}`, 4);
    return out;
  }

  function peacock(r) {
    let out = '';
    const cx = 250, cy = 300;
    // tail fan of feathers with "eyes"
    const feathers = irange(r, 6, 8);
    for (let i = 0; i < feathers; i++) {
      const a = Math.PI * (0.14 + 0.72 * i / (feathers - 1)) + Math.PI; // fan up
      const fx = cx + Math.cos(a) * 190, fy = cy + Math.sin(a) * 190;
      out += P(`M ${cx} ${cy} Q ${(cx+fx)/2 + 42*Math.cos(a+Math.PI/2)} ${(cy+fy)/2 + 42*Math.sin(a+Math.PI/2)} ${fx} ${fy} Q ${(cx+fx)/2 - 42*Math.cos(a+Math.PI/2)} ${(cy+fy)/2 - 42*Math.sin(a+Math.PI/2)} ${cx} ${cy} Z`, 2.5);
      out += C(cx + Math.cos(a) * 150, cy + Math.sin(a) * 150, 13, 2.5);
      out += C(cx + Math.cos(a) * 150, cy + Math.sin(a) * 150, 5.5, 2);
    }
    // body
    out += E(cx, cy + 42, 46, 62);
    // neck + head
    out += P(`M ${cx-14} ${cy+6} Q ${cx-20} ${cy-64} ${cx+2} ${cy-88} Q ${cx+20} ${cy-64} ${cx+14} ${cy+6} Z`);
    out += C(cx+2, cy-96, 20);
    out += P(`M ${cx+18} ${cy-100} L ${cx+40} ${cy-94} L ${cx+18} ${cy-88} Z`, 2.5);
    out += C(cx-3, cy-100, 4.5, 2) + DOT(cx-2, cy-99, 2);
    // crest
    out += LINE(`M ${cx-4} ${cy-114} L ${cx-10} ${cy-132} M ${cx+2} ${cy-116} L ${cx+2} ${cy-136} M ${cx+8} ${cy-114} L ${cx+14} ${cy-132}`, 2.5);
    out += C(cx-10, cy-136, 4, 2) + C(cx+2, cy-140, 4, 2) + C(cx+14, cy-136, 4, 2);
    // legs
    out += LINE(`M ${cx-10} ${cy+100} L ${cx-12} ${cy+140} M ${cx+12} ${cy+100} L ${cx+14} ${cy+140}`, 3.5);
    return out;
  }

  function fishTank(r) {
    let out = '';
    // waves top
    out += LINE(`M 0 96 Q 42 80 84 96 Q 126 112 168 96 Q 210 80 252 96 Q 294 112 336 96 Q 378 80 420 96 Q 462 112 500 96`, 3.5);
    // big fish
    const fx = 210, fy = 240;
    out += P(`M ${fx-100} ${fy} Q ${fx} ${fy-76} ${fx+96} ${fy} Q ${fx} ${fy+76} ${fx-100} ${fy} Z`);
    out += P(`M ${fx+90} ${fy} L ${fx+150} ${fy-48} L ${fx+150} ${fy+48} Z`);
    out += C(fx-56, fy-14, 11, 2.5) + DOT(fx-53, fy-12, 4);
    out += LINE(`M ${fx-84} ${fy+16} Q ${fx-72} ${fy+24} ${fx-62} ${fy+16}`, 2.5);
    for (let i = 0; i < 4; i++) out += LINE(`M ${fx-24+i*24} ${fy-32} Q ${fx-6+i*24} ${fy} ${fx-24+i*24} ${fy+32}`, 2);
    out += P(`M ${fx-6} ${fy-58} Q ${fx+22} ${fy-92} ${fx+44} ${fy-58} Z`, 2.5); // top fin
    // small fish (opposite direction)
    const gx = 350, gy = 356;
    out += P(`M ${gx+56} ${gy} Q ${gx} ${gy-40} ${gx-52} ${gy} Q ${gx} ${gy+40} ${gx+56} ${gy} Z`);
    out += P(`M ${gx-48} ${gy} L ${gx-84} ${gy-28} L ${gx-84} ${gy+28} Z`);
    out += C(gx+30, gy-8, 6, 2) + DOT(gx+32, gy-7, 2.4);
    // bubbles + seaweed + floor
    for (let i = 0; i < irange(r, 3, 5); i++) out += C(irange(r, 60, 440), irange(r, 120, 210), irange(r, 5, 12), 2);
    out += P(`M 0 452 Q 250 428 500 452 L 500 500 L 0 500 Z`);
    out += LINE(`M 70 452 Q 56 410 72 372 Q 84 340 70 314 M 96 452 Q 108 412 92 376`, 3.5);
    out += LINE(`M 430 452 Q 444 408 428 370 M 452 452 Q 462 420 450 390`, 3.5);
    out += C(160, 446, 9, 2.5) + C(300, 450, 7, 2.5); // pebbles
    return out;
  }

  function rocketScene(r) {
    let out = '';
    const cx = 250;
    for (let i = 0; i < irange(r, 5, 7); i++) out += starP(irange(r, 30, 470), irange(r, 30, 200), irange(r, 8, 14));
    // small planet
    out += C(70 + irange(r, 0, 30), 330 + irange(r, -20, 20), 34);
    out += C(60 + irange(r, 0, 30), 322, 8, 2) ;
    // rocket
    out += P(`M ${cx} 60 Q ${cx+58} 160 ${cx+58} 288 L ${cx-58} 288 Q ${cx-58} 160 ${cx} 60 Z`);
    out += C(cx, 190, 32);
    out += C(cx, 190, 22, 2.5);
    out += LINE(`M ${cx-42} 250 L ${cx+42} 250`, 2.5);
    out += P(`M ${cx-58} 246 Q ${cx-120} 300 ${cx-108} 344 L ${cx-56} 310 Z`);
    out += P(`M ${cx+58} 246 Q ${cx+120} 300 ${cx+108} 344 L ${cx+56} 310 Z`);
    out += P(`M ${cx-36} 288 L ${cx+36} 288 L ${cx+24} 330 L ${cx-24} 330 Z`);
    // flames
    out += P(`M ${cx-24} 330 Q ${cx} 344 ${cx+24} 330 Q ${cx+20} 396 ${cx} 424 Q ${cx-20} 396 ${cx-24} 330 Z`);
    out += P(`M ${cx-10} 336 Q ${cx} 344 ${cx+10} 336 Q ${cx+6} 372 ${cx} 388 Q ${cx-6} 372 ${cx-10} 336 Z`, 2.5);
    // moon ground
    out += P(`M 0 448 Q 250 420 500 448 L 500 500 L 0 500 Z`);
    out += E(120, 462, 22, 9, 0, 2.5) + E(340, 470, 26, 10, 0, 2.5);
    return out;
  }

  function planetScene(r) {
    let out = '';
    const cx = 250, cy = 240;
    for (let i = 0; i < irange(r, 6, 9); i++) out += starP(irange(r, 30, 470), irange(r, 30, 460), irange(r, 7, 12));
    out += C(cx, cy, 108);
    const bands = irange(r, 2, 3);
    for (let i = 1; i <= bands; i++) {
      const yy = cy - 76 + (152 / (bands + 1)) * i;
      const half = Math.sqrt(Math.max(0, 108*108 - (yy-cy)*(yy-cy)));
      out += LINE(`M ${(cx-half).toFixed(0)} ${yy.toFixed(0)} Q ${cx} ${(yy+16).toFixed(0)} ${(cx+half).toFixed(0)} ${yy.toFixed(0)}`, 2.5);
    }
    out += C(cx-40, cy-40, 15, 2.5) + C(cx+34, cy+30, 11, 2.5); // craters
    out += E(cx, cy, 176, 44, -16);
    out += E(cx, cy, 150, 32, -16, 2);
    // tiny UFO
    const ux = irange(r, 350, 420), uy = irange(r, 380, 430);
    out += E(ux, uy, 40, 13);
    out += P(`M ${ux-20} ${uy-10} Q ${ux} ${uy-36} ${ux+20} ${uy-10} Z`, 2.5);
    out += DOT(ux-18, uy+1, 2.5) + DOT(ux, uy+3, 2.5) + DOT(ux+18, uy+1, 2.5);
    return out;
  }

  function houseScene(r) {
    let out = '';
    const cx = 250, gy = 400;
    // house
    out += P(`M ${cx-120} 250 L ${cx-120} ${gy} L ${cx+120} ${gy} L ${cx+120} 250 Z`);
    out += P(`M ${cx-142} 250 L ${cx} 140 L ${cx+142} 250 Z`);
    out += P(`M ${cx+62} 226 L ${cx+62} 168 L ${cx+92} 168 L ${cx+92} 254 Z`); // chimney
    out += P(`M ${cx-42} ${gy} L ${cx-42} 308 Q ${cx} 292 ${cx+42} 308 L ${cx+42} ${gy} Z`); // door
    out += C(cx+26, 356, 5, 2);
    // windows with cross bars
    for (const wx of [-92, 52]) {
      out += P(`M ${cx+wx} 276 L ${cx+wx+44} 276 L ${cx+wx+44} 320 L ${cx+wx} 320 Z`);
      out += LINE(`M ${cx+wx+22} 276 L ${cx+wx+22} 320 M ${cx+wx} 298 L ${cx+wx+44} 298`, 2);
      out += P(`M ${cx+wx-6} 320 L ${cx+wx+50} 320 L ${cx+wx+50} 330 L ${cx+wx-6} 330 Z`, 2.5); // sill
    }
    out += C(cx, 196, 20, 2.5); // attic window
    // smoke
    out += C(cx+92, 140, 12, 2.5) + C(cx+108, 118, 9, 2.5) + C(cx+120, 100, 6, 2);
    // fence
    for (let i = 0; i < 4; i++) {
      const fx = 24 + i * 26;
      out += P(`M ${fx} ${gy} L ${fx} ${gy-38} L ${fx+7} ${gy-46} L ${fx+14} ${gy-38} L ${fx+14} ${gy} Z`, 2.5);
    }
    out += LINE(`M 18 ${gy-26} L 130 ${gy-26}`, 2.5);
    // path
    out += P(`M ${cx-30} ${gy} Q ${cx-60} 452 ${cx-110} 486 L ${cx+70} 486 Q ${cx+40} 448 ${cx+30} ${gy} Z`);
    out += LINE(`M ${cx-36} 436 L ${cx+30} 436 M ${cx-60} 462 L ${cx+44} 462`, 2);
    return out;
  }

  function carScene(r) {
    let out = '';
    const cx = 250, cy = 300;
    // road
    out += P(`M 0 ${cy+92} L 500 ${cy+92} L 500 ${cy+130} L 0 ${cy+130} Z`);
    out += LINE(`M 20 ${cy+111} L 60 ${cy+111} M 100 ${cy+111} L 140 ${cy+111} M 180 ${cy+111} L 220 ${cy+111} M 260 ${cy+111} L 300 ${cy+111} M 340 ${cy+111} L 380 ${cy+111} M 420 ${cy+111} L 460 ${cy+111}`, 3);
    // car body
    out += P(`M ${cx-170} ${cy+40} Q ${cx-176} ${cy+6} ${cx-140} ${cy-2} L ${cx-116} ${cy-8} Q ${cx-92} ${cy-64} ${cx-30} ${cy-66} L ${cx+38} ${cy-66} Q ${cx+92} ${cy-62} ${cx+112} ${cy-8} L ${cx+146} ${cy} Q ${cx+176} ${cy+8} ${cx+170} ${cy+40} Q ${cx+150} ${cy+52} ${cx+130} ${cy+44} L ${cx-130} ${cy+44} Q ${cx-150} ${cy+52} ${cx-170} ${cy+40} Z`);
    // windows
    out += P(`M ${cx-88} ${cy-12} Q ${cx-72} ${cy-52} ${cx-24} ${cy-54} L ${cx-24} ${cy-12} Z`);
    out += P(`M ${cx-10} ${cy-54} L ${cx+34} ${cy-54} Q ${cx+78} ${cy-50} ${cx+94} ${cy-12} L ${cx-10} ${cy-12} Z`);
    // driver kid in window
    out += C(cx+36, cy-32, 15, 2.5);
    out += DOT(cx+31, cy-35, 2) + DOT(cx+41, cy-35, 2);
    out += LINE(`M ${cx+31} ${cy-26} Q ${cx+36} ${cy-22} ${cx+41} ${cy-26}`, 2);
    // wheels
    for (const wx of [-100, 100]) {
      out += C(cx+wx, cy+52, 40);
      out += C(cx+wx, cy+52, 18, 2.5);
      out += LINE(`M ${cx+wx-12} ${cy+40} L ${cx+wx+12} ${cy+64} M ${cx+wx+12} ${cy+40} L ${cx+wx-12} ${cy+64}`, 2);
    }
    // lights + door line
    out += C(cx+160, cy+16, 9, 2.5);
    out += LINE(`M ${cx-16} ${cy-8} L ${cx-16} ${cy+40} M ${cx-16} ${cy+18} L ${cx-34} ${cy+18}`, 2.5);
    return out;
  }

  function balloonScene(r) {
    let out = '';
    const cx = 250, cy = 180;
    out += P(`M ${cx} ${cy-120} Q ${cx+110} ${cy-96} ${cx+104} ${cy+8} Q ${cx+98} ${cy+78} ${cx+30} ${cy+112} L ${cx-30} ${cy+112} Q ${cx-98} ${cy+78} ${cx-104} ${cy+8} Q ${cx-110} ${cy-96} ${cx} ${cy-120} Z`);
    // gores
    out += LINE(`M ${cx} ${cy-120} Q ${cx-42} ${cy-20} ${cx-16} ${cy+110} M ${cx} ${cy-120} Q ${cx+42} ${cy-20} ${cx+16} ${cy+110}`, 2.5);
    out += E(cx, cy-24, 104, 26, 0, 2.5).replace('class="cs-region"',''); // band (decor only? keep fillable) — keep region:
    out += E(cx, cy-24, 104, 26, 0, 2.5);
    // ropes + basket
    out += LINE(`M ${cx-28} ${cy+112} L ${cx-20} ${cy+168} M ${cx+28} ${cy+112} L ${cx+20} ${cy+168}`, 2.5);
    out += P(`M ${cx-34} ${cy+168} L ${cx+34} ${cy+168} L ${cx+28} ${cy+214} L ${cx-28} ${cy+214} Z`);
    out += LINE(`M ${cx-30} ${cy+184} L ${cx+30} ${cy+184} M ${cx-29} ${cy+199} L ${cx+29} ${cy+199} M ${cx-14} ${cy+168} L ${cx-13} ${cy+214} M ${cx+14} ${cy+168} L ${cx+13} ${cy+214}`, 2);
    // waving kid in basket
    out += C(cx-6, cy+156, 13, 2.5);
    out += DOT(cx-10, cy+153, 2) + DOT(cx-2, cy+153, 2);
    out += LINE(`M ${cx-10} ${cy+161} Q ${cx-6} ${cy+164} ${cx-2} ${cy+161}`, 2);
    out += LINE(`M ${cx+4} ${cy+164} Q ${cx+18} ${cy+152} ${cx+22} ${cy+140}`, 3);
    out += C(cx+24, cy+138, 5, 2);
    return out;
  }

  function giftScene(r) {
    let out = '';
    const cx = 250, gy = 420;
    // big gift
    out += P(`M ${cx-96} ${gy} L ${cx-96} ${gy-130} L ${cx+96} ${gy-130} L ${cx+96} ${gy} Z`);
    out += P(`M ${cx-106} ${gy-130} L ${cx+106} ${gy-130} L ${cx+106} ${gy-158} L ${cx-106} ${gy-158} Z`);
    out += P(`M ${cx-14} ${gy} L ${cx-14} ${gy-158} L ${cx+14} ${gy-158} L ${cx+14} ${gy} Z`);
    // bow
    out += P(`M ${cx} ${gy-158} Q ${cx-58} ${gy-206} ${cx-40} ${gy-166} Z`);
    out += P(`M ${cx} ${gy-158} Q ${cx+58} ${gy-206} ${cx+40} ${gy-166} Z`);
    out += C(cx, gy-162, 9);
    // balloons
    for (let i = 0; i < irange(r, 2, 3); i++) {
      const bx = [120, 380, 320][i] + irange(r, -16, 16), by = 140 + irange(r, -30, 30);
      out += E(bx, by, 30, 38);
      out += P(`M ${bx-6} ${by+38} L ${bx+6} ${by+38} L ${bx} ${by+46} Z`, 2);
      out += LINE(`M ${bx} ${by+46} Q ${bx+10} ${by+90} ${bx-6} ${by+130}`, 2);
    }
    // confetti + bunting
    out += LINE(`M 20 60 Q 250 130 480 60`, 2.5);
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.5) / 6, bx = 20 + t * 460, by = 60 + Math.sin(Math.PI * t) * 68 - 4;
      out += P(`M ${bx-13} ${by.toFixed(0)} L ${bx+13} ${by.toFixed(0)} L ${bx} ${(by+26).toFixed(0)} Z`, 2.5);
    }
    for (let i = 0; i < irange(r, 4, 7); i++) out += C(irange(r, 40, 460), irange(r, 200, 330), irange(r, 4, 7), 2);
    return out;
  }

  function fireworks(r) {
    let out = '';
    // city line
    out += P(`M 0 440 L 60 440 L 60 400 L 110 400 L 110 428 L 170 428 L 170 392 L 230 392 L 230 436 L 300 436 L 300 404 L 360 404 L 360 428 L 420 428 L 420 412 L 500 412 L 500 500 L 0 500 Z`);
    for (const [wx, wy] of [[80, 414], [200, 406], [330, 416], [440, 424]]) out += P(`M ${wx} ${wy} h 12 v 12 h -12 Z`, 2);
    // bursts
    const bursts = irange(r, 2, 3);
    for (let b = 0; b < bursts; b++) {
      const bx = 100 + b * (300 / Math.max(1, bursts - 1)) + irange(r, -30, 30);
      const by = 120 + irange(r, -50, 60);
      const rays = irange(r, 8, 12);
      for (let i = 0; i < rays; i++) {
        const a = (Math.PI * 2 / rays) * i;
        out += LINE(`M ${(bx + Math.cos(a)*18).toFixed(0)} ${(by + Math.sin(a)*18).toFixed(0)} L ${(bx + Math.cos(a)*58).toFixed(0)} ${(by + Math.sin(a)*58).toFixed(0)}`, 3);
        out += C(bx + Math.cos(a) * 70, by + Math.sin(a) * 70, 6, 2);
      }
      out += C(bx, by, 12, 2.5);
    }
    for (let i = 0; i < irange(r, 3, 5); i++) out += starP(irange(r, 30, 470), irange(r, 40, 300), irange(r, 7, 11));
    return out;
  }

  function lanternNight(r) {
    let out = '';
    const cx = 250;
    // big lantern
    out += P(`M ${cx-16} 84 L ${cx+16} 84 L ${cx+16} 110 L ${cx-16} 110 Z`);
    out += E(cx, 240, 96, 128);
    for (let i = 1; i <= 3; i++) {
      const xx = cx - 96 + (192 / 4) * i;
      out += LINE(`M ${xx.toFixed(0)} 128 Q ${cx} 240 ${xx.toFixed(0)} 352`, 2.5);
    }
    out += E(cx, 240, 34, 44, 0, 2.5); // glow panel
    out += P(`M ${cx-64} 362 L ${cx+64} 362 L ${cx+64} 388 L ${cx-64} 388 Z`);
    for (let i = 0; i < 5; i++) out += LINE(`M ${cx-44+i*22} 388 L ${cx-44+i*22} ${426 + (i%2)*10}`, 2.5);
    // small lanterns
    for (const [lx, ly, s] of [[92, 180, 0.5], [408, 210, 0.55], [130, 350, 0.42], [390, 380, 0.4]]) {
      out += E(lx, ly, 40*s, 55*s);
      out += P(`M ${lx-10*s} ${ly-55*s-14*s} h ${20*s} v ${14*s} h ${-20*s} Z`, 2);
      out += LINE(`M ${lx} ${ly+55*s} L ${lx} ${ly+55*s+16*s}`, 2);
    }
    out += moonStars(r);
    return out;
  }

  function decoratedTree(r) {
    let out = '';
    const cx = 250, gy = 430;
    out += P(`M ${cx-16} ${gy} L ${cx-12} ${gy-34} L ${cx+12} ${gy-34} L ${cx+16} ${gy} Z`);
    // three tiers
    out += P(`M ${cx} 96 L ${cx+74} 200 L ${cx-74} 200 Z`);
    out += P(`M ${cx} 150 L ${cx+104} 288 L ${cx-104} 288 Z`);
    out += P(`M ${cx} 216 L ${cx+134} ${gy-34} L ${cx-134} ${gy-34} Z`);
    out += starP(cx, 74, 22);
    // ornaments
    for (let i = 0; i < irange(r, 6, 9); i++) {
      const t = r();
      const ty = 140 + t * 240;
      const half = 20 + t * 100;
      out += C(cx - half + r() * half * 2, ty, irange(r, 7, 11), 2.5);
    }
    // garland
    out += LINE(`M ${cx-52} 190 Q ${cx} 216 ${cx+52} 190 M ${cx-84} 270 Q ${cx} 300 ${cx+84} 270`, 2.5);
    // gifts under tree
    out += P(`M ${cx-110} ${gy} L ${cx-110} ${gy-44} L ${cx-54} ${gy-44} L ${cx-54} ${gy} Z`);
    out += LINE(`M ${cx-82} ${gy} L ${cx-82} ${gy-44}`, 2.5);
    out += P(`M ${cx+58} ${gy} L ${cx+58} ${gy-36} L ${cx+108} ${gy-36} L ${cx+108} ${gy} Z`);
    out += LINE(`M ${cx+83} ${gy} L ${cx+83} ${gy-36}`, 2.5);
    return out;
  }

  function bigTreeSwing(r) {
    let out = '';
    const cx = 250, gy = 400;
    // trunk with root flare
    out += P(`M ${cx-34} ${gy} Q ${cx-28} ${gy-60} ${cx-22} ${gy-130} L ${cx+22} ${gy-130} Q ${cx+28} ${gy-60} ${cx+34} ${gy} Q ${cx+52} ${gy} ${cx+58} ${gy+6} L ${cx-58} ${gy+6} Q ${cx-52} ${gy} ${cx-34} ${gy} Z`);
    out += LINE(`M ${cx-8} ${gy-40} Q ${cx} ${gy-70} ${cx-4} ${gy-100}`, 2);
    // canopy blobs
    out += P(`M ${cx-150} ${gy-160}
      a 44 44 0 0 1 30 -58 a 52 52 0 0 1 58 -26 a 48 48 0 0 1 62 -6 a 46 46 0 0 1 58 18 a 44 44 0 0 1 36 48 a 40 40 0 0 1 -10 54 a 44 44 0 0 1 -52 28 a 56 56 0 0 1 -66 6 a 52 52 0 0 1 -62 -14 a 42 42 0 0 1 -54 -50 Z`);
    // apples in canopy
    for (let i = 0; i < irange(r, 4, 6); i++)
      out += C(cx - 110 + r() * 220, gy - 260 + r() * 90, 10, 2.5);
    // swing
    out += LINE(`M ${cx-98} ${gy-176} L ${cx-98} ${gy-58} M ${cx-56} ${gy-176} L ${cx-56} ${gy-58}`, 3);
    out += P(`M ${cx-108} ${gy-58} L ${cx-46} ${gy-58} L ${cx-46} ${gy-46} L ${cx-108} ${gy-46} Z`);
    return out;
  }

  function mushroomHouse(r) {
    let out = '';
    const cx = 250, gy = 420;
    // cap
    out += P(`M ${cx-140} 236 Q ${cx} 84 ${cx+140} 236 Q ${cx} 268 ${cx-140} 236 Z`);
    for (let i = 0; i < irange(r, 4, 6); i++)
      out += C(cx - 100 + r() * 200, 150 + r() * 70, irange(r, 10, 20), 2.5);
    // stem-house
    out += P(`M ${cx-72} ${gy} L ${cx-64} 248 L ${cx+64} 248 L ${cx+72} ${gy} Z`);
    // door + window
    out += P(`M ${cx-24} ${gy} L ${cx-24} 330 Q ${cx} 308 ${cx+24} 330 L ${cx+24} ${gy} Z`);
    out += DOT(cx+14, 372, 3.5);
    out += C(cx-40, 290, 15, 2.5);
    out += LINE(`M ${cx-52} 290 L ${cx-28} 290 M ${cx-40} 278 L ${cx-40} 302`, 2);
    // chimney puffing on cap
    out += P(`M ${cx+66} 160 L ${cx+66} 120 L ${cx+90} 120 L ${cx+90} 176 Z`);
    out += C(cx+96, 104, 9, 2.5) + C(cx+108, 88, 6, 2);
    return out;
  }

  function mandala(r) {
    let out = '';
    const rings = irange(r, 3, 4);
    for (let ring = rings; ring >= 1; ring--) {
      const rad = 44 + ring * (196 / rings);
      const k = [8, 10, 12][irange(r, 0, 2)];
      const petal = r() > 0.5;
      for (let i = 0; i < k; i++) {
        const ang = (360 / k) * i;
        if (petal)
          out += `<path class="cs-region" transform="rotate(${ang} 250 250)" d="M 250 ${250 - rad + 26} Q ${250 - 20} ${250 - rad} 250 ${250 - rad - 26} Q ${250 + 20} ${250 - rad} 250 ${250 - rad + 26} Z" fill="#ffffff" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/>`;
        else
          out += `<circle class="cs-region" transform="rotate(${ang} 250 250)" cx="250" cy="${250 - rad}" r="${14 + r() * 10}" fill="#ffffff" stroke="#1e293b" stroke-width="2.5"/>`;
      }
    }
    out += C(250, 250, 40) + C(250, 250, 18, 2.5);
    return out;
  }

  /* Faces with hair + emotion + weather (Emotions category) */
  function emotionKid(r, seed) {
    const moods = ['happy', 'sad', 'surprised', 'calm', 'angry', 'silly'];
    const mood = moods[seed % moods.length];
    let out = '';
    const cx = 250, cy = 270, R = 120;
    // weather matches feeling
    if (mood === 'happy' || mood === 'silly') out += sunCorner(r);
    else if (mood === 'sad') { out += cloud(96, 80, 1.1); out += LINE('M 70 118 L 64 140 M 96 122 L 90 144 M 122 118 L 116 140', 3); }
    else if (mood === 'angry') { out += cloud(96, 74, 1.1); out += P('M 76 108 L 96 108 L 84 130 L 98 130 L 70 162 L 80 136 L 66 136 Z', 2.5); }
    else if (mood === 'surprised') { for (let i = 0; i < 4; i++) out += starP(irange(r, 60, 160), irange(r, 40, 150), irange(r, 8, 13)); }
    else out += moonStars(r);
    // shoulders
    out += P(`M ${cx-130} 500 Q ${cx-120} 402 ${cx-60} 388 L ${cx+60} 388 Q ${cx+120} 402 ${cx+130} 500 Z`);
    out += LINE(`M ${cx-30} 402 L ${cx-16} 428 L ${cx} 408 L ${cx+16} 428 L ${cx+30} 402`, 2.5); // collar
    // head
    out += C(cx, cy, R);
    // hair varies by seed
    const hv = (seed >> 2) % 3;
    if (hv === 0) out += P(`M ${cx-R} ${cy-14} Q ${cx-R} ${cy-R-32} ${cx+10} ${cy-R-26} Q ${cx+R} ${cy-R-16} ${cx+R-4} ${cy-10} Q ${cx+R*0.55} ${cy-R*0.72} ${cx} ${cy-R*0.7} Q ${cx-R*0.6} ${cy-R*0.68} ${cx-R} ${cy-14} Z`);
    else if (hv === 1) {
      out += P(`M ${cx-R} ${cy} Q ${cx-R-10} ${cy-R-20} ${cx} ${cy-R-24} Q ${cx+R+10} ${cy-R-20} ${cx+R} ${cy} Q ${cx+R*0.7} ${cy-R*0.6} ${cx+R*0.2} ${cy-R*0.74} Q ${cx-R*0.5} ${cy-R*0.8} ${cx-R} ${cy} Z`);
      out += E(cx-R-14, cy+40, 20, 44, 12) + E(cx+R+14, cy+40, 20, 44, -12); // long side hair
    } else {
      out += P(`M ${cx-R+6} ${cy-20} Q ${cx-R+4} ${cy-R-26} ${cx} ${cy-R-20} Q ${cx+R-4} ${cy-R-26} ${cx+R-6} ${cy-20} Q ${cx+R*0.6} ${cy-R*0.8} ${cx+R*0.2} ${cy-R*0.66} Q ${cx-R*0.3} ${cy-R*0.86} ${cx-R+6} ${cy-20} Z`);
      for (let i = 0; i < 3; i++) out += LINE(`M ${cx-30+i*30} ${cy-R-14+((i%2)*6)} L ${cx-30+i*30} ${cy-R-34}`, 3); // spikes
    }
    // face by mood
    const ey = cy - 6;
    if (mood === 'surprised') {
      out += C(cx-44, ey, 20, 3) + C(cx+44, ey, 20, 3);
      out += DOT(cx-42, ey+2, 7) + DOT(cx+46, ey+2, 7);
      out += E(cx, cy+62, 22, 30);
      out += LINE(`M ${cx-70} ${ey-34} Q ${cx-44} ${ey-46} ${cx-18} ${ey-34} M ${cx+18} ${ey-34} Q ${cx+44} ${ey-46} ${cx+70} ${ey-34}`, 3);
    } else if (mood === 'sad') {
      out += C(cx-44, ey, 15, 3) + C(cx+44, ey, 15, 3);
      out += DOT(cx-42, ey+3, 5.5) + DOT(cx+46, ey+3, 5.5);
      out += LINE(`M ${cx-64} ${ey-26} L ${cx-24} ${ey-36} M ${cx+24} ${ey-36} L ${cx+64} ${ey-26}`, 3);
      out += LINE(`M ${cx-36} ${cy+70} Q ${cx} ${cy+44} ${cx+36} ${cy+70}`, 4);
      out += P(`M ${cx+66} ${ey+22} Q ${cx+78} ${ey+42} ${cx+66} ${ey+50} Q ${cx+54} ${ey+42} ${cx+66} ${ey+22} Z`, 2.5); // tear
    } else if (mood === 'angry') {
      out += C(cx-44, ey, 14, 3) + C(cx+44, ey, 14, 3);
      out += DOT(cx-42, ey+2, 5) + DOT(cx+46, ey+2, 5);
      out += LINE(`M ${cx-66} ${ey-38} L ${cx-22} ${ey-22} M ${cx+22} ${ey-22} L ${cx+66} ${ey-38}`, 4);
      out += LINE(`M ${cx-34} ${cy+66} L ${cx+34} ${cy+66}`, 4);
    } else if (mood === 'calm') {
      out += LINE(`M ${cx-58} ${ey} Q ${cx-44} ${ey+10} ${cx-30} ${ey} M ${cx+30} ${ey} Q ${cx+44} ${ey+10} ${cx+58} ${ey}`, 3.5);
      out += LINE(`M ${cx-24} ${cy+58} Q ${cx} ${cy+72} ${cx+24} ${cy+58}`, 3.5);
    } else { // happy / silly
      out += C(cx-44, ey, 15, 3) + C(cx+44, ey, 15, 3);
      out += DOT(cx-42, ey+2, 5.5) + DOT(cx+46, ey+2, 5.5);
      out += LINE(`M ${cx-66} ${ey-30} Q ${cx-44} ${ey-42} ${cx-22} ${ey-30} M ${cx+22} ${ey-30} Q ${cx+44} ${ey-42} ${cx+66} ${ey-30}`, 3);
      if (mood === 'silly') { out += LINE(`M ${cx-40} ${cy+52} Q ${cx} ${cy+96} ${cx+40} ${cy+52}`, 4); out += P(`M ${cx-6} ${cy+74} Q ${cx} ${cy+96} ${cx+14} ${cy+82} Q ${cx+4} ${cy+80} ${cx-6} ${cy+74} Z`, 2.5); }
      else out += P(`M ${cx-44} ${cy+52} Q ${cx} ${cy+100} ${cx+44} ${cy+52} Q ${cx} ${cy+68} ${cx-44} ${cy+52} Z`, 3);
    }
    out += C(cx-84, cy+34, 14, 2.5) + C(cx+84, cy+34, 14, 2.5); // blush
    return out;
  }

  /* Music subjects */
  function guitar(r) {
    let out = '';
    const cx = 250, cy = 300;
    out += P(`M ${cx-24} ${cy-190} L ${cx+24} ${cy-190} L ${cx+20} ${cy-128} L ${cx-20} ${cy-128} Z`); // headstock
    for (let i = 0; i < 3; i++) { out += C(cx-32, cy-180+i*18, 5, 2) + C(cx+32, cy-180+i*18, 5, 2); }
    out += P(`M ${cx-13} ${cy-130} L ${cx+13} ${cy-130} L ${cx+13} ${cy-24} L ${cx-13} ${cy-24} Z`); // neck
    for (let i = 0; i < 4; i++) out += LINE(`M ${cx-13} ${cy-112+i*22} L ${cx+13} ${cy-112+i*22}`, 2);
    // body (figure 8)
    out += P(`M ${cx} ${cy-28}
      C ${cx-72} ${cy-34} ${cx-88} ${cy+10} ${cx-64} ${cy+40}
      C ${cx-96} ${cy+64} ${cx-88} ${cy+134} ${cx} ${cy+138}
      C ${cx+88} ${cy+134} ${cx+96} ${cy+64} ${cx+64} ${cy+40}
      C ${cx+88} ${cy+10} ${cx+72} ${cy-34} ${cx} ${cy-28} Z`);
    out += C(cx, cy+42, 30);
    out += P(`M ${cx-26} ${cy+92} L ${cx+26} ${cy+92} L ${cx+26} ${cy+106} L ${cx-26} ${cy+106} Z`, 2.5);
    out += LINE(`M ${cx-8} ${cy-24} L ${cx-8} ${cy+92} M ${cx-2.5} ${cy-24} L ${cx-2.5} ${cy+92} M ${cx+3} ${cy-24} L ${cx+3} ${cy+92} M ${cx+8.5} ${cy-24} L ${cx+8.5} ${cy+92}`, 1.4);
    // floating notes
    for (let i = 0; i < irange(r, 2, 4); i++) {
      const nx = irange(r, 60, 440), ny = irange(r, 60, 170);
      out += E(nx, ny, 10, 8, -20, 2.5);
      out += LINE(`M ${nx+9} ${ny-3} L ${nx+9} ${ny-34} Q ${nx+20} ${ny-30} ${nx+24} ${ny-22}`, 2.5);
    }
    return out;
  }

  function drumScene(r) {
    let out = '';
    const cx = 250, cy = 290;
    out += E(cx, cy-64, 118, 38);
    out += P(`M ${cx-118} ${cy-64} L ${cx-104} ${cy+86} Q ${cx} ${cy+124} ${cx+104} ${cy+86} L ${cx+118} ${cy-64}`);
    const zig = 6;
    for (let i = 0; i < zig; i++) {
      const x1 = cx - 108 + (i * 216 / zig), x2 = x1 + 108 / zig;
      out += LINE(`M ${x1.toFixed(0)} ${cy-52} L ${x2.toFixed(0)} ${cy+34}`, 2.5);
      out += LINE(`M ${x2.toFixed(0)} ${cy+34} L ${(x1 + 216/zig).toFixed(0)} ${cy-52}`, 2.5);
      out += C(x1, cy-52, 5, 2) + C(x2, cy+34, 5, 2);
    }
    out += LINE(`M ${cx-104} ${cy+62} Q ${cx} ${cy+98} ${cx+104} ${cy+62}`, 3);
    // crossed sticks
    out += LINE(`M ${cx-60} ${cy-170} L ${cx-116} ${cy-92} M ${cx+60} ${cy-170} L ${cx+116} ${cy-92}`, 4);
    out += C(cx-60, cy-172, 12) + C(cx+60, cy-172, 12);
    // music notes
    for (let i = 0; i < irange(r, 2, 3); i++) {
      const nx = irange(r, 60, 440), ny = irange(r, 50, 130);
      out += E(nx, ny, 10, 8, -20, 2.5);
      out += LINE(`M ${nx+9} ${ny-3} L ${nx+9} ${ny-32}`, 2.5);
    }
    return out;
  }

  function xylophone(r) {
    let out = '';
    const cx = 250, cy = 300;
    const bars = 6;
    for (let i = 0; i < bars; i++) {
      const w = 190 - i * 22, y = cy - 110 + i * 42;
      out += P(`M ${cx-w} ${y} L ${cx+w} ${y} L ${cx+w-6} ${y+30} L ${cx-w+6} ${y+30} Z`);
      out += C(cx-w+22, y+15, 5, 2) + C(cx+w-22, y+15, 5, 2);
    }
    // mallets
    out += LINE(`M ${cx-160} ${cy-160} L ${cx-60} ${cy-190} M ${cx+160} ${cy-160} L ${cx+60} ${cy-190}`, 4);
    out += C(cx-166, cy-160, 13) + C(cx+166, cy-160, 13);
    for (let i = 0; i < irange(r, 2, 3); i++) {
      const nx = irange(r, 80, 420), ny = irange(r, 44, 110);
      out += E(nx, ny, 9, 7, -20, 2.5);
      out += LINE(`M ${nx+8} ${ny-2} L ${nx+8} ${ny-28}`, 2.5);
    }
    return out;
  }

  /* Letter / Number pages — glyph held by scene elements */
  function letterPage(r, seed) {
    const ch = String.fromCharCode(65 + (seed % 26));
    let out = '';
    // kite string from letter + bunting
    out += LINE(`M 16 46 Q 250 106 484 46`, 2.5);
    for (let i = 0; i < 7; i++) {
      const t = (i + 0.5) / 7, bx = 16 + t * 468, by = 46 + Math.sin(Math.PI * t) * 56;
      out += P(`M ${(bx-12).toFixed(0)} ${by.toFixed(0)} L ${(bx+12).toFixed(0)} ${by.toFixed(0)} L ${bx.toFixed(0)} ${(by+22).toFixed(0)} Z`, 2.5);
    }
    out += `<text x="250" y="330" text-anchor="middle" font-family="'Baloo 2',cursive" font-size="264" font-weight="800" class="cs-region" fill="#ffffff" stroke="#1e293b" stroke-width="5" paint-order="stroke">${ch}</text>`;
    // balloons tied to the letter
    for (const [bx, by] of [[86, 200], [418, 180]]) {
      out += E(bx, by, 26, 33);
      out += P(`M ${bx-5} ${by+33} L ${bx+5} ${by+33} L ${bx} ${by+40} Z`, 2);
      out += LINE(`M ${bx} ${by+40} Q ${bx+((bx<250)?40:-40)} ${by+110} ${250+((bx<250)?-70:70)} 330`, 2);
    }
    // grass + flowers footer
    out += P(`M 0 430 Q 250 406 500 430 L 500 500 L 0 500 Z`);
    out += miniFlower(90, 462, 1) + miniFlower(410, 458, 0.9) + grassTuft(250, 470) + grassTuft(170, 464);
    return out;
  }

  function numberPage(r, seed) {
    const n = (seed % 10) + 1;
    let out = '';
    out += `<text x="164" y="300" text-anchor="middle" font-family="'Baloo 2',cursive" font-size="230" font-weight="800" class="cs-region" fill="#ffffff" stroke="#1e293b" stroke-width="5" paint-order="stroke">${n}</text>`;
    // count n objects: apples on a tree OR balloons OR stars
    const style = seed % 3;
    if (style === 0) {          // apple tree
      out += P(`M 350 430 L 356 320 L 376 320 L 382 430 Z`);
      out += P(`M 282 320 a 40 40 0 0 1 26 -50 a 44 44 0 0 1 58 -12 a 40 40 0 0 1 52 18 a 36 36 0 0 1 -4 62 a 42 42 0 0 1 -58 16 a 44 44 0 0 1 -74 -34 Z`);
      for (let i = 0; i < Math.min(n, 8); i++)
        out += C(300 + (i % 4) * 32, 282 + Math.floor(i / 4) * 36, 11, 2.5);
      if (n > 8) for (let i = 8; i < n; i++) out += C(316 + (i - 8) * 40, 410, 11, 2.5);
    } else if (style === 1) {   // balloons
      for (let i = 0; i < n; i++) {
        const bx = 300 + (i % 3) * 62, by = 120 + Math.floor(i / 3) * 84;
        out += E(bx, by, 24, 30);
        out += LINE(`M ${bx} ${by + 30} L ${bx} ${by + 56}`, 2);
      }
    } else {                    // stars
      for (let i = 0; i < n; i++)
        out += starP(300 + (i % 3) * 66, 120 + Math.floor(i / 3) * 78, 22);
    }
    out += P(`M 0 440 Q 250 414 500 440 L 500 500 L 0 500 Z`);
    out += grassTuft(80, 470) + miniFlower(140, 468, 0.85) + grassTuft(420, 474);
    return out;
  }

  /* ══════════ PAGE RECIPES ══════════ */

  function withMeadow(r, subjectFn, opts) {
    const m = meadow(r, opts || {});
    return m.pre + subjectFn(m.groundY + irange(r, 30, 60)) + m.post;
  }

  const RECIPES = {
    animals: function (r, i) {
      const roll = i % 8;
      if (roll === 0) return withMeadow(r, fy => quadruped(r, 250, fy, { ears: 'point', tail: 'curl', whiskers: true, collar: r() > 0.5 }));                       // cat
      if (roll === 1) return withMeadow(r, fy => quadruped(r, 255, fy, { ears: 'floppy', tail: 'thin', spots: irange(r, 2, 4), collar: true }));                     // dog
      if (roll === 2) return withMeadow(r, fy => rabbit(r, 250, fy));
      if (roll === 3) return withMeadow(r, fy => bird(r, 250, fy, r() > 0.5), { noTrees: true });
      if (roll === 4) { const m = meadow(r, {}); return m.pre + butterflyBig(r, 250, 230) + m.post; }
      if (roll === 5) return duckPond(r) + sunCorner(r) + cloud(360, 70, 0.9);
      if (roll === 6) return withMeadow(r, fy => kiviFox(r, 250, fy));
      return withMeadow(r, fy => quadruped(r, 260, fy, { ears: 'round', tail: 'thin', big: true, trunk: true }));                                                    // elephant
    },
    nature: function (r, i) {
      const roll = i % 5;
      if (roll === 0) { // flower garden
        const m = meadow(r, { noTrees: true });
        let s = '';
        const nf = irange(r, 3, 4);
        for (let k = 0; k < nf; k++) {
          const fx = 100 + k * (300 / (nf - 1 || 1)), sc = 1.6 + r() * 1.2;
          s += miniFlower(fx, m.groundY - 10, sc);
        }
        s += butterflyBig(r, irange(r, 150, 350), 150);
        return m.pre + s + m.post;
      }
      if (roll === 1) return withMeadow(r, () => bigTreeSwing(r), { noTrees: true });
      if (roll === 2) return withMeadow(r, () => mushroomHouse(r), { noTrees: true });
      if (roll === 3) { // giant single flower
        const m = meadow(r, { noTrees: true });
        let s = '';
        const cx = 250, cy = 210;
        const petals = [6, 8, 10][irange(r, 0, 2)];
        for (let k = 0; k < petals; k++)
          s += `<path class="cs-region" transform="rotate(${(360/petals)*k} ${cx} ${cy})" d="M ${cx} ${cy-40} Q ${cx-34} ${cy-96} ${cx} ${cy-136} Q ${cx+34} ${cy-96} ${cx} ${cy-40} Z" fill="#ffffff" stroke="#1e293b" stroke-width="3" stroke-linejoin="round"/>`;
        s += C(cx, cy, 46);
        s += DOT(cx-14, cy-6, 3) + DOT(cx+14, cy-6, 3);
        s += LINE(`M ${cx-12} ${cy+12} Q ${cx} ${cy+22} ${cx+12} ${cy+12}`, 2.5);
        s += LINE(`M ${cx-4} ${cy+46} L ${cx-4} ${m.groundY+10} M ${cx+4} ${cy+46} L ${cx+4} ${m.groundY+10}`, 3);
        s += E(cx-44, cy+150, 40, 17, -26) + E(cx+44, cy+176, 40, 17, 26);
        return m.pre + s + m.post;
      }
      // rainbow scene — fillable concentric bands ending in clouds
      const m = meadow(r, { noTrees: true });
      let s = '';
      const gy = m.groundY - 6;
      for (let k = 0; k < 4; k++) {
        const R1 = 200 - k * 26, R2 = 200 - (k + 1) * 26;
        s += P(`M ${250 - R1} ${gy} A ${R1} ${R1} 0 0 1 ${250 + R1} ${gy} L ${250 + R2} ${gy} A ${R2} ${R2} 0 0 0 ${250 - R2} ${gy} Z`);
      }
      s += cloud(56, gy - 12, 1.15) + cloud(444, gy - 8, 1.15);
      s += flyingBird(190, 140) + flyingBird(315, 110);
      return m.pre + s + m.post;
    },
    alphabet:  (r, i) => letterPage(r, i),
    math:      (r, i) => numberPage(r, i),
    festivals: function (r, i) {
      const roll = i % 5;
      if (roll === 0) return mandala(r);
      if (roll === 1) return lanternNight(r);
      if (roll === 2) return fireworks(r);
      if (roll === 3) return giftScene(r);
      return withMeadow(r, () => decoratedTree(r), { noTrees: true });
    },
    wildlife: function (r, i) {
      const roll = i % 5;
      if (roll === 0) return withMeadow(r, fy => quadruped(r, 260, fy, { ears: 'round', tail: 'thin', big: true, trunk: true }));       // elephant
      if (roll === 1) { const m = meadow(r, { noTrees: true }); return m.pre + peacock(r) + m.post; }
      if (roll === 2) return withMeadow(r, fy => quadruped(r, 255, fy, { ears: 'round', tail: 'curl', spots: irange(r, 4, 6), whiskers: true, big: true }));         // leopard
      if (roll === 3) return P(`M 0 420 Q 250 396 500 420 L 500 500 L 0 500 Z`) + sunCorner(r) + cloud(300, 80, 1) + tortoiseBeach(r) + E(420, 452, 30, 10, 0, 2.5) + LINE('M 60 452 Q 76 444 92 452 M 350 470 Q 366 462 382 470', 2.5);
      return withMeadow(r, fy => quadruped(r, 255, fy, { ears: 'round', tail: 'curl', mane: true, big: true }));                                                     // lion
    },
    space: function (r, i) {
      const roll = i % 3;
      if (roll === 0) return rocketScene(r);
      if (roll === 1) return planetScene(r);
      return fishTank(r);   // "science aquarium" page for variety
    },
    emotions: (r, i) => emotionKid(r, i),
    everyday: function (r, i) {
      const roll = i % 5;
      if (roll === 0) return withMeadow(r, () => houseScene(r), { noTrees: true });
      if (roll === 1) { const m = meadow(r, { noTrees: true }); return m.pre + carScene(r) + m.post; }
      if (roll === 2) { // two kids walking to school — the classic
        const m = meadow(r, {});
        let s = child(r, 180, m.groundY + 46, { hair: pick(r, ['bow', 'pigtails']), dress: true, wave: true, walk: true, freckles: true, backpack: true });
        s += child(r, 330, m.groundY + 52, { hair: 'cap', walk: true, backpack: true });
        return m.pre + s + m.post;
      }
      if (roll === 3) return withMeadow(r, () => balloonScene(r), { noTrees: true });
      return withMeadow(r, fy => child(r, 250, fy, { hair: pick(r, ['short', 'bow', 'pigtails', 'cap']), dress: r() > 0.5, wave: true, freckles: r() > 0.5 }));
    },
    music: function (r, i) {
      const roll = i % 4;
      if (roll === 0) return withMeadow(r, () => drumScene(r), { noTrees: true });
      if (roll === 1) return withMeadow(r, () => guitar(r), { noTrees: true });
      if (roll === 2) return withMeadow(r, () => xylophone(r), { noTrees: true });
      // dancing kid with notes
      const m = meadow(r, {});
      let s = child(r, 250, m.groundY + 46, { hair: pick(r, ['pigtails', 'bow', 'short']), dress: r() > 0.4, wave: true, walk: true });
      for (let k = 0; k < irange(r, 3, 4); k++) {
        const nx = irange(r, 60, 440), ny = irange(r, 70, 170);
        s += E(nx, ny, 10, 8, -20, 2.5);
        s += LINE(`M ${nx+9} ${ny-3} L ${nx+9} ${ny-32}`, 2.5);
      }
      return m.pre + s + m.post;
    },
  };

  /* Build one page's SVG for a category + page index */
  function buildPage(cat, idx) {
    const seed = (CATS.indexOf(cat) + 1) * 100003 + idx * 61;
    const r = rng(seed);
    return OPEN + RECIPES[cat.id](r, idx) + CLOSE;
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
