create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  deposit_id uuid not null references deposits(id) on delete cascade,
  type text not null check (type in ('Promotion', 'Salary', 'Miscellaneous', 'IB Commission', 'Travel Expense')),
  amount decimal(15,2) not null,
  description text,
  created_at timestamptz default now()
);

create index if not exists idx_expenses_deposit_id on expenses(deposit_id);
create index if not exists idx_expenses_type on expenses(type);


