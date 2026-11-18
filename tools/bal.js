// 平衡量測（注入在 bot.js 之後）：每場戰鬥的類型、回合、掉血比例、勝敗；我方技能使用次數與傷害。結果在 window.BAL。
(()=>{
window.BAL={b:[],sk:{}};
const sb=startBattle;window.startBattle=function(en,o){const r=sb.apply(this,arguments);
 const ty=o&&o.boss?'boss':o&&o.elite?'elite':(o&&o.pq?'pq':'norm');
 B._m={ty,d:G.run?runD().id:'?',L:G.run?runL():0,hp0:B.al.reduce((s,a)=>s+a.hp,0),mhp:B.al.reduce((s,a)=>s+a.mhp,0),lo:1};return r};
const fin=won=>{if(!B||!B._m||B._m.done)return;const m=B._m;m.done=1;m.won=won;m.rd=B.rd;m.loss=(m.hp0-B.al.reduce((s,a)=>s+Math.max(0,a.hp),0))/m.mhp;m.lo=Math.min(m.lo,...B.al.map(a=>Math.max(0,a.hp)/a.mhp));BAL.b.push(m)};
const w0=win;window.win=function(){fin(1);return w0.apply(this,arguments)};
const l0=lose;window.lose=function(){fin(0);return l0.apply(this,arguments)};
const e0=exec;window.exec=function(u,sk,t,item,bon){if(!u||!u.ally||item||!B)return e0.apply(this,arguments);
 const k=(sk===SK.atk?'攻擊':sk.n||'?')+'/'+clsOf(u.id)+(G.chars[u.id].adv?'+':'');const h0=B.en.reduce((s,e)=>s+Math.max(0,e.hp),0);const r=e0.apply(this,arguments);
 const dmg=h0-B.en.reduce((s,e)=>s+Math.max(0,e.hp),0);const o=BAL.sk[k]=BAL.sk[k]||{n:0,d:0};o.n++;o.d+=dmg;return r};
window.balSum=function(){const g={};for(const m of BAL.b){const k=m.d+':'+m.ty;const o=g[k]=g[k]||{n:0,rd:0,loss:0,lose:0,lo:0};o.n++;o.rd+=m.rd;o.loss+=m.loss;o.lose+=m.won?0:1;o.lo+=m.lo}
 const out={};for(const k in g){const o=g[k];out[k]=`n${o.n} rd${(o.rd/o.n).toFixed(1)} loss${Math.round(o.loss/o.n*100)}% wipe${Math.round(o.lose/o.n*100)}% minHP${Math.round(o.lo/o.n*100)}%`}return out};
})();
(()=>{window.TRC=[];const w=(n)=>{const f=window[n];window[n]=function(){TRC.push(n+':'+(arguments[0]&&arguments[0].n||'')+':'+(B&&B.menu));if(TRC.length>40)TRC.shift();try{return f.apply(this,arguments)}catch(e){TRC.push('ERR '+n+' '+e.message);throw e}}};
['nextTurn','enemyAct','allyAuto','exec','tgt','cmdGuard','planEnemy','win','lose','defGame','pex','render'].forEach(w)})();
