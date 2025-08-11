import { MenuCard, DrinkItem } from "./MenuCard";

interface MenuSectionProps {
  title: string;
  drinks: DrinkItem[];
}

export function MenuSection({ title, drinks }: MenuSectionProps) {
  if (drinks.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drinks.map((drink) => (
          <MenuCard key={drink.id} drink={drink} />
        ))}
      </div>
    </section>
  );
}
