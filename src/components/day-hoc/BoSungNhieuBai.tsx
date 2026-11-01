// HỘP «BỔ SUNG BÀI HÔM NAY» — CHỌN NHIỀU BÀI MỘT LÚC (thầy 01/11: «cho tôi chọn được nhiều bài mới học một lúc … Trùng tu giao diện chọn câu đẹp đơn giản. Mọi thứ
// phải chính xác»; bản vẽ thầy chốt: docs/ban-ve-chon-nhieu-bai-0111). Lớp nhận bài + Giao cho giữ nguyên bộ chọn sẵn có (`useBaiHomNay`); phần bài thay bằng
// danh sách có ô tick (`ChonBaiMoi`) + thẻ tóm tắt ba số chính lấy THẲNG từ máy chủ (`xem-truoc` gộp mọi tờ tự giao của các bài đã chọn — đúng số câu sẽ rút,
// đúng hạn tự tính cho cả khối lượng). Giao = `tick` LẦN LƯỢT từng bài (bài số nhỏ trước) cho từng lớp chưa có bài, CÙNG một hạn nộp. Máy chủ: gói mới ⇒ xếp lại phần
// luyện hôm nay của các em + báo máy các em tải gói mới (goi-bai-7.ts `xepLaiHomNayChoGoiMoi`).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { baoBaiDangGiaoThayDoi } from '../../lib/bai-dang-giao-thay-doi'
import { THAM_SO_OMNI } from '../../../server/src/omni-kieu'
import { TEN_AI } from '../../lib/omni-chu'
import { maDeMacDinh, phamViTruoc, phanTuGiao, soBaiCuaTen, tenNganBai, trangThaiBai, viTriTickXaNhat, type BaiCay } from '../../lib/bai-hom-nay'
import { baiDaDayTick, baiDaDayXemTruoc, type DauVaoBai, type XemTruocTick } from '../chien-dich/api-omni'
import { hienHanNop, laNgay, ngayVn } from '../chien-dich/ngay'
import ChonLopGiao from './ChonLopGiao'
import { CanhBaoQuaTai, GiaoChoAi, LuoiSo, NapDsEm, OnBaiCuTheoLop, type BaiHomNay } from './BaiHomNay'
import { ChonBaiMoi, type ChuongMoi, type DongBaiMoi } from './ChonBaiMoi'
import type { TeacherExamSource } from '../../data/examContent'

const CHO_XEM_MS = 350
const LUOT_TOI_DA = 500
const TEN_PHAN: Record<string, string> = { I: 'TN', II: 'ĐS', III: 'TLN' }
const chiaPhanCuaBai = (b: Pick<BaiCay, 'to'>) => phanTuGiao(b).map((x) => `${TEN_PHAN[x.phan] ?? x.ten} ${x.soCau}`).join(' · ')
const soCauTuGiao = (b: Pick<BaiCay, 'to'>) => phanTuGiao(b).reduce((n, x) => n + x.soCau, 0)

interface LopGiao { lop: string; bai: BaiCay[]; xemVao: DauVaoBai; sbd: string[] | null }

