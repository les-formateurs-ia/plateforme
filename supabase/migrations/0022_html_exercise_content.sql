-- HTML exercises are the exercises themselves: admin/formateur paste or upload
-- the runnable HTML, students open and interact with it.
alter table html_exercises
  add column if not exists html_content text not null default '';
