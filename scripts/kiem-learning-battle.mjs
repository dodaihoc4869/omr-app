import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const base=process.env.BATTLE_BASE||'http://127.0.0.1:5173'
const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1100,height:950}})
const errors=[];page.on('pageerror',e=>errors.push(e.message))
await page.addInitScript(()=>{localStorage.setItem('omr_student_portal_auth',JSON.stringify({sbd:'DEMO',hoTen:'Kiểm thử',token:'test-only'}))})
const profile={pet:'lua_phuong',choice:false,cap:30,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena:null}
const questions=Array.from({length:6},(_,i)=>({qid:`I_${i}`,maDe:'DEMO',phan:'I',text:'Công thức hoá học của nước là',choices:['H₂O','CO₂','NaCl','O₂'],ideas:[],hinhAnh:[],dang:'nuoc',tenDang:'Nước',mucDo:'biet',sao:1,kienThuc:[]}))
let answered=[],fail=false
await page.route('**/*',async route=>{
 const u=new URL(route.request().url());if(['127.0.0.1','localhost',new URL(base).hostname].includes(u.hostname))return route.continue()
 let data={ok:true,items:[],ca:[],ds:[],btvn:[]}
 if(u.pathname.includes('/game-v2/')){const b=route.request().postDataJSON()??{};data={ok:true,profile,revision:1,tasks:[],remaining:0}
 if(u.pathname.endsWith('/start')){answered=[];Object.assign(data,{id:'battle-test',questions})}
 if(u.pathname.endsWith('/resume'))Object.assign(data,{id:'battle-test',questions,answered})
 if(u.pathname.endsWith('/answer')){if(fail){fail=false;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,error:'Mạng kiểm thử gián đoạn'})})}const correct=b.answer==='A';answered.push({attempt:{qid:b.qid,correct}});Object.assign(data,{correct,answer:'A',solution:'Nước có công thức H₂O.',solutionImages:[],reward:0,stage:0})}}
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})
})
await page.goto(`${base}/hs`);await page.getByRole('button',{name:/Thần Thú/i}).first().click()
await page.getByRole('button',{name:/01Khám phá|Khám phá đảo/}).click()
await page.locator('.learning-battle').waitFor()
const answer=async(correct)=>{await page.getByRole('button',{name:correct?/A\.?\s*H₂O/:/B\.?\s*CO₂/}).click();await page.getByRole('button',{name:'Trả lời · tung chưởng'}).click();await page.locator('.spirit-feedback').waitFor()}
await page.screenshot({path:'/tmp/battle-desktop.png',fullPage:true})
await answer(true);await page.waitForTimeout(700);assert.equal(await page.locator('.battle-fire').count(),1)
await page.screenshot({path:'/tmp/battle-fire.png',fullPage:true})
await page.getByRole('button',{name:'Đã đọc, sang câu tiếp'}).click()
await answer(true);await page.getByRole('button',{name:'Đã đọc, sang câu tiếp'}).click()
await answer(true);await page.waitForTimeout(700);assert.equal(await page.locator('.battle-rage').count(),1)
await page.screenshot({path:'/tmp/battle-rage.png',fullPage:true})
await page.getByRole('button',{name:'Đã đọc, sang câu tiếp'}).click()
await page.setViewportSize({width:390,height:844})
await answer(false);await page.waitForTimeout(700)
assert.equal(await page.getByRole('progressbar',{name:'Máu thần thú'}).getAttribute('value'),'82')
await page.screenshot({path:'/tmp/battle-mobile-wrong.png',fullPage:true})
await page.getByRole('button',{name:'Đã đọc, sang câu tiếp'}).click()
fail=true;await page.getByRole('button',{name:/A\.?\s*H₂O/}).click();await page.getByRole('button',{name:'Trả lời · tung chưởng'}).click();await page.getByRole('alert').waitFor()
assert.equal(await page.getByRole('progressbar',{name:'Máu thần thú'}).getAttribute('value'),'82')
await page.getByRole('button',{name:'Trả lời · tung chưởng'}).click();await page.locator('.spirit-feedback').waitFor()
assert.equal(await page.getByRole('progressbar',{name:'Máu thần thú'}).getAttribute('value'),'92')
await page.getByRole('button',{name:'Đảo thần thú',exact:true}).click();await page.getByRole('button',{name:'Tiếp tục lượt học gần nhất'}).click()
assert.equal(await page.getByRole('progressbar',{name:'Máu thần thú'}).getAttribute('value'),'92');assert.equal(await page.locator('.battle-spell').count(),0)
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
assert.deepEqual(errors,[])
console.log('PASS: correct, rage, wrong, network retry, recovery, resume, mobile layout; no browser errors')
await browser.close()
