'use client';

import { useEffect, useState } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IoMdArrowRoundBack } from "react-icons/io";
import { AiOutlineMore } from 'react-icons/ai';
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
  const [activeTab, setActiveTab] = useState('buattes');
  const [usedPageNames, setUsedPageNames] = useState(new Set());

  const [pageNameOptions] = useState([
    'Tes Wawasan Kebangsaan',
    'Tes Karakteristik Pribadi',
    'Tes Intelegensi Umum'
  ]);

  useEffect(() => {
    const savedPages = localStorage.getItem(`pages-${testId}`);
    if (savedPages) {
      setPages(JSON.parse(savedPages));
    } else {
      const initialPages = [{ pageNumber: 1, questions: [1], pageName: 'Beri Nama Tes' }];  
      setPages(initialPages);
      localStorage.setItem(`pages-${testId}`, JSON.stringify(initialPages));
    }
  }, [testId]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const testIdFromUrl = params.get("testId");
    const categoryFromUrl = params.get("category");
    const multiplechoiceIdFromUrl = params.get("multiplechoiceId");
    const pageNameFromUrl = params.get("pageName");
  
    console.log("Fetched category:", categoryFromUrl);

    if (testIdFromUrl) {
      if (testIdFromUrl) {
        setTestId(testIdFromUrl);
        if (categoryFromUrl) {
          setCategory(categoryFromUrl);
          localStorage.setItem(`category-${testIdFromUrl}`, categoryFromUrl);
        } else {
          const savedCategory = localStorage.getItem(`category-${testIdFromUrl}`);
          if (savedCategory) {
            setCategory(savedCategory);
          }
        }
      }
    }
  
    if (multiplechoiceIdFromUrl) {
      setMultiplechoiceId(multiplechoiceIdFromUrl);
    }
  
    if (pageNameFromUrl) {
      setPages((prevPages) => prevPages.map((page) => ({
        ...page,
        pageName: decodeURIComponent(pageNameFromUrl),
      })));
    }
  }, []);

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

      if (!multiplechoiceId) {
        alert(`Silakan isi nomor soal ${maxQuestionNumber} terlebih dahulu.`);
        return;
      }

      await updateQuestionNumbersInDB(testId, maxQuestionNumber);

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
      const nextNumber = getNextAvailableNumber(pages);
      const multiplechoiceId = await fetchMultipleChoiceId(testId, nextNumber - 1);
  
      if (!multiplechoiceId) {
        alert(`Silakan isi nomor soal ${nextNumber - 1} terlebih dahulu.`);
        return;
      }
  
      console.log("Current category:", category); 
  
      setPages(prevPages => {
        const usedPageNames = new Set(prevPages.map(page => page.pageName));
        const availablePageNames = pageNameOptions.filter(name => !usedPageNames.has(name));
        
        console.log("Available page names:", availablePageNames); 
        
        if (availablePageNames.length === 0) {
          alert('Semua jenis tes sudah digunakan!');
          return prevPages;
        }
  
        const newPage = {
          pageNumber: prevPages.length + 1,
          questions: [nextNumber],
          pageName: availablePageNames[0],
          isCPNSPage: category === "CPNS"
        };
  
        console.log("New page created:", newPage); 
  
        const updatedPages = [...prevPages, newPage];
        localStorage.setItem(`pages-${testId}`, JSON.stringify(updatedPages));
        return updatedPages;
      });
    } catch (error) {
      console.error('Error adding page:', error);
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

  const handleRename = (pageIndex) => {
    if (category === 'CPNS') {
      setIsRenaming(pageIndex);
      setRenameValue(pages[pageIndex].pageName);
    } else {
      setIsRenaming(pageIndex);
      setRenameValue(pages[pageIndex].pageName);
    }
  };

  const saveRename = async (pageIndex) => {
    try {
      await fetch(`http://localhost:2000/api/multiplechoice/update-pageName`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: testId,
          pageIndex: pageIndex,
          pageName: renameValue,
        }),
      });
      setPages((prevPages) => {
        const updatedPages = prevPages.map((page, index) => {
          if (index === pageIndex) {
            return { ...page, pageName: renameValue };
          }
          return page;
        });
        localStorage.setItem(`pages-${testId}`, JSON.stringify(updatedPages));
        return updatedPages;
      });
      setIsRenaming(null);
    } catch (error) {
      console.error("Error updating pageName:", error);
    }
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
        // Get the saved category
        const savedCategory = localStorage.getItem(`category-${testId}`);
        
        // If we have pages from DB, process them
        if (data.pages && Array.isArray(data.pages)) {
          const processedPages = data.pages.map((page, index) => ({
            ...page,
            isCPNSPage: savedCategory === 'CPNS',
            // If it's CPNS, set the page name from pageNameOptions
            pageName: savedCategory === 'CPNS' ? 
              pageNameOptions[index % pageNameOptions.length] : 
              (page.pageName || 'Beri Nama Tes')
          }));
          
          setPages(processedPages);
          localStorage.setItem(`pages-${testId}`, JSON.stringify(processedPages));
        } else {
          // If no pages in DB, create initial page
          const initialPages = [{
            pageNumber: 1,
            questions: [1],
            pageName: savedCategory === 'CPNS' ? pageNameOptions[0] : 'Beri Nama Tes',
            isCPNSPage: savedCategory === 'CPNS'
          }];
          setPages(initialPages);
          localStorage.setItem(`pages-${testId}`, JSON.stringify(initialPages));
        }
      } else {
        console.error('Failed to fetch pages:', data.message);
        // Set default page if fetch fails
        const savedCategory = localStorage.getItem(`category-${testId}`);
        const initialPages = [{
          pageNumber: 1,
          questions: [1],
          pageName: savedCategory === 'CPNS' ? pageNameOptions[0] : 'Beri Nama Tes',
          isCPNSPage: savedCategory === 'CPNS'
        }];
        setPages(initialPages);
        localStorage.setItem(`pages-${testId}`, JSON.stringify(initialPages));
      }
    } catch (error) {
      console.error("Failed to fetch pages from DB:", error);
      // Set default page if fetch fails
      const savedCategory = localStorage.getItem(`category-${testId}`);
      const initialPages = [{
        pageNumber: 1,
        questions: [1],
        pageName: savedCategory === 'CPNS' ? pageNameOptions[0] : 'Beri Nama Tes',
        isCPNSPage: savedCategory === 'CPNS'
      }];
      setPages(initialPages);
      localStorage.setItem(`pages-${testId}`, JSON.stringify(initialPages));
    }
  };

  const fetchMultipleChoiceId = async (testId, number) => {
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
    
    const multiplechoiceId = await fetchMultipleChoiceId(testId, questionNumber);
    const pageName = pages[pageIndex]?.pageName || '';

    console.log("Current pageName:", pageName);
    console.log("Page Index:", pageIndex);
    console.log("Is TKP?:", pageName === 'Tes Karakteristik Pribadi');
  
    const baseUrl = pageName === 'Tes Karakteristik Pribadi' 
    ? '/author/buatSoal/page2'
    : '/author/buatSoal/page1';

    console.log("Selected baseUrl:", baseUrl);

    if (multiplechoiceId !== "null") {
      console.log("multiplechoiceId not found. You can create a new one.");
      router.push(`${baseUrl}?testId=${testId}&category=${category}&multiplechoiceId=${multiplechoiceId}&nomor=${questionNumber}&pageName=${encodeURIComponent(pageName)}`);
    }
  
    setSelectedNumber(questionNumber);
    
    router.push(`${baseUrl}?testId=${testId}&category=${category}&multiplechoiceId=${multiplechoiceId}&nomor=${questionNumber}&pageName=${encodeURIComponent(pageName)}`);
  };  
  
  const handleSave = () => {
    if (!testId) {
      console.error("testId is null. Cannot navigate.");
      return; 
    }

    router.push(`/author/buattes/publik/syarat?testId=${testId}`);
  };

  const renderPageNameInput = (pageIndex, page) => {
    console.log("Category:", category);
    console.log("Page:", page);
    console.log("Is CPNS check:", category === 'CPNS' || page.isCPNSPage);

    if (category === 'CPNS') {
      const usedPageNames = new Set(
        pages
          .filter((p, idx) => idx !== pageIndex)
          .map(p => p.pageName)
      );

      const availableOptions = pageNameOptions.filter(
        option => !usedPageNames.has(option) || option === page.pageName
      );

      return (
        <div className="flex items-center">
          <select
            value={page.pageName}
            onChange={(e) => {
              const newPageName = e.target.value;
              setPages(prevPages => {
                const updatedPages = prevPages.map((p, idx) => {
                  if (idx === pageIndex) {
                    return { ...p, pageName: newPageName };
                  }
                  return p;
                });
                localStorage.setItem(`pages-${testId}`, JSON.stringify(updatedPages));
                return updatedPages;
              });

              // setUsedPageNames(prev => {
              //   const updated = new Set(prev);
              //   updated.delete(oldPageName); 
              //   updated.add(newPageName);    
              //   return updated;
              // });

              fetch(`http://localhost:2000/api/multiplechoice/update-pageName`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  testId: testId,
                  pageIndex: pageIndex,
                  pageName: newPageName,
                }),
              }).catch(error => {
                console.error("Error updating pageName:", error);
              });
            }}
            className="text-black bg-white border rounded-md p-2"
          >
            {availableOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    } else {
      if (isRenaming === pageIndex) {
        return (
          <div className="flex items-center">
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="text-black p-1 border border-gray-300 rounded-md"
            />
            <button
              onClick={() => saveRename(pageIndex)}
              className="ml-2 bg-white text-black px-2 py-1 rounded-md"
            >
              Save
            </button>
          </div>
        );
      } else {
        return <h2 className="text-lg">{page.pageName}</h2>;
      }
    }
  };  

  return (
    <div className="container mx-auto p-0" style={{ maxWidth: '1978px' }}>
      <header 
        className="bg-[#0B61AA] text-white p-4 sm:p-6 font-poppins w-full"
        style={{ height: 'auto' }}
      >
        <div className="flex items-center max-w-[1978px] w-full px-2 sm:px-4 mx-auto">
          <Link href="/author/buattes" className="flex items-center space-x-2 sm:space-x-4">
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

        {Array.isArray(pages) && pages.map((page, pageIndex) => (
          <div key={page.pageNumber} className="my-4">
            <div className="flex justify-between items-center bg-[#0B61AA] text-white p-2" style={{ maxWidth: '100%', height: '61px' }}>
              {renderPageNameInput(pageIndex, page)}

              <div className="relative">
                <button 
                  className="text-white font-bold text-xl sm:text-2xl mr-2"
                  onClick={() => toggleDropdown(pageIndex)}
                >
                  <AiOutlineMore />
                </button>

                {page.isDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg z-10 p-1
                    before:content-[''] before:absolute before:-top-4 before:right-5 before:border-8
                    before:border-transparent before:border-b-white"
                    onMouseEnter={() => setDropdownOpen(true)}
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    {category === 'CPNS' ? (
                      <button
                        onClick={() => deletePage(pageIndex)}
                        className="block px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm text-deepBlue text-gray-700 hover:bg-deepBlue hover:text-white rounded-md"
                      >
                        Delete page
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRename(pageIndex)}
                          className="block px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm text-deepBlue text-gray-700 hover:bg-deepBlue hover:text-white rounded-md"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => deletePage(pageIndex)}
                          className="block px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm text-deepBlue text-gray-700 hover:bg-deepBlue hover:text-white rounded-md"
                        >
                          Delete page
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-0 "></div>
              <div className="flex flex-wrap p-4 gap-3 justify-start border border-black" style={{ maxWidth: '100%', padding: '0 3%' }}>
                {Array.isArray(page.questions) && page.questions.map((question, questionIndex) => (
                  <div
                    key={`${pageIndex}-${question}`}
                    className="flex flex-col items-center border border-gray-300 p-2 mb-5 mt-4 bg-white rounded-lg shadow-md cursor-pointer w-[50px] sm:w-[80px] md:w-[80px] h-[50px] sm:h-[80px] md:h-[80px] transition-all"
                    onClick={() => handleQuestionSelect(question, pageIndex)}
                  >
                    <span className="bg-white border rounded-full w-8 h-8 flex items-center justify-center mb-2 rounded-[15px] text-xs sm:text-sm md:text-base p-1">
                      {question}
                    </span>
                  </div>
                ))}

                <div className="flex items-center mt-1 sm:mt-2">
                  <button
                    onClick={() => addQuestion(pageIndex)}
                    className="bg-[#A6D0F7] text-black px-3 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm md:text-base rounded-[10px] shadow-lg font-bold"
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
          className="bg-[#0B61AA] hover:bg-[#5A96C3] border border-black px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm md:text-base font-poppins rounded-[10px] text-white font-bold"
        >
          + Tambah Page
        </button>
        
        <div className="flex justify-end space-x-2 mr-4">
          <button
            onClick={handleSave}
            className="bg-[#E8F4FF] hover:bg-[#C1DBF5] border border-black px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm md:text-base font-poppins rounded-[10px] text-black font-bold"
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