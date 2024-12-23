'use client';

import Link from 'next/link';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { IoPersonCircle } from "react-icons/io5";
import { IoWalletOutline } from "react-icons/io5";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { IoMenu } from "react-icons/io5";

import dotenv from 'dotenv';

dotenv.config();

const URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [authorData, setAuthorData] = useState(null);
    const [userData, setUserData] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showNotification, setShowNotification] = useState(false); 
    const [showProcessNotification, setShowProcessNotification] = useState(false); 
    const [selectedBank, setSelectedBank] = useState('');
    const [otherBankName, setOtherBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [loadingUser, setLoadingUser] = useState(false);
    const [errorUser, setErrorUser] = useState(null);
    const [token, setToken] = useState('');
    const [authorProfit, setAuthorProfit] = useState(null);
    const [transactions, setTransactions] = useState([]);

    const banks = ['BCA', 'BNI', 'MANDIRI', 'Bank Lainnya'];

    useEffect(() => {
        if (showHistory) {
          const fetchTransactionHistory = async () => {
            try {
              const token = localStorage.getItem('token');
              if (!token) {
                throw new Error('No authentication token found');
              }
              
              const response = await fetch('http://localhost:2000/api/withdrawals/history', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
    
              if (!response.ok) {
                throw new Error('Failed to fetch transaction history');
              }
    
              const data = await response.json();
              setTransactions(data); // Menyimpan data transaksi ke state
            } catch (error) {
              console.error('Error fetching transaction history:', error);
            }
          };
    
          fetchTransactionHistory();
        }
      }, [showHistory]);

    useEffect(() => {
        const fetchAuthorData = async () => {
          try {
            const token = localStorage.getItem('token');
    
            if (!token) {
              throw new Error('No authentication token found');
            }
    
            const response = await axios.get('http://localhost:2000/author/authorID', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });    
            setAuthorData(response.data.data);
          } catch (err) {
            console.error('Error fetching author data:', err);
            setError(err.message);      }
        };
    
        fetchAuthorData();
      }, []);

    useEffect(() => {
      const fetchUserData = async () => {
        let token;
        if (typeof window !== 'undefined') {
          token = localStorage.getItem('token');
        }

        if (!token) {
          setErrorUser('Token tidak ditemukan');
          setLoadingUser(false);
          return;
        }

        try {
          setLoadingUser(true);
          const response = await fetch(`http://localhost:2000/user/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }

          const data = await response.json();
          if (data) {
            setUserData(data);
          } else {
            throw new Error('Data pengguna tidak ditemukan');
          }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setErrorUser('Gagal mengambil data pengguna');
            if (error.message === 'Failed to fetch user data') {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
            }
            router.push('/login');
            }
        } finally {
            setLoadingUser(false);
        }
    };

        fetchUserData();
    }, []);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
        }
      }, []);


    const handleBankChange = (e) => {
    setSelectedBank(e.target.value);
    if (e.target.value !== 'Bank Lainnya') {
      setOtherBankName('');
    }
  };

  const handleWithdrawClick = () => {
    setIsOpen(prev => !prev);
  };

  const handleSubmit = () => {
    setShowNotification(true);
    setIsClicked(true);
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };
  
  const handleWithdrawSubmit = async () => {
    try {
      const payload = {
        withdrawAmount,
        bank: selectedBank === 'Bank Lainnya' ? otherBankName : selectedBank,
        notes, 
      };
  
      console.log('Mengirim data:', payload);
      // Kirim ke backend
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const textStyle = {
    color: isClicked ? 'black' : '#d5cccc'
  };

  const handleOutsideClick = () => {
    setShowNotification(false);
    setShowProcessNotification(false); 
    setIsOpen(false);
    setSelectedBank('');
    setOtherBankName('');
    setAccountNumber('');
    setWithdrawAmount('');
    setNotes('');
    setTimeout(() => {
      setShowProcessNotification(false);
      setIsClicked(false); 
    },);
  };

  const handleProcessClick = async () => {
    // Menyembunyikan notifikasi jika penarikan dimulai
    setShowNotification(false); 
    
    try {
        const token = localStorage.getItem('token');
    
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:2000/api/withdrawals/payout', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                beneficiary_bank: selectedBank.toLowerCase(),
                beneficiary_account: accountNumber,
                amount: withdrawAmount,
                notes: notes,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.error || 'Terjadi kesalahan. Pastikan data diisi dengan benar dan saldo anda mencukupi');
            return;
        }

        setShowProcessNotification(true);

        const result = await response.json();
        console.log('Response:', result);
        alert('Penarikan berhasil!');
    } catch (error) {
        console.error('Error:', error);
        alert('Penarikan gagal.');
    }
};  

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const totalAmount = Number(withdrawAmount);

  const [errorMessage, setErrorMessage] = useState('');

  const handleWithdrawInput = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Hanya izinkan angka
    setWithdrawAmount(value);

    // Validasi minimal 50.000 dan kelipatan 1.000
    if (value < 50000) {
      setErrorMessage('Nominal minimal adalah Rp 50.000.');
    } else if (value % 10000 !== 0) {
      setErrorMessage('Nominal harus dalam kelipatan Rp 10.000.');
    } else {
      setErrorMessage(''); // Bersihkan pesan error jika validasi terpenuhi
    }

  };
  
  const handleLogout = async () => {
    try {
      const response = await fetch(`http://localhost:2000/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Logout failed');

      localStorage.clear();
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <>
      <header className="flex flex-wrap justify-between lg:justify-end items-center bg-[#0B61AA] p-4 z-40">
        <button
          className="lg:hidden text-white text-2xl"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <IoMenu />
        </button>

        <div className="flex items-center justify-between lg:justify-end">
          <span className="text-xl text-white font-poppins font-bold mr-3 lg:mr-5">
            Hai, {userData?.name}
          </span>
          <div className="relative inline-block">
              {userData?.userPhoto ? (
                <img
                  src={userData.userPhoto}
                  alt="User Profile"
                  className="h-14 w-14 rounded-full cursor-pointer object-cover"
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                />
              ) : (
                <IoPersonCircle
                  className="h-14 w-14 rounded-full cursor-pointer text-white"
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                />
              )}
          </div>
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#78AED6] p-5 z-50 transform transition-transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Tombol untuk menutup sidebar */}
        <button
          className="absolute top-4 left-4 text-white text-2xl lg:hidden"
          onClick={() => setIsSidebarOpen(false)} // Menutup sidebar
        >
          ✕
        </button>

        {/* Logo yang tetap ada di sidebar */}
        <div className="lg:block text-white mb-5 mt-8 lg:mt-2">
          <img src="/images/etamtest.png" alt="Logo" className="h-auto w-36" />
        </div>

        <nav>
          <ul className="space-y-3 mt-7">
            <li className="text-white cursor-pointer py-2 px-4 hover:bg-deepBlue rounded-lg bg-opacity-50 rounded-lg py-2 px-4 min-w-[200px]">
              <Link legacyBehavior href="/author/dashboard">
                <a>Home</a>
              </Link>
            </li>
            <li className="text-white cursor-pointer py-2 px-4 hover:bg-deepBlue rounded-lg bg-opacity-50 rounded-lg py-2 px-4 min-w-[200px]">
              <Link legacyBehavior href="/author/analisis-soal">
                <a>Analisis Soal</a>
              </Link>
            </li>
            <li className="text-white cursor-pointer bg-[#0B61AA] hover:bg-deepBlue bg-opacity-50 rounded-lg py-2 px-4 min-w-[200px]">
              <Link legacyBehavior href="/author/my-saldo">
                <a>My Saldo</a>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Overlay untuk menutup sidebar ketika klik di luar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)} // Menutup sidebar
        />
      )}

      <main className="flex-1 bg-white overflow-y-auto lg:ml-64 lg:pl-2 transition-all duration-300">
        <div className='mt-4 mb-4 px-4'>
            <div className='flex items-center mb-4'>
              <IoWalletOutline className="w-10 h-10 mr-3 text-current text-black" alt="Icon"/>
              <span className='text-black font-normal'>Saldo Saya</span>
            </div>
            <section className="saldo-section bg-[#f1f1f1] rounded-lg p-5 shadow-md w-full">
            <div className="saldo-container flex items-center justify-between mb-5 px-8">
                <div className="saldo-amount font-normal whitespace-nowrap text-[#0B61AA] lg:text-3xl">
                {authorData?.profit !== undefined && authorData?.profit !== null
                    ? `Rp ${Number(authorData.profit).toLocaleString('id-ID')}.00,-`
                    : 'Rp 0.00,-'}
                </div>
                <button
                    onClick={handleWithdrawClick}
                    className="w-20 h-10 withdraw-button bg-[#0B61AA] text-white py-2 px-12 rounded-[15px] font-bold text-[10px] shadow-md ml-5 hover:bg-[#2C9BD1] sm:mt-4 flex justify-center items-center"
                    >
                    Tarik Dana
                </button>
            </div>
            </section>

            {isOpen && (
            <section className="bg-[#f1f1f1] rounded-lg p-5 mt-5 shadow-lg w-full">
                <h3 className="border-b-2 border-gray-300 mb-5 pb-5">Detail Penarikan</h3>
                <div className="flex flex-col gap-4 border-b-2 border-gray-300 mb-5 pb-5">
                {/* Nama Bank */}
                <div className="flex items-center justify-between">
                    <label className="w-1/3 mr-2">Nama Bank</label>
                      <div className='flex items-center'>
                          <select
                              value={selectedBank}
                              onChange={handleBankChange}
                              className="w-full max-w-[200px] p-1 text-xs rounded-[8px] pl-3 border border-black"
                          >
                              <option value="" className='text-xs p-1'>Pilih Nama Bank</option>
                              {banks.map((bank, index) => (
                              <option key={index} value={bank} className='text-xs p-1'>
                                  {bank}
                              </option>
                              ))}
                          </select>
                          {selectedBank === 'Bank Lainnya' && (
                            <input
                              type="text"
                              value={otherBankName}
                              onChange={(e) => setOtherBankName(e.target.value)}
                              placeholder="Masukkan Nama Bank"
                              className="ml-2 p-1 text-xs rounded-[8px] border border-black"
                            />
                          )}
                      </div>
                </div>

                {/* Nomor Rekening */}
                <div className="flex items-center">
                    <label className="w-1/3 mr-2">Nomor Rekening</label>
                    <input
                        type="text"
                        placeholder="Masukkan nomor rekening"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className={`w-[200px] 2xl:w-[400px] p-2 rounded-[15px] ml-auto border border-black text-xs italic placeholder:text-xs ${accountNumber ? 'text-left' : 'text-center'}`}
                    />
                </div>

                {/* Nominal Penarikan */}
                <div className="flex items-start">
                    <label className="w-1/3 mr-2">Nominal Penarikan</label>
                    <div className='flex flex-col ml-auto'>
                    <input
                        type="text"
                        placeholder="Masukkan nominal penarikan"
                        value={withdrawAmount}
                        onChange={handleWithdrawInput}
                        className={`border border-black w-[200px] 2xl:w-[400px] p-2 rounded-[15px] ml-auto italic text-xs placeholder:text-xs ${withdrawAmount ? 'text-left' : 'text-center'}`}
                    />
                    {errorMessage && <p className="font-light text-xs mt-1 ml-2">{errorMessage}</p>}
                    {/* <span className='mt-1 ml-2 text-[8px] font font-light text-xs'>Example : 1500 </span> */}
                    </div>
                </div>

                <div className="flex items-center">
                    <label className="w-1/3 mr-2">Pesan</label>
                    <textarea
                      className=" w-[200px] 2xl:w-[400px] p-2 text-xs border rounded-[15px] ml-auto border-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Tambahkan pesan atau catatan di sini"
                      value={notes}
                      onChange={handleNotesChange}
                    ></textarea>
                </div>

                <h4 className="border-b-2 border-gray-300 pb-2 mt-6">Rincian Penarikan</h4>
                <div className ="border-b-2 border-gray-300 pb-5 mb-2">
                    <div className="flex justify-between mt-2">
                    <p>Nominal Penarikan:</p>
                    <p className="font-bold text-[#d5cccc]" style={textStyle}>
                        Rp. {withdrawAmount ? Number(withdrawAmount).toLocaleString('id-ID') : '0,00'}
                    </p>
                    </div>
                </div>

                <div className="flex justify-between mt-2 border-b-2 border-gray-300 pb-2">
                    <p className="font-semibold">Total Penarikan:</p >
                    <p className="font-bold text-[#d5cccc]" style={textStyle}>
                    Rp. {totalAmount.toLocaleString('id-ID')}
                    </p>
                </div>

                <div className="flex justify-end mt-4">
                    <button
                        className="w-20 h-10 bg-[#0B61AA] text-white py-2 px-12 rounded-[15px] font-bold text-[10px] shadow-md hover:bg-[#2C9BD1] sm:mt-4 flex justify-center items-center"
                        onClick={handleSubmit}
                    >
                        Tarik
                    </button>
                    </div>
                </div>
            </section>
            )}

            {/* Riwayat Transaksi */}
            <section className="transaction-section bg-[#f1f1f1] rounded-lg p-5 mt-5 shadow-md w-full">
            <div
                className="transaction-history text-lg text-black flex items-center cursor-pointer"
                onClick={toggleHistory}
            >
                <span
                className={`mr-4 text-2xl text-black transform transition-transform duration-300 ${showHistory ? 'rotate-90' : 'rotate-0'}`}
                >
                ›
                </span>
                <span>Riwayat Transaksi</span>
            </div>
            </section>

            {showHistory && (
            <div className="history-content relative mt-2 transition-all duration-300">
                <div className="relative mt-5">
                <table className="min-w-[500] lg:min-w-[930px] mx-8 border-collapse border border-gray-200 text-left rounded-lg bg-white shadow-lg">
                <thead>
                    <tr className="bg-[#0b61aa] text-white">
                    <th className="py-3 px-4">No. Reference</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                        <td className="py-3 px-4">{transaction.reference}</td>
                        <td className="py-3 px-4">{new Date(transaction.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{transaction.amount.toLocaleString()}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
                </div>
            </div>
            )}
        </div>
        {/* Notifikasi validasi */}
        {showNotification && (
          <div
            className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50"
            onClick={handleOutsideClick}
          >
            <div
              className="bg-[#78AED6] rounded-lg p-4 text-center w-[90%] max-w-[496px] relative pb-2 sm:p-6 sm:pb-4 
              max-[580px]:w-[95%] max-[580px]:p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold mb-2 text-lg sm:text-xl max-[580px]:text-base">Validasi</h3>
              <hr className="border-t-1 border-black mb-4" />
              <div className="text-left mb-2">
                <p className="flex justify-between mb-4 text-sm sm:text-base max-[580px]:text-xs">
                  <span>Rekening Tujuan:</span>
                  <strong className="font-normal">{accountNumber}</strong>
                </p>
                <p className="flex justify-between mb-4 text-sm sm:text-base max-[580px]:text-xs">
                  <span>Nama Penerima:</span>
                  <strong>{userData?.name}</strong>
                </p>
                <hr className="border-t-1 border-black mb-4" />
                <p className="flex justify-between mb-4 text-sm sm:text-base max-[580px]:text-xs">
                  <span>Nominal:</span>
                  <strong>Rp {withdrawAmount ? Number(withdrawAmount).toLocaleString('id-ID') : '0,00'}</strong>
                </p>
                <p className="flex justify-between mb-4 text-sm sm:text-base max-[580px]:text-xs">
                  <span>Total:</span>
                  <strong>Rp {totalAmount.toLocaleString('id-ID')}</strong>
                </p>
              </div>
              <button
                className="bg-[#0B61AA] w-full sm:w-auto h-10 text-white px-4 py-2 rounded-lg mt-3 sm:mt-0 text-sm sm:text-base max-[580px]:text-xs"
                style={{ lineHeight: '1' }}
                onClick={handleProcessClick}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}

        {showProcessNotification && (
          <div
            className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50"
            onClick={handleOutsideClick}
          >
            <div
              className="bg-[#78aed6] rounded-lg p-4 text-center w-[280px] sm:w-[400px] relative pb-4"
              onClick={(e) => e.stopPropagation()}
            >
              <IoIosCheckmarkCircle
                className="w-16 h-16 sm:w-20 sm:h-20 mb-4 mt-4 mx-auto text-current text-black"
                alt="Success Icon"
              />
              <h3 className="text-base sm:text-xl font-bold mb-4">
                Permintaan Anda <br /> Sedang Diproses
              </h3>
              <p className="text-left text-xs sm:text-sm mb-6 px-2 sm:px-4 leading-relaxed">
                • Proses penarikan saldo biasanya memakan waktu 1-3 hari kerja.
                <br />
                • Anda akan menerima notifikasi melalui email ketika saldo berhasil
                ditransfer ke rekening bank Anda.
              </p>
            </div>
          </div>
        )}
      </main>
  </>
  );

}