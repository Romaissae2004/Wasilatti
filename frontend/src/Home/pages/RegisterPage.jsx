import React from 'react';
import RegisterForm from '../../features/auth/components/RegisterForm';

const RegisterPage = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20 px-6 lg:px-8 relative overflow-hidden bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background Ornaments */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob w-96 h-96 bg-wasilatti-orange top-0 left-0" style={{ opacity: 0.15 }}></div>
        <div className="blob w-80 h-80 bg-wasilatti-blue bottom-0 right-0" style={{ animationDelay: '-3s', opacity: 0.15 }}></div>
      </div>
      
      <div className="relative z-10 w-full flex justify-center">
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;
