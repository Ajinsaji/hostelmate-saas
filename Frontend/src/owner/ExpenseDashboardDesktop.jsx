import { memo } from "react";
import {
  Receipt,
  TrendingDown,
  Plus,
  Trash2,
  Building2
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";
import {
  MetricCard,
  Button,
  Input,
  SearchBox,
  Table,
  TableRow,
  TableCell,
  SkeletonLoader,
  EmptyState,
  Modal
} from "../design-system/components";

export const ExpenseDashboardDesktop = memo(function ExpenseDashboardDesktop({
  expenses,
  filteredExpenses,
  totalExpenseSum,
  loading,
  search,
  setSearch,
  filterCategory,
  setFilterCategory,
  categories,
  vendors,
  showAddExpenseModal,
  setShowAddExpenseModal,
  expenseForm,
  setExpenseForm,
  handleCreateExpense,
  handleDeleteExpense,
}) {
  const { colors, typography } = useTheme();

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 style={{ fontSize: typography.sizes["2xl"] || "24px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
            Enterprise Expense Management
          </h1>
          <p style={{ fontSize: typography.sizes.sm || "14px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Track operational bills, vendor purchases, and monthly budgets
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => setShowAddExpenseModal(true)}>
          Record Expense
        </Button>
      </div>

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard
          title="Total Expenses"
          value={`₹${totalExpenseSum.toLocaleString()}`}
          icon={TrendingDown}
          trend="Outflow"
          trendDirection="down"
        />
        <MetricCard
          title="Recorded Bills"
          value={(expenses.length || 0).toString()}
          icon={Receipt}
        />
        <MetricCard
          title="Active Vendors"
          value={(vendors.length || 0).toString()}
          icon={Building2}
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBox
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expense title..."
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-xl border text-xs font-bold bg-[#1A2438] text-white"
          style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.categoryName}</option>
          ))}
        </select>
      </div>

      {/* 4. Desktop Table View */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <SkeletonLoader key={n} height="72px" />
          ))}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          title="No Expense Records Found"
          description="There are no expenses matching your search query."
          action={{
            label: "Record Expense",
            onClick: () => setShowAddExpenseModal(true)
          }}
        />
      ) : (
        <Table headers={["Expense Title", "Category & Vendor", "Date", "Amount", "Actions"]}>
          {filteredExpenses.map((exp) => (
            <TableRow key={exp._id}>
              <TableCell>
                <div className="font-bold">{exp.title}</div>
                <div className="text-xs text-slate-400">{exp.expenseNumber || 'EXP-001'}</div>
              </TableCell>
              <TableCell>
                <div>{exp.categoryId?.categoryName || "General"}</div>
                <div className="text-xs text-slate-400">Vendor: {exp.vendorId?.vendorName || "Direct"}</div>
              </TableCell>
              <TableCell>{new Date(exp.expenseDate || Date.now()).toLocaleDateString()}</TableCell>
              <TableCell>
                <span className="font-bold text-rose-400">₹{(exp.netAmount || exp.amount || 0).toLocaleString()}</span>
              </TableCell>
              <TableCell>
                <button
                  onClick={() => handleDeleteExpense(exp._id)}
                  className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                  title="Delete Expense"
                >
                  <Trash2 size={16} />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* 5. Add Expense Modal */}
      <Modal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        title="Record New Expense"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <Input
            label="Expense Title"
            required
            placeholder="e.g. Electricity Bill, Kitchen Grocery"
            value={expenseForm.title}
            onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Category</label>
              <select
                value={expenseForm.categoryId}
                onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
                className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white"
                style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
              >
                <option value="">General Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.categoryName}</option>
                ))}
              </select>
            </div>

            <Input
              label="Amount (₹)"
              type="number"
              required
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: colors.border.default || "#202B45" }}>
            <Button variant="secondary" fullWidth onClick={() => setShowAddExpenseModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Record Expense
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
});

export default ExpenseDashboardDesktop;
