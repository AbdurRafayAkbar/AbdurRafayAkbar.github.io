// Rafay's Studio: scene, host, sections and navigation. Loaded by index.html (styles in studio.css).
import * as THREE from "three";
import { createRafay } from "./shared/rafay-avatar.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { loadAvatar } from "./shared/glb-avatar.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const P=PROFILE,reduce=matchMedia("(prefers-reduced-motion: reduce)").matches,$=id=>document.getElementById(id);
const canvas=$("c"),r=new THREE.WebGLRenderer({antialias:true,canvas});r.setPixelRatio(Math.min(devicePixelRatio,2));r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();r.autoClear=false;
scene.background=new THREE.Color(0x121619);
const cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,100);
const hemi=new THREE.HemisphereLight(0xE8EEEC,0x1C2226,1.3);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,1.3);sun.position.set(6,12,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8});scene.add(sun);
// soft key light on the host's standing spot (wide penumbra = soft edge, no hard spotlight ring) + cool rim for separation
const key=new THREE.SpotLight(0xFFF1E4,70,18,.5,1,2);key.position.set(5.4,8.2,3.4);key.target.position.set(2.6,2.3,-1.4);
key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0004;key.shadow.normalBias=.02;scene.add(key,key.target);
// warm face fill from the camera side: lifts the dark eye sockets the overhead key leaves (they read as a cold stare)
const faceFill=new THREE.SpotLight(0xFFE6D2,14,14,.22,.9,1.2);scene.add(faceFill,faceFill.target);
const rim=new THREE.DirectionalLight(0xBCCBFF,1.6);rim.position.set(1,6.5,-7.5);rim.target.position.set(2.6,2.6,-1.4);scene.add(rim,rim.target);
const lamp=new THREE.PointLight(0xE8B44A,12,9);lamp.position.set(-1.6,3.6,-3.4);scene.add(lamp);
const M=(c,e)=>new THREE.MeshStandardMaterial({color:c,roughness:.6,emissive:e||0});
const add=(geo,mat,x,y,z,p=scene)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);return m};
const box=(w,h,d,c,x,y,z,p)=>add(new THREE.BoxGeometry(w,h,d),M(c),x,y,z,p);

// room + desk (from demo 8)
box(10,.3,10,0x2C2A27,0,-.15,0);const walls=[box(10,6,.3,0x1E2B2F,0,3,-5),box(.3,6,10,0x223135,-5,3,0)];walls.forEach(w=>w.material.transparent=true);
box(4,.2,2,0x8B5E3C,0,2,-3.5);[[-1.8,-4.3],[1.8,-4.3],[-1.8,-2.7],[1.8,-2.7]].forEach(([x,z])=>box(.15,2,.15,0x5C3D28,x,1,z));
box(.12,.9,.12,0x2B2D42,-1.6,2.55,-4);add(new THREE.SphereGeometry(.2,16,16),M(0xE8B44A,0xE8B44A),-1.6,3.05,-3.95);
const items=[];
const item=(label,html,say,build)=>{const g=new THREE.Group();build(g);g.userData={label,html,say};scene.add(g);items.push(g)};
// monitor screen = canvas texture. States: idle title -> loading (while walking) -> project cards (camera arrived).
// Project data comes from the owner's CV (real work only).
const PROJECTS=[
 {title:"Bot vs Answering-Machine Audio Classifier",kind:"SpaceDome, Workflow Engineer Intern",art:"spec",
  desc:"Tells automated bot audio apart from answering-machine audio in real telephony calls.",
  tags:["PyTorch","CNN","Mel-spectrograms","Django"],
  summary:"A CNN trained on mel-spectrogram features that separates bot audio from answering-machine audio in real telephony calls, plus the Django pipeline that builds its labelled training data from call records.",
  points:["CNN audio classifier in PyTorch on mel-spectrogram features","Train/test leakage audit: twin matching, then near-duplicate checks on loudness envelopes","Django pipeline turns call records into labelled training audio","TODO: add result metrics (accuracy, calls processed)"]},
 {title:"Vocal View",kind:"Final-year project",stat:"50+ beta users",art:"wave",
  desc:"Scores interview answers from speech, text and video, calibrated against expert interviewers.",
  tags:["Whisper ASR","Sentence Transformers","MediaPipe","REST APIs","PostgreSQL"],
  summary:"An AI system that evaluates interview answers. Whisper transcribes speech, Sentence Transformers score relevance and technical depth, and MediaPipe adds visual signals. Everything is fused into one weighted score calibrated against expert interviewers.",
  points:["556-term domain vocabulary for technical transcription","Custom pause detection, fewer false positives than standard VAD","15+ JWT-secured REST endpoints on PostgreSQL","Deployed to 50+ beta users"]},
 {title:"Bilingual Complaint Mapping",kind:"GIKI AI Bootcamp",art:"map",
  desc:"Clusters Urdu and English civic complaints by meaning, flags duplicates and maps hotspots.",
  tags:["LLM inference","Embeddings","Django"],
  summary:"An end-to-end Django system for civic complaints written in Urdu or English. It groups them by meaning instead of keywords, detects duplicates and maps where problems cluster.",
  points:["LLM inference to understand each complaint","Sentence embeddings for semantic clustering","Duplicate complaint detection","Geographic hotspot mapping"]},
 {title:"Neural Network from Scratch",kind:"Learning project",art:"net",
  desc:"Neurons, backpropagation and gradient descent in NumPy, then rebuilt in PyTorch.",
  tags:["NumPy","PyTorch"],
  summary:"A neural network written by hand to understand how training really works: neurons, activations, backpropagation and gradient descent in NumPy, then the same training rebuilt in PyTorch.",
  points:["Forward and backward pass from scratch","Gradient descent training loop","Rebuilt and compared in PyTorch"]}];
let screenMesh=null;const CARD={gap:34,ch:898,top:172};CARD.cw=(1920-192-CARD.gap*3)/4;  // 4 columns
const SW=1920,SH=1080,scr=document.createElement("canvas");scr.width=SW;scr.height=SH;const sx=scr.getContext("2d");
const scrTex=new THREE.CanvasTexture(scr);scrTex.colorSpace=THREE.SRGBColorSpace;scrTex.anisotropy=8;
const C_BG0="#0E222A",C_BG1="#09171E",C_CARD="#132F38",C_LINE="rgba(232,180,74,.18)",C_GOLD="#E8B44A",C_TXT="#EEF0EC",C_SUB="#A9C7C2",C_CORAL="#FF7A59";
function rr(x,y,w,h,r){sx.beginPath();sx.roundRect(x,y,w,h,r)}
function wrap(text,maxW){const out=[];let line="";for(const word of text.replace(/-/g,"-").split(/ |/).map(x=>x)){const t=line?line+(line.endsWith("-")?"":" ")+word:word;if(sx.measureText(t).width>maxW&&line){out.push(line);line=word}else line=t}if(line)out.push(line);return out}
function seeded(n){let x=n;return()=>(x=(x*16807)%2147483647)/2147483647}
function drawArt(kind,x,y,w,h){                       // procedural thumbnails (no image assets exist yet)
 const g=sx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,"#16424A");g.addColorStop(1,"#0F2B34");sx.fillStyle=g;sx.fillRect(x,y,w,h);
 const R=seeded(kind.length*977+7);sx.save();sx.beginPath();sx.rect(x,y,w,h);sx.clip();
 if(kind==="spec"){const cols=40,rows2=18,cwid=w/cols,rh=h/rows2;               // mel-spectrogram heat grid
   for(let c=0;c<cols;c++)for(let q=0;q<rows2;q++){const v=Math.max(0,Math.sin(c*.45+q*.2)*.5+Math.sin(c*.13-q*.35)*.4+(1-q/rows2)*.35+(R()-.5)*.25);
    sx.fillStyle=v>.75?C_GOLD:v>.5?C_CORAL:v>.3?"rgba(255,122,89,.45)":"rgba(140,240,230,.10)";sx.fillRect(x+c*cwid+1,y+h-(q+1)*rh+1,cwid-2,rh-2)}}
 else if(kind==="wave"){const n=46,bw=w/n;for(let i=0;i<n;i++){const v=Math.abs(Math.sin(i*.37)*.6+Math.sin(i*.11+1)*.4)*.8+.08;const bh=v*h*.62;
   sx.fillStyle=i%7===3?C_CORAL:C_GOLD;sx.globalAlpha=.55+v*.45;rr(x+i*bw+bw*.22,y+h/2-bh/2,bw*.56,bh,bw*.28);sx.fill()}}
 else if(kind==="map"){sx.strokeStyle="rgba(169,199,194,.12)";sx.lineWidth=2;for(let i=1;i<8;i++){sx.beginPath();sx.moveTo(x+i*w/8,y);sx.lineTo(x+i*w/8,y+h);sx.stroke();sx.beginPath();sx.moveTo(x,y+i*h/6);sx.lineTo(x+w,y+i*h/6);sx.stroke()}
   for(const [cx,cy,c,n] of [[.28,.42,C_CORAL,14],[.66,.3,C_GOLD,9],[.55,.72,C_GOLD,11]]){const px=x+cx*w,py=y+cy*h,rg=sx.createRadialGradient(px,py,4,px,py,h*.32);
    rg.addColorStop(0,c==C_CORAL?"rgba(255,122,89,.45)":"rgba(232,180,74,.35)");rg.addColorStop(1,"rgba(0,0,0,0)");sx.fillStyle=rg;sx.globalAlpha=1;sx.fillRect(x,y,w,h);
    sx.fillStyle=c;for(let i=0;i<n;i++){sx.beginPath();sx.arc(px+(R()-.5)*h*.36,py+(R()-.5)*h*.3,5,0,7);sx.fill()}}}
 else{const Ls=[3,5,5,2],P=Ls.map((k,i)=>Array.from({length:k},(_,j)=>[x+w*(.14+i*.24),y+h*((j+1)/(k+1))]));sx.lineWidth=2;
   for(let i=0;i<3;i++)for(const [ax,ay] of P[i])for(const [bx,by] of P[i+1]){sx.strokeStyle="rgba(232,180,74,.28)";sx.beginPath();sx.moveTo(ax,ay);sx.lineTo(bx,by);sx.stroke()}
   P.flat().forEach(([px,py],k)=>{sx.fillStyle=k%5===2?C_CORAL:C_GOLD;sx.beginPath();sx.arc(px,py,13,0,7);sx.fill()})}
 sx.restore();sx.globalAlpha=1}
function background(){const g=sx.createLinearGradient(0,0,SW,SH);g.addColorStop(0,C_BG0);g.addColorStop(1,C_BG1);sx.fillStyle=g;sx.fillRect(0,0,SW,SH)}
// state: {mode:"idle"} | {mode:"loading",p} | {mode:"cards",reveal,focus,focusT}
function drawScreen(st){background();sx.textBaseline="alphabetic";
 if(st.mode==="idle"){sx.textAlign="center";sx.fillStyle=C_GOLD;sx.font="300 260px Fraunces, serif";sx.fillText("Projects",SW/2,SH/2+40);
  sx.fillStyle=C_SUB;sx.font="56px Karla, sans-serif";sx.fillText("Click the screen",SW/2,SH/2+190)}

 else if(st.mode==="loading"){sx.textAlign="center";sx.fillStyle=C_TXT;sx.font="300 120px Fraunces, serif";sx.fillText("Opening projects",SW/2,SH/2-10);
  rr(SW/2-360,SH/2+70,720,14,7);sx.fillStyle="rgba(232,180,74,.18)";sx.fill();rr(SW/2-360,SH/2+70,720*st.p,14,7);sx.fillStyle=C_GOLD;sx.fill()}
 else{sx.textAlign="left";sx.fillStyle=C_GOLD;sx.font="300 96px Fraunces, serif";sx.fillText("Projects",96,138);
  sx.fillStyle=C_SUB;sx.font="40px Karla, sans-serif";sx.textAlign="right";sx.fillText(PROJECTS.length+" selected",SW-96,138);sx.textAlign="left";
  const {gap,cw,ch,top}=CARD,eo=x=>1-Math.pow(1-x,3);
  PROJECTS.forEach((pr,i)=>{const k=eo(clamp((st.reveal-i*.18)/.55,0,1));if(k<=0)return;
   const x=96+i*(cw+gap),y=top+(1-k)*60;sx.globalAlpha=k;
   rr(x,y,cw,ch,32);sx.fillStyle=C_CARD;sx.fill();
   const fk=i===st.focus?st.focusK:i===st.prev?1-st.focusK:0;sx.lineWidth=3+fk*3;sx.strokeStyle=fk>0?`rgba(232,180,74,${.18+.82*fk})`:C_LINE;sx.stroke();
   sx.save();rr(x,y,cw,232,32);sx.clip();drawArt(pr.art,x,y,cw,264);sx.restore();sx.globalAlpha=k;
   if(pr.stat){sx.font="600 28px Karla, sans-serif";const tw=sx.measureText(pr.stat).width;rr(x+24,y+24,tw+36,52,26);sx.fillStyle="rgba(9,23,30,.78)";sx.fill();sx.fillStyle=C_GOLD;sx.fillText(pr.stat,x+42,y+60)}
   let ty=y+290;sx.fillStyle=C_SUB;sx.font="28px Karla, sans-serif";for(const l of wrap(pr.kind,cw-64).slice(0,2)){sx.fillText(l,x+32,ty);ty+=34}ty-=34;   // top-down: kind, title, description, badges
   sx.fillStyle=C_TXT;sx.font="600 44px Karla, sans-serif";ty+=56;for(const l of wrap(pr.title,cw-64).slice(0,4)){sx.fillText(l,x+32,ty);ty+=50}
   sx.fillStyle=C_SUB;sx.font="30px Karla, sans-serif";ty+=8;const dl=wrap(pr.desc,cw-64);if(dl.length>4){dl.length=4;dl[3]=dl[3].replace(/[ ,.]*$/,"")+"…"}for(const l of dl){sx.fillText(l,x+32,ty);ty+=40}
   sx.font="600 24px Karla, sans-serif";const rows=[];                            // tech badges, first-fit packed into rows
   for(const tg of pr.tags){const bw=sx.measureText(tg).width+30;let row=rows.find(r=>r.x+bw<=cw-64);if(!row)rows.push(row={x:0,items:[]});row.items.push([tg,row.x,bw]);row.x+=bw+12}
   rows.forEach((row,ri)=>row.items.forEach(([tg,ox,bw])=>{const bx=x+32+ox,by=ty+10+ri*54;if(by+46>y+ch-18)return;
    rr(bx,by,bw,46,23);sx.fillStyle="rgba(232,180,74,.13)";sx.fill();sx.fillStyle=C_GOLD;sx.fillText(tg,bx+15,by+32)}))
   if(st.hover!=null&&st.hover!==i){sx.globalAlpha=.6*k;rr(x,y,cw,ch,32);sx.fillStyle="#06121A";sx.fill()} // dim cards behind the hologram
   sx.globalAlpha=1})}
 scrTex.needsUpdate=true}
let screenMode="idle";drawScreen({mode:"idle"});document.fonts.ready.then(()=>{if(screenMode==="idle")drawScreen({mode:"idle"})});
item("Projects",null,"Let me show you my projects.",
 g=>{box(2,1.2,.1,0x2B2D42,.2,3,-4,g);add(new THREE.BoxGeometry(1.85,1.05,.02),new THREE.MeshBasicMaterial({map:scrTex}),.2,3,-3.94,g);screenMesh=g.children[g.children.length-1];box(.15,.36,.12,0x2B2D42,.2,2.28,-4.06,g)});
box(1.1,.05,.36,0x24233A,-.6,2.13,-2.85);box(1.02,.02,.28,0x3B3A55,-.6,2.165,-2.85);
let phoneMesh=null;
item("Contact",null,"",g=>{phoneMesh=box(.3,.06,.55,0xFF7A59,1.4,2.13,-3,g);
 const c=document.createElement("canvas");c.width=256;c.height=480;const x=c.getContext("2d");const gr=x.createLinearGradient(0,0,0,480);gr.addColorStop(0,"#13343C");gr.addColorStop(1,"#0B1E26");x.fillStyle=gr;x.fillRect(0,0,256,480);
 x.strokeStyle="#E8B44A";x.lineWidth=8;x.strokeRect(70,150,116,84);x.beginPath();x.moveTo(70,150);x.lineTo(128,200);x.lineTo(186,150);x.stroke();
 x.fillStyle="#EEF0EC";x.font="600 44px Karla, sans-serif";x.textAlign="center";x.fillText("Let's",128,300);x.fillText("talk",128,350);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const sc=new THREE.Mesh(new THREE.PlaneGeometry(.25,.47),new THREE.MeshBasicMaterial({map:t}));sc.rotation.x=-Math.PI/2;sc.position.y=.032;phoneMesh.add(sc);
 phoneMesh.userData.home=phoneMesh.position.clone();phoneMesh.userData.homeQ=phoneMesh.quaternion.clone()});
// Services: board on the BACK wall (the old left-wall board was edge-on to the eye-level camera)
const SVW=1600,SVH=1000,svC=document.createElement("canvas");svC.width=SVW;svC.height=SVH;const sv=svC.getContext("2d");
const svTex=new THREE.CanvasTexture(svC);svTex.colorSpace=THREE.SRGBColorSpace;svTex.anisotropy=8;
const SERVICES=[["AI chatbots","Assistants that answer questions from your own content and hand off to a person when needed.","chat"],
 ["AI agents","Agents that read, decide and act inside the tools your business already uses.","agent"],
 ["Workflow automation","Pipelines that move data between systems so repetitive steps run on their own.","flow"],
 ["AI-powered websites","Sites that explain your business with voice, 3D and interactive demos, like this one.","web"]];
