import type { Env } from './kieu'
import { damBaoGoi7, sqlTenLopHs } from './goi-bai-7'
import { sqlEmDangNhan7 } from './goi-bai-7-quyen'
import { ngayVn7 } from './goi-bai-7-loi'
import { emCoGhi } from './dem-ke-hoach'

type Row = Record<string, unknown>
type MaLoi = 'xung_dot' | 'ca_mo' | 'tam_dung' | 'khong_hop_le'
const chu = (x: unknown) => String(x ?? '')
class LoiDanhSach extends Error { constructor(readonly code: MaLoi, message: string) { super(message) } }
const loi = (code: MaLoi, message: string): never => { throw new LoiDanhSach(code, message) }

// Cả đọc và CAS dùng cùng biểu thức: đổi lớp/khóa em/auto-enroll giữa đọc và ghi cũng là xung đột.
const SQL_EM_LOP = `(SELECT json_group_array(json_object('sbd',sbd,'hoTen',ho_ten,'khoi',lop,'tenLop',ten_lop,'duocThem',duoc_them)) FROM
  (SELECT h.sbd,h.ho_ten,h.lop,${sqlTenLopHs('h')} ten_lop,COALESCE(h.trang_thai,'')<>'khoa' duoc_them FROM hoc_sinh h WHERE ${sqlTenLopHs('h')}=g.lop ORDER BY h.sbd))`
const SQL_NHAN = `(SELECT json_group_array(sbd) FROM (SELECT e.sbd FROM goi_bai_7_em e JOIN hoc_sinh h ON h.sbd=e.sbd
  WHERE e.goi_id=g.id AND ${sqlTenLopHs('h')}=g.lop AND ${sqlEmDangNhan7('e','g','h')} ORDER BY e.sbd))`
const SQL_REVISION = `COALESCE((SELECT revision FROM goi_bai_7_revision v WHERE v.goi_id=g.id),0)`
const SQL_CO_BAT = `EXISTS(SELECT 1 FROM cau_hinh c WHERE c.khoa='goi_bai_7_v1' AND CASE WHEN json_valid(c.gia_tri) THEN json_extract(c.gia_tri,'$.bat') ELSE 0 END=1)`
const SQL_DOC = `SELECT g.id,g.tick_id,g.lop,g.ten,b.lop tick_lop,b.bo_tick_luc,${SQL_REVISION} revision,
  ${SQL_EM_LOP} em_json,${SQL_NHAN} nhan_json,${SQL_CO_BAT} co_bat,EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo') ca_mo,
  (SELECT json_group_array(json_object('sbd',sbd,'hoTen',ho_ten,'tenLop',ten_lop)) FROM (SELECT e.sbd,h.ho_ten,${sqlTenLopHs('h')} ten_lop
    FROM goi_bai_7_em e JOIN hoc_sinh h ON h.sbd=e.sbd WHERE e.goi_id=g.id AND ${sqlTenLopHs('h')}<>g.lop ORDER BY e.sbd)) chuyen_json
  FROM goi_bai_7 g LEFT JOIN bai_da_day b ON b.id=g.tick_id WHERE g.id=?`
const doc = (x: unknown) => JSON.parse(chu(x) || '[]') as unknown[]
const nhan = (r: Row) => (doc(r.nhan_json) as string[]).sort()
async function phienBan(r: Row): Promise<string> {
  const data = JSON.stringify([r.id,r.tick_id,r.lop,r.tick_lop,r.bo_tick_luc,Number(r.revision),doc(r.em_json),nhan(r)])
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2,'0')).join('')
}
function kiemGoi(r: Row | null, ghi: boolean): asserts r is Row {
  if (!r || r.bo_tick_luc !== null || r.tick_lop !== r.lop) return loi('xung_dot','Bài đã bỏ tick hoặc đổi lớp. Thầy đọc danh sách mới.')
  if (!r.co_bat) loi('tam_dung','Giao bài đang tạm dừng. Thầy cập nhật rồi sửa danh sách sau.')
  if (ghi && r.ca_mo) loi('ca_mo','Đang có ca kiểm tra mở. Thầy sửa danh sách sau khi ca kết thúc.')
}
function tapEm(x: unknown): string[] {
  if (!Array.isArray(x) || x.length>1000 || x.some(s => typeof s!=='string' || !s || s.length>80 || s.trim()!==s) || new Set(x).size!==x.length)
    return loi('khong_hop_le','Danh sách em không hợp lệ hoặc có em trùng. Thầy kiểm lại lựa chọn.')
  return [...x].sort() as string[]
}

