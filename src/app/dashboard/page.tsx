"use client";

import {motion} from "framer-motion";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p>Welcome back! Here is what's happening in your greenhouse today.</p>
      </div>
      <motion.div>
        <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-200 h-32 flex flex-col items-center justify-center hover:border-green-400 hover:bg-green-50/50 transition-colors cursor-pointer">
          <span className="text-gray-400 font-medium ">Card 1 (suhu)</span>
        </div>
      </motion.div>
    </div>
  );
}
