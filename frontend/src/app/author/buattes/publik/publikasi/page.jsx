'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoMdArrowRoundBack } from "react-icons/io";
import dotenv from 'dotenv';

dotenv.config();
const URL = process.env.NEXT_PUBLIC_API_URL;

export default function PublikasiPage() {
  const [namaTes, setNamaTes] = useState('');
  const [testId, setTestId] = useState(null);
  const [durasiTes, setDurasiTes] = useState('')
  const [hargaTes, setHargaTes] = useState('');
  const [prediksiKemiripan, setPrediksiKemiripan] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [title, setTitle] = useState('');
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const testIdFromUrl = params.get("testId");
    
    if (testIdFromUrl) {
      setTestId(testIdFromUrl);
    }
  }, []);

  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        const response = await fetch(`https://${URL}/test/test-detail/${testId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch test details');
        }
        const data = await response.json();
        setTitle(data.title);
        setEditableTitle(data.title);
      } catch (error) {
        console.error('Error fetching test details:', error);
      }
    };

    fetchTestDetails();
  }, [testId]);

  const handlePublish = async () => {
    const [hours, minutes] = durasiTes.split(':').map(Number);
    const totalMinutes = (hours || 0) * 60 + (minutes || 0);
    const priceAsInteger = parseInt(hargaTes.replace(/[^\d]/g, ''), 10);

    const payload = {
        title: title,
        price: priceAsInteger,
        similarity: parseFloat(prediksiKemiripan),
        worktime: totalMinutes
    };

    // Validasi input
    if (!payload.title || !payload.price || isNaN(payload.similarity) || isNaN(payload.worktime)) {
        alert("Semua field harus diisi untuk publikasi.");
        return;
    }

    try {
        const response = await fetch(`https://${URL}/test/tests/${testId}/publish`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('Tes berhasil disimpan!');
            setShowSuccessPopup(true); 
            setShowErrorPopup(false);
            
            setTimeout(() => {
                router.push('/author/dashboard');
            }, 2000); 
        } else {
            console.error('Gagal menyimpan tes.', await response.text());
            setShowErrorPopup(true);
            setShowSuccessPopup(false);
        }
    } catch (error) {
        console.error('Error:', error);
        setShowErrorPopup(true);
        setShowSuccessPopup(false);
    }
};

  const closePopup = () => {
    setShowSuccessPopup(false);
    setShowErrorPopup(false);
  };
  const [activeTab, setActiveTab] = useState('publikasi');


  const handleDurasiTes = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, ""); 

    if (value.length > 4) value = value.slice(0, 4); 

    if (value.length <= 2) {
      setDurasiTes(value); 
  } else {
      // Format hh:mm
      setDurasiTes(`${value.slice(0, 2)}:${value.slice(2)}`);
  }
};
const handleHargaTes = (e) => {
  let value = e.target.value.replace(/[^0-9]/g, ""); 

  if (value === "") {
      setHargaTes(""); 
      return;
  }

  let formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, "."); 

  setHargaTes("Rp " + formattedValue); 
};

  return (
    <div>
      {/* Bar Atas */}
      <header className="bg-[#0B61AA] text-white p-6 font-poppins" style={{ maxWidth: '1440px', height: '108px' }}>
  <div className="container mx-auto flex justify-start items-center max-w-7xl px-4">
    <Link href="/author/buatSoal">
      <IoMdArrowRoundBack className="text-white text-3xl sm:text-3xl lg:text-4xl ml-2" />
    </Link>
    <Link href="/author/dashboard">
      <img src="/images/etamtest.png" alt="Etamtest" className="h-[50px] ml-4" style={{ maxWidth: '179px' }} />
    </Link>
  </div>
</header>


      {/* Navigasi */}
      <nav className="bg-[#FFFFFF] text-black p-4">
        <ul className="grid grid-cols-2 sm:flex sm:justify-around gap-4 sm:gap-10">
          <li>
            <button
              className={`w-[140px] sm:w-[180px] px-4 sm:px-8 py-2 sm:py-4 rounded-full shadow-xl font-bold font-poppins ${activeTab === 'buatTes' ? 'bg-[#78AED6]' : ''}`}
              onClick={() => setActiveTab('buatTes')}
            >
              Buat Soal
            </button>
          </li>
          <li>
            <button
              className={`w-[140px] sm:w-[180px] px- sm:px-8 py-2 sm:py-4 rounded-full shadow-xl font-bold font-poppins ${activeTab === 'publikasi' ? 'bg-[#78AED6]' : ''}`}
              onClick={() => setActiveTab('publikasi')}
            >
              Publikasi
            </button>
          </li>
        </ul>
      </nav>

      <div className="bg-[#78AED6] p-8 sm:p-8 rounded-md mx-[4px] sm:mx-12 w-auto h-[700px] mt-[20px]">
        <div className="flex justify-start pr-9">
          {/* Bagian Kiri, Teks Rata Kanan */}
          <div className="text-left pr-5">
            <h3 className="font-poppins text-black sm:text-lg mb-6 mt-7 sm:pt-6">Nama Tes</h3>
            <h3 className="font-poppins text-black sm:text-lg mb-4 mt-7 sm:pt-12">Durasi Tes</h3>
            {/* <h3 className="font-poppins text-black text-lg mb-4 mt-5">Acak Pertanyaan</h3> */}
            {/* <h3 className="font-poppins text-black text-lg mb-4 mt-5">Maksimum Percobaan Kuis</h3> */}
            <h3 className="font-poppins text-black sm:text-lg mb-4 mt-7 sm:pt-12">Harga Tes</h3>
            <h3 className="font-poppins text-black sm:text-lg mb-4 mt-7 sm:pt-12">Prediksi Kemiripan</h3>
          </div>

          {/* Bar putih di samping */}
          <div className="bg-white p-6 sm:p-6 rounded-md shadow-lg w-full h-[550px]">
            {/* Input Nama Tes */}
            <div className="mb-4 sm:pt-4">
              <input
                type="text"
                className="w-full border border-gray-300 p-2 rounded-full bg-white text-gray-500"
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Nama Tes"
              />
            </div>
            <div className="mb-4 sm:pt-12">
                <input
                    type="text"
                    className="w-full border border-gray-300 p-2 rounded-full bg-white text-gray-500"
                    value={durasiTes}
                    onChange={handleDurasiTes}
                    placeholder="hh:mm"
                />
            </div>

            {/* Dropdown Harga Tes */}
            <div className="mb-4 sm:pt-12">
              <input
                type="text"
                className="w-full border border-gray-300 p-2 rounded-full bg-white text-gray-500"
                value={hargaTes}
                onChange={handleHargaTes}
                placeholder="Masukkan Harga Tes"
              />
            </div>

            {/* Dropdown Prediksi Kemiripan */}
            <div className="mb-4 sm:pt-12">
              <select
                className="w-full sm:w-full border border-gray-300 p-2 rounded-full bg-white text-gray-500"
                value={prediksiKemiripan}
                onChange={(e) => setPrediksiKemiripan(e.target.value)}
              >
                <option value="" disabled>Kemiripan Soal</option>
                <option value="0.85">45%</option>
                <option value="0.65">65%</option>
                <option value="0.80">80%</option>
              </select>
            </div>
          </div>
        </div>

        <div className="relative min-h-[600px] sm:min-h-[450px]">
          <div className="absolute bottom-90 mt-4 right-9 pb-10  mr-[-20px]">
          <button
            onClick={handlePublish}
            className="bg-white text-black w-[110px] sm:w-[170px] px-6 py-2 rounded-md hover:bg-[#0B61AA] hover:text-white transition duration-300" 
          >
            Publikasi
          </button>
        </div>
        </div>
      </div>

        {/* Pop-up Sukses */}
        {showSuccessPopup && (
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50  text-sm sm:text-lg">
        <div className="w-[90%] max-w-[619px] bg-[#78AED6] text-black p-4 rounded-lg text-center  text-sm sm:text-lg">
          <h2 className="font-bold bg-[#0B61AA] text-white p-4 rounded-t-lg">
            Tes Berhasil Di Publikasikan
          </h2>
          <p className="my-4">
            Tes kamu sekarang bisa diakses oleh peserta
          </p>
          <button
            className="bg-white text-black px-4 py-2 rounded-md mt-4"
            onClick={closePopup}
          >
            Oke
          </button>
        </div>
      </div>
    )}

    {/* Pop-up Gagal */}
    {showErrorPopup && (
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50  text-sm sm:text-lg">
        <div className="w-[90%] max-w-[619px] bg-[#78AED6] text-black p-4 rounded-lg text-center  text-sm sm:text-lg">
          <h2 className="font-bold bg-[#0B61AA] text-white p-4 rounded-t-lg">
            Publikasi Gagal
          </h2>
          <p className="my-4">
            Pastikan semua data telah diisi dengan lengkap
          </p>
          <button
            className="bg-white text-black px-4 py-2 rounded-md mt-4"
            onClick={closePopup}
          >
            Oke
          </button>
        </div>
      </div>
    )}
      </div>
  );
}