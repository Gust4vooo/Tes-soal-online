'use client';

import React, { useState } from 'react';
import axios from 'axios';

const PayoutForm = () => {
  const [formData, setFormData] = useState({
    beneficiary_name: '',
    beneficiary_account: '',
    beneficiary_bank: '',
    beneficiary_email: '',
    amount: '',
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const data = {
      payouts: [
        {
          beneficiary_name: formData.beneficiary_name,
          beneficiary_account: formData.beneficiary_account,
          beneficiary_bank: formData.beneficiary_bank,
          beneficiary_email: formData.beneficiary_email,
          amount: formData.amount,
          notes: formData.notes
        }
      ]
    };

    console.log('Data:', data); 

    try {
      const response = await axios.post(
        'https://app.sandbox.midtrans.com/iris/api/v1/payouts',
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from('IRIS-570e43c8-d69f-4e48-9fcb-527c5850b7a2:').toString('base64')}`,
            'Accept': 'application/json'
          }
        }
      );
      setResponseMessage('Payout sent successfully!');
      console.log('Response:', response.data);
    } catch (error) {
      setResponseMessage('Error sending payout.');
      console.error('Error:', error);
    }

    setIsLoading(false);
  };

  return (
    <div>
      <h2>Send Payout</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Beneficiary Name:</label>
          <input
            type="text"
            name="beneficiary_name"
            value={formData.beneficiary_name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Beneficiary Account:</label>
          <input
            type="text"
            name="beneficiary_account"
            value={formData.beneficiary_account}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Beneficiary Bank:</label>
          <input
            type="text"
            name="beneficiary_bank"
            value={formData.beneficiary_bank}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Beneficiary Email:</label>
          <input
            type="email"
            name="beneficiary_email"
            value={formData.beneficiary_email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Amount:</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Notes:</label>
          <input
            type="text"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Payout'}
        </button>
      </form>
      {responseMessage && <p>{responseMessage}</p>}
    </div>
  );
};

export default PayoutForm;
