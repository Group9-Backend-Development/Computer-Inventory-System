/**
 * Professional demo data seeder for the Computer Inventory System.
 *
 * Usage:
 *   node scripts/seed-demo.js
 *
 * Requires:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_DOCUMENTS_BUCKET optional, defaults to "documents"
 */
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 10;
const DOCUMENTS_BUCKET = process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents';
const SEED_PREFIX = '[seed-demo]';

const USERS = [
  {
    key: 'admin',
    email: 'admin@cis.test',
    password: 'admin123',
    role: 'admin',
    is_enabled: true,
  },
  {
    key: 'technicianLead',
    email: 'lead.tech@cis.test',
    password: 'tech123',
    role: 'technician',
    is_enabled: true,
  },
  {
    key: 'technicianOne',
    email: 'technician.one@cis.test',
    password: 'tech123',
    role: 'technician',
    is_enabled: true,
  },
  {
    key: 'disabledTechnician',
    email: 'disabled.tech@cis.test',
    password: 'disabled123',
    role: 'technician',
    is_enabled: false,
  },
];

const ITEMS = [
  {
    key: 'availableLaptop',
    item_id: 'SEED-LAP-001',
    serial_number: 'SEED-SN-LAP-001',
    model: 'Latitude 5440',
    brand: 'Dell',
    classification: 'Computer',
    category: 'Laptop',
    status: 'Available',
    date_acquired: '2024-03-15T00:00:00.000Z',
    is_deleted: false,
  },
  {
    key: 'availableMonitor',
    item_id: 'SEED-MON-001',
    serial_number: 'SEED-SN-MON-001',
    model: 'UltraSharp U2422H',
    brand: 'Dell',
    classification: 'Peripheral',
    category: 'Monitor',
    status: 'Available',
    date_acquired: '2025-01-10T00:00:00.000Z',
    is_deleted: false,
  },
  {
    key: 'inUseLaptop',
    item_id: 'SEED-LAP-002',
    serial_number: 'SEED-SN-LAP-002',
    model: 'ThinkPad T14 Gen 3',
    brand: 'Lenovo',
    classification: 'Computer',
    category: 'Laptop',
    status: 'In-Use',
    date_acquired: '2022-08-20T00:00:00.000Z',
    is_deleted: false,
  },
  {
    key: 'inUseDesktop',
    item_id: 'SEED-DESK-001',
    serial_number: 'SEED-SN-DESK-001',
    model: 'OptiPlex 7010',
    brand: 'Dell',
    classification: 'Computer',
    category: 'Desktop',
    status: 'In-Use',
    date_acquired: '2021-02-05T00:00:00.000Z',
    is_deleted: false,
  },
  {
    key: 'maintenanceServer',
    item_id: 'SEED-SRV-001',
    serial_number: 'SEED-SN-SRV-001',
    model: 'PowerEdge R350',
    brand: 'Dell',
    classification: 'Computer',
    category: 'Server',
    status: 'Maintenance',
    date_acquired: '2020-06-01T00:00:00.000Z',
    is_deleted: false,
  },
  {
    key: 'retiredKeyboard',
    item_id: 'SEED-KEY-001',
    serial_number: 'SEED-SN-KEY-001',
    model: 'K120',
    brand: 'Logitech',
    classification: 'Peripheral',
    category: 'Keyboard',
    status: 'Retired',
    date_acquired: '2019-09-12T00:00:00.000Z',
    is_deleted: false,
  },
  {
    key: 'softDeletedMouse',
    item_id: 'SEED-MOU-OLD',
    serial_number: 'SEED-SN-MOU-OLD',
    model: 'M100',
    brand: 'Logitech',
    classification: 'Peripheral',
    category: 'Mouse',
    status: 'Retired',
    date_acquired: '2018-04-10T00:00:00.000Z',
    is_deleted: true,
  },
];

