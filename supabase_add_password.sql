-- Add password field and make email unique for email/password authentication
ALTER TABLE users 
  ADD COLUMN password VARCHAR(255),
  MODIFY COLUMN email VARCHAR(320) NOT NULL,
  ADD UNIQUE KEY unique_email (email),
  MODIFY COLUMN loginMethod VARCHAR(64) DEFAULT 'email';
