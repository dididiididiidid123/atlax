import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

function dateInTimeZone(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function daysUntil(dueDate: string, today: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return NaN;
  const [dueYear, dueMonth, dueDay] = dueDate.split('-').map(Number);
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
  const due = Date.UTC(dueYear, dueMonth - 1, dueDay);
  if (new Date(due).toISOString().slice(0, 10) !== dueDate) return NaN;
  return (due - Date.UTC(todayYear, todayMonth - 1, todayDay)) / 86_400_000;
}

function decode(value: string) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

async function decryptRecord(ciphertext: string, iv: string) {
  const encodedKey = Deno.env.get('ATLAX_DATA_ENCRYPTION_KEY');
  if (!encodedKey) throw new Error('ATLAX_DATA_ENCRYPTION_KEY is not configured.');
  const rawKey = decode(encodedKey);
  if (rawKey.length !== 32) throw new Error('ATLAX_DATA_ENCRYPTION_KEY must decode to 32 bytes.');
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(iv) }, key, decode(ciphertext));
  return JSON.parse(new TextDecoder().decode(plaintext));
}

function safeTimezone(value: unknown) {
  if (value !== 'Asia/Jakarta' && value !== 'Asia/Makassar' && value !== 'Asia/Jayapura') {
    return 'Asia/Jakarta';
  }
  return value;
}

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed.', { status: 405 });
  const expectedSecret = Deno.env.get('ATLAX_CRON_SECRET');
  if (!expectedSecret || request.headers.get('x-cron-secret') !== expectedSecret) {
    return new Response('Unauthorized.', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const encryptionKey = Deno.env.get('ATLAX_DATA_ENCRYPTION_KEY');
  if (!supabaseUrl || !serviceKey || !encryptionKey) {
    return new Response('Supabase reminder configuration is incomplete.', { status: 500 });
  }

  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const subject = Deno.env.get('VAPID_SUBJECT');
  if (publicKey && privateKey && subject) webpush.setVapidDetails(subject, publicKey, privateKey);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: records, error: recordsError } = await admin.from('atlax_private_records')
    .select('user_id, kind, record_id, ciphertext, iv')
    .in('kind', ['profile', 'schedules']);
  if (recordsError) return new Response(`Unable to load reminder data: ${recordsError.message}`, { status: 500 });

  const byUser = new Map<string, { timezone: string; schedules: Record<string, unknown>[] }>();
  for (const record of records || []) {
    try {
      const value = await decryptRecord(record.ciphertext, record.iv);
      const account = byUser.get(record.user_id) || { timezone: 'Asia/Jakarta', schedules: [] };
      if (record.kind === 'profile') account.timezone = safeTimezone(value?.timezone);
      if (record.kind === 'schedules' && Array.isArray(value)) account.schedules = value;
      byUser.set(record.user_id, account);
    } catch (error) {
      console.error(`Unable to decrypt reminder record ${record.user_id}/${record.kind}:`, error);
    }
  }

  let created = 0;
  for (const [userId, account] of byUser) {
    const today = dateInTimeZone(account.timezone);
    for (const entry of account.schedules) {
      if (!entry || typeof entry !== 'object') continue;
      const schedule = entry as Record<string, unknown>;
      const scheduleId = String(schedule.id || '');
      const type = String(schedule.type || 'kewajiban pajak');
      const period = String(schedule.period || '');
      if (!scheduleId || scheduleId.length > 120 || type.length > 60 || period.length > 40) continue;

      const obligations = [
        { name: 'payment', label: 'pembayaran', due: schedule.payDue, completed: Boolean(schedule.paidAt) },
        { name: 'report', label: 'pelaporan', due: schedule.reportDue, completed: Boolean(schedule.reportedAt), notRequired: type === 'PPH25' },
      ];
      for (const obligation of obligations) {
        if (obligation.completed) {
          const { error: completionError } = await admin.from('atlax_notifications')
            .update({status: 'SELESAI', read_at: new Date().toISOString(), message: `Kewajiban ${obligation.label} ${type} masa ${period} telah diselesaikan.`})
            .eq('user_id', userId)
            .eq('schedule_id', scheduleId)
            .eq('obligation', obligation.name);
          if (completionError) console.error(`Unable to resolve reminder ${scheduleId}/${obligation.name}:`, completionError);
          continue;
        }
        if (obligation.notRequired || typeof obligation.due !== 'string') continue;
        const remainingDays = daysUntil(obligation.due, today);
        if (!Number.isFinite(remainingDays)) continue;
        const reminder = [7, 3, 1].includes(remainingDays);
        const overdue = remainingDays < 0;
        if (!reminder && !overdue) continue;

        const key = `${scheduleId}:${obligation.name}:${obligation.due}:${overdue ? 'late' : `before-${remainingDays}`}`;
        const title = overdue ? 'Kewajiban pajak terlambat' : `Pengingat ${obligation.name} pajak`;
        const message = overdue
          ? `${type} masa ${period}: tenggat ${obligation.label} telah lewat. Periksa dan tindak lanjuti melalui kanal resmi.`
          : `${type} masa ${period}: tenggat ${obligation.label} dalam ${remainingDays} hari (${obligation.due}).`;
        const { data: inserted, error: insertError } = await admin.from('atlax_notifications')
          .upsert({
            user_id: userId,
            dedup_key: key,
            schedule_id: scheduleId,
            obligation: obligation.name,
            due_date: obligation.due,
            status: overdue ? 'TERLAMBAT' : 'SEGERA JATUH TEMPO',
            title,
            message,
          }, {
            onConflict: 'user_id,dedup_key',
            ignoreDuplicates: true,
          })
          .select('id');
        if (insertError) {
          console.error(`Unable to store reminder ${key}:`, insertError);
          continue;
        }
        if (!inserted?.length) continue;
        created++;

        if (publicKey && privateKey && subject) {
          const { data: subscriptions, error: subscriptionError } = await admin.from('atlax_push_subscriptions')
            .select('endpoint, subscription')
            .eq('user_id', userId);
          if (subscriptionError) {
            console.error(`Unable to load push subscriptions for ${userId}:`, subscriptionError);
            continue;
          }
          const payload = JSON.stringify({
            title,
            message,
            tag: key,
            url: `./open-design-canvas.html?schedule=${encodeURIComponent(scheduleId)}&obligation=${obligation.name}`,
          });
          for (const subscription of subscriptions || []) {
            try {
              await webpush.sendNotification(subscription.subscription, payload);
            } catch (error) {
              console.error(`Push delivery failed for ${userId}:`, error);
              if (Number((error as { statusCode?: number }).statusCode) === 404
                || Number((error as { statusCode?: number }).statusCode) === 410) {
                await admin.from('atlax_push_subscriptions').delete().eq('endpoint', subscription.endpoint);
              }
            }
          }
        }
      }
    }
  }

  return Response.json({ created, checked: byUser.size });
});
