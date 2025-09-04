import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  User,
  Settings,
  LogOut,
  X,
  TrendingUp,
  CreditCard,
  Target,
  Building,
  Receipt,
  BarChart3,
  Menu, // also needed for the mobile toggle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Transactions", href: "/transactions", icon: CreditCard },
  { name: "Budgets", href: "/budgets", icon: Target },
  { name: "Accounts", href: "/accounts", icon: Building },
  { name: "Receipts", href: "/receipts", icon: Receipt },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings }
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };


    const getUserInitials = () => {
      if (user?.first_name && user?.last_name) {
        return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
      }
      if (user?.email) {
        return user.email[0].toUpperCase();
      }
      return 'U';
    };


    const getUserDisplayName = () => {
      if (user?.first_name && user?.last_name) {
        return `${user.first_name} ${user.last_name}`;
      }
      if (user?.email) {
        return user.email;
      }
      return 'User';
    };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">FinanceAI Pro</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="hidden lg:flex items-center flex-shrink-0 px-6 py-5">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">
                FinanceAI Pro
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <a
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive ? "text-white" : "text-gray-400 group-hover:text-gray-500"
                      )}
                    />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={user?.profile_image_url || ''} 
                    alt={getUserDisplayName()} 
                  />
                <AvatarFallback className="bg-primary text-white text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getUserDisplayName()}
                </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
