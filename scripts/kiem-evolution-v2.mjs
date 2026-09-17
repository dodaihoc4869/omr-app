import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const base=process.env.BATTLE_BASE||'http://127.0.0.1:5173'
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']})
const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=[]
page.on('pageerror',e=>errors.push(e.message))
await page.addInitScript(()=>{localStorage.setItem('omr_student_portal_auth',JSON.stringify({sbd:'DEMO',hoTen:'Kiểm thử',token:'expired'}));localStorage.setItem('game-v2-low','1')})
const profile={pet:'dat_quy',choice:false,cap:9,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena:null}
const question={qid:'q1',maDe:'DEMO',phan:'I',text:'Công thức nước?',choices:['H₂O','CO₂','NaCl','O₂'],hinhAnh:[],mucDo:'biet',sao:1}
await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname===new URL(base).hostname)return route.continue();let data={ok:true,items:[],ca:[],ds:[],btvn:[]};const b=route.request().postDataJSON()??{}
 if(u.pathname==='/hs/dang-nhap')data=b.matKhau==='correct-password'?{ok:true,token:'fresh-token'}:{ok:false,error:'Mật khẩu không chính xác'}
 if(u.pathname.includes('/game-v2/')){data=b.token==='fresh-token'?{ok:true,profile,revision:1,tasks:[],remaining:0}:{ok:false,error:'Phiên game đã hết hạn. Em đăng nhập lại.'};if(data.ok&&u.pathname.endsWith('/start'))Object.assign(data,{id:'new',questions:[question]});if(data.ok&&u.pathname.endsWith('/answer'))Object.assign(data,{correct:true,answer:'A',solution:'Nước là H₂O',solutionImages:[]})}
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})})
await page.goto(`${base}/hs`);await page.getByRole('button',{name:/Thần Thú/i}).first().click()
await page.getByRole('textbox',{name:'Mật khẩu học sinh'}).count().catch(()=>0)
await page.getByLabel('Mật khẩu học sinh').fill('wrong');await page.getByRole('button',{name:'Mở game',exact:true}).click();await page.getByText('Mật khẩu không chính xác',{exact:false}).waitFor()
await page.getByLabel('Mật khẩu học sinh').fill('correct-password');await page.getByRole('button',{name:'Mở game',exact:true}).click();await page.locator('.spirit-hero').waitFor()
assert.equal(await page.locator('.spirit-hero .spirit-2d[data-stage]').getAttribute('data-stage'),'0')
await page.getByRole('button',{name:'Bật hiệu ứng',exact:true}).click();await page.locator('.spirit-hero .spirit-2d-image').waitFor();await page.waitForTimeout(800)
await page.getByRole('button',{name:/Xem lần tiến hoá kế tiếp/}).click();await page.getByRole('img',{name:/Thạch Quy, Thức tỉnh, cấp 10/}).waitFor();await page.waitForTimeout(400)
await page.screenshot({path:'/tmp/evolution-next-2d.png',fullPage:true})
assert.equal(await page.locator('.spirit-hero select').count(),0)
assert.equal(await page.getByRole('button',{name:/Xem lần tiến hoá kế tiếp/}).count(),0)
await page.getByText('XEM TRƯỚC CẤP 10 · CẤP THẬT: 9',{exact:true}).waitFor()
assert.equal(await page.locator('.spirit-hero .spirit-2d').getAttribute('data-stage'),'1')
await page.getByRole('button',{name:'Chế độ nhẹ',exact:true}).click();assert.equal(await page.locator('.spirit-hero .spirit-2d[data-stage]').getAttribute('data-stage'),'0')
await page.screenshot({path:'/tmp/evolution-current-light.png',fullPage:true})
await page.getByRole('button',{name:/Khám phá đảo/}).click();await page.getByRole('button',{name:/A\.?\s*H₂O/}).click();await page.getByRole('button',{name:'Trả lời · tung chưởng'}).click();await page.locator('.battle-painted-spell').waitFor()
assert.equal(await page.locator('.battle-painted-spell').getAttribute('data-stage'),'0');assert.equal(await page.locator('.battle-sprite .spirit-2d[data-stage]').getAttribute('data-stage'),'0')
await page.waitForTimeout(500);await page.locator('.learning-battle').screenshot({path:'/tmp/evolution-spell-current.png'})
await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
assert.deepEqual(errors,[]);console.log('PASS: expired token recovery, wrong/correct password, 2D next form, preview never changes actual level, light/current spell consistency, mobile')
await browser.close()
