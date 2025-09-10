import { useState, useEffect, useRef } from "react";
// import eventBus from "./eventBus";

const SearchSidebar = () => {
  const [query, setQuery] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [searchState, setSearchState] = useState("");
  const channelRef = useRef(null);

  useEffect(() => {
    // Initialize BroadcastChannel for communication with PDF viewer
    channelRef.current = new BroadcastChannel('pdf-find');
    
    // Listen for messages from PDF viewer
    channelRef.current.onmessage = (event) => {
      const data = event.data;
      console.log('data.current: ', data.current);
      
      if (data?.type === 'search-results') {
        setCurrentMatch(data.current || 0);
        setTotalMatches(data.total || 0);
        setSearchState(data.total > 0 ? 'found' : 'not-found');
      }
      
      if (data?.type === 'search-cleared') {
        setCurrentMatch(0);
        setTotalMatches(0);
        setSearchState('');
      }
    };

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  const handleSearch = (searchQuery = query) => {
    const trimmedQuery = searchQuery.trim();
    
    if (trimmedQuery === "") {
      // Clear search
      if (channelRef.current) {
        channelRef.current.postMessage({
          cmd: 'clear-highlights'
        });
      }
      setCurrentMatch(0);
      setTotalMatches(0);
      setSearchState("");
    } else {
      // Start new search
      if (channelRef.current) {
        channelRef.current.postMessage({
          cmd: 'find-new',
          query: trimmedQuery,
          highlightAll: true,
          caseSensitive: false,
          entireWord: false,
          phraseSearch: true
        });
      }
      setSearchState("pending");
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Auto-clear when input is empty
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
    
      channelRef.current.postMessage({
        cmd: 'find-next',
        query: query.trim(),
        prev: false,
        highlightAll: true,
        caseSensitive: false,
        entireWord: false,
        phraseSearch: true
      });
    
  };

  const prevMatch = () => {
    
      channelRef.current.postMessage({
        cmd: 'find-next',
        query: query.trim(),
        prev: true,
        highlightAll: true,
        caseSensitive: false,
        entireWord: false,
        phraseSearch: true
      });
    
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
            >
              ↑ Previous
            </button>
            <button
              onClick={nextMatch}
              
              
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