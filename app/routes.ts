import { type RouteConfig, route, layout, index, prefix } from "@react-router/dev/routes";

export default [
  // API Routes (Resource Routes)
  ...prefix("api", [
    route("auth/register", "routes/api.auth.register.ts"),
    route("auth/me", "routes/api.auth.me.ts"),
    
    route("items", "routes/api.items.ts"),
    route("items/:id", "routes/api.items.id.ts"),
    
    route("categories", "routes/api.categories.ts"),
    route("categories/:id", "routes/api.categories.id.ts"),
    route("storage/presigned-url", "routes/api.storage.presigned-url.ts"),
    route("borrowings", "routes/api.borrowings.ts"),
    route("borrowings/active", "routes/api.borrowings.active.ts"),
    route("borrowings/checkout", "routes/api.borrowings.checkout.ts"),
    route("borrowings/:id/checkin", "routes/api.borrowings.checkin.ts"),
    
    route("reports/summary", "routes/api.reports.summary.ts"),
    route("reports/history", "routes/api.reports.history.ts"),
  ]),

  // Frontend Routes (SPA)
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  
  layout("routes/layout.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    route("items", "routes/items.tsx"),
    route("items/:id", "routes/item-detail.tsx"),
    route("scan", "routes/scan.tsx"),
    route("history", "routes/history.tsx"),
    route("admin/items", "routes/admin-items.tsx"),
    route("admin/categories", "routes/admin-categories.tsx"),
    route("admin/reports", "routes/admin-reports.tsx"),
  ]),
  
  index("routes/index.tsx")
] satisfies RouteConfig;
