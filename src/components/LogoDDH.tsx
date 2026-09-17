export default function LogoDDH({size=48,className=''}:{size?:number;className?:string}) {
  return <img src={`${import.meta.env.BASE_URL}logo-gv-192-v2.png`} width={size} height={size} className={className} alt="Đỗ Đại Học" />
}
