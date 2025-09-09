-- Initialize the test database with some sample data and constraints

-- Create a users table with constraints
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INTEGER CHECK (age >= 0 AND age <= 120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a posts table with foreign key constraint
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create an index on email for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert some test data
INSERT INTO users (email, name, age) VALUES 
    ('john.doe@example.com', 'John Doe', 30),
    ('jane.smith@example.com', 'Jane Smith', 25)
ON CONFLICT (email) DO NOTHING;

-- Insert some test posts
INSERT INTO posts (title, content, user_id) VALUES 
    ('First Post', 'This is the first post content', 1),
    ('Second Post', 'This is the second post content', 2)
ON CONFLICT DO NOTHING;
