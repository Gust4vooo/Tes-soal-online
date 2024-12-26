'use client';

import { useEffect, useState } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// import dotenv from 'dotenv';
// dotenv.config();
// const URL = process.env.NEXT_PUBLIC_API_URL;

const KotakNomor = () => {
  const router = useRouter();
  const [testId, setTestId] = useState('');
  const [category, setCategory] = useState('');
  const [pages, setPages] = useState([]);
  const [multiplechoiceId, setMultiplechoiceId] = useState('');
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [isRenaming, setIsRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [usedPageNames, setUsedPageNames] = useState(new Set());

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [selectedPageNames, setSelectedPageNames] = useState({});

  const [pageNameOptions] = useState([
    'Tes Wawasan Kebangsaan',
    'Tes Karakteristik Pribadi',
    'Tes Intelegensi Umum'
  ]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const testIdFromUrl = params.get("testId");
    const categoryFromUrl = params.get("category");
    const multiplechoiceIdFromUrl = params.get("multiplechoiceId");
    const pageNameFromUrl = params.get("pageName");
  
    console.log("Fetched category:", categoryFromUrl);
  
    if (testIdFromUrl) {
      setTestId(testIdFromUrl);
      console.log("Test ID fetched from URL:", testIdFromUrl);
  
      if (categoryFromUrl) {
        setCategory(categoryFromUrl);
        localStorage.setItem(`category-${testIdFromUrl}`, categoryFromUrl);
      } else {
        const savedCategory = localStorage.getItem(`category-${testIdFromUrl}`);
        if (savedCategory) {
          setCategory(savedCategory);
        }
      }
  
      fetchPagesFromDB(testIdFromUrl);
  
      const savedPageNames = localStorage.getItem(`pageNames-${testIdFromUrl}`);
      if (savedPageNames) {
        setSelectedPageNames(JSON.parse(savedPageNames));
      }
    }
  
    if (multiplechoiceIdFromUrl) {
      setMultiplechoiceId(multiplechoiceIdFromUrl);
    }
  
    if (pageNameFromUrl) {
      setPages((prevPages) =>
        prevPages.map((page) => ({
          ...page,
          pageName: decodeURIComponent(pageNameFromUrl),
        }))
      );
    }
  }, []);
  
  const fetchQuestions = async () => {
    try {
      console.log('Test Id didapatkan: ', testId);
      const response = await fetch(`http://localhost:2000/api/multiplechoice/${testId}`); 
      const data = await response.json();

      if (data.success) {
        setQuestions(data.data); 
        console.log('Questions fetched successfully:', data.data);
      } else {
        console.error('Failed to fetch questions:', data.message);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [testId]);

  const handlePageNameChange = (pageIndex, newPageName) => {
    // Update selectedPageNames state
    setSelectedPageNames(prev => {
      const updated = {
        ...prev,
        [pageIndex]: newPageName
      };      

      localStorage.setItem(`pageNames-${testId}`, JSON.stringify(updated));
      return updated;
    });
  };


  // Batas Baru ^^^

  useEffect(() => {
    const savedPages = localStorage.getItem(`pages-${testId}`);
    if (savedPages) {
      setPages(JSON.parse(savedPages));
    } else {
      const initialPages = [{ 
        pageNumber: 1, 
        questions: [1], 
        pageName: category === 'CPNS' ? 'Tes Wawasan Kebangsaan' : 'Beri Nama Tes',
        isCPNSPage: category === 'CPNS' 
      }];
      setPages(initialPages);
      localStorage.setItem(`pages-${testId}`, JSON.stringify(initialPages));
    }
  }, [testId, category]);


  const getMaxQuestionNumberInPage = (page) => {
    if (Array.isArray(page.questions)) {
      return Math.max(...page.questions);
    }
    return 0;
  };

  const getAllUsedNumbers = (pages) => {
    const usedNumbers = new Set();
    pages.forEach(page => {
      if (Array.isArray(page.questions)) {
        page.questions.forEach(num => usedNumbers.add(num));
      }
    });
    return Array.from(usedNumbers).sort((a, b) => a - b);
  };

  const getNextAvailableNumber = (pages) => {
    const usedNumbers = getAllUsedNumbers(pages);
    let nextNumber = 1;

    while (usedNumbers.includes(nextNumber)) {
      nextNumber++;
    }
    return nextNumber;
  };

  const reorderAllPages = (pages) => {
    let nextNumber = 1;
    return pages.map(page => ({
      ...page,
      questions: page.questions.map(() => nextNumber++)
    }));
  };

  const updateQuestionNumbersInDB = async (testId, maxQuestionNumber) => {
    try {
      const response = await fetch(`http://localhost:2000/api/multiplechoice/getQuestionNumbers?testId=${testId}`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      const questionNumbers = data.questionNumbers;
      const numbersToUpdate = questionNumbers.filter(num => num > maxQuestionNumber);

      if (numbersToUpdate.length === 0) {
        return;
      }

      for (const number of numbersToUpdate) {
        const updateResponse = await fetch(`http://localhost:2000/api/multiplechoice/update-questionNumber?testId=${testId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oldNumber: number,
            newNumber: number + 1,
          }),
        });
  
        if (!updateResponse.ok) {
          throw new Error(`HTTP error ${updateResponse.status} when updating question number ${number}`);
        }
      }
    } catch (error) {
      console.error('Error updating question numbers in DB:', error);
    }
  };

  const addQuestion = async (pageIndex) => {
    try {
      const maxQuestionNumber = getMaxQuestionNumberInPage(pages[pageIndex]);
      const multiplechoiceId = await fetchMultipleChoiceId(testId, maxQuestionNumber);

      // if (!multiplechoiceId) {
      //   alert(`Silakan isi nomor soal ${maxQuestionNumber} terlebih dahulu.`);
      //   return;
      // }

      // await updateQuestionNumbersInDB(testId, maxQuestionNumber);

      setPages(prevPages => {
        const updatedPages = [...prevPages];
        const currentPage = { ...updatedPages[pageIndex] };
        currentPage.questions = [...(currentPage.questions || []), getNextAvailableNumber(updatedPages)];
        currentPage.questions.sort((a, b) => a - b);    
        updatedPages[pageIndex] = currentPage;

        const finalPages = reorderAllPages(updatedPages);
        localStorage.setItem(`pages-${testId}`, JSON.stringify(finalPages));
        return finalPages;
      });
    } catch (error) {
      console.error('Error adding question:', error);
    }
  };

  const addPage = async () => {
    try {
      setPages((prevPages) => {
        // Cari angka tertinggi dari semua halaman yang ada
        const allNumbers = prevPages.flatMap((page) => page.questions);
        const highestNumber = allNumbers.length > 0 ? Math.max(...allNumbers) : 0;
        const nextNumber = highestNumber + 1;
  
        const pageNameOptions = ["Tes Wawasan Kebangsaan", "Beri Nama Tes"];
  
        const usedPageNames = new Set(prevPages.map((page) => page.pageName));
        const availablePageNames = pageNameOptions.filter(
          (name) => !usedPageNames.has(name)
        );
  
        console.log("Available page names:", availablePageNames);
  
        if (availablePageNames.length === 0) {
          alert("Semua jenis tes sudah digunakan!");
          return prevPages;
        }
  
        const newPage = {
          pageNumber: prevPages.length + 1,
          questions: [nextNumber], // Gunakan angka tertinggi + 1
          pageName: availablePageNames[0],
          isCPNSPage: category === "CPNS",
          isSelected: true, // Track if this page's dropdown is selected
        };
  
        console.log("New page created:", newPage);
  
        const updatedPages = [...prevPages, newPage];
        localStorage.setItem(`pages-${testId}`, JSON.stringify(updatedPages));
        return updatedPages;
      });
    } catch (error) {
      console.error("Error adding page:", error);
    }
  };
  
  

  const toggleDropdown = (pageIndex) => {
    setPages(prevPages => 
      prevPages.map((page, index) => ({
        ...page,
        isDropdownOpen: index === pageIndex ? !page.isDropdownOpen : false
      }))
    );
  };

  const deletePage = (pageIndex) => {
    if (confirm("Apakah Anda yakin ingin menghapus tes ini?")) {
      setPages((prevPages) => {
        const pageToDelete = prevPages[pageIndex];
        const updatedPages = prevPages.filter((_, index) => index !== pageIndex);

        setUsedPageNames(prev => {
          const updated = new Set(prev);
          updated.delete(pageToDelete.pageName);
          return updated;
        });
        
        const finalPages = updatedPages.reduce((acc, page, idx) => {
          if (idx === 0) return [page];   
          const prevPageLastNumber = Math.max(...acc[idx - 1].questions);
          const numQuestions = page.questions.length;
          const newQuestions = Array.from(
            { length: numQuestions },
            (_, i) => prevPageLastNumber + i + 1
          );
          
          acc.push({
            ...page,
            questions: newQuestions
          });
          
          return acc;
        }, []);

        localStorage.setItem(`pages-${testId}`, JSON.stringify(finalPages));
        return finalPages;
      });
    }
  };

  const fetchPagesFromDB = async (testId) => {
    try {
      const response = await fetch(`http://localhost:2000/api/multiplechoice/getPages?testId=${testId}`);
      const data = await response.json();
  
      if (response.ok) {
        const savedCategory = localStorage.getItem(`category-${testId}`);
        
        if (data.pages && Array.isArray(data.pages)) {
          const processedPages = data.pages.map((page, index) => {
            // For first page in CPNS category, always set to 'Tes Wawasan Kebangsaan'
            const pageName = savedCategory === 'CPNS' && index === 0 ? 
              'Tes Wawasan Kebangsaan' : 
              (page.pageName || 'Beri Nama Tes');
              
            return {
              ...page,
              isCPNSPage: savedCategory === 'CPNS',
              pageName: pageName
            };
          });
          
          setPages(processedPages);
          localStorage.setItem(`pages-${testId}`, JSON.stringify(processedPages));
          
          // Save initial page name to database
          if (savedCategory === 'CPNS') {
            fetch(`http://localhost:2000/api/multiplechoice/update-pageName`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                testId: testId,
                pageIndex: 0,
                pageName: 'Tes Wawasan Kebangsaan',
              }),
            }).catch(error => {
              console.error("Error updating initial pageName:", error);
            });
          }
        } else {
          const initialPages = [{
            pageNumber: 1,
            questions: [1],
            pageName: savedCategory === 'CPNS' ? 'Tes Wawasan Kebangsaan' : 'Beri Nama Tes',
            isCPNSPage: savedCategory === 'CPNS'
          }];
          setPages(initialPages);
          localStorage.setItem(`pages-${testId}`, JSON.stringify(initialPages));
        }
      }
    } catch (error) {
      console.error("Failed to fetch pages from DB:", error);
      // Set default page with correct initial name
      const savedCategory = localStorage.getItem(`category-${testId}`);
      const initialPages = [{
        pageNumber: 1,
        questions: [1],
        pageName: savedCategory === 'CPNS' ? 'Tes Wawasan Kebangsaan' : 'Beri Nama Tes',
        isCPNSPage: savedCategory === 'CPNS'
      }];
      setPages(initialPages);
      localStorage.setItem(`pages-${testId}`, JSON.stringify(initialPages));
    }
  };

  const fetchMultipleChoiceId = async (testId, number) => {
    console.log('Fetching multiplechoiceId for testId:', testId, 'and number:', number);
    try {
      const response = await fetch(`http://localhost:2000/api/multiplechoice/${testId}/${number}`);
  
      if (response.status === 404) {
        console.warn(`Nomor soal ${number} belum dibuat.`);
        return null; 
      }
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

  
      const data = await response.json();
      console.log('Response fetch multiplechoice:', data);
      return data.id; 
    } catch (error) {
      console.error('Error fetching multiplechoiceId:', error);
      return null; 
    }
  };  

  const handleQuestionSelect = async (questionNumber, pageIndex) => {
    if (!testId) {
      console.error("testId is null. Cannot navigate.");
      return;  
    }

    console.log("Selected page name:", selectedPageNames);
    console.log("Selected page index", pageIndex);

    const multiplechoiceId = await fetchMultipleChoiceId(testId, questionNumber);
    const pageName = selectedPageNames[pageIndex] || 'Pilih kategori';

    console.log("Current pageName:", pageName);
    
    const baseUrl = pageName === 'Tes Karakteristik Pribadi' 
      ? '/author/buatSoal/page2'
      : '/author/buatSoal/page1';

    if (multiplechoiceId !== "null") {
      router.push(`${baseUrl}?testId=${testId}&category=${category}&multiplechoiceId=${multiplechoiceId}&nomor=${questionNumber}&pageName=${encodeURIComponent(pageName)}`);
    } else {
      router.push(`${baseUrl}?testId=${testId}&category=${category}&nomor=${questionNumber}&pageName=${encodeURIComponent(pageName)}`);
    }
  }; 
  
  const handleSave = () => {
    if (!testId) {
      console.error("testId is null. Cannot navigate.");
      return; 
    }

    router.push(`/author/buattes/publik/syarat?testId=${testId}`);
  }; 

  return (
    <div className="w-full p-4">
      <header className="bg-[#0B61AA] text-white p-4 sm:p-6 font-poppins" style={{ maxWidth: '1443px', height: '108px' }}>
        <div className="container mx-auto flex justify-start items-center p-4">
          <Link href="/">
            <img src="/img/Vector.png" alt="Vector" className="h-6 ml-4" style={{ maxWidth: '279px', height: '50px' }} />
          </Link>
        </div>
      </header>

      <div className="w-full p-0">
        <nav className="bg-[#FFFF] text-black p-4 sm:p-6">
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

        {Array.isArray(pages) && pages.map((page, pageIndex) => (
        <div key={page.pageNumber} className="my-4">
          <div className="flex justify-between items-center bg-[#0B61AA] text-black p-2" style={{ maxWidth: '1376px', height: '61px' }}>
            
            {/* Dropdown Kategori Tes */}
            <select
              value={selectedPageNames[pageIndex] || "Pilih kategori"} // Show "Pilih kategori" initially
              onChange={(e) => handlePageNameChange(pageIndex, e.target.value)}
              disabled={!!page.selectedCategory} // Disable if category is already selected
              className="p-2 bg-white border border-gray-300 rounded-md shadow-sm text-black"
            >
              <option value="Pilih kategori" disabled>
                Pilih kategori
              </option>
              <option value="Tes Wawasan Kebangsaan">Tes Wawasan Kebangsaan</option>
              <option value="Tes Karakteristik Pribadi">Tes Karakteristik Pribadi</option>
              <option value="Tes Intelegensi Umum">Tes Intelegensi Umum</option>
            </select>

          </div>

          <div className="mt-4"></div>
          <div
            className="flex flex-row flex-wrap p-4 gap-3 justify-start border"
            style={{ maxWidth: '100%', padding: '0 2%' }}
          >
            {questions.length > 0 ? (
              questions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex flex-col items-center border border-gray-300 p-2 bg-white rounded-lg shadow-md cursor-pointer"
                  style={{ width: '80px', height: '80px' }}
                  onClick={() => handleQuestionSelect(question.number, pageIndex)}
                >
                  <span className="bg-white border rounded-full w-8 h-8 flex items-center justify-center mb-2 rounded-[15px]">
                    {question.number} {/* Menampilkan nomor soal */}
                  </span>
                </div>
              ))
            ) : (
              <p>Tidak ada soal yang ditemukan</p> // Pesan jika tidak ada soal
            )}

            {/* Tombol + Soal */}
            <div className="flex items-center">
              <button
                onClick={() => handleQuestionSelect(questions.length + 1, pageIndex)}
                className="bg-[#A6D0F7] text-black px-4 py-2 rounded-[15px] shadow-lg"
              >
                + Soal
              </button>
            </div>
          </div>
        </div>
      ))}


      <div className="flex justify-between mt-4">
        <button
          onClick={addPage}
          className="bg-[#0B61AA] border border-black flex items-center space-x-2 px-4 py-2 hover:text-white font-poppins rounded-[15px] shadow-lg"
        >
          + Tambah Page
        </button>
        
        <div className="flex justify-end space-x-2 mr-4">
          <button
            onClick={handleSave} 
            className="bg-[#E8F4FF] border border-black flex items-center space-x-2 px-4 py-2 hover:text-black font-poppins rounded-[15px] shadow-lg"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default KotakNomor;