const API_KEYS = [
  {
    label: 'Seed active integration',
    rawKey: 'cis_seed_active_demo_key_keep_private',
    createdBy: 'admin',
    is_revoked: false,
  },
  {
    label: 'Seed revoked integration',
    rawKey: 'cis_seed_revoked_demo_key_keep_private',
    createdBy: 'admin',
    is_revoked: true,
  },
  {
    label: 'Seed disabled-user integration',
    rawKey: 'cis_seed_disabled_user_key_keep_private',
    createdBy: 'disabledTechnician',
    is_revoked: true,
  },
];

const DOCUMENTS = [
  {
    key: 'checkoutLeadLaptop',
    path: 'seed-demo/checkout-lead-laptop.txt',
    body: 'Checkout reference: Lenovo ThinkPad assigned to lead technician.',
  },
  {
    key: 'checkoutDesktop',
    path: 'seed-demo/checkout-desktop.txt',
    body: 'Checkout reference: Dell OptiPlex assigned for lab deployment.',
  },
  {
    key: 'checkoutCompleted',
    path: 'seed-demo/checkout-completed-monitor.txt',
    body: 'Checkout reference: Dell monitor assigned for temporary project.',
  },
  {
    key: 'checkinCompleted',
    path: 'seed-demo/checkin-completed-monitor.txt',
    body: 'Return inspection: Dell monitor returned in good condition.',
  },
];

function required(name) {
  const value = process.env[name];
  if (!value || value === 'change-me-in-production') {
    throw new Error(`Set ${name} in .env before running the demo seeder`);
  }
  return value;
}

function supabaseUrl(raw) {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}.supabase.co`;
}

function hashApiKey(raw) {
  return crypto.createHash('sha256').update(String(raw).trim()).digest('hex');
}

async function upsertUsers(supabase) {
  const usersByKey = {};

  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          email: user.email,
          password_hash: passwordHash,
          role: user.role,
          is_enabled: user.is_enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select('id, email, role, is_enabled')
      .single();

    if (error) {
      throw new Error(`Failed to upsert user ${user.email}: ${error.message}`);
    }

    usersByKey[user.key] = data;
  }

  return usersByKey;
}

async function upsertItems(supabase) {
  const itemsByKey = {};

  for (const item of ITEMS) {
    const { key, ...payload } = item;
    const { data, error } = await supabase
      .from('items')
      .upsert(
        {
          ...payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'item_id' }
      )
      .select('id, item_id, status, is_deleted')
      .single();

    if (error) {
      throw new Error(`Failed to upsert item ${item.item_id}: ${error.message}`);
    }

    itemsByKey[key] = data;
  }

  return itemsByKey;
}

async function ensureBucket(supabase) {
  const { data: existing, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Failed to list storage buckets: ${listError.message}`);
  }

  if (existing.some((bucket) => bucket.name === DOCUMENTS_BUCKET)) {
    return;
  }

  const { error } = await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  });

  if (error) {
    throw new Error(`Failed to create storage bucket ${DOCUMENTS_BUCKET}: ${error.message}`);
  }
}

