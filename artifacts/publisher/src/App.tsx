import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import ArticleDetail from "@/pages/article";
import About from "@/pages/about";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminArticles from "@/pages/admin/articles";
import AdminOrders from "@/pages/admin/orders";
import AdminSettings from "@/pages/admin/settings";

import StoreLayout from "@/components/layout/store-layout";
import AdminLayout from "@/components/layout/admin-layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Admin Login Route (no layout) */}
      <Route path="/admin/login" component={AdminLogin} />

      {/* Admin Routes */}
      <Route path="/admin" nest>
        <AdminLayout>
          <Switch>
            <Route path="/" component={AdminDashboard} />
            <Route path="/articles" component={AdminArticles} />
            <Route path="/orders" component={AdminOrders} />
            <Route path="/settings" component={AdminSettings} />
            <Route component={NotFound} />
          </Switch>
        </AdminLayout>
      </Route>

      {/* Store Routes */}
      <Route path="/" nest>
        <StoreLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/articles/:id" component={ArticleDetail} />
            <Route path="/about" component={About} />
            <Route component={NotFound} />
          </Switch>
        </StoreLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
