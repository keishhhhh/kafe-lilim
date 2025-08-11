import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock loyalty data - Replace with actual Firebase/Supabase lookup
const mockLoyaltyData: Record<string, { points: number; name: string }> = {
  "john": { points: 245, name: "John Doe" },
  "sarah": { points: 180, name: "Sarah Wilson" },
  "mike": { points: 95, name: "Mike Johnson" },
  "001": { points: 325, name: "Alice Chen" },
  "002": { points: 75, name: "Bob Martinez" },
};

export function LoyaltyLookup() {
  const [searchInput, setSearchInput] = useState("");
  const [customerData, setCustomerData] = useState<{ points: number; name: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleLookup = async () => {
    if (!searchInput.trim()) {
      toast({
        title: "Please enter a name or ID",
        description: "Enter your name or customer ID to lookup points.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    // Simulate API call delay
    setTimeout(() => {
      const key = searchInput.toLowerCase().trim();
      const found = mockLoyaltyData[key];
      
      if (found) {
        setCustomerData(found);
        toast({
          title: "Customer Found!",
          description: `Welcome back, ${found.name}!`,
        });
      } else {
        setCustomerData(null);
        toast({
          title: "Customer Not Found",
          description: "No loyalty account found. Visit us to sign up!",
          variant: "destructive",
        });
      }
      setIsSearching(false);
    }, 800);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Star className="h-5 w-5 text-accent" />
          Loyalty Points
        </CardTitle>
        <CardDescription>
          Enter your name or customer ID to check your points
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer-search">Name or Customer ID</Label>
          <div className="flex gap-2">
            <Input
              id="customer-search"
              placeholder="e.g., John or 001"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            />
            <Button 
              onClick={handleLookup} 
              disabled={isSearching}
              size="icon"
              variant="outline"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {customerData && (
          <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/20">
            <div className="text-center">
              <h3 className="font-semibold text-lg">{customerData.name}</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Star className="h-5 w-5 text-accent fill-current" />
                <span className="text-2xl font-bold text-accent">
                  {customerData.points}
                </span>
                <span className="text-muted-foreground">points</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Thank you for your loyalty!
              </p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          <p>Try: john, sarah, mike, 001, 002</p>
          <p className="mt-1">🔒 In production, this connects to your database</p>
        </div>
      </CardContent>
    </Card>
  );
}
