-- Keep listings below SalarySabi's publication threshold out of the public board.
update public.jobs
set
  status = 'draft',
  updated_at = now()
where slug = 'full-stack-developer-sigma-consulting-group-c3149656'
  and transparency_score < 70
  and status = 'published';
