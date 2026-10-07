#!/usr/bin/env node
// Chạy trên máy đã đăng nhập Claude Code. Không mang mã giáo viên vào phiên soạn/kiểm.
import {spawn,spawnSync} from 'node:child_process'
import {randomUUID,createHash} from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {kiemTinhDayDu,probeDuyNhat,deChoKiemMu,kiemBangMay} from './chua-kiem.bundle.mjs'

const here=path.dirname(fileURLToPath(import.meta.url))
const argv=process.argv.slice(2)
const thu=argv.includes('--thu'),motLan=argv.includes('--mot-lan')
const secret=(process.env.OMR_MA_BI_MAT ?? (fs.existsSync(path.join(os.homedir(),'.omr-ma-bi-mat')) ? fs.readFileSync(path.join(os.homedir(),'.omr-ma-bi-mat'),'utf8') : '')).trim()
const host=(process.env.OMR_MAY_CHU || 'https://omr.ttadodaihoc.workers.dev').replace(/\/$/,'')
const save=path.resolve(process.env.OMR_THU_MUC_CHUA || '.may-soan-vong-chua')
const modelIndex=argv.indexOf('--model'),model=modelIndex>=0 ? argv[modelIndex+1] : ''
if(!secret) throw Error('Thiếu mã giáo viên trong OMR_MA_BI_MAT hoặc ~/.omr-ma-bi-mat.')
if(spawnSync('claude',['--version'],{stdio:'ignore'}).status!==0) throw Error('Máy này cần Claude Code đã đăng nhập để soạn và kiểm độc lập.')
fs.mkdirSync(save,{recursive:true,mode:0o700})
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'))
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2),{mode:0o600})
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex')
async function api(url,b){
  const r=await fetch(host+url,{method:'POST',headers:{'content-type':'application/json','x-ma-bi-mat':secret},body:JSON.stringify(b),signal:AbortSignal.timeout(60000)})
  if(!r.ok) throw Error(`Máy chủ từ chối (${r.status}).`)
  const j=await r.json()
  if(!j.ok) throw Error(j.error || j.mo || 'Máy chủ chưa nhận học liệu.')
  return j
}
function run(dir,prompt,maxTurns=70){
  const env={...process.env}
  for(const k of Object.keys(env)) if(/^(OMR_MA_BI_MAT|CLAUDECODE|SESSION_INGRESS_URL|CLAUDE_CODE_.*SESSION.*)$/.test(k)) delete env[k]
  const args=['-p','--output-format','json','--permission-mode','dontAsk','--allowedTools','Read,Write','--max-turns',String(maxTurns)]
  if(model) args.push('--model',model)
  return new Promise((resolve,reject)=>{
    const p=spawn('claude',args,{cwd:dir,env,stdio:['pipe','pipe','pipe']})
    let bytes=0
    p.stdout.on('data',d=>{bytes+=d.length})
    p.stderr.on('data',()=>{})
    p.on('error',()=>reject(Error('Không khởi động được Claude.')))
    p.on('close',code=>code===0&&bytes>0 ? resolve() : reject(Error('Phiên soạn/kiểm chưa hoàn thành.')))
    p.stdin.end(prompt)
  })
}
function anhDoc(dir,source){
  const found=[]
  function visit(x,key=''){
    if(Array.isArray(x)){for(const v of x)visit(v,key);return}
    if(x&&typeof x==='object'){for(const [k,v] of Object.entries(x))visit(v,k);return}
    if(typeof x==='string' && ['src','imageDataUrl','thanCauImg','choiceImgs','ideaImgs'].includes(key) && x){
      if(found.some(r=>r.src===x))return
      const m=/^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=\s]+)$/.exec(x)
      if(!m)throw Error('Có ảnh chưa được tải thành dữ kiện đầy đủ; không tự giải theo chữ rồi gắn đạt.')
      fs.mkdirSync(path.join(dir,'img'),{recursive:true,mode:0o700})
      const tep=`img/${found.length+1}.${m[1]==='jpeg'?'jpg':m[1]}`
      fs.writeFileSync(path.join(dir,tep),Buffer.from(m[2],'base64'),{mode:0o600});found.push({tep,src:x})
    }
  }
  visit(source)
  write(path.join(dir,'anh-doc.json'),found)
  return found.length
}
async function one(v){
  const luotSoan=randomUUID(),luotKiem=randomUUID(),dir=path.join(save,`${new Date().toISOString().slice(0,10)}-${luotSoan}`)
  fs.mkdirSync(dir,{recursive:true,mode:0o700})
  write(path.join(dir,'nguon.json'),v)
  anhDoc(dir,v.cau)
  fs.copyFileSync(path.join(here,'goi-soan-vong-chua.md'),path.join(dir,'yeu-cau.md'))
  // Phiên soạn chỉ có nguồn của một câu; không có mã giáo viên hay thư mục hồ sơ học sinh.
  await run(dir,'Đọc yeu-cau.md, nguon.json và anh-doc.json; dùng Read đọc từng tệp hình trước khi giải. Soạn toàn bộ học liệu vòng chữa vào hoc-lieu.json theo hợp đồng. Không tự tạo bằng chứng duyệt. Mọi câu kiểm phải tự đủ dữ kiện.')
  const h=read(path.join(dir,'hoc-lieu.json')),loi=kiemTinhDayDu(h)
  if(loi.length || h.qidGoc!==v.cau.qid || h.contentVersion!==v.cau.version) throw Error('Bản soạn chưa đạt hợp đồng hoặc lệch câu gốc.')
  const ps=probeDuyNhat(h),vaoMu=ps.map(p=>{const de=deChoKiemMu(p);return {...de,bamDe:digest(de)}})
  // Tách thư mục, bỏ toàn bộ đáp án, lời giải, giả thuyết lỗi và học liệu đã soạn.
  const blind=fs.mkdtempSync(path.join(os.tmpdir(),'omr-chua-mu-'))
  try{
    write(path.join(blind,'de.json'),vaoMu)
    anhDoc(blind,vaoMu)
    await run(blind,'Chỉ đọc de.json và các tệp hình trong anh-doc.json; đọc từng hình bằng Read. Tự giải độc lập TỪNG mục; không có đáp án tham chiếu. Ghi dap-an.json là mảng {qid,phienBan,bamDe,dapAn,lyDo,chac}. Chép đúng qid/phienBan/bamDe. Trắc nghiệm trả mã lựa chọn; Đ/S trả D/S hoặc 4 chữ; số theo yêu cầu làm tròn. Giải thích cách giải và phép tính. Thiếu dữ kiện/mơ hồ: chac=false và dapAn="?". Không phỏng đoán.',Math.min(250,30+ps.length*3))
    const tra=read(path.join(blind,'dap-an.json'))
    write(path.join(dir,'de-mu.json'),vaoMu)
    write(path.join(dir,'dap-an-mu.json'),tra)
    // Đóng kết quả mù trước khi đánh giá tính tương đương/độ khó và phần giải thích.
    const review=fs.mkdtempSync(path.join(os.tmpdir(),'omr-chua-chuyen-mon-'))
    try{
      write(path.join(review,'nguon.json'),v)
      write(path.join(review,'hoc-lieu.json'),h)
      anhDoc(review,{cau:v.cau,hocLieu:h})
      await run(review,'Đọc nguon.json, hoc-lieu.json và các hình trong anh-doc.json bằng Read. Soát khoa học, từng nguyên nhân sai và hỗ trợ, thứ tự tiên quyết, dữ kiện, đơn vị và đáp án. So sánh từng bản ghép/kiểm chứng với câu gốc về cách giải và độ khó. Ghi chuyen-mon.json {dungKhoaHoc,tuongDuong,dungDoKho,duBuoc,lyDo}. Chỉ true nếu tự kiểm đủ; thiếu/không chắc ghi false và lý do cụ thể. Không sửa các tệp nguồn.')
      const kiemMay={phienBan:1,luotSoan,luotKiem,tra,chuyenMon:read(path.join(review,'chuyen-mon.json'))}
      write(path.join(dir,'kiem-may.json'),kiemMay)
      const errors=await kiemBangMay(h,kiemMay)
      if(errors.length) throw Error('Bộ học liệu chưa qua kiểm: '+errors.join(', '))
      if(!thu){const receipt=await api('/kho/may-soan/nop-vong-chua',{hocLieu:h,kiemMay});write(path.join(dir,'receipt.json'),receipt)}
      console.log(JSON.stringify({qid:h.qidGoc,soProbe:ps.length,daLuu:!thu,hoSo:dir}))
    }finally{fs.rmSync(review,{recursive:true,force:true})}
  }finally{fs.rmSync(blind,{recursive:true,force:true})}
}
async function main(){
  const daLam=[]
  let dat=0,truot=0
  for(;;){
    const {viec}=await api('/kho/may-soan/vong-chua-viec',{so:1,daLam})
    if(!viec.length){
      console.log(JSON.stringify({dat,truot,hetHangTrongLuot:true}))
      if(motLan||thu) break
      // Chương trình nền hỏi lại; không phải lệnh chờ của agent.
      await new Promise(resolve=>setTimeout(resolve,300000));daLam.length=0;continue
    }
    const v=viec[0];daLam.push(v.cau.qid)
    try{await one(v);dat++}catch(e){truot++;console.log(JSON.stringify({qid:v.cau.qid,dat:false,lyDo:e.message}))}
    if(thu) break
  }
}
main().catch(()=>{console.error('Máy soạn dừng; chưa ghi nhận hoàn thành. Kiểm kết nối, đăng nhập Claude và hồ sơ tại thư mục làm việc.');process.exitCode=1})
