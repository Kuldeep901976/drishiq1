import { logger } from './logger';
import { supabase } from './supabase';

export interface NeedyIndividual {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  country?: string;
  state?: string;
  city?: string;
  postal_code?: string;
  language: string;
  income_level?: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  employment_status?: 'unemployed' | 'part_time' | 'full_time' | 'student' | 'retired' | 'disabled';
  education_level?: 'none' | 'primary' | 'secondary' | 'bachelor' | 'master' | 'phd';
  support_needs: string[];
  preferred_invitation_types: string[];
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  contact_preference: 'email' | 'phone' | 'sms' | 'whatsapp';
  contact_time: 'morning' | 'afternoon' | 'evening' | 'anytime';
  status: 'active' | 'inactive' | 'contacted' | 'enrolled' | 'completed';
  priority_score: number;
  last_contact_date?: string;
  notes?: string;
  is_verified: boolean;
  verification_date?: string;
  verified_by?: string;
  source?: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SupportCreditAllocation {
  id: string;
  supporter_id: string;
  needy_id: string;
  allocated_credits: number;
  used_credits: number;
  available_credits: number;
  purpose: 'general' | 'education' | 'healthcare' | 'employment' | 'housing' | 'specific_invitation';
  invitation_type_restriction: string[];
  max_credits_per_invitation: number;
  valid_from: string;
  valid_to?: string;
  is_active: boolean;
  created_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NeedyInvitationRequest {
  id: string;
  needy_id: string;
  invitation_type: 'investment_management' | 'story' | 'testimonial';
  status: 'pending' | 'approved' | 'rejected' | 'sent' | 'completed';
  priority: number;
  requested_credits: number;
  allocated_credits: number;
  supporter_id?: string;
  allocation_id?: string;
  reason?: string;
  urgency_notes?: string;
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BulkUploadResult {
  upload_id: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  errors: Array<{
    row_number: number;
    field_name?: string;
    error_message: string;
  }>;
}

export class NeedySupportService {
  /**
   * Create a new needy individual
   */
  static async createNeedyIndividual(data: Partial<NeedyIndividual>): Promise<NeedyIndividual> {
    try {
      const { data: needy, error } = await supabase
        .from('needy_individuals')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      logger.info('Needy individual created', { needy_id: needy.id });
      return needy;
    } catch (error) {
      logger.error('Error creating needy individual:', error);
      throw error;
    }
  }

  /**
   * Get needy individual by ID
   */
  static async getNeedyIndividual(id: string): Promise<NeedyIndividual | null> {
    try {
      const { data, error } = await supabase
        .from('needy_individuals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching needy individual:', error);
      throw error;
    }
  }

  /**
   * List needy individuals with filters
   */
  static async listNeedyIndividuals(params: {
    status?: string;
    urgency_level?: string;
    country?: string;
    support_needs?: string[];
    preferred_invitation_types?: string[];
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<{ data: NeedyIndividual[]; total: number }> {
    try {
      let query = supabase
        .from('needy_individuals')
        .select('*', { count: 'exact' });

      // Apply filters
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.urgency_level) {
        query = query.eq('urgency_level', params.urgency_level);
      }
      if (params.country) {
        query = query.eq('country', params.country);
      }
      if (params.support_needs?.length) {
        query = query.overlaps('support_needs', params.support_needs);
      }
      if (params.preferred_invitation_types?.length) {
        query = query.overlaps('preferred_invitation_types', params.preferred_invitation_types);
      }
      if (params.search) {
        query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
      }

      // Apply pagination
      if (params.limit) {
        query = query.limit(params.limit);
      }
      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }

      const { data, error, count } = await query.order('priority_score', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error listing needy individuals:', error);
      throw error;
    }
  }

  /**
   * Update needy individual
   */
  static async updateNeedyIndividual(id: string, updates: Partial<NeedyIndividual>): Promise<NeedyIndividual> {
    try {
      const { data, error } = await supabase
        .from('needy_individuals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logger.info('Needy individual updated', { needy_id: id });
      return data;
    } catch (error) {
      logger.error('Error updating needy individual:', error);
      throw error;
    }
  }

  /**
   * Delete needy individual
   */
  static async deleteNeedyIndividual(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('needy_individuals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      logger.info('Needy individual deleted', { needy_id: id });
    } catch (error) {
      logger.error('Error deleting needy individual:', error);
      throw error;
    }
  }

  /**
   * Allocate support credits to needy individual
   */
  static async allocateSupportCredits(params: {
    supporter_id: string;
    needy_id: string;
    allocated_credits: number;
    purpose?: string;
    valid_to?: string;
    notes?: string;
  }): Promise<SupportCreditAllocation> {
    try {
      const { data, error } = await supabase
        .rpc('allocate_support_credits', {
          supporter_uuid: params.supporter_id,
          needy_uuid: params.needy_id,
          credits_amount: params.allocated_credits,
          purpose_text: params.purpose || 'general',
          valid_until: params.valid_to,
          notes_text: params.notes
        });

      if (error) throw error;

      // Get the created allocation
      const { data: allocation, error: fetchError } = await supabase
        .from('support_credit_allocations')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) throw fetchError;

      logger.info('Support credits allocated', { 
        allocation_id: allocation.id,
        supporter_id: params.supporter_id,
        needy_id: params.needy_id,
        credits: params.allocated_credits
      });

      return allocation;
    } catch (error) {
      logger.error('Error allocating support credits:', error);
      throw error;
    }
  }

  /**
   * Get support credit allocations for a needy individual
   */
  static async getSupportCreditAllocations(needy_id: string): Promise<SupportCreditAllocation[]> {
    try {
      const { data, error } = await supabase
        .from('support_credit_allocations')
        .select(`
          *,
          supporter:users(id, email, full_name)
        `)
        .eq('needy_id', needy_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error fetching support credit allocations:', error);
      throw error;
    }
  }

  /**
   * Create invitation request for needy individual
   */
  static async createInvitationRequest(params: {
    needy_id: string;
    invitation_type: string;
    requested_credits?: number;
    reason?: string;
    urgency_notes?: string;
  }): Promise<NeedyInvitationRequest> {
    try {
      const { data, error } = await supabase
        .from('needy_invitation_requests')
        .insert([{
          needy_id: params.needy_id,
          invitation_type: params.invitation_type,
          requested_credits: params.requested_credits || 1,
          reason: params.reason,
          urgency_notes: params.urgency_notes
        }])
        .select()
        .single();

      if (error) throw error;

      logger.info('Invitation request created', { 
        request_id: data.id,
        needy_id: params.needy_id,
        invitation_type: params.invitation_type
      });

      return data;
    } catch (error) {
      logger.error('Error creating invitation request:', error);
      throw error;
    }
  }

  /**
   * Process invitation request and send invitation
   */
  static async processInvitationRequest(request_id: string, admin_notes?: string): Promise<boolean> {
    try {
      // Get the request
      const { data: request, error: fetchError } = await supabase
        .from('needy_invitation_requests')
        .select('*')
        .eq('id', request_id)
        .single();

      if (fetchError) throw fetchError;

      if (!request) {
        throw new Error('Invitation request not found');
      }

      // Try to use support credits for this invitation
      const { data: success, error: creditError } = await supabase
        .rpc('use_support_credits_for_invitation', {
          needy_uuid: request.needy_id,
          invitation_type_text: request.invitation_type,
          credits_needed: request.requested_credits,
          reason_text: request.reason
        });

      if (creditError) throw creditError;

      if (!success) {
        // No available credits, update request status
        const { error: updateError } = await supabase
          .from('needy_invitation_requests')
          .update({
            status: 'rejected',
            admin_notes: admin_notes || 'No available support credits',
            processed_at: new Date().toISOString()
          })
          .eq('id', request_id);

        if (updateError) throw updateError;

        logger.warn('Invitation request rejected - no available credits', { request_id });
        return false;
      }

      // Create invitation based on type
      const invitationData: any = {
        email: '', // Will be filled from needy individual
        phone: '', // Will be filled from needy individual
        full_name: '', // Will be filled from needy individual
        language: 'en',
        status: 'pending',
        invitation_type: request.invitation_type,
        source: 'needy_support'
      };

      // Get needy individual details
      const needy = await this.getNeedyIndividual(request.needy_id);
      if (needy) {
        invitationData.email = needy.email;
        invitationData.phone = needy.phone;
        invitationData.full_name = needy.full_name;
        invitationData.language = needy.language;
      }

      // Add type-specific fields
      switch (request.invitation_type) {
        case 'investment_management':
          invitationData.investment_goals = [];
          invitationData.risk_tolerance = 'moderate';
          invitationData.investment_amount = 0;
          break;
        case 'story':
          invitationData.story_category = 'general';
          invitationData.story_theme = '';
          break;
        case 'testimonial':
          invitationData.testimonial_type = 'general';
          invitationData.experience_level = 'beginner';
          break;
      }

      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .insert([invitationData])
        .select()
        .single();

      if (invitationError) throw invitationError;

      // Update request status
      const { error: updateError } = await supabase
        .from('needy_invitation_requests')
        .update({
          status: 'sent',
          admin_notes: admin_notes,
          processed_at: new Date().toISOString(),
          sent_at: new Date().toISOString()
        })
        .eq('id', request_id);

      if (updateError) throw updateError;

      logger.info('Invitation request processed successfully', { 
        request_id,
        invitation_id: invitation.id
      });

      return true;
    } catch (error) {
      logger.error('Error processing invitation request:', error);
      throw error;
    }
  }

  /**
   * Bulk upload needy individuals from CSV
   */
  static async bulkUploadNeedyIndividuals(
    file: File,
    uploadName: string,
    uploadedBy: string
  ): Promise<BulkUploadResult> {
    try {
      // Create upload record
      const { data: upload, error: uploadError } = await supabase
        .from('needy_bulk_uploads')
        .insert([{
          upload_name: uploadName,
          file_name: file.name,
          file_size: file.size,
          status: 'uploading',
          uploaded_by: uploadedBy
        }])
        .select()
        .single();

      if (uploadError) throw uploadError;

      // Parse CSV file
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const records = lines.slice(1).filter(line => line.trim());

      let successfulRecords = 0;
      let failedRecords = 0;
      const errors: Array<{ row_number: number; field_name?: string; error_message: string }> = [];

      // Process each record
      for (let i = 0; i < records.length; i++) {
        const line = records[i];
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const record: any = {};

        // Map CSV columns to record fields
        headers.forEach((header, index) => {
          if (values[index]) {
            record[header] = values[index];
          }
        });

        try {
          // Validate and transform record
          const needyData = this.transformCsvRecord(record);
          
          // Insert needy individual
          await supabase
            .from('needy_individuals')
            .insert([needyData]);

          successfulRecords++;
        } catch (error) {
          failedRecords++;
          errors.push({
            row_number: i + 2, // +2 because of 0-based index and header row
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });

          // Store error in database
          await supabase
            .from('needy_bulk_upload_errors')
            .insert([{
              upload_id: upload.id,
              row_number: i + 2,
              error_message: error instanceof Error ? error.message : 'Unknown error',
              raw_data: record
            }]);
        }
      }

      // Update upload record
      const { error: updateError } = await supabase
        .from('needy_bulk_uploads')
        .update({
          status: 'completed',
          total_records: records.length,
          successful_records: successfulRecords,
          failed_records: failedRecords,
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', upload.id);

      if (updateError) throw updateError;

      logger.info('Bulk upload completed', {
        upload_id: upload.id,
        total: records.length,
        successful: successfulRecords,
        failed: failedRecords
      });

      return {
        upload_id: upload.id,
        total_records: records.length,
        successful_records: successfulRecords,
        failed_records: failedRecords,
        errors
      };
    } catch (error) {
      logger.error('Error in bulk upload:', error);
      throw error;
    }
  }

  /**
   * Transform CSV record to needy individual data
   */
  private static transformCsvRecord(record: any): Partial<NeedyIndividual> {
    const needyData: Partial<NeedyIndividual> = {
      full_name: record.full_name || record.name || '',
      email: record.email || undefined,
      phone: record.phone || record.mobile || undefined,
      age: record.age ? parseInt(record.age) : undefined,
      gender: record.gender as any,
      country: record.country || undefined,
      state: record.state || undefined,
      city: record.city || undefined,
      postal_code: record.postal_code || record.zip || undefined,
      language: record.language || 'en',
      income_level: record.income_level as any,
      employment_status: record.employment_status as any,
      education_level: record.education_level as any,
      support_needs: record.support_needs ? record.support_needs.split(';').map((s: string) => s.trim()) : [],
      preferred_invitation_types: record.preferred_invitation_types ? record.preferred_invitation_types.split(';').map((s: string) => s.trim()) : [],
      urgency_level: record.urgency_level || 'medium',
      contact_preference: record.contact_preference || 'email',
      contact_time: record.contact_time || 'anytime',
      status: 'active',
      source: 'bulk_upload',
      tags: record.tags ? record.tags.split(';').map((s: string) => s.trim()) : [],
      notes: record.notes || undefined
    };

    // Validate required fields
    if (!needyData.full_name) {
      throw new Error('Full name is required');
    }

    return needyData;
  }

  /**
   * Get bulk upload status
   */
  static async getBulkUploadStatus(uploadId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('needy_bulk_uploads')
        .select('*')
        .eq('id', uploadId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('Error fetching bulk upload status:', error);
      throw error;
    }
  }

  /**
   * Get bulk upload errors
   */
  static async getBulkUploadErrors(uploadId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('needy_bulk_upload_errors')
        .select('*')
        .eq('upload_id', uploadId)
        .order('row_number', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error fetching bulk upload errors:', error);
      throw error;
    }
  }

  /**
   * Get needy support summary statistics
   */
  static async getNeedySupportSummary(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('needy_support_summary')
        .select('*');

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error fetching needy support summary:', error);
      throw error;
    }
  }

  /**
   * Get supporter impact summary
   */
  static async getSupporterImpactSummary(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('supporter_impact_summary')
        .select('*')
        .order('total_credits_allocated', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error fetching supporter impact summary:', error);
      throw error;
    }
  }
} 