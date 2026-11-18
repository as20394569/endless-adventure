(()=>{
// 快轉：遊戲的 setTimeout 改用 MessageChannel 排程（不依賴計時器時鐘；headless 在高負載下計時器會停住）
const MC=new MessageChannel(),TQ=new Map();let TN=1e7;MC.port1.onmessage=e=>{const f=TQ.get(e.data);if(f){TQ.delete(e.data);f()}};
const ct=window.clearTimeout;window.setTimeout=(f,ms,...a)=>{const id=++TN;TQ.set(id,()=>typeof f==='function'?f(...a):0);MC.port2.postMessage(id);return id};
window.clearTimeout=id=>{if(TQ.has(id))TQ.delete(id);else ct(id)};
window.FAST=1;
window.ST={runs:[],battles:0,wipes:0,retreats:0,log:[],first:{},cur:null,errs:[]};
const want=id=>{const c=clsOf(id);return (c==='mage'||c==='healer')?'mag':'atk'};
function gscore(g,id){const w=want(id);let s=0;for(const k in g.st){const v=gstat(g,k);s+=v*({atk:w==='atk'?3:0,mag:w==='mag'?3:0,def:1.5,mhp:.3,mmp:w==='mag'?.3:.1,spd:1,luk:.5})[k]}return s}
function town(){
 // talk & bonds
 npcList().forEach(id=>{if(!G.flags['m'+id])G.flags['m'+id]=1;if(G.talk[id]!==G.day)npcTalk(id);
  if(G.gold>400&&G.aff[id]<100&&G.gift[id]!==G.day){const k=NPC[id].like;if(G.gold>=ITEM[k].p){G.gold-=ITEM[k].p;addItem(k);doGift(id,k)}}
  while(bondReady(id)){npcBond(id);if(S.scr==='story')storyEnd()}});
 // party: fill to 3
 npcList().forEach(id=>{if(G.party.length<3&&!G.party.includes(id)&&G.aff[id]>=NPC[id].need)partyToggle(id)});
 // personal quests
 npcList().forEach(id=>{if(pqAvail(id)){pqStart(id);while(S.scr==='story')storyEnd();ST.pq=(ST.pq||0)+1}});
 npcList().filter(id=>G.pq[id].ph===1&&!G.party.includes(id)&&G.aff[id]>=NPC[id].need).forEach(id=>{const out=G.party.find(x=>x!=='hero'&&G.pq[x].ph!==1);if(out){partyToggle(out);partyToggle(id)}});
 S.scr='town';
 G.party.forEach(id=>{apAuto(id,1);
  for(const sl of SLOTS){let best=null,bs=-1;G.gear.filter(g=>g.slot===sl&&(!g.own||g.own===id)&&(!equipped(g.id)||equipped(g.id)===id)).forEach(g=>{const s=gscore(g,id);if(s>bs){bs=s;best=g}});if(best)G.chars[id].eq[sl]=best.id}refit(id)});
 // adv
 G.party.forEach(id=>{const c=G.chars[id];if(!c.adv&&c.lv>=ADV_LV&&G.clear.d3&&G.gold>=ADV_COST){doAdv(id,advOpts(id)[0]);if(S.scr==='story')storyEnd()}});
 // sell junk
 // quests
 if(qOpen()){qFill();G.q.list.slice().forEach(q=>{if(qDone(q)){qClaim(q.id);if(S.scr==='story')storyEnd()}})}
 // forge
 if(fgOpen()){openForge();while(S.scr==='story')storyEnd();
  const Ts=fgTiers().filter(t=>t.ok);const T=Ts[Ts.length-1];
  for(const id of G.party)for(const [sk] of [['w'],['h'],['a'],['c2']]){for(const r of [3,2,1]){const c=fgCost(T,r);if(!canPay(c)||G.gold-c.gold<300)continue;const g=fgMake(T,r,sk,id);const cur=G.chars[id].eq[g.slot]&&gearOf(G.chars[id].eq[g.slot]);if(gscore(g,id)>(cur?gscore(cur,id):0)*1.1){S.fg={id,ti:T.i,r,say:''};doForge(sk);closeModal();const ng=G.gear[G.gear.length-1];G.chars[id].eq[ng.slot]=ng.id;ST.forged=(ST.forged||0)+1;break}}}
  for(const id of G.party)for(const sl of SLOTS){const g=G.chars[id].eq[sl]&&gearOf(G.chars[id].eq[sl]);if(g&&g.r<3&&!g.uq&&canPay(rkCost(g))&&G.gold-rkCost(g).gold>300){doRankUp(g.id);closeModal();ST.ranked=(ST.ranked||0)+1}}
  if(typeof afCost==='function')for(const id of G.party)for(const sl of SLOTS){const g=G.chars[id].eq[sl]&&gearOf(G.chars[id].eq[sl]);if(g&&g.r>=1&&!g.uq&&!g.af&&canPay(afCost(g))&&G.gold-afCost(g).gold>300){doAf(g.id);closeModal();ST.af=(ST.af||0)+1}}
  S.scr='town'}
 G.gear.filter(g=>!equipped(g.id)&&!g.uq).forEach(g=>{sellGear(g.id)});
 // supplies
 const buy=(k,n)=>{while((G.inv[k]||0)<n&&G.gold>=ITEM[k].p+50){G.gold-=ITEM[k].p;addItem(k)}};
 buy('potion',8);buy('feather',2);buy('ether',3);if(G.gold>600)buy('hipotion',4);
 // shop gear
 shopStock().slice().forEach(g=>{const i=G.shop.list.indexOf(g);if(i<0)return;for(const id of G.party){const cur=G.chars[id].eq[g.slot]&&gearOf(G.chars[id].eq[g.slot]);if(G.gold>=g.v+100&&gscore(g,id)>(cur?gscore(cur,id):0)*1.15&&(g.slot!=='w'||(g.st.mag?'mag':'atk')===want(id))){buyGear(G.shop.list.indexOf(g));G.chars[id].eq[g.slot]=g.id;refit(id);break}}});
 // upgrade
 const reserve=(!G.clear.d5&&G.party.some(id=>!G.chars[id].adv))?(G.clear.d2?2200:300):300;
 let ok=true;while(ok){ok=false;for(const id of G.party)for(const sl of SLOTS){const g=G.chars[id].eq[sl]&&gearOf(G.chars[id].eq[sl]);if(g&&g.plus<10&&G.gold-upCost(g)>=reserve){G.gold-=upCost(g);g.plus++;ok=true}}}
 G.party.forEach(refit);fullHeal();
}
function pickDungeon(){
 const hl=G.chars.hero.lv;let i=DG.findIndex(d=>d.id!=='abyss'&&!G.clear[d.id]);
 const pd=G.party.map(id=>id!=='hero'&&G.pq[id].ph===1&&pqCh(id)).filter(Boolean).map(c=>DG.findIndex(d=>d.id===c.dg)).filter(j=>dgOpen(j)&&hl>=DG[j].lv+2).sort()[0];
 if(pd!=null&&(i<0||pd<=i))return pd;
 if(i<0)return 5;
 const fails=ST.runs.filter(r=>r.d===DG[i].id&&r.res!=='clear').length;
 if(hl<DG[i].lv-1+Math.min(4,Math.floor(fails/2))&&i>0)return i-1;
 return i}
window.botTick=function(){try{
 if(!G)return;
 if(S.scr==='story'){storyEnd();return}
 if(S.scr==='regist'){doRegist();return}
 if(S.scr==='battle'&&B){
  if(B.menu==='end'&&!B._c){B._c=1;ST.battles++;if(!B.won){ST.wipes++;endRun('wipe');B=null;backTown()}else if(!G.auto){G.auto=true;afterWin()}}
  else if(B.menu==='main'){G.auto=true;allyAuto(B.cur)}
  return}
 if(S.scr==='dungeon'){
  if(!G.auto){ if(DV&&DV.m==='choose'){ST.retreats++;endRun('retreat');backTown();return} G.auto=true;autoKick()}
  if(ST.cur&&ST.cur.d==='abyss'&&G.run&&G.run.fl>ST.maxAbyss){endRun('cap');backTown()}
  return}
 if(G.run)return;
 // in town
 if(ST.cur)endRun(G.clear[ST.cur.d]&&!ST.cur.was?'clear':(ST.cur.d!=='abyss'&&ST.cur.was?'clear':'end'));
 town();
 const i=pickDungeon();const d=DG[i];
 ST.cur={d:d.id,was:!!G.clear[d.id],lv:G.chars.hero.lv,day:G.day,b0:ST.battles,g0:G.gold};
 G.auto=true;enterDungeon(i);
}catch(e){ST.errs.push(String(e&&e.stack||e))}};
function endRun(res){const c=ST.cur;if(!c)return;c.res=res;c.b=ST.battles-c.b0;c.fl=G.run?G.run.fl:null;c.lv1=G.chars.hero.lv;c.gold=G.gold;
 if(res==='clear'&&!c.was&&!ST.first[c.d])ST.first[c.d]={run:ST.runs.length+1,lv:c.lv1,battles:ST.battles,day:G.day,gold:G.gold};
 ST.runs.push(c);ST.cur=null}
ST.maxAbyss=60;
})();
// ===== 戰鬥量測（每場回合數、掉血比例、技能使用與傷害）=====
(()=>{
ST.bt=[];ST.sk={};
const eh=()=>B?B.en.reduce((s,e)=>s+Math.max(0,e.hp),0):0;
const ah=()=>B?B.al.reduce((s,a)=>s+Math.max(0,a.hp),0):0;
const _sb=startBattle;window.startBattle=startBattle=function(en,o){_sb(en,o);if(B){B._m={h0:ah(),mh:B.al.reduce((s,a)=>s+a.mhp,0),ty:o&&o.boss?'boss':o&&o.elite?'elite':'norm',d:runD()?runD().id:'?',lv:G.chars.hero.lv}}};
const _ex=exec;window.exec=exec=function(u,sk,t,item,bon){if(B&&u&&u.ally&&!item){B._pk={k:(clsOf(u.id)||u.id)+':'+(sk.n||'攻擊'),h:eh()}}return _ex(u,sk,t,item,bon)};
const _nt=nextTurn;window.nextTurn=nextTurn=function(){if(B&&B._pk){const p=B._pk;B._pk=null;const s=ST.sk[p.k]=ST.sk[p.k]||{n:0,d:0};s.n++;s.d+=Math.max(0,p.h-eh())}return _nt()};
const fin=w=>{if(B&&B._m&&!B._m.done){const m=B._m;m.done=1;ST.bt.push({ty:m.ty,d:m.d,lv:m.lv,rd:B.rd,loss:Math.round((m.h0-ah())/m.mh*1000)/10,w:w?1:0})}};
const _w=win;window.win=win=function(){fin(1);return _w()};
const _l=lose;window.lose=lose=function(){fin(0);return _l()};
})();
