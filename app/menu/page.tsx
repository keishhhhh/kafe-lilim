import { after } from "next/server";
import { prisma } from "@/lib/db";
import { expireStaleHolds } from "@/lib/orders/expire";
import Shop from "@/components/Shop";

export const dynamic = "force-dynamic"; // stock and prices must be fresh

export default async function MenuPage() {
  after(() => expireStaleHolds()); // frees abandoned GCash holds even on a daily-cron plan
  const rows = await prisma.menuItem.findMany({
    where: { archivedAt: null, available: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  const items = rows.map((m) => ({
    id: m.id, name: m.name, description: m.description, category: m.category,
    priceCentavos: m.priceCentavos,
    soldOut: !m.unlimitedStock && m.stock - m.reserved <= 0,
  }));
  return <main><h1>Menu</h1><Shop items={items} /></main>;
}
