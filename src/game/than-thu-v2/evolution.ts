export const EVOLUTION_LEVELS=[1,10,30,50,70,100] as const
export const EVOLUTION_NAMES=['Ấu thú','Thức tỉnh','Trưởng thành','Linh giáp','Thăng hoa','Thần hộ mệnh'] as const
export function evolutionStage(level:number){return Math.max(0,EVOLUTION_LEVELS.filter(min=>level>=min).length-1)}
export function evolutionWindow(index:number,level:number){const pet=Math.max(0,Math.min(7,Math.trunc(index)));return {atlas:pet<4?'elements':'virtues',row:pet%4,column:evolutionStage(level)}}
/** Measured cell boundaries in the approved generated atlases (1536 × 1024). */
export function evolutionCrop(index:number,level:number){
 const {atlas,row,column}=evolutionWindow(index,level)
 const cols=atlas==='elements'?[0,215,449,710,982,1250,1536]:[0,244,497,747,995,1255,1536]
 const rows=atlas==='elements'?[0,263,514,758,1024]:[0,258,503,771,1024]
 const x=cols[column]!,y=rows[row]!
 // A few painted effects cross the sheet's nominal cell edges. Exclude adjacent pets.
 let right=cols[column+1]!,bottom=rows[row+1]!
 if(atlas==='elements'&&row===1)bottom=509
 if(atlas==='elements'&&row===2)bottom=750
 if(atlas==='elements'&&row===3&&column===3)right=970
 if(atlas==='virtues'&&row===3&&column===1)right=475
 return {atlas,row,column,x,y,width:right-x,height:bottom-y}
}

export function evolutionMirror(index:number,level:number){return index===0&&evolutionStage(level)===2}
