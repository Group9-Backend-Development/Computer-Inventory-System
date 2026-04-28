const transactionService = require('../services/transaction.service');

function uploadedDocumentPath(file) {
  return file ? `/documents/${file.filename}` : null;
}

async function checkout(req, res) {
  try {
    const result = await transactionService.checkoutItem({
      itemId: req.body.itemId,
      assigneeId: req.body.assigneeId,
      performedById: req.user.id,
      documentPath: uploadedDocumentPath(req.file),
      note: req.body.note,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

async function checkin(req, res) {
  try {
    const result = await transactionService.checkinItem({
      itemId: req.body.itemId,
      performedById: req.user.id,
      documentPath: uploadedDocumentPath(req.file),
      note: req.body.note,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

module.exports = { checkout, checkin };