let svActive=-1;
// Each service tile can play a tiny live demo of what that service does (drawn into the board texture while active).
function svDemo(ic,x,y,w,h,p){const g=sv;g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.textBaseline="alphabetic";
 const bub=(bx,by,bw,bh,fill,txt,col,k,right)=>{if(k<=0)return;g.globalAlpha=Math.min(1,k);g.fillStyle=fill;g.beginPath();g.roundRect(bx+(right?1:-1)*(1-Math.min(1,k))*30,by,bw,bh,18);g.fill();g.fillStyle=col;g.font="600 26px Karla, sans-serif";g.fillText(txt,bx+20+(right?1:-1)*(1-Math.min(1,k))*30,by+bh/2+9);g.globalAlpha=1};
 if(ic==="chat"){const q="Do you ship on Sundays?",a2="Yes, orders before 2 pm ship same day.";
  bub(x+w-360,y+6,350,52,"rgba(232,180,74,.9)",q,"#121619",(p-.04)/.12,true);
  if(p>.3&&p<.48){for(let i=0;i<3;i++){g.fillStyle="#8CF0E6";g.globalAlpha=.4+.6*Math.abs(Math.sin(p*40+i));g.beginPath();g.arc(x+30+i*22,y+100,7,0,7);g.fill()}g.globalAlpha=1}
  if(p>=.48){const n=Math.floor(clamp((p-.48)/.35,0,1)*a2.length);bub(x,y+76,w-40,52,"rgba(140,240,230,.18)",a2.slice(0,n),"#E9FBF8",1,false)}
  if(p>.9){g.fillStyle="#8CF0E6";g.font="600 22px Karla, sans-serif";g.fillText("Answered in 1 second, from your own FAQ",x,y+h-8)}}
 else if(ic==="agent"){const st=["Read email","Decide","Update CRM","Reply"],n=st.length,sw=w/n,cur2=p*n*1.05;
  g.strokeStyle="rgba(140,240,230,.35)";g.lineWidth=4;g.beginPath();g.moveTo(x+sw/2,y+58);g.lineTo(x+w-sw/2,y+58);g.stroke();
  g.strokeStyle="#8CF0E6";g.beginPath();g.moveTo(x+sw/2,y+58);g.lineTo(x+sw/2+Math.min(1,cur2/(n-1))*(w-sw),y+58);g.stroke();
  st.forEach((l,i)=>{const cx=x+sw/2+i*sw,done=cur2>i+.5,on=Math.floor(cur2)===i;g.fillStyle=done?"#E8B44A":on?"#8CF0E6":"#2B3B44";g.beginPath();g.arc(cx,y+58,on?24:20,0,7);g.fill();
   if(done){g.strokeStyle="#121619";g.lineWidth=5;g.beginPath();g.moveTo(cx-9,y+58);g.lineTo(cx-2,y+66);g.lineTo(cx+11,y+50);g.stroke()}
   g.textAlign="center";g.fillStyle=done||on?"#EEF0EC":"#8FA3AA";g.font="600 24px Karla, sans-serif";g.fillText(l,cx,y+118);g.textAlign="left"});
  g.fillStyle="#B9CED4";g.font="24px Karla, sans-serif";g.fillText(p<.95?"Working on: new lead from your website":"Done. A person only sees the summary.",x,y+h-10)}
 else if(ic==="flow"){const N=[["Form",x+60],["Sheet",x+w/2],["Email",x+w-60]],yy=y+70;
  g.strokeStyle="rgba(232,180,74,.45)";g.lineWidth=4;g.setLineDash([10,8]);g.lineDashOffset=-p*90;g.beginPath();g.moveTo(N[0][1],yy);g.lineTo(N[2][1],yy);g.stroke();g.setLineDash([]);
  for(let k=0;k<3;k++){const u=(p*2+k/3)%1,px2=N[0][1]+(N[2][1]-N[0][1])*u;g.fillStyle="#8CF0E6";g.fillRect(px2-9,yy-9,18,18)}
  N.forEach(([l,cx],i)=>{const near=Math.min(...[0,1,2].map(k=>Math.abs(((p*2+k/3)%1)-i/2)));const glow=Math.max(0,1-near*12);
   g.fillStyle=glow>.1?"#E8B44A":"#22333C";g.beginPath();g.roundRect(cx-62,yy-34,124,68,14);g.fill();g.strokeStyle="#E8B44A";g.lineWidth=2;g.stroke();
   g.textAlign="center";g.fillStyle=glow>.1?"#121619":"#EEF0EC";g.font="600 26px Karla, sans-serif";g.fillText(l,cx,yy+9);g.textAlign="left"});
  g.fillStyle="#B9CED4";g.font="24px Karla, sans-serif";g.fillText("Every new form entry is logged and answered, no copy-paste.",x,y+h-10)}
 else{const bx=x+10,by=y+4,bw=w-20,bh=h-12;g.strokeStyle="#8CF0E6";g.lineWidth=3;g.beginPath();g.roundRect(bx,by,bw,bh,12);g.stroke();
  [0,1,2].forEach(i=>{g.fillStyle=["#FF7A59","#E8B44A","#8CF0E6"][i];g.beginPath();g.arc(bx+22+i*20,by+18,6,0,7);g.fill()});
  const show=(k,f2)=>{const a3=clamp((p-k)/.08,0,1);if(a3>0){g.globalAlpha=a3;f2();g.globalAlpha=1}};
  show(.08,()=>{g.fillStyle="rgba(232,180,74,.85)";g.fillRect(bx+14,by+34,bw-28,14)});
  show(.2,()=>{g.fillStyle="#EEF0EC";g.font="300 34px Fraunces, serif";g.fillText("Your business, explained",bx+22,by+86)});
  [0,1,2].forEach(i=>show(.34+i*.1,()=>{g.fillStyle="rgba(140,240,230,.2)";g.fillRect(bx+22+i*((bw-60)/3+8),by+102,(bw-60)/3,48)}));
  show(.7,()=>{g.fillStyle="#FF7A59";g.beginPath();g.roundRect(bx+bw-170,by+bh-46,148,36,18);g.fill();g.fillStyle="#fff";g.font="600 22px Karla, sans-serif";g.fillText("Talk to us",bx+bw-150,by+bh-21)});
  if(p>.72){const cxp=bx+bw-100+(1-clamp((p-.72)/.12,0,1))*-160,cyp=by+bh-28+(1-clamp((p-.72)/.12,0,1))*-60;g.fillStyle="#fff";g.beginPath();g.moveTo(cxp,cyp);g.lineTo(cxp+18,cyp+26);g.lineTo(cxp+6,cyp+24);g.lineTo(cxp,cyp+36);g.fill();
   if(p>.85){g.strokeStyle="rgba(255,122,89,"+(1-(p-.85)/.15)+")";g.lineWidth=3;g.beginPath();g.arc(cxp,cyp,10+(p-.85)*300,0,7);g.stroke()}}}
 g.restore()}
function drawServices(active=-1,p=0){const g=sv.createLinearGradient(0,0,SVW,SVH);g.addColorStop(0,"#1D2B33");g.addColorStop(1,"#132028");sv.fillStyle=g;sv.fillRect(0,0,SVW,SVH);
 sv.strokeStyle="#E8B44A";sv.lineWidth=4;sv.strokeRect(22,22,SVW-44,SVH-44);
 sv.fillStyle="#E8B44A";sv.font="300 104px Fraunces, serif";sv.textBaseline="alphabetic";sv.textAlign="left";sv.fillText("What I build",80,160);
 const tw=(SVW-160-40)/2,th=330;SERVICES.forEach(([t,d,ic],i)=>{const x=80+(i%2)*(tw+40),y=220+(i/2|0)*(th+30);
  const on=i===active;sv.save();if(on){sv.shadowColor="rgba(232,180,74,.8)";sv.shadowBlur=40}
  sv.fillStyle=on?"rgba(232,180,74,.12)":"rgba(255,255,255,.04)";sv.beginPath();sv.roundRect(x,y,tw,th,22);sv.fill();sv.strokeStyle=on?"#E8B44A":"rgba(232,180,74,.22)";sv.lineWidth=on?5:2;sv.stroke();sv.restore();
  const cx=x+70,cy=y+76;sv.strokeStyle="#8CF0E6";sv.lineWidth=5;sv.lineCap="round";sv.beginPath();                      // simple line icons
  if(ic==="chat"){sv.roundRect(cx-34,cy-26,68,46,12);sv.moveTo(cx-12,cy+20);sv.lineTo(cx-22,cy+36);sv.lineTo(cx+2,cy+20)}
  else if(ic==="agent"){sv.arc(cx,cy-6,16,0,7);sv.moveTo(cx-30,cy+32);sv.quadraticCurveTo(cx,cy+6,cx+30,cy+32);sv.moveTo(cx+30,cy-28);sv.arc(cx+30,cy-28,6,0,7)}
  else if(ic==="flow"){sv.rect(cx-38,cy-16,22,22);sv.rect(cx+16,cy-16,22,22);sv.moveTo(cx-16,cy-5);sv.lineTo(cx+16,cy-5);sv.moveTo(cx+6,cy-13);sv.lineTo(cx+16,cy-5);sv.lineTo(cx+6,cy+3)}
  else{sv.roundRect(cx-38,cy-28,76,56,8);sv.moveTo(cx-38,cy-14);sv.lineTo(cx+38,cy-14)}
  sv.stroke();sv.fillStyle="#EEF0EC";sv.font="600 50px Karla, sans-serif";sv.fillText(t,x+130,y+92);
  if(on){svDemo(ic,x+40,y+130,tw-80,th-150,p);return}
  sv.fillStyle="#B9CED4";sv.font="34px Karla, sans-serif";let yy=y+168,ln="";for(const w2 of d.split(" ")){const n=ln?ln+" "+w2:w2;if(sv.measureText(n).width>tw-80&&ln){sv.fillText(ln,x+40,yy);yy+=46;ln=w2}else ln=n}sv.fillText(ln,x+40,yy)});
 svTex.needsUpdate=true}
drawServices();document.fonts.ready.then(()=>drawServices(svActive));let svMesh=null;
const SV_POS=new THREE.Vector3(-3.35,3.55,-4.83),SV_SIZE=[2.9,1.81];
item("Services",null,"Here's what I build for clients.",g=>{box(SV_SIZE[0]+.12,SV_SIZE[1]+.12,.05,0xB98A3E,SV_POS.x,SV_POS.y,SV_POS.z-.01,g);
 svMesh=add(new THREE.PlaneGeometry(...SV_SIZE),new THREE.MeshStandardMaterial({map:svTex,emissiveMap:svTex,emissive:0xffffff,emissiveIntensity:.5,roughness:.7}),SV_POS.x,SV_POS.y,SV_POS.z+.02,g)});
// Skills: shelf raised above the host's head so the eye-level view sees it
// Skills library: six hardcover books on a wall shelf, covers facing the room. Clicking one pulls it off the shelf,
// it flies into Abdur's hands, opens, and the orbital skills experience spins up out of its pages.
const SK_POS=new THREE.Vector3(3.3,5.05,-4.66);
// Book content comes from the CV only: what each skill is for, what I know, where I used it.
const BOOKS=[{title:"Python",sub:"Language",col:"#264E73",acc:"#FFD43B",art:"py",use:"My everyday language for ML, data and backend work.",
  know:["NumPy","Pandas","OpenCV","MediaPipe","Librosa"],used:["Vocal View","Bilingual Complaint Mapping","Audio classifier at SpaceDome","Neural network from scratch"]},
 {title:"PyTorch",sub:"Deep learning",col:"#5E1A12",acc:"#FF6A3D",art:"flame",use:"Training and evaluating deep learning models.",
  know:["Training loops","CNNs","Backpropagation","Gradient descent","Activation functions"],used:["Audio classifier at SpaceDome (CNN on mel-spectrograms)","Neural network from scratch, rebuilt in PyTorch"]},
 {title:"Machine Learning",sub:"Models",col:"#14362F",acc:"#8CF0E6",art:"curve",use:"Turning data into models I can trust.",
  know:["Data preprocessing","Model evaluation","Train/test leakage audits","Calibration against expert scores","Weighted scoring"],used:["Vocal View: scores calibrated against expert interviewers","Audio classifier at SpaceDome: leakage audit"]},
 {title:"Deep Learning",sub:"CNNs",col:"#24193F",acc:"#C3B1FF",art:"layers",use:"Neural networks for audio, text and vision.",
  know:["CNNs","Mel-spectrogram features","Hugging Face Transformers","Fine-tuning and LoRA (foundational)"],used:["Audio classifier at SpaceDome","GIKI Advanced AI Bootcamp","Neural network from scratch"]},
 {title:"Django",sub:"Backend",col:"#0B3A26",acc:"#5FD49A",art:"bracket",use:"Shipping models to real users behind REST APIs.",
  know:["Django","Django REST Framework","JWT authentication","PostgreSQL","MySQL"],used:["Bilingual Complaint Mapping","Audio data pipeline at SpaceDome","CodeAlpha internship: REST APIs"]},
 {title:"AI",sub:"LLMs & agents",col:"#3A2414",acc:"#E8B44A",art:"node",use:"Language models, speech and agents in real products.",
  know:["Whisper ASR","Sentence Transformers","Embeddings and RAG","spaCy","LLM applications","Agentic AI"],used:["Vocal View","Bilingual Complaint Mapping","GIKI Advanced AI Bootcamp"]}];
const BK_W=.42,BK_H=.62,BK_D=.12;
function coverTex(bk){const W=512,H=736,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");
 const bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,bk.col);bg.addColorStop(1,"#0B0E10");g.fillStyle=bg;g.fillRect(0,0,W,H);
 g.fillStyle="rgba(0,0,0,.28)";g.fillRect(0,0,26,H);g.fillStyle="rgba(255,255,255,.08)";g.fillRect(26,0,4,H);                 // hinge groove
 g.strokeStyle=bk.acc;g.globalAlpha=.75;g.lineWidth=3;g.strokeRect(54,34,W-88,H-68);g.lineWidth=1.5;g.strokeRect(64,44,W-108,H-88);g.globalAlpha=1;
 const cx=W/2+12,cy=300;g.strokeStyle=bk.acc;g.fillStyle=bk.acc;g.lineWidth=7;g.lineCap="round";g.lineJoin="round";g.beginPath();   // emblem
 if(bk.art==="py"){g.roundRect(cx-70,cy-80,95,95,24);g.moveTo(cx+70,cy+80);g.roundRect(cx-25,cy-15,95,95,24);g.stroke();g.beginPath();g.arc(cx-45,cy-55,8,0,7);g.arc(cx+45,cy+55,8,0,7);g.fill()}
 else if(bk.art==="flame"){g.moveTo(cx,cy-95);g.bezierCurveTo(cx+75,cy-25,cx+70,cy+70,cx,cy+85);g.bezierCurveTo(cx-70,cy+70,cx-75,cy-20,cx-20,cy-60);g.stroke();g.beginPath();g.arc(cx+38,cy-62,9,0,7);g.fill()}
 else if(bk.art==="curve"){for(let i=0;i<14;i++){const x=cx-90+i*14,y=cy+60-((i*37)%61)-i*4;g.beginPath();g.arc(x,y,6,0,7);g.fill()}g.beginPath();g.moveTo(cx-100,cy+70);g.quadraticCurveTo(cx-10,cy+40,cx+100,cy-70);g.stroke()}
 else if(bk.art==="layers"){for(let i=0;i<4;i++){g.strokeRect(cx-95+i*50,cy-85+Math.abs(1.5-i)*20,34,170-Math.abs(1.5-i)*40)}}
 else if(bk.art==="bracket"){g.moveTo(cx-40,cy-80);g.lineTo(cx-90,cy);g.lineTo(cx-40,cy+80);g.moveTo(cx+40,cy-80);g.lineTo(cx+90,cy);g.lineTo(cx+40,cy+80);g.moveTo(cx+18,cy-70);g.lineTo(cx-18,cy+70);g.stroke()}
 else{const P=[[0,-80],[-70,-20],[70,-20],[-45,65],[45,65],[0,10]];P.forEach(([x,y],i)=>P.forEach(([x2,y2],j)=>{if(j>i){g.globalAlpha=.4;g.lineWidth=3;g.beginPath();g.moveTo(cx+x,cy+y);g.lineTo(cx+x2,cy+y2);g.stroke()}}));g.globalAlpha=1;P.forEach(([x,y])=>{g.beginPath();g.arc(cx+x,cy+y,12,0,7);g.fill()})}
 g.textAlign="center";g.fillStyle="#F6EFE2";let fs=bk.title.length>8?78:104;g.font=`600 ${fs}px Fraunces, serif`;
 const words=bk.title.split(" ");let y=530-(words.length-1)*40;words.forEach(wd=>{g.fillText(wd,cx,y);y+=fs*.95});
 g.fillStyle=bk.acc;g.font="600 30px Karla, sans-serif";g.fillText(bk.sub.toUpperCase(),cx,H-78);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
const pagesTex=(()=>{const c=document.createElement("canvas");c.width=64;c.height=256;const g=c.getContext("2d");g.fillStyle="#EDE3CC";g.fillRect(0,0,64,256);
 for(let i=0;i<64;i+=2){g.fillStyle=i%4?"rgba(120,100,70,.18)":"rgba(255,255,255,.3)";g.fillRect(i,0,1,256)}return new THREE.CanvasTexture(c)})();
const pageInner=(()=>{const c=document.createElement("canvas");c.width=256;c.height=360;const g=c.getContext("2d");g.fillStyle="#F3EAD6";g.fillRect(0,0,256,360);
 g.fillStyle="rgba(60,50,40,.25)";for(let y=40;y<330;y+=16)g.fillRect(28,y,200-(y*7%60),4);return new THREE.CanvasTexture(c)})();