/** Sau cổng giáo viên. Một đọc nhỏ; ghi một batch có CAS và biên nhận bất biến, không đọc sổ/câu/OMNI. */
export async function gvDanhSachEm7(env: Env, b: Row, now = Date.now()): Promise<Row> {
  try {
    await damBaoGoi7(env)
    const goiId=chu(b.goiId)
    if (!goiId || goiId.length>200) loi('khong_hop_le','Thầy chọn bài cần sửa danh sách.')
    if (b.action==='doc_em') {
      const r=await env.DB.prepare(SQL_DOC).bind(goiId).first<Row>(); kiemGoi(r,false)
      const em=(doc(r.em_json) as Row[]).map(e=>({sbd:chu(e.sbd),hoTen:chu(e.hoTen),khoi:chu(e.khoi),tenLop:chu(e.tenLop),duocThem:e.duocThem===1}))
      if (em.length>1000) loi('khong_hop_le','Danh sách lớp quá lớn. Thầy kiểm lại lớp trước khi sửa.')
      return {ok:true,serverNow:now,goiId,tickId:r.tick_id,lop:r.lop,ten:r.ten,revision:await phienBan(r),em,nhan:nhan(r),emChuyenLop:doc(r.chuyen_json)}
    }
    const revision=chu(b.revision),requestId=chu(b.requestId),them=tapEm(b.them),bot=tapEm(b.bot)
    if (!/^[a-f0-9]{64}$/.test(revision) || !/^[\w.-]{1,128}$/.test(requestId) || !them.length&&!bot.length || them.some(s=>bot.includes(s)))
      loi('khong_hop_le','Yêu cầu sửa danh sách không hợp lệ. Thầy kiểm lại lựa chọn.')
    const payload=JSON.stringify({goiId,revision,them,bot})
    const [state,receipt]=await env.DB.batch<Row>([
      env.DB.prepare(SQL_DOC).bind(goiId),
      env.DB.prepare('SELECT payload,ack_json FROM goi_bai_7_sua_em WHERE goi_id=? AND request_id=?').bind(goiId,requestId),
    ])
    const cu=receipt.results[0]
    // ACK đã chốt vẫn đọc lại khi cờ/tick/lớp đổi sau giao dịch; gửi lại không phải là một lệnh ghi mới.
    if (cu) {
      if (cu.payload!==payload) loi('khong_hop_le','Mã yêu cầu đã dùng cho lựa chọn khác. Thầy đọc danh sách mới.')
      return JSON.parse(chu(cu.ack_json)) as Row
    }
    const r=state.results[0]??null; kiemGoi(r,true)
    if (revision!==await phienBan(r)) loi('xung_dot','Danh sách vừa thay đổi ở máy khác, hoặc có em chuyển lớp/khóa. Thầy đọc danh sách mới.')
    const em=doc(r.em_json) as Row[],hien=nhan(r),hopLe=new Set(em.filter(e=>e.duocThem===1).map(e=>chu(e.sbd)))
    if (em.length>1000 || [...them,...bot].some(s=>!hopLe.has(s)) || them.some(s=>hien.includes(s)) || bot.some(s=>!hien.includes(s)))
      loi('khong_hop_le','Có em không thuộc lớp, đã khóa hoặc lựa chọn không còn đúng. Thầy đọc danh sách mới.')
    const moi=[...hien.filter(s=>!bot.includes(s)),...them].sort(),nonce=crypto.randomUUID(),luc=new Date(now).toISOString(),ngay=ngayVn7(now)
    const ack={ok:true,goiId,requestId,revision:await phienBan({...r,revision:Number(r.revision)+1,nhan_json:JSON.stringify(moi)}),them,bot,nhan:moi,serverNow:now}
    const thayDoi=JSON.stringify([...them.map(sbd=>({sbd,nhan:1})),...bot.map(sbd=>({sbd,nhan:0}))])
    const daChot=`EXISTS(SELECT 1 FROM goi_bai_7_sua_em z WHERE z.goi_id=? AND z.request_id=? AND z.nonce=?)`
    const co=()=>[goiId,requestId,nonce]
    const rs=await env.DB.batch([
      env.DB.prepare(`INSERT OR IGNORE INTO goi_bai_7_sua_em(goi_id,request_id,payload,nonce,ack_json,luc)
        SELECT g.id,?,?,?,?,? FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL AND b.lop=g.lop
        WHERE g.id=? AND g.lop=? AND ${SQL_CO_BAT} AND NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')
        AND ${SQL_REVISION}=? AND ${SQL_EM_LOP}=? AND ${SQL_NHAN}=?`).bind(requestId,payload,nonce,JSON.stringify(ack),luc,goiId,r.lop,Number(r.revision),r.em_json,r.nhan_json),
      env.DB.prepare(`INSERT INTO goi_bai_7_chon_em(goi_id,sbd,nhan,luc) SELECT ?,json_extract(value,'$.sbd'),json_extract(value,'$.nhan'),?
        FROM json_each(?) WHERE ${daChot} ON CONFLICT(goi_id,sbd) DO UPDATE SET nhan=excluded.nhan,luc=excluded.luc`).bind(goiId,luc,thayDoi,...co()),
      env.DB.prepare(`INSERT OR IGNORE INTO goi_bai_7_em(goi_id,sbd,bat_dau,han) SELECT g.id,j.value,g.bat_dau,g.han
        FROM goi_bai_7 g,json_each(?) j WHERE g.id=? AND ${daChot}`).bind(JSON.stringify(them),goiId,...co()),
      env.DB.prepare(`INSERT INTO goi_bai_7_revision(goi_id,revision) SELECT ?,? WHERE ${daChot}
        ON CONFLICT(goi_id) DO UPDATE SET revision=excluded.revision`).bind(goiId,Number(r.revision)+1,...co()),
      // Chỉ số kế hoạch tính sẵn của các em thực sự đổi; sổ gặp/phiên/điểm/đề đã công bố không nằm trong batch.
      env.DB.prepare(`DELETE FROM goi_bai_7_ngay WHERE goi_id=? AND ngay>=? AND sbd IN(SELECT json_extract(value,'$.sbd') FROM json_each(?)) AND ${daChot}`).bind(goiId,ngay,thayDoi,...co()),
      env.DB.prepare(`DELETE FROM goi_bai_7_muc_ngay WHERE ngay>=? AND sbd IN(SELECT json_extract(value,'$.sbd') FROM json_each(?)) AND ${daChot}`).bind(ngay,thayDoi,...co()),
    ])
    if (!Number(rs[0]?.meta.changes)) {
      const retry=await env.DB.prepare('SELECT payload,ack_json FROM goi_bai_7_sua_em WHERE goi_id=? AND request_id=?').bind(goiId,requestId).first<Row>()
      if (retry?.payload===payload) return JSON.parse(chu(retry.ack_json)) as Row
      if (retry) loi('khong_hop_le','Mã yêu cầu đã dùng cho lựa chọn khác. Thầy đọc danh sách mới.')
      loi('xung_dot','Danh sách vừa thay đổi hoặc có ca kiểm tra mở. Thầy đọc danh sách mới rồi thử lại.')
    }
    for (const sbd of [...them,...bot]) emCoGhi(sbd)
    return ack
  } catch (e) {
    return {ok:false,error:e instanceof Error?e.message:'Chưa đọc/lưu được danh sách. Thầy thử lại.',code:e instanceof LoiDanhSach?e.code:'tam_dung'}
  }
}
