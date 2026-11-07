alter table public.atlax_private_records
  drop constraint if exists atlax_private_records_kind_check;

alter table public.atlax_private_records
  add constraint atlax_private_records_kind_check
  check (kind in ('profile', 'schedules', 'reports', 'rates', 'admin'));
