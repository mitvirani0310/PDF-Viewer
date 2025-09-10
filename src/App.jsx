import { useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import DocumentViewer from "./DocumentViewer";

function App() {
  const fileUrl ="/SourceImage_SourceImage_6602278654_Note.pdf"; // Make sure this file exists in public/ folder
  const fileName = "SourceImage_SourceImage_6602278654_Note.pdf";

  useEffect(() => {
    // Set the worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
  }, []);

  useEffect(() => {
    // Test if PDF is accessible
    fetch(fileUrl)
      .then(response => {
        if (response.ok) {
          console.log('PDF file is accessible');
        } else {
          console.error('PDF file not found:', response.status);
        }
      })
      .catch(error => {
        console.error('Error accessing PDF:', error);
      });
  }, [fileUrl]);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <DocumentViewer fileUrl={fileUrl} fileName={fileName} />
    </div>
  );
}

export default App;