// inside pages: left = title page, right = contents (readable when the book is held open)
function innerTex(bk,side){const W=512,H=736,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");
 g.fillStyle="#F1E7D2";g.fillRect(0,0,W,H);const sh=g.createLinearGradient(side?0:W,0,side?60:W-60,0);sh.addColorStop(0,"rgba(90,70,40,.35)");sh.addColorStop(1,"rgba(90,70,40,0)");g.fillStyle=sh;g.fillRect(0,0,W,H);
 g.textAlign="center";g.fillStyle=bk.col;
 if(!side){g.font="600 30px Karla, sans-serif";g.fillText("ABDUR RAFAY",W/2,120);g.font=`600 ${bk.title.length>8?66:92}px Fraunces, serif`;bk.title.split(" ").forEach((wd,i)=>g.fillText(wd,W/2,300+i*80));
  g.fillStyle="#6B5A44";g.font="italic 30px Fraunces, serif";wrapG(g,bk.use,W-120).forEach((l,i)=>g.fillText(l,W/2,470+i*40))}
 else{g.font="600 34px Karla, sans-serif";g.fillText("Contents",W/2,110);g.textAlign="left";g.font="30px Karla, sans-serif";g.fillStyle="#3B3024";
  bk.know.forEach((k,i)=>{g.fillText((i+1)+"   "+k,60,190+i*62);g.fillStyle="rgba(59,48,36,.25)";g.fillRect(60,204+i*62,W-120,2);g.fillStyle="#3B3024"})}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
function wrapG(g,t,mw){const o=[];let l="";for(const w2 of t.split(" ")){const n=l?l+" "+w2:w2;if(g.measureText(n).width>mw&&l){o.push(l);l=w2}else l=n}o.push(l);return o}
const books=BOOKS.map((bk,i)=>{let book;
 item(bk.title,null,"",g=>{book=new THREE.Group();g.add(book);const coverM=new THREE.MeshStandardMaterial({map:coverTex(bk),roughness:.5,metalness:.05});
  const boardM=new THREE.MeshStandardMaterial({color:bk.col,roughness:.55}),pageM=new THREE.MeshStandardMaterial({map:pagesTex,roughness:.9});
  const block=new THREE.Mesh(new THREE.BoxGeometry(BK_W-.02,BK_H-.02,BK_D-.03),[pageM,boardM,pageM,pageM,new THREE.MeshStandardMaterial({map:innerTex(bk,1),roughness:.95}),boardM]);block.position.z=-.005;book.add(block);
  const back=new THREE.Mesh(new THREE.BoxGeometry(BK_W,BK_H,.014),boardM);back.position.z=-BK_D/2+.007;book.add(back);
  const spine=new THREE.Mesh(new THREE.BoxGeometry(.016,BK_H,BK_D),boardM);spine.position.x=-BK_W/2+.008;book.add(spine);
  const hinge=new THREE.Group();hinge.position.set(-BK_W/2,0,BK_D/2-.007);book.add(hinge);                          // front cover swings on the spine
  const cover=new THREE.Mesh(new THREE.BoxGeometry(BK_W,BK_H,.014),[boardM,boardM,boardM,boardM,coverM,new THREE.MeshStandardMaterial({map:innerTex(bk,0),roughness:.95})]);cover.position.x=BK_W/2;hinge.add(cover);
  book.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  const x=1.84+i*.425,lean=[.03,-.02,.04,0,-.03,.02][i];book.position.set(x,SK_POS.y+.05+BK_H/2,SK_POS.z+.08);book.rotation.set(-.05,[.06,-.04,.03,-.07,.05,-.02][i],lean);
  book.userData={home:book.position.clone(),homeQ:book.quaternion.clone(),hinge}});
 return {bk,book}});
item("Skills shelf",null,"",g=>box(2.6,.08,.42,0x6E4A30,2.9,SK_POS.y,SK_POS.z+.03,g));
{const sl=new THREE.SpotLight(0xFFE2B8,14,3.4,.95,.85,1.6);sl.position.set(2.95,SK_POS.y+.95,SK_POS.z+1.3);sl.target.position.set(2.95,SK_POS.y+.35,SK_POS.z);scene.add(sl,sl.target)}
// Coffee: no popup - a short wisp of steam rises from the mug
const MUG=new THREE.Vector3(-1.35,2.25,-2.95);
item("Coffee",null,"That's my coffee. Running on it since day one.",g=>box(.25,.3,.25,0xF2EAF7,MUG.x,MUG.y,MUG.z,g));
const steamTex=(()=>{const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d"),rg=g.createRadialGradient(32,32,2,32,32,30);rg.addColorStop(0,"rgba(255,255,255,.55)");rg.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=rg;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const steam=Array.from({length:7},()=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:steamTex,transparent:true,depthWrite:false,opacity:0}));sp.visible=false;scene.add(sp);return sp});
let steamT0=-99;
function updateSteam(t){const st=t-steamT0;if(st>4.2){if(steam[0].visible)steam.forEach(p=>p.visible=false);return}
 steam.forEach((p,i)=>{const u=((st*.55+i/steam.length)%1),life=Math.min(1,st/.4)*Math.min(1,(4.2-st)/.8);p.visible=true;
  p.position.set(MUG.x+Math.sin(u*6+i)*.05,MUG.y+.2+u*.75,MUG.z+Math.cos(u*5+i)*.03);p.scale.setScalar(.12+u*.28);p.material.opacity=Math.sin(Math.PI*u)*.5*life})}
// Neural network sculpture (replaces the old plant): a live 4-layer network on a brass pedestal; signals fire through it
const NN_POS=new THREE.Vector3(-2.75,0,2.4),NN_L=[6,8,8,2],NN_K=.9,nnNodes=[],nnPos=[],nnEdges=[];let nnGrp,nnPulses=[],nnBurst=0,nnHot=0;

// Neural network sculpture: clicking it opens the digit recognizer pad (below); its neurons light up with the network's activations.
item("Neural network",null,"Click me and draw a digit.",g=>{
 add(new THREE.CylinderGeometry(.42,.52,.42,40),new THREE.MeshStandardMaterial({color:0x1A1424,roughness:.35,metalness:.6}),NN_POS.x,.21,NN_POS.z,g);
 add(new THREE.CylinderGeometry(.44,.44,.04,40),new THREE.MeshStandardMaterial({color:0xB98A3E,roughness:.3,metalness:.9}),NN_POS.x,.44,NN_POS.z,g);
 add(new THREE.CylinderGeometry(.02,.02,.45,8),new THREE.MeshStandardMaterial({color:0xB98A3E,metalness:.9,roughness:.3}),NN_POS.x,.67,NN_POS.z,g);
 nnGrp=new THREE.Group();nnGrp.position.set(NN_POS.x,1.3,NN_POS.z);nnGrp.scale.setScalar(NN_K);g.add(nnGrp);
 NN_L.forEach((n,l)=>{const row=[];for(let k=0;k<n;k++){const a=k/n*Math.PI*2+l*.4,r=n>3?.42:.2,v=new THREE.Vector3(-.75+l*.5,Math.sin(a)*r,Math.cos(a)*r);
   const m=new THREE.Mesh(new THREE.SphereGeometry(.05,16,12),new THREE.MeshStandardMaterial({color:l%3===0?0xE8B44A:0x8CF0E6,emissive:l%3===0?0xE8B44A:0x8CF0E6,emissiveIntensity:.35,roughness:.3}));
   m.position.copy(v);nnGrp.add(m);row.push(m);m.userData.flash=0}nnNodes.push(row);nnPos.push(row.map(m=>m.position))});
 for(let l=0;l<NN_L.length-1;l++){const pts=[];nnPos[l].forEach(a=>nnPos[l+1].forEach(b=>pts.push(a,b)));
  const ln=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xE8B44A,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}));nnGrp.add(ln);nnEdges.push(ln)}
 add(new THREE.SphereGeometry(.9,24,16),new THREE.MeshBasicMaterial({color:0x8CF0E6,transparent:true,opacity:.035,depthWrite:false,blending:THREE.AdditiveBlending}),0,0,0,nnGrp)});
{const nl=new THREE.PointLight(0x8CF0E6,2.2,3.2,1.6);nl.position.set(NN_POS.x,1.3,NN_POS.z);scene.add(nl)}
const nnSpark=(()=>{const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d"),rg=g.createRadialGradient(32,32,1,32,32,30);rg.addColorStop(0,"rgba(255,255,255,1)");rg.addColorStop(.3,"rgba(140,240,230,.8)");rg.addColorStop(1,"rgba(140,240,230,0)");g.fillStyle=rg;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
for(let i=0;i<14;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:nnSpark,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sp.scale.setScalar(.14);sp.visible=false;sp.userData={l:0,a:null,b:null,u:0};nnGrp.add(sp);nnPulses.push(sp)}
const nnRing=new THREE.Mesh(new THREE.RingGeometry(.9,1,64),new THREE.MeshBasicMaterial({color:0x8CF0E6,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));nnRing.rotation.x=-Math.PI/2;nnRing.position.set(NN_POS.x,.03,NN_POS.z);scene.add(nnRing);
// --- digit recognizer: a 784-96-10 network trained on MNIST (tools/train_digits.py, 97.6% test accuracy) reads a
// digit the visitor draws. Weights (100 KB) are fetched only when the pad first opens, so page load is unaffected.
const DG={on:false,t0:-9,net:null,A:[],ink:false,el:document.createElement("div")};
DG.el.className="dg";DG.el.setAttribute("role","dialog");DG.el.setAttribute("aria-label","Digit recognizer");
DG.el.innerHTML='<header><b>Draw a digit, 0 to 9</b><button class="dg-x" aria-label="Close">&times;</button></header><canvas width="280" height="280" aria-label="Drawing pad"></canvas>'+
 '<div class="dg-out"><div class="dg-big">?</div><div class="dg-bars"></div></div><p class="dg-note">A real neural network trained on 60,000 handwritten digits, running in your browser.</p><button class="dg-clear">Clear</button>';
document.body.append(DG.el);
const dgC=DG.el.querySelector("canvas"),dgX=dgC.getContext("2d"),dgBars=DG.el.querySelector(".dg-bars"),dgBig=DG.el.querySelector(".dg-big");
dgBars.innerHTML=[...Array(10)].map((_,i)=>`<span><i style="height:0"></i><small>${i}</small></span>`).join("");
const dgB64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function dgLoad(){if(DG.net)return DG.net;const j=await (await fetch("./assets/models/digits.json")).json();
 DG.net=j.layers.map(([r,c,sc,w,b])=>({r,c,W:Float32Array.from(new Int8Array(dgB64(w).buffer),v=>v*sc),b:new Float32Array(dgB64(b).buffer)}));return DG.net}
function dgClear(){dgX.fillStyle="#000";dgX.fillRect(0,0,280,280);DG.ink=false;dgBig.textContent="?";dgBars.querySelectorAll("i").forEach(i=>i.style.height="0")}
// MNIST-style input: crop the ink, fit it into 20x20, centre its mass in a 28x28 frame
function dgInput(){const d=dgX.getImageData(0,0,280,280).data;let x0=280,y0=280,x1=-1,y1=-1;
 for(let y=0;y<280;y++)for(let x=0;x<280;x++)if(d[(y*280+x)*4]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
 if(x1<0)return null;const w=x1-x0+1,h=y1-y0+1,k=20/Math.max(w,h),c=document.createElement("canvas");c.width=c.height=28;const g=c.getContext("2d");
 g.fillStyle="#000";g.fillRect(0,0,28,28);g.drawImage(dgC,x0,y0,w,h,14-w*k/2,14-h*k/2,w*k,h*k);
 const p=g.getImageData(0,0,28,28).data,v=new Float32Array(784);let m=0,mx=0,my=0;for(let i=0;i<784;i++){v[i]=p[i*4]/255;m+=v[i];mx+=v[i]*(i%28);my+=v[i]*(i/28|0)}
 const sx=Math.round(14-mx/m),sy=Math.round(14-my/m),o=new Float32Array(784);
 for(let y=0;y<28;y++)for(let x=0;x<28;x++){const X=x-sx,Y=y-sy;if(X>=0&&X<28&&Y>=0&&Y<28)o[y*28+x]=v[Y*28+X]}return o}
function dgForward(x){DG.A=[x];let a=x;DG.net.forEach((L,li)=>{const z=new Float32Array(L.c);for(let j=0;j<L.c;j++){let s=L.b[j];for(let i=0;i<L.r;i++)s+=a[i]*L.W[i*L.c+j];z[j]=li<DG.net.length-1?Math.max(0,s):s}a=z;DG.A.push(z)});
 const m=Math.max(...a),e=a.map(v=>Math.exp(v-m)),S=e.reduce((p,q)=>p+q,0);return e.map(v=>v/S)}
function dgPredict(){if(!DG.net||!DG.ink)return;const x=dgInput();if(!x)return;const p=dgForward(x),best=p.indexOf(Math.max(...p));
 dgBig.textContent=best;dgBig.style.opacity=.4+.6*p[best];dgBars.querySelectorAll("i").forEach((el,i)=>{el.style.height=Math.round(p[i]*100)+"%";el.classList.toggle("top",i===best)});
 nnBurst=Math.max(nnBurst,.6);DG.best=best;DG.conf=p[best]}
let dgDown=false,dgLast=null,dgT=0;
const dgPos=e=>{const r=dgC.getBoundingClientRect();return [(e.clientX-r.left)*280/r.width,(e.clientY-r.top)*280/r.height]};
dgC.addEventListener("pointerdown",e=>{dgDown=true;dgLast=dgPos(e);dgC.setPointerCapture(e.pointerId);e.preventDefault()});
dgC.addEventListener("pointermove",e=>{if(!dgDown)return;const p=dgPos(e);dgX.strokeStyle="#fff";dgX.lineWidth=20;dgX.lineCap=dgX.lineJoin="round";
 dgX.beginPath();dgX.moveTo(...dgLast);dgX.lineTo(...p);dgX.stroke();dgLast=p;DG.ink=true;const n=performance.now();if(n-dgT>120){dgT=n;dgPredict()}});
dgC.addEventListener("pointerup",()=>{dgDown=false;dgPredict();if(DG.best!=null&&!DG.spoke){DG.spoke=true;say("I think that's a "+DG.best+".")}});
DG.el.querySelector(".dg-clear").onclick=()=>{dgClear();DG.spoke=false};DG.el.querySelector(".dg-x").onclick=()=>mrToggle();
addEventListener("keydown",e=>{if(DG.on&&e.key==="Escape"){e.stopImmediatePropagation();mrToggle()}},true);
dgClear();
function mrToggle(){DG.on=!DG.on;DG.el.classList.toggle("on",DG.on);document.body.classList.toggle("mr",DG.on);
 if(DG.on){DG.t0=clock.getElapsedTime();nnBurst=1;nnSfx();dgClear();DG.spoke=false;dgLoad().catch(()=>dgBig.textContent="!");say("Draw a digit on the pad. My neural network will read it.")}}
function nnSfx(){if(!actx)return;const t0=actx.currentTime,o=actx.createOscillator(),g=actx.createGain();o.type="sine";o.frequency.setValueAtTime(90,t0);o.frequency.exponentialRampToValueAtTime(880,t0+.7);
 g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(.12,t0+.5);g.gain.exponentialRampToValueAtTime(.0001,t0+.9);o.connect(g).connect(actx.destination);o.start(t0);o.stop(t0+1)}
function updateNN(t,dt){const hovered=hover&&hover.userData.label==="Neural network";nnHot+=((hovered||DG.on?1:0)-nnHot)*Math.min(1,dt*5);
 nnGrp.rotation.y+=dt*(.12+nnHot*.5);nnBurst=Math.max(DG.on?.3:nnHot*.4,nnBurst-dt*.5);nnGrp.scale.setScalar(NN_K*(1+nnHot*.1));
 nnEdges.forEach(ln=>ln.material.opacity=.22+nnHot*.3);
 const rp=clamp((t-DG.t0)/1.1,0,1);nnRing.scale.setScalar(.4+rp*4);nnRing.material.opacity=rp<1?(1-rp)*.9:0;          // activation shockwave
 if(DG.on&&DG.A.length)DG.A.slice(1).forEach((a,l)=>Array.from(a).slice(0,NN_L[l+1]).forEach((v,i)=>{const m=nnNodes[l+1]&&nnNodes[l+1][i];if(m)m.userData.flash=Math.max(m.userData.flash,Math.min(1.5,Math.abs(v)*1.4))}));  // neurons glow with the live activations
 for(const sp of nnPulses){const d=sp.userData;
  if(!sp.visible){if(Math.random()<(reduce?0:.015+nnBurst*.2)){d.l=Math.random()*(NN_L.length-1)|0;d.ai=Math.random()*NN_L[d.l]|0;d.bi=Math.random()*NN_L[d.l+1]|0;d.u=0;sp.visible=true}continue}
  d.u+=dt*(1.1+nnBurst*1.5);sp.position.lerpVectors(nnPos[d.l][d.ai],nnPos[d.l+1][d.bi],Math.min(1,d.u));
  if(d.u>=1){sp.visible=false;nnNodes[d.l+1][d.bi].userData.flash=1;if(d.l+1<NN_L.length-1&&Math.random()<.6){d.l++;d.ai=d.bi;d.bi=Math.random()*NN_L[d.l+1]|0;d.u=0;sp.visible=true}}}  // signal propagates forward
 nnNodes.flat().forEach(m=>{m.userData.flash=Math.max(0,m.userData.flash-dt*2.5);m.material.emissiveIntensity=.35+m.userData.flash*2.2;m.scale.setScalar(1+m.userData.flash*.5)})}

// About me: a gallery-style poster on the wall above the monitor - duotone portrait in the room's palette,
// name, role and positioning, lit by a brass picture light. Photo is git-ignored (see README).
const ABOUT_IMG="./assets/images/about.jpg";
const PW=1600,PH=900,poster=document.createElement("canvas");poster.width=PW;poster.height=PH;const px=poster.getContext("2d");
const posterTex=new THREE.CanvasTexture(poster);posterTex.colorSpace=THREE.SRGBColorSpace;posterTex.anisotropy=8;
const ABOUT={role:"AI Agents & Automation Engineer",now:"Now: Workflow Engineer Intern at SpaceDome",line:"I build AI systems that run in production: speech and ML models, LLM pipelines, and the automation and APIs around them.",
 facts:[["BS Software Engineering","CGPA 3.43"],["Advanced AI Bootcamp","GIKI, 2026"],["Best Outstanding Performance","Codex 3.0"]]};
function duotone(img,sx0,sy0,sw,shh,w,h){const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d");g.drawImage(img,sx0,sy0,sw,shh,0,0,w,h);
 const d=g.getImageData(0,0,w,h),D=d.data,A=[26,18,38],B=[176,96,92],C=[246,206,128];       // plum shadows -> clay mids -> gold highlights
 for(let i=0;i<D.length;i+=4){let l=(D[i]*.3+D[i+1]*.59+D[i+2]*.11)/255;l=Math.min(1,Math.max(0,(l-.08)*1.25));l=l*l*(3-2*l);
  const [p,q,t]=l<.5?[A,B,l*2]:[B,C,(l-.5)*2];for(let k=0;k<3;k++)D[i+k]=p[k]+(q[k]-p[k])*t}
 g.putImageData(d,0,0);return c}
function drawPoster(img){const g=px.createLinearGradient(0,0,PW,PH);g.addColorStop(0,"#1C2328");g.addColorStop(1,"#14181B");px.fillStyle=g;px.fillRect(0,0,PW,PH);
 const ph=PH-120,pw=Math.round(ph*.78),ox=60,oy=60;
 if(img){const s=Math.min(img.width,img.height),cw2=s*.78;px.drawImage(duotone(img,(img.width-cw2)/2,0,cw2,s,pw,ph),ox,oy);
  const v=px.createLinearGradient(0,oy+ph*.55,0,oy+ph);v.addColorStop(0,"rgba(16,20,23,0)");v.addColorStop(1,"rgba(16,20,23,.75)");px.fillStyle=v;px.fillRect(ox,oy,pw,ph)}
 px.strokeStyle="#E8B44A";px.lineWidth=3;px.strokeRect(ox-14,oy-14,pw+28,ph+28);                                 // offset gold keyline
 const tx=ox+pw+90,tw=PW-tx-80;px.textBaseline="alphabetic";
 px.fillStyle="#EEF0EC";px.font="300 132px Fraunces, serif";px.fillText("Abdur",tx,250);px.fillText("Rafay",tx,380);
 px.fillStyle="#E8B44A";px.font="600 40px Karla, sans-serif";px.fillText(ABOUT.role,tx,460);
 px.fillStyle="#8CF0E6";px.font="600 32px Karla, sans-serif";px.beginPath();px.arc(tx+10,PH-118,9,0,7);px.fill();px.fillText(ABOUT.now,tx+34,PH-107);
 px.fillStyle="#C9D1CE";px.font="34px Karla, sans-serif";let y=540;
 const words=ABOUT.line.split(" ");let ln="";for(const w2 of words){const t=ln?ln+" "+w2:w2;if(px.measureText(t).width>tw&&ln){px.fillText(ln,tx,y);y+=48;ln=w2}else ln=t}px.fillText(ln,tx,y);
 posterTex.needsUpdate=true}
function wrapPoster(t,mw){const out=[];let l="";for(const w2 of t.split(" ")){const n=l?l+" "+w2:w2;if(px.measureText(n).width>mw&&l){out.push(l);l=w2}else l=n}out.push(l);return out}
const aboutImg=new Image();aboutImg.onload=()=>document.fonts.ready.then(()=>drawPoster(aboutImg));aboutImg.onerror=()=>drawPoster(null);aboutImg.src=ABOUT_IMG;drawPoster(null);
const AB_POS=new THREE.Vector3(.2,4.86,-4.82);
item("About me",null,"Here's my story so far.",
 g=>{const pm=new THREE.MeshStandardMaterial({map:posterTex,emissiveMap:posterTex,emissive:0xffffff,emissiveIntensity:.42,roughness:.6});
  add(new THREE.BoxGeometry(2.8,1.575,.04),[M(0x14181B),M(0x14181B),M(0x14181B),M(0x14181B),pm,M(0x14181B)],.2,4.86,-4.82,g);
  box(1.1,.05,.09,0xB98A3E,.2,5.78,-4.68,g);box(.05,.05,.2,0xB98A3E,.2,5.78,-4.77,g)});                           // brass picture light
{const pl=new THREE.SpotLight(0xFFD9A0,9,4.5,.75,.7,1.4);pl.position.set(.2,5.95,-4.35);pl.target.position.set(.2,4.6,-4.8);scene.add(pl,pl.target)}

// Abdur avatar host (demos/shared/rafay-avatar.js)
// The guide loads in the background: the studio renders at once and the host appears when its model arrives
// (it used to block the whole page on a ~5 MB download). Until then `me` is an empty stand-in.
const AV_URL=new URLSearchParams(location.search).get("glb")||"./assets/avatar/me.glb";   // ?glb=<url> tests another model
let me={group:new THREE.Group(),update(){}};
const host=new THREE.Group();host.add(me.group);
(async()=>{
// Guide: realistic Avaturn avatar (owner decision 2026-10-14).
try{me=await loadAvatar(THREE,GLTFLoader,AV_URL,{meshopt:MeshoptDecoder});console.info("avatar loaded",me.info)}
catch(err){console.info("avatar failed, using stylized avatar:",err.message);me=null}
if(!me){me=createRafay(THREE,{outfit:"waistcoat"});me.group.scale.setScalar(.9)}
// Outfit restyle: the navy suit and tie become a black suit (white shirt kept) with a subtle sheen. Done in the shader:
// pixels where blue clearly dominates are desaturated and darkened, so the texture's folds and stitching stay.
else me.group.traverse(o=>{if(!o.isMesh||!/look/i.test(o.name))return;const m=o.material;m.roughness=.85;m.envMapIntensity=.5;
 m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace("#include <map_fragment>",`#include <map_fragment>
  { vec3 c=diffuseColor.rgb; float navy=smoothstep(.01,.05,c.b-max(c.r,c.g)); float l=dot(c,vec3(.2126,.7152,.0722));
    diffuseColor.rgb=mix(c,vec3(l*.55)*vec3(.95,.97,1.),navy); }`)};m.needsUpdate=true});
// fresher skin/cloth: soft image-based reflections on the avatar only (room stays as is)
{const pm=new THREE.PMREMGenerator(r),envTex=pm.fromScene(new RoomEnvironment(),.04).texture;
 me.group.traverse(o=>{if(!o.isMesh)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m&&"envMap" in m){m.envMap=envTex;m.envMapIntensity=.6;m.needsUpdate=true}});o.castShadow=true})}
host.remove(host.children[0]);host.add(me.group)})();
host.position.set(2.6,0,-1.4);host.rotation.y=Math.PI/4;scene.add(host);
host.userData={label:"Abdur",say:"Hey, that's me! Click anything in the studio, or use the map."};


