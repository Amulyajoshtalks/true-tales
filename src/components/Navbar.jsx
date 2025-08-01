'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaMicrophone, FaBell, FaUser, FaCog, FaSignOutAlt, FaSignInAlt, FaHome, FaTimes, FaBook } from 'react-icons/fa';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState({});
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || {});
    };
    getSession();
  }, []);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Logo animation variants
  const logoVariants = {
    initial: { opacity: 0, y: -20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.3
      }
    },
    hover: {
      transition: { staggerChildren: 0.05 }
    }
  };

  const letterVariants = {
    initial: { 
      y: 20, 
      opacity: 0,
      rotate: -10,
      color: "#8B5CF6"
    },
    animate: {
      y: 0,
      opacity: 1,
      rotate: 0,
      color: "#8B5CF6",
      transition: { 
        type: "spring", 
        stiffness: 300,
        damping: 12
      }
    },
    hover: {
      y: [0, -15, 0],
      rotate: [0, 15, -10, 5, 0],
      color: ["#8B5CF6", "#EC4899", "#8B5CF6"],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };

  const handleRecordClick = () => {
    if (session) {
      router.push("/create");
    } else {
      router.push("/login");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser({});
    setShowDropdown(false);
    router.refresh();
  };

  return (
    <motion.div
      className={`fixed top-0 w-full z-50 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-md py-1' 
          : 'bg-white/95 py-2 sm:py-3'
      } transition-all duration-300`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Animated Logo - Responsive text size */}
          <motion.div
            className="flex-shrink-0 cursor-pointer"
            variants={logoVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
          >
            <motion.h1 
              className="text-xl sm:text-2xl font-bold font-mono flex"
              onClick={() => router.push("/")}
            >
              {['S', 't', 'o', 'r', 'y', 'V', 'o', 'x'].map((letter, index) => (
                <motion.span
                  key={index}
                  variants={letterVariants}
                  className="inline-block"
                  custom={index}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.h1>
          </motion.div>

          {/* Desktop Search - Hidden on mobile */}
          <div className="hidden md:flex flex-1 mx-4 lg:mx-8 max-w-2xl">
            <motion.div 
              className="relative w-full"
              whileHover={{ scale: 1.02 }}
            >
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search stories, creators, emotions..."
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-full bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              />
            </motion.div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Mobile Search Toggle */}
            <button 
              className="md:hidden text-gray-600 hover:text-purple-600 p-2"
              onClick={() => setShowMobileSearch(true)}
            >
              <FaSearch size={18} />
            </button>

            {/* Record Story Button - Responsive text */}
            <motion.button
              className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-3 py-2 rounded-full text-xs sm:text-sm shadow-lg"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0px 5px 15px rgba(128, 0, 128, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRecordClick}
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <FaMicrophone />
              </motion.span>
              <span className="hidden xs:inline">Record</span>
              <span className="hidden sm:inline"> Story</span>
            </motion.button>

            {/* Notification Bell - Hidden on mobile */}
            <motion.button 
              className="hidden md:block text-gray-600 hover:text-purple-600 relative p-2"
              whileHover={{ rotate: 10 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaBell size={18} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </motion.button>

            {/* User Avatar with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <motion.div 
                className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-medium text-white shadow cursor-pointer"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {session && user?.user_metadata?.avatar_url ?
                  <Image 
                    src={user.user_metadata.avatar_url} 
                    alt="avatar" 
                    width={32} 
                    height={32} 
                    className="w-full h-full rounded-full object-cover"
                  />
                : <FaUser />}
              </motion.div>
              
              {/* Animated Dropdown - Responsive width */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    className="absolute right-0 mt-2 w-56 max-w-[90vw] bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-100"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {session ? (
                      <>
                        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                          <p className="font-medium text-gray-800 truncate capitalize">
                            {user?.user_metadata?.full_name || "Anonymous"}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {user?.email || "NA"}
                          </p>
                        </div>
                        
                        <motion.button 
                          className="flex w-full items-center gap-3 p-3 hover:bg-gray-50 text-gray-700 whitespace-nowrap"
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => router.push("/dashboard")}
                        >
                          <FaHome className="text-purple-500 min-w-[16px]" />
                          <span>Dashboard</span>
                        </motion.button>
                        
                        <motion.button 
                          className="flex w-full items-center gap-3 p-3 hover:bg-gray-50 text-gray-700 whitespace-nowrap"
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => router.push("/settings")}
                        >
                          <FaCog className="text-blue-500 min-w-[16px]" />
                          <span>Settings</span>
                        </motion.button>
                        
                        <motion.button 
                          className="flex w-full items-center gap-3 p-3 hover:bg-gray-50 text-gray-700 whitespace-nowrap"
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => router.push(`/user-profile/${user.id}`)}
                        >
                          <FaBook className="text-green-500 min-w-[16px]" />
                          <span>Profile</span>
                        </motion.button>
                        
                        <motion.button 
                          className="flex w-full items-center gap-3 p-3 hover:bg-gray-50 text-red-500 border-t border-gray-100 whitespace-nowrap"
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleLogout}
                        >
                          <FaSignOutAlt className="min-w-[16px]" />
                          <span>Logout</span>
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button 
                          className="flex w-full items-center gap-3 p-3 hover:bg-gray-50 text-gray-700 whitespace-nowrap"
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => router.push("/login")}
                        >
                          <FaSignInAlt className="text-purple-500 min-w-[16px]" />
                          <span>Login</span>
                        </motion.button>
                        
                        <motion.button 
                          className="flex w-full items-center gap-3 p-3 hover:bg-gray-50 text-gray-700 border-t border-gray-100 whitespace-nowrap"
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => router.push("/register")}
                        >
                          <FaUser className="text-blue-500 min-w-[16px]" />
                          <span>Register</span>
                        </motion.button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar - Full width */}
        <AnimatePresence>
          {showMobileSearch && (
            <motion.div
              className="md:hidden mt-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search stories..."
                  className="w-full py-3 pl-10 pr-12 border border-gray-300 rounded-lg bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  autoFocus
                />
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <FaSearch />
                </span>
                <button 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setShowMobileSearch(false)}
                >
                  <FaTimes />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}