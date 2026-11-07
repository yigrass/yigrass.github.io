from pathlib import Path
import re
p = Path(__file__).parent / 'contract-acceptance' / 'SKILL.md'
s = p.read_text(encoding='utf-8-sig')
m = re.match(r'^---\n(.*?)\n---\n', s, re.S)
assert m, 'Missing frontmatter'
# This skill uses only two flat plain-string fields: no general YAML parser is needed here.
fields = {}
for line in m[1].splitlines():
    key, value = line.split(': ', 1)
    assert key not in fields
    fields[key] = value
assert set(fields) == {'name', 'description'}
assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', fields['name'])
assert len(fields['name']) <= 64
assert 0 < len(fields['description']) <= 1024
assert not any(c in fields['description'] for c in '<>\n')
assert not fields['description'].startswith('[TODO:')
assert '[TODO:' not in s[m.end():]
assert p.parent.name == fields['name']
print('PASS: flat frontmatter, supported fields, name, description, no scaffold placeholders')
print('Bundled quick_validate.py unavailable: runtime has no PyYAML. Equivalent checks applied to this flat format; no package installed.')
