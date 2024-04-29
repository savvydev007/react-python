// UI Imports
import { Checkbox } from "@mui/material";

const CustomCheckBox = (props) => {
  const { ...rest } = props;
  return <Checkbox {...rest} className="!p-0 [&>svg]:h-5" />;
};

export default CustomCheckBox;
