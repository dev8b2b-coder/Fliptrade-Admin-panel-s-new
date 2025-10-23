create table if not exists bank_transactions (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  bank_id uuid not null references banks(id),
  deposit decimal(15,2) default 0,
  withdraw decimal(15,2) default 0,
  pnl decimal(15,2) default 0,
  remaining decimal(15,2) not null,
  submitted_by uuid not null references staff(id),
  submitted_by_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_bank_transactions_date on bank_transactions(date desc);
create index if not exists idx_bank_transactions_bank_id on bank_transactions(bank_id);
create index if not exists idx_bank_transactions_submitted_by on bank_transactions(submitted_by);
create index if not exists idx_bank_transactions_created_at on bank_transactions(created_at desc);