// voice + speech bubble
let talking=false,talkTimer,voice=null;
// most natural young male English voice available (Edge neural voices first, then Chrome/Windows fallbacks)
const VOICE_PREFS=[/Andrew.*Natural/i,/Brian.*Natural/i,/Christopher.*Natural/i,/Guy.*Natural/i,/Eric.*Natural/i,/Ryan.*Natural/i,/Google UK English Male/i,/Daniel/i,/David/i,/Mark/i,/George/i,/James/i,/Alex/i,/Fred/i,/Rishi/i,/Aaron/i,/Arthur/i,/Gordon/i,/Lee/i,/Oliver/i,/Thomas/i];
const FEMALE=/female|zira|aria|jenny|hazel|susan|samantha|libby|sonia|natasha|michelle|ava|emma|karen|moira|tessa|fiona|victoria|allison|serena|kate|heera|veena|catherine|google us english$/i;   // never pick these: no voice gender in the API, so go by name
function pickVoice(){const vs=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));for(const re of VOICE_PREFS){const v=vs.find(x=>re.test(x.name)&&!FEMALE.test(x.name));if(v)return voice=v}
 voice=vs.find(v=>/male/i.test(v.name)&&!FEMALE.test(v.name))||null}   /* null: only female voices on this device; speech then uses a lower pitch */
pickVoice();speechSynthesis.onvoiceschanged=pickVoice;
const bubble=$("bubble");
// Sound is always on. Browsers block audio until the visitor's first click/key, so speech said before that
// is shown in the bubble (mouth still moves) and spoken once audio unlocks.
let unlocked=false,pending=null,actx=null;
function unlock(){if(unlocked)return;unlocked=true;actx=new (window.AudioContext||window.webkitAudioContext)();loadStep();if(pending){const p=pending;pending=null;say(p)}}
["pointerdown","keydown","touchstart"].forEach(ev=>addEventListener(ev,unlock,{once:true,capture:true}));
// footsteps: synthesized (no audio files) - low heel thump + short shoe scuff, slightly varied per step
let stepBuf=null;const loadStep=()=>fetch("./assets/audio/footstep.mp3").then(r=>r.arrayBuffer()).then(b=>actx.decodeAudioData(b)).then(b=>stepBuf=b).catch(()=>{});
function footstep(vol=1){if(!actx)return;const t0=actx.currentTime,v=(.8+Math.random()*.4)*vol;
 if(stepBuf){const s=actx.createBufferSource(),g=actx.createGain();s.buffer=stepBuf;s.playbackRate.value=.92+Math.random()*.16;g.gain.value=.8*v;s.connect(g).connect(actx.destination);s.start(t0);return} // recorded step, pitch/volume varied
 const o=actx.createOscillator(),og=actx.createGain();o.type="sine";o.frequency.setValueAtTime(95+Math.random()*20,t0);o.frequency.exponentialRampToValueAtTime(45,t0+.09);
 og.gain.setValueAtTime(.55*v,t0);og.gain.exponentialRampToValueAtTime(.001,t0+.11);o.connect(og).connect(actx.destination);o.start(t0);o.stop(t0+.12);
 const n=actx.createBufferSource(),buf=actx.createBuffer(1,actx.sampleRate*.08,actx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
 const bp=actx.createBiquadFilter(),ng=actx.createGain();bp.type="bandpass";bp.frequency.value=1400+Math.random()*700;bp.Q.value=.9;ng.gain.value=.28*v;
 n.buffer=buf;n.connect(bp).connect(ng).connect(actx.destination);n.start(t0+.005)}
// Recorded voice: every fixed line is pre-generated as an mp3 in one male neural voice (tools/make_voice.py), so all
// browsers and devices sound the same. Files are named by a hash of the text; lines without a file (e.g. ones that
// include the visitor's name) fall back to the browser's male voice.
const vkey=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(16).padStart(8,"0")};
let VOICE_FILES=new Set(),vAudio=null;fetch("./assets/voice/index.json").then(r=>r.json()).then(a=>VOICE_FILES=new Set(a)).catch(()=>{});
function allLines(){const L=new Set([...Object.values(LINES).map(f=>f()),...Object.values(HINTS),...SV_LINES,...BOOKS.map(b=>b.title+". "+b.use),...BOOKS.map(b=>b.title+". Let me open it for you."),
 P.intro+" Click anything in my studio to explore.","Hi, I'm Abdur! Click anything in my studio, or use the buttons, to explore.","Got your message. Thank you!","Draw a digit on the pad. My neural network will read it.",...[...Array(10)].map((_,d)=>"I think that's a "+d+"."),host.userData.say]);items.forEach(o=>o.userData.say&&L.add(o.userData.say));return [...L]}
function say(t){bubble.textContent=t;bubble.classList.add("on");clearTimeout(talkTimer);speechSynthesis.cancel();if(vAudio){vAudio.pause();vAudio=null}
 if(!unlocked)pending=t;
 const done=()=>{talking=false;if(cur!=="studio")bubble.classList.remove("on")};
 if(unlocked&&VOICE_FILES.has(vkey(t))){const a=vAudio=new Audio("./assets/voice/"+vkey(t)+".mp3");a.onplay=()=>talking=true;a.onended=()=>{if(vAudio===a){vAudio=null;done()}};
  a.play().catch(()=>{if(vAudio===a){vAudio=null;talking=false}});return}
 if(unlocked){if(!voice)pickVoice();const u=new SpeechSynthesisUtterance(t);if(voice)u.voice=voice;u.rate=1;u.pitch=voice?1:.6;u.onstart=()=>talking=true;u.onend=done;speechSynthesis.speak(u)}
 else{talking=true;talkTimer=setTimeout(()=>talking=false,Math.min(t.length*45,5000))}}
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{unlock();const g=b.dataset.go;if(g==="skills")pickBook(selBook);else goTo(g)});
$("meet").onclick=()=>{unlock();say(P.intro+" Click anything in my studio to explore.")};

say("Hi, I'm Abdur! Click anything in my studio, or use the buttons, to explore.");

// camera framing
let offX=0,offY=0,s=6.5;
let asp=1,compact=false,land=false;function setFrustum(k,u=0,v=0){Object.assign(cam,{left:-s*asp-offX*k-v*s*asp,right:s*asp-offX*k-v*s*asp,top:s-offY*k-u*s,bottom:-s-offY*k-u*s})}
function size(){const w=innerWidth,h=innerHeight,a=w/h;asp=a;const wasC=compact;compact=w<900||h<520;land=compact&&w>h;
 document.body.classList.toggle("compact",compact);document.body.classList.toggle("land",land);r.setPixelRatio(Math.min(devicePixelRatio,compact?1.5:2));   // lighter rendering on phones/tablets
 if(window.__sheetReady&&wasC!==compact)refreshSheet();s=Math.max(6.5,7/a);offX=w>800?s*a*.36:0;offY=w>800?0:s*.3;
 Object.assign(cam,{left:-s*a-offX,right:s*a-offX,top:s-offY,bottom:-s-offY});cam.updateProjectionMatrix();
 r.setSize(w,h,false)}
addEventListener("resize",size);size();
// camera path: high isometric view -> eye-level view parallel to the workbench, avatar facing camera
const wideT=new THREE.Vector3(-.6,4.2,-1),frontT=new THREE.Vector3(2.6,3.1,-1.4),tgt=wideT.clone(),camDir=new THREE.Vector3();
const isoDir=new THREE.Vector3(1,1,1).normalize(),frontDir=new THREE.Vector3(0,.06,1).normalize();let zoom=.92,f=0;
const smooth=x=>x*x*(3-2*x);
const forced=location.hash.startsWith("#p=")?parseFloat(location.hash.slice(3)):null; // dev: freeze intro at progress 0..1

// picking
const ray=new THREE.Raycaster(),mv=new THREE.Vector2(),tip=$("tip"),panel=$("panel");let mx=0,my=0,hover=null;
const pick=e=>{if(nav||!introDone)return null;mv.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(mv,cam);const h=ray.intersectObjects([...items,host],true)[0];
 let o=h&&h.object;while(o&&!o.userData.label)o=o.parent;return o||null};
addEventListener("pointermove",e=>{mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1;hover=e.target===canvas?pick(e):null;
 canvas.style.cursor=hover?"pointer":"";tip.style.display=hover?"block":"none";if(hover){tip.textContent=hover.userData.label;tip.style.left=e.clientX+14+"px";tip.style.top=e.clientY+"px"}});
// Every object is a way to another section, from anywhere: the host walks straight there (no return trip to the studio).
const SECTION_OF={"Projects":"projects","Services":"services","About me":"about"};
canvas.addEventListener("click",e=>{if(cur==="projects"&&screenMode==="cards"&&cardAt(e)>=0)return;
 if(cur==="services"&&!nav){const ti=boardTileAt(e);if(ti>=0){pickTile(ti);return}}
 const o=pick(e);if(!o){if(!nav&&cur!=="studio"&&introDone&&!onPanel(e))goTo("studio");return}   // empty space: back to the studio
 const L=o.userData.label;
 if(L==="Coffee"){steamT0=clock.getElapsedTime();say(o.userData.say);return}
 if(L==="Neural network"){unlock();mrToggle();return}
 if(L==="Contact"){goTo("contact");return}
 if(L==="Abdur"||L==="Guide"){say(o.userData.say);return}
 const bi=BOOKS.findIndex(b=>b.title===L);if(bi>=0||L==="Skills shelf"){pickBook(bi>=0?bi:selBook);return}
 if(SECTION_OF[L])goTo(SECTION_OF[L])});
panel.querySelector("button").onclick=()=>panel.classList.remove("on");
addEventListener("keydown",e=>{if(e.key==="Escape"&&!e.target.closest("#sheet form")){panel.classList.remove("on");goTo("studio")}});
function openContact(){goTo("contact")}
// true when the click lands on something that is part of the current section (screen, board, hologram, projected panels, phone)
const _pr=new THREE.Raycaster(),_pv=new THREE.Vector2();
function onPanel(e){_pv.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);_pr.setFromCamera(_pv,cam);
 return _pr.intersectObjects([screenMesh,svMesh,phoneMesh,holo,fp,bookPanel].filter(m=>m&&m.visible!==false),false).length>0}

// ===================== movement + gestures =====================
// Walk model: step count comes from the distance (about 1.25 units = 0.5 m per step at this scale), stride angle matches
// the step length, phase advances with distance travelled, and stride amplitude follows the current speed.
const STEP_LEN=1.25,LEG=2.1;let strideA=.3;
function walkPlan(d){const n=Math.max(2,Math.round(d/STEP_LEN));return {n,a:Math.asin(Math.min(.42,d/n/2/LEG))}}
function walkProfile(wx,ac=.24){const k=ac*(1-ac),pw=wx<ac?wx*wx/(2*k):wx>1-ac?1-(1-wx)*(1-wx)/(2*k):(wx-ac/2)/(1-ac),env=wx<ac?wx/ac:wx>1-ac?(1-wx)/ac:1;return {pw,env:wx<=0||wx>=1?0:Math.pow(env,.6)}}
const standP=new THREE.Vector3(2.6,0,-1.4),deskP=new THREE.Vector3(-.6,0,-1.95),kbd=new THREE.Vector3(-.6,2.17,-2.85);
const screenC=new THREE.Vector3(.2,3,-3.94),screenT=new THREE.Vector3(-.15,3,-3.94),workDir=new THREE.Vector3(.65,.32,1).normalize(),UP=new THREE.Vector3(0,1,0);
const SV_STAND=new THREE.Vector3(-.85,0,-2.0);
const devTalk=location.hash.includes("talk"),devPresent=location.hash.includes("present"); // dev: force speaking / presenting (preview)
const devGo=(location.hash.match(/go=(\w+)/)||[])[1];                                       // dev: jump straight into a section (preview)
let lastStep=-9,walkEnv=0,stepPh=0,lean=0,typing=false,mainOp=1,revealT0=null,loadP=-1,focus=0,prevFocus=-1,focusT0=0,presentT0=-99;
const mainEl=document.querySelector("main"),backBtn=$("back"),_F=new THREE.Vector3(),_L=new THREE.Vector3(),_T=new THREE.Vector3(),_Pl=new THREE.Vector3(),_C=new THREE.Vector3(),_D=new THREE.Vector3(),_E=new THREE.Vector3();
const isIdle=()=>cur==="studio"&&!nav;

// ---- gestures: spring-driven hand "shapes" while speaking, a one-shot open-palm present, a sustained index point ----
// Offsets are in the body frame: x = outward, y = up, z = forward, relative to a relaxed anchor in front of the hip.
const SHAPES=[{o:[.02,.2,.08],p:.3,l:.5},{o:[.15,.27,.15],p:1,l:1},{o:[-.03,.3,.22],p:.6,l:0},{o:[.06,.12,.05],p:.15,l:.4},{o:[0,0,0],p:0,l:0,rest:1}];
const hands=[{n:"Right",sd:-1},{n:"Left",sd:1}].map(h=>({...h,off:new THREE.Vector3(),vel:new THREE.Vector3(),goal:new THREE.Vector3(),wgt:0,wGoal:0,palm:0,pGoal:0}));
let phoneW=0,phoneU=0;const phoneGrip=new THREE.Vector3();
let gNext=0,lastShape=-1,present=0,presentTarget=new THREE.Vector3(),presentHand="Right",presentKind="palm",holdW=0;
const holdL=new THREE.Vector3(),holdR=new THREE.Vector3();
function nextBeat(){let k;do k=Math.random()*SHAPES.length|0;while(k===lastShape);lastShape=k;const S=SHAPES[k],j=()=>(Math.random()-.5)*.06;
 const [R,Lh]=hands;R.goal.set(S.o[0]+j(),S.o[1]+j(),S.o[2]+j());R.wGoal=S.rest?.35:1;R.pGoal=S.p;
 const useL=Math.random()<S.l;Lh.goal.set(S.o[0]*.8+j(),S.o[1]*.8+j(),S.o[2]*.8+j()).multiplyScalar(useL?1:0);Lh.wGoal=useL?.85:.25;Lh.pGoal=useL?S.p:0;
 return .75+Math.random()*.85}
