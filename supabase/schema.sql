-- SIMAQ schema: jalankan satu kali dalam Supabase SQL Editor pada proyek BARU.
-- Tidak ada akun admin yang otomatis dibuat. Lihat README untuk bootstrap admin.
create extension if not exists pgcrypto;

create table public.organizations (id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now());
create table public.schools (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), name text not null, level text not null check(level in ('PAUD','TK','RA','SD','MI','SMP','MTs','SMA','MA','SMK','Lainnya')), created_at timestamptz not null default now());
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, organization_id uuid not null references public.organizations(id), school_id uuid references public.schools(id), role text not null check(role in ('yayasan','admin','guru','siswa','orang_tua')), full_name text not null, created_at timestamptz not null default now(), constraint school_requirement check ((role = 'yayasan' and school_id is null) or (role <> 'yayasan' and school_id is not null)));
create table public.students (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), school_id uuid not null references public.schools(id), profile_id uuid unique references public.profiles(id), full_name text not null, class_name text not null, target_surahs integer not null default 10 check(target_surahs between 1 and 114), active boolean not null default true, created_at timestamptz not null default now());
create table public.guardian_students (guardian_id uuid not null references public.profiles(id) on delete cascade, student_id uuid not null references public.students(id) on delete cascade, primary key(guardian_id,student_id));
create table public.targets (id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade, class_name text, title text not null, mode text not null check(mode in ('surah','juz','ayat')), surah_number integer check(surah_number between 1 and 114), juz_number integer check(juz_number between 1 and 30), ayah_from integer check(ayah_from >= 1), ayah_to integer check(ayah_to >= 1), semester text, created_at timestamptz not null default now(), check(ayah_to is null or ayah_from <= ayah_to),check((mode='juz' and juz_number is not null) or (mode in ('surah','ayat') and surah_number is not null)));
create table public.recitations (id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade, teacher_id uuid not null references public.profiles(id), date date not null default current_date, mode text not null check(mode in ('surah','juz','ayat')), surah_number integer check(surah_number between 1 and 114), surah_name text, juz_number integer check(juz_number between 1 and 30), ayah_from integer check(ayah_from >= 1), ayah_to integer check(ayah_to >= 1), fluency integer not null check(fluency between 1 and 5), tajwid integer not null check(tajwid between 1 and 5), makhraj integer not null check(makhraj between 1 and 5), status text not null check(status in ('murajaah','tuntas')), notes text not null default '', created_at timestamptz not null default now(), check(ayah_to is null or ayah_from <= ayah_to), check((mode='juz' and juz_number is not null) or (mode in ('surah','ayat') and surah_number is not null)));
create index idx_students_school on public.students(school_id);
create index idx_recitations_student_date on public.recitations(student_id,date desc);
create index idx_profiles_scope on public.profiles(organization_id,school_id);

-- SECURITY DEFINER helpers only read user role/scope; callers cannot assign these fields.
create or replace function public.my_role() returns text language sql stable security definer set search_path='' as $$select role from public.profiles where id=(select auth.uid())$$;
create or replace function public.my_org() returns uuid language sql stable security definer set search_path='' as $$select organization_id from public.profiles where id=(select auth.uid())$$;
create or replace function public.my_school() returns uuid language sql stable security definer set search_path='' as $$select school_id from public.profiles where id=(select auth.uid())$$;
create or replace function public.can_view_student(sid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.students s where s.id=sid and s.organization_id=public.my_org() and (
 (public.my_role()='yayasan') or
 (public.my_role() in ('admin','guru') and s.school_id=public.my_school()) or
 (public.my_role()='siswa' and s.profile_id=(select auth.uid())) or
 (public.my_role()='orang_tua' and exists(select 1 from public.guardian_students g where g.student_id=s.id and g.guardian_id=(select auth.uid())))
 ))$$;
create or replace function public.can_manage_student(sid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.students s where s.id=sid and s.organization_id=public.my_org() and ((public.my_role()='yayasan') or (public.my_role() in ('admin','guru') and s.school_id=public.my_school())))$$;

alter table public.organizations enable row level security;
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.guardian_students enable row level security;
alter table public.targets enable row level security;
alter table public.recitations enable row level security;

