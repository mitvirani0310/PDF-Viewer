import { useEffect, useState } from "react";
import PDFViewer from "./PDFViewer";
import SearchSidebar from "./SearchSidebar";
import eventBus from "./eventBus";

const DocumentViewer = ({ fileUrl, fileName }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    eventBus.on("pageChanged", ({ page }) => setCurrentPage(page));
    return () => eventBus.off("pageChanged", ({ page }) => setCurrentPage(page));
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Search Sidebar */}
      <SearchSidebar />

      {/* PDF Viewer */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            background: "#f5f5f5",
            padding: "8px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <strong>{fileName}</strong>
          <button onClick={() => eventBus.emit("prevPage")}>Prev</button>
          <span>
            Page {currentPage} / {numPages || "?"}
          </span>
          <button onClick={() => eventBus.emit("nextPage")}>Next</button>
          <button onClick={() => eventBus.emit("zoomOut")}>-</button>
          <button onClick={() => eventBus.emit("zoomIn")}>+</button>
        </div>

        <div style={{ flex: 1, position: "relative" }}>
          <PDFViewer fileUrl={fileUrl} />
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
