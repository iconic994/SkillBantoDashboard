import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, CreatorPlan, InsertUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, UserPlus, Bell, AlertCircle } from "lucide-react";
import { Redirect } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Admin() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Redirect if not admin
  if (user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const { data: creators, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/creators"],
  });

  const { data: creatorPlans } = useQuery<CreatorPlan[]>({
    queryKey: ["/api/admin/creator-plans"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      role: "creator",
    },
  });

  const createCreatorMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/creators"] });
      toast({ title: "Creator account created successfully" });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create creator account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleAccessMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/creators/${id}/toggle`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/creators"] });
      toast({ title: "Creator access updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update creator access",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Transform data for charts
  const chartData = [
    { name: 'Total Creators', value: creators?.length || 0 },
    { name: 'Active Creators', value: creators?.filter(c => c.active).length || 0 },
    { name: 'Paid Plans', value: creatorPlans?.filter(p => p.active).length || 0 },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-700">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage creator dashboards
        </p>
      </div>

      <div className="grid gap-4 mb-8 md:grid-cols-3">
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-green-700">Total Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{creators?.length || 0}</div>
            {stats?.creatorGrowth > 0 && (
              <p className="text-sm text-green-600">+{stats.creatorGrowth}% from last month</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-green-700">Active Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {creators?.filter(c => c.active).length || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              {((creators?.filter(c => c.active).length || 0) / (creators?.length || 1) * 100).toFixed(1)}% active rate
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-green-700">Paid Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {creatorPlans?.filter(p => p.active).length || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              {((creatorPlans?.filter(p => p.active).length || 0) / (creators?.length || 1) * 100).toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart */}
      <Card className="border-green-100 mb-8">
        <CardHeader>
          <CardTitle className="text-green-700">Platform Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      {stats?.notifications?.length > 0 && (
        <Card className="border-green-100 mb-8">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              System Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.notifications.map((notification, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">{notification.title}</p>
                    <p className="text-sm text-green-600">{notification.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-green-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-green-700">Creator Accounts</CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create New Dashboard
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Dashboard</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) => createCreatorMutation.mutate(data))}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={createCreatorMutation.isPending}
                    >
                      {createCreatorMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Create Dashboard"
                      )}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Dashboard</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creators?.map((creator) => {
                const plan = creatorPlans?.find(
                  p => p.creatorId === creator.id && p.active
                );
                const creatorStats = stats?.creatorStats?.[creator.id];

                return (
                  <TableRow key={creator.id}>
                    <TableCell>{creator.username}</TableCell>
                    <TableCell>{creator.role}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          creator.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {creator.active ? "Active" : "Restricted"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {plan ? (
                        <span className="capitalize">{plan.planId}</span>
                      ) : (
                        "No Plan"
                      )}
                    </TableCell>
                    <TableCell>{creatorStats?.totalStudents || 0}</TableCell>
                    <TableCell>${creatorStats?.revenue || 0}</TableCell>
                    <TableCell>{creatorStats?.lastActive || 'Never'}</TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/auth`);
                          toast({ title: "Login URL copied to clipboard" });
                        }}
                      >
                        Copy Login URL
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAccessMutation.mutate(creator.id)}
                        disabled={toggleAccessMutation.isPending}
                        className="border-green-200 hover:bg-green-50"
                      >
                        {creator.active ? "Restrict Access" : "Grant Access"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}