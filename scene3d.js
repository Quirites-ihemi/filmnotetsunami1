import {parkingApproach,blockedCarAdvance} from './motion.js';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {SoftwareRenderer} from './software-renderer.js';
const cl=(n,a=0,b=1)=>Math.min(b,Math.max(a,n)),mix=(a,b,t)=>a+(b-a)*t,ease=t=>{t=cl(t);return t*t*(3-2*t)};
const palette=['#c58f7b','#c3aa70','#7ba58b','#819eb8'];
let seed=17;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const mats=new Map(),geos=new Map();function mat(c,extra={}){const key=c+JSON.stringify(extra);if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color:c,roughness:.82,...extra}));return mats.get(key)}
function geo(key,fn){if(!geos.has(key))geos.set(key,fn());return geos.get(key)}
function mesh(g,m,parent,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function box(p,x,y,z,w,h,d,c){const seg=w>15||d>15?3:1;return mesh(geo(`b${w},${h},${d}`,()=>new T.BoxGeometry(w,h,d,seg,1,seg)),mat(c),p,x,y,z)}
function ball(p,x,y,z,r,c,s=8){return mesh(geo(`s${r},${s}`,()=>new T.SphereGeometry(r,s,Math.max(4,s/2))),mat(c),p,x,y,z)}
function cyl(p,x,y,z,rt,rb,h,c,n=8){return mesh(geo(`c${rt},${rb},${h},${n}`,()=>new T.CylinderGeometry(rt,rb,h,n)),mat(c),p,x,y,z)}
function groundY(x,z=0){return .35+Math.max(0,-x-23)*.28}
function plane(p,x0,x1,z0,z1,c,height=groundY){const g=new T.PlaneGeometry(x1-x0,z1-z0,Math.ceil((x1-x0)/5),Math.ceil((z1-z0)/5));g.rotateX(-Math.PI/2);g.translate((x0+x1)/2,0,(z0+z1)/2);const a=g.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,height(a.getX(i),a.getZ(i)));g.computeVertexNormals();return mesh(g,mat(c),p)}
function ribbon(parent,pts,color,width=.1){const vertices=[];for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=-dy/len*width,ny=dx/len*width;vertices.push(a[0]+nx,a[1]+ny,0,a[0]-nx,a[1]-ny,0,b[0]+nx,b[1]+ny,0,a[0]-nx,a[1]-ny,0,b[0]-nx,b[1]-ny,0,b[0]+nx,b[1]+ny,0)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));return mesh(g,mat(color,{side:T.DoubleSide}),parent)}
function humanMat(c){return mat(c,{roughness:.94,userData:{smooth:true}})}
function ellipsoid(p,x,y,z,rx,ry,rz,c,segments=16){const g=geo('human-ellipsoid-'+segments,()=>new T.SphereGeometry(1,segments,Math.max(6,Math.round(segments*.65))));const o=mesh(g,humanMat(c),p,x,y,z);o.scale.set(rx,ry,rz);return o}
function loftGeometry(key,profile,segments=20){return geo('human-loft-'+key+'-'+segments,()=>{const vertices=[],uvs=[],indices=[];for(let j=0;j<profile.length;j++){const [y,rx,rz,offset=0]=profile[j];for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;vertices.push(Math.cos(a)*rx,y,Math.sin(a)*rz+offset);uvs.push(i/segments,j/(profile.length-1))}}for(let j=0;j<profile.length-1;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g})}
function humanLoft(p,key,profile,c,segments=20){return mesh(loftGeometry(key,profile,segments),humanMat(c),p)}
function strand(p,key,points,r,c){const g=geo('human-strand-'+key,()=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a))),12,r,6,false));return mesh(g,humanMat(c),p)}
function makePerson(color,skin='#d3c9b8',hair='#b1a692',female=false,child=false){
 // Neutral, faceless human figures: adult proportions, continuous rounded forms.
 skin='#d3c9b8';const hairColor=hair==='#8b8e87'?'#c2beb2':'#b5aa98';
 const root=new T.Group(),hip=new T.Group();root.add(hip);hip.position.y=.92;
 const torso=new T.Group();hip.add(torso);
 const profile=female?[[-.015,.166,.113],[0,.174,.118],[.12,.132,.095],[.25,.151,.105],[.38,.18,.11],[.44,.19,.102],[.49,.145,.086],[.515,.068,.065]]:[[-.015,.168,.118],[0,.175,.126],[.13,.15,.109],[.27,.183,.117],[.4,.217,.115],[.45,.218,.10],[.49,.16,.086],[.515,.073,.066]];
 humanLoft(torso,female?'female-shirt':'male-shirt',profile,color,24);
 ellipsoid(torso,0,.56,0,.062,.103,.06,skin,14);
 const head=new T.Group();head.position.set(0,.735,0);torso.add(head);if(child)head.scale.setScalar(1.16);
 humanLoft(head,'featureless-head',[[-.119,.013,.018,.018],[-.105,.048,.049,.014],[-.074,.071,.065,.01],[-.025,.087,.079,.005],[.035,.088,.081,0],[.084,.073,.069,-.003],[.112,.04,.042,-.004],[.119,.005,.006,-.004]],skin,24);
 for(const side of [-1,1])ellipsoid(head,side*.087,-.012,-.005,.013,.025,.014,skin,10);
 // Sculpted hair volumes in the same quiet stone palette, with no facial marks.
 const hairMesh=ellipsoid(head,0,.068,-.018,.095,.068,.085,hairColor,20);hairMesh.rotation.x=-.12;
 if(female){ellipsoid(head,0,-.035,-.075,.09,.145,.035,hairColor,18);for(const side of [-1,1])strand(head,'female-lock-'+side,[[side*.03,.12,-.005],[side*.08,.072,.026],[side*.099,-.02,.009],[side*.09,-.105,-.018],[side*.067,-.16,-.038]],.023,hairColor)}else{strand(head,'male-swept-front',[[-.075,.077,.035],[-.045,.126,.047],[.014,.133,.041],[.068,.09,.01]],.019,hairColor);strand(head,'male-side-wave',[[-.076,.056,-.018],[-.054,.105,-.045],[.005,.129,-.04],[.065,.082,-.037]],.014,hairColor)}
 // A rounded collar, restrained cuffs and tapered sleeves give the figure clothing.
 const collar=mesh(geo('human-collar',()=>new T.TorusGeometry(.067,.009,6,24)),humanMat(color),torso,0,.515,0);collar.rotation.x=Math.PI/2;collar.scale.z=.9;
 const arms=[],hands=[],legs=[];const trousers=child?'#b8ab91':female?'#b6ad9c':'#727d7d';humanLoft(hip,'pelvis-'+(female?'female':'male'),[[-.18,.025,.035],[-.14,.108,.088],[-.065,.165,.113],[.02,.172,.12],[.08,.15,.11]],trousers,20);
 for(const side of [-1,1]){
  const arm=new T.Group();arm.position.set(side*(female?.178:.205),.43,0);torso.add(arm);
  ellipsoid(arm,0,-.018,0,.067,.085,.067,color,14);
  humanLoft(arm,'upper-sleeve',[[ -.205,.047,.049],[-.18,.063,.061],[-.05,.065,.061],[.015,.052,.055]],color,14);
  humanLoft(arm,'upper-arm',[[ -.292,.032,.033],[-.25,.043,.042],[-.185,.05,.047]],skin,14);
  const elbow=new T.Group();elbow.position.y=-.285;arm.add(elbow);ellipsoid(elbow,0,0,0,.037,.04,.036,skin,12);
  humanLoft(elbow,'forearm',[[ -.277,.023,.025],[-.23,.028,.029],[-.11,.04,.036],[-.025,.039,.035],[.014,.025,.027]],skin,14);
  const hand=new T.Group();hand.position.set(0,-.276,.004);elbow.add(hand);
  ellipsoid(hand,0,-.041,0,.035,.052,.021,skin,12);
  for(let finger=0;finger<4;finger++){const fx=(finger-1.5)*.017,fl=[.054,.071,.077,.06][finger];const digit=ellipsoid(hand,fx,-.08-fl*.37,.003,.009,fl*.55,.009,skin,8);digit.rotation.z=(finger-1.5)*.045}
  const thumb=ellipsoid(hand,-side*.039,-.044,.004,.012,.036,.012,skin,10);thumb.rotation.z=-side*.49;
  arms.push({root:arm,elbow});hands.push(hand);
  const leg=new T.Group();leg.position.set(side*.092,0,0);hip.add(leg);
  humanLoft(leg,child?'child-shorts':'trouser-thigh',child?[[ -.365,.063,.067],[-.30,.075,.076],[-.1,.095,.096],[.025,.075,.075]]:[[-.44,.052,.058],[-.38,.065,.073],[-.23,.089,.097],[-.07,.099,.109],[.025,.075,.078]],trousers,16);
  const knee=new T.Group();knee.position.y=-.435;leg.add(knee);const lowerColor=child?skin:trousers;
  ellipsoid(knee,0,0,.004,.055,.07,.058,lowerColor,12);
  humanLoft(knee,'calf-'+(child?'skin':'trouser'),[[-.389,.035,.038],[-.34,.038,.044],[-.19,.058,.068],[-.08,.061,.071],[.02,.044,.048]],lowerColor,16);
  ellipsoid(knee,0,-.414,.049,.058,.048,.135,'#999c94',16);
  legs.push({root:leg,knee});
 }
 const scale=child?.70:female?.94:1;root.scale.setScalar(scale);
 return {root,hip,torso,head,arms,hands,legs,child,scale,pose(mode,t,amount=1){hip.position.y=.92;torso.rotation.set(0,0,0);head.rotation.set(0,0,0);arms.forEach(a=>{a.root.rotation.set(0,0,0);a.elbow.rotation.set(0,0,0)});legs.forEach(l=>{l.root.rotation.set(0,0,0);l.knee.rotation.set(0,0,0)});
 if(mode==='walk'||mode==='run'){const f=mode==='run'?8:5.8,amp=mode==='run'?.7:.45;legs.forEach((l,i)=>{l.root.rotation.x=Math.sin(t*f+i*Math.PI)*amp;l.knee.rotation.x=Math.max(0,-Math.sin(t*f+i*Math.PI))*.6});arms.forEach((a,i)=>a.root.rotation.x=-Math.sin(t*f+i*Math.PI)*amp*.8);hip.position.y+=Math.abs(Math.sin(t*f))*.027;torso.rotation.x=.08}
 if(mode==='pick'){torso.rotation.x=amount*1.05;arms.forEach(a=>{a.root.rotation.x=-amount*.7;a.elbow.rotation.x=-.15});head.rotation.x=.2*amount}
 if(mode==='carry'){arms[0].root.rotation.x=-.16;arms[1].root.rotation.x=-.3;arms[1].elbow.rotation.x=-.3}
 if(mode==='point'){arms[1].root.rotation.x=-1.5;arms[1].root.rotation.z=-.35;arms[1].elbow.rotation.x=-.15;head.rotation.y=-.32}
 if(mode==='worried'){arms[0].root.rotation.x=-1.4;arms[0].elbow.rotation.x=-1;head.rotation.y=Math.sin(t)*.3}
 if(mode==='shield'){arms.forEach((a,i)=>{a.root.rotation.z=(i?1:-1)*.8;a.root.rotation.x=-1.5;a.elbow.rotation.x=-1.3});torso.rotation.x=.18;legs[0].root.rotation.z=.18;legs[1].root.rotation.z=-.18}
 }}
}
function makeFamily(i){const root=new T.Group();const actors=[makePerson(palette[i],['#dfb18c','#dab18c','#bb8b64','#d7b18e'][i],i===3?'#8b8e87':'#443b31'),makePerson('#e3d8bd',['#e1b393','#d5a181','#b78767','#d7aa8d'][i],'#49392c',true),makePerson(palette[i],['#dfb18c','#dab18c','#b98964','#d7b18e'][i],'#5d4531',false,true)];actors.forEach(a=>root.add(a.root));actors[0].root.position.set(-.8,0,0);actors[1].root.position.set(.7,0,-.15);actors[2].root.position.set(.1,0,.7);
 return{root,actors,set(x,z,angle=0){root.position.set(x,groundY(x,z),z);root.rotation.y=angle;actors.forEach(a=>{a.root.visible=true;const wx=x+Math.cos(angle)*a.root.position.x+Math.sin(angle)*a.root.position.z;a.root.position.y=groundY(wx)-groundY(x)})},pose(mode,t){actors.forEach((a,k)=>a.pose(mode,t+k*.24))}}
}
function makeBag(parent,c='#bd815f'){const g=new T.Group();box(g,0,.25,0,.55,.5,.32,c);const h=new T.Mesh(new T.TorusGeometry(.15,.025,4,10,Math.PI),mat('#615445'));h.position.set(0,.5,0);g.add(h);parent.add(g);return g}
function makeCar(parent,color){const g=new T.Group();box(g,0,.52,0,1.85,.65,4.0,color);box(g,0,1.11,-.12,1.55,.7,2.15,'#617e86');box(g,0,1.49,-.1,1.66,.12,2.2,color);box(g,0,.49,2.04,1.8,.16,.12,'#c3c9bd');for(const x of [-.94,.94])for(const z of [-1.25,1.25]){const w=cyl(g,x,.38,z,.36,.36,.15,'#293a40',10);w.rotation.z=Math.PI/2}for(const x of [-.62,.62]){box(g,x,.7,2.04,.45,.15,.07,'#eee2ba');box(g,x,.72,-2.04,.4,.15,.07,'#ca6650')}
 const door=new T.Group();door.position.set(-.96,.6,.92);g.add(door);box(door,0,.22,-.52,.06,.45,1.05,color);box(door,0,.7,-.52,.045,.48,1.0,'#7696a0');box(door,-.05,.3,-.8,.045,.05,.2,'#dbd3b9');parent.add(g);return{g,door}}

