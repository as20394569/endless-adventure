# 後期內容測試：python3 tools/late.py <職業> <等級> <已踏破,逗號分隔> <趟數> [秒數]
# 直接做出指定等級、已踏破迷宮、配好同階裝備的隊伍，再交給 bot 自動遊玩並量測（bal.js）。
import sys,json,time,os
HERE=os.path.dirname(os.path.abspath(__file__));OUT=os.environ.get('OUT','/tmp')
from playwright.sync_api import sync_playwright
cls,lv,cl,maxruns=sys.argv[1],int(sys.argv[2]),sys.argv[3].split(','),int(sys.argv[4]);lim=float(sys.argv[5]) if len(sys.argv)>5 else 300
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':800})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8765/index.html');pg.wait_for_timeout(500)
    pg.evaluate(open(HERE+'/bot.js',encoding='utf-8').read());pg.evaluate(open(HERE+'/bal.js',encoding='utf-8').read())
    pg.evaluate(f"""NG.g='m';NG.cls='{cls}';newGame();storyEnd();NG.cls='{cls}';doRegist();storyEnd();
     {json.dumps(cl)}.forEach(k=>{{G.clear[k]=1;G.seen['end_'+k]=1;G.seen['in_'+k]=1;G.seen['mid_'+k]=1;G.seen['pre_'+k]=1}});
     npcList().forEach(id=>{{G.aff[id]=100;if(G.pq[id])G.pq[id]={{ch:3,ph:0}}}});G.gold=99999;G.party=['hero',friendId(),'vel'];
     G.party.forEach(id=>{{while(G.chars[id].lv<{lv})gainExp(id,needExp(G.chars[id].lv));const c=G.chars[id];if(!c.adv)doAdv(id,advOpts(id)[0]);while(S.scr==='story')storyEnd();apAuto(id,1);
       const T=fgTiers().filter(t=>t.ok).pop();for(const sk of ['w','h','a','c2']){{const g=fgMake(T,2,sk,id);g.plus=6;G.gear.push(g);G.chars[id].eq[g.slot]=g.id}}refit(id)}});
     G.gold=8000;fullHeal();S.scr='town';window._iv=setInterval(botTick,3)""")
    t=time.time();last=-1;stall=0
    while time.time()-t<lim:
        pg.wait_for_timeout(2000)
        n=pg.evaluate("ST.runs.length+ST.battles*1000+BAL.b.length*7")
        if n==last:
            stall+=1
            if stall>=40:print('STALL');break
        else:stall=0
        last=n
        if pg.evaluate("ST.runs.length")>=maxruns:break
    r=json.loads(pg.evaluate("JSON.stringify({sum:balSum(),first:ST.first,per:ST.runs.reduce((a,r)=>{const k=r.d+':'+r.res+(r.fl?'@'+r.fl:'');a[k]=(a[k]||0)+1;return a},{}),lv:G.chars.hero.lv,errs:ST.errs.slice(0,3),seen:Object.keys(G.seen).filter(k=>/d[78]/.test(k)),gear:G.gear.filter(g=>g.af).length+'/'+G.gear.length,mats:Object.keys(G.inv).filter(k=>/m[78]/.test(k)).map(k=>k+':'+G.inv[k]).join(' ')})"))
    for k in ('first','per','lv','errs','seen','gear','mats'):print(k,r[k])
    for k,v in sorted(r['sum'].items()):print(' ',k,v)
    print('pageerr',errs[:5])
    json.dump(json.loads(pg.evaluate("JSON.stringify(G)")),open(f'{OUT}/late_{cls}.json','w',encoding='utf-8'),ensure_ascii=False)
    b.close()
