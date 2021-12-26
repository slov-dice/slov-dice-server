import type { Tokens } from './tokens.type';

export type SignInRes = {
  profile: {
    id: number;
    email: string;
  };
  tokens: Tokens;
};
