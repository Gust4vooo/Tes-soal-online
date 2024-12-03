'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function EditProfile() {
  const [authorData, setAuthorData] = useState({ name: '', email: '' });
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
  
        const response = await fetch('http://localhost:2000/author/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          throw new Error('Failed to fetch author data');
        }
  
        const data = await response.json();
        setAuthorData({
          ...data,
          authorPhoto: data.authorPhoto || '/images/profil.png' // Gunakan foto default jika tidak ada
        });
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          password: '', // Password should not be pre-filled for security reasons
          authorPhoto: data.authorPhoto || null
        });
      } catch (error) {
        console.error('Error fetching author data:', error);
        setError(error.message);
        
        if (error.message === 'No authentication token found') {
          router.push('auth/login');
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchAuthorData();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prevData => ({
        ...prevData,
        authorPhoto: file
      }));
      
      // Preview gambar (opsional)
      const reader = new FileReader();
      reader.onloadend = () => {
        setAuthorData(prevData => ({
          ...prevData,
          authorPhotoPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    handleSubmit(e);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);
      if (formData.password) {
        formDataToSend.append('password', formData.password);
      }
      // Jika ada file foto yang diupload
      if (formData.authorPhoto instanceof File) {
        formDataToSend.append('authorPhoto', formData.authorPhoto);
      }
  
      const response = await fetch('http://localhost:2000/author/profile/edit', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });
  
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
  
      const updatedData = await response.json();
      setAuthorData(updatedData.data);
      Swal.fire({
        title: 'Success!',
        text: 'Profile updated successfully',
        icon: 'success',
        confirmButtonText: 'OK',
      }).then(() => {
        window.location.reload();
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = async () => {
    await router.push('/user/page');
  };  


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col p-0 md:px-0" style={{ maxWidth: '1440px' }}>
      <div className="w-full bg-[#0B61AA] p-4 text-white flex justify-between items-center rounded-md">
        <div className="flex-shrink-0">
          <img src="/images/etamtest.png" alt="Etamtest" className="h-6 object-contain" style={{ maxWidth: '216px', height: '52px' }} />
        </div>
        <div className="flex-shrink-0">
          <img src="/img/keluar.png" alt="Home" className="max-w-[44px] h-[22px]" onClick={handleLogout} />
        </div>
      </div>

      <div className="min-h-screen flex flex-col p-8 bg-[#FFFFFF] font-sans">
        <div className="w-full max-w-[1228px] h-[88px] mx-auto mt-2 p-4 bg-[#0B61AA] text-white flex items-center justify-between rounded-md">
          <div className="flex items-center">
          <div className="w-16 h-16 rounded-full flex justify-center items-center relative">
              <img src={authorData.authorPhoto || "/images/profil.png"} alt="Profil" className="h-16 w-16 rounded-full object-cover" />
              <img
                src="/images/camera.png"
                alt="Kamera"
                className="h-6 w-6 absolute bottom-0 right-1 cursor-pointer"
                onClick={() => document.getElementById('uploadProfileImage').click()}
              />
              <input
                type="file"
                id="uploadProfileImage"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-semibold font-poppins">{authorData.firstName} {authorData.lastName}</h3>
              <p className="font-poppins">{authorData.email}</p>
            </div>
          </div>

          <div className="actions flex items-center justify-end space-x-2">
            <div className="flex items-center justify-center w-[29px] h-[29px] bg-white rounded-[10px]">
              <img src="/images/trash.png" alt="sampah" className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="w-full max-w-[1228px] mx-auto mt-0 p-4 bg-white shadow-md border border-black rounded-md">
          <form className="space-y-4 mt-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="relative">
              <label className="block text-gray-700 font-poppins">Nama Depan</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full p-2 border border-black rounded-[15px] mt-1 font-poppins"
              />
              
            </div>

            <div className="relative">
              <label className="block text-gray-700 font-poppins">Nama Belakang</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full p-2 border border-black rounded-[15px] mt-1 pr-10 font-poppins"
              />
              
            </div>

            <div className="relative">
              <label className="block text-gray-700 font-poppins">Email</label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-black rounded-[15px] mt-1 pr-10 font-poppins"
              />
              
            </div>

            <div className="relative">
              <label className="block text-gray-700 font-poppins">Ubah Kata Sandi</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border border-black rounded-[15px] mt-1 font-poppins"
              />
              
            </div>

            <div className="flex justify-end">
              <button type="submit" className="bg-[#0B61AA] text-white px-4 py-2 rounded-[15px] font-poppins">
                Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


