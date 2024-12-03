'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function RiwayatTransaksiHeader() {
  const [activeTab, setActiveTab] = useState('Belum Bayar');
  const [menuOpen, setMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    console.log('Transactions updated:', transactions);
  }, [transactions]);

  useEffect(() => {
    // Mengakses localStorage di sisi klien
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    console.log('Token:', storedToken);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Fungsi untuk menghapus teks dalam kurung
  const formatStatus = (status) => {
    return status.replace(/\s*\(.*?\)\s*/g, '').trim();
  };

  // Fungsi untuk mengambil riwayat transaksi dari backend
  const fetchTransactions = async () => {
    if (!token) {
      console.error('Token tidak tersedia');
      return;
    }

    try {
      const response = await fetch('http://localhost:2000/api/riwayat-transaksi', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched Transactions:', data);
        setTransactions(data);
      } else {
        console.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, [token]);

  // Fungsi untuk mendapatkan data sesuai dengan tab yang aktif
const getDataByTab = () => {
  console.log('All Transactions:', transactions);
  console.log('Active Tab:', activeTab);
  const filteredTransactions = transactions.filter((item) => {
    const itemStatus = item.customStatus || '';
    return itemStatus.includes(activeTab);
  });
  console.log('Filtered Transactions:', filteredTransactions);
  return filteredTransactions;
};

  return (
    <>
      {/* Header Utama */}
      <header className="w-[375px] h-[48px] sm:w-[1440px] sm:h-[115px] bg-[#0B61AA] text-white p-4 py-2 sm:py-8 relative z-50">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
          {/* Bagian Kiri: Ikon Menu dan Gambar dengan tulisan Etamtest (Vector.png) */}
          <div className="flex items-center space-x-4 mb-4 sm:mb-0 w-full sm:w-auto justify-start">
            {/* Ikon Menu */}
            <button onClick={toggleMenu} className="sm:hidden">
              <img
                src="/images/menu.png"
                alt="Menu"
                className="h-8 w-auto"
              />
            </button>
            <Link href="/">
              <img
                src="/images/etamtest.png"
                alt="Etamtest"
                className="w-[85px] h-[25px] sm:w-[190px] sm:h-[43px]"
              />
            </Link>
          </div>

          {/* Bagian Kanan: Menu Home, Favorit, Transaksi, FAQ, dan gambar profil */}
          <div className="hidden sm:flex flex-wrap justify-center sm:justify-end items-center space-x-4">
            <Link href="/" className="hover:text-gray-200 text-2xl">
              Home
            </Link>
            <Link href="/favorit" className="hover:text-gray-200 text-2xl">
              Favorit
            </Link>
            <Link href="/transaksi" className="text-black font-bold text-2xl">
              Transaksi
            </Link>
            <Link href="/faq" className="hover:text-gray-200 text-2xl">
              FAQ
            </Link>
            <Link href="/profile">
              <img
                src="/images/profil.png"
                alt="Profil"
                className="h-15 w-15 rounded-full"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Menu Mobile */}
      {menuOpen && (
        <div className="fixed insert-0 z-40 flex">
          {/* Bar Putih di Sebelah Kiri */}
          <div className="bg-white w-[174px] h-[592px] absolute top-[50px] z-50">
            {/* Bagian atas menu untuk profil */}
            <div className="flex flex-col items-center p-4 border-b">
              <img
                src="/images/Profile.png"
                alt="Profil"
                className="h-20 w-20 rounded-full mb-2"
              />
              <span className="text-sm font-semibold">Abellia Putri Dwi Masita</span>
            </div>
            {/* Menu */}
            <div className="flex flex-col p-4 space-y-4">
              <Link href="/" className="text-sm text-[#0B61AA]">
                Home
              </Link>
              <Link href="/favorit" className="text-sm text-[#0B61AA]">
                Favorit
              </Link>
              <Link href="/transaksi" className="text-sm text-[#0B61AA] font-bold">
                Transaksi
              </Link>
              <Link href="/profile">
                <img
                  src="/images/profil.png"
                  alt="Profil"
                  className="h-10 w-10 rounded-full"
                />
              </Link>
            </div>
          </div>
          {/* Latar Belakang untuk menutup menu */}
          <div className="flex-1 bg-black opacity-50 z-30" onClick={toggleMenu}></div>
        </div>
      )}

      {/* Tab Menu di Bawah Header */}
      <nav className="w-[375px] h-[51px] sm:w-[1440px] sm:h-[68px] bg-white shadow-md overflow-x-auto">
        <div className="container mx-auto flex flex-nowrap justify-start space-x-2 py-2 sm:py-4">
      {[
        'Belum Bayar',
        'Berhasil (Belum Dikerjakan)',
        'Selesai (Sudah Dikerjakan)',
        'Tidak Berhasil'
      ].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`text-lg px-4 pb-2 text-xs sm:text-lg ${
            activeTab === tab ? 'text-[#0B61AA] border-b-4 border-[#0B61AA]' : 'text-gray-500'
          } hover:text-[#0B61AA]`}
        >
          {formatStatus(tab)} {/* Hilangkan teks dalam kurung untuk tampilan tab */}
        </button>
      ))}

        </div>
      </nav>

      {/* Konten Berdasarkan Tab yang Aktif */}
      <div className="container mx-auto p-4 space-y-4">
        {getDataByTab().map((item) => (
          <div
            key={item.id}
            className="w-full sm:w-[1374px] bg-[#F3F3F3] shadow-md p-4 flex rounded-lg"
          >
            {/* Gambar Tes dengan Kategori dan Jumlah Orang */}
            <div className="bg-white relative w-[112px] h-[140px] sm:w-[150px] sm:h-[168px] rounded-lg shadow-md flex flex-col items-center justify-center">
              {/* Icon mata dan jumlah orang */}
              <div className="absolute top-1 left-2 flex items-center space-x-1 text-sm text-gray-500">
                <img src="/images/eye-icon.png" alt="Jumlah Dikerjakan" className="w-4 h-4" />
                <span>{item.historyCount}</span>
              </div>
              {/* Gambar */}
              <img
                src={item.image || '/images/tes.png'}
                alt={item.test.title}
                className="w-[70px] h-[80px] sm:w-[100px] sm:h-[120px] object-contain"
              />
              {/* Kategori Tes */}
              <div className="text-center mt-2 text-sm font-semibold text-[#0B61AA]">
                Try Out {item.test.category}
              </div>
            </div>


            {/* Detail Tes */}
            <div className="ml-4 flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-[#0B61AA]">{item.test.title}</h3>
              <p className="text-xs sm:text-sm text-[#0B61AA]">
                Prediksi Kemiripan {item.test.similarity}%
              </p>
              <div className="flex items-center mt-4 pt-4">
                <img
                  src={item.test.author?.photo || '/images/foto.png'}
                  alt="Foto Pembuat"
                  className="w-10 h-10 rounded-full mr-2"
                />
                <div>
                  <p className="text-xs sm:text-sm">Dibuat Oleh:</p>
                  <strong className="text-xs sm:text-sm">{item.test.author?.name || 'Penulis Tidak Diketahui'}</strong>
                </div>
              </div>
              {/* Tautan Aksi */}
              <div className="flex justify-end mt-4 space-x-2">
                {item.customStatus === 'Belum Bayar' && (
                  <Link href="/bayar" className="bg-[#0B61AA] text-white text-sm sm:text-lg px-4 py-2 rounded-lg">
                    Bayar
                  </Link>
                )}
                {item.customStatus === 'Berhasil (Belum Dikerjakan)' && (
                  <Link href="/mulai" className="bg-[#0B61AA] text-white text-sm sm:text-lg px-4 py-2 rounded-lg">
                    Mulai
                  </Link>
                )}
                {item.customStatus === 'Selesai (Sudah Dikerjakan)' && (
                  <Link href="/score" className="bg-[#0B61AA] text-white text-sm sm:text-lg px-4 py-2 rounded-lg">
                    Score
                  </Link>
                )}
                {item.customStatus === 'Tidak Berhasil' && (
                  <Link href="/beli-lagi" className="bg-[#0B61AA] text-white text-sm sm:text-lg px-4 py-2 rounded-lg">
                    Beli Lagi
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </>
  );
}
