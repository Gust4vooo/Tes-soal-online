'use client';
import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useEffect } from 'react';
import sanitizeHtml from 'sanitize-html';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const MembuatSoal = () => {
  const router = useRouter();
  const [testId, setTestId] = useState('cm2i7ml8i0001wrlj72zolmrj');
  const [multiplechoiceId, setMultiplechoiceId] = useState('');
  const [id, setId] = useState('');
  const [question, setQuestion] = useState('');
  const [number, setNumber] = useState('');
  const [questionPhoto, setQuestionPhoto] = useState(null);
  const [weight, setWeight] = useState();
  const [discussion, setDiscussion] = useState('');
  const [options, setOptions] = useState([{ optionDescription: '', isCorrect: false }]);
  const [pages, setPages] = useState([{ questions: [] }]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  // const [labelCount, setlabelCount] = useState(1);
  // const [currentPage, setCurrentPage] = useState(0);
  // const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [labelCount, setLabelCount] = useState(0); 

  useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const testIdFromUrl = params.get("testId");
    const multiplechoiceIdFromUrl = params.get("multiplechoiceId");

    console.log("Fetched testId:", testIdFromUrl); 
    console.log("Fetched multiplechoiceId:", multiplechoiceIdFromUrl); 

    if (testIdFromUrl) {
      setTestId(testIdFromUrl);
    }
    if (multiplechoiceIdFromUrl) {
      setMultiplechoiceId(multiplechoiceIdFromUrl); 
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:2000/api/multiplechoice/question/${multiplechoiceId}`);
        if (!response.ok) {
          const errorMessage = await response.text(); 
          throw new Error(`Error: ${response.status} - ${errorMessage}`);
        }
        const data = await response.json();
        console.log('Response dari API:', data);
        setWeight(data.weight);
        setNumber(data.number);
        setQuestion(data.question);
        setOptions(data.option);
        setDiscussion(data.discussion);
        
      } catch (error) {
        console.error('Error fetching question:', error);
        setError('Terjadi kesalahan saat memuat data: ' + error.message);
      }
    };
  
    fetchData();
  }, [multiplechoiceId]);
  
  const addOption = () => {
    setOptions([...options, { optionDescription: '', isCorrect: false }]);
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const cleanHtml = (html) => {
    return sanitizeHtml(html, {
      allowedTags: [], 
      allowedAttributes: {},
    });
  };

  const handleWeightChange = (e) => {
    const value = e.target.value;
    // Hanya angka dan satu titik desimal
    if (/^\d*\.?\d*$/.test(value)) {
      setWeight(value); // Simpan sebagai string untuk menghindari pembulatan
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
            const response = await fetch(`http://localhost:2000/api/multiplechoice/question/${multiplechoiceId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Gagal menghapus soal dari database');
            }

            // Update state lokal
            setPages(prevPages => {
                const updatedPages = prevPages.map(page => ({
                    ...page,
                    questions: page.questions.filter(q => q !== multiplechoiceId)
                }));
                
                // Simpan ke localStorage
                if (testId && typeof window !== 'undefined') {
                    localStorage.setItem(`pages_${testId}`, JSON.stringify(updatedPages));
                }
                
                return updatedPages;
            });

            console.log('Soal berhasil dihapus');
            
            // Navigasi kembali ke halaman buat soal
            router.push(`/author/buatSoal?testId=${testId}`);
        } catch (error) {
            console.error('Error saat menghapus soal:', error);
            alert('Terjadi kesalahan saat menghapus soal. Silakan coba lagi.');
        }
    }
  };

  const [jawabanBenar, setJawabanBenar] = useState(null);

  const handleJawabanBenarChange = (index) => {
    setJawabanBenar(index);
  };

  const handleDeleteJawaban = (index) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
    if (jawabanBenar === index) {
      setJawabanBenar(null);
    }
  };
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
      testId: testId,
      questions: [
        {
          question: cleanHtml(question), 
          number: parseInt(number), 
          questionPhoto: questionPhoto || "",
          weight: parseFloat(weight), 
          discussion: cleanHtml(discussion), 
          options 
        }
      ]
    };

    try {
      const response = await fetch('http://localhost:2000/api/multiplechoice/add-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    
      if (response.ok) {
        const result = await response.json();
        console.log('Response dari API:', result); // Tambahkan ini untuk melihat seluruh data
        const MultiplechoiceId = result.data[0].id;
        console.log('MultiplechoiceId:', MultiplechoiceId);
    
        if (MultiplechoiceId) {
          router.push(`/author/buatSoal?testId=${testId}`);        
        } else {
          console.error('MultiplechoiceId is undefined');
        }
      } else {
        console.error('Failed to submit:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    [{ header: [1, 2, 3, false] }],
  ];

  const modules = {
    toolbar: toolbarOptions,
  };

  return (
    <div className="container mx-auto p-0" style={{ maxWidth: '1440px' }}>
      <header className="bg-[#0B61AA] text-white p-4 sm:p-6 font-poppins" style={{ maxWidth: '1440px', height: '90px' }}>
        <div className="w-full flex items-center justify-start h-full">
          <Link href="/">
            <img src="/img/Vector.png" alt="Vector" className="h-[50px]" style={{ maxWidth: '179px' }} />
          </Link>
        </div>
      </header>

      <header className="bg-white text-black-500 p-1 sm:p-2" style={{ maxWidth: '1440px', height: '71px' }}>
        <div className="container mx-auto flex justify-start items-center p-4">
          <nav className="flex w-full justify-start space-x-4">
            <ul className="flex space-x-6 sm:space-x-20">
              <li>
                <button
                  className={`w-[120px] sm:w-[220px] h-[48px] rounded-[20px] shadow-md font-bold font-poppins ${activeTab === 'buatTes' ? 'bg-[#78AED6]' : ''}`}
                  onClick={() => setActiveTab('buatTes')}
                  >
                  Buat Soal
                </button>
              </li> 
              <li>
                <button
                  className={`w-[120px] sm:w-[220px] h-[48px] rounded-[20px] shadow-md font-bold font-poppins ${activeTab === 'publikasi' ? 'bg-[#78AED6]' : ''}`}
                  onClick={() => setActiveTab('publikasi')}
                  >
                  Publikasi
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="container mx-auto lg: p-2 p-4 w-full" style={{ maxWidth: '1309px' }}>
        <header className='bg-[#0B61AA] font-bold font-poppins text-white p-4'>
          <div className="flex items-center justify-between">
            <span>CPNS {labelCount}</span>
          </div>
        </header>

        <div className="bg-[#FFFFFF] border border-black p-4 rounded-lg shadow-md w-full mb-6 " >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
              <label htmlFor="number">Nomor 1</label>
              <input
                type="number"
                value={number}
                onChange={(e) => setNumber(e.target.value )}
                required
                
              />
            </div>
            <div className='m'>
              <div className='border border-black bg-[#D9D9D9] p-2 rounded mb-4' style={{ maxWidth: '1309px', height: '250px' }}>
                <div className='p-4 flex justify-between items-center mb-0.5 w-full'>
                  <div className='flex items-center'>
                    <label className="block mb-2">Soal Pilihan Ganda</label>
                  </div>
                  <div className='flex items-center'>
                    <label className="font-medium-bold mr-2">Bobot</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="border p-2 w-full"
                      required
                    />
                  </div>
                </div>
                <ReactQuill 
                value={question} 
                onChange={setQuestion} 
                modules={modules}
                placeholder='Anda sekarang harus mengerjakan soal Tes CPNS'
                className='bg-white shadow-md rounded-md border border-gray-500'
                style={{ maxWidth: '1220px', height: '150px', overflow: 'hidden' }}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2">Unggah Photo Soal</label>
              <input
                type="file"
                value={questionPhoto}
                onChange={(e) => setQuestionPhoto(e.target.value)}
                className="border p-2 w-full"
                accept="image/*"
              />
            </div>
            
            <div>
              <h2 className="text-lg font-semi-bold mb-2">Jawaban</h2>
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <ReactQuill
                    type="text"
                    value={option.optionDescription}
                    onChange={(e) => handleOptionChange(index, 'optionDescription', e.target.value)}
                    placeholder="Tulis jawaban untuk opsi"
                    className=" w-full bg-white shadow-md rounded-md border border-gray-500"
                    theme='snow'
                    required
                  />
                  <div className="flex flex-col items-center">
                  <button
                    type="button"
                    className="flex items-center justify-between text-black font-bold px-4 rounded-[15px] border border-black space-x-2"
                  >
                    <input
                      type="radio"
                      id={`jawaban-${index}`}
                      name="jawabanBenar"
                      value={index}
                      checked={jawabanBenar === index}
                      onChange={() => handleJawabanBenarChange(index)}
                      className="w-4 h-4"
                    />
                    <span>Benar</span>
                    
                    {/* Delete button with "X" icon */}
                    <button
                      type="button"
                      onClick={() => handleDeleteJawaban(index)}  // This function will handle answer deletion
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      X
                    </button>
                  </button>
                </div>

                </div>
              ))}
              <button type="button" onClick={addOption} className="bg-[#7bb3b4] hover:bg-[#8CC7C8] text-black font-bold py-2 px-4 rounded-[15px] border border-black">
                + Tambah
              </button>
            </div>

            <div className="mb-4">
              <label className="block mb-2">Pembahasan</label>
              <ReactQuill value={discussion} 
              onChange={setDiscussion} 
              modules={modules}
              placeholder='Tulis kunci jawaban di sini...'
              className='w-full bg-white shadow-md rounded-md border border-gray-500'
              />
            </div>
            </form>
          </div>
        </div>
        <div className='mt-4 flex justify-end space-x-4 -mr-2'>
              <div className="flex justify-end space-x-2">
                  <button className="bg-[#E58A7B] border border-black px-4 py-2 hover:text-white font-poppins rounded-[15px]">Hapus</button>
              </div>
              <div className="flex justify-end space-x-2">
                  <button type="submit" className="bg-[#E8F4FF] border border-black px-4 py-2 hover:text-white font-poppins rounded-[15px]">Simpan</button>
              </div>  
            </div>
      </div>
  );
};

export default MembuatSoal;