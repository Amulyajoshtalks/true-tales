// src/components/Sidebar.jsx
"use client"
import { motion } from 'framer-motion';

const categories = [
  { id: 'love', name: 'Love Stories', checked: false },
  { id: 'life', name: 'Life Journey', checked: true },
  { id: 'motivation', name: 'Motivation', checked: false },
  { id: 'success', name: 'Success Stories', checked: false },
  { id: 'adventure', name: 'Adventure', checked: false },
];

export default function Sidebar() {
  return (
    <motion.div 
      className="w-64 fixed top-16 left-0 h-[calc(100vh-4rem)] bg-gray-50 p-6 overflow-y-auto"
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h2 className="text-lg font-semibold mb-4">Categories</h2>
      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center">
            <input
              type="checkbox"
              checked={category.checked}
              className="h-4 w-4 text-purple-600 rounded"
              onChange={() => {}}
            />
            <label className="ml-2 text-gray-700">{category.name}</label>
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Trending This Week</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-purple-600 font-semibold">Testing</div>
          <div className="text-gray-500 text-sm mt-1">1 episodes - 0 listens</div>
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">For You</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-purple-600 font-semibold">Anonymous</div>
          <div className="text-gray-500 text-sm mt-1">24 minutes ago - Adventure</div>
        </div>
      </div>
    </motion.div>
  );
}