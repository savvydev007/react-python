// React imports
import React from "react";

// UI Imports
import Box from "@mui/material/Box";
import { Accordion } from "@chakra-ui/react";

// UI Components Imports
import CustomAccordion from "../../common/Accordion";
import IndividualEditField from "../IndividualEditField";
import Loader from "../../common/Loader";

// Third part Imports
import { useTranslation } from "react-i18next";

function DetailsTabPanel(props) {
  const {
    children,
    value,
    index,
    clientData,
    isLoading,
    setClientData,
    ...other
  } = props;
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const { t } = useTranslation();

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {isLoading ? (
            <Loader />
          ) : (
            <Accordion
              defaultIndex={Array.from(
                { length: clientData?.blocks?.length },
                (x, i) => i
              )}
              allowMultiple
            >
              {clientData &&
                clientData.blocks.map((blockData, index) => (
                  <CustomAccordion
                    key={index}
                    showAddButton={false}
                    title={
                      lang === "he"
                        ? blockData.field_name_language.he
                        : blockData.block
                    }
                  >
                    {blockData.field.length > 0 ? (
                      <>
                        {blockData.field.map((field, index) => (
                          <IndividualEditField
                            key={index}
                            field={field}
                            clientData={clientData}
                            setClientData={setClientData}
                          />
                        ))}
                      </>
                    ) : (
                      <p>{t("clients.noFields")}</p>
                    )}
                  </CustomAccordion>
                ))}
            </Accordion>
          )}
        </Box>
      )}
    </div>
  );
}

export default React.memo(DetailsTabPanel);
