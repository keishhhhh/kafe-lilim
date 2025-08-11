import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, DollarSign, Coffee, TrendingUp, Plus, Edit, Trash2 } from "lucide-react";
import { DrinkItem } from "./MenuCard";
import { useToast } from "@/hooks/use-toast";

interface AdminDashboardProps {
  drinks: DrinkItem[];
  onUpdateDrinks: (drinks: DrinkItem[]) => void;
}

export function AdminDashboard({ drinks, onUpdateDrinks }: AdminDashboardProps) {
  const [newDrink, setNewDrink] = useState<Partial<DrinkItem>>({
    name: "",
    category: "Iced Coffee",
    description: "",
    ingredients: [],
    pairings: [],
    prices: {}
  });
  const { toast } = useToast();

  // Mock data for demo purposes
  const inventoryItems = [
    { id: "1", name: "Coffee Beans (Colombian)", stock: 45, unit: "lbs", lowStock: 20 },
    { id: "2", name: "Milk (Whole)", stock: 8, unit: "gallons", lowStock: 10 },
    { id: "3", name: "Sugar", stock: 15, unit: "lbs", lowStock: 5 },
    { id: "4", name: "Disposable Cups (16oz)", stock: 250, unit: "pieces", lowStock: 100 },
  ];

  const salesData = [
    { date: "2024-01-10", item: "Iced Americano", quantity: 12, revenue: 48.00 },
    { date: "2024-01-10", item: "Caramel Latte", quantity: 8, revenue: 44.00 },
    { date: "2024-01-09", item: "Cold Brew", quantity: 15, revenue: 52.50 },
    { date: "2024-01-09", item: "Vanilla Frappé", quantity: 6, revenue: 33.00 },
  ];

  const handleAddDrink = () => {
    if (!newDrink.name || !newDrink.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in name and description",
        variant: "destructive",
      });
      return;
    }

    const drink: DrinkItem = {
      id: Date.now().toString(),
      name: newDrink.name!,
      category: newDrink.category as DrinkItem["category"],
      description: newDrink.description!,
      ingredients: newDrink.ingredients || [],
      pairings: newDrink.pairings || [],
      prices: newDrink.prices || {}
    };

    onUpdateDrinks([...drinks, drink]);
    setNewDrink({
      name: "",
      category: "Iced Coffee",
      description: "",
      ingredients: [],
      pairings: [],
      prices: {}
    });

    toast({
      title: "Drink Added",
      description: `${drink.name} has been added to the menu`,
    });
  };

  const handleDeleteDrink = (drinkId: string) => {
    onUpdateDrinks(drinks.filter(d => d.id !== drinkId));
    toast({
      title: "Drink Removed",
      description: "The drink has been removed from the menu",
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$177.50</div>
            <p className="text-xs text-muted-foreground">Last 2 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drinks.length}</div>
            <p className="text-xs text-muted-foreground">Active drinks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground">vs last week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="menu">Menu Management</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>Monitor stock levels and low inventory alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.stock} {item.unit} available
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.stock <= item.lowStock && (
                        <Badge variant="destructive">Low Stock</Badge>
                      )}
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Track your café's sales performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesData.map((sale, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{sale.item}</h4>
                      <p className="text-sm text-muted-foreground">{sale.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${sale.revenue.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{sale.quantity} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Drink */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Drink
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="drink-name">Name</Label>
                    <Input
                      id="drink-name"
                      value={newDrink.name || ""}
                      onChange={(e) => setNewDrink({...newDrink, name: e.target.value})}
                      placeholder="e.g., Vanilla Latte"
                    />
                  </div>
                  <div>
                    <Label htmlFor="drink-category">Category</Label>
                    <select
                      id="drink-category"
                      className="w-full p-2 border rounded-md bg-background"
                      value={newDrink.category || "Iced Coffee"}
                      onChange={(e) => setNewDrink({...newDrink, category: e.target.value as DrinkItem["category"]})}
                    >
                      <option value="Iced Coffee">Iced Coffee</option>
                      <option value="Milk-Based Drinks">Milk-Based Drinks</option>
                      <option value="Fruit Sodas">Fruit Sodas</option>
                      <option value="Hot Drinks">Hot Drinks</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="drink-description">Description</Label>
                  <Textarea
                    id="drink-description"
                    value={newDrink.description || ""}
                    onChange={(e) => setNewDrink({...newDrink, description: e.target.value})}
                    placeholder="Describe the drink's flavor and appeal..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="medium-price">Medium Price (16oz)</Label>
                    <Input
                      id="medium-price"
                      type="number"
                      step="0.01"
                      value={newDrink.prices?.medium || ""}
                      onChange={(e) => setNewDrink({
                        ...newDrink, 
                        prices: {...newDrink.prices, medium: parseFloat(e.target.value)}
                      })}
                      placeholder="4.50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="large-price">Large Price (22oz)</Label>
                    <Input
                      id="large-price"
                      type="number"
                      step="0.01"
                      value={newDrink.prices?.large || ""}
                      onChange={(e) => setNewDrink({
                        ...newDrink, 
                        prices: {...newDrink.prices, large: parseFloat(e.target.value)}
                      })}
                      placeholder="5.50"
                    />
                  </div>
                </div>

                <Button onClick={handleAddDrink} className="w-full">
                  Add to Menu
                </Button>
              </CardContent>
            </Card>

            {/* Current Menu Items */}
            <Card>
              <CardHeader>
                <CardTitle>Current Menu Items</CardTitle>
                <CardDescription>{drinks.length} items in menu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {drinks.map((drink) => (
                    <div key={drink.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{drink.name}</h4>
                        <p className="text-sm text-muted-foreground">{drink.category}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteDrink(drink.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {drinks.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No drinks in menu. Add some drinks to get started!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
