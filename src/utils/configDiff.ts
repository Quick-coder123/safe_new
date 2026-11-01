import type { RawCategory, RawInsuranceRate } from '@/config/defaults'

interface ConfigLike {
  categories: RawCategory[]
  insuranceRates: RawInsuranceRate[]
  settings: Record<string, string>
}

export interface ConfigChange {
  field: string
  from: string | number | null
  to: string | number | null
}

const RATE_LABELS: Record<string, string> = {
  rate_up_to_30: 'до 30 днів',
  rate_31_to_90: '31–90 днів',
  rate_91_to_180: '91–180 днів',
  rate_181_to_365: '181–365 днів',
}

const fmtRates = (rates: RawInsuranceRate[]) =>
  [...rates]
    .sort((a, b) => a.min_days - b.min_days)
    .map(r => `${r.min_days}-${r.max_days}: ${r.price}`)
    .join('; ')

/** Людино-читабельний перелік змін для журналу. */
export function diffConfig(before: ConfigLike, after: ConfigLike): ConfigChange[] {
  const changes: ConfigChange[] = []
  const oldCats = new Map(before.categories.map(c => [c.id, c]))
  const newCats = new Map(after.categories.map(c => [c.id, c]))

  newCats.forEach((cat, id) => {
    const old = oldCats.get(id)
    if (!old) {
      changes.push({ field: `Категорія ${cat.name}`, from: null, to: 'додано' })
      return
    }
    if (old.name !== cat.name) changes.push({ field: `Категорія ${id}: назва`, from: old.name, to: cat.name })
    for (const key of Object.keys(RATE_LABELS) as (keyof typeof RATE_LABELS)[]) {
      const a = Number(old[key as keyof RawCategory])
      const b = Number(cat[key as keyof RawCategory])
      if (a !== b) changes.push({ field: `${cat.name}: ${RATE_LABELS[key]}`, from: a, to: b })
    }
  })
  oldCats.forEach((cat, id) => {
    if (!newCats.has(id)) changes.push({ field: `Категорія ${cat.name}`, from: 'існувала', to: 'видалено' })
  })

  const oldIns = fmtRates(before.insuranceRates)
  const newIns = fmtRates(after.insuranceRates)
  if (oldIns !== newIns) changes.push({ field: 'Тарифи страхування', from: oldIns, to: newIns })

  for (const [key, value] of Object.entries(after.settings)) {
    const old = before.settings[key] ?? ''
    if (old !== value) changes.push({ field: key, from: old, to: value })
  }
  return changes
}
