import { Router } from 'express';
import {
  createGrantApplicationDraft,
  getGrantApplicationForm,
  getGrantDetail,
  getMyGrantApplication,
  listGrants,
} from '../controllers/grants';

const router = Router();

router.get('/', listGrants);
router.get('/:id/applications/me', getMyGrantApplication);
router.post('/:id/applications', createGrantApplicationDraft);
router.get('/:id/application-form', getGrantApplicationForm);
router.get('/:slug', getGrantDetail);

export default router;
