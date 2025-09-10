import { useState, useEffect } from "react";
import eventBus from "./eventBus";

const SearchSidebar = () => {
  const [query, setQuery] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [searchState, setSearchState] = useState(""); // "found", "not-found", "pending", ""

  useEffect(() => {
    const onSearchResults = ({ current, total }) => {
      setCurrentMatch(current);
      setTotalMatches(total);
    };

    const onSearchState = ({ state, result, current, total }) => {
      setSearchState(state);
      setCurrentMatch(current);
      setTotalMatches(total);
      
      // Handle search result states
      if (state === "found" || result === 0) {
        // Search completed
        if (total === 0 && query.trim() !== "") {
          setSearchState("not-found");
        } else {
          setSearchState("found");
        }
      }
    };

    const onSearchCleared = () => {
      setCurrentMatch(0);
      setTotalMatches(0);
      setSearchState("");
    };

    eventBus.on("searchResults", onSearchResults);
    eventBus.on("searchState", onSearchState);
    eventBus.on("searchCleared", onSearchCleared);

    return () => {
      eventBus.off("searchResults", onSearchResults);
      eventBus.off("searchState", onSearchState);
      eventBus.off("searchCleared", onSearchCleared);
    };
  }, [query]);

  const handleSearch = (searchQuery = query) => {
    const trimmedQuery = searchQuery.trim();
    eventBus.emit("search", { query: trimmedQuery });
    
    if (trimmedQuery === "") {
      setCurrentMatch(0);
      setTotalMatches(0);
      setSearchState("");
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Auto-search as user types (debounced)
    if (value.trim() === "") {
      handleSearch("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const nextMatch = () => {
    if (totalMatches > 0) {
      eventBus.emit("findNext");
    }
  };

  const prevMatch = () => {
    if (totalMatches > 0) {
      eventBus.emit("findPrev");
    }
  };

  const clearSearch = () => {
    setQuery("");
    handleSearch("");
  };

  const getStatusMessage = () => {
    if (!query.trim()) {
      return "Enter search term";
    }
    
    if (searchState === "pending") {
      return "Searching...";
    }
    
    if (totalMatches === 0) {
      return "No matches found";
    }
    
    return `${currentMatch} of ${totalMatches}`;
  };

  return (
    <div
      style={{
        width: "280px",
        minWidth: "280px",
        borderRight: "1px solid #e5e7eb",
        padding: "16px",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>
          Search Document
        </h3>
        
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Enter search text..."
            value={query}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
          {query && (
            <button
              onClick={clearSearch}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: "#6b7280",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => handleSearch()}
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Search
        </button>
        <button
          onClick={clearSearch}
          style={{
            padding: "8px 12px",
            background: "#f3f4f6",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Clear
        </button>
      </div>

      {query.trim() && (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <button
              onClick={prevMatch}
              disabled={currentMatch <= 1 || totalMatches === 0}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: currentMatch <= 1 || totalMatches === 0 ? "#f9fafb" : "#ffffff",
                color: currentMatch <= 1 || totalMatches === 0 ? "#9ca3af" : "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: currentMatch <= 1 || totalMatches === 0 ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              ↑ Previous
            </button>
            <button
              onClick={nextMatch}
              disabled={currentMatch >= totalMatches || totalMatches === 0}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: currentMatch >= totalMatches || totalMatches === 0 ? "#f9fafb" : "#ffffff",
                color: currentMatch >= totalMatches || totalMatches === 0 ? "#9ca3af" : "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: currentMatch >= totalMatches || totalMatches === 0 ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              ↓ Next
            </button>
          </div>

          <div
            style={{
              padding: "8px 12px",
              background: "#f3f4f6",
              borderRadius: "6px",
              fontSize: "14px",
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            {getStatusMessage()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSidebar;