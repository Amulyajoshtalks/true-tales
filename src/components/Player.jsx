// src/components/Player.jsx
"use client"
import { motion } from 'framer-motion';
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from 'react-icons/fa';

export default function Player() {
  return (
    <motion.div 
      className="fixed bottom-0 w-full bg-white border-t shadow-lg p-4"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="w-1/4">
            <div className="text-sm font-medium">Episode1 life start</div>
          </div>
          
          <div className="w-2/4 flex flex-col items-center">
            <div className="flex items-center space-x-6">
              <button className="text-gray-600 hover:text-purple-600">
                <FaStepBackward />
              </button>
              <button className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white hover:bg-purple-700">
                <FaPlay className="ml-1" />
              </button>
              <button className="text-gray-600 hover:text-purple-600">
                <FaStepForward />
              </button>
            </div>
            
            <div className="w-full mt-4">
              <div className="flex items-center">
                <span className="text-xs text-gray-500">0:00</span>
                <div className="flex-1 mx-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600" style={{ width: '0%' }}></div>
                </div>
                <span className="text-xs text-gray-500">Infinity:NaN</span>
              </div>
            </div>
          </div>
          
          <div className="w-1/4 flex justify-end">
            <div className="text-sm text-gray-500">0 listens</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}