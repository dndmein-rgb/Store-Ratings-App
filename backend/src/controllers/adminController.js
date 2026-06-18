import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const SORTABLE_USER_FIELDS = ['name', 'email', 'address', 'role', 'created_at'];
const SORTABLE_STORE_FIELDS = ['name', 'email', 'address', 'rating', 'created_at'];

function sortDirection(order) {
  return order && order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
}

async function getDashboard(req, res) {
  try {
    const [usersCount, storesCount, ratingsCount] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM stores'),
      pool.query('SELECT COUNT(*) FROM ratings'),
    ]);

    res.json({
      totalUsers: parseInt(usersCount.rows[0].count, 10),
      totalStores: parseInt(storesCount.rows[0].count, 10),
      totalRatings: parseInt(ratingsCount.rows[0].count, 10),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Could not load dashboard stats' });
  }
}

// Admin creates a user with any role (ADMIN, USER, or STORE_OWNER).
async function createUser(req, res) {
  try {
    const { name, email, address, password, role } = req.body;
    const allowedRoles = ['ADMIN', 'USER', 'STORE_OWNER'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Role must be ADMIN, USER, or STORE_OWNER' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, address, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, address, role, created_at`,
      [name, email, hashed, address, role]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Could not create user' });
  }
}

// List normal + admin + store owner users, with optional filters & sorting & pagination.
async function listUsers(req, res) {
  try {
    const { name, email, address, role, sortBy, sortOrder, limit = 50, offset = 0 } = req.query;

    const conditions = [];
    const values = [];

    if (name) {
      values.push(`%${name}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }
    if (email) {
      values.push(`%${email}%`);
      conditions.push(`email ILIKE $${values.length}`);
    }
    if (address) {
      values.push(`%${address}%`);
      conditions.push(`address ILIKE $${values.length}`);
    }
    if (role) {
      values.push(role);
      conditions.push(`role = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderField = SORTABLE_USER_FIELDS.includes(sortBy) ? sortBy : 'name';
    const orderDir = sortDirection(sortOrder);

    // Parse pagination params with defaults
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500); // Max 500 per page
    const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const query = `
      SELECT id, name, email, address, role, created_at
      FROM users
      ${whereClause}
      ORDER BY ${orderField} ${orderDir}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const result = await pool.query(query, [...values, limitNum, offsetNum]);
    res.json({
      users: result.rows,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ message: 'Could not load users' });
  }
}

// View a single user's details. If the user is a store owner, include
// their store's average rating. Uses single JOIN query (no N+1 problem).
async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        u.id, u.name, u.email, u.address, u.role, u.created_at,
        s.id as store_id, s.name as store_name,
        COALESCE(AVG(r.rating), 0)::numeric(10,2) AS store_rating
      FROM users u
      LEFT JOIN stores s ON s.owner_id = u.id
      LEFT JOIN ratings r ON r.store_id = s.id
      WHERE u.id = $1
      GROUP BY u.id, u.name, u.email, u.address, u.role, u.created_at, s.id, s.name
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const row = result.rows[0];
    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      address: row.address,
      role: row.role,
      created_at: row.created_at,
    };

    // Include store info only if user is a store owner and has a store
    if (row.role === 'STORE_OWNER' && row.store_id) {
      user.store = {
        id: row.store_id,
        name: row.store_name,
      };
      user.rating = Number(row.store_rating);
    }

    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Could not load user details' });
  }
}

// Admin creates a store. Optionally assign an existing STORE_OWNER user as owner.
async function createStore(req, res) {
  try {
    const { name, email, address, ownerId } = req.body;

    const existing = await pool.query('SELECT id FROM stores WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'A store with this email already exists' });
    }

    if (ownerId) {
      const owner = await pool.query('SELECT role FROM users WHERE id = $1', [ownerId]);
      if (owner.rows.length === 0) {
        return res.status(400).json({ message: 'Owner user not found' });
      }
      if (owner.rows[0].role !== 'STORE_OWNER') {
        return res.status(400).json({ message: 'Selected user is not a Store Owner' });
      }
    }

    const result = await pool.query(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, address, owner_id, created_at`,
      [name, email, address, ownerId || null]
    );

    res.status(201).json({ store: result.rows[0] });
  } catch (err) {
    console.error('Create store error:', err);
    res.status(500).json({ message: 'Could not create store' });
  }
}

// List stores with average rating, filters, sorting & pagination.
async function listStores(req, res) {
  try {
    const { name, email, address, sortBy, sortOrder, limit = 50, offset = 0 } = req.query;

    const conditions = [];
    const values = [];

    if (name) {
      values.push(`%${name}%`);
      conditions.push(`s.name ILIKE $${values.length}`);
    }
    if (email) {
      values.push(`%${email}%`);
      conditions.push(`s.email ILIKE $${values.length}`);
    }
    if (address) {
      values.push(`%${address}%`);
      conditions.push(`s.address ILIKE $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderField = SORTABLE_STORE_FIELDS.includes(sortBy) ? sortBy : 'name';
    const orderDir = sortDirection(sortOrder);
    const orderClause = orderField === 'rating' ? `rating ${orderDir}` : `s.${orderField} ${orderDir}`;

    // Parse pagination params with defaults
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500); // Max 500 per page
    const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(DISTINCT s.id) FROM stores s ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const query = `
      SELECT s.id, s.name, s.email, s.address,
             COALESCE(AVG(r.rating), 0)::numeric(10,2) AS rating,
             COUNT(r.id) AS rating_count
      FROM stores s
      LEFT JOIN ratings r ON r.store_id = s.id
      ${whereClause}
      GROUP BY s.id, s.name, s.email, s.address
      ORDER BY ${orderClause}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const result = await pool.query(query, [...values, limitNum, offsetNum]);
    res.json({
      stores: result.rows.map((s) => ({ ...s, rating: Number(s.rating) })),
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err) {
    console.error('List stores error:', err);
    res.status(500).json({ message: 'Could not load stores' });
  }
}

// Used to populate an owner-select dropdown when admin creates a store.
async function listStoreOwners(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, email FROM users WHERE role = 'STORE_OWNER' ORDER BY name ASC`
    );
    res.json({ owners: result.rows });
  } catch (err) {
    console.error('List store owners error:', err);
    res.status(500).json({ message: 'Could not load store owners' });
  }
}

export {
  getDashboard,
  createUser,
  listUsers,
  getUserById,
  createStore,
  listStores,
  listStoreOwners,
};
