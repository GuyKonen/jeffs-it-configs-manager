
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User } from 'lucide-react';
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

  const displayName = user.user_metadata?.full_name || user.email || 'User';
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border">
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {avatarUrl ? <User className="h-5 w-5" /> : getInitials(displayName)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {displayName}
        </p>
        <p className="text-sm text-slate-500 truncate">
          {user.email}
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
