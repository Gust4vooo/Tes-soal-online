'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [popularTests, setPopularTests] = useState([]);
  const [freeTests, setFreeTests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState (['']);
  const [loading, setLoading] = useState([true]);
  const [error, setError] = useState([null]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [authorTests, setAuthorTests] = useState([]);
  const [authorData, setAuthorData] = useState([]);
  
  useEffect(() => {
    const fetchAuthorTests = async () => {
      try {
        setLoading(true);
        // Ambil token dari localStorage atau dari state management Anda
        const token = localStorage.getItem('token');
        
        const response = await axios.get('http://localhost:2000/api/tests/author-tests', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setAuthorTests(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch author tests');
        setLoading(false);
        console.error('Error fetching author tests:', err);
      }
    };
  
    fetchAuthorTests();
  }, []);

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await axios.get('http://localhost:2000/author/author-data', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setAuthorData([response.data]);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch author data');
        setLoading(false);
        console.error('Error fetching author data:', err);
      }
    };
  
    fetchAuthorData();
  }, []);

  
  const author = [
    {
      id : 1,
      nama : "Desti Nur Irawati",
      role : "Administrator",
      totalSoal : 124,
      totalPeserta : 156,
    }]
      
  const testData = [
    {
      id: 1,
      kategori : "Try Out UTBK  ",
      judul : "TRY OUT UTBK 2025#1",
      prediksi_kemiripan: "Prediksi kemiripan 45%",
      views: 1386,
      author: " Rania Suyati",
      free: true,
      imageUrl: "/images/tes.png",
      authorProfile : " /images/authorProfile.png"
    },
    {
      id: 2,
      kategori : "Try Out PSIKOTEST",
      judul: "TRY OUT PSIKOTEST 2025#2",
      prediksi_kemiripan: "Prediksi kemiripan 50%",
      views: 2000,
      author: "Dilla Ayu",
      free: true, // ubah ke false untuk tes menampilkan gambar kunci
      imageUrl: "/images/tes.png",
      authorProfile : " /images/authorProfile.png"
    },
    {
      id: 3,
      kategori : "Try Out PSIKOTEST",
      judul: "TRY OUT PSIKOTEST 2025#3",
      prediksi_kemiripan: "Prediksi kemiripan 55%",
      views: 2000,
      author: "Zhang Yixing",
      free: true, // ubah ke false untuk tes menampilkan gambar kuci
      imageUrl: "/images/tes.png",
      authorProfile : " /images/authorProfile.png"
    },
    {
      id: 4,
      kategori : "Try Out PSIKOTEST",
      judul: "TRY OUT PSIKOTEST 2025#4",
      prediksi_kemiripan: "Prediksi kemiripan 70%",
      views: 1994,
      author: " Oh Sehun",
      free: true, // ubah ke false untuk tes menampilkan kunci
      imageUrl: "/images/tes.png",
      authorProfile : " /images/authorProfile.png"
    },
    {
      id: 5,
      kategori : "Try Out PSIKOTEST",
      judul: "TRY OUT PSIKOTEST 2025#5",
      prediksi_kemiripan: "Prediksi kemiripan 40%",
      views: 1974,
      author: " Oh Sehun",
      free: true, // ubah ke false untuk tes menampilkan kunci
      imageUrl: "/images/tes.png",
      authorProfile : " /images/authorProfile.png"
    },
  ];
  
  const handleSearch = async (e) => {
    
    e.preventDefault();
    if (!searchQuery) return;
  
    try {
      const response = await fetch(`http://localhost:2000/dashboard/search-tests?title=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to search tests');
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching tests:', error);
      setError(error.message);
    }
  };


  // Pindahkan semua state ke dalam komponen
  const [populercurrentIndex, populersetCurrentIndex] = useState(0);
  const [populeritemsToShow, setPopulerItemsToShow] = useState(2);

  useEffect(() => {
    const updateItemsToShow = () => {
      if (window.innerWidth >= 1024) {
        setPopulerItemsToShow(4); // Tampilkan 4 item di desktop
      } else {
        setPopulerItemsToShow(2); // Tampilkan 2 item di mobile
      }
    };

    updateItemsToShow();
    window.addEventListener('resize', updateItemsToShow);
    return () => window.removeEventListener('resize', updateItemsToShow);
  }, []);

  const populernextSlide = () => {
    if (populercurrentIndex < testData.length - populeritemsToShow) {
      populersetCurrentIndex(populercurrentIndex + 1);
    }
  };

  const populerprevSlide = () => {
    if (populercurrentIndex > 0) {
      populersetCurrentIndex(populercurrentIndex - 1);
    }
  };

  const [gratiscurrentIndex, gratissetCurrentIndex] = useState(0);
  const [gratisitemsToShow, setGratisItemsToShow] = useState(2);

  useEffect(() => {
    const updateItemsToShow = () => {
      if (window.innerWidth >= 1024) {
        setGratisItemsToShow(4);
      } else {
        setGratisItemsToShow(2);
      }
    };

    updateItemsToShow();
    window.addEventListener('resize', updateItemsToShow);
    return () => window.removeEventListener('resize', updateItemsToShow);
  }, []);

  const gratisnextSlide = () => {
    if (gratiscurrentIndex < testData.length - gratisitemsToShow) {
      gratissetCurrentIndex(gratiscurrentIndex + 1);
    }
  };

  const gratisprevSlide = () => {
    if (gratiscurrentIndex > 0) {
      gratissetCurrentIndex(gratiscurrentIndex - 1);
    }
  };

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  

  return (
    <>
      <div className="flex h-screen font-poppins">
        {/* Sidebar */}
        <aside
          className="bg-[#78AED6] w-64 p-5 flex flex-col items-start"
          style={{ height: "1100px" }} // Mengatur tinggi aside menjadi 100% dari viewport
        >
          <div className="text-white mb-5">
            <img src="/images/etamtest.png" alt="Logo" className="h-auto w-36" />
          </div>
         
          <nav>
            <ul className="space-y-3">
              <li className="text-white cursor-pointer bg-[#0B61AA] hover:bg-deepBlue bg-opacity-50 rounded-lg py-2 px-4 min-w-[200px]">
                <Link legacyBehavior href="/author/dashboard">
                  <a> Home</a>
                </Link>
              </li>
              <li className="text-white cursor-pointer py-2 px-4 hover:bg-deepBlue  rounded-lg">
                <Link legacyBehavior href="/author/analisis-soal">
                  <a> Analisis Soal</a>
                </Link>
              </li>
              <li className="text-white cursor-pointer py-2 px-4 hover:bg-deepBlue  rounded-lg">
                <Link legacyBehavior href="/my-saldo">
                  <a> My Saldo</a>
                </Link>
              </li>
            </ul>
          </nav>

        </aside>

        {/* Main Content */}
        {authorData.map((author, index) => (
        <main className="flex-1 bg-white">
          {/* Header */}
          <header className="flex justify-end items-center bg-[#0B61AA] p-4">
            <div className="relative flex inline-block items-center ">
              <div className="mx-auto">
                <span className="text-white font-poppins font-bold mr-3">Hai, {author.nama}!</span>
              </div>
              <div className='hidden lg:block'>
                <img 
                  src="/images/profile-white.png" 
                  alt="profile" 
                  className="h-14 cursor-pointer mr-3"
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                />
                {/* Dropdown */}
                {isDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-1 w-35 bg-white rounded-lg shadow-lg z-10 p-1
                              before:content-[''] before:absolute before:-top-4 before:right-8 before:border-8 
                              before:border-transparent before:border-b-white"
                    onMouseEnter={() => setDropdownOpen(true)}
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <Link legacyBehavior href="/author/edit-profile">
                      <a className="block px-4 py-1 text-deepBlue text-sm  hover:bg-deepBlue hover:text-white rounded-md border-abumuda">
                        Ubah Profil
                      </a>
                    </Link>
                    <Link legacyBehavior href="/logout">
                      <a className="block px-4 py-1 text-deepBlue text-sm  hover:bg-deepBlue hover:text-white rounded-md">
                        Logout
                      </a>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Search Bar */}
          <div className="bg-gradient-to-r from-[#CAE6F9] to-[#0B61AA] p-12">
            <div className="container justify-between mt-10 lg:mt-4 lg:max-w-[610px] max-w-full ">
                <form 
                onSubmit={handleSearch} 
                className="flex items-center p-1 rounded-2xl bg-white w-full font-poppins"
              >
                <input 
                  type="text" 
                  placeholder="Cari Tes Soal" 
                  className="flex-grow p-1 lg:p-2  rounded-2xl focus:outline-none focus:ring-2 focus:ring-powderBlue font-poppins max-w-[130px] lg:max-w-[610px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="p-1 lg:p-2 text-deepBlue font-bold rounded-2xl hover:bg-gray-200 font-poppins "
                >
                  <img 
                    src="/images/search-bar.png" 
                    alt="Search Icon" 
                    className="h-5 w-5"
                  />
                </button>
              </form>
            </div>
          </div>

          {/* Informasi Total Soal dan Peserta */}
      
          <div className="flex pr-4 gap-5 mt-4 ml-3 justify-between">
            <div className="flex pr-4 gap-5 mt-4 ml-3 ">
              <div className="bg-[#F3F3F3] px-3 py-1 max-w-auto justify-between item-center rounded-[15px] shadow-lg shadow-lg text-[#0B61AA]">
                <span>Total Soal</span>
                <span className="font-semibold ml-4">{authorData[0].totalSoal}</span>
              </div>
              <div className="bg-[#F3F3F3] px-3 py-1 max-w-auto justify-between item-center rounded-[15px] shadow-lg shadow-lg text-[#0B61AA]">
                <span>Total Peserta</span> 
                <span className="font-semibold ml-2">{authorData[0].totalPeserta}</span>
              </div>
            </div>
            
            <Link href='/author/buattes'>
              <button className="bg-[#0B61AA] text-white py-2 mt-2 px-5 p-5 rounded-[10px]">
              + NEW
              </button>
            </Link>
          </div>
         
          {/* Bagian Paling Populer */}
          <section className="mx-auto p-5 font-poppins relative">
            <div className="mx-auto mt-5 font-bold font-poppins text-deepBlue">
              Terbaru
              {/* Container untuk kategori, menambahkan grid layout yang konsisten */}
              <div className=" mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {authorTests.slice(populercurrentIndex, populercurrentIndex + populeritemsToShow).map((test) => (
                  <div key={test.id} className="bg-abumuda shadow-lg p-1 relative group">
                    
                
                      <div className="flex justify-between items-center z-10">
                        <div className="flex items-center space-x-2 font-bold text-deepBlue">
                          <img src="/images/eye-icon.png" alt="Views" className="h-3 lg:h-4 object-contain" />
                          <span className="text-[0.6rem] lg:text-sm font-poppins">{test.history}</span>
                        </div>
                      </div>

                      <div className="flex justify-center mt-2 lg:mt-4 ">
                        <img src="/images/tes.png" alt={test.kategori} className="h-9 lg:h-20 object-contain" />
                      </div>

                      <div className="flex justify-center mt-2 lg:mt-4 text-deepBlue ">
                        <h3 className="text-center text-[0.8rem] lg:text-lg font-bold mt-0 lg:mt-2 font-poppins">{test.kategori}</h3>
                      </div>

                      <div className="bg-deepBlue text-white p-1 lg:p-2  mt-4 relative z-20 ">
                        <div className="flex items-center space-x-2 justify-between">
                          <h3 className="text-left text-[0.625rem] lg:text-base font-bold mt-2">{test.judul}</h3>
                        </div>

                        <p className="text-left text-[0.5rem] lg:text-sm leading-relaxed">{test.prediksi_kemiripan}</p>
                        <p className="text-[0.4rem] lg:text-xs leading-relaxed">Dibuat Oleh:</p>

                        <div className="flex justify-between space-x-2 leading-relaxed mt-1">
                          <div className="flex text-left space-x-1 lg:space-x-4">
                            <img src={test.authorProfile} alt={test.kategori} className="h-3 lg:h-5 object-contain" />
                            <span className="text-[0.375rem] lg:text-sm font-semibold">{test.author}</span>
                          </div>
                          <span className="text-[0.375rem] lg:text-sm font-semibold">
                            {test.price === 0 ? (
                              'Gratis'
                            ) : (
                              <img src="/images/lock.png" alt="Berbayar" className="h-2 lg:h-9/2 inline-block object-contain" />
                            )}
                          </span>
                        </div>
                      </div>
                  </div>
                ))}
              </div>

              {/* Tombol panah kiri */}
              <button
                onClick={populerprevSlide}
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow hover:bg-gray-200 ${populercurrentIndex === 0 ? 'hidden' : ''}`}
              >
                &#10094;
              </button>

              {/* Tombol panah kanan */}
              <button
                onClick={populernextSlide}
                className={`absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow hover:bg-gray-200 ${populercurrentIndex >= testData.length - populeritemsToShow ? 'hidden' : ''}`}
              >
                &#10095;
              </button>
            </div>
          </section>

          {/* Bagian Populer */}
          <section className="block mx-auto p-5 font-poppins relative">
            <div className="mx-auto mt-5 font-bold font-poppins text-deepBlue">
              Populer
              {/* Container untuk kategori, menambahkan grid layout yang konsisten */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                {authorTests.slice(gratiscurrentIndex, gratiscurrentIndex + gratisitemsToShow).map((test) => (
                  <div key={test.id} className="bg-abumuda shadow-lg p-1 relative group">
                    
                    <div className="flex justify-between items-center z-10">
                      <div className="flex items-center space-x-2 font-bold text-deepBlue">
                        <img src="/images/eye-icon.png" alt="Views" className="h-3 lg:h-4 object-contain" />
                        <span className="text-[0.6rem] lg:text-sm font-poppins">{test.views}</span>
                      </div>
                    </div>

                    <div className="flex justify-center mt-2 lg:mt-4 relative z-20 ">
                      <img src="/images/tes.png" alt={test.kategori} className="h-9 lg:h-20 object-contain" />
                    </div>

                    <div className="flex justify-center mt-2 lg:mt-4 text-deepBlue relative z-20 ">
                      <h3 className="text-center text-[0.8rem] lg:text-lg font-bold mt-0 lg:mt-2 font-poppins">{test.kategori}</h3>
                    </div>

                    <div className="bg-deepBlue text-white p-1 lg:p-2  mt-4 relative z-20 ">
                      <div className="flex items-center space-x-2 justify-between">
                        <h3 className="text-left text-[0.625rem] lg:text-base font-bold mt-2">{test.judul}</h3>
                      </div>

                      <p className="text-left text-[0.5rem] lg:text-sm leading-relaxed">{test.prediksi_kemiripan}</p>
                      <p className="text-[0.4rem] lg:text-xs leading-relaxed">Dibuat Oleh:</p>

                      <div className="flex justify-between space-x-2 leading-relaxed mt-1">
                        <div className="flex text-left space-x-1 lg:space-x-4">
                          <img src={test.authorProfile} alt={test.kategori} className="h-3 lg:h-5 object-contain" />
                          <span className="text-[0.375rem] lg:text-sm font-semibold">{test.author}</span>
                        </div>
                        <span className="text-[0.375rem] lg:text-sm font-semibold">
                          {test.free ? 'Gratis' : <img src="/images/lock.png" alt="Berbayar" className="h-2 lg:h-9/2 inline-block object-contain" />}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tombol panah kiri */}
              <button
                onClick={gratisprevSlide}
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow hover:bg-gray-200 ${gratiscurrentIndex === 0 ? 'hidden' : ''}`}
              >
                &#10094;
              </button>

              {/* Tombol panah kanan */}
              <button
                onClick={gratisnextSlide}
                className={`absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow hover:bg-gray-200 ${gratiscurrentIndex >= testData.length - gratisitemsToShow ? 'hidden' : ''}`}
              >
                &#10095;
              </button>
            </div>
          </section>
        </main>
        ))}
      </div>
    </>
  );
}

