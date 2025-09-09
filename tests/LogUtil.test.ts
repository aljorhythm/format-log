import { LogUtil, SequelizeError } from '../src/LogUtil';

describe('LogUtil.formatError', () => {
  describe('Standard Error Formatting', () => {
    it('should format a standard Error correctly', () => {
      const error = new Error('Test error message');
      error.name = 'TestError';
      
      const result = LogUtil.formatError(error);
      
      expect(result).toContain('TestError: Test error message');
      expect(result).toContain(error.stack);
      expect(result).not.toContain('[Sequelize Error Details]');
    });

    it('should format a TypeError correctly', () => {
      const error = new TypeError('Cannot read property of undefined');
      
      const result = LogUtil.formatError(error);
      
      expect(result).toContain('TypeError: Cannot read property of undefined');
      expect(result).toContain(error.stack);
    });

    it('should format a ReferenceError correctly', () => {
      const error = new ReferenceError('Variable is not defined');
      
      const result = LogUtil.formatError(error);
      
      expect(result).toContain('ReferenceError: Variable is not defined');
      expect(result).toContain(error.stack);
    });
  });

  describe('Sequelize Error Formatting', () => {
    it('should format a Sequelize error with all properties', () => {
      const sequelizeError = new Error('Validation error') as SequelizeError;
      sequelizeError.name = 'SequelizeValidationError';
      sequelizeError.sql = 'INSERT INTO users (email, name) VALUES ($1, $2)';
      sequelizeError.constraint = 'users_email_unique';
      sequelizeError.table = 'users';
      sequelizeError.fields = { email: 'test@example.com', name: 'John Doe' };
      sequelizeError.detail = 'Key (email)=(test@example.com) already exists.';
      sequelizeError.original = new Error('duplicate key value violates unique constraint');

      const result = LogUtil.formatError(sequelizeError);

      expect(result).toContain('SequelizeValidationError: Validation error');
      expect(result).toContain('[Sequelize Error Details]');
      expect(result).toContain('Constraint: users_email_unique');
      expect(result).toContain('Table: users');
      expect(result).toContain('Fields: {"email":"test@example.com","name":"John Doe"}');
      expect(result).toContain('Detail: Key (email)=(test@example.com) already exists.');
      expect(result).toContain('SQL: INSERT INTO users (email, name) VALUES ($1, $2)');
      expect(result).toContain('Original Error: duplicate key value violates unique constraint');
      expect(result).toContain(sequelizeError.stack);
    });

    it('should format a Sequelize error with only constraint', () => {
      const sequelizeError = new Error('Foreign key constraint') as SequelizeError;
      sequelizeError.name = 'SequelizeForeignKeyConstraintError';
      sequelizeError.constraint = 'fk_user_id';

      const result = LogUtil.formatError(sequelizeError);

      expect(result).toContain('SequelizeForeignKeyConstraintError: Foreign key constraint');
      expect(result).toContain('[Sequelize Error Details]');
      expect(result).toContain('Constraint: fk_user_id');
      expect(result).not.toContain('Table:');
      expect(result).not.toContain('Fields:');
      expect(result).not.toContain('SQL:');
    });

    it('should format a Sequelize error with only SQL', () => {
      const sequelizeError = new Error('SQL syntax error') as SequelizeError;
      sequelizeError.name = 'SequelizeDatabaseError';
      sequelizeError.sql = 'SELECT * FROM non_existent_table';

      const result = LogUtil.formatError(sequelizeError);

      expect(result).toContain('SequelizeDatabaseError: SQL syntax error');
      expect(result).toContain('[Sequelize Error Details]');
      expect(result).toContain('SQL: SELECT * FROM non_existent_table');
      expect(result).not.toContain('Constraint:');
      expect(result).not.toContain('Table:');
    });

    it('should format a Sequelize error with table and fields', () => {
      const sequelizeError = new Error('Validation failed') as SequelizeError;
      sequelizeError.name = 'SequelizeValidationError';
      sequelizeError.table = 'products';
      sequelizeError.fields = { price: -10, name: '' };

      const result = LogUtil.formatError(sequelizeError);

      expect(result).toContain('SequelizeValidationError: Validation failed');
      expect(result).toContain('[Sequelize Error Details]');
      expect(result).toContain('Table: products');
      expect(result).toContain('Fields: {"price":-10,"name":""}');
    });

    it('should format a Sequelize error with string original error', () => {
      const sequelizeError = new Error('Connection error') as SequelizeError;
      sequelizeError.name = 'SequelizeConnectionError';
      sequelizeError.constraint = 'connection_timeout';
      sequelizeError.original = 'Connection timeout after 5000ms';

      const result = LogUtil.formatError(sequelizeError);

      expect(result).toContain('SequelizeConnectionError: Connection error');
      expect(result).toContain('[Sequelize Error Details]');
      expect(result).toContain('Constraint: connection_timeout');
      expect(result).toContain('Original Error: Connection timeout after 5000ms');
    });

    it('should not format as Sequelize error if no Sequelize properties present', () => {
      const regularError = new Error('Regular error message');
      regularError.name = 'RegularError';

      const result = LogUtil.formatError(regularError);

      expect(result).toContain('RegularError: Regular error message');
      expect(result).not.toContain('[Sequelize Error Details]');
      expect(result).toContain(regularError.stack);
    });
  });

  describe('Non-Error Input Formatting', () => {
    it('should format a string input', () => {
      const result = LogUtil.formatError('Simple string error');
      
      expect(result).toBe('"Simple string error"');
    });

    it('should format a number input', () => {
      const result = LogUtil.formatError(404);
      
      expect(result).toBe('404');
    });

    it('should format a boolean input', () => {
      const result = LogUtil.formatError(false);
      
      expect(result).toBe('false');
    });

    it('should format an object input', () => {
      const obj = { error: 'Something went wrong', code: 500 };
      const result = LogUtil.formatError(obj);
      
      expect(result).toBe('{"error":"Something went wrong","code":500}');
    });

    it('should format an array input', () => {
      const arr = ['error1', 'error2', 'error3'];
      const result = LogUtil.formatError(arr);
      
      expect(result).toBe('["error1","error2","error3"]');
    });

    it('should format null input', () => {
      const result = LogUtil.formatError(null);
      
      expect(result).toBe('null');
    });

    it('should format undefined input', () => {
      const result = LogUtil.formatError(undefined);
      
      expect(result).toBe('undefined');
    });

    it('should handle circular reference objects gracefully', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      const result = LogUtil.formatError(circularObj);
      
      expect(result).toBe('[object Object]');
    });

    it('should format BigInt input', () => {
      const bigIntValue = BigInt(123456789012345678901234567890);
      const result = LogUtil.formatError(bigIntValue);
      
      expect(result).toBe('123456789012345678901234567890');
    });

    it('should format Symbol input', () => {
      const symbolValue = Symbol('test');
      const result = LogUtil.formatError(symbolValue);
      
      expect(result).toContain('Symbol(test)');
    });
  });

  describe('Edge Cases', () => {
    it('should handle Error with empty message', () => {
      const error = new Error('');
      error.name = 'EmptyError';
      
      const result = LogUtil.formatError(error);
      
      expect(result).toContain('EmptyError: ');
      expect(result).toContain(error.stack);
    });

    it('should handle Error with no name', () => {
      const error = new Error('Test message');
      error.name = '';
      
      const result = LogUtil.formatError(error);
      
      expect(result).toContain(': Test message');
      expect(result).toContain(error.stack);
    });

    it('should handle Sequelize error with empty fields object', () => {
      const sequelizeError = new Error('Empty fields') as SequelizeError;
      sequelizeError.name = 'SequelizeError';
      sequelizeError.fields = {};
      
      const result = LogUtil.formatError(sequelizeError);
      
      expect(result).toContain('[Sequelize Error Details]');
      expect(result).toContain('Fields: {}');
    });

    it('should handle Sequelize error with complex nested fields', () => {
      const sequelizeError = new Error('Complex fields') as SequelizeError;
      sequelizeError.name = 'SequelizeError';
      sequelizeError.fields = {
        user: { id: 1, profile: { name: 'John', settings: { theme: 'dark' } } },
        metadata: [1, 2, 3]
      };
      
      const result = LogUtil.formatError(sequelizeError);
      
      expect(result).toContain('[Sequelize Error Details]');
      expect(result).toContain('Fields: {"user":{"id":1,"profile":{"name":"John","settings":{"theme":"dark"}}},"metadata":[1,2,3]}');
    });
  });
});
