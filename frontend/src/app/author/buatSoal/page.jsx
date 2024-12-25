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
  const [activeTab, setActiveTab] = useState('');
  const [usedPageNames, setUsedPageNames] = useState(new Set());
  const [pagesWithContent, setPagesWithContent] = useState(new Set());

  const [pageNameOptions] = useState([
    'Tes Wawasan Kebangsaan',
    'Tes Karakteristik Pribadi',
    'Tes Intelegensi Umum'
  ]);

  useEffect(() => {
    if (testId) {
      fetchPagesFromDB(testId);
    }
  }, [testId]);
  
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

  const reorderAllPages = (pages) => {
    let nextNumber = 1;
    return pages.map(page => ({
      ...page,
      questions: page.questions.map(() => nextNumber++)
    }));
  };

  const deletePage = async (pageIndex) => {
    if (confirm("Apakah Anda yakin ingin menghapus tes ini?")) {
      try {
        const pageToDelete = pages[pageIndex];
        
        const response = await fetch(`http://localhost:2000/api/multiplechoice/delete-page`, {
          method: 'DELETE',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              testId: testId,
              pageName: pageToDelete.pageName
          })
        });

        if (!response.ok) {
            throw new Error('Failed to delete page');
        }

        setPages(prevPages => {
            const updatedPages = prevPages.filter((_, index) => index !== pageIndex);
            localStorage.setItem(`pages-${testId}`, JSON.stringify(updatedPages));
            return updatedPages;
        });

      } catch (error) {
        console.error('Error deleting page:', error);
        alert('Terjadi kesalahan saat menghapus halaman.');
      }
    }
  };

  const checkPageContent = async (pageIndex) => {
    const page = pages[pageIndex];
    if (!page || !page.questions) return false;

    try {
      for (const questionNumber of page.questions) {
        const multiplechoiceId = await fetchMultipleChoiceId(testId, questionNumber);
        if (multiplechoiceId) {
          return true; 
        }
      }
      return false; 
    } catch (error) {
      console.error('Error checking page content:', error);
      return false;
    }
  };

  useEffect(() => {
    const updatePagesWithContent = async () => {
      const newPagesWithContent = new Set();
      
      for (let i = 0; i < pages.length; i++) {
        const hasContent = await checkPageContent(i);
        if (hasContent) {
          newPagesWithContent.add(i);
        }
      }
      
      setPagesWithContent(newPagesWithContent);
    };

    updatePagesWithContent();
  }, [pages, testId]);

  const addQuestion = async (pageIndex) => {
    try {
      const currentPage = pages[pageIndex];
      const newQuestionNumber = currentPage.questions.length > 0 
        ? Math.max(...currentPage.questions) + 1 
        : 1;

      setPages(prevPages => {
        const updatedPages = [...prevPages];
        updatedPages[pageIndex] = {
          ...currentPage,
          questions: [...currentPage.questions, newQuestionNumber].sort((a, b) => a - b)
        };
        
        localStorage.setItem(`pages-${testId}`, JSON.stringify(updatedPages));
        return updatedPages;
      });

      await fetch(`http://localhost:2000/api/multiplechoice/create-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId,
          questionNumber: newQuestionNumber,
          pageName: currentPage.pageName
        }),
      });

    } catch (error) {
      console.error('Error adding question:', error);
    }
  };

  const addPage = async () => {
    try {
      const nextNumber = getNextAvailableNumber(pages);
      
      setPages(prevPages => {
        const usedPageNames = new Set(prevPages.map(page => page.pageName));
        const availablePageNames = pageNameOptions.filter(name => !usedPageNames.has(name));
        
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
  
        const updatedPages = [...prevPages, newPage];
        
        localStorage.setItem(`pages-${testId}`, JSON.stringify(updatedPages));

        fetch(`http://localhost:2000/api/multiplechoice/addPage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            testId: testId,
            page: newPage
          }),
        }).catch(error => {
          console.error("Error persisting new page:", error);
        });
        
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

  const handleRename = async (pageIndex) => {
    const hasContent = await checkPageContent(pageIndex);
    
    if (hasContent) {
      alert('Halaman ini sudah memiliki soal. Nama halaman tidak dapat diubah.');
      return;
    }

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
      if (!pages || !pages[pageIndex]) {
        console.error("Invalid page or pageIndex");
        return;
      }

      const currentPage = pages[pageIndex];
      const currentPageName = currentPage?.pageName;
  
      if (!currentPageName) {
        console.error("Current page name is missing");
        return;
      }
  
      if (!renameValue) {
        console.error("New page name is missing");
        return;
      }

      await fetch(`http://localhost:2000/api/multiplechoice/update-pageName`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: testId,
          pageIndex: pageIndex,
          currentPageName: currentPageName, 
          newPageName: renameValue, 
        }),
      });

      if (!currentPage || !currentPage.questions) {
        console.error("No questions found for the specified page number.");
        return;
      }

      const questionUpdates = currentPage.questions.map((questionNumber) => {
        console.log("Updating questionNumber:", questionNumber);
        return fetch(`http://localhost:2000/api/multiplechoice/update-question`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionNumber: questionNumber,
            pageName: renameValue,
          }),
        });
      });

      await Promise.all(questionUpdates);

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

  const fetchPagesFromDB = async (testId) => {
    try {
      const response = await fetch(`http://localhost:2000/api/multiplechoice/getPages?testId=${testId}`);
      const data = await response.json();
  
      if (response.ok) {
        const savedCategory = localStorage.getItem(`category-${testId}`);
        const localPages = JSON.parse(localStorage.getItem(`pages-${testId}`) || '[]');
        
        if (data.pages && Array.isArray(data.pages)) {
          const mergedPages = localPages.map((localPage, index) => {
            const dbPage = data.pages.find(p => p.pageNumber === localPage.pageNumber);
            return {
              ...localPage,
              ...dbPage,
              isCPNSPage: savedCategory === 'CPNS',
              pageName: savedCategory === 'CPNS' && index === 0 ? 
                'Tes Wawasan Kebangsaan' : 
                (dbPage?.pageName || localPage.pageName || 'Beri Nama Tes')
            };
          });
          
          setPages(mergedPages);
          localStorage.setItem(`pages-${testId}`, JSON.stringify(mergedPages));

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
          if (localPages.length > 0) {
            setPages(localPages);
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
      }
    } catch (error) {
      console.error("Failed to fetch pages from DB:", error);
      const localPages = JSON.parse(localStorage.getItem(`pages-${testId}`) || '[]');
      if (localPages.length > 0) {
        setPages(localPages);
      } else {
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
    const hasContent = pagesWithContent.has(pageIndex);

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
              if (hasContent) {
                alert('Halaman ini sudah memiliki soal. Nama halaman tidak dapat diubah.');
                return;
              }
              
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
            className={`text-black bg-white border rounded-md p-2 ${
              hasContent ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={hasContent}
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
              className={`text-black p-1 border border-gray-300 rounded-md ${
                hasContent ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={hasContent}
            />
            <button
              onClick={() => saveRename(pageIndex)}
              className={`ml-2 bg-white text-black px-2 py-1 rounded-md ${
                hasContent ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={hasContent}
            >
              Save
            </button>
          </div>
        );
      } else {
        return (
          <div className="flex items-center">
            <h2 className="text-lg">{page.pageName}</h2>
            {!hasContent && (
              <button
                onClick={() => handleRename(pageIndex)}
                className="ml-2 text-sm text-gray-400 hover:text-gray-300"
              >
                ✏️
              </button>
            )}
          </div>
        );
      }
    }
  };

  return (
    <div className="container mx-auto p-0" style={{ maxWidth: '1978px' }}>
      <header className="bg-[#0B61AA] text-white p-4 sm:p-6 font-poppins w-full"
        style={{ height: 'auto' }}>
        <div className="flex items-center max-w-[1978px] w-full px-2 sm:px-4 mx-auto">
          <Link href="/author/buattes" className="flex items-center space-x-2 sm:space-x-4">
            <IoMdArrowRoundBack className="text-white text-2xl sm:text-3xl lg:text-4xl" />
            <img src="/images/etamtest.png" alt="Etamtest" className="h-[40px] sm:h-[50px]" />
          </Link>
        </div>
      </header>

      <div className="w-full p-2">
        <nav className="bg-[#FFFF] text-black p-4">
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
                        className={`block px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm text-deepBlue text-gray-700 hover:bg-deepBlue hover:text-white rounded-md ${
                          pagesWithContent.has(pageIndex) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={pagesWithContent.has(pageIndex)}
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

          <div className="mt-0"></div>
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