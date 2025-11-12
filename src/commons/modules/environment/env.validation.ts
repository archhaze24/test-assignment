import { z } from 'zod';

export const defaultEnv = z.object({
  PORT: z.string().default('3000'),

  EVM_RPC: z.string(),
});

export type Env = z.infer<typeof defaultEnv>;
