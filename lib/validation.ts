import { z } from 'zod';
const note = z.string().trim().max(300).optional();
export const lineSchema = z.object({menuItemId:z.string().min(1),quantity:z.number().int().min(1).max(20),modifiers:z.array(z.string()).max(12).default([]),note});
export const orderSchema = z.object({
  clientRequestId:z.string().uuid(), customerName:z.string().trim().min(2).max(90), customerEmail:z.string().trim().email().max(200),
  customerPhone:z.string().regex(/^(\+63|0)9\d{9}$/).optional().or(z.literal('')),
  pickupAt:z.string().regex(/^\d{4}-\d\d-\d\dT\d\d:\d\d$/), instructions:note,
  paymentMethod:z.enum(['GCASH','PAY_AT_PICKUP']), items:z.array(lineSchema).min(1).max(35)
});
export const itemSchema=z.object({name:z.string().trim().min(2).max(100),description:z.string().trim().max(800),priceCentavos:z.number().int().min(1).max(10000000),categoryId:z.string().min(1),imageUrl:z.union([z.url(),z.literal('')]).optional(),available:z.boolean(),featured:z.boolean(),hidden:z.boolean(),stock:z.number().int().min(0).max(1000000),lowStockAt:z.number().int().min(0).max(100000),unlimited:z.boolean()});
export const modifierSchema=z.object({name:z.string().trim().min(1).max(70),minSelect:z.number().int().min(0).max(8),maxSelect:z.number().int().min(1).max(8),options:z.array(z.object({name:z.string().trim().min(1).max(70),priceCentavos:z.number().int().min(0).max(1000000),available:z.boolean()})).min(1).max(15)}).refine(x=>x.minSelect<=x.maxSelect && x.maxSelect<=x.options.length);
export const settingsSchema=z.object({
  name:z.string().trim().min(1).max(100),tagline:z.string().trim().max(160),description:z.string().trim().max(2000),
  heroImage:z.union([z.url(),z.literal('')]).optional(),logoUrl:z.union([z.url(),z.literal('')]).optional(),address:z.string().trim().max(300),
  email:z.string().trim().email(),phone:z.string().trim().max(40),openTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  closeTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),closedDates:z.array(z.string().regex(/^\d{4}-\d\d-\d\d$/)).max(366),
  prepMinutes:z.number().int().min(5).max(240),advanceOrdering:z.boolean(),acceptOrders:z.boolean(),pickupInstructions:z.string().max(500),socialUrl:z.union([z.url(),z.literal('')]).optional()
}).refine(x=>x.openTime<x.closeTime,{message:'Closing time must be after opening time.'});