create policy org_view on public.organizations for select to authenticated using(id=public.my_org());
create policy school_view on public.schools for select to authenticated using(organization_id=public.my_org() and (public.my_role()='yayasan' or id=public.my_school()));
create policy profile_view on public.profiles for select to authenticated using(id=(select auth.uid()) or (organization_id=public.my_org() and (public.my_role()='admin' and school_id=public.my_school())));
create policy student_view on public.students for select to authenticated using(public.can_view_student(id));
create policy guardian_link_view on public.guardian_students for select to authenticated using(guardian_id=(select auth.uid()) or public.can_manage_student(student_id));
create policy target_view on public.targets for select to authenticated using(school_id in (select id from public.schools where organization_id=public.my_org() and (public.my_role()='yayasan' or id=public.my_school())));
create policy target_insert on public.targets for insert to authenticated with check((public.my_role()='yayasan' and school_id in (select id from public.schools where organization_id=public.my_org())) or (public.my_role()='admin' and school_id=public.my_school()));
create policy target_delete on public.targets for delete to authenticated using((public.my_role()='yayasan' and school_id in (select id from public.schools where organization_id=public.my_org())) or (public.my_role()='admin' and school_id=public.my_school()));
create policy recitation_view on public.recitations for select to authenticated using(public.can_view_student(student_id));
create policy recitation_insert on public.recitations for insert to authenticated with check(public.my_role()='guru' and teacher_id=(select auth.uid()) and public.can_manage_student(student_id));
-- Enrollment via browser is scoped by RLS; identity management via authorized Edge Function only.
create policy school_insert on public.schools for insert to authenticated
 with check (organization_id=public.my_org() and public.my_role()='yayasan');
create policy student_insert on public.students for insert to authenticated
 with check (
  organization_id=public.my_org() and
  exists(select 1 from public.schools s where s.id=school_id and s.organization_id=public.my_org()) and
  (public.my_role()='admin' and school_id=public.my_school())
 );
-- Ensure students and profiles cannot belong to an unrelated school/organization,
-- including operations performed via service-role server actions.
create or replace function public.assert_simaq_scope() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.school_id is not null and not exists
  (select 1 from public.schools s where s.id=new.school_id and s.organization_id=new.organization_id)
 then raise exception 'School and organization do not match'; end if;
 return new;
end; $$;
create trigger profile_scope_guard before insert or update on public.profiles
 for each row execute function public.assert_simaq_scope();
create trigger student_scope_guard before insert or update on public.students
 for each row execute function public.assert_simaq_scope();
create or replace function public.assert_recitation_scope() returns trigger
language plpgsql set search_path='' as $$
begin
 if not exists (
   select 1 from public.students s join public.profiles p on p.id=new.teacher_id
   where s.id=new.student_id and s.school_id=p.school_id
     and s.organization_id=p.organization_id and p.role='guru'
 ) then raise exception 'Teacher and student must be in the same school'; end if;
 return new;
end; $$;
create trigger recitation_scope_guard before insert or update on public.recitations
 for each row execute function public.assert_recitation_scope();

revoke all on public.organizations,public.schools,public.profiles,public.students,public.guardian_students,public.targets,public.recitations from anon;
revoke all on public.organizations,public.schools,public.profiles,public.students,public.guardian_students,public.targets,public.recitations from authenticated;
grant select on public.organizations,public.schools,public.profiles,public.students,public.guardian_students,public.targets,public.recitations to authenticated;
grant insert on public.schools,public.students to authenticated;
grant insert,delete on public.targets to authenticated;
grant insert on public.recitations to authenticated;
revoke all on function public.my_role(),public.my_org(),public.my_school(),public.can_view_student(uuid),public.can_manage_student(uuid) from public,anon;
grant execute on function public.my_role(),public.my_org(),public.my_school(),public.can_view_student(uuid),public.can_manage_student(uuid) to authenticated;

-- SQL initialization is intended for a NEW, empty Supabase project only.

