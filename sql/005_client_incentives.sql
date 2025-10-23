create table if not exists client_incentives (
  id uuid primary key default uuid_generate_v4(),
  deposit_id uuid not null references deposits(id) on delete cascade,
  client_name text not null,
  amount decimal(15,2) not null,
  created_at timestamptz default now()
);

create index if not exists idx_client_incentives_deposit_id on client_incentives(deposit_id);
create index if not exists idx_client_incentives_client_name on client_incentives(client_name);


