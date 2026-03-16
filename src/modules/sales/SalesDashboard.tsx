'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  TrendingUp,
  Users,
  Package,
  FileText,
  Clock,
  CheckCircle,
  Truck,
  IndianRupee,
  Plus,
  Trash2,
  ListTodo,
} from 'lucide-react';
import { database } from '@/services/firebase';
import { ref, onValue, set } from 'firebase/database';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: string;
}

export default function SalesDashboard() {
  const [stats, setStats] = useState({
    totalQuotations: 0,
    totalQuotationsThisMonth: 0,
    totalSalesOrders: 0,
    totalInvoices: 0,
    pendingQuotations: 0,
    pendingOrders: 0,
    ordersInQC: 0,
    ordersReadyForDispatch: 0,
    outstandingPayments: 0,
    topCustomers: [] as { name: string; amount: number }[],
    topProducts: [] as { name: string; qty: number }[],
    conversionRate: 0,
  });

  // TODO List State
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');

  // Load TODOs from Firebase
  useEffect(() => {
    const todoRef = ref(database, 'todos/sales');
    const unsubscribe = onValue(todoRef, (snap) => {
      const data = snap.val();
      if (data) {
        const todoList = Object.values(data) as TodoItem[];
        setTodos(todoList.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setTodos([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Save TODOs to Firebase
  const saveTodos = (updatedTodos: TodoItem[]) => {
    const todoRef = ref(database, 'todos/sales');
    const todoObj: Record<string, TodoItem> = {};
    updatedTodos.forEach(todo => {
      todoObj[todo.id] = todo;
    });
    set(todoRef, todoObj);
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const todo: TodoItem = {
      id: `todo-${Date.now()}`,
      text: newTodo.trim(),
      completed: false,
      createdAt: Date.now(),
      dueDate: newTodoDueDate || undefined,
    };
    const updated = [todo, ...todos];
    setTodos(updated);
    saveTodos(updated);
    setNewTodo('');
    setNewTodoDueDate('');
  };

  const toggleTodo = (id: string) => {
    const updated = todos.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTodos(updated);
    saveTodos(updated);
  };

  const deleteTodo = (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    saveTodos(updated);
  };

  useEffect(() => {
    const qRef = ref(database, 'sales/quotations');
    const oaRef = ref(database, 'sales/orderAcknowledgements');
    const invRef = ref(database, 'sales/invoices');

    const unsubscribeQ = onValue(qRef, (snap) => {
      const data = snap.val() || {};
      const arr = Object.values(data);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const qThisMonth = arr.filter((q: any) => {
        if (!q.quoteDate) return false;
        const d = new Date(q.quoteDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const pending = arr.filter(
        (q: any) => q.status === 'Draft' || q.status === 'Sent'
      );

      const approved = arr.filter(
        (q: any) => q.status === 'Accepted' || q.status === 'Approved'
      ).length;

      setStats((prev) => ({
        ...prev,
        totalQuotations: arr.length,
        totalQuotationsThisMonth: qThisMonth.length,
        pendingQuotations: pending.length,
        conversionRate: arr.length > 0 ? (approved / arr.length) * 100 : 0,
      }));
    });

    const unsubscribeOA = onValue(oaRef, (snap) => {
      const data = snap.val() || {};
      const orders = Object.values(data);

      const pendingOrders = orders.filter(
        (o: any) => o.status === 'Draft' || o.status === 'In Production'
      );

      const qcOrders = orders.filter((o: any) => {
        // qc items are inside order.items
        if (!o.items) return false;
        return o.items.some((i: any) => i.okQty === 0 || i.notOkQty > 0);
      });

      const ready = orders.filter(
        (o: any) => o.status === 'Ready for Dispatch'
      );

      // Collect product qty for "Top Products"
      const productMap = new Map<string, number>();
      orders.forEach((o: any) => {
        (o.items || []).forEach((i: any) => {
          const current = productMap.get(i.productDescription || i.sku) || 0;
          productMap.set(
            i.productDescription || i.sku,
            current + (i.qty || i.okQty || 0)
          );
        });
      });

      const topProducts = Array.from(productMap.entries())
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      setStats((prev) => ({
        ...prev,
        totalSalesOrders: orders.length,
        pendingOrders: pendingOrders.length,
        ordersInQC: qcOrders.length,
        ordersReadyForDispatch: ready.length,
        topProducts,
      }));
    });

    const unsubscribeInv = onValue(invRef, (snap) => {
      const data = snap.val() || {};
      const invArr = Object.values(data);

      const unpaid = invArr.filter(
        (inv: any) =>
          inv.paymentStatus === 'Unpaid' || inv.paymentStatus === 'Partial'
      );

      const outstanding = unpaid.reduce((sum: number, inv: any) => {
        const paid = inv.paidAmount || 0;
        return sum + (inv.grandTotal - paid);
      }, 0);

      // Top customers
      const customerMap = new Map<string, number>();
      invArr.forEach((inv: any) => {
        const current = customerMap.get(inv.customerName) || 0;
        customerMap.set(inv.customerName, current + inv.grandTotal);
      });

      const topCustomers = Array.from(customerMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setStats((prev) => ({
        ...prev,
        totalInvoices: invArr.length,
        outstandingPayments: outstanding as number,
        topCustomers,
      }));
    });

    return () => {
      unsubscribeQ();
      unsubscribeOA();
      unsubscribeInv();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sales Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time sales performance metrics
        </p>
      </div>

      {/* ---- Top KPIs ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <Card>
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Quotations
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuotations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalQuotationsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Sales Orders
            </CardTitle>
            <Package className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSalesOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Invoices</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">Total generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Outstanding
            </CardTitle>
            <IndianRupee className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.outstandingPayments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Pending payments</p>
          </CardContent>
        </Card>
      </div>

      {/* ---- Middle Cards ---- */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

        <Card>
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Pending Quotations
            </CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingQuotations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Orders in QC</CardTitle>
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ordersInQC}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Ready for Dispatch
            </CardTitle>
            <Truck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ordersReadyForDispatch}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* ---- TODO List ---- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-blue-600" />
            Sales TODO List
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {todos.filter(t => !t.completed).length} pending
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new TODO */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              className="flex-1"
            />
            <Input
              type="date"
              value={newTodoDueDate}
              onChange={(e) => setNewTodoDueDate(e.target.value)}
              className="w-40"
            />
            <Button onClick={addTodo} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* TODO Items */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {todos.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No tasks yet. Add one above!</p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    todo.completed ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodo(todo.id)}
                  />
                  <div className={`flex-1 ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                    <span>{todo.text}</span>
                    {todo.dueDate && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        todo.completed
                          ? 'bg-green-100 text-green-700'
                          : new Date(todo.dueDate) < new Date(new Date().toISOString().split('T')[0])
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}>
                        {new Date(todo.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteTodo(todo.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
