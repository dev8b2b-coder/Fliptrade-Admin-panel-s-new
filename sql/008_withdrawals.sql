create table if not exists withdrawals (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  amount decimal(15,2) not null,
  created_at timestamptz default now()
);

create index if not exists idx_withdrawals_date on withdrawals(date desc);


