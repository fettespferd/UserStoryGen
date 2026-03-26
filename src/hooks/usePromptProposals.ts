import { useState, useCallback } from 'react';
import { supabase, type PromptProposal, type GlobalPrompt } from '../lib/supabase';

export const ADMIN_EMAIL = 'faubel.julius@gmail.com';

export function usePromptProposals() {
  const [proposals, setProposals] = useState<PromptProposal[]>([]);
  const [globalPrompt, setGlobalPrompt] = useState<GlobalPrompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitProposal = useCallback(
    async (userEmail: string, promptDE: string | null, promptEN: string | null): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const { error: err } = await supabase
          .from('userstorygen_prompt_proposals')
          .insert({ user_email: userEmail, prompt_de: promptDE || null, prompt_en: promptEN || null });
        if (err) throw err;
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fehler beim Einreichen');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('userstorygen_prompt_proposals')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setProposals((data as PromptProposal[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Vorschläge');
    } finally {
      setLoading(false);
    }
  }, []);

  const reviewProposal = useCallback(
    async (
      id: string,
      status: 'approved' | 'declined',
      adminComment: string
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const { error: err } = await supabase
          .from('userstorygen_prompt_proposals')
          .update({ status, admin_comment: adminComment || null, reviewed_at: new Date().toISOString() })
          .eq('id', id);
        if (err) throw err;

        if (status === 'approved') {
          const proposal = proposals.find((p) => p.id === id);
          if (proposal) {
            const { error: gErr } = await supabase
              .from('userstorygen_global_prompts')
              .insert({
                prompt_de: proposal.prompt_de,
                prompt_en: proposal.prompt_en,
                activated_by: ADMIN_EMAIL,
                proposal_id: id,
              });
            if (gErr) throw gErr;
          }
        }

        await loadProposals();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fehler beim Review');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [proposals, loadProposals]
  );

  const loadGlobalPrompt = useCallback(async (): Promise<GlobalPrompt | null> => {
    try {
      const { data, error: err } = await supabase
        .from('userstorygen_global_prompts')
        .select('*')
        .order('activated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (err) throw err;
      const gp = (data as GlobalPrompt) ?? null;
      setGlobalPrompt(gp);
      return gp;
    } catch {
      return null;
    }
  }, []);

  return { proposals, globalPrompt, loading, error, submitProposal, loadProposals, reviewProposal, loadGlobalPrompt };
}
