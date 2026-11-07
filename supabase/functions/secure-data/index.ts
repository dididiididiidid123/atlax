import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};

function responseHeaders(request: Request) {
  const origin = request.headers.get('origin') || '';
  const allowed = (Deno.env.get('ATLAX_ALLOWED_ORIGINS') || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  const localDevelopmentOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const allowOrigin = allowed.includes(origin) || (allowed.length === 0 && localDevelopmentOrigin) ? origin : 'null';
  return { ...corsHeaders, 'Access-Control-Allow-Origin': allowOrigin };
}

function jsonResponse(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...responseHeaders(request), 'Content-Type': 'application/json' },
  });
}

function encode(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary);
}

function decode(value: string) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

async function encryptionKey() {
  const encoded = Deno.env.get('ATLAX_DATA_ENCRYPTION_KEY');
  if (!encoded) throw new Error('ATLAX_DATA_ENCRYPTION_KEY is not configured.');
  const raw = decode(encoded);
  if (raw.length !== 32) throw new Error('ATLAX_DATA_ENCRYPTION_KEY must decode to 32 bytes.');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encrypt(value: unknown) {
  const key = await encryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return { ciphertext: encode(new Uint8Array(ciphertext)), iv: encode(iv) };
}

async function decrypt(ciphertext: string, iv: string) {
  const key = await encryptionKey();
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(iv) }, key, decode(ciphertext));
  return JSON.parse(new TextDecoder().decode(plaintext));
}

function isRecordKind(value: unknown): value is 'profile' | 'schedules' | 'reports' | 'rates' | 'admin' {
  return value === 'profile' || value === 'schedules' || value === 'reports' || value === 'rates' || value === 'admin';
}

