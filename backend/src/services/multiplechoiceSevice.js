import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const createMultipleChoiceService = async (testId, questions) => {
    console.log("testId:", testId);
    console.log("questions:", questions);
    
    const multipleChoices = await Promise.all(
        questions.map(async (question) => {
            // if (!/^\d+(\.\d+)?$/.test(question.weight)) {
            //     throw new Error(`Invalid weight value for question number ${question.number}. Weight must be a positive number without any signs, and can contain at most one decimal point.`);
            // }

            if (question.options.length > 5) {
                throw new Error("Each question can have a maximum of 5 options.");
            }

            const multiplechoice = await prisma.multiplechoice.create({
                data: {
                    pageName: question.pageName,
                    question: question.question,
                    number: question.number,
                    questionPhoto: question.questionPhoto || null, 
                    weight: question.isWeighted ? null : parseFloat(question.weight),
                    discussion: question.discussion || "",
                    isWeighted: question.isWeighted || false,  
                    test: {
                        connect: { id: testId },
                    },
                    option: {
                        create: question.options.map((option) => ({
                            optionDescription: option.optionDescription,
                            optionPhoto: option.optionPhoto || null,
                            isCorrect: question.isWeighted ? null : option.isCorrect, 
                            points: question.isWeighted ? option.points : null, 
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

const updateMultipleChoiceService = async (multiplechoiceId, updatedData) => {
    const { 
        pageName, 
        question, 
        number, 
        questionPhoto, 
        weight, 
        discussion, 
        options,
        isWeighted
    } = updatedData;

    const weightValue = isWeighted ? 0 : parseFloat(weight);

    const updateMultipleChoice = await prisma.multiplechoice.update({
        where: {id: multiplechoiceId},
        data: {
            pageName,
            question,
            number,
            questionPhoto,
            weight: weightValue,
            discussion,
            isWeighted, 
        },
    });

    if (options && options.length > 0) {
        const existingOptions = await prisma.option.findMany({
            where: { multiplechoiceId },
        });

        await Promise.all(
            options.map(async (option) => {
                const optionData = {
                    optionDescription: option.optionDescription,
                    optionPhoto: option.optionPhoto || null,
                    isCorrect: isWeighted ? null : option.isCorrect,
                    points: isWeighted ? option.points : null,
                };

                if (option.id) {
                    await prisma.option.update({
                        where: { id: option.id },
                        data: optionData,
                    });
                } else {
                    await prisma.option.create({
                        data: {
                            multiplechoiceId,
                            ...optionData,
                        },
                    });
                }
            })
        );
        const optionIdsInRequest = options.map((option) => option.id).filter(Boolean);
        const optionIdsToDelete = existingOptions
            .filter((option) => !optionIdsInRequest.includes(option.id))
            .map((option) => option.id);

        if (optionIdsToDelete.length > 0) {
            await prisma.option.deleteMany({
                where: { id: { in: optionIdsToDelete } },
            });
        }
    }
    return updateMultipleChoice;
};

export { updateMultipleChoiceService };

export const getMultipleChoiceByIdService = async (id) => {
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

export const deleteQuestionAndReorderNumbers = async (multiplechoiceId) => {
  return await prisma.$transaction(async (tx) => {
    const questionToDelete = await tx.multiplechoice.findUnique({
      where: { id: multiplechoiceId },
      select: { number: true, testId: true },
    });

    if (!questionToDelete) {
      throw new Error('Soal tidak ditemukan');
    }

    console.log('Deleting question:', { id: multiplechoiceId, number: questionToDelete.number });

    // Hapus soal yang ditargetkan
    await tx.multiplechoice.delete({
      where: { id: multiplechoiceId },
    });

    // Ambil soal yang perlu diperbarui
    const questionsToUpdate = await tx.multiplechoice.findMany({
      where: {
        testId: questionToDelete.testId,
        number: { gt: questionToDelete.number },
      },
      orderBy: { number: 'desc' },
      select: { id: true, number: true },
    });

    console.log('Questions to update:', questionsToUpdate);

    // Perbarui nomor setiap soal
    const updates = [];
    for (const question of questionsToUpdate) {
      const newNumber = question.number - 1;
      const result = await tx.multiplechoice.update({
        where: { id: question.id }, 
        data: { number: newNumber }
      });      

      console.log(`Updated: ${question.id} from ${question.number} to ${newNumber}`);
      updates.push(result);
    }

    return updates;
  });
};


export const updateQuestionNumber = async (testId, oldNumber, newNumber) => {
    try {
      const existingQuestion = await prisma.multiplechoice.findFirst({
        where: {
          testId: testId,
          number: oldNumber
        }
      });
  
      if (!existingQuestion) {
        throw new Error(`Question with number ${oldNumber} not found in test ${testId}`);
      }
 
      const updatedQuestion = await prisma.multiplechoice.update({
        where: {
          id: existingQuestion.id
        },
        data: {
          number: newNumber,
          updatedAt: new Date()
        }
      });
  
      return updatedQuestion;
    } catch (error) {
      console.error('Error in updateQuestionNumber service:', error);
      throw error;
    }
};

export const updateQuestionNumberService = async (testId, oldNumber, newNumber) => {
    try {
        console.log("data: ", testId, oldNumber, newNumber);
        const updatedQuestion = await prisma.multiplechoice.updateMany({
            where: {
                testId: testId,
                number: oldNumber
            },
            data: {
                number: newNumber
            }
        });

        console.log("update: ", updatedQuestion)
        if (updatedQuestion.count === 0) {
            throw new Error('Soal tidak ditemukan');
        }
        return updatedQuestion;
        
    } catch (error) {
        throw error;
    }
};

export const updatePageNameForQuestion = async (questionNumber, pageName) => {
    try {
        const result = await prisma.multiplechoice.updateMany({
        where: { 
            number: questionNumber 
        }, 
        data: { pageName }, 
      });
  
      return result; // Return the database operation result
    } catch (error) {
      throw new Error('Failed to update question pageName: ' + error.message);
    } finally {
      await prisma.$disconnect(); // Ensure the Prisma client disconnects
    }
  };

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

const updateMultipleChoicePageNameService = async (testId, currentPageName, newPageName) => {
    try {
      if (!prisma || !prisma.multiplechoice) {
        throw new Error('Prisma client not initialized properly');
      }
  
      console.log('Updating with params:', {
        testId,
        currentPageName,
        newPageName
      });
  
      const result = await prisma.multiplechoice.updateMany({
        where: {
          testId: testId,
          pageName: currentPageName, 
        },
        data: {
          pageName: newPageName, 
        },
      });
  
      console.log('Update result:', result);
      return result;
  
    } catch (error) {
      console.error('Error in updateMultipleChoicePageNameService:', error);
      throw error;
    }
};
  
export { updateMultipleChoicePageNameService };

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

const getQuestionNumbersServices = async (testId, category) => {
    const result = await prisma.multiplechoice.findMany({
      where: {
        testId: testId,
        category: category,
      },
      select: {
        number: true,
      },
    });

    return result.map((item) => item.number);
  };

  const updateQuestionNumberServices = async (testId, oldNumber, newNumber) => {
    console.log('Updating question numbers in database:');
    console.log(`testId: ${testId}, oldNumber: ${oldNumber}, newNumber: ${newNumber}`);

    await prisma.multiplechoice.updateMany({
      where: {
        testId: testId,
        number: {
          gte: oldNumber,
        },
      },
      data: {
        number: {
          increment: 1,
        },
      },
    });

    console.log('Question numbers updated successfully');
  };

  export{
    getQuestionNumbersServices,
    updateQuestionNumberServices
  };

  export const deletePageService = async (testId, pageName) => {
    try {
        return await prisma.$transaction(async (tx) => {
            // Get all questions for this page
            const questionsToDelete = await tx.multiplechoice.findMany({
                where: {
                    testId: testId,
                    pageName: pageName
                }
            });

            // Delete options for all questions
            await tx.option.deleteMany({
                where: {
                    multiplechoiceId: {
                        in: questionsToDelete.map(q => q.id)
                    }
                }
            });

            // Delete all questions for this page
            await tx.multiplechoice.deleteMany({
                where: {
                    testId: testId,
                    pageName: pageName
                }
            });

            return { success: true };
        });
    } catch (error) {
        console.error('Error in deletePageService:', error);
        throw error;
    }
};

export const updateNumberServices = async (testId, oldNumber, newNumber) => {
    await prisma.multiplechoice.update({
      where: {
        testId_number: {
          testId: testId,
          number: oldNumber
        }
      },
      data: {
        number: newNumber
      }
    });
  
    console.log('Question number updated successfully');
};