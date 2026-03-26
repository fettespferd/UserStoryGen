import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ProposalStatus = 'pending' | 'approved' | 'declined';

export interface PromptProposal {
  id: string;
  user_email: string;
  prompt_de: string | null;
  prompt_en: string | null;
  status: ProposalStatus;
  admin_comment: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface GlobalPrompt {
  id: string;
  prompt_de: string | null;
  prompt_en: string | null;
  activated_at: string;
  activated_by: string;
  proposal_id: string | null;
}
