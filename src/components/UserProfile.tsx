
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Shield } from 'lucide-react';
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
    : (user.user_metadata?.full_name || user.email || 'User');
  
  const displayEmail = user.auth_type === 'username' 
    ? `${user.username} (${user.role})` 
    : user.email;
  
  const avatarUrl = user.auth_type === 'supabase' ? user.user_metadata?.avatar_url : null;

  return (
    <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border">
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {user.auth_type === 'username' && user.role === 'admin' ? (
            <Shield className="h-5 w-5" />
          ) : avatarUrl ? (
            <User className="h-5 w-5" />
          ) : (
            getInitials(displayName || 'U')
          )}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate flex items-center">
          {displayName}
          {user.role === 'admin' && (
            <Shield className="h-4 w-4 ml-2 text-red-500" />
          )}
        </p>
        <p className="text-sm text-slate-500 truncate">
          {displayEmail}
        </p>
      </div>
      
      <Button
        onClick={signOut}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign Out</span>
      </Button>
    </div>
  );
};

export default UserProfile;
