/** Presentation-only combat. Academic grading and rewards remain server-owned. */
export interface BattleAnswer {qid:string;correct:boolean}
export function learningBattle(answers:BattleAnswer[],total:number){
 let hp=100,enemy=100,streak=0,damage=0,heal=0,rage=false
 const unique=answers.filter((a,i)=>answers.findIndex(b=>b.qid===a.qid)===i)
 const base=Math.ceil(100/Math.max(1,total))
 for(let i=0;i<unique.length;i++){
  const a=unique[i]!;heal=0;rage=false
  if(a.correct){streak++;rage=streak%3===0;damage=base*(rage?2:1);enemy=Math.max(0,enemy-damage);if(i>0&&!unique[i-1]!.correct){heal=Math.min(10,100-hp);hp+=heal}}
  else{streak=0;damage=Math.min(18,hp);hp=Math.max(0,hp-damage)}
 }
 return {hp,enemy,streak,damage,heal,rage,count:unique.length,correct:unique.at(-1)?.correct,protected:hp===0}
}
export const BATTLE_SKINS=[
 {name:'Thạch Quy',move:'Địa Tinh Pháo',color:'255,190,65',symbol:'◆'},
 {name:'Thuỷ Long',move:'Thuỷ Long Pháo',color:'57,189,255',symbol:'◉'},
 {name:'Viêm Sư',move:'Liệt Diễm Pháo',color:'255,113,38',symbol:'✦'},
 {name:'Phong Thố',move:'Phong Luân Kích',color:'108,242,208',symbol:'彡'},
 {name:'Tinh Lang',move:'Tinh Quang Pháo',color:'137,155,255',symbol:'✧'},
 {name:'Ái Hồ',move:'Ái Tâm Quang',color:'255,128,183',symbol:'♥'},
 {name:'Ân Lộc',move:'Ân Hoa Quang',color:'241,217,112',symbol:'❀'},
 {name:'Minh Linh',move:'Minh Tâm Quang',color:'201,164,255',symbol:'✧'},
] as const
