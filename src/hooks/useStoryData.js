// hooks/useStoryData.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useStoryData = (filters = {}, options = {}) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('story_latest_episode_view')
        .select('*')
        .order('story_created_at', { ascending: false });

      // Apply filters
      if (filters.category) {
        query = query.eq('category_name', filters.category);
      }
      if (filters.search) {
        query = query.or(`story_title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.storyId) {
        query = query.eq('story_id', filters.storyId);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      
      // Apply options
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError(err.message || 'Failed to load stories');
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters, options]);

  const refreshStories = useCallback(async () => {
    const data = await fetchStories();
    setStories(data);
  }, [fetchStories]);

  useEffect(() => {
    refreshStories();
  }, [refreshStories]);

  return {
    stories,
    loading,
    error,
    refresh: refreshStories,
    fetchStories
  };
};

// Helper to transform view data to component structure
export const transformStoryData = (viewData, user) => {
  if (!viewData) return null;
  
  return {
    id: viewData.story_id,
    title: viewData.story_title,
    description: viewData.description,
    created_at: viewData.story_created_at,
    cover_url: viewData.cover_url,
    category: viewData.category_name,
    profiles: {
      username: viewData.username,
      avatar_url: viewData.avatar_url,
      full_name: viewData.full_name
    },
    episodes: viewData.episode_id ? [{
      id: viewData.episode_id,
      title: viewData.episode_title,
      audio_url: viewData.audio_url,
      duration: viewData.duration,
      created_at: viewData.episode_created_at
    }] : [],
    latestEpisodeStats: {
      play_count: viewData.play_count || 0,
      like_count: viewData.like_count || 0,
      comment_count: viewData.comment_count || 0,
      share_count: viewData.share_count || 0
    },
    userFlags: user && viewData.episode_id ? {
      is_bookmarked: viewData.is_bookmarked || false,
      is_liked: viewData.is_liked || false
    } : null
  };
};

// Fetch user-specific flags
export const fetchUserEpisodeFlags = async (episodeId, userId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_episode_flags', { 
        ep_id: episodeId,
        u_id: userId
      });
    
    if (error) throw error;
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching user episode flags:', error);
    return null;
  }
};