import { describe, expect, it } from 'vitest'
import { createSessionToken, verifySessionToken } from '@/lib/session'

const data = { adminId: 1, login: 'admin', role: 'super_admin' as const, isTempPassword: false }

describe('session token', () => {
  it('підписаний токен проходить перевірку', async () => {
    const token = await createSessionToken(data)
    expect(await verifySessionToken(token)).toMatchObject(data)
  })

  it('підроблений payload відхиляється', async () => {
    const token = await createSessionToken({ ...data, role: 'admin' })
    const [, sig] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ ...data, exp: 9999999999 })).toString('base64url')
    expect(await verifySessionToken(`${forged}.${sig}`)).toBeNull()
  })

  it('старий формат cookie (JSON без підпису) відхиляється', async () => {
    expect(await verifySessionToken(JSON.stringify(data))).toBeNull()
    expect(await verifySessionToken('admin')).toBeNull()
    expect(await verifySessionToken(undefined)).toBeNull()
  })

  it('прострочений токен відхиляється', async () => {
    const token = await createSessionToken(data, -10)
    expect(await verifySessionToken(token)).toBeNull()
  })
})
