// React imports
import React, { useEffect, useState } from "react";

// UI Imports
import { TablePagination } from "@mui/material";

// UI Components Imports
import SearchField from "../component/fields/SearchField";
import Loader from "../component/common/Loader";
import NoDataFound from "../component/common/NoDataFound";
import LogChanges from "../component/LogsComponents/changes";

// Third part Imports
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

// API services
import logsService from "../services/logs";

// Utils imports
import { paginationRowOptions, searchFields } from "../lib/FieldConstants";

function Logs() {
  const { t } = useTranslation();
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const [isLoading, setIsLoading] = useState(true);
  const [allLogs, setAllLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(100);
  const [searchParams, setSearchParams] = useState(searchFields);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchLogsData = async () => {
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
      const requestData = await logsService.getLogs(params);
      setTotalCount(requestData?.data?.count);
      setAllLogs(requestData?.data?.data);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const searchResult = (searchBy, value) => {
    setSearchParams((prev) => ({ ...prev, ...{ [searchBy]: value } }));
  };

  useEffect(() => {
    const searchTimer = setTimeout(() => fetchLogsData(), 500);
    return () => clearTimeout(searchTimer);
  }, [lang, page, rowsPerPage, JSON.stringify(searchParams)]);

  return (
    <div className="w-full bg-white rounded-3xl">
      <div className="flex py-4 px-7 font-bold text-[#2B3674]">
        {t("sidebar.logs")}
      </div>
      <div className="h-[calc(100vh-210px)] overflow-y-auto overflow-x-auto mx-5 px-2">
        <table className="!table text-[12px] md:text-[14px] mb-3">
          <thead className="sticky top-0 z-10 [&_th]:min-w-[8.5rem]">
            <tr className="tracking-[-2%] mb-5 bg-lightPrimary">
              <th className="pr-3">
                <SearchField
                  variant="auth"
                  extra="mb-2"
                  label={t("clients.id")}
                  id="logId"
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
                  label={t("searchbox.user")}
                  id="user"
                  type="text"
                  placeholder={t("searchbox.placeHolder")}
                  onChange={(e) => searchResult("user", e.target.value)}
                  name="user"
                />
              </th>
              <th className="pr-3">
                <SearchField
                  variant="auth"
                  extra="mb-2"
                  label={t("searchbox.changes")}
                  id="changes"
                  type="text"
                  placeholder={t("searchbox.placeHolder")}
                  onChange={(e) => searchResult("changes", e.target.value)}
                  name="changes"
                />
              </th>
              <th className="pr-3">
                <SearchField
                  variant="auth"
                  extra="mb-2"
                  label={t("searchbox.action")}
                  id="action"
                  type="text"
                  placeholder={t("searchbox.placeHolder")}
                  onChange={(e) => searchResult("action", e.target.value)}
                  name="action"
                />
              </th>
              <th className="pr-3">
                <SearchField
                  variant="auth"
                  extra="mb-2"
                  label={t("searchbox.entity")}
                  id="entity"
                  type="text"
                  placeholder={t("searchbox.placeHolder")}
                  onChange={(e) => searchResult("entity", e.target.value)}
                  name="entity"
                />
              </th>
              <th className="pr-3">
                <SearchField
                  variant="auth"
                  extra="mb-2"
                  label={t("searchbox.timeStamp")}
                  id="timeStamp"
                  type="text"
                  placeholder={t("searchbox.placeHolder")}
                  onChange={(e) => searchResult("created_at", e.target.value)}
                  name="timeStamp"
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
                {allLogs.length > 0 ? (
                  <>
                    {allLogs.map((el) => {
                      return (
                        <tr className="h-[75px]" key={el.id}>
                          <td>#{el.id}</td>
                          <td>
                            <div className="flex flex-col">
                              <p className="capitalize">{el?.user?.name}</p>
                              <p className="mt-2">{el?.user.email}</p>
                            </div>
                          </td>
                          <td>
                            <LogChanges changes={el.changes} />
                          </td>
                          <td className="capitalize">{el?.action}</td>
                          <td className="capitalize">{el?.entity_type}</td>
                          <td>
                            {dayjs(el.created_at).format(
                              "DD MMM , YYYY hh:mm A"
                            )}
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
    </div>
  );
}

export default Logs;
