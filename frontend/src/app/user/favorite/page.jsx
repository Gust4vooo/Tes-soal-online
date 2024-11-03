'use client';

import Link from 'next/link';
import  { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function Favorite() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState([true]);
  const [error, setError] = useState([null]);
  const [token, setToken] = useState('');
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [likedItems, setLikedItems] = useState({});

  useEffect(() => {
    const getUserIdFromToken = () => {
      try {
        setLoading(true);
        // Pastikan kode ini hanya dijalankan di sisi klien
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Token tidak ditemukan');
          }

          const decodedToken = jwtDecode(token);
          if (!decodedToken.id) {
            throw new Error('User ID tidak ditemukan dalam token');
          }

          setUserId(decodedToken.id);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setError(error.message);
        // Redirect ke halaman login jika token tidak valid
      } finally {
        setLoading(false);
      }
    };

    getUserIdFromToken();
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
        const response = await fetch('http://localhost:2000/user/profile', {
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
          // Token mungkin tidak valid atau kadaluarsa
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

if (loading && !error) {
  return <div className="text-center mt-20">Loading...</div>;
}

useEffect(() => {
  // Inisialisasi semua item sebagai liked secara default
  const initialLikedState = {};
  favorites.forEach((test) => {
    initialLikedState[test.id] = true; // Set semua item ke 'liked' saat pertama kali
  });
  setLikedItems(initialLikedState);
}, []);

const menus = [
  {href:'/user/dashboard', text: "Home"},
  {href:'/user/favorite', text: "Favorit"},
  {href:'/user/riwayat-transaksi', text: "Transaksi"},
]

const [isSidebarOpen, setIsSidebarOpen] = useState(false);


const toggleSidebar = () => {
  setIsSidebarOpen(!isSidebarOpen);
  if (!isSidebarOpen) {
    document.body.classList.add('overflow-hidden');
  } else {
    document.body.classList.remove('overflow-hidden');
  }
};

// Ambil status like dari server saat komponen dimuat
// Mengambil status like dari server saat komponen dimuat
useEffect(() => {
  const fetchFavoritesData = async () => {
    try {
      const response = await fetch('http://localhost:2000/api/favorites', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      const favoriteTests = await response.json();
      
      // Tambahkan isHidden: false ke setiap item
      const updatedFavoriteTests = favoriteTests.map((test) => ({
        ...test,
        isHidden: false,
      }));

      setFavorites(updatedFavoriteTests); // Update state favorites dengan data yang sudah ditambahkan isHidden

      // Inisialisasi status likedItems berdasarkan data favorit yang diambil
      const initialLikedState = {};
      updatedFavoriteTests.forEach((test) => {
        initialLikedState[test.id] = true;
      });
      setLikedItems(initialLikedState); // Atur state likedItems setelah mendapatkan favorites
    } catch (error) {
      console.error('Error fetching favorite tests:', error);
    }
  };

  fetchFavoritesData();
}, [token]);


// Mengambil status like dari local storage saat pertama kali komponen dimuat jika belum ada dari server
useEffect(() => {
  const storedLikedItems = localStorage.getItem('likedItems');
  if (storedLikedItems && !Object.keys(likedItems).length) {
    setLikedItems(JSON.parse(storedLikedItems));
  }
}, []);

// Mengupdate local storage setiap kali likedItems diupdate
useEffect(() => {
  localStorage.setItem('likedItems', JSON.stringify(likedItems));
}, [likedItems]);

// Fungsi toggle like/unlike
const toggleLike = async (id) => {
  const isLiked = likedItems[id];

  try {
    if (isLiked) {
      // DELETE request
      const response = await fetch(`http://localhost:2000/api/favorites`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ testId: id }),
      });
      
      if (response.ok) {
        setLikedItems((prevLikedItems) => {
          const updatedItems = { ...prevLikedItems };
          delete updatedItems[id];
          return updatedItems;
        });

        // Setel isHidden ke true tanpa menghapus item
        setFavorites((prevFavorites) =>
          prevFavorites.map((test) =>
            test.testId === id ? { ...test, isHidden: true } : test
          )
        );
        location.reload();
      }
    } else {
      // POST request
      const response = await fetch(`http://localhost:2000/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ testId: id }),
      });
      
      if (response.ok) {
        setLikedItems((prevLikedItems) => ({
          ...prevLikedItems,
          [id]: true,
        }));
      }
    }
  } catch (error) {
    console.error("Error handling favorite:", error);
  }
};



  return (
    <>
      {/* Header */}
      <header className="fixed p-4 mx-auto bg-deepBlue text-white mx-auto w-full font-poppins md:max-w-3xl lg:max-w-screen-2xl lg:p-6 max-w-full z-50">
        <div className="mx-auto flex justify-between items-center font-poppins">
          <div className="flex justify-between">
            {/* Ikon Menu untuk mobile */}
            <button onClick={toggleSidebar}>
              <img 
                src="/images/menu-white.png" 
                alt="Menu" 
                className="h-[30px] lg:hidden" 
              />
            </button>

            <button onClick={toggleSidebar}>
            <img 
                src="/images/etamtest.png" 
                alt="EtamTest" 
                className="h-[30px] lg:h-10 pl-3" 
              />
            </button>
          </div>

          <div className="flex  items-center space-x-4">
            {/* Navigation Bar untuk desktop */}
            <nav className="md:block lg:block flex">
              <ul className="flex lg:space-x-7 md:space-x-4">
                {menus.map((menu, index) => (
                  <li key={index}>
                    <Link legacyBehavior href={menu.href}>
                      <a className="hidden hover:text-orange font-bold lg:block">{menu.text}</a>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {/* Profile */}
            <div className="relative inline-block">
                  <img 
                  src={userData?.userPhoto ||"/images/profile.png" } 
                  alt="profile" 
                  className="h-14 cursor-pointer mr-5"
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                  />

              {/* Dropdown */}
              {isDropdownOpen && (
              <div 
                  className="absolute right-2  mt-0 w-37 bg-white rounded-lg shadow-lg z-10 p-1 
                          before:content-[''] before:absolute before:-top-4 before:right-8 before:border-8
                          before:border-transparent before:border-b-white"
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
              >
                  <Link legacyBehavior href={`/user/edit-profile/${userId}`}>
                  <a className="block px-4 py-1 text-deepBlue text-sm text-gray-700 hover:bg-deepBlue hover:text-white rounded-md border-abumuda">
                      Ubah Profil
                  </a>
                  </Link>
                  <Link legacyBehavior href="/auth/login">
                  <a className="block px-4 py-1 text-deepBlue text-sm text-gray-700 hover:bg-deepBlue hover:text-white rounded-md">
                      Logout
                  </a>
                  </Link>
              </div>
              )}
            </div>
          </div>
          
        </div>
      </header>

      {/* Sidebar ketika tampilan mobile */}
      <aside className={`fixed top-16 pt-6 left-0 w-64 bg-white h-full transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:hidden z-40`}>
        <ul className="p-4 space-y-4 text-deepblue round-lg">
          <div className="flex flex-col items-center">
            <li>
              <img 
                src={userData?.userPhoto || "/images/profile-black.png"} 
                alt="profile" 
                className="h-14 cursor-pointer mb-2" 
              />
            </li>
            <p className="font-bold">{userData?.name}</p>
          </div>
          {menus.map((menu, index) => (
            <li key={index}>
              <Link legacyBehavior href={menu.href}>
                <a className="block hover:text-deepBlue hover:bg-paleBlue font-bold p-2">{menu.text}</a>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Overlay untuk menutup sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-50 lg:hidden z-30"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Bagian Paling Populer */}

      <section className="mx-auto p-5 font-poppins relative pt-10 ">
        <div className="mx-auto mt-5 font-bold font-poppins text-deepBlue">
        Favorite
          {/* Container untuk kategori, menambahkan grid layout yang konsisten */}
          <div className=" mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {favorites.filter((test) => !test.isHidden).map((test) => (
              <div key={test.testId} className="bg-abumuda shadow-lg p-1 relative group">
                
                  {/* Overlay background abu-abu yang muncul saat hover */}
                  <div className="absolute inset-0 bg-gray-500 opacity-0 group-hover:opacity-40 transition-opacity duration-300 z-10"></div>

                  <div className="flex justify-between items-center group-hover:blur-[2px] transition-opacity duration-300 z-10">
                    <div className="flex items-center space-x-2 font-bold text-deepBlue">
                      <img src="/images/eye-icon.png" alt="Views" className="h-3 lg:h-4 object-contain" />
                      <span className="text-[0.6rem] lg:text-sm font-poppins">{test.accessCount}</span>
                    </div>
                  </div>

                  <div className="flex justify-center mt-2 lg:mt-4 relative z-20 group-hover:blur-[2px] transition duration-300">
                    <img src="/images/tes.png" alt={test.category} className="h-9 lg:h-20 object-contain" />
                  </div>

                  <div className="flex justify-center mt-2 lg:mt-4 text-deepBlue relative z-20 group-hover:blur-[2px] transition duration-300">
                    <h3 className="text-center text-[0.8rem] lg:text-lg font-bold mt-0 lg:mt-2 font-poppins">{test.category}</h3>
                  </div>

                  <div className="bg-deepBlue text-white p-1 lg:p-2  mt-4 relative z-20 group-hover:blur-[2px] transition duration-300">
                    <div className="flex items-center space-x-2 justify-between">
                      <h3 className="text-left text-[0.625rem] lg:text-base font-bold mt-2">{test.title}</h3>
                    </div>

                    <p className="text-left text-[0.5rem] lg:text-sm leading-relaxed">Prediksi kemiripan {test.similarity}%</p>
                    <p className="text-[0.4rem] lg:text-xs leading-relaxed">Dibuat Oleh:</p>

                    <div className="flex justify-between space-x-2 leading-relaxed mt-1">
                    <div className="flex text-left space-x-1 lg:space-x-4">
                        <img src={test.author.authorPhoto || '/images/profile.png'} alt={test.author.name} className="h-3 lg:h-5 object-contain" />
                        <span className="text-[0.375rem] lg:text-sm font-semibold">{test.author.name}</span>
                      </div>
                      <span className="text-[0.375rem] lg:text-sm font-semibold">
                      {Number(test.price) === 0 ? 'Gratis' : <img src="/images/lock.png" alt="Berbayar" className="h-2 lg:h-4 inline-block object-contain" />}
                      </span>
                    </div>
                  </div>

                  <div className="absolute gap-1 bottom-5 left-0 right-0 flex justify-center items-center lg:justify-center lg:space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 p-1 w-full">
                    <a href={`/tes/detailsoal/${test.id}`} className="w-3/4 lg:w-1/4 text-xs lg:text-base text-center bg-paleBlue text-deepBlue py-3 lg:py-2 rounded-full inline-block hover:bg-orange hover:text-deepBlue mb-2 lg:mb-0">
                      Mulai
                    </a>
                    <a href={`/user/topscore/${test.id}`} className="w-3/4 lg:w-2/5 text-xs lg:text-base text-center bg-paleBlue text-deepBlue py-1 lg:py-2 rounded-full inline-block hover:bg-orange hover:text-deepBlue mb-2 lg:mb-0">
                      <i className="fa-solid fa-medal"></i>
                      <span className="ml-1">Top Score</span>
                    </a>
            
                    <button 
                      onClick={() => toggleLike(test.id)} 
                      className="lg:block text-center bg-paleBlue text-deepBlue inline-block px-3 py-2 rounded-full hover:bg-orange hover:text-deepBlue mb-2 lg:mb-0"
                    >
                      <i className={`fa${likedItems[test.id] ? "s" : "r"} fa-heart ${likedItems[test.id] ? "text-red-500" : "text-deepBlue"}`}></i>
                    </button>
                  </div>

              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}