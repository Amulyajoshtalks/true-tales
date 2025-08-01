import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { FiX, FiClock, FiCheck, FiAlertCircle, FiDollarSign, FiCreditCard } from 'react-icons/fi';


const PayoutHistoryModal = ({ isOpen, onClose }) => {
  const [payouts, setPayouts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPayouts = async () => {
    const { data: userDetails } = await supabase.auth.getSession();
    const userId = userDetails?.session?.user?.id;
    if(!userId){
        return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('payout_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPayouts(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load payout history');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen ) {
      fetchPayouts();
    }
  }, [isOpen]);

  const getStatusDetails = (status) => {
    switch(status) {
      case 'completed':
        return { 
          color: 'bg-green-100 text-green-800',
          icon: <FiCheck className="text-green-500" />,
          text: 'Completed'
        };
      case 'pending':
        return { 
          color: 'bg-yellow-100 text-yellow-800',
          icon: <FiClock className="text-yellow-500" />,
          text: 'Pending'
        };
      case 'failed':
        return { 
          color: 'bg-red-100 text-red-800',
          icon: <FiAlertCircle className="text-red-500" />,
          text: 'Failed'
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800',
          icon: null,
          text: status 
        };
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Payout History</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        )}
        
        {/* Error State */}
        {error && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <FiAlertCircle className="text-red-500 text-4xl mb-4" />
            <p className="text-red-500 text-lg mb-2">Error loading payout history</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchPayouts}
              className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && !error && payouts.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <FiDollarSign className="text-gray-400 text-4xl mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No payout history</h3>
            <p className="text-gray-500 max-w-md">
              You haven't made any payout requests yet. Your payout history will appear here once you initiate a request.
            </p>
          </div>
        )}
        
        {/* Data Table */}
        {!isLoading && !error && payouts.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-0">
              <div className="hidden md:grid grid-cols-6 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
                <div>Amount</div>
                <div>Method</div>
                <div>Date</div>
                <div>Status</div>
                <div>Processed</div>
                <div>Reference</div>
              </div>
              
              {payouts.map((payout) => {
                const status = getStatusDetails(payout.status);
                
                return (
                  <div 
                    key={payout.id} 
                    className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-0 px-6 py-4 border-b hover:bg-gray-50 transition-colors"
                  >
                    {/* Amount */}
                    <div className="md:flex items-center">
                      <div className="text-lg font-semibold text-gray-800">
                        {new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: payout.currency,
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }).format(payout.amount)}
                      </div>
                    </div>
                    
                    {/* Payment Method */}
                    <div className="flex items-center">
                      <FiCreditCard className="mr-2 text-gray-500 hidden md:block" />
                      <span className="text-gray-700">{payout.payment_method}</span>
                    </div>
                    
                    {/* Created Date */}
                    <div className="text-gray-600 text-sm">
                      <div className="font-medium md:hidden">Created</div>
                      {formatDate(payout.created_at)}
                    </div>
                    
                    {/* Status */}
                    <div>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium">
                        <span className="mr-1 md:hidden">{status.icon}</span>
                        <span className={`${status.color} px-3 py-1 rounded-full`}>
                          {status.text}
                        </span>
                      </div>
                    </div>
                    
                    {/* Processed Date */}
                    <div className="text-gray-600 text-sm">
                      <div className="font-medium md:hidden">Processed</div>
                      {payout.processed_at ? formatDate(payout.processed_at) : '-'}
                    </div>
                    
                    {/* Reference */}
                    <div className="text-gray-600 text-sm truncate">
                      <div className="font-medium md:hidden">Reference</div>
                      {payout.payout_reference || 'N/A'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayoutHistoryModal;