import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
import "pdfjs-dist/web/pdf_viewer.css";
import eventBus from "./eventBus";

// Set up worker - this is crucial for PDF.js to work
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const PDFViewer = ({ fileUrl }) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  const [pdf, setPdf] = useState(null);
  const [pdfViewer, setPdfViewer] = useState(null);
  const [findController, setFindController] = useState(null);
  const [eventBusInternal, setEventBusInternal] = useState(null);
  const [linkService, setLinkService] = useState(null);

  // Load PDF
  useEffect(() => {
    const loadPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/cmaps/',
          cMapPacked: true,
        });
        
        const loadedPdf = await loadingTask.promise;
        setPdf(loadedPdf);

        // Create event bus for PDF.js internal communication
        const eventBusInstance = new pdfjsViewer.EventBus();
        setEventBusInternal(eventBusInstance);

        // Create link service
        const linkServiceInstance = new pdfjsViewer.PDFLinkService({
          eventBus: eventBusInstance,
        });
        setLinkService(linkServiceInstance);

        // Create PDF viewer
        const viewer = new pdfjsViewer.PDFViewer({
          container: containerRef.current,
          eventBus: eventBusInstance,
          linkService: linkServiceInstance,
          textLayerMode: 2, // Enable text layer for search
          annotationMode: 2, // Enable annotations
        });

        linkServiceInstance.setViewer(viewer);
        setPdfViewer(viewer);

        // Set the document
        viewer.setDocument(loadedPdf);
        linkServiceInstance.setDocument(loadedPdf);

        // Create find controller for search functionality
        const findCtrl = new pdfjsViewer.PDFFindController({
          eventBus: eventBusInstance,
          pdfViewer: viewer,
          linkService: linkServiceInstance,
        });

        viewer.findController = findCtrl;
        setFindController(findCtrl);

        // Listen for page changes
        eventBusInstance.on("pagechanging", (evt) => {
          eventBus.emit("pageChanged", { page: evt.pageNumber });
          eventBus.emit("numPagesChanged", { numPages: loadedPdf.numPages });
        });

        // Set initial scale
        viewer.currentScaleValue = "page-fit";

        console.log("PDF loaded successfully");
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    if (fileUrl) {
      loadPDF();
    }
  }, [fileUrl]);

  // Handle navigation and zoom controls
  useEffect(() => {
    if (!pdfViewer || !pdf) return;

    const goToPage = ({ page }) => {
      if (page >= 1 && page <= pdf.numPages) {
        pdfViewer.currentPageNumber = page;
      }
    };

    const nextPage = () => {
      if (pdfViewer.currentPageNumber < pdf.numPages) {
        pdfViewer.currentPageNumber += 1;
      }
    };

    const prevPage = () => {
      if (pdfViewer.currentPageNumber > 1) {
        pdfViewer.currentPageNumber -= 1;
      }
    };

    const zoomIn = () => {
      const newScale = Math.min(pdfViewer.currentScale * 1.2, 5.0);
      pdfViewer.currentScale = newScale;
      eventBus.emit("scaleChanged", { scale: Math.round(newScale * 100) });
    };

    const zoomOut = () => {
      const newScale = Math.max(pdfViewer.currentScale / 1.2, 0.25);
      pdfViewer.currentScale = newScale;
      eventBus.emit("scaleChanged", { scale: Math.round(newScale * 100) });
    };

    eventBus.on("goToPage", goToPage);
    eventBus.on("nextPage", nextPage);
    eventBus.on("prevPage", prevPage);
    eventBus.on("zoomIn", zoomIn);
    eventBus.on("zoomOut", zoomOut);

    return () => {
      eventBus.off("goToPage", goToPage);
      eventBus.off("nextPage", nextPage);
      eventBus.off("prevPage", prevPage);
      eventBus.off("zoomIn", zoomIn);
      eventBus.off("zoomOut", zoomOut);
    };
  }, [pdfViewer, pdf]);

  // Handle search functionality
  useEffect(() => {
    if (!findController || !eventBusInternal) return;

    const onSearch = ({ query }) => {
      if (!query || query.trim() === "") {
        // Clear search
        eventBusInternal.dispatch("find", {
          type: "find",
          query: "",
          phraseSearch: true,
          caseSensitive: false,
          entireWord: false,
          highlightAll: true,
          findPrevious: false,
        });
        eventBus.emit("searchCleared");
        return;
      }

      // Execute search
      eventBusInternal.dispatch("find", {
        type: "find",
        query: query.trim(),
        phraseSearch: true,
        caseSensitive: false,
        entireWord: false,
        highlightAll: true,
        findPrevious: false,
      });
    };

    const onFindNext = () => {
      if (findController && eventBusInternal) {
        eventBusInternal.dispatch("findagain", {
          type: "findagain",
          source: findController,
          findPrevious: false,
        });
      }
    };

    const onFindPrev = () => {
      if (findController && eventBusInternal) {
        eventBusInternal.dispatch("findagain", {
          type: "findagain", 
          source: findController,
          findPrevious: true,
        });
      }
    };

    // Listen for search results from PDF.js
    const onUpdateFindMatchesCount = (evt) => {
      const { matchesCount } = evt;
      eventBus.emit("searchResults", {
        current: matchesCount.current || 0,
        total: matchesCount.total || 0,
      });
    };

    const onUpdateFindControlState = (evt) => {
      const { state, result, matchesCount } = evt;
      eventBus.emit("searchState", {
        state,
        result,
        current: matchesCount?.current || 0,
        total: matchesCount?.total || 0,
      });
    };

    // Register event listeners
    eventBus.on("search", onSearch);
    eventBus.on("findNext", onFindNext);
    eventBus.on("findPrev", onFindPrev);

    eventBusInternal.on("updatefindmatchescount", onUpdateFindMatchesCount);
    eventBusInternal.on("updatefindcontrolstate", onUpdateFindControlState);

    return () => {
      eventBus.off("search", onSearch);
      eventBus.off("findNext", onFindNext);
      eventBus.off("findPrev", onFindPrev);
      
      eventBusInternal.off("updatefindmatchescount", onUpdateFindMatchesCount);
      eventBusInternal.off("updatefindcontrolstate", onUpdateFindControlState);
    };
  }, [findController, eventBusInternal]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "auto",
      }}
    >
      <div ref={viewerRef} className="pdfViewer" />
    </div>
  );
};

export default PDFViewer;