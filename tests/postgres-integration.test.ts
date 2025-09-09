import { Sequelize, DataTypes, Model } from 'sequelize';
import { LogUtil } from '../src/LogUtil';

// Test models for PostgreSQL integration
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

describe('LogUtil with PostgreSQL Sequelize Errors', () => {
  let sequelize: Sequelize;

  beforeAll(async () => {
    // Only run these tests if PostgreSQL is available (in Docker environment)
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'format_log_test',
      username: process.env.DB_USER || 'testuser',
      password: process.env.DB_PASSWORD || 'testpass',
    };

    sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: 'postgres',
      logging: false,
    });

    try {
      await sequelize.authenticate();
    } catch (error) {
      console.log('PostgreSQL not available, skipping integration tests');
      return;
    }

    // Initialize models
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
      timestamps: false,
    });

    Post.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
          model: User,
          key: 'id',
        },
      },
    }, {
      sequelize,
      modelName: 'Post',
      tableName: 'posts',
      timestamps: false,
    });

    // Define associations
    User.hasMany(Post, { foreignKey: 'userId' });
    Post.belongsTo(User, { foreignKey: 'userId' });
  });

  afterAll(async () => {
    if (sequelize) {
      await sequelize.close();
    }
  });

  describe('PostgreSQL-specific Error Formatting', () => {
    it('should format PostgreSQL unique constraint violation', async () => {
      if (!sequelize) {
        console.log('Skipping PostgreSQL test - database not available');
        return;
      }

      try {
        // Try to create a user with existing email
        await User.create({
          email: 'john.doe@example.com', // This should already exist from init script
          name: 'Duplicate John',
          age: 35,
        });
        fail('Expected unique constraint error');
      } catch (error) {
        const formatted = LogUtil.formatError(error);
        
        expect(formatted).toContain('[Sequelize Error Details]');
        expect(formatted).toContain('SequelizeUniqueConstraintError');
        
        // PostgreSQL-specific error details
        expect(formatted).toMatch(/(constraint|unique|duplicate)/i);
        expect(formatted).toContain('email');
      }
    });

    it('should format PostgreSQL foreign key constraint violation', async () => {
      if (!sequelize) {
        console.log('Skipping PostgreSQL test - database not available');
        return;
      }

      try {
        // Try to create a post with non-existent user ID
        await Post.create({
          title: 'Orphan Post',
          content: 'This post references a non-existent user',
          userId: 99999,
        });
        fail('Expected foreign key constraint error');
      } catch (error) {
        const formatted = LogUtil.formatError(error);
        
        expect(formatted).toContain('[Sequelize Error Details]');
        expect(formatted).toContain('SequelizeForeignKeyConstraintError');
        
        // PostgreSQL-specific constraint information
        expect(formatted).toMatch(/(constraint|foreign key|fk_user_id)/i);
      }
    });

    it('should format PostgreSQL check constraint violation', async () => {
      if (!sequelize) {
        console.log('Skipping PostgreSQL test - database not available');
        return;
      }

      try {
        // Try to create a user with invalid age (violates check constraint)
        await User.create({
          email: 'invalid.age@example.com',
          name: 'Invalid Age User',
          age: 150, // Violates age check constraint
        });
        fail('Expected check constraint error');
      } catch (error) {
        const formatted = LogUtil.formatError(error);
        
        expect(formatted).toContain('[Sequelize Error Details]');
        
        // Should contain information about the constraint violation
        expect(formatted).toMatch(/(constraint|check|age)/i);
      }
    });

    it('should format PostgreSQL syntax errors with detailed SQL', async () => {
      if (!sequelize) {
        console.log('Skipping PostgreSQL test - database not available');
        return;
      }

      try {
        // Execute invalid PostgreSQL-specific SQL
        await sequelize.query('SELECT * FROM users WHERE invalid_syntax = INVALID');
        fail('Expected SQL syntax error');
      } catch (error) {
        const formatted = LogUtil.formatError(error);
        
        expect(formatted).toContain('[Sequelize Error Details]');
        expect(formatted).toContain('SequelizeDatabaseError');
        expect(formatted).toContain('SQL:');
        expect(formatted).toContain('SELECT * FROM users WHERE invalid_syntax = INVALID');
      }
    });

    it('should format PostgreSQL connection errors', async () => {
      // Create a new Sequelize instance with invalid connection details
      const invalidSequelize = new Sequelize('invalid_db', 'invalid_user', 'invalid_pass', {
        host: 'invalid_host',
        port: 5432,
        dialect: 'postgres',
        logging: false,
      });

      try {
        await invalidSequelize.authenticate();
        fail('Expected connection error');
      } catch (error) {
        const formatted = LogUtil.formatError(error);
        
        expect(formatted).toContain('[Sequelize Error Details]');
        expect(formatted).toContain('SequelizeConnectionError');
        
        // Should contain connection-related information
        expect(formatted).toMatch(/(connection|host|database)/i);
      } finally {
        await invalidSequelize.close();
      }
    });
  });

  describe('Real PostgreSQL Error Scenarios', () => {
    it('should demonstrate comprehensive PostgreSQL error handling', async () => {
      if (!sequelize) {
        console.log('Skipping PostgreSQL comprehensive test - database not available');
        return;
      }

      const errors: any[] = [];

      // Test various PostgreSQL-specific errors
      const testCases = [
        {
          name: 'Duplicate email constraint',
          test: async () => {
            await User.create({
              email: 'jane.smith@example.com', // Already exists
              name: 'Another Jane',
              age: 28,
            });
          }
        },
        {
          name: 'Invalid email format validation',
          test: async () => {
            await User.create({
              email: 'not-an-email',
              name: 'Invalid Email User',
              age: 25,
            });
          }
        },
        {
          name: 'Name length validation',
          test: async () => {
            await User.create({
              email: 'short@example.com',
              name: 'X', // Too short
              age: 25,
            });
          }
        },
        {
          name: 'Foreign key constraint',
          test: async () => {
            await Post.create({
              title: 'Test Post',
              content: 'Content',
              userId: 99999, // Non-existent user
            });
          }
        },
        {
          name: 'SQL syntax error',
          test: async () => {
            await sequelize.query('INVALID SQL SYNTAX FOR POSTGRESQL');
          }
        }
      ];

      // Execute all test cases and collect errors
      for (const testCase of testCases) {
        try {
          await testCase.test();
        } catch (error) {
          errors.push({
            name: testCase.name,
            error,
            formatted: LogUtil.formatError(error)
          });
        }
      }

      // Verify all errors were captured
      expect(errors.length).toBeGreaterThan(0);

      // Log all formatted errors for inspection
      console.log('\\n=== PostgreSQL Error Formatting Examples ===');
      errors.forEach((errorInfo, index) => {
        console.log(`\\n${index + 1}. ${errorInfo.name}:`);
        console.log(errorInfo.formatted);
        console.log('-'.repeat(80));
        
        // Verify each error contains Sequelize details
        expect(errorInfo.formatted).toContain('[Sequelize Error Details]');
      });
    });
  });
});
