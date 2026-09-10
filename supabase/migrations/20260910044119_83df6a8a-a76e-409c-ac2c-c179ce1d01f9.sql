CREATE OR REPLACE FUNCTION public.has_voted(p_proposal uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proposal_votes
    WHERE proposal_id = p_proposal AND voter_id = auth.uid()
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_voted(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.proposal_vote_summary(p_proposal uuid)
RETURNS TABLE(votes_cast integer, eligible integer, agree integer, disagree integer, abstain integer, finished boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p record;
  v_can boolean;
BEGIN
  SELECT * INTO p FROM public.warning_proposals WHERE id = p_proposal;
  IF NOT FOUND THEN RETURN; END IF;

  v_can := p.target_member_id = auth.uid()
        OR p.proposed_by = auth.uid()
        OR public.get_my_role() IN ('Ketua','Waketu','Supervisor')
        OR p.voter_scope = 'Organisasi'
        OR p.voter_scope = 'Divisi:' || public.get_my_division();
  IF NOT v_can THEN RETURN; END IF;

  finished := p.status <> 'Voting';
  SELECT count(*)::int INTO votes_cast FROM public.proposal_votes WHERE proposal_id = p_proposal;
  eligible := coalesce(p.eligible_voters_count, 0);

  IF finished THEN
    SELECT
      count(*) FILTER (WHERE choice = 'Setuju')::int,
      count(*) FILTER (WHERE choice = 'Tidak_Setuju')::int,
      count(*) FILTER (WHERE choice = 'Abstain')::int
    INTO agree, disagree, abstain
    FROM public.proposal_votes WHERE proposal_id = p_proposal;
  ELSE
    agree := NULL; disagree := NULL; abstain := NULL;
  END IF;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.proposal_vote_summary(uuid) TO authenticated;