function updateGestures(t,dt){
 const speaking=(talking||devTalk)&&lean<.05&&holdW<.05;
 if(speaking&&t>gNext)gNext=t+nextBeat();
 if(!speaking)hands.forEach(h=>{h.goal.set(0,0,0);h.wGoal=0;h.pGoal=0});
 const K=26,Cd=2*Math.sqrt(K)*.85;                  // slightly under-damped spring: smooth with a hint of follow-through
 hands.forEach(h=>{_D.copy(h.goal).sub(h.off).multiplyScalar(K).addScaledVector(h.vel,-Cd);h.vel.addScaledVector(_D,dt);h.off.addScaledVector(h.vel,dt);
  const walkScale=walkEnv>.05?(h.n==="Right"?.45:0):1;  // small gestures while walking, left arm keeps swinging
  h.wgt+=(h.wGoal*walkScale-h.wgt)*Math.min(1,dt*3);h.palm+=(h.pGoal*walkScale-h.palm)*Math.min(1,dt*4)});
 const pt=t-presentT0,ss=x=>x*x*(3-2*x);            // open-palm present: rise 0.35-0.8 s, hold, settle by 2.4 s
 present=devPresent?1:pt<0?0:pt<.8?ss(clamp((pt-.35)/.45,0,1)):pt<1.8?1:ss(clamp(1-(pt-1.8)/.6,0,1));
 if(devTalk||devGo&&cur!=="studio")hands.forEach(h=>{h.off.copy(h.goal);h.wgt=h.wGoal;h.palm=h.pGoal})}
const curl={Left:1,Right:1};
// gaze: while speaking, the head turns to the viewer (the camera), never the cursor; out of reach (e.g. at the desk) it stays forward
let lookX=0,lookY=0;
function updateGaze(dt){let gx=0,gy=0;
 if(talking||devTalk){const a=angDiff(host.rotation.y,Math.atan2(camDir.x,camDir.z));if(Math.abs(a)<1.3){gx=clamp(a/.5,-1.6,1.6);gy=clamp(-Math.asin(clamp(camDir.y,-1,1))/.25*.6,-1,1)}}
 const k=Math.min(1,dt*4);lookX+=(gx-lookX)*k;lookY+=(gy-lookY)*k}
const armLens={};function armLen(rig,n){if(!armLens[n]){const A=rig.bone(n+"Arm").getWorldPosition(new THREE.Vector3()),B=rig.bone(n+"ForeArm").getWorldPosition(new THREE.Vector3()),C=rig.bone(n+"Hand").getWorldPosition(new THREE.Vector3());armLens[n]=A.distanceTo(B)+B.distanceTo(C)}return armLens[n]}

const pose=(rig,t)=>{
 const F=_F.set(Math.sin(host.rotation.y),0,Math.cos(host.rotation.y)),left=_L.crossVectors(UP,F).normalize(); // "forward" bend = rotate about the character's left axis
 const ik=(n,target,sd,wt)=>rig.ik(rig.bone(n+"Arm"),rig.bone(n+"ForeArm"),rig.bone(n+"Hand"),target,_Pl.set(0,-1,0).addScaledVector(left,sd*.8).addScaledVector(F,-.45),wt);
 if(walkEnv>0){const a=strideA*walkEnv,sn=Math.sin(stepPh),as=.6*strideA*walkEnv;
  rig.bend(rig.bone("LeftUpLeg"),left,-a*sn);rig.bend(rig.bone("RightUpLeg"),left,a*sn);
  const cs=Math.cos(stepPh),kl=.95*walkEnv*Math.max(0,cs),kr=.95*walkEnv*Math.max(0,-cs); // knee flexes while that leg swings forward
  rig.bend(rig.bone("LeftLeg"),left,kl);rig.bend(rig.bone("RightLeg"),left,kr);
  rig.bend(rig.bone("LeftFoot"),left,-(-a*sn+kl)*.85);rig.bend(rig.bone("RightFoot"),left,-(a*sn+kr)*.85); // keep soles near flat
  rig.bend(rig.bone("LeftArm"),left,as*sn);rig.bend(rig.bone("RightArm"),left,-as*sn);
  rig.bend(rig.bone("LeftForeArm"),left,-(.1+.16*Math.max(0,-sn))*walkEnv);rig.bend(rig.bone("RightForeArm"),left,-(.1+.16*Math.max(0,sn))*walkEnv)}
 const ch=rig.bone("Spine2")&&rig.bone("Spine2").getWorldPosition(_C);
 if(ch&&lean<1)for(const h of hands){const wt=h.wgt*(1-lean)*(1-holdW)*(h.n==="Right"?1-phoneW:1);
  if(wt>.01){_T.copy(ch).addScaledVector(F,.28+h.off.z).addScaledVector(left,h.sd*(.36+h.off.x)).addScaledVector(UP,-.6+h.off.y);ik(h.n,_T,h.sd,wt)}
  if(h.n===presentHand&&present>.01){
   const sh=rig.bone(h.n+"Arm").getWorldPosition(_E);_D.subVectors(presentTarget,sh);
   if(presentKind==="point"){                      // index point: nearly straight arm along the line to the target, wrist aligned
    _D.normalize();const fw=_D.dot(F);if(fw<.3)_D.addScaledVector(F,.3-fw);          // keep the arm in front of the chest (no reaching behind the shoulder)
    if(_D.y>.45*Math.hypot(_D.x,_D.z)){const hz=Math.hypot(_D.x,_D.z);_D.y=.45*hz}_D.normalize(); // and no higher than ~24 degrees: a relaxed point, not a salute
    const reach=armLen(rig,h.n)*.9;_T.copy(sh).addScaledVector(_D,reach);           // 90% reach: soft elbow
    _Pl.set(0,-1,0).addScaledVector(F,-.35).addScaledVector(left,h.sd*.35);             // elbow hangs down, slightly back and out
    rig.ik(rig.bone(h.n+"Arm"),rig.bone(h.n+"ForeArm"),rig.bone(h.n+"Hand"),_T,_Pl,present*(1-lean),true);
    const idx=rig.bone(h.n+"HandIndex1");if(idx)rig.aim(rig.bone(h.n+"Hand"),idx,_E.copy(sh).addScaledVector(_D,3),.7*present);
    const pk=rig.bone(h.n+"HandPinky1");if(idx&&pk){                                     // fold middle, ring and pinky into the palm, tuck the thumb
     const across=_C.subVectors(idx.getWorldPosition(_C),pk.getWorldPosition(_T)).normalize().multiplyScalar(h.sd);
     for(const f of ["Middle","Ring","Pinky"])[1,2,3].forEach(j=>rig.bend(rig.bone(h.n+"Hand"+f+j),across,[.9,1.2,.8][j-1]*present));
     rig.bend(rig.bone(h.n+"HandThumb2"),across,.35*present);rig.bend(rig.bone(h.n+"HandIndex2"),across,.08*present)}}
   else{_D.y*=.45;_D.normalize();_T.copy(sh).addScaledVector(_D,.6).addScaledVector(UP,-.22).addScaledVector(left,h.sd*.1);ik(h.n,_T,h.sd,present*(1-lean))}}
  const palm=presentKind==="point"&&h.n===presentHand?0:Math.max(h.palm*h.wgt,h.n===presentHand?present:0)*(1-lean)*(1-holdW);
  if(palm>.01){const fa=rig.bone(h.n+"ForeArm"),hd=rig.bone(h.n+"Hand");      // supinate: turn the palm up/out around the forearm
   _D.subVectors(hd.getWorldPosition(_E),fa.getWorldPosition(_T)).normalize();rig.bend(hd,_D,h.sd*1.1*palm)}}
 if(phoneW>.01)ik("Right",phoneGrip,-1,phoneW);                                       // holding the phone up to the visitor
 if(holdW>.01){ik("Left",holdL,1,holdW);ik("Right",holdR,-1,holdW);                    // both hands grip the open book's outer edges
  for(const [n,sd] of [["Left",1],["Right",-1]]){const fa=rig.bone(n+"ForeArm"),hd=rig.bone(n+"Hand");_D.subVectors(hd.getWorldPosition(_E),fa.getWorldPosition(_T)).normalize();rig.bend(hd,_D,sd*.7*holdW)}}
 if(lean>0){["Spine","Spine1","Spine2"].forEach((n,i)=>rig.bend(rig.bone(n),left,[.16,.14,.1][i]*lean));
  rig.bend(rig.bone("Neck"),left,.12*lean);rig.bend(rig.bone("Head"),left,.12*lean);
  for(const [n,sd] of [["Left",1],["Right",-1]]){const tp=_T.copy(kbd).addScaledVector(left,sd*.2);
   if(typing)tp.y+=Math.max(0,Math.sin(t*14+sd*1.7))*.035; // typing
   ik(n,tp,sd,lean)}}};
// ---- hologram: hover a card -> it lifts out of the screen, turns to the viewer and expands into a projected panel ----
const HW=1000,HH=1200,holoC=document.createElement("canvas");holoC.width=HW*2;holoC.height=HH*2;const hx=holoC.getContext("2d");hx.scale(2,2);/* drawn at 2x for crisp text */
const holoTex=new THREE.CanvasTexture(holoC);holoTex.colorSpace=THREE.SRGBColorSpace;holoTex.anisotropy=8;
const holoMat=new THREE.MeshBasicMaterial({map:holoTex,transparent:true,depthTest:false,depthWrite:false,opacity:0,toneMapped:false});
const holo=new THREE.Mesh(new THREE.PlaneGeometry(1,1),holoMat);holo.renderOrder=20;holo.visible=false;scene.add(holo);
// scanlines: tiny repeating texture scrolled via offset (no per-frame canvas redraw)
const scanC=document.createElement("canvas");scanC.width=4;scanC.height=8;{const g=scanC.getContext("2d");g.fillStyle="rgba(140,240,230,.10)";g.fillRect(0,0,4,2);g.fillStyle="rgba(140,240,230,.03)";g.fillRect(0,4,4,1)}
const scanTex=new THREE.CanvasTexture(scanC);scanTex.wrapS=scanTex.wrapT=THREE.RepeatWrapping;scanTex.repeat.set(1,90);scanTex.magFilter=THREE.NearestFilter;
const scan=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:scanTex,transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));
scan.renderOrder=21;holo.add(scan);scan.position.z=.001;
// projection beams from the card corners on the screen to the hologram corners
const beamGeo=new THREE.BufferGeometry();beamGeo.setAttribute("position",new THREE.BufferAttribute(new Float32Array(8*3),3));
const beam=new THREE.LineSegments(beamGeo,new THREE.LineBasicMaterial({color:0x8CF0E6,transparent:true,opacity:0,depthTest:false,blending:THREE.AdditiveBlending}));beam.renderOrder=19;beam.frustumCulled=false;scene.add(beam);
const H_SIZE=new THREE.Vector2(1.2,1.44),screenW=1.85,screenH=1.05;
const devHolo=/holo=(\d)/.test(location.hash)?+location.hash.match(/holo=(\d)/)[1]:-1; // dev: open hologram for card N (preview)
let holoIdx=-1,holoK=0,holoT0=0,holoClosing=false,holoDrawn=-1,holoTextK=-1,lastHoloSfx=0;
const _q1=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_hp=new THREE.Vector3(),_hs=new THREE.Vector3(),_cp=new THREE.Vector3(),_cs=new THREE.Vector3();
function cardWorld(i,pos,size){const x=96+i*(CARD.cw+CARD.gap)+CARD.cw/2,y=CARD.top+CARD.ch/2;
 pos.set(screenC.x+(x/1920-.5)*screenW,screenC.y+(.5-y/1080)*screenH,screenC.z+.015);size.set(CARD.cw/1920*screenW,CARD.ch/1080*screenH,1)}
function drawHolo(pr,k){                                   // k: 0..1 text reveal
 hx.clearRect(0,0,HW,HH);const R=36;
 hx.save();hx.beginPath();hx.roundRect(14,14,HW-28,HH-28,R);const bg=hx.createLinearGradient(0,0,0,HH);bg.addColorStop(0,"rgb(12,46,54)");bg.addColorStop(1,"rgb(8,28,37)");/* opaque: nothing shows through the text */hx.fillStyle=bg;hx.fill();
 hx.shadowColor="rgba(140,240,230,.9)";hx.shadowBlur=24;hx.lineWidth=3;hx.strokeStyle="rgba(140,240,230,.85)";hx.stroke();hx.restore();
 hx.strokeStyle="#E8B44A";hx.lineWidth=5;for(const [cx,cy,dx,dy] of [[34,34,1,1],[HW-34,34,-1,1],[34,HH-34,1,-1],[HW-34,HH-34,-1,-1]]){hx.beginPath();hx.moveTo(cx,cy+dy*44);hx.lineTo(cx,cy);hx.lineTo(cx+dx*44,cy);hx.stroke()}
 const show=n=>clamp(k*7-n,0,1);let y=110;hx.textBaseline="alphabetic";hx.textAlign="left";
 const line=(n,font,color,text,x,yy)=>{const a=show(n);if(a<=0)return;hx.globalAlpha=a;hx.font=font;hx.fillStyle=color;hx.fillText(text,x+(1-a)*-16,yy);hx.globalAlpha=1};
 const wr=(t,mw)=>{const o=[];let l="";for(const w2 of t.split(" ")){const n=l?l+" "+w2:w2;if(hx.measureText(n).width>mw&&l){o.push(l);l=w2}else l=n}o.push(l);return o};
 line(0,"34px Karla, sans-serif","#8CF0E6",pr.kind+(pr.stat?"   "+pr.stat:""),72,y);y+=78;
 hx.font="600 62px Karla, sans-serif";for(const l of wr(pr.title,HW-144)){line(.5,"600 62px Karla, sans-serif","#EEF0EC",l,72,y);y+=70}
 y+=14;hx.font="33px Karla, sans-serif";for(const l of wr(pr.summary,HW-144)){line(1.5,"33px Karla, sans-serif","#CFE9E5",l,72,y);y+=46}
 y+=30;pr.points.forEach((pt,j)=>{const a=show(2.6+j*.6);if(a<=0)return;hx.globalAlpha=a;hx.fillStyle="#E8B44A";hx.save();hx.translate(84,y-11);hx.rotate(Math.PI/4);hx.fillRect(-6,-6,12,12);hx.restore();
  hx.font="31px Karla, sans-serif";hx.fillStyle=pt.startsWith("TODO")?"#FF7A59":"#EEF0EC";const ls=wr(pt,HW-200);ls.forEach((l,m)=>hx.fillText(l,112,y+m*40));y+=ls.length*40+16;hx.globalAlpha=1});
 const a=show(5.4);if(a>0){hx.globalAlpha=a;hx.font="600 27px Karla, sans-serif";const rows=[];          // badges first-fit into rows, stacked up from the bottom edge
  for(const tg of pr.tags){const bw=hx.measureText(tg).width+34;let row=rows.find(r=>r.x+bw<=HW-144);if(!row)rows.push(row={x:0,items:[]});row.items.push([tg,row.x,bw]);row.x+=bw+12}
  rows.forEach((row,ri)=>row.items.forEach(([tg,ox,bw])=>{const bx=72+ox,by=HH-110-(rows.length-1-ri)*62;hx.beginPath();hx.roundRect(bx,by,bw,50,25);hx.strokeStyle="rgba(140,240,230,.7)";hx.lineWidth=2;hx.stroke();hx.fillStyle="#8CF0E6";hx.fillText(tg,bx+17,by+35)}))
  hx.globalAlpha=1}
 holoTex.needsUpdate=true}
// sound: synthesized projector power-up / power-down (no audio files)
function holoSfx(open){if(!actx)return;const t0=actx.currentTime,out=actx.createGain();out.gain.value=.5;out.connect(actx.destination);
 const o=actx.createOscillator(),g=actx.createGain();o.type="sine";o.frequency.setValueAtTime(open?320:760,t0);o.frequency.exponentialRampToValueAtTime(open?980:240,t0+(open?.28:.16));
 g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(.09,t0+.03);g.gain.exponentialRampToValueAtTime(.0001,t0+(open?.32:.18));o.connect(g).connect(out);o.start(t0);o.stop(t0+.35);
 if(!open)return;const c=actx.createOscillator(),cg=actx.createGain();c.type="triangle";c.frequency.setValueAtTime(1568,t0+.16);cg.gain.setValueAtTime(.0001,t0+.16);
 cg.gain.exponentialRampToValueAtTime(.05,t0+.19);cg.gain.exponentialRampToValueAtTime(.0001,t0+.6);c.connect(cg).connect(out);c.start(t0+.16);c.stop(t0+.62);
 const n=actx.createBufferSource(),b=actx.createBuffer(1,actx.sampleRate*.35,actx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/d.length)*.5;
 const bp=actx.createBiquadFilter(),ng=actx.createGain();bp.type="bandpass";bp.frequency.setValueAtTime(2400,t0);bp.frequency.exponentialRampToValueAtTime(6000,t0+.35);bp.Q.value=3;ng.gain.value=.05;n.buffer=b;n.connect(bp).connect(ng).connect(out);n.start(t0)}
function holoOpen(i){if(i===holoIdx&&!holoClosing)return;const now=clock.getElapsedTime();
 if(now-lastHoloSfx>.12){holoSfx(true);lastHoloSfx=now}
 holoIdx=i;holoClosing=false;holoT0=devHolo>=0?now-5:now;holoK=0;holoDrawn=-1;holoTextK=-1;holo.visible=true;focus=i;prevFocus=-1;focusT0=now+999;drawScreen({mode:"cards",reveal:9,focus:i,prev:-1,focusK:1,hover:i})}
function holoClose(instant){if(holoIdx<0)return;if(!instant&&!holoClosing)holoSfx(false);holoClosing=true;holoT0=clock.getElapsedTime();
 if(instant){holoIdx=-1;holoK=0;holo.visible=false;beamMat().opacity=0}}
const beamMat=()=>beam.material;
function updateHolo(t){
 if(holoIdx<0)return;const e=clamp((t-holoT0)/(holoClosing?.28:.55),0,1);
 holoK=holoClosing?1-ease(e):1-Math.pow(1-e,3);
 if(holoClosing&&e>=1){holo.visible=false;beamMat().opacity=0;const was=holoIdx;holoIdx=-1;focusT0=t;drawScreen({mode:"cards",reveal:9,focus:was,prev:-1,focusK:1});return}
 const pr=PROJECTS[holoIdx];if(holoDrawn!==holoIdx){holoDrawn=holoIdx;holoTextK=-1}
 const tk2=holoClosing?1:clamp((t-holoT0-.25)/.9,0,1),qk=Math.round(tk2*30)/30;if(qk!==holoTextK){holoTextK=qk;drawHolo(pr,qk)} // redraw only while text reveals
 // transform: from the card's place on the screen -> floating over the screen, turned toward the viewer
 cardWorld(holoIdx,_cp,_cs);_hp.set(screenC.x,screenC.y,screenC.z).addScaledVector(camDir,.9);
 const visH=(cam.top-cam.bottom)/cam.zoom,visW=(cam.right-cam.left)/cam.zoom,fitK=Math.min(1,.8*visH/H_SIZE.y,.42*visW/H_SIZE.x);  // never larger than the view
 _hs.set(H_SIZE.x*fitK,H_SIZE.y*fitK,1);
 const k=holoK,lift=Math.sin(Math.PI*Math.min(1,k))*.035;
 holo.position.lerpVectors(_cp,_hp,k);holo.position.y+=lift+(k>=1?Math.sin(t*1.3)*.012:0);           // gentle float once open
 holo.scale.lerpVectors(_cs,_hs,k);
 _q1.copy(screenMesh.getWorldQuaternion(_q2));holo.quaternion.slerpQuaternions(_q1,cam.quaternion,k);
 const flick=!holoClosing&&t-holoT0<.35?.55+.45*Math.abs(Math.sin((t-holoT0)*60)):1;                    // power-on flicker
 holoMat.opacity=Math.min(1,k*1.4)*flick;scan.material.opacity=holoMat.opacity*.25;scanTex.offset.y=-t*.6;
 // beams: card corners -> hologram corners
 const P2=beamGeo.attributes.position.array,hw=_cs.x/2,hh=_cs.y/2;holo.updateMatrixWorld(true);let o=0;
 for(const [sx2,sy2] of [[-1,-1],[1,-1],[1,1],[-1,1]]){P2[o++]=_cp.x+sx2*hw;P2[o++]=_cp.y+sy2*hh;P2[o++]=_cp.z;_E.set(sx2*.5,sy2*.5,0).applyMatrix4(holo.matrixWorld);P2[o++]=_E.x;P2[o++]=_E.y;P2[o++]=_E.z}
 beamGeo.attributes.position.needsUpdate=true;beamMat().opacity=.55*Math.sin(Math.PI*Math.min(1,k))+.12*k}