/** Trạng thái chọn nhiều bài + xem trước + giao — dùng chung bộ chọn lớp / em của `useBaiHomNay`. `nho` = bài đang chọn nhớ theo buổi (hộp ghi lại). */
export function useGiaoNhieuBai(bhn: BaiHomNay, nho?: { khoi: string; ds: string[] } | null) {
  const showToast = useAppStore((s) => s.showToast)
  const { lopChon, dsBai, tickTheoLop, khoi, coDanhSachEm, emTheoLop } = bhn
  const [chonNho, setChonNho] = useState<{ khoi: string; ds: string[] } | null>(nho ?? null)
  const daNapNho = useRef(!!nho)
  useEffect(() => { if (nho && !daNapNho.current) { daNapNho.current = true; setChonNho(nho) } }, [nho])
  const chonDs = useMemo(() => (chonNho && chonNho.khoi === khoi ? chonNho.ds.filter((k) => dsBai.some((b) => b.khoaBai === k)) : []), [chonNho, khoi, dsBai])
  const baiChon = useMemo(() => dsBai.filter((b) => chonDs.includes(b.khoaBai)).sort((a, b) => a.viTri - b.viTri), [dsBai, chonDs])
  const [xong, setXong] = useState('')
  const doiChon = (k: string) => {
    setXong('')
    setChonNho((c) => { const ds = c && c.khoi === khoi ? c.ds : []; return { khoi, ds: ds.includes(k) ? ds.filter((x) => x !== k) : [...ds, k] } })
  }
  // Bài đã có ở MỌI lớp đang chọn (vừa giao xong / thầy thêm lớp đã có) ⇒ bỏ khỏi danh sách chọn.
  useEffect(() => {
    if (!lopChon.length) return
    setChonNho((c) => { if (!c) return c; const ds = c.ds.filter((k) => !lopChon.every((l) => tickTheoLop.get(l)?.has(k))); return ds.length === c.ds.length ? c : { ...c, ds } })
  }, [lopChon, tickTheoLop])

  const [hanSua, setHanSua] = useState('')
  const [theLucChu, setTheLucChu] = useState('')
  const homNay = ngayVn(Date.now())
  const nTheLuc = Math.floor(Number(theLucChu))
  const theLucSua = theLucChu.trim() && Number.isFinite(nTheLuc) && nTheLuc >= 1 ? Math.min(LUOT_TOI_DA, nTheLuc) : undefined
  const loiTheLuc = theLucChu.trim() && !theLucSua ? 'Số lượt phải là số nguyên từ 1' : ''
  const hanHopLe = !hanSua || (laNgay(hanSua) && hanSua >= homNay)

  // Mỗi lớp: các bài đã chọn mà lớp CHƯA có; xem trước GỘP mọi tờ tự giao của các bài ấy (phạm vi = các bài đứng trước bài đầu tiên).
  const lopGiao = useMemo((): LopGiao[] => {
    if (!baiChon.length || !lopChon.length) return []
    const ra: LopGiao[] = []
    for (const l of lopChon) {
      const bai = baiChon.filter((b) => !tickTheoLop.get(l)?.has(b.khoaBai) && maDeMacDinh(b).length > 0)
      if (!bai.length) continue
      const sbd = coDanhSachEm ? (emTheoLop.get(l) ?? []) : null
      if (sbd && !sbd.length) continue
      const dau = bai[0]!, cuoi = bai[bai.length - 1]!, phamVi = phamViTruoc(dsBai, dau.viTri)
      ra.push({
        lop: l, bai, sbd,
        xemVao: {
          lop: l, khoaBai: cuoi.khoaBai, tenBai: cuoi.tenBai, viTri: cuoi.viTri, maDe: [...new Set(bai.flatMap((b) => maDeMacDinh(b)))],
          ...(hanSua && hanHopLe ? { hanNop: hanSua } : {}), ...(theLucSua ? { theLucNgay: theLucSua } : {}), ...(sbd ? { sbd } : {}), ...(phamVi.length ? { phamVi } : {}),
        },
      })
    }
    return ra
  }, [baiChon, lopChon, tickTheoLop, coDanhSachEm, emTheoLop, dsBai, hanSua, hanHopLe, theLucSua])

  const [xemTheoLop, setXemTheoLop] = useState<Record<string, XemTruocTick>>({})
  const [loiXemTheoLop, setLoiXemTheoLop] = useState<Record<string, string>>({})
  const [dangXem, setDangXem] = useState(false)
  const [lanXemLai, setLanXemLai] = useState(0)
  const luotXem = useRef(0)
  const khoaXem = JSON.stringify(lopGiao.map((x) => x.xemVao))
  useEffect(() => {
    const l = ++luotXem.current
    if (!lopGiao.length) { setXemTheoLop({}); setLoiXemTheoLop({}); setDangXem(false); return }
    setDangXem(true)
    const hen = setTimeout(() => {
      void Promise.all(lopGiao.map(async (x) => [x.lop, await baiDaDayXemTruoc(x.xemVao)] as const)).then((kq) => {
        if (l !== luotXem.current) return
        const xem: Record<string, XemTruocTick> = {}, loi: Record<string, string> = {}
        for (const [x, r] of kq) { if (r.ok) xem[x] = r.du; else loi[x] = r.chu }
        setXemTheoLop(xem); setLoiXemTheoLop(loi); setDangXem(false)
      })
    }, CHO_XEM_MS)
    return () => clearTimeout(hen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoaXem, lanXemLai])

  const [dangGiao, setDangGiao] = useState(false)
  const [loiGiao, setLoiGiao] = useState('')
  const giao = async () => {
    if (!lopGiao.length || dangGiao || dangXem || lopGiao.some((x) => !xemTheoLop[x.lop])) return
    setDangGiao(true); setLoiGiao(''); setXong('')
    const ok: { lop: string; khoaBai: string; ten: string }[] = [], loi: string[] = []
    let soEm = 0
    for (const x of lopGiao) {
      // Cùng MỘT hạn cho mọi bài của lớp: hạn thầy sửa, hoặc hạn máy chủ tự tính cho cả khối lượng các bài đã chọn.
      const hanNop = hanSua && hanHopLe ? hanSua : xemTheoLop[x.lop]!.hanNop
      let coBai = false
      for (const b of x.bai) {
        const phamVi = phamViTruoc(dsBai, b.viTri)
        const r = await baiDaDayTick({ lop: x.lop, khoaBai: b.khoaBai, tenBai: b.tenBai, viTri: b.viTri, maDe: maDeMacDinh(b), hanNop, ...(theLucSua ? { theLucNgay: theLucSua } : {}), ...(x.sbd ? { sbd: x.sbd } : {}), phamVi })
        if (r.ok) { ok.push({ lop: x.lop, khoaBai: b.khoaBai, ten: tenNganBai(b.tenBai) }); coBai = true }
        else loi.push(`${tenNganBai(b.tenBai)} · ${x.lop}: ${r.chu}`)
      }
      if (coBai) soEm += xemTheoLop[x.lop]!.soEmChon
    }
    setDangGiao(false)
    if (ok.length) {
      baoBaiDangGiaoThayDoi(ok.map((k) => ({ lop: k.lop, khoaBai: k.khoaBai, loai: 'tick' as const })))
      void bhn.taiDs()
      const ten = [...new Set(ok.map((k) => k.ten))].join(', '), lop = [...new Set(ok.map((k) => k.lop))]
      setXong(`Đã giao ${ten} cho ${soEm} em ${lop.length > 1 ? `${lop.length} lớp (${lop.join(', ')})` : `lớp ${lop[0]}`}. Phần luyện hôm nay của các em đã xếp lại theo bài mới; máy các em tự tải câu và đáp án (đã khoá) về.`)
      showToast(`Đã giao ${ten}`, 'success')
    }
    if (loi.length) setLoiGiao(loi.join(' · '))
    else { setChonNho((c) => (c ? { ...c, ds: [] } : c)); setHanSua(''); setTheLucChu('') }
  }

  return {
    chonDs, baiChon, doiChon, xong, lopGiao, xemTheoLop, loiXemTheoLop, dangXem, xemLai: () => setLanXemLai((n) => n + 1),
    hanSua, setHanSua, theLucChu, setTheLucChu, theLucSua, loiTheLuc, hanHopLe, homNay, giao, dangGiao, loiGiao,
    nho: chonNho,
  }
}
export type GiaoNhieuBai = ReturnType<typeof useGiaoNhieuBai>

/** Thân hộp: lớp nhận bài · giao cho · danh sách bài có ô tick · thẻ tóm tắt + Giao. */
export function BoSungNhieuBai({ bhn, gn, kho, loiKho = '', thuKho }: { bhn: BaiHomNay; gn: GiaoNhieuBai; kho: TeacherExamSource[] | null; loiKho?: string; thuKho?: () => void }) {
  const { lop, lopChon, lopChonDuoc, khoi, dsBai, tickTheoLop, loiDsTheoLop, dangTaiDs, dsTheoLop } = bhn
  const nhieu = lopChon.length > 1
  // Bài cũ: đứng trước bài đã giao xa nhất của MỌI lớp đang chọn (đúng luật phạm vi máy chủ) — vẫn chọn được, chỉ ghi chú.
  const xaNhat = useMemo(() => Math.min(...lopChon.map((l) => viTriTickXaNhat(dsBai, tickTheoLop.get(l)?.keys() ?? []))), [lopChon, dsBai, tickTheoLop])
  const chuong = useMemo((): ChuongMoi[] => {
    const ra: ChuongMoi[] = []
    for (const b of dsBai) {
      const ticks = lopChon.map((l) => ({ lop: l, tick: tickTheoLop.get(l)?.get(b.khoaBai) }))
      const daHet = ticks.length > 0 && ticks.every((x) => !!x.tick)
      const tuGiao = soCauTuGiao(b)
      let dong: DongBaiMoi
      if (daHet) {
        const t1 = ticks[0]!.tick!, tt = trangThaiBai(t1, false)
        const soEm = nhieu ? null : (t1.goi7?.soEm ?? t1.soEm ?? t1.chungChi?.tong ?? null)
        dong = { khoaBai: b.khoaBai, so: soBaiCuaTen(b.tenBai) === null ? null : String(soBaiCuaTen(b.tenBai)), ten: b.tenBai, soCau: tuGiao || b.soCau, chiaPhan: '', trangThai: ticks.some((x) => x.tick?.trangThai === 'dang_luyen') ? 'dang' : 'da',
          chuThai: `${tt.chu.split(' · chứng chỉ')[0]}${soEm ? ` · ${soEm} em` : ''}${nhieu ? ` · ${lopChon.length} lớp` : ''}` }
      } else {
        const coLop = ticks.filter((x) => x.tick).map((x) => x.lop)
        const cu = b.viTri < xaNhat
        dong = { khoaBai: b.khoaBai, so: soBaiCuaTen(b.tenBai) === null ? null : String(soBaiCuaTen(b.tenBai)), ten: b.tenBai, soCau: tuGiao, chiaPhan: chiaPhanCuaBai(b), trangThai: 'moi', khongGiao: maDeMacDinh(b).length === 0, cu,
          ghiChu: coLop.length ? `${coLop.join(', ')} đã có · còn ${lopChon.filter((l) => !coLop.includes(l)).join(', ')}` : cu ? 'bài cũ, đang trong phần ôn' : undefined }
      }
      const c = ra[ra.length - 1]
      if (c && c.ten === (b.chuong || 'Bài')) c.bai.push(dong)
      else ra.push({ ten: b.chuong || 'Bài', bai: [dong] })
    }
    return ra
  }, [dsBai, lopChon, tickTheoLop, nhieu, xaNhat])

  // Thẻ tóm tắt: số của lớp đầu tiên (một lớp: đúng lớp ấy); nhiều lớp ⇒ cộng số em, chi tiết từng lớp ở «Chi tiết».
  const lop1 = gn.lopGiao[0]?.lop
  const x1 = lop1 ? gn.xemTheoLop[lop1] : undefined
  const xongHet = gn.lopGiao.length > 0 && gn.lopGiao.every((x) => gn.xemTheoLop[x.lop])
  const loiXem = gn.lopGiao.map((x) => gn.loiXemTheoLop[x.lop] ? (nhieu ? `${x.lop}: ${gn.loiXemTheoLop[x.lop]}` : gn.loiXemTheoLop[x.lop]) : '').filter(Boolean).join(' · ')
  const tongEm = gn.lopGiao.reduce((n, x) => n + (gn.xemTheoLop[x.lop]?.soEmChon ?? 0), 0)
  const tongDu = gn.lopGiao.reduce((n, x) => n + (gn.xemTheoLop[x.lop]?.duLuot ?? 0), 0)
  const lopChu = !lopChon.length ? 'lớp' : nhieu ? `${lopChon.length} lớp` : `lớp ${lop}`
  const soEmChu = gn.lopGiao.length ? ` · ${xongHet ? tongEm : '…'} em` : ''
  const chuaChonEm = gn.baiChon.length > 0 && !gn.lopGiao.length
  const loi = loiXem || (chuaChonEm ? (bhn.coDanhSachEm && !bhn.sbdChon.length ? 'Chưa chọn em nào — chọn em ở mục «Giao cho».' : !gn.hanHopLe ? 'Hạn nộp phải từ hôm nay trở đi.' : 'Các bài đã chọn đều đã giao cho lớp này rồi.') : '') || gn.loiTheLuc
  const tom = x1 && xongHet && !chuaChonEm ? {
    tenBai: gn.baiChon.map((b) => tenNganBai(b.tenBai)).join(', '),
    soCau: x1.soCau,
    chiaPhan: x1.theoPhan ? (['I', 'II', 'III'] as const).filter((k) => x1.theoPhan![k] > 0).map((k) => `${TEN_PHAN[k]} ${x1.theoPhan![k]}`).join(' · ') || 'không có câu tự giao' : (x1.soTuLuan ? `đã bỏ ${x1.soTuLuan} câu tự luận` : 'không có câu tự luận'),
    hanChu: `hết 23:59 · ${hienHanNop(x1.hanNop, false) || x1.hanNop}`,
    soNgay: x1.D, soEm: tongEm, duLuot: tongDu, luotNgay: x1.theLucNgay,
  } : null

  const chiTiet = gn.lopGiao.length ? (
    <div className="bhn-ct-nhieu" data-khoi="chi-tiet-giao">
      {gn.lopGiao.map((x) => {
        const xem = gn.xemTheoLop[x.lop]
        if (!xem) return null
        return (
          <section key={x.lop} className="bhn-ct-lop" data-lop={x.lop}>
            {nhieu && <h4 className="bhn-nhan">Lớp {x.lop} · {x.bai.map((b) => tenNganBai(b.tenBai)).join(', ')}</h4>}
            <LuoiSo xem={xem} hanSua={gn.hanSua} theLucSua={gn.theLucSua} dangXem={gn.dangXem} />
            <CanhBaoQuaTai xem={xem} lop={x.lop} kemLop={nhieu} />
            <OnBaiCuTheoLop key={`${x.lop}|${xem.onBaiCu?.tiLe.thuong}|${xem.onBaiCu?.tiLe.cuoi}`} bhn={{ xemLai: gn.xemLai }} lop={x.lop} xem={xem} />
          </section>
        )
      })}
      <div className="cd-hai-ngay" data-khoi="sua-han-luot">
        <label className="cd-truong">
          Hạn nộp (hết lúc 23:59)
          <input type="date" value={gn.hanSua} min={gn.homNay} onChange={(e) => gn.setHanSua(e.target.value)} />
          <small className="cd-so cd-phu">{!gn.hanSua ? `Để trống = ${TEN_AI} tự tính (${THAM_SO_OMNI.HAN_BAI_MIN}–${THAM_SO_OMNI.HAN_BAI_MAX} ngày) cho cả các bài đã chọn` : gn.hanHopLe ? hienHanNop(gn.hanSua) : 'Hạn nộp phải từ hôm nay trở đi'}</small>
        </label>
        <label className="cd-truong">
          Số lượt câu mỗi ngày (một em)
          <input type="number" inputMode="numeric" min={1} max={LUOT_TOI_DA} value={gn.theLucChu} placeholder={x1 ? String(x1.theLucNgay) : ''} onChange={(e) => gn.setTheLucChu(e.target.value)} />
          <small className="cd-so cd-phu">{gn.loiTheLuc || 'Để trống = số lượt mặc định của lớp (Cài đặt)'}</small>
        </label>
      </div>
    </div>
  ) : undefined

  const loiDs = lopChon.filter((l) => loiDsTheoLop[l]).map((l) => (nhieu ? `${l}: ${loiDsTheoLop[l]}` : loiDsTheoLop[l]!))
  return (
    <section className="dh-buoc bhn bhn--trong-hop" aria-label="Bài hôm nay" data-khoi="bai-hom-nay">
      {lopChon.length > 0 && <NapDsEm onCo={bhn.setDsEm} />}
      <div className="bhn-lop">
        <span className="bhn-nhan">Lớp nhận bài</span>
        <ChonLopGiao dsLop={lopChonDuoc} chon={lopChon} onDoi={bhn.setLopChon} />
        {lopChon.length > 0 && bhn.coDanhSachEm && <GiaoChoAi bhn={bhn} />}
      </div>
      {!lopChon.length ? (
        <p className="bhn-trong">Chọn lớp để xem các bài Dạy học của khối và trạng thái từng bài.</p>
      ) : !khoi ? (
        <p className="bhn-trong">Chưa nhận ra khối của lớp {lop} (tên lớp cần bắt đầu bằng 10, 11 hoặc 12).</p>
      ) : !kho ? (
        loiKho ? <div className="dh-hang"><p className="dh-loi" role="alert">{loiKho}</p><button type="button" className="m3-nut-vien dh-nut-nho" onClick={thuKho}>Thử tải kho lại</button></div> : <p className="bhn-trong" aria-busy="true">Đang đọc kho đề…</p>
      ) : !dsBai.length ? (
        <p className="bhn-trong">Kho chưa có bài Dạy học của khối {khoi}. Vào Ngân hàng câu hỏi → Đồng bộ ngay để nạp đề.</p>
      ) : loiDs.length ? (
        <div className="dh-hang"><p className="dh-loi" role="alert">{loiDs.join(' · ')}</p><button type="button" className="m3-nut-vien dh-nut-nho" onClick={() => void bhn.taiDs()}>Thử lại</button></div>
      ) : dangTaiDs && lopChon.every((l) => !dsTheoLop[l]) ? (
        <p className="dh-phu" aria-busy="true">Đang đọc trạng thái các bài…</p>
      ) : (
        <ChonBaiMoi
          key={`${khoi}|${lopChon.join(',')}`}
          chuong={chuong}
          chon={gn.chonDs}
          onDoiChon={gn.doiChon}
          onBoGiao={(k) => { const b = dsBai.find((x) => x.khoaBai === k); if (!b) return; void (async () => { for (const l of lopChon) if (tickTheoLop.get(l)?.has(k)) await bhn.boTick(b, l) })() }}
          lopChu={`${lopChu}${soEmChu}`}
          tom={tom}
          dangTinh={gn.dangXem || (gn.lopGiao.length > 0 && !xongHet && !loiXem)}
          loi={loi || undefined}
          canhBao={gn.loiGiao || undefined}
          onGiao={() => void gn.giao()}
          dangGiao={gn.dangGiao}
          xong={gn.xong || undefined}
          chiTiet={chiTiet}
        />
      )}
    </section>
  )
}
