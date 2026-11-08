// SIMAQ — secure server-side account administration. Deploy with Verify JWT ON.
// Set SIMAQ_AUTO_CONFIRM_USERS=true ONLY on an isolated TEST project with controlled emails.
import { createClient } from 'npm:@supabase/supabase-js@2';
const cors = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'authorization, x-client-info, apikey, content-type', 'content-type':'application/json' };
const reply = (data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});
const uid = (v:unknown)=> /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return reply({error:'Metode tidak diizinkan'},405);
 try {
  const url=Deno.env.get('SUPABASE_URL');
  const anon=Deno.env.get('SUPABASE_ANON_KEY');
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!anon||!key)return reply({error:'Konfigurasi server belum lengkap'},503);
  const bearer=req.headers.get('Authorization')||'';
  if(!bearer.startsWith('Bearer '))return reply({error:'Login diperlukan'},401);
  const caller=createClient(url,anon,{global:{headers:{Authorization:bearer}},auth:{autoRefreshToken:false,persistSession:false}});
  const {data:{user},error:sessionErr}=await caller.auth.getUser();
  if(sessionErr||!user)return reply({error:'Sesi berakhir, silakan login kembali'},401);
  const server=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:actor,error:actorErr}=await server.from('profiles').select('id,role,organization_id,school_id,approved,rejected_at').eq('id',user.id).maybeSingle();
  if(actorErr||!actor||!['yayasan','admin'].includes(actor.role)||!actor.approved||actor.rejected_at)return reply({error:'Akses ditolak'},403);
  const body=await req.json();
  if(!body||typeof body!=='object')return reply({error:'Permintaan tidak valid'},400);
  if(body.action==='link_guardian'){
   if(actor.role!=='admin')return reply({error:'Hanya Admin Sekolah boleh menghubungkan wali dan siswa'},403);
   if(!uid(body.guardian_id)||!uid(body.student_id))return reply({error:'Pilih wali dan siswa'},400);
   const {data:guardian}=await server.from('profiles').select('role,organization_id,school_id,approved,rejected_at').eq('id',body.guardian_id).maybeSingle();
   const {data:student}=await server.from('students').select('school_id,organization_id').eq('id',body.student_id).maybeSingle();
   if(!guardian||!student||guardian.role!=='orang_tua'||!guardian.approved||guardian.rejected_at||guardian.organization_id!==actor.organization_id||student.organization_id!==actor.organization_id||guardian.school_id!==student.school_id)return reply({error:'Wali dan siswa harus dari sekolah yang sama'},403);
   if(actor.role==='admin'&&student.school_id!==actor.school_id)return reply({error:'Sekolah di luar kewenangan'},403);
   const {error}=await server.from('guardian_students').upsert({guardian_id:body.guardian_id,student_id:body.student_id},{onConflict:'guardian_id,student_id'});
   return error?reply({error:'Gagal menghubungkan wali'},400):reply({ok:true});
  }
  if(body.action==='create_user'){
   const role=String(body.role||'');
   if(!((actor.role==='yayasan'&&role==='admin')||(actor.role==='admin'&&role==='siswa')))return reply({error:'Peran tidak diizinkan'},403);
   const school_id=actor.role==='admin'?actor.school_id:String(body.school_id||'');
   if(!uid(school_id))return reply({error:'Pilih sekolah'},400);
   const {data:school}=await server.from('schools').select('id,organization_id').eq('id',school_id).maybeSingle();
   if(!school||school.organization_id!==actor.organization_id)return reply({error:'Sekolah tidak sesuai organisasi'},403);
   const full_name=String(body.full_name||'').trim();
   const email=String(body.email||'').trim().toLowerCase();
   const password=String(body.password||'');
   const autoConfirm=Deno.env.get('SIMAQ_AUTO_CONFIRM_USERS')==='true';
   if(full_name.length<2||full_name.length>150||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||(autoConfirm&&(password.length<12||password.length>128)))return reply({error:'Nama, email, atau password pengujian tidak valid'},400);
   let targetStudent=null;
   if(role==='siswa'){
    if(!uid(body.student_id))return reply({error:'Pilih data siswa'},400);
    const {data}=await server.from('students').select('id,school_id,organization_id,profile_id').eq('id',body.student_id).maybeSingle();
    if(!data||data.school_id!==school_id||data.organization_id!==actor.organization_id||data.profile_id)return reply({error:'Siswa tidak ditemukan atau sudah memiliki akun'},400);
    targetStudent=data;
   }
   const {data:created,error:creationErr}=autoConfirm
    ? await server.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name}})
    : await server.auth.admin.inviteUserByEmail(email,{redirectTo:Deno.env.get('SIMAQ_SITE_URL')||undefined,data:{full_name}});
   if(creationErr||!created.user)return reply({error:creationErr?.message||'Gagal membuat akun'},400);
   const newId=created.user.id;
   try{
    const {error:profileErr}=await server.from('profiles').insert({id:newId,organization_id:actor.organization_id,school_id,role,full_name});
    if(profileErr)throw profileErr;
    if(targetStudent){
     const {data:linked,error:linkErr}=await server.from('students').update({profile_id:newId}).eq('id',targetStudent.id).is('profile_id',null).select('id');
     if(linkErr||!linked?.length)throw new Error('Siswa sudah ditautkan oleh proses lain');
    }
   }catch(e){ await server.auth.admin.deleteUser(newId);throw e; }
   return reply({ok:true,user_id:newId,confirmed:autoConfirm,invited:!autoConfirm});
  }
  return reply({error:'Tindakan tidak dikenal'},400);
 }catch(err){
  // Avoid exposing database internals or stack traces.
  console.error('manage-simaq-users failed',err);
  return reply({error:'Terjadi kesalahan pada server. Periksa Edge Function Logs.'},500);
 }
});