// hover hit-test: keep the hologram while the pointer is on it or on its card; otherwise card under pointer
const hray=new THREE.Raycaster(),hv=new THREE.Vector2();let holoLeaveT=null;
function cardAt(e){if(screenMode!=="cards"||!screenMesh)return -2;hv.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);hray.setFromCamera(hv,cam);
 if(holo.visible&&!holoClosing&&hray.intersectObject(holo,false).length)return holoIdx;
 const h=hray.intersectObject(screenMesh,false)[0];if(!h||!h.uv)return -1;const cx=h.uv.x*1920,cy=(1-h.uv.y)*1080;
 for(let i=0;i<PROJECTS.length;i++){const x=96+i*(CARD.cw+CARD.gap);if(cx>=x&&cx<=x+CARD.cw&&cy>=CARD.top&&cy<=CARD.top+CARD.ch)return i}return -1}
function onCardPointer(e,tap){if(compact)return false;const i=cardAt(e);if(i===-2)return false;canvas.style.cursor=i>=0?"pointer":"";
 if(i>=0){holoLeaveT=null;if(tap&&i===holoIdx&&!holoClosing)holoClose(false);else holoOpen(i)}else if(holoIdx>=0&&!holoClosing&&!tap)holoLeaveT=holoLeaveT??clock.getElapsedTime();
 else if(tap)holoClose(false);return true}
addEventListener("pointermove",e=>{if(e.target===canvas)onCardPointer(e,false)});
canvas.addEventListener("click",e=>{if(screenMode==="cards")onCardPointer(e,e.pointerType!=="mouse")});

function panelFrame(g,W,H){const R=40;g.clearRect(0,0,W,H);g.save();g.beginPath();g.roundRect(16,16,W-32,H-32,R);
 const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,"rgba(12,52,60,.9)");bg.addColorStop(1,"rgba(8,30,40,.93)");g.fillStyle=bg;g.fill();
 g.shadowColor="rgba(140,240,230,.9)";g.shadowBlur=26;g.lineWidth=3;g.strokeStyle="rgba(140,240,230,.85)";g.stroke();g.restore();
 g.strokeStyle="#E8B44A";g.lineWidth=6;for(const [cx,cy,dx,dy] of [[38,38,1,1],[W-38,38,-1,1],[38,H-38,1,-1],[W-38,H-38,-1,-1]]){g.beginPath();g.moveTo(cx,cy+dy*56);g.lineTo(cx,cy);g.lineTo(cx+dx*56,cy);g.stroke()}}
const STORY=[["2022","BS Software Engineering","University of Mianwali. Graduated 2026, CGPA 3.43."],
 ["Sep 2024","Software Engineering Intern","CodeAlpha, remote: Django REST APIs with JWT and SQL schemas."],
 ["Nov 2025","Vocal View","Final-year project: multimodal AI interview evaluation, 50+ beta users."],
 ["Jun 2026","Advanced AI Bootcamp","GIKI: LLMs, RAG and multi-agent AI. Built the complaint-mapping system."],
 ["Aug 2026","Workflow Engineer Intern","SpaceDome: speech ML and AI workflows.",true]];
function drawStory(g,W,H,k){panelFrame(g,W,H);g.textBaseline="alphabetic";g.textAlign="left";
 g.fillStyle="#E8B44A";g.font="300 64px Fraunces, serif";g.fillText("My path so far",90,112);
 const x0=250,x1=W-250,ly=190,lk=clamp(k*1.25,0,1);                       // timeline line draws left -> right, milestones light up as it passes
 g.strokeStyle="rgba(140,240,230,.25)";g.lineWidth=6;g.beginPath();g.moveTo(x0,ly);g.lineTo(x1,ly);g.stroke();
 g.strokeStyle="#8CF0E6";g.beginPath();g.moveTo(x0,ly);g.lineTo(x0+(x1-x0)*lk,ly);g.stroke();
 STORY.forEach(([d,t,det,now],i)=>{const nx=x0+i*(x1-x0)/(STORY.length-1),a=clamp((lk*(STORY.length-1)-i)*2+1,0,1);if(a<=0)return;g.globalAlpha=a;
  if(now){g.fillStyle="rgba(140,240,230,.25)";g.beginPath();g.arc(nx,ly,34,0,7);g.fill()}
  g.fillStyle=now?"#8CF0E6":"#E8B44A";g.beginPath();g.arc(nx,ly,now?20:16,0,7);g.fill();
  g.textAlign="center";g.fillStyle=now?"#8CF0E6":"#E8B44A";g.font="600 34px Karla, sans-serif";g.fillText(now?d+"  (now)":d,nx,ly+78);
  g.fillStyle="#EEF0EC";g.font="600 38px Karla, sans-serif";let y=ly+130;for(const l of wrapG(g,t,350).slice(0,2)){g.fillText(l,nx,y);y+=46}
  g.fillStyle="#BFD9D5";g.font="29px Karla, sans-serif";y+=6;for(const l of wrapG(g,det,350).slice(0,4)){g.fillText(l,nx,y);y+=38}
  g.textAlign="left";g.globalAlpha=1})}

// projected panel (shares the hologram look and scanline texture)
const fpC=document.createElement("canvas"),fg=fpC.getContext("2d"),fpTex=new THREE.CanvasTexture(fpC);fpTex.colorSpace=THREE.SRGBColorSpace;fpTex.anisotropy=8;
const fpMat=new THREE.MeshBasicMaterial({map:fpTex,transparent:true,depthTest:false,depthWrite:false,opacity:0});
const fp=new THREE.Mesh(new THREE.PlaneGeometry(1,1),fpMat);fp.renderOrder=20;fp.visible=false;scene.add(fp);
const fpScan=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:scanTex,transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));fpScan.renderOrder=21;fpScan.position.z=.001;fp.add(fpScan);
let fpCfg=null,fpT0=0,fpClosing=false,fpTextK=-1;const _fq=new THREE.Quaternion(),_fs0=new THREE.Vector3(),_fs1=new THREE.Vector3();
function fpOpen(cfg){if(compact)return;fpCfg=cfg;fpClosing=false;fpT0=clock.getElapsedTime()-(devGo?5:0);fpTextK=-1;fpC.width=2048;fpC.height=Math.round(2048*cfg.h/cfg.w);fpTex.dispose();fp.visible=true;holoSfx(true)}
function fpClose(){if(!fpCfg||fpClosing)return;fpClosing=true;fpT0=clock.getElapsedTime();holoSfx(false)}
function updateFP(t){if(!fpCfg)return;const e=clamp((t-fpT0)/(fpClosing?.3:.6),0,1),k=fpClosing?1-ease(e):1-Math.pow(1-e,3);
 if(fpClosing&&e>=1){fp.visible=false;fpCfg=null;return}
 const tk2=fpClosing?1:clamp((t-fpT0-.25)/1.6,0,1),q=Math.round(tk2*40)/40;if(q!==fpTextK){fpTextK=q;fpCfg.draw(fg,fpC.width,fpC.height,q);fpTex.needsUpdate=true}
 fp.position.lerpVectors(fpCfg.from,fpCfg.pos,k);fp.position.y+=k>=1?Math.sin(t*1.3)*.01:0;
 fp.scale.lerpVectors(_fs0.set(.35,.2,1),_fs1.set(fpCfg.w,fpCfg.h,1),k);fp.quaternion.slerpQuaternions(_fq.identity(),cam.quaternion,k);
 const flick=!fpClosing&&t-fpT0<.35?.55+.45*Math.abs(Math.sin((t-fpT0)*60)):1;fpMat.opacity=Math.min(1,k*1.4)*flick;fpScan.material.opacity=fpMat.opacity*.9}

const clock=new THREE.Clock(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;

// ===================== Skills: the library =====================
// Clicking a book flies it into Abdur's hands, opened toward the visitor; its pages project a readable spread:
// what the skill is for, what I know, and where I used it. Clicking another book on the shelf swaps them.
let selBook=0;const bkU=BOOKS.map(()=>0),BK_HOLD_S=1.32;
const _bq=new THREE.Quaternion(),_be=new THREE.Euler(),_bp=new THREE.Vector3(),_bmid=new THREE.Vector3(),_bv=new THREE.Vector3();let bookLight=null,heldBook=-1,bpDrawn=-1,bpTextK=-1,bpT0=0;
const BPW=2048,BPH=1300,bpC=document.createElement("canvas");bpC.width=BPW;bpC.height=BPH;const bg2=bpC.getContext("2d");
const bpTex=new THREE.CanvasTexture(bpC);bpTex.colorSpace=THREE.SRGBColorSpace;bpTex.anisotropy=8;
const bpMat=new THREE.MeshBasicMaterial({map:bpTex,transparent:true,depthTest:false,depthWrite:false,opacity:0});
const bookPanel=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6*BPH/BPW),bpMat);bookPanel.renderOrder=20;bookPanel.visible=false;scene.add(bookPanel);
const bpScan=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6*BPH/BPW),new THREE.MeshBasicMaterial({map:scanTex,transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));bpScan.renderOrder=21;bpScan.position.z=.001;bookPanel.add(bpScan);
const bpBeamGeo=new THREE.BufferGeometry();bpBeamGeo.setAttribute("position",new THREE.BufferAttribute(new Float32Array(8*3),3));
const bpBeam=new THREE.LineSegments(bpBeamGeo,new THREE.LineBasicMaterial({color:0x8CF0E6,transparent:true,opacity:0,depthTest:false,blending:THREE.AdditiveBlending}));bpBeam.renderOrder=19;bpBeam.frustumCulled=false;scene.add(bpBeam);
function drawBookPanel(bk,k){const g=bg2,W=BPW,H=BPH;panelFrame(g,W,H);g.textBaseline="alphabetic";g.textAlign="left";
 const show=n=>clamp(k*6-n,0,1),fade=(n,f2)=>{const a=show(n);if(a>0){g.globalAlpha=a;f2(a);g.globalAlpha=1}};
 fade(0,()=>{g.fillStyle=bk.acc;g.fillRect(96,92,14,150);g.fillStyle="#EEF0EC";g.font="300 120px Fraunces, serif";g.fillText(bk.title,140,190);
  g.fillStyle="#CFE9E5";g.font="44px Karla, sans-serif";g.fillText(bk.use,142,252)});
 const colW=(W-96*2-80)/2,top=360;
 fade(1,()=>{g.fillStyle="#E8B44A";g.font="600 40px Karla, sans-serif";g.fillText("What I know",96,top);g.fillText("Where I used it",96+colW+80,top);
  g.fillStyle="rgba(232,180,74,.35)";g.fillRect(96,top+22,colW,3);g.fillRect(96+colW+80,top+22,colW,3)});
 bk.know.forEach((it,i)=>fade(1.6+i*.35,a=>{const y=top+100+i*96;g.save();g.translate(118,y-14);g.rotate(Math.PI/4);g.fillStyle=bk.acc;g.fillRect(-9,-9,18,18);g.restore();
  g.fillStyle="#EEF0EC";g.font="46px Karla, sans-serif";g.fillText(it,156+(1-a)*-20,y)}));
 bk.used.forEach((it,i)=>{const lines=wrapG((g.font="44px Karla, sans-serif",g),it,colW-70);fade(2.2+i*.4,a=>{const x=96+colW+80,y=top+100+i*150;
  g.fillStyle="#8CF0E6";g.beginPath();g.arc(x+18,y-14,11,0,7);g.fill();g.fillStyle="#EEF0EC";g.font="44px Karla, sans-serif";lines.slice(0,2).forEach((l,j)=>g.fillText(l,x+56+(1-a)*-20,y+j*56))})});
 fade(4.6,()=>{const y=H-112;g.font="34px Karla, sans-serif";g.fillStyle="#9FB8B4";g.fillText("Click another book on the shelf to read it",96,y);
  BOOKS.forEach((b2,i)=>{const x=W-96-(BOOKS.length-i)*58;g.fillStyle=b2.col;g.fillRect(x,y-58,42,72);g.strokeStyle=b2===bk?"#E8B44A":"rgba(255,255,255,.25)";g.lineWidth=b2===bk?5:2;g.strokeRect(x,y-58,42,72)})});
 bpTex.needsUpdate=true}
function pageSfx(){if(!actx)return;const t0=actx.currentTime,n=actx.createBufferSource(),b=actx.createBuffer(1,actx.sampleRate*.28,actx.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<d.length;i++){const u=i/d.length;d[i]=(Math.random()*2-1)*Math.pow(Math.sin(Math.PI*u),2)*.6}
 const f=actx.createBiquadFilter(),g=actx.createGain();f.type="bandpass";f.frequency.setValueAtTime(900,t0);f.frequency.exponentialRampToValueAtTime(3200,t0+.25);f.Q.value=.8;g.gain.value=.22;n.buffer=b;n.connect(f).connect(g).connect(actx.destination);n.start(t0)}
function pickBook(i){unlock();if(cur==="skills"&&!nav){if(i===selBook)return;selBook=i;pageSfx();say(BOOKS[i].title+". "+BOOKS[i].use);if(sheetFor==="skills")renderSheet("skills");return}
 selBook=i;goTo("skills")}
function updateBooks(t,dt){
 const F=_F.set(Math.sin(host.rotation.y),0,Math.cos(host.rotation.y)),left=_L.crossVectors(UP,F).normalize();
 let best=-1,bu=0;
 books.forEach((o,i)=>{const want=actT.skills===1&&i===selBook?1:0;bkU[i]=clamp(bkU[i]+(want?1:-1)*dt/(want?1.25:.9),0,1);if(devGo==="skills"&&want)bkU[i]=1;
  const u=bkU[i],bk=o.book;if(u>bu){bu=u;best=i}
  if(u<=0){bk.position.lerp(bk.userData.home,.25);bk.quaternion.slerp(bk.userData.homeQ,.25);bk.userData.hinge.rotation.y*=.75;bk.scale.setScalar(bk.scale.x+(1-bk.scale.x)*.25);return}
  const W2=BK_W*BK_HOLD_S;                                                     // hold spot: chest height, spread centred on the body
  const hold=_bp.copy(host.position).addScaledVector(F,.5).addScaledVector(left,W2/2);hold.y=2.92;
  const e=ease(u);_bmid.lerpVectors(bk.userData.home,hold,.5);_bmid.y+=.5;_bmid.addScaledVector(F,.6);    // arc off the shelf toward the visitor
  bk.position.set(0,0,0).addScaledVector(bk.userData.home,(1-e)*(1-e)).addScaledVector(_bmid,2*e*(1-e)).addScaledVector(hold,e*e);
  _bq.setFromEuler(_be.set(-.42,host.rotation.y,0,"YXZ"));bk.quaternion.slerpQuaternions(bk.userData.homeQ,_bq,e);
  bk.scale.setScalar(1+(BK_HOLD_S-1)*e);bk.userData.hinge.rotation.y=-2.95*ease(clamp((u-.62)/.38,0,1))});
 heldBook=best;holdW=best>=0?ease(clamp((bu-.7)/.3,0,1)):0;
 if(best>=0){const bk=books[best].book,W=BK_W,H=BK_H;bk.updateMatrixWorld(true);                       // grip points on the spread's outer edges
  bk.localToWorld(holdL.set(W/2-.03,-H*.18,BK_D/2));bk.userData.hinge.localToWorld(holdR.set(W-.03,-H*.18,-.01))}
 if(!bookLight){bookLight=new THREE.PointLight(0x8CF0E6,0,2.6,1.4);scene.add(bookLight)}
 const openK=best>=0?ease(clamp((bu-.75)/.25,0,1)):0;
 if(best>=0)bookLight.position.copy(books[best].book.position).addScaledVector(F,.3);bookLight.intensity=openK*1.6;
 // projected spread: rises from the pages once the book is open; flips when the book changes
 const pk=best>=0?ease(clamp((bu-.85)/.15,0,1)):0;
 if(pk<=0){bookPanel.visible=false;bpBeam.material.opacity=0;bpDrawn=-1;return}
 if(bpDrawn!==best){bpDrawn=best;bpTextK=-1;bpT0=devGo==="skills"?t-5:t;if(pk>0)holoSfx(true)}
 const tk=clamp((t-bpT0-.2)/1.4,0,1),q=Math.round(tk*36)/36;if(q!==bpTextK){bpTextK=q;drawBookPanel(BOOKS[best],q)}
 if(compact){bookPanel.visible=false;bpBeam.material.opacity=0;return}
 bookPanel.visible=true;const bk=books[best].book;
 bookPanel.position.copy(host.position).addScaledVector(left,-2.05).addScaledVector(F,.35);bookPanel.position.y=3.78+Math.sin(t*1.2)*.012;
 bookPanel.quaternion.copy(cam.quaternion);bookPanel.rotateY((1-pk)*Math.PI*.5);                        // page-turn: swings in on its edge
 const flick=t-bpT0<.3?.55+.45*Math.abs(Math.sin((t-bpT0)*60)):1;bpMat.opacity=pk*flick;bpScan.material.opacity=bpMat.opacity*.9;
 // beams from the open pages to the projection
 const A=bpBeamGeo.attributes.position.array,hw=1.3,hh=1.3*BPH/BPW;bookPanel.updateMatrixWorld(true);let o2=0;
 const corners=[[BK_W/2,BK_H/2,0],[BK_W/2,-BK_H/2,0]],hc=[[-BK_W*.0,BK_H/2,0],[-BK_W*.0,-BK_H/2,0]];
 for(let i=0;i<4;i++){const src=i<2?bk.localToWorld(_bv.set(corners[i][0]*-1+(-BK_W/2)+BK_W/2,corners[i][1],BK_D/2)):bk.userData.hinge.localToWorld(_bv.set(BK_W,hc[i-2][1],0));
  A[o2++]=src.x;A[o2++]=src.y;A[o2++]=src.z;_E.set(i%2?-hw:hw*0-hw,i<2?hh:-hh,0);_E.set(i===0||i===2?-hw:hw,(i===0||i===1)?hh:-hh,0);if(i>=2)_E.x=-hw;else _E.x=hw;_E.applyMatrix4(bookPanel.matrixWorld);A[o2++]=_E.x;A[o2++]=_E.y;A[o2++]=_E.z}
 bpBeamGeo.attributes.position.needsUpdate=true;bpBeam.material.opacity=.35*pk}

