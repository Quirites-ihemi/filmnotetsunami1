import {FilmWorld} from './scene3d.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const families=[
 {name:'Martin',color:'#f7ad94',choice:'Récupérer\nles affaires.',alarm:'Départ retardé.\nEncore sur la plage.',cause:'Retard sur la plage.',end:'Emportés\npar la vague.',result:'Décès dans ce scénario',lost:true},
 {name:'Rossi',color:'#f0ca7f',choice:'Aller chercher\nla voiture.',alarm:'Sortie bloquée.\nEncore au parking.',cause:'Blocage au parking.',end:'Emportés\npar la vague.',result:'Décès dans ce scénario',lost:true},
 {name:'Benali',color:'#bde6c3',choice:'Monter à pied\nsans attendre.',alarm:'Déjà sur les hauteurs.',cause:'Arrivée sur les hauteurs avant la vague.',end:'Hors d’atteinte\nde la vague.',result:'Survie dans ce scénario',lost:false},
 {name:'Laurent',color:'#a6cced',choice:'Évacuer dès\nle retrait de la mer.',alarm:'Montée en cours.\nAffaires abandonnées.',cause:'Littoral quitté avant l’arrivée de l’eau.',end:'Les hauteurs\nà temps.',result:'Survie dans ce scénario',lost:false}
];
const shots=[
 {id:'summer',d:7,clock:'14:59',name:'UN APRÈS-MIDI D’ÉTÉ',k:'ANTIBES · UN 15 AOÛT',h:'La foule.\nLa mer.',sub:'Un après-midi d’été.',},
 {id:'quake',d:8,clock:'15:00',name:'LA SECOUSSE',k:'15 H · SÉISME EN MER LIGURE',h:'La secousse.',sub:'À Antibes. Les premiers dégâts.',quake:true},
 {id:'crack',d:7,clock:'15:00',name:'LES FISSURES',k:'DANS LES BÂTIMENTS',h:'Les murs.\nLes fissures.',sub:'La peur. Le départ.',quake:true,crack:true},
 {id:'crowd',d:9,clock:'15:03',name:'VERS LA PLAGE',k:'LES SORTIES D’IMMEUBLES',h:'La plage.\nUn faux refuge.',sub:'La foule vers le littoral.',flow:true},
 {id:'families',d:13,clock:'15:04',name:'LES QUATRE CHOIX',k:'LES QUATRE CHOIX',h:'Quatre familles. Quatre choix.',grid:'intro'},
 {id:'martin',d:8,clock:'15:04',name:'LES AFFAIRES',family:0,phase:'choice',k:'CHOIX · LES MARTIN',h:'Récupérer\nles affaires.',sub:'Toute la famille dans l’attente.',},
 {id:'rossi',d:8,clock:'15:05',name:'LA VOITURE',family:1,phase:'choice',k:'CHOIX · LES ROSSI',h:'Aller chercher\nla voiture.',sub:'Retour vers le parking du bord de mer.',},
 {id:'benali',d:9,clock:'15:06',name:'LE DÉPART À PIED',family:2,phase:'choice',k:'CHOIX · LES BENALI',h:'Monter à pied.\nSans attendre.',sub:'Départ immédiat vers les hauteurs.',},
 {id:'bags',d:6,clock:'15:08',name:'LE TEMPS PERDU',family:0,phase:'consequence',k:'CONSÉQUENCE · LES MARTIN',h:'Un départ\nretardé.',sub:'La famille encore au bord de l’eau.',},
 {id:'jam',d:6,clock:'15:10',name:'LA SORTIE BLOQUÉE',family:1,phase:'consequence',k:'CONSÉQUENCE · LES ROSSI',h:'La voiture\nbloquée.',sub:'La famille immobilisée dans la zone exposée.',},
 {id:'retreat',d:9,clock:'15:10',name:'LA MER EN RETRAIT',k:'SUR LE LITTORAL',h:'La mer en retrait.',sub:'Un signe de danger.',},
 {id:'laurent',d:9,clock:'15:12',name:'LE SIGNE RECONNU',family:3,phase:'choice',k:'CHOIX · LES LAURENT',h:'Évacuer dès\nle retrait de la mer.',sub:'Les sacs abandonnés. La montée à pied.',},
 {id:'ops',d:10,clock:'15:13',name:'LES SECOURS',k:'SECOURS · FORCES DE L’ORDRE',h:'Deux équipes.\nDeux décisions.',sub:'Élus. Commandement. Médias. Sous pression.',ops:true},
 {id:'alert',d:10,clock:'15:15',name:'FR-ALERT',k:'QUINZE MINUTES APRÈS LA SECOUSSE',h:'L’alerte.\nEnfin.',sub:'Les hauteurs. Sans les affaires.',phone:true},
 {id:'countdown',d:11,clock:'15:15',name:'LES CONSÉQUENCES À L’ALERTE',k:'À L’ALERTE',h:'Cinq minutes avant la vague.',grid:'alarm'},
 {id:'wave',d:9,clock:'15:20',name:'LA VAGUE',k:'15 H 20 · TROIS MÈTRES DANS LE SCÉNARIO',h:'La vague.',sub:'Vingt minutes après la secousse.',wave:true},
 {id:'impact',d:7,clock:'15:20',name:'LA SUBMERSION',k:'LE LITTORAL SOUS L’EAU',h:'La plage.\nLe parking.',sub:'Les trajectoires interrompues.',wave:true,impact:true},
 {id:'coast',d:6,clock:'15:20',name:'LES TROIS SECTEURS',k:'DANS LE MÊME SCÉNARIO',h:'La Salis.\nVillefranche. Cap Ferrat.',sub:'Antibes · Rade de Villefranche-sur-Mer · Est du Cap Ferrat',coast:true},
 {id:'outcome',d:16,clock:'15:22',name:'LES CONSÉQUENCES DES CHOIX',k:'APRÈS LA VAGUE',h:'Les conséquences des choix.',grid:'outcome'},
 {id:'safety',d:10,clock:'15:22',name:'LE RÉFLEXE',k:'FACE AUX SIGNES NATURELS',h:'Les hauteurs.\nÀ pied. Sans délai.',sub:'Sans attendre l’alerte officielle. Puis en lieu sûr, jusqu’aux consignes des autorités.',safety:true}
];
let duration=0;shots.forEach(s=>{s.start=duration;duration+=s.d;s.end=duration});
let time=0,index=-1,playing=false,started=false,rate=1,sound=false,lastFrame=performance.now(),lastBeep=-1;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const player=$('#player'),canvas=$('#effects'),ctx=canvas.getContext('2d');let W=1000,H=600;
let world;try{world=new FilmWorld($('#world3d'));$('#loading3d').remove()}catch(e){$('#loading3d').textContent='Le rendu 3D n’a pas démarré. Rechargez la page.';console.error(e)}
const fmt=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(Math.floor(n%60)).padStart(2,'0')}`;
function getShot(t){return Math.min(shots.length-1,shots.findIndex(s=>t<s.end)===-1?shots.length-1:shots.findIndex(s=>t<s.end))}
const chapterSpecs=[['La secousse',1],['La foule',3],['Les choix',4],['Le retrait',10],['L’alerte',13],['La vague',15],['Les conséquences',18]];
$('#chapters').innerHTML=chapterSpecs.map(([n,i],j)=>`<button data-shot="${i}"><small>${String(j+1).padStart(2,'0')}</small>${n}</button>`).join('');
$$('[data-shot]').forEach(b=>b.onclick=()=>{begin(false);seek(shots[+b.dataset.shot].start+.01)});
$('#timeline').max=duration;$('#filmTime').innerHTML=`00:00 <i>/ ${fmt(duration)}</i>`;
function begin(play=true){const wasIdle=!started;started=true;if(wasIdle){index=-1;showShot(getShot(time));}player.classList.remove('idle');$('#intro').hidden=true;setPlaying(play);if(play&&time>=duration)seek(0)}
function setPlaying(v){if(v&&world?.free){world.setFree(false);$('#cameraBtn').setAttribute('aria-pressed','false');$('#cameraBtn').textContent='Vue libre'}playing=v;$('#playBtn').textContent=v?'Ⅱ':'▶';$('#playBtn').setAttribute('aria-label',v?'Mettre en pause':time>=duration?'Revoir le film':'Lancer le film');if(sound&&v)audioStart();else audioMute()}
function seek(t){if(world?.free){world.setFree(false);$('#cameraBtn').setAttribute('aria-pressed','false');$('#cameraBtn').textContent='Vue libre'}time=clamp(t,0,duration);showShot(getShot(time),true);updateProgress();if(time>=duration)setPlaying(false)}
function updateProgress(){$('#timeline').value=time;const p=time/duration*100;$('#timeline').style.background=`linear-gradient(to right,var(--coral) ${p}%,#304048 ${p}%)`;$('#filmTime').innerHTML=`${fmt(time)} <i>/ ${fmt(duration)}</i>`}
function setQuads(mode){$('#quads').innerHTML=families.map(f=>{
 const action=f.choice.replace(/\n/g,' ');
 const body=mode==='intro'?`<span class="decision-label">CHOIX</span><strong class="action-copy">${f.choice}</strong>`:
 `<span class="recap-label">CHOIX</span><span class="choice-recap">${action}</span><span class="decision-label consequence-label">CONSÉQUENCE</span>${mode==='alarm'?`<strong class="status-copy">${f.alarm}</strong>`:`<span class="cause-copy">${f.cause}</span><strong class="fate-copy">${f.end}</strong><span class="family-result">${f.result}</span>`}`;
 return `<div class="quad ${mode==='outcome'?(f.lost?'lost':'saved'):''}" style="--family:${f.color}"><div class="family-name"><i></i>Les ${f.name}</div><div class="family-choice">${body}</div></div>`;
 }).join('')}

function showShot(i,force=false){if(i===index&&!force)return;const changed=i!==index;index=i;const s=shots[i];
 player.classList.remove('grid-shot','outcome-shot','phone-shot','countdown-shot','wave-shot','safety-shot','decision-shot','alarm-shot','choice-shot','consequence-shot');
 if(s.grid){setQuads(s.grid);player.classList.add('grid-shot',s.grid==='intro'?'decision-shot':s.grid==='alarm'?'alarm-shot':'outcome-shot')}if(s.phase)player.classList.add(s.phase+'-shot');
 $('#cameraBtn').disabled=!!s.grid;$('#quads').hidden=!s.grid;$('#phone').hidden=!s.phone;$('#countdown').hidden=!s.countdown;$('#crack').hidden=true;$('#flow').hidden=true;$('#annotations').hidden=!(s.flow||s.ops||s.coast);
 if(s.phone)player.classList.add('phone-shot');if(s.countdown)player.classList.add('countdown-shot');if(s.wave)player.classList.add('wave-shot');if(s.safety)player.classList.add('safety-shot');
 if(s.flow)$('#annotations').innerHTML='<div class="annotation" style="left:57%;top:33%;--family:#ffc0a2"><b>Vers la plage.</b><small>Le mouvement dominant.</small></div><div class="annotation" style="left:10%;top:48%;--family:#bde6c3"><b>Vers les hauteurs.</b><small>À contre-courant.</small></div>';
 if(s.ops)$('#annotations').innerHTML='<div class="annotation" style="left:7%;top:25%;--family:#bde6c3"><b>Équipe A. Les hauteurs.</b><small>Les piétons. Le départ.</small></div><div class="annotation" style="right:7%;top:30%;--family:#f0ca7f"><b>Équipe B. Le parking.</b><small>Les voitures. Le retard.</small></div>';
 if(s.coast)$('#annotations').innerHTML='<div class="annotation" style="right:6%;top:23%;--family:#efbd99"><b>Trois secteurs concernés.</b><small>Les effets du synopsis.<br>Aucune simulation géographique.</small></div>';
 $('#storyClock').textContent=s.clock;$('#kicker').textContent=s.k;$('#headline').textContent=s.h;$('#subline').textContent=s.sub||'';$('#subline').hidden=!s.sub;
 $('#familyMark').style.display=s.family!==undefined?'block':'none';player.style.setProperty('--family',s.family!==undefined?families[s.family].color:'#edc49f');$('#kicker').style.color=s.family!==undefined?families[s.family].color:'';
 $('#shotNumber').textContent=`${String(i+1).padStart(2,'0')} / ${shots.length}`;$('#shotName').textContent=s.name;
 $$('#chapters button').forEach((b,j)=>{const from=chapterSpecs[j][1],to=chapterSpecs[j+1]?.[1]??shots.length;b.classList.toggle('active',i>=from&&i<to)});
 if(changed&&sound&&playing&&s.phone)beep();
}
function resize(){const r=player.getBoundingClientRect();W=r.width;H=r.height;const dpr=Math.min(devicePixelRatio,1.5);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}new ResizeObserver(resize).observe(player);
let rng=37;const rand=()=>{rng=(rng*1664525+1013904223)>>>0;return rng/4294967296};const flecks=Array.from({length:175},()=>({x:rand(),y:rand(),s:rand(),p:rand()*7}));
function drawEffects(s,p){ctx.clearRect(0,0,W,H);if(s.impact&&p>.84){ctx.fillStyle=`rgba(0,9,17,${smooth((p-.84)/.16)*.8})`;ctx.fillRect(0,0,W,H)}}
function render(now){const dt=Math.min((now-lastFrame)/1000,.5);lastFrame=now;if(playing){time=clamp(time+dt*rate,0,duration);if(time>=duration)setPlaying(false)}const i=getShot(time);if(i!==index)showShot(i);const s=shots[i],p=clamp((time-s.start)/s.d);
 if(s.countdown)$('#countdown b').textContent=fmt(Math.max(0,300*(1-p)));
 world?.render(s,p,time,!started);if(started)drawEffects(s,p);else ctx.clearRect(0,0,W,H);updateProgress();updateAudio(s,p);requestAnimationFrame(render)}
// Optional cinematic sound design. Synthetic tones, not an official alert sound.
let ac,master,noiseGain,noiseFilter,bassGain,bass,noise;
async function audioStart(){if(!sound)return;if(!ac){ac=new(window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=0;master.connect(ac.destination);const buffer=ac.createBuffer(1,ac.sampleRate*4,ac.sampleRate);const data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+.02*(Math.random()*2-1))/1.02;data[i]=last*4}noise=ac.createBufferSource();noise.buffer=buffer;noise.loop=true;noiseFilter=ac.createBiquadFilter();noiseFilter.type='lowpass';noiseFilter.frequency.value=700;noiseGain=ac.createGain();noiseGain.gain.value=.06;noise.connect(noiseFilter);noiseFilter.connect(noiseGain);noiseGain.connect(master);noise.start();bass=ac.createOscillator();bass.type='sine';bass.frequency.value=43;bassGain=ac.createGain();bassGain.gain.value=0;bass.connect(bassGain);bassGain.connect(master);bass.start()}
 await ac.resume();master.gain.setTargetAtTime(playing?.55:0,ac.currentTime,.2)}
