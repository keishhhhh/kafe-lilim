import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth/session';
import { modifierSchema } from '@/lib/validation';
import { ApiError, checkOrigin, json, parseBody, withApi } from '@/lib/http';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withApi(async () => {
    checkOrigin(request);
    const staff = await requireStaff();
    const { id: itemId } = await params;
    const input = modifierSchema.parse(await parseBody(request));

    const item = await db.menuItem.findUnique({
      where: { id: itemId },
      select: { id: true, archived: true },
    });
    if (!item || item.archived) throw new ApiError(404, 'Menu item not found');

    const group = await db.modifierGroup.create({
      data: {
        itemId,
        name: input.name,
        minSelect: input.minSelect,
        maxSelect: input.maxSelect,
        options: { create: input.options },
      },
      include: { options: true },
    });
    await db.auditLog.create({
      data: { staffId: staff.id, action: 'MODIFIER_GROUP_CREATED', targetId: itemId },
    });

    return json(group, 201);
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withApi(async () => {
    checkOrigin(request);
    const staff = await requireStaff('ADMIN');
    const { id: groupId } = await params;

    const group = await db.modifierGroup.findUnique({
      where: { id: groupId },
      select: { id: true, itemId: true },
    });
    if (!group) throw new ApiError(404, 'Modifier group not found');

    await db.$transaction([
      db.modifierGroup.delete({ where: { id: groupId } }),
      db.auditLog.create({
        data: { staffId: staff.id, action: 'MODIFIER_GROUP_DELETED', targetId: group.itemId },
      }),
    ]);

    return json({ deleted: true });
  });
}
