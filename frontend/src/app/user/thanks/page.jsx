'use client';
import React, { useEffect } from 'react';
import {faCheckCircle} from 'react-icons/fa';
import { useRouter } from 'next/navigation';

const PaymentSuccessPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Hapus query parameters tanpa mengubah URL secara langsung
    const cleanUrl = window.location.pathname;
  }, []);

  const handleBackToDashboard = () => {
    // Navigasi ke dashboard tanpa query parameters
    router.push('/user/dashboard');
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
        <faCheckCircle className="mx-auto text-green-500 mb-4" size={80} />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Terima Kasih</h1>
        <p className="text-gray-600 mb-6">Pembayaran Anda Berhasil</p>
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-green-800 font-medium">
            Pembayaran telah dikonfirmasi. Terima kasih telah melakukan transaksi.
          </p>
        </div>
        <button 
          onClick={handleBackToDashboard}
          className="mt-6 w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;