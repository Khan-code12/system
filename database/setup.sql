CREATE DATABASE IF NOT EXISTS complaint_system;
USE complaint_system;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin', 'technician') DEFAULT 'student',
    department VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaints table
CREATE TABLE complaints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'resolved', 'closed', 'rejected') DEFAULT 'open',
    location VARCHAR(200),
    technician_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (technician_id) REFERENCES users(id)
);

-- Complaint history table
CREATE TABLE complaint_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    complaint_id INT NOT NULL,
    changed_by INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    comments TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id),
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Infrastructure', 'Building maintenance, facilities, equipment'),
('IT Support', 'Computer issues, network problems, software'),
('Academic', 'Course-related issues, exam problems'),
('Library', 'Library services and resources'),
('Cafeteria', 'Food service and dining issues'),
('Transportation', 'Bus services and parking'),
('Security', 'Safety and security concerns'),
('Other', 'Miscellaneous issues');

-- Insert default admin user (password: admin123)
INSERT INTO users (full_name, username, email, password_hash, role, department) VALUES
('System Administrator', 'admin', 'admin@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'IT Department');

-- Insert sample technician (password: tech123)
INSERT INTO users (full_name, username, email, password_hash, role, department) VALUES
('John Technician', 'tech1', 'tech@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'Maintenance');