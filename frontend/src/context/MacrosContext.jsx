import React, { createContext, useContext, useState, useEffect } from 'react';

const MacrosContext = createContext();

export function useMacros() {
  const context = useContext(MacrosContext);
  if (!context) {
    throw new Error('useMacros must be used within MacrosProvider');
  }
  return context;
}

export function MacrosProvider({ children }) {
  const [macros, setMacros] = useState(() => {
    const saved = localStorage.getItem('xminebot_saved_macros');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('xminebot_saved_macros', JSON.stringify(macros));
  }, [macros]);

  const saveMacro = (name, description, blocks) => {
    const newMacro = {
      id: Date.now(),
      name,
      description,
      blocks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMacros(prev => [...prev, newMacro]);
    return newMacro;
  };

  const updateMacro = (id, name, description, blocks) => {
    setMacros(prev => prev.map(macro => 
      macro.id === id 
        ? { ...macro, name, description, blocks, updatedAt: new Date().toISOString() }
        : macro
    ));
  };

  const deleteMacro = (id) => {
    setMacros(prev => prev.filter(macro => macro.id !== id));
  };

  const getMacro = (id) => {
    return macros.find(macro => macro.id === id);
  };

  return (
    <MacrosContext.Provider value={{ macros, saveMacro, updateMacro, deleteMacro, getMacro }}>
      {children}
    </MacrosContext.Provider>
  );
}
