// app/create/page.js
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { FaPlus, FaMicrophone, FaStop, FaPlay, FaPause, FaTrash, FaUpload, FaSave, FaBook } from "react-icons/fa";

export default function CreateStoryPage() {
  const router = useRouter();
  const [mode, setMode] = useState('new');
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [episodes, setEpisodes] = useState([{ title: "", episode_number: 1 }]);
  const [categories, setCategories] = useState([]);
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [audioFiles, setAudioFiles] = useState(Array(episodes.length).fill(null));
  const [audioUrls, setAudioUrls] = useState(Array(episodes.length).fill(null));
  const [recordingState, setRecordingState] = useState(Array(episodes.length).fill(false));
  const [mediaRecorders, setMediaRecorders] = useState(Array(episodes.length).fill(null));
  const [audioChunks, setAudioChunks] = useState(Array(episodes.length).fill([]));
  const [isPlaying, setIsPlaying] = useState(Array(episodes.length).fill(false));
  const [audioDurations, setAudioDurations] = useState(Array(episodes.length).fill(0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const audioRefs = useRef([]);
  const audioStreams = useRef([]);
  const[session,setSession]=useState(null)
  const[user,setUser]=useState({});


  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || {});
      if(!session){
        router.push("/login")
       }
    };
    getSession();
    
  }, []);


  // Initialize audioRefs
  useEffect(() => {
    audioRefs.current = audioRefs.current.slice(0, episodes.length);
  }, [episodes]);

  // Clean up Blob URLs and media streams
  useEffect(() => {
    return () => {
      // Clean up Blob URLs
      audioUrls.forEach(url => url && URL.revokeObjectURL(url));
      
      // Clean up media streams
      audioStreams.current.forEach(stream => {
        stream?.getTracks().forEach(track => track.stop());
      });
    };
  }, [audioUrls]);

  // Fetch categories and stories
  useEffect(() => {
    const fetchData = async () => {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');
      
      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
      } else {
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setCategoryId(categoriesData[0].id);
        }
      }
      
      // Fetch stories
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('id, title');
      
      if (storiesError) {
        console.error("Error fetching stories:", storiesError);
      } else {
        setStories(storiesData);
      }
    };
    
    fetchData();
  }, []);

  // Update audio state properly
  let updateAudioTimeout;
  const updateAudio = (index, file) => {
    const newAudioFiles = [...audioFiles];
    const newAudioUrls = [...audioUrls];
  
    // Revoke previous URL if exists
    if (newAudioUrls[index]) {
      URL.revokeObjectURL(newAudioUrls[index]);
    }
  
    newAudioFiles[index] = file;
    newAudioUrls[index] = URL.createObjectURL(file);
  
    setAudioFiles(newAudioFiles);
    setAudioUrls(newAudioUrls);
  
    // Calculate duration
    const audio = new Audio(newAudioUrls[index]);
    audio.onloadedmetadata = () => {
      const newDurations = [...audioDurations];
      newDurations[index] = Math.round(audio.duration);
      setAudioDurations(newDurations);
    };
  };
  

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setCoverFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const addEpisode = () => {
    setEpisodes([
      ...episodes, 
      { title: "", episode_number: episodes.length + 1 }
    ]);
    setAudioFiles([...audioFiles, null]);
    setAudioUrls([...audioUrls, null]);
    setRecordingState([...recordingState, false]);
    setMediaRecorders([...mediaRecorders, null]);
    setAudioChunks([...audioChunks, []]);
    setIsPlaying([...isPlaying, false]);
    setAudioDurations([...audioDurations, 0]);
    audioStreams.current = [...audioStreams.current, null]; // NEW
  };

  const removeEpisode = (index) => {
    if (episodes.length <= 1) return;
    
    const newEpisodes = [...episodes];
    newEpisodes.splice(index, 1);
    
    // Reassign episode numbers
    const updatedEpisodes = newEpisodes.map((ep, idx) => ({
      ...ep,
      episode_number: idx + 1
    }));
    
    setEpisodes(updatedEpisodes);
    
    // Remove associated audio state
    const newAudioFiles = [...audioFiles];
    newAudioFiles.splice(index, 1);
    setAudioFiles(newAudioFiles);
    
    const newAudioUrls = [...audioUrls];
    // Revoke URL before removing
    if (newAudioUrls[index]) URL.revokeObjectURL(newAudioUrls[index]);
    newAudioUrls.splice(index, 1);
    setAudioUrls(newAudioUrls);
    
    const newRecordingState = [...recordingState];
    newRecordingState.splice(index, 1);
    setRecordingState(newRecordingState);
    
    const newMediaRecorders = [...mediaRecorders];
    newMediaRecorders.splice(index, 1);
    setMediaRecorders(newMediaRecorders);
    
    const newAudioChunks = [...audioChunks];
    newAudioChunks.splice(index, 1);
    setAudioChunks(newAudioChunks);
    
    const newIsPlaying = [...isPlaying];
    newIsPlaying.splice(index, 1);
    setIsPlaying(newIsPlaying);
    
    const newAudioDurations = [...audioDurations];
    newAudioDurations.splice(index, 1);
    setAudioDurations(newAudioDurations);
    
    // NEW: Clean up media stream
    if (audioStreams.current[index]) {
      audioStreams.current[index].getTracks().forEach(track => track.stop());
    }
    const newStreams = [...audioStreams.current];
    newStreams.splice(index, 1);
    audioStreams.current = newStreams;
  };

  const updateEpisodeTitle = (index, value) => {
    const newEpisodes = [...episodes];
    newEpisodes[index].title = value;
    setEpisodes(newEpisodes);
  };

  // Start recording audio for a specific episode - FIXED
  // ✅ Start Recording - uses local chunks array
