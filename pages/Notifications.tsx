
import React from 'react';
import { Layout } from '../components/Layout';

export const Notifications: React.FC = () => {
  return (
    <Layout>
      <div className="text-center">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-gray-500 mt-2">Your notifications will appear here.</p>
      </div>
    </Layout>
  );
};
