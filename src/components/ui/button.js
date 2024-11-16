import React from 'react';

export const Button = ({ children, ...props }) => (
  <button 
    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    {...props}
  >
    {children}
  </button>
);

export const Input = (props) => (
  <input 
    className="px-3 py-2 border rounded w-full"
    {...props}
  />
);