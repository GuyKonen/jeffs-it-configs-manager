import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
  is_active: boolean;
}

const UserManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    authType: 'username' as 'username' | 'microsoft'
  });

  const fetchUsers = async () => {
    try {
      const response = await supabase.functions.invoke('user-management', {
        body: { action: 'list', currentUser: user?.username }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username) {
      toast({
        title: "Missing Information",
        description: "Username is required.",
        variant: "destructive",
      });
      return;
    }

    if (!editingUser && !formData.password && formData.authType === 'username') {
      toast({
        title: "Missing Information",
        description: "Password is required for new username-based users.",
        variant: "destructive",
      });
      return;
    }

    try {
      const action = editingUser ? 'update' : 'create';
      const body: any = {
        action,
        username: formData.username,
        role: formData.role,
        authType: formData.authType,
        currentUser: user?.username
      };

      if (formData.password && formData.authType === 'username') {
        body.password = formData.password;
      }

      if (editingUser) {
        body.userId = editingUser.id;
      }

      const response = await supabase.functions.invoke('user-management', { body });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Success",
        description: `User ${editingUser ? 'updated' : 'created'} successfully.`,
      });

      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({ username: '', password: '', role: 'user', authType: 'username' });
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingUser ? 'update' : 'create'} user.`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await supabase.functions.invoke('user-management', {
        body: { action: 'delete', userId, currentUser: user?.username }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Success",
        description: "User deleted successfully.",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setFormData({
      username: userToEdit.username,
      password: '',
      role: userToEdit.role,
      authType: 'username'
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', role: 'user', authType: 'username' });
    setIsDialogOpen(true);
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-500" />
            <CardTitle className="text-xl">User Management</CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Update user information' : 'Add a new user to the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authType">Authentication Type</Label>
                  <Select value={formData.authType} onValueChange={(value: 'username' | 'microsoft') => setFormData(prev => ({ ...prev, authType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select authentication type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="username">Username/Password</SelectItem>
                      <SelectItem value="microsoft">Microsoft SAML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.authType === 'username' && (
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password {editingUser && '(leave blank to keep current)'}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value: 'admin' | 'user') => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Manage user accounts and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
