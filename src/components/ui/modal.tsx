"use client";

import {motion, AnimatePresence} from "framer-motion";
import Card from "./card";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{opacity: 0, scale: 0.95, y: 15}}
            animate={{opacity: 1, scale: 1, y: 0}}
            exit={{opacity: 0, scale: 0.95, y: 15}}
            transition={{duration: 0.2, ease: "easeOut"}}
            className="w-full max-w-lg"
          >
            <Card className="p-6 sm:p-8 border-t-4 border-t-green-600 shadow-2xl rounded-xl bg-white relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Header */}
              <div className="flex flex-col mb-5 space-y-1 ">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                  {title}
                </h1>
                {description && (
                  <p className="text-sm text-gray-500">{description}</p>
                )}
              </div>

              <hr className="mb-6 border-gray-100" />
              <div>{children}</div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
