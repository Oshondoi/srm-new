-- Create deal_contacts junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS deal_contacts (
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (deal_id, contact_id)
);

-- Migrate existing contact_id from deals to deal_contacts
INSERT INTO deal_contacts (deal_id, contact_id)
SELECT id, contact_id 
FROM deals 
WHERE contact_id IS NOT NULL
ON CONFLICT DO NOTHING;
