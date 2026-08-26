
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-t-4 border-[#002D62] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default Spinner;