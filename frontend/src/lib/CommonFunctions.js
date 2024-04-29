// Third part Imports
import { toast } from "react-toastify";

// API services
import clientsService from "../services/clients";
import requestService from "../services/request";

export const errorsToastHandler = (errors) => {
  if (typeof errors === "object") {
    for (const err in errors) {
      toast.error(errors[err]);
    }
  } else {
    toast.error(errors);
  }
};

export const fetchFullformDataHandler = async (
  setIsLoading,
  setFullFormData
) => {
  setIsLoading(true);
  const res = await clientsService.getFullformData();
  setFullFormData(res.data.result);
  setTimeout(() => {
    setIsLoading(false);
  }, 500);
};

export const formateDateTime = (dateTime) => {
  const date = new Date(dateTime).toLocaleString("en-us", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  let hours = new Date(dateTime).getUTCHours();
  const minutes = new Date(dateTime).getUTCMinutes();
  const time = `${hours < 10 ? "0" + hours : hours}:${
    minutes < 10 ? "0" + minutes : minutes
  }`;
  return { date, time };
};

export const handleSort = (
  field,
  data,
  sortField,
  sortOrder,
  setSortOrder,
  setSortField,
  setData,
  type
) => {
  if (field === sortField) {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  } else {
    setSortField(field);
    setSortOrder("asc");
  }
  const sortedData = data.sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];
    switch (type) {
      case "select":
        valueA = a[field]?.value || a[field];
        valueB = b[field]?.value || a[field];
        break;
      case "checkbox":
        valueA = a[field]?.toString() || a[field];
        valueB = b[field]?.toString() || a[field];
        break;
      case "file":
        valueA = a[field]?.file_name || a[field];
        valueB = b[field]?.file_name || a[field];
        break;
      default:
        break;
    }

    if (typeof valueA === "number" && typeof valueB === "number") {
      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    } else if (typeof valueA === "string" && typeof valueB === "string") {
      const comparison = valueA.localeCompare(valueB);
      return sortOrder === "asc" ? comparison : -comparison;
    } else {
      return 0;
    }
  });
  setData(sortedData);
};

export const handleNumberkeyPress = (e) => {
  if (e.key == "e" || e.key == ".") {
    e.preventDefault();
  }
};

export const deleteNetfreeStatus = async (id, onDelete) => {
  try {
    const res = await requestService.deleteCategoryStatus(id);
    onDelete();
  } catch (error) {
    console.log(error);
  }
};
