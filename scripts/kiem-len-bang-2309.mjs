// Fixture cục bộ: không gọi API hay dùng dữ liệu học sinh thật.
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
const out='/tmp/omr-len-bang-2309'
await mkdir(out,{recursive:true})
const vite=await createServer({configFile:false,server:{middlewareMode:true},optimizeDeps:{noDiscovery:true},appType:'custom'})
const browser=await chromium.launch({headless:true})
try{
  const {taoHtmlMayChieu}=await vite.ssrLoadModule('/src/lib/html-may-chieu.ts')
  const pet='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><circle cx="80" cy="80" r="65" fill="#3b826e"/><circle cx="60" cy="70" r="8" fill="white"/><circle cx="100" cy="70" r="8" fill="white"/></svg>')
  const ds=Array.from({length:4},(_,i)=>({sbd:`FIXTURE-${i}`,hoTen:`Học sinh mẫu ${i+1}`,soCau:i+1,
    thanThu:{anh:pet,ten:'Thạch Quy',danhHieu:'',he:'Đất',capDo:3,hinhThai:'',tangThapCaoNhat:1,soCauDaThanhTay:0},
    cau:{id:`DE-I-${i+1}`,maDe:'DE',phan:'I',text:'Chất nào dưới đây là ester?',luaChon:['CH₃COOCH₃','CH₃COOH','C₂H₅OH','CH₃CHO'],dapAn:'A',sao:0,mucDo:'biet',chuyenDe:'Ester',dang:'bai_tap',chot:'Methyl ethanoate có nhóm chức ester.',lyDo:null,buoc:[],ketQua:'A'}}))
  for(const dayHoc of [true,false]){
    const html=taoHtmlMayChieu(ds,{dayHoc,tenBuoi:'Gọi lên bảng bằng nút bấm'})
    await writeFile(`${out}/${dayHoc?'day-hoc':'chua-bai'}.html`,html)
    const page=await browser.newPage({viewport:{width:1280,height:800}})
    const errors=[];page.on('pageerror',e=>errors.push(e.message))
    await page.route('https://**/*',r=>r.abort())
    await page.setContent(html)
    await page.waitForFunction(()=>document.body.classList.contains('mc-san-sang'))
    await page.waitForTimeout(1000)
    if(await page.locator('#mc-clock,#mc-buoi,#mc-tien').count())throw Error('Còn thông tin thời gian')
    if(await page.locator('.mc-dot').first().locator('.mc-em').first().isVisible())throw Error('Tự gọi tên trước khi bấm')
    await page.clock.install()
    await page.clock.fastForward(30*60*1000)
    if(await page.locator('.mc-intro').count())throw Error('Tự gọi sau thời gian chờ')
    await page.screenshot({path:`${out}/${dayHoc?'day-hoc':'chua-bai'}-cho.png`})
    await page.getByRole('button',{name:'Lên bảng',exact:true}).click()
    if(!await page.locator('.mc-intro').isVisible())throw Error('Thiếu hiệu ứng thần thú')
    await page.screenshot({path:`${out}/${dayHoc?'day-hoc':'chua-bai'}-goi.png`})
    await page.locator('.mc-intro').click()
    if(!await page.locator('.mc-dot').first().locator('.mc-em').first().isVisible())throw Error('Thiếu thẻ tên sau khi bấm')
    await page.getByRole('button',{name:'Đợt tiếp',exact:true}).click()
    if(!await page.getByRole('button',{name:'Lên bảng',exact:true}).isEnabled())throw Error('Đợt sau không chờ bấm')
    if(errors.length)throw Error(errors.join('\n'))
    await page.close()
  }
  console.log(`ĐẠT: dạy học và chữa bài chờ bấm, 30 phút không tự gọi; bấm hiện thần thú/thẻ tên. Ảnh: ${out}`)
}finally{await browser.close();await vite.close()}
