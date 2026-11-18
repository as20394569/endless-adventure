# 平衡量測：python3 tools/bal.py <職業> <趟數> [m|f] [秒數]　輸出各迷宮×戰鬥類型的回合／掉血／全滅率、技能使用分佈
import sys,json,time,os
HERE=os.path.dirname(os.path.abspath(__file__));OUT=os.environ.get('OUT','/tmp')
from playwright.sync_api import sync_playwright
cls=sys.argv[1];maxruns=int(sys.argv[2]);g=sys.argv[3] if len(sys.argv)>3 else 'm';lim=float(sys.argv[4] if len(sys.argv)>4 else 300)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':800})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8765/index.html');pg.wait_for_timeout(500)
    pg.evaluate(open(HERE+'/bot.js',encoding='utf-8').read());pg.evaluate(open(HERE+'/bal.js',encoding='utf-8').read())
    pg.evaluate(f"NG.g='{g}';NG.cls='{cls}';newGame();storyEnd();NG.cls='{cls}';doRegist();storyEnd();window._iv=setInterval(botTick,3)")
    t=time.time();last=-1;stall=0
    while time.time()-t<lim:
        pg.wait_for_timeout(2000)
        n=pg.evaluate("ST.runs.length+ST.battles*1000+BAL.b.length*7")
        if n==last:
            stall+=1
            if stall==4:print('slow',round(time.time()-t))
            if stall>=40:
                print('STALL',pg.evaluate("JSON.stringify({scr:S.scr,menu:B&&B.menu,cur:B&&B.cur&&B.cur.n,pend:B&&B.pend,rd:B&&B.rd,q:B&&B.q.map(u=>u.n),al:B&&B.al.map(a=>a.n+a.hp+'/'+a.mp),en:B&&B.en.map(e=>e.n+e.hp+(e.int?e.int.k:'')),log:B&&B.log.slice(-6),trc:TRC.slice(-25),ov:!!document.querySelector('.tmov'),modal:document.querySelector('#modal')&&document.querySelector('#modal').innerText.slice(0,200)})"));break
        else:stall=0
        last=n
        if pg.evaluate("ST.runs.length")>=maxruns:break
    r=json.loads(pg.evaluate("JSON.stringify({sum:balSum(),sk:BAL.sk,first:ST.first,runs:ST.runs.length,wipes:ST.wipes,battles:ST.battles,gold:G.gold,lv:G.chars.hero.lv,errs:ST.errs.slice(0,3),mats:Object.keys(G.inv).filter(k=>ITEM[k].mat).map(k=>k+':'+G.inv[k]).join(' '),per:ST.runs.reduce((a,r)=>{const k=r.d+':'+r.res;a[k]=(a[k]||0)+1;return a},{})})"))
    print(cls,g,'runs',r['runs'],'battles',r['battles'],'wipes',r['wipes'],'gold',r['gold'],'lv',r['lv'],'errs',r['errs'])
    print('first',r['first']);print('per',r['per']);print('mats',r['mats'])
    for k,v in sorted(r['sum'].items()):print(' ',k,v)
    for k,v in sorted(r['sk'].items(),key=lambda x:-x[1]['n']):print('  SK',k,v['n'],'avgdmg',round(v['d']/max(1,v['n'])))
    print('pageerr',errs[:5])
    json.dump(json.loads(pg.evaluate("JSON.stringify(G)")),open(f'{OUT}/save_{cls}.json','w',encoding='utf-8'),ensure_ascii=False)
    b.close()
