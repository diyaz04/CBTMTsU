// Tipe manual yang merefleksikan supabase/migrations/*.sql.
// Ganti dengan hasil `supabase gen types typescript --linked` begitu project
// Supabase sudah di-link — strukturnya kompatibel (Database["public"]["Tables"]...).

export type UserRole = "super_admin" | "admin" | "guru" | "proktor"
export type TipeSoal = "multiple-choice" | "essay"
export type ModeKoreksi = "A" | "M"
export type AttemptStatus = "not_started" | "in_progress" | "submitted" | "auto_submitted"

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: { id: string; nama: string; created_at: string }
        Insert: { id?: string; nama: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["schools"]["Insert"]>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          school_id: string | null
          role: UserRole
          nama: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          school_id?: string | null
          role: UserRole
          nama: string
          email: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      students: {
        Row: {
          id: string
          school_id: string
          nisn: string
          nama: string
          kelas: string
          username: string
          tanggal_lahir: string
          created_at: string
        }
        Insert: {
          id: string
          school_id: string
          nisn: string
          nama: string
          kelas: string
          username: string
          tanggal_lahir: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>
        Relationships: []
      }
      exams: {
        Row: {
          id: string
          school_id: string
          nama_ujian: string
          paket: string
          created_by: string | null
          created_at: string
          acak_soal: boolean
          acak_opsi: boolean
          tampilkan_nilai: boolean
        }
        Insert: {
          id?: string
          school_id: string
          nama_ujian: string
          paket: string
          created_by?: string | null
          created_at?: string
          acak_soal?: boolean
          acak_opsi?: boolean
          tampilkan_nilai?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["exams"]["Insert"]>
        Relationships: []
      }
      question_groups: {
        Row: {
          id: string
          exam_id: string
          kode_grup: string
          nama_grup: string
          deskripsi: string | null
          bobot_grup: number
          urutan: number
        }
        Insert: {
          id?: string
          exam_id: string
          kode_grup: string
          nama_grup: string
          deskripsi?: string | null
          bobot_grup?: number
          urutan?: number
        }
        Update: Partial<Database["public"]["Tables"]["question_groups"]["Insert"]>
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          group_id: string
          tipe_soal: TipeSoal
          judul: string
          mode_koreksi: ModeKoreksi
          bobot: number
          konten: string
          gambar_url: string | null
          urutan: number
        }
        Insert: {
          id?: string
          group_id: string
          tipe_soal: TipeSoal
          judul: string
          mode_koreksi?: ModeKoreksi
          bobot?: number
          konten: string
          gambar_url?: string | null
          urutan?: number
        }
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>
        Relationships: []
      }
      question_options: {
        Row: {
          id: string
          question_id: string
          label: string
          teks: string
          bobot: number
          is_correct: boolean
          urutan: number
        }
        Insert: {
          id?: string
          question_id: string
          label: string
          teks: string
          bobot?: number
          is_correct?: boolean
          urutan?: number
        }
        Update: Partial<Database["public"]["Tables"]["question_options"]["Insert"]>
        Relationships: []
      }
      exam_sessions: {
        Row: {
          id: string
          exam_id: string
          tanggal: string
          sesi_ke: number
          ruang: string
          mapel: string
          token: string | null
          waktu_mulai: string
          durasi_menit: number
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          tanggal: string
          sesi_ke: number
          ruang: string
          mapel: string
          token?: string | null
          waktu_mulai: string
          durasi_menit: number
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["exam_sessions"]["Insert"]>
        Relationships: []
      }
      session_students: {
        Row: {
          id: string
          session_id: string
          student_id: string
          no_peserta: string
          last_seen_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          student_id: string
          no_peserta: string
          last_seen_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["session_students"]["Insert"]>
        Relationships: []
      }
      exam_attempts: {
        Row: {
          id: string
          session_student_id: string
          status: AttemptStatus
          soal_order: string[] | null
          started_at: string | null
          submitted_at: string | null
          created_at: string
          paused_at: string | null
          paused_duration_seconds: number
        }
        Insert: {
          id?: string
          session_student_id: string
          status?: AttemptStatus
          soal_order?: string[] | null
          started_at?: string | null
          submitted_at?: string | null
          created_at?: string
          paused_at?: string | null
          paused_duration_seconds?: number
        }
        Update: Partial<Database["public"]["Tables"]["exam_attempts"]["Insert"]>
        Relationships: []
      }
      answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          selected_option_id: string | null
          essay_text: string | null
          skor: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          selected_option_id?: string | null
          essay_text?: string | null
          skor?: number | null
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["answers"]["Insert"]>
        Relationships: []
      }
      scores: {
        Row: {
          id: string
          attempt_id: string
          nilai_auto: number
          nilai_manual: number
          total: number
          dinilai_oleh: string | null
          dinilai_at: string | null
        }
        Insert: {
          id?: string
          attempt_id: string
          nilai_auto?: number
          nilai_manual?: number
          total?: number
          dinilai_oleh?: string | null
          dinilai_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["scores"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      tipe_soal: TipeSoal
      mode_koreksi: ModeKoreksi
      attempt_status: AttemptStatus
    }
    CompositeTypes: Record<string, never>
  }
}
