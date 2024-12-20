import express from 'express';
import { createTest, getTest, testResultController, createTestController, publishTestController, getAllTests, fetchTestsByCategory, getAuthorTests, getTestDetail  } from '../controllers/testControllers.js';
import { authenticateToken } from '../middleware/authMiddleware.js'; 


const router = express.Router();

router.get('/get-test/:id', getTest);
router.get('/test-result/:resultId', testResultController);
router.get('/get-test', getAllTests);
router.get('/category/:category', fetchTestsByCategory);
router.get('/author-tests', authenticateToken, getAuthorTests);
router.get('/test-detail/:testId', getTestDetail);

router.post('/tests', createTestController);
router.post('/create-test', createTest);

router.put('/tests/:testId/publish', publishTestController);




export default router; // Menggunakan default export



// const express = require("express");
// const { createTest } = require("backend/src/controllers/testControllers.js");

// const router = express.Router();

// router.post("/create-test", createTest);

// module.exports = router;