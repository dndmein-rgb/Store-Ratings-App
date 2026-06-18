import { pool } from '../config/db.js';

const SORTABLE_FIELDS = ['name', 'address', 'rating'];

function sortDirection(order) {
  return order && order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
}

// List all stores with overall rating + this user's own submitted rating (if any).
// Supports searching by name and/or address.
async function listStoresForUser(req, res) {
  try {
    const { name, address, sortBy, sortOrder } = req.query;
    const userId = req.user.id;

    const conditions = [];
    const values = [userId];

    if (name) {
      values.push(`%${name}%`);
      conditions.push(`s.name ILIKE $${values.length}`);
    }
    if (address) {
      values.push(`%${address}%`);
      conditions.push(`s.address ILIKE $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'name';
    const orderDir = sortDirection(sortOrder);
    const orderClause = orderField === 'rating' ? `overall_rating ${orderDir}` : `s.${orderField} ${orderDir}`;

    const query = `
      SELECT s.id, s.name, s.address,
             COALESCE(AVG(r.rating), 0)::numeric(10,2) AS overall_rating,
             ur.rating AS user_rating
      FROM stores s
      LEFT JOIN ratings r ON r.store_id = s.id
      LEFT JOIN ratings ur ON ur.store_id = s.id AND ur.user_id = $1
      ${whereClause}
      GROUP BY s.id, s.name, s.address, ur.rating
      ORDER BY ${orderClause}
    `;

    const result = await pool.query(query, values);

    res.json({
      stores: result.rows.map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        overallRating: Number(s.overall_rating),
        userRating: s.user_rating ? Number(s.user_rating) : null,
      })),
    });
  } catch (err) {
    console.error('List stores for user error:', err);
    res.status(500).json({ message: 'Could not load stores' });
  }
}

// Create or update (upsert) the logged-in user's rating for a store.
async function submitRating(req, res) {
  try {
    const userId = req.user.id;
    const { storeId } = req.params;
    const { rating } = req.body;

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be a whole number between 1 and 5' });
    }

    const storeCheck = await pool.query('SELECT id FROM stores WHERE id = $1', [storeId]);
    if (storeCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const result = await pool.query(
      `INSERT INTO ratings (user_id, store_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, store_id)
       DO UPDATE SET rating = $3, updated_at = NOW()
       RETURNING id, rating`,
      [userId, storeId, numericRating]
    );

    res.json({ message: 'Rating saved', rating: result.rows[0] });
  } catch (err) {
    console.error('Submit rating error:', err);
    res.status(500).json({ message: 'Could not save rating' });
  }
}

export { listStoresForUser, submitRating };
