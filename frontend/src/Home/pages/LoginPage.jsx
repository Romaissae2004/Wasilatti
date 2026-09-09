import React from 'react';
import LoginForm from '../../features/auth/components/LoginForm';

const LoginPage = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20 px-6 lg:px-8 relative overflow-hidden bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background Ornaments */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob w-96 h-96 bg-wasilatti-blueLight top-0 right-0" style={{ opacity: 0.15 }}></div>
        <div className="blob w-80 h-80 bg-wasilatti-orange bottom-0 left-0" style={{ animationDelay: '-3s', opacity: 0.15 }}></div>
      </div>
      
      <div className="relative z-10 w-full flex justify-center">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
