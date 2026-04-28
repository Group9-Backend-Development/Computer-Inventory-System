const supabase = require('../config/supabase');
const env = require('../config/env');
const mockStore = require('../data/mockStore');

function mapItem(row) {
  if (!row) {
    return null;
  }

  return {
    _id: row.id,
    itemId: row.item_id,
    serialNumber: row.serial_number,
    model: row.model,
    brand: row.brand,
    classification: row.classification,
    category: row.category,
    status: row.status,
    dateAcquired: row.date_acquired,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('is_deleted', false)
    .order('item_id', { ascending: true });

  if (error) {
    throw error;
  }

  return data.map(mapItem);
}

async function findActiveItemById(id) {
  if (env.useMockData) {
    const item = mockStore.items.find((row) => row._id === id && !row.isDeleted);
    return mockStore.clone(item || null);
  }

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapItem(data);
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

  const payload = {
    item_id: data.itemId,
    serial_number: data.serialNumber,
    model: data.model,
    brand: data.brand,
    classification: data.classification,
    category: data.category,
    status: data.status,
    date_acquired: data.dateAcquired,
  };

  const { data: createdItem, error } = await supabase
    .from('items')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapItem(createdItem);
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

  const payload = {
    item_id: data.itemId,
    serial_number: data.serialNumber,
    model: data.model,
    brand: data.brand,
    classification: data.classification,
    category: data.category,
    status: data.status,
    date_acquired: data.dateAcquired,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedItem, error } = await supabase
    .from('items')
    .update(payload)
    .eq('id', id)
    .eq('is_deleted', false)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapItem(updatedItem);
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

  let query = supabase
    .from('items')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('is_deleted', false);

  if (currentStatus) {
    query = query.eq('status', currentStatus);
  }

  const { data: updatedItem, error } = await query.select().maybeSingle();

  if (error) {
    throw error;
  }

  return mapItem(updatedItem);
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

  const { data: deletedItem, error } = await supabase
    .from('items')
    .update({
      is_deleted: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('is_deleted', false)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapItem(deletedItem);
}

module.exports = {
  listActiveItems,
  findActiveItemById,
  createItem,
  updateItem,
  updateItemStatus,
  softDeleteItem,
};
