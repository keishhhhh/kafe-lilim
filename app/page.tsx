import { db } from '@/lib/db';
import { MenuBrowser } from '@/components/customer/menu-browser';

// Keep this file as the App Router root page module with an explicit default export.
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Kafe Lilim | A quiet corner, one cup at a time',
};

export default async function HomePage() {
  const [settings, products] = await Promise.all([
    db.businessSettings.findUnique({ where: { id: 'main' } }),
    db.menuItem.findMany({
      where: { archived: false, hidden: false },
      include: {
        category: true,
        inventory: true,
        modifierGroups: {
          orderBy: { sortOrder: 'asc' },
          include: { options: { where: { available: true } } },
        },
      },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    }),
  ]);

  const availableProducts = products.filter((product) => {
    if (!product.available) return false;
    if (!product.inventory || product.inventory.unlimited) return true;
    return product.inventory.available - product.inventory.reserved > 0;
  });

  return (
    <>
      <section className="container section">
        <p className="eyebrow">
          {settings?.tagline ?? 'Your quiet corner, one cup at a time.'}
        </p>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', maxWidth: 850, margin: '12px 0 18px' }}>
          {settings?.name ?? 'Kafe Lilim'}
        </h1>
        <p className="muted" style={{ maxWidth: 650, fontSize: 18 }}>
          {settings?.description ?? 'A slow moment, made with care.'}
        </p>
        {settings && !settings.acceptOrders && (
          <p className="notice" role="status">Online orders are currently paused.</p>
        )}
      </section>
      <section className="container section" aria-labelledby="menu-heading">
        <h2 id="menu-heading">Made for your moment</h2>
        {availableProducts.length > 0 ? (
          <MenuBrowser products={availableProducts} />
        ) : (
          <div className="surface empty">
            <h3>Our menu is being prepared</h3>
            <p className="muted">Please check back soon.</p>
          </div>
        )}
      </section>
    </>
  );
}
