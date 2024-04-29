// React imports
import React, { useState } from "react";

// UI components imports
import DeleteConfirmationModal from "../common/DeleteConfirmationModal";

// Icon imports
import { MdDelete, MdEdit } from "react-icons/md";
import { HiDuplicate } from "react-icons/hi";

function TemplateCard({ duplicateTemplate, onEdit, deleteTemplate, template }) {
  const [deleteModal, setDeleteModal] = useState(false);
  return (
    <div
      className="bg-white relative h-[120px] md:h-[160px] px-5 py-5 rounded-[20px] w-full md:w-[30%] break-words text-center"
      key={template.id}
    >
      <div className="text-[#2B3674] text-[20px] md:text-[24px] font-bold">
        {template.name}
      </div>
      <div className="w-full absolute bottom-[20px] left-0 flex justify-center gap-5">
        <MdDelete
          className="text-blueSecondary w-5 h-5 hover:cursor-pointer"
          onClick={() => setDeleteModal(true)}
        />
        <HiDuplicate
          className="text-blueSecondary w-5 h-5 hover:cursor-pointer"
          onClick={() => duplicateTemplate(template.id)}
        />
        <MdEdit
          className="text-blueSecondary w-5 h-5 hover:cursor-pointer"
          onClick={() => onEdit(template.id)}
        />
      </div>
      {deleteModal && (
        <DeleteConfirmationModal
          showModal={deleteModal}
          setShowModal={setDeleteModal}
          onClick={() => {
            deleteTemplate(template.id);
            setDeleteModal(false);
          }}
        />
      )}
    </div>
  );
}

export default TemplateCard;
