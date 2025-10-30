-- Policies examples; adjust for your org's needs
create policy if not exists "Staff can view own deposits" on deposits
  for select using (
    submitted_by = auth.uid() or
    exists (
      select 1 from staff where staff.id = auth.uid() and staff.role in ('Super Admin', 'Admin')
    )
  );

create policy if not exists "Admins can view all staff" on staff
  for select using (
    id = auth.uid() or
    exists (
      select 1 from staff where staff.id = auth.uid() and staff.role in ('Super Admin', 'Admin', 'Manager')
    )
  );


