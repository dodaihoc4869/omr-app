// Cache danh sách lớp vào IndexedDB — offline vẫn tra tên được. Nút "Đồng bộ"
// trong màn Kết nối danh sách lớp gọi lại fetchClassListFromSheet rồi ghi đè.
import { openDB, type IDBPDatabase } from 'idb'
import type { ClassListRow, ColumnMapping } from './sheet-gviz'

const DB_NAME = 'omr-classlist'
const DB_VERSION = 1
const STORE = 'students'
const META_STORE = 'meta'

interface ClassListDBSchema {
  students: ClassListRow
  meta: { sheetUrl: string; mapping: ColumnMapping; syncedAt: string; mode: 'gviz' | 'tsv' }
}

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'sbd' })
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE)
      }
    },
  })
}

export async function saveClassList(
  rows: ClassListRow[],
  meta: ClassListDBSchema['meta'],
): Promise<void> {
  const db = await getDb()
  const tx = db.transaction([STORE, META_STORE], 'readwrite')
  await tx.objectStore(STORE).clear()
  for (const r of rows) {
    if (r.sbd) await tx.objectStore(STORE).put(r)
  }
  await tx.objectStore(META_STORE).put(meta, 'config')
  await tx.done
}

export async function loadClassList(): Promise<ClassListRow[]> {
  const db = await getDb()
  return db.getAll(STORE)
}

export async function loadClassListMeta(): Promise<ClassListDBSchema['meta'] | undefined> {
  const db = await getDb()
  return db.get(META_STORE, 'config')
}

export async function findStudentBySbd(sbd: string): Promise<ClassListRow | undefined> {
  const db = await getDb()
  return db.get(STORE, sbd)
}

/** Đổi TÊN một em trong danh sách lớp cất ở máy thầy (chỉ sau khi máy chủ đã đổi thật). Không đụng em khác, không xoá/ghi lại cả danh sách.
 *  Trả `false` nếu máy này không có em đó. */
export async function doiTenEmTrongDanhSachLop(sbd: string, hoTen: string): Promise<boolean> {
  const db = await getDb()
  const hang = (await db.get(STORE, sbd)) as ClassListRow | undefined
  if (!hang) return false
  await db.put(STORE, { ...hang, hoTen })
  return true
}
