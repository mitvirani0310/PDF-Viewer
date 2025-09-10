import { useEffect, useState } from "react";
import PDFViewer from "./PDFViewer";
import SearchSidebar from "./SearchSidebar";
import eventBus from "./eventBus";

const DocumentViewer = ({ fileUrl, fileName }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(100);

  useEffect(() => {
    const onPageChanged = ({ page }) => {
      setCurrentPage(page);
    };

    const onNumPagesChanged = ({ numPages }) => {
      setNumPages(numPages);
    };

    const onScaleChanged = ({ scale }) => {
      setScale(scale);
    };

    eventBus.on("pageChanged", onPageChanged);
    eventBus.on("numPagesChanged", onNumPagesChanged);
    eventBus.on("scaleChanged", onScaleChanged);

    return () => {
      eventBus.off("pageChanged", onPageChanged);
      eventBus.off("numPagesChanged", onNumPagesChanged);
      eventBus.off("scaleChanged", onScaleChanged);
    };
  }, []);

  const goToPage = (page) => {
    const pageNum = Math.max(1, Math.min(page, numPages));
    eventBus.emit("goToPage", { page: pageNum });
  };

  const handlePageInput = (e) => {
    if (e.key === "Enter") {
      const page = parseInt(e.target.value, 10);
      if (!isNaN(page)) {
        goToPage(page);
      }
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Search Sidebar */}
      <SearchSidebar />

      {/* Main PDF Viewer Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Toolbar */}
        <div
          style={{
            background: "#ffffff",
            padding: "12px 16px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* File Name */}
          <div style={{ fontWeight: "600", color: "#374151", fontSize: "14px" }}>
            {fileName}
          </div>

          <div style={{ height: "20px", width: "1px", background: "#e5e7eb" }} />

          {/* Navigation Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => eventBus.emit("prevPage")}
              disabled={currentPage <= 1}
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                background: currentPage <= 1 ? "#f9fafb" : "#ffffff",
                color: currentPage <= 1 ? "#9ca3af" : "#374151",
                cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              ← Prev
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>Page</span>
              <input
                type="number"
                min="1"
                max={numPages}
                value={currentPage}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value)) {
                    setCurrentPage(value);
                  }
                }}
                onKeyPress={handlePageInput}
                onBlur={(e) => {
                  const page = parseInt(e.target.value, 10);
                  if (!isNaN(page)) {
                    goToPage(page);
                  } else {
                    setCurrentPage(currentPage);
                  }
                }}
                style={{
                  width: "60px",
                  padding: "4px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  textAlign: "center",
                  fontSize: "14px",
                }}
              />
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                of {numPages || "..."}
              </span>
            </div>

            <button
              onClick={() => eventBus.emit("nextPage")}
              disabled={currentPage >= numPages}
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                background: currentPage >= numPages ? "#f9fafb" : "#ffffff",
                color: currentPage >= numPages ? "#9ca3af" : "#374151",
                cursor: currentPage >= numPages ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              Next →
            </button>
          </div>

          <div style={{ height: "20px", width: "1px", background: "#e5e7eb" }} />

          {/* Zoom Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => eventBus.emit("zoomOut")}
              style={{
                padding: "6px 10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                background: "#ffffff",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              −
            </button>
            <span style={{ fontSize: "14px", color: "#6b7280", minWidth: "50px", textAlign: "center" }}>
              {scale}%
            </span>
            <button
              onClick={() => eventBus.emit("zoomIn")}
              style={{
                padding: "6px 10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                background: "#ffffff",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* PDF Viewer Container */}
        <div 
          style={{ 
            flex: 1, 
            position: "relative", 
            background: "#f9fafb",
            overflow: "hidden",
          }}
        >
          <PDFViewer fileUrl={fileUrl} />
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;