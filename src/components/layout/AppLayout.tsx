import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "@/components/ui/separator";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { useLocation } from "react-router-dom";
import { Wifi, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { BackupReminderBanner } from "@/components/backup/BackupReminderBanner";

interface AppLayoutProps {
  children: ReactNode;
}

const routeNames: Record<string, string> = {
  "/": "Tableau de bord",
  "/employees": "Employés",
  "/employees/new": "Nouvel employé",
  "/salaries": "Salaires",
  "/advances": "Avances",
  "/receipts": "Reçus",
  "/data": "Données",
  "/settings": "Paramètres",
};

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const breadcrumbs = [{ path: "/", name: "Accueil" }];

  let currentPath = "";
  for (const part of parts) {
    currentPath += `/${part}`;
    const name = routeNames[currentPath] || part;
    breadcrumbs.push({ path: currentPath, name });
  }

  return breadcrumbs;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const isOnline = useOnlineStatus();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          {/* Backup Reminder Banner */}
          <BackupReminderBanner />
          
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            
            <Breadcrumb className="flex-1">
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <BreadcrumbItem key={crumb.path}>
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                    ) : (
                      <>
                        <BreadcrumbLink href={crumb.path}>{crumb.name}</BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Online status indicator */}
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full ${
              isOnline 
                ? "bg-success/10 text-success" 
                : "bg-warning/10 text-warning"
            }`}>
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">En ligne</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Hors ligne</span>
                </>
              )}
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
