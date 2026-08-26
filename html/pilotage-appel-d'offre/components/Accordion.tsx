
import React, { useState } from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm mb-2">
      <button
        type="button"
        className="flex items-center justify-between w-full p-4 text-left text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-lg">{title}</span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
          {children}
        </div>
      )}
    </div>
  );
};

export default Accordion;
