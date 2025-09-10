import { useState, useEffect } from "react";
import eventBus from "./eventBus";

const SearchSidebar = () => {
  const [query, setQuery] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  // Listen for search results from PDF.js
  useEffect(() => {
    const onMatches = ({ total }) => {
      setTotalMatches(total || 0);
    };

    const onState = ({ current, total, state }) => {
      setCurrentMatch(current || 0);
      setTotalMatches(total || 0);
    };

    eventBus.on("pdf-find-matches", onMatches);
    eventBus.on("pdf-find-state", onState);

    return () => {
      eventBus.off("pdf-find-matches", onMatches);
      eventBus.off("pdf-find-state", onState);
    };
  }, []);

  const handleSearch = () => {
    eventBus.emit("pdf-search", { query });
  };

  const nextMatch = () => {
    eventBus.emit("pdf-find-next");
  };

  const prevMatch = () => {
    eventBus.emit("pdf-find-prev");
  };

  const clearSearch = () => {
    setQuery("");
    eventBus.emit("pdf-search", { query: "" });
    setCurrentMatch(0);
    setTotalMatches(0);
  };

  return (
    <div
      style={{
        width: "250px",
        borderRight: "1px solid #ddd",
        padding: "10px",
        background: "#fafafa",
      }}
    >
      <h3>Search</h3>
      <input
        type="text"
        placeholder="Enter text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        style={{ width: "100%", marginBottom: "8px" }}
      />
      
      <div style={{ marginBottom: "8px" }}>
        <button onClick={handleSearch} style={{ marginRight: "6px" }}>
          Search
        </button>
        <button onClick={clearSearch} style={{ marginRight: "6px" }}>
          Clear
        </button>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <button 
          onClick={prevMatch} 
          disabled={currentMatch <= 1 || totalMatches === 0}
          style={{ marginRight: "6px" }}
        >
          ↑ Prev
        </button>
        <button 
          onClick={nextMatch} 
          disabled={currentMatch >= totalMatches || totalMatches === 0}
        >
          ↓ Next
        </button>
      </div>

      <p style={{ fontSize: "14px", color: "#666" }}>
        {totalMatches === 0 ? (
          query ? "No matches found" : "Enter search term"
        ) : (
          `Match ${currentMatch} of ${totalMatches}`
        )}
      </p>
    </div>
  );
};

export default SearchSidebar;
