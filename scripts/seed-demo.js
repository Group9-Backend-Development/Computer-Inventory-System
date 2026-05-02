/**
 * Professional demo data seeder for the Computer Inventory System.
 *
 * Usage:
 *   node scripts/seed-demo.js
 *
 * Requires:
 *   MONGODB_URI
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_DOCUMENTS_BUCKET optional, defaults to "documents"
 *
 * Optional:
 *   SEED_SKIP_STORAGE=true  — seed MongoDB only (no Supabase uploads; transaction paths point at object keys only).
 */
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Item = require('../src/models/Item');
const Transaction = require('../src/models/Transaction');
const ApiKey = require('../src/models/ApiKey');

const SALT_ROUNDS = 10;
const DOCUMENTS_BUCKET = process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents';
const SEED_PREFIX = '[seed-demo]';
const skipStorage = process.env.SEED_SKIP_STORAGE === 'true';

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

function seedNoteRegex() {
  const escaped = SEED_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped);
}

async function upsertUsers() {
  const usersByKey = {};

  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
    const doc = await User.findOneAndUpdate(
      { email: user.email.toLowerCase() },
      {
        $set: {
          passwordHash,
          role: user.role,
          isEnabled: user.is_enabled,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    usersByKey[user.key] = { id: String(doc._id), email: doc.email, role: doc.role, is_enabled: doc.isEnabled };
  }

  return usersByKey;
}

async function upsertItems() {
  const itemsByKey = {};

  for (const item of ITEMS) {
    const { key, ...rest } = item;
    const doc = await Item.findOneAndUpdate(
      { itemId: rest.item_id },
      {
        $set: {
          serialNumber: rest.serial_number,
          model: rest.model,
          brand: rest.brand,
          classification: rest.classification,
          category: rest.category,
          status: rest.status,
          dateAcquired: new Date(rest.date_acquired),
          isDeleted: rest.is_deleted,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    itemsByKey[key] = {
      id: String(doc._id),
      item_id: doc.itemId,
      status: doc.status,
      is_deleted: doc.isDeleted,
    };
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

async function refreshSeedTransactions(itemsByKey, usersByKey, documentPaths) {
  const itemIds = Object.values(itemsByKey).map((row) => row.id);
  const itemObjectIds = itemIds.map((id) => new mongoose.Types.ObjectId(id));

  await Transaction.deleteMany({
    item: { $in: itemObjectIds },
    note: seedNoteRegex(),
  });

  const rows = [
    {
      item: new mongoose.Types.ObjectId(itemsByKey.inUseLaptop.id),
      type: 'checkout',
      assignee: new mongoose.Types.ObjectId(usersByKey.technicianLead.id),
      performedBy: new mongoose.Types.ObjectId(usersByKey.admin.id),
      documentPath: documentPaths.checkoutLeadLaptop,
      note: `${SEED_PREFIX} Active checkout for user audit and item history.`,
      createdAt: new Date('2026-02-01T09:00:00.000Z'),
      updatedAt: new Date('2026-02-01T09:00:00.000Z'),
    },
    {
      item: new mongoose.Types.ObjectId(itemsByKey.inUseDesktop.id),
      type: 'checkout',
      assignee: new mongoose.Types.ObjectId(usersByKey.technicianOne.id),
      performedBy: new mongoose.Types.ObjectId(usersByKey.admin.id),
      documentPath: documentPaths.checkoutDesktop,
      note: `${SEED_PREFIX} Active checkout for deployed asset reporting.`,
      createdAt: new Date('2026-03-05T10:30:00.000Z'),
      updatedAt: new Date('2026-03-05T10:30:00.000Z'),
    },
    {
      item: new mongoose.Types.ObjectId(itemsByKey.availableMonitor.id),
      type: 'checkout',
      assignee: new mongoose.Types.ObjectId(usersByKey.technicianOne.id),
      performedBy: new mongoose.Types.ObjectId(usersByKey.technicianLead.id),
      documentPath: documentPaths.checkoutCompleted,
      note: `${SEED_PREFIX} Completed checkout history sample.`,
      createdAt: new Date('2026-01-10T08:30:00.000Z'),
      updatedAt: new Date('2026-01-10T08:30:00.000Z'),
    },
    {
      item: new mongoose.Types.ObjectId(itemsByKey.availableMonitor.id),
      type: 'checkin',
      assignee: new mongoose.Types.ObjectId(usersByKey.technicianOne.id),
      performedBy: new mongoose.Types.ObjectId(usersByKey.technicianLead.id),
      documentPath: documentPaths.checkinCompleted,
      note: `${SEED_PREFIX} Completed return inspection sample.`,
      createdAt: new Date('2026-01-17T16:45:00.000Z'),
      updatedAt: new Date('2026-01-17T16:45:00.000Z'),
    },
  ];

  await Transaction.insertMany(rows);
}

async function upsertApiKeys(usersByKey) {
  for (const apiKey of API_KEYS) {
    const keyHash = hashApiKey(apiKey.rawKey);
    const createdById = new mongoose.Types.ObjectId(usersByKey[apiKey.createdBy].id);

    const existing = await ApiKey.findOne({ keyHash }).lean();

    if (existing) {
      await ApiKey.updateOne(
        { _id: existing._id },
        {
          label: apiKey.label,
          createdBy: createdById,
          isRevoked: apiKey.is_revoked,
        }
      );
    } else {
      await ApiKey.create({
        keyHash,
        label: apiKey.label,
        createdBy: createdById,
        isRevoked: apiKey.is_revoked,
      });
    }
  }
}

function placeholderDocumentPaths() {
  return {
    checkoutLeadLaptop: DOCUMENTS[0].path,
    checkoutDesktop: DOCUMENTS[1].path,
    checkoutCompleted: DOCUMENTS[2].path,
    checkinCompleted: DOCUMENTS[3].path,
  };
}

function printSummary() {
  console.log('Seed complete.');
  if (skipStorage) {
    console.log('(Supabase Storage skipped: run full `npm run seed` after fixing credentials to upload seed files.)');
  }
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
  console.log(
    skipStorage
      ? 'Seeded coverage: users, roles, disabled account, active/revoked API keys, items, transactions, API keys (MongoDB only).'
      : 'Seeded coverage: users, roles, disabled account, active/revoked API keys, available/in-use/maintenance/retired/soft-deleted items, aging assets, completed history, active checkouts, and Supabase Storage documents.'
  );
}

async function main() {
  const mongoUri = required('MONGODB_URI');

  await mongoose.connect(mongoUri);

  const usersByKey = await upsertUsers();
  const itemsByKey = await upsertItems();

  let documentPaths;
  if (skipStorage) {
    documentPaths = placeholderDocumentPaths();
  } else {
    const url = required('SUPABASE_URL');
    const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl(url), serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await ensureBucket(supabase);
    documentPaths = await uploadDocuments(supabase);
  }

  await refreshSeedTransactions(itemsByKey, usersByKey, documentPaths);
  await upsertApiKeys(usersByKey);
  printSummary();

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
