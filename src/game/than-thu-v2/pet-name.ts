import {PETS} from './core'
/** Luật TÊN THẦN THÚ (dùng chung máy chủ `rename` + ô đặt tên ở app HS). Tên hiện cho bạn cùng Đoàn Hộ Tống ⇒ lọc chặt:
 *  1–16 ký tự sau khi cắt khoảng trắng; chỉ chữ Latin (gồm chữ Việt có dấu) + số + khoảng trắng + dấu gạch (- _);
 *  bỏ ký tự điều khiển / vô hình; không HTML, không emoji; không từ tục / xúc phạm (so không phân biệt dấu, hoa thường). */
export const TEN_TOI_DA=16
export const LOI_TEN_TUC='Tên này chưa phù hợp, em chọn tên khác nhé.'
const LOI_TEN=`Tên gồm 1–${TEN_TOI_DA} chữ, số, khoảng trắng hoặc dấu gạch.`
/** Bỏ dấu + đ→d + chữ thường: "Địt" ⇒ "dit". */
export function boDau(s:string){return s.normalize('NFD').replace(/\p{M}/gu,'').replace(/[đĐ]/g,'d').toLowerCase()}
// Danh sách NGẮN, cố ý. Ba cách so để ít bắt nhầm tên hiền (Lợn Con, Long, Bưởi, Đeo Nơ, Ngũ Hành, Con Cá Chép…):
//  · TỪ_BO_DAU: cả một từ (sau khi bỏ dấu) trùng — viết tắt / biến thể không dấu, không trùng từ hiền nào;
//  · TỪ_CO_DAU: cả một từ (giữ dấu, chữ thường) trùng — từ mà bỏ dấu sẽ trùng từ hiền (lồn ≠ lợn, đéo ≠ đeo, ngu ≠ ngũ);
//  · CHUOI_LIEN: chuỗi liền (bỏ dấu, bỏ khoảng trắng/gạch) chứa cụm — bắt kiểu tách chữ "đ.m", "Óc Chó", "D i t M e".
const TU_BO_DAU=new Set(['dit','djt','loz','cac','cak','kac','dm','dmm','dcm','dkm','dmcs','vcl','vkl','vl','cl','clm','cmm','cc','dume','ditme','occho','fuck','shit','bitch'])
const TU_CO_DAU=new Set(['lồn','l0n','buồi','đụ','đéo','đĩ','điếm','cứt','ngu','ngáo','khốn','súc'])
const CHUOI_LIEN=['ditme','ditconme','dumay','dume','dmay','occho','ngunhucho','chochet','memay','dauboi','dcm','vcl','dmm','clgt','fuck','shit']
/** true = tên có từ tục / xúc phạm. */
export function laTenTuc(ten:string){
 const thuong=ten.normalize('NFC').toLowerCase(),tu=thuong.split(/[\s_\-]+/).filter(Boolean)
 if(tu.some(t=>TU_CO_DAU.has(t)||TU_BO_DAU.has(boDau(t))))return true
 const lien=boDau(thuong).replace(/[^a-z0-9]/g,'')
 return TU_BO_DAU.has(lien)||CHUOI_LIEN.some(c=>lien.includes(c))
}
export function normalizePetName(value:unknown){
 if(typeof value!=='string')throw new Error('Em nhập tên thần thú.')
 // Bỏ ký tự điều khiển / vô hình (zero-width, BOM, đổi chiều chữ) trước, rồi gom khoảng trắng.
 const name=value.normalize('NFC').replace(/\p{Cf}/gu,'').replace(/\p{Cc}/gu,' ').trim().replace(/\s+/g,' ')
 if(!name||[...name].length>TEN_TOI_DA||!/^[\p{Script=Latin}0-9 _\-]+$/u.test(name))throw new Error(LOI_TEN)
 if(laTenTuc(name))throw new Error(LOI_TEN_TUC)
 return name
}
export function spiritName(pet:string,nickname?:string){return nickname||PETS.find(p=>p.id===pet)?.name||'Thần thú'}
