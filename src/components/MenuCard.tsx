import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface DrinkItem {
  id: string;
  name: string;
  category: "Iced Coffee" | "Milk-Based Drinks" | "Fruit Sodas" | "Hot Drinks";
  prices: {
    small?: number; // 12 oz for hot drinks
    medium?: number; // 16 oz
    large?: number; // 22 oz
  };
  description: string;
  ingredients: string[];
  pairings: string[];
}

interface MenuCardProps {
  drink: DrinkItem;
}

export function MenuCard({ drink }: MenuCardProps) {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const getPriceDisplay = () => {
    const { prices } = drink;
    if (drink.category === "Hot Drinks") {
      return prices.small ? `${formatPrice(prices.small)} (12 oz)` : "Price TBA";
    } else {
      const parts = [];
      if (prices.medium) parts.push(`${formatPrice(prices.medium)} (16 oz)`);
      if (prices.large) parts.push(`${formatPrice(prices.large)} (22 oz)`);
      return parts.join(" • ") || "Price TBA";
    }
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold">{drink.name}</CardTitle>
          <Badge variant="secondary" className="text-xs shrink-0">
            {drink.category}
          </Badge>
        </div>
        <CardDescription className="text-sm">
          {getPriceDisplay()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{drink.description}</p>
        
        <div>
          <h4 className="text-sm font-medium mb-1">Ingredients</h4>
          <p className="text-xs text-muted-foreground">
            {drink.ingredients.join(", ")}
          </p>
        </div>
        
        {drink.pairings.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Perfect for</h4>
            <p className="text-xs text-muted-foreground">
              {drink.pairings.join(", ")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
