/**
 * HostelMate Enterprise v4.0 — Grouped Navigation & Information Architecture
 * 
 * Defines structured menu hierarchies for Desktop Sidebar and 5-Tab Mobile Navigation.
 */

export const ownerMenuItems = [
  { section: 'Dashboard', items: [
    { key: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/owner/dashboard' },
  ]},
  { section: 'Operations', items: [
    { key: 'residents', label: 'Residents', icon: 'Users', href: '/residents' },
    { key: 'rooms', label: 'Rooms', icon: 'BedDouble', href: '/rooms' },
    { key: 'admissions', label: 'Admissions', icon: 'UserPlus', href: '/owner/pending-admissions' },
    { key: 'complaints', label: 'Complaints', icon: 'AlertTriangle', href: '/owner/dashboard' },
  ]},
  { section: 'Finance', items: [
    { key: 'payments', label: 'Payments', icon: 'Wallet', href: '/payments' },
    { key: 'expenses', label: 'Expenses', icon: 'Receipt', href: '/owner/expense-dashboard' },
    { key: 'reports', label: 'Reports', icon: 'FileText', href: '/reports' },
  ]},
  { section: 'Business', items: [
    { key: 'analytics', label: 'Analytics', icon: 'BarChart3', href: '/owner/business-intelligence' },
    { key: 'ai', label: 'AI Insights', icon: 'Sparkles', href: '/owner/ai-insights' },
    { key: 'storage', label: 'Storage', icon: 'HardDrive', href: '/owner/storage-center' },
  ]},
  { section: 'Workspace', items: [
    { key: 'hostels', label: 'Hostel Settings', icon: 'Building', href: '/owner/hostel-settings' },
    { key: 'staff', label: 'Staff Management', icon: 'UserCog', href: '/owner/staff-management' },
    { key: 'settings', label: 'Settings', icon: 'Settings', href: '/owner/settings' },
  ]},
  { section: 'Enterprise', items: [
    { key: 'marketplace', label: 'Marketplace', icon: 'Store', href: '/owner/marketplace' },
    { key: 'developer', label: 'Developer Console', icon: 'Code', href: '/owner/developer-console' },
    { key: 'audit', label: 'Audit Center', icon: 'ShieldCheck', href: '/owner/audit-center' },
    { key: 'backup', label: 'Backup Center', icon: 'Database', href: '/owner/backup-center' },
  ]},
];

export const ownerMobileItems = [
  { key: 'home', label: 'Home', icon: 'Home', href: '/owner/dashboard' },
  { key: 'residents', label: 'Residents', icon: 'Users', href: '/residents' },
  { key: 'fab', label: '', icon: 'Plus', href: 'fab' },
  { key: 'finance', label: 'Finance', icon: 'Wallet', href: '/payments' },
  { key: 'more', label: 'More', icon: 'Menu', href: '/owner/settings' },
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

export const adminMenuItems = [
  { section: 'Console', items: [
    { key: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/admin/dashboard' },
    { key: 'requests', label: 'Requests', icon: 'Clock', href: '/admin/requests' },
    { key: 'hostels', label: 'Hostels', icon: 'Building', href: '/admin/hostels' },
    { key: 'owners', label: 'Owners', icon: 'Users', href: '/admin/owners' },
    { key: 'residents', label: 'Residents', icon: 'Users', href: '/admin/residents' },
    { key: 'subscriptions', label: 'Subscriptions', icon: 'CreditCard', href: '/admin/subscriptions' },
    { key: 'revenue', label: 'Revenue', icon: 'IndianRupee', href: '/admin/revenue' },
    { key: 'finance', label: 'Finance', icon: 'Wallet', href: '/admin/finance' },
  ]},
  { section: 'Intelligence', items: [
    { key: 'analytics', label: 'BI Analytics', icon: 'BarChart3', href: '/admin/analytics' },
    { key: 'customer-success', label: 'Customer Success', icon: 'Activity', href: '/admin/customer-success' },
  ]},
  { section: 'Support & Security', items: [
    { key: 'support', label: 'Support Desk', icon: 'HelpCircle', href: '/admin/support' },
    { key: 'audit', label: 'Audit Trails', icon: 'Settings', href: '/admin/audit' },
    { key: 'settings', label: 'Settings', icon: 'Settings', href: '/admin/settings' },
    { key: 'profile', label: 'Profile', icon: 'User', href: '/admin/profile' },
  ]},
];

export const adminMobileItems = [
  { key: 'home', label: 'Home', icon: 'Home', href: '/admin/dashboard' },
  { key: 'hostels', label: 'Hostels', icon: 'Building', href: '/admin/hostels' },
  { key: 'plans', label: 'Plans', icon: 'CreditCard', href: '/admin/subscriptions' },
  { key: 'support', label: 'Support', icon: 'HelpCircle', href: '/admin/support' },
  { key: 'settings', label: 'Settings', icon: 'Settings', href: '/admin/settings' },
];

export function getMenuConfig(role) {
  switch (role) {
    case 'owner': return { sidebar: ownerMenuItems, mobile: ownerMobileItems };
    case 'warden': return { sidebar: wardenMenuItems, mobile: wardenMobileItems };
    case 'cook': return { sidebar: cookMenuItems, mobile: cookMobileItems };
    case 'accountant': return { sidebar: accountantMenuItems, mobile: accountantMobileItems };
    case 'resident': return { sidebar: residentMenuItems, mobile: residentMobileItems };
    case 'admin':
    case 'superadmin': return { sidebar: adminMenuItems, mobile: adminMobileItems };
    default: return { sidebar: ownerMenuItems, mobile: ownerMobileItems };
  }
}

export default getMenuConfig;