export class FilmWorld{
 constructor(container){this.el=container;this.w=1000;this.h=600;this.free=false;this.lastShot='';this.v=new T.Vector3();this.target=new T.Vector3();this.camera=new T.PerspectiveCamera(45,1,.08,650);this.scene=new T.Scene();this.scene.background=new T.Color('#7daebd');this.scene.fog=new T.Fog('#7daebd',125,360);this.coast=new T.Group();this.cafe=new T.Group();this.scene.add(this.coast,this.cafe);
 let support=false;try{const c=document.createElement('canvas');support=!!c.getContext('webgl2')}catch{}if(support){this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15}else this.renderer=new SoftwareRenderer();
 this.el.appendChild(this.renderer.domElement);this.el.dataset.renderer=this.renderer.isSoftware?'3d-software':'3d-webgl';this.renderer.domElement.setAttribute('aria-label','Scène en trois dimensions, personnages articulés et caméra mobile');
 const hemi=new T.HemisphereLight('#d8edee','#9b9272',2.3);this.scene.add(hemi);const sun=new T.DirectionalLight('#fff0d3',3);sun.position.set(-35,80,45);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-90,right:90,top:90,bottom:-90,far:220});sun.shadow.normalBias=.03;this.scene.add(sun);
 this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enabled=false;this.controls.enableDamping=true;this.controls.enablePan=false;this.controls.maxDistance=220;this.controls.minDistance=1.5;this.controls.maxPolarAngle=Math.PI*.49;
 this.families=familiesInit(this.coast);this.crowd=[];this.cars=[];this.responders=[];this.arrows=[];this.buildings=[];this.buildCoast();this.buildCafe();this.tileCameras=Array.from({length:4},()=>new T.PerspectiveCamera(42,1,.08,650));this.resize();new ResizeObserver(()=>this.resize()).observe(container);
 }
 resize(){this.w=this.el.clientWidth;this.h=this.el.clientHeight;this.renderer.setSize(this.w,this.h);this.camera.aspect=this.w/this.h;this.camera.updateProjectionMatrix()}
 setFree(v){this.free=v;this.controls.enabled=v;this.controls.target.copy(this.target);return v}
 buildCoast(){const root=this.coast;
 plane(root,-100,-3,-86,86,'#9aa98a');plane(root,-3,16,-86,86,'#dac69a');this.seabed=plane(root,16,95,-90,90,'#b9ae8e',()=>-.3);
 // Roads are tiled along the slope, avoiding long triangles at close camera distances.
 for(const z of [-55,-28,3,31,57])for(let x=-95;x<-7;x+=4){const r=box(root,x,groundY(x)+.045,z,4.05,.06,4.6,'#7f8a80');r.rotation.z=-Math.atan(x<-23?.28:0);if(x<-24&&x%8===-7)box(root,x,groundY(x)+.09,z,.7,.025,.16,'#ded5ba')}
 for(let z=-85;z<86;z+=4)box(root,-9,.4,z,5.5,.08,4.05,'#b9b49d');for(let z=-85;z<86;z+=4)box(root,-15,.42,z,5,.08,4.05,'#77867c');
 const hues=['#e1c7a0','#e0ceb2','#c8c7aa','#c6ad8c'];for(let x=-85;x<-21;x+=14)for(let z=-73;z<74;z+=13){if([-55,-28,3,31,57].some(a=>Math.abs(a-z)<6))continue;const building=new T.Group();root.add(building);this.buildings.push({root:building,x,z});const y=groundY(x,z),h=4.5+rand()*4.5,w=7+rand()*2,d=7+rand()*2;box(building,x,y+h/2,z,w,h,d,hues[Math.floor(rand()*4)]);const roof=cyl(building,x,y+h+.9,z,0,w*.76,2,'#b77a58',4);roof.scale.z=d/w;roof.rotation.y=Math.PI/4;for(let floor=0;floor<Math.floor(h/2.4);floor++)for(const dx of [-w*.25,w*.25]){box(building,x+dx,y+1.6+floor*2.4,z+d/2+.045,.8,1.05,.06,'#5d7c7c');box(building,x+w/2+.045,y+1.6+floor*2.4,z+dx,.06,1.05,.8,'#5d7c7c')}}
 for(let i=0;i<29;i++){const x=-40-rand()*55,z=-82+rand()*164,y=groundY(x);cyl(root,x,y+1.3,z,.15,.23,2.6,'#82745d');cyl(root,x,y+4.2,z,0,1.6,4.5,'#597956',7)}
 for(let z=-74;z<80;z+=15){cyl(root,-3,2.3,z,.1,.17,4,'#9a8162');for(let k=0;k<5;k++){const leaf=box(root,-3+Math.sin(k*1.256),4.1,z+Math.cos(k*1.256),.55,.08,2.8,'#6e8b63');leaf.rotation.y=-k*1.256;leaf.rotation.z=.2}}
 for(let i=0;i<24;i++){const x=1+rand()*11,z=-78+rand()*155;cyl(root,x,1.2,z,.04,.04,1.7,'#bbab85');cyl(root,x,2.13,z,0,1.2,.65,['#d79c79','#deccaa','#9cb5a3'][i%3],8);box(root,x+.6,.4,z+1.1,1,.03,1.9,i%2?'#b08e77':'#b6c2b0')}
 for(let i=0;i<16;i++){const car=makeCar(root,['#b5c0b6','#d7c6a9','#ac6f58','#8ca9ab'][i%4]);car.g.position.set(-14,.35,-72+i*9.2);this.cars.push(car)}this.rossiCar=this.cars[11];this.rossiCar.g.position.z=29;
 this.bags=[makeBag(root,'#d79977'),makeBag(root,'#dbc9a1'),makeBag(root,'#86a6af')];this.bags[0].position.set(5,.35,-17);this.bags[1].position.set(6,.35,-17);this.bags[2].position.set(6,.35,13);
 for(let i=0;i<46;i++){const p=makeSimplePerson(['#e5d0ad','#b58f79','#7fa497','#b7beb3','#7793a0'][i%5]);root.add(p.root);p.x=-52+rand()*64;p.z=-70+rand()*140;p.phase=rand()*10;p.safe=i%6===0;this.crowd.push(p)}
 for(let i=0;i<2;i++){const team={root:new T.Group(),actors:[]};root.add(team.root);for(let j=0;j<2;j++){const p=makePerson('#324b56','#cfaa87','#3c3731');p.root.position.z=j*1.2;box(p.torso,0,.34,.121,.4,.045,.012,'#e8d777');team.root.add(p.root);team.actors.push(p)}this.responders.push(team)}
 this.waterGeo=new T.PlaneGeometry(220,205,45,30);this.waterGeo.rotateX(-Math.PI/2);this.waterBase=this.waterGeo.attributes.position.array.slice();this.water=mesh(this.waterGeo,mat('#367e91',{roughness:.28,metalness:.16,side:T.DoubleSide}),root);this.water.position.set(115,0,0);
 this.waveGeo=new T.PlaneGeometry(19,180,28,42);this.waveGeo.rotateX(-Math.PI/2);this.waveBase=this.waveGeo.attributes.position.array.slice();this.wave=mesh(this.waveGeo,mat('#5aabae',{roughness:.32,side:T.DoubleSide}),root);
 // The back of the advancing bore holds water behind the crest.
 this.floodGeo=new T.PlaneGeometry(65,176,28,28);this.floodGeo.rotateX(-Math.PI/2);this.floodBase=this.floodGeo.attributes.position.array.slice();this.flood=mesh(this.floodGeo,mat('#659e9f',{roughness:.4,side:T.DoubleSide}),root);
 const foam=new Float32Array(480*3);this.foamSeed=[];for(let i=0;i<480;i++){const f={x:rand(),z:rand(),a:rand()*6,s:rand()};this.foamSeed.push(f);foam[i*3]=(f.x-.5)*4;foam[i*3+1]=3+f.s*.35;foam[i*3+2]=(f.z-.5)*176}const fg=new T.BufferGeometry();fg.setAttribute('position',new T.BufferAttribute(foam,3));this.foam=new T.Points(fg,new T.PointsMaterial({color:'#eff5dc',size:.14,transparent:true,opacity:.85}));root.add(this.foam);
 this.foamSkinGeo=new T.PlaneGeometry(3.1,180,6,80);this.foamSkinGeo.rotateX(-Math.PI/2);this.foamSkinBase=this.foamSkinGeo.attributes.position.array.slice();this.foamSkin=mesh(this.foamSkinGeo,mat('#d8e9db',{roughness:.94,side:T.DoubleSide}),root);
 this.whitewater=[];for(let i=0;i<105;i++){const z=-85+i*1.65,r=.15+rand()*.22;const o=mesh(geo('puff'+(i%3),()=>new T.SphereGeometry(.08+(i%3)*.025,6,4)),mat(i%2?'#d4e9df':'#a7d3cf'),root);o.scale.set(2+rand(),.4+rand()*.5,1.4+rand());this.whitewater.push({o,z,p:rand()*6,r})}
 this.foregroundParasol=new T.Group();root.add(this.foregroundParasol);cyl(this.foregroundParasol,0,.9,0,.045,.045,1.8,'#bbab85');cyl(this.foregroundParasol,0,1.85,0,0,1.3,.6,'#d79c79',8);this.foregroundParasol.position.set(8,.35,-5);
 const spray=new Float32Array(150*3);this.sprayGeo=new T.BufferGeometry();this.sprayGeo.setAttribute('position',new T.BufferAttribute(spray,3));this.spray=new T.Points(this.sprayGeo,new T.PointsMaterial({color:'#cce7df',size:.075,transparent:true,opacity:.8}));root.add(this.spray);
 this.debris=[];for(let i=0;i<11;i++){const o=box(root,0,0,0,.6,.2,1,'#b9a688');this.debris.push({o,z:-55+rand()*110,x:rand()*12})}
 // Broad 3D arrows make the two opposing pedestrian movements legible.
 for(const [z,color,dir] of [[3,'#eda88a',1],[-28,'#add9b7',-1]]){const g=new T.Group();const shaft=box(g,0,0,0,10,.025,.65,color);const head=cyl(g,dir*5.7,0,0,0,1.2,2.2,color,3);head.rotation.z=-dir*Math.PI/2;g.position.set(-28,groundY(-28)+.13,z);g.rotation.z=-Math.atan(.28);root.add(g);this.arrows.push(g)}
 }
 buildCafe(){const clutterColors=new Set(['#597956','#82745d','#9a8162','#6e8b63','#d79c79','#deccaa','#9cb5a3','#bbab85']);this.clutter=this.coast.children.filter(o=>o.isMesh&&clutterColors.has('#'+o.material.color.getHexString()));const p=this.cafe;
 plane(p,-7,7,-7,7,'#b6a68c',()=>0);box(p,0,2.5,-2.3,12,5,.22,'#d1bc96');box(p,-6,2.5,1,.2,5,7,'#bda77f');box(p,5.5,2.5,1,.2,5,7,'#c5b38e');
 // Window frame, blue sky and a dimensional sill.
 box(p,3.5,2.9,-2.12,2.6,2.3,.09,'#7fa5ab');for(const x of [2.08,3.5,4.92])box(p,x,2.9,-1.98,.1,2.5,.12,'#6e6454');box(p,3.5,1.68,-1.85,3,.12,.55,'#b29d78');
 this.fracture=new T.Group();this.fracture.position.set(-2.4,.2,-2.14);p.add(this.fracture);const crackPts=[[0,4.9],[-.18,4.35],[.1,3.9],[-.25,3.25],[.02,2.85],[-.35,2.3],[-.2,1.9],[-.55,1.4],[-.35,.85],[-.7,.2]];this.crackMeshes=[ribbon(this.fracture,crackPts,'#574330',.065),ribbon(this.fracture,[[.02,2.85],[.65,2.7],[.96,2.15],[1.5,2]],'#78634b',.035),ribbon(this.fracture,[[-.2,1.9],[-.85,1.55],[-1.15,1.05]],'#78634b',.03)];this.crackMeshes.forEach(m=>m.geometry.setDrawRange(0,0));
 box(p,-2.8,.95,-.7,3,.13,1.5,'#846d51');for(const x of [-3.9,-1.7])for(const z of [-1.2,-.2])box(p,x,.47,z,.1,.94,.1,'#6b5b45');this.glass=cyl(p,-1.7,1.18,-.48,.11,.1,.36,'#b9d0cc',10);this.glassBase=this.glass.position.clone();cyl(p,-2.1,1.03,-.6,.17,.17,.025,'#d7d4ba',10);
 this.picture=new T.Group();this.picture.position.set(.45,3.2,-2.1);p.add(this.picture);box(this.picture,0,0,0,1.3,1.0,.1,'#75664f');box(this.picture,0,0,.06,1.12,.82,.03,'#879da0');
 this.cafePeople=[makePerson(palette[0],'#dfb18c','#443b31'),makePerson('#d9d1b8','#d7ad89','#503f30',true)];this.cafePeople.forEach((a,i)=>{a.root.position.set(1.7+i*1.1,0,.3);a.root.rotation.y=-.25;p.add(a.root)});
 const dust=new Float32Array(170*3);this.dustSeed=Array.from({length:170},()=>({x:rand()*8-5,y:rand()*5,z:rand()*3-1.7,s:rand()}));this.dustGeo=new T.BufferGeometry();this.dustGeo.setAttribute('position',new T.BufferAttribute(dust,3));this.dust=new T.Points(this.dustGeo,new T.PointsMaterial({color:'#e5d7b9',size:.038,transparent:true,opacity:.55}));p.add(this.dust);
 }
 setCamera(subject,offset,bias=0,fov=45){const point=new T.Vector3(...subject),pos=point.clone().add(new T.Vector3(...offset));const dir=point.clone().sub(pos).normalize(),right=dir.clone().cross(new T.Vector3(0,1,0));this.target.copy(point).addScaledVector(right,-bias);this.camera.position.copy(pos);this.camera.fov=fov;this.camera.aspect=this.w/this.h;this.camera.updateProjectionMatrix();this.camera.lookAt(this.target)}
 update(s,p,t,idle=false){const id=idle?'poster':s.id;this.lastShot=id;this.cafe.visible=id==='quake'||id==='crack';this.coast.visible=!this.cafe.visible;this.scene.background.set(this.cafe.visible?'#bdb18f':'#7daebd');this.el.dataset.shot=id;
 this.clutter.forEach(o=>o.visible=!(s.family!==undefined||s.grid||id==='safety'));
 const minute=id==='summer'?-1:id==='families'?4:id==='martin'?4:id==='bags'?8:id==='rossi'?5:id==='jam'?10:id==='benali'?6:id==='retreat'?10+4*p:id==='laurent'?12:id==='ops'?13:id==='alert'?15:id==='countdown'?15:id==='outcome'||id==='safety'?22:id==='wave'||id==='impact'||id==='coast'?20:0;
 this.families.forEach((f,i)=>{const pos=[[5,-18],[-16,28],[-60,3],[-29,12]][i];f.set(...pos,-.45);f.root.visible=true;f.pose('idle',t)});
 const martin=this.families[0],rossi=this.families[1],benali=this.families[2],laurent=this.families[3];
 this.bags[0].position.set(5,.35,-16.8);this.bags[1].position.set(6,.35,-17);this.bags[2].position.set(6,.35,13);this.bags.forEach(b=>b.rotation.set(0,0,0));
 martin.actors[0].pose(id==='martin'||id==='bags'?'pick':'carry',t,id==='martin'?Math.sin(cl(p/.75)*Math.PI)*.85:id==='bags'?.45+Math.sin(p*3)*.2:0);martin.actors[1].pose('worried',t);martin.actors[2].head.rotation.y=-.6;
 if(id==='martin'&&p>.42||id==='bags'){this.scene.updateMatrixWorld(true);const hand=martin.actors[0].hands[1].getWorldPosition(new T.Vector3());this.bags[0].position.copy(hand).add(new T.Vector3(0,-.45,0));this.bags[0].position.y=Math.max(.35,this.bags[0].position.y)}
 const approach=parkingApproach(p),rossWalking=id==='rossi'&&approach.moving;rossi.set(-16.6,id==='rossi'?approach.z:29.5,id==='rossi'?approach.heading:Math.PI/2);rossi.pose(rossWalking?'walk':'worried',t);if(!rossWalking)rossi.actors[0].pose('point',t);this.rossiCar.door.rotation.y=id==='rossi'?-.95*ease((p-.63)/.24):-.95;
 this.cars.forEach((c,i)=>{if(c!==this.rossiCar)c.g.position.z=-72+i*9.2;else c.g.position.z=29;c.g.position.y=.35;c.g.rotation.set(0,0,0)});
 if(id==='jam'){this.rossiCar.g.position.z=29+blockedCarAdvance(p)}
 if(id==='benali'){benali.set(-33-13*p,3,-Math.PI/2);benali.pose('walk',t)}else if(minute>=15||id==='safety'){benali.set(-78,3,.5);benali.pose(id==='safety'?'walk':'idle',t)}else benali.set(-44,3,-Math.PI/2);
 if(id==='laurent'){const prog=cl((p-.22)/.78);laurent.set(4-16*prog,13,p<.22?-.7:-Math.PI/2);laurent.pose(p<.22?'idle':'run',t);if(p<.22)laurent.actors[0].pose('point',t)}else if(minute>=15)laurent.set(minute>=20?-73:-50,13,-Math.PI/2);else laurent.set(5,13,-.4);
 this.crowd.forEach((a,i)=>{let x=a.x,z=a.z,walk=false,dir=0;if(minute>=0){const progress=cl((minute-1)/5);if(a.safe){x=mix(a.x,-73,cl((minute-1)/15));dir=-Math.PI/2}else if(a.x<-8){x=mix(a.x,2+(i%6),progress);dir=Math.PI/2}if(id==='crowd'){x=mix(a.x,2+(i%6),cl(p*.8+(i%4)*.1));dir=Math.PI/2;walk=true}else if(minute>=15&&i%3===0){x=mix(4,-56,cl((minute-15)/5));dir=-Math.PI/2;walk=true}}
 a.root.position.set(x,groundY(x,z),z);a.root.rotation.y=dir;a.animate(t+a.phase,walk||id==='summer');a.root.visible=!(minute>=20&&x>-25)&&!s.grid;});
 this.responders.forEach((team,i)=>{const x=i===0?(id==='ops'?-24-10*p:-64):-15,z=i===0?3:39;team.root.position.set(x,groundY(x),z);team.root.rotation.y=i===0?-Math.PI/2:-.5;team.actors.forEach((a,k)=>a.pose(i===0?'walk':'point',t+k*.5));team.root.visible=!s.grid});
 this.arrows.forEach(a=>a.visible=id==='crowd'||id==='ops');
 const retreat=minute>=10&&minute<20?ease((minute-10)/3.8):0;let boundary=15+retreat*52;if(id==='wave'||id==='poster')boundary=(id==='poster'?27:mix(53,13,ease(p)))+8.7;if(id==='impact')boundary=mix(13,-14,ease(p))+8.7;this.seabed.visible=retreat>0;this.seabed.scale.x=cl((boundary-16)/79);this.seabed.position.x=16*(1-this.seabed.scale.x);const waterPos=this.waterGeo.attributes.position;for(let i=0;i<waterPos.count;i++){const k=i*3,f=(this.waterBase[k]+110)/220,x=boundary+f*205,z=this.waterBase[k+2];waterPos.setXYZ(i,x-115,.08+Math.sin(x*.24+t*1.6)*.06+Math.cos(z*.18+t)*.04,z)}waterPos.needsUpdate=true;
 this.wave.visible=id==='wave'||id==='impact'||id==='poster';this.foam.visible=this.wave.visible;this.spray.visible=this.wave.visible;
 const waveX=id==='poster'?27:id==='wave'?mix(53,13,ease(p)):mix(13,-14,ease(p));const amp=3;this.wave.position.x=waveX;this.foam.position.x=waveX;this.spray.position.x=waveX;
 const wavePos=this.waveGeo.attributes.position;for(let i=0;i<wavePos.count;i++){const k=i*3,x=this.waveBase[k],z=this.waveBase[k+2];const bell=Math.exp(-Math.pow((x+1)/3.8,2));wavePos.setY(i,.1+bell*amp*(.94+.06*Math.sin(z*.6+t*2))+Math.sin(z*2.4+t*4)*.07*bell)}wavePos.needsUpdate=true;this.waveGeo.computeVertexNormals();
 this.foamSkin.visible=this.wave.visible;this.foamSkin.position.x=waveX;const skin=this.foamSkinGeo.attributes.position;for(let i=0;i<skin.count;i++){const k=i*3,z=this.foamSkinBase[k+2],x=this.foamSkinBase[k]-3.0+Math.sin(z*1.7+t*2)*.45;const bell=Math.exp(-Math.pow((x+1)/3.8,2));skin.setXYZ(i,x,.18+bell*amp*(.94+.06*Math.sin(z*.6+t*2))+Math.sin(z*2.4+t*4)*.07*bell,z)}skin.needsUpdate=true;this.foamSkinGeo.computeVertexNormals();
 this.whitewater.forEach((a,i)=>{a.o.visible=this.wave.visible;const roll=(t*.55+a.p)%1;a.o.position.set(waveX-1.8-roll*2.2,2.75-Math.pow(roll,2)*.8+Math.sin(a.z*.6+t*2)*.17,a.z+Math.sin(t+a.p)*.3);a.o.rotation.set(t+a.p,t*.7+i,t*.3);});
 this.foregroundParasol.visible=id==='wave'||id==='impact'||id==='poster';this.foregroundParasol.position.set(8-(id==='impact'?p*10:0),id==='impact'?.35+p*1.3:.35,-5);this.foregroundParasol.rotation.z=id==='impact'?p*1.8:.25;
 const fp=this.foam.geometry.attributes.position;this.foamSeed.forEach((f,i)=>{const z=(f.z-.5)*176;fp.setXYZ(i,(f.x-.5)*5+Math.sin(t*3+f.a)*.4,2.7+Math.sin(z*.6+t*2)*.18+f.s*.4,z)});fp.needsUpdate=true;
 const sp=this.sprayGeo.attributes.position;for(let i=0;i<sp.count;i++){const f=this.foamSeed[i],phase=(t*.65+f.s)%1;sp.setXYZ(i,-phase*3-f.x*2,2.4+Math.sin(phase*Math.PI)*1.4,(f.z-.5)*170+Math.sin(t+f.a)*.5)}sp.needsUpdate=true;
 const flooded=id==='impact'||id==='coast'||id==='outcome'||id==='safety';this.flood.visible=flooded;const front=id==='impact'?mix(15,-23,ease(p)):-23;const fl=this.floodGeo.attributes.position;for(let i=0;i<fl.count;i++){const k=i*3,x=this.floodBase[k]+32.5+front,z=this.floodBase[k+2];fl.setXYZ(i,x,Math.max(.45,2.1-Math.max(0,-x-10)*.09)+Math.sin(z*.42+t*2)*.1,z)}fl.needsUpdate=true;this.floodGeo.computeVertexNormals();
 this.debris.forEach((a,i)=>{a.o.visible=flooded;a.o.position.set(a.x-(id==='impact'?p:1)*16,1.9+Math.sin(t+i)*.13,a.z);a.o.rotation.set(Math.sin(t+i)*.1,t*.18+i,.15)});
 if(flooded){martin.root.visible=false;rossi.root.visible=false;this.responders[1].root.visible=false;this.cars.forEach((c,i)=>{c.g.rotation.z=Math.sin(i)*.14;c.g.position.y=1.1})}
 if(this.cafe.visible){const growth=id==='quake'?ease(p*.65):.65+.35*ease(p);this.crackMeshes.forEach(m=>{const n=m.geometry.attributes.position.count;m.geometry.setDrawRange(0,Math.floor(n*growth/3)*3)});this.picture.rotation.z=Math.sin(t*17)*.08*(1-p*.5);const fall=id==='quake'?cl((p-.4)/.4):1;this.glass.position.copy(this.glassBase);this.glass.position.x+=fall*.9;this.glass.position.y-=ease(fall)*.9;this.glass.rotation.z=fall*2;this.cafePeople.forEach((a,i)=>{a.pose('shield',t+i);a.root.position.x=1.5+i*1.2+Math.sin(t*19+i)*.04});const dp=this.dustGeo.attributes.position;this.dustSeed.forEach((a,i)=>dp.setXYZ(i,a.x+Math.sin(t+a.s)*.1,(a.y-t*.35*(a.s+.4)+50)%5,a.z));dp.needsUpdate=true;}
 if(!this.free){switch(id){
 case 'poster':this.setCamera([16,1.4,0],[32,13,30],0,44);break;
 case 'summer':this.setCamera([-7,1,0],[70-5*p,43,63],0,44);break;
 case 'quake':this.setCamera([-.2,2.4,-1.1],[4.3-1.1*p,.4,7.7-1.1*p],0,47);break;
 case 'crack':this.setCamera([-2.6,2.7,-2.05],[.5,.1,3.8-p*.9],0,45);break;
 case 'crowd':this.setCamera([-23,3,3],[21,13,28-p*4],0,49);break;
 case 'martin':case 'bags':this.setCamera([5,1.25,-18],[-3.8,.9,4.7],1.2,id==='bags'?36:42);break;
 case 'rossi':this.setCamera([-15.2,1.2,29],[-5,1.4,6],1.4,42);break;
 case 'jam':this.setCamera([-14,1.1,27],[3.8,1.9,7],1.4,40);break;
 case 'benali':{const x=benali.root.position.x;this.setCamera([x,groundY(x)+1.25,3],[-4.3,1,4.6],1.2,42);break}
 case 'retreat':this.setCamera([27,0,5],[-26,11,37],.8,48);break;
 case 'laurent':{const x=laurent.root.position.x;this.setCamera([x,groundY(x)+1.3,13],[-4.3,1,4.8],1.2,42);break}
 case 'ops':this.setCamera([-20,1.5,23],[-10,5,20],0,48);break;
 case 'alert':this.setCamera([-18,4,10],[39,31,40],0,46);break;
 case 'wave':this.setCamera([waveX,1.8,0],[-(waveX-5),-.7,5],0,62);break;
 case 'impact':this.setCamera([waveX,1.5,0],[-Math.max(2,waveX-5),-.3,3],0,64);break;
 case 'coast':this.setCamera([-3,1,0],[70,49,58],0,46);break;
 case 'safety':this.setCamera([-76,groundY(-76)+1.25,6],[-8,2.4,10],2.3,45);break;
 default:this.setCamera([-15,2,0],[50,32,49],0,44)
 }
 if((id==='quake'||id==='crack')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const a=id==='crack'?.035:.08;this.camera.position.x+=Math.sin(t*74)*a;this.camera.position.y+=Math.sin(t*51)*a;this.camera.rotation.z+=Math.sin(t*63)*a*.12}
 }else this.controls.update();
 if(s.grid)this.families.forEach(f=>{f.set(f.root.position.x,f.root.position.z,-.45);f.pose('idle',t)});
 this.buildings.forEach(b=>{const subjects=s.grid?this.families:s.family!==undefined?[this.families[s.family]]:id==='safety'?[this.families[2],this.families[3]]:[];b.root.visible=!subjects.some(f=>Math.hypot(f.root.position.x-b.x,f.root.position.z-b.z)<14)});
 if(id==='retreat'){this.families.forEach(f=>f.root.visible=false);this.crowd.forEach(a=>a.root.visible=false);this.responders.forEach(team=>team.root.visible=false)}
 this.scene.updateMatrixWorld(true);
 }
 render(s,p,t,idle=false){this.update(s,p,t,idle);const r=this.renderer;if(s.grid&&!idle&&!this.free){const mobile=this.w<600,cols=mobile?2:4,rows=mobile?2:1;this.crowd.forEach(a=>a.root.visible=false);if(r.isSoftware)r.begin();else{r.setScissorTest(true);r.clear()}
 for(let i=0;i<4;i++){const f=this.families[i],cam=this.tileCameras[i],x=f.root.position.x,y=groundY(x)+1.05,z=f.root.position.z;cam.aspect=(this.w/cols)/(this.h/rows);cam.fov=mobile?42:40;cam.position.set(x-5.7,y+1.5,z+6.8);cam.lookAt(x,y-.25,z);cam.updateProjectionMatrix();const vx=i%cols*this.w/cols,vy=Math.floor(i/cols)*this.h/rows;
 this.families.forEach((ff,j)=>ff.root.visible=j===i&&!(s.grid==='outcome'&&i<2));
 if(r.isSoftware)r.render(this.scene,cam,{x:vx,y:vy,w:this.w/cols,h:this.h/rows});else{r.setViewport(vx,this.h-vy-this.h/rows,this.w/cols,this.h/rows);r.setScissor(vx,this.h-vy-this.h/rows,this.w/cols,this.h/rows);r.render(this.scene,cam)}}
 if(!r.isSoftware){r.setScissorTest(false);r.setViewport(0,0,this.w,this.h)}
 }else{if(!r.isSoftware){r.setViewport(0,0,this.w,this.h);r.setScissorTest(false)}r.render(this.scene,this.camera)}
 }
}
function familiesInit(parent){return palette.map((c,i)=>{const f=makeFamily(i);parent.add(f.root);return f})}
function makeSimplePerson(color){const root=new T.Group();
 humanLoft(root,'crowd-torso',[[.82,.055,.06],[.9,.145,.09],[1.04,.12,.085],[1.23,.17,.1],[1.39,.20,.095],[1.43,.065,.055]],color,10);
 ellipsoid(root,0,1.5,0,.048,.08,.045,'#d3c9b8',8);
 const h=ellipsoid(root,0,1.65,0,.09,.122,.083,'#d3c9b8',10);
 const legs=[],arms=[];for(const side of [-1,1]){const pivot=new T.Group();pivot.position.set(side*.085,.91,0);root.add(pivot);humanLoft(pivot,'crowd-leg',[[-.85,.033,.035],[-.66,.041,.05],[-.42,.046,.055],[-.17,.076,.078],[.02,.072,.07]],'#94988c',8);ellipsoid(pivot,0,-.86,.045,.052,.04,.12,'#969b94',8);legs.push(pivot);const arm=new T.Group();arm.position.set(side*.19,1.36,0);root.add(arm);humanLoft(arm,'crowd-arm',[[-.57,.02,.023],[-.35,.036,.036],[-.13,.052,.051],[.03,.06,.058]],'#d3c9b8',8);ellipsoid(arm,0,-.6,0,.028,.053,.02,'#d3c9b8',8);arms.push(arm)}
 return{root,legs,animate(t,walking){legs.forEach((l,i)=>l.rotation.x=walking?Math.sin(t*5.8+i*Math.PI)*.35:0);arms.forEach((l,i)=>l.rotation.x=walking?-Math.sin(t*5.8+i*Math.PI)*.3:0)}}}
