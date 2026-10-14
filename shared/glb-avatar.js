// Loads a realistic avatar .glb (Avaturn T2, MetaPerson, etc.) and drives it like createRafay():
// loadAvatar(THREE, GLTFLoader, url, {height}) -> { group, update(t, {talk, lookX, lookY}), info }
// Lip-sync uses Oculus visemes if present, else ARKit jawOpen/mouthOpen. Blink uses eyeBlinkLeft/Right.
export async function loadAvatar(THREE, GLTFLoader, url, { height = 4.4, meshopt = null, ktx2 = null, FBXLoader = null, prepare = null } = {}) {
  let gltf;
  if (/\.fbx($|\?)/i.test(url)) {                      // Mixamo-rigged FBX: skeleton only, its clips (a static T-pose take) are ignored
    if (!FBXLoader) throw new Error("FBXLoader needed for " + url);
    gltf = { scene: await new FBXLoader().loadAsync(url), animations: [] };
  } else {
    const loader = new GLTFLoader();
    if (meshopt) loader.setMeshoptDecoder(meshopt);
    if (ktx2) loader.setKTX2Loader(ktx2);               // GPU-compressed textures (KHR_texture_basisu) from the build     // needed for models compressed with gltfpack (EXT_meshopt_compression)
    gltf = await loader.loadAsync(url);
  }
  if (prepare) await prepare(gltf.scene);               // e.g. paint an untextured model before it is measured
  const root = gltf.scene, group = new THREE.Group();
  group.add(root);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root), s = height / Math.max(1e-6, box.max.y - box.min.y);
  root.scale.setScalar(s); root.position.set(-(box.min.x + box.max.x) / 2 * s, -box.min.y * s, -(box.min.z + box.max.z) / 2 * s);
  root.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.frustumCulled = false; } });

  const morphs = []; root.traverse(o => { if (o.morphTargetDictionary) morphs.push(o); });
  const has = n => morphs.some(m => n in m.morphTargetDictionary);
  const setMorph = (n, v) => morphs.forEach(m => { const i = m.morphTargetDictionary[n]; if (i !== undefined) m.morphTargetInfluences[i] = v; });
  const visemes = ["viseme_aa", "viseme_O", "viseme_E", "viseme_I", "viseme_U", "viseme_PP", "viseme_FF", "viseme_DD"].filter(has);
  const jawKey = ["jawOpen", "mouthOpen"].find(has);
  const blinkKeys = ["eyeBlinkLeft", "eyeBlinkRight", "eyesClosed"].filter(has);

  const bones = []; root.traverse(o => { if (o.isBone) bones.push(o); });
  const bone = re => bones.find(b => re.test(b.name));
  const headBone = bone(/(^|[:_])head$/i), neckBone = bone(/neck$/i);
  const arms = [bone(/left_?(upper_?)?arm$/i), bone(/right_?(upper_?)?arm$/i)];
  const rest = new Map(bones.map(b => [b, b.quaternion.clone()]));


  const mixer = gltf.animations.length ? new THREE.AnimationMixer(root) : null;
  const clip = mixer && (gltf.animations.find(a => /idle/i.test(a.name)) || gltf.animations[0]);
  if (clip) mixer.clipAction(clip).play();
  // bones the clip drives are rewritten by the mixer only when their value changes, so never reset those
  const animated = new Set(clip ? clip.tracks.map(tr => tr.name.split(".")[0]) : []);
  const resettable = bones.filter(b => !animated.has(b.name)), animBones = bones.filter(b => animated.has(b.name));
  const clean = animBones.map(b => b.quaternion.clone());       // last pure-animation pose, restored each frame

  // rig helpers for procedural poses (world-space, so they work regardless of each rig's bone axes)
  const byName = Object.fromEntries(bones.map(b => [b.name.replace(/^mixamorig:?/i, ""), b]));
  const V = () => new THREE.Vector3(), _p = V(), _c = V(), _u = V(), _w = V(), _e = V(), _q = new THREE.Quaternion(), _wq = new THREE.Quaternion(), _pq = new THREE.Quaternion();
  function applyWorld(b, qWorld, blend = 1) {          // rotate bone b by a world-space rotation
    b.getWorldQuaternion(_wq).premultiply(qWorld);
    b.parent.getWorldQuaternion(_pq).invert();
    _wq.premultiply(_pq); b.quaternion.slerp(_wq, blend); b.updateMatrixWorld(true);
  }
  function aim(b, child, target, blend = 1) {           // point b so that child lands on target
    b.getWorldPosition(_p); child.getWorldPosition(_c);
    _q.setFromUnitVectors(_u.subVectors(_c, _p).normalize(), _w.subVectors(target, _p).normalize());
    applyWorld(b, _q, blend);
  }
  const bend = (b, axis, angle) => b && applyWorld(b, _q.setFromAxisAngle(axis, angle));
  // Elbow hinge: in the bind pose the forearm flexes toward the character's front (+Z). Stored in each
  // upper-arm bone's local frame so ik(..., hinge) can roll the upper arm until that hinge faces the bend.
  root.updateMatrixWorld(true);
  const flexLocal = new Map(["Left", "Right"].map(sd => bones.find(b => b.name.replace(/^mixamorig:?/i, "") === sd + "Arm")).filter(Boolean)
    .map(b => [b, V().set(0, 0, 1).applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert())]));
  const _ax = V(), _f0 = V(), _f1 = V(), _hq = new THREE.Quaternion();
  function ik(upper, lower, end, target, pole, blend = 1, hinge = false) { // two-bone IK (shoulder-elbow-hand)
    if (!upper || !lower || !end || blend <= 0) return;
    const a = upper.getWorldPosition(_p).distanceTo(lower.getWorldPosition(_c)), bl = _c.distanceTo(end.getWorldPosition(_e));
    upper.getWorldPosition(_p);
    const dir = _u.subVectors(target, _p), d = Math.min(dir.length(), a + bl - 1e-3); dir.normalize();
    const cosA = THREE.MathUtils.clamp((a * a + d * d - bl * bl) / (2 * a * d), -1, 1);
    const side = _w.copy(pole).addScaledVector(dir, -pole.dot(dir)).normalize();
    const elbow = V().copy(_p).addScaledVector(dir, a * cosA).addScaledVector(side, a * Math.sqrt(1 - cosA * cosA));
    const flexDir = hinge && flexLocal.has(upper) ? V().copy(side).negate() : null;   // forearm folds back toward the shoulder-hand line
    aim(upper, lower, elbow, blend);
    if (flexDir) {                                        // swing-only aim leaves the upper arm's roll arbitrary: twist it so the hinge plane is right
      _ax.subVectors(lower.getWorldPosition(_c), upper.getWorldPosition(_p)).normalize();
      _f0.copy(flexLocal.get(upper)).applyQuaternion(upper.getWorldQuaternion(_hq)).projectOnPlane(_ax);
      _f1.copy(flexDir).projectOnPlane(_ax);
      if (_f0.lengthSq() > 1e-6 && _f1.lengthSq() > 1e-6) {
        _f0.normalize(); _f1.normalize();
        const ang = Math.atan2(_f0.clone().cross(_f1).dot(_ax), _f0.dot(_f1));
        applyWorld(upper, _q.setFromAxisAngle(_ax, ang), blend);
      }
    }
    aim(lower, end, target, blend);
  }
  const rig = { bone: n => byName[n], bend, aim, ik, root };

  // Keep the planted foot on the floor: measure each foot/toe bone height in the standing pose,
  // then every frame shift the body so the lowest one sits back at its standing height.
  const rootBaseY = root.position.y, feet = ["LeftFoot", "RightFoot", "LeftToeBase", "RightToeBase"].map(n => byName[n]).filter(Boolean);
  const _gv = V(); root.updateMatrixWorld(true);
  const footY0 = feet.map(b => group.worldToLocal(b.getWorldPosition(_gv)).y);
  function ground() {
    if (!feet.length) return;
    root.position.y = rootBaseY; root.updateMatrixWorld(true);
    let drop = Infinity; feet.forEach((b, i) => { drop = Math.min(drop, group.worldToLocal(b.getWorldPosition(_gv)).y - footY0[i]); });
    root.position.y = rootBaseY - drop; root.updateMatrixWorld(true);
  }

  // Procedural idle for models exported without animation (T-pose). Layers small, never-repeating motions so the
  // body reads as a relaxed person, not a statue: weight shift between legs, breathing, arm drift, curled fingers.
  const wave = (t, a, b, c) => Math.sin(t * a) * .6 + Math.sin(t * b + 1.7) * .3 + Math.sin(t * c + 4.1) * .1; // smooth pseudo-noise
  const FINGERS = ["Index", "Middle", "Ring", "Pinky"];
  const _gq = new THREE.Quaternion(), _up = V(), _fw = V(), _lf = V(), _dn = V(0, -1, 0), _tg = V(), _sp = V(), _ep = V();
  function idlePose(t, relax = 1, curl = { Left: 1, Right: 1 }) {
    group.getWorldQuaternion(_gq); _fw.set(0, 0, 1).applyQuaternion(_gq); _lf.crossVectors(_dn.set(0, 1, 0), _fw).normalize(); _dn.set(0, -1, 0);
    for (const [side, sd] of [["Left", 1], ["Right", -1]]) {
      const sh = byName[side + "Arm"], el = byName[side + "ForeArm"], hd = byName[side + "Hand"];
      if (!sh || !el || !hd) continue;
      sh.getWorldPosition(_sp); const a = _sp.distanceTo(el.getWorldPosition(_ep));
      const drift = wave(t + sd * 3, .37, .61, 1.3) * relax;                  // arms hang loose and drift a little
      aim(sh, el, _tg.copy(_dn).addScaledVector(_lf, sd * (.13 + drift * .02)).addScaledVector(_fw, .05 + drift * .03).normalize().multiplyScalar(a).add(_sp));
      el.getWorldPosition(_ep); const b = _ep.distanceTo(hd.getWorldPosition(_sp));
      aim(el, hd, _tg.copy(_dn).addScaledVector(_fw, .26 + drift * .05).addScaledVector(_lf, sd * .03).normalize().multiplyScalar(b).add(_ep));
      // relaxed hands: fingers curl toward the palm (palm faces the thigh, so curl axis is along the facing direction)
      _tg.copy(_fw).multiplyScalar(-sd);
      FINGERS.forEach((f, i) => [1, 2, 3].forEach(j => bend(byName[side + "Hand" + f + j], _tg, (.22 + i * .05) * (j === 1 ? .8 : 1) * (.15 + .85 * (curl[side + f] ?? curl[side])))));   // per-finger override, e.g. curl.RightIndex = 0 to point
      bend(byName[side + "HandThumb2"], _tg, .15);
    }
    // weight shift: slowly settle onto one leg (that knee softens), hips turn slightly, spine counter-balances
    const ws = wave(t, .21, .34, .77) * relax;
    bend(byName.LeftUpLeg, _lf, -.04 * Math.max(0, ws)); bend(byName.LeftLeg, _lf, .1 * Math.max(0, ws));
    bend(byName.RightUpLeg, _lf, -.04 * Math.max(0, -ws)); bend(byName.RightLeg, _lf, .1 * Math.max(0, -ws));
    bend(byName.Hips, _up.set(0, 1, 0), .04 * wave(t, .17, .29, .5) * relax);
    bend(byName.Spine, _fw, -.025 * ws);
    // breathing: chest lifts and shoulders rise a touch (~15 breaths/min)
    const br = Math.sin(t * 1.6);
    bend(byName.Spine2, _lf, -.014 * br);
    bend(byName.LeftShoulder, _fw, -.012 * br); bend(byName.RightShoulder, _fw, .012 * br);
  }

  const MOOD = [["mouthSmileLeft", .55], ["mouthSmileRight", .55], ["cheekSquintLeft", .35], ["cheekSquintRight", .35], ["eyeSquintLeft", .2], ["eyeSquintRight", .2], ["browInnerUp", .25], ["browOuterUpLeft", .15], ["browOuterUpRight", .15], ["mouthDimpleLeft", .2], ["mouthDimpleRight", .2]].filter(([k]) => has(k));
  let last = 0, cur = 0, target = 0, vIdx = 0, vNext = 0;
  // eyes and head behave like a person: random blinks (sometimes double), occasional glances away, micro head motion
  let blinkAt = 1.5, blinkLen = .14, glanceAt = 2, gyT = 0, gpT = 0, gy = 0, gp = 0;
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  function update(t, { talk = 0, lookX = 0, lookY = 0, pose = null, relax = 1, curl, smile = 0 } = {}) {
    const dt = Math.min(.1, t - last); last = t;
    resettable.forEach(b => b.quaternion.copy(rest.get(b)));   // reset so per-frame offsets never accumulate
    animBones.forEach((b, i) => b.quaternion.copy(clean[i]));    // undo last frame's procedural offsets
    if (mixer) { mixer.update(dt); animBones.forEach((b, i) => clean[i].copy(b.quaternion)); }
    else { root.updateMatrixWorld(true); idlePose(t, relax, curl); }
    // lip-sync: hop between viseme shapes while talking
    if (t > vNext) { vNext = t + .07 + Math.random() * .06; vIdx = Math.random() * visemes.length | 0; target = talk ? .35 + Math.random() * .65 : 0; }
    cur += (target - cur) * .35;
    visemes.forEach((v, i) => setMorph(v, i === vIdx ? cur : 0));
    if (!visemes.length && jawKey) setMorph(jawKey, cur * .6);
    if (t > blinkAt + blinkLen) { const dbl = Math.random() < .15; blinkAt = t + (dbl ? .25 : 2 + Math.random() * 4); }
    // friendly resting face (ARKit morphs, if present): soft smile that reaches the eyes, relaxed raised brows;
    // eased back while speaking so visemes stay readable
    const sm = smile * (1 - cur * .6);
    MOOD.forEach(([k, w]) => setMorph(k, w * sm));
    const bp = (t - blinkAt) / blinkLen, blink = bp >= 0 && bp <= 1 ? Math.sin(bp * Math.PI) : 0; blinkKeys.forEach(k => setMorph(k, blink));
    if (t > glanceAt) { glanceAt = t + 2.5 + Math.random() * 4; const away = Math.random() < .45 && !talk; gyT = away ? (Math.random() - .5) * .6 : 0; gpT = away ? (Math.random() - .3) * .12 : 0; }
    gy += (gyT - gy) * Math.min(1, dt * 3); gp += (gpT - gp) * Math.min(1, dt * 3);
    // head follows the cursor, layered on top of rest/animation pose
    const hb = headBone || neckBone;
    if (hb) { const nod = (!visemes.length && !jawKey && talk) ? Math.sin(t * 9) * .035 + Math.sin(t * 3.1) * .03 : 0; // no face rig: nod while speaking
      const mx = wave(t, .5, .83, 1.9) * .025 * relax, my = wave(t + 9, .43, .71, 1.6) * .02 * relax;
      hb.quaternion.multiply(q.setFromEuler(e.set(lookY * .25 + nod + (gp + my) * relax, lookX * .5 + (gy + mx) * relax, wave(t + 5, .3, .55, 1.1) * .03 * relax))); }
    if (pose) { root.updateMatrixWorld(true); pose(rig, t); }
    ground();
  }
  return { group, update, rig, info: { visemes: visemes.length, jawKey, blink: blinkKeys.length, head: !!headBone, arms: arms.filter(Boolean).length, clips: gltf.animations.map(a => a.name) } };
}

