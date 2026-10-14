// Stylized 3D Abdur Rafay, modelled in code from reference photos.
// createRafay(THREE, {outfit:"waistcoat"|"shirt", glasses}) -> { group, head, setOutfit, setGlasses, update(t, {talk, lookX, lookY}) }
// Feet at y=0, face toward +z, ~4.9 units tall.
export function createRafay(THREE, opts = {}) {
  const C = { skin: 0xB97A56, hair: 0x120D0B, beard: 0x17110E, lip: 0x8A4B45, dark: 0x0B0B0D, shoe: 0x2A1E17, gold: 0xD4A94A };
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .75, ...o });
  const M = {
    skin: std(C.skin, { roughness: .6 }), hair: std(C.hair, { roughness: .95 }), beard: std(C.beard, { roughness: 1 }),
    lip: std(C.lip, { roughness: .5 }), white: std(0xF4F1EC, { roughness: .3 }), iris: std(0x1A1210, { roughness: .2 }),
    shirt: std(0x16161A), trousers: std(0x16161A), vest: std(0x111114, { roughness: .55 }), sleeve: std(0x16161A),
    button: std(0xC9CDD4, { metalness: .8, roughness: .3 }), watch: std(0x111111, { metalness: .6, roughness: .35 }),
    shoe: std(C.shoe), dark: std(0x2A2A30), mouth: std(0x2A0F0F), gold: std(C.gold, { metalness: .9, roughness: .25 }),
    lens: new THREE.MeshStandardMaterial({ color: 0x6B3A22, metalness: .3, roughness: .1, transparent: true, opacity: .9 })
  };
  const mk = (geo, mat, parent, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.scale.set(...s);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const S = (r, w = 24, h = 16, ...a) => new THREE.SphereGeometry(r, w, h, ...a);
  const group = new THREE.Group();

  // legs + shoes
  [-1, 1].forEach(sx => {
    mk(new THREE.CylinderGeometry(.27, .21, 1.55, 16), M.trousers, group, [sx * .22, .93, 0]);
    mk(new THREE.CapsuleGeometry(.13, .22, 6, 12), M.shoe, group, [sx * .22, .12, .07], [Math.PI / 2, 0, 0]);
  });

  // torso
  const body = new THREE.Group(); group.add(body);
  mk(new THREE.CylinderGeometry(.5, .58, .75, 24), M.shirt, body, [0, 1.85, 0], [0, 0, 0], [1, 1, .78]);           // kameez/shirt hem
  mk(new THREE.CapsuleGeometry(.5, .72, 8, 24), M.shirt, body, [0, 2.62, 0], [0, 0, 0], [1.08, 1, .72]);          // chest
  mk(new THREE.CylinderGeometry(.17, .19, .38, 16), M.skin, body, [0, 3.5, 0]);                                   // neck

  // outfit A: waistcoat with mandarin collar + silver buttons
  const vest = new THREE.Group(); body.add(vest);
  mk(new THREE.CapsuleGeometry(.52, .66, 8, 24), M.vest, vest, [0, 2.56, .01], [0, 0, 0], [1.1, 1, .76]);
  mk(new THREE.CylinderGeometry(.2, .23, .17, 20, 1, true), M.vest, vest, [0, 3.42, 0]);
  for (let i = 0; i < 5; i++) mk(S(.035, 10, 8), M.button, vest, [0, 3.12 - i * .24, .405 - Math.abs(i - 2) * .006]);
  mk(new THREE.BoxGeometry(.22, .03, .02), M.dark, vest, [.26, 2.95, .37], [0, .25, 0]);

  // outfit B: light checked shirt, open collar, dark buttons, chest pocket
  const shirtBits = new THREE.Group(); body.add(shirtBits);
  [-1, 1].forEach(sx => mk(new THREE.BoxGeometry(.2, .14, .03), M.shirt, shirtBits, [sx * .12, 3.36, .2], [-.5, sx * .45, sx * .5]));
  for (let i = 0; i < 4; i++) mk(S(.025, 8, 6), M.iris, shirtBits, [0, 3.15 - i * .3, .37]);
  mk(new THREE.BoxGeometry(.24, .26, .02), M.shirt, shirtBits, [.25, 2.86, .375]);

  // arms: shoulder -> elbow -> hand
  const arms = [-1, 1].map(sx => {
    const sh = new THREE.Group(); sh.position.set(sx * .64, 3.18, 0); body.add(sh);
    mk(new THREE.CapsuleGeometry(.15, .5, 6, 12), M.sleeve, sh, [0, -.34, 0]);
    const el = new THREE.Group(); el.position.y = -.7; el.rotation.order = "YXZ"; sh.add(el);
    const fore = mk(new THREE.CapsuleGeometry(.13, .46, 6, 12), M.sleeve, el, [0, -.3, 0]);
    const cuff = mk(new THREE.CylinderGeometry(.155, .155, .12, 14), M.shirt, el, [0, -.08, 0]);
    const watch = sx > 0 ? mk(new THREE.CylinderGeometry(.14, .14, .07, 14), M.watch, el, [0, -.5, 0]) : null;
    mk(S(.13, 14, 10), M.skin, el, [0, -.66, .01], [0, 0, 0], [.9, 1.1, .75]);
    return { sx, sh, el, fore, cuff, watch };
  });

  // head
  const head = new THREE.Group(); head.position.y = 3.64; body.add(head);
  const sk = [.92, 1.12, .98];
  mk(S(.5, 40, 32), M.skin, head, [0, .5, 0], [0, 0, 0], sk);
  [-1, 1].forEach(sx => mk(S(.1, 12, 10), M.skin, head, [sx * .46, .5, -.02], [0, 0, 0], [.45, 1, .7]));
  mk(S(.07, 14, 10), M.skin, head, [0, .47, .5], [0, 0, 0], [.85, 1.3, 1.1]);                                   // nose
  const eyes = [-1, 1].map(sx => {
    const g = new THREE.Group(); g.position.set(sx * .17, .59, .425); head.add(g);
    mk(S(.07, 16, 12), M.white, g, [0, 0, 0], [0, 0, 0], [1, .62, .35]);
    mk(S(.036, 12, 10), M.iris, g, [0, 0, .016], [0, 0, 0], [1, 1, .6]);
    return g;
  });
  [-1, 1].forEach(sx => mk(new THREE.BoxGeometry(.2, .05, .05), M.hair, head, [sx * .17, .7, .445], [0, sx * .22, sx * -.07]));

  // beard covers the lower face; lips + moustache sit in front of it. Jaw rotates for speech.
  const jaw = new THREE.Group(); jaw.position.set(0, .45, 0); head.add(jaw);
  const bk = [.95, 1.12, 1.02], bc = [0, .05, 0];                                                    // beard shares skull ellipsoid
  mk(S(.535, 48, 24, Math.PI / 2 - 1.8, 3.6, 1.8, Math.PI - 1.8), M.beard, jaw, bc, [0, 0, 0], bk);
  [-1, 1].forEach(sx => mk(S(.535, 8, 10, Math.PI / 2 + sx * 1.62 - .12, .24, 1.3, .55), M.beard, head, [0, .5, 0], [0, 0, 0], bk)); // sideburns
  mk(S(.24, 20, 14), M.beard, jaw, [0, -.2, .3], [0, 0, 0], [1.3, .85, .85]);                        // chin volume
  mk(S(.08, 16, 10), M.lip, head, [0, .315, .525], [0, 0, 0], [1.3, .26, .4]);                       // upper lip
  const mouth = mk(new THREE.BoxGeometry(.17, .06, .03), M.mouth, head, [0, .29, .53], [0, 0, 0], [1, .1, 1]);
  mk(S(.08, 16, 10), M.lip, jaw, [0, -.18, .52], [0, 0, 0], [1.15, .3, .4]);                      // lower lip
  mk(new THREE.TorusGeometry(.12, .036, 8, 20, Math.PI), M.beard, head, [0, .32, .54], [0, 0, 0], [1.15, .5, 1]); // moustache

  // hair: cap tilted back to raise the hairline, plus quiff curls
  mk(S(.535, 40, 20, 0, Math.PI * 2, 0, 1.4), M.hair, head, [0, .53, -.03], [-.38, 0, 0], [.96, 1.12, 1.03]);
  mk(S(.44, 32, 20), M.hair, head, [0, .98, .02], [-.15, 0, 0], [1, .5, 1.08]);                       // quiff volume
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let row = 0; row < 4; row++) for (let i = 0; i < 5; i++) {                                    // waves swept back
    const x = (i - 2) * .14 + (rnd() - .5) * .04, z = .32 - row * .2;
    mk(S(.12 + rnd() * .03, 12, 10), M.hair, head, [x, 1.13 - row * .025 - Math.abs(x) * .45, z], [0, 0, 0], [1, .55, 1.3]);
  }

  // sunglasses: gold square double-bridge frame
  const glasses = new THREE.Group(); head.add(glasses);
  [-1, 1].forEach(sx => {
    mk(new THREE.BoxGeometry(.21, .14, .02), M.lens, glasses, [sx * .17, .585, .52]);
    mk(new THREE.BoxGeometry(.015, .018, .42), M.gold, glasses, [sx * .29, .63, .3]);
  });
  mk(new THREE.BoxGeometry(.52, .016, .02), M.gold, glasses, [0, .655, .53]);
  mk(new THREE.BoxGeometry(.13, .015, .02), M.gold, glasses, [0, .6, .535]);

  const outfits = {
    waistcoat: { shirt: 0x16161A, trousers: 0x16161A, sleeve: 0x16161A, watch: [0x111111, .6], vest: true, rolled: false },
    shirt: { shirt: 0xDCE3F0, trousers: 0x2B3245, sleeve: 0xDCE3F0, watch: [0xC9CDD4, .9], vest: false, rolled: true }
  };
  function setOutfit(name) {
    const o = outfits[name] || outfits.waistcoat;
    M.shirt.color.setHex(o.shirt); M.trousers.color.setHex(o.trousers);
    M.watch.color.setHex(o.watch[0]); M.watch.metalness = o.watch[1];
    vest.visible = o.vest; shirtBits.visible = !o.vest;
    arms.forEach(a => { a.fore.material = o.rolled ? M.skin : M.sleeve; a.cuff.visible = o.rolled; });
    M.sleeve.color.setHex(o.sleeve);
  }
  const setGlasses = on => { glasses.visible = !!on; };
  setOutfit(opts.outfit || "waistcoat"); setGlasses(opts.glasses);

  // animation
  const rest = { sh: [-.12, 0, .07], el: [-1.25, -.95, 0] };   // hands clasped in front
  const gest = { sh: [-.55, 0, .25], el: [-1.55, .1, 0] };     // explaining gesture
  let g = 0;
  function update(t, { talk = 0, lookX = 0, lookY = 0 } = {}) {
    body.position.y = Math.sin(t * 1.6) * .012; body.scale.x = 1 + Math.sin(t * 1.6) * .006;
    head.rotation.y += (lookX * .6 - head.rotation.y) * .08;
    head.rotation.x += (lookY * .25 - head.rotation.x) * .08;
    head.rotation.z = Math.sin(t * .7) * .02;
    const open = talk > 0 ? (.35 + .65 * Math.abs(Math.sin(t * 13) * Math.sin(t * 5.3 + 1))) * talk : 0;
    jaw.rotation.x = open * .16; mouth.scale.y = .1 + open * 2.2;
    const blink = (t % 3.7 < .13) ? .1 : 1; eyes.forEach(e => e.scale.y = blink);
    g += ((talk > 0 ? 1 : 0) - g) * .05;
    arms.forEach((a, i) => {
      const s = a.sx, k = i === 0 ? g : 0, wob = i === 0 ? Math.sin(t * 3) * .15 * g : 0;   // one hand gestures while talking
      a.sh.rotation.set(rest.sh[0] + (gest.sh[0] - rest.sh[0]) * k + wob, 0, -s * (rest.sh[2] + (gest.sh[2] - rest.sh[2]) * k));
      a.el.rotation.set(rest.el[0] + (gest.el[0] - rest.el[0]) * k, s * (rest.el[1] + (gest.el[1] - rest.el[1]) * k), 0);
    });
  }
  update(0);
  return { group, head, setOutfit, setGlasses, update };
}
