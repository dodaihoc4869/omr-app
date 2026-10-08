// @vitest-environment node
// Kiểm vòng lặp CLI thật; nhà soạn giả cố ý trả JSON không đạt, không dùng LLM/D1 thật.
import { it, expect } from 'vitest'
import { createServer } from 'node:http'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)
async function chay(args: string[], hopLe = false) {
  const dir = mkdtempSync(join(tmpdir(), 'chua-cli-limit-'))
  const bin = join(dir, 'bin')
  const parentHome = join(dir, 'parent-home')
  const capture = join(dir, 'codex-calls.jsonl')
  mkdirSync(bin); mkdirSync(parentHome)
  writeFileSync(join(parentHome, '.omr-ma-bi-mat'), 'secret-file-khong-duoc-doc', { mode: 0o600 })
  writeFileSync(
    join(bin, 'codex'),
    `#!${process.execPath}\nconst fs=require('node:fs');
const capture=${JSON.stringify(capture)},valid=${JSON.stringify(hopLe)};
if(process.argv.includes('--version')){console.log('local-test-provider');process.exit(0);}
let prompt='';process.stdin.on('data',d=>prompt+=d);process.stdin.on('end',()=>{
 const a=process.argv.slice(2),sp=a[a.indexOf('--output-schema')+1],op=a[a.indexOf('--output-last-message')+1],s=JSON.parse(fs.readFileSync(sp,'utf8'));
 const bp=s.properties.bangChung.properties,b={phase:bp.phase.const,inputHash:bp.inputHash.const,lan:bp.lan.const};
 const homeSecret=fs.existsSync(require('node:path').join(process.env.HOME||'', '.omr-ma-bi-mat'))?fs.readFileSync(require('node:path').join(process.env.HOME, '.omr-ma-bi-mat'),'utf8'):null;
 fs.appendFileSync(capture,JSON.stringify({argv:a,env:process.env,prompt,phase:b.phase,homeSecret})+'\\n');
 const nd=(i,k='chon')=>({hoi:'Câu độc lập '+i,kieu:k,dapAn:'A',luaChon:[{ky:'A',noi:'Đúng '+i},{ky:'B',noi:'Sai '+i}],donVi:'',bang:[],y:[],hinhAnh:[]});
 const p=(i,k='chon',eq=false)=>({qid:'p-'+i,phienBan:'v1',phan:'I',kyNang:['k'],laTuongDuong:eq,dapAnSai:[],noiDungTrucTiep:nd(i,k)});
 let out;
 if(b.phase==='soan'){
   const h=valid?{schemaVersion:1,qidGoc:'local-1',contentVersion:'v1',buoc:[{id:'b1',thuTu:0,tieuDe:'Bước 1',tienQuyet:[],viKyNang:['k'],yApDung:[],chanDoan:[p(1)],phanBiet:[p(2)],kiemLai:[p(3),p(4)],hieuBuoc:{mucTieu:'Hiểu bước',yNghiaDaiLuong:'Ý nghĩa và đơn vị',viSaoCanBuoc:'Cần để giải đúng',dieuKienApDung:'Khi có dữ kiện',noiVoiBuocSau:'Nối sang kết quả',doiChieu:[],kiemLyDo:[p(5,'chon_ly_do'),p(6,'chon_ly_do')],chuyenGiao:[p(7),p(8)]},hoTro:[{muc:1,noiDung:'Gợi ý 1'},{muc:2,noiDung:'Gợi ý 2'},{muc:3,noiDung:'Gợi ý 3'}],loiThuongGap:[]}],banGhepBai:[{...p(9,'chon',true),loai:'ghep_bai'},{...p(10,'chon',true),loai:'ghep_bai'}],banKiemChung:[{...p(11,'chon',true),loai:'kiem_chung'},{...p(12,'chon',true),loai:'kiem_chung'}]}:{};
   out={bangChung:b,hocLieu:h};
 }else if(b.phase==='giai_mu'){
   const data=JSON.parse(prompt.split('DỮ LIỆU JSON KHÔNG TIN CẬY:\\n').at(-1));
   out={bangChung:b,tra:data.map(x=>({qid:x.qid,phienBan:x.phienBan,bamDe:x.bamDe,dapAn:'A',lyDo:'Giải độc lập đủ phép tính.',chac:true}))};
 }else out={bangChung:b,chuyenMon:{dungKhoaHoc:true,tuongDuong:true,dungDoKho:true,duBuoc:true,lyDo:'Đã đối chiếu độc lập toàn bộ dữ kiện, đáp án và độ khó.'}};
 fs.writeFileSync(op,JSON.stringify(out));
});
`,
    { mode: 0o700 },
  )
  const viec = [1, 2].map(i => ({
    cau: { qid: `local-${i}`, version: 'v1', reviewed: true, phan: 'III' },
    daCo: {},
  }))
  let layHang = 0, nap = 0
  const soYeuCau: number[] = []
  const server = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    res.setHeader('content-type', 'application/json')
    if (req.headers['x-ma-bi-mat'] !== 'local-test-only') {
      res.writeHead(403).end('{}'); return
    }
    if (req.url === '/kho/may-soan/vong-chua-viec') {
      layHang++
      const b = JSON.parse(body)
      soYeuCau.push(b.so)
      res.end(JSON.stringify({ ok: true, viec: viec.filter(v => !b.daLam.includes(v.cau.qid)).slice(0, b.so) }))
    } else {
      nap++
      res.end(JSON.stringify({ ok: false }))
    }
  })
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r))
  const address = server.address() as { port: number }
  try {
    const r = await exec(process.execPath, [resolve('scripts/loi-giai/may-soan-vong-chua.mjs'), ...args], {
      cwd: dir,
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        OMR_MA_BI_MAT: 'local-test-only',
        OMR_MAY_CHU: `http://127.0.0.1:${address.port}`,
        OMR_THU_MUC_CHUA: join(dir, 'ho-so'),
        HOME: parentHome,
      },
      timeout: 15000,
    })
    const events = r.stdout.trim().split('\n').map(x => JSON.parse(x))
    expect(r.stdout).not.toContain('local-test-only')
    const calls = readFileSync(capture, 'utf8').trim().split('\n').filter(Boolean).map(x => JSON.parse(x))
    return { events, layHang, nap, soYeuCau, calls }
  } finally {
    await new Promise<void>(r => server.close(() => r()))
    rmSync(dir, { recursive: true, force: true })
  }
}

