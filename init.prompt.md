I am writing a simple library function. 

```
type SequelizeError = Error & {
  sql?: string;
  constraint?: string;
  table?: string;
  fields?: Record<string, unknown>;
  detail?: string;
  original?: Error | string;
};

const hasSequelizeProps = (error: Error): error is SequelizeError => {
  return "sql" in error || "constraint" in error || "table" in error || "fields" in error;
};

const getSequelizeErrorDetails = (error: Error): string | null => {
  if (!hasSequelizeProps(error)) {
    return null;
  }

  let details = "[Sequelize Error Details]";
  
  if (error.constraint) {
    details += `\n  Constraint: ${error.constraint}`;
  }
  
  if (error.table) {
    details += `\n  Table: ${error.table}`;
  }
  
  if (error.fields) {
    details += `\n  Fields: ${JSON.stringify(error.fields)}`;
  }
  
  if (error.detail) {
    details += `\n  Detail: ${error.detail}`;
  }
  
  if (error.sql) {
    details += `\n  SQL: ${error.sql}`;
  }
  
  if (error.original) {
    const originalMessage = error.original instanceof Error ? error.original.message : String(error.original);
    details += `\n  Original Error: ${originalMessage}`;
  }

  return details;
};

export const LogUtil = {
  formatError(e: unknown): string {
    if (e instanceof Error) {
      let errorInfo = `${e.name}: ${e.message}`;
      
      const sequelizeDetails = getSequelizeErrorDetails(e);
      if (sequelizeDetails) {
        errorInfo += `\n${sequelizeDetails}`;
      }
      
      errorInfo += `\n${e.stack}`;
      return errorInfo;
    }
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
};
```

# Testing

- Create unit tests for `LogUtil.formatError` to ensure it correctly formats standard errors, Sequelize errors, and non-error inputs.
    - The tests demonstrate outputs for various error scenarios.
    - create a sequelize entity with constraint to replicate sequelize error
- Use docker for testing environment if necessary.
  - Use for database setup postgres
- Write github actions for CI/CD to run tests on each push.
- Document the setup process for the testing environment.