const router = require('express').Router();

router.post('/quote', (req, res) => {
  const { weightKg = 1, distanceKm = 10, serviceLevel = 'standard', category = 'standard' } = req.body || {};
  const base = 350; // in pence
  const perKg = Math.round(80 * Number(weightKg)); // 0.80 GBP/kg
  const perKm = Math.round(15 * Number(distanceKm)); // 0.15 GBP/km
  const level = serviceLevel === 'next-day' ? 400 : 0; // +£4
  const fragile = (category === 'electronics' || category === 'fragile') ? 150 : 0; // +£1.50
  const totalPence = base + perKg + perKm + level + fragile;
  const amount = Math.round(totalPence) / 100;
  res.json({ currency: 'GBP', amount });
});

module.exports = router;