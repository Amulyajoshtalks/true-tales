"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  FaHeart, FaPlay, FaHeadphones, FaPause, FaPlus, 
  FaBookmark, FaComment, FaShare, FaMicrophone
} from "react-icons/fa";
import { useRouter } from 'next/navigation';
import { 
  supabase, 
  getPublicUrl, 
  formatTimeAgo,
  formatDuration,
} from '@/lib/supabaseClient';
import StoryCard from "./StoryCard";

// Audio Wave Component


// Loading spinner component
const LoadingSpinner = ({ size = 'sm' }) => (
  <div className={`animate-spin rounded-full ${
    size === 'sm' ? 'h-4 w-4' : 'h-8 w-8'
  } border-t-2 border-b-2 border-purple-500 mx-auto`}></div>
);

// Category icon mapping
const getCategoryIcon = (categoryName) => {
  const iconMap = {
    'Love Stories': <FaHeart className="text-red-500" />,
    'Life Journey': <FaHeadphones className="text-blue-500" />,
    'Motivation': <span className="text-yellow-500">💡</span>,
    'Success Stories': <span className="text-green-500">🏆</span>,
    'Adventure': <span className="text-purple-500">🔮</span>
  };
  return iconMap[categoryName] || <span className="text-gray-500">📁</span>;
};


