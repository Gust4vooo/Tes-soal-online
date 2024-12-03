"use client";
import React, { useState, useEffect } from "react";
import Link from 'next/link';

const VerifikasiAuthor1 = () => {
  const admin = [
    {
      id : 1,
      nama : "Desti Nur Irawati",
      role : "Administrator",
    }

  ];


  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalAuthors: 0,
    totalPublishedTests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('http://localhost:2000/api/admin/dashboard-stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add authentication header if required
            // 'Authorization': `Bearer ${yourAuthToken}`
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }

        const data = await response.json();
        setDashboardStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <>
      {admin.map((admin, index) => (
        <div className="flex h-screen ">
          <div className="flex h-screen">
            <div className="w-[131px]  lg:w-[350px] bg-[#78AED6] p-4 flex flex-col items-center">
              <div className="mb-5 flex items-center justify-center w-full">
                <img src="/images/etamtest.png" alt="Etam Test Logo" className="object-contain lg:h-[50px]" />
              </div>
              <div className="mb-5 flex items-center">
                <img src="/images/profile-white.png" alt="User Profile" className="rounded-full lg:w-[80px] w-[31px] object-contain" />
                <div className="ml-3 text-white">
                  <h3 className="font-poppins font-bold text-basic text-black text-[10px] lg:text-[24px] ">{admin.nama}</h3>
                  <p className="text-[18px] font-poppins m-0">{admin.role}</p>
                </div>
              </div>
              <div className="justify-start w-full ">
                <Link href="/adminDashboard"> 
                  <button className="block font-poppins font-bold w-full py-2 px-2 bg-deepBlue bg-opacity-50  hover:bg-deepBlue text-white rounded-full text-sm lg:text-lg text-left">
                    Home
                  </button>
                </Link>
                <Link href="/admin/kelola-author"> 
                  <button className="block font-poppins font-bold w-full py-2 px-2 hover:bg-deepBlue text-white rounded-full text-sm lg:text-lg text-left">
                    Kelola Author
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Main content */}
          
          <div className="flex-1 flex flex-col min-h-screen">
            <nav className="bg-[#0B61AA] p-4 flex justify-end items-center">
              <div className="flex items-center pr-5">
                <span className="text-white font-poppins font-bold mr-3">Hai, {admin.nama}!</span>
              </div>
            </nav>

            {/* Kontainer utama untuk background putih */}
            <div className="flex-1 flex justify-center items-center bg-white">
              <div className="block lg:flex justify-center items-center p-8 rounded-lg bg-paleBlue lg:w-[837px] w-[210px] h-[440px] lg:h-[463px]">
                   {/* Box 1 */}
                    <div className="bg-[#F3F3F3] w-full h-60 m-2 p-2 rounded-lg flex flex-col justify-between items-center text-[#0B61AA] font-bold shadow-lg">
                      <p className="font-poppins  text-[20px] md:text-[28px] mt-2 p-2">Total Pengguna</p>
                      <div className="flex-grow flex justify-center items-center -mt-2">
                        <img src="/images/tes.png" alt="Data Author"  className="w-20 lg:w-51 object-cover" />
                      </div>
                      <p className="font-poppins font-bold text-[25px] md:text-[35px] p-4">{dashboardStats.totalUsers}</p> 
                    </div>

                  {/* Box 2 */}
                  <div className="bg-[#F3F3F3] w-full h-60 m-2 p-2 rounded-lg flex flex-col justify-between items-center text-[#0B61AA] font-bold shadow-lg">
                    <p className="font-poppins text-[20px] md:text-[28px] mt-2 p-2">Total Author</p>
                    <div className="flex-grow flex justify-center items-center -mt-2">
                      <img src="/images/peserta.png" alt="Data Author"  className="w-20 lg:w-51 object-cover" />
                    </div>
                    <p className="font-poppins font-bold text-[25px] md:text-[35px] p-4">{dashboardStats.totalAuthors}</p> 
                  </div>

                  {/* Box 3 */}
                  <div className="bg-[#F3F3F3] w-full h-60 m-2 p-2 rounded-lg flex flex-col justify-between items-center text-[#0B61AA] font-bold shadow-lg">
                    <p className="font-poppins  text-[20px] md:text-[28px] mt-2 p-2">Total Tes</p>
                    <div className="flex-grow flex justify-center items-center -mt-2">
                      <img src="/images/dataAuthor.png" alt="Data Author"  className="w-20 lg:w-51 object-cover" />
                    </div>
                    <p className="font-poppins font-bold text-[25px] md:text-[35px] p-4">{dashboardStats.totalPublishedTests}</p> 
                  </div>
              </div>
                                                                              
            </div>
          </div>

      </div> 
      ))}

    </>
    
    
  );
};

export default VerifikasiAuthor1 ;
