import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const createMultipleChoiceService = async (testId, questions) => {
    console.log("testId:", testId);
    console.log("questions:", questions);
    
    const multipleChoices = await Promise.all(
        questions.map(async (question) => {

            if (!/^\d+(\.\d+)?$/.test(question.weight)) {
                throw new Error(`Invalid weight value for question number ${question.number}. Weight must be a positive number without any signs, and can contain at most one decimal point.`);
            }

            const multiplechoice = await prisma.multiplechoice.create({
                data: {
                    testId: testId,
                    pageName: question.pageName,
                    question: question.question,
                    number: question.number,
                    questionPhoto: question.questionPhoto || null, 
                    weight: parseFloat(question.weight),
                    discussion: question.discussion || "",  
                    option: {
                        create: question.options.map((option) => ({
                            optionDescription: option.optionDescription,
                            isCorrect: option.isCorrect,
                        })),
                    },
                },
                include: {
                    option: true, 
                },
            });
            return multiplechoice;
        })
    );

    return multipleChoices;
};

export { createMultipleChoiceService }; 

const updateMultipleChoiceService = async (questionId, updatedData) => {
    const { pageName, question, number, questionPhoto, weight, discussion, options } = updatedData;

    const updateMultipleChoice = await prisma.multiplechoice.update({
        where: {id: questionId},
        data: {
            pageName,
            question,
            number,
            questionPhoto,
            weight,
            discussion,
        },
    });

    if (options && options.length > 0) {
        await Promise.all(
            options.map(async (option) => {
                if (option.id) {
                    await prisma.option.update({
                        where: { id: option.id },
                        data: {
                            optionDescription: option.optionDescription,
                            isCorrect: option.isCorrect,
                        },
                    });
                } else {
                    await prisma.option.create({
                        data: {
                            multiplechoiceId: questionId,
                            optionDescription: option.optionDescription,
                            isCorrect: option.isCorrect,
                        },
                    });
                }
            })
        );
    }

    return updateMultipleChoice;
};

export { updateMultipleChoiceService };

const getMultipleChoiceService = async (testId) => {
    const multipleChoices = await prisma.Multiplechoice.findMany({
        where: {
            testId: testId,
            pageName: pageName || undefined,
        },
        include: {
            option: true, 
        },
    });
    
    return multipleChoices;
};

export { getMultipleChoiceService };

const getMultipleChoiceByIdService = async (id) => {
    try {
    const multipleChoice = await prisma.multiplechoice.findUnique({
        where: { id: id },
        include: {
            option: true, 
        },
    });
    if (!multipleChoice) {
        throw new Error('Multiple choice not found');
    }
    return multipleChoice;
    } catch (error) {
        throw error;
    }
};

export { getMultipleChoiceByIdService };

const deleteMultipleChoiceService = async (multiplechoiceId) => {
    try {
        await prisma.option.deleteMany({
            where: {
                multiplechoiceId: multiplechoiceId
            }
        });

        const deletedQuestion = await prisma.multiplechoice.delete({
            where: {
                id: multiplechoiceId, 
            },
        });

        return deletedQuestion;
    } catch (error) {
        console.error('Error in deleteMultipleChoiceService:', error);
        throw error;
    }
};

export { deleteMultipleChoiceService };

const getQuestionsByTestId = async (testId) => {
  try {
      const questions = await prisma.question.findMany({
          where: {
              testId: testId, 
            },
        });
        return questions; 
    } catch (error) {
        throw new Error('Error fetching questions: ' + error.message);
    }
};

export { getQuestionsByTestId };

const fetchMultipleChoiceByNumberAndTestId = async (testId, number, pageName) => {
    return await prisma.multiplechoice.findFirst({
        where: {
            testId: testId,
            number: number,
            pageName: pageName,
        },
    });
};

export {fetchMultipleChoiceByNumberAndTestId};

const updateMultipleChoicePageNameService = async (testId, number, newPageName) => {
    return await prisma.multiplechoice.updateMany({
        where: {
            testId: testId,
            number: number,
        },
        data: {
            pageName: newPageName,
        },
    });
};

export {updateMultipleChoicePageNameService};

const getPagesByTestIdService = async (testId) => {
    return await prisma.multiplechoice.findMany({
      where: { testId: testId },
      select: {
        number: true,
        pageName: true,
      },
    });
  };
  
  export { getPagesByTestIdService };
  