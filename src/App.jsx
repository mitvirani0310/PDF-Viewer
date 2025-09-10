import DocumentViewer from "./DocumentViewer";

function App() {
  const fileUrl = "/Smit-Goyani-CV 2.pdf"; // Put your PDF in `public/` folder
  const fileName = "Smit-Goyani-CV 2.pdf";

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <DocumentViewer fileUrl={fileUrl} fileName={fileName} />
    </div>
  );
}

export default App;
