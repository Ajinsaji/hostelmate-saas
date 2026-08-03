/**
 * HostelMate Enterprise — Data-driven Menu Configurations
 * 
 * Icon names are strings that map to lucide-react icon components.
 * The layout components resolve them dynamically.
 */

export const ownerMenuItems = [
  { section: 'Main', items: [
    { key: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/owner/dashboard' },
    { key: 'rooms', label: 'Rooms', icon: 'BedDouble', href: '/rooms' },
    { key: 'residents', label: 'Residents', icon: 'Users', href: '/residents' },
    { key: 'admissions', label: 'Admissions', icon: 'UserPlus', href: '/owner/pending-admissions' },
  ]},
  { section: 'Finance', items: [
    { key: 'payments', label: 'Payments', icon: 'Wallet', href: '/payments' },
    { key: 'rent', label: 'Rent Collection', icon: 'IndianRupee', href: '/owner/rent-dashboard' },
    { key: 'expenses', label: 'Expenses', icon: 'Receipt', href: '/owner/expense-dashboard' },
    { key: 'billing', label: 'Subscription', icon: 'CreditCard', href: '/owner/billing' },
  ]},
  { section: 'Operations', items: [
    { key: 'kitchen', label: 'Kitchen', icon: 'ChefHat', href: '/owner/kitchen-dashboard' },
    { key: 'attendance', label: 'Attendance', icon: 'ClipboardList', href: '/owner/attendance' },
    { key: 'staff', label: 'Staff', icon: 'UserCog', href: '/owner/staff-management' },
    { key: 'payroll', label: 'Payroll', icon: 'Banknote', href: '/owner/payroll' },
  ]},
  { section: 'Intelligence', items: [
    { key: 'reports', label: 'Reports', icon: 'FileText', href: '/reports' },
    { key: 'bi', label: 'Analytics', icon: 'BarChart3', href: '/owner/business-intelligence' },
    { key: 'ai', label: 'AI Insights', icon: 'Sparkles', href: '/owner/ai-insights' },
  ]},
  { section: 'Account', items: [
    { key: 'settings', label: 'Settings', icon: 'Settings', href: '/owner/settings' },
    { key: 'profile', label: 'Profile', icon: 'User', href: '/owner/profile' },
  ]},
];

export const ownerMobileItems = [
  { key: 'home', label: 'Home', icon: 'Home', href: '/owner/dashboard' },
  { key: 'rooms', label: 'Rooms', icon: 'BedDouble', href: '/rooms' },
  { key: 'residents', label: 'Residents', icon: 'Users', href: '/residents' },
  { key: 'payments', label: 'Payments', icon: 'Wallet', href: '/payments' },
  { key: 'profile', label: 'Profile', icon: 'User', href: '/owner/profile' },
];

export const wardenMenuItems = [
  { section: 'Main', items: [
    { key: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/warden/dashboard' },
    { key: 'rooms', label: 'Rooms', icon: 'BedDouble', href: '/rooms' },
    { key: 'residents', label: 'Residents', icon: 'Users', href: '/residents' },
    { key: 'attendance', label: 'Attendance', icon: 'ClipboardList', href: '/warden/attendance' },
  ]},
];

export const wardenMobileItems = [
  { key: 'home', label: 'Home', icon: 'Home', href: '/warden/dashboard' },
  { key: 'rooms', label: 'Rooms', icon: 'BedDouble', href: '/rooms' },
  { key: 'residents', label: 'Residents', icon: 'Users', href: '/residents' },
  { key: 'attendance', label: 'Attendance', icon: 'ClipboardList', href: '/warden/attendance' },
];

export const cookMenuItems = [
  { section: 'Main', items: [
    { key: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/cook/dashboard' },
    { key: 'kitchen', label: 'Kitchen', icon: 'ChefHat', href: '/cook/kitchen' },
    { key: 'menu', label: 'Menu', icon: 'UtensilsCrossed', href: '/cook/menu' },
  ]},
];

export const cookMobileItems = [
  { key: 'home', label: 'Home', icon: 'Home', href: '/cook/dashboard' },
  { key: 'kitchen', label: 'Kitchen', icon: 'ChefHat', href: '/cook/kitchen' },
  { key: 'menu', label: 'Menu', icon: 'UtensilsCrossed', href: '/cook/menu' },
];

export const accountantMenuItems = [
  { section: 'Main', items: [
    { key: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/accountant/dashboard' },
    { key: 'payments', label: 'Payments', icon: 'Wallet', href: '/accountant/payments' },
    { key: 'expenses', label: 'Expenses', icon: 'Receipt', href: '/accountant/expenses' },
    { key: 'reports', label: 'Reports', icon: 'FileText', href: '/accountant/reports' },
  ]},
];

export const accountantMobileItems = [
  { key: 'home', label: 'Home', icon: 'Home', href: '/accountant/dashboard' },
  { key: 'payments', label: 'Payments', icon: 'Wallet', href: '/accountant/payments' },
  { key: 'expenses', label: 'Expenses', icon: 'Receipt', href: '/accountant/expenses' },
  { key: 'reports', label: 'Reports', icon: 'FileText', href: '/accountant/reports' },
];

export const residentMenuItems = [
  { section: 'Main', items: [
    { key: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/resident/dashboard' },
    { key: 'payments', label: 'Payments', icon: 'Wallet', href: '/resident/payments' },
    { key: 'complaints', label: 'Complaints', icon: 'MessageSquare', href: '/resident/complaints' },
    { key: 'profile', label: 'Profile', icon: 'User', href: '/resident/profile' },
  ]},
];

export const residentMobileItems = [
  { key: 'home', label: 'Home', icon: 'Home', href: '/resident/dashboard' },
  { key: 'payments', label: 'Payments', icon: 'Wallet', href: '/resident/payments' },
  { key: 'complaints', label: 'Complaints', icon: 'MessageSquare', href: '/resident/complaints' },
  { key: 'profile', label: 'Profile', icon: 'User', href: '/resident/profile' },
];

/**
 * Utility to get menu config by role string
 */
export function getMenuConfig(role) {
  switch (role) {
    case 'owner': return { sidebar: ownerMenuItems, mobile: ownerMobileItems };
    case 'warden': return { sidebar: wardenMenuItems, mobile: wardenMobileItems };
    case 'cook': return { sidebar: cookMenuItems, mobile: cookMobileItems };
    case 'accountant': return { sidebar: accountantMenuItems, mobile: accountantMobileItems };
    case 'resident': return { sidebar: residentMenuItems, mobile: residentMobileItems };
    default: return { sidebar: ownerMenuItems, mobile: ownerMobileItems };
  }
}
