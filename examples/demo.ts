import { LogUtil, SequelizeError } from '../src/LogUtil';

// Demo script to showcase LogUtil functionality
console.log('=== LogUtil Demo ===\n');

// 1. Standard Error
console.log('1. Standard Error:');
const standardError = new Error('Something went wrong');
standardError.name = 'CustomError';
console.log(LogUtil.formatError(standardError));
console.log('\n' + '='.repeat(50) + '\n');

// 2. Sequelize Error with all properties
console.log('2. Sequelize Error (Full):');
const sequelizeError = new Error('Unique constraint violation') as SequelizeError;
sequelizeError.name = 'SequelizeUniqueConstraintError';
sequelizeError.sql = 'INSERT INTO users (email, name) VALUES ($1, $2)';
sequelizeError.constraint = 'users_email_unique';
sequelizeError.table = 'users';
sequelizeError.fields = { email: 'duplicate@example.com', name: 'John Doe' };
sequelizeError.detail = 'Key (email)=(duplicate@example.com) already exists.';
sequelizeError.original = new Error('duplicate key value violates unique constraint "users_email_unique"');

console.log(LogUtil.formatError(sequelizeError));
console.log('\n' + '='.repeat(50) + '\n');

// 3. Partial Sequelize Error
console.log('3. Sequelize Error (Partial):');
const partialSequelizeError = new Error('Foreign key constraint') as SequelizeError;
partialSequelizeError.name = 'SequelizeForeignKeyConstraintError';
partialSequelizeError.constraint = 'fk_user_posts';
partialSequelizeError.table = 'posts';

console.log(LogUtil.formatError(partialSequelizeError));
console.log('\n' + '='.repeat(50) + '\n');

// 4. Non-Error Values
console.log('4. Non-Error Values:');

console.log('String:', LogUtil.formatError('Simple error message'));
console.log('Number:', LogUtil.formatError(404));
console.log('Boolean:', LogUtil.formatError(false));
console.log('Object:', LogUtil.formatError({ error: 'Server error', code: 500, details: ['Invalid input', 'Missing field'] }));
console.log('Array:', LogUtil.formatError(['error1', 'error2', 'error3']));
console.log('Null:', LogUtil.formatError(null));
console.log('Undefined:', LogUtil.formatError(undefined));

console.log('\n' + '='.repeat(50) + '\n');

// 5. Edge Cases
console.log('5. Edge Cases:');

// Circular reference
const circular: any = { name: 'circular' };
circular.self = circular;
console.log('Circular Object:', LogUtil.formatError(circular));

// BigInt
console.log('BigInt:', LogUtil.formatError(BigInt(123456789012345)));

// Symbol
console.log('Symbol:', LogUtil.formatError(Symbol('test')));

// Empty error
const emptyError = new Error('');
emptyError.name = '';
console.log('Empty Error:', LogUtil.formatError(emptyError));

console.log('\n=== Demo Complete ===');
