export type DriveFile = {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
  webViewLink?: string
  iconLink?: string
  size?: string
}

export async function listDriveFiles(token: string, pageSize = 40): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    pageSize: String(pageSize),
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink,iconLink,size)',
    q: 'trashed=false',
    orderBy: 'modifiedTime desc',
  })
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Drive API ${res.status}`)
  const data = (await res.json()) as { files?: DriveFile[] }
  return data.files ?? []
}
