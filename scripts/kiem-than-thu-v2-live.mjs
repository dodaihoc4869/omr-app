import {chromium} from 'playwright'
const chunks=[];for await(const c of process.stdin)chunks.push(c)
const auth=JSON.parse(Buffer.concat(chunks).toString())
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[]
page.on('pageerror',e=>errors.push(e.message))
await page.addInitScript(a=>{localStorage.setItem('omr_student_portal_auth',JSON.stringify({...a,hoTen:'Kiểm thử Thần Thú',lop:'',namSinh:''}));localStorage.setItem('game-v2-low','1')},auth)
// Keep the production check read-only for academic data. Only the new game API goes live.
await page.route('https://omr.ttadodaihoc.workers.dev/**',async route=>{
 const path=new URL(route.request().url()).pathname
 if(path.startsWith('/game-v2/'))return route.continue()
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,items:[],ds:[],ca:[],btvn:[]})})
})
await page.goto('https://omr-app-b3u.pages.dev/hs')
await page.getByRole('button',{name:/Thần Thú/i}).first().click()
await page.getByRole('heading',{name:'Bát Linh Đảo'}).waitFor()
await page.waitForFunction(()=>!document.querySelector('.spirit-status'))
await page.waitForTimeout(1000)
const result={url:page.url(),title:await page.locator('.spirit-game h1').textContent(),errors,gameAlerts:await page.locator('.spirit-game [role=alert]').allTextContents(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)}
await page.screenshot({path:'/Volumes/SSD NGOÀI/dac-ta-than-thu-8-he-2026-09-16/kiem-thu-giao-dien/04-ban-da-phat-hanh.png',fullPage:true})
console.log(JSON.stringify(result));await browser.close();if(errors.length||result.gameAlerts.length||result.overflow)process.exitCode=1
