'use client';

import { useParams } from 'next/navigation';
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import  Swal from 'sweetalert2';
import { useRef } from 'react';
import { PiListNumbers } from "react-icons/pi";
import { CgArrowRightR } from "react-icons/cg";
import { CgArrowLeftR } from "react-icons/cg";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const URL = process.env.NEXT_PUBLIC_API_URL;

const MengerjakanTes = () => {
    const [pageName, setPageName] = useState('');
    const [multiplechoiceId, setMultiplechoiceId] = useState('');
    const [number, setNumber] = useState('');
    const { testId } = useParams(); // Ambil testId dari URL path
    const [questions, setQuestions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [markedReview, setMarkedReview] = useState(Array(questions.length).fill(false));
    const [showNav, setShowNav] = useState(false);
    const [resultId, setResultId] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [answers, setAnswers] = useState({});
    const [title, setTitle] = useState('');
    const [token, setToken] = useState('');
    const [remainingTime, setRemainingTime] = useState(0);
    const [workTime, setWorkTime] = useState(0); 
    const [timerActive, setTimerActive] = useState(false);
    const countdownInterval = useRef(null);
    const totalOptions = 5;
    const [answeredQuestions, setAnsweredQuestions] = useState(new Array(totalOptions).fill(false));
    const [answeredOptions, setAnsweredOptions] = useState(new Array(totalOptions).fill(false));
    const workTimeInterval = useRef(null);
    const [isClicked, setIsClicked] = useState(false);
    const [doubtQuestions, setDoubtQuestions] = useState([]); // Array untuk melacak status ragu-ragu
    const router = useRouter();
    const [activeQuestion, setActiveQuestion] = useState(1); // Default ke soal pertama
    const [answeredSoals, setAnsweredSoals] = useState([]);
    
    
     // State untuk opsi yang dipilih
     const [currentOption, setCurrentOption] = useState(1);

     useEffect(() => {
        const loadQuestionStatus = () => {
            const savedAnsweredSoals = JSON.parse(localStorage.getItem(`answeredSoals_${testId}`)) || [];
            const savedDoubtQuestions = JSON.parse(localStorage.getItem(`doubtQuestions_${testId}`)) || [];
            
            setAnsweredSoals(savedAnsweredSoals);
            setDoubtQuestions(savedDoubtQuestions);
        };

        loadQuestionStatus();
    }, [testId]);


     // Mengambil nilai dari localStorage setelah komponen dirender di sisi klien
     useEffect(() => {
         if (typeof window !== "undefined") { // Pastikan ini dijalankan di klien
             const storedOption = localStorage.getItem('currentOption');
             if (storedOption) {
                 setCurrentOption(Number(storedOption));
             }
         }
     }, []);
    

// Menambahkan indikator soal belum dikerjakan
const SoalNavigation = ({ currentSoal, setCurrentSoal, answeredSoals }) => {
    return (
      <div className="soal-navigation">
        {soalList.map((soal) => (
          <button
            key={soal}
            onClick={() => setCurrentSoal(soal)}
            className={`soal-button ${currentSoal === soal ? 'active' : ''} ${answeredSoals.includes(soal) ? 'answered' : 'unanswered'}`}
          >
            {soal}
          </button>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const testIdFromUrl = params.get("testId");
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

  // Function to handle the API response and update localStorage
  const handleApiResponse = async (response, questionData) => {
    if (response.ok) {
      const result = await response.json();
      console.log('Response dari API:', result);
      const newMultiplechoiceId = result.data[0].id;
      console.log('MultiplechoiceId:', newMultiplechoiceId);

      // Update localStorage
      localStorage.setItem('pageName', pageName); // Store pageName
      const existingPages = JSON.parse(localStorage.getItem(`pages_${testId}`)) || [];
      const newQuestion = { 
        id: newMultiplechoiceId,
        ...questionData,
      };
      existingPages.push(newQuestion);
      localStorage.setItem(`pages_${testId}`, JSON.stringify(existingPages));

      // Redirect to the next page with encoded pageName
      const encodedPageName = encodeURIComponent(pageName);
      router.push(`/author/buatSoal?testId=${testId}&pageName=${encodedPageName}`);
    } else {
      console.error('Failed to process request:', response.statusText);
    }
  };

    useEffect(() => {
        const storedAnswers = localStorage.getItem('answers');
        if (storedAnswers) {
            const parsedAnswers = JSON.parse(storedAnswers);
            setAnswers(parsedAnswers);
            const currentQuestionId = questions[currentOption - 1]?.id;
            if (parsedAnswers[currentQuestionId]) {
                setSelectedOption(parsedAnswers[currentQuestionId].optionValue);
            }
        }

        const handleBeforeUnload = (event) => {
            event.preventDefault();  // Mencegah refresh otomatis
            event.returnValue = '';  // Mengharuskan browser menampilkan dialog konfirmasi default
        };   
    
        window.addEventListener('beforeunload', handleBeforeUnload);  // Tambahkan event listener
    
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);  // Hapus event listener ketika komponen unmount
        };
    }, [questions, currentOption]);
    
    // Ambil atau buat sessionId
    useEffect(() => {
        let localSessionId = localStorage.getItem('sessionId');
        if (!localSessionId) {
            localSessionId = uuidv4();
            localStorage.setItem('sessionId', localSessionId);
        }
        setSessionId(localSessionId);
    }, []);
    
    useEffect(() => {
        if (!testId) return; // Tunggu hingga testId tersedia dari URL path

        const fetchQuestionsAndAnswers = async () => {
            try {
                const savedResultId = localStorage.getItem('resultId');
                if (savedResultId) {
                    setResultId(savedResultId);
                    await fetchAnswersByResultId(savedResultId);
                }
        
                const response = await fetch(`https://${URL}/api/tests/get-test/${testId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) throw new Error('Gagal mengambil data test');
        
                const data = await response.json();
                const { title: testTitle, questions } = data;
                setTitle(testTitle);
        
                // Mengurutkan questions berdasarkan questionNumber
                const sortedQuestions = questions.sort((a, b) => a.questionNumber - b.questionNumber);
        
                const formattedQuestions = sortedQuestions.map((question) => ({
                    id: question.id,
                    questionText: question.questionText,
                    questionNumber: question.questionNumber,
                    pageName: question.pageName,
                    questionPhoto: question.questionPhoto,
                    weight: question.weight,
                    discussion: question.discussion,
                    options: question.options.map((opt) => ({
                        id: opt.id,
                        label: opt.description,
                        value: opt.description,
                        isCorrect: opt.isCorrect
                    })),
                }));
        
                setQuestions(formattedQuestions);
                setMarkedReview(Array(formattedQuestions.length).fill(false));
        
                // Karena questions sekarang diurutkan, kita perlu menyesuaikan ini
                const currentQuestionId = formattedQuestions[currentOption - 1]?.id;
                if (currentQuestionId && answers[currentQuestionId]) {
                    setSelectedOption(answers[currentQuestionId].optionLabel);
                }
            } catch (error) {
                console.error('Gagal mengambil data soal atau jawaban:', error);
            }
        };
        
        fetchQuestionsAndAnswers();
    }, [testId, token]);

     // Handler to toggle isClicked when the button is clicked
     const handleClick = (index) => {
        // Tambahkan logika untuk ragu-ragu di sini
        if (doubtQuestions.includes(index + 1)) {
            toggleDoubt(index + 1);
        } else {
            setCurrentOption(index + 1); // Atur pertanyaan yang sedang aktif
            setPageName(`Soal ${index + 1}`);
        }
    };
    
    const toggleDoubt = (questionIndex) => {
        setDoubtQuestions((prev) => {
            const updatedDoubtQuestions = prev.includes(questionIndex)
                ? prev.filter((q) => q !== questionIndex)
                : [...prev, questionIndex];
            
            localStorage.setItem(`doubtQuestions_${testId}`, JSON.stringify(updatedDoubtQuestions));
            
            return updatedDoubtQuestions;
        });
    };
    

    const fetchAnswersByResultId = async (resultId) => {
        try {
            const savedResultId = localStorage.getItem('resultId');
                if (savedResultId) {
                    setResultId(savedResultId);
                }
            const response = await fetch(`https://${URL}/answer/tests/${resultId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Gagal mengambil data jawaban');

            const data = await response.json();
            const formattedAnswers = data.reduce((acc, answer) => {
                acc[answer.option.questionId] = { optionId: answer.optionId, optionLabel: answer.userAnswer };
                return acc;
            }, {});

            setAnswers(formattedAnswers);

            const currentQuestionId = questions[currentOption - 1]?.id;
            if (currentQuestionId && formattedAnswers[currentQuestionId]) {
                setSelectedOption(formattedAnswers[currentQuestionId].optionLabel);
            }
        } catch (error) {
            console.error('Kesalahan saat mengambil jawaban:', error);
        }
    };
    // Simpan `currentOption` ke localStorage setiap kali berubah
    useEffect(() => {
        if (currentOption !== null) {
            localStorage.setItem('currentOption', currentOption);
        }
    }, [currentOption]);

    // Load token dan resultId dari localStorage saat komponen pertama kali dimuat
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) setToken(storedToken);

        const savedResultId = localStorage.getItem('resultId');
        if (savedResultId) setResultId(savedResultId);
    }, []);

    // Perbarui jawaban yang sudah tersimpan untuk `currentOption`
    useEffect(() => {
        const currentQuestionId = questions[currentOption - 1]?.id;

        if (currentQuestionId && answers[currentQuestionId]) {
            setSelectedOption(answers[currentQuestionId].optionLabel);
            console.log(
                `Jawaban ditemukan untuk pertanyaan ${currentQuestionId}: ${answers[currentQuestionId].optionLabel}`
            );
        } else {
            setSelectedOption(null);
        }
    }, [currentOption, answers, questions]);

    // Fungsi untuk mengupdate waktu tersisa
    const updateRemainingTime = (newTime) => {
        if (!sessionId) return;
        if (newTime <= 0) {
            setTimerActive(false);
            clearInterval(countdownInterval.current); // Hentikan timer
            alert('Waktu habis!');
        } else {
            localStorage.setItem(`remainingTime_${sessionId}`, newTime);
        }
        return newTime;
    };

const startWorkTime = () => {
    workTimeInterval.current = setInterval(() => {
        setWorkTime((prevWorkTime) => {
            const newWorkTime = prevWorkTime + 1;
            // Simpan work time dengan sessionId
            localStorage.setItem(`workTime_${sessionId}`, newWorkTime);
            return newWorkTime;
        });
    }, 1000);
};

useEffect(() => {
    if (!sessionId) return; // Jangan lanjutkan jika sessionId belum ada

    const storedWorkTime = localStorage.getItem(`workTime_${sessionId}`);
    setWorkTime(storedWorkTime ? parseInt(storedWorkTime) : 0);

    const fetchRemainingTime = async () => {
        if (!sessionId) return; // Validasi sessionId sebelum digunakan
        const storedRemainingTime = localStorage.getItem(`remainingTime_${sessionId}`);
        if (storedRemainingTime) {
            const time = Number(storedRemainingTime);
            if (!isNaN(time) && time > 0) {
                setRemainingTime(time);
                setTimerActive(true);
                startWorkTime();
                startCountdown(time);
            }
        } else {
            // Fetch dari backend jika tidak ditemukan di localStorage
            try {
                const response = await fetch(`https://${URL}/timer/${testId}/worktime`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch worktime');

                const data = await response.json();
                const { hours, minutes, seconds } = data;
                const totalWorkTimeInSeconds = hours * 3600 + minutes * 60 + seconds;

                if (totalWorkTimeInSeconds > 0) {
                    setRemainingTime(totalWorkTimeInSeconds);
                    setTimerActive(true);
                    localStorage.setItem(`remainingTime_${sessionId}`, totalWorkTimeInSeconds);
                    startWorkTime();
                    startCountdown(totalWorkTimeInSeconds);
                } else {
                    setRemainingTime(0);
                    alert('Waktu sudah habis!');
                }
            } catch (error) {
                console.error('Failed to fetch worktime:', error);
                alert('Gagal mengambil waktu kerja.');
            }
        }
    };

    fetchRemainingTime();

    return () => {
        clearInterval(workTimeInterval.current);
        clearInterval(countdownInterval.current);
    };
}, [sessionId, testId, token]);

    // Fungsi untuk memulai countdown waktu pengerjaan    // Memulai countdown timer
    const startCountdown = () => {
        if (countdownInterval.current) return; // Jangan buat interval baru jika sudah ada
        countdownInterval.current = setInterval(() => {
            setRemainingTime((prevTime) => {
                const newTime = prevTime - 1;
                return updateRemainingTime(newTime);
            });
        }, 1000);
    };

        // Bersihkan interval saat komponen dilepas
    useEffect(() => {
        return () => clearInterval(countdownInterval.current);
    }, []);

    // Jalankan countdown jika timer aktif
    useEffect(() => {
        if (timerActive && remainingTime > 0) {
            startCountdown();
        } else {
            clearInterval(countdownInterval.current);
        }
    }, [timerActive, remainingTime]);

        // Fungsi untuk memulai timer (contoh dari backend atau tombol start)
    const initializeTimer = (initialTime) => {
        setRemainingTime(initialTime);
        setTimerActive(true);
    };

    
    const formatRemainingTime = (timeInSeconds) => {
        if (typeof timeInSeconds !== 'number' || isNaN(timeInSeconds) || timeInSeconds < 0) {
            return '00:00:00';
        }

        const hours = Math.floor(timeInSeconds / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const seconds = timeInSeconds % 60;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };
    
    // Format remaining time for display
    const remainingTimeFormatted = formatRemainingTime(remainingTime);

    const saveDraftAnswer = async (testId, optionId, selectedOption) => {
        try {
            const response = await fetch(`https://${URL}/answer/tests/${testId}/temp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ testId, answers: [{ optionId, selectedOption }] }),
            });

            if (!response.ok) throw new Error('Gagal menyimpan draft jawaban');

            const data = await response.json();
            return data.resultId;
        } catch (error) {
            console.error('Kesalahan saat memperbarui draft jawaban:', error);
        }
    };

    // Update existing draft answers
    const updateDraftAnswer = async (resultId, oldOptionId, newOptionId, newAnswer) => {
        try {
            console.log('Updating draft answer:', { resultId, oldOptionId, newOptionId, newAnswer });

            const response = await fetch(`httsp://${URL}/answer/tests/${testId}/update`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    resultId,
                    oldOptionId,
                    newOptionId,
                    newAnswer,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Response error:', errorData);
                throw new Error('Gagal memperbarui draft jawaban');
            }

            const responseData = await response.json();
            console.log('Draft updated successfully:', responseData);
            return responseData.resultId;
        } catch (error) {
            console.error('Error in updateDraftAnswer:', error.message);
        }
    };

    // Fungsi untuk submit jawaban akhir
    const submitFinalAnswers = async (resultId) => {
        try {
            // Ambil resultId dari localStorage
            const resultId = localStorage.getItem('resultId');
            if (!resultId) {
                throw new Error('Result ID tidak ditemukan di localStorage');
            }
    
            // Ambil token dari localStorage (atau diambil dari tempat lain sesuai implementasi)
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token tidak ditemukan. Pastikan Anda sudah login.');
            }
    
            // Kirim request ke backend dengan resultId di body
            const response = await fetch(`https://${URL}/answer/tests/submit`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, // Sertakan token di header
                },
                body: JSON.stringify({ resultId }), // Kirim resultId di body
            });
    
            // Cek apakah respons tidak OK (status 4xx atau 5xx)
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal mengirim jawaban final');
            }
    
            // Parsing response jika sukses
            const data = await response.json();
            console.log('Jawaban final berhasil disimpan:', data);
    
            // SweetAlert untuk sukses
            Swal.fire({
                icon: 'success', // Ikon sukses
                title: 'Berhasil!',
                text: 'Jawaban final berhasil disimpan!',
                confirmButtonText: 'OK',
                timer: 3000, // Durasi alert (opsional)
                timerProgressBar: true, // Bar progres (opsional)
            });
    
        } catch (error) {
            console.error('Error saat mengirim jawaban final:', error);
    
            // SweetAlert untuk error
            Swal.fire({
                icon: 'error', // Ikon error
                title: 'Gagal!',
                text: `Terjadi kesalahan saat mengirim jawaban final: ${error.message}`,
                confirmButtonText: 'Coba Lagi',
            });
        }
    };

    const handleOption = async (optionId, optionLabel, question) => {
        setSelectedOption(optionLabel);
        const previousAnswer = answers[question.id];
        let currentResultId = resultId || localStorage.getItem('resultId');  // Ambil resultId dari localStorage jika tidak tersedia

        if (!answeredQuestions.includes(currentOption)){
            setAnsweredQuestions([...answeredQuestions, currentOption]);
        }

        const updatedMarkedReview = [...markedReview];
        updatedMarkedReview[currentOption - 1] = true; // Tandai jawaban untuk soal saat ini
        setMarkedReview(updatedMarkedReview);

        const updatedAnsweredSoals = [...answeredSoals, question.questionNumber];
        setAnsweredSoals(updatedAnsweredSoals);
        localStorage.setItem(`answeredSoals_${testId}`, JSON.stringify(updatedAnsweredSoals));
        
        if (previousAnswer) {
            if (previousAnswer.optionId !== optionId || previousAnswer.optionLabel !== optionLabel) {
                if (currentResultId) {
                    try {
                        await updateDraftAnswer(currentResultId, previousAnswer.optionId, optionId, optionLabel);
                        const updatedAnswers = {
                            ...answers,
                            [question.id]: { optionId, optionLabel },
                        };
                        setAnswers(updatedAnswers);
    
                        // Simpan jawaban ke localStorage
                        localStorage.setItem('answers', JSON.stringify(updatedAnswers));
    
                        console.log('Jawaban berhasil diperbarui');
                    } catch (error) {
                        console.error('Gagal memperbarui draft:', error);
                    }
                }
            }
        } else {
            try {
                const newResultId = await saveDraftAnswer(testId, optionId, optionLabel);
                setResultId(newResultId);
                localStorage.setItem('resultId', newResultId);
    
                const updatedAnswers = {
                    ...answers,
                    [question.id]: { optionId, optionLabel },
                };
                setAnswers(updatedAnswers);
    
                // Simpan jawaban baru ke localStorage
                localStorage.setItem('answers', JSON.stringify(updatedAnswers));
    
                console.log('Jawaban disimpan sebagai draft baru dengan resultId:', newResultId);
            } catch (error) {
                console.error('Gagal menyimpan draft:', error);
            }
        }
    };
    
    const handlenextquestion = () => {
        if (currentOption < questions.length) {
            setCurrentOption((prev) => prev + 1);
            const nextQuestionId = questions[currentOption]?.id;
            if (answers[nextQuestionId]) {
                setSelectedOption(answers[nextQuestionId].optionLabel);
            } else {
                setSelectedOption(null);
            }
        }
    };

    const handleprevquestion = () => {
        if (currentOption > 1) {
            setCurrentOption((prev) => prev - 1);
            const prevQuestionId = questions[currentOption - 2]?.id;
            if (answers[prevQuestionId]) {
                setSelectedOption(answers[prevQuestionId].optionLabel);
            } else {
                setSelectedOption(null);
            }

            // Set the button click state to true
            setIsClicked(true);
        }
    };

    const handlemarkreview = () => {
        setMarkedReview((prevState) => {
            const updatedState = [...prevState];
            updatedState[currentOption - 1] = !updatedState[currentOption - 1];
            console.log('Updated markedReview:', updatedState);
            return updatedState;
        });
    };
    
    useEffect(() => {
        console.log('Updated doubtQuestions:', doubtQuestions);
    }, [doubtQuestions]);
    
    

    const handleAnswerInput = (optionIndex) => {
        setAnsweredOptions(prev => {
            const updatedAnswers = [...prev];
            updatedAnswers[optionIndex] = true; // Tandai bahwa opsi sudah diisi
            return updatedAnswers;
        });
    };

     // Fungsi untuk memperbarui warna nomor soal
     const handleAnswerQuestion = (index) => {
        const updatedAnsweredQuestions = [...answeredQuestions];
        updatedAnsweredQuestions[index] = !updatedAnsweredQuestions[index]; // Toggle jawaban
        setAnsweredQuestions(updatedAnsweredQuestions);
    };


    // Panggil `submitFinalAnswers` ketika tombol "Submit" diklik
    const handleSubmit = async () => {
        // Cek soal yang belum dijawab
        const unansweredQuestions = questions
            .filter((question) => !answers[question.id]) // Cek apakah soal tidak ada di jawaban
            .map((question) => question.questionNumber); // Ambil nomor soal yang belum dijawab
    
        if (unansweredQuestions.length > 0) {
            // Jika ada soal yang belum dijawab, tampilkan alert
            await Swal.fire({
                title: 'Soal Belum Lengkap!',
                text: `Anda masih memiliki ${unansweredQuestions.length} soal yang belum dijawab (Nomor: ${unansweredQuestions.join(', ')}). Harap isi semua soal sebelum mengirim.`,
                icon: 'warning',
                confirmButtonText: 'OK',
            });
    
            // Arahkan ke soal pertama yang belum dijawab
            const firstUnansweredIndex = questions.findIndex(
                (question) => unansweredQuestions.includes(question.questionNumber)
            );
    
            setCurrentOption(firstUnansweredIndex + 1); // Arahkan ke soal tersebut
            return; // Hentikan proses submit
        }
    
        // Cek apakah ada soal ragu-ragu
        const doubtfulQuestions = doubtQuestions.map(index => index + 0);
    
        let confirmMessage = 'Apakah Anda yakin ingin mengirim jawaban?';
        if (doubtfulQuestions.length > 0) {
            confirmMessage += `\n\nPeringatan: Anda masih memiliki ${doubtfulQuestions.length} soal yang ditandai ragu-ragu (Nomor: ${doubtfulQuestions.join(', ')}).`;
        }
    
        const confirmSubmit = await Swal.fire({
            title: 'Konfirmasi Pengiriman',
            text: confirmMessage,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, kirim jawaban!',
            cancelButtonText: 'Batal'
        });
    
        if (confirmSubmit.isConfirmed) {
            try {
                if (workTimeInterval.current) {
                    clearInterval(workTimeInterval.current);
                }
                localStorage.removeItem(`workTime_${resultId}`);
                
                await submitFinalAnswers(resultId);
    
                localStorage.removeItem('answers');
                localStorage.removeItem('resultId');
                localStorage.removeItem(`remainingTime_${resultId}`);
                localStorage.removeItem(`answeredSoals_${testId}`);
                localStorage.removeItem(`doubtQuestions_${testId}`);
                localStorage.removeItem(`currentOption_${testId}`);
    
                router.push(`/tes/mengerjakan-tes/hasil-tes/${resultId}`);
            } catch (error) {
                console.error('Error submitting final answers:', error);
    
                Swal.fire({
                    title: 'Terjadi Kesalahan!',
                    text: 'Terjadi kesalahan saat mengirim jawaban. Silakan coba lagi.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        }
    };
    

    useEffect(() => {
        const storedAnswers = localStorage.getItem('answers');
        
        if (storedAnswers) {
            const parsedAnswers = JSON.parse(storedAnswers);
            setAnswers(parsedAnswers);  // Isi state answers dengan jawaban dari localStorage
            console.log('Loaded answers from localStorage:', parsedAnswers);
        }
    }, []);
    

    const currentQuestion = questions.length > 0 ? questions[currentOption - 1] : null;

    console.log("Render Check:");
    console.log('MarkedReview State:', markedReview);
    console.log('Current Option:', currentOption);
    console.log("answeredOptions:", answeredOptions);

    // UseEffect untuk melacak perubahan state
    useEffect(() => {
        console.log("State Updated:");
        console.log('MarkedReview State:', markedReview);
        console.log('Current Option:', currentOption);
        console.log("answeredOptions:", answeredOptions);
    }, [markedReview, answeredOptions, currentOption]);


    return (
        <div className="min-h-screen flex flex-col bg-white font-sans">
            {/* Header */}
            <header className="w-full bg-[#0B61AA] text-white p-4" style={{ maxWidth: '14540px' }}>
                <div className="flex justify-start items-center">
                    <button
                        className="block md:block lg:hidden text-white px-2 py-2 rounded-lg"
                        onClick={() => setShowNav(!showNav)}
                    >
                        {showNav ? (
                        <span className="flex items-center">
                            <PiListNumbers className="mr-2" size={30} /> Tutup Menu
                        </span>
                    ) : (
                        <PiListNumbers size={30} />
                        )}
                    </button>
                    <div className="flex items-start justify-start">
                        <img src="/images/etamtest.png" alt="Etamtest" className="h-[40px]" style={{ maxWidth: '179px' }} />
                    </div>
                </div>
            </header>

            {/* Navigasi untuk mobile */}
            {showNav && (
                <div className="fixed inset-0 z-40 bg-gray-800 bg-opacity-50 lg:hidden" />
            )}

            {showNav && (
                <div className="fixed inset-y-0 left-0 bg-white z-50 flex flex-col lg:hidden w-3/4 sm:w-2/3 md:w-1/2 transition-transform transform translate-x-0">
                    {/* Header Navigation */}
                    <div className="p-6 flex justify-between items-center">
                        <button
                            className="text-black bg-[#F3F3F3] px-2 py-1 rounded"
                            onClick={() => setShowNav(false)}
                        >
                            <PiListNumbers size={30} className="text-xl" />
                        </button>
                    </div>
                    
                    {/* Navigation Content */}
                    <div className="mt-2 bg-[#F3F3F3] rounded-[40px] shadow-lg p-2 mx-4">
                        <div className="bg-[#0B61AA] p-2 rounded-[10px]" style={{ height: '50px' }}>
                            <h2 className="text-center text-white font-bold text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl">
                                {pageName}
                            </h2>
                        </div>
                        <div className="p-2 flex-grow">
                            <div className="grid grid-cols-5 gap-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                                {Array.from({ length: questions.length }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-lg font-bold rounded border border-[#0B61AA] 
                                            ${currentOption === i + 1 ? 'bg-gray-600 text-white' : ''} 
                                            ${answeredQuestions.includes(i + 1) && currentOption !== i + 1 ? 'bg-gray-400' : ''} 
                                            ${doubtQuestions.includes(i + 1) ? 'bg-yellow-500 text-white' : ''} 
                                            ${!answeredQuestions.includes(i + 1) && !doubtQuestions.includes(i + 1) && currentOption !== i + 1 ? 'bg-gray-200' : ''} 
                                            hover:bg-gray-300`}
                                        onClick={() => handleClick(i)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Question and Timer section */}
            <div className="flex flex-col lg:flex-row mt-12 p-6 mx-4 lg:mx-48 lg:space-x-6 rounded-[15px]">
                <div className="w-full lg:w-3/4 bg-[#0B61AA] p-6 sm:p-4 rounded-lg shadow-lg" style={{ maxWidth: '994px', height: 'auto' }}>
                    <div className="flex justify-between items-center mb-2 ml-1">
                        <h2 className="text-[12px] font-poppins sm:text-xs md:text-sm lg:text-lg font-bold text-white">{title}</h2>
                        <div className="flex items-center justify-center space-x-12 flex-grow">
                            <p className="text-[10px] sm:text-xs md:text-sm lg:text-lg font-poppins font-bold text-white ml-6">
                                {currentOption}/{questions.length}
                            </p>
                        </div>
                        <div className="bg-[#0B61AA] text-white font-poppins px-2 ml-8 py-2 rounded-[10px] border border-white font-bold text-[12px] sm:text-xs md:text-sm lg:text-lg">
                            Waktu Tersisa: {remainingTimeFormatted}
                        </div>
                    </div>


                    {/* Soal dan Opsi */}
                    {currentQuestion && (
                        <>
                            <div className="mb-6 sm:mb-4 bg-white p-4 sm:p-2 rounded-[15px] shadow">
                                <p className="text-lg font-poppins mb-6 sm:mb-4">{currentQuestion.questionText}</p>
                                {questions[currentOption - 1]?.questionPhoto && (
                                    <img 
                                        src={questions[currentOption - 1]?.questionPhoto} 
                                        alt={`Question ${questions[currentOption - 1]?.questionNumber}`}
                                        className="h-64 w-64 aspect-square rounded-lg object-cover mx-auto my-3"
                                    />
                                )}
                            </div>
                            {currentQuestion.options.map((option) => (
                                <div 
                                    key={option.id} 
                                    className="mb-4 sm:mb-2 bg-white p-4 sm:p-2 font-poppins rounded-lg shadow-lg flex items-center space-x-4"
                                >
                                    <input
                                        type="radio"
                                        id={option.id}
                                        name={`question-${currentQuestion.id}`}
                                        value={option.value}
                                        checked={selectedOption === option.value}
                                        onChange={() => handleOption(option.id, option.value, currentQuestion)}
                                        className="mr-2"
                                    />
                                    {option.optionPhoto && (
                                        <img 
                                            src={option.optionPhoto} 
                                            alt={`Option ${option.label}`} 
                                            className="h-16 w-16 rounded-lg object-cover"
                                        />
                                    )}
                                    <label htmlFor={option.id} className="text-xs sm:text-sm md:text-base">{option.label}</label>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row justify-between mt-6">
                        <div className="bg-white mb-4 p-4 rounded-[15px] shadow w-full">
                            <div className="flex flex-col sm:flex-row justify-between items-center">
                                <div className="flex flex-row justify-center items-center w-full space-x-2 sm:space-x-4">
                                    {/* Tombol Soal Sebelumnya */}
                                    <button
                                        className="bg-transparent sm:bg-deepBlue text-black sm:text-white px-1 py-1 rounded-[15px] w-full max-w-[200px] flex justify-center items-center flex-row whitespace-nowrap"
                                        style={{ height: '40px' }}
                                        onClick={handleprevquestion}
                                        disabled={currentOption === 1}
                                    >
                                        <span className="hidden sm:block font-poppins text-xs sm:text-sm">Soal Sebelumnya</span>
                                        <CgArrowLeftR className="block sm:hidden text-lg text-black" />
                                    </button>


                                    {/* Tombol Ragu-Ragu */}
                                    <button
                                        className={`px-2 sm:px-4 py-2 sm:py-4 rounded-[15px] w-full max-w-[400px] text-black 
                                            ${markedReview[currentOption - 1] ? 'bg-yellow-500 hover:bg-yellow-400' : 
                                            answeredOptions[currentOption - 1] ? 'bg-[#F8B75B] hover:bg-yellow-400' : 
                                            'bg-[#F8B75B] hover:bg-yellow-400'}
                                            text-xs sm:text-sm lg:text-lg flex justify-center items-center lg:bg-yellow-500 whitespace-nowrap`}
                                        style={{ height: 'auto' }}
                                        onClick={() => toggleDoubt(currentOption)}
                                    >
                                        <span className="font-poppins w-full text-center">Ragu-Ragu</span>
                                    </button>

                                    {/* Tombol Submit / Soal Selanjutnya */}
                                    {currentOption === questions.length ? (
                                        <button
                                        className="bg-deepBlue font-poppins text-white px-4 py-1 rounded-[15px] hover:bg-powderBlue lg:mb-0 w-full max-w-[150px] 
                                        text-xs sm:text-sm md:text-base lg:text-lg"  // Adjust text size and padding for mobile
                                        style={{ height: '40px' }}
                                        onClick={handleSubmit}>
                                        Submit
                                    </button>
                                    
                                    
                                    ) : (
                                        <button
                                            className="bg-transparent sm:bg-deepBlue  text-black sm:text-white px-1 py-1 rounded-[15px] w-full max-w-[200px] flex justify-center items-center flex-row whitespace-nowrap"
                                            style={{ height: '40px' }}
                                            onClick={handlenextquestion}
                                        >
                                            <span className="hidden sm:block font-poppins text-xs sm:text-sm">Soal Selanjutnya</span>
                                            <CgArrowRightR className="block sm:hidden text-lg text-black" />
                                        </button>

                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                    {/* Question navigation */}
                    <div className="hidden lg:block lg:w-1/4 mt-6 lg:mt-0 bg-[#F3F3F3] rounded-[20px] shadow-lg">
                        <div className="bg-[#0B61AA] p-2 rounded-[10px]" style={{ height: '50px' }}>
                            <h2 className="text-center text-white font-bold text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl">
                                {questions[currentOption - 1]?.pageName || ""}
                            </h2>
                            
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))' }}>
                                {questions.map((question, index) => (
                                    <button
                                        key={question.id}
                                        className={`w-10 h-10 text-lg font-poppins font-bold rounded border border-[#0B61AA] 
                                            ${currentOption === index + 1 ? 'bg-gray-600 text-white' : ''} 
                                            ${answeredQuestions.includes(index + 1) && currentOption !== index + 1 ? 'bg-gray-400' : ''} 
                                            ${doubtQuestions.includes(index + 1) ? 'bg-yellow-500 text-white' : ''} 
                                            ${!answeredQuestions.includes(index + 1) && !doubtQuestions.includes(index + 1) && currentOption !== index + 1 ? 'bg-gray-200' : ''} 
                                            hover:bg-gray-300`}
                                        onClick={() => setCurrentOption(index + 1)}
                                    >
                                        {question.questionNumber}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default MengerjakanTes;
