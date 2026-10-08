import { useNavigate } from "react-router-dom";
import SearchTitles from "../components/SearchTitles";
import type { SearchResult } from "../types";

export default function Search() {
  const navigate = useNavigate();

  return (
    <div className="search-page">
      <header className="page-heading">
        <p className="eyebrow">ESPLORA L’ARCHIVIO</p>
        <h1>Cerca un’opera.</h1>
        <p>Trova un titolo, leggi i pareri del gruppo e aggiungi il tuo punto di vista.</p>
      </header>
      <SearchTitles
        onPick={(r: SearchResult) =>
          navigate(`/title/${r.source}/${r.external_id}`)
        }
      />
    </div>
  );
}
