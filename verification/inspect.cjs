const { chromium } = require('C:/Users/gebby/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=> {
 const browser = await chromium.launch({headless:true,channel:'msedge'});
 const page = await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error') errors.push(m.text())});
 await page.goto('http://127.0.0.1:8771/?debug=1');
 await page.waitForFunction(()=>window.arcadeDebug,{timeout:60000});
 console.log(JSON.stringify(await page.evaluate(()=>({state:arcadeDebug.state, models:arcadeDebug.models.map(m=>({name:m.name,bounds:m.userData.originalBounds,scale:m.userData.scale})),render:arcadeDebug.renderer.info.render})),null,2));
 await page.screenshot({path:'verification/desktop.png'});
 console.log('errors',errors);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

