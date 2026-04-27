const items = require('../data/mockItems');

function generateId() {
  return Date.now().toString();
}

async function listActiveItems() {
  return items
    .filter((item) => !item.isDeleted)
    .sort((a, b) => a.itemId.localeCompare(b.itemId));
}

async function findActiveItemById(id) {
  return items.find((item) => item._id === id && !item.isDeleted) || null;
}

async function createItem(data) {
  const newItem = {
    _id: generateId(),
    itemId: data.itemId,
    serialNumber: data.serialNumber,
    model: data.model,
    brand: data.brand,
    classification: data.classification,
    category: data.category,
    status: data.status,
    dateAcquired: data.dateAcquired,
    isDeleted: false,
  };

  items.push(newItem);
  return newItem;
}

async function updateItem(id, data) {
  const item = items.find((item) => item._id === id && !item.isDeleted);

  if (!item) {
    return null;
  }

  item.itemId = data.itemId;
  item.serialNumber = data.serialNumber;
  item.model = data.model;
  item.brand = data.brand;
  item.classification = data.classification;
  item.category = data.category;
  item.status = data.status;
  item.dateAcquired = data.dateAcquired;

  return item;
}

async function softDeleteItem(id) {
  const item = items.find((item) => item._id === id && !item.isDeleted);

  if (!item) {
    return null;
  }

  item.isDeleted = true;
  return item;
}

module.exports = {
  listActiveItems,
  findActiveItemById,
  createItem,
  updateItem,
  softDeleteItem,
};