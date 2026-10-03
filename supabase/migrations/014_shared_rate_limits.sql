CREATE TABLE IF NOT EXISTS public.request_rate_limits (
  key text PRIMARY KEY,
  count bigint NOT NULL,
  reset_at timestamptz NOT NULL
);
ALTER TABLE public.request_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.request_rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(bucket_key text, window_ms integer, max_requests integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE bucket public.request_rate_limits; current_time_value timestamptz := clock_timestamp();
BEGIN
  IF window_ms < 1 OR max_requests < 1 OR length(bucket_key) <> 64 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;
  DELETE FROM public.request_rate_limits WHERE reset_at < current_time_value;
  INSERT INTO public.request_rate_limits AS existing (key, count, reset_at)
  VALUES (bucket_key, 1, current_time_value + window_ms * interval '1 millisecond')
  ON CONFLICT (key) DO UPDATE SET
    count = CASE WHEN existing.reset_at <= current_time_value THEN 1 ELSE existing.count + 1 END,
    reset_at = CASE WHEN existing.reset_at <= current_time_value THEN EXCLUDED.reset_at ELSE existing.reset_at END
  RETURNING * INTO bucket;
  RETURN jsonb_build_object('limited', bucket.count > max_requests, 'retryAfter',
    CASE WHEN bucket.count > max_requests THEN greatest(1, ceil(extract(epoch FROM bucket.reset_at - current_time_value))) ELSE 0 END);
END;
$$;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;
