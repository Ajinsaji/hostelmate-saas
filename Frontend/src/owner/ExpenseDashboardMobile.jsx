import { useState, memo } from "react";
import {
  Search,
  Plus,
  Receipt,
  X,
  Trash2
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";

export const ExpenseDashboardMobile = memo(function ExpenseDashboardMobile({
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
  const { colors } = useTheme();
  const [wizardStep, setWizardStep] = useState(1);

  const openAddWizard = () => {
    setWizardStep(1);
    setShowAddExpenseModal(true);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "24px",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      {/* 1. Header & Title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
            Expenses
          </h1>
          <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Total spent: ₹{totalExpenseSum.toLocaleString()}
          </p>
        </div>

        <button
          onClick={openAddWizard}
          style={{
            background: "#22C55E",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "14px",
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            minHeight: "44px",
            boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
          }}
        >
          <Plus size={20} />
          <span>Add</span>
        </button>
      </div>

      {/* 2. Mobile Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          background: colors.background.card || "#131C2E",
          border: `1px solid ${colors.border.default || "#202B45"}`,
          borderRadius: "14px",
        }}
      >
        <Search size={22} style={{ color: colors.text.secondary || "#94A3B8" }} />
        <input
          type="text"
          placeholder="Search expenses by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#FFFFFF",
            fontSize: "14px",
            width: "100%",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 3. Category Filter Chips */}
      {categories.length > 0 && (
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          <button
            onClick={() => setFilterCategory("")}
            style={{
              background: !filterCategory ? "#22C55E" : colors.background.card || "#131C2E",
              color: !filterCategory ? "#FFFFFF" : colors.text.secondary || "#94A3B8",
              border: `1px solid ${!filterCategory ? "#22C55E" : colors.border.default || "#202B45"}`,
              borderRadius: "9999px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: !filterCategory ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              minHeight: "44px",
            }}
          >
            All Categories
          </button>
          {categories.map((c) => {
            const isSel = filterCategory === c._id;
            return (
              <button
                key={c._id}
                onClick={() => setFilterCategory(isSel ? "" : c._id)}
                style={{
                  background: isSel ? "#22C55E" : colors.background.card || "#131C2E",
                  color: isSel ? "#FFFFFF" : colors.text.secondary || "#94A3B8",
                  border: `1px solid ${isSel ? "#22C55E" : colors.border.default || "#202B45"}`,
                  borderRadius: "9999px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: isSel ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  minHeight: "44px",
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Vertically Stacked Mobile Expense Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: colors.text.secondary || "#94A3B8", fontSize: "14px" }}>
            Loading expense ledger...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              background: colors.background.card || "#131C2E",
              borderRadius: "16px",
              border: `1px solid ${colors.border.default || "#202B45"}`,
              color: colors.text.secondary || "#94A3B8",
            }}
          >
            No expenses found. Tap <strong>Add</strong> to record a purchase.
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const amount = exp.netAmount || exp.amount || 0;
            const categoryName = exp.categoryId?.name || exp.category || "General";
            const dateStr = exp.createdAt ? exp.createdAt.slice(0, 10) : "Today";

            return (
              <div
                key={exp._id}
                style={{
                  background: colors.background.card || "#131C2E",
                  border: `1px solid ${colors.border.default || "#202B45"}`,
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.12)", color: "#F59E0B" }}>
                      <Receipt size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>{exp.title}</div>
                      <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
                        {categoryName} • {dateStr}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#EF4444" }}>
                    -₹{amount.toLocaleString()}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                    Method: {exp.paymentMethod || "UPI"}
                  </span>
                  <button
                    onClick={() => handleDeleteExpense(exp._id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#EF4444",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      minHeight: "44px",
                    }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4-STEP WIZARD RECORD EXPENSE MODAL */}
      {showAddExpenseModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              background: colors.background.primary || "#0B1220",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              padding: "24px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
                  Record Expense (Step {wizardStep} of 3)
                </h3>
                <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "2px 0 0" }}>
                  {wizardStep === 1 && "Title & Amount"}
                  {wizardStep === 2 && "Category & Method"}
                  {wizardStep === 3 && "Review & Complete"}
                </p>
              </div>

              <button
                onClick={() => setShowAddExpenseModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  color: "#94A3B8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ width: "100%", height: "6px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "9999px" }}>
              <div
                style={{
                  width: `${(wizardStep / 3) * 100}%`,
                  height: "100%",
                  background: "#22C55E",
                  borderRadius: "9999px",
                  transition: "width 200ms ease",
                }}
              />
            </div>

            {wizardStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Expense Title *</label>
                  <input
                    type="text"
                    required
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                    placeholder="e.g. Electricity Bill or Plumbing Repair"
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="Enter amount spent"
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Expense Category</label>
                  <select
                    value={expenseForm.categoryId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  >
                    <option value="">General / Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Payment Method</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  >
                    <option value="UPI">UPI / PhonePe / GPay</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#131C2E", padding: "16px", borderRadius: "14px", border: "1px solid #202B45" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFF" }}>Confirm Expense</div>
                <div style={{ fontSize: "13px", color: "#94A3B8" }}>Title: <span style={{ color: "#FFF", fontWeight: 700 }}>{expenseForm.title}</span></div>
                <div style={{ fontSize: "13px", color: "#94A3B8" }}>Amount: <span style={{ color: "#EF4444", fontWeight: 700 }}>₹{expenseForm.amount}</span></div>
                <div style={{ fontSize: "13px", color: "#94A3B8" }}>Method: <span style={{ color: "#FFF", fontWeight: 700 }}>{expenseForm.paymentMethod}</span></div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px" }}>
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#FFF",
                    border: "1px solid #202B45",
                    borderRadius: "12px",
                    padding: "10px 16px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    minHeight: "44px",
                  }}
                >
                  Back
                </button>
              ) : <div />}

              {wizardStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => Math.min(3, prev + 1))}
                  style={{
                    background: "#22C55E",
                    color: "#FFF",
                    border: "none",
                    borderRadius: "12px",
                    padding: "10px 20px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    minHeight: "44px",
                  }}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateExpense}
                  style={{
                    background: "#22C55E",
                    color: "#FFF",
                    border: "none",
                    borderRadius: "12px",
                    padding: "10px 24px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    minHeight: "44px",
                  }}
                >
                  Record Expense
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ExpenseDashboardMobile;
