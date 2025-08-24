
import React from 'react';
import { Header } from './Header';
import { BottomNavBar } from './BottomNavBar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="max-w-md mx-auto min-h-screen">
      <Header />
      <main className="p-4 pb-32">
        {children}
      </main>
      <BottomNavBar />
    </div>
  );
};
