import React, { createContext, useContext, useState, ReactNode } from 'react';
import { File } from "../../types/types";

interface HomeContextProps {
  inputFiles: File[]; 
  setInputFiles: React.Dispatch<React.SetStateAction<File[]>>;
}
interface HomeProviderProps {
    children: ReactNode;
  }
const HomeContext = createContext<HomeContextProps | undefined>(undefined);

export const HomeProvider: React.FC<HomeProviderProps> = ({ children }) => {
  const [inputFiles, setInputFiles] = useState<File[]>([]);

  return (
    <HomeContext.Provider value={{ inputFiles, setInputFiles }}>
      {children}
    </HomeContext.Provider>
  );
};

export const useHomeContext = () => {
  const context = useContext(HomeContext);
  if (!context) {
    throw new Error('useHomeContext must be used within a HomeProvider');
  }
  return context;
};