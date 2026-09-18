// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import worker from '../server/src/index'
import type { Env } from '../server/src/kieu'

let db: DatabaseSync
let env: Env
const start = Date.parse('2026-09-18T07:00:00Z')
beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(start)
  // Fake Date as well: start endpoint uses new Date().
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(start)
  db = new DatabaseSync(':memory:')
  db.exec(`CREATE TABLE ca(ma_ca TEXT PRIMARY KEY, ten_ca TEXT, trang_thai TEXT, bat_dau TEXT, het_han_vao TEXT,
    thoi_gian_phut INTEGER, loai TEXT, han_nop TEXT, phong_cho INTEGER, bat_dau_thi_luc TEXT,
    de_rieng INTEGER, bo_theo_em_json TEXT, cap_nhat_luc TEXT);
    INSERT INTO ca VALUES('C1','Ca thử','mo',NULL,NULL,45,'thi',NULL,1,NULL,0,NULL,'');
    CREATE TABLE danh_sach(sbd TEXT PRIMARY KEY);
    CREATE TABLE phong_cho(khoa TEXT PRIMARY KEY,ma_ca TEXT,sbd TEXT,ho_ten TEXT,ghi_luc TEXT);
    CREATE TABLE luot(khoa TEXT PRIMARY KEY,ma_ca TEXT,sbd TEXT,lan_thu INTEGER,id_thiet_bi TEXT,
      vao_luc TEXT,het_gio_luc TEXT,trang_thai TEXT,cap_nhat_luc TEXT);`)
  db.exec(readFileSync('server/migration-1809-dong-bo-gio.sql', 'utf8'))
  for(const col of ['cong_bo','nguong_lan','nguong_giay','bank_r2','so_cau_json','lop','giu_de_doc','an_han_giay','pham_vi','len_bang','pham_vi_hoi_lai','danh_sach_chon_json','mat_khau','chi_nop_3_phut_cuoi','sinh_tai_d1']) db.exec('ALTER TABLE ca ADD COLUMN '+col+' TEXT')
  env = { MA_BI_MAT: 'test-only', DB: { prepare(sql: string) {
    let args: any[] = []
    const stmt = { bind(...v: any[]) { args = v; return stmt },
      async first() { return db.prepare(sql).get(...args) ?? null },
      async all() { return { results: db.prepare(sql).all(...args), success: true } },
      async run() { return { meta: { changes: Number(db.prepare(sql).run(...args).changes) } } } }
    return stmt
  } } } as unknown as Env
})
afterEach(() => { db.close(); vi.useRealTimers(); vi.restoreAllMocks() })
async function call(path: string, body: Record<string, unknown>) {
  const r = await worker.fetch(new Request('https://local.test'+path, { method:'POST', body:JSON.stringify(body) }),env)
  return { status:r.status, ...await r.json() as any }
}
const begin = (dongBoGio?: boolean) => call('/goi',{ action:'batDauThi',maCa:'C1',secret:'test-only',dongBoGio })
const join = (sbd: string) => call('/vao-thi',{ maCa:'C1',sbd,idThietBi:sbd })
it('ca cũ mặc định tắt; chưa bắt đầu vẫn ở phòng chờ, không tạo lượt', async () => {
  expect(db.prepare('SELECT dong_bo_gio FROM ca').get()).toMatchObject({dong_bo_gio:0})
  expect(await join('A')).toMatchObject({ok:true,cach:'cho'})
  expect(db.prepare('SELECT COUNT(*) n FROM luot').get()).toMatchObject({n:0})
})
it('bật: vào lệch 10 phút vẫn cùng hết giờ; tải lại giữ mốc',async()=>{
  expect(await begin(true)).toMatchObject({ok:true,dongBoGio:true})
  const a=await join('A'); vi.setSystemTime(start+600000);const b=await join('B')
  expect(a.hetGioLuc).toBe('2026-09-18T07:45:00.000Z');expect(b.hetGioLuc).toBe(a.hetGioLuc)
  expect((await join('A')).hetGioLuc).toBe(a.hetGioLuc)
})
it.each([undefined,false])('tắt hoặc máy cũ không gửi lựa chọn (%s): mỗi em đủ 45 phút',async flag=>{
  await begin(flag);const a=await join('A');vi.setSystemTime(start+600000);const b=await join('B')
  expect(Date.parse(b.hetGioLuc)-Date.parse(a.hetGioLuc)).toBe(600000)
})
it('bấm lại không đổi giờ hoặc chế độ đã chốt',async()=>{
  const first=await begin(true);vi.setSystemTime(start+600000)
  expect(await begin(false)).toMatchObject({ok:true,daBatTruoc:true,batDauLuc:first.batDauLuc,dongBoGio:true})
})
it('hai máy bấm đồng thời chốt một mốc và một chế độ',async()=>{
  const [a,b]=await Promise.all([begin(true),begin(false)])
  expect(a.ok&&b.ok).toBe(true);expect(a.batDauLuc).toBe(b.batDauLuc);expect(a.dongBoGio).toBe(b.dongBoGio)
  expect([a.daBatTruoc,b.daBatTruoc].sort()).toEqual([false,true])
})
it('hết giờ: chặn lượt mới nhưng cho khôi phục bài cũ để nộp',async()=>{
  await begin(true);await join('A');vi.setSystemTime(start+45*60000)
  expect(await join('B')).toMatchObject({ok:false,lyDo:'het_gio_chung'})
  expect(await join('A')).toMatchObject({ok:true,cach:'khoi_phuc',hetGioLuc:'2026-09-18T07:45:00.000Z'})
})
it('lượt thi lại cũng dùng giờ chung và không mở lượt mới sau khi hết giờ',async()=>{
  await begin(true)
  db.exec("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,trang_thai) VALUES('C1|A|2','C1','A',2,'duoc_duyet_lai')")
  vi.setSystemTime(start+600000)
  expect(await join('A')).toMatchObject({ok:true,cach:'duyet_lai',hetGioLuc:'2026-09-18T07:45:00.000Z'})
  db.exec("UPDATE luot SET trang_thai='duoc_duyet_lai'");vi.setSystemTime(start+45*60000)
  expect(await join('A')).toMatchObject({ok:false,lyDo:'het_gio_chung'})
})
it('chỉ giáo viên được bắt đầu và bật đồng bộ, cả hai đường gọi',async()=>{
  for(const path of ['/goi','/ca/bat-dau']) expect((await call(path,{action:'batDauThi',maCa:'C1',dongBoGio:true})).status).toBe(403)
  expect(db.prepare('SELECT bat_dau_thi_luc FROM ca').get()).toMatchObject({bat_dau_thi_luc:null})
})
it.each(["phong_cho=0","loai='baitap'","trang_thai='dong'","trang_thai='da_xoa'"])('không bật sai loại hoặc ca đã đóng: %s',async update=>{
  db.exec('UPDATE ca SET '+update);expect(await begin(true)).toMatchObject({ok:false})
})

