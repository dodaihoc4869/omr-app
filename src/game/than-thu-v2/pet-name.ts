import {PETS} from './core'
export function normalizePetName(value:unknown){
 if(typeof value!=='string')throw new Error('Em nhập tên thần thú.')
 const name=value.normalize('NFC').trim().replace(/\s+/g,' ')
 if(!name||[...name].length>24||!/^[\p{L}\p{M}\p{N} _'’\-]+$/u.test(name))throw new Error('Tên gồm 1–24 chữ, số, khoảng trắng hoặc dấu gạch nối.')
 return name
}
export function spiritName(pet:string,nickname?:string){return nickname||PETS.find(p=>p.id===pet)?.name||'Thần thú'}
