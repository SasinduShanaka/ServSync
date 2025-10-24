import { useLocation } from "react-router-dom";

export default function useScope() {
  const { search } = useLocation();
  const p = new URLSearchParams(search);
  return {
    sessionId: p.get("sessionId"),
    branchId: p.get("branchId"),
    insuranceTypeId: p.get("insuranceTypeId"),
    counterId: p.get("counterId"),
  };
}
