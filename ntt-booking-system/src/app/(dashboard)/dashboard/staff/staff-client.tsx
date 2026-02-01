"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  StaffMember,
  inviteStaff,
  updateStaffRole,
  removeStaff,
} from "@/app/actions/staff";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserX,
  Mail,
  Smartphone,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface StaffClientProps {
  initialStaff: StaffMember[];
  currentUserRole?: UserRole;
  currentUserId?: string;
}

// Assuming 'manager' isn't in our core types yet based on previous file, but generic UserRole is.
// Let's stick to the types we saw: admin, owner, staff.
const roleSchema = z
  .enum(["admin", "owner", "staff"] as [string, ...string[]])
  .transform((val) => val as UserRole);

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  role: roleSchema,
});

export function StaffClient({
  initialStaff,
  currentUserRole,
  currentUserId,
}: StaffClientProps) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const canManageAttributes =
    currentUserRole === "admin" || currentUserRole === "owner";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      full_name: "",
      role: "staff",
    },
  });

  const filteredStaff = staff.filter(
    (member) =>
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsPending(true);
    try {
      const result = await inviteStaff(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invitation sent successfully");
        setIsInviteOpen(false);
        form.reset();
        router.refresh(); // Refresh server data
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this staff member? This action cannot be undone.",
      )
    )
      return;

    const toastId = toast.loading("Removing staff...");
    const result = await removeStaff(id);

    if (result.error) {
      toast.error(result.error, { id: toastId });
    } else {
      toast.success("Staff member removed", { id: toastId });
      setStaff((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    }
  };

  const handleRoleUpdate = async (id: string, newRole: UserRole) => {
    const toastId = toast.loading("Updating role...");
    const result = await updateStaffRole(id, newRole);

    if (result.error) {
      toast.error(result.error, { id: toastId });
    } else {
      toast.success(`Role updated to ${newRole}`, { id: toastId });
      setStaff((prev) =>
        prev.map((s) => (s.id === id ? { ...s, role: newRole } : s)),
      );
      router.refresh();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "admin":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "staff":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <ShieldAlert className="h-3 w-3 mr-1" />;
      case "admin":
        return <ShieldCheck className="h-3 w-3 mr-1" />;
      default:
        return <User className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search staff..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {canManageAttributes && (
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700">
                <Plus className="h-4 w-4 mr-2" />
                Invite Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation email to add a new staff member to your
                  team.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="john@example.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsInviteOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-teal-600 hover:bg-teal-700"
                      disabled={isPending}
                    >
                      {isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Send Invitation
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Mobile View (Cards) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredStaff.map((member) => (
          <Card key={member.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 p-4 pb-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar_url || ""} />
                <AvatarFallback className="bg-teal-50 text-teal-700">
                  {member.full_name?.slice(0, 2).toUpperCase() || "SM"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <CardTitle className="text-base truncate">
                  {member.full_name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={`text-xs px-2 py-0.5 ${getRoleBadgeColor(member.role)}`}
                  >
                    {getRoleIcon(member.role)}
                    {member.role}
                  </Badge>
                </div>
              </div>

              {canManageAttributes && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleRoleUpdate(member.id, "admin")}
                    >
                      Make Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleUpdate(member.id, "staff")}
                    >
                      Make Staff
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleRemove(member.id)}
                    >
                      Remove Staff
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-2 text-sm text-gray-500 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{member.email}</span>
              </div>
              {member.phone && (
                <div className="flex items-center gap-2">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>{member.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Joined</TableHead>
              {canManageAttributes && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManageAttributes ? 5 : 4}
                  className="h-24 text-center text-gray-500"
                >
                  No staff members found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatar_url || ""} />
                        <AvatarFallback className="bg-teal-50 text-teal-700">
                          {member.full_name?.slice(0, 2).toUpperCase() || "SM"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {member.full_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`capitalize ${getRoleBadgeColor(member.role)}`}
                    >
                      {getRoleIcon(member.role)}
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {member.phone || "-"}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(member.created_at).toLocaleDateString()}
                  </TableCell>

                  {canManageAttributes && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              navigator.clipboard.writeText(member.email)
                            }
                          >
                            Copy Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRoleUpdate(member.id, "admin")}
                          >
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleUpdate(member.id, "staff")}
                          >
                            Make Staff
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleUpdate(member.id, "owner")}
                          >
                            Make Owner
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleRemove(member.id)}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Remove Staff
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
