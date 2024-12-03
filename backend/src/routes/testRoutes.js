import express from 'express';
import { createTestController, fetchTestsByCategory, getAllTests, publishTestController, getTestDetailsController } from 'backend/src/controllers/testControllers.js';

const router = express.Router();

router.post('/tests', createTestController);

router.put('/tests/:testId/publish', publishTestController);

router.get('/category/:category', fetchTestsByCategory);

router.get('/get-test', getAllTests);

router.get('/get-tests/:testId', getTestDetailsController);

export default router;