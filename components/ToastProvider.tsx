"use client";

import { Toaster } from 'react-hot-toast';
import { ReactNode } from 'react';

interface ToastProviderProps {
  children: ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#4CAF50',
              color: '#fff',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#F44336',
              color: '#fff',
            },
          },
        }}
      />
      {children}
    </>
  );
} 