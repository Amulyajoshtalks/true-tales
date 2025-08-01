// src/app/page.jsx
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
// import StoryCard from '@/components/StoryCard';
import Player from '@/components/Player';
import HomeClient from '@/components/HomeClient';

export default function Home() {
  return (
    <div className='w-full px-2 md:px-12 py-12 md:py-18'>
       <HomeClient/>
       </div>
  );
}