create table if not exists deposits (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  local_deposit decimal(15,2) default 0,
  usdt_deposit decimal(15,2) default 0,
  cash_deposit decimal(15,2) default 0,
  local_withdraw decimal(15,2) default 0,
  usdt_withdraw decimal(15,2) default 0,
  cash_withdraw decimal(15,2) default 0,
  submitted_by uuid not null references staff(id),
  submitted_by_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_deposits_date on deposits(date desc);
create index if not exists idx_deposits_submitted_by on deposits(submitted_by);
create index if not exists idx_deposits_created_at on deposits(created_at desc);


