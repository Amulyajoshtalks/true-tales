

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
import CommentModal from "./CommentModal";
import { useAudio } from "@/context/AudioContext"; // 👈 Import



const LoadingSpinner = ({ size = 'sm' }) => (
  <div className={`animate-spin rounded-full ${
    size === 'sm' ? 'h-4 w-4' : 'h-8 w-8'
  } border-t-2 border-b-2 border-purple-500 mx-auto`}></div>
);


const AudioWave = ({ isPlaying }) => (
  <div className="flex items-end h-12 gap-[2px] w-full">
    {[...Array(12)].map((_, i) => (
      <div
        key={i}
        className={`w-[2px] bg-purple-500 rounded-sm ${
          isPlaying ? 'animate-audio-wave' : ''
        }`}
        style={{ 
          height: `${Math.floor(Math.random() * 20) + 4}px`,
          animationDelay: `${i * 0.1}s`
        }}
      />
    ))}
  </div>
);

 const StoryCard = ({ story, user, router, onUpdateStory }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);
  const audioRef = useRef(null);
  const startProgressRef = useRef(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const previousEpisodeIdRef = useRef(null);
  const [userFlag,setUserFlag]=useState({})
  const[openModal,setOpenModal]=useState(false);
  const { playNewAudio, currentAudioId } = useAudio(); // 👈 Use context



  console.log("story",story)

useEffect(()=>{
  fetchUserFlag()
},[story]
)


  // Reset audio state when story changes
  useEffect(() => {
    const newEpisodeId = story?.episodes?.[0]?.id;
    
    if (previousEpisodeIdRef.current !== newEpisodeId) {
      setIsPlaying(false);
      setAudioReady(false);
      setPlaybackError(null);
      setAudioLoading(false);

      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }

      previousEpisodeIdRef.current = newEpisodeId;
    }
  }, [story]);

  // Handle like action
  const handleLike = useCallback(async (episodeId) => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    try {
      const isLiked = story?.userFlags?.is_liked;
      if (!story) return;
      
      // Optimistic UI update
      const updatedStory = {
        ...story,
        userFlags: {
          ...story.userFlags,
          is_liked: !isLiked
        },
        latestEpisodeStats: {
          ...story.latestEpisodeStats,
          like_count: isLiked 
            ? story.like_count - 1 
            : story.like_count + 1
        }
      };
      
      // Notify parent of update
      onUpdateStory(updatedStory);
      
      if (isLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('episode_id', episodeId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            episode_id: episodeId,
            user_id: user.id
          });
      }
    } catch (error) {
      console.error('Error handling like:', error);
      // Revert on error
      
      onUpdateStory(story);
    }
  }, [story, user, router, onUpdateStory]);

  // Handle bookmark action
  const handleBookmark = useCallback(async (episodeId) => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    try {
      const isBookmarked = story?.userFlags?.is_bookmarked;
      if (!story) return;
      
      // Optimistic UI update
      const updatedStory = {
        ...story,
        userFlags: {
          ...story.userFlags,
          is_bookmarked: !isBookmarked
        }
      };
      
      // Notify parent of update
      onUpdateStory(updatedStory);
      
      if (isBookmarked) {
        // Remove bookmark
        await supabase
          .from('bookmarks')
          .delete()
          .eq('episode_id', episodeId)
          .eq('user_id', user.id);
      } else {
        // Add bookmark
        await supabase
          .from('bookmarks')
          .insert({
            episode_id: episodeId,
            user_id: user.id
          });
      }
    } catch (error) {
      console.error('Error handling bookmark:', error);
      // Revert on error
      onUpdateStory(story);
    }
  }, [story, user, router, onUpdateStory]);

  // Handle share action
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: story.description,
        url: `${window.location.origin}/story/${story.id}`
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/story/${story.id}`);
      alert('Link copied to clipboard!');
    }
  }, [story]);

  // Handle comment action
  const handleComment = useCallback(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    setOpenModal(true);
  }, [router, user, story]);

  // Update play progress in database
  const updatePlayProgress = useCallback(async (episodeId, durationPlayed, currentTime) => {
    try {
      // Only update if interaction exists
      const { data: existing, error: fetchError } = await supabase
        .from('interactions')
        .select('*')
        .eq('user_id', user?.id || "5e7395eb-77d1-44f0-97ec-61aaced8aa2f")
        .eq('episode_id', episodeId)
        .single();
  
      if (fetchError || !existing) {
        console.warn("No existing interaction, skip update.");
        return;
      }
  
      // Update only
      const { error: updateError } = await supabase
        .from('interactions')
        .update({
          play_count: existing.play_count,
          play_duration: (existing.play_duration || 0) + durationPlayed,
          progress: currentTime
        })
        .eq('id', existing.id);
  
      if (updateError) throw updateError;
  
    } catch (error) {
      console.error('Error updating play progress:', error);
    }
  }, [user]);
  

  // Record play event separately
  const recordPlayEvent = useCallback(async (episodeId) => {
    try {
      // Get existing interaction
      const { data: existing, error: fetchError } = await supabase
        .from('interactions')
        .select('*')
        .eq('user_id', user?.id || "5e7395eb-77d1-44f0-97ec-61aaced8aa2f")
        .eq('episode_id', episodeId)
        .single();

      if (fetchError || !existing) {
        // Create new interaction
        await supabase
          .from('interactions')
          .insert({
            episode_id: episodeId,
            user_id: user?.id || "5e7395eb-77d1-44f0-97ec-61aaced8aa2f",
            play_count: 1,
            play_duration: 0,
            progress: 0
          });
      } else {
        // Update existing interaction
        await supabase
          .from('interactions')
          .update({
            play_count: existing.play_count + 1
          })
          .eq('id', existing.id);
      }
    } catch (error) {
      console.error('Error recording play event:', error);
    }
  }, [user]);

  // Handle play action
  const handlePlay = useCallback(async () => {
    const episodeId = story.episode_id;
    if (!audioRef.current) return;

    try {
      if (audioRef.current.paused) {
        setAudioLoading(true);

        if (!audioReady) {
          await new Promise((resolve) => {
            const checkReady = () => {
              if (audioRef.current.readyState > 0) resolve();
              else setTimeout(checkReady, 100);
            };
            checkReady();
          });
          setAudioReady(true);
        }

        // Pause other audios and set current
        playNewAudio(audioRef.current, episodeId);

        await audioRef.current.play();
        setIsPlaying(true);
        await recordPlayEvent(episodeId);

        const updatedStory = {
          ...story,
          latestEpisodeStats: {
            ...story.latestEpisodeStats,
            play_count: story.play_count + 1
          }
        };
        onUpdateStory(updatedStory);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
        const currentTime = audioRef.current.currentTime;
        const durationPlayed = Math.max(0, currentTime - startProgressRef.current);
        updatePlayProgress(episodeId, durationPlayed, currentTime);
      }
    } catch (err) {
      console.error("Audio error", err);
      setPlaybackError("Cannot play audio");
    } finally {
      setAudioLoading(false);
    }
  }, [story, audioReady, onUpdateStory, playNewAudio]);

  const handleViewAllEpisodes = useCallback(() => {
    if (story) {
      router.push(`/story/${story.story_id}`);
    }
  }, [story, router]);

  // Handle audio ended event
  const handleAudioEnded = useCallback(() => {
    if (!story || !story.episodes) return;
    
    const episodeId = story.episode_id;
    const currentTime = audioRef.current?.currentTime || 0;
    const durationPlayed = Math.max(0, currentTime - startProgressRef.current);
    
    updatePlayProgress(episodeId, durationPlayed, currentTime)
      .catch(console.error);
    
    setIsPlaying(false);
    setAudioLoading(false);
  }, [story, updatePlayProgress]);

  console.log("story?.audio_url",story?.audio_url)

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!story) return null;


const fetchUserFlag=useCallback(async()=>{

  const {data}= await supabase.auth.getUser();
  console.log(data?.user,"ghfh")
  if(!data?.user?.id){
    return;
  }
  try{
    const{data,error}=await supabase.rpc("get_user_episode_flags",{ep_id:story?.episode_id,u_id:user?.id})
    if(error)throw error;
    console.log("fgdghd",data[0])
    setUserFlag(data[0]);
  }catch(err){
    console.log(err)
  }
},[story])


  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-5 transition-all hover:shadow-xl">
      {/* Playback error message */}
      {playbackError && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded-lg shadow-lg z-50">
          {playbackError}
        </div>
      )}

      {/* Hidden audio element */}
      {story?.audio_url && (
        <audio
          ref={audioRef}
          src={story.audio_url}
          onEnded={handleAudioEnded}
          onError={(e) => {
            console.error("Audio loading error", e);
            setPlaybackError("Unsupported audio format or invalid file");
            setAudioLoading(false);
          }}
          onCanPlayThrough={() => setAudioReady(true)}
          onLoadedMetadata={() => setAudioReady(true)}
          preload="metadata"
          onPause={() => setIsPlaying(false)}
          onPlay={() => {
            setIsPlaying(true);
            setAudioLoading(false);
          }}
        />
      )}

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 cursor-pointer"
        onClick={() => router.push(`/user-profile/${story.user_id}`)}
        >
          {story.avatar_url ? (
            <img 
              src={story.avatar_url} 
              alt={story.full_name} 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold capitalize">
              {story.username?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900">
              {story.full_name || 'Anonymous'}
            </p>
            <p className="text-xs text-gray-500">
              {formatTimeAgo(story.episode_created_at)} • {story.category_name}
            </p>
          </div>
        </div>
        <button 
          onClick={() => 
            handleBookmark(story?.episode_id)}
          className={`p-2 rounded-full ${
            userFlag.is_bookmarked 
              ? 'text-yellow-500 bg-yellow-50' 
              : 'text-gray-400 hover:bg-gray-100'
          }`}
        >
          <FaBookmark className="text-lg" />
        </button>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{story.story_title}</h3>
        <p className="text-gray-600">{story.description}</p>
      </div>

      {story?.episode_id && (
        <div className="bg-gray-50 rounded-xl p-4 border space极-y-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Latest Episode</h4>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePlay}
              disabled={audioLoading || playbackError}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all ${
                audioLoading || playbackError 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600'
              }`}
            >
              {audioLoading ? (
                <LoadingSpinner />
              ) : isPlaying ? (
                <FaPause />
              ) : (
                <FaPlay className="ml-1" />
              )}
            </button>
            <p className="font-semibold text-gray-800">
              {story.episode_title}
            </p>
            <p className="text-xs text-gray-400 ml-auto">
              {formatDuration(story.duration)} • 
              {story.play_count || 0} plays
            </p>
          </div>
          <AudioWave isPlaying={isPlaying} />
        </div>
      )}

      {/* {story.episodes && story.episodes.length > 0 && ( */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-bold text-gray-800">
              All Episodes ({story.episode_count})
            </p>
            <button 
              onClick={handleViewAllEpisodes}
              className="text-sm text-purple-600 font-medium hover:underline"
            >
              Listen All Episodes
            </button>
          </div>
          
            <div 
              className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg px-4 py-3 text-purple-700 text-sm font-medium flex justify-between items-center mb-2"
            >
              <span>{story.episode_title || "Episode:1 Intro"}</span>
              <span className="text-gray-500">
                {formatDuration(story.duration || 12)}
              </span>
            </div>
   
        </div>
      {/* )} */}

      <div className="flex gap-4 pt-2 text-sm text-gray-500">
        <button 
          onClick={() => 
            handleLike(story.episode_id)}
          className={`flex items-center gap-1 transition-colors ${
            userFlag?.is_liked ? 'text-red-500' : 'hover:text-red-500'
          }`}
        >
          <FaHeart /> <span>{story.like_count || 0}</span>
        </button>
        <button 
          onClick={() => handleComment(story.episode_id)}
          className={`flex items-center gap-1 transition-colors hover:text-blue-500`}
        >
          <FaComment /> <span>{story.comment_count || 0}</span>
        </button>
        <button 
          onClick={() => handleShare(story)}
          className="flex items-center gap-1 hover:text-green-500 transition-colors"
        >
          <FaShare /> <span>{story.share_count || 0}</span>
        </button>
      </div>
      {openModal && <CommentModal episodeId={story.episode_id} onClose={()=>setOpenModal(false)}/>}
    </div>
  );
};


export default StoryCard