function isSupportedPushEndpoint(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:'
      && !url.username
      && !url.password
      && (host === 'fcm.googleapis.com'
        || host === 'web.push.apple.com'
        || host.endsWith('.push.services.mozilla.com'));
  } catch {
    return false;
  }
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: responseHeaders(request) });
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '');
  if (!token) return jsonResponse(request, { error: 'Authentication required.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return jsonResponse(request, { error: 'Supabase server configuration is incomplete.' }, 500);
  }

  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return jsonResponse(request, { error: 'Invalid or expired session.' }, 401);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const body = await request.json();
    if (JSON.stringify(body).length > 1_000_000) {
      return jsonResponse(request, { error: 'Payload exceeds the 1 MB limit.' }, 413);
    }

    if (body.action === 'put') {
      if (!isRecordKind(body.kind) || typeof body.id !== 'string' || !body.id || body.id.length > 120 || body.data === undefined) {
        return jsonResponse(request, { error: 'Invalid record payload.' }, 400);
      }
      const sealed = await encrypt(body.data);
      const { error } = await admin.from('atlax_private_records').upsert({
        user_id: user.id,
        kind: body.kind,
        record_id: body.id,
        ...sealed,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return jsonResponse(request, { saved: true });
    }

    if (body.action === 'get') {
      if (!isRecordKind(body.kind) || typeof body.id !== 'string') {
        return jsonResponse(request, { error: 'Invalid record key.' }, 400);
      }
      const { data, error } = await admin.from('atlax_private_records')
        .select('ciphertext, iv')
        .eq('user_id', user.id)
        .eq('kind', body.kind)
        .eq('record_id', body.id)
        .maybeSingle();
      if (error) throw error;
      return jsonResponse(request, { data: data ? await decrypt(data.ciphertext, data.iv) : null });
    }

    if (body.action === 'register-push') {
      const subscription = body.subscription;
      if (!isSupportedPushEndpoint(subscription?.endpoint)
        || typeof subscription?.keys?.p256dh !== 'string' || typeof subscription?.keys?.auth !== 'string') {
        return jsonResponse(request, { error: 'Invalid push subscription.' }, 400);
      }
      const { error } = await admin.from('atlax_push_subscriptions').upsert({
        endpoint: subscription.endpoint,
        user_id: user.id,
        subscription,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return jsonResponse(request, { registered: true });
    }

    if (body.action === 'unregister-push') {
      if (!isSupportedPushEndpoint(body.endpoint)) {
        return jsonResponse(request, { error: 'Invalid push endpoint.' }, 400);
      }
      const { error } = await admin.from('atlax_push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', body.endpoint);
      if (error) throw error;
      return jsonResponse(request, { removed: true });
    }

    if (body.action === 'list-notifications') {
      const { data, error } = await admin.from('atlax_notifications')
        .select('id, schedule_id, obligation, due_date, status, title, message, created_at, read_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return jsonResponse(request, {
        notifications: (data || []).map(item => ({
          id: item.id,
          scheduleId: item.schedule_id,
          obligation: item.obligation,
          dueDate: item.due_date,
          status: item.status,
          title: item.title,
          message: item.message,
          createdAt: item.created_at,
          readAt: item.read_at,
        })),
      });
    }

    if (body.action === 'mark-notifications-read') {
      const { error } = await admin.from('atlax_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);
      if (error) throw error;
      return jsonResponse(request, { updated: true });
    }

    if (body.action === 'resolve-schedule-notifications') {
      if (typeof body.scheduleId !== 'string' || !body.scheduleId || body.scheduleId.length > 120) {
        return jsonResponse(request, { error: 'Invalid schedule ID.' }, 400);
      }
      const completed = [
        ...(body.paymentComplete === true ? ['payment'] : []),
        ...(body.reportComplete === true ? ['report'] : []),
      ];
      for (const [field, value] of [['payDue', body.payDue], ['reportDue', body.reportDue]] as const) {
        if (value !== null && value !== undefined
          && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))) {
          return jsonResponse(request, { error: `Invalid ${field}.` }, 400);
        }
      }

      const { data: notifications, error: listError } = await admin.from('atlax_notifications')
        .select('id, obligation, due_date')
        .eq('user_id', user.id)
        .eq('schedule_id', body.scheduleId);
      if (listError) throw listError;

      const finishedIds = (notifications || [])
        .filter(item => completed.includes(item.obligation))
        .map(item => item.id);
      if (finishedIds.length) {
        const { error } = await admin.from('atlax_notifications')
          .update({
            status: 'SELESAI',
            read_at: new Date().toISOString(),
            message: 'Kewajiban ini telah diselesaikan.',
          })
          .eq('user_id', user.id)
          .in('id', finishedIds);
        if (error) throw error;
      }

      const changedDeadlineIds = (notifications || [])
        .filter(item => !completed.includes(item.obligation)
          && (item.obligation === 'payment' || item.obligation === 'report')
          && item.due_date !== (item.obligation === 'payment' ? body.payDue : body.reportDue))
        .map(item => item.id);
      if (changedDeadlineIds.length) {
        const { error } = await admin.from('atlax_notifications')
          .update({
            status: 'TENGGAT DIPERBARUI',
            read_at: new Date().toISOString(),
            message: 'Tenggat kewajiban ini telah diperbarui. Lihat jadwal terbaru di ATLAX.',
          })
          .eq('user_id', user.id)
          .in('id', changedDeadlineIds);
        if (error) throw error;
      }
      return jsonResponse(request, { updated: true });
    }

    if (body.action === 'archive-schedule-notifications') {
      if (typeof body.scheduleId !== 'string' || !body.scheduleId || body.scheduleId.length > 120) {
        return jsonResponse(request, { error: 'Invalid schedule ID.' }, 400);
      }
      const { error } = await admin.from('atlax_notifications')
        .update({
          status: 'JADWAL DIHAPUS',
          read_at: new Date().toISOString(),
          message: 'Jadwal kewajiban ini telah dihapus.',
        })
        .eq('user_id', user.id)
        .eq('schedule_id', body.scheduleId);
      if (error) throw error;
      return jsonResponse(request, { updated: true });
    }

    return jsonResponse(request, { error: 'Unsupported action.' }, 400);
  } catch (error) {
    console.error('secure-data request failed:', error);
    return jsonResponse(request, { error: error instanceof Error ? error.message : 'Secure storage failed.' }, 500);
  }
});
