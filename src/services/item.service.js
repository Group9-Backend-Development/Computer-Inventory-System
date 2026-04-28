const supabase = require('../config/supabase');

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

async function softDeleteItem(id) {
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
  softDeleteItem,
};