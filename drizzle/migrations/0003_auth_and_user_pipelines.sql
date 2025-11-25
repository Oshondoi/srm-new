-- Add authentication support and user-pipeline relationship

-- Add password_hash to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Make email unique
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Add user_id to pipelines (each pipeline belongs to a user)
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id to other entities for data isolation
ALTER TABLE companies ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create function to auto-create default pipeline for new users
CREATE OR REPLACE FUNCTION create_default_pipeline_for_user()
RETURNS TRIGGER AS $$
DECLARE
  pipeline_id UUID;
BEGIN
  -- Create default pipeline
  INSERT INTO pipelines (name, user_id)
  VALUES ('Основная воронка', NEW.id)
  RETURNING id INTO pipeline_id;
  
  -- Create default stages for the pipeline
  INSERT INTO stages (pipeline_id, name, position)
  VALUES 
    (pipeline_id, 'Первичный контакт', 1),
    (pipeline_id, 'Переговоры', 2),
    (pipeline_id, 'Принимают решение', 3),
    (pipeline_id, 'Согласование договора', 4),
    (pipeline_id, 'Успешно реализовано', 5);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create pipeline on user registration
DROP TRIGGER IF EXISTS trigger_create_default_pipeline ON users;
CREATE TRIGGER trigger_create_default_pipeline
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_pipeline_for_user();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pipelines_user_id ON pipelines(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
