import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown, DollarSign, Calendar, Upload, FileText, Brain, PieChart, BarChart3, Filter, GitCompare as Compare } from "lucide-react";
import { Transaction } from "@/utils/csvProcessor";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, Tooltip, Legend, ComposedChart } from "recharts";

interface DataAnalyzerProps {
  transactions: Transaction[];
  csvData: string;
  fileName: string;
  onUploadAnother: () => void;
  onDocumentSelect: (csvData: string, fileName: string) => void;
  uploadedFiles: any[];
}

type FilterType = 'all' | 'category' | 'daily' | 'weekly' | 'monthly' | 'income' | 'expenses';
type ComparisonPeriod = 'month' | 'quarter' | 'year';

export const DataAnalyzer = ({ transactions, csvData, fileName, onUploadAnother, onDocumentSelect, uploadedFiles }: DataAnalyzerProps) => {
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [chartFilter, setChartFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>('month');

  const analysis = useMemo(() => {
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netAmount = totalIncome - totalExpenses;
    
    // Detect currency from transactions
    const currencies = [...new Set(transactions.map(t => t.currency).filter(Boolean))];
    const primaryCurrency = currencies[0] || 'USD';
    
    // Category breakdown
    const categoryTotals = transactions.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, income: 0, expenses: 0 };
      }
      acc[category].total += transaction.amount;
      acc[category].count += 1;
      if (transaction.amount > 0) {
        acc[category].income += transaction.amount;
      } else {
        acc[category].expenses += Math.abs(transaction.amount);
      }
      return acc;
    }, {} as Record<string, { total: number; count: number; income: number; expenses: number }>);

    // Time-based breakdowns
    const dailyData = transactions.reduce((acc, transaction) => {
      const day = transaction.date; // YYYY-MM-DD
      if (!acc[day]) {
        acc[day] = { income: 0, expenses: 0, count: 0 };
      }
      if (transaction.amount > 0) {
        acc[day].income += transaction.amount;
      } else {
        acc[day].expenses += Math.abs(transaction.amount);
      }
      acc[day].count += 1;
      return acc;
    }, {} as Record<string, { income: number; expenses: number; count: number }>);

    const weeklyData = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const week = weekStart.toISOString().substring(0, 10);
      if (!acc[week]) {
        acc[week] = { income: 0, expenses: 0, count: 0 };
      }
      if (transaction.amount > 0) {
        acc[week].income += transaction.amount;
      } else {
        acc[week].expenses += Math.abs(transaction.amount);
      }
      acc[week].count += 1;
      return acc;
    }, {} as Record<string, { income: number; expenses: number; count: number }>);

    const monthlyData = transactions.reduce((acc, transaction) => {
      const month = transaction.date.substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0, count: 0 };
      }
      if (transaction.amount > 0) {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expenses += Math.abs(transaction.amount);
      }
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, { income: number; expenses: number; count: number }>);

    // Largest transactions
    const largestExpenses = transactions
      .filter(t => t.amount < 0)
      .sort((a, b) => a.amount - b.amount)
      .slice(0, 5);

    const largestIncome = transactions
      .filter(t => t.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalIncome,
      totalExpenses,
      netAmount,
      primaryCurrency,
      currencies,
      categoryTotals,
      dailyData,
      weeklyData,
      monthlyData,
      largestExpenses,
      largestIncome,
      transactionCount: transactions.length
    };
  }, [transactions]);

  const getFilteredChartData = useMemo(() => {
    let data: any[] = [];
    
    switch (chartFilter) {
      case 'category':
        if (selectedCategory === 'all') {
          data = Object.entries(analysis.categoryTotals).map(([category, values]) => ({
            name: category,
            income: values.income,
            expenses: values.expenses,
            net: values.total
          }));
        } else {
          const categoryData = analysis.categoryTotals[selectedCategory];
          if (categoryData) {
            data = [{
              name: selectedCategory,
              income: categoryData.income,
              expenses: categoryData.expenses,
              net: categoryData.total
            }];
          }
        }
        break;
      case 'daily':
        data = Object.entries(analysis.dailyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, values]) => ({
            name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            income: values.income,
            expenses: values.expenses,
            net: values.income - values.expenses
          }));
        break;
      case 'weekly':
        data = Object.entries(analysis.weeklyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([week, values]) => ({
            name: `Week of ${new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            income: values.income,
            expenses: values.expenses,
            net: values.income - values.expenses
          }));
        break;
      case 'monthly':
        data = Object.entries(analysis.monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, values]) => ({
            name: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            income: values.income,
            expenses: values.expenses,
            net: values.income - values.expenses
          }));
        break;
      case 'income':
        data = transactions
          .filter(t => t.amount > 0)
          .reduce((acc, t) => {
            const category = t.category;
            const existing = acc.find(item => item.name === category);
            if (existing) {
              existing.income += t.amount;
            } else {
              acc.push({ name: category, income: t.amount, expenses: 0, net: t.amount });
            }
            return acc;
          }, [] as any[]);
        break;
      case 'expenses':
        data = transactions
          .filter(t => t.amount < 0)
          .reduce((acc, t) => {
            const category = t.category;
            const existing = acc.find(item => item.name === category);
            if (existing) {
              existing.expenses += Math.abs(t.amount);
            } else {
              acc.push({ name: category, income: 0, expenses: Math.abs(t.amount), net: -Math.abs(t.amount) });
            }
            return acc;
          }, [] as any[]);
        break;
      default:
        data = Object.entries(analysis.monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, values]) => ({
            name: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            income: values.income,
            expenses: values.expenses,
            net: values.income - values.expenses
          }));
    }
    
    return data;
  }, [chartFilter, selectedCategory, analysis]);

  const getComparisonData = useMemo(() => {
    const data = Object.entries(analysis.monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => {
        const date = new Date(month + '-01');
        return {
          period: date.toLocaleDateString('en-US', { 
            month: 'short', 
            year: comparisonPeriod === 'year' ? 'numeric' : '2-digit' 
          }),
          income: values.income,
          expenses: values.expenses,
          net: values.income - values.expenses,
          transactions: values.count
        };
      });

    if (comparisonPeriod === 'quarter') {
      // Group by quarters
      const quarterData: Record<string, any> = {};
      data.forEach(item => {
        const date = new Date(item.period + ' 1, 2024');
        const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
        if (!quarterData[quarter]) {
          quarterData[quarter] = { period: quarter, income: 0, expenses: 0, net: 0, transactions: 0 };
        }
        quarterData[quarter].income += item.income;
        quarterData[quarter].expenses += item.expenses;
        quarterData[quarter].net += item.net;
        quarterData[quarter].transactions += item.transactions;
      });
      return Object.values(quarterData);
    }

    return data;
  }, [analysis.monthlyData, comparisonPeriod]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [transactions, sortBy, sortOrder]);

  const downloadCsv = () => {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace('.csv', '')}_analyzed.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Salary: "bg-gradient-success text-success-foreground",
      Rent: "bg-destructive/10 text-destructive",
      Groceries: "bg-accent/20 text-accent-foreground",
      Transport: "bg-primary/10 text-primary",
      Utilities: "bg-warning/10 text-warning",
      Dining: "bg-secondary text-secondary-foreground",
      Subscriptions: "bg-muted text-muted-foreground",
      Miscellaneous: "bg-muted text-muted-foreground",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const formatCurrency = (amount: number) => {
    const currency = analysis.primaryCurrency || 'USD';
    const currencySymbols = {
      'USD': '$',
      'GBP': '£', 
      'EUR': '€',
      'JPY': '¥',
      'INR': '₹'
    };
    
    const symbol = currencySymbols[currency as keyof typeof currencySymbols] || '$';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const categories = Object.keys(analysis.categoryTotals);

  return (
    <div className="space-y-6">
      {/* Header with Upload Another and Document Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Analysis</h2>
          <p className="text-muted-foreground">
            Analysis of {analysis.transactionCount} transactions from {fileName}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Document Selector */}
          {uploadedFiles.length > 1 && (
            <Select
              value={fileName}
              onValueChange={(value) => {
                const selectedFile = uploadedFiles.find(f => f.name === value);
                if (selectedFile && selectedFile.csvData) {
                  onDocumentSelect(selectedFile.csvData, selectedFile.name);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[250px]">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <SelectValue placeholder="Select document" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {uploadedFiles.map((file) => (
                  <SelectItem key={file.id} value={file.name}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="truncate">{file.name}</span>
                      {file.transactionCount && (
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {file.transactionCount}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Upload Another Button */}
          <Button 
            onClick={onUploadAnother}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Another
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-success flex items-center justify-center">
                <TrendingUp className="text-success-foreground text-sm" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(analysis.totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="text-destructive text-sm" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(analysis.totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                analysis.netAmount >= 0 ? 'bg-gradient-success' : 'bg-destructive/10'
              }`}>
                <DollarSign className={`text-sm ${
                  analysis.netAmount >= 0 ? 'text-success-foreground' : 'text-destructive'
                }`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Amount</p>
                <p className={`text-2xl font-bold ${
                  analysis.netAmount >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {formatCurrency(analysis.netAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="text-primary text-sm" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-primary">{analysis.transactionCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="comparison">Compare</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          {/* Chart Filters */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Chart Filters
              </CardTitle>
              <CardDescription>Customize your data visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">View Type</label>
                  <Select value={chartFilter} onValueChange={(value: FilterType) => setChartFilter(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Data</SelectItem>
                      <SelectItem value="category">By Category</SelectItem>
                      <SelectItem value="daily">Daily Transactions</SelectItem>
                      <SelectItem value="weekly">Weekly Summary</SelectItem>
                      <SelectItem value="monthly">Monthly Summary</SelectItem>
                      <SelectItem value="income">Income Only</SelectItem>
                      <SelectItem value="expenses">Expenses Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {chartFilter === 'category' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Filtered Bar Chart */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {chartFilter === 'all' ? 'Monthly Overview' : 
                   chartFilter === 'category' ? 'Category Analysis' :
                   chartFilter === 'daily' ? 'Daily Transactions' :
                   chartFilter === 'weekly' ? 'Weekly Summary' :
                   chartFilter === 'monthly' ? 'Monthly Summary' :
                   chartFilter === 'income' ? 'Income by Category' :
                   'Expenses by Category'}
                </CardTitle>
                <CardDescription>
                  {chartFilter === 'income' ? 'Income breakdown' : 
                   chartFilter === 'expenses' ? 'Expense breakdown' : 
                   'Income vs expenses comparison'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={getFilteredChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          formatCurrency(value), 
                          name === 'income' ? 'Income' : 
                          name === 'expenses' ? 'Expenses' : 'Net'
                        ]}
                      />
                      <Legend />
                      {chartFilter !== 'expenses' && <Bar dataKey="income" fill="hsl(var(--success))" name="Income" />}
                      {chartFilter !== 'income' && <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />}
                      {(chartFilter === 'all' || chartFilter === 'category' || chartFilter === 'daily' || chartFilter === 'weekly' || chartFilter === 'monthly') && (
                        <Line type="monotone" dataKey="net" stroke="hsl(var(--primary))" name="Net" strokeWidth={2} />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Pie Chart */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Expense Distribution
                </CardTitle>
                <CardDescription>Visual breakdown of your expense categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <RechartsPieChart 
                        data={Object.entries(analysis.categoryTotals)
                          .filter(([,data]) => data.expenses > 0)
                          .map(([category, data], index) => ({
                            name: category,
                            value: data.expenses,
                            fill: [
                              "hsl(var(--primary))",
                              "hsl(var(--destructive))", 
                              "hsl(var(--warning))",
                              "hsl(var(--success))",
                              "hsl(var(--secondary))",
                              "hsl(var(--accent))"
                            ][index % 6]
                          }))
                        }
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {Object.entries(analysis.categoryTotals)
                          .filter(([,data]) => data.expenses > 0)
                          .map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={[
                                "hsl(var(--primary))",
                                "hsl(var(--destructive))", 
                                "hsl(var(--warning))",
                                "hsl(var(--success))",
                                "hsl(var(--secondary))",
                                "hsl(var(--accent))"
                              ][index % 6]}
                            />
                          ))
                        }
                      </RechartsPieChart>
                      <Tooltip 
                        formatter={(value: any) => [formatCurrency(value), 'Amount']}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compare className="h-5 w-5" />
                Period Comparison
              </CardTitle>
              <CardDescription>Compare your financial data across different time periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label className="text-sm font-medium">Comparison Period</label>
                <Select value={comparisonPeriod} onValueChange={(value: ComparisonPeriod) => setComparisonPeriod(value)}>
                  <SelectTrigger className="w-[180px] mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="quarter">Quarterly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={getComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'transactions' ? value : formatCurrency(value), 
                        name === 'income' ? 'Income' : 
                        name === 'expenses' ? 'Expenses' : 
                        name === 'net' ? 'Net Amount' : 'Transactions'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="income" fill="hsl(var(--success))" name="Income" />
                    <Bar yAxisId="left" dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
                    <Line yAxisId="left" type="monotone" dataKey="net" stroke="hsl(var(--primary))" name="Net Amount" strokeWidth={3} />
                    <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="hsl(var(--warning))" name="Transactions" strokeWidth={2} strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Comparison Summary */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {getComparisonData.slice(-3).map((period, index) => (
                  <Card key={period.period} className="border">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-center mb-2">{period.period}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Income:</span>
                          <span className="text-success font-medium">{formatCurrency(period.income)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expenses:</span>
                          <span className="text-destructive font-medium">{formatCurrency(period.expenses)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span>Net:</span>
                          <span className={`font-bold ${period.net >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatCurrency(period.net)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transactions:</span>
                          <span className="text-muted-foreground">{period.transactions}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Financial Insights
              </CardTitle>
              <CardDescription>
                Intelligent analysis of your spending patterns and personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Spending Pattern Analysis */}
              <div className="p-4 bg-gradient-subtle rounded-lg border">
                <h4 className="font-semibold mb-2 text-primary">Spending Pattern Analysis</h4>
                <div className="space-y-2 text-sm">
                  <p>• Your largest expense category is <strong>{Object.entries(analysis.categoryTotals)
                    .filter(([,data]) => data.expenses > 0)
                    .sort(([,a], [,b]) => b.expenses - a.expenses)[0]?.[0] || 'N/A'}</strong> representing {
                    Object.entries(analysis.categoryTotals)
                    .filter(([,data]) => data.expenses > 0)
                    .length > 0 ? 
                    ((Object.entries(analysis.categoryTotals)
                      .filter(([,data]) => data.expenses > 0)
                      .sort(([,a], [,b]) => b.expenses - a.expenses)[0]?.[1]?.expenses || 0) / analysis.totalExpenses * 100).toFixed(1)
                    : '0'
                  }% of total expenses</p>
                  <p>• You have {analysis.transactionCount} transactions with an average transaction amount of {formatCurrency(
                    transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length || 0
                  )}</p>
                  <p>• Your spending-to-income ratio is {analysis.totalIncome > 0 ? (analysis.totalExpenses / analysis.totalIncome * 100).toFixed(1) : '0'}%</p>
                </div>
              </div>

              {/* Financial Health Score */}
              <div className="p-4 bg-gradient-subtle rounded-lg border">
                <h4 className="font-semibold mb-2 text-success">Financial Health Score</h4>
                <div className="flex items-center gap-4 mb-2">
                  <div className="text-3xl font-bold text-success">
                    {Math.max(0, Math.min(100, Math.round(
                      (analysis.netAmount > 0 ? 40 : 20) + 
                      (analysis.totalExpenses / analysis.totalIncome < 0.8 ? 30 : 10) +
                      (Object.keys(analysis.categoryTotals).length > 3 ? 20 : 10) +
                      (analysis.transactionCount > 10 ? 10 : 5)
                    )))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Based on income consistency, expense management, and transaction diversity</p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-4 bg-gradient-subtle rounded-lg border">
                <h4 className="font-semibold mb-2 text-warning">Smart Recommendations</h4>
                <div className="space-y-2 text-sm">
                  {analysis.netAmount < 0 && (
                    <p>• ⚠️ Your expenses exceed income. Consider reviewing discretionary spending categories.</p>
                  )}
                  {Object.entries(analysis.categoryTotals)
                    .filter(([,data]) => data.expenses > analysis.totalExpenses * 0.3)
                    .map(([category]) => (
                      <p key={category}>• 💡 Consider setting a budget for {category} as it represents a significant portion of your expenses.</p>
                    ))}
                  {analysis.totalExpenses / analysis.totalIncome > 0.8 && analysis.totalIncome > 0 && (
                    <p>• 📊 Your spending rate is high. Aim to save at least 20% of your income for better financial stability.</p>
                  )}
                  {Object.keys(analysis.categoryTotals).length < 4 && (
                    <p>• 📈 Consider diversifying your expense tracking by using more specific categories for better insights.</p>
                  )}
                </div>
              </div>

              {/* Trend Analysis */}
              <div className="p-4 bg-gradient-subtle rounded-lg border">
                <h4 className="font-semibold mb-2 text-primary">Trend Analysis</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(analysis.monthlyData).length > 1 && (
                    <>
                      <p>• 📅 Analyzing {Object.entries(analysis.monthlyData).length} months of data</p>
                      <p>• 📊 Average monthly expenses: {formatCurrency(
                        Object.values(analysis.monthlyData).reduce((sum, data) => sum + data.expenses, 0) / 
                        Object.values(analysis.monthlyData).length
                      )}</p>
                      <p>• 💰 Average monthly income: {formatCurrency(
                        Object.values(analysis.monthlyData).reduce((sum, data) => sum + data.income, 0) / 
                        Object.values(analysis.monthlyData).length
                      )}</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Largest Expenses</CardTitle>
                <CardDescription>Top 5 expense transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.largestExpenses.map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                      </div>
                      <p className="font-bold text-destructive">{formatCurrency(transaction.amount)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Largest Income</CardTitle>
                <CardDescription>Top 5 income transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.largestIncome.map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                      </div>
                      <p className="font-bold text-success">{formatCurrency(transaction.amount)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Breakdown of expenses and income by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analysis.categoryTotals)
                  .sort(([,a], [,b]) => Math.abs(b.total) - Math.abs(a.total))
                  .map(([category, data]) => (
                  <div key={category} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge className={getCategoryColor(category)}>
                        {category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {data.count} transactions
                      </span>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${data.total >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(data.total)}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {data.income > 0 && <span className="text-success">+{formatCurrency(data.income)}</span>}
                        {data.income > 0 && data.expenses > 0 && <span> / </span>}
                        {data.expenses > 0 && <span className="text-destructive">-{formatCurrency(data.expenses)}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>Income and expenses by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analysis.monthlyData)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([month, data]) => (
                  <div key={month} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                      <p className="text-sm text-muted-foreground">{data.count} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">+{formatCurrency(data.income)}</p>
                      <p className="font-bold text-destructive">-{formatCurrency(data.expenses)}</p>
                      <p className={`text-sm font-medium ${(data.income - data.expenses) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        Net: {formatCurrency(data.income - data.expenses)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Transactions</span>
                <Button onClick={downloadCsv} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </CardTitle>
              <CardDescription>
                Complete list of transactions from {fileName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={sortBy === 'date' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (sortBy === 'date') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('date');
                      setSortOrder('desc');
                    }
                  }}
                >
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  variant={sortBy === 'amount' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (sortBy === 'amount') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('amount');
                      setSortOrder('desc');
                    }
                  }}
                >
                  Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  variant={sortBy === 'category' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (sortBy === 'category') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('category');
                      setSortOrder('asc');
                    }
                  }}
                >
                  Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </div>
              
              <div className="rounded-md border max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTransactions.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{formatDate(transaction.date)}</TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                        <TableCell className={`text-right font-bold ${
                          transaction.amount >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(transaction.category)}>
                            {transaction.category}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};