import React, { useState, useEffect } from 'react';
import { Copy, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { differenceInSeconds } from 'date-fns';

interface Plan {
  name: string;
  price: number;
}

interface Transaction {
  id: string;
  currency: string;
  amount: string;
  tax: string;
  reference: string | null;
  description: string;
  e2e_id: string | null;
  status: string | null;
  type: string;
  name: string;
  document: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  finished_at: string | null;
  qr_code: string;
}

const plans: Plan[] = [
  { name: 'Plano Simples', price: 120.00 },
  { name: 'Plano Básico', price: 200.00 },
  { name: 'Plano Premium', price: 300.00 }
];

function App() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiryTime, setExpiryTime] = useState<number | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TOKEN = '108|MqJWTU0DWwIuviMGnIUKyPBvyWyfhggAEngx5hqT6611b86d';

  const createTransaction = async (plan: Plan) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: "Nome da pessoa",
        description: `Pagamento ${plan.name}`,
        document: "16034604621",
        amount: String(plan.price.toFixed(2))
      };

      console.log('Sending payload:', payload);

      const response = await axios.post<Transaction>('https://virtualpay.online/api/v1/transactions/deposit', payload, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        }
      });

      console.log('Response:', response.data);

      setTransaction(response.data);
      setExpiryTime(300); // 5 minutes in seconds
      startPolling(response.data.id);
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      if (error.response) {
        console.error('Error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
        setError('Erro ao criar transação. Por favor, tente novamente em alguns instantes.');
      }
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (transactionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get<Transaction>(`https://virtualpay.online/api/v1/transactions/${transactionId}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`
          }
        });

        if (response.data.status === 'paid') {
          setIsPaid(true);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling transaction:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (expiryTime !== null && expiryTime > 0) {
      timer = setInterval(() => {
        setExpiryTime(prev => prev !== null ? prev - 1 : null);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [expiryTime]);

  const copyToClipboard = async () => {
    if (transaction?.qr_code) {
      await navigator.clipboard.writeText(transaction.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const resetTransaction = () => {
    setTransaction(null);
    setSelectedPlan(null);
    setExpiryTime(null);
    setError(null);
  };

  if (isPaid) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="glass-card p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-green-400 mb-4">Pagamento Confirmado!</h2>
          <p className="text-gray-300 mb-6">Obrigado pela sua compra.</p>
          <button 
            onClick={resetTransaction}
            className="btn-secondary"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="glass-card p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
        
        <div className="mx-auto mb-6">
          <img
            src="/assets/logo.png"
            alt="New Max Buscas"
            className="mx-auto w-48 h-48"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-100 mb-8">Escolha um plano</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {!transaction ? (
          <div className="space-y-4">
            {plans.map((plan) => (
              <button
                key={plan.name}
                onClick={() => {
                  setSelectedPlan(plan);
                  createTransaction(plan);
                }}
                disabled={loading}
                className="btn-primary"
              >
                {loading && selectedPlan?.name === plan.name ? (
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                ) : null}
                {plan.name} - R$ {plan.price.toFixed(2)}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {expiryTime !== null && expiryTime > 0 && (
              <div className="text-sm text-gray-400">
                QR Code expira em: <span className="font-bold text-gray-200">{formatTime(expiryTime)}</span>
              </div>
            )}
            
            <div className="bg-white p-4 rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(transaction.qr_code)}`}
                alt="QR Code"
                className="mx-auto w-48 h-48"
              />
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={transaction.qr_code}
                readOnly
                className="w-full p-3 pr-12 border border-gray-700 rounded-lg bg-gray-800 text-gray-200"
              />
              <button
                onClick={copyToClipboard}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                {copied ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                ) : (
                  <Copy className="w-6 h-6" />
                )}
              </button>
            </div>

            <button 
              onClick={resetTransaction}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar para seleção de planos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;