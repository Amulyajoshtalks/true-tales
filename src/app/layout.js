// src/app/layout.jsx
import './globals.css';
import Navbar from '@/components/Navbar';
import { AudioProvider } from "@/context/AudioContext";


export const metadata = {
  title: 'StoryVoice',
  description: 'Share and listen to real life stories',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
    
      <body className="bg-gray-100">
        <Navbar />
        <AudioProvider>
        {children}
        </AudioProvider>
      </body>
    </html>
  );
}