-- Self registration, guarded by school approval. All fresh self-registered users start unapproved.
alter table public.profiles add column approved boolean not null default true;
alter table public.profiles add column rejected_at timestamptz;
create or replace function public.my_role() returns text language sql stable security definer set search_path='' as $$select case when approved and rejected_at is null then role else null end from public.profiles where id=(select auth.uid())$$;
create or replace function public.my_org() returns uuid language sql stable security definer set search_path='' as $$select case when approved and rejected_at is null then organization_id else null end from public.profiles where id=(select auth.uid())$$;
create or replace function public.my_school() returns uuid language sql stable security definer set search_path='' as $$select case when approved and rejected_at is null then school_id else null end from public.profiles where id=(select auth.uid())$$;
-- Public directory contains only school names and IDs (no student data).
create or replace function public.public_registration_schools() returns table(id uuid,name text,level text)
language sql stable security definer set search_path='' as $$select s.id,s.name,s.level from public.schools s order by s.name$$;
revoke all on function public.public_registration_schools() from public;
grant execute on function public.public_registration_schools() to anon,authenticated;
create or replace function public.register_simaq_identity() returns trigger language plpgsql security definer set search_path='' as $$
declare sid uuid; org uuid; requested_role text; nm text;
begin
 requested_role:=new.raw_user_meta_data->>'role';
 if requested_role is null or requested_role not in ('guru','orang_tua') then return new; end if;
 begin sid:=(new.raw_user_meta_data->>'school_id')::uuid; exception when others then raise exception 'Invalid school selection'; end;
 select organization_id into org from public.schools where id=sid;
 if org is null then raise exception 'School not found'; end if;
 nm:=left(trim(coalesce(new.raw_user_meta_data->>'full_name','')),150);
 if length(nm)<2 then raise exception 'Name is required'; end if;
 insert into public.profiles(id,organization_id,school_id,role,full_name,approved) values(new.id,org,sid,requested_role,nm,false);
 return new;
end;$$;
create trigger simaq_auth_self_registration after insert on auth.users for each row execute function public.register_simaq_identity();
-- Admin may list pending profiles from their own school; no access to student records is granted to pending accounts.
drop policy profile_view on public.profiles;
create policy profile_view on public.profiles for select to authenticated using(id=(select auth.uid()) or (organization_id=public.my_org() and (public.my_role()='admin' and school_id=public.my_school())));
-- Only school admins can review registration requests, and only for their own school.
-- Email verification is obtained from auth.users, never trusted from frontend input.
create or replace function public.school_registration_requests()
returns table(id uuid, full_name text, role text, email text, created_at timestamptz, registration_status text)
language plpgsql stable security definer set search_path='' as $$
begin
 if public.my_role() is distinct from 'admin' then raise exception 'Access denied'; end if;
 return query
 select p.id, p.full_name, p.role, u.email::text, p.created_at,
  case when p.rejected_at is not null then 'Ditolak'
       when p.approved then 'Aktif'
       when u.email_confirmed_at is null then 'Belum Verifikasi Email'
       else 'Menunggu Persetujuan Admin' end::text
 from public.profiles p join auth.users u on u.id=p.id
 where p.school_id=public.my_school() and p.organization_id=public.my_org()
 and p.role in ('guru','orang_tua')
 order by p.created_at desc;
end;$$;
revoke all on function public.school_registration_requests() from public;
grant execute on function public.school_registration_requests() to authenticated;

create or replace function public.approve_school_user(target_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if public.my_role() is distinct from 'admin' then raise exception 'Access denied'; end if;
 update public.profiles p set approved=true
 from auth.users u
 where p.id=target_id and u.id=p.id
   and u.email_confirmed_at is not null
   and p.school_id=public.my_school() and p.organization_id=public.my_org()
   and p.role in ('guru','orang_tua') and p.approved=false and p.rejected_at is null;
 if not found then raise exception 'Akun tidak ditemukan, ditolak, atau email belum diverifikasi'; end if;
 return true;
end;$$;
revoke all on function public.approve_school_user(uuid) from public;
grant execute on function public.approve_school_user(uuid) to authenticated;

create or replace function public.reject_school_user(target_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if public.my_role() is distinct from 'admin' then raise exception 'Access denied'; end if;
 update public.profiles set approved=false,rejected_at=now()
 where id=target_id and school_id=public.my_school() and organization_id=public.my_org()
 and role in ('guru','orang_tua') and approved=false and rejected_at is null;
 if not found then raise exception 'Pendaftaran tidak ditemukan atau tidak dapat ditolak'; end if;
 return true;
end;$$;
revoke all on function public.reject_school_user(uuid) from public;
grant execute on function public.reject_school_user(uuid) to authenticated;
