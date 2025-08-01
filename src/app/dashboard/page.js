// app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { 
  FaPlay, FaHeart, FaComment, FaBookmark, FaUsers, 
  FaDollarSign, FaChartLine, FaFileAudio, FaUserFriends,
  FaMoneyBillWave, FaChartBar, FaChartPie
} from 'react-icons/fa';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import PayoutHistoryModal from '@/components/PayoutHistoryModal';

const Dashboard = () => {
  const [userSummary, setUserSummary] = useState(null);
  const [earningsData, setEarningsData] = useState([]);
  const [followersData, setFollowersData] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [storyEarnings, setStoryEarnings] = useState([]);
  const [episodeStats, setEpisodeStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const[openModal,setOpenModal]=useState(false);
const router=useRouter()
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch user data
        const { data: userDetails } = await supabase.auth.getSession();
        const userId = userDetails?.session?.user?.id;
        
        if (!userId){
            router.push("/login");
            return;
        } 
        
        // Fetch user summary
        const { data: summary } = await supabase
          .from('dashboard_user_summary_view')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        setUserSummary(summary);
        
        // Fetch monthly earnings
        const { data: earnings } = await supabase
          .from('earnings_monthly_view')
          .select('*')
          .eq('user_id', userId)
          .order('month', { ascending: true });
        
        setEarningsData(earnings);
        
        // Fetch monthly followers
        const { data: followers } = await supabase
          .from('followers_monthly_view')
          .select('*')
          .eq('user_id', userId)
          .order('month', { ascending: true });
        
        setFollowersData(followers);
        
        // Fetch daily stats
        const { data: stats } = await supabase
          .from('episode_stats_daily_view')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(30);
        
        setDailyStats(stats);
        
        // Fetch story earnings
        const { data: storyEarnings } = await supabase
          .from('story_earnings_monthly_view')
          .select('*')
          .eq('user_id', userId)
          .order('month', { ascending: false })
          .limit(6);
        
        setStoryEarnings(storyEarnings);
        
        // Fetch episode stats
        const { data: episodeStats } = await supabase
          .from('episode_listeners_daily_view')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(10);
        
        setEpisodeStats(episodeStats);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [router]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(amount || 0);
  };

  // Calculate RPM (Revenue per mille)
  const calculateRPM = () => {
    if (!userSummary || !dailyStats.length) return 0;
    
    const totalPlays = dailyStats.reduce((sum, stat) => sum + (stat.play_count || 0), 0);
    if (totalPlays === 0) return 0;
    
    return (userSummary.total_earnings / totalPlays) * 1000;
  };

  // Calculate engagement rate
  const calculateEngagementRate = () => {
    if (!userSummary || !dailyStats.length) return 0;
    
    const totalPlays = dailyStats.reduce((sum, stat) => sum + (stat.play_count || 0), 0);
    const totalEngagements = (userSummary.total_likes || 0) + 
                            (userSummary.total_comments || 0) + 
                            (userSummary.total_bookmarks || 0);
    
    if (totalPlays === 0) return 0;
    
    return ((totalEngagements / totalPlays) * 100).toFixed(1);
  };

  // Calculate change percentage
  const calculateChange = (data, key) => {
    if (!data || data.length < 2) return 0;
    
    const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));
    const last = sortedData[sortedData.length - 1][key] || 0;
    const prev = sortedData[sortedData.length - 2][key] || 0;
    
    if (prev === 0) return last > 0 ? 100 : 0;
    
    return ((last - prev) / prev * 100).toFixed(1);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  // Get current month earnings
  const currentMonthEarnings = earningsData.length 
    ? earningsData[earningsData.length - 1]?.total_earning || 0 
    : 0;
  
  // Calculate earnings change
  const earningsChange = calculateChange(earningsData, 'total_earning');
  
  // Calculate followers change
  const followersChange = calculateChange(followersData, 'total_followers');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
      {/* Header */}
      {/* <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Creator Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
            <div>
              <p className="font-medium">{userSummary?.full_name || 'Creator'}</p>
              <p className="text-gray-600 text-sm">@{userSummary?.username || 'username'}</p>
            </div>
          </div>
        </div>
      </header> */}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: <FaChartLine className="mr-2" /> },
              { id: 'analytics', label: 'Analytics', icon: <FaChartBar className="mr-2" /> },
              { id: 'monetization', label: 'Monetization', icon: <FaMoneyBillWave className="mr-2" /> },
              { id: 'content', label: 'Content', icon: <FaFileAudio className="mr-2" /> },
              { id: 'audience', label: 'Audience', icon: <FaUserFriends className="mr-2" /> },
            ].map((tab) => (
              <button

                key={tab.id}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab 
            userSummary={userSummary} 
            earningsData={earningsData}
            followersData={followersData}
            dailyStats={dailyStats}
            storyEarnings={storyEarnings}
            formatCurrency={formatCurrency}
            containerVariants={containerVariants}
            itemVariants={itemVariants}
            earningsChange={earningsChange}
            followersChange={followersChange}
            engagementRate={calculateEngagementRate()}
            currentMonthEarnings={currentMonthEarnings}
          />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsTab 
            userSummary={userSummary}
            dailyStats={dailyStats}
            episodeStats={episodeStats}
            formatCurrency={formatCurrency}
            containerVariants={containerVariants}
            itemVariants={itemVariants}
          />
        )}
        
        {activeTab === 'monetization' && (
          <MonetizationTab 
            userSummary={userSummary}
            earningsData={earningsData}
            storyEarnings={storyEarnings}
            formatCurrency={formatCurrency}
            containerVariants={containerVariants}
            itemVariants={itemVariants}
            rpm={calculateRPM()}
            setOpenModal={setOpenModal}
          />
        )}
        
        {activeTab === 'content' && (
          <ContentTab 
            userSummary={userSummary}
            dailyStats={dailyStats}
            formatCurrency={formatCurrency}
            containerVariants={containerVariants}
            itemVariants={itemVariants}
          />
        )}
        
        {activeTab === 'audience' && (
          <AudienceTab 
            userSummary={userSummary}
            followersData={followersData}
            containerVariants={containerVariants}
            itemVariants={itemVariants}
            followersChange={followersChange}
          />
        )}
      </main>
      <PayoutHistoryModal
     isOpen={openModal}
     onClose={() =>setOpenModal(false)}
     />
    </div>
  );
};

