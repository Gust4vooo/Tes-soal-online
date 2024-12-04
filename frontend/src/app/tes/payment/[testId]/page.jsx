'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { jwtDecode } from "jwt-decode";
import { IoPersonCircle } from "react-icons/io5";
import { SlBookOpen } from "react-icons/sl";

function App() {
  const { testId } = useParams();
  const [userId, setUserId] = useState(null);
  const [testTitle, setTestTitle] = useState('');
  const [testSimilarity, setTestSimilarity] = useState(null);
  const [testPrice, setTestPrice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js"
    const clientKey = process.env.PUBLIC_CLIENT_KEY
    const script = document.createElement('script')
    script.src = snapScript
    script.setAttribute('data-client-key', clientKey)
    script.async = true

    document.body.appendChild(script)

     // Decode token to get userId
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      setUserId(decodedToken.id);
    }

    return () => {
      document.body.removeChild(script)
    }
  }, []);

  useEffect(() => {
    const fetchTestDetail = async () => {
      try {
        const response = await fetch(`http://localhost:2000/api/tests/get-tests/${testId}`);
        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(`Error: ${response.status} - ${errorMessage}`)
        }
        const data = await response.json();
        console.log('Data fetched:', data);
        setTestTitle(data.title);
        setTestSimilarity(data.similarity);
        setTestPrice(data.price);
      } catch (error) {
        console.error('Failed to fetch test details:', error);
        setError('Terjadi kesalahan: ' + error.message);
      }
    };
      fetchTestDetail(); // Memanggil API ketika testId ada
  }, [testId]);


  const handlePayment = async () => {
    if (testId) {
      try {
        const token = localStorage.getItem('token'); // Ambil token dari localStorage
        
        // Ambil token dari backend
        const response = await fetch('http://localhost:2000/api/payment/payment-process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Tambahkan token ke header
          },
          body: JSON.stringify({ testId }), 
        });
  
        const data = await response.json();
  
        // Cek apakah token berhasil didapatkan
        if (response.ok && data.token) {
          // Menampilkan Midtrans Snap
          window.snap.pay(data.token, {
            onSuccess: function (result) {
              console.log('Payment success:', result);
            },
            onPending: function (result) {
              console.log('Payment pending:', result);
            },
            onError: function (result) {
              console.log('Payment error:', result);
            },
            onClose: function () {
              console.log('Payment dialog closed');
            },
          });
        } else {
          console.error('Failed to get payment token:', data.error);
        }
      } catch (error) {
        console.error('Error during payment:', error);
      }
    } else {
      console.error('Test ID not found');
    }
  };  

// Navbar Component (diganti dari kode awal Anda)
const Navbar = () => {
  return (
    <nav className="w-full bg-[#0B61AA] py-4 px-8 flex justify-between items-center">
      {/* Logo EtamTest di kiri */}
      <div className="flex items-center">
        <img
          src="/images/Vector.png"
          alt="EtamTest Logo"
          className="h-8"
        />
      </div>

      {/* Teks di kanan dan Ikon Profile */}
      <div className="flex items-center space-x-4">
        <div className="text-white text-right">
          <div className="text-lg">Membeli Paket</div>
          <div className="text-sm">Home / Try Out CPNS / Membeli Paket</div>
        </div>
        {/* Gambar Profil */}
        <IoPersonCircle className="text-white h-8 w-8" />
      </div>
    </nav>
  );
};

// Box Content Component
const PaymentBox = () => {
  return (
    <div className="flex justify-center items-center flex-1">
      <div className="bg-[#F3F3F3] shadow-lg rounded-lg p-8 w-full max-w-md text-center relative">
        {/* Logo Buku */}
        <SlBookOpen className="text-[#0B61AA] h-[108px] w-[120px] mx-auto mb-4" />

        {/* Header */}
        <h1 className="text-[#0B61AA] text-2xl font-bold mb-2">Try Out CPNS 2025 #2</h1>

        {/* Sub-header */}
        <h2 className="text-sm text-[#0B61AA] mb-4">Prediksi kemiripan 75%</h2>

        {/* Bullet List */}
        <ul className="list-disc list-inside text-justify text-black space-y-2 mb-6">
          <li>Memiliki 1x kesempatan mengerjakan soal</li>
          <li>Mendapatkan hasil Try Out secara langsung</li>
          <li>Mengetahui jawaban salah dan benar</li>
          <li>Mendapatkan penjelasan soal dalam bentuk pdf</li>
        </ul>

        {/* Harga */}
        <div className="text-right text-2xl font-bold text-gray-800 mb-8">Rp.30.000,-</div>

        {/* Button Beli */}
        <button className="absolute bottom-4 right-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">
          Beli
        </button>
      </div>
    </div>
  );
};

// Main Component
const App = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Content Box */}
      <div className="flex justify-center items-center flex-1">
        <PaymentBox />
      </div>
    </div>
  );
};

export default App;
