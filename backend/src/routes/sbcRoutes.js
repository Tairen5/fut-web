import { Router } from 'express';
import * as controller from '../controllers/sbcController.js';
import { auth } from '../middlewares/auth.js';
import { admin } from '../middlewares/admin.js';

const router = Router();

router.get('/', controller.getAll);
router.get('/daily', controller.getDaily);
router.get('/:id', controller.getById);
router.post('/', auth, admin, controller.create);
router.put('/:id', auth, admin, controller.update);
router.delete('/:id', auth, admin, controller.remove);

export default router;
