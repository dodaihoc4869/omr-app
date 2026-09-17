import {nhomBtvn, type NhomBtvn} from '../lib/nhom-btvn'
import NhomCaThuGon from '../components/NhomCaThuGon'
import HocSinhNhanBai from '../components/HocSinhNhanBai'
// PHÂN CÔNG — hai việc sau một ca thi, chung một chỗ.
//
// Thầy chốt 11/09: đổi mục "Phân công lên bảng" thành **Phân công**, trong đó
// có hai phần: **Giao bài tập về nhà** (mới) và **Gọi lên bảng** (giữ nguyên).
//
// MÀN GỌI LÊN BẢNG KHÔNG BỊ ĐỤNG MỘT DÒNG NÀO. Nó được lồng nguyên vào thẻ thứ
// hai — đúng điều cấm trong đặc tả `claude/PHAN-CONG-GIAO-BTVN.md`.
//
// Phần giao bài tập chạy 0% Apps Script: ca và đề đọc từ máy chủ mới, bài giao
// và bài nộp cũng ở đó.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckSquare, ClipboardList, RefreshCw, Search, Square, UserCheck, Users } from 'lucide-react'
import { Nhan, OThongBao, TheNoiDung } from '../components/DesignSystem'
import { danhSachCa, danhSachEm, khoiTuNamSinh, type CaTomTat, type EmTomTat } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { layCauHinhMayChu } from '../lib/may-chu-moi'
import { luotCuaCaMoi } from '../lib/day-ca-may-chu-moi'
import { giaoBtvn, theoDoiBtvn, suaGiaoBtvn, type DongTheoDoiBtvn } from '../lib/btvn-may-chu-moi'
import HopChonDe from '../components/HopChonDe'
import HangNhomDe from '../components/HangNhomDe'
import { tachNhieuTheoPhan } from '../lib/tach-phan-de'
import { loadExamSources } from '../lib/exam-db'
import type { TeacherExamSource } from '../data/examContent'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }

interface DeKho {
  maDe: string
  tenDe: string
  soCau: number
}

