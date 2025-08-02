-- Create Audit Log System for Invitations
-- This migration creates tables and functions for tracking all invitation-related activities

-- Create the main audit log table
CREATE TABLE IF NOT EXISTS invitation_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject', 'restore'
    table_name TEXT NOT NULL, -- 'Invitations', 'needy_individuals', etc.
    record_id UUID NOT NULL, -- ID of the affected record
    user_id UUID, -- ID of the admin user who performed the action
    admin_email TEXT, -- Email of the admin user
    old_data JSONB, -- Previous state of the record (for updates/deletes)
    new_data JSONB, -- New state of the record (for creates/updates)
    action_details JSONB, -- Additional details about the action
    ip_address INET, -- IP address of the admin
    user_agent TEXT, -- Browser/device info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    is_restored BOOLEAN DEFAULT FALSE,
    restored_at TIMESTAMP WITH TIME ZONE,
    restored_by UUID,
    restored_by_email TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON invitation_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON invitation_audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON invitation_audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON invitation_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_expires_at ON invitation_audit_logs(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_not_restored ON invitation_audit_logs(is_restored) WHERE is_restored = FALSE;

-- Create a function to log audit events
CREATE OR REPLACE FUNCTION log_invitation_audit_event(
    p_action_type TEXT,
    p_table_name TEXT,
    p_record_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_admin_email TEXT DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_action_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO invitation_audit_logs (
        action_type,
        table_name,
        record_id,
        user_id,
        admin_email,
        old_data,
        new_data,
        action_details,
        ip_address,
        user_agent
    ) VALUES (
        p_action_type,
        p_table_name,
        p_record_id,
        p_user_id,
        p_admin_email,
        p_old_data,
        p_new_data,
        p_action_details,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to restore deleted invitations
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
    
    -- Restore the invitation based on the table
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
        
    ELSIF audit_record.table_name = 'needy_individuals' THEN
        INSERT INTO needy_individuals (
            id,
            full_name,
            email,
            phone,
            language,
            support_needs,
            urgency_level,
            status,
            source,
            metadata,
            created_at
        ) SELECT 
            (audit_record.old_data->>'id')::UUID,
            audit_record.old_data->>'full_name',
            audit_record.old_data->>'email',
            audit_record.old_data->>'phone',
            audit_record.old_data->>'language',
            audit_record.old_data->>'support_needs'::TEXT[],
            audit_record.old_data->>'urgency_level',
            audit_record.old_data->>'status',
            audit_record.old_data->>'source',
            audit_record.old_data->>'metadata'::JSONB,
            (audit_record.old_data->>'created_at')::TIMESTAMP WITH TIME ZONE;
            
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

-- Create a function to get audit logs for a specific record
CREATE OR REPLACE FUNCTION get_invitation_audit_history(
    p_record_id UUID,
    p_table_name TEXT DEFAULT 'Invitations'
)
RETURNS TABLE (
    audit_id UUID,
    action_type TEXT,
    action_timestamp TIMESTAMP WITH TIME ZONE,
    admin_email TEXT,
    action_details JSONB,
    is_restored BOOLEAN,
    restored_by_email TEXT,
    restored_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ial.id,
        ial.action_type,
        ial.created_at,
        ial.admin_email,
        ial.action_details,
        ial.is_restored,
        ial.restored_by_email,
        ial.restored_at
    FROM invitation_audit_logs ial
    WHERE ial.record_id = p_record_id 
    AND ial.table_name = p_table_name
    ORDER BY ial.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get all restorable records
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
        CASE 
            WHEN ial.table_name = 'Invitations' THEN
                jsonb_build_object(
                    'name', ial.old_data->>'name',
                    'email', ial.old_data->>'email',
                    'phone', ial.old_data->>'phone',
                    'category', ial.old_data->>'invitation_category',
                    'status', ial.old_data->>'status'
                )
            WHEN ial.table_name = 'needy_individuals' THEN
                jsonb_build_object(
                    'name', ial.old_data->>'full_name',
                    'email', ial.old_data->>'email',
                    'phone', ial.old_data->>'phone',
                    'status', ial.old_data->>'status'
                )
            ELSE ial.old_data
        END as record_summary,
        (ial.action_type = 'delete' AND ial.is_restored = FALSE AND ial.expires_at > NOW()) as can_restore
    FROM invitation_audit_logs ial
    WHERE ial.created_at >= NOW() - INTERVAL '1 day' * p_days_back
    AND ial.action_type IN ('delete', 'update', 'approve', 'reject')
    ORDER BY ial.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a cleanup function to remove expired audit logs
CREATE OR REPLACE FUNCTION cleanup_expired_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM invitation_audit_logs 
    WHERE expires_at < NOW() 
    AND is_restored = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired logs (runs daily)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * *', 'SELECT cleanup_expired_audit_logs();');

-- Add comments for documentation
COMMENT ON TABLE invitation_audit_logs IS 'Audit log for all invitation-related activities with 30-day retention and restore capabilities';
COMMENT ON FUNCTION log_invitation_audit_event IS 'Logs an audit event for invitation-related activities';
COMMENT ON FUNCTION restore_invitation IS 'Restores a deleted invitation from audit log';
COMMENT ON FUNCTION get_invitation_audit_history IS 'Gets audit history for a specific invitation record';
COMMENT ON FUNCTION get_restorable_records IS 'Gets all records that can be restored within the retention period';
COMMENT ON FUNCTION cleanup_expired_audit_logs IS 'Removes audit logs that have expired (older than 30 days)'; 