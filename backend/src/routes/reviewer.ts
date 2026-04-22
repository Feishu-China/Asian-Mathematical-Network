import { Router } from 'express';
import {
  getReviewerAssignmentDetail,
  listReviewerAssignments,
  submitReview,
} from '../controllers/review';

const router = Router();

router.get('/assignments', listReviewerAssignments);
router.get('/assignments/:id', getReviewerAssignmentDetail);
router.post('/assignments/:id/review', submitReview);

export default router;
