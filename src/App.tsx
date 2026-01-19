import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { PWANotifications } from "@/components/PWANotifications";
import { initPWA } from "@/lib/pwaUtils";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Salaries from "./pages/Salaries";
import Advances from "./pages/Advances";
import Receipts from "./pages/Receipts";
import DataManagement from "./pages/DataManagement";
import Settings from "./pages/Settings";
import DepartmentsPositions from "./pages/DepartmentsPositions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialise les services PWA au chargement de l'app
    initPWA();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="app-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PWANotifications />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/salaries" element={<Salaries />} />
                <Route path="/advances" element={<Advances />} />
                <Route path="/receipts" element={<Receipts />} />
                <Route path="/departments-positions" element={<DepartmentsPositions />} />
                <Route path="/data" element={<DataManagement />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
