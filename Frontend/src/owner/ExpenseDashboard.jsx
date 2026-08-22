import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";

import api from "../utils/apiClient";
import { useCurrentHostel } from "../contexts/HostelContext";
import ConfirmDialog from "../superadmin/components/modals/ConfirmDialog";

import useIsMobile from "../hooks/useIsMobile";
import ExpenseDashboardMobile from "./ExpenseDashboardMobile";
import ExpenseDashboardDesktop from "./ExpenseDashboardDesktop";

export function ExpenseDashboard() {
  const { hostel } = useCurrentHostel();
  const activeHostelId = hostel?.id || hostel?._id;
  const isMobile = useIsMobile();

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Modals
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    title: "",
    categoryId: "",
    vendorId: "",
    amount: "",
    paymentMethod: "UPI",
    status: "Paid",
    description: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [, eRes, cRes, vRes] = await Promise.all([
        api.get("/api/expense-reports/dashboard"),
        api.get("/api/expenses"),
        api.get("/api/expense-categories"),
        api.get("/api/vendors"),
      ]);

      if (eRes.data?.expenses) setExpenses(eRes.data.expenses);
      if (cRes.data?.categories) setCategories(cRes.data.categories);
      if (vRes.data?.vendors) setVendors(vRes.data.vendors);
    } catch (err) {
      console.warn("Failed to load expense data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, activeHostelId]);

  const handleCreateExpense = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) {
      return toast.error("Expense title and amount are required");
    }

    try {
      await api.post("/api/expenses", expenseForm);
      toast.success("Expense recorded successfully!");
      setShowAddExpenseModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record expense");
    }
  };

  const [deleteExpenseId, setDeleteExpenseId] = useState(null);

  const confirmDeleteExpense = async () => {
    if (!deleteExpenseId) return;
    try {
      await api.delete(`/api/expenses/${deleteExpenseId}`);
      toast.success("Expense deleted.");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete expense.");
    } finally {
      setDeleteExpenseId(null);
    }
  };

  const handleDeleteExpense = (id) => {
    setDeleteExpenseId(id);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch = !search || exp.title.toLowerCase().includes(search.toLowerCase());
      const matchesCat = !filterCategory || exp.categoryId?._id === filterCategory;
      return matchesSearch && matchesCat;
    });
  }, [expenses, search, filterCategory]);

  const totalExpenseSum = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (curr.netAmount || curr.amount || 0), 0);
  }, [expenses]);

  return (
    <>
      {isMobile ? (
        <ExpenseDashboardMobile
          hostel={hostel}
          expenses={expenses}
          filteredExpenses={filteredExpenses}
          totalExpenseSum={totalExpenseSum}
          loading={loading}
          search={search}
          setSearch={setSearch}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          categories={categories}
          vendors={vendors}
          showAddExpenseModal={showAddExpenseModal}
          setShowAddExpenseModal={setShowAddExpenseModal}
          expenseForm={expenseForm}
          setExpenseForm={setExpenseForm}
          handleCreateExpense={handleCreateExpense}
          handleDeleteExpense={handleDeleteExpense}
        />
      ) : (
        <ExpenseDashboardDesktop
          hostel={hostel}
          expenses={expenses}
          filteredExpenses={filteredExpenses}
          totalExpenseSum={totalExpenseSum}
          loading={loading}
          search={search}
          setSearch={setSearch}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          categories={categories}
          vendors={vendors}
          showAddExpenseModal={showAddExpenseModal}
          setShowAddExpenseModal={setShowAddExpenseModal}
          expenseForm={expenseForm}
          setExpenseForm={setExpenseForm}
          handleCreateExpense={handleCreateExpense}
          handleDeleteExpense={handleDeleteExpense}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteExpenseId)}
        onClose={() => setDeleteExpenseId(null)}
        onConfirm={confirmDeleteExpense}
        title="Delete Expense Record?"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
        confirmLabel="Delete Expense"
        cancelLabel="Cancel"
        isDanger={true}
      />
    </>
  );
}

export default ExpenseDashboard;
