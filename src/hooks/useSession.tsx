import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { readDemo, subscribeDemo } from "@/lib/demo/demo-session";
import type { DemoState } from "@/lib/demo/demo-data";
import type { Profile } from "@/lib/auth";

function demoProfile(state: DemoState): Profile {
  return state.role === "senior" ? state.senior : state.family;
}

export function useSession() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // While demo mode is on, the demo household takes precedence over any
    // real signed-in session. Turning demo off restores the real session.
    let demoOn = readDemo() !== null;

    const apply = (id: string | null, data: Profile | null) => {
      if (!active) return;
      setUserId(id);
      setProfile(data);
      setLoading(false);
    };

    const hasSupabaseConfig = Boolean(
      import.meta.env["VITE_SUPABASE_URL"] &&
        import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
    );

    if (!hasSupabaseConfig) {
      const unsubDemo = subscribeDemo((state) => {
        if (state) {
          const next = demoProfile(state);
          apply(next.id, next);
        } else {
          apply(null, null);
        }
      });
      return () => {
        active = false;
        unsubDemo();
      };
    }

    const loadReal = async (id: string | null) => {
      if (demoOn) return;
      if (!id) {
        apply(null, null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, role, name, username, preferred_language, safety_code, linked_senior_id")
        .eq("id", id)
        .maybeSingle();
      apply(id, (data as Profile) ?? null);
    };

    supabase.auth.getSession().then(({ data }) => void loadReal(data.session?.user.id ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // While the demo household is active, ignore real auth events so the
      // demo profile isn't overwritten and loading never dangles.
      if (demoOn) return;
      setLoading(true);
      void loadReal(session?.user.id ?? null);
    });

    const unsubDemo = subscribeDemo((state) => {
      demoOn = state !== null;
      if (!active) return;
      if (state) {
        const next = demoProfile(state);
        setLoading(true);
        apply(next.id, next);
      } else {
        setLoading(true);
        supabase.auth.getSession().then(({ data }) => void loadReal(data.session?.user.id ?? null));
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      unsubDemo();
    };
  }, []);

  return { userId, profile, loading };
}
