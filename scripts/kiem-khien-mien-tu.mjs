import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const base=process.env.BATTLE_BASE||'http://127.0.0.1:5173'
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']})
const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=[]
page.on('pageerror',e=>errors.push(e.message))
await page.addInitScript(()=>{localStorage.setItem('omr_student_portal_auth',JSON.stringify({sbd:'DEMO',hoTen:'Kiểm thử',token:'expired'}));localStorage.setItem('game-v2-low','1')})
const profile={pet:'dat_quy',choice:false,cap:50,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena:null}
const question={qid:'q1',maDe:'DEMO',phan:'I',text:'Công thức nước?',choices:['H₂O','CO₂','NaCl','O₂'],hinhAnh:[],mucDo:'biet',sao:1}
await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname===new URL(base).hostname)return route.continue();let data={ok:true,items:[],ca:[],ds:[],btvn:[]};const b=route.request().postDataJSON()??{}
 if(u.pathname==='/hs/dang-nhap')data=b.matKhau==='correct-password'?{ok:true,token:'fresh-token'}:{ok:false,error:'Mật khẩu không chính xác'}
 if(u.pathname.endsWith('/shield-use'))profile.shields={used:1,activeUntil:Date.now()+10000,lastUse:b.useId};
 if(u.pathname.includes('/game-v2/')){data=b.token==='fresh-token'?{ok:true,profile,revision:1,tasks:[],remaining:0}:{ok:false,error:'Phiên game đã hết hạn. Em đăng nhập lại.'};if(data.ok&&u.pathname.endsWith('/start'))Object.assign(data,{id:'new',questions:[question]});if(data.ok&&u.pathname.endsWith('/answer'))Object.assign(data,{correct:true,answer:'A',solution:'Nước là H₂O',solutionImages:[]})}
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})})
await page.goto(`${base}/hs`);await page.getByRole('button',{name:/Thần Thú/i}).first().click()
await page.getByRole('textbox',{name:'Mật khẩu học sinh'}).count().catch(()=>0)
await page.getByLabel('Mật khẩu học sinh').fill('wrong');await page.getByRole('button',{name:'Mở game',exact:true}).click();await page.getByText('Mật khẩu không chính xác',{exact:false}).waitFor()
await page.getByLabel('Mật khẩu học sinh').fill('correct-password');await page.getByRole('button',{name:'Mở game',exact:true}).click();await page.locator('.spirit-hero').waitFor()
await page.getByText('🛡 Khiên miễn tử · 6 lượt',{exact:true}).waitFor()
await page.getByRole('button',{name:'Dùng Khiên miễn tử'}).click()
await page.getByRole('dialog').waitFor();await page.getByText('Đã dùng 1 khiên · Còn 5 lượt').waitFor()
await page.screenshot({path:'/tmp/khien-mien-tu.png'})
await page.waitForTimeout(8500);assert.equal(await page.getByRole('dialog').count(),1)
await page.getByRole('dialog').waitFor({state:'detached',timeout:3000})
await page.getByText('🛡 Khiên miễn tử · 5 lượt',{exact:true}).waitFor()
assert.deepEqual(errors,[])
console.log('PASS: fullscreen shield, 6→5 inventory, visible at 8.5s, disappears at 10s')
await browser.close()
