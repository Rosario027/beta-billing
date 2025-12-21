import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useActiveClient } from "@/hooks/use-active-client";
import { useClients } from "@/hooks/use-clients";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Building2,
  PlusCircle,
  ChevronDown
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: clients } = useClients();
  const { activeClientId, setActiveClient } = useActiveClient();

  const activeClient = clients?.find(c => c.id === activeClientId);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Invoices', href: '/invoices', icon: FileText, disabled: !activeClientId },
    { name: 'Customers', href: '/customers', icon: Users, disabled: !activeClientId },
    { name: 'Settings', href: '/settings', icon: Settings, disabled: !activeClientId },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 h-16 flex items-center border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">TaxFlow</span>
          </div>
        </div>

        <div className="px-4 py-6 flex-1 flex flex-col gap-6 overflow-y-auto">
          {/* Client Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
              Current Client
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-12 px-3 border-2 border-primary/10 hover:border-primary/20 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Avatar className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent">
                      <AvatarFallback className="text-primary-foreground text-xs">
                        {activeClient ? activeClient.name.substring(0, 2).toUpperCase() : "SL"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium">
                      {activeClient ? activeClient.name : "Select Client"}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 p-2" align="start">
                <DropdownMenuLabel className="text-xs text-muted-foreground">My Clients</DropdownMenuLabel>
                {clients?.map((client) => (
                  <DropdownMenuItem 
                    key={client.id}
                    onClick={() => setActiveClient(client.id)}
                    className="cursor-pointer gap-2 py-2.5 font-medium"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary/80" />
                    {client.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer gap-2 text-primary focus:text-primary">
                  <PlusCircle className="w-4 h-4" />
                  <Link href="/clients/new">Add New Client</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.disabled ? '#' : item.href}
                >
                  <button
                    disabled={item.disabled}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }
                      ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground/70'}`} />
                    {item.name}
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border border-border">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.firstName?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">Chartered Accountant</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
