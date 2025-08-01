// src/components/CommentModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';


const CommentModal = ({ episodeId, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState(null);
  const textareaRef = useRef(null);
  


  // Fetch comments for the episode
  useEffect(() => {
    // Fetch current user session
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchComments();
    fetchUser();
  }, [episodeId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('comment_with_user_profile')
        .select('*')
        .eq('episode_id', episodeId)
        .order('comment_created_at', { ascending: false });
      
      if (error) throw error;
      
      setComments(data);
    } catch (err) {
      setError('Failed to load comments');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newComment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      setIsSending(true);
      const { data, error } = await supabase
        .from('comments')
        .insert({
          episode_id: episodeId,
          content: newComment,
          user_id: user?.id || null
        })
        .select();
      
      if (error) throw error;
      
      // Add new comment to the top
    //   setComments([data[0], ...comments]);
    
      setNewComment('');
      fetchComments()
    } catch (err) {
      setError('Failed to post comment');
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
            </svg>
            Comments
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-400">Loading comments...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-center">
              <p className="text-red-400">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h4 className="text-xl text-gray-300 mb-2">No comments yet</h4>
              <p className="text-gray-500 max-w-md text-center">
                Be the first to share your thoughts on this episode!
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {comments.map((comment,index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                        {
                            comment.avatar_url ? 
                            <Image src={comment.avatar_url} alt='' width={40} height={40} className='rounded-full'/>:
                          comment.full_name ? comment.full_name.slice(0, 2) : 'A'
                        }
                      
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-semibold text-gray-300">
                          {comment.username ? ` ${comment.username}`: (comment.full_name ?`${comment.full_name}` : 'Anonymous')}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.comment_created_at)}
                        </span>
                      </div>
                      <p className="text-gray-200 break-words">{comment.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* New Comment Form */}
        <motion.form 
          onSubmit={handleSubmit}
          className="p-4 border-t border-gray-700"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Add your comment..." : "Please sign in to comment"}
              rows="1"
              disabled={!user}
              className="w-full p-4 pr-12 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 resize-none shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!newComment.trim() || !user || isSending}
              className={`absolute right-3 bottom-3 p-2 rounded-full ${
                newComment.trim() && user
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              } transition-all duration-300`}
            >
              {isSending ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </motion.button>
          </div>
          
          {!user && (
            <p className="text-sm text-center mt-2 text-gray-400">
              You need to <button className="text-blue-400 hover:text-blue-300 underline">sign in</button> to comment
            </p>
          )}
        </motion.form>
      </motion.div>
    </div>
  );
};

export default CommentModal;