it('tạo ca mới lưu được cấu hình đồng bộ rồi bắt đầu không làm mất lựa chọn',async()=>{
  env.DE={put:async()=>undefined} as any
  const r=await call('/ca/day',{secret:'test-only',ca:{maCa:'NEW',dongBoGio:true},bank:{phanI:[]},keyBank:{phanI:[]}})
  expect(r).toMatchObject({ok:true,maCa:'NEW'})
  expect(db.prepare("SELECT dong_bo_gio,phong_cho FROM ca WHERE ma_ca='NEW'").get()).toMatchObject({dong_bo_gio:1,phong_cho:1})
  expect(await call('/goi',{action:'batDauThi',maCa:'NEW',secret:'test-only'})).toMatchObject({ok:true,dongBoGio:true})
})

it('xác nhận ca chỉ dành cho thầy và không nhận nhầm ca cũ hoặc thiếu đề',async()=>{
  expect((await call('/ca/xac-nhan',{maCa:'C1'})).status).toBe(403)
  env.DE={get:async()=>null} as any
  const request={maCa:'C1',secret:'test-only',batDau:'2026-09-18T07:00:00Z',tenCa:'Ca thử',canDe:true,canKey:true}
  expect(await call('/ca/xac-nhan',request)).toMatchObject({daLuu:false})
  db.exec("UPDATE ca SET bat_dau='2026-09-18T07:00:00Z'")
  expect(await call('/ca/xac-nhan',request)).toMatchObject({daLuu:false})
  env.DE={get:async()=>({body:'{}'})} as any
  expect(await call('/ca/xac-nhan',request)).toMatchObject({daLuu:true})
})
