import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { FiChevronLeft, FiChevronRight, FiFlag, FiCheck, FiClock, FiList, FiHelpCircle } from 'react-icons/fi';

const TEST_DURATION = 1800; // 30 minutes in seconds
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function TestPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const questionRefs = useRef([]);

  // Load questions
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/questions/${type.toUpperCase()}`);
        setQuestions(data.questions || []);
        
        // Check if user has already seen instructions for any test
        const hasSeenInstructions = localStorage.getItem('hasSeenTestInstructions');
        if (hasSeenInstructions) {
          setShowInstructions(false);
          setTestStarted(true);
        }
      } catch (error) {
        console.error('Error loading questions:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [type]);

  // Timer effect
  useEffect(() => {
    if (!testStarted || timeLeft <= 0) return;
    
    const timer = setTimeout(() => setTimeLeft(prev => {
      if (prev <= 1) {
        submit();
        return 0;
      }
      return prev - 1;
    }), 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, testStarted]);

  // Keyboard navigation
  useEffect(() => {
    if (!testStarted) return;
    
    const handleKeyDown = (e) => {
      // Number keys 1-4 for answer selection
      if (e.key >= '1' && e.key <= '4') {
        const optionIndex = parseInt(e.key) - 1;
        if (questions[current]?.options[optionIndex]) {
          handleAnswer(optionIndex);
        }
      }
      // Arrow keys for navigation
      else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [current, questions, testStarted]);

  const startTest = () => {
    setTestStarted(true);
    setShowInstructions(false);
    // Mark that user has seen instructions
    localStorage.setItem('hasSeenTestInstructions', 'true');
    // Scroll to first question
    setTimeout(() => {
      questionRefs.current[0]?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const submit = useCallback(async () => {
    try {
      // Format answers according to backend expectations
      const payload = questions.map((q, i) => {
        const selectedIndex = answers[i];
        const selectedOption = selectedIndex !== undefined ? q.options[selectedIndex] : '';
        const correctOption = q.options[q.correct_letter?.charCodeAt(0) - 97] || ''; // Convert 'a', 'b', 'c', 'd' to index
        
        return {
          questionId: q.id,
          selected: selectedOption,
          correct: correctOption
        };
      });
      
      await api.post(`/tests/${type}`, { answers: payload });
      
      // Navigate back to dashboard after completing individual test
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Failed to submit test. Please try again.');
    }
  }, [answers, questions, type, navigate]);

  const handleAnswer = (optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [current]: optionIndex
    }));
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(prev => prev + 1);
      // Scroll to next question
      setTimeout(() => {
        questionRefs.current[current + 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  const handlePrevious = () => {
    if (current > 0) {
      setCurrent(prev => prev - 1);
      // Scroll to previous question
      setTimeout(() => {
        questionRefs.current[current - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  const jumpToQuestion = (index) => {
    setCurrent(index);
    setShowReview(false);
    // Scroll to the selected question
    setTimeout(() => {
      questionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = questions.length > 0 ? Math.round(((current + 1) / questions.length) * 100) : 0;
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[current];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-2">Loading Test Questions...</h2>
          <p className="text-gray-600">Preparing your {type} assessment</p>
        </div>
      </div>
    );
  }

  // No questions state
  if (!questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-6xl mb-6 text-red-500">❌</div>
          <h2 className="text-2xl font-bold mb-2">No Questions Available</h2>
          <p className="text-gray-600 mb-8">We couldn't find any questions for the {type} assessment.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Back to Dashboard
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Test instructions screen
  if (!testStarted && showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-indigo-600 p-6 text-white">
            <h1 className="text-3xl font-bold">{type.charAt(0).toUpperCase() + type.slice(1)} Assessment</h1>
            <p className="mt-2 opacity-90">Read the instructions carefully before starting</p>
          </div>
          
          <div className="p-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <FiClock size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Time Allowed</h3>
                  <p className="text-gray-600">
                    You have {Math.floor(TEST_DURATION / 60)} minutes to complete this test. The timer will start when you click 'Start Test'.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <FiList size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Test Structure</h3>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1 mt-1">
                    <li>Total Questions: {questions.length}</li>
                    <li>Multiple Choice Questions (MCQs)</li>
                    <li>No negative marking</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <FiHelpCircle size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Navigation</h3>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1 mt-1">
                    <li>Use <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200 text-sm">←</kbd> <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200 text-sm">→</kbd> arrow keys to navigate between questions</li>
                    <li>Press <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200 text-sm">1</kbd>-<kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200 text-sm">4</kbd> to select an answer</li>
                    <li>Click on question numbers to jump to any question</li>
                  </ul>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={startTest}
                    className="px-8 py-4 bg-gradient-to-r from-primary to-indigo-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-transform"
                  >
                    Start Test
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-8 py-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back to Dashboard
                  </button>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                  By starting the test, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main test interface
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-indigo-700">CampusFit</h1>
              <div className="ml-6 flex items-center space-x-1">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                <FiClock className="text-gray-500" />
                <span className={`font-mono text-lg font-semibold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              <button
                onClick={() => setShowReview(!showReview)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiList className="text-gray-600" />
                <span className="hidden sm:inline">Review</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Question Navigation */}
        <div className={`fixed inset-y-0 left-0 transform ${showReview ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-72 bg-white border-r border-gray-200 shadow-lg md:shadow-none z-20 transition-transform duration-300 ease-in-out`}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Questions</h2>
              <p className="text-sm text-gray-500">
                {answeredCount} of {questions.length} answered
              </p>
              
              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Progress</span>
                  <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {questions.map((_, index) => {
                  const isAnswered = answers[index] !== undefined;
                  const isCurrent = index === current;
                  return (
                    <button
                      key={index}
                      onClick={() => jumpToQuestion(index)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                        isCurrent 
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-300' 
                          : isAnswered 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={`Question ${index + 1}`}
                    >
                      {index + 1}
                      {isAnswered && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-100 border border-green-300 mr-2"></span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300 mr-2"></span>
                  <span>Unanswered</span>
                </div>
              </div>
              <button
                onClick={submit}
                className="w-full py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <FiCheck size={16} />
                <span>
                  {type.toLowerCase() === 'aptitude' ? 'Continue to Technical' :
                   type.toLowerCase() === 'technical' ? 'Continue to Communication' :
                   'Submit Test'}
                </span>
              </button>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button 
            onClick={() => setShowReview(false)}
            className="md:hidden absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Overlay for mobile when sidebar is open */}
        {showReview && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setShowReview(false)}
          ></div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto focus:outline-none p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Question Navigation for Mobile */}
            <div className="md:hidden flex items-center justify-between mb-6 bg-white p-3 rounded-lg shadow-sm">
              <button
                onClick={handlePrevious}
                disabled={current === 0}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous question"
              >
                <FiChevronLeft size={24} />
              </button>
              
              <div className="text-center">
                <div className="text-sm text-gray-500">Question {current + 1} of {questions.length}</div>
                <div className="flex items-center justify-center space-x-2">
                  <FiClock className="text-gray-500" />
                  <span className={`font-mono font-medium ${timeLeft < 300 ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleNext}
                disabled={current === questions.length - 1}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next question"
              >
                <FiChevronRight size={24} />
              </button>
            </div>

            {/* Question Card */}
            <div 
              ref={el => questionRefs.current[current] = el}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300"
            >
              {/* Question Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                      Question {current + 1}
                    </span>
                    {answers[current] !== undefined && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
                        <FiCheck className="mr-1" size={12} />
                        Answered
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      // Toggle flag for review
                      // Add your flag logic here
                    }}
                    className="p-1.5 text-gray-400 hover:text-yellow-500 rounded-full hover:bg-yellow-50"
                    aria-label="Flag for review"
                  >
                    <FiFlag className={answers[current] === -2 ? 'text-yellow-500 fill-current' : ''} />
                  </button>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {currentQuestion.question}
                    </h2>
                  </div>
                  
                  {currentQuestion.image && (
                    <div className="mt-4">
                      <img 
                        src={currentQuestion.image} 
                        alt="Question illustration" 
                        className="max-w-full h-auto rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Options */}
              <div className="p-6">
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div 
                      key={index}
                      onClick={() => handleAnswer(index)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        answers[current] === index 
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center mr-3 mt-0.5 ${
                          answers[current] === index 
                            ? 'bg-indigo-600 border-indigo-700 text-white' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {answers[current] === index && (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-700">{OPTION_LETTERS[index]}. </span>
                          <span className="text-gray-800">{option}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Navigation Buttons */}
                <div className="mt-8 flex items-center justify-between pt-4 border-t border-gray-100">
                  <button
                    onClick={handlePrevious}
                    disabled={current === 0}
                    className={`px-5 py-2.5 rounded-lg border flex items-center space-x-2 ${
                      current === 0 
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FiChevronLeft />
                    <span>Previous</span>
                  </button>
                  
                  <div className="text-sm text-gray-500">
                    Question {current + 1} of {questions.length}
                  </div>
                  
                  {current < questions.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                    >
                      <span>Next</span>
                      <FiChevronRight />
                    </button>
                  ) : (
                    <button
                      onClick={submit}
                      className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <span>Submit Test</span>
                      <FiCheck />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Keyboard Shortcuts Help */}
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Keyboard Shortcuts
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono mr-2">1-4</kbd>
                  <span className="text-gray-600">Select option</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono mr-2">← →</kbd>
                  <span className="text-gray-600">Navigate questions</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono mr-2">R</kbd>
                  <span className="text-gray-600">Review panel</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono mr-2">Esc</kbd>
                  <span className="text-gray-600">Close panel</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
