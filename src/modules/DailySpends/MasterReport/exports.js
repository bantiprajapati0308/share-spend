// Master Report Module Exports
// Export all components, hooks, and utilities for reuse across the application

// Main Component
export { default as MasterReport } from './index.jsx';

// Reusable Components
export { default as SummaryCard } from './components/SummaryCard';
export { default as DataTable } from './components/DataTable';
export { default as ReportHeader } from './components/ReportHeader';
export { default as SummaryCardsSection } from './components/SummaryCardsSection';
export { default as CategoryBreakdownTab } from './components/CategoryBreakdownTab';
export { default as MonthlyBreakdownTab } from './components/MonthlyBreakdownTab';
export { default as RecentTransactionsTab } from './components/RecentTransactionsTab';
export { default as CategoryDetailsModal } from './components/CategoryDetailsModal';

// Hooks
export { useMasterReportData } from './hooks/useMasterReportData';

// Utilities
export * from './utils/masterReportUtils';