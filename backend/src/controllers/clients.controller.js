import { pool } from '../config/db.js';

export async function listClients(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT cp.client_name, cp.company_id, c.name AS company_name, c.ticker
       FROM client_portfolios cp
       JOIN companies c ON c.company_id = cp.company_id
       ORDER BY cp.client_name`
    );

    const grouped = {};
    for (const r of rows) {
      if (!grouped[r.client_name]) {
        grouped[r.client_name] = {
          client_name: r.client_name,
          companies: []
        };
      }
      grouped[r.client_name].companies.push({
        company_id: r.company_id,
        company_name: r.company_name,
        ticker: r.ticker
      });
    }

    return res.json({ clients: Object.values(grouped) });
  } catch (err) {
    next(err);
  }
}

export async function createClient(req, res, next) {
  try {
    const { name, type, contact_name, contact_email, contact_phone, assigned_analyst_id, notes } = req.body;
    
    if (!name || !contact_name || !contact_email) {
      return res.status(400).json({ error: 'name, contact_name, and contact_email are required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO clients (name, type, contact_name, contact_email, contact_phone, assigned_analyst_id, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [name, type, contact_name, contact_email, contact_phone, assigned_analyst_id || null, notes]
    );

    return res.status(201).json({ client: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateClient(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    values.push(id);

    const query = `UPDATE clients SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    return res.json({ success: true, client: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function uploadClientFile(req, res, next) {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify client exists
    const clientRes = await pool.query('SELECT id FROM clients WHERE id = $1', [id]);
    if (clientRes.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const { rows } = await pool.query(
      `INSERT INTO client_files (client_id, filename, original_name, mimetype, size_bytes, uploaded_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [id, file.filename, file.originalname, file.mimetype, file.size, req.user.user_id]
    );

    return res.status(201).json({ success: true, file: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function listClientFiles(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT * FROM client_files WHERE client_id = $1 ORDER BY uploaded_at DESC`,
      [id]
    );

    return res.json({ files: rows });
  } catch (err) {
    next(err);
  }
}

export async function getClientPortfolio(req, res, next) {
  try {
    const { clientName } = req.params;

    const portfolioRes = await pool.query(
      `SELECT
         cp.id,
         cp.client_name,
         cp.company_id,
         c.name AS company_name,
         c.ticker
       FROM client_portfolios cp
       JOIN companies c ON c.company_id = cp.company_id
       WHERE cp.client_name = $1
       ORDER BY c.name`,
      [clientName]
    );

    if (portfolioRes.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found for this client' });
    }

    const portfolio = await Promise.all(
      portfolioRes.rows.map(async (item) => {
        const metricsRes = await pool.query(
          `SELECT DISTINCT ON (metric_name) metric_name, value, timestamp
           FROM financial_metrics
           WHERE company_id = $1
           ORDER BY metric_name, timestamp DESC`,
          [item.company_id]
        );
        return {
          ...item,
          metrics: metricsRes.rows
        };
      })
    );

    return res.json({ portfolio });
  } catch (err) {
    next(err);
  }
}
