// React imports
import React, { useState, useEffect } from "react";

// UI Imports
import { TablePagination } from "@mui/material";

// UI Components Imports
import AddButtonIcon from "../component/common/AddButton";
import SearchField from "../component/fields/SearchField";
import Loader from "../component/common/Loader";
import NoDataFound from "../component/common/NoDataFound";
import DeleteConfirmationModal from "../component/common/DeleteConfirmationModal";
import TemplatingModal from "../component/email/TemplatingModal";

// Third part Imports
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// API services
import emailService from "../services/email";

// Icon imports
import { MdDelete, MdEdit } from "react-icons/md";

// Utils imports
import {
  paginationRowOptions,
  templateTextTypes,
  websiteChoices,
} from "../lib/FieldConstants";

function EmailTemplating() {
  const { t, i18n } = useTranslation();
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const [templatingTexts, setTemplatingTexts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [templatingModal, setTemplatingModal] = useState(false);
  const [newText, setNewText] = useState(true);
  const [editText, setEditText] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(100);
  const [searchParams, setSearchParams] = useState({});
  const [confirmationModal, setConfirmationModal] = useState(false);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const searchResult = (searchBy, value) => {
    setSearchParams((prev) => ({ ...prev, ...{ [searchBy]: value } }));
  };

  const getTemplatingHandler = async () => {
    setIsLoading(true);
    try {
      let searchValues = "";
      for (const searchfield in searchParams) {
        if (searchParams[searchfield] !== "") {
          searchValues += `&search_${[searchfield]}=${
            searchParams[searchfield]
          }`;
        }
      }
      const params = `?page=${
        page + 1
      }&lang=${lang}&page_size=${rowsPerPage}${searchValues}`;
      const res = await emailService.getTemplatingTexts(params);
      setTemplatingTexts(res.data?.data);
      setTotalCount(res?.data?.count);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const editTextHandler = (text) => {
    setNewText(false);
    setEditText(text);
    setTemplatingModal(true);
  };

  const deleteTextHandler = async () => {
    try {
      const res = await emailService.deleteTemplatingText(editText?.id);
      if (res.status > 200) {
        toast.success(t("common.deleteSuccess"));
        getTemplatingHandler();
        setConfirmationModal(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      getTemplatingHandler();
    }, 500);

    return () => clearTimeout(timer);
  }, [lang, page, rowsPerPage, JSON.stringify(searchParams)]);

  return (
    <div className="w-full bg-white rounded-3xl">
      <div className="flex justify-between py-4 px-7 font-bold text-[#2B3674]">
        {t("sidebar.templating")}
        <div className="flex max-w-[150px]">
          <AddButtonIcon
            extra={""}
            onClick={() => {
              setTemplatingModal(true);
              setNewText(true);
              setEditText(null);
            }}
          />
        </div>
      </div>
      <div className="h-[calc(100vh-210px)] overflow-y-auto overflow-x-auto mx-5 px-2">
        <table className="!table w-full text-[12px] md:text-[14px] mb-3">
          <thead className="sticky top-0 z-10 [&_th]:min-w-[8.5rem]">
            <tr className="tracking-[-2%] mb-5 bg-lightPrimary">
              <th className="pr-3">
                <SearchField
                  variant="auth"
                  extra="mb-2"
                  label={t("clients.id")}
                  id="userId"
                  type="text"
                  placeholder={t("searchbox.placeHolder")}
                  onChange={(e) => searchResult("id", e.target.value)}
                  name="id"
                />
              </th>
              <th className="pr-3">
                <SearchField
                  variant="auth"
                  extra="mb-2"
                  label={t("dataTypes.text")}
                  id="text"
                  type="text"
                  placeholder={t("searchbox.placeHolder")}
                  onChange={(e) => searchResult("text", e.target.value)}
                  name="text"
                />
              </th>
              <th className="pr-3">
                <SearchField
                  variant="auth"
                  extra="mb-2"
                  label={t("emails.text_type")}
                  id="text_type"
                  type="text"
                  placeholder={t("searchbox.placeHolder")}
                  onChange={(e) => searchResult("text_type", e.target.value)}
                  name="text_type"
                />
              </th>
              <th className="pr-3">
                <SearchField
                  variant="auth"
                  extra="mb-2"
                  label={t("emails.website")}
                  id="website"
                  type="text"
                  placeholder={t("searchbox.placeHolder")}
                  onChange={(e) => searchResult("website", e.target.value)}
                  name="website"
                />
              </th>
              <th className="pr-3">
                <SearchField
                  variant="auth"
                  extra="mb-2"
                  label={t("emails.default")}
                  id="default"
                  type="text"
                  placeholder={t("searchbox.placeHolder")}
                  onChange={(e) => searchResult("is_default", e.target.value)}
                  name="default"
                />
              </th>
              <th className="pr-3">
                <div
                  className={` ${
                    i18n.dir() === "rtl" ? "text-right" : "text-left"
                  }`}
                >
                  <label
                    className={`text-[10px] truncate md:text-[14px] text-navy-700 ml-1.5 font-medium`}
                  >
                    {t("netfree.actions")}
                  </label>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="[&_td]:min-w-[9rem] [&_td]:max-w-[18rem] [&_td]:p-1">
            {isLoading ? (
              <tr>
                <td colSpan="6">
                  <div className="h-[calc(100vh-210px)] w-full flex justify-center items-center">
                    <Loader />
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {templatingTexts && templatingTexts.length > 0 ? (
                  <>
                    {templatingTexts.map((el) => {
                      return (
                        <tr className="h-[75px]" key={el.id}>
                          <td>#{el.id}</td>
                          <td>
                            <p className="line-clamp-4 break-words flex h-full items-center">
                              {el.text}
                            </p>
                          </td>
                          <td>
                            {t(
                              `emails.${
                                templateTextTypes.filter(
                                  (type) => type === el.text_type
                                )[0]
                              }`
                            )}
                          </td>
                          <td>
                            {t(
                              `emails.${
                                websiteChoices.filter(
                                  (choice) => choice === el.website
                                )[0]
                              }`
                            )}
                          </td>
                          <td>{JSON.stringify(el.is_default)}</td>
                          <td>
                            <div className="h-auto w-full flex items-center justify-around">
                              <MdEdit
                                className="text-blueSecondary w-5 h-5 hover:cursor-pointer"
                                onClick={() => {
                                  editTextHandler(el);
                                }}
                              />
                              <MdDelete
                                className="text-blueSecondary w-5 h-5 hover:cursor-pointer"
                                onClick={() => {
                                  setEditText(el);
                                  setConfirmationModal(true);
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                ) : (
                  <tr className="h-[75px] text-center">
                    <td colSpan={6}>
                      <NoDataFound description={t("common.noDataFound")} />
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
      {templatingTexts && templatingTexts.length > 0 && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          rowsPerPageOptions={paginationRowOptions}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
      {templatingModal && (
        <TemplatingModal
          showModal={templatingModal}
          setShowModal={setTemplatingModal}
          textData={editText}
          newtext={newText}
          onClick={() => {
            getTemplatingHandler();
          }}
        />
      )}
      {confirmationModal && editText && (
        <DeleteConfirmationModal
          showModal={confirmationModal}
          setShowModal={setConfirmationModal}
          onClick={() => deleteTextHandler()}
        />
      )}
    </div>
  );
}

export default EmailTemplating;
