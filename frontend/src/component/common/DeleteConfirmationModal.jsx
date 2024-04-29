// React imports
import React from "react";

// Third part Imports
import { useTranslation } from "react-i18next";

function DeleteConfirmationModal({ showModal, setShowModal, onClick }) {
  const { t } = useTranslation();
  return (
    <>
      {showModal && (
        <div className="fixed left-0 bottom-0 z-[99] h-screen w-screen bg-[#00000020] flex justify-center items-center">
          <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-[9999] outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-7xl">
              <div className="w-[100%] min-w-[300px] overflow-y-auto border-0 rounded-2xl shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                <div className="flex items-start justify-between p-5 shadow-md rounded-t">
                  <h3 className="text-xl font-bold">
                    {t("common.deleteConfirmation")}
                  </h3>
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
                <div className="relative  p-6 flex-auto max-h-[calc(90vh-170px)] overflow-y-auto">
                  <p className="text-lg font-semibold">
                    {t("common.deleteNote")}
                  </p>
                </div>
                <div className="flex items-center justify-end p-4 border-t border-solid border-blueGray-200 rounded-b">
                  <button
                    className="text-white rounded bg-brand-500 font-bold uppercase px-3 py-1 text-sm outline-none focus:outline-none mr-1 mb-1"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    {t("common.no")}
                  </button>
                  <button
                    className="text-white text-[14px] font-bold font-small transition duration-200 bg-red-500 hover:bg-red-600 active:bg-red-700 uppercase px-3 py-1 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1"
                    type="button"
                    onClick={onClick}
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DeleteConfirmationModal;
