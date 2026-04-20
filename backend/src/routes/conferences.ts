import { Router } from 'express';
import {
  getConferenceApplicationForm,
  getConferenceDetail,
  listConferences,
} from '../controllers/conferences';

const router = Router();

router.get('/', listConferences);
router.get('/:id/application-form', getConferenceApplicationForm);
router.get('/:slug', getConferenceDetail);

export default router;
