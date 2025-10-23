-- Enable uuid extension if not enabled
create extension if not exists "uuid-ossp";

create table if not exists staff (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('Super Admin', 'Admin', 'Manager', 'Accountant', 'Viewer')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  avatar text,
  is_archived boolean default false,
  archived_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_login timestamptz
);

create index if not exists idx_staff_email on staff(email);
create index if not exists idx_staff_status on staff(status);
create index if not exists idx_staff_role on staff(role);


