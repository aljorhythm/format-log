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

export { SequelizeError };
