export const getConversionFactor = (baseUnit: string, recipeUnit: string) => {
  const b = baseUnit?.toLowerCase() || ''
  const r = recipeUnit?.toLowerCase() || ''
  if (b === 'kg' && r === 'g') return 0.001
  if (b === 'kg' && r === 'kg') return 1
  if (b === 'l' && r === 'ml') return 0.001
  if (b === 'l' && r === 'l') return 1
  if (b === 'g' && r === 'kg') return 1000
  if (b === 'ml' && r === 'l') return 1000
  return 1
}

export const getAvailableUnits = (baseUnit: string) => {
  const b = baseUnit?.toLowerCase() || ''
  if (b === 'kg' || b === 'g') return ['kg', 'g']
  if (b === 'l' || b === 'ml') return ['l', 'ml']
  return [b || 'un']
}
