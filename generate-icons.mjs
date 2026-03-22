/**
 * Generates icon-192.png and icon-512.png in /public.
 * Dark background (#0a0a0a) with an amber (#F59E0B) filled circle.
 * Run once: node generate-icons.mjs
 */
import { createWriteStream } from 'node:fs'
import { deflateSync } from 'node:zlib'

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.allocUnsafe(4)
  len.writeUInt32BE(data.length)
  const typeB = Buffer.from(type)
  const crc = Buffer.allocUnsafe(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeB, data])))
  return Buffer.concat([len, typeB, data, crc])
}

function makePNG(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // RGB
  ihdr[10] = ihdr[11] = ihdr[12] = 0

  // Build raw image rows
  const row = 1 + size * 3
  const raw = Buffer.alloc(size * row)
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38

  for (let y = 0; y < size; y++) {
    raw[y * row] = 0 // filter byte: None
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy
      const inCircle = dx * dx + dy * dy <= r * r
      const off = y * row + 1 + x * 3
      if (inCircle) {
        raw[off] = 245; raw[off + 1] = 158; raw[off + 2] = 11  // #F59E0B amber
      } else {
        raw[off] = 10; raw[off + 1] = 10; raw[off + 2] = 10   // #0a0a0a dark
      }
    }
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [192, 512]) {
  const path = `./public/icon-${size}.png`
  const ws = createWriteStream(path)
  ws.write(makePNG(size))
  ws.end()
  console.log(`✓ ${path}`)
}
