import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Edit, Trash2, Shield, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/utils/database';

interface User {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  totp_enabled?: boolean;
  created_at: string;
}

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTotpDialog, setShowTotpDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrUrl, setTotpQrUrl] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [currentTotpUserId, setCurrentTotpUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user',
    is_active: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('CLIENT: Loading users...');
      const users = await database.getAllUsers();
      console.log('CLIENT: Loaded users:', users);
      setUsers(users);
    } catch (error) {
      console.error('CLIENT: Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('CLIENT: Creating user with data:', formData);
      
      // First create the user
      const newUser = await database.createUser(formData);
      console.log('CLIENT: User created successfully:', newUser);
      
      // Load users to refresh the list
      await loadUsers();
      
      // Find the newly created user to get its ID
      const createdUser = users.find(u => u.username === formData.username);
      console.log('CLIENT: Found created user:', createdUser);
      
      if (createdUser) {
        // Automatically setup TOTP for the new user
        await setupTotpForUser(createdUser.id);
        setShowCreateDialog(false);
        setFormData({ username: '', password: '', role: 'user', is_active: true });
        
        toast({
          title: "User Created",
          description: "User created successfully. Please set up TOTP authentication.",
        });
      } else {
        console.log('CLIENT: Could not find newly created user, proceeding without TOTP setup');
        setShowCreateDialog(false);
        setFormData({ username: '', password: '', role: 'user', is_active: true });
        
        toast({
          title: "User Created",
          description: "User created successfully.",
        });
      }
    } catch (error) {
      console.error('CLIENT: Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user.",
        variant: "destructive",
      });
    }
  };

  const setupTotpForUser = async (userId: string) => {
    try {
      console.log('CLIENT: Setting up TOTP for user:', userId);
      const response = await fetch('http://localhost:3001/api/totp/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('CLIENT: TOTP setup failed:', data);
        throw new Error(data.error || 'Failed to setup TOTP');
      }

      console.log('CLIENT: TOTP setup response:', data);
      setTotpSecret(data.secret);
      setTotpQrUrl(data.qr_code_url);
      setCurrentTotpUserId(userId);
      setShowTotpDialog(true);
    } catch (error) {
      console.error('CLIENT: Error setting up TOTP:', error);
      toast({
        title: "TOTP Setup Failed",
        description: error instanceof Error ? error.message : "Failed to setup TOTP",
        variant: "destructive",
      });
    }
  };

  const enableTotp = async () => {
    if (!currentTotpUserId || !totpToken) return;

    try {
      console.log('CLIENT: Enabling TOTP for user:', currentTotpUserId);
      const response = await fetch('http://localhost:3001/api/totp/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_id: currentTotpUserId, 
          token: totpToken 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('CLIENT: TOTP enable failed:', data);
        throw new Error(data.error || 'Failed to enable TOTP');
      }

      setShowTotpDialog(false);
      setTotpToken('');
      setTotpSecret('');
      setTotpQrUrl('');
      setCurrentTotpUserId(null);
      
      await loadUsers();
      
      toast({
        title: "TOTP Enabled",
        description: "Two-factor authentication has been enabled successfully.",
      });
    } catch (error) {
      console.error('CLIENT: Error enabling TOTP:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enable TOTP",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      console.log('CLIENT: Updating user:', editingUser.id, formData);
      await database.updateUser(editingUser.id, formData);
      await loadUsers();
      setEditingUser(null);
      setFormData({ username: '', password: '', role: 'user', is_active: true });
      
      toast({
        title: "User Updated",
        description: "User updated successfully.",
      });
    } catch (error) {
      console.error('CLIENT: Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      console.log('CLIENT: Deleting user:', userId);
      await database.deleteUser(userId);
      await loadUsers();
      
      toast({
        title: "User Deleted",
        description: "User deleted successfully.",
      });
    } catch (error) {
      console.error('CLIENT: Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      is_active: user.is_active
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h2>
          <p className="text-muted-foreground">Manage system users and their permissions</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>All registered users in the system ({users.length} total)</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found. Try refreshing or create a new user.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'destructive'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.totp_enabled ? (
                        <Badge variant="outline" className="text-green-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600">
                          Disabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {!user.totp_enabled && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setupTotpForUser(user.id)}
                          >
                            <Key className="h-4 w-4 mr-1" />
                            Setup 2FA
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
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

      {/* Create/Edit User Dialog */}
      <Dialog open={showCreateDialog || !!editingUser} onOpenChange={() => {
        setShowCreateDialog(false);
        setEditingUser(null);
        setFormData({ username: '', password: '', role: 'user', is_active: true });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information' : 'Add a new user to the system. TOTP will be set up automatically.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password {editingUser && '(leave empty to keep current)'}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required={!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingUser(null);
                  setFormData({ username: '', password: '', role: 'user', is_active: true });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingUser ? 'Update' : 'Create'} User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* TOTP Setup Dialog */}
      <Dialog open={showTotpDialog} onOpenChange={(open) => {
        if (!open) {
          setShowTotpDialog(false);
          setTotpToken('');
          setTotpSecret('');
          setTotpQrUrl('');
          setCurrentTotpUserId(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app and enter the verification code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {totpQrUrl && (
              <div className="text-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpQrUrl)}`}
                  alt="TOTP QR Code"
                  className="mx-auto"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Manual entry key: <code className="bg-muted px-2 py-1 rounded">{totpSecret}</code>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Enter verification code from your authenticator app:</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={totpToken}
                  onChange={(value) => setTotpToken(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTotpDialog(false);
                  setTotpToken('');
                  setTotpSecret('');
                  setTotpQrUrl('');
                  setCurrentTotpUserId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={enableTotp}
                disabled={totpToken.length !== 6}
              >
                Enable 2FA
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