async function uploadDocuments(supabase) {
  const documentPaths = {};

  for (const document of DOCUMENTS) {
    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(document.path, Buffer.from(document.body), {
        contentType: 'text/plain',
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload ${document.path}: ${error.message}`);
    }

    documentPaths[document.key] = document.path;
  }

  return documentPaths;
}

async function refreshSeedTransactions(supabase, itemsByKey, usersByKey, documentPaths) {
  const itemIds = Object.values(itemsByKey).map((item) => item.id);
  const { error: deleteError } = await supabase
    .from('transactions')
    .delete()
    .in('item_id', itemIds)
    .ilike('note', `${SEED_PREFIX}%`);

  if (deleteError) {
    throw new Error(`Failed to refresh seed transactions: ${deleteError.message}`);
  }

  const transactions = [
    {
      item_id: itemsByKey.inUseLaptop.id,
      type: 'checkout',
      assignee_id: usersByKey.technicianLead.id,
      performed_by_id: usersByKey.admin.id,
      document_path: documentPaths.checkoutLeadLaptop,
      note: `${SEED_PREFIX} Active checkout for user audit and item history.`,
      created_at: '2026-02-01T09:00:00.000Z',
      updated_at: '2026-02-01T09:00:00.000Z',
    },
    {
      item_id: itemsByKey.inUseDesktop.id,
      type: 'checkout',
      assignee_id: usersByKey.technicianOne.id,
      performed_by_id: usersByKey.admin.id,
      document_path: documentPaths.checkoutDesktop,
      note: `${SEED_PREFIX} Active checkout for deployed asset reporting.`,
      created_at: '2026-03-05T10:30:00.000Z',
      updated_at: '2026-03-05T10:30:00.000Z',
    },
    {
      item_id: itemsByKey.availableMonitor.id,
      type: 'checkout',
      assignee_id: usersByKey.technicianOne.id,
      performed_by_id: usersByKey.technicianLead.id,
      document_path: documentPaths.checkoutCompleted,
      note: `${SEED_PREFIX} Completed checkout history sample.`,
      created_at: '2026-01-10T08:30:00.000Z',
      updated_at: '2026-01-10T08:30:00.000Z',
    },
    {
      item_id: itemsByKey.availableMonitor.id,
      type: 'checkin',
      assignee_id: usersByKey.technicianOne.id,
      performed_by_id: usersByKey.technicianLead.id,
      document_path: documentPaths.checkinCompleted,
      note: `${SEED_PREFIX} Completed return inspection sample.`,
      created_at: '2026-01-17T16:45:00.000Z',
      updated_at: '2026-01-17T16:45:00.000Z',
    },
  ];

  const { error } = await supabase.from('transactions').insert(transactions);
  if (error) {
    throw new Error(`Failed to insert seed transactions: ${error.message}`);
  }
}

async function upsertApiKeys(supabase, usersByKey) {
  for (const apiKey of API_KEYS) {
    const keyHash = hashApiKey(apiKey.rawKey);
    const { data: existing, error: findError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('key_hash', keyHash)
      .maybeSingle();

    if (findError) {
      throw new Error(`Failed to check API key ${apiKey.label}: ${findError.message}`);
    }

    const payload = {
      key_hash: keyHash,
      label: apiKey.label,
      created_by_id: usersByKey[apiKey.createdBy].id,
      is_revoked: apiKey.is_revoked,
      updated_at: new Date().toISOString(),
    };

    const query = existing
      ? supabase.from('api_keys').update(payload).eq('id', existing.id)
      : supabase.from('api_keys').insert(payload);

    const { error } = await query;
    if (error) {
      throw new Error(`Failed to upsert API key ${apiKey.label}: ${error.message}`);
    }
  }
}

function printSummary() {
  console.log('Seed complete.');
  console.log('');
  console.log('Login accounts:');
  for (const user of USERS) {
    console.log(`- ${user.email} / ${user.password} (${user.role}, ${user.is_enabled ? 'enabled' : 'disabled'})`);
  }
  console.log('');
  console.log('API keys for testing:');
  for (const apiKey of API_KEYS) {
    console.log(`- ${apiKey.label}: ${apiKey.rawKey} (${apiKey.is_revoked ? 'revoked' : 'active'})`);
  }
  console.log('');
  console.log('Seeded coverage: users, roles, disabled account, active/revoked API keys, available/in-use/maintenance/retired/soft-deleted items, aging assets, completed history, active checkouts, and Supabase Storage documents.');
}

async function main() {
  const url = required('SUPABASE_URL');
  const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl(url), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await ensureBucket(supabase);
  const usersByKey = await upsertUsers(supabase);
  const itemsByKey = await upsertItems(supabase);
  const documentPaths = await uploadDocuments(supabase);
  await refreshSeedTransactions(supabase, itemsByKey, usersByKey, documentPaths);
  await upsertApiKeys(supabase, usersByKey);
  printSummary();
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
