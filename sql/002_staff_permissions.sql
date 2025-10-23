create table if not exists staff_permissions (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid not null references staff(id) on delete cascade,
  module text not null check (module in ('dashboard', 'deposits', 'bankDeposits', 'staffManagement')),
  can_view boolean default false,
  can_add boolean default false,
  can_edit boolean default false,
  can_delete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(staff_id, module)
);

create index if not exists idx_staff_permissions_staff_id on staff_permissions(staff_id);
create index if not exists idx_staff_permissions_module on staff_permissions(module);


