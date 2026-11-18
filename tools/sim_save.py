# 從既有存檔接著自動遊玩：python3 tools/sim_save.py <存檔.json> <最多幾趟> [秒數上限]
# 用來測舊存檔相容與後期內容（例如第二部）。存檔可用 tools/sim.py 產生（$OUT/save_<職業>.json）。
import sys,json,time,os
HERE=os.path.dirname(os.path.abspath(__file__));OUT=os.environ.get('OUT','/tmp')
from playwright.sync_api import sync_playwright
sv=open(sys.argv[1],encoding='utf-8').read();maxruns=int(sys.argv[2]);lim=float(sys.argv[3]) if len(sys.argv)>3 else 200
with sync_playwright() as p:
    b=p.chromium.launch(args=['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--disable-features=IntensiveWakeUpThrottling']);pg=b.new_page(viewport={'width':390,'height':800})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8765/index.html');pg.wait_for_timeout(400)
    pg.evaluate("s=>localStorage.setItem(SAVE,s)",sv);pg.reload();pg.wait_for_timeout(500)
    pg.evaluate(open(HERE+'/bot.js',encoding='utf-8').read())
    pg.evaluate("cont();window._iv=setInterval(botTick,3)")
    t=time.time();last=-1;stall=0
    while time.time()-t<lim:
        pg.wait_for_timeout(2000)
        n=pg.evaluate("ST.runs.length+ST.battles*1000")
        if n==last:
            stall+=1
            if stall>=4:
                print('STALL',pg.evaluate("JSON.stringify({scr:S.scr,DV:DV&&DV.m,menu:B&&B.menu,auto:G.auto,run:G.run})"));break
        else:stall=0
        last=n
        if pg.evaluate("ST.runs.length")>=maxruns:break
    r=pg.evaluate("""JSON.stringify({first:ST.first,runs:ST.runs.map(r=>r.d+':'+r.res+'@'+r.lv+(r.fl?'F'+r.fl:'')).join(' '),battles:ST.battles,wipes:ST.wipes,errs:ST.errs.slice(0,5),day:G.day,gold:G.gold,best:G.best,clear:Object.keys(G.clear).join(','),party:G.party.map(id=>nameOf(id)+G.chars[id].lv),seen:Object.keys(G.seen).filter(k=>/d6/.test(k)).join(','),forged:ST.forged,mats:Object.keys(G.inv).filter(k=>ITEM[k]&&ITEM[k].mat&&k[1]>'5').map(k=>k+':'+G.inv[k]).join(' ')})""")
    print(json.dumps(json.loads(r),ensure_ascii=False));print('pageerr',errs[:5]);pg.screenshot(path=f'{OUT}/simsave.png')
    json.dump(json.loads(pg.evaluate("JSON.stringify(G)")),open(f'{OUT}/save_after.json','w',encoding='utf-8'),ensure_ascii=False)
    b.close()
