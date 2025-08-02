-- Cleanup Redundant Tables Migration
-- This migration removes redundant tables and consolidates everything into the Invitations table

-- Drop foreign key constraints first
ALTER TABLE IF EXISTS support_credit_transactions 
DROP CONSTRAINT IF EXISTS support_credit_transactions_allocation_id_fkey;

ALTER TABLE IF EXISTS support_credit_transactions 
DROP CONSTRAINT IF EXISTS support_credit_transactions_needy_id_fkey;

ALTER TABLE IF EXISTS support_credit_transactions 
DROP CONSTRAINT IF EXISTS support_credit_transactions_invitation_id_fkey;

ALTER TABLE IF EXISTS support_credit_allocations 
DROP CONSTRAINT IF EXISTS support_credit_allocations_needy_id_fkey;

ALTER TABLE IF EXISTS support_credit_allocations 
DROP CONSTRAINT IF EXISTS support_credit_allocations_supporter_id_fkey;

ALTER TABLE IF EXISTS needy_invitation_requests 
DROP CONSTRAINT IF EXISTS needy_invitation_requests_needy_id_fkey;

ALTER TABLE IF EXISTS needy_bulk_upload_errors 
DROP CONSTRAINT IF EXISTS needy_bulk_upload_errors_upload_id_fkey;

-- Drop views that depend on these tables
DROP VIEW IF EXISTS needy_support_summary;

-- Drop functions that depend on these tables
DROP FUNCTION IF EXISTS calculate_needy_priority_score(UUID);
DROP FUNCTION IF EXISTS allocate_support_credits(UUID, UUID, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS use_support_credits(UUID, UUID, INTEGER, TEXT, TEXT);

-- Drop the redundant tables
DROP TABLE IF EXISTS support_credit_transactions;
DROP TABLE IF EXISTS support_credit_allocations;
DROP TABLE IF EXISTS needy_invitation_requests;
DROP TABLE IF EXISTS needy_bulk_upload_errors;
DROP TABLE IF EXISTS needy_bulk_uploads;
DROP TABLE IF EXISTS needy_individuals;

-- Update the audit log system to handle the consolidated structure
-- Update the restore function to work with Invitations table only
CREATE OR REPLACE FUNCTION restore_invitation(
    p_audit_log_id UUID,
    p_restored_by UUID DEFAULT NULL,
    p_restored_by_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    audit_record invitation_audit_logs%ROWTYPE;
    restored_count INTEGER;
BEGIN
    -- Get the audit log record
    SELECT * INTO audit_record 
    FROM invitation_audit_logs 
    WHERE id = p_audit_log_id 
    AND action_type = 'delete' 
    AND is_restored = FALSE
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Audit log record not found or cannot be restored';
    END IF;
    
    -- Restore the invitation (only Invitations table now)
    IF audit_record.table_name = 'Invitations' THEN
        INSERT INTO "Invitations" (
            id,
            name,
            email,
            phone,
            language,
            location,
            challenge_description,
            status,
            created_at,
            updated_at,
            token,
            expires_at,
            invitation_type,
            category,
            invitation_category,
            domain_of_life,
            type_of_challenge,
            specific_issue,
            metadata
        ) SELECT 
            (audit_record.old_data->>'id')::UUID,
            audit_record.old_data->>'name',
            audit_record.old_data->>'email',
            audit_record.old_data->>'phone',
            audit_record.old_data->>'language',
            audit_record.old_data->>'location',
            audit_record.old_data->>'challenge_description',
            audit_record.old_data->>'status',
            (audit_record.old_data->>'created_at')::TIMESTAMP WITH TIME ZONE,
            (audit_record.old_data->>'updated_at')::TIMESTAMP WITH TIME ZONE,
            audit_record.old_data->>'token',
            (audit_record.old_data->>'expires_at')::TIMESTAMP WITH TIME ZONE,
            audit_record.old_data->>'invitation_type',
            audit_record.old_data->>'category',
            audit_record.old_data->>'invitation_category',
            audit_record.old_data->>'domain_of_life',
            audit_record.old_data->>'type_of_challenge',
            audit_record.old_data->>'specific_issue',
            audit_record.old_data->>'metadata'::JSONB;
            
        GET DIAGNOSTICS restored_count = ROW_COUNT;
    END IF;
    
    IF restored_count = 0 THEN
        RAISE EXCEPTION 'Failed to restore record';
    END IF;
    
    -- Mark the audit log as restored
    UPDATE invitation_audit_logs 
    SET 
        is_restored = TRUE,
        restored_at = NOW(),
        restored_by = p_restored_by,
        restored_by_email = p_restored_by_email
    WHERE id = p_audit_log_id;
    
    -- Log the restore action
    PERFORM log_invitation_audit_event(
        'restore',
        audit_record.table_name,
        audit_record.record_id,
        p_restored_by,
        p_restored_by_email,
        NULL,
        audit_record.old_data,
        jsonb_build_object('restored_from_audit_id', p_audit_log_id),
        audit_record.ip_address,
        audit_record.user_agent
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update the get_restorable_records function
CREATE OR REPLACE FUNCTION get_restorable_records(
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    audit_id UUID,
    table_name TEXT,
    record_id UUID,
    action_type TEXT,
    action_timestamp TIMESTAMP WITH TIME ZONE,
    admin_email TEXT,
    record_summary JSONB,
    can_restore BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ial.id,
        ial.table_name,
        ial.record_id,
        ial.action_type,
        ial.created_at,
        ial.admin_email,
        jsonb_build_object(
            'name', ial.old_data->>'name',
            'email', ial.old_data->>'email',
            'phone', ial.old_data->>'phone',
            'category', ial.old_data->>'invitation_category',
            'type', ial.old_data->>'invitation_type',
            'status', ial.old_data->>'status'
        ) as record_summary,
        (ial.action_type = 'delete' AND ial.is_restored = FALSE AND ial.expires_at > NOW()) as can_restore
    FROM invitation_audit_logs ial
    WHERE ial.created_at >= NOW() - INTERVAL '1 day' * p_days_back
    AND ial.action_type IN ('delete', 'update', 'approve', 'reject')
    AND ial.table_name = 'Invitations'
    ORDER BY ial.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a new view for admin dashboard
CREATE OR REPLACE VIEW admin_invitations_summary AS
SELECT 
    invitation_type,
    invitation_category,
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7d,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as last_30d
FROM "Invitations"
GROUP BY invitation_type, invitation_category, status
ORDER BY invitation_type, invitation_category, status;

-- Add comments for documentation
COMMENT ON VIEW admin_invitations_summary IS 'Summary view for admin dashboard showing invitation statistics by type and status';
COMMENT ON FUNCTION restore_invitation IS 'Restores a deleted invitation from audit log (updated for consolidated structure)';
COMMENT ON FUNCTION get_restorable_records IS 'Gets all records that can be restored within the retention period (updated for consolidated structure)'; 