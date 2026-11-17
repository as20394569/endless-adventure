(()=>{
const st=window.setTimeout;window.setTimeout=(f,ms,...a)=>st(f,Math.min(ms||0,1),...a);
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
 G.party.forEach(id=>{apAuto(id,1);
  for(const sl of SLOTS){let best=null,bs=-1;G.gear.filter(g=>g.slot===sl&&(!equipped(g.id)||equipped(g.id)===id)).forEach(g=>{const s=gscore(g,id);if(s>bs){bs=s;best=g}});if(best)G.chars[id].eq[sl]=best.id}refit(id)});
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
 if(i<0)return 5;
 const fails=ST.runs.filter(r=>r.d===DG[i].id&&r.res!=='clear').length;
 if(hl<DG[i].lv-1+Math.min(4,Math.floor(fails/2))&&i>0)return i-1;
 return i}
window.botTick=function(){try{
 if(!G)return;
 if(S.scr==='story'){storyEnd();return}
 if(S.scr==='regist'){doRegist();return}
 if(S.scr==='battle'&&B){
  if(B.menu==='end'&&!B._c){B._c=1;ST.battles++;if(!B.won){ST.wipes++;endRun('wipe');B=null;backTown()}else if(!G.auto){G.auto=true;B=null;advance()}}
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
