import MidtransClient from 'midtrans-client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class PaymentService {
    constructor() {
        try {
            this.snap = new MidtransClient.Snap({
                isProduction: false,
                serverKey: process.env.MIDTRANS_SERVER_KEY,
                clientKey: process.env.MIDTRANS_CLIENT_KEY,
            });

            this.core = new MidtransClient.CoreApi({
                isProduction: false,
                serverKey: process.env.MIDTRANS_SERVER_KEY,
                clientKey: process.env.MIDTRANS_CLIENT_KEY
            });
        } catch (error) {
            throw new Error('Payment service initialization failed');
        }
    }

    async createPaymentToken(testId, userId) {
        try {
            const test = await prisma.test.findFirst({
                where: { id: testId }
            });

            if (!test) {
                throw new Error(`Test not found with ID: ${testId}`);
            }

            const orderId = `${test.id}-${userId}-${Date.now()}`;
            const parameter = {
                transaction_details: {
                    order_id: orderId,
                    gross_amount: test.price,
                },
                callbacks: {
                    finish: process.env.DOMAIN
                },
                enabled_payments: [
                    "mandiri_clicpay", "bca_clicpay", "bni_va", "bca_va",
                ],
            };

            const transaction = await prisma.transaction.create({
                data: {
                    testId,
                    userId: "cm4s3ni9e0000vndcyp4s0wim",
                    paymentMethod: 'midtrans',
                    total: test.price,
                    paymentStatus: 'PENDING',
                    paymentId: orderId
                }
            });

            const snapResponse = await this.snap.createTransaction(parameter);
            return snapResponse;
        } catch (error) {
            throw new Error(`Failed to create payment token: ${error.message}`);
        }
    }

    async processNotification(notification) {
        try {
            if (!notification || typeof notification !== 'object') {
                throw new Error(`Invalid notification payload: ${JSON.stringify(notification)}`);
            }

            const statusResponse = await this.core.transaction.notification(notification);

            const {
                transaction_status: transactionStatus,
                fraud_status: fraudStatus,
                order_id: orderId,
                transaction_id: transactionId,
                payment_type: paymentType,
                status_message: statusMessage,
                gross_amount: grossAmount
            } = statusResponse;

            if (!orderId) {
                throw new Error('Missing order_id in notification');
            }

            const transaction = await prisma.transaction.findFirst({
                where: { paymentId: orderId }
            });

            if (!transaction) {
                throw new Error(`Transaction not found for order ID: ${orderId}`);
            }

            let paymentStatus = this.determinePaymentStatus(transactionStatus, fraudStatus);
            paymentStatus = paymentStatus.toUpperCase();

            const updatedTransaction = await prisma.transaction.update({
                where: { id: transaction.id },
                data: { paymentStatus }
            });

            return paymentStatus;
        } catch (error) {
            throw error;
        }
    }

    determinePaymentStatus(transactionStatus, fraudStatus) {
        const statusMap = {
            capture: {
                challenge: 'PENDING',
                accept: 'PAID'
            },
            settlement: 'PAID',
            cancel: 'FAILED',
            deny: 'FAILED',
            expire: 'EXPIRED',
            pending: 'PENDING'
        };

        let status;
        if (transactionStatus === 'capture') {
            status = statusMap.capture[fraudStatus] || 'PENDING';
        } else {
            status = statusMap[transactionStatus];
        }

        if (!status) {
            throw new Error(`Unknown transaction status: ${transactionStatus}`);
        }

        return status;
    }
}

export default new PaymentService();