// ================ Main Component ================
export default function HomeClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("For You");
  const [categories, setCategories] = useState([]);
  const [GeneralStories,setGeneralStories]=useState([]);
  const [trendingStories, setTrendingStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [allStories, setAllStories] = useState([]);
  const [hasMoreStories, setHasMoreStories] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(false);

  // Memoize filters
  const filters = useMemo(() => ({
    category: activeTab === "For You" ? null : activeTab
  }), [activeTab]);
  
  
  
  const fetchStories = useCallback(async () => {
    setStoriesLoading(true);
  
    try {
      let query = supabase
        .from('story_latest_episode_view')
        .select('*')
        .order('episode_created_at', { ascending: false });
  
      const searchValue = filters?.category?.trim();
  
      if (searchValue) {
        // If needed, encode special characters
        const wildcardSearch = `%${searchValue}%`;
        console.log(wildcardSearch,"escaped")
        const orFilter = [
          `username.ilike.${wildcardSearch}`,
          `full_name.ilike.${wildcardSearch}`,
          `story_title.ilike.${wildcardSearch}`,
          `category_name.ilike.${wildcardSearch}`,
          `episode_title.ilike.${wildcardSearch}`
        ].join(',');
  
        console.log("Applying .or() filter:", orFilter); // ✅ debug check
  
        query = query.or(orFilter);
      } else {
        console.log("No filter applied — showing all");
      }
  
      query = query.range(currentPage * 10, (currentPage + 1) * 10 - 1);
  
      const { data, error } = await query;
  
      if (error) throw error;
  
      return data;
  
    } catch (error) {
      console.error('❌ Error fetching stories:', error);
      setError(error.message || 'Failed to load stories');
      return [];
    } finally {
      setStoriesLoading(false);
    }
  }, [currentPage, filters,activeTab]);
  
  

  const prevCategoryRef = useRef(null);

  // Load more stories handler
  const loadStories = useCallback(async () => {
    const currentCategory = filters?.category;
  
    // Only skip if same tab/category and already loaded
    if (currentPage === 0 && GeneralStories.length > 0 && prevCategoryRef.current === currentCategory) {
      return;
    }
  
    const data = await fetchStories();
  
    if (currentPage === 0) {
      setGeneralStories(data);
    } else {
      setGeneralStories((prev) => [...prev, ...data]);
    }
  
    setHasMoreStories(data.length >= 10);
    prevCategoryRef.current = currentCategory; // ✅ Update ref after fetch
  }, [fetchStories, currentPage, filters, GeneralStories.length]);

  // Load stories when page or tab changes
  useEffect(() => {
    loadStories();
  }, [currentPage, activeTab]);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage(0);
    setAllStories([]);
    setHasMoreStories(true);
  }, [activeTab]);

  // Update a single story
  const updateStory = useCallback((updatedStory) => {
    setAllStories(prev => 
      prev.map(story => 
        story.id === updatedStory.id ? updatedStory : story
      )
    );
  }, []);

  // Check authentication status
  useEffect(() => {
    const fetchAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    fetchAuthStatus();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Fetch categories and trending stories
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');
      
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData);

      // Fetch trending stories
      const { data: trendingData, error: trendingError } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          user_id,
          profiles:user_id (username, avatar_url),
          episodes:episodes (id)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (trendingError) throw trendingError;
      setTrendingStories(trendingData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data (runs once)
  useEffect(() => {
    fetchData();
  }, []);

  const tabs = useMemo(() => ["For You", ...categories.map(c => c.category)], [categories]);

  // Loading and error states
  const overallLoading = loading || (storiesLoading && currentPage === 0);
  const noData = !overallLoading && GeneralStories.length === 0 && !error;

  if (overallLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Loading Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              fetchData();
              setCurrentPage(0);
              setAllStories([]);
              setHasMoreStories(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 px-4 py-8 md:px-8 lg:px-12 w-full max-w-7xl mx-auto">
      {/* Left Sidebar */}
      <div className="w-full md:w-1/4 space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-4 transition-all hover:shadow-xl">
          <h2 className="text-lg font-bold mb-4 text-gray-800">Categories</h2>
          <ul className="space-y-3 text-sm">
            {categories.map((category) => (
              <li 
                key={category.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === category.category ? 'bg-purple-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab(category.category)}
              >
                {getCategoryIcon(category.category)}
                <span className="font-medium">
                  {category.category}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 transition-all hover:shadow-xl">
          <h2 className="text-lg font-bold mb-4 text-gray-800">Trending This Week</h2>
          {trendingStories.length > 0 ? (
            trendingStories.map((story) => (
              <div 
                key={story.id} 
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push(`/story/${story.id}`)}
              >
                {story.profiles?.avatar_url ? (
                  <img 
                    src={ story.profiles.avatar_url}
                    alt={story.profiles.username} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white font-bold capitalize">
                    {story.profiles?.username?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <p className="font-semibold line-clamp-1">{story.title}</p>
                  <p className="text-xs text-gray-500">
                    {story.episodes?.length || 0} episodes
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>No trending stories yet</p>
              <p className="text-sm mt-2">Be the first to share your story!</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex-1 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 rounded-sm p-2 bg-white shadow w-full overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Stories List */}
        <div className="space-y-6">
          {noData ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaMicrophone className="text-4xl text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Stories Yet</h3>
                <p className="text-gray-600 mb-6">
                  Be the first to share your audio story! Create and publish your unique narrative to inspire others.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => router.push('/create')}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-full font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <FaPlus /> Create Your Story
                  </button>
                  <button 
                    onClick={() => router.push('/how-it-works')}
                    className="border border-purple-600 text-purple-600 px-6 py-3 rounded-full font-medium hover:bg-purple-50 transition-colors"
                  >
                    Learn How It Works
                  </button>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h4 className="font-bold text-gray-800 mb-3">Why share your story?</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600">✓</span>
                      <span>Inspire others with your journey</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600">✓</span>
                      <span>Connect with a supportive community</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600">✓</span>
                      <span>Earn from your creative work</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
              {GeneralStories.map((story, index) => (
                <StoryCard 
                  key={`${story.id}-${index}`}
                  story={story} 
                  user={user}
                  router={router}
                  onUpdateStory={updateStory}
                />
              ))}
              
              {/* Load More button */}
              {hasMoreStories && (
                <div className="flex justify-center py-4">
                  <button 
                    onClick={handleLoadMore}
                    disabled={storiesLoading}
                    className={`bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity flex items-center justify-center ${
                      storiesLoading ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {storiesLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load More Stories'
                    )}
                  </button>
                </div>
              )}
              
              {/* End of content message */}
              {!hasMoreStories && allStories.length > 0 && (
                <div className="text-center py-6 text-gray-500">
                  <p>You've reached the end of stories</p>
                  <p className="text-sm mt-2">Check back later for new stories!</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}