// Extended Database Types for Asana-like features
import { Database } from './database.types';

export type ExtendedDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string | null;
          company_id: string | null;
          status: 'active' | 'archived' | 'on_hold';
          color: string;
          icon: string | null;
          start_date: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id?: string | null;
          company_id?: string | null;
          status?: 'active' | 'archived' | 'on_hold';
          color?: string;
          icon?: string | null;
          start_date?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string | null;
          company_id?: string | null;
          status?: 'active' | 'archived' | 'on_hold';
          color?: string;
          icon?: string | null;
          start_date?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: 'owner' | 'member' | 'viewer';
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: 'owner' | 'member' | 'viewer';
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: 'owner' | 'member' | 'viewer';
          created_at?: string;
        };
      };
      sections: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          position?: number;
          created_at?: string;
        };
      };
      task_comments: {
        Row: {
          id: string;
          task_id: string;
          user_id: string | null;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id?: string | null;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string | null;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_attachments: {
        Row: {
          id: string;
          task_id: string;
          file_name: string;
          file_url: string;
          file_size: number | null;
          file_type: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          file_name: string;
          file_url: string;
          file_size?: number | null;
          file_type?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          file_name?: string;
          file_url?: string;
          file_size?: number | null;
          file_type?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          content: string | null;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          content?: string | null;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          content?: string | null;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
      };
      task_dependencies: {
        Row: {
          id: string;
          task_id: string;
          depends_on_task_id: string;
          dependency_type: 'blocks' | 'blocked_by' | 'related';
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          depends_on_task_id: string;
          dependency_type?: 'blocks' | 'blocked_by' | 'related';
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          depends_on_task_id?: string;
          dependency_type?: 'blocks' | 'blocked_by' | 'related';
          created_at?: string;
        };
      };
      custom_fields: {
        Row: {
          id: string;
          project_id: string | null;
          name: string;
          field_type: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'checkbox';
          options: any | null;
          required: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          name: string;
          field_type: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'checkbox';
          options?: any | null;
          required?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          name?: string;
          field_type?: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'checkbox';
          options?: any | null;
          required?: boolean;
          created_at?: string;
        };
      };
      custom_field_values: {
        Row: {
          id: string;
          task_id: string;
          field_id: string;
          value: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          field_id: string;
          value?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          field_id?: string;
          value?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          template_data: any;
          created_by: string | null;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          template_data: any;
          created_by?: string | null;
          is_public?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          template_data?: any;
          created_by?: string | null;
          is_public?: boolean;
          created_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      task_tags: {
        Row: {
          task_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          task_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          task_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
    };
  };
};

// Export types for easy use
export type Project = ExtendedDatabase['public']['Tables']['projects']['Row'];
export type ProjectInsert = ExtendedDatabase['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = ExtendedDatabase['public']['Tables']['projects']['Update'];

export type ProjectMember = ExtendedDatabase['public']['Tables']['project_members']['Row'];
export type Section = ExtendedDatabase['public']['Tables']['sections']['Row'];
export type TaskComment = ExtendedDatabase['public']['Tables']['task_comments']['Row'];
export type TaskAttachment = ExtendedDatabase['public']['Tables']['task_attachments']['Row'];
export type Notification = ExtendedDatabase['public']['Tables']['notifications']['Row'];
export type TaskDependency = ExtendedDatabase['public']['Tables']['task_dependencies']['Row'];
export type CustomField = ExtendedDatabase['public']['Tables']['custom_fields']['Row'];
export type CustomFieldValue = ExtendedDatabase['public']['Tables']['custom_field_values']['Row'];
export type ProjectTemplate = ExtendedDatabase['public']['Tables']['project_templates']['Row'];
export type Tag = ExtendedDatabase['public']['Tables']['tags']['Row'];
export type TaskTag = ExtendedDatabase['public']['Tables']['task_tags']['Row'];
