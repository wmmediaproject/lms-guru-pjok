-- =============================================================================
-- Fase 9: Dashboard Views & RPC
-- Agregasi data untuk halaman Dashboard.
-- Semua view mengecualikan siswa berstatus 'lulus' (kolom status opsional).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- VIEW: dashboard_student_summary
-- Ringkasan total siswa aktif per kelas, termasuk jenis kelamin.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW dashboard_student_summary AS
SELECT
  kelas,
  COUNT(*)::int                                           AS total_aktif,
  COUNT(*) FILTER (WHERE jenis_kelamin = 'L')::int        AS total_laki,
  COUNT(*) FILTER (WHERE jenis_kelamin = 'P')::int        AS total_perempuan
FROM students
WHERE status IS DISTINCT FROM 'lulus'
GROUP BY kelas
ORDER BY kelas;

GRANT SELECT ON dashboard_student_summary TO authenticated;

-- ---------------------------------------------------------------------------
-- VIEW: dashboard_grade_stats
-- Statistik nilai per kelas per periode:
--   rata-rata 4 komponen, jumlah Tuntas / Belum Tuntas,
--   jumlah siswa sudah ada nilai (lengkap), total aktif.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW dashboard_grade_stats AS
SELECT
  g.period_id,
  g.kelas_saat_nilai                                              AS kelas,
  ROUND(AVG(g.nilai_praktek)::numeric, 2)::float8                AS avg_praktek,
  ROUND(AVG(g.nilai_uh)::numeric, 2)::float8                     AS avg_uh,
  ROUND(AVG(g.nilai_asts)::numeric, 2)::float8                   AS avg_asts,
  ROUND(AVG(g.nilai_asas)::numeric, 2)::float8                   AS avg_asas,
  ROUND(AVG(g.nilai_akhir)::numeric, 2)::float8                  AS avg_nilai_akhir,
  COUNT(*) FILTER (WHERE g.predikat = 'Tuntas')::int             AS jumlah_tuntas,
  COUNT(*) FILTER (WHERE g.predikat = 'Belum Tuntas')::int       AS jumlah_belum_tuntas,
  -- siswa yang sudah memiliki baris grade (belum tentu lengkap)
  COUNT(*)::int                                                   AS jumlah_sudah_ada_nilai,
  -- siswa dengan keempat komponen terisi (nilai_akhir not null)
  COUNT(*) FILTER (WHERE g.nilai_akhir IS NOT NULL)::int          AS jumlah_lengkap
FROM grades g
JOIN students s ON s.id = g.student_id
WHERE s.status IS DISTINCT FROM 'lulus'
GROUP BY g.period_id, g.kelas_saat_nilai
ORDER BY g.kelas_saat_nilai;

GRANT SELECT ON dashboard_grade_stats TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: get_dashboard_summary(p_period_id uuid)
-- Mengembalikan satu baris JSON ringkasan dashboard untuk periode tertentu.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_period_id uuid)
RETURNS TABLE (
  kelas             int,
  total_aktif       int,
  total_laki        int,
  total_perempuan   int,
  jumlah_lengkap    int,
  jumlah_belum      int,
  avg_praktek       float8,
  avg_uh            float8,
  avg_asts          float8,
  avg_asas          float8,
  avg_nilai_akhir   float8,
  jumlah_tuntas     int,
  jumlah_belum_tuntas int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.kelas,
    s.total_aktif,
    s.total_laki,
    s.total_perempuan,
    COALESCE(g.jumlah_lengkap, 0)::int        AS jumlah_lengkap,
    (s.total_aktif - COALESCE(g.jumlah_lengkap, 0))::int  AS jumlah_belum,
    COALESCE(g.avg_praktek, 0)                AS avg_praktek,
    COALESCE(g.avg_uh, 0)                     AS avg_uh,
    COALESCE(g.avg_asts, 0)                   AS avg_asts,
    COALESCE(g.avg_asas, 0)                   AS avg_asas,
    COALESCE(g.avg_nilai_akhir, 0)            AS avg_nilai_akhir,
    COALESCE(g.jumlah_tuntas, 0)::int         AS jumlah_tuntas,
    COALESCE(g.jumlah_belum_tuntas, 0)::int   AS jumlah_belum_tuntas
  FROM dashboard_student_summary s
  LEFT JOIN dashboard_grade_stats g
    ON g.kelas = s.kelas
   AND g.period_id = p_period_id
  ORDER BY s.kelas;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_summary(uuid) TO authenticated;
