import type { Tokens } from './tokens.type';

export type SignInRes = {
  profile: {
    id: number;
    nickname: string;
  };
  tokens: Tokens;
};
