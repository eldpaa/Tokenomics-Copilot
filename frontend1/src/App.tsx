import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { WalletProvider } from "@/lib/walletContext";
import { Layout } from "@/components/shared/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { AuditDetailPage } from "@/pages/AuditDetailPage";

import Demo from "@/pages/demo";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 min cache so navigating back doesn't re-fetch
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/audit/:symbol" element={<AuditDetailPage />} />
              <Route path="/demo" element={<Demo />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </WalletProvider>
    </QueryClientProvider>
  );
}