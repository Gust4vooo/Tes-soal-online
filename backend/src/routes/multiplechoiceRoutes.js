import express from 'express';
import { createMultipleChoice } from '../controllers/multiplechoiceController.js';
import { updateMultipleChoice } from '../controllers/multiplechoiceController.js';
import { getMultipleChoice } from '../controllers/multiplechoiceController.js';
import { getMultipleChoiceById } from '../controllers/multiplechoiceController.js';
import { deleteMultipleChoice } from '../controllers/multiplechoiceController.js';

const router = express.Router();
87
// Endpoint untuk menambah soal ke tes
router.post('/add-questions', createMultipleChoice);

router.put('/update-question', updateMultipleChoice);

router.get('/questions/:testId', getMultipleChoice);
router.get('/question/:questionId', getMultipleChoiceById);

router.delete('/question/:questionId', deleteMultipleChoice);

export default router; // Menggunakan default export