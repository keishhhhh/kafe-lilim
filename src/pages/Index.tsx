import { useState } from "react";
import { Header } from "@/components/Header";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginModal } from "@/components/LoginModal";
import { MenuSection } from "@/components/MenuSection";
import { LoyaltyLookup } from "@/components/LoyaltyLookup";
import { AdminDashboard } from "@/components/AdminDashboard";
import { DrinkItem } from "@/components/MenuCard";
const cafeHeroImage = "/lovable-uploads/8ddc7da3-fa9f-49b0-8776-cf726ae17f8c.png";

const Index = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Sample drink data - REPLACE THIS WITH YOUR ACTUAL MENU DATA
  // TODO: Connect to Firebase/Supabase for dynamic menu management
  const [drinks, setDrinks] = useState<DrinkItem[]>([
    {
      id: "1",
      name: "Classic Iced Americano",
      category: "Iced Coffee",
      prices: { medium: 3.50, large: 4.25 },
      description: "Bold espresso shots served over ice with cold water. Perfect for those who appreciate pure coffee flavor.",
      ingredients: ["Double espresso shots", "Cold water", "Ice"],
      pairings: ["Morning rush", "Afternoon pick-me-up", "Study sessions"]
    },
    {
      id: "2", 
      name: "Caramel Macchiato",
      category: "Milk-Based Drinks",
      prices: { medium: 5.25, large: 6.00 },
      description: "Creamy steamed milk layered with rich espresso and finished with sweet caramel drizzle.",
      ingredients: ["Espresso", "Steamed milk", "Caramel syrup", "Caramel drizzle"],
      pairings: ["Cozy afternoons", "Sweet cravings", "Social meetings"]
    },
    {
      id: "3",
      name: "Strawberry Refresher",
      category: "Fruit Sodas", 
      prices: { medium: 4.00, large: 4.75 },
      description: "Refreshing fruit soda with real strawberry pieces and a hint of mint. Light and bubbly.",
      ingredients: ["Fresh strawberries", "Sparkling water", "Natural fruit syrup", "Mint leaves"],
      pairings: ["Summer days", "Light lunch", "Refreshing break"]
    },
    {
      id: "4",
      name: "Classic Hot Chocolate",
      category: "Hot Drinks",
      prices: { small: 3.75 },
      description: "Rich and creamy hot chocolate made with premium cocoa and topped with whipped cream.",
      ingredients: ["Premium cocoa", "Steamed milk", "Sugar", "Whipped cream"],
      pairings: ["Cold weather", "Evening comfort", "Sweet tooth"]
    }
  ]);

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLogin = () => {
    setIsAdmin(true);
  };

  const handleLogout = () => {
    setIsAdmin(false);
  };

  const groupedDrinks = {
    "Iced Coffee": drinks.filter(d => d.category === "Iced Coffee"),
    "Milk-Based Drinks": drinks.filter(d => d.category === "Milk-Based Drinks"), 
    "Fruit Sodas": drinks.filter(d => d.category === "Fruit Sodas"),
    "Hot Drinks": drinks.filter(d => d.category === "Hot Drinks")
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <ThemeToggle />
        <Header 
          isAdmin={isAdmin} 
          onAdminToggle={handleAdminToggle}
          onLogout={handleLogout}
        />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your café's inventory, sales, and menu</p>
          </div>
          <AdminDashboard drinks={drinks} onUpdateDrinks={setDrinks} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      <Header 
        isAdmin={isAdmin} 
        onAdminToggle={handleAdminToggle}
        onLogout={handleLogout}
      />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${cafeHeroImage})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="text-white max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Welcome to Kafé Lilim
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Premium coffee experience with carefully crafted drinks
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="#menu" 
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                View Menu
              </a>
              <a 
                href="#loyalty" 
                className="bg-white/10 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
              >
                Check Points
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-16 space-y-16">
        {/* Menu Section */}
        <section id="menu" className="space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Our Menu</h2>
            <p className="text-lg text-muted-foreground">
              Discover our carefully curated selection of premium drinks, 
              crafted with the finest ingredients and served with love.
            </p>
          </div>
          
          <div className="space-y-12">
            {Object.entries(groupedDrinks).map(([category, categoryDrinks]) => (
              <MenuSection 
                key={category} 
                title={category} 
                drinks={categoryDrinks} 
              />
            ))}
          </div>
          
          {drinks.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">☕</div>
              <h3 className="text-2xl font-semibold mb-2">Menu Coming Soon</h3>
              <p className="text-muted-foreground">
                Our delicious drinks will be available shortly. Check back soon!
              </p>
            </div>
          )}
        </section>

        {/* Loyalty Section */}
        <section id="loyalty" className="py-16 bg-muted/30 -mx-4 px-4 rounded-2xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-4xl font-bold mb-4">Loyalty Rewards</h2>
            <p className="text-lg text-muted-foreground">
              Check your loyalty points and see how close you are to your next reward!
            </p>
          </div>
          
          <div className="flex justify-center">
            <LoyaltyLookup />
          </div>
        </section>

        {/* About Section */}
        <section className="text-center max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl font-bold">Why Choose Kafé Lilim?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="text-4xl">☕</div>
              <h3 className="text-xl font-semibold">Premium Coffee</h3>
              <p className="text-muted-foreground">
                We source the finest coffee beans from sustainable farms worldwide
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-4xl">🧑‍🍳</div>
              <h3 className="text-xl font-semibold">Expert Craftsmanship</h3>
              <p className="text-muted-foreground">
                Our skilled baristas create each drink with precision and care
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-4xl">🏪</div>
              <h3 className="text-xl font-semibold">Cozy Atmosphere</h3>
              <p className="text-muted-foreground">
                Perfect space for work, study, or catching up with friends
              </p>
            </div>
          </div>
        </section>
      </main>

      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default Index;
