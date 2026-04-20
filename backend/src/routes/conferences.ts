import { Router } from 'express';
import {
  createConferenceApplicationDraft,
  getConferenceApplicationForm,
  getConferenceDetail,
  listConferences,
} from '../controllers/conferences';

const router = Router();

router.get('/', listConferences);
router.post('/:id/applications', createConferenceApplicationDraft);
router.get('/:id/application-form', getConferenceApplicationForm);
router.get('/:slug', getConferenceDetail);

export default router;