function gioVN(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function PhanCongScreen() {
 return <div className="gv-page min-h-screen pb-28 px-3 sm:px-4 pt-3 flex flex-col w-full max-w-full min-w-0" style={{gap:'var(--k3)'}}><header className="gv-page-header"><div><h1>Giao bài tập về nhà</h1><p>Chọn người nhận, chọn đề và theo dõi bài đã nộp.</p></div></header><TheGiaoBtvn/></div>
}

function TheGiaoBtvn() {
  const [cheDo, setCheDo] = useState<'ca' | 'hoc_sinh'>('ca')
  const [dsCa, setDsCa] = useState<CaTomTat[]>([])
  const [dsDe, setDsDe] = useState<DeKho[]>([])
  // TICK NHIỀU CA (thầy chốt 12/09). Một lượt giao ra nhiều lớp, cùng tờ đề,
  // cùng một mốc hạn nộp.
  const [caChon, setCaChon] = useState<Set<string>>(new Set())
  // TICK NHIỀU TỜ (thầy chốt 12/09). Giữ theo thứ tự thầy tick: bài em nhận
  // được ghép theo đúng thứ tự ấy, không xáo.
  const [daChon, setDaChon] = useState<Set<string>>(new Set())
  // TICK TỪNG HỌC SINH (thầy yêu cầu: thêm lựa chọn giao bài tập về nhà cho từng học sinh,
  // hiển thị ô danh sách học sinh và có ô tick để giao bài tập).
  const [sbdChon, setSbdChon] = useState<Set<string>>(new Set())
  const [dsEm, setDsEm] = useState<EmTomTat[]>([])
  const [luotCacCa, setLuotCacCa] = useState<Record<string, { sbd: string; hoTen: string; diem?: number | null; nopLuc?: string }[]>>({})
  const [dangTaiLuot, setDangTaiLuot] = useState(false)
  const [timKiemHs, setTimKiemHs] = useState('')
  const [chonRieng,setChonRieng]=useState(false)
  const [khoiThem,setKhoiThem]=useState('')
  const [khoiGui,setKhoiGui]=useState('10')


  // NGUỒN ĐỀ LẤY Y NHƯ MÀN MỞ CA: kho trên máy thầy, tách theo phần, rồi đưa
  // vào ĐÚNG hộp chọn đề đang chạy ở đó (`HopChonDe`). Thầy chốt 12/09: "phần
  // giao btvn tôi muốn hiển thị đúng như trong mở ca".
  const [nguonKho, setNguonKho] = useState<TeacherExamSource[]>([])
  const [nhomLoc, setNhomLoc] = useState('')
  const [dangNap, setDangNap] = useState(true)
  const [dangGiao, setDangGiao] = useState(false)
  const [bao, setBao] = useState<{ ok: boolean; chu: string } | null>(null)
  const [hanMoi, setHanMoi] = useState('')
  const [suaHan, setSuaHan] = useState<Record<string,string>>({})
  const [dangSua, setDangSua] = useState('')
  const [xacNhan,setXacNhan]=useState<{text:string;run:()=>Promise<void>}|null>(null)
  const [theoDoi, setTheoDoi] = useState<DongTheoDoiBtvn[]>([])

  const nap = useCallback(async () => {
    setDangNap(true)
    setBao(null)
    try {
      const url = (await loadScriptUrl()) ?? ''
      const mat = (await loadTeacherSecret()) ?? ''
      const ch = await layCauHinhMayChu()
      if (!ch.URL) throw new Error('Chưa có địa chỉ máy chủ mới')

      const [ca, em] = await Promise.all([
        url && mat ? danhSachCa(url, mat) : Promise.resolve([]),
        url && mat ? danhSachEm(url, mat).catch(() => []) : Promise.resolve([]),
      ])
      setDsCa(ca)
      setDsEm(em)

      // KHO ĐỀ đọc từ máy chủ mới. Kho rỗng nghĩa là thầy chưa bấm "Chuyển KHO
      // ĐỀ" trong Cài đặt — nói thẳng câu ấy, đừng để thầy nhìn ô chọn trống mà
      // đoán.
      const res = await fetch(`${ch.URL}/kho/danh-sach`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-ma-bi-mat': mat },
        body: JSON.stringify({}),
      })
      const j = res.ok ? ((await res.json()) as { ok?: boolean; items?: DeKho[] }) : null
      setDsDe(j?.ok && Array.isArray(j.items) ? j.items : [])

      // Kho trên MÁY THẦY — cùng nguồn màn Mở ca đọc.
      setNguonKho(await loadExamSources())

      setTheoDoi(await theoDoiBtvn(ch, mat))
    } catch (e) {
      setBao({ ok: false, chu: e instanceof Error ? e.message : 'Không nạp được' })
    } finally {
      setDangNap(false)
    }
  }, [])

  useEffect(() => {
    void nap()
  }, [nap])

  const taiLuotCa = useCallback(async (cacMaCa: string[]) => {
    try {
      const mat = (await loadTeacherSecret()) ?? ''
      const ch = await layCauHinhMayChu()
      if (!ch.URL || !mat) return
      const canTai = cacMaCa.filter((m) => !luotCacCa[m])
      if (canTai.length === 0) return
      setDangTaiLuot(true)
      const kq: Record<string, { sbd: string; hoTen: string; diem?: number | null; nopLuc?: string }[]> = {}
      for (const m of canTai) {
        const ds = await luotCuaCaMoi(ch, mat, m)
        if (ds) {
          kq[m] = ds.map((x) => ({
            sbd: String(x.sbd ?? ''),
            hoTen: String(x.ho_ten ?? x.hoTen ?? ''),
            diem: x.diem !== undefined && x.diem !== null ? Number(x.diem) : null,
            nopLuc: x.nop_luc ? String(x.nop_luc) : undefined,
          }))
        }
      }
      setLuotCacCa((prev) => ({ ...prev, ...kq }))

    } catch {
      // bỏ qua lỗi đọc lượt
    } finally {
      setDangTaiLuot(false)
    }
  }, [luotCacCa])

  const batCa = (maCa: string) => {
    const m = new Set(caChon)
    if (m.has(maCa)) {
      m.delete(maCa)
    } else {
      m.add(maCa)
      void taiLuotCa([maCa])
    }
    setCaChon(m)
  }

  const chonTatCaCa = () => {
    if (caChon.size === dsCa.length) {
      setCaChon(new Set())
    } else {
      const tatCa = new Set(dsCa.map((c) => c.maCa))
      setCaChon(tatCa)
      void taiLuotCa(dsCa.map((c) => c.maCa))
    }
  }

  const chuyenSangHocSinh = () => {
    setCheDo('hoc_sinh')
    if (caChon.size > 0) {
      void taiLuotCa(Array.from(caChon))
    }
  }

  // Danh sách học sinh của các ca đã tick:
  const dsHsTrongCa = useMemo(() => {
    const map = new Map<string, { sbd: string; hoTen: string; lop?: string; diem?: number | null; maCa?: string }>()
    for (const ma of caChon) {
      const ca = dsCa.find((c) => c.maCa === ma)
      const luot = luotCacCa[ma] ?? []
      for (const l of luot) {
        if (!map.has(l.sbd)) {
          map.set(l.sbd, { sbd: l.sbd, hoTen: l.hoTen, lop: ca?.lop || '', diem: l.diem, maCa: ma })
        }
      }
      if (luot.length === 0) {
        for (const e of dsEm) {
          if (e.caGanNhat === ma && !map.has(e.sbd)) {
            map.set(e.sbd, { sbd: e.sbd, hoTen: e.hoTen, lop: e.lop || ca?.lop || '', diem: e.diemGanNhat, maCa: ma })
          }
        }
      }
    }
    return Array.from(map.values())
  }, [caChon, luotCacCa, dsCa, dsEm])

  const dsTheoLop=useMemo(()=>dsEm.filter(e=>khoiTuNamSinh(e.namSinh)===Number(khoiGui)),[dsEm,khoiGui])
  const dsHsHienThi=useMemo(()=>{
    const norm=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase()
    const q=norm(timKiemHs.trim())
    return dsEm.filter(e=>(!khoiThem || khoiTuNamSinh(e.namSinh)===Number(khoiThem)) && norm(`${e.hoTen} ${e.sbd}`).includes(q))
  },[dsEm,khoiThem,timKiemHs])
  const sbdThem=Array.from(sbdChon).filter(sbd=>!dsHsTrongCa.some(e=>e.sbd===sbd))

  const toggleSbd = (sbd: string) => {
    setSbdChon((prev) => {
      const m = new Set(prev)
      if (m.has(sbd)) m.delete(sbd)
      else m.add(sbd)
      return m
    })
  }

  const chonTatCaHsHienThi = () => {
    setSbdChon((prev) => {
      const m = new Set(prev)
      for (const e of dsHsHienThi) m.add(e.sbd)
      return m
    })
  }

  const boChonHsHienThi = () => {
    setSbdChon((prev) => {
      const m = new Set(prev)
      for (const e of dsHsHienThi) m.delete(e.sbd)
      return m
    })
  }

  // CHỈ HIỆN NHỮNG TỜ MÁY CHỦ ĐÃ CÓ. Kho trên máy thầy nhiều hơn kho đã chuyển
  // sang máy chủ; cho tick một tờ máy chủ chưa có thì bấm Giao mới báo lỗi —
  // muộn, và thầy không biết vì sao.
  const maTrenMayChu = useMemo(() => new Set(dsDe.map((d) => d.maDe)), [dsDe])
  const nguonGiaoDuoc = useMemo(() => nguonKho.filter((s) => maTrenMayChu.has(s.maDe)), [nguonKho, maTrenMayChu])
  const soChuaChuyen = nguonKho.length - nguonGiaoDuoc.length
  const dsDeTach = useMemo(() => tachNhieuTheoPhan(nguonGiaoDuoc), [nguonGiaoDuoc])
  const dsNhom = useMemo(
    () => Array.from(new Set(nguonGiaoDuoc.map((c) => (c.nhom || '').trim()).filter(Boolean))).sort(),
    [nguonGiaoDuoc],
  )
  // Số câu của đúng những mã đã tick — mã đã tách thì chỉ đếm phần của nó.
  const tongCauDaChon = useMemo(
    () => dsDeTach.filter((d) => daChon.has(d.maDe)).reduce((t, d) => t + d.phanI.length + d.phanII.length + d.phanIII.length, 0),
    [dsDeTach, daChon],
  )

  async function capNhatHocSinh(t:DongTheoDoiBtvn,sbd:string,hanhDong:'reset'|'thu-hoi') {
    setDangSua(t.maBtvn)
    try{const ch=await layCauHinhMayChu(),mat=(await loadTeacherSecret())||'';await suaGiaoBtvn(ch,mat,(t as NhomBtvn).maTheoSbd?.[sbd]||t.maBtvn,{sbd,hanhDong});setTheoDoi(await theoDoiBtvn(ch,mat));setBao({ok:true,chu:hanhDong==='reset'?'Đã mở lại bài cho học sinh.':'Đã thu hồi bài của học sinh.'})}
    catch(e){setBao({ok:false,chu:e instanceof Error?e.message:'Chưa cập nhật được.'})}finally{setDangSua('')}
  }

  async function capNhatBai(t:DongTheoDoiBtvn,thuHoi=false) {
    setDangSua(t.maBtvn)
    try {
      const ch=await layCauHinhMayChu(), mat=(await loadTeacherSecret())||''
      if(!thuHoi && !suaHan[t.maBtvn])throw new Error('Thầy chọn ngày giờ hạn nộp trước.')
      for (const original of (t as NhomBtvn).baiGoc||[t]) await suaGiaoBtvn(ch,mat,original.maBtvn,thuHoi?{thuHoi:true}:{hanNop:new Date(suaHan[t.maBtvn]).toISOString()})
      setTheoDoi(await theoDoiBtvn(ch,mat))
      setBao({ok:true,chu:thuHoi?'Đã thu hồi bài. Kết quả đã nộp được giữ nguyên.':'Đã cập nhật hạn nộp cho học sinh.'})
    } catch(e){setBao({ok:false,chu:e instanceof Error?e.message:'Chưa cập nhật được.'})}
    finally{setDangSua('')}
  }

  async function giao() {
    setDangGiao(true)
    setBao(null)
    try {
      const mat = (await loadTeacherSecret()) ?? ''
      const ch = await layCauHinhMayChu()
      const dsSbdGui = cheDo === 'hoc_sinh' ? dsTheoLop.map(e=>e.sbd) : undefined
      if(dsSbdGui&&dsSbdGui.length===0)throw new Error('Chưa có học sinh được chọn.')
      const dsCaGui = cheDo === 'hoc_sinh' ? [] : [...caChon]
      const kq = await giaoBtvn(ch, mat, dsCaGui, [...daChon], dsSbdGui, hanMoi ? new Date(hanMoi).toISOString() : undefined, cheDo === 'ca' && chonRieng ? [...sbdChon] : undefined)
      const boQua = kq.caRong && kq.caRong.length > 0 ? ` Bỏ qua ${kq.caRong.length} ca chưa em nào vào thi: ${kq.caRong.join(', ')}.` : ''
      const noiDungCa = kq.soCa ? ` ở ${kq.soCa} ca` : ''
      setBao({
        ok: true,
        chu: `Đã giao ${kq.soCau} câu (${daChon.size} tờ đề) cho ${kq.soEm} em${noiDungCa}. Hạn nộp ${gioVN(kq.hanNop)}.${boQua}`,
      })
      // Kho trên MÁY THẦY — cùng nguồn màn Mở ca đọc.
      setNguonKho(await loadExamSources())

      setTheoDoi(await theoDoiBtvn(ch, mat))
    } catch (e) {
      setBao({ ok: false, chu: e instanceof Error ? e.message : 'Không giao được' })
    } finally {
      setDangGiao(false)
    }
  }

  return (
    <div className="w-full max-w-full min-w-0 flex flex-col" style={{ gap: 'var(--k3)' }}>
      {xacNhan&&<div style={{position:'fixed',inset:0,zIndex:10000,background:'var(--phu)',display:'grid',placeItems:'center',padding:20}}>
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-homework" style={{width:'100%',maxWidth:440,padding:24,borderRadius:22,background:'var(--the)',color:'var(--muc)',boxShadow:'var(--bong-2)'}}>
          <h2 id="confirm-homework" style={{fontSize:20,fontWeight:700}}>Xác nhận thay đổi bài tập</h2>
          <p style={{margin:'16px 0',lineHeight:1.7}}>{xacNhan.text}</p>
          <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
            <button autoFocus className="btn-google-outlined" onClick={()=>setXacNhan(null)}>Hủy</button>
            <button style={{padding:'10px 18px',borderRadius:12,background:'var(--gg-xanh)',color:'var(--muc-nguoc)',fontWeight:700}} onClick={()=>{const action=xacNhan.run;setXacNhan(null);void action()}}>Xác nhận</button>
          </div>
        </div>
      </div>}
      <TheNoiDung className="w-full max-w-full overflow-hidden">
        <div className="w-full max-w-full min-w-0 flex flex-col" style={{ gap: 'var(--k3)' }}>
          <div className="gv-homework-grid"><section className="gv-work-step"><h2>1. Người nhận</h2>
          {/* LỰA CHỌN HÌNH THỨC GIAO BÀI */}
          <div className="flex items-center flex-wrap" style={{ gap: 'var(--k2)', marginBottom: 'var(--k1)' }}>
            <span style={{ ...NHAN_NHO, fontWeight: 600, color: 'var(--muc)' }}>Hình thức giao:</span>
            <button
              type="button"
              onClick={() => setCheDo('ca')}
              className="tap-target font-semibold inline-flex items-center gap-1.5"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--bo-tron)',
                fontSize: 'var(--cx-1)',
                background: cheDo === 'ca' ? 'var(--xanh)' : 'var(--the-2)',
                color: cheDo === 'ca' ? 'var(--muc-nguoc)' : 'var(--muc)',
                border: '1px solid ' + (cheDo === 'ca' ? 'var(--xanh)' : 'var(--vien)'),
                cursor: 'pointer',
              }}
            >
              <Users size={16} /> Theo ca thi
            </button>
            <button
              type="button"
              onClick={chuyenSangHocSinh}
              className="tap-target font-semibold inline-flex items-center gap-1.5"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--bo-tron)',
                fontSize: 'var(--cx-1)',
                background: cheDo === 'hoc_sinh' ? 'var(--xanh)' : 'var(--the-2)',
                color: cheDo === 'hoc_sinh' ? 'var(--muc-nguoc)' : 'var(--muc)',
                border: '1px solid ' + (cheDo === 'hoc_sinh' ? 'var(--xanh)' : 'var(--vien)'),
                cursor: 'pointer',
              }}
            >
              <UserCheck size={16} /> Gửi từng lớp
            </button>
          </div>

          {cheDo === 'ca' && (
            <div>
              <div className="flex items-center" style={{ justifyContent: 'space-between', gap: 'var(--k2)', marginBottom: 'var(--k2)' }}>
                <span style={NHAN_NHO}>
                  Ca đã thi — tick nhiều ca, bài giao cho đúng những em có lượt trong các ca ấy
                </span>
                {dsCa.length > 1 && (
                  <button
                    type="button"
                    className="tap-target"
                    onClick={chonTatCaCa}
                    style={{ ...NHAN_NHO, textDecoration: 'underline', whiteSpace: 'nowrap' }}
                  >
                    {caChon.size === dsCa.length ? 'Bỏ hết' : 'Chọn hết'}
                  </button>
                )}
              </div>

              {dsCa.length === 0 ? (
                <div style={NHAN_NHO}>{dangNap ? 'Đang lấy danh sách ca…' : 'Chưa có ca nào đã thi.'}</div>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--k2)', maxHeight: 240, overflowY: 'auto' }}>
                  <NhomCaThuGon ds={dsCa} selected={c=>caChon.has(c.maCa)} render={(c) => {
                    const chon = caChon.has(c.maCa)
                    return (
                      <button
                        key={c.maCa}
                        type="button"
                        onClick={() => batCa(c.maCa)}
                        className="tap-target"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--k3)',
                          textAlign: 'left',
                          minHeight: 56,
                          padding: 'var(--k2) var(--k3)',
                          borderRadius: 'var(--bo-1)',
                          background: chon ? 'var(--xanh-nen)' : 'var(--the-2)',
                          border: `1.5px solid ${chon ? 'var(--xanh)' : 'transparent'}`,
                          transitionProperty: 'background-color, border-color',
                          transitionDuration: 'var(--nhanh)',
                        }}
                        aria-pressed={chon}
                      >
                        <span style={{ color: chon ? 'var(--xanh)' : 'var(--mo)', display: 'flex', flex: '0 0 auto' }}>
                          {chon ? <CheckSquare size={20} /> : <Square size={20} />}
                        </span>
                        <span style={{ display: 'grid', gap: 2, minWidth: 0, flex: 1 }}>
                          <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--muc)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.tenCa || `Ca ${c.maCa}`}
                          </span>
                          <span style={NHAN_NHO}>
                            {c.maCa}
                            {c.lop ? ` · lớp ${c.lop}` : ''} · <b style={{ fontVariantNumeric: 'tabular-nums' }}>{c.daNop}/{c.daVao}</b> nộp
                            {c.moLuc ? ` · ${gioVN(c.moLuc)}` : ''}
                          </span>
                        </span>
                      </button>
                    )
                  }}/>
                </div>
              )}

              {caChon.size > 0 && (
                <div className="flex items-center justify-between flex-wrap" style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>
                  <span>
                    Đã tick <b>{caChon.size}</b> ca · <b>{dsCa.filter((c) => caChon.has(c.maCa)).reduce((t, c) => t + c.daVao, 0)}</b> lượt vào thi
                    {' '}(em thi hai ca chỉ nhận một bài).
                  </span>
                  <button
                    type="button"
                    onClick={()=>setChonRieng(true)}
                    style={{ color: 'var(--xanh)', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0, font: 'inherit', fontWeight: 600 }}
                  >
                    Chọn thêm học sinh →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ô DANH SÁCH HỌC SINH CÓ Ô TICK (KHI CHỌN GIAO CHO TỪNG HỌC SINH) */}
          {cheDo === 'hoc_sinh' && <section style={{padding:18,border:'1px solid var(--vien)',borderRadius:16}}><label>Lớp theo năm sinh <select aria-label="Chọn lớp theo năm sinh" value={khoiGui} onChange={e=>setKhoiGui(e.target.value)} style={{marginLeft:12,padding:10,background:'var(--the)',color:'var(--muc)'}}>{[10,11,12].map(k=><option key={k} value={k}>Lớp {k}</option>)}</select></label><p>{dsTheoLop.length} học sinh nhận bài. Tính theo năm sinh và năm học hiện tại; hồ sơ thiếu năm sinh không tự ghép lớp.</p></section>}
          {cheDo === 'ca' && <label style={{display:'flex',gap:10,alignItems:'center'}}><input type="checkbox" checked={chonRieng} onChange={e=>setChonRieng(e.target.checked)}/>Chọn thêm học sinh</label>}
          {cheDo === 'ca' && chonRieng && (
            <div
              style={{
                background: 'var(--the-2)',
                borderRadius: 'var(--bo-2)',
                padding: 'var(--k3)',
                border: '1px solid var(--vien)',
                display: 'grid',
                gap: 'var(--k2)',
              }}
            >
              <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k2)' }}>
                <div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', fontWeight: 700, color: 'var(--muc)' }}>
                    Tất cả học sinh — chọn thêm ngoài các ca đã tick
                  </div>
                  <div style={NHAN_NHO}>
                    Chọn thêm: <b style={{ color: 'var(--xanh)', fontVariantNumeric: 'tabular-nums' }}>{sbdThem.length}</b> học sinh · Các ca đã chọn vẫn nhận đủ bài
                  </div>
                </div>
                <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
                  <button
                    type="button"
                    onClick={chonTatCaHsHienThi}
                    className="tap-target font-semibold"
                    style={{ ...NHAN_NHO, textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: '2px 6px' }}
                  >
                    Chọn tất cả ({dsHsHienThi.length})
                  </button>
                  <button
                    type="button"
                    onClick={boChonHsHienThi}
                    className="tap-target"
                    style={{ ...NHAN_NHO, textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: '2px 6px' }}
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* THANH TÌM KIẾM & BỘ LỌC */}
              <div className="flex flex-wrap gap-2" aria-label="Lọc khối học sinh">{['', '10', '11', '12'].map(k=><button key={k} type="button" aria-pressed={khoiThem===k} onClick={()=>setKhoiThem(k)} style={{padding:'8px 16px',borderRadius:20,background:khoiThem===k?'var(--xanh)':'var(--the)',color:khoiThem===k?'var(--muc-nguoc)':'var(--muc)',border:'1px solid var(--vien)'}}>{k?`Khối ${k}`:'Tất cả'}</button>)}</div>
              <div className="flex items-center flex-wrap" style={{ gap: 'var(--k2)' }}>
                <div className="relative flex-1" style={{ minWidth: 200 }}>
                  <input
                    type="text"
                    value={timKiemHs}
                    onChange={(e) => setTimKiemHs(e.target.value)}
                    placeholder="Tìm tên hoặc số báo danh…"
                    style={{
                      width: '100%',
                      height: 36,
                      padding: '0 12px 0 32px',
                      borderRadius: 'var(--bo-tron)',
                      border: '1px solid var(--vien-dam)',
                      background: 'var(--the)',
                      fontSize: 'var(--cx-1)',
                      color: 'var(--muc)',
                    }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--mo)', pointerEvents: 'none' }} />
                </div>


              </div>

              {/* KHUNG CUỘN DANH SÁCH HỌC SINH */}
              {dangTaiLuot ? (
                <div style={{ ...NHAN_NHO, padding: 'var(--k3) 0', textAlign: 'center' }}>
                  Đang tải danh sách học sinh…
                </div>
              ) : dsHsHienThi.length === 0 ? (
                <div style={{ ...NHAN_NHO, padding: 'var(--k3) 0', textAlign: 'center' }}>
                  Không có học sinh nào phù hợp bộ lọc tìm kiếm.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 6, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                  {dsHsHienThi.map((e) => {
                    const trongCa = dsHsTrongCa.some(h=>h.sbd===e.sbd)
                    const tich = trongCa || sbdChon.has(e.sbd)
                    return (
                      <button
                        key={e.sbd}
                        type="button"
                        role="checkbox" aria-checked={tich} disabled={trongCa}
                        onClick={() => toggleSbd(e.sbd)}
                        className="tap-target"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--k3)',
                          textAlign: 'left',
                          minHeight: 44,
                          padding: '6px 12px',
                          borderRadius: 'var(--bo-1)',
                          background: tich ? 'var(--xanh-nen)' : 'var(--the)',
                          border: `1.5px solid ${tich ? 'var(--xanh)' : 'transparent'}`,
                          transition: 'all 0.15s ease',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ color: tich ? 'var(--xanh)' : 'var(--mo)', flex: '0 0 auto' }}>
                          {tich ? <CheckSquare size={18} /> : <Square size={18} />}
                        </span>
                        <div className="flex-1 flex items-center justify-between flex-wrap gap-1 min-w-0">
                          <span className="flex items-center gap-2 truncate">
                            <span style={{ fontWeight: 600, fontSize: 'var(--cx-1)', color: 'var(--muc)' }}>
                              {e.hoTen || `Học sinh ${e.sbd}`}
                            </span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
                              SBD: <b>{e.sbd}</b>
                            </span>
                          </span>
                          <span className="flex items-center gap-2 flex-shrink-0">
                            {e.lop && <Nhan tone="xam">{e.lop}</Nhan>}
                            {trongCa && <Nhan tone="xanh">Đã có trong ca</Nhan>}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

</section><section className="gv-work-step"><h2>2. Nội dung bài tập</h2>
          <div>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>
              Tờ đề — tick được nhiều tờ, tới từng phần. Em nhận TẤT CẢ câu của những phần
              {' '}đã tick, đúng thứ tự kho.
            </div>

            {/* HÀNG LỌC NHÓM — dùng chung với màn Mở ca, một dòng vuốt ngang. */}
            <div className="w-full max-w-full min-w-0 overflow-x-auto" style={{ marginBottom: 'var(--k2)' }}>
              <HangNhomDe ds={dsNhom} chon={nhomLoc} onChon={setNhomLoc} />
            </div>

            {/* ĐÚNG HỘP CHỌN ĐỀ CỦA MÀN MỞ CA — lồng nguyên, không chép lại. Sửa
                một chỗ thì ba màn (Mở ca · Gọi lên bảng · Giao bài tập) đổi theo. */}
            <div className="w-full max-w-full min-w-0 overflow-hidden">
              <HopChonDe
                ds={dsDeTach}
                daChon={daChon}
                onChon={(ma) => {
                  const m = new Set(daChon)
                  if (m.has(ma)) m.delete(ma)
                  else m.add(ma)
                  setDaChon(m)
                }}
                nhomLoc={nhomLoc}
                chonNhieu
                onChonTatCa={(ma) => setDaChon(new Set(ma))}
              />
            </div>

            {soChuaChuyen > 0 && (
              <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>
                Ẩn <b>{soChuaChuyen}</b> tờ máy chủ chưa có — vào Cài đặt → Máy chủ mới bấm
                {' '}“Chuyển KHO ĐỀ sang máy chủ mới” thì chúng hiện ra đây.
              </div>
            )}
            {daChon.size > 0 && (
              <div className="flex items-center" style={{ gap: 'var(--k2)', marginTop: 'var(--k2)' }}>
                <span style={NHAN_NHO}>
                  Đã tick <b>{daChon.size}</b> mục · <b>{tongCauDaChon}</b> câu
                </span>
                <button type="button" className="tap-target" onClick={() => setDaChon(new Set())} style={{ ...NHAN_NHO, textDecoration: 'underline' }}>
                  Bỏ hết
                </button>
              </div>
            )}
          </div>

</section></div>
          {!dangNap && dsDe.length === 0 && (
            <OThongBao tone="cam">
              Kho đề trên máy chủ mới đang rỗng. Vào Cài đặt → Máy chủ mới, bấm “Chuyển KHO ĐỀ sang máy chủ mới” trước.
            </OThongBao>
          )}

          {/* TÓM TẮT CHỌN GIAO */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--k2)',
              padding: '10px 14px',
              borderRadius: 'var(--bo-1)',
              background: 'var(--the-2)',
              border: '1px solid var(--vien)',
            }}
          >
            <span style={{ fontSize: 'var(--cx-1)', fontWeight: 600, color: 'var(--muc)' }}>
              {cheDo === 'ca' ? `Đã chọn: ${caChon.size} ca` : `Lớp ${khoiGui}: ${dsTheoLop.length} học sinh`}
            </span>
            <span style={{ fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
              {daChon.size > 0 ? `${daChon.size} tờ đề (${tongCauDaChon} câu)` : 'Chưa tick tờ đề nào'}
            </span>
          </div>

          {/* HÀNG NÚT BẤM GIAO BÀI TẬP VỀ NHÀ — TO RÕ, NỔI BẬT & TRỰC QUAN */}
          <div className="gv-actionbar flex items-center gap-3 flex-wrap" style={{ marginTop: 'var(--k1)' }}>
            {cheDo === 'ca' ? (
              <button
                type="button"
                onClick={giao}
                disabled={dangGiao || (caChon.size === 0 && !(chonRieng && sbdChon.size > 0)) || daChon.size === 0}
                className="tap-target font-bold inline-flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                style={{
                  minHeight: 48,
                  padding: '0 24px',
                  borderRadius: 'var(--bo-1)',
                  fontFamily: 'var(--sans)',
                  fontSize: 'var(--cx-2)',
                  cursor: dangGiao || (caChon.size === 0 && !(chonRieng && sbdChon.size > 0)) || daChon.size === 0 ? 'not-allowed' : 'pointer',
                  background: dangGiao || (caChon.size === 0 && !(chonRieng && sbdChon.size > 0)) || daChon.size === 0 ? 'var(--the-2)' : 'var(--muc)',
                  color: dangGiao || (caChon.size === 0 && !(chonRieng && sbdChon.size > 0)) || daChon.size === 0 ? 'var(--mo)' : 'var(--muc-nguoc)',
                  border: '1.5px solid ' + (dangGiao || (caChon.size === 0 && !(chonRieng && sbdChon.size > 0)) || daChon.size === 0 ? 'var(--vien)' : 'var(--muc)'),
                  opacity: dangGiao || (caChon.size === 0 && !(chonRieng && sbdChon.size > 0)) || daChon.size === 0 ? 0.65 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                <ClipboardList size={20} />
                {dangGiao
                  ? 'Đang giao…'
                  : caChon.size === 0
                  ? 'Tick chọn ít nhất 1 ca thi'
                  : daChon.size === 0
                  ? 'Tick chọn ít nhất 1 tờ đề'
                  : `Giao bài tập về nhà (${caChon.size} ca · ${tongCauDaChon} câu)`}
              </button>
            ) : (
              <button
                type="button"
                onClick={giao}
                disabled={dangGiao || dsTheoLop.length === 0 || daChon.size === 0}
                className="tap-target font-bold inline-flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                style={{
                  minHeight: 48,
                  padding: '0 24px',
                  borderRadius: 'var(--bo-1)',
                  fontFamily: 'var(--sans)',
                  fontSize: 'var(--cx-2)',
                  cursor: dangGiao || dsTheoLop.length === 0 || daChon.size === 0 ? 'not-allowed' : 'pointer',
                  background: dangGiao || dsTheoLop.length === 0 || daChon.size === 0 ? 'var(--the-2)' : 'var(--xanh)',
                  color: dangGiao || dsTheoLop.length === 0 || daChon.size === 0 ? 'var(--mo)' : 'var(--muc-nguoc)',
                  border: '1.5px solid ' + (dangGiao || dsTheoLop.length === 0 || daChon.size === 0 ? 'var(--vien)' : 'var(--xanh)'),
                  opacity: dangGiao || dsTheoLop.length === 0 || daChon.size === 0 ? 0.65 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                <ClipboardList size={20} />
                {dangGiao
                  ? 'Đang giao…'
                  : dsTheoLop.length === 0
                  ? 'Tick chọn ít nhất 1 học sinh'
                  : daChon.size === 0
                  ? 'Tick chọn ít nhất 1 tờ đề'
                  : `Giao bài tập về nhà cho ${dsTheoLop.length} học sinh (${tongCauDaChon} câu)`}
              </button>
            )}

            <button
              type="button"
              onClick={() => void nap()}
              disabled={dangNap}
              className="tap-target font-semibold inline-flex items-center gap-2"
              style={{
                minHeight: 48,
                padding: '0 18px',
                borderRadius: 'var(--bo-1)',
                fontFamily: 'var(--sans)',
                fontSize: 'var(--cx-1)',
                background: 'transparent',
                color: 'var(--muc)',
                border: '1.5px solid var(--vien-dam)',
                cursor: dangNap ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={16} className={dangNap ? 'animate-spin' : ''} /> Làm mới
            </button>
          </div>

          {bao && <OThongBao tone={bao.ok ? 'xanh' : 'do'}>{bao.chu}</OThongBao>}

          <div style={NHAN_NHO}>
            <label className="flex flex-wrap items-center gap-3">Hạn nộp bài
              <input aria-label="Hạn nộp bài mới" type="datetime-local" value={hanMoi} onChange={e=>setHanMoi(e.target.value)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-800" />
            </label>
            {hanMoi ? 'Áp dụng hạn đã chọn cho học sinh được giao.' : 'Để trống: hạn nộp sau 48 giờ kể từ lúc giao.'}
          </div>
        </div>
      </TheNoiDung>

      {theoDoi.length > 0 && (
        <TheNoiDung>
          <div style={{ display: 'grid', gap: 'var(--k3)' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)' }}>Bài đã giao</div>
            {bao&&<div role="status"><OThongBao tone={bao.ok?'xanh':'do'}>{bao.chu}</OThongBao></div>}
            {dangSua&&<p role="status">Đang cập nhật bài tập…</p>}
            <div style={{maxHeight:'75vh',overflowY:'auto',overscrollBehavior:'contain',display:'grid',gap:16,padding:2}}>
            {nhomBtvn(theoDoi).map((t) => (
              <details key={t.maBtvn} style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
                <summary className="flex items-center" style={{ cursor:'pointer',justifyContent: 'space-between', gap: 'var(--k2)' }}>
                  <span style={{ minWidth:0,overflowWrap:'anywhere',fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}>
                    Ca {t.maCa} · đề {t.maDe} · {t.soCau} câu
                  </span>
                  <Nhan tone={t.daNop === t.tong ? 'xanh' : t.quaHan ? 'do' : 'cam'}>
                    {t.daNop}/{t.tong} nộp
                  </Nhan>
                </summary>
                <div style={{ ...NHAN_NHO, marginTop: 4 }}>
                  Giao {gioVN(t.giaoLuc)} · hạn {gioVN(t.hanNop)}
                  {t.quaHan ? ' · đã quá hạn' : ''}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input aria-label={`Hạn nộp ${t.maBtvn}`} type="datetime-local" value={suaHan[t.maBtvn] ?? new Date(Date.parse(t.hanNop)-new Date(t.hanNop).getTimezoneOffset()*60000).toISOString().slice(0,16)} onChange={e=>setSuaHan(v=>({...v,[t.maBtvn]:e.target.value}))} className="rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-800" />
                  <button disabled={dangSua===t.maBtvn} onClick={()=>capNhatBai(t)} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Đặt hạn nộp</button>
                  <button disabled={dangSua===t.maBtvn} onClick={()=>setXacNhan({text:`Thu hồi bài này của ${t.tong} học sinh? Kết quả đã nộp vẫn được giữ lại.`,run:()=>capNhatBai(t,true)})} className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50">Thu hồi bài</button>
                </div>
                <HocSinhNhanBai maTheoSbd={t.maTheoSbd} bai={t} busy={dangSua===t.maBtvn} onAction={(sbd,action)=>setXacNhan({text:`${action==='reset'?'Cho làm lại':'Thu hồi bài của'} học sinh ${sbd}? Kết quả cũ được lưu lại.`,run:()=>capNhatHocSinh(t,sbd,action)})}/>
              </details>
            ))}
            </div>
          </div>
        </TheNoiDung>
      )}
    </div>
  )
}
