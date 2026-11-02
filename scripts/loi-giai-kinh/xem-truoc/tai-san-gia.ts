// Gói Kính GIẢ cho trang xem thử hộp Lời giải (?hop=1): trả bản mẫu thầy duyệt ngay, coi như đã trên máy.
import mau from '../vi-du-kinh.json'
export const coGoiKinh = () => true
export const taiSanKinh = async () => undefined
export async function banKinhCua(qid: string) {
  const i = Number(qid.replace(/\D/g, '')) - 1
  return { ...(mau as unknown[])[i] as object, qid, phienBan: 1, phan: 'III' }
}
