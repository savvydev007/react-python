// React imports
import React, { useEffect, useState } from "react";

// UI Imports
import { Box, TablePagination } from "@mui/material";

// UI Components Imports
import Loader from "../../common/Loader";
import NoDataFound from "../../common/NoDataFound";
import SearchField from "../../fields/SearchField";

// Third part Imports
import { useTranslation } from "react-i18next";

// API services
import clientsService from "../../../services/clients";

// Icon imports
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

// Utils imports
import {
  paginationRowOptions,
  searchFields,
} from "../../../lib/FieldConstants";
import { formateDateTime, handleSort } from "../../../lib/CommonFunctions";

function RequestsTabPanel(props) {
  const { children, value, index, id, ...other } = props;
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(100);
  const [searchParams, setSearchParams] = useState(searchFields);
  const [isLoading, setIsloading] = useState(true);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const handleSortHandler = (field) => {
    if (requests.length > 0) {
      handleSort(
        field,
        requests,
        sortField,
        sortOrder,
        setSortOrder,
        setSortField,
        setRequests
      );
    }
  };

  const fetchClientRequests = () => {
    setIsloading(true);
    try {
      let searchValues = "";
      for (const searchfield in searchParams) {
        if (searchParams[searchfield] !== "") {
          searchValues += `&search_${[searchfield]}=${
            searchParams[searchfield]
          }`;
        }
      }
      const params = `page=${
        page + 1
      }&page_size=${rowsPerPage}&email_request=true${searchValues}`;
      clientsService
        .getClient(id, params)
        .then((res) => {
          setRequests(res.data);
          setTotalCount(res.data.count);
          setIsloading(false);
        })
        .catch((err) => {
          console.log(err);
          setIsloading(false);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const searchResult = (searchBy, value) => {
    let values = [];
    if (searchBy === "from") {
      values = { sender_email: value, customer_id: value, username: value };
    } else if (searchBy === "requestdetail") {
      values = { text: value, requested_website: value };
    } else {
      values = { [searchBy]: value };
    }
    setSearchParams((prev) => ({ ...prev, ...values }));
  };

  useEffect(() => {
    const searchTimer = setTimeout(() => fetchClientRequests(), 500);
    return () => clearTimeout(searchTimer);
  }, [lang, page, rowsPerPage, JSON.stringify(searchParams)]);

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          <div className="h-[calc(100vh-210px)] overflow-y-auto overflow-x-auto px-2">
            <table className="!table text-[12px] md:text-[14px] mb-3">
              <thead className="sticky top-0 z-10 [&_th]:min-w-[8.5rem]">
                <tr className="tracking-[-2%] mb-5 bg-lightPrimary">
                  <th className="pr-3">
                    <SearchField
                      variant="auth"
                      extra="mb-2"
                      label={
                        <p
                          onClick={() => handleSortHandler("id")}
                          className="flex cursor-pointer items-center justify-between w-full"
                        >
                          {t("searchbox.requestId")}
                          {sortField === "id" ? (
                            sortOrder === "asc" ? (
                              <FaArrowUp className="ml-1" />
                            ) : (
                              <FaArrowDown className="ml-1" />
                            )
                          ) : (
                            <FaArrowUp className="ml-1" />
                          )}
                        </p>
                      }
                      id="requestId"
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
                      label={
                        <p
                          onClick={() => handleSortHandler("created_at")}
                          className="flex cursor-pointer items-center justify-between w-full"
                        >
                          {t("searchbox.dateCreated")}
                          {sortField === "created_at" ? (
                            sortOrder === "asc" ? (
                              <FaArrowUp className="ml-1" />
                            ) : (
                              <FaArrowDown className="ml-1" />
                            )
                          ) : (
                            <FaArrowUp className="ml-1" />
                          )}
                        </p>
                      }
                      id="dateCreated"
                      type="text"
                      placeholder={t("searchbox.placeHolder")}
                      onChange={(e) =>
                        searchResult("created_at", e.target.value)
                      }
                      name="created_at"
                    />
                  </th>
                  <th className="pr-3">
                    <SearchField
                      variant="auth"
                      extra="mb-2"
                      label={
                        <p
                          onClick={() => handleSortHandler("sender_email")}
                          className="flex cursor-pointer items-center justify-between w-full"
                        >
                          {t("searchbox.from")}
                          {sortField === "from" ? (
                            sortOrder === "asc" ? (
                              <FaArrowUp className="ml-1" />
                            ) : (
                              <FaArrowDown className="ml-1" />
                            )
                          ) : (
                            <FaArrowUp className="ml-1" />
                          )}
                        </p>
                      }
                      id="from"
                      type="text"
                      placeholder={t("searchbox.placeHolder")}
                      onChange={(e) => searchResult("from", e.target.value)}
                      name="from"
                    />
                  </th>
                  <th className="pr-3">
                    <SearchField
                      variant="auth"
                      extra="mb-2"
                      label={
                        <p
                          onClick={() => handleSortHandler("request_type")}
                          className="flex cursor-pointer items-center justify-between w-full"
                        >
                          {t("searchbox.requestType")}
                          {sortField === "request_type" ? (
                            sortOrder === "asc" ? (
                              <FaArrowUp className="ml-1" />
                            ) : (
                              <FaArrowDown className="ml-1" />
                            )
                          ) : (
                            <FaArrowUp className="ml-1" />
                          )}
                        </p>
                      }
                      id="requestType"
                      type="text"
                      placeholder={t("searchbox.placeHolder")}
                      onChange={(e) =>
                        searchResult("request_type", e.target.value)
                      }
                      name="request_type"
                    />
                  </th>
                  <th className="pr-3">
                    <SearchField
                      variant="auth"
                      extra="mb-2"
                      label={
                        <p
                          onClick={() => handleSortHandler("requested_website")}
                          className="flex cursor-pointer items-center justify-between w-full"
                        >
                          {t("searchbox.requestdetail")}
                          {sortField === "requestdetail" ? (
                            sortOrder === "asc" ? (
                              <FaArrowUp className="ml-1" />
                            ) : (
                              <FaArrowDown className="ml-1" />
                            )
                          ) : (
                            <FaArrowUp className="ml-1" />
                          )}
                        </p>
                      }
                      id="requestdetail"
                      type="text"
                      placeholder={t("searchbox.placeHolder")}
                      onChange={(e) =>
                        searchResult("requestdetail", e.target.value)
                      }
                      name="requestdetail"
                    />
                  </th>
                  <th className="pr-3">
                    <SearchField
                      variant="auth"
                      extra="mb-2"
                      label={
                        <p
                          onClick={() => handleSortHandler("action_done")}
                          className="flex cursor-pointer items-center justify-between w-full"
                        >
                          {t("searchbox.actionsDone")}
                          {sortField === "action_done" ? (
                            sortOrder === "asc" ? (
                              <FaArrowUp className="ml-1" />
                            ) : (
                              <FaArrowDown className="ml-1" />
                            )
                          ) : (
                            <FaArrowUp className="ml-1" />
                          )}
                        </p>
                      }
                      id="actionsDone"
                      type="text"
                      placeholder={t("searchbox.placeHolder")}
                      onChange={(e) =>
                        searchResult("action_done", e.target.value)
                      }
                      name="action_done"
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="[&_td]:min-w-[9rem] [&_td]:max-w-[18rem]">
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
                    {requests.count > 0 ? (
                      <>
                        {" "}
                        {requests.data.map((el) => {
                          return (
                            <tr className="h-[75px]" key={el.id}>
                              <td>#{el.id}</td>
                              <td>
                                {formateDateTime(el.created_at).date}
                                <br />
                                {formateDateTime(el.created_at).time}
                              </td>
                              <td>
                                <a
                                  href={`https://netfree.link/app/#/sectors/user-filter-settings/${el.customer_id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#2B3674] hover:text-[#2B3674] font-bold"
                                >
                                  #{el.customer_id}
                                  <br />
                                </a>
                                {el.username}
                                <br />
                                <a
                                  href={`mailto:${el.sender_email}`}
                                  className="text-[#2B3674] hover:text-[#2B3674] font-bold"
                                >
                                  {el.sender_email}
                                </a>
                              </td>
                              <td>{el.request_type}</td>
                              <td>
                                <a
                                  href={el.requested_website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#2B3674] hover:text-[#2B3674] font-bold line-clamp-2 break-words"
                                >
                                  {el.requested_website}
                                </a>
                                <br />
                                <p className="line-clamp-4 break-words">
                                  {el.text}
                                </p>
                                {/* <div dangerouslySetInnerHTML={{ __html: el.text }} />                  */}
                              </td>
                              <td className="flex justify-center gap-4 px-2">
                                <div className="bg-[#F4F7FE] px-2 py-1">
                                  {el.action_done}
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
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            rowsPerPageOptions={paginationRowOptions}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      )}
    </div>
  );
}

export default React.memo(RequestsTabPanel);
