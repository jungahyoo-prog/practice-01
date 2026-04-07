export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      dashboard_projects: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          owner: string
          priority: '최우선' | '높음' | '보통'
          progress: number
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id: string
          name: string
          owner: string
          priority: '최우선' | '높음' | '보통'
          progress?: number
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          owner?: string
          priority?: '최우선' | '높음' | '보통'
          progress?: number
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_schedules: {
        Row: {
          created_at: string
          date: string
          id: string
          kind: 'major' | 'general'
          memo: string
          priority: '최우선' | '높음' | '보통'
          project_id: string
          repeat_custom: string
          repeat_custom_label: string
          repeat_type: 'none' | 'daily' | 'weekday' | 'weekly' | 'monthly' | 'yearly' | 'custom'
          time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id: string
          kind: 'major' | 'general'
          memo?: string
          priority: '최우선' | '높음' | '보통'
          project_id: string
          repeat_custom?: string
          repeat_custom_label?: string
          repeat_type?: 'none' | 'daily' | 'weekday' | 'weekly' | 'monthly' | 'yearly' | 'custom'
          time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          kind?: 'major' | 'general'
          memo?: string
          priority?: '최우선' | '높음' | '보통'
          project_id?: string
          repeat_custom?: string
          repeat_custom_label?: string
          repeat_type?: 'none' | 'daily' | 'weekday' | 'weekly' | 'monthly' | 'yearly' | 'custom'
          time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'dashboard_schedules_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'dashboard_projects'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
