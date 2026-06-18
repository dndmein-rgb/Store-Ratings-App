import { pool } from '../config/db.js';

// Returns the store owner's store, its average rating, and the list of
// users who have rated it. Assumes one store per owner (per the spec).
async function getDashboard(req, res) {
  try {
    const ownerId = req.user.id;

    const storeResult = await pool.query('SELECT id, name FROM stores WHERE owner_id = $1', [ownerId]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ message: 'No store is linked to your account yet' });
    }

    const store = storeResult.rows[0];

    const avgResult = await pool.query(
      `SELECT COALESCE(AVG(rating), 0)::numeric(10,2) AS average_rating, COUNT(*) AS rating_count
       FROM ratings WHERE store_id = $1`,
      [store.id]
    );

    const ratersResult = await pool.query(
      `SELECT u.id, u.name, u.email, r.rating, r.created_at
       FROM ratings r
       JOIN users u ON u.id = r.user_id
       WHERE r.store_id = $1
       ORDER BY r.created_at DESC`,
      [store.id]
    );

    res.json({
      store: { id: store.id, name: store.name },
      averageRating: Number(avgResult.rows[0].average_rating),
      ratingCount: parseInt(avgResult.rows[0].rating_count, 10),
      raters: ratersResult.rows,
    });
  } catch (err) {
    console.error('Store owner dashboard error:', err);
    res.status(500).json({ message: 'Could not load dashboard' });
  }
}

export { getDashboard };
