// src/routes/authorRoutes.js
import express from "express";
import { createAuthor, getAuthor, editVerifiedAuthor, getAuthorProfile, editAuthorProfile, getAuthorData } from "../controllers/authorControllers.js";
import { authenticateToken } from '../middleware/authMiddleware.js'; // Pastikan Anda memiliki middleware autentikasi


const router = express.Router();

router.post('/create-author', createAuthor);
router.patch('/edit-author/:id/status', editVerifiedAuthor);
router.get('/get-author', getAuthor);
router.get('/profile', getAuthorProfile);
router.patch('/profile/edit', authenticateToken, editAuthorProfile);
router.get('/author-data', authenticateToken, getAuthorData);




export default router;
