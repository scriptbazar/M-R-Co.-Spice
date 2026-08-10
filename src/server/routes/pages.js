import express from 'express';
import { dbAll, dbGet, dbRun } from '../../db/database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get all pages list (minimal info)
router.get('/', async (req, res) => {
  try {
    const pages = await dbAll("SELECT slug, title, updated_at FROM pages");
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// Get a single page by slug
router.get('/:slug', async (req, res) => {
  try {
    const page = await dbGet("SELECT * FROM pages WHERE slug = ?", [req.params.slug]);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

// Update a page (Admin only)
router.put('/:slug', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { content } = req.body;
    
    const result = await dbRun(
      "UPDATE pages SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?",
      [content, req.params.slug]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json({ success: true, message: 'Page updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update page' });
  }
});

export default router;
