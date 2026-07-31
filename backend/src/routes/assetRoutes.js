import { Router } from 'express';
import { readdir } from 'fs/promises';
import { join, extname } from 'path';
import { admin } from '../middlewares/admin.js';

const router = Router();
router.use(admin);

const ALLOWED_EXT = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

const ASSETS_DIR = process.env.ASSETS_DIR || join(process.cwd(), '..', 'frontend', 'public');

router.get('/assets/:folder', async (req, res) => {
  try {
    const folder = req.params.folder;
    if (folder.includes('..') || folder.includes('/')) {
      return res.status(400).json({ message: 'Invalid folder' });
    }

    const dir = join(ASSETS_DIR, folder);
    const files = await readdir(dir);
    const images = files.filter((f) => ALLOWED_EXT.includes(extname(f).toLowerCase()));

    res.status(200).json(images);
  } catch {
    res.status(200).json([]);
  }
});

export default router;
