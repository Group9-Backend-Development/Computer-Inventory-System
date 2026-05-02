const env = require('../config/env');
const mockStore = require('../data/mockStore');
const Item = require('../models/Item');
const { toObjectId } = require('../utils/objectId');

function mapItem(doc) {
  if (!doc) {
    return null;
  }

  const o = doc.toObject ? doc.toObject() : doc;

  return {
    _id: String(o._id ?? o.id),
    itemId: o.itemId ?? o.item_id,
    serialNumber: o.serialNumber ?? o.serial_number,
    model: o.model,
    brand: o.brand,
    classification: o.classification,
    category: o.category,
    status: o.status,
    dateAcquired: (() => {
      const da = o.dateAcquired ?? o.date_acquired;
      return da instanceof Date ? da.toISOString() : da;
    })(),
    isDeleted: o.isDeleted ?? o.is_deleted,
    createdAt: o.createdAt?.toISOString ? o.createdAt.toISOString() : o.createdAt ?? o.created_at,
    updatedAt: o.updatedAt?.toISOString ? o.updatedAt.toISOString() : o.updatedAt ?? o.updated_at,
  };
}

async function listActiveItems() {
  if (env.useMockData) {
    return mockStore.clone(
      mockStore.items
        .filter((item) => !item.isDeleted)
        .sort((a, b) => a.itemId.localeCompare(b.itemId))
    );
  }

  const rows = await Item.find({ isDeleted: false }).sort({ itemId: 1 }).lean();
  return rows.map((row) => mapItem(row));
}

async function findActiveItemById(id) {
  if (env.useMockData) {
    const item = mockStore.items.find((row) => row._id === id && !row.isDeleted);
    return mockStore.clone(item || null);
  }

  const oid = toObjectId(id);
  if (!oid) {
    return null;
  }

  const row = await Item.findOne({ _id: oid, isDeleted: false }).lean();
  return row ? mapItem(row) : null;
}

async function createItem(data) {
  if (env.useMockData) {
    const item = {
      _id: String(mockStore.items.length + 1),
      itemId: data.itemId,
      serialNumber: data.serialNumber,
      model: data.model,
      brand: data.brand,
      classification: data.classification,
      category: data.category,
      status: data.status || 'Available',
      dateAcquired: data.dateAcquired,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.items.push(item);
    return mockStore.clone(item);
  }

  const created = await Item.create({
    itemId: data.itemId,
    serialNumber: data.serialNumber,
    model: data.model,
    brand: data.brand,
    classification: data.classification,
    category: data.category,
    status: data.status || 'Available',
    dateAcquired: data.dateAcquired,
    isDeleted: false,
  });

  return mapItem(created);
}

async function updateItem(id, data) {
  if (env.useMockData) {
    const item = mockStore.items.find((row) => row._id === id && !row.isDeleted);
    if (!item) {
      return null;
    }

    Object.assign(item, {
      itemId: data.itemId,
      serialNumber: data.serialNumber,
      model: data.model,
      brand: data.brand,
      classification: data.classification,
      category: data.category,
      status: data.status,
      dateAcquired: data.dateAcquired,
      updatedAt: new Date().toISOString(),
    });
    return mockStore.clone(item);
  }

  const oid = toObjectId(id);
  if (!oid) {
    return null;
  }

  const updated = await Item.findOneAndUpdate(
    { _id: oid, isDeleted: false },
    {
      itemId: data.itemId,
      serialNumber: data.serialNumber,
      model: data.model,
      brand: data.brand,
      classification: data.classification,
      category: data.category,
      status: data.status,
      dateAcquired: data.dateAcquired,
    },
    { new: true }
  ).lean();

  return updated ? mapItem(updated) : null;
}

async function updateItemStatus(id, status, currentStatus) {
  if (env.useMockData) {
    const item = mockStore.items.find((row) => row._id === id && !row.isDeleted);
    if (!item || (currentStatus && item.status !== currentStatus)) {
      return null;
    }

    item.status = status;
    item.updatedAt = new Date().toISOString();
    return mockStore.clone(item);
  }

  const oid = toObjectId(id);
  if (!oid) {
    return null;
  }

  const filter = { _id: oid, isDeleted: false };
  if (currentStatus) {
    filter.status = currentStatus;
  }

  const updated = await Item.findOneAndUpdate(filter, { status }, { new: true }).lean();
  return updated ? mapItem(updated) : null;
}

async function softDeleteItem(id) {
  if (env.useMockData) {
    const item = mockStore.items.find((row) => row._id === id && !row.isDeleted);
    if (!item) {
      return null;
    }

    item.isDeleted = true;
    item.updatedAt = new Date().toISOString();
    return mockStore.clone(item);
  }

  const oid = toObjectId(id);
  if (!oid) {
    return null;
  }

  const updated = await Item.findOneAndUpdate(
    { _id: oid, isDeleted: false },
    { isDeleted: true },
    { new: true }
  ).lean();

  return updated ? mapItem(updated) : null;
}

module.exports = {
  listActiveItems,
  findActiveItemById,
  createItem,
  updateItem,
  updateItemStatus,
  softDeleteItem,
};
