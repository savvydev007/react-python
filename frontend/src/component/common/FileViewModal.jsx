// React imports
import React, { useEffect, useState, useRef } from "react";

// UI Components Imports
import Loader from "./Loader";
import NoDataFound from "./NoDataFound";

// Third part Imports
import { useTranslation } from "react-i18next";

// Utils imports
import { docTypes, imageTypes } from "../../lib/FieldConstants";

const FileViewModal = ({ field, setShowModal }) => {
  const { t } = useTranslation();
  const BASEURL = import.meta.env.VITE_API_URL;
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [iframeTimeoutId, setIframeTimeoutId] = useState(undefined);
  const iframeRef = useRef(null);

  const supportTypeHandler = (type) => {
    if (!docTypes.includes(type) && !imageTypes.includes(type)) {
      setLoading(false);
    }
  };
  function iframeLoaded() {
    setLoading(false);
    clearInterval(iframeTimeoutId);
  }
  function getIframeLink() {
    return `https://docs.google.com/gview?url=${
      BASEURL + field?.value?.file_url
    }&embedded=true`;
  }
  function updateIframeSrc() {
    if (iframeRef.current) {
      iframeRef.current.src = getIframeLink();
    }
  }

  const fileTypeHandler = () => {
    const type =
      field?.value?.file_name.split(".")[
        field?.value?.file_name.split(".").length - 1
      ];
    setFileType(type);
    supportTypeHandler(type);
  };

  useEffect(() => {
    fileTypeHandler();
  }, [JSON.stringify(field)]);

  useEffect(() => {
    const intervalId = setInterval(updateIframeSrc, 1000 * 3);
    setIframeTimeoutId(intervalId);
  }, []);

  return (
    <div className="fixed left-0 bottom-0 z-[99] h-screen w-screen bg-[#00000080] flex justify-center items-center">
      <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-[9999] outline-none focus:outline-none">
        <div className="relative w-auto my-6 mx-auto max-w-7xl">
          <div className="w-[100%] min-w-[80vw] md:min-w-[70vw] lg:min-w-[60vw] overflow-y-auto border-0 rounded-2xl shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
            <div className="flex items-start justify-between p-5 shadow-md rounded-t">
              <h3 className="text-xl font-bold">{t("common.fileViewer")}</h3>
              <button
                className="bg-transparent border-0 text-black float-right"
                onClick={() => setShowModal(false)}
                type="button"
              >
                <span className="text-black opacity-7 h-6 w-6 text-xl block py-0 rounded-full">
                  x
                </span>
              </button>
            </div>
            <div className="w-full p-6 max-h-[80vh] min-h-[400px] flex flex-col items-center justify-center">
              {loading ? <Loader /> : null}
              {docTypes.includes(fileType) || imageTypes.includes(fileType) ? (
                <>
                  {docTypes.includes(fileType) && (
                    <iframe
                      ref={iframeRef}
                      onLoad={iframeLoaded}
                      className={`${loading ? "opacity-0" : "opacity-100"}`}
                      style={{
                        height: "500px",
                        width: "500px",
                      }}
                    />
                  )}
                  {imageTypes.includes(fileType) && (
                    <img
                      onLoad={iframeLoaded}
                      src={BASEURL + field?.value?.file_url}
                      className="h-auto w-auto max-w-[80vw] max-h-[60vh]"
                      alt="image"
                    />
                  )}
                </>
              ) : (
                <>
                  {!loading && (
                    <div className="h-full w-full flex flex-col justify-center items-center">
                      <NoDataFound />
                      <p className="font-bold">
                        {t("common.fileNotSupported")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileViewModal;
