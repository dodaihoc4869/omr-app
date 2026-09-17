import {evolutionStage} from './evolution'
export interface ShieldState {used:number;activeUntil:number;lastUse?:string}
export function shieldEntitlement(level:number){const stage=evolutionStage(level);return Array.from({length:stage},(_,i)=>Math.min(i+1,3)).reduce((a,b)=>a+b,0)}
export function shieldRemaining(level:number,state?:ShieldState){return Math.max(0,shieldEntitlement(level)-(state?.used??0))}
