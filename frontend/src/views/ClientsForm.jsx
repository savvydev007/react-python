// React imports
import { useCallback, useEffect, useState } from "react";

// UI Imports
import { Accordion } from "@chakra-ui/react";

// UI Components Imports
import Loader from "../component/common/Loader";
import BlockButton from "../component/client/BlockButton";
import CustomAccordion from "../component/common/Accordion";
import BlockFieldModal from "../component/client/BlockFieldModal";
import AddButtonIcon from "../component/common/AddButton";
import CustomField from "../component/fields/CustomField";
import DeleteConfirmationModal from "../component/common/DeleteConfirmationModal";
import EditButtonIcon from "../component/common/EditButton";

// Third part Imports
import { useTranslation } from "react-i18next";
import { Draggable } from "react-drag-reorder";
import { toast } from "react-toastify";

// API services
import clientsService from "../services/clients";

// Icon imports
import { MdDelete } from "react-icons/md";
import { PiDotsSixVerticalBold } from "react-icons/pi";

// Utils imports
import { checkBoxConstants } from "../lib/FieldConstants";
import { fetchFullformDataHandler } from "../lib/CommonFunctions";

const ClientsForm = () => {
  const { t } = useTranslation();
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const [isLoading, setIsLoading] = useState(false);
  const [fullFormData, setFullFormData] = useState(null);
  const [activeBlock, setActiveBlock] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isAddBlock, setIsAddBlock] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [deleteMethod, setDeleteMethod] = useState({
    type: "",
    value: "",
  });

  const showModalHandler = () => {
    setShowModal(!showModal);
  };

  const addBlockFieldModalHandler = (value, id) => {
    setEditData(null);
    setIsAddBlock(value);
    showModalHandler();
    activeBlockHandler(id);
  };

  const activeBlockHandler = useCallback((value) => {
    setActiveBlock(value);
  }, []);

  const deleteBlockFieldHandler = async (id, isBlock) => {
    const formData = {
      id: id,
      is_block: isBlock,
    };
    const res = await clientsService.deleteBlockField(formData);
    toast.success(t("common.deleteSuccess"));
    setConfirmationModal(false);
    fetchFullformDataHandler(setIsLoading, setFullFormData);
  };

  const editBlockFieldModalHandler = (data, isBlock) => {
    let editableData = JSON.parse(JSON.stringify(data));
    if (isBlock) {
      delete editableData["field"];
    }
    setIsAddBlock(isBlock);
    setEditData(editableData);
    showModalHandler();
  };

  const orderChangeHandler = (curr, now, items, isBlock) => {
    const reorderedItems = items;
    const draggedItem = reorderedItems[curr];
    reorderedItems.splice(curr, 1);
    reorderedItems.splice(now, 0, draggedItem);
    const updated = reorderedItems.map((item, index) => {
      return {
        id: isBlock ? item.block_id : item.id,
        display_order: index + 1,
      };
    });
    return updated;
  };

  const getChangedFieldsPos = async (currentPos, newPos, isBlock, blockId) => {
    let updatedData;
    if (isBlock) {
      const blocksData = JSON.parse(JSON.stringify(fullFormData));
      delete blocksData.field;
      const updateFields = orderChangeHandler(
        currentPos,
        newPos,
        blocksData,
        true
      );
      // Update the order attribute based on the new order
      updatedData = {
        fields: updateFields,
        is_block: true,
      };
    } else {
      const blockData = fullFormData.filter(
        (block) => block.block_id === blockId
      );
      const updateFields = orderChangeHandler(
        currentPos,
        newPos,
        blockData[0].field,
        false
      );
      // Update the order attribute based on the new order
      updatedData = {
        fields: updateFields,
      };
    }
    const res = await clientsService.updateBlockField(updatedData);
  };

  useEffect(() => {
    fetchFullformDataHandler(setIsLoading, setFullFormData);
  }, [fetchFullformDataHandler, lang]);

  return (
    <div className="w-full bg-white rounded-3xl">
      {isLoading && (
        <div className="h-[90vh] w-full flex justify-center items-center">
          <Loader />
        </div>
      )}
      <div className="h-[calc(100vh-100px)] flex overflow-y-auto overflow-x-auto mx-5 px-2">
        <div className="flex-1 w-1/4 p-2">
          <h5 className="text-start text-[12px] py-2 md:text-[16px] font-bold text-[#2B3674] w-[100%] flex items-center justify-between">
            {t("clients.sections")}
            <AddButtonIcon onClick={() => addBlockFieldModalHandler(true)} />
          </h5>
          {fullFormData && !isLoading && fullFormData.length > 0 ? (
            <Draggable
              onPosChange={(currentPos, newPos) =>
                getChangedFieldsPos(currentPos, newPos, true)
              }
            >
              {fullFormData.map((blockData, index) => (
                <BlockButton
                  classes="flex items-center justify-between custom-word-break"
                  key={index}
                  onClick={() => activeBlockHandler(blockData.block_id)}
                  active={activeBlock === blockData.block_id}
                >
                  {lang === "he"
                    ? blockData?.field_name_language.he
                    : blockData.block}
                  <div className="flex items-center">
                    {blockData?.is_editable && (
                      <EditButtonIcon
                        extra="mr-2"
                        onClick={() =>
                          editBlockFieldModalHandler(blockData, true)
                        }
                      />
                    )}
                    {blockData?.is_delete && (
                      <MdDelete
                        className="mr-2 text-blueSecondary w-4 h-4 hover:cursor-pointer"
                        onClick={() => {
                          setDeleteMethod((prev) => ({
                            type: blockData.block_id,
                            value: true,
                          }));
                          setConfirmationModal(true);
                        }}
                      />
                    )}
                    <PiDotsSixVerticalBold className="cursor-grab z-20" />
                  </div>
                </BlockButton>
              ))}
            </Draggable>
          ) : (
            <p>{t("clients.noSections")}</p>
          )}
        </div>
        <div className="flex-2 w-3/4 p-2">
          <h5 className="text-start flex items-center justify-between text-[12px] py-2 md:text-[16px] font-bold text-[#2B3674] w-[100%]">
            {t("clients.fields")}
          </h5>
          {fullFormData && (
            <Accordion
              defaultIndex={Array.from(
                { length: fullFormData?.length },
                (x, i) => i
              )}
              allowMultiple
            >
              {!isLoading &&
                fullFormData.map((blockData, index) => (
                  <CustomAccordion
                    key={index}
                    showAddButton={true}
                    title={
                      lang === "he"
                        ? blockData.field_name_language.he
                        : blockData.block
                    }
                    onClick={() =>
                      addBlockFieldModalHandler(false, blockData.block_id)
                    }
                  >
                    {blockData.field.length > 0 ? (
                      <>
                        <Draggable
                          onPosChange={(currentPos, newPos) =>
                            getChangedFieldsPos(
                              currentPos,
                              newPos,
                              false,
                              blockData.block_id
                            )
                          }
                        >
                          {blockData.field.map((field, index) => {
                            const isCheckBox = checkBoxConstants.includes(
                              field.data_type.value
                            );
                            return (
                              <div
                                className={`mb-2 ${
                                  isCheckBox
                                    ? "flex items-center justify-end flex-row-reverse"
                                    : ""
                                }`}
                                key={index}
                              >
                                <div
                                  className={`flex items-center justify-between ${
                                    isCheckBox ? "ml-2 w-full" : "mb-1"
                                  }`}
                                >
                                  <div className="flex">
                                    <label
                                      className={`block text-black text-sm font-bold`}
                                    >
                                      {lang === "he"
                                        ? field?.field_name_language.he
                                        : field?.field_name}
                                    </label>
                                    <p className="text-sm mx-1 capitalize text-gray-500">{`(${field?.data_type?.label})`}</p>
                                  </div>
                                  <div className="flex items-center">
                                    {field?.is_editable && (
                                      <EditButtonIcon
                                        extra="mr-2"
                                        onClick={() =>
                                          editBlockFieldModalHandler(
                                            field,
                                            false
                                          )
                                        }
                                      />
                                    )}
                                    {field?.is_delete && (
                                      <MdDelete
                                        className="mr-2 text-blueSecondary w-4 h-4 hover:cursor-pointer"
                                        onClick={() => {
                                          setDeleteMethod((prev) => ({
                                            type: field?.id,
                                            value: false,
                                          }));
                                          setConfirmationModal(true);
                                        }}
                                      />
                                    )}
                                    <PiDotsSixVerticalBold className="cursor-grab z-20" />
                                  </div>
                                </div>
                                <CustomField
                                  disabled={true}
                                  value={field?.defaultvalue}
                                  field={field}
                                />
                              </div>
                            );
                          })}
                        </Draggable>
                      </>
                    ) : (
                      <p>{t("clients.noFields")}</p>
                    )}
                  </CustomAccordion>
                ))}
            </Accordion>
          )}
        </div>
        {showModal && (
          <BlockFieldModal
            editData={editData}
            block={isAddBlock}
            blockId={activeBlock}
            onClick={() =>
              fetchFullformDataHandler(setIsLoading, setFullFormData)
            }
            setShowModal={setShowModal}
          />
        )}
        {confirmationModal && (
          <DeleteConfirmationModal
            showModal={confirmationModal}
            setShowModal={setConfirmationModal}
            onClick={() => {
              deleteBlockFieldHandler(deleteMethod.type, deleteMethod.value);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ClientsForm;
