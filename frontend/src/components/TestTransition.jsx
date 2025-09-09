import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiArrowRight, FiClock } from 'react-icons/fi';

const TEST_SEQUENCE = {
  'aptitude': { next: 'technical', title: 'Technical Assessment', color: 'from-blue-500 to-indigo-600' },
  'technical': { next: 'communication', title: 'Communication Assessment', color: 'from-green-500 to-emerald-600' },
  'communication': { next: 'results', title: 'Results', color: 'from-purple-500 to-pink-600' }
};

export default function TestTransition() {
  const { completedTest } = useParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  
  const nextTest = TEST_SEQUENCE[completedTest?.toLowerCase()];
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto-navigate to next test or results
      const nextRoute = nextTest?.next === 'results' ? '/results' : `/test/${nextTest?.next}`;
      navigate(nextRoute);
    }
  }, [countdown, navigate, nextTest]);

  if (!nextTest) {
    navigate('/results');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${nextTest.color} p-8 text-white text-center`}>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <FiCheck size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {completedTest.charAt(0).toUpperCase() + completedTest.slice(1)} Test Completed!
          </h1>
          <p className="text-lg opacity-90">Great job! Moving to the next assessment...</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Next: {nextTest.title}
            </h2>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  <FiCheck size={16} />
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">Aptitude</span>
              </div>
              
              <FiArrowRight className="text-gray-400" />
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  completedTest === 'aptitude' 
                    ? 'bg-blue-500 text-white' 
                    : completedTest === 'technical' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {completedTest !== 'aptitude' ? <FiCheck size={16} /> : '2'}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  completedTest !== 'aptitude' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  Technical
                </span>
              </div>
              
              <FiArrowRight className="text-gray-400" />
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  completedTest === 'communication' 
                    ? 'bg-green-500 text-white' 
                    : completedTest === 'technical'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {completedTest === 'communication' ? <FiCheck size={16} /> : '3'}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  completedTest === 'communication' ? 'text-green-600' : 
                  completedTest === 'technical' ? 'text-purple-600' : 'text-gray-600'
                }`}>
                  Communication
                </span>
              </div>
            </div>

            {/* Countdown */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <FiClock className="text-gray-500" size={24} />
                <span className="text-lg font-medium text-gray-700">
                  Starting in {countdown} seconds...
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-gradient-to-r ${nextTest.color} h-2 rounded-full transition-all duration-1000`}
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  const nextRoute = nextTest.next === 'results' ? '/results' : `/test/${nextTest.next}`;
                  navigate(nextRoute);
                }}
                className={`px-8 py-3 bg-gradient-to-r ${nextTest.color} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg`}
              >
                Continue to {nextTest.title}
              </button>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
