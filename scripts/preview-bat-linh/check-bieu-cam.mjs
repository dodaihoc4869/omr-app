import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const origin=process.argv[2]||'http://127.0.0.1:5173'
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']})
let checks=0
try{
const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'})
await p.goto(origin+'/scripts/preview-bat-linh/trang.html?man=cau-da-lam');await p.getByText('Sai lần gần nhất',{exact:true}).waitFor();await p.waitForLoadState('networkidle');await p.screenshot({path:'/workspace/bat-linh-preview/cau-da-lam-390.png',fullPage:true});checks++
await p.close()
console.log(`PASS: ${checks} kiểm Câu đã làm`)
}finally{await b.close()}
