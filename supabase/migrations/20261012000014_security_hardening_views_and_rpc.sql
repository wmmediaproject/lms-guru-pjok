-- =============================================================================
-- Fase 10: Security Hardening (Views SECURITY INVOKER & RPC Admin Guard)
-- Memastikan seluruh view berjalan dengan hak akses pemanggil (security_invoker)
-- sehingga RLS tabel dasar selalu dievaluasi, serta menambahkan pengecekan
-- public.is_admin() dan pembatasan GRANT EXECUTE pada seluruh RPC.
-- =============================================================================

-- 1. Set security_invoker = true pada seluruh view dashboard
ALTER VIEW public.dashboard_student_summary SET (security_invoker = true);
ALTER VIEW public.dashboard_grade_stats SET (security_invoker = true);

-- Cabut akses anon/public dari view
REVOKE ALL ON public.dashboard_student_summary FROM PUBLIC, anon;
REVOKE ALL ON public.dashboard_grade_stats FROM PUBLIC, anon;
GRANT SELECT ON public.dashboard_student_summary TO authenticated;
GRANT SELECT ON public.dashboard_grade_stats TO authenticated;

-- 2. Perketat get_dashboard_summary dengan pengecekan public.is_admin()
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(p_period_id uuid)
RETURNS TABLE (
  kelas               int,
  total_aktif         int,
  total_laki          int,
  total_perempuan     int,
  jumlah_lengkap      int,
  jumlah_belum        int,
  avg_praktek         float8,
  avg_uh              float8,
  avg_asts            float8,
  avg_asas            float8,
  avg_nilai_akhir     float8,
  jumlah_tuntas       int,
  jumlah_belum_tuntas int
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: hanya admin yang diizinkan mengambil ringkasan dasbor'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    s.kelas,
    s.total_aktif,
    s.total_laki,
    s.total_perempuan,
    COALESCE(g.jumlah_lengkap, 0)::int                    AS jumlah_lengkap,
    (s.total_aktif - COALESCE(g.jumlah_lengkap, 0))::int  AS jumlah_belum,
    COALESCE(g.avg_praktek, 0)                            AS avg_praktek,
    COALESCE(g.avg_uh, 0)                                 AS avg_uh,
    COALESCE(g.avg_asts, 0)                               AS avg_asts,
    COALESCE(g.avg_asas, 0)                               AS avg_asas,
    COALESCE(g.avg_nilai_akhir, 0)                        AS avg_nilai_akhir,
    COALESCE(g.jumlah_tuntas, 0)::int                     AS jumlah_tuntas,
    COALESCE(g.jumlah_belum_tuntas, 0)::int               AS jumlah_belum_tuntas
  FROM public.dashboard_student_summary s
  LEFT JOIN public.dashboard_grade_stats g
    ON g.kelas = s.kelas
   AND g.period_id = p_period_id
  ORDER BY s.kelas;
END;
$$;

-- 3. Perketat hak eksekusi (REVOKE dari PUBLIC & anon, GRANT hanya ke authenticated)
REVOKE ALL ON FUNCTION public.get_dashboard_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.set_active_period(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_active_period(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.upsert_students_csv(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_students_csv(jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.promote_students_massal(int[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_students_massal(int[]) TO authenticated;

REVOKE ALL ON FUNCTION public.ensure_admin_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_admin_profile() TO authenticated;
