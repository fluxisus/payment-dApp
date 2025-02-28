
import { Header } from "@/components/Header";
import PayModal from "@/components/PayModal";
import ChargeModal from "@/components/ChargeModal";
import { useState } from "react";

const Index = () => {
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);

  // Placeholder data - in a real app this would come from your wallet connection
  const balances = [
    { token: "USDT", amount: "1,234.56", icon: "https://assets.belo.app/images/usdt.png" },
    { token: "USDC", amount: "5,678.90", icon: "https://assets.belo.app/images/usdc.png" },
  ];

  const transactions = [
    { id: 1, type: "Received", amount: "+500 USDT", from: "0x1234...5678", timestamp: "2 mins ago" },
    { id: 2, type: "Sent", amount: "-200 USDC", to: "0x8765...4321", timestamp: "5 mins ago" },
    { id: 3, type: "Received", amount: "+1000 USDT", from: "0x9876...5432", timestamp: "10 mins ago" },
    { id: 4, type: "Sent", amount: "-450 USDC", to: "0x5432...1098", timestamp: "15 mins ago" },
    { id: 5, type: "Received", amount: "+300 USDT", from: "0x2468...1357", timestamp: "20 mins ago" },
    { id: 6, type: "Sent", amount: "-750 USDC", to: "0x1357...2468", timestamp: "25 mins ago" },
    { id: 7, type: "Received", amount: "+200 USDT", from: "0x3691...2587", timestamp: "30 mins ago" },
    { id: 8, type: "Sent", amount: "-100 USDC", to: "0x2587...3691", timestamp: "35 mins ago" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-crypto-dark">
      <Header />
      
      <main className="flex-1 flex flex-col gap-8 p-6 mt-24">
        {/* Action Buttons */}
        <div className="flex gap-8 justify-center animate-fade-in">
          <button
            onClick={() => setIsChargeModalOpen(true)}
            className="w-32 h-32 rounded-full bg-purple-600 hover:bg-purple-700
                     flex items-center justify-center text-lg font-medium
                     transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Charge
          </button>
          <button
            onClick={() => setIsPayModalOpen(true)}
            className="w-32 h-32 rounded-full bg-emerald-600 hover:bg-emerald-700
                     flex items-center justify-center text-lg font-medium
                     transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Pay
          </button>
        </div>

        {/* Balances Section */}
        <div className="glass-card p-6 max-w-2xl mx-auto w-full">
          <h2 className="text-xl font-semibold mb-4">Balances</h2>
          <div className="flex flex-col gap-4">
            {balances.map((balance) => (
              <div key={balance.token} className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-white/10 p-1 flex items-center justify-center mr-3">
                    <img 
                      src={balance.icon} 
                      alt={balance.token} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-2xl font-semibold">${balance.amount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="glass-card p-6 max-w-2xl mx-auto w-full">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{tx.type}</span>
                  <span className="text-sm text-crypto-text-secondary">
                    {tx.from ? `From: ${tx.from}` : `To: ${tx.to}`}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`font-medium ${tx.type === "Received" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.amount}
                  </span>
                  <span className="text-sm text-crypto-text-secondary">{tx.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <PayModal open={isPayModalOpen} onOpenChange={setIsPayModalOpen} />
      <ChargeModal open={isChargeModalOpen} onOpenChange={setIsChargeModalOpen} />
    </div>
  );
};

export default Index;
