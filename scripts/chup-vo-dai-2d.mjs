import {chromium} from 'playwright'
import {arenaAction,newArena} from '../src/game/than-thu-v2/core.ts'
import fs from 'node:fs/promises'
const out='/Volumes/SSD NGOÀI/dac-ta-than-thu-8-he-2026-09-16/ban-2d-da-phat-hanh/vo-dai-thuc-te.png'
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1200,height:1000}})
let arena={...newArena(42),level:4,units:[{id:'a',pet:0,star:2,pos:0},{id:'b',pet:4,star:1,pos:1},{id:'c',pet:2,star:1,pos:4},{id:'d',pet:1,star:1,pos:5}],gold:8}
let profile={pet:'dat_quy',choice:false,cap:30,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena}
await page.addInitScript(()=>localStorage.setItem('omr_student_portal_auth',JSON.stringify({sbd:'DEMO',hoTen:'Đội hình minh hoạ',token:'screenshot-only'})))
await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname==='omr-app-b3u.pages.dev')return route.continue();let data={ok:true,items:[],ca:[],ds:[],btvn:[]};if(u.pathname.includes('/game-v2/')){const b=route.request().postDataJSON()??{};if(b.action?.type==='fight'){arena=arenaAction(arena,b.action);profile={...profile,arena}}data={ok:true,profile,revision:1,tasks:[]}}await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})})
await page.goto('https://omr-app-b3u.pages.dev/hs');await page.getByRole('button',{name:/Thần Thú/i}).first().click();await page.getByRole('button',{name:'Võ đài chiến thuật',exact:true}).click()
await page.getByRole('button',{name:'Giao chiến tự động',exact:true}).click()
const panel=page.locator('.spirit-panel').filter({has:page.getByRole('heading',{name:'Võ đài Bát Linh',exact:true})})
await panel.locator('.spirit-log li').first().waitFor();await page.waitForTimeout(1200)
await page.addStyleTag({content:'.spirit-2d *{animation-play-state:paused!important}'})
await panel.screenshot({path:out});console.log(out);await browser.close()
