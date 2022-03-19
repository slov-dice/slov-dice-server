import * as RU from './ru.json'
import * as EN from './en.json'
import { LocaleEnum } from 'interfaces/app'

const translation = { [LocaleEnum.ru]: RU, [LocaleEnum.en]: EN }

export const t = (key: string) => {
  const keys = key.split('.')
  return getNestedTranslation(keys)
}

const getNestedTranslation = (keys: string[]): { RU: string; EN: string } => {
  const RU = keys.reduce((obj: any, key: string) => {
    return obj?.[key]
  }, translation[LocaleEnum.ru])

  const EN = keys.reduce((obj: any, key: string) => {
    return obj?.[key]
  }, translation[LocaleEnum.en])

  return { [LocaleEnum.ru]: RU, [LocaleEnum.en]: EN }
}
