import fs from 'fs'

const p = 'src/data/tools.ts'
let s = fs.readFileSync(p, 'utf8')

function setStatus(id, status) {
  const re = new RegExp(`(id: '${id}',\\s*name: '[^']+',\\s*category: '[^']+',\\s*status: )'[^']+'`)
  if (!re.test(s)) {
    console.log('skip', id)
    return
  }
  s = s.replace(re, `$1'${status}'`)
  console.log(id, '->', status)
}

;['gmail', 'drive', 'calendar', 'slack', 'notion', 'hubspot', 'linear', 'intercom', 'github'].forEach(
  (id) => setStatus(id, 'available'),
)

fs.writeFileSync(p, s)
