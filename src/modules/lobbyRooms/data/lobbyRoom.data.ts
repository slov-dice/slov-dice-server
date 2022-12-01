import { v4 } from 'uuid'

import { I_FullRoomGame } from 'models/shared/app'
import { E_EffectIcon } from 'models/shared/game/extra/effects'
import { E_EffectType } from 'models/shared/game/character'

export const lobbyRoomGameInstance = (): I_FullRoomGame => ({
  characters: {
    window: {
      characters: [],
    },
    settings: {
      bars: [
        { id: v4(), color: '#50C878', name: { EN: 'Health', RU: 'Здоровье' } },
        { id: v4(), color: '#318CE7', name: { EN: 'Mana', RU: 'Мана' } },
        {
          id: v4(),
          color: '#EB7641',
          name: { EN: 'Stamina', RU: 'Выносливость' },
        },
      ],
      specials: [
        { id: v4(), name: { EN: 'Intelligence', RU: 'Интеллект' } },
        { id: v4(), name: { EN: 'Strength', RU: 'Сила' } },
        { id: v4(), name: { EN: 'Agility', RU: 'Ловкость' } },
        { id: v4(), name: { EN: 'Charisma', RU: 'Харизма' } },
      ],
      effects: [
        {
          id: v4(),
          name: { EN: 'A burst of strength', RU: 'Прилив сил' },
          description: {
            RU: '+2 к вын., +2 к силе',
            EN: '+2 to stamina, +2 to strength',
          },
          icon: E_EffectIcon.muscleUp,
          type: E_EffectType.positive,
        },
        {
          id: v4(),
          name: { EN: 'Vomiting', RU: 'Рвота' },
          description: { RU: '-2 к вын.', EN: '-2 to stamina' },
          icon: E_EffectIcon.vomiting,
          type: E_EffectType.negative,
        },
        {
          id: v4(),
          name: { EN: 'Fracture', RU: 'Перелом' },
          description: {
            RU: '-20 к макс. хп., -2 к вын.',
            EN: '-20 to max hp, -2 to stamina',
          },
          icon: E_EffectIcon.brokenBone,
          type: E_EffectType.negative,
        },
        {
          id: v4(),
          name: { RU: 'Переел', EN: 'Overeating' },
          description: {
            RU: '+20 к макс. хп., -2 к вын.',
            EN: '+20 to max hp, -2 to stamina',
          },
          icon: E_EffectIcon.muscleFat,
          type: E_EffectType.neutral,
        },
      ],
    },
  },
})
