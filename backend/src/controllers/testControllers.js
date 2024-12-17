import { createTestService, getTestsByCategory, getAllTestsService, publishTestService, getAuthorTestsService, getTestDetailById } from 'backend/src/services/testServices.js';

// Buat tes
const createTestController = async (req, res, next) => {
    const { authorId, type, category, title, testDescription } = req.body;
    console.log("Data yang diterima:", req.body);

    if (!authorId || !type || !category || !title || !testDescription) {
        return res.status(400).json({
            message: 'Semua field harus diisi.' 
        });
    }

    try {
        const newTest = await createTestService({ authorId, type, category, title, testDescription });
        res.status(201).json(newTest); 
    } catch (error) {
        next(error); 
    }
};

// Publish Tes
const publishTestController = async (req, res, next) => {
    const { testId } = req.params;
    const { price, similarity, worktime } = req.body;

    // Validasi input
    if (!price || !similarity || !worktime) {
        const error = new Error('Semua field harus diisi untuk publikasi.');
        error.status = 400; 
        return next(error);
    }

    try {
        // Mengupdate test dengan isPublished diatur menjadi true
        const updatedTest = await publishTestService(testId, { 
            price, 
            similarity, 
            worktime, 
            isPublished: true // Ganti isPublish menjadi isPublished
        });
        res.status(200).json(updatedTest); 
    } catch (error) {
        next(error);
    }
};


const getAllTests = async (req, res) => {
    try {
        const tests = await getAllTestsService();
        res.status(200).json(tests);
    } catch (error) {
        console.error('Error fetching tests:', error);
        res.status(500).json({ message: 'Failed to fetch tests', error: error.message });
    }
};

const fetchTestsByCategory = async (req, res, next) => {
    const { category } = req.params;

    try {
        const tests = await getTestsByCategory(category);
        
        if (!tests.length) {
            const error = new Error('No tests found for this category');
            error.status = 404;
            return next(error);
        }

        res.status(200).json(tests);
    } catch (error) {
        next(error); 
    }
};



export const getAuthorTests = async (req, res) => {
  try {
    const userId = req.user.id;
    const tests = await getAuthorTestsService(userId);
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tests', error: error.message });
  }
};

export const getTestDetail = async (req, res) => {
    const { testId } = req.params;

    try {
        const test = await getTestDetailById(testId); // Memanggil service untuk mendapatkan detail test

        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }

        res.status(200).json({
            title: test.title,
            similarity: test.similarity,
            price: test.price,
        });
    } catch (error) {
        console.error("Error fetching test detail:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export {createTestController,
    publishTestController,
    getAllTests,
    fetchTestsByCategory}; 
