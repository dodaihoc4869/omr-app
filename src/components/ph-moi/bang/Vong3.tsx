// Ba vòng hoạt động của thẻ Tổng quan (kiểu Apple Fitness): vòng 1 câu đã làm / mục tiêu câu, vòng 2 tỉ lệ đúng, vòng 3 phút học / mục tiêu phút. Hình học đúng bản vẽ docs/ban-ve-ph-apple-2109/ph-d-bang-day-du.html (viewBox 120, bán kính 50 / 37,5 / 25, nét 10,5).
// NÓI THẬT THEO DỮ LIỆU: vòng nào thiếu số hoặc thiếu mục tiêu ⇒ KHÔNG vẽ; các vòng còn lại nhận bán kính theo thứ tự có mặt. Vượt mục tiêu ⇒ vòng đầy + cung thứ hai màu nhạt + chấm đầu vòng có bóng. Chạy đầy từ 0 bằng CSS (TongQuan.css).
import { useId, type CSSProperties } from "react";
import "./TongQuan.css";
import { mauSoTiLeDung } from "../../../lib/ph-moi/du-lieu";

const TAM = 60;
const NET = 10.5;
const BAN_KINH = [50, 37.5, 25] as const;
const R_CHAM = NET / 2; // chấm đầu vòng
const LECH_BONG = 3.2; // bóng đầu vòng lệch về phía trước theo tiếp tuyến
const CHAY_DAY_MS = 700; // vòng không vượt: một cung
const CHAY_LAP1_MS = 420; // vòng vượt: vòng đầu…
const CHAY_LAP2_MS = 340; // …rồi cung thứ hai + đầu vòng
const LECH_VONG_MS = 80;

export interface KetQuaVong {
  /** giá trị / mục tiêu (có thể > 1) */
  ti: number;
  /** phần của vòng đầu đã tô, 0..1 */
  lapDau: number;
  vuot: boolean;
  /** phần của cung thứ hai (vòng vượt), 0..1; đúng bội nguyên của mục tiêu ⇒ 1 (đầy cả vòng nhạt); không vượt ⇒ 0 */
  lapHai: number;
}

/** THUẦN. Thiếu số / số âm / mục tiêu ≤ 0 ⇒ null (không vẽ vòng). 38/16 ⇒ vòng đầy + cung thứ hai 0,375 (phần lẻ của 2,375 như mẫu). */
export function tinhVong(giaTri: number | null | undefined, mucTieu: number | null | undefined): KetQuaVong | null {
  if (typeof giaTri !== "number" || !Number.isFinite(giaTri) || giaTri < 0) return null;
  if (typeof mucTieu !== "number" || !Number.isFinite(mucTieu) || mucTieu <= 0) return null;
  const ti = giaTri / mucTieu;
  const vuot = ti > 1 + 1e-9;
  const le = ti - Math.floor(ti);
  return { ti, lapDau: Math.min(1, ti), vuot, lapHai: vuot ? (le < 1e-9 ? 1 : le) : 0 };
}

export interface Vong3Props {
  soCau: number | null;
  soDung: number | null;
  /** Mẫu số của vòng 2 = số câu đã có kết quả (không che); vắng / null ⇒ dùng soCau như trước. */
  soCauCoKetQua?: number | null;
  phutHoc: number | null;
  mucTieu: { soCau: number | null; phutHoc: number | null } | null;
  /** Chữ đọc cho người dùng màn hình; bỏ trống ⇒ tự ghép từ các vòng đang vẽ. */
  nhan?: string;
}

type Mau = 1 | 2 | 3;
interface VongVe {
  mau: Mau;
  kq: KetQuaVong;
}

/** Các vòng SẼ vẽ, theo thứ tự 1 → 2 → 3. Vòng 2 (tỉ lệ đúng) không cần mục tiêu, không bao giờ vượt; con chưa làm câu nào (0) ⇒ vòng 2 trống nhưng CHỈ khi còn vòng khác để đi cùng. */
export function cacVongVe({ soCau, soDung, soCauCoKetQua, phutHoc, mucTieu }: Omit<Vong3Props, "nhan">): VongVe[] {
  const v1 = tinhVong(soCau, mucTieu?.soCau);
  const v3 = tinhVong(phutHoc, mucTieu?.phutHoc);
  let v2: KetQuaVong | null = null;
  const mau = mauSoTiLeDung({ soCau, soCauCoKetQua });
  if (mau !== null && mau > 0 && soDung !== null) v2 = tinhVong(Math.min(soDung, mau), mau);
  else if (mau === 0 && (soDung === null || soDung === 0) && (v1 || v3)) v2 = tinhVong(0, 1); // chưa làm câu nào, hoặc toàn câu che (chưa có câu nào có kết quả)
  const ra: VongVe[] = [];
  if (v1) ra.push({ mau: 1, kq: v1 });
  if (v2) ra.push({ mau: 2, kq: v2 });
  if (v3) ra.push({ mau: 3, kq: v3 });
  return ra;
}

const f2 = (n: number): string => n.toFixed(2);
const bien = (o: Record<string, string | number>) => o as CSSProperties; // biến CSS tự đặt (--tq-…)

