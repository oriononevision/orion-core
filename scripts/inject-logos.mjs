import fs from 'fs'

const p = 'src/data/tools.ts'
let s = fs.readFileSync(p, 'utf8')

const domains = {
  gmail: 'gmail.com',
  slack: 'slack.com',
  notion: 'notion.so',
  drive: 'drive.google.com',
  hubspot: 'hubspot.com',
  calendar: 'calendar.google.com',
  linear: 'linear.app',
  intercom: 'intercom.com',
  stripe: 'stripe.com',
  salesforce: 'salesforce.com',
  dropbox: 'dropbox.com',
  asana: 'asana.com',
  outlook: 'outlook.com',
  github: 'github.com',
  zendesk: 'zendesk.com',
  airtable: 'airtable.com',
}

for (const [id, domain] of Object.entries(domains)) {
  if (s.includes(`logo: '/logos/${id}.svg'`)) continue
  const needle = `id: '${id}',`
  const idx = s.indexOf(needle)
  if (idx === -1) {
    console.log('missing', id)
    continue
  }
  const initialIdx = s.indexOf('initial:', idx)
  const lineEnd = s.indexOf('\n', initialIdx)
  const insert = `\n    logo: '/logos/${id}.svg',\n    domain: '${domain}',`
  s = s.slice(0, lineEnd) + insert + s.slice(lineEnd)
  console.log('ok', id)
}

fs.writeFileSync(p, s)
