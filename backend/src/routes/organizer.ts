import { Router } from 'express';
import {
  closeConference,
  createConference,
  getOrganizerConference,
  publishConference,
  updateConference,
} from '../controllers/organizer';

const router = Router();

router.post('/conferences', createConference);
router.get('/conferences/:id', getOrganizerConference);
router.put('/conferences/:id', updateConference);
router.post('/conferences/:id/publish', publishConference);
router.post('/conferences/:id/close', closeConference);

export default router;
