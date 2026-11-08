const endpoint='https://api.alquran.cloud/v1'
const check = async path => {
 const controller = new AbortController();const id=setTimeout(()=>controller.abort(),12000)
 try {const res=await fetch(`${endpoint}${path}`,{signal:controller.signal});if(!res.ok)throw new Error('Layanan Al-Qur’an tidak tersedia');const body=await res.json();if(body.code!==200)throw new Error('Respons Al-Qur’an gagal');return body.data}finally{clearTimeout(id)}
}
export const getSurahs=()=>check('/surah')
export const getSurah=n=>check(`/surah/${n}/ar.uthmani`)
export const getJuz=n=>check(`/juz/${n}/ar.uthmani`)
