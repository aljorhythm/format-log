import { Sequelize, DataTypes, Model, ValidationError, ForeignKeyConstraintError, UniqueConstraintError } from 'sequelize';
import { LogUtil } from '../src/LogUtil';

// Test models
class User extends Model {
  public id!: number;
  public email!: string;
  public name!: string;
  public age!: number;
}

class Post extends Model {
  public id!: number;
  public title!: string;
  public content!: string;
  public userId!: number;
}

describe('LogUtil with Real Sequelize Errors', () => {
  let sequelize: Sequelize;

  beforeAll(async () => {
    // Use in-memory SQLite for testing
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false,
    });

    // Initialize User model
    User.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 50],
        },
      },
      age: {
        type: DataTypes.INTEGER,
        validate: {
          min: 0,
          max: 120,
        },
      },
    }, {
      sequelize,
      modelName: 'User',
      tableName: 'users',
    });

    // Initialize Post model
    Post.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 100],
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: User,
          key: 'id',
        },
      },
    }, {
      sequelize,
      modelName: 'Post',
      tableName: 'posts',
    });

    // Define associations
    User.hasMany(Post, { foreignKey: 'userId' });
    Post.belongsTo(User, { foreignKey: 'userId' });

    // Sync database
    await sequelize.sync({ force: true });

    // Create a test user for foreign key tests
    await User.create({
      email: 'existing@example.com',
      name: 'Existing User',
      age: 25,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Validation Errors', () => {
    it('should format Sequelize validation error for invalid email', async () => {
      try {
        await User.create({
          email: 'invalid-email',
          name: 'Test User',
          age: 25,
        });
        fail('Expected validation error');
      } catch (error) {
        const formatted = LogUtil.formatError(error);
        
        expect(formatted).toContain('SequelizeValidationError');
        expect(formatted).toContain('[Sequelize Error Details]');
        expect(formatted).toContain('Validation isEmail on email failed');
        
        // Check if it contains Sequelize-specific information
        if (error instanceof ValidationError) {
          expect(formatted).toContain(error.name);
        }
      }
    });

    it('should format Sequelize validation error for name length', async () => {
      try {
        await User.create({
          email: 'test@example.com',
          name: 'A', // Too short
          age: 25,
        });
        fail('Expected validation error');
      } catch (error) {
        const formatted = LogUtil.formatError(error);
        
        expect(formatted).toContain('SequelizeValidationError');
        expect(formatted).toContain('[Sequelize Error Details]');
        expect(formatted).toContain('Validation len on name failed');
      }
    });

    it('should format Sequelize validation error for age range', async () => {
      try {
        await User.create({
          email: 'test2@example.com',
          name: 'Valid Name',
          age: 150, // Too high
        });
        fail('Expected validation error');
      } catch (error) {
        const formatted = LogUtil.formatError(error);
        
        expect(formatted).toContain('SequelizeValidationError');
        expect(formatted).toContain('[Sequelize Error Details]');
        expect(formatted).toContain('Validation max on age failed');
      }
    });

    it('should format Sequelize validation error for multiple fields', async () => {
      try {
        await User.create({
          email: 'invalid-email',
          name: 'X', // Too short
          age: -5, // Too low
        });
        fail('Expected validation error');
      } catch (error) {
        const formatted = LogUtil.formatError(error);
        
        expect(formatted).toContain('SequelizeValidationError');
        expect(formatted).toContain('[Sequelize Error Details]');
        
        // Should contain information about multiple validation failures
        expect(formatted).toMatch(/(isEmail|len|min)/);
      }
    });
  });

  describe('Unique Constraint Errors', () => {
    it('should format unique constraint error', async () => {
      // First, create a user
      await User.create({
        email: 'unique@example.com',
        name: 'First User',
        age: 30,
      });

      try {
        // Try to create another user with the same email
        await User.create({
          email: 'unique@example.com',
          name: 'Second User',
          age: 25,
        });
        fail('Expected unique constraint error');
      } catch (error) {
        const formatted = LogUtil.formatError(error);
        
        expect(formatted).toContain('SequelizeUniqueConstraintError');
        expect(formatted).toContain('[Sequelize Error Details]');
        
        if (error instanceof UniqueConstraintError) {
          expect(formatted).toContain(error.name);
          // Check for constraint-related information
          expect(formatted).toMatch(/(constraint|unique|email)/i);
        }
      }
    });
  });

  describe('Foreign Key Constraint Errors', () => {
    it('should format foreign key constraint error', async () => {
      try {
        // Try to create a post with non-existent user ID
        await Post.create({
          title: 'Test Post',
          content: 'This is a test post',
          userId: 99999, // Non-existent user
        });
        fail('Expected foreign key constraint error');
      } catch (error) {
        const formatted = LogUtil.formatError(error);
        
        expect(formatted).toContain('SequelizeForeignKeyConstraintError');
        expect(formatted).toContain('[Sequelize Error Details]');
        
        if (error instanceof ForeignKeyConstraintError) {
          expect(formatted).toContain(error.name);
        }
      }
    });
  });

  describe('Database Errors', () => {
    it('should format database connection/query errors', async () => {
      try {
        // Execute invalid SQL
        await sequelize.query('SELECT * FROM non_existent_table');
        fail('Expected database error');
      } catch (error) {
        const formatted = LogUtil.formatError(error);
        
        expect(formatted).toContain('SequelizeDatabaseError');
        expect(formatted).toContain('[Sequelize Error Details]');
        expect(formatted).toContain('SQL:');
        expect(formatted).toContain('SELECT * FROM non_existent_table');
      }
    });

    it('should format SQL syntax errors', async () => {
      try {
        // Execute SQL with syntax error
        await sequelize.query('INVALID SQL SYNTAX HERE');
        fail('Expected SQL syntax error');
      } catch (error) {
        const formatted = LogUtil.formatError(error);
        
        expect(formatted).toContain('SequelizeDatabaseError');
        expect(formatted).toContain('[Sequelize Error Details]');
        expect(formatted).toContain('SQL:');
        expect(formatted).toContain('INVALID SQL SYNTAX HERE');
      }
    });
  });

  describe('Real-world Scenario Tests', () => {
    it('should demonstrate comprehensive error formatting in a realistic scenario', async () => {
      // Create a user first
      const user = await User.create({
        email: 'scenario@example.com',
        name: 'Scenario User',
        age: 28,
      });

      // Create a post
      await Post.create({
        title: 'First Post',
        content: 'This is the first post',
        userId: user.id,
      });

      // Now test various error scenarios
      const errors: any[] = [];

      // 1. Duplicate email
      try {
        await User.create({
          email: 'scenario@example.com',
          name: 'Duplicate User',
          age: 30,
        });
      } catch (error) {
        errors.push({ type: 'unique_constraint', error, formatted: LogUtil.formatError(error) });
      }

      // 2. Validation error
      try {
        await User.create({
          email: 'invalid-email-format',
          name: 'Test',
          age: 25,
        });
      } catch (error) {
        errors.push({ type: 'validation', error, formatted: LogUtil.formatError(error) });
      }

      // 3. Foreign key error
      try {
        await Post.create({
          title: 'Orphan Post',
          content: 'This post has no valid user',
          userId: 99999,
        });
      } catch (error) {
        errors.push({ type: 'foreign_key', error, formatted: LogUtil.formatError(error) });
      }

      // Verify all errors were captured and formatted correctly
      expect(errors).toHaveLength(3);
      
      errors.forEach((errorInfo) => {
        expect(errorInfo.formatted).toContain('[Sequelize Error Details]');
        expect(errorInfo.formatted).toContain('Sequelize');
        expect(errorInfo.formatted).toMatch(/Error|error/);
      });

      // Log formatted errors for manual inspection
      console.log('\\n=== Real-world Error Formatting Examples ===');
      errors.forEach((errorInfo, index) => {
        console.log(`\\n${index + 1}. ${errorInfo.type.toUpperCase()} ERROR:`);
        console.log(errorInfo.formatted);
        console.log('-'.repeat(80));
      });
    });
  });
});
