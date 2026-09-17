import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const base=process.env.BATTLE_BASE||'http://127.0.0.1:5173'
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[]
page.on('pageerror',e=>errors.push(e.message))
await page.addInitScript(()=>localStorage.setItem('omr_student_portal_auth',JSON.stringify({sbd:'DEMO',hoTen:'Kiểm thử',token:'test-only'})))
const profile={pet:'dat_quy',choice:false,cap:10,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena:null}
const room={id:'LTTEST1234',revision:1,owner:true,kind:'escort',created:Date.now(),started:false,finished:false,round:1,roundAt:Date.now(),deadline:Date.now()+480000,score:[0,0],crystal:{x:3,y:2,carrier:null},walls:[],log:[],effects:[],winner:null,players:[0,1,2,3].map((i)=>({id:'p'+i,self:i===0,alias:['Thạch Quy','Viêm Sư','Phong Thố','Ái Hồ'][i],pet:[0,2,3,5][i],level:10,team:i%2,x:i%2?6:0,y:i<2?1:3,hp:100,shield:0,left:false,ready:false,energy:0,correct:false}))}
let learned=false
await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname===new URL(base).hostname)return route.continue();let data={ok:true,profile,revision:1,tasks:[],remaining:0,items:[],ca:[],ds:[],btvn:[]};const b=route.request().postDataJSON()??{}
 if(u.pathname.endsWith('/escort-create'))Object.assign(data,{escort:room})
 if(u.pathname.endsWith('/escort-start')){room.started=true;room.revision++;Object.assign(data,{escort:room})}
 if(u.pathname.endsWith('/escort-view'))Object.assign(data,{escort:room})
 if(u.pathname.endsWith('/start')){assert.equal(b.guardian,room.id);Object.assign(data,{id:'test',questions:[{qid:'q',maDe:'D',phan:'I',text:'Công thức nước?',choices:['H₂O','CO₂','NaCl','O₂'],ideas:[],hinhAnh:[],tenDang:'Hoá học'}]})}
 if(u.pathname.endsWith('/answer')){learned=true;Object.assign(data,{correct:true,answer:'A',solution:{chot:'Nước có công thức H2O'},solutionImages:[],reward:0,stage:0})}
 if(u.pathname.endsWith('/escort-act')){assert.ok(learned);assert.equal(b.command.type,'move');room.players[0].x=b.command.x;room.players[0].y=b.command.y;room.round++;room.revision++;room.log=['Lượt 1: Thạch Quy mở đường.'];room.effects=[{from:0,to:0,kind:'move'}];Object.assign(data,{escort:room})}
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})})
await page.goto(base+'/hs');await page.getByRole('button',{name:/Thần Thú/i}).first().click();await page.getByRole('button',{name:'Hộ Tống Linh Tâm',exact:true}).click()
await page.getByRole('button',{name:'Tạo phòng Linh Tâm',exact:true}).click();await page.getByRole('button',{name:'Bắt đầu hộ tống'}).click();await page.locator('.escort-map').waitFor();assert.equal(await page.locator('.escort-tile').count(),35)
await page.setViewportSize({width:1100,height:6000});await page.evaluate(()=>window.scrollTo(0,0));await page.locator('.escort-map').screenshot({path:'/tmp/linh-tam-board.png'});await page.locator('.escort-guide').getByRole('button').nth(3).click();await page.locator('.escort-guide').screenshot({path:'/tmp/linh-tam-guide.png'})
await page.getByRole('button',{name:'Làm câu Hoá của lượt này'}).click();await page.getByRole('button',{name:/A\.?\s*H₂O/}).click();await page.getByRole('button',{name:'Trả lời · tung chưởng'}).click();await page.getByRole('button',{name:'Về Linh Tâm · chốt hành động'}).click()
await page.getByRole('button',{name:'Ô 2,2',exact:true}).click();await page.getByRole('button',{name:'Di chuyển · miễn phí'}).click();await page.getByText('Lượt 2/12',{exact:true}).waitFor()
await page.setViewportSize({width:390,height:844});await page.locator('.escort-guide').screenshot({path:'/tmp/linh-tam-guide-mobile.png'})
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[])
console.log('PASS: lobby, four players, start, 35 tiles, bound chemistry question, return and move, next round, mobile no overflow')
await browser.close()
