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
              <div className="justify-start w-full">
                <Link href="/admin/dashboard">
                  <button className="block font-poppins font-bold w-full py-2 px-2 hover:bg-deepBlue text-white rounded-full text-sm lg:text-lg text-left">
                    Home
                  </button>
                </Link>
                <Link href="/admin/kelola-author"> 
                  <button className="block font-poppins font-bold w-full py-2 px-2 bg-deepBlue bg-opacity-50  hover:bg-deepBlue text-white rounded-full text-sm lg:text-lg text-left">
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
              <div className="block lg:flex justify-center rounded-lg items-center bg-[#F3F3F3] lg:w-[837px] w-[210px] h-[440px] lg:h-[463px]">
                  {/* Box 1 */}
                  <div className="lg:w-[190px] lg:h-[200px] text-center p-3 bg-paleBlue hover:bg-newHeaderColor shadow-lg m-3 rounded-lg flex flex-col justify-center items-center text-[#0B61AA] text-lg font-bold">
                    <Link legacyBehavior href="/admin/kelola-author/data-author" passHref>
                      <a className="w-full h-full flex flex-col justify-center items-center animate-flyIn">
                        <img src="/images/dataAuthor.png" alt="Data Author" className="w-20 lg:w-51 object-cover" />
                        <p className="mt-3 lg:text-basic">Data Author</p>
                      </a>
                    </Link>
                  </div>

                  {/* Box 2 */}
                  <div className="lg:w-[190px] lg:h-[200px] justify-center text-center p-3 bg-paleBlue  shadow-lg hover:bg-newHeaderColor m-3 rounded-lg flex flex-col items-center text-[#0B61AA] text-lg font-bold">
                    <Link legacyBehavior href="/admin/kelola-author/verifikasi-author" passHref>
                      <a className="w-full h-full flex flex-col justify-center items-center animate-flyIn">
                        <img src="/images/dataAuthor.png" alt="Verifikasi Author" className="w-20 lg:w-51 object-cover" />
                        <p className="mt-3 lg:text-basic">Verifikasi Author</p>
                      </a>
                    </Link>
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
