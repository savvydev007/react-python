export const TextFieldConstants = ["text", "email"];
export const NumberFieldConstants = ["number"];
export const DateFieldConstants = ["date"];
export const checkBoxConstants = ["checkbox"];
export const checkBoxValues = [true, false];
export const dataTypes = [
  "text",
  "email",
  "number",
  "phone",
  "date",
  "select",
  "checkbox",
  "file",
];
export const BlockFieldCheckValues = ["required", "unique", "display"];
export const dateRegex =
  /\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2]\d|3[0-1])T(?:[0-1]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+|)(?:Z|(?:\+|\-)(?:\d{2}):?(?:\d{2}))/gm;
export const searchFields = {
  id: "",
  sender_email: "",
  username: "",
  customer_id: "",
  created_at: "",
  text: "",
  request_type: "",
  requested_website: "",
  status: "",
  action_done: "",
};
export const paginationRowOptions = [25, 50, 100, 500];
export const linkTypes = ["phone", "email"];
export const imageTypes = ["jpeg", "png", "jpg"];
export const docTypes = ["pdf", "doc", "docx", "csv", "xls", "xlsx", "txt"];
export const templateTextTypes = ["pre_text", "after_text"];
export const websiteChoices = [
  "open_url",
  "open_domain",
  "open_url_temporary",
  "open_domain_temporary",
  "netfree_block",
];
export const NetfreePageTabs = ["categories", "websites"];
