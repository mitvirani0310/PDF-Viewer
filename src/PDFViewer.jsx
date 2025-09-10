import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
import "pdfjs-dist/web/pdf_viewer.css";
import eventBus from "./eventBus";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const PDFViewer = ({ fileUrl }) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  const [pdf, setPdf] = useState(null);
  const [pdfViewer, setPdfViewer] = useState(null);
  const [findController, setFindController] = useState(null);
  const [eventBusInternal, setEventBusInternal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Load PDF
  useEffect(() => {
    const loadingTask = pdfjsLib.getDocument(fileUrl);
    loadingTask.promise.then((loadedPdf) => {
      setPdf(loadedPdf);

      const eventBusInstance = new pdfjsViewer.EventBus();
      setEventBusInternal(eventBusInstance);

      const linkService = new pdfjsViewer.PDFLinkService();

      const viewer = new pdfjsViewer.PDFViewer({
        container: containerRef.current,
        viewer: containerRef.current.querySelector("#viewer"),
        eventBus: eventBusInstance,
        textLayerMode: 2,
        linkService,
      });

      linkService.setViewer(viewer);

      viewer.setDocument(loadedPdf);

      const findCtrl = new pdfjsViewer.PDFFindController({
        eventBus: eventBusInstance,
        pdfViewer: viewer,
        linkService,
      });

      // viewer.setFindController(findCtrl);
      viewer.findController = findCtrl; // optional
      setFindController(findCtrl);
      setPdfViewer(viewer);
      // setFindController(findCtrl);

      // Page change listener
      eventBusInstance.on("pagechanging", (evt) => {
        setCurrentPage(evt.pageNumber);
        eventBus.emit("pageChanged", { page: evt.pageNumber });
      });

      // Optional: Zoom handling
      viewer.currentScaleValue = "page-width";
    });
  }, [fileUrl]);

  // EventBus listeners for page/zoom control
  useEffect(() => {
    if (!pdfViewer) return;

    const goToPage = ({ page }) => {
      if (page >= 1 && page <= pdfViewer.pdfDocument.numPages) {
        pdfViewer.currentPageNumber = page;
      }
    };

    const nextPage = () => {
      if (pdfViewer.currentPageNumber < pdfViewer.pdfDocument.numPages) {
        pdfViewer.currentPageNumber += 1;
      }
    };

    const prevPage = () => {
      if (pdfViewer.currentPageNumber > 1) {
        pdfViewer.currentPageNumber -= 1;
      }
    };

    const zoomIn = () => {
      pdfViewer.currentScale += 0.2;
    };

    const zoomOut = () => {
      pdfViewer.currentScale -= 0.2;
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
  }, [pdfViewer]);

  // Search functionality
  useEffect(() => {
    if (!findController || !eventBusInternal) return;

    let allMatches = [];
    let currentMatchIndex = 0;

    const updateMatchesList = () => {
      allMatches = [];
      const textLayers = containerRef.current?.querySelectorAll(".textLayer");
      textLayers?.forEach((layer) => {
        layer.querySelectorAll("span").forEach((div) => {
          if (div.style.backgroundColor === "yellow" || div.style.backgroundColor === "orange") {
            allMatches.push(div);
          }
        });
      });
    };

    const manualNavigate = (direction) => {
      updateMatchesList();
      if (allMatches.length === 0) return;

      // Reset previous highlight
      if (allMatches[currentMatchIndex]) allMatches[currentMatchIndex].style.backgroundColor = "yellow";

      // Move
      currentMatchIndex =
        direction === "next"
          ? (currentMatchIndex + 1) % allMatches.length
          : currentMatchIndex > 0
          ? currentMatchIndex - 1
          : allMatches.length - 1;

      // Highlight current
      allMatches[currentMatchIndex].style.backgroundColor = "orange";
      allMatches[currentMatchIndex].scrollIntoView({ behavior: "smooth", block: "center" });

      eventBus.emit("pdf-find-state", {
        current: currentMatchIndex + 1,
        total: allMatches.length,
      });
    };

    const onSearch = ({ query }) => {
      if (!query) {
        findController?.reset();
        return;
      }

      try {
        findController.executeCommand("find", {
          query,
          caseSensitive: false,
          phraseSearch: true,
          highlightAll: true,
          findPrevious: false,
        });
      } catch (error) {
        console.log("PDF.js search failed, using manual fallback", error);

        // Manual fallback
        const textLayers = containerRef.current?.querySelectorAll(".textLayer");
        let totalMatches = 0;
        textLayers?.forEach((layer) => {
          layer.querySelectorAll("span").forEach((div) => {
            div.style.backgroundColor = "transparent";
            if (div.textContent.toLowerCase().includes(query.toLowerCase())) {
              div.style.backgroundColor = "yellow";
              totalMatches++;
              if (totalMatches === 1) {
                div.style.backgroundColor = "orange";
                div.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }
          });
        });

        eventBus.emit("pdf-find-matches", { total: totalMatches });
        eventBus.emit("pdf-find-state", { current: totalMatches > 0 ? 1 : 0, total: totalMatches });
      }
    };

    const onFindNext = () => {
      try {
        findController.executeCommand("findagain", { findPrevious: false });
      } catch {
        manualNavigate("next");
      }
    };

    const onFindPrev = () => {
      try {
        findController.executeCommand("findagain", { findPrevious: true });
      } catch {
        manualNavigate("prev");
      }
    };

    const onFindMatches = (evt) => {
      eventBus.emit("pdf-find-matches", { total: evt.matchesCount?.total || 0 });
    };

    const onFindState = (evt) => {
      eventBus.emit("pdf-find-state", {
        current: evt.matchesCount?.current || 0,
        total: evt.matchesCount?.total || 0,
        state: evt.state,
      });
    };

    // Event registrations
    eventBus.on("pdf-search", onSearch);
    eventBus.on("pdf-find-next", onFindNext);
    eventBus.on("pdf-find-prev", onFindPrev);

    eventBusInternal.on("updatefindmatchescount", onFindMatches);
    eventBusInternal.on("updatefindcontrolstate", onFindState);

    return () => {
      eventBus.off("pdf-search", onSearch);
      eventBus.off("pdf-find-next", onFindNext);
      eventBus.off("pdf-find-prev", onFindPrev);

      eventBusInternal.off("updatefindmatchescount", onFindMatches);
      eventBusInternal.off("updatefindcontrolstate", onFindState);
    };
  }, [findController, eventBusInternal]);

  return (
    <div
      ref={containerRef}
      id="viewerContainer"
      style={{
        flex: 1,
        overflow: "auto",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div ref={viewerRef} id="viewer" className="pdfViewer" />
    </div>
  );
};

export default PDFViewer;
