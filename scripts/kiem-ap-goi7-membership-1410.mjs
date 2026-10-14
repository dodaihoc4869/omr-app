// Chạy SQL NGUYÊN VĂN của công cụ phát hành trên SQLite bộ nhớ, không kết nối Cloudflare hoặc đọc cấu hình bí mật.
import { strict as assert } from 'node:assert'
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'

const root=fileURLToPath(new URL('../',import.meta.url)),scratch=mkdtempSync(join(tmpdir(),'c3-ap-goi7-'))
process.chdir(root)
const out=[]
try {
  const entry=join(scratch,'helpers.ts'),bundle=join(scratch,'helpers.mjs')
  writeFileSync(entry,[
    `export {taoD1That} from ${JSON.stringify(resolve(root,'tests/_d1-that.ts'))}`,
    `export {SQL_GOI7} from ${JSON.stringify(resolve(root,'server/src/goi-bai-7-schema.ts'))}`,
    `export {SQL_LUOT_GOI7,sqlTenLopHs} from ${JSON.stringify(resolve(root,'server/src/goi-bai-7.ts'))}`,
    `export {sqlEmDangNhan7,sqlQuyetDinhNhan7} from ${JSON.stringify(resolve(root,'server/src/goi-bai-7-quyen.ts'))}`,
  ].join('\n'))
  execFileSync(resolve(root,'node_modules/.bin/esbuild'),[entry,'--bundle','--platform=node','--format=esm','--target=node24',`--outfile=${bundle}`,'--log-level=warning'],{stdio:'pipe'})
  const h=await import(pathToFileURL(bundle).href)
  const source=readFileSync('scripts/ap-goi7-song.ts','utf8'),ast=ts.createSourceFile('ap-goi7-song.ts',source,ts.ScriptTarget.Latest,true)
  const ten=new Set(['stats','chuaDuyet','chuaNhan'])
  const nodes=ast.statements.filter(st=>{
    if(ts.isExpressionStatement(st))return /^await db\.prepare\(`INSERT OR IGNORE INTO goi_bai_7_ngay/.test(st.getText(ast))
    if(ts.isVariableStatement(st))return st.declarationList.declarations.some(d=>ten.has(d.name.getText(ast)))
    return ts.isIfStatement(st)&&/^(stats\.emChuaCoQuota|chuaNhan\?\.n)$/.test(st.expression.getText(ast))
  })
  assert.equal(nodes.length,7,'Phải lấy đúng hai INSERT, ba đọc và hai cổng lỗi từ script thật.')
  const js=ts.transpileModule(nodes.map(st=>st.getText(ast)).join('\n')+'\nreturn {stats,chuaDuyet,chuaNhan};',{compilerOptions:{target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.None}}).outputText
  const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor
  const run=new AsyncFunction('db','query','ngay','SQL_LUOT_GOI7','sqlTenLopHs','sqlEmDangNhan7','sqlQuyetDinhNhan7',js)
  const ngay='2026-10-14'
  const phase=d=>run(d.env.DB,sql=>Promise.resolve(d.sql.prepare(sql).all()),ngay,h.SQL_LUOT_GOI7,h.sqlTenLopHs,h.sqlEmDangNhan7,h.sqlQuyetDinhNhan7)
  const snapshot=(d,table)=>JSON.stringify(d.sql.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all())
  function fixture({chon,nhan=['S1','S2','S3','S4','S5']}={}) {
    const d=h.taoD1That();for(const sql of h.SQL_GOI7)d.sql.exec(sql)
    const hs=d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES(?,?,'12','x')")
    for(let i=1;i<=5;i++)hs.run(`S${i}`,`Em giả ${i}`)
    goi(d,'a','12 - Lớp Thường',nhan,['q1','q2','q3'])
    if(chon)d.sql.prepare('INSERT INTO goi_bai_7_tick_em(tick_id,sbd_json,luc) VALUES(?,?,?)').run('a',JSON.stringify(chon),'x')
    return d
  }
  function goi(d,id,lop,nhan,qids) {
    d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)').run(id,lop,id,`Bài giả ${id}`,1,'[]','2026-10-14T00:00:00Z')
    d.sql.prepare('INSERT INTO goi_bai_7(id,tick_id,lop,khoa_bai,ten,bat_dau,han,tao_luc) VALUES(?,?,?,?,?,?,?,?)').run(`g7:${id}`,id,lop,id,`Bài giả ${id}`,ngay,'2026-10-20','x')
    for(const sbd of nhan)d.sql.prepare('INSERT INTO goi_bai_7_em(goi_id,sbd,bat_dau,han) VALUES(?,?,?,?)').run(`g7:${id}`,sbd,ngay,'2026-10-20')
    for(const qid of qids)d.sql.prepare('INSERT INTO goi_bai_7_cau(goi_id,qid,version,ma_de,meta_json) VALUES(?,?,?,?,?)').run(`g7:${id}`,qid,'v1','D-gia','{"hopLe":true}')
  }
  async function check(ten,f) {await f();out.push(ten)}
  await check('tick cũ mặc định cả lớp, tên lớp hiệu lực khối 12',async()=>{
    const d=fixture(),r=await phase(d)
    assert.equal(r.stats.soEm,5);assert.equal(r.stats.soEmDaTungNhan,5);assert.equal(r.stats.emChuaCoQuota,0);assert.equal(r.chuaNhan.n,0)
    assert.equal(d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_ngay').get().n,5)
    assert.equal(d.sql.prepare('SELECT SUM(quota) n FROM goi_bai_7_ngay').get().n,5)
  })
  await check('tick mới chọn 2/5 không báo thiếu 3 em chủ ý chưa chọn',async()=>{
    const d=fixture({chon:['S1','S3'],nhan:['S1','S3']}),r=await phase(d)
    assert.equal(r.stats.soEm,2);assert.equal(r.chuaNhan.n,0);assert.equal(d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_ngay').get().n,2)
  })
  await check('override bớt giữ raw membership và lịch sử nhưng không seed quota',async()=>{
    const d=fixture();d.sql.prepare('INSERT INTO goi_bai_7_chon_em(goi_id,sbd,nhan,luc) VALUES(?,?,?,?)').run('g7:a','S2',0,'x')
    d.sql.prepare('INSERT INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES(?,?,?,?,?,?,?)').run('lich-su','g7:a','S2','q1','v1','cho_thay','2026-10-13T00:00:00Z')
    const em=snapshot(d,'goi_bai_7_em'),hist=snapshot(d,'goi_bai_7_gap'),r=await phase(d)
    assert.equal(r.stats.soEm,4);assert.equal(r.stats.soEmDaTungNhan,5);assert.equal(r.chuaNhan.n,0)
    assert.equal(d.sql.prepare("SELECT COUNT(*) n FROM goi_bai_7_ngay WHERE sbd='S2'").get().n,0)
    assert.equal(snapshot(d,'goi_bai_7_em'),em);assert.equal(snapshot(d,'goi_bai_7_gap'),hist)
  })
  await check('thêm lại có chủ đích vượt whitelist tick, cùng gói và hạn',async()=>{
    const d=fixture({chon:['S1','S3'],nhan:['S1','S2','S3']})
    d.sql.prepare('INSERT INTO goi_bai_7_chon_em(goi_id,sbd,nhan,luc) VALUES(?,?,?,?)').run('g7:a','S2',1,'x')
    assert.equal((await phase(d)).stats.soEm,3)
    assert.equal(d.sql.prepare("SELECT quota FROM goi_bai_7_ngay WHERE goi_id='g7:a' AND sbd='S2'").get().quota,1)
  })
  await check('em mới chưa chọn, em khóa và chuyển lớp không báo thiếu/nhận quota',async()=>{
    const d=fixture({chon:['S1','S3'],nhan:['S1','S3']})
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S6','Em giả mới','12','x');UPDATE hoc_sinh SET trang_thai='khoa' WHERE sbd='S3'")
    const r=await phase(d);assert.equal(r.stats.soEm,1);assert.equal(r.chuaNhan.n,0)
    const x=fixture();x.sql.exec("UPDATE hoc_sinh SET ten_lop='12 - Tinh Hoa' WHERE sbd='S4';UPDATE hoc_sinh SET trang_thai='khoa' WHERE sbd='S5'")
    const a=await phase(x);assert.equal(a.stats.soEm,3);assert.equal(a.stats.soEmDaTungNhan,5);assert.equal(a.chuaNhan.n,0)
    assert.equal(x.sql.prepare("SELECT COUNT(*) n FROM goi_bai_7_ngay WHERE sbd IN('S4','S5')").get().n,0)
  })
  await check('missing membership hợp lệ vẫn bị cổng phát hành bắt',async()=>{
    const d=fixture({chon:['S1','S3'],nhan:['S3']})
    await assert.rejects(phase(d),/Còn học sinh của lớp đã chọn bài chưa nhận gói/)
  })
  await check('tick đã bỏ không seed quota hoặc tính nguồn chưa duyệt trong báo cáo active',async()=>{
    const d=fixture();d.sql.exec("UPDATE bai_da_day SET bo_tick_luc='x';UPDATE goi_bai_7_cau SET meta_json='{\"hopLe\":false}'")
    const r=await phase(d);assert.equal(r.stats.soGoi,0);assert.equal(r.stats.soEm,0);assert.equal(r.stats.soCau,0);assert.equal(r.stats.soEmDaTungNhan,5)
    assert.equal(r.chuaDuyet.n,0);assert.equal(r.chuaNhan.n,0);assert.equal(d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_ngay').get().n,0)
  })
  await check('QID dùng chung khác lớp không kéo raw membership ngoài lớp vào quota',async()=>{
    const d=fixture();d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S6','Em giả khối 11','11','x')")
    goi(d,'b','11',['S6','S1'],['q1'])
    const r=await phase(d);assert.equal(r.stats.soEm,6);assert.equal(r.stats.soCau,4);assert.equal(r.chuaNhan.n,0)
    assert.equal(d.sql.prepare("SELECT COUNT(*) n FROM goi_bai_7_ngay WHERE goi_id='g7:b' AND sbd='S1'").get().n,0)
    assert.equal(d.sql.prepare("SELECT COUNT(*) n FROM goi_bai_7_ngay WHERE goi_id='g7:b' AND sbd='S6'").get().n,1)
  })
  await check('retry idempotent giữ quota đã chốt, không sửa dữ liệu học cũ',async()=>{
    const d=fixture();await phase(d)
    const a=snapshot(d,'goi_bai_7_ngay'),em=snapshot(d,'goi_bai_7_em')
    await phase(d);assert.equal(snapshot(d,'goi_bai_7_ngay'),a);assert.equal(snapshot(d,'goi_bai_7_em'),em)
  })
  await check('ca mở chặn cả hai INSERT quota; đóng ca rồi retry mới seed',async()=>{
    const d=fixture();d.sql.exec("INSERT INTO ca(ma_ca,trang_thai,cap_nhat_luc) VALUES('ca-gia','mo','x')")
    await assert.rejects(phase(d),/Còn học sinh chưa có lịch phủ câu hôm nay/)
    assert.equal(d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_ngay').get().n,0)
    d.sql.exec("UPDATE ca SET trang_thai='dong'");assert.equal((await phase(d)).stats.emChuaCoQuota,0)
    const a=snapshot(d,'goi_bai_7_ngay');d.sql.exec("UPDATE ca SET trang_thai='mo'");await phase(d)
    assert.equal(snapshot(d,'goi_bai_7_ngay'),a)
  })
  console.log(JSON.stringify({ok:true,soCa:out.length,ca:out,phamVi:'SQL nguyên văn quota/thống kê/cổng của ap-goi7-song trên SQLite bộ nhớ; không chạy preflight/Cloudflare/D1 production'}))
} finally {rmSync(scratch,{recursive:true,force:true})}
