import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const base=process.env.BATTLE_BASE||'http://127.0.0.1:5173'
const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1100,height:950}})
const errors=[];page.on('pageerror',e=>errors.push(e.message))
await page.addInitScript(()=>{localStorage.setItem('omr_student_portal_auth',JSON.stringify({sbd:'DEMO',hoTen:'Kiểm thử',token:'test-only'}))})
const profile={pet:'lua_phuong',choice:false,cap:30,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena:null}
const questions=Array.from({length:6},(_,i)=>({qid:`I_${i}`,maDe:'DEMO',phan:'I',text:'Công thức hoá học của nước là',choices:['H₂O','CO₂','NaCl','O₂'],ideas:[],hinhAnh:[],dang:'nuoc',tenDang:'Nước',mucDo:'biet',sao:1,kienThuc:[]}))
const graphic='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="200"><rect width="500" height="200" fill="white"/><path d="M40 20V170H470M40 160L140 130 240 100 340 60 450 30" fill="none" stroke="blue" stroke-width="3"/><text x="170" y="190">Bieu do tu kho de</text></svg>')
questions[0].hinhAnh=[{src:graphic,viTri:'sau_de',alt:'Biểu đồ đề bài'}]
questions[0].table=[['Chất','Số mol'],['H₂O','1']]
let answered=[],fail=false
await page.route('**/*',async route=>{
 const u=new URL(route.request().url());if(['127.0.0.1','localhost',new URL(base).hostname].includes(u.hostname))return route.continue()
 let data={ok:true,items:[],ca:[],ds:[],btvn:[]}
 if(u.pathname.includes('/game-v2/')){const b=route.request().postDataJSON()??{};data={ok:true,profile,revision:1,tasks:[],remaining:0}
 if(u.pathname.endsWith('/start')){answered=[];Object.assign(data,{id:'battle-test',questions})}
 if(u.pathname.endsWith('/resume'))Object.assign(data,{id:'battle-test',questions,answered})
 if(u.pathname.endsWith('/answer')){if(fail){fail=false;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,error:'Mạng kiểm thử gián đoạn'})})}const correct=b.answer==='A';answered.push({attempt:{qid:b.qid,correct}});Object.assign(data,{correct,answer:'A',solution:{chot:'Nước có công thức H2O.',tung_pa:{A:{dung:true,vi_sao:'Nước là H2O'},B:{dung:false,vi_sao:'CO2 là carbon dioxide'},C:{dung:false,vi_sao:'NaCl là muối'},D:{dung:false,vi_sao:'O2 là oxygen'}},buoc:['Đọc dữ kiện từ biểu đồ','Đối chiếu công thức']},solutionImages:[{src:graphic,viTri:'sau_loi_giai',alt:'Biểu đồ lời giải'}],reward:0,stage:0})}}
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})
})
await page.goto(`${base}/hs`);await page.getByRole('button',{name:/Thần Thú/i}).first().click()
await page.getByRole('button',{name:/01Khám phá|Khám phá đảo/}).click()
await page.locator('.learning-battle').waitFor()
const answer=async(correct)=>{await page.getByRole('button',{name:correct?/A\.?\s*H₂O/:/B\.?\s*CO₂/}).click();await page.getByRole('button',{name:'Trả lời · tung chưởng'}).click();await page.locator('.spirit-feedback').waitFor()}
assert.equal(await page.getByAltText('Biểu đồ lời giải').count(),0)
await page.getByAltText('Biểu đồ đề bài').waitFor();await page.getByRole('cell',{name:'1',exact:true}).waitFor()
await answer(true)
await page.getByText('KIẾN THỨC CỐT LÕI',{exact:true}).waitFor()
await page.getByAltText('Biểu đồ lời giải').waitFor()
assert.equal(await page.locator('.spirit-bank-solution').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 250, 240)')
await page.locator('.spirit-feedback').screenshot({path:'/tmp/loi-giai-google.png'})
await page.getByAltText('Biểu đồ lời giải').click();assert.equal(await page.getByAltText('Ảnh câu hỏi / lời giải').count(),1)
await page.getByAltText('Ảnh câu hỏi / lời giải').click()
await page.setViewportSize({width:390,height:844})
await page.locator('.spirit-feedback').screenshot({path:'/tmp/loi-giai-google-mobile.png'})
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
await page.getByRole('button',{name:'Đảo thần thú',exact:true}).click()
await page.screenshot({path:'/tmp/than-thu-google-mobile.png',fullPage:true})
assert.deepEqual(errors,[])
console.log('PASS: shared yellow solution, table, chart before/after answer, zoom, mobile no overflow')
await browser.close()