function nhanTuDong({ soCau, soDung, soCauCoKetQua, phutHoc, mucTieu }: Omit<Vong3Props, "nhan">, ve: VongVe[]): string {
  const mau = mauSoTiLeDung({ soCau, soCauCoKetQua });
  const p: string[] = [];
  for (const v of ve) {
    if (v.mau === 1 && soCau !== null && mucTieu?.soCau) p.push(`${soCau} câu đã làm trên mục tiêu ${mucTieu.soCau} câu`);
    if (v.mau === 2 && mau && soDung !== null) p.push(`câu đúng ${Math.round((Math.min(soDung, mau) / mau) * 100)} %`);
    if (v.mau === 3 && phutHoc !== null && mucTieu?.phutHoc) p.push(`${Math.round(phutHoc)} phút học trên mục tiêu ${Math.round(mucTieu.phutHoc)} phút`);
  }
  const dau = ve.length >= 3 ? "Ba vòng hôm nay" : ve.length === 2 ? "Hai vòng hôm nay" : "Vòng hôm nay";
  return p.length > 0 ? `${dau}: ${p.join("; ")}` : dau;
}

export default function Vong3(props: Vong3Props) {
  const ve = cacVongVe(props);
  const uid = `phm-v${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`; // id cho <mask>/<filter> (không dấu hai chấm để url(#…) an toàn)
  if (ve.length === 0) return null;
  const coVuot = ve.some((v) => v.kq.vuot);
  return (
    <div className="phm-vong3" role="img" aria-label={props.nhan ?? nhanTuDong(props, ve)}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        {coVuot && (
          <defs>
            <filter id={`${uid}-mo`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1.7" />
            </filter>
          </defs>
        )}
        {ve.map((v, k) => {
          const r = BAN_KINH[k] as number;
          const cv = 2 * Math.PI * r;
          const tre = k * LECH_VONG_MS;
          const quay = `rotate(-90 ${TAM} ${TAM})`; // cung bắt đầu từ 12 giờ, chạy theo chiều kim đồng hồ
          const { kq, mau } = v;
          return (
            <g key={mau}>
              <circle className="phm-v-nen" data-mau={mau} cx={TAM} cy={TAM} r={r} strokeWidth={NET} />
              {kq.vuot ? (
                <>
                  {/* vòng đầu: đầy */}
                  <circle className="phm-v-cung" data-mau={mau} cx={TAM} cy={TAM} r={r} strokeWidth={NET} strokeDasharray={`${f2(cv)} ${f2(cv)}`} transform={quay} style={bien({ "--tq-tre": `${tre}ms`, "--tq-dai": `${CHAY_LAP1_MS}ms` })} />
                  <VongHai maskId={`${uid}-m${mau}`} filterId={`${uid}-mo`} mau={mau} r={r} cv={cv} lapHai={kq.lapHai} tre={tre + CHAY_LAP1_MS} quay={quay} />
                </>
              ) : (
                kq.lapDau > 0 && (
                  <circle className="phm-v-cung" data-mau={mau} cx={TAM} cy={TAM} r={r} strokeWidth={NET} strokeLinecap="round" strokeDasharray={`${f2(kq.lapDau * cv)} ${f2(cv)}`} transform={quay} style={bien({ "--tq-tre": `${tre}ms`, "--tq-dai": `${CHAY_DAY_MS}ms` })} />
                )
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Cung thứ hai của vòng vượt mục tiêu (màu nhạt) + chấm đầu vòng có bóng đổ lên vành phía trước. */
function VongHai({ maskId, filterId, mau, r, cv, lapHai, tre, quay }: { maskId: string; filterId: string; mau: Mau; r: number; cv: number; lapHai: number; tre: number; quay: string }) {
  const goc = lapHai * 360;
  const t = ((goc - 90) * Math.PI) / 180;
  const cx = TAM + r * Math.cos(t);
  const cy = TAM + r * Math.sin(t);
  const bx = cx - Math.sin(t) * LECH_BONG;
  const by = cy + Math.cos(t) * LECH_BONG;
  const rung = { "--tq-tre": `${tre}ms`, "--tq-dai": `${CHAY_LAP2_MS}ms` };
  return (
    <>
      <circle className="phm-v-cung phm-v-lap2" data-mau={mau} data-vuot="" cx={TAM} cy={TAM} r={r} strokeWidth={NET} strokeLinecap="round" strokeDasharray={`${f2(lapHai * cv)} ${f2(cv)}`} transform={quay} style={bien(rung)} />
      <mask id={maskId}>
        <circle className="phm-v-mat-na" cx={TAM} cy={TAM} r={r} strokeWidth={NET} />
      </mask>
      <g className="phm-v-dau" style={bien({ ...rung, "--tq-goc": `${f2(goc)}deg` })}>
        <g mask={`url(#${maskId})`}>
          <circle className="phm-v-bong" cx={f2(bx)} cy={f2(by)} r={R_CHAM} filter={`url(#${filterId})`} />
        </g>
        <circle data-to={mau} data-vuot="" cx={f2(cx)} cy={f2(cy)} r={R_CHAM} />
      </g>
    </>
  );
}

export { Vong3 }; // cả tên có ngoặc lẫn mặc định, để vỏ nhập kiểu nào cũng được
