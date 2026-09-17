-- Read the existing reset timestamp; only add a reward boundary, never reset progress.
UPDATE game_v2_settings
SET json=json_set(json,'$.startedAt',(
 SELECT MIN(json_extract(p.json,'$.cutover')) FROM game_v2_profile p
 WHERE json_extract(p.json,'$.season')=json_extract(game_v2_settings.json,'$.id')
))
WHERE key='season' AND json_extract(json,'$.startedAt') IS NULL;
