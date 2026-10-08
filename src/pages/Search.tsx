import { useNavigate } from "react-router-dom";
import SearchTitles from "../components/SearchTitles";
import type { SearchResult } from "../types";

export default function Search() {
  const navigate = useNavigate();

  return (
    <>
      <h2>Cerca</h2>
      <SearchTitles
        onPick={(r: SearchResult) =>
          navigate(`/title/${r.source}/${r.external_id}`)
        }
      />
    </>
  );
}
