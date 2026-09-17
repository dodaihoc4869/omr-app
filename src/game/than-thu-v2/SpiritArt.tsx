import Spirit2D from './Spirit2D'
export default function SpiritArt({index=0,level=1}:{index?:number;level?:number}){
 return <Spirit2D index={index} level={level} compact/>
}
