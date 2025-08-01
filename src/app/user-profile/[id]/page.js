// app/user-profile/[id]/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import Head from 'next/head';
import { supabase } from '@/lib/supabaseClient';

// Animation constants
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.4, ease: "easeOut" }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [stories, setStories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [storiesPerPage] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch profile data
        const { data: profileData } = await supabase
          .from('profile_with_follow_stats')
          .select('*')
          .eq('id', id)
          .single();
        
        setProfile(profileData);
        
        // Fetch initial stories (first page)
        const { data: storiesData } = await supabase
          .from('story_latest_episode_view')
          .select('*')
          .eq('user_id', id)
          .range(0, storiesPerPage - 1);
        
        setStories(storiesData || []);
        
        // Get current session
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        
        // Check if current user follows this profile
        if (user && user.id !== id) {
            console.log("sffgfs",user && user.id !== id)
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('followed_id', id)
            .single();
          
          setIsFollowing(!!followData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Refetch follow status when the page is revisited
  useEffect(() => {
    const refetchFollowStatus = async () => {
      if (currentUser && currentUser.id !== id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('followed_id', id)
          .single();
        
        setIsFollowing(!!followData);
      }
    };
    
    // Refetch when the component becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetchFollowStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    try {
      setIsFollowLoading(true);
      
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('followed_id', id);
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            followed_id: id
          });
      }
      
      setIsFollowing(!isFollowing);
      
      // Update follower count
      setProfile(prev => ({
        ...prev,
        total_followers: isFollowing 
          ? prev.total_followers - 1 
          : prev.total_followers + 1
      }));
    } catch (error) {
      console.error("Error updating follow status:", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const loadMoreStories = async () => {
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      
      const { data: newStories } = await supabase
        .from('story_latest_episode_view')
        .select('*')
        .eq('user_id', id)
        .range(
          (nextPage - 1) * storiesPerPage,
          (nextPage * storiesPerPage) - 1
        );
      
      if (newStories && newStories.length > 0) {
        setStories(prev => [...prev, ...newStories]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error("Error loading more stories:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">The user profile you&apos;re looking for doesn&apos;t exist.</p>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === id;
  const hasMoreStories = stories.length >= (currentPage * storiesPerPage);

  // SEO: Generate profile metadata
  const profileTitle = `${profile.full_name || profile.username} | StoryTeller`;
  const profileDescription = profile.bio || `Explore stories by ${profile.username} on StoryTeller`;
  const profileImage = profile.avatar_url || '/default-avatar.png';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-20">
      {/* SEO Metadata */}
      <Head>
        <title>{profileTitle}</title>
        <meta name="description" content={profileDescription} />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:title" content={profileTitle} />
        <meta property="og:description" content={profileDescription} />
        <meta property="og:image" content={profileImage} />
        <meta property="og:type" content="profile" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={profileTitle} />
        <meta name="twitter:description" content={profileDescription} />
        <meta name="twitter:image" content={profileImage} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": profile.full_name || profile.username,
            "url": typeof window !== 'undefined' ? window.location.href : '',
            "image": profileImage,
            "description": profile.bio,
            "sameAs": []
          })}
        </script>
      </Head>

      {/* Profile Header */}
      <motion.div 
        className="pt-16 pb-8 px-4 md:px-8 bg-white shadow-sm"
        {...fadeIn}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <motion.div 
              className="relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <div className="bg-gradient-to-br from-blue-400 to-purple-500 p-1 rounded-full shadow-md">
                <div className="bg-white p-1 rounded-full">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.username} 
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white"
                      loading="lazy"
                    />
                  ) : (
                    <div className="bg-gray-100 border-4 border-white w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-blue-600 capitalize">{profile.username.charAt(0)|| "A"}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Edit profile button for current user */}
              {isOwnProfile && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEditModal(true)}
                  className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 rounded-full font-medium text-white text-sm shadow-lg flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </motion.button>
              )}
              
              {/* Follow button for other users */}
              {!isOwnProfile && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-full font-medium text-sm shadow-lg ${
                    isFollowing 
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white'
                  } transition-all`}
                >
                  {isFollowLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isFollowing ? 'Unfollowing...' : 'Following...'}
                    </span>
                  ) : isFollowing ? (
                    'Following'
                  ) : (
                    'Follow'
                  )}
                </motion.button>
              )}
            </motion.div>
            
            {/* Profile Info */}
            <motion.div 
              className="flex-1 text-center md:text-left"
              {...slideUp}
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 capitalize">{profile.full_name || profile.username}</h1>
              <p className="text-gray-600 mb-4">@{profile.username}</p>
              
              <p className="max-w-2xl text-gray-700 mb-6">
                {profile.bio || "This user hasn't written a bio yet."}
              </p>
              
              <div className="flex justify-center md:justify-start space-x-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stories.length}</p>
                  <p className="text-gray-600 text-sm">Stories</p>
                </div>
                
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowFollowersModal(true)}
                >
                  <p className="text-2xl font-bold text-gray-900">{profile.total_followers}</p>
                  <p className="text-gray-600 text-sm">Followers</p>
                </div>
                
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowFollowingModal(true)}
                >
                  <p className="text-2xl font-bold text-gray-900">{profile.total_following}</p>
                  <p className="text-gray-600 text-sm">Following</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
      
      {/* Stories Section */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12">
        <motion.div 
          className="flex items-center justify-between mb-8"
          {...fadeIn}
        >
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Stories
          </h2>
          {stories.length > 0 && (
            <p className="text-gray-600">{stories.length} story{stories.length !== 1 ? 's' : ''}</p>
          )}
        </motion.div>
        
        {stories.length === 0 ? (
          <motion.div 
            className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Stories Yet</h3>
              <p className="text-gray-600 mb-6">
                {isOwnProfile 
                  ? "You haven't created any stories yet. Start your storytelling journey now!" 
                  : `${profile.username} hasn't published any stories yet.`}
              </p>
              {isOwnProfile && (
                <button 
                  onClick={() => router.push('/create-story')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 rounded-lg font-medium text-white transition-all"
                >
                  Create Your First Story
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {stories.slice(0, currentPage * storiesPerPage).map((story) => (
                <motion.div
                  key={story.story_id}
                  variants={slideUp}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-purple-300 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <div className="relative">
                    {story.cover_url ? (
                      <img 
                        src={story.cover_url} 
                        alt={story.story_title} 
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 w-full h-48 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex items-end p-4">
                      <h3 className="text-xl font-bold text-white">{story.story_title}</h3>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {story.description || "No description available."}
                    </p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <span>{story.episode_count} episodes</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{Math.floor(story.duration / 60)} min</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{story.like_count}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{story.comment_count}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>{story.share_count}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => router.push(`/story/${story.story_id}`)}
                    className="w-full py-3 bg-gray-50 group-hover:bg-gradient-to-r group-hover:from-blue-50 group-hover:to-purple-50 text-center transition-all duration-300 text-gray-800 font-medium group-hover:text-purple-600"
                  >
                    View Story
                  </button>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Load More Button */}
            {hasMoreStories && (
              <div className="flex justify-center mt-10">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={loadMoreStories}
                  disabled={isLoadingMore}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 rounded-lg text-white font-medium flex items-center gap-2 transition-all"
                >
                  {isLoadingMore ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <span>Load More Stories</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Modals */}
      <AnimatePresence>
        {/* Edit Profile Modal */}
        {showEditModal && (
          <EditProfileModal 
            profile={profile} 
            onClose={() => setShowEditModal(false)} 
            onSave={(updatedProfile) => {
              setProfile(updatedProfile);
              setShowEditModal(false);
            }}
            supabase={supabase}
          />
        )}
        
        {/* Followers Modal */}
        {showFollowersModal && (
          <UserListModal 
            title="Followers"
            users={profile.follower_profiles || []}
            onClose={() => setShowFollowersModal(false)}
            currentUser={currentUser}
          />
        )}
        
        {/* Following Modal */}
        {showFollowingModal && (
          <UserListModal 
            title="Following"
            users={profile.following_profiles || []}
            onClose={() => setShowFollowingModal(false)}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Edit Profile Modal Component
const EditProfileModal = ({ profile, onClose, onSave, supabase }) => {
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    username: profile.username || '',
    bio: profile.bio || '',
    avatar_url: profile.avatar_url || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Generate unique filename
      const fileName = `${Date.now()}-${file.name}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
          onProgress: (progress) => {
            setUploadProgress(progress.loaded / progress.total * 100);
          }
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      // Update form with new URL
      setFormData(prev => ({ ...prev, avatar_url: publicUrl.publicUrl }));
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Update profile in database
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          bio: formData.bio,
          avatar_url: formData.avatar_url
        })
        .eq('id', profile.id)
        .select();
      
      if (error) throw error;
      
      // Return updated profile
      onSave({
        ...profile,
        ...data[0]
      });
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200"
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 flex flex-col items-center">
            <label className="block text-gray-700 mb-4 text-center">Profile Picture</label>
            
            <div className="relative group mb-4">
              <div className="bg-gradient-to-br from-blue-400 to-purple-500 p-1 rounded-full">
                <div className="bg-white p-1 rounded-full">
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt="Avatar" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-white"
                    />
                  ) : (
                    <div className="bg-gray-100 border-4 border-white w-24 h-24 rounded-full flex items-center justify-center">
                      <span className="text-3xl font-bold text-blue-600">{profile.username.charAt(0)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div 
                className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={triggerFileInput}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <button 
              type="button"
              onClick={triggerFileInput}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Change Photo
            </button>
            
            {isUploading && (
              <div className="w-full max-w-xs mt-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Uploading... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            ></textarea>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploading}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// User List Modal Component (Followers/Following)
const UserListModal = ({ title, users, onClose, currentUser }) => {
  const router = useRouter();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 text-center">
                {title === 'Followers' 
                  ? "No followers yet" 
                  : "Not following anyone yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => {
                      router.push(`/user-profile/${user.id}`);
                      onClose();
                    }}
                  >
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.username} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="bg-gradient-to-r from-blue-100 to-purple-100 w-12 h-12 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-600">{user.username.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 
                      className="font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate"
                      onClick={() => {
                        router.push(`/user-profile/${user.id}`);
                        onClose();
                      }}
                    >
                      {user.full_name || user.username}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                  </div>
                  
                  {currentUser && currentUser.id !== user.id && (
                    <button
                      onClick={() => {
                        router.push(`/user-profile/${user.id}`);
                        onClose();
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      View
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};