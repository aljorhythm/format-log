# Format-Log

A TypeScript library for formatting errors, with special support for Sequelize database errors.

[![CI/CD Pipeline](https://github.com/your-username/format-log/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/format-log/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/your-username/format-log/branch/main/graph/badge.svg)](https://codecov.io/gh/your-username/format-log)
[![npm version](https://badge.fury.io/js/format-log.svg)](https://badge.fury.io/js/format-log)

## Features

- 🔍 **Smart Error Detection**: Automatically detects and formats Sequelize errors with detailed information
- 📊 **Comprehensive Formatting**: Handles standard JavaScript errors, objects, primitives, and edge cases
- 🛡️ **Type Safe**: Written in TypeScript with full type definitions
- 🧪 **Well Tested**: Comprehensive test suite with real Sequelize error scenarios
- 🐳 **Docker Ready**: Includes Docker configuration for testing with PostgreSQL

## Installation

```bash
npm install format-log
```

## Usage

### Basic Usage

```typescript
import { LogUtil } from 'format-log';

// Format a standard error
const error = new Error('Something went wrong');
console.log(LogUtil.formatError(error));
// Output: Error: Something went wrong
//         [stack trace]

// Format non-error values
console.log(LogUtil.formatError('Simple string'));
// Output: "Simple string"

console.log(LogUtil.formatError({ code: 500, message: 'Server error' }));
// Output: {"code":500,"message":"Server error"}
```

### Sequelize Error Formatting

The library automatically detects and provides detailed formatting for Sequelize errors:

```typescript
import { LogUtil } from 'format-log';

// Sequelize validation error
try {
  await User.create({ email: 'invalid-email' });
} catch (error) {
  console.log(LogUtil.formatError(error));
  // Output: SequelizeValidationError: Validation error
  //         [Sequelize Error Details]
  //           Constraint: email_validation
  //           Table: users
  //           Fields: {"email":"invalid-email"}
  //           SQL: INSERT INTO users (email) VALUES ($1)
  //           Original Error: Invalid email format
  //         [stack trace]
}
```

### Supported Sequelize Error Properties

- `constraint`: Constraint name that was violated
- `table`: Database table involved in the error
- `fields`: Object containing the field values that caused the error
- `detail`: Detailed error message from the database
- `sql`: The SQL query that caused the error
- `original`: The original underlying error

## API Reference

### LogUtil.formatError(e: unknown): string

Formats any value into a readable string representation.

**Parameters:**
- `e` - The value to format (can be Error, string, number, object, etc.)

**Returns:**
- A formatted string representation of the input

**Behavior:**
- For `Error` objects: Returns name, message, Sequelize details (if applicable), and stack trace
- For Sequelize errors: Includes additional database-specific information
- For other values: Uses JSON.stringify() with fallback to String()

## Development

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Docker (optional, for PostgreSQL testing)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/format-log.git
cd format-log

# Install dependencies
npm install

# Build the project
npm run build
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with Docker (includes PostgreSQL integration tests)
npm run docker:test
```

### Testing with PostgreSQL

The library includes comprehensive integration tests that run against a real PostgreSQL database:

```bash
# Start PostgreSQL with Docker
npm run docker:up

# Run PostgreSQL integration tests
npm test -- --testPathPattern=postgres-integration

# Stop PostgreSQL
npm run docker:down
```

### Linting

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix
```

## Testing Strategy

The library includes multiple types of tests:

1. **Unit Tests** (`tests/LogUtil.test.ts`): Test core formatting logic with mocked Sequelize errors
2. **Integration Tests** (`tests/sequelize-integration.test.ts`): Test with real Sequelize models using SQLite
3. **PostgreSQL Tests** (`tests/postgres-integration.test.ts`): Test with real PostgreSQL database constraints

### Test Coverage

The test suite covers:
- ✅ Standard JavaScript errors (Error, TypeError, ReferenceError, etc.)
- ✅ All Sequelize error types and properties
- ✅ Non-error inputs (strings, numbers, objects, arrays, null, undefined)
- ✅ Edge cases (circular references, BigInt, Symbol, empty values)
- ✅ Real database constraint violations
- ✅ PostgreSQL-specific error scenarios

## CI/CD

The project uses GitHub Actions for continuous integration:

- **Multi-Node Testing**: Tests against Node.js 16, 18, and 20
- **Database Integration**: Runs tests against PostgreSQL
- **Docker Testing**: Validates Docker-based testing setup
- **Code Coverage**: Uploads coverage reports to Codecov
- **Security Auditing**: Checks for security vulnerabilities
- **Automated Publishing**: Publishes to npm on version changes

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Run the test suite (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### 1.0.0
- Initial release
- Support for standard JavaScript error formatting
- Comprehensive Sequelize error detection and formatting
- Full test suite with PostgreSQL integration
- Docker support for testing
- GitHub Actions CI/CD pipeline