const startRecording = async (index) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
      // Stop any previous stream
      if (audioStreams.current[index]) {
        audioStreams.current[index].getTracks().forEach(track => track.stop());
      }
  
      // Store stream for cleanup
      audioStreams.current[index] = stream;
  
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
  
      const chunks = []; // Use local array to avoid stale React state
  
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
  
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
  
        // Revoke previous Blob URL
        if (audioUrls[index]) {
          URL.revokeObjectURL(audioUrls[index]);
        }
  
        updateAudio(index, blob); // updates audioFiles, audioUrls, and duration
      };
  
      // Save recorder in state
      const newMediaRecorders = [...mediaRecorders];
      newMediaRecorders[index] = mediaRecorder;
      setMediaRecorders(newMediaRecorders);
  
      // Set recording state
      const newRecordingState = [...recordingState];
      newRecordingState[index] = true;
      setRecordingState(newRecordingState);
  
      // Reset existing audio (optional but recommended)
      if (audioRefs.current[index]) {
        audioRefs.current[index].pause();
        audioRefs.current[index].currentTime = 0;
        audioRefs.current[index].removeAttribute('src');
        audioRefs.current[index].load();
      }
  
      mediaRecorder.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      setError("Could not access microphone. Please check permissions.");
    }
  };
  
  // ✅ Stop Recording
  const stopRecording = (index) => {
    if (mediaRecorders[index] && recordingState[index]) {
      mediaRecorders[index].stop();
  
      const newRecordingState = [...recordingState];
      newRecordingState[index] = false;
      setRecordingState(newRecordingState);
    }
  };
  

  // Play recorded audio - FIXED
  const playAudio = (index) => {
    const audioEl = audioRefs.current[index];
    if (audioEl && audioUrls[index]) {
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.removeAttribute('src'); // reset
      audioEl.load(); // clear previous source
      audioEl.src = audioUrls[index];
  
      audioEl.play().then(() => {
        const newIsPlaying = [...isPlaying];
        newIsPlaying[index] = true;
        setIsPlaying(newIsPlaying);
      }).catch(err => {
        console.error("Playback failed:", err);
        setError(`Playback error: ${err.message}`);
      });
    }
  };
  

  // Pause recorded audio
  const pauseAudio = (index) => {
    if (audioRefs.current[index]) {
      audioRefs.current[index].pause();
      const newIsPlaying = [...isPlaying];
      newIsPlaying[index] = false;
      setIsPlaying(newIsPlaying);
    }
  };

  const handleAudioUpload = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    updateAudio(index, file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      let storyId;
      
      if (mode === 'new') {
        // Upload cover image
        let coverUrl = null;
        if (coverFile) {
          const coverExt = coverFile.name.split('.').pop();
          const coverFileName = `${Date.now()}.${coverExt}`;
          
          const { error: coverError } = await supabase.storage
            .from('covers')
            .upload(coverFileName, coverFile);
          
          if (coverError) throw coverError;
          
          coverUrl = getPublicUrl('covers', coverFileName);
        }
        
        // Insert new story
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .insert({
            title,
            description,
            cover_url: coverUrl,
            category_id: categoryId,
            user_id:user?.id || ""
          })
          .select()
          .single();
        
        if (storyError) throw storyError;
        storyId = storyData.id;
      } else {
        if (!selectedStory) {
          throw new Error("Please select a story");
        }
        storyId = selectedStory;
      }
      
      // Process each episode
      for (let i = 0; i < episodes.length; i++) {
        if (!audioFiles[i]) {
          throw new Error(`Episode ${i + 1} is missing audio`);
        }
        
        // Upload audio file
        const audioFile = audioFiles[i];
        const audioExt = audioFile.name ? 
          audioFile.name.split('.').pop() : 
          'webm';
        const audioFileName = `${Date.now()}-${i}.${audioExt}`;
        const user = await supabase.auth.getUser();
        console.log("User:", user); 
        const { error: audioError } = await supabase.storage
          .from('episodes')
          .upload(audioFileName, audioFile);
        
        if (audioError) throw audioError;
        
        const audioUrl = getPublicUrl('episodes', audioFileName);
        
        // Insert episode
        await supabase
          .from('episodes')
          .insert({
            story_id: storyId,
            title: episodes[i].title,
            audio_url: audioUrl,
            duration: audioDurations[i],
            episode_number: episodes[i].episode_number
          });
      }
      
      // Success - redirect
      router.push(mode === 'new' ? '/' : `/stories/${storyId}`);
    } catch (error) {
      console.error("Error creating story:", error);
      setError(error.message || "Failed to create story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPublicUrl = (bucket, fileName) => {
    const { data } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  const loadStoryDetails = async (storyId) => {
    if (!storyId) return;
    
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('title, description, category_id, cover_url')
        .eq('id', storyId)
        .single();
      
      if (error) throw error;
      
      setTitle(data.title);
      setDescription(data.description || "");
      setCategoryId(data.category_id);
      
      if (data.cover_url) {
        setCoverPreview(data.cover_url);
      }
    } catch (err) {
      console.error("Error loading story details:", err);
      setError("Failed to load story details");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {mode === 'new' ? 'Create Your Story' : 'Add Episodes to Story'}
          </h1>
          <p className="mt-3 text-xl text-gray-600">
            {mode === 'new' 
              ? 'Share your unique narrative with the world' 
              : 'Expand your existing story with new episodes'}
          </p>
          
          <div className="mt-6 flex justify-center">
            <div className="inline-flex bg-white rounded-lg p-1 shadow">
              <button
                onClick={() => setMode('new')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  mode === 'new' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Create New Story
              </button>
              <button
                onClick={() => setMode('existing')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  mode === 'existing' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Add to Existing Story
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="p-6 md:p-8">
            {mode === 'existing' && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200">
                  Select Story
                </h2>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Choose Story *
                    </label>
                    <select
                      value={selectedStory || ''}
                      onChange={(e) => {
                        setSelectedStory(e.target.value);
                        loadStoryDetails(e.target.value);
                      }}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white"
                    >
                      <option value="" disabled>Select a story</option>
                      {stories.map((story) => (
                        <option key={story.id} value={story.id}>
                          {story.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {mode === 'new' && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200">
                  Story Details
                </h2>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Story Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="What's your story called?"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Tell us about your story..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.category}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Cover Image
                    </label>
                    <div className="flex items-center gap-6">
                      <div className="flex-shrink-0">
                        {coverPreview ? (
                          <img 
                            src={coverPreview} 
                            alt="Cover preview" 
                            className="w-32 h-32 rounded-xl object-cover border-2 border-dashed border-purple-300"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="flex flex-col items-center px-4 py-3 bg-white text-purple-600 rounded-lg border border-purple-300 cursor-pointer hover:bg-purple-50">
                          <FaUpload className="text-xl mb-1" />
                          <span className="font-medium">Choose Image</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleCoverChange}
                            className="hidden"
                          />
                        </label>
                        <p className="mt-2 text-sm text-gray-500">
                          JPG or PNG, max 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-10">
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">
                  Episodes
                </h2>
                <button
                  type="button"
                  onClick={addEpisode}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FaPlus /> Add Episode
                </button>
              </div>
              
              <div className="space-y-8">
                {episodes.map((episode, index) => (
                  <div key={index} className="bg-purple-50 rounded-xl p-6 relative">
                    {episodes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEpisode(index)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Episode {index + 1} Title *
                        </label>
                        <input
                          type="text"
                          value={episode.title}
                          onChange={(e) => updateEpisodeTitle(index, e.target.value)}
                          required
                          placeholder={`Episode ${index + 1} title`}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        />
                        
                        <div className="mt-4">
                          <label className="block text-gray-700 font-medium mb-2">
                            Upload Audio File
                          </label>
                          <label className="flex flex-col items-center px-4 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50">
                            <FaUpload className="text-xl mb-1" />
                            <span className="font-medium">Choose Audio File</span>
                            <input 
                              type="file" 
                              accept="audio/*" 
                              onChange={(e) => handleAudioUpload(index, e)}
                              className="hidden"
                            />
                          </label>
                          <p className="mt-2 text-sm text-gray-500">
                            MP3 or WAV, max 50MB
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Record Audio
                        </label>
                        
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-4 mb-4">
                            {!recordingState[index] ? (
                              <button
                                type="button"
                                onClick={() => startRecording(index)}
                                className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                <FaMicrophone /> Start Recording
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => stopRecording(index)}
                                className="flex items-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                              >
                                <FaStop /> Stop Recording
                              </button>
                            )}
                            
                            {audioFiles[index] && (
                              <div className="flex gap-2">
                                {isPlaying[index] ? (
                                  <button
                                    type="button"
                                    onClick={() => pauseAudio(index)}
                                    className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center"
                                  >
                                    <FaPause />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => playAudio(index)}
                                    className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center"
                                  >
                                    <FaPlay className="ml-1" />
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {/* {audioDurations[index] > 0 && (
                              <span className="text-gray-700 font-medium">
                                {Math.floor(audioDurations[index] / 60)}:
                                {(audioDurations[index] % 60).toString().padStart(2, '0')}
                              </span>
                            )} */}
                            
                            {/* Hidden audio element */}
                            <audio
                              ref={el => audioRefs.current[index] = el}
                              onEnded={() => {
                                const newIsPlaying = [...isPlaying];
                                newIsPlaying[index] = false;
                                setIsPlaying(newIsPlaying);
                              }}
                              className="hidden"
                            />
                          </div>
                          
                          {recordingState[index] && (
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                              <span className="text-red-500 font-medium">Recording...</span>
                            </div>
                          )}
                          
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {audioFiles[index] ? "Audio Ready" : "No audio recorded"}
                              </span>
                              {audioFiles[index] && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Ready
                                </span>
                              )}
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              {audioFiles[index] && (
                                <div 
                                  className="bg-purple-600 h-2 rounded-full" 
                                  style={{ width: audioDurations[index] ? '100%' : '0%' }}
                                ></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center gap-2 px-8 py-4 text-lg font-bold rounded-xl shadow-lg transform transition-all ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {mode === 'new' ? 'Creating Your Story...' : 'Adding Episodes...'}
                  </>
                ) : (
                  <>
                    <FaSave /> {mode === 'new' ? 'Publish Your Story' : 'Add Episodes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
        
        <div className="mt-10 text-center text-gray-600">
          <p className="max-w-2xl mx-auto">
            {mode === 'new'
              ? 'Your story will be published immediately after submission. Make sure all audio episodes are clear and your cover image represents your story well.'
              : 'New episodes will be added to your existing story. Make sure all audio is clear and properly edited.'}
          </p>
        </div>
      </div>
    </div>
  );
}