function audioMute(){if(master)master.gain.setTargetAtTime(0,ac.currentTime,.15)}
function updateAudio(s,p){if(!ac||!sound||!playing)return;const quake=s.quake,wave=s.wave;noiseGain.gain.setTargetAtTime(wave?.28+.35*p:quake?.28:.055,ac.currentTime,.2);noiseFilter.frequency.setTargetAtTime(wave?1200+p*1500:quake?260:650,ac.currentTime,.2);bassGain.gain.setTargetAtTime(quake?.18*(1-p*.4):wave?.1+p*.1:0,ac.currentTime,.12);bass.frequency.setTargetAtTime(quake?38+Math.sin(time*9)*5:49,ac.currentTime,.1)}
function beep(){if(!ac)return;for(const off of [0,.32]){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=660;o.connect(g);g.connect(master);g.gain.setValueAtTime(0,ac.currentTime+off);g.gain.linearRampToValueAtTime(.12,ac.currentTime+off+.02);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+off+.18);o.start(ac.currentTime+off);o.stop(ac.currentTime+off+.2)}}
$('#startBtn').onclick=()=>{seek(0);begin(true)};$('#playBtn').onclick=()=>{if(!started){begin(true);return}if(time>=duration)seek(0);setPlaying(!playing)};
$('#restartBtn').onclick=()=>{begin(false);seek(0)};$('#prevBtn').onclick=()=>{begin(false);seek(shots[Math.max(0,index-1)].start+.01)};$('#nextBtn').onclick=()=>{begin(false);seek(shots[Math.min(shots.length-1,index+1)].start+.01)};
$('#timeline').oninput=e=>{begin(false);seek(+e.target.value)};$('#speedBtn').onclick=()=>{rate=rate===1?1.5:rate===1.5?.75:1;$('#speedBtn').textContent=`× ${String(rate).replace('.',',')}`};
$('#soundBtn').onclick=()=>{sound=!sound;$('#soundBtn').setAttribute('aria-pressed',sound);$('#soundBtn').title=sound?'Désactiver l’ambiance sonore':'Activer l’ambiance sonore';if(sound)audioStart().catch(()=>{sound=false;$('#soundBtn').setAttribute('aria-pressed','false')});else audioMute()};
$('#cameraBtn').onclick=()=>{if(!world)return;begin(false);world.setFree(!world.free);$('#cameraBtn').setAttribute('aria-pressed',world.free);$('#cameraBtn').textContent=world.free?'Caméra du film':'Vue libre'};
$('#fullBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await player.requestFullscreen()}catch{}};
$('#home').onclick=e=>{e.preventDefault();setPlaying(false);time=0;started=false;$('#intro').hidden=false;player.classList.add('idle');if(world)world.setFree(false);$('#cameraBtn').setAttribute('aria-pressed','false');$('#cameraBtn').textContent='Vue libre';index=-1;showShot(0);updateProgress()};
[['infoBtn','info'],['reflexBtn','reflex']].forEach(([bid,did])=>{const d=$('#'+did);$('#'+bid).onclick=()=>{setPlaying(false);d.showModal()};d.querySelector('.close').onclick=()=>d.close();d.onclick=e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}});
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;if(e.code==='Space'&&e.target===document.body){e.preventDefault();if(!started)begin(true);else setPlaying(!playing)}if(e.code==='ArrowRight'&&e.target===document.body){begin(false);seek(time+5)}if(e.code==='ArrowLeft'&&e.target===document.body){begin(false);seek(time-5)}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)setPlaying(false)});
showShot(0);resize();requestAnimationFrame(render);
