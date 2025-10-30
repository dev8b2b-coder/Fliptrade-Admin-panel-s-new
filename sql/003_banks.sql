create table if not exists banks (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_banks_name on banks(name);
create index if not exists idx_banks_is_active on banks(is_active);