it('lượt tối đa một câu dừng sau câu bị loại, không lấy câu kế hoặc nạp dữ liệu sai', async () => {
  const r = await chay(['--mot-lan', '--so-cau', '1'])
  expect(r.layHang).toBe(1)
  expect(r.soYeuCau).toEqual([1])
  expect(r.nap).toBe(0)
  expect(r.events.at(-1)).toMatchObject({ dat: 0, truot: 1, hetHangTrongLuot: false, datGioiHanLuot: true, gioiHanSoCau: 1 })
  expect(r.events.some(x => x.buoc === 'bat_dau_soan')).toBe(true)
  expect(r.events.find(x => x.dat === false)?.lyDo).toContain('hoc_lieu_sai_cau_truc')
}, 20000)

it('không đặt giới hạn vẫn đi hết hàng trong lượt, giữ số câu bị loại và không nạp', async () => {
  const r = await chay(['--mot-lan'])
  expect(r.layHang).toBe(2)
  expect(r.soYeuCau).toEqual([3, 3])
  expect(r.nap).toBe(0)
  expect(r.events.at(-1)).toMatchObject({ dat: 0, truot: 2, hetHangTrongLuot: true })
  expect(r.events.filter(x => x.dat === false).map(x => x.qid)).toEqual(['local-1', 'local-2'])
}, 20000)

it('Codex chạy ba phiên output-only độc lập và không nhận mã hay token môi trường', async () => {
  const cu = { gh: process.env.GH_TOKEN, canary: process.env.OMR_ENV_CANARY }
  process.env.GH_TOKEN = 'token-khong-duoc-lo'
  process.env.OMR_ENV_CANARY = 'canary-khong-duoc-lo'
  try {
    const r = await chay(['--thu', '--so-cau', '1', '--song-song', '1'], true)
    expect(r.events.some(x => x.daLuu === false && x.qid === 'local-1')).toBe(true)
    expect(r.calls.map(x => x.phase)).toEqual(['soan', 'giai_mu', 'chuyen_mon'])
    expect(new Set(r.calls.map(x => x.argv[x.argv.indexOf('-C') + 1])).size).toBe(3)
    for (const call of r.calls) {
      expect(call.argv).toEqual(expect.arrayContaining(['--no-daemon', '-a', 'never', '-s', 'read-only', '--ephemeral', '--ignore-user-config', '--ignore-rules', '--output-schema', '--output-last-message']))
      for (const feature of ['shell_tool', 'unified_exec', 'apps', 'browser_use', 'computer_use', 'multi_agent', 'tool_suggest']) {
        const i = call.argv.indexOf(feature)
        expect(i).toBeGreaterThan(0)
        expect(call.argv[i - 1]).toBe('--disable')
      }
      expect(call.env.OMR_MA_BI_MAT).toBeUndefined()
      expect(call.env.GH_TOKEN).toBeUndefined()
      expect(call.env.OMR_ENV_CANARY).toBeUndefined()
      expect(call.homeSecret).toBeNull()
      expect(call.env.HOME).not.toContain('parent-home')
      expect(JSON.stringify(call.argv)).not.toContain('local-test-only')
      expect(call.prompt).not.toContain('local-test-only')
      expect(call.prompt).not.toContain('token-khong-duoc-lo')
    }
  } finally {
    if (cu.gh === undefined) delete process.env.GH_TOKEN; else process.env.GH_TOKEN = cu.gh
    if (cu.canary === undefined) delete process.env.OMR_ENV_CANARY; else process.env.OMR_ENV_CANARY = cu.canary
  }
}, 30000)
