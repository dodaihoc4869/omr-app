import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const base=process.env.BATTLE_BASE||'http://127.0.0.1:5173'
const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1100,height:950}})
const errors=[];page.on('pageerror',e=>errors.push(e.message))
await page.addInitScript(()=>{localStorage.setItem('omr_student_portal_auth',JSON.stringify({sbd:'DEMO',hoTen:'Kiểm thử',token:'test-only'}))})
const profile={pet:'lua_phuong',choice:false,cap:30,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena:null}
const questions=Array.from({length:6},(_,i)=>({qid:`I_${i}`,maDe:'DEMO',phan:'I',text:'Công thức hoá học của nước là',choices:['H₂O','CO₂','NaCl','O₂'],ideas:[],hinhAnh:[],dang:'nuoc',tenDang:'Nước',mucDo:'biet',sao:1,kienThuc:[]}))
let answered=[],fail=false,syncs=0
await page.route('**/*',async route=>{
 const u=new URL(route.request().url());if(['127.0.0.1','localhost',new URL(base).hostname].includes(u.hostname))return route.continue()
 let data={ok:true,items:[],ca:[],ds:[],btvn:[]}
 if(u.pathname.includes('/game-v2/')){const b=route.request().postDataJSON()??{};data={ok:true,profile,revision:3,tasks:[],remaining:0}
 if(u.pathname.endsWith('/academic-sync')){syncs++;profile.cap=2;profile.earned=140;profile.academic={total:140,today:80,lastGain:0,dailyLimit:100};Object.assign(data,{gain:0,pending:0,revision:3})}
 if(u.pathname.endsWith('/start')){answered=[];Object.assign(data,{id:'battle-test',questions})}
 if(u.pathname.endsWith('/resume'))Object.assign(data,{id:'battle-test',questions,answered})
 if(u.pathname.endsWith('/answer')){if(fail){fail=false;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,error:'Mạng kiểm thử gián đoạn'})})}const correct=b.answer==='A';answered.push({attempt:{qid:b.qid,correct}});Object.assign(data,{correct,answer:'A',solution:'Nước có công thức H₂O.',solutionImages:[],reward:0,stage:0})}}
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})
})
await page.goto(`${base}/hs`);await page.getByRole('button',{name:/Thần Thú/i}).first().click()
await page.getByText('EXP từ bài học · 80/100 hôm nay',{exact:true}).waitFor()
await page.getByText('Cấp 2 / 120',{exact:true}).waitFor()
await page.evaluate(()=>window.dispatchEvent(new Event('focus')))
await page.waitForTimeout(500)
assert.ok(syncs>=2)
await page.getByText('Đã đồng bộ 140 EXP từ bài làm. EXP tự nạp vào cấp thần thú.',{exact:true}).waitFor()
await page.setViewportSize({width:390,height:844})
await page.locator('.spirit-exp-sync').screenshot({path:'/tmp/academic-exp-mobile.png'})
assert.deepEqual(errors,[])
console.log('PASS: portal authenticated sync, game live level/EXP update, focus refresh, mobile')
await browser.close()
