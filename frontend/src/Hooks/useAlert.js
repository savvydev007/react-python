// React imports
import { useContext } from 'react';

// Context imports
import AlertContext from '../modules/AuthContext';

const useAlert = () => useContext(AlertContext);

export default useAlert;