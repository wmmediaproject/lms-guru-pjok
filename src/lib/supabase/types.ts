export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      periods: {
        Row: {
          id: string
          tahun_mulai: number
          semester: 'ganjil' | 'genap'
          nama: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tahun_mulai: number
          semester: 'ganjil' | 'genap'
          nama: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tahun_mulai?: number
          semester?: 'ganjil' | 'genap'
          nama?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          id: string
          nisn: string
          nama: string
          kelas: number
          jenis_kelamin: 'L' | 'P' | null
          status?: 'aktif' | 'lulus'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nisn: string
          nama: string
          kelas: number
          jenis_kelamin?: 'L' | 'P' | null
          status?: 'aktif' | 'lulus'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nisn?: string
          nama?: string
          kelas?: number
          jenis_kelamin?: 'L' | 'P' | null
          status?: 'aktif' | 'lulus'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          id: string
          student_id: string
          period_id: string
          kelas_saat_nilai: number
          nilai_praktek: number | null
          nilai_uh: number | null
          nilai_asts: number | null
          nilai_asas: number | null
          nilai_akhir: number | null
          predikat: 'Tuntas' | 'Belum Tuntas' | null
          keterangan: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          period_id: string
          kelas_saat_nilai: number
          nilai_praktek?: number | null
          nilai_uh?: number | null
          nilai_asts?: number | null
          nilai_asas?: number | null
          nilai_akhir?: number | null
          predikat?: 'Tuntas' | 'Belum Tuntas' | null
          keterangan?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          period_id?: string
          kelas_saat_nilai?: number
          nilai_praktek?: number | null
          nilai_uh?: number | null
          nilai_asts?: number | null
          nilai_asas?: number | null
          nilai_akhir?: number | null
          predikat?: 'Tuntas' | 'Belum Tuntas' | null
          keterangan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'grades_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grades_period_id_fkey'
            columns: ['period_id']
            isOneToOne: false
            referencedRelation: 'periods'
            referencedColumns: ['id']
          },
        ]
      }
      settings: {
        Row: {
          id: string
          nama_sekolah: string | null
          kkm: number
          bobot_praktek: number
          bobot_uh: number
          bobot_asts: number
          bobot_asas: number
          last_promoted_at?: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          nama_sekolah?: string | null
          kkm?: number
          bobot_praktek?: number
          bobot_uh?: number
          bobot_asts?: number
          bobot_asas?: number
          last_promoted_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          nama_sekolah?: string | null
          kkm?: number
          bobot_praktek?: number
          bobot_uh?: number
          bobot_asts?: number
          bobot_asas?: number
          last_promoted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          role: 'admin'
        }
        Insert: {
          id: string
          role?: 'admin'
        }
        Update: {
          id?: string
          role?: 'admin'
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      set_active_period: {
        Args: {
          p_period_id: string
        }
        Returns: undefined
      }
      hitung_nilai_akhir: {
        Args: {
          p_praktek: number | null
          p_uh: number | null
          p_asts: number | null
          p_asas: number | null
          p_bobot_praktek: number
          p_bobot_uh: number
          p_bobot_asts: number
          p_bobot_asas: number
        }
        Returns: number | null
      }
      tentukan_predikat: {
        Args: {
          p_nilai_akhir: number | null
          p_kkm: number
        }
        Returns: string | null
      }
      upsert_students_csv: {
        Args: {
          p_rows: Json
        }
        Returns: {
          inserted: number
          updated: number
        }
      }
      promote_students_massal: {
        Args: Record<PropertyKey, never>
        Returns: {
          promoted_1_to_2: number
          promoted_2_to_3: number
          promoted_3_to_4: number
          promoted_4_to_5: number
          promoted_5_to_6: number
          graduated_kelas_6: number
          total_affected: number
          executed_at: string
        }
      }
      ensure_admin_profile: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience row types
export type Period = Database['public']['Tables']['periods']['Row']
export type PeriodInsert = Database['public']['Tables']['periods']['Insert']
export type PeriodUpdate = Database['public']['Tables']['periods']['Update']

export type Student = Database['public']['Tables']['students']['Row']
export type StudentInsert = Database['public']['Tables']['students']['Insert']
export type StudentUpdate = Database['public']['Tables']['students']['Update']

export type Grade = Database['public']['Tables']['grades']['Row']
export type GradeInsert = Database['public']['Tables']['grades']['Insert']
export type GradeUpdate = Database['public']['Tables']['grades']['Update']

export type Settings = Database['public']['Tables']['settings']['Row']
export type SettingsUpdate = Database['public']['Tables']['settings']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
