-- Update existing draft records to pending
UPDATE Script SET state = 'pending' WHERE state = 'draft';