// ===================== Services: live tour =====================
const SV_CYCLE=3.6,SV_LINES=["Chatbots that answer your customers.","Agents that do the work inside your tools.","Automations that move your data for you.","And websites that explain your business, like this one."];
let svT0=0,svSpoken=0,svFrame=0,svPickUntil=0,svPt=0;   // svPt: how much the host is pointing (0 once the one-time tour ends)
const svRay=new THREE.Raycaster(),svNdc=new THREE.Vector2();
function boardTileAt(e){if(!svMesh)return -1;svNdc.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);svRay.setFromCamera(svNdc,cam);const h=svRay.intersectObject(svMesh,false)[0];if(!h||!h.uv)return -1;
 const cx=h.uv.x*1600,cy=(1-h.uv.y)*1000;for(let i=0;i<4;i++){const x=80+(i%2)*740,y=220+(i/2|0)*360;if(cx>=x&&cx<=x+700&&cy>=y&&cy<=y+330)return i}return -1}
function pickTile(i){const t=clock.getElapsedTime();svT0=t-i*SV_CYCLE;svSpoken=4;svPickUntil=t+SV_CYCLE;say(SV_LINES[i])}
function updateServices(t,dt){if(act.services<=0){if(svActive>=0){svActive=-1;drawServices()}return}
 if(cur!=="services"||nav){svPt=Math.max(0,svPt-dt*2);return}
 if(t<svT0||(talking&&svActive<0)){if(talking)svT0=Math.max(svT0,t);return}   // tour waits for the opening line to finish
 {const e0=(t-svT0)/SV_CYCLE;if(talking&&svActive>=0&&Math.floor(e0)%4!==svActive&&Math.floor(e0)<4)svT0+=dt}   // never cut a tile's line: hold the tile until speech ends
 const e=(t-svT0)/SV_CYCLE,done=t>Math.max(svT0+4*SV_CYCLE,svPickUntil);   // the tour plays once; a clicked tile replays only that tile
 svPt=clamp(svPt+(done?-1:1)*dt*2,0,1);if(devGo==="services"&&!done)svPt=1;
 if(done){if(svActive>=0){svActive=-1;sheet.querySelectorAll("[data-tile]").forEach(b=>b.classList.remove("on"));drawServices()}return}
 const idx=Math.floor(e)%4,p=e-Math.floor(e);
 if(idx!==svActive){svActive=idx;sheet.querySelectorAll("[data-tile]").forEach(b=>b.classList.toggle("on",+b.dataset.tile===idx));if(svSpoken<4&&idx===svSpoken){say(SV_LINES[idx]);svSpoken++}}
 if((svFrame++&1)===0)drawServices(idx,p);                                        // live demo redraw at ~30 fps
 const tx=80+(idx%2)*740+350,ty=220+(idx/2|0)*360+190;
 _E.set(SV_POS.x+(tx/1600-.5)*SV_SIZE[0],SV_POS.y+(.5-ty/1000)*SV_SIZE[1],SV_POS.z);presentTarget.lerp(_E,Math.min(1,dt*4))}



// ===================== sections + navigation =====================
// One state machine for everything: from any section the host turns, walks straight to the next spot and the camera
// travels with him. Leaving a section winds its activity down first (stand up from the desk, close the book, ...).
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const SPOTS={contact:{p:V3(2.45,0,-2.1),yaw:-.25},studio:{p:standP,yaw:0},about:{p:V3(2.3,0,-1.95),yaw:-.42},projects:{p:deskP,yaw:-Math.PI},services:{p:SV_STAND,yaw:-.45},skills:{p:V3(3.25,0,-1.5),yaw:0}};
const fitZoom=(w,h)=>Math.min(2*s*asp/w,2*s/h);
const ABOUT_T=V3(.55,3.95,-3.4),ABOUT_D=V3(0,.05,1).normalize(),SVC_T=V3(-2.65,3.0,-3.2),SVC_D=V3(.12,.05,1).normalize(),SKC_T=V3(2.1,3.85,-1.5),SKC_D=V3(0,.1,1).normalize();
// Camera framing per section. Desktop: content projected in the scene. Compact (phones/tablets): the 3D shot is framed
// into the free part of the screen (top half in portrait, left half in landscape) and the sheet carries the readable content.
const CONTACT_T=V3(2.45,2.7,-2.1);
function camFor(id){const C=compact,U=C&&!land?.5:0,Vv=C&&land?-.5:0,fz=(w,h)=>C?Math.min(2*s*asp*(land?.5:1)/w,2*s*(land?1:.5)/h):fitZoom(w,h);
 switch(id){
  case "about":return C?[V3(.9,3.9,-3),ABOUT_D,fz(4.3,3.9),0,U,Vv]:[ABOUT_T,ABOUT_D,fitZoom(4.9,3.65),0,0,0];
  case "projects":return C?[V3(-.2,2.95,-3.6),workDir,fz(2.7,2.0),0,U,Vv]:[screenT,workDir,Math.min(2*s*asp*.62/1.85,2*s*.8/1.05),0,0,0];
  case "services":return C?[V3(-2.4,3.0,-3.1),SVC_D,fz(5,3.4),0,U,Vv]:[SVC_T,SVC_D,fitZoom(4.8,3.4),0,0,0];
  case "skills":return C?[V3(3.25,3.3,-1.5),SKC_D,fz(2.6,2.9),0,U,Vv]:[SKC_T,SKC_D,fitZoom(5.5,4.15),0,0,0];
  case "contact":return C?[CONTACT_T,frontDir,fz(2.4,4.3),0,U,Vv]:[CONTACT_T,frontDir,2*s/4.9,0,0,.38];   // desktop: host on the right, form on the left
  default:if(!C)return [frontT,frontDir,1.9,1,0,0];
   // phones/tablets: the whole room, centred in the free space (portrait: band between the speech bubble and the
   // hero card; landscape: right half beside the card)
   if(land)return [ROOM_T,frontDir,Math.min(2*s*asp*.48/ROOM_W,2*s*.9/ROOM_H),0,0,.5];
   {const top=(110)/innerHeight,bot=heroTop()/innerHeight,band=Math.max(.2,bot-top-.02),mid=1-(top+band/2);
    return [ROOM_T,frontDir,Math.min(2*s*asp/ROOM_W,2*s*band/ROOM_H),0,2*mid-1,0]}}}
const ROOM_T=new THREE.Vector3(.1,3.0,-1.6),ROOM_W=10.6,ROOM_H=6.6;
function heroTop(){const c=document.querySelector("main .card");const r=c&&c.getBoundingClientRect();return r&&r.height?r.top-8:innerHeight*.55}
const CAMS=new Proxy({},{get:(_,id)=>()=>camFor(id)});
const devZoom=+((location.hash.match(/zoom=([\d.]+)/)||[])[1]||0);const devOrbit=+((location.hash.match(/orbit=(-?[\d.]+)/)||[])[1]||0)*Math.PI/180;             // dev: swing the camera around the target to inspect a pose
let curK=1,curU=0,curV=0;function applyCam(T,D,Z,K,U=0,V=0){tgt.copy(T);camDir.copy(D);if(devOrbit)camDir.applyAxisAngle(UP,devOrbit);if(devZoom)Z*=devZoom;cam.position.copy(T).addScaledVector(camDir,20);cam.lookAt(T);cam.zoom=Z;curK=K;curU=U;curV=V;setFrustum(K,U/Z,V/Z);/*ortho zoom scales around the frustum centre, so offsets are divided by zoom*/cam.updateProjectionMatrix()}
let cur="studio",nav=null,navCp=0,hintAt=0,hintDone=true;const act={about:0,projects:0,services:0,skills:0,contact:0},actT={about:0,projects:0,services:0,skills:0,contact:0};
const LINES={studio:()=>"Where to next? Use the map in the corner, or click anything in the studio.",about:()=>"Here's my story so far.",
 projects:()=>"Let me show you my projects.",contact:()=>"Let's talk. Message me on WhatsApp, or send a note here.",services:()=>"Let me show you what I build.",skills:()=>BOOKS[selBook].title+". Let me open it for you."};
const NEXT={studio:"about",about:"skills",skills:"projects",projects:"services",services:"contact",contact:"studio"};
const HINTS={about:"Next, my skills live in those books on the shelf.",skills:"Want to see what I built with these? Projects are on the map.",
 projects:"Next, let me show you what I can build for you.",services:"Like what you see? My contact details are on the phone on my desk."};
const angDiff=(a,b)=>{let d=(b-a)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return d},lerpAng=(a,b,k)=>a+angDiff(a,b)*k;
function goTo(id){if(!introDone||nav||id===cur||!SPOTS[id])return;unlock();
 const t=clock.getElapsedTime(),from=cur;
 if(from!=="studio")actT[from]=0;
 if(from==="projects"){holoClose(true);screenMode="idle";drawScreen({mode:"idle"})}
 if(from==="about")fpClose();document.body.classList.remove("studio");
 panel.classList.remove("on");tip.style.display="none";hover=null;backBtn.hidden=true;
 const p0=host.position.clone(),y0=host.rotation.y,S=SPOTS[id],d=Math.hypot(S.p.x-p0.x,S.p.z-p0.z),walk=d>.25;
 const plan=walk?walkPlan(d):null,head=walk?Math.atan2(S.p.x-p0.x,S.p.z-p0.z):S.yaw;
 const leave=from==="projects"?.8:from==="skills"?.75:from==="studio"?0:.35;
 const T1=walk?.2+Math.abs(angDiff(y0,head))*.2:0,W=walk?Math.max(1.1,plan.n/1.5):0,T2=.25+Math.abs(angDiff(walk?head:y0,S.yaw))*.2;
 sharpText(false);hideSheet();nav={from,to:id,t0:t,leave,T1,W,T2,p0,y0,head,plan,camT:tgt.clone(),camD:camDir.clone(),camZ:cam.zoom,camK:curK,camU:curU,camV:curV};nav.total=Math.max(1.2,leave+T1+W+T2);
 if(id==="projects"){screenMode="loading";loadP=-1}
 hintDone=true}
// Sharp text: canvas textures normally use mipmaps, which blur small text whenever a panel is drawn a little smaller than
// its canvas. Close up (in a section) mipmaps are switched off so text samples the full-resolution canvas; in the wide
// studio view and while walking they are switched back on to avoid shimmering.
let textTex=null,texSharp=null;
function sharpText(on){if(on===texSharp)return;texSharp=on;
 if(!textTex){textTex=new Set();scene.traverse(o=>{const m=o.material;(Array.isArray(m)?m:[m]).forEach(mm=>{if(mm&&mm.map&&mm.map.isCanvasTexture)textTex.add(mm.map)})});
  const ma=r.capabilities.getMaxAnisotropy();textTex.forEach(tx=>tx.anisotropy=ma)}
 textTex.forEach(tx=>{tx.generateMipmaps=!on;tx.minFilter=on?THREE.LinearFilter:THREE.LinearMipmapLinearFilter;tx.needsUpdate=true})}
function arrive(id,t){sharpText(id!=="studio");const S=SPOTS[id];nav=null;cur=id;host.position.copy(S.p);host.rotation.y=S.yaw;walkEnv=0;
 if(id!=="studio"){actT[id]=1;backBtn.hidden=false}
 if(id==="about"){presentHand="Right";presentKind="palm";presentTarget.copy(AB_POS);presentT0=t;fpOpen(ABOUT_PANEL)}
 if(id==="projects"){screenMode="cards";revealT0=devGo?t-3:t;focus=0;prevFocus=-1;focusT0=t}
 if(id==="services"){svT0=t+2.4;svSpoken=0;presentHand="Right";presentKind="point";_E.set(SV_POS.x-.7,SV_POS.y+.3,SV_POS.z);presentTarget.copy(_E)}
 document.body.classList.toggle("studio",id==="studio");showSheet(id);
 if(LINES[id]&&!(id==="skills"&&devGo))setTimeout(()=>{if(cur===id&&!nav)say(LINES[id]())},300);          // speak once the camera has arrived in front, not while walking
 hintAt=t+5.5;hintDone=!HINTS[id]}
const ABOUT_PANEL={w:3.0,h:1.01,pos:V3(.05,3.42,-4.3),from:AB_POS,draw:drawStory};
const _ct=new THREE.Vector3(),_cd=new THREE.Vector3();
function updateNav(t){if(!nav){walkEnv=0;return}
 const e=t-nav.t0,{leave,T1,W,T2}=nav,S=SPOTS[nav.to];
 navCp=ease(clamp(e/nav.total,0,1));const [T,D,Z,K,U,V]=CAMS[nav.to]();
 _ct.lerpVectors(nav.camT,T,navCp);_cd.lerpVectors(nav.camD,D,navCp).normalize();applyCam(_ct,_cd,nav.camZ+(Z-nav.camZ)*navCp,nav.camK+(K-nav.camK)*navCp,nav.camU+(U-nav.camU)*navCp,nav.camV+(V-nav.camV)*navCp);
 walkEnv=0;
 if(e<leave){}
 else if(e<leave+T1)host.rotation.y=lerpAng(nav.y0,nav.head,ease((e-leave)/T1));
 else if(e<leave+T1+W){const WP=walkProfile((e-leave-T1)/W);host.position.lerpVectors(nav.p0,S.p,WP.pw);host.position.y=0;host.rotation.y=nav.head;walkEnv=WP.env;strideA=nav.plan.a;stepPh=WP.pw*nav.plan.n*Math.PI}
 else{if(W>0)host.position.copy(S.p);host.rotation.y=lerpAng(W>0?nav.head:nav.y0,S.yaw,ease(clamp((e-leave-T1-W)/T2,0,1)))}
 if(nav.to==="projects"){const p=Math.round(navCp*40)/40;if(p!==loadP){loadP=p;drawScreen({mode:"loading",p})}}
 if(e>=nav.total)arrive(nav.to,t)}

// ===================== studio map (live miniature of the room) =====================
// Hidden by default (it used to cover the Skills shelf): the Map button opens it, picking a place or Esc / x / clicking elsewhere closes it.
const mapEl=$("map"),mapView=$("mapView"),mapBtn=$("mapBtn"),mapNav=mapEl.querySelector("nav"),miniCam=new THREE.OrthographicCamera(-1,1,1,-1,.1,100);miniCam.layers.enable(1);
const MINI_T=V3(-.4,3.1,-.9),MINI_D=V3(1,1.2,1).normalize();let mapRect=null,mapOpen=false,mapLive=false,mapAsp=0;
miniCam.position.copy(MINI_T).addScaledVector(MINI_D,30);miniCam.lookAt(MINI_T);
const mapCv=document.createElement("canvas"),mapCx=mapCv.getContext("2d");mapView.appendChild(mapCv);
function sizeMap(){const b=mapView.getBoundingClientRect();mapRect=b;const a=b.width/Math.max(1,b.height),h=5.6;if(a===mapAsp)return;mapAsp=a;   // tracks the open/close scale animation every frame
 Object.assign(miniCam,{left:-h*a,right:h*a,top:h,bottom:-h});miniCam.updateProjectionMatrix()}
function setMap(open,focus){if(open===mapOpen)return;mapOpen=open;mapEl.classList.toggle("open",open);mapEl.setAttribute("aria-hidden",String(!open));mapBtn.setAttribute("aria-expanded",String(open));document.body.classList.toggle("mapopen",open);
 if(open){mapLive=true;refreshMapNav();if(focus)setTimeout(()=>mapNav.querySelector("button")?.focus(),60)}else{mapHover=null;mapView.classList.remove("hot");if(focus)mapBtn.focus()}}
mapEl.addEventListener("transitionend",e=>{if(e.target===mapEl&&e.propertyName==="transform"&&!mapOpen)mapLive=false});
mapBtn.onclick=e=>setMap(!mapOpen,e.detail===0);
$("mapClose").onclick=e=>setMap(false,e.detail===0);
addEventListener("pointerdown",e=>{if(mapOpen&&!e.target.closest?.("#map,#mapBtn"))setMap(false)},true); // clicking anywhere else closes it (the click still goes through)
addEventListener("keydown",e=>{if(e.target.closest?.("input,textarea,select"))return;
 if(e.key==="Escape"&&mapOpen){e.stopImmediatePropagation();setMap(false,true)}else if((e.key==="m"||e.key==="M")&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!mapBtn.hidden)setMap(!mapOpen,true)},true);
function hotTex(label,on){const c=document.createElement("canvas"),g=c.getContext("2d");g.font="600 46px Karla, sans-serif";const w=Math.ceil(g.measureText(label).width)+64;c.width=w;c.height=96;
 g.font="600 46px Karla, sans-serif";g.fillStyle=on?"#E8B44A":"rgba(14,18,21,.88)";g.beginPath();g.roundRect(3,3,w-6,90,14);g.fill();g.strokeStyle="#E8B44A";g.lineWidth=5;g.stroke();
 g.fillStyle=on?"#121619":"#EEF0EC";g.textAlign="center";g.fillText(label,w/2,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return {t,ar:w/96}}
const HOTS=[["about","About",V3(.2,5.55,-4.4)],["skills","Skills",V3(3.0,5.9,-4.3)],["services","What I build",V3(-3.35,5.1,-4.5)],["projects","Projects",V3(.2,3.95,-3.5)],
 ["contact","Contact",V3(1.7,2.75,-2.4)],["studio","Studio",V3(2.6,.4,1.6)]].map(([id,label,p])=>{const a=hotTex(label,false),b=hotTex(label,true);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:a.t,depthTest:false,transparent:true}));sp.renderOrder=40;sp.layers.set(1);sp.position.copy(p);sp.userData={id,label,a,b,base:1.0};sp.scale.set(.62*a.ar,.62,1);scene.add(sp);return sp});
