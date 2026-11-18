# 自動遊玩模擬：python3 tools/sim.py <sword|mage|ranger|monk> <最多幾趟迷宮> [m|f] [秒數上限]
# 先在儲存庫根目錄開 python3 -m http.server 8765。輸出各迷宮首次踏破的場次/等級/戰鬥數、錯誤、委託與鍛造統計。
import sys,json,time,os
HERE=os.path.dirname(os.path.abspath(__file__));OUT=os.environ.get('OUT','/tmp')
from playwright.sync_api import sync_playwright
cls=sys.argv[1];maxruns=int(sys.argv[2]);g=sys.argv[3] if len(sys.argv)>3 else 'm'
with sync_playwright() as p:
    b=p.chromium.launch(args=['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--disable-features=IntensiveWakeUpThrottling']);pg=b.new_page(viewport={'width':390,'height':800})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8765/index.html');pg.wait_for_timeout(500)
    pg.evaluate(open(HERE+'/bot.js',encoding='utf-8').read())
    pg.evaluate(f"NG.g='{g}';NG.cls='{cls}';newGame();storyEnd();NG.cls='{cls}';doRegist();storyEnd();window._iv=setInterval(botTick,3)")
    t=time.time();last=-1;stall=0
    while time.time()-t<float(sys.argv[4] if len(sys.argv)>4 else 240):
        pg.wait_for_timeout(2000)
        n=pg.evaluate("ST.runs.length+ST.battles*1000")
        if n==last:
            stall+=1
            if stall>=4:
                print('STALL',pg.evaluate("JSON.stringify({scr:S.scr,DV:DV&&DV.m,menu:B&&B.menu,auto:G.auto,run:G.run,cur:B&&B.cur&&B.cur.n,log:B&&B.log.slice(-8),en:B&&B.en.map(a=>a.n+':'+a.hp+(a.int?a.int.k:'')),q:B&&B.q.map(u=>u.n),o:B&&B.o})"));break
        else:stall=0
        last=n
        if pg.evaluate("ST.runs.length")>=maxruns:break
    r=pg.evaluate("""JSON.stringify({first:ST.first,runs:ST.runs.length,battles:ST.battles,wipes:ST.wipes,retreats:ST.retreats,errs:ST.errs.slice(0,5),day:G.day,gold:G.gold,best:G.best,lv:G.chars.hero.lv,party:G.party.map(id=>nameOf(id)+G.chars[id].lv+(G.chars[id].adv||'')),gear:G.gear.length,
      per:ST.runs.reduce((a,r)=>{const k=r.d+':'+r.res;a[k]=(a[k]||0)+1;return a},{}),aff:G.aff,seen:Object.keys(G.seen).length,q:{pts:G.q.pts,rank:G.q.rank,done:G.q.done,fg:G.q.fg},forged:ST.forged,pq:G.pq,pqStarted:ST.pq,ranked:ST.ranked,mats:Object.keys(G.inv).filter(k=>ITEM[k].mat).map(k=>k+':'+G.inv[k]).join(' '),abyss:ST.runs.filter(r=>r.d==='abyss').map(r=>r.fl+r.res[0]).join(' ')})""")
    print(cls,g,json.dumps(json.loads(r),ensure_ascii=False));print('pageerr',errs[:5]);json.dump(pg.evaluate("({bt:ST.bt,sk:ST.sk,runs:ST.runs,first:ST.first})"),open(f'{OUT}/stat_{cls}.json','w'),ensure_ascii=False);pg.screenshot(path=f'{OUT}/sim_{cls}.png')
    json.dump(json.loads(pg.evaluate("JSON.stringify(G)")),open(f'{OUT}/save_{cls}.json','w',encoding='utf-8'),ensure_ascii=False)
    b.close()
