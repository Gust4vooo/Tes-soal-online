import express from 'express';
import { createTest } from '../controllers/testControllers.js';

const router = express.Router();

router.post('/create-test', createTest);

export default router; // Menggunakan default export



// const express = require("express");
// const { createTest } = require("backend/src/controllers/testControllers.js");

// const router = express.Router();

// router.post("/create-test", createTest);

// module.exports = router;