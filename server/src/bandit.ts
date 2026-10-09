// Contextual Thompson sampling phân tầng; chỉ chọn trong can thiệp CÓ câu hợp lệ.
export type CachCuu='on_nen'|'vi_du_de'
export interface BangBandit { context:string; cach:CachCuu; dung:number; sai:number }
export interface ChonBandit { cach:CachCuu; xacSuat:number }
const gamma=(shape:number,rng:()=>number):number=> {
  if(shape<1) return gamma(shape+1,rng)*Math.max(1e-12,rng())**(1/shape)
  const d=shape-1/3,c=1/Math.sqrt(9*d)
  for(let i=0;i<1000;i++) {
    const x=Math.sqrt(-2*Math.log(Math.max(1e-12,rng())))*Math.cos(2*Math.PI*rng()), v=(1+c*x)**3
    if(v<=0) continue
    const u=Math.max(1e-12,rng())
    if(u<1-0.0331*x**4 || Math.log(u)<x*x/2+d*(1-v+Math.log(v))) return d*v
  }
  return shape
}
export function chonBandit(context:string,co:readonly CachCuu[],bang:readonly BangBandit[],rng:()=>number):ChonBandit|null {
  const ds=[...new Set(co)]
  if(!ds.length) return null
  if(ds.length===1) return {cach:ds[0]!,xacSuat:1}
  const wins=new Map<CachCuu,number>(ds.map(c=>[c,0]))

  // Monte Carlo lưu propensity ước lượng; RNG do máy chủ cấp, không lấy từ HS.
  for(let i=0;i<256;i++) {
    let best=-1, arm=ds[0]!
    for(const c of ds) {
      const r=bang.find(b=>b.context===context && b.cach===c), a=gamma(1+(r?.dung??0),rng),b=gamma(1+(r?.sai??0),rng),p=a/(a+b)
      if(p>best) {best=p;arm=c}
    }
    wins.set(arm,wins.get(arm)!+1)
  }
  // Lấy mẫu categorical từ phân bố đã tính: xác suất ghi đúng với phép lấy mẫu này.
  const probs=ds.map(c=>0.9*wins.get(c)!/256+0.1/ds.length),u=rng();let sum=0
  for(let i=0;i<ds.length;i++){sum+=probs[i]!;if(u<sum||i===ds.length-1)return {cach:ds[i]!,xacSuat:probs[i]!}}
  return null
}
