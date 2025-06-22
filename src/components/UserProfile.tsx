
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Shield, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const UserProfile = () => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user.auth_type === 'username' 
    ? user.username 
    : user.auth_type === 'oidc'
    ? (user.display_name || user.email || 'User')
    : (user.display_name || user.email || 'User');
  
  const displayEmail = user.auth_type === 'username' 
    ? `${user.username} (${user.role})` 
    : user.email;

  return (
    <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border max-w-md ml-auto">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {user.auth_type === 'username' && user.role === 'admin' ? (
            <Shield className="h-4 w-4" />
          ) : user.auth_type === 'entra' ? (
            <Building className="h-4 w-4" />
          ) : user.auth_type === 'oidc' ? (
            <Shield className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-900 truncate flex items-center">
          {displayName}
          {user.role === 'admin' && (
            <Shield className="h-3 w-3 ml-1 text-red-500" />
          )}
          {user.auth_type === 'entra' && (
            <Building className="h-3 w-3 ml-1 text-blue-500" />
          )}
          {user.auth_type === 'oidc' && (
            <Shield className="h-3 w-3 ml-1 text-green-500" />
          )}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {displayEmail}
        </p>
      </div>
      
      <Button
        onClick={signOut}
        variant="outline"
        size="sm"
        className="flex items-center space-x-1 text-xs px-2 py-1 h-7"
      >
        <LogOut className="h-3 w-3" />
        <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </div>
  );
};

export default UserProfile;
