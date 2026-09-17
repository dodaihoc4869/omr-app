import {chromium} from 'playwright'
import fs from 'node:fs/promises'
const out='/Volumes/SSD NGOÀI/dac-ta-than-thu-8-he-2026-09-16/kiem-thu-giao-dien'
await fs.mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1280,height:960}})
const errors=[];page.on('pageerror',e=>errors.push(e.message))
await page.addInitScript(()=>{localStorage.setItem('omr_student_portal_auth',JSON.stringify({sbd:'DEMO',hoTen:'Học sinh kiểm thử',lop:'12',namSinh:'2008',token:'test-only'}));localStorage.setItem('game-v2-low','1')})
let profile={pet:'dat_quy',choice:true,cap:30,exp:32,wallet:100,earned:100,tower:5,mastery:[],arena:null}
await page.route('**/*',async route=>{
 const u=new URL(route.request().url());if(u.hostname==='127.0.0.1'||u.hostname==='localhost')return route.continue()
 let data={ok:true,items:[],ca:[],ds:[],btvn:[]};if(u.pathname.includes('/game-v2/')){const b=route.request().postDataJSON()??{};if(u.pathname.endsWith('/choose'))profile={...profile,pet:b.pet,choice:false};data={ok:true,profile,revision:1,tasks:[]}}
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})
})
await page.goto('http://127.0.0.1:5173/hs');await page.waitForTimeout(1500)
const tabs=await page.getByRole('button').allTextContents();console.log(tabs.filter(x=>/thú/i.test(x)))
await page.getByRole('button',{name:/Thần Thú/i}).first().click()
await page.getByRole('heading',{name:'Chọn bạn đồng hành'}).waitFor()
await page.screenshot({path:`${out}/01-tam-than-thu.png`,fullPage:true})
await page.getByRole('button',{name:/Minh Linh/}).click()
await page.getByRole('heading',{name:'Minh Linh'}).waitFor()
await page.screenshot({path:`${out}/02-dao-than-thu.png`,fullPage:true})
await page.setViewportSize({width:390,height:844})
await page.screenshot({path:`${out}/03-dien-thoai.png`,fullPage:true})
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)
console.log(JSON.stringify({errors,overflow}))
await browser.close()
if(errors.length||overflow)process.exitCode=1
