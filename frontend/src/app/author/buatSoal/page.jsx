'use client';

import { useEffect, useState } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios'

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

  const getAllUsedNumbers = (pages) => pages.flatMap(page => page.questions);

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

  const getMaxQuestionNumberInPage = (page) => {
    if (Array.isArray(page.questions)) {
      return Math.max(...page.questions);
    }
    return 0;
  };

  const addQuestion = async (pageIndex) => {
    try {
      const maxQuestionNumber = getMaxQuestionNumberInPage(pages[pageIndex]);
      const multiplechoiceId = await fetchMultipleChoiceId(testId, maxQuestionNumber);

      if (!multiplechoiceId) {
        alert(`Silakan isi nomor soal ${maxQuestionNumber} terlebih dahulu.`);
        return;
      }
      const hasNextPages = pageIndex < pages.length - 1;
      
      if (hasNextPages) {
        const numbersToUpdate = pages.slice(pageIndex + 1).reduce((acc, page) => {
          return [...acc, ...(page.questions || [])];
        }, []);
        numbersToUpdate.sort((a, b) => b - a);

        for (const number of numbersToUpdate) {
          await updateQuestionNumberInDB(testId, number, number + 1);
        }
      }

      setPages(prevPages => {
        const updatedPages = [...prevPages];
        const currentPage = { ...updatedPages[pageIndex] };
        currentPage.questions = [...(currentPage.questions || []), maxQuestionNumber + 1];
        currentPage.questions.sort((a, b) => a - b);
        updatedPages[pageIndex] = currentPage;
        if (hasNextPages) {
          for (let i = pageIndex + 1; i < updatedPages.length; i++) {
            const nextPage = { ...updatedPages[i] };
            nextPage.questions = (nextPage.questions || []).map(num => num + 1);
            updatedPages[i] = nextPage;
          }
        }
  
        const finalPages = reorderAllPages(updatedPages);
        localStorage.setItem(`pages-${testId}`, JSON.stringify(finalPages));
        return finalPages;
      });
    } catch (error) {
      console.error('Error adding question:', error);
    }
  };

  const updateQuestionNumberInDB = async (testId, oldNumber, newNumber) => {
    try {
      await axios.put(`http://localhost:2000/api/multiplechoice/${testId}/questions/${oldNumber}`, {
        newQuestionNumber: newNumber
      });
    } catch (error) {
      console.error('Error updating question number:', error);
      throw error;
    }
  };

  const addPage = async () => {
    try {
      const nextNumber = getNextAvailableNumber(pages);
      const multiplechoiceId = await fetchMultipleChoiceId(testId, nextNumber - 1);
  
      if (!multiplechoiceId && nextNumber > 1) {
        alert(`Silakan isi nomor soal ${nextNumber - 1} terlebih dahulu.`);
        return;
      }
  
      console.log("Current category:", category); 
  
      setPages(prevPages => {
        if (category === 'CPNS') {
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
          isCPNSPage: true
        };
  
        console.log("New page created:", newPage); 
  
        const updatedPages = [...prevPages, newPage];
        localStorage.setItem(`pages-${testId}`, JSON.stringify(updatedPages));
        return updatedPages;
      } else {
        const newPage = {
          pageNumber: prevPages.length + 1,
          questions: [nextNumber],
          pageName: 'Beri Nama Tes',
          isCPNSPage: false
        };
        
        const updatedPages = [...prevPages, newPage];
        localStorage.setItem(`pages-${testId}`, JSON.stringify(updatedPages));
        return updatedPages;
      }
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

  const checkPageContent = async (pageIndex) => {
    const page = pages[pageIndex];
    if (!page || !page.questions) return false;

    try {
      // Check if any question in the page has content
      for (const questionNumber of page.questions) {
        const multiplechoiceId = await fetchMultipleChoiceId(testId, questionNumber);
        if (multiplechoiceId) {
          return true; // Page has at least one question with content
        }
      }
      return false; // No questions have content
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
          // pageName: renameValue,
          currentPageName: currentPageName, 
          newPageName: renameValue, 
        }),
      });

      if (!currentPage || !currentPage.questions) {
        console.error("No questions found for the specified page number.");
        return;
      }
      console.log("currentPage:", currentPage);
      console.log("currentPage.questions:", currentPage?.questions);
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

  const deleteMultipleChoice = async (multiplechoiceId) => {
    try {
      const response = await fetch(`http://localhost:2000/api/multiplechoice/question/${multiplechoiceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete question with ID: ${multiplechoiceId}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      return false;
    }
  };

  const deletePageService = async (testId, pageName) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const questionsToDelete = await tx.multiplechoice.findMany({
          where: {
            testId: testId,
            pageName: pageName
          }
        });

        await tx.option.deleteMany({
          where: {
            multiplechoiceId: {
              in: questionsToDelete.map(q => q.id)
            }
          }
        });

        await tx.multiplechoice.deleteMany({
          where: {
            testId: testId,
            pageName: pageName
          }
        });

        return { success: true };
    });
    } catch (error) {
        console.error('Error in deletePageService:', error);
        throw error;
    }
  };

  const deletePage = async (pageIndex) => {
    if (confirm("Apakah Anda yakin ingin menghapus tes ini?")) {
      try {
        const pageToDelete = pages[pageIndex];
        
        // 1. Hapus halaman dan datanya
        const deleteResponse = await fetch(`http://localhost:2000/api/multiplechoice/delete-page`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            testId: testId,
            pageName: pageToDelete.pageName
          })
        });
  
        if (!deleteResponse.ok) {
          throw new Error('Failed to delete page');
        }
  
        // 2. Dapatkan nomor soal yang perlu diperbarui
        const remainingPages = pages.slice(pageIndex + 1);
        const questionsToUpdate = remainingPages.flatMap(page => page.questions);
  
        // 3. Perbarui nomor soal di backend
        for (const question of questionsToUpdate) {
          try {
            const newNumber = question - pageToDelete.questions.length;
            
            await fetch(`http://localhost:2000/api/multiplechoice/update-number`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                testId: testId,
                oldNumber: question,
                newNumber: newNumber
              })
            });
          } catch (error) {
            console.error(`Error updating question number ${question}:`, error);
          }
        }
  
        // 4. Perbarui state frontend
        setPages(prevPages => {
          const updatedPages = prevPages
            .filter((_, index) => index !== pageIndex)
            .map((page, index) => {
              if (index >= pageIndex) {
                return {
                  ...page,
                  questions: page.questions.map(num => num - pageToDelete.questions.length)
                };
              }
              return page;
            });
          
          localStorage.setItem(`pages-${testId}`, JSON.stringify(updatedPages));
          return updatedPages;
        });
  
      } catch (error) {
        console.error('Error deleting page:', error);
        alert('Terjadi kesalahan saat menghapus halaman.');
      }
    }
  };
  

  const fetchPagesFromDB = async (testId) => {
    try {
      const response = await fetch(`http://localhost:2000/api/multiplechoice/getPages?testId=${testId}`);
      const data = await response.json();
  
      if (response.ok) {
        const savedCategory = localStorage.getItem(`category-${testId}`);
        
        // Get pages from localStorage as backup
        const localPages = JSON.parse(localStorage.getItem(`pages-${testId}`) || '[]');
        
        if (data.pages && Array.isArray(data.pages)) {
          // Merge database pages with localStorage pages
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
          // If no pages in database, use localStorage pages
          if (localPages.length > 0) {
            setPages(localPages);
          } else {
            // If no pages anywhere, create initial page
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
      // Use localStorage as fallback
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

  const renderDropdownMenu = (pageIndex) => {
    const hasContent = pagesWithContent.has(pageIndex);

    return (
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
            className="block px-4 py-2 text-deepBlue text-sm text-gray-700 hover:bg-deepBlue hover:text-white rounded-md"
          >
            Delete page
          </button>
        ) : (
          <>
            <button
              onClick={() => handleRename(pageIndex)}
              className={`block px-4 py-2 text-deepBlue text-sm text-gray-700 ${
                hasContent 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-deepBlue hover:text-white'
              } rounded-md`}
              disabled={hasContent}
            >
              Rename
            </button>
            <button
              onClick={() => deletePage(pageIndex)}
              className="block px-4 py-2 text-deepBlue text-sm text-gray-700 hover:bg-deepBlue hover:text-white rounded-md"
            >
              Delete page
            </button>
          </>
        )}
      </div>
    );
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
              {renderPageNameInput(pageIndex, page)}
  
              <div className="relative">
                <button 
                  className="text-white font-bold text-2xl mr-2"
                  onClick={() => toggleDropdown(pageIndex)}
                >
                  :
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
                        className="block px-4 py-2 text-deepBlue text-sm text-gray-700 hover:bg-deepBlue hover:text-white rounded-md"
                      >
                        Delete page
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRename(pageIndex)}
                          className={`block px-4 py-2 text-deepBlue text-sm text-gray-700 hover:bg-deepBlue hover:text-white rounded-md w-full text-left ${
                            pagesWithContent.has(pageIndex) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={pagesWithContent.has(pageIndex)}
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => deletePage(pageIndex)}
                          className="block px-4 py-2 text-deepBlue text-sm text-gray-700 hover:bg-deepBlue hover:text-white rounded-md"
                        >
                          Delete page
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

          <div className="mt-4"></div>
          <div className="flex flex-row flex-wrap p-4 gap-3 justify-start border" style={{ maxWidth: '100%', padding: '0 2%' }}>
            {Array.isArray(page.questions) && page.questions.map((question, questionIndex) => (
              <div
                key={`${pageIndex}-${question}`}
                className="flex flex-col items-center border border-gray-300 p-2 bg-white rounded-lg shadow-md cursor-pointer"
                style={{ width: '80px', height: '80px' }}
                onClick={() => handleQuestionSelect(question, pageIndex)} 
              >
                <span className="bg-white border rounded-full w-8 h-8 flex items-center justify-center mb-2 rounded-[15px]">
                  {question}
                </span>
              </div>
            ))}

            <div className="flex items-center">
              <button
                onClick={() => addQuestion(pageIndex)}
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
