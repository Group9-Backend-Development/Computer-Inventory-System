async function checkout(req, res) {
  res.status(501).json({ error: 'Not implemented: POST /api/transactions/checkout' });
}

async function checkin(req, res) {
  res.status(501).json({ error: 'Not implemented: POST /api/transactions/checkin' });
}

module.exports = { checkout, checkin };
