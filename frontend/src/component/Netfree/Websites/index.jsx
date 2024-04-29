// React imports
import { useEffect, useState } from "react";

// UI Components Imports
import SearchField from "../../fields/SearchField";
import AddButtonIcon from "../../common/AddButton";
import EditButtonIcon from "../../common/EditButton";
import TooltipButtonIcon from "../../common/TootltipButton";
import ProfileModal from "../category/ProfileModal";
import Loader from "../../common/Loader";
import StatusOption from "../category/StatusOption";
import DeleteConfirmationModal from "../../common/DeleteConfirmationModal";
import WebsiteModal from "./WebsiteModal";
import NetfreeTabs from "../NetfreeTabs";
import WebsiteActionModal from "./WebsiteActionModal";

// Third part Imports
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

// API services
import categoryService from "../../../services/category";

// Icon imports
import { MdExpandMore } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { HiDuplicate } from "react-icons/hi";

// Utils imports
import websiteServices from "../../../services/website";

const Websites = ({ currentTab, handleTabChange }) => {
  const { t, i18n } = useTranslation();
  const defaultLanguageValue = localStorage.getItem("DEFAULT_LANGUAGE");

  const [isLoading, setIsLoading] = useState(false);
  const [domainsData, setDomainsData] = useState([]);
  const [domainsDataCopy, setDomainsDataCopy] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [editActionID, setEditActionId] = useState(null);
  const [clickedAction, setClickedAction] = useState(null);
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [siteSearch, setSiteSearch] = useState("");
  const [profilesList, setProfilesList] = useState(null);
  const [profileActiveIndex, setProfileActiveIndex] = useState(0);
  const [activeProfile, setActiveprofile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [newProfile, setNewProfile] = useState(true);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [domain, setDomain] = useState(null);
  const [currentDomain, setCurrentDomain] = useState(null);
  const [editDomain, setEditDomain] = useState(null);

  const setResponseDataToState = (res) => {
    const response = res.data.data.map((el) => {
      el.isActionUpdateEnabled = false;
      el.actions = el.actions.map((item) => {
        return { isClicked: false, isActionEditOn: false, ...item };
      });
      return el;
    });
    setDomainsData(response);
    setDomainsDataCopy(response);
    if (siteSearch) {
      searchWebsites(siteSearch, response);
    } else {
      searchWebsites(currentSearchTerm, response);
    }
  };

  const actionsHandler = async (data, id) => {
    try {
      const res = await websiteServices.websiteActions(data, id);
      getDomainsData();
    } catch (error) {
      console.log(error);
    }
  };

  const getDomainsData = async () => {
    setIsLoading(true);
    const response = await websiteServices.getDomains();
    setResponseDataToState(response);
    setIsLoading(false);
  };

  const enableActionUpdate = (element) => {
    if (element) {
      setCurrentDomain(element);
    }
    setShowActionModal(true);
  };

  const deleteAction = (domainId, actionToRemove) => {
    setIsLoading(true);
    actionsHandler({ id: domainId, to_remove: actionToRemove }, null);
    setIsLoading(false);
  };

  // update/edit action value
  const editAction = (domainId, currentActions, actionToRemove, newValue) => {
    setIsLoading(true);
    actionsHandler({ id: domainId, to_add: newValue }, null);
    setIsLoading(false);
  };

  //make current action editable
  const editSelectedAction = (domain, action) => {
    setCurrentDomain(domain);
    setEditActionId(action.id);
    setShowActionModal(true);
  };

  const searchWebsites = (searchTerm, response, type) => {
    setCurrentSearchTerm(searchTerm);
    if (siteSearch) {
      setDomainsData(response);
    } else if (currentSearchTerm) {
      let filteredData = [];
      if (type === "domain" || type === "note") {
        filteredData = response?.filter((el) =>
          el[type].toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else {
        filteredData = response?.filter(
          (el) =>
            el.actions?.filter((action) =>
              action.label.toLowerCase().includes(searchTerm.toLowerCase())
            ).length > 0
        );
      }
      if (searchTerm === "") {
        filteredData = response;
      }
      setDomainsData(filteredData);
    } else {
      setDomainsData(response);
    }
  };

  const searchSetting = async (query) => {
    setIsLoading(true);
    setSiteSearch(query);
    const response = await categoryService.searchSiteSetting(query);
    if (query.length) {
      setSearchResult(response.data.data);
    } else {
      setSearchResult([]);
    }
    setResponseDataToState(response);
    setIsLoading(false);
  };

  const handleClickedAction = (id) => {
    if (clickedAction && clickedAction === id) {
      setClickedAction(null);
    } else {
      setClickedAction(id);
    }
  };

  const openActionOptions = (categoyIndex, action) => {
    let updatedCategoryData = JSON.parse(JSON.stringify(domainsData));
    updatedCategoryData.forEach((el, ind) => {
      if (ind === categoyIndex) {
        el.actions = el.actions.map((item) => {
          item.label === action.label
            ? (item.isClicked = !item.isClicked)
            : (item.isClicked = false);
          return item;
        });
      }
    });

    setDomainsData(updatedCategoryData);
  };

  const getAllProfilesListHandler = async () => {
    const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
    if (!filterProfileID) {
      localStorage.setItem("FILTER_PROFILE_ID", 1);
    }
    const profilesListData = await categoryService.getProfilesList();
    const defaultProfile = profilesListData.data.data.filter(
      (profile) => profile.is_default
    );
    const nonDefaultProfiles = profilesListData.data.data.filter(
      (profile) => !profile.is_default
    );
    const listsData = [...defaultProfile, ...nonDefaultProfiles];
    const profileIndex = localStorage.getItem("PROFILE_INDEX");
    setProfilesList(listsData);
    if (profileIndex && profileIndex < listsData.length) {
      setProfileActiveIndex(profileIndex);
      setActiveprofile(listsData[profileIndex]);
    } else {
      setActiveprofile(listsData[0]);
    }
  };

  const profileClickHandler = (index) => {
    const newActiveProfile = profilesList?.filter((profile, i) => i === index);
    localStorage.setItem("FILTER_PROFILE_ID", newActiveProfile[0].id);
    localStorage.setItem("PROFILE_INDEX", index);
    setActiveprofile(newActiveProfile[0]);
    setProfileActiveIndex(index);
    setNewProfile(false);
    getDomainsData();
    getActionsList();
    getDefaultTraffic();
    getDefaultTrafficActions();
  };

  const editProfileHandler = () => {
    setNewProfile(false);
    setShowProfileModal(!showProfileModal);
  };

  const deleteProfileHandler = async () => {
    const res = await categoryService.deleteProfile(activeProfile.id);
    const updatedProfiles = profilesList.filter(
      (profile) => profile.id !== activeProfile.id
    );
    const activeIndex = profilesList.findIndex(
      (profile) => profile.id === activeProfile.id
    );
    profileClickHandler(activeIndex - 1);
    setProfilesList(updatedProfiles);
    setProfileActiveIndex(activeIndex - 1);
    setActiveprofile(updatedProfiles[activeIndex - 1]);
  };

  const duplicateProfileHandler = async () => {
    const res = await categoryService.duplicateProfile(activeProfile);
    getAllProfilesListHandler();
  };

  const deleteDomain = async (id) => {
    try {
      const res = await websiteServices.deleteDomain(id);
      if (res.status === 204) {
        setDomain(null);
        getDomainsData();
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllProfilesListHandler();
    getDomainsData();
  }, [defaultLanguageValue]);

  const ActionSelectBox = ({
    options,
    domainName,
    domainId,
    currentActions,
    operationType,
    previousValue,
  }) => {
    return (
      <div className="w-auto mx-3 mt-1">
        <select
          onChange={(e) =>
            operationType === "edit"
              ? editAction(
                  domainId,
                  currentActions,
                  previousValue,
                  e.target.value
                )
              : actionsHandler(
                  { id: domainId, to_add: Number(e.target.value) },
                  null
                )
          }
          placeholder="Select Action"
          value={"selectAction"}
          className="bg-white border-[1px] py-1 px-2 outline-none rounded-md"
          onBlur={() =>
            editSelectedAction(domainId, { label: "close edit options" })
          }
        >
          <option value={"selectAction"} disabled>
            Select Action
          </option>
          {options?.map((el) => {
            return el ? (
              <option key={domainName + el.id} value={el.id}>
                {el.label}
              </option>
            ) : null;
          })}
        </select>
      </div>
    );
  };

  return (
    <div className="md:h-full w-full flex-col-reverse md:flex-row flex gap-4">
      {profilesList && activeProfile && (
        <>
          <WebsiteActionModal
            showModal={showActionModal}
            setShowModal={setShowActionModal}
            actionHandler={actionsHandler}
            currentData={currentDomain}
            editActionID={editActionID}
            setEditActionId={setEditActionId}
          />
          <ProfileModal
            showModal={showProfileModal}
            setShowModal={() => setShowProfileModal(!showProfileModal)}
            profile={activeProfile}
            newProfile={newProfile}
            profilesList={profilesList}
            onClick={getAllProfilesListHandler}
          />
          {showWebsiteModal && (
            <WebsiteModal
              showModal={showWebsiteModal}
              editDomain={editDomain}
              setEditDomain={setEditDomain}
              setShowModal={() => setShowWebsiteModal(!showWebsiteModal)}
              onClick={getDomainsData}
            />
          )}
        </>
      )}
      <div className="bg-white rounded-3xl overflow-x-auto overflow-y-hidden relative w-full">
        <NetfreeTabs
          currentTab={currentTab}
          handleTabChange={handleTabChange}
        />
        <div className="m-5 px-2">
          <ul
            className={`${
              defaultLanguageValue === "he" ? "pl-[150px]" : "pr-[150px]"
            } pb-1 overflow-x-auto flex text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400`}
          >
            {profilesList &&
              profilesList.length > 0 &&
              profilesList.map((profile, index) => {
                return (
                  <li key={index}>
                    <a
                      onClick={() => profileClickHandler(index)}
                      className={`mr-1 w-max inline-block cursor-pointer capitalize p-1 px-2 text-[#2B3674] rounded-t-sm ${
                        profileActiveIndex == index
                          ? "dark:bg-gray-800 bg-gray-100 dark:text-blue-500"
                          : "hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                      }`}
                    >
                      {profile.name}
                    </a>
                  </li>
                );
              })}
            <li
              className={`absolute ${
                defaultLanguageValue === "he" ? "left-0" : "right-0"
              } mr-7`}
            >
              <button
                className={`w-full rounded-full py-1 px-4 text-[12px] font-medium bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 text-white dark:hover:bg-brand-300 dark:active:bg-brand-200`}
                onClick={() => {
                  setShowProfileModal(!showProfileModal);
                  setNewProfile(true);
                }}
              >
                {t("netfree.addFilterProfile")}
              </button>
            </li>
          </ul>
        </div>
        {activeProfile && (
          <div className="bg-[#F4F7FE] flex justify-between p-2 rounded-md min-w-[50%] min-h-[50px] max-h-[150px] overflow-y-auto max-w-[50%] mx-6 my-4">
            <div>
              <div className="flex">
                <p className="text-xl text-[#2B3674] capitalize">
                  {activeProfile.name + " " + t("netfree.filterProfile")}
                </p>
                <TooltipButtonIcon extra="mx-2" />
              </div>
              <div className="flex">
                <p className="text-xs text-[#2B3674]">
                  {activeProfile.description}
                </p>
                <EditButtonIcon extra="mx-2" onClick={editProfileHandler} />
              </div>
              <p className="text-xs text-gray-600">
                {t("netfree.lastUpdatedAt") +
                  " " +
                  dayjs(activeProfile.updated_at).format(
                    "MMM DD, YYYY HH:mm A"
                  )}
              </p>
            </div>
            <div className="h-auto flex flex-col justify-between">
              <HiDuplicate
                className="text-blueSecondary w-5 h-5 hover:cursor-pointer"
                onClick={duplicateProfileHandler}
              />
              {activeProfile.id != "1" && (
                <MdDelete
                  className="text-blueSecondary w-5 h-5 hover:cursor-pointer"
                  onClick={deleteProfileHandler}
                />
              )}
            </div>
          </div>
        )}
        {isLoading && (
          <div className="h-[calc(100%-36px)] w-full flex justify-center items-center">
            <Loader />
          </div>
        )}
        <div className="flex items-center justify-end w-full px-5">
          <button
            className={`w-fit mb-2 ml-auto rounded-full py-1 px-4 text-[12px] font-medium bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 text-white dark:hover:bg-brand-300 dark:active:bg-brand-200`}
            onClick={() => {
              setEditDomain(null);
              setShowWebsiteModal(!showWebsiteModal);
            }}
          >
            {t("websites.addDomain")}
          </button>
        </div>
        <div className="h-[calc(100%-190px)] max-w-[100%] overflow-x-auto overflow-y-auto mx-5 px-2">
          <table className="!table text-[12px] overflow-y-auto w-full">
            <thead className="sticky top-0 z-10">
              <tr className=" pr-3 bg-lightPrimary rounded-lg">
                <th className="pb-2 px-1 w-[15rem]">
                  <h5 className="text-start text-[10px] md:text-[14px] font-bold text-[#2B3674] w-[15rem]">
                    {t("websites.domain")}
                  </h5>
                  <SearchField
                    variant="auth"
                    type="text"
                    placeholder={t("searchbox.placeHolder")}
                    onChange={(e) =>
                      searchWebsites(e.target.value, domainsDataCopy, "domain")
                    }
                    name="domain"
                  />
                </th>
                <th className="pl-5">
                  <h5 className="text-start capitalize text-[10px] md:text-[14px] font-bold text-[#2B3674]">
                    {t("netfree.note")}
                  </h5>
                  <SearchField
                    variant="auth"
                    type="text"
                    placeholder={t("searchbox.placeHolder")}
                    onChange={(e) =>
                      searchWebsites(e.target.value, domainsDataCopy, "note")
                    }
                    name="note"
                  />
                </th>
                <th className="pl-5">
                  <h5 className="text-start text-[10px] md:text-[14px] font-bold text-[#2B3674]">
                    {t("netfree.actions")}
                  </h5>
                  <SearchField
                    variant="auth"
                    type="text"
                    placeholder={t("searchbox.placeHolder")}
                    onChange={(e) =>
                      searchWebsites(e.target.value, domainsDataCopy, "actions")
                    }
                    name="actions"
                  />
                </th>
              </tr>
            </thead>
            <tbody className="pt-5 ">
              {domainsData.map((el, currentIndex) => {
                return (
                  <tr
                    className="h-[20px] border-t bottom-b border-sky-500 w-[100%]"
                    key={el.id}
                  >
                    <td>
                      <div className="flex justify-between">
                        <h5 className="font-bold text-[#2B3674] break-words w-[15rem]">
                          {el.domain}
                        </h5>
                        <div className="flex items-center justify-center">
                          <EditButtonIcon
                            extra="mr-2 justify-self-end"
                            onClick={() => {
                              setEditDomain(el);
                              setShowWebsiteModal(true);
                            }}
                          />
                          <MdDelete
                            onClick={() => {
                              setDomain(el);
                              setConfirmationModal(!confirmationModal);
                            }}
                            className="text-lg text-red-600 cursor-pointer"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 min-w-[9rem] max-w-[18rem]">
                      {el.note}
                    </td>
                    <td className="px-5 flex gap-2 py-[6px]">
                      {el.actions.map((action, index) => {
                        return action.label.length ? (
                          action.isActionEditOn ? (
                            <ActionSelectBox
                              key={action + index}
                              options={actionsList.map((item) =>
                                !el.actions.some(
                                  (el) => el.label === item.label
                                )
                                  ? item
                                  : null
                              )}
                              domainName={el.domain}
                              domainId={el.id}
                              currentActions={actionsList.map((item, index) =>
                                el.actions.some((el) => el.label === item.label)
                                  ? item.id
                                  : null
                              )}
                              operationType="edit"
                              previousValue={action.label}
                            />
                          ) : (
                            <div
                              key={action + index}
                              className="px-3 relative py-1 bg-[#F4F7FE] rounded-full flex gap-2 whitespace-nowrap"
                            >
                              {action.label}
                              <span
                                onClick={() => {
                                  openActionOptions(currentIndex, action);
                                  handleClickedAction(action?.id);
                                }}
                              >
                                <MdExpandMore className="h-5 w-5 text-blueSecondary cursor-pointer" />
                              </span>
                              {clickedAction == action?.id && (
                                <div
                                  className={`absolute top-[20px] z-10 drop-shadow-md bg-white cursor-pointer ${
                                    i18n.dir() === "rtl"
                                      ? "left-[-15px]"
                                      : "right-[-15px]"
                                  }`}
                                >
                                  {(action.label.includes(
                                    "Send email template"
                                  ) ||
                                    action.label.includes(
                                      "שלח תבנית אימייל"
                                    )) && (
                                    <div
                                      className="py-1 px-3 border-b-[1px] hover:bg-[#f2f3f5]"
                                      onClick={() =>
                                        editSelectedAction(el, action)
                                      }
                                    >
                                      {t("netfree.edit")}
                                    </div>
                                  )}
                                  <div
                                    className="py-1 px-3 hover:bg-[#f2f3f5]"
                                    onClick={() =>
                                      deleteAction(el.id, action.id)
                                    }
                                  >
                                    {t("netfree.remove")}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        ) : null;
                      })}
                      {el.request_status && (
                        <StatusOption
                          getData={getDomainsData}
                          dataValue={el}
                          deleteStatusFn={(statusId) =>
                            websiteServices.deleteWebsiteStatus(statusId)
                          }
                        />
                      )}
                      {
                        <AddButtonIcon
                          extra={""}
                          onClick={() => {
                            enableActionUpdate(el);
                          }}
                        />
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {confirmationModal && domain && (
        <DeleteConfirmationModal
          showModal={confirmationModal}
          setShowModal={setConfirmationModal}
          onClick={() => deleteDomain(domain.id)}
        />
      )}
    </div>
  );
};

export default Websites;
