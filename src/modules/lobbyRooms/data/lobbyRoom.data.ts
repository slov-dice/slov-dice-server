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
        { id: v4(), color: '#50C878', name: 'Здоровье' },
        { id: v4(), color: '#318CE7', name: 'Мана' },
        {
          id: v4(),
          color: '#EB7641',
          name: 'Выносливость',
        },
      ],
      specials: [
        { id: v4(), name: 'Интеллект' },
        { id: v4(), name: 'Сила' },
        { id: v4(), name: 'Ловкость' },
        { id: v4(), name: 'Харизма' },
      ],
      effects: [
        {
          id: v4(),
          name: 'Прилив сил',
          description: '+2 к вын., +2 к силе',
          icon: E_EffectIcon.muscleUp,
          type: E_EffectType.positive,
        },
        {
          id: v4(),
          name: 'Рвота',
          description: '-2 к вын.',
          icon: E_EffectIcon.vomiting,
          type: E_EffectType.negative,
        },
        {
          id: v4(),
          name: 'Перелом',
          description: '-20 к макс. хп., -2 к вын.',
          icon: E_EffectIcon.brokenBone,
          type: E_EffectType.negative,
        },
        {
          id: v4(),
          name: 'Переел',
          description: '+20 к макс. хп., -2 к вын.',
          icon: E_EffectIcon.muscleFat,
          type: E_EffectType.neutral,
        },
      ],
    },
  },
})
