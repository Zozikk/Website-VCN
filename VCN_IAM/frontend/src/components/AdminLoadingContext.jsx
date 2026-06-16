import { createContext, useContext, useMemo, useState } from 'react';

const AdminLoadingContext = createContext({
  isLoading: false,
  setLoading: () => {},
});

export function AdminLoadingProvider({ children }) {
  const [isLoading, setLoading] = useState(false);
  const value = useMemo(() => ({ isLoading, setLoading }), [isLoading]);

  return <AdminLoadingContext.Provider value={value}>{children}</AdminLoadingContext.Provider>;
}

export function useAdminLoading() {
  return useContext(AdminLoadingContext);
}