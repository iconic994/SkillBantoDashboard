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
import { User, CreatorPlan } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, UserPlus } from "lucide-react";
import { Redirect } from "wouter";

export default function Admin() {
  const { toast } = useToast();
  const { user } = useAuth();

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
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage creator accounts and monitor platform usage
        </p>
      </div>

      <div className="grid gap-4 mb-8 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creators?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creators?.filter(c => c.active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paid Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creatorPlans?.filter(p => p.active).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Creator Accounts</CardTitle>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Creator
            </Button>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creators?.map((creator) => {
                const plan = creatorPlans?.find(
                  p => p.creatorId === creator.id && p.active
                );

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
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAccessMutation.mutate(creator.id)}
                        disabled={toggleAccessMutation.isPending}
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