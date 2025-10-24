// legacy appointments page — redirect to /book
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Appointments(){
  const nav = useNavigate();
  useEffect(()=>{ nav('/book', { replace:true }); }, [nav]);
  return null;
}
