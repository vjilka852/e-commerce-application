# Stream Integration V3 - Admin Frontend

Enterprise-grade Angular 21 application for managing stream integrations, installations, and audit logs with modern reactive architecture.

## 🚀 Technology Stack

- **Angular 21** - Latest Angular with Standalone Components
- **TypeScript 5.9** - Type-safe development
- **PrimeNG 21** - Enterprise UI component library
- **Angular Signals** - Modern reactive state management
- **RxJS 7.8** - Reactive programming with observables
- **SCSS** - Advanced styling with variables and mixins

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- Angular CLI 21+ (`npm install -g @angular/cli`)
- Git for version control

## 🔧 Installation

```bash
# Clone the repository
git clone <repository-url>
cd Stream-Integration-V3-Front-end

# Install dependencies
npm install

# Start development server
npm start

# Navigate to http://localhost:4200
```

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                           # Core singleton services
│   │   └── services/
│   │       ├── audit-log.service.ts    # Audit log API service
│   │       ├── audit-log-helper.service.ts  # Audit log utilities
│   │       ├── installation.service.ts # Installation API service
│   │       ├── integration.service.ts  # Integration API service
│   │       └── theme.service.ts        # Theme management
│   │
│   ├── features/                       # Feature modules (lazy-loaded)
│   │   ├── installations/              # Installation management
│   │   │   └── pages/
│   │   │       └── installation-list.component.*
│   │   ├── integrations/               # Integration management
│   │   │   └── pages/
│   │   │       └── integration-list.component.*
│   │   └── audit-logs/                 # Audit logging
│   │       └── pages/
│   │           ├── installation-audit-log.component.*
│   │           ├── integration-audit-log.component.*
│   │           └── master-data-sync-audit-log.component.*
│   │
│   ├── layout/                         # Layout components
│   │   ├── layout.component.*          # Main layout wrapper
│   │   ├── sidebar/                    # Navigation sidebar
│   │   └── topbar/                     # Top navigation bar
│   │
│   ├── models/                         # TypeScript interfaces
│   │   ├── api.model.ts               # Generic API response types
│   │   ├── installation.model.ts      # Installation types
│   │   ├── integration.model.ts       # Integration types
│   │   ├── audit-log.model.ts         # Common audit log types
│   │   ├── installation-audit-log.model.ts
│   │   ├── integration-audit-log.model.ts
│   │   └── master-data-sync-audit-log.model.ts
│   │
│   ├── app.component.*                 # Root component
│   ├── app.config.ts                   # Application configuration
│   └── app.routes.ts                   # Route definitions
│
├── environments/                       # Environment configurations
│   ├── environment.ts                  # Development environment
│   └── environment.prod.ts             # Production environment
│
├── styles.scss                         # Global styles
└── index.html                          # HTML entry point
```

## 🏗️ Architecture & Design Patterns

### Standalone Components Architecture
All components are standalone (no NgModule), using explicit imports:
```typescript
@Component({
  selector: 'app-feature',
  imports: [CommonModule, FormsModule, TableModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### Signals-Based State Management
Modern reactive programming with Angular Signals:

```typescript
// Reactive state
data = signal<Item[]>([]);
loading = signal(false);
selectedItem = signal<Item | null>(null);

// Computed values
totalCount = computed(() => this.data().length);

// Side effects
constructor() {
  effect(() => {
    console.log('Data changed:', this.data());
  });
}
```

### Reactive Filter & Pagination Pattern

**Critical Pattern** used across all list pages:

#### 1. Dual Signal Pattern (Form vs Applied)
```typescript
// Form signals (UI bindings - user input)
searchText = signal('');
selectedStatus = signal(this.statusOptions[0]);

// Applied signals (trigger API calls via effect)
private appliedSearchText = signal('');
private appliedStatus = signal(this.statusOptions[0]);

// Pagination signals (independent from filters)
pageNumber = signal<number>(1);
pageSize = signal<number>(100);
firstRow = signal<number>(0);
```

#### 2. Effect Watches ONLY Filters
```typescript
constructor() {
  effect(() => {
    // Track ONLY applied filters (NOT pagination/sort)
    this.appliedSearchText();
    this.appliedStatus();
    
    // Load data when filters change
    this.loadData();
  });
}
```

#### 3. Apply Filters (Reset Pagination First)
```typescript
applyFilters() {
  // Reset pagination BEFORE applying filters
  this.pageNumber.set(1);
  this.firstRow.set(0);
  
  // Copy form values to applied (triggers effect)
  this.appliedSearchText.set(this.searchText());
  this.appliedStatus.set(this.selectedStatus());
}
```

#### 4. Pagination & Sorting (Direct Calls)
```typescript
onPageChange(event: any) {
  const page = Math.floor(event.first / event.rows) + 1;
  this.pageNumber.set(page);
  this.firstRow.set(event.first);
  this.pageSize.set(event.rows);
  // Call API directly (not via effect)
}

onSort(event: any) {
  this.sortField.set(event.field);
  this.sortOrder.set(event.order);
  this.pageNumber.set(1);
  this.firstRow.set(0);
  // Call API directly (not via effect)
}
```

### Service Layer Pattern
```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  
  getData(params: QueryParams): Observable<ApiResponse<Data[]>> {
    let httpParams = new HttpParams();
    
    // Always check !== undefined for numbers (0 is valid)
    if (params.pageNumber !== undefined) {
      httpParams = httpParams.set('PageNumber', params.pageNumber.toString());
    }
    
    return this.http.get<ApiResponse<Data[]>>(url, { params: httpParams })
      .pipe(catchError(this.handleError));
  }
}
```

### API Response Pattern
Consistent response structure:
```typescript
interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  value?: {
    data: T;
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
  };
  error?: {
    code: string;
    description: string;
    validationErrors: string[];
  };
}
```

## 🎨 UI/UX Standards

### PrimeNG Components
- **Tables**: `p-table` with lazy loading, pagination, sorting
- **Forms**: `p-inputText`, `p-dropdown`, `p-calendar`
- **Feedback**: `p-toast` for notifications
- **Badges**: `p-tag` for status indicators
- **Navigation**: Custom sidebar with router integration

### Responsive Design
- Mobile-first approach with PrimeFlex grid
- Breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
- Touch-friendly UI elements

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

## 🔐 Security Best Practices

- Environment-based API URL configuration
- HttpOnly cookies for authentication (if applicable)

### Local Authentication and Roles

This storefront currently uses browser-local demo authentication. It has no public registration:

| Role | Demo email | Demo password | Current access |
|---|---|---|---|
| Admin | `admin@ecommerce.local` | `Admin123!` | View, create, edit, and delete products and categories |
| Internal staff | `staff@ecommerce.local` | `Staff123!` | View, create, and edit products and categories |
| Client / Customer | `customer@ecommerce.local` | `Customer123!` | Sign in; purchasing, quotations, addresses, and order tracking are not available yet |

User records (with PBKDF2 password hashes) are initialized in the `ecommerce_users` localStorage entry, and role definitions and product/category permissions are stored in `ecommerce_roles`. The active user ID is persisted in `ecommerce_session`, so a refresh keeps the user signed in until they sign out. Admins can create, edit, deactivate, and delete accounts; create, edit, and delete custom roles; and select product/category permissions for each role. The built-in Admin role and the last active Admin account are protected. Route guards and the UI enforce role and permission assignments, while user/role management remains restricted to the Admin role.

**This is not production authentication or a security boundary.** Browser localStorage and client-side guards can be inspected or modified by the person using the browser. Demo credentials are public and must not be used for real accounts or sensitive data. Production use requires a server-side identity provider, credential verification, authorization, and server-enforced permissions.
- Input validation and sanitization
- CORS configuration on backend
- No sensitive data in client-side code

## 📊 Features

### Installation Management
- List all installations with pagination (100 per page)
- Filter by status, date range, search text
- Sort by any column
- View installation details
- Real-time status updates

### Integration Management  
- Comprehensive integration listing
- Multi-filter support (installation, profile, config stage, status)
- Date range filtering (default: current month)
- Inline status indicators
- Configuration stage tracking

### Audit Logs
Three dedicated audit log pages:
- **Installation Audit Logs**: Track installation lifecycle events
- **Integration Audit Logs**: Monitor integration operations
- **Master Data Sync Audit Logs**: Track data synchronization events

Features:
- Correlation ID tracking
- Level-based filtering (Info, Success, Warning, Error)
- Action-based filtering
- Current month default date range
- Color-coded severity indicators
- Comprehensive search capabilities

## 🛠️ Development Guidelines

### Code Style
- Use Prettier and EditorConfig for formatting
- Follow Angular style guide
- Use TypeScript strict mode
- Prefer `const` over `let`
- Use arrow functions for callbacks

### Component Development
1. Always use `ChangeDetectionStrategy.OnPush`
2. Use `inject()` for dependency injection
3. Declare all dependencies in `imports` array
4. Use signals for reactive state
5. Keep effects simple and focused

### State Management Rules
- **DO**: Separate form signals from applied signals
- **DO**: Keep pagination outside effect dependencies
- **DO**: Reset pagination before applying filters
- **DON'T**: Put pagination/sort in effect dependencies
- **DON'T**: Update pageSize in onPageChange

### API Integration
- Use `!== undefined` checks for numeric params
- Handle errors with toast notifications
- Show loading indicators during API calls
- Implement retry logic for failed requests

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
ng test --code-coverage

# Run tests in headless mode (CI)
ng test --browsers=ChromeHeadless --watch=false
```

### Testing Strategy
- Unit tests for services and business logic
- Component tests for UI interactions
- Mock HTTP services with HttpClientTestingModule
- Test signal updates and computed values
- Minimum 80% code coverage target

## 🚀 Building & Deployment

```bash
# Development build
npm run build

# Production build with optimizations
ng build --configuration production

# Build with specific environment
ng build --configuration staging

# Analyze bundle size
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

### Build Optimization
- Tree shaking for unused code
- Lazy loading for feature modules
- AOT compilation enabled
- Production mode optimizations
- Source maps for debugging

## 📝 Scripts

```bash
npm start          # Start dev server (http://localhost:4200)
npm run build      # Build for production
npm test           # Run unit tests
npm run watch      # Build in watch mode
npm run lint       # Lint TypeScript files (if configured)
```

## 🌐 Environment Configuration

### Development (`environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5273'
};
```

### Production (`environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.production.com'
};
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feat/new-feature`
2. Follow coding standards and patterns
3. Write/update tests for new features
4. Update documentation
5. Commit with conventional commit messages
6. Create a pull request

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`

## 📚 Additional Resources

- [Angular Documentation](https://angular.dev)
- [PrimeNG Components](https://primeng.org)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [RxJS Documentation](https://rxjs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

**Angular Version**: 21.1.2  
**PrimeNG Version**: 21.1.1
