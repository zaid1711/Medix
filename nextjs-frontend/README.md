# EHR System Frontend

A modern, minimal, and clean frontend for the Electronic Health Records (EHR) system built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Modern Design**: Clean, minimal UI with glass morphism effects and liquid animations
- **Role-based Access**: Separate dashboards for Admin, Doctor, and Patient roles
- **Responsive Design**: Fully responsive layout that works on all devices
- **Type Safety**: Built with TypeScript for better development experience
- **Component Library**: Reusable UI components with shadcn/ui

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on port 3001

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.local.example .env.local
```

3. Update the API URL in `.env.local` if needed:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── doctor/            # Doctor dashboard  
│   ├── patient/           # Patient dashboard
│   ├── login/             # Authentication pages
│   └── register/
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── layout/          # Layout components
│   └── ui/              # Reusable UI components
├── lib/                  # Utility functions
│   ├── api.ts           # API client
│   └── utils.ts         # Helper functions
└── types/               # TypeScript type definitions
```

## Features by Role

### Admin Dashboard
- View system statistics (total patients, doctors, new members)
- Manage users (add, edit, delete, change roles)
- Search and filter users
- User role management

### Doctor Dashboard  
- View patient appointments
- Respond to appointment requests
- View patient medical records
- Send messages and medical notes to patients
- Update appointment status

### Patient Dashboard
- Upload medical records with descriptions
- View uploaded medical records
- Schedule appointments with doctors
- View appointment responses from doctors
- Tabbed interface for records and appointments

## Design System

### Colors
- Primary: Blue (#2563eb)
- Secondary: Gray (#64748b)
- Success: Green (#10b981)
- Error: Red (#ef4444)
- Warning: Yellow (#f59e0b)

### Components
- Cards with subtle shadows
- Glass morphism effects
- Liquid navbar with gradient animation
- Sidebar with active pill highlighting
- Responsive grid layouts

### Animations
- Smooth transitions
- Liquid water effect on navbar
- Hover effects
- Loading states

## API Integration

The frontend integrates with the existing backend API endpoints:

- Authentication: `/login`, `/registerPatient`, `/registerDoctor`
- Users: `/users` (GET, DELETE, PUT)
- Records: `/records`, `/upload-file`, `/uploadRecord`
- Appointments: `/appointments` (GET, POST, PUT)
- Files: `/file/{hash}`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- Tailwind CSS for styling
- ESLint for code quality
- Prettier for code formatting

## Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start
```

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new components
3. Add proper error handling
4. Write responsive components
5. Test on different screen sizes

## License

This project is part of the EHR System with Blockchain Integration.