// Tab Components
const OverviewTab = ({ 
  userSummary, 
  earningsData, 
  followersData, 
  dailyStats,
  storyEarnings,
  formatCurrency,
  containerVariants,
  itemVariants,
  earningsChange,
  followersChange,
  engagementRate,
  currentMonthEarnings
}) => (
  <>
    {/* Stats Overview */}
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <StatCard 
        title="Total Earnings" 
        value={formatCurrency(userSummary?.total_earnings)} 
        icon={<FaDollarSign className="text-green-500" />}
        change={earningsChange >= 0 
          ? `+${earningsChange}% from last month` 
          : `${earningsChange}% from last month`}
        changeColor={earningsChange >= 0 ? "text-green-500" : "text-red-500"}
        variants={itemVariants}
      />
      <StatCard 
        title="Listeners" 
        value={userSummary?.total_listeners?.toLocaleString() || '0'} 
        icon={<FaUsers className="text-blue-500" />}
        variants={itemVariants}
      />
      <StatCard 
        title="Followers" 
        value={userSummary?.total_followers?.toLocaleString() || '0'} 
        icon={<FaHeart className="text-red-500" />}
        change={followersChange >= 0 
          ? `+${followersChange}% from last month` 
          : `${followersChange}% from last month`}
        changeColor={followersChange >= 0 ? "text-green-500" : "text-red-500"}
        variants={itemVariants}
      />
      <StatCard 
        title="Engagement Rate" 
        value={`${engagementRate}%`} 
        icon={<FaChartLine className="text-purple-500" />}
        variants={itemVariants}
      />
    </motion.div>

    {/* Charts Section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Earnings Chart */}
      <motion.div 
        className="bg-white rounded-xl shadow-md p-6"
        variants={itemVariants}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Monthly Earnings</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="total_earning" name="Earnings" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Followers Growth */}
      <motion.div 
        className="bg-white rounded-xl shadow-md p-6"
        variants={itemVariants}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Follower Growth</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={followersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total_followers" 
                name="Followers" 
                stroke="#3B82F6" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>

    {/* Engagement Stats */}
    <motion.div 
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
      variants={containerVariants}
    >
      <EngagementCard 
        title="Likes" 
        value={userSummary?.total_likes?.toLocaleString() || '0'} 
        icon={<FaHeart className="text-red-500" />}
        variants={itemVariants}
      />
      <EngagementCard 
        title="Comments" 
        value={userSummary?.total_comments?.toLocaleString() || '0'} 
        icon={<FaComment className="text-blue-500" />}
        variants={itemVariants}
      />
      <EngagementCard 
        title="Bookmarks" 
        value={userSummary?.total_bookmarks?.toLocaleString() || '0'} 
        icon={<FaBookmark className="text-yellow-500" />}
        variants={itemVariants}
      />
    </motion.div>

    {/* Story Performance */}
    {storyEarnings.length > 0 && (
      <motion.div 
        className="bg-white rounded-xl shadow-md p-6 mb-8"
        variants={itemVariants}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Story Performance</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={storyEarnings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="story_title" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="total_earning" name="Earnings" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    )}

    {/* Monetization Section */}
    <motion.div 
      className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white"
      variants={itemVariants}
    >
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold mb-2">Your Content is Monetized!</h2>
          <p className="max-w-lg">
            You&apos;re earning money from day one. Your episodes are generating revenue 
            through ads and premium subscriptions. Keep creating great content!
          </p>
        </div>
        <div className="bg-white/20 p-4 rounded-lg">
          <p className="text-sm mb-1">Current payout rate</p>
          <p className="text-3xl font-bold">$4.25 RPM</p>
          <p className="text-xs opacity-80">Revenue per 1,000 plays</p>
        </div>
      </div>
    </motion.div>

    {/* Daily Stats */}
    {dailyStats.length > 0 && (
      <motion.div 
        className="bg-white rounded-xl shadow-md p-6"
        variants={itemVariants}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Episode Performance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Episode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plays</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyStats.slice(0, 5).map((stat, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.episode_title || 'Untitled Episode'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.play_count || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.like_count || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.comment_count || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency((stat.play_count || 0) * 0.00425)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    )}
  </>
);

const AnalyticsTab = ({ 
  userSummary,
  dailyStats,
  episodeStats,
  formatCurrency,
  containerVariants,
  itemVariants 
}) => (
  <>
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <StatCard 
        title="Total Plays" 
        value={dailyStats.reduce((sum, stat) => sum + (stat.play_count || 0), 0).toLocaleString()} 
        icon={<FaPlay className="text-blue-500" />}
        variants={itemVariants}
      />
      <StatCard 
        title="Avg. Completion" 
        value="72.3%" 
        icon={<FaChartLine className="text-purple-500" />}
        variants={itemVariants}
      />
      <StatCard 
        title="New Listeners" 
        value={userSummary?.total_listeners?.toLocaleString() || '0'} 
        icon={<FaUsers className="text-green-500" />}
        variants={itemVariants}
      />
      <StatCard 
        title="Episode Count" 
        value={userSummary?.total_episodes?.toLocaleString() || '0'} 
        icon={<FaFileAudio className="text-red-500" />}
        variants={itemVariants}
      />
    </motion.div>

    {dailyStats.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div 
          className="bg-white rounded-xl shadow-md p-6"
          variants={itemVariants}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Engagement Metrics (Last 7 Days)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats.slice(0, 7)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="play_count" name="Plays" fill="#3B82F6" />
                <Bar dataKey="like_count" name="Likes" fill="#EF4444" />
                <Bar dataKey="comment_count" name="Comments" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {episodeStats.length > 0 && (
          <motion.div 
            className="bg-white rounded-xl shadow-md p-6"
            variants={itemVariants}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Episode Popularity</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={episodeStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_listeners"
                    nameKey="episode_title"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {episodeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} listeners`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    )}

    {dailyStats.length > 0 && (
      <motion.div 
        className="bg-white rounded-xl shadow-md p-6 mb-8"
        variants={itemVariants}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Detailed Episode Analytics</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Episode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plays</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyStats.slice(0, 8).map((stat, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.episode_title || 'Untitled Episode'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.play_count || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.like_count || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.comment_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    )}
  </>
);

const MonetizationTab = ({ 
  userSummary,
  earningsData,
  storyEarnings,
  formatCurrency,
  containerVariants,
  itemVariants,
  rpm,
  setOpenModal
}) => (
  <>
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <StatCard 
        title="Total Earnings" 
        value={formatCurrency(userSummary?.total_earnings)} 
        icon={<FaDollarSign className="text-green-500" />}
        variants={itemVariants}
      />
      <StatCard 
        title="This Month" 
        value={formatCurrency(earningsData[earningsData.length - 1]?.total_earning)} 
        icon={<FaMoneyBillWave className="text-blue-500" />}
        variants={itemVariants}
      />
      <StatCard 
        title="RPM" 
        value={`$${rpm.toFixed(2)}`} 
        icon={<FaChartLine className="text-purple-500" />}
        variants={itemVariants}
      />
      <StatCard 
        title="Paid Listeners" 
        value={userSummary?.total_listeners?.toLocaleString() || '0'} 
        icon={<FaUsers className="text-red-500" />}
        variants={itemVariants}
      />
    </motion.div>

    {earningsData.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div 
          className="bg-white rounded-xl shadow-md p-6"
          variants={itemVariants}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Earnings Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total_earning" 
                  name="Earnings" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {storyEarnings.length > 0 && (
          <motion.div 
            className="bg-white rounded-xl shadow-md p-6"
            variants={itemVariants}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Story Earnings Breakdown</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={storyEarnings}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_earning"
                    nameKey="story_title"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {storyEarnings.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    )}

    {storyEarnings.length > 0 && (
      <motion.div 
        className="bg-white rounded-xl shadow-md p-6 mb-8"
        variants={itemVariants}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Story Earnings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Story</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {storyEarnings.map((story, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{story.story_title || 'Untitled Story'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{story.month}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency(story.total_earning)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    )}

    <motion.div 
      className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl shadow-lg p-6 text-white"
      variants={itemVariants}
    >
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold mb-2">Payout Status: Ready</h2>
          <p className="max-w-lg">
            Your next payout of {formatCurrency(earningsData[earningsData.length - 1]?.total_earning)} 
            will be processed on the 15th of next month.
          </p>
        </div>
        <button className="bg-white text-green-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition cursor-pointer"
        onClick={()=>setOpenModal(true)}
        >
          View Payout History
        </button>
      </div>

    </motion.div>
 
  </>
);

const ContentTab = ({ 
  userSummary,
  dailyStats,
  formatCurrency,
  containerVariants,
  itemVariants 
}) => (
  <>
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <StatCard 
        title="Total Stories" 
        value={userSummary?.total_stories?.toLocaleString() || '0'} 
        icon={<FaFileAudio className="text-blue-500" />}
        variants={itemVariants}
      />
      <StatCard 
        title="Total Episodes" 
        value={userSummary?.total_episodes?.toLocaleString() || '0'} 
        icon={<FaPlay className="text-purple-500" />}
        variants={itemVariants}
      />
      <StatCard 
        title="Avg. Listens" 
        value={userSummary?.total_listeners && userSummary?.total_episodes
          ? Math.round(userSummary.total_listeners / userSummary.total_episodes).toLocaleString() 
          : '0'} 
        icon={<FaUsers className="text-green-500" />}
        variants={itemVariants}
      />
      <StatCard 
        title="Last Upload" 
        value={new Date(userSummary?.last_episode_uploaded).toLocaleDateString() || 'N/A'} 
        icon={<FaChartLine className="text-red-500" />}
        variants={itemVariants}
      />
    </motion.div>

    {dailyStats.length > 0 && (
      <motion.div 
        className="bg-white rounded-xl shadow-md p-6 mb-8"
        variants={itemVariants}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Episodes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Episode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plays</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyStats.slice(0, 8).map((stat, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.episode_title || 'Untitled Episode'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.play_count || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="text-red-500 mr-2"><FaHeart /></span>
                      {stat.like_count || 0}
                      <span className="text-blue-500 mx-2"><FaComment /></span>
                      {stat.comment_count || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency((stat.play_count || 0) * 0.00425)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    )}

    {dailyStats.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div 
          className="bg-white rounded-xl shadow-md p-6"
          variants={itemVariants}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top Performing Content</h2>
          <div className="space-y-4">
            {[...dailyStats]
              .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
              .slice(0, 4)
              .map((stat, index) => (
                <div key={index} className="flex items-center p-4 border-b border-gray-100 last:border-0">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mr-4" />
                  <div className="flex-1">
                    <h3 className="font-medium">{stat.episode_title || 'Untitled Episode'}</h3>
                    <p className="text-sm text-gray-500">{stat.play_count || 0} plays · {stat.like_count || 0} likes</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {formatCurrency((stat.play_count || 0) * 0.00425)}
                    </p>
                    <p className="text-sm text-gray-500">earned</p>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl shadow-md p-6"
          variants={itemVariants}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Content Performance</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="episode_title" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="play_count" name="Plays" fill="#3B82F6" />
                <Bar dataKey="like_count" name="Likes" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    )}
  </>
);

const AudienceTab = ({ 
  userSummary,
  followersData,
  containerVariants,
  itemVariants,
  followersChange
}) => (
  <>
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <StatCard 
        title="Total Followers" 
        value={userSummary?.total_followers?.toLocaleString() || '0'} 
        icon={<FaUserFriends className="text-blue-500" />}
        variants={itemVariants}
      />
      <StatCard 
        title="New Followers" 
        value={followersData.length ? followersData[followersData.length - 1]?.total_followers?.toLocaleString() || '0' : '0'} 
        icon={<FaUserFriends className="text-green-500" />}
        change={followersChange >= 0 
          ? `+${followersChange}% from last month` 
          : `${followersChange}% from last month`}
        changeColor={followersChange >= 0 ? "text-green-500" : "text-red-500"}
        variants={itemVariants}
      />
      <StatCard 
        title="Active Listeners" 
        value={userSummary?.total_listeners?.toLocaleString() || '0'} 
        icon={<FaUsers className="text-purple-500" />}
        variants={itemVariants}
      />
      <StatCard 
        title="Engagement Rate" 
        value="42.8%" 
        icon={<FaChartLine className="text-red-500" />}
        variants={itemVariants}
      />
    </motion.div>

    {followersData.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div 
          className="bg-white rounded-xl shadow-md p-6"
          variants={itemVariants}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Follower Growth</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={followersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total_followers" 
                  name="Followers" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl shadow-md p-6"
          variants={itemVariants}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Audience Activity</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={followersData.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_followers" name="New Followers" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    )}

    <motion.div 
      className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
      variants={itemVariants}
    >
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold mb-2">Audience Insights</h2>
          <p className="max-w-lg">
            Your audience is primarily located in English-speaking countries and engages most with 
            story-driven content. Consider creating more content in these areas to grow your audience.
          </p>
        </div>
        <button className="bg-white text-indigo-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition">
          View Full Report
        </button>
      </div>
    </motion.div>
  </>
);

// UI Components
const StatCard = ({ title, value, icon, change, changeColor, variants }) => (
  <motion.div 
    className="bg-white rounded-xl shadow-md p-6 flex flex-col"
    variants={variants}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="bg-gray-100 p-3 rounded-lg">
        {icon}
      </div>
    </div>
    {change && (
      <p className={`mt-4 text-sm font-medium ${changeColor || 'text-green-500'}`}>
        {change}
      </p>
    )}
  </motion.div>
);

const EngagementCard = ({ title, value, icon, change, variants }) => (
  <motion.div 
    className="bg-white rounded-xl shadow-md p-6 flex flex-col"
    variants={variants}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
  >
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="bg-gray-100 p-3 rounded-lg">
        {icon}
      </div>
    </div>
    <div className="mt-4">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="h-2.5 rounded-full" 
          style={{ 
            width: `${Math.min(parseInt(value.replace(/,/g, '') / 1000, 100))}%`,
            backgroundColor: title === 'Likes' ? '#EF4444' : 
                            title === 'Comments' ? '#3B82F6' : '#F59E0B'
          }}
        ></div>
      </div>
      {change && <p className="mt-1 text-sm text-gray-500">{change}</p>}
    </div>
  </motion.div>
);

export default Dashboard;