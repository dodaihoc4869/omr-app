-- Explicit teacher request: reset GAME only, after backup. Never touch academic tables.
INSERT INTO game_v2_settings(key,json) VALUES('season','{"id":"2026-09-16-bat-linh-01"}') ON CONFLICT(key) DO UPDATE SET json=excluded.json;
UPDATE game_v2_profile SET revision=revision+1,json=json_set(json,
 '$.pet','dat_quy','$.choice',json('true'),'$.cap',1,'$.exp',0,'$.wallet',0,'$.earned',0,'$.tower',1,
 '$.mastery',json('[]'),'$.arena',NULL,'$.season','2026-09-16-bat-linh-01','$.cutover',strftime('%Y-%m-%dT%H:%M:%fZ','now'));
DELETE FROM game_v2_attempt;
DELETE FROM game_v2_reward;
DELETE FROM game_v2_session;
DELETE FROM game_v2_room;
DELETE FROM game_v2_task;
-- Keep game_v2_scope (teacher controls), game_v2_question, game_v2_index, and all original learning evidence.
