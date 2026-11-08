export const schools=[{id:'s1',name:'SD Islam Harapan',level:'SD/MI'},{id:'s2',name:'SMP Islam Harapan',level:'SMP/MTs'},{id:'s3',name:'SMA Islam Harapan',level:'SMA/MA'}]
export const students=[{id:'st1',full_name:'Ahmad Fauzan',class_name:'VIII A',school_id:'s2',target_surahs:10},{id:'st2',full_name:'Aisyah Zahra',class_name:'VIII A',school_id:'s2',target_surahs:12},{id:'st3',full_name:'Muhammad Rafi',class_name:'V B',school_id:'s1',target_surahs:8},{id:'st4',full_name:'Naila Putri',class_name:'X A',school_id:'s3',target_surahs:15}]
export const demoRecords=[
 {id:'r1',student_id:'st1',surah_number:67,surah_name:'Al-Mulk',ayah_from:1,ayah_to:10,juz_number:29,status:'murajaah',fluency:3,tajwid:4,makhraj:3,notes:'Ulangi ayat 7–8 dan perhatikan makhraj.',date:'2026-10-26'},
 {id:'r2',student_id:'st1',surah_number:1,surah_name:'Al-Fatihah',ayah_from:1,ayah_to:7,juz_number:1,status:'tuntas',fluency:5,tajwid:5,makhraj:5,notes:'Hafalan baik, lanjutkan murajaah rutin.',date:'2026-10-22'},
 {id:'r3',student_id:'st2',surah_number:78,surah_name:'An-Naba',ayah_from:1,ayah_to:20,juz_number:30,status:'tuntas',fluency:4,tajwid:4,makhraj:4,notes:'Pertahankan.',date:'2026-10-25'},
 {id:'r4',student_id:'st3',surah_number:112,surah_name:'Al-Ikhlas',ayah_from:1,ayah_to:4,juz_number:30,status:'tuntas',fluency:5,tajwid:5,makhraj:4,notes:'Bagus.',date:'2026-10-24'},
 {id:'r5',student_id:'st4',surah_number:36,surah_name:'Ya-Sin',ayah_from:1,ayah_to:12,juz_number:22,status:'murajaah',fluency:3,tajwid:3,makhraj:3,notes:'Perbaiki panjang pendek.',date:'2026-10-24'}
]
export const demoProfile = role=>({id:'demo',full_name:({yayasan:'Admin Yayasan',admin:'Admin Sekolah',guru:'Ustazah Rahma',siswa:'Ahmad Fauzan',orang_tua:'Orang Tua Ahmad'})[role],role,school_id:'s2'})
export const roles=[{id:'yayasan',label:'Yayasan'},{id:'admin',label:'Admin Sekolah'},{id:'guru',label:'Guru Tahfiz'},{id:'siswa',label:'Siswa'},{id:'orang_tua',label:'Orang Tua'}]
