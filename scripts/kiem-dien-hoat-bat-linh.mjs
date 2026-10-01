// Kiểm trên trình duyệt thật: dùng cảnh và luồng game thật, máy chủ giả của trang xem thử.
// node scripts/kiem-dien-hoat-bat-linh.mjs [origin] [thư mục ảnh] [thú đầu] [thú cuối]
import {chromium} from 'playwright'
import {mkdirSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
const origin=process.argv[2]??'http://127.0.0.1:5173',out=resolve(process.argv[3]??'/workspace/scratch/dien-hoat-kiem')
const dau=Number(process.argv[4]??0),cuoi=Number(process.argv[5]??7)
mkdirSync(out,{recursive:true})
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']})
const loi=[],ketQua=[]
const check=(ok,chu)=>{if(!ok)throw new Error(chu);ketQua.push(chu)}
try{
 for(const width of [390,1440])for(let thu=dau;thu<=cuoi;thu++){
  const page=await browser.newPage({viewport:{width,height:width===390?844:900}})
  page.on('pageerror',e=>loi.push(e.message));page.on('response',r=>{if(r.status()>=400)loi.push(`${r.status()} ${r.url()}`)})
  await page.goto(`${origin}/src/game/than-thu-v2/dao2/xem-thu-chuong.html?thu=${thu}&rong=${width===390?390:1100}`)
  const cv=page.locator('.bl-arena-canvas')
  await page.waitForFunction(()=>document.querySelector('.bl-arena-canvas')?.dataset.ready==='true')
  await page.waitForTimeout(700)
  await page.locator('#dung').click();await page.waitForTimeout(780)
  const d=await cv.evaluate(e=>({...e.dataset}))
  check(d.action==='cast'&&d.sheet==='chuong'&&Number(d.frame)===4,`Đảo thú ${thu}/${width}: khung phóng chưởng`)
  check(JSON.parse(d.source).x<JSON.parse(d.target).x,`Đảo thú ${thu}/${width}: chưởng bay sang quái`)
  await cv.screenshot({path:`${out}/dao-thu-${thu}-${width}.jpg`,type:'jpeg',quality:68})
  await page.locator('#sai').click();await page.waitForTimeout(1350)
  check(await cv.getAttribute('data-action')==='hit',`Đảo thú ${thu}/${width}: nhận phản đòn`)
  await page.locator('#dung3').click();await page.waitForTimeout(1050)
  check(await cv.getAttribute('data-action')==='ultimate',`Đảo thú ${thu}/${width}: Cuồng nộ`)
  await page.goto(`${origin}/src/game/than-thu-v2/doan2/xem-thu-2.html?man=tran&thu=${thu}`)
  await page.getByRole('button',{name:'Bỏ qua',exact:true}).click()
  await page.locator('.dh-pa button').nth(1).click()
  await page.getByRole('button',{name:/^CHỐT ĐÒN/}).click()
  await page.waitForTimeout(1150)
  const arena=page.locator('.dh-chuong .bl-arena'),ch=arena.locator('canvas')
  check(await arena.getAttribute('data-thu')===String(thu),`Đoàn thú ${thu}/${width}: đúng thú của em`)
  check(await ch.getAttribute('data-action')==='punch',`Đoàn thú ${thu}/${width}: đấm lấy đà rồi bắn chưởng`)
  check(await page.locator('.dh-chuong').textContent().then(s=>s.includes('−48')&&s.includes('còn 80 máu')),`Đoàn thú ${thu}/${width}: giữ số thật từ máy chủ`)
  await page.locator('.dh-chuong').screenshot({path:`${out}/doan-thu-${thu}-${width}.jpg`,type:'jpeg',quality:68})
  await page.getByRole('button',{name:'Bỏ qua',exact:true}).click()
  check(await page.locator('.dh-chuong').count()===0,`Đoàn thú ${thu}/${width}: bỏ qua ngay`)
  await page.close()
 }
 check(loi.length===0,`Không lỗi JavaScript hoặc ảnh lỗi (${loi.join('; ')})`)
 writeFileSync(`${out}/ket-qua-${dau}-${cuoi}.json`,JSON.stringify({soKiemTra:ketQua.length,ketQua,loi},null,2))
 console.log(`${ketQua.length} kiểm tra trình duyệt đạt; thú ${dau}–${cuoi}, màn 390/1440.`)
}finally{await browser.close()}
