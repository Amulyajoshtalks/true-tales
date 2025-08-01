// app/story/[id]/page.js
'use server';

import { formatTime } from '@/utils/helpers';
import AudioPlayer from '@/components/AudioPlayer';
import { FadeIn, SlideIn } from '@/components/Animations';
import { supabase } from '@/lib/supabaseClient';

export default async function StoryPage({ params }) {
    if (!params || !params.id) {
        return <div>Invalid route</div>;
      }
    
      const storyId = params.id;

  // Fetch story details
  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single();

  // Fetch episodes for this story
  const { data: episodes } = await supabase
    .from('episodes')
    .select('*')
    .eq('story_id', storyId)
    .order('episode_number', { ascending: true });

  if (!story) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">Story not found</div>;

  // Calculate total duration
  const totalDuration = episodes?.reduce((acc, ep) => acc + (ep.duration || 0), 0) || 0;
  const totalMinutes = Math.floor(totalDuration / 60);
  const totalSeconds = totalDuration % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 pb-12 pt-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Story Header */}
        <FadeIn>
          <div className="flex flex-col md:flex-row gap-8 mb-16">
            <div className="relative w-full md:w-2/5 aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-2xl shadow-xl transform rotate-3 transition-all duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-700 rounded-2xl shadow-xl transform -rotate-3 transition-all duration-500"></div>
              
              <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-white border-opacity-30 w-full h-full transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
                {story.cover_url ? (
                  <img 
                    src={story.cover_url} 
                    alt={story.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="bg-gradient-to-br from-purple-400 to-indigo-600 w-full h-full flex items-center justify-center">
                    <span className="text-white text-5xl font-bold">{story.title.charAt(0)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  {story.title}
                </h1>
                <p className="text-lg text-gray-700 mb-6">
                  {story.description || 'No description available'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    {episodes?.length || 0} Episodes
                  </div>
                  <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {totalMinutes > 0 ? `${totalMinutes} min` : ''} {totalSeconds} sec
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Episode List */}
        <SlideIn delay={0.2}>
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-indigo-500 pl-4">
                Episodes
              </h2>
              <div className="text-sm text-gray-500">
                {episodes?.length || 0} episodes
              </div>
            </div>
            
            {episodes?.length > 0 ? (
              <div className="grid gap-6">
                {episodes.map((episode, index) => (
                  <EpisodeCard 
                    key={episode.id} 
                    episode={episode} 
                    index={index} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white">
                <p className="text-gray-500 text-lg">No episodes available yet</p>
              </div>
            )}
          </div>
        </SlideIn>
      </div>
    </div>
  );
}

// Episode Card Component
function EpisodeCard({ episode, index }) {
  return (
    <FadeIn delay={0.1 * (index + 1)}>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full">
                Episode {episode.episode_number}
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-2">
                {episode.title}
              </h3>
            </div>
            {episode.duration && (
              <span className="text-gray-500 text-sm font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(episode.duration)}
              </span>
            )}
          </div>
          
          <AudioPlayer 
            url={episode.audio_url} 
            className="mt-4"
          />
        </div>
      </div>
    </FadeIn>
  );
}