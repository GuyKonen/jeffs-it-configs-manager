import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from "@/hooks/use-toast"
import { Settings, Trash2, User, UserPlus, Pencil, Shield, ShieldCheck } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { database, User as UserData } from '@/utils/database';

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTotpSetupOpen, setIsTotpSetupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user'
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const allUsers = await database.getAllUsers();
      setUsers(allUsers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const setupTOTP = async (userId: string) => {
    try {
      const { secret, qr_code_url } = await database.setupTOTP(userId);
      setTotpSecret(secret);
      setQrCodeUrl(qr_code_url);
      setIsTotpSetupOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to setup TOTP",
        variant: "destructive",
      });
    }
  };

  const enableTOTP = async (userId: string, token: string) => {
    try {
      await database.enableTOTP(userId, token);
      toast({
        title: "Success",
        description: "TOTP enabled successfully",
      });
      setIsTotpSetupOpen(false);
      await fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid TOTP token",
        variant: "destructive",
      });
    }
  };

  const disableTOTP = async (userId: string) => {
    try {
      await database.disableTOTP(userId);
      toast({
        title: "Success",
        description: "TOTP disabled successfully",
      });
      await fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disable TOTP",
        variant: "destructive",
      });
    }
  };

  const updateUser = async (userId: string, userData: { password?: string; role?: string }) => {
    try {
      setIsLoading(true);
      await database.updateUser(userId, userData);
      
      toast({
        title: "Success",
        description: "User updated successfully",
      });

      await fetchUsers();
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setIsLoading(true);
      await database.deleteUser(userId);

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      await fetchUsers();
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (userData: { username: string; password: string; role: string }) => {
    try {
      setIsLoading(true);
      
      const newUserData = await database.createUser({
        username: userData.username,
        password: userData.password,
        role: userData.role,
        is_active: true
      });

      toast({
        title: "User Created",
        description: "User created successfully. Now setting up TOTP...",
      });

      // Automatically setup TOTP for new user
      await setupTOTP(newUserData.id);
      await fetchUsers();
      setNewUser({ username: '', password: '', role: 'user' });
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 mr-2" />
            User Management (SQLite Database)
          </CardTitle>
          <CardDescription>Manage users with local SQLite database - TOTP required for all users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>TOTP Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.totp_enabled ? (
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <Shield className="h-4 w-4 text-red-500" />
                      )}
                      {user.totp_enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{user.is_active ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell className="text-right font-medium">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedUser(user);
                        setIsEditDialogOpen(true);
                      }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      {!user.totp_enabled ? (
                        <Button variant="ghost" size="sm" onClick={() => setupTOTP(user.id)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Setup TOTP
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => disableTOTP(user.id)}>
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Disable TOTP
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedUser(user);
                        setIsDeleteDialogOpen(true);
                      }}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div></div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
          </Dialog>
        </CardFooter>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createUser(newUser)} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the selected user's information.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">New Password (optional)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => updateUser(selectedUser!.id, {
              role: selectedUser!.role,
              ...(editPassword && { password: editPassword })
            })} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteUser(selectedUser!.id)} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TOTP Setup Dialog */}
      <Dialog open={isTotpSetupOpen} onOpenChange={setIsTotpSetupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app and enter the 6-digit code to enable TOTP.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCodeUrl && (
              <div className="text-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`} alt="TOTP QR Code" className="mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Secret: {totpSecret}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Enter 6-digit code from your authenticator app</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTotpSetupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => enableTOTP(selectedUser?.id || '', totpToken)} disabled={totpToken.length !== 6}>
              Enable TOTP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
