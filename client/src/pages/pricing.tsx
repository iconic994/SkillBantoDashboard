import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { CreatorPlan, Pricing } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PricingPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: plans } = useQuery<Pricing[]>({
    queryKey: ["/api/pricing/plans"],
  });

  const { data: activePlan } = useQuery<CreatorPlan>({
    queryKey: ["/api/pricing/active-plan"],
  });

  const upgradeMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest("POST", "/api/pricing/upgrade", { planId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing/active-plan"] });
      toast({ title: "Plan upgraded successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upgrade plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Pricing Plans</h1>
        <p className="text-muted-foreground mt-2">
          Choose the perfect plan for your teaching business
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans?.map((plan) => {
          const features = plan.features as string[];
          const isActive = activePlan?.planId === plan.id;

          return (
            <Card key={plan.id} className={isActive ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">{plan.plan}</span>
                    <span className="text-3xl font-bold">
                      ${plan.price}
                      <span className="text-sm font-normal">/month</span>
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-6">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isActive ? "outline" : "default"}
                  disabled={isActive || upgradeMutation.isPending}
                  onClick={() => upgradeMutation.mutate(plan.id)}
                >
                  {isActive ? "Current Plan" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
