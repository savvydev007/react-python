// React imports
import React from "react";

// UI Imports
import {
  AccordionItem,
  AccordionButton,
  Box,
  AccordionIcon,
  AccordionPanel,
} from "@chakra-ui/react";

// UI Components Imports
import AddButtonIcon from "./AddButton";

function CustomAccordion({ title, children, onClick, showAddButton }) {
  return (
    <AccordionItem className="p-2 mb-4 border-t-0 rounded-md bg-[#ffffff] shadow-lg">
      {({ isExpanded }) => (
        <>
          <AccordionButton as="p" className="py-2">
            <Box
              as="span"
              flex="1"
              fontSize="1.3rem"
              textAlign="left"
              className="flex items-center capitalize justify-between"
            >
              {title}
              {isExpanded && showAddButton && (
                <AddButtonIcon extra={""} onClick={onClick} />
              )}
            </Box>
            <AccordionIcon fontSize="1.5rem" />
          </AccordionButton>
          <AccordionPanel pb={4} className="border-t py-2 border-gray-400">
            {children}
          </AccordionPanel>
        </>
      )}
    </AccordionItem>
  );
}

export default React.memo(CustomAccordion);
