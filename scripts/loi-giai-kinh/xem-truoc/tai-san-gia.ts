// Gói Kính GIẢ cho trang xem thử hộp Lời giải (?hop=1): trả bản mẫu thầy duyệt ngay, coi như đã trên máy.
import mau from '../vi-du-kinh.json'
export const coGoiKinh = () => true
export const taiSanKinh = async () => undefined
export async function banKinhCua(qid: string) {
  const i = Math.max(0, Number(qid.replace(/\D/g, '')) - 1)
  const pt = qid.endsWith('-pt') ? { cotLoi: { congThuc: 'H_2N-CH_2-COOH + C_2H_5OH + HCl → ClH_3N-CH_2-COOC_2H_5 + H_2O', chu: 'COOH của glycine ester hoá với OH của ethyl alcohol, mất một H₂O; có HCl nên nhóm NH₂ **nhận H⁺**.', chip: [{ nhan: 'COOH + OH', chu: 'ester hoá, mất H₂O' }] } } : {}
  return { ...(mau as unknown[])[i] as object, ...pt, qid, phienBan: 1, phan: 'III' }
}
