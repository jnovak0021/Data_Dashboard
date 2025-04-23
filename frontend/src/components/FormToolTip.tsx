import React, { useState } from 'react';
import { HiMiniQuestionMarkCircle } from "react-icons/hi2";

interface FormTooltipProps {
  content: string;
}

const FormTooltip: React.FC<FormTooltipProps> = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="text-gray-400 hover:text-gray-500 focus:outline-none"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          e.preventDefault();
          setIsVisible(!isVisible);
        }}
      >
        <HiMiniQuestionMarkCircle size={32} />
      </button>
      
      {isVisible && (
        <div className="absolute z-50 w-64 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-6">
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-1 top-3" />
        </div>
      )}
    </div>
  );
};

export default FormTooltip;