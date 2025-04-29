-- Create password history table
CREATE TABLE IF NOT EXISTS password_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);

-- Add trigger to automatically add old password to history when password is updated
CREATE OR REPLACE FUNCTION add_password_to_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.password_hash IS NOT NULL AND OLD.password_hash != NEW.password_hash THEN
    INSERT INTO password_history (user_id, password_hash)
    VALUES (OLD.user_id, OLD.password_hash);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER password_history_trigger
AFTER UPDATE OF password_hash ON user_credentials
FOR EACH ROW
EXECUTE FUNCTION add_password_to_history(); 