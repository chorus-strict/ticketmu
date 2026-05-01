import crypto from 'crypto';
import axios from 'axios';
import { PaymentLogService } from './payment-log.service';

interface TripayConfig {
  api_key: string;
  private_key: string;
  merchant_code: string;
  environment: 'sandbox' | 'production';
}

export class TripayService {
  private static getBaseUrl(env: string) {
    return env === 'production' 
      ? 'https://tripay.co.id/api/' 
      : 'https://tripay.co.id/api-sandbox/';
  }

  static async createTransaction(params: {
    method: string;
    merchant_ref: string;
    amount: number;
    customer_name: string;
    customer_email: string;
    order_items: any[];
    config: TripayConfig;
  }) {
    const { method, merchant_ref, amount, customer_name, customer_email, order_items, config } = params;
    
    try {
      if (!config.api_key || !config.private_key || !config.merchant_code) {
        throw new Error('Tripay configuration is incomplete');
      }

      const signature = crypto
        .createHmac('sha256', config.private_key)
        .update(config.merchant_code + merchant_ref + amount)
        .digest('hex');

      const payload = {
        method,
        merchant_ref,
        amount,
        customer_name,
        customer_email,
        order_items,
        callback_url: `${process.env.APP_URL || ''}/api/webhook/tripay`,
        return_url: `${process.env.APP_URL || ''}/payment-success`,
        expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        signature
      };

      const response = await axios.post(
        `${this.getBaseUrl(config.environment)}transaction/create`,
        payload,
        {
          headers: { Authorization: `Bearer ${config.api_key}` }
        }
      );

      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      console.error('Tripay API Error:', errorMsg);
      return { success: false, message: errorMsg };
    }
  }

  static verifyWebhookSignature(payload: string, signature: string, privateKey: string) {
    const calculatedSignature = crypto
      .createHmac('sha256', privateKey)
      .update(payload)
      .digest('hex');
    
    return calculatedSignature === signature;
  }
}
