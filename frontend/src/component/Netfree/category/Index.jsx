// React imports
import { useEffect, useState } from "react";

// UI Components Imports
import SearchField from "../../fields/SearchField";
import ToggleSwitch from "../../common/ToggleSwitch";
import AddButtonIcon from "../../common/AddButton";
import ActionModal from "./ActionModal";
import EditButtonIcon from "../../common/EditButton";
import TooltipButtonIcon from "../../common/TootltipButton";
import ProfileModal from "./ProfileModal";
import Loader from "../../common/Loader";
import StatusOption from "./StatusOption";
import NetfreeTabs from "../NetfreeTabs";

// Third part Imports
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { debounce } from "lodash";

// API services
import categoryService from "../../../services/category";
import requestService from "../../../services/request";

// Icon imports
import { MdExpandMore } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { HiDuplicate } from "react-icons/hi";

// Utils imports
import { deleteNetfreeStatus } from "../../../lib/CommonFunctions";

const Categories = ({ currentTab, handleTabChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [categoriesData, setCategoriesData] = useState([]);
  const [categoriesDataCopy, setCategoriesDataCopy] = useState([]);
  const [actionsList, setActionsList] = useState([]);
  const [defaultActionList, setDefaultActionList] = useState([]);
  const [searchResult, setSearchResult] = useState([]);
  const [isDefaultActionSelectOpen, setIsDefaultActionSelectOpen] =
    useState(false);
  const { t, i18n } = useTranslation();
  const [showActionModal, setShowActionModal] = useState(false);
  const [clickedAction, setClickedAction] = useState(null);
  const [currentSelectedCategoryId, setCurrentSelectedCategoryId] = useState(0);
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [siteSearch, setSiteSearch] = useState("");
  const [editActionID, setEditActionId] = useState(null);
  const [defaultTraffic, setDefaultTraffic] = useState(null);
  const [profilesList, setProfilesList] = useState(null);
  const [profileActiveIndex, setProfileActiveIndex] = useState(0);
  const [activeProfile, setActiveprofile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newProfile, setNewProfile] = useState(true);
  const [trafficAction, setTrafficAction] = useState(false);
  const [defaultTrafficActions, setDefaultTrafficActions] = useState([]);
  const [defaultStatus, setDefaultStatus] = useState(null);
  const [trafficStatus, setTrafficStatus] = useState(null);
  const defaultLanguageValue = localStorage.getItem("DEFAULT_LANGUAGE");

  const setResponseDataToState = (res) => {
    const response = res.data.data.map((el) => {
      el.isActionUpdateEnabled = false;
      el.actions = el.actions.map((item) => {
        return { isClicked: false, isActionEditOn: false, ...item };
      });
      return el;
    });
    setCategoriesData(response);
    setCategoriesDataCopy(response);
    if (siteSearch) {
      searchCategories(siteSearch, response);
    } else {
      searchCategories(currentSearchTerm, response);
    }
  };

  const getCategoryData = async () => {
    setIsLoading(true);
    const response = await categoryService.getCategories();
    setResponseDataToState(response);
    setIsLoading(false);
  };

  const getDefaultActions = async () => {
    const response = await categoryService.getDefaultAction();
    setDefaultActionList(response.data.data);
  };
  const getDefaultTraffic = async () => {
    const response = await categoryService.getDefaultTraffic();
    setDefaultTraffic(response.data.data.is_active);
  };

  const getDefaultTrafficActions = async () => {
    const response = await categoryService.getDefaultTrafficActions();
    setDefaultTrafficActions(response.data.data);
  };

  const updateDefaultTrafficHandler = async () => {
    const data = {
      status: !defaultTraffic,
    };
    const response = await categoryService.updateNetfreeTraffic(data);
    setDefaultTraffic(response.data.data.is_active);
  };

  const deleteDefaultAction = async (actionId) => {
    setIsLoading(true);
    await categoryService.deleteDefaultAction(actionId);
    await getDefaultTrafficActions();
    getCategoryData();
    await getActionsList();
    setIsLoading(false);
  };

  const getActionsList = async () => {
    getDefaultActions().then(async () => {
      const defaultStatusResponse = await categoryService.getDefaultStatus();
      const trafficStatusResponse = await categoryService.getTrafficStatus();
      setDefaultStatus(defaultStatusResponse.data.data[0]);
      setTrafficStatus(trafficStatusResponse.data.data[0]);
      const response = await categoryService.getActions();
      setActionsList(response.data.data);
    });
  };

  const handleUpdateCategory = () => {
    categoryService.updateCategories();
  };

  const enableActionUpdate = (element) => {
    if (element) {
      setCurrentSelectedCategoryId(element);
    }
    setShowActionModal(true);
  };

  const updateAction = async (data, id) => {
    setIsLoading(true);
    await categoryService.updateActionInCategory(data, id);
    if (siteSearch) {
      searchSetting(siteSearch);
    } else {
      getCategoryData();
    }
    setIsLoading(false);
  };

  const deleteAction = (categoryId, actionToRemove) => {
    setIsLoading(true);
    updateAction({ id: categoryId, to_remove: actionToRemove }, null);
    setIsLoading(false);
  };

  // update/edit action value
  const editAction = (categoryId, currentActions, actionToRemove, newValue) => {
    setIsLoading(true);
    updateAction({ id: categoryId, to_add: newValue }, null);
    setIsLoading(false);
  };

  //make current action editable
  const editSelectedAction = (categoyId, action) => {
    setCurrentSelectedCategoryId(categoyId);
    setEditActionId(action.id);
    setShowActionModal(true);
  };

  const searchCategories = (searchTerm, response, type) => {
    setCurrentSearchTerm(searchTerm);
    if (siteSearch) {
      setCategoriesData(response);
    } else if (currentSearchTerm) {
      let filteredData = [];
      if (type === "name") {
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
      setCategoriesData(filteredData);
    } else {
      setCategoriesData(response);
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

  const handleSiteSearch = debounce((e) => searchSetting(e.target.value), 500);

  const handleClickedAction = (id) => {
    if (clickedAction && clickedAction === id) {
      setClickedAction(null);
    } else {
      setClickedAction(id);
    }
  };

  const openActionOptions = (categoyIndex, action) => {
    let updatedCategoryData = JSON.parse(JSON.stringify(categoriesData));
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

    setCategoriesData(updatedCategoryData);
  };

  const setDefaultAction = async (actionId, data) => {
    setIsLoading(true);
    const actionsPayload = defaultActionList.map((el) => el.id);
    const params = trafficAction ? "&is_netfree_traffic=true" : "";
    await categoryService.setDefaultAction(
      { actions: [...actionsPayload, actionId], ...data },
      params
    );
    await getDefaultTrafficActions();
    getCategoryData();
    setIsDefaultActionSelectOpen(false);
    await getActionsList();
    setIsLoading(false);
  };

  const getAllProfilesListHandler = async () => {
    const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
    const profilesListData = await categoryService.getProfilesList();
    const defaultProfile = profilesListData.data.data.filter(
      (profile) => profile.is_default
    );
    if (!filterProfileID) {
      localStorage.setItem("FILTER_PROFILE_ID", defaultProfile[0]?.id ?? 1);
    }
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
    getCategoryData();
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

  useEffect(() => {
    getAllProfilesListHandler();
    getCategoryData();
    getActionsList();
    getDefaultTrafficActions();
    getDefaultTraffic();
  }, [defaultLanguageValue]);

  const ActionSelectBox = ({
    options,
    categoryName,
    categoryId,
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
                  categoryId,
                  currentActions,
                  previousValue,
                  e.target.value
                )
              : updateAction(
                  { id: categoryId, to_add: Number(e.target.value) },
                  null
                )
          }
          placeholder="Select Action"
          value={"selectAction"}
          className="bg-white border-[1px] py-1 px-2 outline-none rounded-md"
          onBlur={() =>
            editSelectedAction(categoryId, { label: "close edit options" })
          }
        >
          <option value={"selectAction"} disabled>
            Select Action
          </option>
          {options?.map((el) => {
            return el ? (
              <option key={categoryName + el.id} value={el.id}>
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
          <ActionModal
            showModal={showActionModal}
            setShowModal={setShowActionModal}
            updateAction={updateAction}
            categoryId={currentSelectedCategoryId}
            setDefaultAction={setDefaultAction}
            isDefault={isDefaultActionSelectOpen}
            editActionID={editActionID}
            setEditActionId={setEditActionId}
            trafficAction={trafficAction}
            setTrafficAction={setTrafficAction}
            defaultStatus={defaultStatus}
            trafficStatus={trafficStatus}
          />
          <ProfileModal
            showModal={showProfileModal}
            setShowModal={() => setShowProfileModal(!showProfileModal)}
            profile={activeProfile}
            newProfile={newProfile}
            profilesList={profilesList}
            onClick={getAllProfilesListHandler}
          />
        </>
      )}
      <div className="bg-white rounded-3xl overflow-x-auto overflow-y-hidden relative w-full md:w-[calc(100%-260px)]">
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
              {!activeProfile.is_default && (
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
        <div className="h-[calc(100%-190px)] max-w-[100%] overflow-x-auto overflow-y-auto mx-5 px-2">
          <table className="!table text-[12px] overflow-y-auto w-full">
            <thead className="sticky top-0 z-10">
              <tr className=" pr-3 bg-lightPrimary rounded-lg">
                <th className="pb-2 px-1 w-[15rem]">
                  <h5 className="text-start text-[10px] md:text-[14px] font-bold text-[#2B3674] w-[15rem]">
                    {t("netfree.name")}
                  </h5>
                  <SearchField
                    variant="auth"
                    type="text"
                    placeholder={t("searchbox.placeHolder")}
                    onChange={(e) =>
                      searchCategories(
                        e.target.value,
                        categoriesDataCopy,
                        "name"
                      )
                    }
                    name="name"
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
                      searchCategories(
                        e.target.value,
                        categoriesDataCopy,
                        "actions"
                      )
                    }
                    name="actions"
                  />
                </th>
              </tr>
            </thead>
            <tbody className="pt-5">
              {categoriesData.map((el, currentIndex) => {
                return (
                  <tr
                    className="h-[20px] border-t bottom-b border-sky-500 w-[100%]"
                    key={el.categories_id}
                  >
                    <td>
                      <h5 className="font-bold text-[#2B3674] break-words w-[15rem]">
                        {el.name}
                      </h5>
                    </td>
                    <td className="pl-5 pr-5 flex gap-2 py-[6px]">
                      {el.actions.map((action, index) => {
                        return action.label.length ? (
                          action.isActionEditOn ? (
                            <ActionSelectBox
                              options={actionsList.map((item) =>
                                !el.actions.some(
                                  (el) => el.label === item.label
                                )
                                  ? item
                                  : null
                              )}
                              categoryName={el.name}
                              categoryId={el.categories_id}
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
                                      deleteAction(el.categories_id, action.id)
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
                          getData={getCategoryData}
                          dataValue={el}
                          deleteStatusFn={(statusId) =>
                            requestService.deleteCategoryStatus(statusId)
                          }
                        />
                      )}
                      {
                        <AddButtonIcon
                          extra={""}
                          onClick={() => {
                            setTrafficAction(false);
                            enableActionUpdate(el);
                            setIsDefaultActionSelectOpen(false);
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
      <div className="flex flex-col gap-3 max-h-[100%] overflow-y-auto w-full md:!min-w-[250px] md:!w-[250px]">
        <div className="bg-white min-h-[160px] max-h-[160px] rounded-3xl text-center text-[#2B3674]">
          <h3 className="p-3 text-[22px] font-bold">
            {t("netfree.searchSiteSetting")}
          </h3>
          <SearchField
            variant="auth"
            extra="mb-[10px] -mt-[14px] px-3"
            id="dateCreated"
            type="text"
            placeholder={t("searchbox.placeHolder")}
            onChange={handleSiteSearch}
            name="dateCreated"
            noUnderline="true"
            borderRadius="30"
          />
          <div className="max-h-[calc(100%-100px)] overflow-y-auto">
            {searchResult.map((result) => {
              return (
                <p
                  key={result.categories_id}
                  className="text-[13px] text-left px-3"
                >
                  {result.name}
                </p>
              );
            })}
          </div>
        </div>
        <div className="flex justify-center items-center rounded-3xl text-center text-[#2B3674]">
          <button
            onClick={handleUpdateCategory}
            className={`linear p-1 w-[90%] rounded-full py-[4px] text-[14px] font-small transition duration-200 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 text-white dark:hover:bg-brand-300 dark:active:bg-brand-200`}
          >
            {t("netfree.updateCategoryButton")}
          </button>
        </div>
        <div className="flex flex-col px-3 py-3 overflow-x-hidden items-start bg-white max-h-[200px] min-h-[200px] rounded-3xl text-center text-[#2B3674]">
          <h5 className="font-bold text-[20px]">
            {t("netfree.defaultAction")}
          </h5>
          <div className="max-h-[calc(100%-30px)] w-full overflow-y-auto mb-2">
            {defaultActionList.map((el) => {
              return (
                <div
                  key={el.id}
                  className="px-3 w-full w-fit whitespace-break-spaces text-left text-[13px] mb-2 relative py-1 bg-[#F4F7FE] rounded-full flex gap-2 whitespace-nowrap"
                >
                  {el.label}{" "}
                  <div
                    className="text-[13px] text-[#fc3232] cursor-pointer"
                    onClick={() => deleteDefaultAction(el.id)}
                  >
                    x
                  </div>
                </div>
              );
            })}
            {defaultStatus && (
              <div className="px-3 w-full w-fit whitespace-break-spaces text-left text-[13px] mb-2 relative py-1 bg-[#F4F7FE] rounded-full flex gap-2 whitespace-nowrap">
                {defaultStatus.email_request_status.label}
                <div
                  className="text-[13px] text-[#fc3232] cursor-pointer"
                  onClick={() =>
                    deleteNetfreeStatus(defaultStatus.id, getActionsList)
                  }
                >
                  x
                </div>
              </div>
            )}
          </div>
          <AddButtonIcon
            extra={""}
            onClick={() => {
              setIsDefaultActionSelectOpen(true);
              setTrafficAction(false);
              enableActionUpdate();
            }}
          />
        </div>
        {defaultTraffic !== null && (
          <div className="max-h-[150px] min-h-[150px] flex flex-col items-start py-1 px-2 overflow-hidden bg-white rounded-3xl text-center text-[#2B3674]">
            <div className="flex justify-around items-center w-full mb-2">
              <h5 className="font-bold ml-2 text-[14px]">
                {t("netfree.trafficRecord")}
              </h5>
              <ToggleSwitch
                clickHandler={updateDefaultTrafficHandler}
                selected={defaultTraffic}
              />
            </div>
            <div className="max-h-[calc(100%-30px)] w-full overflow-y-auto mb-2">
              {defaultTrafficActions.map((el) => {
                return (
                  <div
                    key={el.id}
                    className="px-3 w-full w-fit whitespace-break-spaces text-left text-[13px] mb-2 relative py-1 bg-[#F4F7FE] rounded-full flex gap-2 whitespace-nowrap"
                  >
                    {el.label}{" "}
                    <div
                      className="text-[13px] text-[#fc3232] cursor-pointer"
                      onClick={() => deleteDefaultAction(el.id)}
                    >
                      x
                    </div>
                  </div>
                );
              })}
              {trafficStatus && (
                <div className="px-3 w-full w-fit whitespace-break-spaces text-left text-[13px] mb-2 relative py-1 bg-[#F4F7FE] rounded-full flex gap-2 whitespace-nowrap">
                  {trafficStatus.email_request_status.label}
                  <div
                    className="text-[13px] text-[#fc3232] cursor-pointer"
                    onClick={() =>
                      deleteNetfreeStatus(trafficStatus.id, getActionsList)
                    }
                  >
                    x
                  </div>
                </div>
              )}
            </div>
            <div className="pl-2">
              <AddButtonIcon
                extra={""}
                onClick={() => {
                  setIsDefaultActionSelectOpen(true);
                  setTrafficAction(true);
                  enableActionUpdate();
                }}
              />
            </div>
          </div>
        )}
        <div className="py-3 bg-white h-[23%] rounded-3xl text-center text-[#2B3674]">
          <div className="flex items-center justify-center">
            <p className="p-2 text-xs">
              {t("netfree.buyerReviewNotification")}
            </p>
            <ToggleSwitch selected={true} />
          </div>
          <div className="flex items-center justify-center">
            <p className="p-2 text-xs">
              {t("netfree.buyerReviewNotification")}
            </p>
            <ToggleSwitch selected={true} />
          </div>
          <div className="flex items-center justify-center">
            <p className="p-2 text-xs">
              {t("netfree.buyerReviewNotification")}
            </p>
            <ToggleSwitch selected={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
