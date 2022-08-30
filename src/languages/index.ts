import * as RU from './ru.json'
import * as EN from './en.json'
import { E_Locale, T_LocaleServerMessage } from 'models/app'

const translation = { [E_Locale.ru]: RU, [E_Locale.en]: EN }

export const t = (key: string) => {
  const keys = key.split('.')
  return getNestedTranslation(keys)
}

const getNestedTranslation = (keys: string[]): T_LocaleServerMessage => {
  const RU = keys.reduce((obj: any, key: string) => {
    return obj?.[key] || ''
  }, translation[E_Locale.ru])

  const EN = keys.reduce((obj: any, key: string) => {
    return obj?.[key] || ''
  }, translation[E_Locale.en])

  return { [E_Locale.ru]: RU, [E_Locale.en]: EN }
}
