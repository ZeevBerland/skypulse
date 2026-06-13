-- Events are discovered before an agent run is created, so run_id must be nullable
ALTER TABLE events ALTER COLUMN run_id DROP NOT NULL;
ALTER TABLE events ALTER COLUMN run_id SET DEFAULT NULL;
