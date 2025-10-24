import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function RequireAuth({ children }){
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await api.get('/users/me');
        if (mounted) { setOk(true); setLoading(false); }
  } catch {
        if (!mounted) return;
        setOk(false); setLoading(false);
        const returnTo = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?returnTo=${returnTo}`);
      }
    })();
    return () => { mounted = false; };
  }, [location.pathname, location.search, navigate]);

  if (loading) return <div className="p-6 text-center text-sm text-zinc-500">Checking your session…</div>;
  if (!ok) return null;
  return children;
}
