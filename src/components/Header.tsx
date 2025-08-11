import { Coffee, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import coffeeLogoImage from "@/assets/coffee-logo.png";

interface HeaderProps {
  isAdmin: boolean;
  onAdminToggle: () => void;
  onLogout?: () => void;
}

export function Header({ isAdmin, onAdminToggle, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src={coffeeLogoImage} 
            alt="Kafé Lilim" 
            className="h-10 w-10 object-contain"
          />
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Kafé Lilim
            </h1>
            <p className="text-sm text-muted-foreground">Premium Coffee Experience</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin ? (
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={onAdminToggle}
              className="flex items-center space-x-2"
            >
              <User className="h-4 w-4" />
              <span>Admin</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
