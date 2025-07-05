import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { Transaction } from "@/utils/csvProcessor";

interface DataAnalyzerProps {
  transactions: Transaction[];
  csvData: string;
  fileName: string;
}

export const DataAnalyzer = ({ transactions, csvData, fileName }: DataAnalyzerProps) => {
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const analysis = useMemo(() => {
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netAmount = totalIncome - totalExpenses;
    
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

    // Monthly breakdown
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
      categoryTotals,
      monthlyData,
      largestExpenses,
      largestIncome,
      transactionCount: transactions.length
    };
  }, [transactions]);

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

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