const youRing=new THREE.Mesh(new THREE.RingGeometry(.32,.5,40),new THREE.MeshBasicMaterial({color:0xE8B44A,transparent:true,opacity:.9,depthTest:false,side:THREE.DoubleSide}));youRing.rotation.x=-Math.PI/2;youRing.layers.set(1);youRing.renderOrder=39;scene.add(youRing);
const mapRay=new THREE.Raycaster();mapRay.layers.set(1);const mapNdc=new THREE.Vector2();let mapHover=null;
function mapPick(e,loose){if(!mapRect)return null;mapNdc.set((e.clientX-mapRect.left)/mapRect.width*2-1,-(e.clientY-mapRect.top)/mapRect.height*2+1);mapRay.setFromCamera(mapNdc,miniCam);const h=mapRay.intersectObjects(HOTS,false)[0];if(h||!loose)return h?h.object:null;
 let best=null,bd=30;HOTS.forEach(sp=>{_E.copy(sp.position).project(miniCam);const d=Math.hypot((_E.x-mapNdc.x)*mapRect.width/2,(_E.y-mapNdc.y)*mapRect.height/2);if(d<bd){bd=d;best=sp}});return best} // fingers: nearest label within 30 px
const mapGo=id=>{setMap(false);if(id==="skills")pickBook(selBook);else goTo(id)};
mapView.addEventListener("pointermove",e=>{if(e.pointerType!=="mouse")return;mapHover=mapPick(e);mapView.classList.toggle("hot",!!mapHover)});
mapView.addEventListener("pointerleave",()=>{mapHover=null;mapView.classList.remove("hot")});
mapView.addEventListener("click",e=>{const h=mapPick(e,true);if(h)mapGo(h.userData.id)});
mapNav.innerHTML=HOTS.map(sp=>`<button data-spot="${sp.userData.id}">${sp.userData.label}</button>`).join("");
mapNav.addEventListener("click",e=>{const b=e.target.closest("button");if(b)mapGo(b.dataset.spot)});
function refreshMapNav(){const where=nav?nav.to:cur,next=NEXT[where];mapNav.querySelectorAll("button").forEach(b=>{const id=b.dataset.spot;if(id===where)b.setAttribute("aria-current","location");else b.removeAttribute("aria-current");b.classList.toggle("next",id===next)})}
function updateMap(t){mapBtn.classList.toggle("hint",!mapOpen&&!nav&&!!HINTS[cur]&&t>hintAt);if(!mapLive)return;sizeMap();if(mapOpen)refreshMapNav();youRing.position.set(host.position.x,.03,host.position.z);youRing.scale.setScalar(1+Math.sin(t*4)*.08);
 const where=nav?nav.to:cur,next=NEXT[where];
 HOTS.forEach(sp=>{const id=sp.userData.id,on=id===where,isNext=id===next&&!nav;const want=on?sp.userData.b:sp.userData.a;if(sp.material.map!==want.t){sp.material.map=want.t;sp.material.needsUpdate=true}
  const k=sp.userData.base*(sp===mapHover?1.18:1)*(isNext?1+.12*Math.max(0,Math.sin(t*5)):1);sp.scale.set(k*want.ar,k,1);sp.material.opacity=on||isNext||sp===mapHover?1:.85})}
backBtn.onclick=()=>goTo("studio");

// ===================== section sheet (contact form; readable content on phones/tablets) =====================
const sheet=$("sheet");let sheetFor=null;
// Contact form integration point. Static hosting has no mail server, so messages go to a form service:
//  - Formspree: create a form at formspree.io and paste its endpoint, e.g. "https://formspree.io/f/abcdwxyz"
//  - or any endpoint that accepts a JSON POST {name,email,subject,message} and returns 2xx on success.
// While empty, the form validates but never pretends to send: it offers the visitor a prefilled email instead.
const CONTACT_ENDPOINT="https://formsubmit.co/ajax/abdurrafaym10@gmail.com";   // FormSubmit (free, no account): first message triggers a one-time activation email
const EMAIL="abdurrafaym10@gmail.com",LINKEDIN="https://linkedin.com/in/abdur-rafay-akbar",GITHUB="https://github.com/AbdurRafayAkbar";
// WhatsApp button (number not displayed, owner decision; it is only inside the wa.me link). Built from parts so simple scrapers don't find it as one string in the HTML source.
const WA_NUM=["92","313","7579509"],WA_LINK="https://wa.me/"+WA_NUM.join("")+"?text="+encodeURIComponent("Hi Abdur, I saw your portfolio and would like to talk.");
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function sheetHTML(id){
 if(id==="contact")return `<h2>Let's talk</h2><p class="lede">Have a project, a role or a question? Message me on WhatsApp, or send a message and I'll reply by email.</p>
  <a class="wa" href="${WA_LINK}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.4.4 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4 5.2 5.2 0 0 0 3.2.7 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg><span><b>Chat on WhatsApp</b><small>Opens a chat with me</small></span></a>
  <p class="or">or send a message</p>
  <form class="f" id="cf" novalidate>
   <div class="two"><label>Name<input name="name" autocomplete="name" maxlength="80" required aria-describedby="e-name"><span class="err" id="e-name"></span></label>
   <label>Email<input name="email" type="email" autocomplete="email" maxlength="120" required aria-describedby="e-email"><span class="err" id="e-email"></span></label></div>
   <label>Subject<input name="subject" maxlength="120" required aria-describedby="e-subject"><span class="err" id="e-subject"></span></label>
   <label>Message<textarea name="message" rows="3" maxlength="4000" required aria-describedby="e-message"></textarea><span class="err" id="e-message"></span></label>
   <input class="hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">
   <button class="btn" type="submit">Send message</button>
   <div class="status" role="status" hidden></div></form>
  <div class="links"><a href="mailto:${EMAIL}">${EMAIL}</a><a href="${LINKEDIN}" target="_blank" rel="noopener">LinkedIn</a><a href="${GITHUB}" target="_blank" rel="noopener">GitHub</a></div><p class="legal"><a href="privacy.html">How your message is handled</a></p>`;
 if(id==="about")return `<h2>My path so far</h2><p class="lede">${esc(ABOUT.line)}</p><ol class="tl">${STORY.map(([d,t,det,now])=>`<li class="${now?"now":""}"><b>${esc(d)}${now?" (now)":""}</b>${esc(t)}<br><small>${esc(det)}</small></li>`).join("")}</ol>`;
 if(id==="skills"){const b=BOOKS[selBook];return `<div class="bookbar" role="group" aria-label="Choose a skill book">${BOOKS.map((x,i)=>`<button data-book="${i}" aria-pressed="${i===selBook}">${esc(x.title)}</button>`).join("")}</div>
  <h2>${esc(b.title)}</h2><p class="lede">${esc(b.use)}</p><h3>What I know</h3><div class="chips">${b.know.map(k=>`<span>${esc(k)}</span>`).join("")}</div><h3>Where I used it</h3><ul>${b.used.map(u=>`<li>${esc(u)}</li>`).join("")}</ul>`}
 if(id==="projects")return `<h2>Projects</h2><p class="lede">Tap a project to read more.</p>${PROJECTS.map((pr,i)=>`<button class="row" data-proj="${i}" aria-expanded="false"><small>${esc(pr.kind)}${pr.stat?" · "+esc(pr.stat):""}</small><b>${esc(pr.title)}</b><span class="more" hidden><span>${esc(pr.summary)}</span><ul>${pr.points.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><span class="chips">${pr.tags.map(x=>`<span>${esc(x)}</span>`).join("")}</span></span></button>`).join("")}`;
 if(id==="services")return `<h2>What I build</h2><p class="lede">Watch each one come alive on the board, or tap one.</p>${SERVICES.map(([t,d],i)=>`<button class="row${i===svActive?" on":""}" data-tile="${i}"><b>${esc(t)}</b><small>${esc(d)}</small></button>`).join("")}`;
 return ""}
function renderSheet(id){sheet.innerHTML=sheetHTML(id);
 sheet.querySelectorAll("[data-book]").forEach(b=>b.onclick=()=>pickBook(+b.dataset.book));
 sheet.querySelectorAll("[data-tile]").forEach(b=>b.onclick=()=>pickTile(+b.dataset.tile));
 sheet.querySelectorAll("[data-proj]").forEach(b=>b.onclick=()=>{const open=b.getAttribute("aria-expanded")!=="true";b.setAttribute("aria-expanded",open);b.querySelector(".more").hidden=!open});
 const f=sheet.querySelector("#cf");if(f)f.addEventListener("submit",submitContact)}
const srsec=$("srsec");
function showSheet(id){srsec.innerHTML=id==="studio"||compact?"":sheetHTML(id).replace(/<form[\s\S]*<\/form>/,"");   // desktop: section text for screen readers (it is drawn in 3D)
 if(id==="studio"||!(compact||id==="contact")){hideSheet();return}renderSheet(id);sheet.hidden=false;sheetFor=id}
function hideSheet(){sheet.hidden=true;sheetFor=null}
function refreshSheet(){if(!nav&&cur!=="studio")showSheet(cur)}
window.__sheetReady=true;
const RULES={name:v=>v.trim().length>=2||"Please enter your name.",email:v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())||"Please enter a valid email address.",
 subject:v=>v.trim().length>=3||"Please add a short subject.",message:v=>v.trim().length>=10||"Please write a message (at least 10 characters)."};
function validate(f){let first=null;for(const k in RULES){const el=f.elements[k],ok=RULES[k](el.value);el.setAttribute("aria-invalid",ok!==true);$("e-"+k).textContent=ok===true?"":ok;if(ok!==true&&!first)first=el}if(first)first.focus();return !first}
async function submitContact(e){e.preventDefault();const f=e.currentTarget,st=f.querySelector(".status"),btn=f.querySelector("button[type=submit]");st.hidden=true;
 if(!validate(f))return;
 if(f.elements.company.value)return;                                                   // honeypot filled: silently ignore bots
 const data={name:f.elements.name.value.trim(),email:f.elements.email.value.trim(),subject:f.elements.subject.value.trim(),message:f.elements.message.value.trim()};
 const mailto=`mailto:${EMAIL}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.message+"\n\n"+data.name+" <"+data.email+">")}`;
 if(!CONTACT_ENDPOINT){st.className="status bad";st.hidden=false;
  st.innerHTML=`Your message was <b>not sent</b>: this site isn't connected to an email service yet. Please <a href="${mailto}">send it from your email app</a> (it opens with your message filled in) or write to ${EMAIL}.`;return}
 btn.disabled=true;btn.textContent="Sending…";
 try{const res=await fetch(CONTACT_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({...data,_subject:"Portfolio: "+data.subject,_replyto:data.email,_template:"table"})});
  if(!res.ok)throw new Error("HTTP "+res.status);
  const out=await res.json().catch(()=>({}));if(String(out.success)!=="true")throw new Error(out.message||"the email service did not confirm");   // success only when the service confirms
  st.className="status ok";st.hidden=false;st.textContent=`Thanks, ${data.name}. Your message was sent and I'll reply to ${data.email}.`;f.reset();say("Got your message. Thank you!")}
 catch(err){st.className="status bad";st.hidden=false;st.innerHTML=`Sorry, the message could not be sent (${esc(err.message)}). Please try again, or <a href="${mailto}">email me directly</a>.`}
 finally{btn.disabled=false;btn.textContent="Send message"}}
// phone: flies from the desk into Abdur's right hand, screen toward the visitor
const _pq=new THREE.Quaternion(),_pe=new THREE.Euler(),_pp=new THREE.Vector3(),_pm=new THREE.Vector3();
function updatePhone(t,dt){if(!phoneMesh)return;phoneU=clamp(phoneU+(actT.contact?1:-1)*dt/(actT.contact?1.0:.7),0,1);if(devGo==="contact"&&actT.contact)phoneU=1;
 const u=ease(phoneU),P=phoneMesh,F=_F.set(Math.sin(host.rotation.y),0,Math.cos(host.rotation.y)),left=_L.crossVectors(UP,F).normalize();
 if(u<=0){P.position.copy(P.userData.home);P.quaternion.copy(P.userData.homeQ);phoneW=0;return}
 _pp.copy(host.position).addScaledVector(F,.42).addScaledVector(left,-.2);_pp.y=3.05;
 _pm.lerpVectors(P.userData.home,_pp,.5);_pm.y+=.35;P.position.set(0,0,0).addScaledVector(P.userData.home,(1-u)*(1-u)).addScaledVector(_pm,2*u*(1-u)).addScaledVector(_pp,u*u);
 _pq.setFromEuler(_pe.set(Math.PI/2-.25,host.rotation.y,0,"YXZ"));P.quaternion.slerpQuaternions(P.userData.homeQ,_pq,u);
 phoneW=ease(clamp((phoneU-.65)/.35,0,1));phoneGrip.copy(P.position).addScaledVector(UP,-.17).addScaledVector(F,-.03)}

// ===================== loop =====================
const INTRO={delay:.1,dur:2.2};   // short fly-in; any click or key skips it
addEventListener("pointerdown",()=>{if(!introDone&&introT0!==null)introT0=-99},true);addEventListener("keydown",()=>{if(!introDone&&introT0!==null)introT0=-99},true);let introT0=null,introDone=false,last=0,devDone=false;
(function loop(){const t=clock.getElapsedTime(),dt=Math.min(.05,t-last);last=t;
 if(introT0===null)introT0=t;
 const ip=forced!=null?forced:reduce||devGo?1:clamp((t-introT0-INTRO.delay)/INTRO.dur,0,1);
 if(!introDone){
  f=ease(clamp((ip-.05)/.8,0,1));
  {const [T,D,Z,K,U,V]=camFor("studio"),z0=compact?Z*.5:.92,k0=compact?K:1;   // fly from the high wide view into the studio framing for this screen
   _ct.lerpVectors(wideT,T,f);_cd.lerpVectors(isoDir,D,f).normalize();applyCam(_ct,_cd,z0+(Z-z0)*f,k0+(K-k0)*f,U*f,V*f)}
  walls.forEach(w=>{w.material.opacity=1-f*.35;w.material.depthWrite=f<.05});host.rotation.y=Math.PI/4*(1-f);
  if(ip>=1){introDone=true;mapBtn.hidden=false;if(location.hash.includes("mapopen"))setMap(true);document.body.classList.add("studio")}
 }
 if(introDone&&devGo&&!devDone&&SPOTS[devGo]){devDone=true;document.body.classList.remove("studio");const S=SPOTS[devGo];if(devGo!=="studio"){arrive(devGo,t-6)}}
 if(introDone){
  if(nav)updateNav(t);else{walkEnv=0;applyCam(...CAMS[cur]())}
  for(const k in act){act[k]=clamp(act[k]+(actT[k]?1:-1)*dt/(k==="projects"?.7:.45),0,1);if(devGo===k&&actT[k])act[k]=1}
  lean=ease(act.projects);typing=cur==="projects"&&!nav&&act.projects>.98;
  const heroOp=nav?(nav.to==="studio"?navCp:nav.from==="studio"?1-navCp:0):(cur==="studio"?1:0),op=Math.round(heroOp*20)/20;
  if(op!==mainOp){mainOp=op;mainEl.style.opacity=op;mainEl.style.visibility=op?"":"hidden"}
  if(screenMode==="cards"&&cur==="projects"){const rv=(t-revealT0)/1.1,fk=clamp((t-focusT0)/.35,0,1);
   if(holoIdx<0&&t-focusT0>3.6){prevFocus=focus;focus=(focus+1)%PROJECTS.length;focusT0=t}
   if(holoLeaveT!=null&&t-holoLeaveT>.18){holoLeaveT=null;holoClose(false)}
   if(holoIdx<0&&(rv<1.4||fk<1||devGo))drawScreen({mode:"cards",reveal:rv,focus,prev:prevFocus,focusK:ease(fk)})}
  if(!nav&&!hintDone&&t>hintAt&&!talking){hintDone=true;say(HINTS[cur])}
 }
 updateBooks(t,dt);updateServices(t,dt);updatePhone(t,dt);
 updateFP(t);updateSteam(t);
 if(devHolo>=0&&screenMode==="cards"&&holoIdx<0)holoOpen(devHolo);
 updateHolo(t);
 updateGestures(t,dt);
 if(act.services>0){present=Math.max(present*(presentKind==="palm"?1:0),ease(act.services)*svPt);presentKind="point";presentHand="Right"}else if(presentKind==="point"){presentKind="palm";present=0}
 hands.forEach(h=>curl[h.n]=1-clamp(Math.max(h.palm*h.wgt,h.n===presentHand&&presentKind==="palm"?present:0),0,1)*.9);
 if(presentKind==="point"){curl.Right=1;curl.RightIndex=1-present;curl.RightMiddle=1;curl.RightRing=1;curl.RightPinky=1}else{delete curl.RightIndex;delete curl.RightMiddle;delete curl.RightRing;delete curl.RightPinky}
 if(holdW>.05){curl.Left=curl.Right=1-.45*holdW}
 if(phoneW>.05)curl.Right=.55;
 faceFill.target.position.set(host.position.x,host.position.y+4.0,host.position.z);faceFill.position.copy(faceFill.target.position).addScaledVector(camDir,7).y+=.6;
 updateGaze(dt);me.update(t,{relax:walkEnv>.05||lean>.05||holdW>.05||phoneW>.05?0:1,curl,talk:talking||devTalk?1:0,lookX:lookX,lookY:lookY,smile:.6,pose});
 // footstep sound at each heel strike (legs at widest spread)
 const stepIdx=Math.floor((stepPh-Math.PI/2)/Math.PI);if(walkEnv>.3&&stepIdx!==lastStep&&stepPh>Math.PI/2)footstep(walkEnv);lastStep=walkEnv>.05?stepIdx:-9;
 items.forEach(o=>o.position.y+=((o===hover?.15:0)-o.position.y)*.15);updateNN(t,dt);updateMap(t);
 r.clear();r.render(scene,cam);
 if(mapLive&&mapRect&&mapRect.width>8){const b=mapRect;r.setScissorTest(true);r.setViewport(b.left,innerHeight-b.bottom,b.width,b.height);r.setScissor(b.left,innerHeight-b.bottom,b.width,b.height);
  r.clear();r.shadowMap.autoUpdate=false;r.render(scene,miniCam);r.shadowMap.autoUpdate=true;r.setScissorTest(false);r.setViewport(0,0,innerWidth,innerHeight);
  const pr=r.getPixelRatio(),w=Math.round(b.width*pr),h=Math.round(b.height*pr);if(mapCv.width!==w||mapCv.height!==h){mapCv.width=w;mapCv.height=h}   // copy into the map's own canvas so it sits above the speech bubble and sheet
  mapCx.drawImage(canvas,b.left*pr,b.top*pr,b.width*pr,b.height*pr,0,0,w,h)}
 requestAnimationFrame(loop)})();
if(location.hash.includes("voicelist"))setTimeout(()=>document.body.setAttribute("data-voicelist",JSON.stringify(allLines().map(t=>[vkey(t),t]))),3000);   // dev: dump lines for tools/make_voice.py
