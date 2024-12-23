import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { updatePageNameForQuestion, createMultipleChoiceService, updateMultipleChoiceService, getQuestionNumbersServices, updateQuestionNumberServices, getMultipleChoiceByIdService, deleteMultipleChoiceService,  fetchMultipleChoiceByNumberAndTestId, updateMultipleChoicePageNameService, getPagesByTestIdService } from '../services/multiplechoiceSevice.js';
import { Buffer } from 'buffer';
import { uploadFileToStorage } from '../../firebase/firebaseBucket.js';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

initializeApp(firebaseConfig);

// const extractBase64Images = (content) => {
//     const base64Regex = /data:image\/[^;]+;base64,([^"]+)/g;
//     const matches = content.match(base64Regex) || [];
//     return matches;
//   };
  
//   // Fungsi untuk mengganti URL gambar dalam konten
//   const replaceImageUrlInContent = (content, oldUrl, newUrl) => {
//     return content.replace(oldUrl, newUrl);
// };

const createMultipleChoice = async (req, res) => {
    try {
        const { testId, questions } = req.body;

        if (!testId || !questions) {
            return res.status(400).send({
                message: 'testId and questions are required',
            });
        }

        const uploadedQuestion = await Promise.all(
            questions.map(async (question) => {
                const questionData = { ...question };

                if (req.files && req.files[index]) {
                    const fileBuffer = req.files[index].buffer; 
                    const fileName = `questions/${Date.now()}_${req.files[index].originalname}`; 

                    const imageUrl = await uploadFileToStorage(fileBuffer, fileName);
                    questionData.questionPhoto = imageUrl; 
                }

                return questionData;
            })
        );

        const multipleChoices = await createMultipleChoiceService(testId, uploadedQuestion);

        res.status(201).send({
            data: multipleChoices,
            message: 'Multiple choice questions created successfully',
        });
    } catch (error) {
        res.status(500).send({
            message: 'Failed to create multiple choice questions',
            error: error.message,
        });
    }
};

export { createMultipleChoice }; 

export const updateQuestionPageName = async (req, res) => {
    const { questionNumber, pageName } = req.body;
    console.log('Received request to update pageName for question:', req.body);
  
    if (!questionNumber || !pageName) {
      return res.status(400).json({
        success: false,
        message: 'questionNumber and pageName are required.',
      });
    }
  
    try {
      const result = await updatePageNameForQuestion(questionNumber, pageName);
  
      if (result.modifiedCount > 0) {
        res.status(200).json({
          success: true,
          message: 'Page name updated successfully for the question.',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Question not found or no changes made.',
        });
      }
    } catch (error) {
      console.error('Error updating pageName for question:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
      });
    }
  };

const updateMultipleChoice = async (req, res) => {
    try {
        const { multiplechoiceId } = req.params; 
        const updatedData = req.body; 

        if (!multiplechoiceId || !updatedData) {
            return res.status(400).send({
                message: 'multiplechoiceId and updatedData are required',
            });
        }

        const updatedMultipleChoice = await updateMultipleChoiceService(multiplechoiceId, updatedData);

        res.status(200).send({
            data: updatedMultipleChoice,
            message: 'Multiple choice question updated successfully',
        });
    } catch (error) {
        res.status(500).send({
            message: 'Failed to update multiple choice question',
            error: error.message,
        });
    }
};

export { updateMultipleChoice };

const getMultipleChoiceById = async (req, res) => {
    try {
        const { id } = req.params;  
        const multipleChoice = await getMultipleChoiceByIdService(id);
        console.log("Multiple choice fetched:", multipleChoice);
        res.status(200).json(multipleChoice);
    } catch (error) {
        console.error("Error fetching multiple choice:", error.message);
        res.status(404).json({ error: error.message });
    }
};

export { getMultipleChoiceById };

const deleteMultipleChoice = async (req, res) => {
    try {
        const { multiplechoiceId } = req.params;

        if (!multiplechoiceId) {
            return res.status(400).json({
                success: false,
                message: 'multiplechoiceId is required'
            });
        }

        const result = await deleteMultipleChoiceService(multiplechoiceId);

        res.status(200).json({
            success: true,
            message: 'Multiple choice question deleted successfully',
            data: {
                deletedQuestionNumber: result.deletedQuestionNumber,
                remainingQuestionsCount: result.remainingQuestions.length,
                updatedQuestions: result.remainingQuestions
            }
        });
    } catch (error) {
        console.error('Controller Error:', error);

        if (error.message === 'Multiple choice question not found') {
            return res.status(404).json({
                success: false,
                message: 'Multiple choice question not found',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete multiple choice question',
            error: error.message
        });
    }
};

export { deleteMultipleChoice };

const getMultipleChoiceByNumberAndTestId = async (req, res) => {
    const { testId, number, pageName } = req.params;

    try {
        const multipleChoice = await fetchMultipleChoiceByNumberAndTestId(testId, parseInt(number), pageName);

        if (!multipleChoice) {
            return res.status(404).json({ message: 'Multiplechoice not found' });
        }

        return res.json(multipleChoice);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export{ getMultipleChoiceByNumberAndTestId};

const updateMultipleChoicePageNameController = async (req, res) => {
    const { testId, pageIndex, currentPageName, newPageName } = req.body;
    console.log('Received request to update pageName for testId:', testId, 'pageIndex:', pageIndex, 'currentPageName:', currentPageName, 'newPageName:', newPageName);
  
    try {
      const result = await updateMultipleChoicePageNameService(testId, currentPageName, newPageName);
      res.status(200).json({ message: 'Page name updated successfully', result });
    } catch (error) {
      console.error('Error updating pageName:', error);
      res.status(500).json({ error: 'Failed to update page name' });
    }
  };

export {updateMultipleChoicePageNameController};

const getPagesByTestIdController = async (req, res) => {
    try {
      const { testId } = req.query; 
  
      if (!testId) {
        return res.status(400).json({ message: 'Test ID is required' });
      }
  
      const pages = await getPagesByTestIdService(testId);
  
      if (!pages.length) {
        return res.status(404).json({ message: 'No pages found for this test ID' });
      }
  
      return res.status(200).json({ pages });
    } catch (error) {
      console.error('Error fetching pages:', error);
      return res.status(500).json({ message: 'Failed to fetch pages', error: error.message });
    }
};
  
export { getPagesByTestIdController };

const getQuestionNumbers = async (req, res) => {
    try {
      const { testId, category } = req.params;
      const questionNumbers = await getQuestionNumbersServices(testId, category);
      res.json({ questionNumbers });
    } catch (error) {
      res.status(500).json({ error: 'Error getting question numbers' });
    }
  };
  
  const updateQuestionNumber = async (req, res) => {
    try {
      const { testId } = req.params;
      const { oldNumber, newNumber } = req.body;
  
      console.log('Received request to update question numbers:');
      console.log(`testId: ${testId}`);
      console.log(`oldNumber: ${oldNumber}, newNumber: ${newNumber}`);
  
      await updateQuestionNumberServices(testId, oldNumber, newNumber);
      res.json({ message: 'Question numbers updated successfully' });
    } catch (error) {
      console.error('Error updating question numbers:', error);
      res.status(500).json({ error: 'Error updating question numbers' });
    }
  };
  
  export {
    getQuestionNumbers,
    updateQuestionNumber,
  };
