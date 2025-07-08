import { Shield, ArrowRight, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import dashboardPreview from "@/assets/dashboard-preview.jpg";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">FinanceFlow</span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link to="/pricing" className="text-foreground hover:text-primary font-medium">
              Pricing
            </Link>
            <Link to="/signin">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="default" size="sm">Register</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Transform your statements into<br />
            <span className="text-primary">actionable financial insights</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Convert your bank statements into comprehensive financial analysis with intelligent categorization, spending patterns, and growth tracking.
          </p>
          
          {/* Dashboard Preview */}
          <div className="mb-12 max-w-4xl mx-auto">
            <img 
              src={dashboardPreview} 
              alt="Financial Dashboard Preview" 
              className="rounded-lg shadow-elegant border border-border"
            />
            <p className="text-sm text-muted-foreground mt-4">
              See how your financial data transforms into beautiful, actionable insights
            </p>
          </div>
          <Link to="/register">
            <Button 
              variant="financial" 
              size="lg" 
              className="text-lg px-8 py-6 h-auto"
            >
              Start Your Financial Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-foreground">Bank-Grade Security</h3>
              <p className="text-muted-foreground">
                Your financial data is protected with enterprise-level encryption and never stored permanently on our servers.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-foreground">Smart Analytics</h3>
              <p className="text-muted-foreground">
                Advanced AI algorithms automatically categorize transactions and identify spending patterns for deeper insights.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <PieChart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-foreground">Comprehensive Reports</h3>
              <p className="text-muted-foreground">
                Generate detailed financial reports with visual charts, trend analysis, and exportable formats for any purpose.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Financial Data?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who have already discovered the power of intelligent financial analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 py-6 h-auto">
                Get Started for Free
              </Button>
            </Link>
            <Link to="/signin">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">© 2024 FinanceFlow. Transforming financial data into actionable insights.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;