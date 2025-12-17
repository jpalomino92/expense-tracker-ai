# ExpenseTracker

A modern, professional expense tracking web application built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

### Core Functionality
- **Add, Edit, Delete Expenses**: Full CRUD operations with form validation
- **Smart Categorization**: 6 expense categories (Food, Transportation, Entertainment, Shopping, Bills, Other)
- **Advanced Filtering**: Filter by date range, category, and search by description
- **Data Persistence**: All data stored locally in your browser using localStorage
- **CSV Export**: Export your expenses to CSV format for external analysis

### Analytics Dashboard
- **Summary Cards**: Total spending, monthly spending, top category, and transaction count
- **Spending Charts**: Visualize spending over time (daily, weekly, monthly views)
- **Category Breakdown**: Pie chart and detailed breakdown of spending by category
- **Recent Expenses**: Quick view of your latest transactions

### Design & UX
- **Modern UI**: Clean, professional interface with a blue color scheme
- **Fully Responsive**: Optimized for desktop, tablet, and mobile devices
- **Intuitive Navigation**: Easy-to-use navigation between Dashboard and Expenses pages
- **Form Validation**: Real-time validation with helpful error messages
- **Loading States**: Smooth loading indicators for better UX
- **Accessibility**: ARIA labels, keyboard navigation, and semantic HTML

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **CSV Export**: PapaParse

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn

### Installation

1. Navigate to the project directory:
   ```bash
   cd expense-tracker-ai
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage Guide

### Adding an Expense

1. Click the "Add Expense" button on the Dashboard or Expenses page
2. Fill in the form:
   - **Date**: Select the date of the expense (defaults to today)
   - **Amount**: Enter the amount in dollars (e.g., 12.99)
   - **Category**: Choose from 6 categories
   - **Description**: Add a brief description
3. Click "Add Expense" to save

### Viewing and Filtering Expenses

1. Navigate to the "Expenses" page from the navigation
2. Use the filters panel to:
   - Select a date range (Today, This Week, This Month, etc.)
   - Filter by one or more categories
   - Search by description text
3. Click "Clear All" to remove all filters

### Editing an Expense

1. Find the expense in the list
2. Click the "Edit" button
3. Modify the fields in the modal
4. Click "Update Expense" to save changes

### Deleting an Expense

1. Find the expense in the list
2. Click the "Delete" button
3. Confirm deletion in the modal

### Exporting Data

1. Go to the Expenses page
2. Click "Export CSV" button
3. A CSV file will be downloaded with all your expenses

### Dashboard Analytics

The Dashboard provides:
- **Summary Cards**: Quick overview of key metrics
- **Spending Chart**: Toggle between daily, weekly, and monthly views
- **Category Breakdown**: See which categories consume the most budget
- **Recent Expenses**: View your latest 5 transactions

## Project Structure

```
expense-tracker-ai/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Dashboard page
│   ├── expenses/page.tsx        # Expenses page
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # Reusable UI components
│   ├── layout/                  # Layout components
│   ├── expenses/                # Expense-specific components
│   └── dashboard/               # Dashboard components
├── lib/                         # Utilities and helpers
├── hooks/                       # Custom React hooks
├── types/                       # TypeScript type definitions
├── context/                     # React Context providers
├── constants/                   # Application constants
└── validations/                 # Zod validation schemas
```

## Data Storage

All expense data is stored in your browser's localStorage. This means:
- **Privacy**: Your data never leaves your device
- **No Backend Required**: Works entirely client-side
- **Persistence**: Data survives page refreshes
- **Limitations**: ~5-10MB storage limit (thousands of expenses)

To clear all data, use your browser's developer tools to clear localStorage, or add a "Clear All Data" feature.

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Fully responsive and functional

## Performance

The application is optimized for performance:
- Memoized calculations for analytics
- Optimized re-renders with React hooks
- Lazy loading where appropriate
- Efficient filtering and sorting

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus management in modals
- Color contrast meets WCAG AA standards

## Future Enhancements

Potential features for future versions:
- Backend integration for multi-device sync
- Budget tracking and alerts
- Recurring expenses
- Receipt photo upload
- Multiple currency support
- Export to PDF reports
- Dark mode
- Custom categories

## Troubleshooting

### Data Not Persisting

- Check if localStorage is enabled in your browser
- Ensure you're not in private/incognito mode
- Check browser storage quota

### Charts Not Displaying

- Ensure there are expenses in the selected time range
- Check browser console for errors
- Verify recharts is properly installed

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## License

This project is open source and available for personal and commercial use.

## Support

For issues or questions, please check:
1. This README
2. The code comments in the source files
3. Next.js documentation: https://nextjs.org/docs

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS
