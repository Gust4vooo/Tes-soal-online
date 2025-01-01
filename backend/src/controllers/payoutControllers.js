import { getTransactionHistoryService, sendPayout, getPayoutStatus } from '../services/payoutServices.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createPayout = async (req, res) => {
    try {
        const {...bodyData } = req.body; // Ambil authorId dan data lainnya dari body
        console.log("Body dari FE: ", bodyData);

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                error: 'Authorization token is missing',
            });
        }

        // Panggil service untuk mengirim payout
        const result = await sendPayout(bodyData, token);

        return res.status(200).json({
            message: 'Payout berhasil dikirim',
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export default createPayout;

export const getTransactionHistory = async (req, res) => {
    try {
      const userId = req.user.id; 

      const author = await prisma.author.findFirst({
        where: { userId: userId },
        select: {
          id: true,
        },
      });

      const authorId = author.id;
      console.log('Author ID:', authorId);
  
      const transactions = await getTransactionHistoryService(authorId);
  
      res.json(transactions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
  };

  export const getStatus = async (req, res) => {
    const { referenceNumber } = req.params;
  
    try {
      if (!referenceNumber) {
        return res.status(400).json({
          success: false,
          message: 'Reference number is required'
        });
      }
  
      const payoutStatus = await getPayoutStatus(referenceNumber);
      
      return res.status(200).json({
        success: true,
        data: {
          status: payoutStatus.status,
          lastUpdated: payoutStatus.updated_at
        }
      });
    } catch (error) {
      console.error('Payout status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payout status',
        error: error.message
      });
    }
  };