// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// const createMultipleChoiceService = async (testId, questions) => {
//     try {
//         console.log("testId:", testId);
//         console.log("questions:", questions);
        
//         const multipleChoices = await Promise.all(
//             questions.map(async (question) => {
//                 if (!question.category) {
//                     throw new Error("Category is required for each question.");
//                 }

//                 const isCPNS = category === "CPNS";

//                 if (isCPNS) {
//                     question.options.forEach((option, idx) => {
//                         if (!/^\d+(\.\d+)?$/.test(option.points)) {
//                             throw new Error(
//                                 `Invalid points value for option ${idx + 1} in question number ${question.number}.`
//                             );
//                         }
//                     });
//                 } else {
//                     if (!/^\d+(\.\d+)?$/.test(question.weight)) {
//                         throw new Error(
//                             `Invalid weight value for question number ${question.number}. Weight must be a positive number.`
//                         );
//                     }
//                 }

//                 const multiplechoice = await prisma.multiplechoice.create({
//                     data: {
//                         testId: testId,
//                         pageName: question.pageName,
//                         question: question.question,
//                         number: question.number,
//                         questionPhoto: question.questionPhoto || null, 
//                         weight: isCPNS ? null : parseFloat(question.weight),
//                         discussion: question.discussion || "",
//                         isWeighted: isCPNS,  
//                         option: {
//                             create: question.options.map((option) => ({
//                                 optionDescription: option.optionDescription,
//                                 points: isCPNS ? parseFloat(option.points) : null, 
//                                 isCorrect: isCPNS ? null : option.isCorrect,
//                             })),
//                         },
//                     },
//                     include: {
//                         option: true, 
//                     },
//                 });
//                 return multiplechoice;
//             })
//         );
//         return multipleChoices;
//     } catch (error) {
//         console.error("Error creating multiple choice:", error);
//         throw error; 
//     }
// };

// export { createMultipleChoiceService };