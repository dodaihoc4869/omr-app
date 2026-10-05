// OMNI 3 — LỆNH THẦY `POST /gv/omni` (sau cổng `laThay`). action:
//   co-doc · co-luu {co} · cau-hinh-doc · cau-hinh-luu {theLucLop?, maTran?}
//   bang {chienDichId}                 ⇒ BangOmni (omni-kieu.ts)
//   xac-nhan {sbd, maDang, ket:'vung'|'day_lai', nguoi?}  ⇒ { ok } (ghi omni_xac_nhan, chỉ-thêm)
//   q-lo {chienDichId?|maDang?, sau?}  ⇒ { ok, cau:[{qid, stt, de, phan, maDang, tenDang, goiY:string[], vknY?:string[][]}], vkn: Vkn[], conLai }
//   q-duyet {ds:[{qid, vkn[], vknY?}], vknMoi?: Vkn[]}  ⇒ { ok, daDuyet }
//   ca-chot {chienDichId}              ⇒ { ok, qids, soLa, soCu } (50 % câu chiến dịch + 50 % câu chưa gặp cùng ô từ TU LUYỆN, khung 18 + 4 + 6)
//   gan-ca-chot {chienDichId, maCa}    ⇒ { ok }
// ⚠ STUB HỢP ĐỒNG: agent "OMNI D1 + API" thay thân bằng bản thật + test.
import type { Env } from './kieu'

export async function gvOmni(env: Env, b: Record<string, unknown>, nowMs = Date.now()): Promise<Record<string, unknown>> {
  void env; void nowMs
  return { ok: false, error: `Lệnh ${String(b.action ?? '')} đang dựng.` }
}
