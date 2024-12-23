import express from 'express';
import { updateQuestionPageName, createMultipleChoice, updateMultipleChoice, getMultipleChoiceById, deleteMultipleChoice,  updateQuestionNumber, getQuestionNumbers, getMultipleChoiceByNumberAndTestId, updateMultipleChoicePageNameController, getPagesByTestIdController } from '../controllers/multiplechoiceController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/add-questions', upload.array('questionPhoto'), (req, res) => {
    console.log('Request body:', req.body); 
    if (req.file) {
        req.body.questions.forEach(question => {
            question.questionPhoto = req.file.path; 
        });
    }
    createMultipleChoice(req, res);
});

router.put('/update-question/:multiplechoiceId', updateMultipleChoice); //perlu
router.put('/update-question', updateQuestionPageName);
router.get('/question/:id', getMultipleChoiceById); //perlu
router.delete('/question/:multiplechoiceId', deleteMultipleChoice); //perlu
router.get('/:testId/:number', getMultipleChoiceByNumberAndTestId); //perlu
router.put('/update-pageName', updateMultipleChoicePageNameController); //perlu
router.get('/get-pages/:testId', getPagesByTestIdController); //perlu
router.get('/getQuestionNumbers', getQuestionNumbers); //perlu
router.put('/update-questionNumber', updateQuestionNumber); //perlu

export default router; 