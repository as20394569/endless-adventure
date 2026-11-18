# 版面截圖：python3 tools/shots.py <標籤> ["名稱=要執行的JS" ...]　手機 390×800 與電腦 1280×800 各一組，輸出到 $OUT（預設 /tmp）
import sys,os
OUT=os.environ.get('OUT','/tmp')
from playwright.sync_api import sync_playwright
tag=sys.argv[1] if len(sys.argv)>1 else 'a'
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,vp in (('m',{'width':390,'height':800}),('d',{'width':1280,'height':800})):
        pg=b.new_page(viewport=vp)
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.on('console',lambda m:errs.append('console:'+m.text) if m.type=='error' else None)
        pg.goto('http://localhost:8765/index.html');pg.wait_for_timeout(700)
        def shot(n,full=False):
            pg.wait_for_timeout(350);pg.screenshot(path=f'{OUT}/{tag}_{name}_{n}.png')
        shot('01title')
        pg.evaluate("go('create')");shot('02create')
        pg.evaluate("newGame()");pg.wait_for_timeout(900);pg.evaluate("storyNext();storyNext();storyNext()");shot('03story')
        pg.evaluate("storyEnd()");shot('04regist')
        pg.evaluate("doRegist();storyEnd()");shot('05town')
        for s in ['tavern','guild','party','bag','shop','log']:
            pg.evaluate(f"go('{s}')");shot('06'+s)
        pg.evaluate("go('chr','hero')");shot('07chr')
        pg.evaluate("go('npc',friendId())");shot('08npc')
        pg.evaluate("enterDungeon(0);if(S.scr==='story')storyEnd()");shot('09dmsg')
        pg.evaluate("DV.next()");shot('10choose')
        pg.evaluate("rBattle()");pg.wait_for_function("B&&B.menu==='main'",timeout=20000);shot('11battle')
        pg.evaluate("if(B.menu==='main')cmdSkill()");shot('12skill')
        pg.evaluate("G.auto=true;cmdBack();allyAuto(B.cur)")
        pg.wait_for_function("B&&B.menu==='end'",timeout=60000);pg.evaluate("G.auto=false");shot('13win')
        pg.evaluate("B=null;S.scr='dungeon';rEvent()");shot('14event')
        for extra in sys.argv[2:]:
            n,js=extra.split('=',1);pg.evaluate(js);shot(n)
        pg.close()
    b.close()
print('ERRS',errs)
