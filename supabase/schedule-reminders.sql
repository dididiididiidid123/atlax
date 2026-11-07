create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid)
from cron.job
where jobname = 'atlax-daily-tax-reminders';

select cron.schedule(
  'atlax-daily-tax-reminders',
  '5 0 * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'atlax_project_url'
      limit 1
    ) || '/functions/v1/tax-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'atlax_cron_secret'
        limit 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
