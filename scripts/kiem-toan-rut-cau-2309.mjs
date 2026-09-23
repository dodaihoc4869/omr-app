// Probe kiểm toán, chỉ dữ liệu giả trong bộ nhớ. Exit 1 = đã tái hiện lỗi, KHÔNG phải test đạt.
// Chạy: node scripts/kiem-toan-rut-cau-2309.mjs
import { createServer } from 'vite'
const server = await createServer({ configFile:false, server:{middlewareMode:true}, optimizeDeps:{noDiscovery:true}, appType:'custom' })
try {
  const { phanTichTyLeDang, rutLuyenThemDangCauSai } = await server.ssrLoadModule('/src/lib/thuat-toan-rut-cau-sai.ts')
  const choices=['A. a','B. b','C. c','D. d']
  const bad={qid:'OLD',soCau:1,phan:'I',dangMa:'LEARNED.A',dang:'Tên trùng',dapAnDung:'A',text:'Câu đã sai',choices,maCa:'DE'}
  const source={maDe:'DE',nhom:'12 · Bài tập',phanI:[{id:'NEW',text:'Câu thuộc mã khác',choices,correct:'A',mucDo:'biet',dang:{ma:'UNLEARNED.B',ten:'Tên trùng'},chuyenDe:'Chuyên đề khác'}],phanII:[],phanIII:[]}
  const overlap=phanTichTyLeDang([bad],[source])
  const olds=[1,2,3].map(i=>({...bad,qid:`OLD${i}`,dangMa:`D${i}`,dang:`Tên ${i}`,soCau:i}))
  const multi={...source,phanI:[1,2,3].map(i=>({...source.phanI[0],id:`NEW${i}`,dang:{ma:`D${i}`,ten:`Tên ${i}`}}))}
  const out=rutLuyenThemDangCauSai(olds,[multi],1,{hoTen:'Fixture',sbd:'S1'})
  const nameCollision=overlap.thongKe[0].ungVien.map(q=>q.id)
  const report={diagnostic:true,nameCollision:{learnedCode:bad.dangMa,candidateCode:source.phanI[0].dang.ma,selected:nameCollision},requestedCount:1,returnedCount:out.dsCau.length,returnedIds:out.dsCau.map(q=>q.id)}
  console.log(JSON.stringify(report,null,2))
  process.exitCode=nameCollision.length || out.dsCau.length>1 ? 1 : 0
} finally { await server.close() }
