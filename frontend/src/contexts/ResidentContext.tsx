import React, { createContext, useContext } from 'react';

interface ResidentContextValue {
  residentId: number | undefined;
}

const ResidentContext = createContext<ResidentContextValue>({ residentId: undefined });

export const ResidentProvider: React.FC<{ residentId: number | undefined; children: React.ReactNode }> = ({ residentId, children }) => (
  <ResidentContext.Provider value={{ residentId }}>
    {children}
  </ResidentContext.Provider>
);

export const useResidentId = () => useContext(ResidentContext).residentId;
