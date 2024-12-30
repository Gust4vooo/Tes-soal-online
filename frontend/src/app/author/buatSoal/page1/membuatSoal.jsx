'use client';

import React, { useState } from 'react';
import 'react-quill/dist/quill.snow.css';
import { useEffect } from 'react';
import sanitizeHtml from 'sanitize-html';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { storage } from "../../../firebase/config";
import { IoMdArrowRoundBack } from "react-icons/io";
import { AiOutlineCloseSquare } from 'react-icons/ai';
import { BsImage } from 'react-icons/bs';
import { v4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import dynamic from 'next/dynamic';
import Swal from 'sweetalert2'; 

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false 
});
// import dotenv from 'dotenv';

// dotenv.config();
// const URL = process.env.NEXT_PUBLIC_API_URL;

const MembuatSoal = () => {
  const router = useRouter();
  const [testId, setTestId] = useState('');
  const [category, setCategory] = useState('');
  const [multiplechoiceId, setMultiplechoiceId] = useState('');
  const [pageName, setPageName] = useState('');
  const [question, setQuestion] = useState('');
  const [number, setNumber] = useState('');
  const [questionPhoto, setQuestionPhoto] = useState(null);
  const [weight, setWeight] = useState();
  const [discussion, setDiscussion] = useState('');
  // ini biar opsi langsung muncul 2
  const [options, setOptions] = React.useState([
    { optionDescription: '', optionPhoto: null, isCorrect: false },
    { optionDescription: '', optionPhoto: null, isCorrect: false },
  ]);
  const [pages, setPages] = useState([{ questions: [] }]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('buattes'); 
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const testIdFromUrl = params.get("testId");
    const categoryFromUrl = params.get("category");
    const multiplechoiceIdFromUrl = params.get("multiplechoiceId");
    const pageNameFromUrl = params.get("pageName");
    const numberFromUrl = params.get("nomor");

    console.log("Fetched testId:", testIdFromUrl); 
    console.log("Fetched multiplechoiceId:", multiplechoiceIdFromUrl); 
    console.log("Raw pageName from URL:", pageNameFromUrl);

    if (pageNameFromUrl) {
      const decodedPageName = decodeURIComponent(pageNameFromUrl);
      console.log("Decoded pageName:", decodedPageName);
      setPageName(decodedPageName);
    }
    if (testIdFromUrl) {
      setTestId(testIdFromUrl);
    }
    if (multiplechoiceIdFromUrl) {
      setMultiplechoiceId(multiplechoiceIdFromUrl); 
    }
    if (numberFromUrl) setNumber(numberFromUrl);
  }, []);

  useEffect(() => {
    if (!multiplechoiceId) return;
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:2000/api/multiplechoice/question/${multiplechoiceId}`);
        if (!response.ok) {
          const errorMessage = await response.text(); 
          throw new Error(`Error: ${response.status} - ${errorMessage}`);
        }
        const data = await response.json();
        console.log('Response dari API:', data);
        // setPageName(data.pageName);
        setWeight(data.weight);
        setNumber(data.number);
        setQuestion(data.question);
        setOptions(data.option);
        setDiscussion(data.discussion);
        if (data.questionPhoto && data.questionPhoto !== "") {
          setQuestionPhoto(data.questionPhoto);
          console.log("Loaded question photo URL:", data.questionPhoto);
        } else {
          setQuestionPhoto(null);
        }

        if (data.option && Array.isArray(data.option)) {
          setOptions(data.option.map(opt => ({
            id: opt.id,
            optionDescription: opt.optionDescription,
            optionPhoto: opt.optionPhoto || null,
            isCorrect: opt.isCorrect || false,
            points: opt.points
          })));
          console.log('Options sebelum mapping:', data.option);
        }
        
      } catch (error) {
        console.error('Error fetching question:', error);
        setError('Terjadi kesalahan saat memuat data: ' + error.message);
      }
    };
  
    fetchData();
  }, [multiplechoiceId]);
  
  const addOption = () => {
    setOptions((prevOptions) => {
      if (prevOptions.length < 5) {
        return [...prevOptions, { 
          optionDescription: '', 
          optionPhoto: null, 
          isCorrect: false 
        }];
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Maksimal 5 opsi hanya diperbolehkan',
          text: 'Anda tidak dapat menambahkan lebih dari 5 opsi.',
          confirmButtonText: 'OK',
        });
        return prevOptions;
      }
    });
  };

  // Fungsi untuk mencegah penghapusan opsi 1 dan 2
  const removeOption = (index) => {
    if (index < 2) {
      Swal.fire({
        icon: 'warning',
        title: 'Opsi ini tidak dapat dihapus',
        text: 'Minimal 2 opsi harus ada.',
        confirmButtonText: 'OK',
      });
      return;
    }

    setOptions((prevOptions) => prevOptions.filter((_, i) => i !== index));
  };
  

  // const handleOptionChange = (index, field, value) => {
  //   const newOptions = options.map((option, i) => 
  //     i === index ? { ...option, [field]: value } : option
  //   );
  //   setOptions(newOptions);
  // };

  const handleOptionChange = async (index, content, type) => {
    const newOptions = [...options];
    const currentOption = { ...newOptions[index] };
    
    switch (type) {
      case 'text':
        currentOption.optionDescription = content;
        currentOption.optionPhoto = null;
        break;
      case 'image':
        try {
          const imageRef = ref(storage, `options/${content.name + v4()}`);
          const snapshot = await uploadBytes(imageRef, content);
          const imageUrl = await getDownloadURL(snapshot.ref);
          currentOption.optionDescription = '';
          currentOption.optionPhoto = imageUrl;
        } catch (error) {
          console.error('Error uploading image:', error);
          return;
        }
        break;
      case 'points':
        currentOption.points = content;
        break;
    }
    newOptions[index] = currentOption;
    setOptions(newOptions);
  };

  const handleCorrectOptionChange = (index) => {
    const newOptions = options.map((option, i) => ({
      ...option,
      isCorrect: i === index, 
    }));
    console.log('Options setelah perubahan isCorrect:', newOptions);
    setOptions(newOptions);
  };

  const handleWeightChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setWeight(value); 
    }
  }

  const loadPagesFromLocalStorage = () => {
    if (testId && typeof window !== 'undefined') {
      const savedPages = localStorage.getItem(`pages_${testId}`);
      if (savedPages) {
        return JSON.parse(savedPages);
      }
    }
    return null;
  };

  useEffect(() => {
    const savedPages = loadPagesFromLocalStorage();
    if (savedPages) {
        setPages(savedPages);
    }
  }, [testId]); 

  const handleDelete = async () => {
    if (confirm("Apakah Anda yakin ingin menghapus soal ini?")) {
      try {
        const localStorageKey = `pages-${testId}`;
        
        if (multiplechoiceId && multiplechoiceId !== "null") {
          const response = await fetch(`http://localhost:2000/api/multiplechoice/question/${multiplechoiceId}`, {
            method: 'DELETE',
          });
  
          if (!response.ok) {
            throw new Error('Gagal menghapus soal dari database');
          }
        }

        const savedPages = localStorage.getItem(localStorageKey);
        console.log('Data sebelum dihapus:', savedPages);
  
        if (savedPages) {
          let pages = JSON.parse(savedPages);
          let deletedNumber = null;
          let deletedPageIndex = -1;

          pages.forEach((page, pageIndex) => {
            const questionIndex = page.questions.indexOf(parseInt(number));
            if (questionIndex !== -1) {
              deletedNumber = parseInt(number);
              deletedPageIndex = pageIndex;
              page.questions.splice(questionIndex, 1);
            }
          });
  
          console.log('Nomor yang dihapus:', deletedNumber); 
          console.log('Data setelah splice:', pages); 

          if (deletedNumber !== null) {
            const allNumbers = pages.reduce((acc, page) => [...acc, ...page.questions], []);
            console.log('Semua nomor setelah flatten:', allNumbers); 

            pages = pages.map(page => ({
              ...page,
              questions: page.questions.map(num => 
                num > deletedNumber ? num - 1 : num
              ).sort((a, b) => a - b)
            }));
  
            console.log('Data setelah reorder:', pages); 
            pages = pages.filter(page => page.questions.length > 0);
            localStorage.setItem(localStorageKey, JSON.stringify(pages));   
            console.log('Data final yang disimpan:', pages); 
          }
        }

        router.push(`/author/buatSoal?testId=${testId}`);
        
      } catch (error) {
        console.error('Error saat menghapus soal:', error);
        alert('Terjadi kesalahan saat menghapus soal. Silakan coba lagi.');
      }
    }
  };

  const handleDeleteJawaban = async (index, optionId) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);

    try {
      if (optionId) {
        const response = await fetch(`http://localhost:2000/api/multiplechoice/option/${optionId}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            console.error('Failed to delete option:', response.statusText);
        } else {
          console.log('Opsi berhasil dihapus dari server');
        } 
      }
    } catch (error) {
        console.error('Error deleting option:', error);
    }
  };

  const handleBack = () => {
    console.log("testId:", testId);
    router.push(`/author/buatSoal?testId=${testId}`);
  };

  const validateForm = () => {
    const validationErrors = [];
    if (!question.trim()) {
      validationErrors.push("Soal wajib diisi");
    }
    if (!weight || weight <= 0) {
      validationErrors.push("Bobot harus diisi dengan nilai lebih dari 0");
    }
    if (options.length < 2) {
      validationErrors.push("Minimal harus ada 2 opsi jawaban");
    } else {
      const emptyOptions = options.filter((option, index) => 
        !option.optionDescription.trim() && !option.optionPhoto
      );
      
      if (emptyOptions.length > 0) {
        validationErrors.push("Semua opsi jawaban harus diisi");
      }
    }
    const correctOptionsCount = options.filter(option => option.isCorrect).length;
    if (correctOptionsCount === 0) {
      validationErrors.push("Pilih salah satu jawaban yang benar");
    } else if (correctOptionsCount > 1) {
      validationErrors.push("Hanya boleh memilih satu jawaban yang benar");
    }
    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const valid = validateForm();
    // setIsValid(valid);

    if (!valid.isValid) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membuat Soal',
        html: valid.errors.map(error => `• ${error}`).join('<br>'),
        confirmButtonText: 'OK',
        confirmButtonColor: '#0B61AA',
      });
      return;
    }

    try {
      let uploadedImageUrl = questionPhoto;
      if (questionPhoto instanceof File) {
        const imageRef = ref(storage, `question/${questionPhoto.name + v4()}`);
        const snapshot = await uploadBytes(imageRef, questionPhoto);
        uploadedImageUrl = await getDownloadURL(snapshot.ref); 
      }

      const formattedOptions = options.map(option => ({
        optionDescription: option.optionDescription,
        optionPhoto: option.optionPhoto,
        points: parseFloat(option.points) || 0,
        isCorrect: option.isCorrect,
      }));

      const questionData = {
        pageName,
        question: question,
        number: parseInt(number),
        questionPhoto: uploadedImageUrl,
        weight: parseFloat(weight),
        discussion: discussion,
        options: formattedOptions
      };
  
      let response;
      let result;

      if (multiplechoiceId !== "null") {
        response = await fetch(`http://localhost:2000/api/multiplechoice/update-question/${multiplechoiceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questionData),
        });
  
        if (response.ok) {
          result = await response.json();
          console.log('Update successful:', result);

          const existingPages = JSON.parse(localStorage.getItem(`pages_${testId}`)) || [];
          const updatedPages = existingPages.map(page => 
            page.id === multiplechoiceId 
              ? { ...questionData, id: multiplechoiceId }
              : page
          );
          localStorage.setItem(`pages_${testId}`, JSON.stringify(updatedPages));
        }
      } else {
        response = await fetch('http://localhost:2000/api/multiplechoice/add-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            testId: testId,
            questions: [questionData],
          }),
        });
  
        if (response.ok) {
          result = await response.json();
          console.log('Response dari API:', result);
          const newMultiplechoiceId = result.data[0].id;
          console.log('MultiplechoiceId:', newMultiplechoiceId);

          localStorage.setItem('pageName', pageName);
          const existingPages = JSON.parse(localStorage.getItem(`pages_${testId}`)) || [];
          const newQuestion = { 
            id: newMultiplechoiceId,
            ...questionData,
          };
          existingPages.push(newQuestion);
          localStorage.setItem(`pages_${testId}`, JSON.stringify(existingPages));
        }
      }
  
      if (response.ok) {
        const encodedPageName = encodeURIComponent(pageName);
        router.push(`/author/buatSoal?testId=${testId}&pageName=${encodedPageName}`);
      } else {
        console.error('Failed to process request:', response.statusText);
      }
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Soal berhasil disimpan!',
        confirmButtonColor: '#0B61AA',
      }).then(() => {
        const encodedPageName = encodeURIComponent(pageName);
        router.push(`/author/buatSoal?testId=${testId}&pageName=${encodedPageName}`);
      });
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan saat menyimpan soal. Silakan coba lagi.',
        confirmButtonColor: '#0B61AA',
      });
    }
  };

  const renderOptionContent = (option, index) => {
    if (option.optionPhoto) {
      return (
        <div className="relative">
          <img 
            src={option.optionPhoto} 
            alt={`Option ${index + 1}`} 
            className="max-w-full h-auto"
          />
          <button
            type="button"
            onClick={() => handleOptionChange(index, '', 'text')}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded"
          >
            <AiOutlineCloseSquare className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="relative w-full">
        <textarea
          value={option.optionDescription}
          onChange={(e) => handleOptionChange(index, e.target.value, 'text')}
          className="w-full p-2 border rounded min-h-[100px]"
          placeholder="Tulis opsi jawaban atau masukkan gambar..."
        />
        <button
          type="button"
          onClick={() => document.getElementById(`optionInput-${index}`).click()}
          className="absolute bottom-2 right-2 bg-gray-100 p-2 rounded"
        >
          <BsImage className="w-5 h-5" />
        </button>
        <input
          id={`optionInput-${index}`}
          type="file"
          hidden
          accept="image/*"
          onChange={(e) => handleOptionChange(index, e.target.files[0], 'image')}
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto p-0" style={{ maxWidth: '1978px' }}>
      <header 
        className="bg-[#0B61AA] text-white p-4 sm:p-6 font-poppins w-full"
        style={{ height: 'auto' }}
      >
        <div className="flex items-center max-w-[1978px] w-full px-2 sm:px-4 mx-auto">
          <Link href="/author/buatSoal" className="flex items-center space-x-2 sm:space-x-4">
            <IoMdArrowRoundBack className="text-white text-2xl sm:text-3xl lg:text-4xl" />
            <img src="/images/etamtest.png" alt="Etamtest" className="h-[40px] sm:h-[50px]" />
          </Link>
        </div>
      </header>
  
      <div className="w-full p-2">
        <nav className="bg-[#FFFFFF] text-black p-4">
          <ul className="grid grid-cols-2 gap-2 sm:flex sm:justify-around sm:gap-10">
            <li>
              <button
                className={`w-[100px] sm:w-[140px] md:w-[180px] px-2 sm:px-4 md:px-8 py-1 sm:py-2 md:py-4 rounded-full shadow-xl font-bold font-poppins text-xs sm:text-sm md:text-base ${
                  activeTab === 'buattes' ? 'bg-[#78AED6]' : ''
                }`}
                onClick={() => setActiveTab('buattes')}
              >
                Buat Soal
              </button>
            </li>
            <li>
              <button
                className={`w-[100px] sm:w-[140px] md:w-[180px] px-2 sm:px-4 md:px-8 py-1 sm:py-2 md:py-4 rounded-full shadow-xl font-bold font-poppins text-xs sm:text-sm md:text-base ${
                  activeTab === 'publikasi' ? 'bg-[#78AED6]' : ''
                }`}
              >
                Publikasi
              </button>
            </li>
          </ul>
        </nav>
  
        <div className="container mx-auto lg: p-2 p-4 w-full" style={{ maxWidth: '1309px' }}>
          <header className='bg-[#0B61AA] font-bold font-poppins text-white p-4'>
            <div className="flex items-center justify-between">
              <span>{pageName}</span>
            </div>
          </header>
    
          <div className="bg-[#FFFFFF] border border-black p-4 rounded-lg shadow-md w-full mb-6 " >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <label htmlFor="soal">No. </label>
                <p className="inline-block text-black">
                  {number}
                </p>
              </div>
              <div className='m'>
                <div className='border border-black bg-[#D9D9D9] p-2 rounded mb-4' style={{ maxWidth: '100%', height: 'auto' }}>
                  <div className="p-4 flex flex-wrap sm:flex-nowrap justify-between items-center mb-2">
                    <div className="flex items-center w-full sm:w-auto mb-2 sm:mb-0">
                      <label className="block text-sm sm:text-sm md:text-base font-medium">
                        Soal Pilihan Ganda
                      </label>
                    </div>
                      <div className="flex items-center w-full sm:w-auto">
                        <label className="font-medium-bold mr-2 text-sm sm:text-sm md:text-base">
                          Bobot
                        </label>
                        <input
                          type="text"  // Menggunakan type="text" agar fleksibel dalam menangani desimal
                          min="0"
                          step="0.1"  // Langkah desimal menjadi 0.1 untuk satu angka setelah titik
                          id="weight"
                          value={weight}
                          onChange={(e) => {
                            const value = e.target.value;

                            // Validasi hanya angka dan satu titik desimal, maksimal satu angka desimal
                            if (/^\d*\.?\d{0,1}$/.test(value)) {
                              setWeight(value);  // Mengupdate state jika input valid
                            }
                          }}
                          onKeyDown={(e) => {
                            // Cek jika tombol yang ditekan adalah titik
                            if (e.key === '.') {
                              // Cek jika input sebelumnya tidak kosong atau tidak ada angka sebelumnya
                              if (!weight || isNaN(weight)) {
                                e.preventDefault();  // Mencegah titik jika tidak ada angka sebelumnya
                              }
                            }

                            // Blokir karakter selain angka dan titik desimal jika sudah ada angka sebelumnya
                            if (
                              e.key !== "Backspace" &&
                              e.key !== "Tab" &&
                              e.key !== "ArrowLeft" &&
                              e.key !== "ArrowRight" &&
                              (e.key < "0" || e.key > "9") &&  // Hanya angka
                              e.key !== "."  // Hanya titik desimal yang diperbolehkan jika ada angka sebelumnya
                            ) {
                              e.preventDefault();
                            }
                          }}
                          onBlur={(e) => {
                            // Pastikan input diformat menjadi satu desimal saat kehilangan fokus
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              setWeight(value.toFixed(1));  // Memastikan satu angka desimal
                            } else {
                              setWeight("");  // Reset jika input tidak valid
                            }
                          }}
                          className="border p-1 text-xs sm:p-1 sm:text-sm md:text-base w-full sm:w-auto rounded-md"
                          required
                        />
                      </div>
                  </div>
                  <ReactQuill 
                    value={question} 
                    onChange={setQuestion} 
                    modules={{
                      toolbar: [
                        [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['bold', 'italic', 'underline'],
                        ['image'],
                        ['clean']
                      ],
                      // handlers: {
                      //   image: () => document.getElementById('imageUpload').click() // Trigger input file upload
                      // }
                    }}
                    formats={[
                      'header',
                      'font',
                      'list',
                      'bullet',
                      'bold',
                      'italic',
                      'underline',
                      'image',
                    ]}
                    // onImageUpload={uploadImage}
                    className='bg-white shadow-md rounded-md border border-gray-500'
                    style={{ maxWidth: '1978px', height: '150px', overflow: 'hidden' }}
                    placeholder='Buat Soal di sini...'
                    required 
                  />
                </div>
              </div>

              <div className="mb-4">
                {typeof questionPhoto === 'string' && questionPhoto ? (
                  // Show existing image from Firebase
                  <div className="mb-2">
                    <img 
                      src={questionPhoto} 
                      alt="Question" 
                      className="max-w-md h-auto"
                    />
                    <button 
                      type="button"
                      onClick={() => setQuestionPhoto(null)}
                      className="mt-2 bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Hapus Gambar
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    onChange={(event) => setQuestionPhoto(event.target.files[0])}
                    className="border p-2 w-full"
                    accept="image/*"
                  />
                )}
             </div>

             {/* bagian untuk opsi */}
             <div>
                <h2 className="block text-sm sm:text-sm md:text-base font-medium mb-2">Jawaban</h2>
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    {/* Opsi Jawaban */}
                    <div className="w-full mb-4 sm:mb-0">
                      {renderOptionContent(option, index)}
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Tombol Benar */}
                      <button
                        type="button"
                        className="flex items-center justify-between text-black font-bold px-1 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm md:text-base rounded-[10px] border border-black hover:bg-gray-200 hover:text-blue-500 space-x-2"
                      >
                        <input
                          type="radio"
                          id={`jawaban-${index}`}
                          name="jawabanBenar"
                          value={index}
                          checked={option.isCorrect}
                          onChange={() => handleCorrectOptionChange(index)}
                          className={`w-4 h-4 ${
                            !isValid && !options.some((opt) => opt.isCorrect) ? 'border border-red-700' : ''
                          }`}
                        />
                        <span>Benar</span>
                      </button>

                      {/* Tombol Hapus hanya untuk opsi ke-3 dan seterusnya */}
                      {index >= 2 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteJawaban(index, option.id)}
                          className="ml-4"
                        >
                          <AiOutlineCloseSquare className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Tombol Tambah Opsi */}
                {options.length < 5 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="bg-[#7bb3b4] hover:bg-[#8CC7C8] border border-black px-1 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm md:text-base font-poppins rounded-[10px] text-black font-bold"
                  >
                    + Tambah
                  </button>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm sm:text-sm md:text-base font-medium mb-2">Pembahasan</label>
                <ReactQuill 
                  value={discussion} 
                  onChange={setDiscussion} 
                  modules={{
                    toolbar: [
                      [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['bold', 'italic', 'underline'],
                      ['clean']
                    ]
                  }}
                  formats={[
                    'header',
                    'font',
                    'list',
                    'bullet',
                    'bold',
                    'italic',
                    'underline',
                  ]}
                  // onImageUpload={uploadImage}
                  placeholder='Tulis kunci jawaban di sini...' />
              </div>
            </form>
            <div className="mt-4 flex flex-wrap justify-end items-center gap-2 sm:gap-4">
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleDelete}
                  className="bg-[#E58A7B] border border-black px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm md:text-base hover:text-white font-poppins rounded-[10px]"
                >
                  Hapus
                </button>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="bg-[#E8F4FF] border border-black px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm md:text-base hover:text-white font-poppins rounded-[10px]"
                  >
                    Simpan
                  </button>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleBack}
                  className="bg-[#A6D0F7] border border-black px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm md:text-base hover:text-white font-poppins rounded-[10px]"
                >
                  Kembali
                </button>
              </div>
            </div>
          </div>
        </div>  
      </div>
    </div>
  ); 
};

export default MembuatSoal;
